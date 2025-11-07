const express = require('express');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { authenticateUser } = require('../middleware/auth');
const { supabaseAdmin } = require('../config/supabase');

const router = express.Router();

// Vector store directory
const vectorStoreDir = path.join(__dirname, '../vector_store');
if (!fs.existsSync(vectorStoreDir)) {
    fs.mkdirSync(vectorStoreDir, { recursive: true });
}

// Ollama API configuration
const OLLAMA_API_URL = 'http://localhost:11434/api/generate';
const OLLAMA_MODEL = 'martain7r/finance-llama-8b:q4_k_m';

// Helper function to get business vector store path
function getBusinessVectorStorePath(businessId) {
    return path.join(vectorStoreDir, `${businessId}.json`);
}

// Load business vector store
function loadVectorStore(businessId) {
    const storePath = getBusinessVectorStorePath(businessId);
    if (fs.existsSync(storePath)) {
        return JSON.parse(fs.readFileSync(storePath, 'utf-8'));
    }
    return null;
}

// Save business vector store
function saveVectorStore(businessId, store) {
    const storePath = getBusinessVectorStorePath(businessId);
    fs.writeFileSync(storePath, JSON.stringify(store, null, 2));
}

// Fetch all business data from Supabase and create vector store
async function createVectorStoreForBusiness(businessId) {
    try {
        console.log(`Creating vector store for business: ${businessId}`);
        
        // Fetch data from all tables related to the business
        const tables = [
            'product_category',
            'product_brand',
            'supplier',
            'customer',
            'investor',
            'investment',
            'investors_capital',
            'product',
            'purchase_order',
            'purchase_order_items',
            'sales_order',
            'sales_order_items'
        ];

        const businessData = {
            businessId: businessId,
            timestamp: new Date().toISOString(),
            tables: {}
        };

        // Fetch data from each table
        for (const tableName of tables) {
            try {
                const { data, error } = await supabaseAdmin
                    .from(tableName)
                    .select('*')
                    .eq('business_id', businessId);

                if (error) {
                    console.error(`Error fetching ${tableName}:`, error.message);
                    businessData.tables[tableName] = { error: error.message, data: [] };
                } else {
                    businessData.tables[tableName] = {
                        count: data.length,
                        data: data
                    };
                    console.log(`Fetched ${data.length} records from ${tableName}`);
                }
            } catch (err) {
                console.error(`Exception fetching ${tableName}:`, err.message);
                businessData.tables[tableName] = { error: err.message, data: [] };
            }
        }

        // Create text embeddings for context
        businessData.contextSummary = generateContextSummary(businessData);

        // Save vector store
        saveVectorStore(businessId, businessData);
        console.log(`Vector store created successfully for business: ${businessId}`);
        
        return businessData;
    } catch (error) {
        console.error('Error creating vector store:', error);
        throw error;
    }
}

// Generate a text summary of business data for context
function generateContextSummary(businessData) {
    const summary = [];
    
    summary.push(`Business Data Summary (${businessData.timestamp})`);
    summary.push('='.repeat(60));
    
    for (const [tableName, tableData] of Object.entries(businessData.tables)) {
        if (tableData.error) {
            summary.push(`\n${tableName}: Error - ${tableData.error}`);
        } else {
            summary.push(`\n${tableName}: ${tableData.count} records`);
            
            // Add sample data summary based on table type
            if (tableData.data.length > 0) {
                const sampleRecord = tableData.data[0];
                summary.push(`  Sample fields: ${Object.keys(sampleRecord).join(', ')}`);
                
                // Add specific insights based on table
                if (tableName === 'sales_order' && tableData.count > 0) {
                    const totalAmount = tableData.data.reduce((sum, order) => 
                        sum + parseFloat(order.total_amount || 0), 0);
                    summary.push(`  Total Sales Amount: ${totalAmount.toFixed(2)}`);
                }
                
                if (tableName === 'product' && tableData.count > 0) {
                    summary.push(`  Total Products: ${tableData.count}`);
                }
                
                if (tableName === 'customer' && tableData.count > 0) {
                    summary.push(`  Total Customers: ${tableData.count}`);
                }
            }
        }
    }
    
    return summary.join('\n');
}

