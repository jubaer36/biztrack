const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../middleware/auth');
const { supabaseAdmin } = require('../config/supabase');
const axios = require('axios');

// Simple in-memory cache to reduce API calls for free tier services
const cache = new Map();

function getCachedData(key) {
    const cached = cache.get(key);
    if (!cached) return null;

    // Check if cache is still valid
    if (Date.now() > cached.expiresAt) {
        cache.delete(key);
        return null;
    }

    console.log(`[CACHE HIT] ${key}`);
    return cached.data;
}

function setCachedData(key, data, ttlMinutes = 60) {
    const expiresAt = Date.now() + (ttlMinutes * 60 * 1000);
    cache.set(key, { data, expiresAt });
    console.log(`[CACHE SET] ${key} (TTL: ${ttlMinutes}m)`);
}

// Clean up expired cache entries every hour
setInterval(() => {
    const now = Date.now();
    let cleaned = 0;
    for (const [key, value] of cache.entries()) {
        if (now > value.expiresAt) {
            cache.delete(key);
            cleaned++;
        }
    }
    if (cleaned > 0) {
        console.log(`[CACHE CLEANUP] Removed ${cleaned} expired entries. Current cache size: ${cache.size}`);
    }
}, 60 * 60 * 1000); // Run every hour

// Helpers
function monthKey(dateStr) {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return null;
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

// Fallback Bangladesh holidays (common annual holidays)
function getBangladeshHolidaysFallback(year) {
    return [
        { date: `${year}-02-21`, name: "International Mother Language Day", public: true },
        { date: `${year}-03-17`, name: "Mujib's Birthday", public: true },
        { date: `${year}-03-26`, name: "Independence Day", public: true },
        { date: `${year}-04-14`, name: "Bengali New Year (Pohela Boishakh)", public: true },
        { date: `${year}-05-01`, name: "May Day", public: true },
        { date: `${year}-08-15`, name: "National Mourning Day", public: true },
        { date: `${year}-12-16`, name: "Victory Day", public: true },
        { date: `${year}-12-25`, name: "Christmas Day", public: false }
    ];
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

// GET /api/forecast/context/:businessId?lat=...&lon=...&place_id=...
// Returns:
//   - holidays: upcoming 10 holidays (for display)
//   - holidaysIn7Days: holidays within next 7 days (for AI forecasting)
//   - weather: next 7 days weather forecast
// Note: Free weather API only provides 7 days forecast
router.get('/context/:businessId', authenticateUser, async (req, res) => {
    const { businessId } = req.params;
    const userId = req.user.id;
    const windowParam = '7'; // Fixed to 7 days for free weather API
    const lat = req.query.lat ? Number(req.query.lat) : 23.8103; // Dhaka default
    const lon = req.query.lon ? Number(req.query.lon) : 90.4125;
    const placeId = (req.query.place_id || 'dhaka').toString();

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

        const days = 7; // Fixed to 7 days
        const now = new Date();
        const end = new Date();
        end.setDate(end.getDate() + 6); // 7 days from today

        // Holidays: Calendarific API for Bangladesh (BD)
        // Fetch for current and next year, then merge and show upcoming holidays
        const year = now.getFullYear();
        const holidayApiKey = process.env.HOLIDAY_API_KEY;

        // Check cache first (cache holidays for 24 hours)
        const holidayCacheKey = `holidays_BD_${year}_${year + 1}`;
        let holidayData = getCachedData(holidayCacheKey);

        if (!holidayData) {
            // Cache miss - fetch from API
            const urls = holidayApiKey ? [
                `https://calendarific.com/api/v2/holidays?api_key=${holidayApiKey}&country=BD&year=${year}`,
                `https://calendarific.com/api/v2/holidays?api_key=${holidayApiKey}&country=BD&year=${year + 1}`
            ] : [];

            if (urls.length > 0) {
                try {
                    const responses = await Promise.all(urls.map(url => axios.get(url)));
                    const extract = (resp) => {
                        // Calendarific API returns holidays in response.holidays
                        const h = resp?.data?.response?.holidays;
                        if (Array.isArray(h)) {
                            return h.map(holiday => ({
                                date: holiday.date.iso,
                                name: holiday.name,
                                type: holiday.primary_type || 'Holiday',
                                public: holiday.type?.includes('National holiday') || false
                            }));
                        }
                        return [];
                    };
                    holidayData = responses.flatMap(extract);

                    // Cache for 24 hours (holidays don't change frequently)
                    setCachedData(holidayCacheKey, holidayData, 1440);
                } catch (e) {
                    const status = e?.response?.status;
                    console.warn('[FORECAST CONTEXT] Calendarific API error:', status, e?.message || e);

                    // Fallback to static Bangladesh holidays if API fails
                    console.log('[FORECAST CONTEXT] Using fallback Bangladesh holidays');
                    holidayData = [
                        ...getBangladeshHolidaysFallback(year),
                        ...getBangladeshHolidaysFallback(year + 1)
                    ];
                }
            } else {
                // No API key, use fallback
                console.log('[FORECAST CONTEXT] No Holiday API key, using fallback Bangladesh holidays');
                holidayData = [
                    ...getBangladeshHolidaysFallback(year),
                    ...getBangladeshHolidaysFallback(year + 1)
                ];
            }
        }

        // Get all upcoming holidays (for display - up to 10)
        const todayStart = new Date(now.toISOString().split('T')[0]); // Start of today
        const allUpcomingHolidays = holidayData
            .filter(h => {
                const holidayDate = new Date(h.date);
                return holidayDate >= todayStart;
            })
            .sort((a, b) => (a.date < b.date ? -1 : 1))
            .slice(0, 10);

        // Get holidays within 7 days (for AI forecasting)
        const sevenDaysEnd = new Date(todayStart);
        sevenDaysEnd.setDate(sevenDaysEnd.getDate() + 7);

        const holidaysIn7Days = holidayData
            .filter(h => {
                const holidayDate = new Date(h.date);
                return holidayDate >= todayStart && holidayDate < sevenDaysEnd;
            })
            .sort((a, b) => (a.date < b.date ? -1 : 1));

        // Weather: Meteosource API using place_id
        // Cache weather for shorter duration (3 hours) as it changes more frequently
        const meteosourceKey = process.env.WEATHER_API_KEY;
        const weatherCacheKey = `weather_${placeId}_${todayStart.toISOString().split('T')[0]}`;
        let weather = getCachedData(weatherCacheKey);

        if (!weather && meteosourceKey) {
            // Cache miss - fetch from API
            try {
                const msUrl = `https://www.meteosource.com/api/v1/free/point?place_id=${encodeURIComponent(placeId)}&sections=daily&timezone=UTC&language=en&units=metric&key=${encodeURIComponent(meteosourceKey)}`;
                const w = await axios.get(msUrl, { headers: { 'Accept-Encoding': 'gzip' } });
                // Prefer daily if available, else derive from hourly/current
                const daily = w.data?.daily?.data;
                if (Array.isArray(daily) && daily.length) {
                    const startDateStr = now.toISOString().slice(0, 10);
                    const endDateStr = end.toISOString().slice(0, 10);
                    weather = daily
                        .filter(d => d.day >= startDateStr && d.day <= endDateStr)
                        .map(d => ({ date: d.day, weather: d.summary || d.weather || '' }));
                }
                // Fallback to current one-shot if still empty
                if (!weather.length && w.data?.current?.weather) {
                    const todayStr = now.toISOString().slice(0, 10);
                    weather.push({ date: todayStr, weather: w.data.current.weather });
                }

                // Cache for 3 hours (weather updates throughout the day)
                if (weather && weather.length > 0) {
                    setCachedData(weatherCacheKey, weather, 180);
                }
            } catch (e) {
                const status = e?.response?.status;
                console.warn('[FORECAST CONTEXT] Meteosource fetch error:', status ? `status=${status}` : '', e?.message || e);
                weather = []; // Ensure weather is an array on error
            }
        } else if (!weather) {
            // No cache and no API key
            console.warn('[FORECAST CONTEXT] Meteosource key not set and no cached data available');
            weather = [];
        }

        // // As a last resort, keep a minimal Open-Meteo fallbhshh84ag59sryite4gultt3vqylo21gq1ad6faydack if Meteosource yields nothing
        // if (!weather.length) {
        //     try {
        //         const startDate = now.toISOString().slice(0, 10);
        //         const endDate = end.toISOString().slice(0, 10);
        //         const altUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weathercode&timezone=UTC&start_date=${startDate}&end_date=${endDate}`;
        //         const w2 = await axios.get(altUrl);
        //         const d2 = w2.data?.daily;
        //         if (d2 && d2.time && d2.time.length) {
        //             weather = d2.time.map((date, idx) => ({ date, weather: mapOpenMeteoCodeToText(d2.weathercode?.[idx]) }));
        //         }
        //     } catch (e) {
        //         console.warn('[FORECAST CONTEXT] Open-Meteo fallback error:', e?.message || e);
        //     }
        // }

        // Log summary counts for debugging
        const todayFormatted = todayStart.toISOString().split('T')[0];
        const sevenDaysFormatted = sevenDaysEnd.toISOString().split('T')[0];
        console.log(`[FORECAST CONTEXT] Today: ${todayFormatted}, 7-day window end: ${sevenDaysFormatted}`);
        console.log(`[FORECAST CONTEXT] Total holidays fetched: ${holidayData.length}, upcoming_holidays: ${allUpcomingHolidays.length}, holidays_in_7days: ${holidaysIn7Days.length}, weather_days: ${weather.length}`);
        if (holidaysIn7Days.length > 0) {
            console.log(`[FORECAST CONTEXT] First holiday in 7 days: ${holidaysIn7Days[0].name} on ${holidaysIn7Days[0].date}`);
        }

        return res.json({
            success: true,
            window: '7',
            holidays: allUpcomingHolidays, // All upcoming 10 holidays for display
            holidaysIn7Days, // Holidays within 7 days for AI forecasting
            weather,
            location: { lat, lon, place_id: placeId }
        });
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

// GET /api/forecast/historical/:businessId
// Returns last year's trending products for the same date range (+/- 7 days)
// Includes current inventory levels for comparison
router.get('/historical/:businessId', authenticateUser, async (req, res) => {
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

        const now = new Date();

        // Calculate last year's date range: same date +/- 7 days
        const lastYearCenter = new Date(now);
        lastYearCenter.setFullYear(lastYearCenter.getFullYear() - 1);

        const lastYearStart = new Date(lastYearCenter);
        lastYearStart.setDate(lastYearStart.getDate() - 7);

        const lastYearEnd = new Date(lastYearCenter);
        lastYearEnd.setDate(lastYearEnd.getDate() + 7);

        console.log(`[HISTORICAL] Fetching data from ${lastYearStart.toISOString().split('T')[0]} to ${lastYearEnd.toISOString().split('T')[0]}`);

        // Fetch last year's orders in the date range
        const { data: orders, error: ordersError } = await supabaseAdmin
            .from('sales_order')
            .select('sales_order_id, order_date')
            .eq('business_id', businessId)
            .gte('order_date', lastYearStart.toISOString())
            .lte('order_date', lastYearEnd.toISOString());

        if (ordersError) {
            return res.status(500).json({ error: 'Failed to load sales orders', details: ordersError });
        }

        if (!orders || orders.length === 0) {
            return res.json({
                success: true,
                business: { id: business.id, name: business.name },
                dateRange: {
                    start: lastYearStart.toISOString().split('T')[0],
                    end: lastYearEnd.toISOString().split('T')[0],
                    centerDate: lastYearCenter.toISOString().split('T')[0]
                },
                historicalTrending: [],
                message: 'No historical data found for this period'
            });
        }

        // Fetch order items for these orders
        const orderIds = orders.map(o => o.sales_order_id);
        const { data: items, error: itemsError } = await supabaseAdmin
            .from('sales_order_items')
            .select('sales_order_id, product_id, line_total')
            .eq('business_id', businessId)
            .in('sales_order_id', orderIds);

        if (itemsError || !items || items.length === 0) {
            return res.json({
                success: true,
                business: { id: business.id, name: business.name },
                dateRange: {
                    start: lastYearStart.toISOString().split('T')[0],
                    end: lastYearEnd.toISOString().split('T')[0],
                    centerDate: lastYearCenter.toISOString().split('T')[0]
                },
                historicalTrending: [],
                message: 'No order items found'
            });
        }

        // Get product info (no stock tracking in current schema)
        const productIds = Array.from(new Set(items.map(it => it.product_id).filter(Boolean)));
        const { data: products, error: productsError } = await supabaseAdmin
            .from('product')
            .select('product_id, product_name, selling_price')
            .eq('business_id', businessId)
            .in('product_id', productIds);

        const productInfo = new Map(
            (products || []).map(p => [
                p.product_id,
                {
                    name: p.product_name,
                    price: Number(p.selling_price) || 0
                }
            ])
        );

        // Calculate units sold per product
        const unitsByProduct = new Map();
        for (const it of items) {
            const pInfo = productInfo.get(it.product_id);
            if (!pInfo) continue;

            const price = pInfo.price;
            const lineTotal = Number(it.line_total) || 0;

            // Estimate units from line_total / price (since no quantity column exists)
            const units = price > 0 ? Math.round(lineTotal / price) : 1;

            unitsByProduct.set(it.product_id, (unitsByProduct.get(it.product_id) || 0) + units);
        }

        // Build trending list (no stock info available in current schema)
        const historicalTrending = Array.from(unitsByProduct.entries())
            .map(([pid, units]) => {
                const pInfo = productInfo.get(pid) || {};
                return {
                    product_id: pid,
                    product_name: pInfo.name || pid,
                    units_sold_last_year: Math.round(units),
                    selling_price: pInfo.price || 0
                };
            })
            .sort((a, b) => b.units_sold_last_year - a.units_sold_last_year);

        return res.json({
            success: true,
            business: { id: business.id, name: business.name },
            dateRange: {
                start: lastYearStart.toISOString().split('T')[0],
                end: lastYearEnd.toISOString().split('T')[0],
                centerDate: lastYearCenter.toISOString().split('T')[0]
            },
            historicalTrending
        });
    } catch (e) {
        console.error('[HISTORICAL] Error:', e);
        return res.status(500).json({ error: 'Historical data fetch failed', details: String(e?.message || e) });
    }
});

// POST /api/forecast/ai/:businessId
// body: { 
//   holidays?: Array<{date:string,name:string,impact?:string}>, 
//   weather?: Array<{date:string,summary:string,temp?:number,precipChance?:number}>,
//   historicalTrending?: Array<{product_id:string,product_name:string,units_sold_last_year:number,current_stock:number}>
// }
// Fixed to 7 days forecast due to free weather API limitation
router.post('/ai/:businessId', authenticateUser, async (req, res) => {
    const { businessId } = req.params;
    const userId = req.user.id;
    const { holidays = [], weather = [], historicalTrending = [] } = req.body || {};
    const window = '7'; // Fixed to 7 days for free weather API

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

        // Fetch orders within last 7 days
        const since = new Date();
        since.setDate(since.getDate() - 7);
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

        // Filter holidays to only include those within 7 days from today
        const now = new Date();
        const todayStart = new Date(now.toISOString().split('T')[0]); // Start of today (midnight)
        const sevenDaysLater = new Date(todayStart);
        sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);

        const holidaysIn7Days = (holidays || [])
            .filter(h => {
                const holidayDate = new Date(h.date);
                return holidayDate >= todayStart && holidayDate < sevenDaysLater;
            })
            .slice(0, 10);

        const weatherList = (weather || []).slice(0, 7); // Only 7 days from free weather API
        const historicalList = (historicalTrending || []).slice(0, 30); // Top 30 historical items

        // Log filtering for debugging
        console.log(`[FORECAST AI] Received ${(holidays || []).length} holidays, filtered to ${holidaysIn7Days.length} within 7 days`);
        console.log(`[FORECAST AI] Historical data: ${historicalList.length} products from last year`);
        console.log(`[FORECAST AI] Date range: ${todayStart.toISOString().split('T')[0]} to ${sevenDaysLater.toISOString().split('T')[0]}`);
        if (holidaysIn7Days.length > 0) {
            console.log(`[FORECAST AI] Holidays in prompt:`, holidaysIn7Days.map(h => `${h.name} (${h.date})`).join(', '));
        }

        const prompt = `You are a retail demand intelligence AI with historical pattern recognition.
Given the list of products, current trending sellers (last 7 days), historical sales data from the same period last year, upcoming holidays and weather, predict which products are likely to be in HIGH demand in the next 7 days.

Historical Context: Last year's data shows what sold well during this same time period. Use this to identify seasonal patterns and repeating trends.

Constraints:
- Prefer concise, actionable heads-up.
- Consider seasonality signals from holidays, weather, and historical patterns.
- If a product sold well last year during this period AND is trending now, flag as HIGH priority for repeat demand.
- Use only the provided product list; do not invent products.
- Focus on 7-day forecast window.
- Limit output to top 10 most relevant products.

Input:
- Products: ${JSON.stringify(productList)}
- Current Trending (last 7 days): ${JSON.stringify(trending)}
- Historical Trending (same period last year, ±7 days) [{ product_id, product_name, units_sold_last_year, selling_price }]: ${JSON.stringify(historicalList)}
- Upcoming Holidays (next 7 days) [{ date, name }]: ${JSON.stringify(holidaysIn7Days)}
- Weather Forecast (next 7 days) [{ date, weather }]: ${JSON.stringify(weatherList)}

Output (STRICT JSON only):
{
  "heads_up": [
    {
      "product_id": "string",
      "product_name": "string",
      "demand_level": "high|medium|low",
      "anomaly": true,
      "rationale": "string (<=200 chars, mention if based on historical pattern or year-over-year trend)"
    }
  ],
  "window": "7",
  "notes": ["string (insights about historical patterns, seasonal trends, or notable observations)"]
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
            return res.json({ success: true, window: '7', insights: parsed });
        } catch (parseErr) {
            return res.status(500).json({ error: 'AI response parsing failed', raw: aiText });
        }
    } catch (e) {
        console.error('[FORECAST AI] Error:', e);
        return res.status(500).json({ error: 'AI forecasting failed', details: String(e?.message || e) });
    }
});

// GET /api/forecast/holidays/:businessId
// Returns upcoming 10 holidays from current date onwards
router.get('/holidays/:businessId', authenticateUser, async (req, res) => {
    const { businessId } = req.params;
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

        const holidayApiKey = process.env.HOLIDAY_API_KEY;
        const now = new Date();
        const currentYear = now.getFullYear();
        const nextYear = currentYear + 1;

        // Check cache first (same cache key as context endpoint for consistency)
        const holidayCacheKey = `holidays_BD_${currentYear}_${nextYear}`;
        let allHolidays = getCachedData(holidayCacheKey);

        if (!allHolidays) {
            // Cache miss - fetch holidays for current and next year
            const urls = holidayApiKey ? [
                `https://calendarific.com/api/v2/holidays?api_key=${encodeURIComponent(holidayApiKey)}&country=BD&year=${currentYear}`,
                `https://calendarific.com/api/v2/holidays?api_key=${encodeURIComponent(holidayApiKey)}&country=BD&year=${nextYear}`
            ] : [];

            if (urls.length > 0) {
                try {
                    const responses = await Promise.all(urls.map(url => axios.get(url)));
                    const extract = (resp) => {
                        const h = resp?.data?.response?.holidays;
                        if (Array.isArray(h)) {
                            return h.map(x => ({
                                date: x.date.iso,
                                name: x.name,
                                type: x.primary_type || 'Holiday',
                                public: x.type?.includes('National holiday') || false,
                                description: x.description || ''
                            }));
                        }
                        return [];
                    };
                    allHolidays = responses.flatMap(extract);

                    // Cache for 24 hours
                    setCachedData(holidayCacheKey, allHolidays, 1440);
                } catch (e) {
                    const status = e?.response?.status;
                    console.warn('[FORECAST HOLIDAYS] Calendarific API error:', status, e?.message || e);

                    // Fallback to static Bangladesh holidays if API fails
                    console.log('[FORECAST HOLIDAYS] Using fallback Bangladesh holidays');
                    allHolidays = [
                        ...getBangladeshHolidaysFallback(currentYear),
                        ...getBangladeshHolidaysFallback(nextYear)
                    ];
                }
            } else {
                // No API key, use fallback
                console.log(`[FORECAST HOLIDAYS] No API key, using fallback Bangladesh holidays`);
                allHolidays = [
                    ...getBangladeshHolidaysFallback(currentYear),
                    ...getBangladeshHolidaysFallback(nextYear)
                ];
            }
        }

        // Filter to upcoming holidays only (from today onwards) and limit to 10
        const todayStart = new Date(now.toISOString().split('T')[0]);
        const upcomingHolidays = allHolidays
            .filter(h => {
                const holidayDate = new Date(h.date);
                return holidayDate >= todayStart;
            })
            .sort((a, b) => (a.date < b.date ? -1 : 1))
            .slice(0, 10);

        console.log(`[FORECAST HOLIDAYS] Total holidays: ${allHolidays.length}, Upcoming: ${upcomingHolidays.length}`);

        return res.json({
            success: true,
            currentDate: todayStart.toISOString().split('T')[0],
            holidays: upcomingHolidays
        });
    } catch (e) {
        console.error('[FORECAST HOLIDAYS] Error:', e);
        return res.status(500).json({ error: 'Failed to fetch holidays', details: String(e?.message || e) });
    }
});

module.exports = router;
