const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../middleware/auth');
const { supabaseAdmin } = require('../config/supabase');
const axios = require('axios');

// Helpers
function monthKey(dateStr) {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return null;
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function exponentialSmoothing(series, alpha = 0.3) {
    // series: [{ key: 'YYYY-MM', value: number }...] sorted by time key
    if (!series || series.length === 0) {
        return { forecast: 0, confidence: 0.5 };
    }
    let S = series[0].value;
    for (let i = 1; i < series.length; i++) {
        const y = series[i].value;
        S = alpha * y + (1 - alpha) * S;
    }
    const forecast = S;

    // Confidence proxy from coefficient of variation
    const values = series.map(p => p.value);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / Math.max(values.length - 1, 1);
    const std = Math.sqrt(variance);
    const cv = mean ? std / mean : 1;
    const confidence = Math.max(0.5, Math.min(0.95, 0.95 - 0.35 * cv));

    return { forecast: Math.max(0, Math.round(forecast)), confidence: Number(confidence.toFixed(2)) };
}

// Initialize Groq HTTP client (matches inventory route style)
const groq = axios.create({
    baseURL: 'https://api.groq.com/openai/v1',
    headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
    }
});

// GET /api/forecast/generate/:businessId
router.get('/generate/:businessId', authenticateUser, async (req, res) => {
    const businessId = req.params.businessId;
    const userId = req.user.id;

    try {
        // Verify business ownership
        const { data: business, error: businessError } = await supabaseAdmin
            .from('businesses')
            .select('id, name, user_id')
            .eq('id', businessId)
            .eq('user_id', userId)
            .single();

        if (businessError || !business) {
            return res.status(403).json({ error: 'Access denied or business not found' });
        }

        // Fetch orders
        const { data: orders, error: ordersError } = await supabaseAdmin
            .from('sales_order')
            .select('sales_order_id, order_date')
            .eq('business_id', businessId);

        if (ordersError) {
            return res.status(500).json({ error: 'Failed to load sales orders', details: ordersError });
        }

        // Fetch order items
        const { data: items, error: itemsError } = await supabaseAdmin
            .from('sales_order_items')
            .select('sales_order_id, product_id, line_total')
            .eq('business_id', businessId);

        if (itemsError) {
            return res.status(500).json({ error: 'Failed to load sales order items', details: itemsError });
        }

        if (!orders?.length || !items?.length) {
            return res.json({ success: true, business: { id: business.id, name: business.name }, forecast: [] });
        }

        // Index orders by id for dates
        const orderIndex = new Map();
        for (const o of orders) {
            orderIndex.set(o.sales_order_id, o.order_date);
        }

        // Collect product IDs to fetch selling price and name
        const productIds = Array.from(new Set(items.map(it => it.product_id).filter(Boolean)));

        let productInfo = new Map(); // id -> { name, price }
        if (productIds.length > 0) {
            const { data: products, error: productsError } = await supabaseAdmin
                .from('product')
                .select('product_id, product_name, selling_price')
                .eq('business_id', businessId)
                .in('product_id', productIds);

            if (productsError) {
                // Proceed without names/prices
                productInfo = new Map();
            } else {
                productInfo = new Map(products.map(p => [p.product_id, { name: p.product_name, price: Number(p.selling_price) || 0 }]));
            }
        }

        // Group monthly estimated units per product
        const productMonthly = new Map(); // product_id -> Map(monthKey -> sumUnits)
        for (const it of items) {
            const dateStr = orderIndex.get(it.sales_order_id);
            if (!dateStr) continue;
            const mk = monthKey(dateStr);
            if (!mk) continue;

            const pInfo = productInfo.get(it.product_id) || { price: 0 };
            const price = pInfo.price;
            const lineTotal = Number(it.line_total) || 0;
            const approxUnits = price > 0 ? Math.max(0, lineTotal / price) : 1; // fallback

            if (!productMonthly.has(it.product_id)) productMonthly.set(it.product_id, new Map());
            const mm = productMonthly.get(it.product_id);
            mm.set(mk, (mm.get(mk) || 0) + approxUnits);
        }

        // Build time series and compute forecasts
        const forecasts = [];
        for (const [pid, monthlyMap] of productMonthly.entries()) {
            const series = Array.from(monthlyMap.entries())
                .map(([k, v]) => ({ key: k, value: v }))
                .sort((a, b) => (a.key < b.key ? -1 : 1));

            const { forecast, confidence } = exponentialSmoothing(series, 0.3);
            const pInfo = productInfo.get(pid) || {};
            forecasts.push({
                product_id: pid,
                product_name: pInfo.name || pid,
                demand_forecast_units: forecast,
                confidence_score: confidence
            });
        }

        forecasts.sort((a, b) => b.demand_forecast_units - a.demand_forecast_units);

        return res.json({
            success: true,
            business: { id: business.id, name: business.name },
            forecast: forecasts
        });
    } catch (e) {
        console.error('[FORECAST] Error:', e);
        return res.status(500).json({ error: 'Forecast generation failed', details: String(e?.message || e) });
    }
});

