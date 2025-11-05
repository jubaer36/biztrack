const express = require('express');
const DataMapper = require('../services/dataMapper');
const { authenticateUser } = require('../middleware/auth');
const { supabaseAdmin } = require('../config/supabase');

const router = express.Router();

/**
 * POST /api/data/map/:businessId
 * Process and map all MongoDB collections for a business to Supabase using LLM
 */
router.post('/map/:businessId', authenticateUser, async (req, res) => {
    try {
        const { businessId } = req.params;
        const userId = req.user.id;

        console.log(`\n${'='.repeat(80)}`);
        console.log(`📥 API REQUEST: Start data mapping`);
        console.log(`   Business ID: ${businessId}`);
        console.log(`   User ID: ${userId}`);
        console.log(`   Timestamp: ${new Date().toISOString()}`);
        console.log(`${'='.repeat(80)}\n`);

        // Verify business ownership
        const { data: businesses, error: businessError } = await supabaseAdmin
            .from('businesses')
            .select('id, name')
            .eq('id', businessId)
            .eq('user_id', userId)
            .single();

        if (businessError || !businesses) {
            console.error('❌ Access denied or business not found:', businessError);
            return res.status(403).json({
                error: 'Access denied or business not found'
            });
        }

        console.log(`✅ Business verified: ${businesses.name}`);

        // Initialize the data mapper
        const mapper = new DataMapper();
        
        console.log('🔄 Starting data mapper pipeline...\n');
        
        // Process all business data
        const result = await mapper.processBusinessData(businessId);

        console.log('\n✅ Data mapping completed successfully');
        console.log(`📊 Summary: ${result.totalRecordsInserted}/${result.totalRecordsProcessed} records inserted (${result.successRate}%)`);
        console.log(`⏱️  Total time: ${result.processingTime}s\n`);

        res.json({
            success: true,
            message: 'Data mapping completed successfully',
            businessId,
            businessName: businesses.name,
            result
        });

    } catch (error) {
        console.error('\n❌ Error in data mapping:', error);
        console.error(`   Message: ${error.message}`);
        console.error(`   Stack: ${error.stack}\n`);
        
        res.status(500).json({
            success: false,
            error: 'Data mapping failed',
            details: error.message
        });
    }
});

/**
 * GET /api/data/map/:businessId/stream
 * Stream real-time progress updates using Server-Sent Events (SSE)
 */
router.get('/map/:businessId/stream', authenticateUser, async (req, res) => {
    const { businessId } = req.params;
    const userId = req.user.id;

    console.log(`\n📡 SSE Connection requested for business: ${businessId}`);

    try {
        // Verify business ownership
        const { data: businesses, error: businessError } = await supabaseAdmin
            .from('businesses')
            .select('id, name')
            .eq('id', businessId)
            .eq('user_id', userId)
            .single();

        if (businessError || !businesses) {
            console.error('❌ SSE: Access denied or business not found');
            return res.status(403).json({
                error: 'Access denied or business not found'
            });
        }

        console.log(`✅ SSE: Business verified, setting up stream...`);

        // Set up SSE headers
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

        // Send initial connection message
        res.write(`data: ${JSON.stringify({ 
            type: 'connected', 
            message: 'Real-time updates connected',
            businessId,
            businessName: businesses.name 
        })}\n\n`);

        // Initialize the data mapper with progress callback
        const mapper = new DataMapper();
        
        mapper.setProgressCallback((progress) => {
            // Send progress update to client
            res.write(`data: ${JSON.stringify({ 
                type: 'progress', 
                ...progress 
            })}\n\n`);
        });

        // Process data in the background
        try {
            const result = await mapper.processBusinessData(businessId);
            
            // Send completion message
            res.write(`data: ${JSON.stringify({ 
                type: 'complete', 
                result 
            })}\n\n`);
            
            console.log(`✅ SSE: Streaming completed for business ${businessId}\n`);
        } catch (processingError) {
            // Send error message
            res.write(`data: ${JSON.stringify({ 
                type: 'error', 
                error: processingError.message 
            })}\n\n`);
            
            console.error(`❌ SSE: Processing error:`, processingError);
        }
        
        res.end();

    } catch (error) {
        console.error('❌ SSE: Setup error:', error);
        res.status(500).json({
            error: 'SSE setup failed',
            details: error.message
        });
    }
});

