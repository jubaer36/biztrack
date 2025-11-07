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

// Get all suppliers for a business
router.get('/suppliers/:businessId', authenticateToken, async (req, res) => {
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
            .from('supplier')
            .select('*')
            .eq('business_id', businessId)
            .order('supplier_name', { ascending: true });

        if (error) {
            throw error;
        }

        res.json({
            suppliers: data
        });
    } catch (error) {
        console.error('Error fetching suppliers:', error);
        res.status(500).json({
            error: 'Internal server error while fetching suppliers'
        });
    }
});

// Get all products for a business (for purchase orders, we show existing products to potentially add to)
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
                    price: product.price,
                    selling_price: product.selling_price,
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

// Get all product categories for a business
router.get('/categories/:businessId', authenticateToken, async (req, res) => {
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
            .from('product_category')
            .select('*')
            .eq('business_id', businessId)
            .order('category_name', { ascending: true });

        if (error) {
            throw error;
        }

        res.json({
            categories: data
        });
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({
            error: 'Internal server error while fetching categories'
        });
    }
});

// Get all product brands for a business
router.get('/brands/:businessId', authenticateToken, async (req, res) => {
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
            .from('product_brand')
            .select('*')
            .eq('business_id', businessId)
            .order('brand_name', { ascending: true });

        if (error) {
            throw error;
        }

        res.json({
            brands: data
        });
    } catch (error) {
        console.error('Error fetching brands:', error);
        res.status(500).json({
            error: 'Internal server error while fetching brands'
        });
    }
});

// Create a new supplier
router.post('/suppliers/:businessId', authenticateToken, async (req, res) => {
    try {
        const { businessId } = req.params;
        const { supplier_name, contact_person, email, phone, address } = req.body;

        // Verify business ownership
        const ownershipCheck = await Business.verifyOwnership(businessId, req.user.id);
        if (!ownershipCheck) {
            return res.status(403).json({
                error: 'Access denied'
            });
        }

        // Validate required fields
        if (!supplier_name || supplier_name.trim().length === 0) {
            return res.status(400).json({
                error: 'Supplier name is required'
            });
        }

        const { data, error } = await supabaseAdmin
            .from('supplier')
            .insert([{
                business_id: businessId,
                supplier_name: supplier_name.trim(),
                contact_person: contact_person ? contact_person.trim() : null,
                email: email ? email.trim() : null,
                phone: phone ? phone.trim() : null,
                address: address ? address.trim() : null
            }])
            .select()
            .single();

        if (error) {
            throw error;
        }

        res.status(201).json({
            message: 'Supplier created successfully',
            supplier: data
        });
    } catch (error) {
        console.error('Error creating supplier:', error);
        res.status(500).json({
            error: 'Internal server error while creating supplier'
        });
    }
});

// Create a new product category
router.post('/categories/:businessId', authenticateToken, async (req, res) => {
    try {
        const { businessId } = req.params;
        const { category_name, description } = req.body;

        // Verify business ownership
        const ownershipCheck = await Business.verifyOwnership(businessId, req.user.id);
        if (!ownershipCheck) {
            return res.status(403).json({
                error: 'Access denied'
            });
        }

        // Validate required fields
        if (!category_name || category_name.trim().length === 0) {
            return res.status(400).json({
                error: 'Category name is required'
            });
        }

        const { data, error } = await supabaseAdmin
            .from('product_category')
            .insert([{
                business_id: businessId,
                category_name: category_name.trim(),
                description: description ? description.trim() : null
            }])
            .select()
            .single();

        if (error) {
            throw error;
        }

        res.status(201).json({
            message: 'Category created successfully',
            category: data
        });
    } catch (error) {
        console.error('Error creating category:', error);
        res.status(500).json({
            error: 'Internal server error while creating category'
        });
    }
});

// Create a new product brand
router.post('/brands/:businessId', authenticateToken, async (req, res) => {
    try {
        const { businessId } = req.params;
        const { brand_name, description, unit_price } = req.body;

        // Verify business ownership
        const ownershipCheck = await Business.verifyOwnership(businessId, req.user.id);
        if (!ownershipCheck) {
            return res.status(403).json({
                error: 'Access denied'
            });
        }

        // Validate required fields
        if (!brand_name || brand_name.trim().length === 0) {
            return res.status(400).json({
                error: 'Brand name is required'
            });
        }

        const { data, error } = await supabaseAdmin
            .from('product_brand')
            .insert([{
                business_id: businessId,
                brand_name: brand_name.trim(),
                description: description ? description.trim() : null,
                unit_price: unit_price || 0
            }])
            .select()
            .single();

        if (error) {
            throw error;
        }

        res.status(201).json({
            message: 'Brand created successfully',
            brand: data
        });
    } catch (error) {
        console.error('Error creating brand:', error);
        res.status(500).json({
            error: 'Internal server error while creating brand'
        });
    }
});