// POST /api/forecast/ai/:businessId
// body: { window: '7'|'15'|'30', holidays?: Array<{date:string,name:string,impact?:string}>, weather?: Array<{date:string,summary:string,temp?:number,precipChance?:number}> }
router.post('/ai/:businessId', authenticateUser, async (req, res) => {
    const { businessId } = req.params;
    const userId = req.user.id;
    const { window = '7', holidays = [], weather = [] } = req.body || {};

    if (!['7', '15', '30'].includes(String(window))) {
        return res.status(400).json({ error: "Invalid window. Use '7', '15', or '30'" });
    }

    try {
        // Verify business ownership
        const { data: business, error: businessError } = await supabaseAdmin
            .from('businesses')
            .select('id, name, user_id')
            .eq('id', businessId)
            .eq('user_id', userId)
            .single();

        if (businessError || !business) {
            return res.status(403).json({ error: 'Access denied or business not found' });
        }

        // Fetch all products for this business
        const { data: products, error: productsError } = await supabaseAdmin
            .from('product')
            .select('product_id, product_name, selling_price, category_id, brand_id')
            .eq('business_id', businessId);
        if (productsError) {
            return res.status(500).json({ error: 'Failed to load products', details: productsError });
        }

        // Fetch orders within window
        const since = new Date();
        since.setDate(since.getDate() - Number(window));
        const { data: orders, error: ordersError } = await supabaseAdmin
            .from('sales_order')
            .select('sales_order_id, order_date')
            .eq('business_id', businessId)
            .gte('order_date', since.toISOString());
        if (ordersError) {
            return res.status(500).json({ error: 'Failed to load sales orders', details: ordersError });
        }

        let trending = [];
        if (orders && orders.length) {
            const orderIds = orders.map(o => o.sales_order_id);
            const { data: items, error: itemsError } = await supabaseAdmin
                .from('sales_order_items')
                .select('sales_order_id, product_id, line_total')
                .eq('business_id', businessId)
                .in('sales_order_id', orderIds);
            if (!itemsError && items) {
                const priceMap = new Map(products.map(p => [p.product_id, Number(p.selling_price) || 0]));
                const unitsByProduct = new Map();
                for (const it of items) {
                    const price = priceMap.get(it.product_id) || 0;
                    const units = price > 0 ? (Number(it.line_total) || 0) / price : 1;
                    unitsByProduct.set(it.product_id, (unitsByProduct.get(it.product_id) || 0) + units);
                }
                trending = Array.from(unitsByProduct.entries())
                    .map(([pid, units]) => ({
                        product_id: pid,
                        product_name: products.find(p => p.product_id === pid)?.product_name || pid,
                        units_sold: Math.round(units)
                    }))
                    .sort((a, b) => b.units_sold - a.units_sold)
                    .slice(0, 30);
            }
        }

        // Build concise context for Groq
        const productList = (products || []).map(p => ({ id: p.product_id, name: p.product_name })).slice(0, 300);
        const holidaysList = (holidays || []).slice(0, 50);
        const weatherList = (weather || []).slice(0, 50);

        const prompt = `You are a retail demand intelligence AI.
Given the list of products for a specific business, recent trending sellers over the last ${window} days, and upcoming holidays and weather, predict which products are likely to be in HIGH demand in the next ${window} days. Identify potential anomalies where expected demand deviates from recent trends due to holidays or weather.

Constraints:
- Prefer concise, actionable heads-up.
- Consider seasonality signals from holidays and weather (e.g., heat, rain).
- Use only the provided product list; do not invent products.

Input:
- Products: ${JSON.stringify(productList)}
- Trending (last ${window} days): ${JSON.stringify(trending)}
- Upcoming Holidays (next ${window} days): ${JSON.stringify(holidaysList)}
- Weather Forecast (next ${window} days): ${JSON.stringify(weatherList)}

Output (STRICT JSON only):
{
  "heads_up": [
    {
      "product_id": "string",
      "product_name": "string",
      "demand_level": "high|medium|low",
      "anomaly": true,
      "rationale": "string (<=200 chars)"
    }
  ],
  "window": "${window}",
  "notes": ["string"]
}`;

        const groqResp = await groq.post('/chat/completions', {
            model: 'llama-3.1-8b-instant',
            messages: [
                { role: 'system', content: 'You are a precise retail demand forecasting assistant. Always return ONLY valid JSON.' },
                { role: 'user', content: prompt }
            ],
            temperature: 0.3,
            max_tokens: 4000
        });

        const aiText = groqResp.data?.choices?.[0]?.message?.content || '';
        let jsonString = aiText;
        try {
            const jsonMatch = aiText.match(/```json\n?([\s\S]*?)\n?```/) || aiText.match(/```\n?([\s\S]*?)\n?```/);
            if (jsonMatch) jsonString = jsonMatch[1];
            const parsed = JSON.parse(jsonString);
            return res.json({ success: true, window: String(window), insights: parsed });
        } catch (parseErr) {
            return res.status(500).json({ error: 'AI response parsing failed', raw: aiText });
        }
    } catch (e) {
        console.error('[FORECAST AI] Error:', e);
        return res.status(500).json({ error: 'AI forecasting failed', details: String(e?.message || e) });
    }
});

module.exports = router;