// Build context from vector store for LLM
function buildContext(vectorStore, query) {
    const context = [];
    
    // Add general business context
    context.push("You are a business intelligence assistant analyzing data for a merchandising company.");
    context.push("\nAvailable Business Data:");
    context.push(vectorStore.contextSummary);
    
    // Add query-specific context
    context.push("\n\nUser Query:");
    context.push(query);
    
    // Add specific table data based on query keywords
    const queryLower = query.toLowerCase();
    
    if (queryLower.includes('sales') || queryLower.includes('revenue') || queryLower.includes('order')) {
        const salesData = vectorStore.tables.sales_order?.data || [];
        if (salesData.length > 0) {
            context.push("\n\nRecent Sales Orders:");
            salesData.slice(0, 10).forEach((order, idx) => {
                context.push(`${idx + 1}. Order #${order.sales_order_id}: $${order.total_amount} - ${order.status} (${order.order_date})`);
            });
        }
    }
    
    if (queryLower.includes('product') || queryLower.includes('inventory') || queryLower.includes('stock')) {
        const productData = vectorStore.tables.product?.data || [];
        if (productData.length > 0) {
            context.push("\n\nProduct Information:");
            productData.slice(0, 10).forEach((product, idx) => {
                context.push(`${idx + 1}. ${product.product_name}: $${product.selling_price} - ${product.status}`);
            });
        }
    }
    
    if (queryLower.includes('customer')) {
        const customerData = vectorStore.tables.customer?.data || [];
        if (customerData.length > 0) {
            context.push("\n\nCustomer Information:");
            context.push(`Total Customers: ${customerData.length}`);
            customerData.slice(0, 5).forEach((customer, idx) => {
                context.push(`${idx + 1}. ${customer.customer_name} - ${customer.customer_type}`);
            });
        }
    }
    
    if (queryLower.includes('supplier')) {
        const supplierData = vectorStore.tables.supplier?.data || [];
        if (supplierData.length > 0) {
            context.push("\n\nSupplier Information:");
            supplierData.forEach((supplier, idx) => {
                context.push(`${idx + 1}. ${supplier.supplier_name} - ${supplier.contact_person}`);
            });
        }
    }
    
    if (queryLower.includes('investment') || queryLower.includes('investor') || queryLower.includes('capital')) {
        const investorData = vectorStore.tables.investor?.data || [];
        const investmentData = vectorStore.tables.investment?.data || [];
        if (investorData.length > 0 || investmentData.length > 0) {
            context.push("\n\nInvestment & Capital Information:");
            context.push(`Total Investors: ${investorData.length}`);
            const totalInvestment = investmentData.reduce((sum, inv) => 
                sum + parseFloat(inv.investment_amount || 0), 0);
            context.push(`Total Investment: $${totalInvestment.toFixed(2)}`);
        }
    }
    
    context.push("\n\nProvide a clear, concise, and actionable response based on the data above.");
    
    return context.join('\n');
}

// Generate response using Ollama
async function generateWithOllama(prompt) {
    try {
        console.log('Sending request to Ollama...');
        const response = await axios.post(OLLAMA_API_URL, {
            model: OLLAMA_MODEL,
            prompt: prompt,
            stream: false
        }, {
            timeout: 600000 // 60 second timeout
        });
        
        return response.data.response;
    } catch (error) {
        console.error('Error calling Ollama API:', error.message);
        if (error.code === 'ECONNREFUSED') {
            throw new Error('Cannot connect to Ollama. Make sure Ollama is running on localhost:11434');
        }
        throw error;
    }
}