// Create a new purchase order
router.post('/:businessId', authenticateToken, async (req, res) => {
    try {
        const { businessId } = req.params;
        const { supplier_id, items, notes } = req.body;

        // Verify business ownership
        const ownershipCheck = await Business.verifyOwnership(businessId, req.user.id);
        if (!ownershipCheck) {
            return res.status(403).json({
                error: 'Access denied'
            });
        }

        // Validate required fields
        if (!supplier_id) {
            return res.status(400).json({
                error: 'Supplier is required'
            });
        }

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                error: 'At least one item is required'
            });
        }

        // Calculate total amount and prepare items
        let totalAmount = 0;
        const processedItems = [];

        for (const item of items) {
            if (!item.product_name || !item.brand_id || !item.category_id || !item.quantity || item.quantity <= 0 || !item.unit_cost) {
                return res.status(400).json({
                    error: 'Invalid item data - all fields required'
                });
            }

            // Get or create category
            let categoryId = item.category_id;
            if (item.category_id === 0 && item.category_name) {
                // Create new category
                const { data: newCategory, error: catError } = await supabaseAdmin
                    .from('product_category')
                    .insert([{
                        business_id: businessId,
                        category_name: item.category_name,
                        description: ''
                    }])
                    .select()
                    .single();

                if (catError) throw catError;
                categoryId = newCategory.category_id;
            }

            // Get or create brand
            let brandId = item.brand_id;
            if (item.brand_id === 0 && item.brand_name) {
                // Create new brand
                const { data: newBrand, error: brandError } = await supabaseAdmin
                    .from('product_brand')
                    .insert([{
                        business_id: businessId,
                        brand_name: item.brand_name,
                        description: '',
                        unit_price: item.unit_cost
                    }])
                    .select()
                    .single();

                if (brandError) throw brandError;
                brandId = newBrand.brand_id;
            }

            // Check if products with this name/brand/category already exist
            const { data: existingProducts, error: productError } = await supabaseAdmin
                .from('product')
                .select('product_id')
                .eq('business_id', businessId)
                .eq('product_name', item.product_name)
                .eq('brand_id', brandId)
                .eq('category_id', categoryId)
                .limit(1);

            if (productError) {
                throw productError;
            }

            // Create individual product instances with unique product_ids
            const productInstances = [];
            for (let i = 0; i < item.quantity; i++) {
                const instanceId = `PROD${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}${i}`;
                productInstances.push({
                    business_id: businessId,
                    product_id: instanceId,
                    product_name: item.product_name,
                    category_id: categoryId,
                    brand_id: brandId,
                    supplier_id: supplier_id,
                    price: item.unit_cost,
                    selling_price: item.unit_cost * 1.2, // Default markup
                    status: 'Active',
                    created_date: new Date().toISOString(),
                    expense: 0,
                    stored_location: 'Warehouse'
                });
            }

            const { error: insertError } = await supabaseAdmin
                .from('product')
                .insert(productInstances);

            if (insertError) {
                throw insertError;
            }

            const lineTotal = item.unit_cost * item.quantity;
            totalAmount += lineTotal;

            processedItems.push({
                product_id: productInstances[0].product_id, // Use first instance's product_id for purchase order reference
                brand_id: brandId,
                quantity: item.quantity,
                unit_cost: item.unit_cost,
                line_total: lineTotal
            });
        }

        // Create purchase order
        const { data: purchaseOrder, error: orderError } = await supabaseAdmin
            .from('purchase_order')
            .insert([{
                business_id: businessId,
                supplier_id: supplier_id,
                order_date: new Date().toISOString(),
                delivery_date: new Date().toISOString().split('T')[0], // Current date
                status: 'Delivered',
                total_amount: totalAmount,
                notes: notes || null
            }])
            .select()
            .single();

        if (orderError) {
            throw orderError;
        }

        // Create purchase order items
        const orderItems = processedItems.map(item => {
            const baseItem = {
                purchase_order_id: purchaseOrder.purchase_order_id,
                business_id: businessId,
                product_brand_id: item.brand_id, // Keep for backward compatibility
                quantity_ordered: item.quantity,
                unit_cost: item.unit_cost,
                line_total: item.line_total
            };

            // Add product_id if the column exists (after migration)
            if (item.product_id) {
                baseItem.product_id = item.product_id;
            }

            return baseItem;
        });

        const { error: itemsError } = await supabaseAdmin
            .from('purchase_order_items')
            .insert(orderItems);

        if (itemsError) {
            throw itemsError;
        }

        res.status(201).json({
            message: 'Purchase order created successfully',
            purchase_order: purchaseOrder,
            items: orderItems
        });
    } catch (error) {
        console.error('Error creating purchase order:', error);
        res.status(500).json({
            error: 'Internal server error while creating purchase order'
        });
    }
});

// Get purchase orders for a business
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
            .from('purchase_order')
            .select(`
                purchase_order_id,
                order_date,
                delivery_date,
                status,
                total_amount,
                notes,
                supplier:supplier_id (
                    supplier_name,
                    contact_person,
                    email,
                    phone
                ),
                purchase_order_items (
                    product_brand_id,
                    quantity_ordered,
                    unit_cost,
                    line_total,
                    product_brand (
                        brand_name
                    )
                )
            `)
            .eq('business_id', businessId)
            .order('order_date', { ascending: false });

        if (error) {
            throw error;
        }

        res.json({
            purchase_orders: data
        });
    } catch (error) {
        console.error('Error fetching purchase orders:', error);
        res.status(500).json({
            error: 'Internal server error while fetching purchase orders'
        });
    }
});

module.exports = router;
