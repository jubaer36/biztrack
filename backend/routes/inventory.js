const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
const { authenticateUser } = require('../middleware/auth');

// Initialize Supabase client
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Initialize Groq client
const groq = axios.create({
    baseURL: 'https://api.groq.com/openai/v1',
    headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
    }
});

console.log('[INVENTORY ROUTES] Inventory routes module loaded');

/**
 * GET /api/inventory/optimize/:businessId
 * Run AI-powered inventory optimization for a specific business
 */
router.get('/optimize/:businessId', authenticateUser, async (req, res) => {
    console.log(`[INVENTORY OPTIMIZE] Starting optimization for businessId: ${req.params.businessId}, userId: ${req.user.id}`);
    
    try {
        const { businessId } = req.params;
        const userId = req.user.id;

        console.log(`[INVENTORY OPTIMIZE] Verifying business ownership...`);
        // Verify business belongs to user
        const { data: business, error: businessError } = await supabase
            .from('businesses')
            .select('*')
            .eq('id', businessId)
            .eq('user_id', userId)
            .single();

        if (businessError || !business) {
            console.log(`[INVENTORY OPTIMIZE] Business verification failed:`, businessError);
            return res.status(404).json({ error: 'Business not found or access denied' });
        }
        console.log(`[INVENTORY OPTIMIZE] Business verified: ${business.name}`);

        console.log(`[INVENTORY OPTIMIZE] Fetching sales summary data...`);
        // Fetch sales summary data
        const { data: salesData, error: salesError } = await supabase
            .from('vw_product_sales_summary')
            .select('*')
            .eq('business_id', businessId);

        if (salesError) {
            console.error('[INVENTORY OPTIMIZE] Sales data error:', salesError);
        } else {
            console.log(`[INVENTORY OPTIMIZE] Fetched ${salesData?.length || 0} sales records`);
        }

        console.log(`[INVENTORY OPTIMIZE] Fetching product data...`);
        // Fetch all products
        const { data: productData, error: productError } = await supabase
            .from('product')
            .select('*')
            .eq('business_id', businessId);

        if (productError) {
            console.error('[INVENTORY OPTIMIZE] Product data error:', productError);
        } else {
            console.log(`[INVENTORY OPTIMIZE] Fetched ${productData?.length || 0} products`);
        }

        console.log(`[INVENTORY OPTIMIZE] Fetching capital data...`);
        // Fetch available capital
        const { data: capitalData, error: capitalError } = await supabase
            .from('vw_business_capital')
            .select('*')
            .eq('business_id', businessId)
            .single();

        if (capitalError) {
            console.error('[INVENTORY OPTIMIZE] Capital data error:', capitalError);
        } else {
            console.log(`[INVENTORY OPTIMIZE] Available capital: $${capitalData?.total_net_capital || 0}`);
        }

        console.log(`[INVENTORY OPTIMIZE] Fetching supplier lead times...`);
        // Fetch supplier lead times
        const { data: leadTimeData, error: leadTimeError } = await supabase
            .from('vw_supplier_lead_times')
            .select('*')
            .eq('business_id', businessId);

        if (leadTimeError) {
            console.error('[INVENTORY OPTIMIZE] Lead time data error:', leadTimeError);
        } else {
            console.log(`[INVENTORY OPTIMIZE] Fetched ${leadTimeData?.length || 0} lead time records`);
        }

        console.log(`[INVENTORY OPTIMIZE] Fetching co-purchase data...`);
        // Fetch co-purchase data for bundles
        const { data: coPurchaseData, error: coPurchaseError } = await supabase
            .from('vw_product_copurchases')
            .select('*')
            .eq('business_id', businessId)
            .order('times_purchased_together', { ascending: false })
            .limit(20);

        if (coPurchaseError) {
            console.error('[INVENTORY OPTIMIZE] Co-purchase data error:', coPurchaseError);
        } else {
            console.log(`[INVENTORY OPTIMIZE] Fetched ${coPurchaseData?.length || 0} co-purchase records`);
        }

        console.log(`[INVENTORY OPTIMIZE] Building AI prompt...`);
        // Build prompt for Groq - Summarize data to reduce payload size
        const productSummary = productData?.slice(0, 10).map(p => ({
            id: p.product_id,
            name: p.product_name,
            price: p.price,
            selling_price: p.selling_price,
            category: p.category_id,
            brand: p.brand_id
        })) || [];

        const salesSummary = salesData?.slice(0, 10).map(s => ({
            product_id: s.product_id,
            product_name: s.product_name,
            total_units_sold: s.total_units_sold,
            total_revenue: s.total_revenue,
            last_sale: s.last_sale,
            is_dead_stock: s.is_dead_stock
        })) || [];

        const leadTimeSummary = leadTimeData?.slice(0, 5).map(lt => ({
            supplier_id: lt.supplier_id,
            product_id: lt.product_id,
            lead_time_days: lt.lead_time_days
        })) || [];

        const prompt = `You are an advanced AI inventory optimization expert. Analyze the following merchandising business data and provide actionable recommendations.

**Business Context:**
- Business: ${business.name}
- Available Capital: $${capitalData?.total_net_capital || 0}
- Total Products: ${productData?.length || 0}
- Total Sales Records: ${salesData?.length || 0}

**Product Summary (Top 10):**
${productSummary.map(p => `- ${p.name}: $${p.selling_price} (Cost: $${p.price})`).join('\n')}

**Sales Summary (Top 10):**
${salesSummary.map(s => `- ${s.product_name}: ${s.total_units_sold} units sold, $${s.total_revenue} revenue, Dead stock: ${s.is_dead_stock}`).join('\n')}

**Supplier Lead Times (Top 5):**
${leadTimeSummary.map(lt => `- Product ${lt.product_id}: ${lt.lead_time_days} days`).join('\n')}

**Co-Purchased Products:**
${coPurchaseData?.slice(0, 5).map(cp => `- ${cp.product_a_name} + ${cp.product_b_name}: ${cp.times_purchased_together} times`).join('\n') || 'No co-purchase data available'}

**Your Tasks:**

1. **Demand Forecasting**: Predict 30-day demand for each product based on sales history. Consider seasonality and trends.

2. **Reorder Optimization**: Calculate optimal reorder points and quantities considering:
   - Lead times from suppliers
   - Available capital constraint
   - Demand variability
   - Storage capacity (if applicable)

3. **Dead Stock Identification**: Flag products with no sales in 60+ days and suggest clearance discount percentages (5-30% off) based on holding cost and urgency.

4. **Bundle Recommendations**: Suggest 3-5 profitable product bundles based on:
   - Co-purchase patterns
   - Complementary product categories
   - Margin optimization
   - Inventory clearance opportunities

5. **Seasonal Transitions**: If applicable, recommend seasonal stock adjustments.

**Output Format (STRICT JSON):**
{
  "forecast": [
    {
      "product_id": "string",
      "product_name": "string",
      "demand_forecast_units": number,
      "confidence_score": number (0-1)
    }
  ],
  "reorder_plan": [
    {
      "product_id": "string",
      "product_name": "string",
      "current_status": "string",
      "reorder_point": number,
      "reorder_quantity": number,
      "estimated_cost": number,
      "priority": "high|medium|low",
      "rationale": "string"
    }
  ],
  "dead_stock": [
    {
      "product_id": "string",
      "product_name": "string",
      "last_sale_date": "string",
      "clearance_discount": number (percentage),
      "estimated_loss": number,
      "action": "string"
    }
  ],
  "bundles": [
    {
      "bundle_name": "string",
      "product_ids": ["string"],
      "product_names": ["string"],
      "bundle_price": number,
      "estimated_margin": number,
      "rationale": "string",
      "copurchase_frequency": number
    }
  ],
  "seasonal_recommendations": [
    {
      "action": "increase|decrease|maintain",
      "category": "string",
      "percentage_change": number,
      "rationale": "string"
    }
  ],
  "summary": {
    "total_capital_required": number,
    "expected_roi": number,
    "risk_level": "low|medium|high",
    "key_insights": ["string"]
  }
}

Return ONLY valid JSON, no markdown or explanations.`;

        console.log(`[INVENTORY OPTIMIZE] Prompt built - Length: ${prompt.length} characters`);
        console.log(`[INVENTORY OPTIMIZE] Calling Groq API...`);
        // Call Groq API
        const groqResponse = await groq.post('/chat/completions', {
            model: 'llama-3.1-8b-instant',
            messages: [
                {
                    role: 'system',
                    content: 'You are a precise inventory optimization AI. Always return valid JSON only.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: 0.3,
            max_tokens: 8000
        });

        console.log(`[INVENTORY OPTIMIZE] Groq API response received`);
        const aiResponse = groqResponse.data.choices[0].message.content;
        
        console.log(`[INVENTORY OPTIMIZE] Parsing AI response...`);
        // Parse AI response
        let optimizationResults;
        try {
            // Try to extract JSON if wrapped in markdown
            const jsonMatch = aiResponse.match(/```json\n?([\s\S]*?)\n?```/) || 
                             aiResponse.match(/```\n?([\s\S]*?)\n?```/);
            const jsonString = jsonMatch ? jsonMatch[1] : aiResponse;
            optimizationResults = JSON.parse(jsonString);
            console.log(`[INVENTORY OPTIMIZE] Successfully parsed AI response`);
        } catch (parseError) {
            console.error('[INVENTORY OPTIMIZE] JSON Parse Error:', parseError);
            console.error('[INVENTORY OPTIMIZE] AI Response:', aiResponse);
            return res.status(500).json({ 
                error: 'Failed to parse AI response',
                raw_response: aiResponse 
            });
        }

        console.log(`[INVENTORY OPTIMIZE] Processing optimization results for storage...`);
        // Store results in database
        const optimizationRecords = [];
        
        console.log(`[INVENTORY OPTIMIZE] Storing forecast data...`);
        // Store forecast data
        if (optimizationResults.forecast) {
            for (const item of optimizationResults.forecast) {
                optimizationRecords.push({
                    business_id: businessId,
                    product_id: item.product_id,
                    forecast_units: item.demand_forecast_units,
                    forecast_period_days: 30,
                    confidence_score: item.confidence_score * 100
                });
            }
            console.log(`[INVENTORY OPTIMIZE] Stored ${optimizationResults.forecast.length} forecast records`);
        }

        console.log(`[INVENTORY OPTIMIZE] Storing reorder plan...`);
        // Store reorder plan
        if (optimizationResults.reorder_plan) {
            for (const item of optimizationResults.reorder_plan) {
                const existingRecord = optimizationRecords.find(r => r.product_id === item.product_id);
                if (existingRecord) {
                    existingRecord.reorder_point = item.reorder_point;
                    existingRecord.reorder_quantity = item.reorder_quantity;
                    existingRecord.rationale = item.rationale;
                } else {
                    optimizationRecords.push({
                        business_id: businessId,
                        product_id: item.product_id,
                        reorder_point: item.reorder_point,
                        reorder_quantity: item.reorder_quantity,
                        rationale: item.rationale
                    });
                }
            }
            console.log(`[INVENTORY OPTIMIZE] Stored ${optimizationResults.reorder_plan.length} reorder plan records`);
        }

        console.log(`[INVENTORY OPTIMIZE] Storing dead stock recommendations...`);
        // Store dead stock recommendations
        if (optimizationResults.dead_stock) {
            for (const item of optimizationResults.dead_stock) {
                const existingRecord = optimizationRecords.find(r => r.product_id === item.product_id);
                if (existingRecord) {
                    existingRecord.clearance_discount = item.clearance_discount;
                } else {
                    optimizationRecords.push({
                        business_id: businessId,
                        product_id: item.product_id,
                        clearance_discount: item.clearance_discount
                    });
                }
            }
            console.log(`[INVENTORY OPTIMIZE] Stored ${optimizationResults.dead_stock.length} dead stock records`);
        }

        console.log(`[INVENTORY OPTIMIZE] Saving ${optimizationRecords.length} records to database...`);
        // Save to database
        if (optimizationRecords.length > 0) {
            const { error: insertError } = await supabase
                .from('inventory_optimization')
                .upsert(optimizationRecords, {
                    onConflict: 'business_id,product_id'
                });

            if (insertError) {
                console.error('[INVENTORY OPTIMIZE] Error saving optimization results:', insertError);
            } else {
                console.log(`[INVENTORY OPTIMIZE] Successfully saved ${optimizationRecords.length} records to database`);
            }
        }

        console.log(`[INVENTORY OPTIMIZE] Returning results to client...`);
        // Return results
        res.json({
            success: true,
            business: {
                id: business.id,
                name: business.name
            },
            optimization: optimizationResults,
            metadata: {
                products_analyzed: productData?.length || 0,
                sales_records: salesData?.length || 0,
                available_capital: capitalData?.total_net_capital || 0,
                products_sent_to_ai: productSummary.length,
                sales_sent_to_ai: salesSummary.length,
                lead_times_sent_to_ai: leadTimeSummary.length,
                timestamp: new Date().toISOString()
            }
        });
        console.log(`[INVENTORY OPTIMIZE] Optimization completed successfully for business: ${business.name}`);

    } catch (error) {
        console.error('[INVENTORY OPTIMIZE] Inventory optimization error:', error);
        res.status(500).json({ 
            error: 'Failed to optimize inventory',
            message: error.message 
        });
    }
});

/**
 * GET /api/inventory/results/:businessId
 * Get stored optimization results for a business
 */
router.get('/results/:businessId', authenticateUser, async (req, res) => {
    console.log(`[INVENTORY RESULTS] Fetching results for businessId: ${req.params.businessId}, userId: ${req.user.id}`);
    
    try {
        const { businessId } = req.params;
        const userId = req.user.id;

        console.log(`[INVENTORY RESULTS] Verifying business ownership...`);
        // Verify business belongs to user
        const { data: business, error: businessError } = await supabase
            .from('businesses')
            .select('*')
            .eq('id', businessId)
            .eq('user_id', userId)
            .single();

        if (businessError || !business) {
            console.log(`[INVENTORY RESULTS] Business verification failed:`, businessError);
            return res.status(404).json({ error: 'Business not found or access denied' });
        }
        console.log(`[INVENTORY RESULTS] Business verified: ${business.name}`);

        console.log(`[INVENTORY RESULTS] Fetching optimization results from database...`);
        // Fetch latest optimization results
        const { data: results, error } = await supabase
            .from('inventory_optimization')
            .select(`
                *,
                product:product_id (
                    product_id,
                    product_name,
                    price,
                    selling_price,
                    status,
                    category_id,
                    brand_id
                )
            `)
            .eq('business_id', businessId)
            .gt('expires_at', new Date().toISOString())
            .order('created_at', { ascending: false });

        if (error) {
            console.error('[INVENTORY RESULTS] Error fetching results:', error);
            return res.status(500).json({ error: 'Failed to fetch results' });
        }

        console.log(`[INVENTORY RESULTS] Found ${results?.length || 0} optimization records`);
        console.log(`[INVENTORY RESULTS] Returning results to client...`);
        res.json({
            success: true,
            results: results || [],
            count: results?.length || 0
        });
        console.log(`[INVENTORY RESULTS] Results fetch completed for business: ${business.name}`);

    } catch (error) {
        console.error('[INVENTORY RESULTS] Error:', error);
        res.status(500).json({ error: 'Failed to fetch optimization results' });
    }
});

/**
 * GET /api/inventory/products/:businessId
 * Get products with category, brand, and supplier information for inventory management
 */
router.get('/products/:businessId', authenticateUser, async (req, res) => {
    console.log(`[INVENTORY PRODUCTS] Fetching products for businessId: ${req.params.businessId}, userId: ${req.user.id}`);
    
    try {
        const { businessId } = req.params;
        const userId = req.user.id;
        const { search, category_id, brand_id, page = 1, limit = 50 } = req.query;

        console.log(`[INVENTORY PRODUCTS] Verifying business ownership...`);
        // Verify business belongs to user
        const { data: business, error: businessError } = await supabase
            .from('businesses')
            .select('*')
            .eq('id', businessId)
            .eq('user_id', userId)
            .single();

        if (businessError || !business) {
            console.log(`[INVENTORY PRODUCTS] Business verification failed:`, businessError);
            return res.status(404).json({ error: 'Business not found or access denied' });
        }
        console.log(`[INVENTORY PRODUCTS] Business verified: ${business.name}`);

        console.log(`[INVENTORY PRODUCTS] Building query for products...`);
        // Build query to fetch products with joined data
        let query = supabase
            .from('product')
            .select(`
                product_id,
                product_name,
                description,
                price,
                selling_price,
                status,
                created_date,
                expense,
                stored_location,
                category_id,
                brand_id,
                supplier_id,
                product_category:category_id (
                    category_name
                ),
                product_brand:brand_id (
                    brand_name
                ),
                supplier:supplier_id (
                    supplier_name
                )
            `)
            .eq('business_id', businessId);

        // Apply filters
        if (category_id) {
            query = query.eq('category_id', category_id);
        }
        if (brand_id) {
            query = query.eq('brand_id', brand_id);
        }
        if (search) {
            // Search in product name
            query = query.ilike('product_name', `%${search}%`);
        }

        // Apply pagination
        const offset = (parseInt(page) - 1) * parseInt(limit);
        query = query.range(offset, offset + parseInt(limit) - 1);

        console.log(`[INVENTORY PRODUCTS] Executing query...`);
        const { data: products, error: productsError } = await query;

        if (productsError) {
            console.error('[INVENTORY PRODUCTS] Error fetching products:', productsError);
            return res.status(500).json({ error: 'Failed to fetch products' });
        }

        console.log(`[INVENTORY PRODUCTS] Fetched ${products?.length || 0} products`);

        // Get total count for pagination
        let countQuery = supabase
            .from('product')
            .select('*', { count: 'exact', head: true })
            .eq('business_id', businessId);

        if (category_id) {
            countQuery = countQuery.eq('category_id', category_id);
        }
        if (brand_id) {
            countQuery = countQuery.eq('brand_id', brand_id);
        }
        if (search) {
            countQuery = countQuery.or(`product_name.ilike.%${search}%,supplier.supplier_name.ilike.%${search}%`);
        }

        const { count } = await countQuery;

        console.log(`[INVENTORY PRODUCTS] Total products count: ${count || 0}`);

        // Fetch categories and brands for filter dropdowns with product counts
        console.log(`[INVENTORY PRODUCTS] Fetching filter options...`);
        
        // Get categories with product counts
        const { data: categories } = await supabase
            .from('product_category')
            .select(`
                category_id,
                category_name,
                product!inner(business_id)
            `)
            .eq('business_id', businessId);

        // Aggregate category counts
        const categoryCounts = {};
        categories?.forEach(cat => {
            const count = cat.product?.length || 0;
            categoryCounts[cat.category_id] = {
                category_id: cat.category_id,
                category_name: cat.category_name,
                product_count: count
            };
        });

        // Get brands with product counts
        const { data: brands } = await supabase
            .from('product_brand')
            .select(`
                brand_id,
                brand_name,
                product!inner(business_id)
            `)
            .eq('business_id', businessId);

        // Aggregate brand counts
        const brandCounts = {};
        brands?.forEach(brand => {
            const count = brand.product?.length || 0;
            brandCounts[brand.brand_id] = {
                brand_id: brand.brand_id,
                brand_name: brand.brand_name,
                product_count: count
            };
        });

        console.log(`[INVENTORY PRODUCTS] Returning products data...`);
        res.json({
            success: true,
            products: products || [],
            filters: {
                categories: Object.values(categoryCounts),
                brands: Object.values(brandCounts)
            },
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: count || 0,
                totalPages: Math.ceil((count || 0) / parseInt(limit))
            }
        });
        console.log(`[INVENTORY PRODUCTS] Products fetch completed for business: ${business.name}`);

    } catch (error) {
        console.error('[INVENTORY PRODUCTS] Error:', error);
        res.status(500).json({ error: 'Failed to fetch inventory products' });
    }
});
router.get('/stats/:businessId', authenticateUser, async (req, res) => {
    console.log(`[INVENTORY STATS] Fetching stats for businessId: ${req.params.businessId}, userId: ${req.user.id}`);
    
    try {
        const { businessId } = req.params;
        const userId = req.user.id;

        console.log(`[INVENTORY STATS] Verifying business ownership...`);
        // Verify business belongs to user
        const { data: business, error: businessError } = await supabase
            .from('businesses')
            .select('*')
            .eq('id', businessId)
            .eq('user_id', userId)
            .single();

        if (businessError || !business) {
            console.log(`[INVENTORY STATS] Business verification failed:`, businessError);
            return res.status(404).json({ error: 'Business not found or access denied' });
        }
        console.log(`[INVENTORY STATS] Business verified: ${business.name}`);

        console.log(`[INVENTORY STATS] Getting product count...`);
        // Get product count
        const { count: totalProducts } = await supabase
            .from('product')
            .select('*', { count: 'exact', head: true })
            .eq('business_id', businessId);

        console.log(`[INVENTORY STATS] Total products: ${totalProducts || 0}`);

        console.log(`[INVENTORY STATS] Getting dead stock count...`);
        // Get dead stock count
        const { data: salesSummary } = await supabase
            .from('vw_product_sales_summary')
            .select('is_dead_stock')
            .eq('business_id', businessId)
            .eq('is_dead_stock', true);

        console.log(`[INVENTORY STATS] Dead stock items: ${salesSummary?.length || 0}`);

        console.log(`[INVENTORY STATS] Getting reorder recommendations...`);
        // Get reorder recommendations
        const { data: reorderItems } = await supabase
            .from('inventory_optimization')
            .select('reorder_point')
            .eq('business_id', businessId)
            .not('reorder_point', 'is', null)
            .gt('expires_at', new Date().toISOString());

        console.log(`[INVENTORY STATS] Items needing reorder: ${reorderItems?.length || 0}`);

        const optimalStock = (totalProducts || 0) - (salesSummary?.length || 0) - (reorderItems?.length || 0);
        console.log(`[INVENTORY STATS] Optimal stock items: ${optimalStock}`);

        console.log(`[INVENTORY STATS] Returning stats to client...`);
        res.json({
            success: true,
            stats: {
                total_items: totalProducts || 0,
                need_reorder: reorderItems?.length || 0,
                dead_stock: salesSummary?.length || 0,
                optimal_stock: optimalStock
            }
        });
        console.log(`[INVENTORY STATS] Stats fetch completed for business: ${business.name}`);

    } catch (error) {
        console.error('[INVENTORY STATS] Error:', error);
        res.status(500).json({ error: 'Failed to fetch inventory stats' });
    }
});

module.exports = router;
