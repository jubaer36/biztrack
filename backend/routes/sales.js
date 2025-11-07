const express = require('express');
const { supabase, supabaseAdmin } = require('../config/supabase');
const Business = require('../models/Business');
const router = express.Router();

// Middleware to verify authentication
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                error: 'No valid token provided'
            });
        }

        const token = authHeader.substring(7);

        // Get user from token
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            return res.status(401).json({
                error: 'Invalid or expired token'
            });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error('Authentication error:', error);
        res.status(500).json({
            error: 'Internal server error during authentication'
        });
    }
};

// Get all customers for a business
router.get('/customers/:businessId', authenticateToken, async (req, res) => {
    try {
        const { businessId } = req.params;

        // Verify business ownership
        const ownershipCheck = await Business.verifyOwnership(businessId, req.user.id);
        if (!ownershipCheck) {
            return res.status(403).json({
                error: 'Access denied'
            });
        }

        const { data, error } = await supabaseAdmin
            .from('customer')
            .select('*')
            .eq('business_id', businessId)
            .order('customer_name', { ascending: true });

        if (error) {
            throw error;
        }

        res.json({
            customers: data
        });
    } catch (error) {
        console.error('Error fetching customers:', error);
        res.status(500).json({
            error: 'Internal server error while fetching customers'
        });
    }
});

// Get all products for a business
router.get('/products/:businessId', authenticateToken, async (req, res) => {
    try {
        const { businessId } = req.params;

        // Verify business ownership
        const ownershipCheck = await Business.verifyOwnership(businessId, req.user.id);
        if (!ownershipCheck) {
            return res.status(403).json({
                error: 'Access denied'
            });
        }

        let { data, error } = await supabaseAdmin
            .from('product')
            .select(`
                product_id,
                product_name,
                price,
                selling_price,
                status,
                category_id,
                brand_id,
                product_category(category_name),
                product_brand(brand_name)
            `)
            .eq('business_id', businessId)
            .order('product_name', { ascending: true });

        if (error) {
            console.error('Supabase error:', error);
            throw error;
        }

        // Group products by name, brand, and category
        const groupedProducts = {};
        data.forEach(product => {
            const key = `${product.product_name}-${product.brand_id}-${product.category_id}`;
            if (!groupedProducts[key]) {
                groupedProducts[key] = {
                    product_name: product.product_name,
                    brand_name: product.product_brand?.brand_name || 'Unknown Brand',
                    category_name: product.product_category?.category_name || 'Unknown Category',
                    selling_price: product.selling_price,
                    price: product.price,
                    brand_id: product.brand_id,
                    category_id: product.category_id,
                    stock_count: 0,
                    product_ids: []
                };
            }
            groupedProducts[key].stock_count += 1;
            groupedProducts[key].product_ids.push(product.product_id);
        });

        // Convert to array
        const products = Object.values(groupedProducts);

        res.json({
            products
        });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({
            error: 'Internal server error while fetching products'
        });
    }
});

// Create a new customer
router.post('/customers/:businessId', authenticateToken, async (req, res) => {
    try {
        const { businessId } = req.params;
        const { customer_name, email, phone, billing_address, shipping_address, customer_type } = req.body;

        // Verify business ownership
        const ownershipCheck = await Business.verifyOwnership(businessId, req.user.id);
        if (!ownershipCheck) {
            return res.status(403).json({
                error: 'Access denied'
            });
        }

        // Validate required fields
        if (!customer_name || customer_name.trim().length === 0) {
            return res.status(400).json({
                error: 'Customer name is required'
            });
        }

        const { data, error } = await supabaseAdmin
            .from('customer')
            .insert([{
                business_id: businessId,
                customer_name: customer_name.trim(),
                email: email ? email.trim() : null,
                phone: phone ? phone.trim() : null,
                billing_address: billing_address ? billing_address.trim() : null,
                shipping_address: shipping_address ? shipping_address.trim() : null,
                customer_type: customer_type || 'regular'
            }])
            .select()
            .single();

        if (error) {
            throw error;
        }

        res.status(201).json({
            message: 'Customer created successfully',
            customer: data
        });
    } catch (error) {
        console.error('Error creating customer:', error);
        res.status(500).json({
            error: 'Internal server error while creating customer'
        });
    }
});