// POST /api/bizmind/chat - Main chat endpoint
router.post('/chat', authenticateUser, async (req, res) => {
    try {
        const { businessId, message } = req.body;
        const userId = req.user.id;

        if (!businessId || !message) {
            return res.status(400).json({ 
                error: 'Missing required fields: businessId and message' 
            });
        }

        // Verify business belongs to user
        const { data: business, error: businessError } = await supabaseAdmin
            .from('businesses')
            .select('*')
            .eq('id', businessId)
            .eq('user_id', userId)
            .single();

        if (businessError || !business) {
            return res.status(404).json({ 
                error: 'Business not found or access denied' 
            });
        }

        // Check if vector store exists
        let vectorStore = loadVectorStore(businessId);
        
        if (!vectorStore) {
            console.log(`Vector store not found for business ${businessId}. Creating...`);
            vectorStore = await createVectorStoreForBusiness(businessId);
        }

        // Build context from vector store
        const contextPrompt = buildContext(vectorStore, message);

        // Generate response using Ollama
        const aiResponse = await generateWithOllama(contextPrompt);

        res.json({
            success: true,
            message: message,
            response: aiResponse,
            businessId: businessId,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error in chat endpoint:', error);
        res.status(500).json({ 
            error: 'Failed to generate response',
            message: error.message 
        });
    }
});

// POST /api/bizmind/refresh-vector-store - Refresh vector store for a business
router.post('/refresh-vector-store', authenticateUser, async (req, res) => {
    try {
        const { businessId } = req.body;
        const userId = req.user.id;

        if (!businessId) {
            return res.status(400).json({ 
                error: 'Missing required field: businessId' 
            });
        }

        // Verify business belongs to user
        const { data: business, error: businessError } = await supabaseAdmin
            .from('businesses')
            .select('*')
            .eq('id', businessId)
            .eq('user_id', userId)
            .single();

        if (businessError || !business) {
            return res.status(404).json({ 
                error: 'Business not found or access denied' 
            });
        }

        // Create/refresh vector store
        const vectorStore = await createVectorStoreForBusiness(businessId);

        res.json({
            success: true,
            message: 'Vector store refreshed successfully',
            businessId: businessId,
            recordCounts: Object.entries(vectorStore.tables).reduce((acc, [table, data]) => {
                acc[table] = data.count || 0;
                return acc;
            }, {}),
            timestamp: vectorStore.timestamp
        });

    } catch (error) {
        console.error('Error refreshing vector store:', error);
        res.status(500).json({ 
            error: 'Failed to refresh vector store',
            message: error.message 
        });
    }
});

// GET /api/bizmind/vector-store-status/:businessId - Check vector store status
router.get('/vector-store-status/:businessId', authenticateUser, async (req, res) => {
    try {
        const { businessId } = req.params;
        const userId = req.user.id;

        // Verify business belongs to user
        const { data: business, error: businessError } = await supabaseAdmin
            .from('businesses')
            .select('*')
            .eq('id', businessId)
            .eq('user_id', userId)
            .single();

        if (businessError || !business) {
            return res.status(404).json({ 
                error: 'Business not found or access denied' 
            });
        }

        const vectorStore = loadVectorStore(businessId);

        if (!vectorStore) {
            return res.json({
                exists: false,
                businessId: businessId,
                message: 'Vector store does not exist. It will be created on first query.'
            });
        }

        res.json({
            exists: true,
            businessId: businessId,
            timestamp: vectorStore.timestamp,
            recordCounts: Object.entries(vectorStore.tables).reduce((acc, [table, data]) => {
                acc[table] = data.count || 0;
                return acc;
            }, {})
        });

    } catch (error) {
        console.error('Error checking vector store status:', error);
        res.status(500).json({ 
            error: 'Failed to check vector store status',
            message: error.message 
        });
    }
});

// DELETE /api/bizmind/vector-store/:businessId - Delete vector store
router.delete('/vector-store/:businessId', authenticateUser, async (req, res) => {
    try {
        const { businessId } = req.params;
        const userId = req.user.id;

        // Verify business belongs to user
        const { data: business, error: businessError } = await supabaseAdmin
            .from('businesses')
            .select('*')
            .eq('id', businessId)
            .eq('user_id', userId)
            .single();

        if (businessError || !business) {
            return res.status(404).json({ 
                error: 'Business not found or access denied' 
            });
        }

        const storePath = getBusinessVectorStorePath(businessId);
        
        if (fs.existsSync(storePath)) {
            fs.unlinkSync(storePath);
            return res.json({
                success: true,
                message: 'Vector store deleted successfully',
                businessId: businessId
            });
        } else {
            return res.json({
                success: true,
                message: 'Vector store does not exist',
                businessId: businessId
            });
        }

    } catch (error) {
        console.error('Error deleting vector store:', error);
        res.status(500).json({ 
            error: 'Failed to delete vector store',
            message: error.message 
        });
    }
});

module.exports = router;
