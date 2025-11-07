const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../middleware/auth');
const { supabaseAdmin } = require('../config/supabase');

/**
 * GET /api/dashboard/metrics/:businessId
 * Get dashboard metrics for a specific business
 */
router.get('/metrics/:businessId', authenticateUser, async (req, res) => {
    try {
        const { businessId } = req.params;

        // Verify business belongs to user
        const { data: business, error: businessError } = await supabaseAdmin
            .from('businesses')
            .select('*')
            .eq('id', businessId)
            .eq('user_id', req.user.id)
            .single();

        if (businessError || !business) {
            return res.status(404).json({ error: 'Business not found' });
        }

        // Get date ranges
        const now = new Date();
        const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

        // 1. TOTAL REVENUE (This Month)
        const { data: salesThisMonth, error: salesError } = await supabaseAdmin.rpc('get_sales_summary', {
            p_business_id: businessId,
            p_start_date: firstDayThisMonth.toISOString().split('T')[0],
            p_end_date: now.toISOString().split('T')[0]
        });

        const { data: salesLastMonth } = await supabaseAdmin.rpc('get_sales_summary', {
            p_business_id: businessId,
            p_start_date: firstDayLastMonth.toISOString().split('T')[0],
            p_end_date: lastDayLastMonth.toISOString().split('T')[0]
        });

        const totalRevenueThisMonth = salesThisMonth?.[0]?.total_revenue || 0;
        const totalRevenueLastMonth = salesLastMonth?.[0]?.total_revenue || 0;
        const revenueChange = totalRevenueLastMonth > 0 
            ? ((totalRevenueThisMonth - totalRevenueLastMonth) / totalRevenueLastMonth * 100).toFixed(1)
            : 0;

        // 2. PROFIT MARGIN (This Month)
        const totalCost = salesThisMonth?.[0]?.total_cost || 0;
        const profitThisMonth = totalRevenueThisMonth - totalCost;
        const profitMarginThisMonth = totalRevenueThisMonth > 0 
            ? (profitThisMonth / totalRevenueThisMonth * 100).toFixed(1)
            : 0;

        const totalCostLastMonth = salesLastMonth?.[0]?.total_cost || 0;
        const profitLastMonth = totalRevenueLastMonth - totalCostLastMonth;
        const profitMarginLastMonth = totalRevenueLastMonth > 0 
            ? (profitLastMonth / totalRevenueLastMonth * 100).toFixed(1)
            : 0;
        
        const profitMarginChange = profitMarginLastMonth > 0 
            ? (profitMarginThisMonth - profitMarginLastMonth).toFixed(1)
            : 0;

        // 3. INVENTORY VALUE
        const { data: inventoryData, error: inventoryError } = await supabaseAdmin
            .from('product')
            .select('price, stored_location')
            .eq('business_id', businessId);

        // Calculate inventory value - count products that have a stored_location (in stock)
        const inventoryValue = inventoryData?.reduce((sum, item) => {
            return sum + (item.price || 0);
        }, 0) || 0;

        // Get items needing attention (products with low stock or issues)
        // For now, we'll consider products without stored_location as needing attention
        const itemsNeedingAttention = inventoryData?.filter(item => !item.stored_location || item.stored_location.trim() === '').length || 0;

        // 4. ACTIVE CUSTOMERS
        // Get unique customers who made purchases this month
        const { data: customersThisMonth } = await supabaseAdmin
            .from('sales_order')
            .select('customer_id')
            .eq('business_id', businessId)
            .gte('order_date', firstDayThisMonth.toISOString())
            .lte('order_date', now.toISOString())
            .not('customer_id', 'is', null);

        const uniqueCustomersThisMonth = new Set(customersThisMonth?.map(s => s.customer_id)).size;

        // Get unique customers from last month
        const { data: customersLastMonth } = await supabaseAdmin
            .from('sales_order')
            .select('customer_id')
            .eq('business_id', businessId)
            .gte('order_date', firstDayLastMonth.toISOString())
            .lte('order_date', lastDayLastMonth.toISOString())
            .not('customer_id', 'is', null);

        const uniqueCustomersLastMonth = new Set(customersLastMonth?.map(s => s.customer_id)).size;
        const newCustomers = Math.max(0, uniqueCustomersThisMonth - uniqueCustomersLastMonth);

        // Prepare response
        const metrics = {
            totalRevenue: {
                value: totalRevenueThisMonth,
                change: revenueChange,
                trend: parseFloat(revenueChange) >= 0 ? 'up' : 'down',
                formatted: `৳${(totalRevenueThisMonth / 1000).toFixed(1)}K`
            },
            profitMargin: {
                value: parseFloat(profitMarginThisMonth),
                change: profitMarginChange,
                trend: parseFloat(profitMarginChange) >= 0 ? 'up' : 'down',
                formatted: `${profitMarginThisMonth}%`
            },
            inventoryValue: {
                value: inventoryValue,
                itemsNeedingAttention: itemsNeedingAttention,
                trend: itemsNeedingAttention > 0 ? 'warning' : 'neutral',
                formatted: `৳${(inventoryValue / 1000).toFixed(1)}K`
            },
            activeCustomers: {
                value: uniqueCustomersThisMonth,
                newCustomers: newCustomers,
                trend: newCustomers > 0 ? 'up' : 'neutral',
                formatted: uniqueCustomersThisMonth.toString()
            }
        };

        res.json({ 
            success: true,
            metrics,
            businessName: business.name,
            period: {
                current: {
                    start: firstDayThisMonth.toISOString().split('T')[0],
                    end: now.toISOString().split('T')[0]
                },
                previous: {
                    start: firstDayLastMonth.toISOString().split('T')[0],
                    end: lastDayLastMonth.toISOString().split('T')[0]
                }
            }
        });

    } catch (error) {
        console.error('Error fetching dashboard metrics:', error);
        res.status(500).json({ 
            error: 'Failed to fetch dashboard metrics',
            message: error.message 
        });
    }
});

/**
 * GET /api/dashboard/businesses
 * Get all businesses for the authenticated user
 */
router.get('/businesses', authenticateUser, async (req, res) => {
    try {
        const { data: businesses, error } = await supabaseAdmin
            .from('businesses')
            .select('id, name, description, created_at')
            .eq('user_id', req.user.id)
            .order('created_at', { ascending: false });

        if (error) {
            throw error;
        }

        res.json({ 
            success: true,
            businesses: businesses || []
        });

    } catch (error) {
        console.error('Error fetching businesses:', error);
        res.status(500).json({ 
            error: 'Failed to fetch businesses',
            message: error.message 
        });
    }
});

module.exports = router;
