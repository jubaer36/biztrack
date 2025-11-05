const express = require('express');
const { supabaseAdmin } = require('../config/supabase');
const { authenticateUser } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/test/supabase-connection
 * Test Supabase connection and table access
 */
router.get('/supabase-connection', authenticateUser, async (req, res) => {
    try {
        console.log('Testing Supabase connection...');
        
        // Test 1: Check if we can connect to Supabase
        const { data: healthCheck, error: healthError } = await supabaseAdmin
            .from('businesses')
            .select('id')
            .limit(1);
            
        if (healthError) {
            console.error('Health check failed:', healthError);
            return res.status(500).json({
                error: 'Supabase connection failed',
                details: healthError.message
            });
        }
        
        console.log('✅ Supabase connection successful');
        
        // Test 2: Check mapping tables accessibility
        const testTables = [
            'product_category', 'product_brand', 'supplier', 'customer', 
            'product', 'sales_order', 'purchase_order'
        ];
        
        const tableStatus = {};
        
        for (const table of testTables) {
            try {
                const { error } = await supabaseAdmin
                    .from(table)
                    .select('*')
                    .limit(1);
                    
                tableStatus[table] = {
                    accessible: !error,
                    error: error?.message || null
                };
                
                if (!error) {
                    console.log(`✅ Table ${table} is accessible`);
                } else {
                    console.log(`❌ Table ${table} error:`, error.message);
                }
            } catch (tableError) {
                tableStatus[table] = {
                    accessible: false,
                    error: tableError.message
                };
                console.log(`❌ Table ${table} error:`, tableError.message);
            }
        }
        
        // Test 3: Try a sample insert to product table
        let insertTest = null;
        try {
            const testRecord = {
                product_id: 'TEST_' + Date.now(),
                business_id: req.user.id, // Use the authenticated user's ID as business ID for test
                product_name: 'Test Product',
                price: 99.99,
                created_date: new Date().toISOString()
            };
            
            console.log('Testing insert with record:', testRecord);
            
            const { data: insertData, error: insertError } = await supabaseAdmin
                .from('product')
                .insert(testRecord)
                .select();
                
            if (insertError) {
                insertTest = {
                    success: false,
                    error: insertError.message
                };
                console.log('❌ Insert test failed:', insertError.message);
            } else {
                insertTest = {
                    success: true,
                    insertedRecord: insertData[0]
                };
                console.log('✅ Insert test successful:', insertData[0]);
                
                // Clean up - delete the test record
                await supabaseAdmin
                    .from('product')
                    .delete()
                    .eq('product_id', testRecord.product_id);
                    
                console.log('✅ Test record cleaned up');
            }
        } catch (insertError) {
            insertTest = {
                success: false,
                error: insertError.message
            };
            console.log('❌ Insert test exception:', insertError.message);
        }
        
        res.json({
            message: 'Supabase connection test completed',
            connectionHealthy: true,
            tableStatus,
            insertTest,
            userId: req.user.id,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Test endpoint error:', error);
        res.status(500).json({
            error: 'Test failed',
            details: error.message
        });
    }
});

/**
 * POST /api/test/sample-mapping
 * Test the data mapping algorithm with sample data
 */
router.post('/sample-mapping', authenticateUser, async (req, res) => {
    try {
        const DataMapper = require('../services/dataMapper');
        const mongoose = require('mongoose');
        
        console.log('Testing data mapping algorithm...');
        
        const mapper = new DataMapper();
        const businessId = req.user.id; // Use user ID as business ID for test
        
        // Create sample data in MongoDB
        const db = mongoose.connection.db;
        const testCollectionName = `${businessId}_test_sales_data`;
        
        const sampleData = [
            {
                'Date': '2024-01-15',
                'Customer Name': 'John Doe',
                'Product': 'Cotton T-Shirt',
                'Quantity': 5,
                'Unit Price': '25.00',
                'Total Amount': '125.00',
                'Payment Method': 'Cash'
            },
            {
                'Date': '2024-01-16',
                'Customer Name': 'Jane Smith',
                'Product': 'Denim Jacket',
                'Quantity': 2,
                'Unit Price': '75.50',
                'Total Amount': '151.00',
                'Payment Method': 'Card'
            }
        ];
        
        // Insert sample data
        const collection = db.collection(testCollectionName);
        await collection.deleteMany({}); // Clear existing test data
        await collection.insertMany(sampleData);
        
        console.log('✅ Sample data inserted');
        
        // Test the mapping process
        const result = await mapper.processBusinessData(businessId);
        
        // Clean up test data
        await collection.drop();
        console.log('✅ Test collection cleaned up');
        
        res.json({
            message: 'Data mapping test completed',
            result,
            testDataUsed: sampleData
        });
        
    } catch (error) {
        console.error('Sample mapping test error:', error);
        res.status(500).json({
            error: 'Sample mapping test failed',
            details: error.message
        });
    }
});

module.exports = router;