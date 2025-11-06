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

function mapOpenMeteoCodeToText(code) {
    const m = {
        0: 'Clear sky',
        1: 'Mainly clear',
        2: 'Partly cloudy',
        3: 'Overcast',
        45: 'Fog',
        48: 'Depositing rime fog',
        51: 'Light drizzle',
        53: 'Moderate drizzle',
        55: 'Dense drizzle',
        56: 'Light freezing drizzle',
        57: 'Dense freezing drizzle',
        61: 'Slight rain',
        63: 'Moderate rain',
        65: 'Heavy rain',
        66: 'Light freezing rain',
        67: 'Heavy freezing rain',
        71: 'Slight snow fall',
        73: 'Moderate snow fall',
        75: 'Heavy snow fall',
        77: 'Snow grains',
        80: 'Rain showers: slight',
        81: 'Rain showers: moderate',
        82: 'Rain showers: violent',
        85: 'Snow showers: slight',
        86: 'Snow showers: heavy',
        95: 'Thunderstorm: slight or moderate',
        96: 'Thunderstorm with slight hail',
        99: 'Thunderstorm with heavy hail'
    };
    const n = Number(code);
    return m[n] || `Weather code ${code}`;
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

// GET /api/forecast/context/:businessId?window=7|15|30&lat=...&lon=...&place_id=...
// Returns standardized holidays (Bangladesh) and weather arrays for next N days
router.get('/context/:businessId', authenticateUser, async (req, res) => {
    const { businessId } = req.params;
    const userId = req.user.id;
    const windowParam = (req.query.window || '7').toString();
    const lat = req.query.lat ? Number(req.query.lat) : 23.8103; // Dhaka default
    const lon = req.query.lon ? Number(req.query.lon) : 90.4125;
    const placeId = (req.query.place_id || 'dhaka').toString();

    if (!['7', '15', '30'].includes(windowParam)) {
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

        const days = Number(windowParam);
        const now = new Date();
        const end = new Date();
        end.setDate(end.getDate() - 1 + days); // inclusive window

        // Holidays: Holiday API public holidays for Bangladesh (BD)
        // Fetch for current and next year, then filter upcoming dates within window
        const year = now.getFullYear();
        const holidayApiKey = process.env.HOLIDAY_API_KEY || '5cfbae4b-8364-4be9-a1e0-7c75e9b03c1f';
        const urls = [
            `https://holidayapi.com/v1/holidays?key=${holidayApiKey}&country=BD&year=${year}&public=true`,
            `https://holidayapi.com/v1/holidays?key=${holidayApiKey}&country=BD&year=${year + 1}&public=true`
        ];

        let holidayData = [];
        try {
            const [resp1, resp2] = await Promise.all([
                axios.get(urls[0]),
                axios.get(urls[1])
            ]);
            const extract = (resp) => {
                const h = resp?.data?.holidays;
                if (Array.isArray(h)) return h;
                if (h && typeof h === 'object') {
                    return Object.values(h).flat();
                }
                return [];
            };
            holidayData = [...extract(resp1), ...extract(resp2)];
        } catch (e) {
            console.warn('[FORECAST CONTEXT] Holiday API error:', e?.message || e);
            holidayData = [];
        }

        let holidays = holidayData
            .map(h => ({ date: h.date, name: h.name || h.localName || 'Holiday', countryCode: 'BD' }))
            .filter(h => {
                const d = new Date(h.date + 'T00:00:00Z');
                return d >= new Date(now.toDateString()) && d <= end;
            })
            .slice(0, 100);

        // Fallback: if no holidays in the strict window, include next 5 upcoming in the year
        if (holidays.length === 0 && holidayData.length > 0) {
            const upcoming = holidayData
                .map(h => ({ date: h.date, name: h.name || h.localName || 'Holiday', countryCode: 'BD' }))
                .filter(h => new Date(h.date + 'T00:00:00Z') >= new Date(now.toDateString()))
                .sort((a, b) => (a.date < b.date ? -1 : 1))
                .slice(0, 5);
            holidays = upcoming;
        }

        // Weather: Meteosource API using place_id
        const meteosourceKey = process.env.METEOSOURCE_API_KEY || '';
        let weather = [];
        if (meteosourceKey) {
            try {
                const msUrl = `https://www.meteosource.com/api/v1/free/point?place_id=${encodeURIComponent(placeId)}&sections=all&timezone=UTC&language=en&units=metric&key=${encodeURIComponent(meteosourceKey)}`;
                const w = await axios.get(msUrl);
                // Prefer daily if available, else derive from hourly/current
                const daily = w.data?.daily?.data; // array with { day: 'YYYY-MM-DD', summary? or weather? }
                if (Array.isArray(daily) && daily.length) {
                    // Map next N days
                    const startDateStr = now.toISOString().slice(0, 10);
                    const endDateStr = end.toISOString().slice(0, 10);
                    weather = daily
                        .filter(d => d.day >= startDateStr && d.day <= endDateStr)
                        .map(d => ({ date: d.day, weather: d.summary || d.weather || '' }));
                }
                // Fallback to hourly if daily missing/empty
                if (!weather.length && Array.isArray(w.data?.hourly?.data)) {
                    const hourly = w.data.hourly.data; // [{ date: 'YYYY-MM-DDTHH:mm:ssZ', weather: '...' }]
                    const byDate = new Map();
                    for (const h of hourly) {
                        const dStr = (h.date || '').slice(0, 10);
                        if (!dStr) continue;
                        if (!byDate.has(dStr)) byDate.set(dStr, new Set());
                        if (h.weather) byDate.get(dStr).add(h.weather);
                    }
                    const dates = Array.from(byDate.keys()).sort();
                    for (const dStr of dates) {
                        if (new Date(dStr) < new Date(now.toDateString()) || new Date(dStr) > end) continue;
                        const weathers = Array.from(byDate.get(dStr));
                        weather.push({ date: dStr, weather: weathers[0] || '' });
                        if (weather.length >= days) break;
                    }
                }
                // Fallback to current one-shot if still empty
                if (!weather.length && w.data?.current?.weather) {
                    const todayStr = now.toISOString().slice(0, 10);
                    weather.push({ date: todayStr, weather: w.data.current.weather });
                }
            } catch (e) {
                console.warn('[FORECAST CONTEXT] Meteosource fetch error:', e?.message || e);
            }
        } else {
            console.warn('[FORECAST CONTEXT] METEOSOURCE_API_KEY not set; skipping Meteosource weather.');
        }

        // As a last resort, keep a minimal Open-Meteo fallback if Meteosource yields nothing
        if (!weather.length) {
            try {
                const startDate = now.toISOString().slice(0, 10);
                const endDate = end.toISOString().slice(0, 10);
                const altUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weathercode&timezone=UTC&start_date=${startDate}&end_date=${endDate}`;
                const w2 = await axios.get(altUrl);
                const d2 = w2.data?.daily;
                if (d2 && d2.time && d2.time.length) {
                    weather = d2.time.map((date, idx) => ({ date, weather: mapOpenMeteoCodeToText(d2.weathercode?.[idx]) }));
                }
            } catch (e) {
                console.warn('[FORECAST CONTEXT] Open-Meteo fallback error:', e?.message || e);
            }
        }

        // Log summary counts for debugging
        console.log(`[FORECAST CONTEXT] window=${windowParam}, holidays=${holidays.length}, weather_days=${weather.length}, place_id=${placeId}, lat=${lat}, lon=${lon}`);

        return res.json({ success: true, window: windowParam, holidays, weather, location: { lat, lon, place_id: placeId } });
    } catch (e) {
        console.error('[FORECAST CONTEXT] Error:', e);
        return res.status(500).json({ error: 'Failed to fetch forecasting context', details: String(e?.message || e) });
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
        // Deduplicate products by name to avoid repeating the same item many times in the prompt
        const productList = [];
        const seenProductNames = new Set();
        for (const p of (products || [])) {
            const name = (p.product_name || '').trim();
            if (!name) continue;
            if (seenProductNames.has(name)) continue;
            seenProductNames.add(name);
            productList.push({ id: p.product_id, name });
            if (productList.length >= 300) break;
        }
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
- Upcoming Holidays (next ${window} days) [{ date, name }]: ${JSON.stringify(holidaysList)}
- Weather Forecast (next ${window} days) [{ date, weather }]: ${JSON.stringify(weatherList)}

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

        // Print prompt for inspection (truncated for readability)
        try {
            const PREVIEW_LIMIT = 8000;
            const preview = prompt.length > PREVIEW_LIMIT ? (prompt.slice(0, PREVIEW_LIMIT) + '\n... [truncated]\n') : prompt;
            console.log('==================== [FORECAST AI PROMPT] ====================');
            console.log(preview);
            console.log('================== [END FORECAST AI PROMPT] ==================');
        } catch (_) {
            // no-op logging guard
        }

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