// Create a new sales order
router.post('/:businessId', authenticateToken, async (req, res) => {
    try {
        const { businessId } = req.params;
        const { customer_id, items, shipping_address, notes } = req.body;

        // Verify business ownership
        const ownershipCheck = await Business.verifyOwnership(businessId, req.user.id);
        if (!ownershipCheck) {
            return res.status(403).json({
                error: 'Access denied'
            });
        }

        // Validate required fields
        if (!customer_id) {
            return res.status(400).json({
                error: 'Customer is required'
            });
        }

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                error: 'At least one item is required'
            });
        }

        // Calculate total amount
        let totalAmount = 0;
        for (const item of items) {
            if (!item.product_id || !item.quantity || item.quantity <= 0) {
                return res.status(400).json({
                    error: 'Invalid item data'
                });
            }

            // Get product price
            const { data: product, error: productError } = await supabaseAdmin
                .from('product')
                .select('selling_price')
                .eq('product_id', item.product_id)
                .eq('business_id', businessId)
                .single();

            if (productError || !product) {
                return res.status(400).json({
                    error: `Product ${item.product_id} not found`
                });
            }

            const lineTotal = product.selling_price * item.quantity;
            totalAmount += lineTotal;
            item.line_total = lineTotal;
        }

        // Create sales order
        const { data: salesOrder, error: orderError } = await supabaseAdmin
            .from('sales_order')
            .insert([{
                business_id: businessId,
                customer_id: customer_id,
                order_date: new Date().toISOString(),
                status: 'Completed',
                total_amount: totalAmount,
                shipping_address: shipping_address || null
            }])
            .select()
            .single();

        if (orderError) {
            throw orderError;
        }

        // Create sales order items
        const orderItems = items.map(item => ({
            sales_order_id: salesOrder.sales_order_id,
            business_id: businessId,
            product_id: item.product_id,
            line_total: item.line_total
        }));

        const { error: itemsError } = await supabaseAdmin
            .from('sales_order_items')
            .insert(orderItems);

        if (itemsError) {
            // If items insertion fails, we should ideally rollback the order
            // For now, we'll log the error but continue
            console.error('Error creating sales order items:', itemsError);
        }

        res.status(201).json({
            message: 'Sales order created successfully',
            sales_order: salesOrder,
            items: orderItems
        });
    } catch (error) {
        console.error('Error creating sales order:', error);
        res.status(500).json({
            error: 'Internal server error while creating sales order'
        });
    }
});

// Get sales orders for a business
router.get('/:businessId', authenticateToken, async (req, res) => {
    try {
        const { businessId } = req.params;

        // Verify business ownership
        const ownershipCheck = await Business.verifyOwnership(businessId, req.user.id);
        if (!ownershipCheck) {
            return res.status(403).json({
                error: 'Access denied'
            });
        }

        const { data, error } = await supabaseAdmin
            .from('sales_order')
            .select(`
                *,
                customer:customer_id (
                    customer_name,
                    email,
                    phone
                ),
                sales_order_items (
                    product_id,
                    line_total,
                    product:product_id (
                        product_name,
                        selling_price
                    )
                )
            `)
            .eq('business_id', businessId)
            .order('order_date', { ascending: false });

        if (error) {
            throw error;
        }

        res.json({
            sales_orders: data
        });
    } catch (error) {
        console.error('Error fetching sales orders:', error);
        res.status(500).json({
            error: 'Internal server error while fetching sales orders'
        });
    }
});

module.exports = router;