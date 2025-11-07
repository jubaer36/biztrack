const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../middleware/auth');
const { supabaseAdmin } = require('../config/supabase');
const axios = require('axios');

// Groq client (re-use pattern from forecast route)
const groq = axios.create({
    baseURL: 'https://api.groq.com/openai/v1',
    headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY || ''}`,
        'Content-Type': 'application/json'
    }
});

// Utility: verify business ownership
async function verifyBusiness(businessId, userId) {
    const { data: business, error } = await supabaseAdmin
        .from('businesses')
        .select('id, name, user_id')
        .eq('id', businessId)
        .eq('user_id', userId)
        .single();
    if (error || !business) return null;
    return business;
}

// Helper to parse date params safely
function parseDateParam(value) {
    if (!value) return null;
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d.toISOString();
}

// GET /api/cashflow/summary/:businessId?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
// Returns owner_capital, revenue, expenses, net_income (optionally filtered by date range)
router.get('/summary/:businessId', authenticateUser, async (req, res) => {
    const { businessId } = req.params;
    const userId = req.user.id;
    const { start_date, end_date } = req.query;

    try {
        const business = await verifyBusiness(businessId, userId);
        if (!business) return res.status(403).json({ error: 'Access denied or business not found' });

        // Build filters for date ranges (inclusive)
        const hasRange = start_date || end_date;
        const startISO = parseDateParam(start_date);
        const endISO = parseDateParam(end_date);

        // Owner capital (investments)
        let invQuery = supabaseAdmin
            .from('investment')
            .select('investment_amount')
            .eq('business_id', businessId);
        if (startISO) invQuery = invQuery.gte('investment_date', startISO);
        if (endISO) invQuery = invQuery.lte('investment_date', endISO);
        const { data: investments, error: invErr } = await invQuery;
        if (invErr) return res.status(500).json({ error: 'Failed to load investments', details: invErr });
        const owner_capital = (investments || []).reduce((s, r) => s + Number(r.investment_amount || 0), 0);

        // Expenses (purchase orders)
        let poQuery = supabaseAdmin
            .from('purchase_order')
            .select('total_amount, order_date')
            .eq('business_id', businessId);
        if (startISO) poQuery = poQuery.gte('order_date', startISO);
        if (endISO) poQuery = poQuery.lte('order_date', endISO);
        const { data: purchaseOrders, error: poErr } = await poQuery;
        if (poErr) return res.status(500).json({ error: 'Failed to load purchase orders', details: poErr });
        const expenses = (purchaseOrders || []).reduce((s, r) => s + Number(r.total_amount || 0), 0);

        // Revenue (sales orders)
        let soQuery = supabaseAdmin
            .from('sales_order')
            .select('total_amount, order_date')
            .eq('business_id', businessId);
        if (startISO) soQuery = soQuery.gte('order_date', startISO);
        if (endISO) soQuery = soQuery.lte('order_date', endISO);
        const { data: salesOrders, error: soErr } = await soQuery;
        if (soErr) return res.status(500).json({ error: 'Failed to load sales orders', details: soErr });
        const revenue = (salesOrders || []).reduce((s, r) => s + Number(r.total_amount || 0), 0);

        const net_income = revenue - expenses;

        // Due payments summary
        const { data: duePayments, error: dueErr } = await supabaseAdmin
            .from('due_payments')
            .select('due_amount,status,due_date,paid_date')
            .eq('business_id', businessId);
        if (dueErr) return res.status(500).json({ error: 'Failed to load due payments', details: dueErr });
        const totals = { pending: 0, paid: 0, overdue: 0 };
        const today = new Date().toISOString().split('T')[0];
        (duePayments || []).forEach(dp => {
            const status = dp.status === 'paid' ? 'paid' : (dp.status === 'overdue' || (dp.status === 'pending' && dp.due_date < today) ? 'overdue' : 'pending');
            totals[status] += Number(dp.due_amount || 0);
        });

        return res.json({
            success: true,
            business: { id: business.id, name: business.name },
            range: hasRange ? { start_date: start_date || null, end_date: end_date || null } : null,
            metrics: {
                owner_capital: Number(owner_capital.toFixed(2)),
                revenue: Number(revenue.toFixed(2)),
                expenses: Number(expenses.toFixed(2)),
                net_income: Number(net_income.toFixed(2))
            },
            due_payment_totals: totals
        });
    } catch (e) {
        console.error('[CASHFLOW SUMMARY] Error', e);
        return res.status(500).json({ error: 'Cashflow summary failed', details: String(e?.message || e) });
    }
});

// GET /api/cashflow/due-payments/:businessId
router.get('/due-payments/:businessId', authenticateUser, async (req, res) => {
    const { businessId } = req.params;
    const userId = req.user.id;
    try {
        const business = await verifyBusiness(businessId, userId);
        if (!business) return res.status(403).json({ error: 'Access denied or business not found' });
        const { data, error } = await supabaseAdmin
            .from('due_payments')
            .select('due_payment_id,purchase_order_id,due_amount,due_date,status,paid_date,created_at,updated_at')
            .eq('business_id', businessId)
            .order('due_date', { ascending: true });
        if (error) return res.status(500).json({ error: 'Failed to fetch due payments', details: error });
        // Mark dynamic overdue status client-side
        const today = new Date().toISOString().split('T')[0];
        const enriched = (data || []).map(r => ({
            ...r,
            computed_status: r.status === 'paid' ? 'paid' : (r.status === 'overdue' || (r.status === 'pending' && r.due_date < today) ? 'overdue' : 'pending')
        }));
        return res.json({ success: true, due_payments: enriched });
    } catch (e) {
        console.error('[DUE PAYMENTS LIST] Error', e);
        return res.status(500).json({ error: 'Failed to list due payments', details: String(e?.message || e) });
    }
});

// POST /api/cashflow/due-payments/:businessId  { purchase_order_id, due_amount, due_date }
// Upsert (one per purchase_order)
router.post('/due-payments/:businessId', authenticateUser, async (req, res) => {
    const { businessId } = req.params;
    const userId = req.user.id;
    const { purchase_order_id, due_amount, due_date } = req.body || {};
    if (!purchase_order_id || !due_amount || !due_date) {
        return res.status(400).json({ error: 'purchase_order_id, due_amount and due_date are required' });
    }
    try {
        const business = await verifyBusiness(businessId, userId);
        if (!business) return res.status(403).json({ error: 'Access denied or business not found' });
        // Try existing
        const { data: existing, error: exErr } = await supabaseAdmin
            .from('due_payments')
            .select('due_payment_id')
            .eq('business_id', businessId)
            .eq('purchase_order_id', purchase_order_id)
            .single();
        if (exErr && exErr.code !== 'PGRST116') {
            // PGRST116 = row not found
            console.warn('[DUE PAYMENT UPSERT] lookup error', exErr);
        }
        if (existing) {
            const { data: updated, error: updErr } = await supabaseAdmin
                .from('due_payments')
                .update({ due_amount, due_date })
                .eq('due_payment_id', existing.due_payment_id)
                .select();
            if (updErr) return res.status(500).json({ error: 'Failed to update due payment', details: updErr });
            return res.json({ success: true, action: 'updated', due_payment: updated?.[0] });
        } else {
            const { data: inserted, error: insErr } = await supabaseAdmin
                .from('due_payments')
                .insert([{ business_id: businessId, purchase_order_id, due_amount, due_date }])
                .select();
            if (insErr) return res.status(500).json({ error: 'Failed to create due payment', details: insErr });
            return res.json({ success: true, action: 'created', due_payment: inserted?.[0] });
        }
    } catch (e) {
        console.error('[DUE PAYMENT UPSERT] Error', e);
        return res.status(500).json({ error: 'Due payment upsert failed', details: String(e?.message || e) });
    }
});

// POST /api/cashflow/due-payments/:businessId/:id/pay  { paid_date? }
router.post('/due-payments/:businessId/:id/pay', authenticateUser, async (req, res) => {
    const { businessId, id } = req.params;
    const userId = req.user.id;
    const paid_date = req.body?.paid_date || new Date().toISOString().split('T')[0];
    try {
        const business = await verifyBusiness(businessId, userId);
        if (!business) return res.status(403).json({ error: 'Access denied or business not found' });
        const { data: updated, error } = await supabaseAdmin
            .from('due_payments')
            .update({ status: 'paid', paid_date })
            .eq('business_id', businessId)
            .eq('due_payment_id', id)
            .select();
        if (error) return res.status(500).json({ error: 'Failed to mark paid', details: error });
        if (!updated || !updated.length) return res.status(404).json({ error: 'Due payment not found' });
        return res.json({ success: true, due_payment: updated[0] });
    } catch (e) {
        console.error('[DUE PAYMENT PAY] Error', e);
        return res.status(500).json({ error: 'Mark paid failed', details: String(e?.message || e) });
    }
});

// DELETE /api/cashflow/due-payments/:businessId/:id
router.delete('/due-payments/:businessId/:id', authenticateUser, async (req, res) => {
    const { businessId, id } = req.params;
    const userId = req.user.id;
    try {
        const business = await verifyBusiness(businessId, userId);
        if (!business) return res.status(403).json({ error: 'Access denied or business not found' });
        const { data, error } = await supabaseAdmin
            .from('due_payments')
            .delete()
            .eq('business_id', businessId)
            .eq('due_payment_id', id)
            .select();
        if (error) return res.status(500).json({ error: 'Failed to delete due payment', details: error });
        if (!data || !data.length) return res.status(404).json({ error: 'Due payment not found' });
        return res.json({ success: true, deleted: data[0] });
    } catch (e) {
        console.error('[DUE PAYMENT DELETE] Error', e);
        return res.status(500).json({ error: 'Delete due payment failed', details: String(e?.message || e) });
    }
});

// GET /api/cashflow/investments/:businessId  (list investments)
router.get('/investments/:businessId', authenticateUser, async (req, res) => {
    const { businessId } = req.params;
    const userId = req.user.id;
    try {
        const business = await verifyBusiness(businessId, userId);
        if (!business) return res.status(403).json({ error: 'Access denied or business not found' });
        const { data, error } = await supabaseAdmin
            .from('investment')
            .select('investment_id, investor_id, investment_amount, investment_date')
            .eq('business_id', businessId)
            .order('investment_date', { ascending: true });
        if (error) return res.status(500).json({ error: 'Failed to fetch investments', details: error });
        const total = (data || []).reduce((s, r) => s + Number(r.investment_amount || 0), 0);
        return res.json({ success: true, owner_capital: Number(total.toFixed(2)), investments: data });
    } catch (e) {
        console.error('[INVESTMENTS LIST] Error', e);
        return res.status(500).json({ error: 'Failed to list investments', details: String(e?.message || e) });
    }
});

// POST /api/cashflow/ai-report/:businessId  { start_date?, end_date? }
router.post('/ai-report/:businessId', authenticateUser, async (req, res) => {
    const { businessId } = req.params;
    const userId = req.user.id;
    const { start_date, end_date } = req.body || {};
    try {
        if (!process.env.GROQ_API_KEY) {
            return res.status(400).json({ error: 'GROQ_API_KEY not configured' });
        }
        const business = await verifyBusiness(businessId, userId);
        if (!business) return res.status(403).json({ error: 'Access denied or business not found' });

        // Reuse summary logic (without duplicating code) - simple inline replication
        const startISO = parseDateParam(start_date);
        const endISO = parseDateParam(end_date);

        const collectSum = async (table, dateCol) => {
            // Select only columns that exist for the specific table to avoid PostgREST errors
            const selectColsMap = {
                investment: 'investment_amount,investment_date',
                purchase_order: 'total_amount,order_date',
                sales_order: 'total_amount,order_date'
            };
            const amountFieldMap = {
                investment: 'investment_amount',
                purchase_order: 'total_amount',
                sales_order: 'total_amount'
            };

            const selectCols = selectColsMap[table] || '*';
            const amountField = amountFieldMap[table] || 'total_amount';

            let q = supabaseAdmin.from(table).select(selectCols);
            q = q.eq('business_id', businessId);
            if (startISO && dateCol) q = q.gte(dateCol, startISO);
            if (endISO && dateCol) q = q.lte(dateCol, endISO);
            const { data, error } = await q;
            if (error) {
                console.error(`[AI REPORT] ${table} query error:`, error);
                throw new Error(`${table} query failed`);
            }
            return (data || []).reduce((s, r) => s + Number(r[amountField] || 0), 0);
        };

        const [owner_capital, expenses, revenue] = await Promise.all([
            collectSum('investment', 'investment_date'),
            collectSum('purchase_order', 'order_date'),
            collectSum('sales_order', 'order_date')
        ]);
        const net_income = revenue - expenses;

        // Due payments breakdown
        const { data: duePayments, error: dueErr } = await supabaseAdmin
            .from('due_payments')
            .select('purchase_order_id,due_amount,due_date,status,paid_date')
            .eq('business_id', businessId);
        if (dueErr) throw new Error('due_payments query failed');
        const today = new Date().toISOString().split('T')[0];
        const upcoming = [];
        const overdue = [];
        const paid = [];
        (duePayments || []).forEach(dp => {
            const effectiveStatus = dp.status === 'paid' ? 'paid' : (dp.status === 'overdue' || (dp.status === 'pending' && dp.due_date < today) ? 'overdue' : 'pending');
            const slim = { po: dp.purchase_order_id, amount: Number(dp.due_amount || 0), due_date: dp.due_date, status: effectiveStatus };
            if (effectiveStatus === 'paid') paid.push(slim); else if (effectiveStatus === 'overdue') overdue.push(slim); else upcoming.push(slim);
        });

        // Recent largest purchase orders (top 5 by amount)
        const { data: topExpenses } = await supabaseAdmin
            .from('purchase_order')
            .select('purchase_order_id,total_amount,order_date,status')
            .eq('business_id', businessId)
            .order('total_amount', { ascending: false })
            .limit(5);

        // Recent revenue orders (top 5)
        const { data: topRevenue } = await supabaseAdmin
            .from('sales_order')
            .select('sales_order_id,total_amount,order_date,status')
            .eq('business_id', businessId)
            .order('total_amount', { ascending: false })
            .limit(5);

        const financialSnapshot = {
            business: { id: business.id, name: business.name },
            range: start_date || end_date ? { start_date: start_date || null, end_date: end_date || null } : null,
            metrics: {
                owner_capital: Number(owner_capital.toFixed(2)),
                revenue: Number(revenue.toFixed(2)),
                expenses: Number(expenses.toFixed(2)),
                net_income: Number(net_income.toFixed(2))
            },
            due_payments: {
                upcoming, overdue, paid
            },
            top_expenses: (topExpenses || []).map(r => ({ id: r.purchase_order_id, amount: Number(r.total_amount || 0), order_date: r.order_date, status: r.status })),
            top_revenue: (topRevenue || []).map(r => ({ id: r.sales_order_id, amount: Number(r.total_amount || 0), order_date: r.order_date, status: r.status }))
        };

        const prompt = `You are a financial analyst AI. Given the JSON snapshot below, produce a concise cash flow analysis focusing on:
- Capital position and burn/runway
- Revenue vs expenses trend (qualitative)
- Net income interpretation
- Overdue vs upcoming payables (risk & prioritization)
- Top cost drivers & top revenue sources
- Actionable next 3 recommendations (clear, specific)
Return ONLY valid JSON matching this schema:
{"summary":"string","capital_analysis":"string","liquidity_risk":"string","due_payments_overview":"string","recommendations":["string", "string", "string"],"alerts":["string", ...]}

Snapshot JSON:
${JSON.stringify(financialSnapshot)}
`;

        const groqResp = await groq.post('/chat/completions', {
            model: 'llama-3.1-8b-instant',
            messages: [
                { role: 'system', content: 'You are a concise cash flow analyst. Always return ONLY strict JSON.' },
                { role: 'user', content: prompt }
            ],
            temperature: 0.25,
            max_tokens: 1500
        });

        const aiText = groqResp.data?.choices?.[0]?.message?.content || '';
        let jsonString = aiText;
        const fenced = aiText.match(/```json\n?([\s\S]*?)\n?```/) || aiText.match(/```\n?([\s\S]*?)\n?```/);
        if (fenced) jsonString = fenced[1];
        let analysis;
        try { analysis = JSON.parse(jsonString); } catch (parseErr) {
            return res.status(500).json({ error: 'AI response parsing failed', raw: aiText });
        }
        return res.json({ success: true, snapshot: financialSnapshot, analysis });
    } catch (e) {
        console.error('[AI CASHFLOW REPORT] Error', e);
        return res.status(500).json({ error: 'AI cashflow report failed', details: String(e?.message || e) });
    }
});

module.exports = router;