/**
 * GET /api/data/mapping-status/:businessId
 * Get the mapping status and results for a business
 */
router.get('/mapping-status/:businessId', authenticateUser, async (req, res) => {
    try {
        const { businessId } = req.params;
        const userId = req.user.id;

        // Verify business ownership
        const { data: businesses, error: businessError } = await supabaseAdmin
            .from('businesses')
            .select('id, name')
            .eq('id', businessId)
            .eq('user_id', userId)
            .single();

        if (businessError || !businesses) {
            return res.status(403).json({
                error: 'Access denied or business not found'
            });
        }

        // Check if there's any mapped data in Supabase for this business
        const tables = [
            'product_category', 'product_brand', 'supplier', 'customer', 
            'investor', 'investment', 'investors_capital', 'product',
            'purchase_order', 'purchase_order_items', 'sales_order', 'sales_order_items'
        ];

        const tableStatus = {};
        
        for (const table of tables) {
            try {
                const { count, error } = await supabaseAdmin
                    .from(table)
                    .select('*', { count: 'exact', head: true })
                    .eq('business_id', businessId);

                tableStatus[table] = {
                    recordCount: error ? 0 : (count || 0),
                    hasData: !error && count > 0
                };
            } catch (tableError) {
                tableStatus[table] = {
                    recordCount: 0,
                    hasData: false,
                    error: tableError.message
                };
            }
        }

        // Get MongoDB collections info
        const mongoose = require('mongoose');
        const db = mongoose.connection.db;
        
        const mongoCollections = await db.listCollections({
            name: new RegExp(`^${businessId}_`)
        }).toArray();

        const mongoStatus = {};
        for (const collectionInfo of mongoCollections) {
            const collection = db.collection(collectionInfo.name);
            const count = await collection.countDocuments();
            mongoStatus[collectionInfo.name] = {
                recordCount: count,
                sheetName: collectionInfo.name.replace(`${businessId}_`, '')
            };
        }

        res.json({
            businessId,
            businessName: businesses.name,
            supabaseStatus: tableStatus,
            mongoStatus,
            hasMappedData: Object.values(tableStatus).some(status => status.hasData),
            totalMongoCollections: mongoCollections.length,
            totalSupabaseTables: Object.values(tableStatus).filter(status => status.hasData).length
        });

    } catch (error) {
        console.error('Error getting mapping status:', error);
        res.status(500).json({
            error: 'Failed to get mapping status',
            details: error.message
        });
    }
});



/**
 * DELETE /api/data/clear-mapped/:businessId
 * Clear all mapped data for a business from Supabase (for remapping)
 */
router.delete('/clear-mapped/:businessId', authenticateUser, async (req, res) => {
    try {
        const { businessId } = req.params;
        const userId = req.user.id;

        // Verify business ownership
        const { data: businesses, error: businessError } = await supabaseAdmin
            .from('businesses')
            .select('id, name')
            .eq('id', businessId)
            .eq('user_id', userId)
            .single();

        if (businessError || !businesses) {
            return res.status(403).json({
                error: 'Access denied or business not found'
            });
        }

        console.log(`Clearing mapped data for business: ${businessId}`);

        const tables = [
            'sales_order_items', 'purchase_order_items', // Delete items first (foreign keys)
            'sales_order', 'purchase_order', 'product', 'investment', 'investors_capital',
            'customer', 'supplier', 'investor', 'product_brand', 'product_category'
        ];

        const deletionResults = {};

        for (const table of tables) {
            try {
                const { count, error } = await supabaseAdmin
                    .from(table)
                    .delete()
                    .eq('business_id', businessId);

                deletionResults[table] = {
                    success: !error,
                    error: error?.message || null
                };

                if (error) {
                    console.error(`Error deleting from ${table}:`, error);
                } else {
                    console.log(`Cleared table: ${table}`);
                }
            } catch (deleteError) {
                deletionResults[table] = {
                    success: false,
                    error: deleteError.message
                };
            }
        }

        res.json({
            message: 'Data clearing completed',
            businessId,
            deletionResults
        });

    } catch (error) {
        console.error('Error clearing mapped data:', error);
        res.status(500).json({
            error: 'Failed to clear mapped data',
            details: error.message
        });
    }
});

module.exports = router;