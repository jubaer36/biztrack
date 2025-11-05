/**
 * DataMapper Service - LLM-Powered Data Transformation Pipeline
 * 
 * This service uses Large Language Models (LLM) to intelligently map and transform
 * unstructured business data from MongoDB into a unified relational schema in Supabase.
 * 
 * Key Features:
 * - Multi-model fallback support (llama-3.3-70b, llama-3.1-70b, mixtral, gemma2)
 * - Automatic retry logic with exponential backoff
 * - Rule-based fallback when LLM fails
 * - Data validation and deduplication
 * - Batch processing for large datasets
 * - Comprehensive logging and error handling
 * - Support for Bengali/English mixed data
 * 
 * Pipeline Steps:
 * 1. Analyze collection structure and sample data
 * 2. LLM determines appropriate table mapping
 * 3. Transform documents according to mapping rules
 * 4. Validate and deduplicate records
 * 5. Migrate clean data to Supabase in batches
 * 
 * @requires @langchain/groq - For Groq LLM API integration
 * @requires mongoose - For MongoDB operations
 * @requires supabase - For PostgreSQL data storage
 * 
 * @author BizTrack Team
 * @version 2.0.0
 */

const { ChatGroq } = require('@langchain/groq');
const mongoose = require('mongoose');
const { supabaseAdmin } = require('../config/supabase');

class DataMapper {
    constructor() {
        // Progress tracking for frontend
        this.progress = {
            stage: '',
            step: '',
            percentage: 0,
            details: {},
            logs: []
        };
        
        // Callback for sending progress updates to frontend
        this.progressCallback = null;
        // Initialize Groq client with primary model
        this.groqClient = new ChatGroq({
            apiKey: process.env.GROQ_API_KEY,
            model: 'openai/gpt-oss-120b', // Fast and accurate for structured tasks
            temperature: 0.1, // Low temperature for consistent mapping
        });

        // Fallback model configuration
        // Using llama-3.3 as primary since openai/gpt-oss-120b had issues with schema compliance
        this.fallbackModels = [
            'openai/gpt-oss-120b',    // Primary - best balance of speed and accuracy
            'llama-3.1-70b-versatile',    // Fallback 1 - reliable alternative
            'mixtral-8x7b-32768',         // Fallback 2 - good for complex reasoning
            'gemma2-9b-it'                // Fallback 3 - lightweight option
        ];
        
        this.currentModelIndex = 0;
        this.maxRetries = 2;

        // Define unified schema structure for LLM reference
        // NOTE: This MUST match the actual Supabase database schema exactly
        // Schema is defined in: database/migrations/003_create_merchandising_schema.sql
        this.unifiedSchema = {
            product_category: ['business_id', 'category_id', 'category_name', 'description'],
            product_brand: ['business_id', 'brand_id', 'brand_name', 'description', 'unit_price'],
            supplier: ['business_id', 'supplier_id', 'supplier_name', 'contact_person', 'email', 'phone', 'address'],
            customer: ['business_id', 'customer_id', 'customer_name', 'email', 'phone', 'billing_address', 'shipping_address', 'customer_type'],
            investor: ['business_id', 'investor_id', 'investor_name', 'contact_person', 'email', 'phone', 'address', 'initial_investment_date', 'investment_terms', 'status'],
            investment: ['business_id', 'investment_id', 'investor_id', 'investment_amount', 'investment_date'],
            investors_capital: ['business_id', 'capital_id', 'investor_id', 'calculation_date', 'current_capital', 'total_invested', 'total_returned', 'net_capital', 'current_roi', 'profit_share_paid', 'last_profit_calculation_date', 'notes'],
            product: ['business_id', 'product_id', 'product_name', 'description', 'category_id', 'brand_id', 'supplier_id', 'price', 'selling_price', 'status', 'created_date', 'expense', 'stored_location'],
            purchase_order: ['business_id', 'purchase_order_id', 'supplier_id', 'order_date', 'delivery_date', 'status', 'total_amount', 'notes'],
            purchase_order_items: ['business_id', 'purchase_order_id', 'product_brand_id', 'quantity_ordered', 'unit_cost', 'line_total'],
            sales_order: ['business_id', 'sales_order_id', 'customer_id', 'order_date', 'status', 'total_amount', 'shipping_address', 'product_received_date'],
            sales_order_items: ['business_id', 'sales_order_id', 'product_id', 'line_total']
        };

        // Cash flow related keywords for prioritization
        this.cashFlowKeywords = [
            'amount', 'price', 'cost', 'total', 'revenue', 'income', 'expense', 'profit',
            'payment', 'cash', 'money', 'sale', 'purchase', 'investment', 'capital',
            'balance', 'debit', 'credit', 'transaction', 'billing', 'invoice'
        ];
    }

    /**
     * Log progress for both console and frontend
     */
    log(level, message, details = {}) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            details
        };

        // Console output with emoji indicators
        const emoji = {
            'info': 'ℹ️',
            'success': '✅',
            'warning': '⚠️',
            'error': '❌',
            'progress': '🔄',
            'data': '📊'
        };

        const prefix = emoji[level] || '•';
        console.log(`${prefix} [${level.toUpperCase()}] ${message}`);
        
        if (Object.keys(details).length > 0) {
            console.log('   Details:', JSON.stringify(details, null, 2));
        }

        // Store in logs array
        this.progress.logs.push(logEntry);

        // Keep only last 100 logs to avoid memory issues
        if (this.progress.logs.length > 100) {
            this.progress.logs.shift();
        }

        // Send to frontend if callback is set
        if (this.progressCallback) {
            this.progressCallback({
                ...this.progress,
                currentLog: logEntry
            });
        }
    }

    /**
     * Update progress for frontend tracking
     */
    updateProgress(stage, step, percentage, details = {}) {
        this.progress.stage = stage;
        this.progress.step = step;
        this.progress.percentage = percentage;
        this.progress.details = details;

        this.log('progress', `${stage}: ${step}`, details);
    }

    /**
     * Set callback for real-time progress updates
     */
    setProgressCallback(callback) {
        this.progressCallback = callback;
    }

    /**
     * Analyze MongoDB collection structure and sample data
     */
    async analyzeCollectionStructure(businessId, collectionName) {
        this.log('info', `Starting analysis of collection: ${collectionName}`);
        
        try {
            const db = mongoose.connection.db;
            const collection = db.collection(collectionName);

            this.log('progress', 'Fetching sample documents...', { collectionName });

            // Get total count first
            const totalDocuments = await collection.countDocuments();
            this.log('data', `Found ${totalDocuments} total documents`);

            // Get sample documents (first 5 rows)
            const sampleDocs = await collection.find({}).limit(5).toArray();

            if (sampleDocs.length === 0) {
                this.log('error', 'No data found in collection', { collectionName });
                throw new Error(`No data found in collection: ${collectionName}`);
            }

            this.log('success', `Retrieved ${sampleDocs.length} sample documents`);

            // Extract field names and sample values
            this.log('progress', 'Analyzing field structure...');
            const fieldAnalysis = this.extractFieldInfo(sampleDocs);

            const cashFlowFields = fieldAnalysis.filter(f => f.isCashFlowRelated).length;
            
            this.log('success', 'Field analysis complete', {
                totalFields: fieldAnalysis.length,
                cashFlowRelatedFields: cashFlowFields,
                fields: fieldAnalysis.map(f => ({
                    name: f.fieldName,
                    type: f.dataType,
                    cashFlow: f.isCashFlowRelated
                }))
            });

            const result = {
                collectionName,
                totalDocuments,
                sampleSize: sampleDocs.length,
                fields: fieldAnalysis,
                sampleData: sampleDocs
            };

            this.log('success', 'Collection analysis completed', {
                collection: collectionName,
                documents: totalDocuments,
                fields: fieldAnalysis.length
            });

            return result;

        } catch (error) {
            this.log('error', `Error analyzing collection: ${error.message}`, {
                collectionName,
                error: error.stack
            });
            throw error;
        }
    }

    /**
     * Extract field information from sample documents
     */
    extractFieldInfo(sampleDocs) {
        const fieldMap = new Map();

        sampleDocs.forEach(doc => {
            Object.entries(doc).forEach(([key, value]) => {
                if (key === '_id') return; // Skip MongoDB ObjectId

                if (!fieldMap.has(key)) {
                    fieldMap.set(key, {
                        fieldName: key,
                        dataType: this.inferDataType(value),
                        sampleValues: [],
                        isCashFlowRelated: this.isCashFlowField(key)
                    });
                }

                const fieldInfo = fieldMap.get(key);
                if (fieldInfo.sampleValues.length < 3 && value !== null && value !== undefined) {
                    fieldInfo.sampleValues.push(String(value).slice(0, 100)); // Limit length
                }
            });
        });

        return Array.from(fieldMap.values());
    }

    /**
     * Infer data type from value
     */
    inferDataType(value) {
        if (value === null || value === undefined) return 'unknown';
        if (typeof value === 'number') return 'numeric';
        if (typeof value === 'boolean') return 'boolean';
        if (value instanceof Date) return 'date';

        const strValue = String(value);

        // Check for date patterns
        if (this.isDateLike(strValue)) return 'date';

        // Check for numeric patterns
        if (this.isNumericLike(strValue)) return 'numeric';

        // Check for email patterns
        if (this.isEmailLike(strValue)) return 'email';

        // Check for phone patterns
        if (this.isPhoneLike(strValue)) return 'phone';

        return 'text';
    }

    /**
     * Check if field is related to cash flow
     */
    isCashFlowField(fieldName) {
        const lowerFieldName = fieldName.toLowerCase();
        return this.cashFlowKeywords.some(keyword =>
            lowerFieldName.includes(keyword)
        );
    }

    /**
     * Data type helper functions
     */
    isDateLike(str) {
        const datePatterns = [
            /^\d{4}-\d{2}-\d{2}/, // YYYY-MM-DD
            /^\d{2}\/\d{2}\/\d{4}/, // MM/DD/YYYY
            /^\d{2}-\d{2}-\d{4}/, // MM-DD-YYYY
        ];
        return datePatterns.some(pattern => pattern.test(str));
    }

    isNumericLike(str) {
        return /^-?\d+\.?\d*$/.test(str.replace(/[,$]/g, ''));
    }

    isEmailLike(str) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);
    }

    isPhoneLike(str) {
        return /^[\+]?[(]?[\d\s\-\(\)]{7,}$/.test(str);
    }

    /**
     * Use LLM to determine the most appropriate table mapping
     */
    async determineTableMapping(collectionAnalysis) {
        this.log('info', 'Starting LLM table mapping analysis');
        
        const prompt = this.createMappingPrompt(collectionAnalysis);
        
        for (let attempt = 0; attempt < this.maxRetries; attempt++) {
            try {
                const currentModel = this.fallbackModels[this.currentModelIndex];
                
                this.log('progress', `Querying LLM for table mapping`, {
                    model: currentModel,
                    attempt: attempt + 1,
                    maxRetries: this.maxRetries
                });
                
                // Update client with current model
                this.groqClient = new ChatGroq({
                    apiKey: process.env.GROQ_API_KEY,
                    model: currentModel,
                    temperature: 0.1,
                });

                const startTime = Date.now();
                const response = await this.groqClient.invoke([
                    {
                        role: 'system',
                        content: 'You are a data transformation expert for business intelligence systems. Always respond with valid JSON only. Do not include any explanatory text outside the JSON structure.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ]);
                const responseTime = Date.now() - startTime;

                this.log('success', `LLM response received in ${responseTime}ms`);
                this.log('progress', 'Parsing LLM response...');

                const mappingResult = this.parseLLMResponse(response.content);
                
                this.log('success', 'Table mapping determined successfully', {
                    model: currentModel,
                    responseTime: `${responseTime}ms`,
                    tablesDetected: mappingResult.tables.length,
                    tables: mappingResult.tables.map(t => ({
                        name: t.table_name,
                        confidence: t.confidence,
                        fieldMappings: t.field_mappings.length
                    })),
                    unmappedFields: mappingResult.unmapped_fields?.length || 0
                });

                return mappingResult;

            } catch (error) {
                this.log('error', `LLM request failed`, {
                    model: this.fallbackModels[this.currentModelIndex],
                    attempt: attempt + 1,
                    error: error.message
                });
                
                // Try next model on last attempt
                if (attempt === this.maxRetries - 1) {
                    this.currentModelIndex = (this.currentModelIndex + 1) % this.fallbackModels.length;
                    
                    // If we've tried all models, use fallback
                    if (this.currentModelIndex === 0) {
                        this.log('warning', 'All LLM models failed, switching to rule-based mapping');
                        return this.fallbackRuleBasedMapping(collectionAnalysis);
                    }
                }
                
                // Wait before retry
                const waitTime = 1000 * (attempt + 1);
                this.log('info', `Waiting ${waitTime}ms before retry...`);
                await this.sleep(waitTime);
            }
        }
        
        // Final fallback
        this.log('warning', 'Using rule-based fallback mapping');
        return this.fallbackRuleBasedMapping(collectionAnalysis);
    }

    /**
     * Sleep utility for retries
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Rule-based fallback mapping when LLM fails
     */
    fallbackRuleBasedMapping(collectionAnalysis) {
        const { fields, collectionName } = collectionAnalysis;
        
        console.log('Applying rule-based mapping fallback...');
        
        // Simple heuristic-based table detection
        let detectedTable = 'product'; // Default
        let confidence = 0.5;
        
        const fieldNames = fields.map(f => f.fieldName.toLowerCase());
        
        // Detection rules
        if (fieldNames.some(f => f.includes('customer') || f.includes('buyer'))) {
            detectedTable = 'customer';
            confidence = 0.7;
        } else if (fieldNames.some(f => f.includes('supplier') || f.includes('vendor'))) {
            detectedTable = 'supplier';
            confidence = 0.7;
        } else if (fieldNames.some(f => f.includes('sale') || f.includes('order'))) {
            detectedTable = 'sales_order';
            confidence = 0.65;
        } else if (fieldNames.some(f => f.includes('purchase'))) {
            detectedTable = 'purchase_order';
            confidence = 0.65;
        } else if (fieldNames.some(f => f.includes('product') || f.includes('item'))) {
            detectedTable = 'product';
            confidence = 0.6;
        }
        
        // Create basic field mappings
        const fieldMappings = fields.map(field => {
            const targetField = this.guessTargetField(field.fieldName, detectedTable);
            return {
                source_field: field.fieldName,
                target_field: targetField,
                confidence: 0.5,
                transformation_needed: field.dataType === 'date' ? 'date_format' : 'none'
            };
        }).filter(m => m.target_field);
        
        return {
            tables: [{
                table_name: detectedTable,
                confidence: confidence,
                reasoning: `Rule-based fallback mapping detected ${detectedTable} based on field names`,
                field_mappings: fieldMappings,
                relationships: []
            }],
            unmapped_fields: fields
                .filter(f => !fieldMappings.find(m => m.source_field === f.fieldName))
                .map(f => ({ field_name: f.fieldName, reason: 'No clear mapping found' }))
        };
    }

    /**
     * Guess target field based on source field name
     */
    guessTargetField(sourceName, tableName) {
        const lowerSource = sourceName.toLowerCase();
        const targetFields = this.unifiedSchema[tableName] || [];
        
        // Direct match
        if (targetFields.includes(lowerSource)) {
            return lowerSource;
        }
        
        // Fuzzy matching
        for (const targetField of targetFields) {
            const lowerTarget = targetField.toLowerCase();
            if (lowerSource.includes(lowerTarget) || lowerTarget.includes(lowerSource)) {
                return targetField;
            }
        }
        
        // Common patterns
        if (lowerSource.includes('name')) {
            const nameField = targetFields.find(f => f.includes('_name'));
            if (nameField) return nameField;
        }
        
        if (lowerSource.includes('price') || lowerSource.includes('amount') || lowerSource.includes('total')) {
            const priceField = targetFields.find(f => f.includes('price') || f.includes('amount') || f.includes('total'));
            if (priceField) return priceField;
        }
        
        return null;
    }

    /**
     * Create detailed prompt for LLM mapping analysis
     */
    createMappingPrompt(collectionAnalysis) {
        const { fields, sampleData, collectionName } = collectionAnalysis;

        const fieldDescriptions = fields.map(field =>
            `- ${field.fieldName} (${field.dataType}): Example values: [${field.sampleValues.join(', ')}]${field.isCashFlowRelated ? ' [💰 CASH_FLOW_RELATED]' : ''}`
        ).join('\n');

        const sampleDataStr = sampleData.slice(0, 3).map((doc, idx) => {
            const cleanDoc = { ...doc };
            delete cleanDoc._id;
            return `Sample ${idx + 1}:\n${JSON.stringify(cleanDoc, null, 2)}`;
        }).join('\n\n');

        // Create detailed schema listing for LLM
        const schemaListing = Object.entries(this.unifiedSchema)
            .map(([table, columns]) => `**${table}**: ${columns.filter(c => c !== 'business_id').join(', ')}`)
            .join('\n');

        return `You are an expert in data modeling and schema normalization for small and medium business systems in Bangladesh.

You are given:
1️⃣ A set of unstructured business data extracted from MongoDB.
2️⃣ A unified relational schema (target structure) for standardized business analytics.

Your job:
- Analyze the given fields and sample data.
- Identify which unified table(s) each field belongs to.
- Support **multi-table mappings** (e.g., a collection may include both supplier info and purchase orders).
- Suggest **relationship keys** (like supplier_id or product_id) when logical links are found.
- **CRITICAL**: You can ONLY use column names from the schema below. DO NOT invent new column names.

---
### ALLOWED SCHEMA TABLES AND COLUMNS

${schemaListing}

**IMPORTANT RULES:**
1. You can ONLY map to columns listed above. 
2. DO NOT create or suggest columns like 'cost_price', 'base_cost', 'profit_amount', 'total_revenue', 'stock_quantity', 'return_on_investment', etc. - these DO NOT EXIST.
3. If a source field doesn't fit any existing column, mark it as unmapped.
4. 'business_id' is automatically added - do NOT include it in mappings.
5. For ID fields: use INTEGER for auto-increment IDs, VARCHAR(100) for product_id only.

---
### Table Descriptions

**product_category:** Defines high-level product groupings (e.g., Electronics, Groceries).  
**product_brand:** Represents product brands (e.g., Nestlé, Unilever). Has unit_price for brand-level pricing.
**supplier:** Vendor providing products.  
**customer:** Buyer or client of the business.  
**investor:** Party investing in the company.  
**investment:** Tracks monetary contributions from investors.  
**investors_capital:** Periodic financial record of investor capital and returns.  
**product:** Specific item sold. Has 'price' (cost) and 'selling_price' (retail price), plus 'expense' for additional costs.  
**purchase_order:** Records business purchases from suppliers.  
**purchase_order_items:** Line items within a purchase order.  
**sales_order:** Customer sales transactions.  
**sales_order_items:** Line items sold within a sales order.

---
### Collection Under Analysis

Collection Name: ${collectionName}  
Document Count: ${collectionAnalysis.totalDocuments}

### Field Summary:
${fieldDescriptions}

### Sample Documents:
${sampleDataStr}

---
### Instructions for Output

- Identify **all applicable tables** (can be more than one).
- For each table, provide:
  - A confidence score.
  - Reasoning for the match.
  - Field mapping list.
- If a field could map to multiple tables, show best guess and rationale.
- If no clear fit, mark “unmapped”.

---
### Output Format (STRICT JSON)

{
  "tables": [
    {
      "table_name": "sales_order",
      "confidence": 0.92,
      "reasoning": "Contains fields like order_date, total_amount, and customer_id which match the sales order entity.",
      "field_mappings": [
        { "source_field": "Order Date", "target_field": "order_date", "confidence": 0.95 },
        { "source_field": "Customer Name", "target_field": "customer_id", "confidence": 0.85 },
        { "source_field": "Total", "target_field": "total_amount", "confidence": 0.9 }
      ],
      "relationships": [
        { "related_table": "customer", "relationship_type": "foreign_key", "key": "customer_id" }
      ]
    },
    {
      "table_name": "sales_order_items",
      "confidence": 0.88,
      "reasoning": "Fields like product, quantity, and price suggest order line items.",
      "field_mappings": [
        { "source_field": "Product", "target_field": "product_id", "confidence": 0.9 },
        { "source_field": "Quantity", "target_field": "quantity_ordered", "confidence": 0.9 },
        { "source_field": "Price", "target_field": "unit_cost", "confidence": 0.9 }
      ]
    }
  ],
  "unmapped_fields": [
    { "field_name": "Note", "reason": "Irrelevant or free-text not tied to analytics" }
  ]
}

CRITICAL: Return ONLY the JSON object above. Do not include explanatory text, markdown formatting, or code blocks.`;
    }


    /**
     * Parse LLM response and extract mapping information
     */
    parseLLMResponse(responseContent) {
        try {
            console.log('Raw LLM Response (first 500 chars):', responseContent.substring(0, 500));
            
            // Clean response - remove markdown code blocks if present
            let cleanedContent = responseContent.trim();
            cleanedContent = cleanedContent.replace(/```json\s*/g, '');
            cleanedContent = cleanedContent.replace(/```\s*/g, '');
            
            // Extract JSON object
            const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                console.error('No JSON found in LLM response');
                throw new Error('No JSON found in LLM response');
            }

            const result = JSON.parse(jsonMatch[0]);

            if (!result.tables || !Array.isArray(result.tables)) {
                throw new Error('Response missing tables array');
            }

            // Validate that tables are in unified schema
            const validTables = result.tables.filter(t =>
                Object.keys(this.unifiedSchema).includes(t.table_name)
            );

            if (validTables.length === 0) {
                console.warn('No valid tables detected in LLM response');
                console.warn('Detected table names:', result.tables.map(t => t.table_name));
                console.warn('Valid schema tables:', Object.keys(this.unifiedSchema));
            }

            result.tables = validTables;

            // Validate and filter field mappings to only include valid columns
            result.tables.forEach(table => {
                if (!table.field_mappings) {
                    table.field_mappings = [];
                }
                if (!table.relationships) {
                    table.relationships = [];
                }

                // Get valid columns for this table
                const validColumns = this.unifiedSchema[table.table_name] || [];
                
                // Filter out invalid target fields
                const originalCount = table.field_mappings.length;
                table.field_mappings = table.field_mappings.filter(mapping => {
                    const isValid = validColumns.includes(mapping.target_field);
                    if (!isValid) {
                        console.warn(`⚠️  Removing invalid mapping: ${mapping.source_field} → ${mapping.target_field} (column does not exist in ${table.table_name})`);
                        
                        // Add to unmapped fields
                        if (!result.unmapped_fields) {
                            result.unmapped_fields = [];
                        }
                        result.unmapped_fields.push({
                            field_name: mapping.source_field,
                            reason: `LLM suggested non-existent column '${mapping.target_field}' in table '${table.table_name}'`
                        });
                    }
                    return isValid;
                });

                const removedCount = originalCount - table.field_mappings.length;
                if (removedCount > 0) {
                    console.warn(`⚠️  Removed ${removedCount} invalid field mappings from ${table.table_name}`);
                }
            });

            // Remove tables with no valid mappings
            const tablesBeforeFilter = result.tables.length;
            result.tables = result.tables.filter(t => t.field_mappings.length > 0);
            if (result.tables.length < tablesBeforeFilter) {
                console.warn(`⚠️  Removed ${tablesBeforeFilter - result.tables.length} tables with no valid field mappings`);
            }

            if (!result.unmapped_fields) {
                result.unmapped_fields = [];
            }

            return result;

        } catch (error) {
            console.error('Error parsing LLM response:', error.message);
            console.error('Response content:', responseContent.substring(0, 1000));
            
            throw new Error(`Failed to parse LLM response: ${error.message}`);
        }
    }


    /**
     * Process and migrate data to Supabase based on LLM mapping results
     * This is where the actual data transformation and storage happens
     */
    async migrateDataToSupabase(businessId, collectionName, mappingResult) {
        this.log('info', 'Starting data migration to Supabase', {
            collection: collectionName,
            businessId,
            targetTables: mappingResult.tables.length
        });

        try {
            const db = mongoose.connection.db;
            const collection = db.collection(collectionName);
            
            this.log('progress', 'Loading documents from MongoDB...');
            const allDocs = await collection.find({}).toArray();

            if (allDocs.length === 0) {
                this.log('warning', 'No documents found in collection', { collectionName });
                return [];
            }

            this.log('success', `Loaded ${allDocs.length} documents from MongoDB`);

            const results = [];
            let tableIndex = 0;

            for (const tableMapping of mappingResult.tables) {
                tableIndex++;
                this.log('info', `Processing table ${tableIndex}/${mappingResult.tables.length}: ${tableMapping.table_name}`, {
                    tableName: tableMapping.table_name,
                    fieldMappings: tableMapping.field_mappings.length,
                    confidence: tableMapping.confidence
                });

                // Transform documents
                this.log('progress', 'Transforming documents...');
                const transformedDocs = allDocs
                    .map((doc, idx) => {
                        if ((idx + 1) % 25 === 0) {
                            this.log('progress', `Transforming progress: ${idx + 1}/${allDocs.length} documents`);
                        }
                        return this.transformDocument(doc, {
                            primary_table: tableMapping.table_name,
                            field_mappings: tableMapping.field_mappings
                        }, businessId);
                    })
                    .filter(Boolean);

                this.log('success', `Transformed ${transformedDocs.length}/${allDocs.length} documents`);

                if (transformedDocs.length === 0) {
                    this.log('warning', 'No valid documents after transformation', {
                        table: tableMapping.table_name
                    });
                    continue;
                }

                // Validate and deduplicate
                this.log('progress', 'Validating and deduplicating records...');
                const cleanDocs = this.validateAndDeduplicate(transformedDocs, tableMapping.table_name);
                
                const duplicatesRemoved = transformedDocs.length - cleanDocs.length;
                this.log('success', 'Validation complete', {
                    totalRecords: transformedDocs.length,
                    cleanRecords: cleanDocs.length,
                    duplicatesRemoved,
                    validationRate: `${((cleanDocs.length / transformedDocs.length) * 100).toFixed(1)}%`
                });

                if (cleanDocs.length === 0) {
                    this.log('warning', 'No clean documents after validation', {
                        table: tableMapping.table_name
                    });
                    continue;
                }

                // Insert in batches to avoid timeout
                const batchSize = 100;
                let insertedCount = 0;
                let errors = [];
                const totalBatches = Math.ceil(cleanDocs.length / batchSize);

                this.log('info', `Inserting ${cleanDocs.length} records in ${totalBatches} batches`);

                for (let i = 0; i < cleanDocs.length; i += batchSize) {
                    const batch = cleanDocs.slice(i, i + batchSize);
                    const batchNum = Math.floor(i / batchSize) + 1;
                    
                    try {
                        this.log('progress', `Inserting batch ${batchNum}/${totalBatches}...`, {
                            batchSize: batch.length,
                            table: tableMapping.table_name
                        });

                        const { data, error } = await supabaseAdmin
                            .from(tableMapping.table_name)
                            .insert(batch)
                            .select();

                        if (error) {
                            this.log('error', `Batch ${batchNum} insertion failed`, {
                                batch: batchNum,
                                error: error.message,
                                code: error.code,
                                details: error.details
                            });
                            errors.push(error);
                        } else {
                            insertedCount += batch.length;
                            this.log('success', `Batch ${batchNum}/${totalBatches} inserted successfully`, {
                                recordsInserted: batch.length,
                                totalInserted: insertedCount
                            });
                        }
                    } catch (batchError) {
                        this.log('error', `Batch ${batchNum} insertion exception`, {
                            batch: batchNum,
                            error: batchError.message
                        });
                        errors.push(batchError);
                    }
                }

                const tableResult = {
                    table: tableMapping.table_name,
                    success: errors.length === 0,
                    totalTransformed: transformedDocs.length,
                    cleanCount: cleanDocs.length,
                    insertedCount: insertedCount,
                    errors: errors.length > 0 ? errors : undefined
                };

                this.log(errors.length === 0 ? 'success' : 'warning', 
                    `Table ${tableMapping.table_name} migration ${errors.length === 0 ? 'completed' : 'completed with errors'}`, 
                    {
                        inserted: insertedCount,
                        total: cleanDocs.length,
                        successRate: `${((insertedCount / cleanDocs.length) * 100).toFixed(1)}%`,
                        errors: errors.length
                    }
                );

                results.push(tableResult);
            }

            return results;
        } catch (err) {
            console.error('Error migrating multi-table data:', err);
            throw err;
        }
    }

    /**
     * Validate and deduplicate transformed documents
     */
    validateAndDeduplicate(documents, tableName) {
        if (!documents || documents.length === 0) return [];

        const validDocs = [];
        const seenKeys = new Set();

        for (const doc of documents) {
            // Validate required fields
            if (!this.validateDocument(doc, tableName)) {
                continue;
            }

            // Generate deduplication key
            const dedupKey = this.generateDeduplicationKey(doc, tableName);
            
            if (seenKeys.has(dedupKey)) {
                console.log(`Duplicate detected and skipped: ${dedupKey}`);
                continue;
            }

            seenKeys.add(dedupKey);
            validDocs.push(doc);
        }

        return validDocs;
    }

    /**
     * Validate document has required fields
     */
    validateDocument(doc, tableName) {
        // Must have business_id
        if (!doc.business_id) {
            console.warn(`Document missing business_id, skipping`);
            return false;
        }

        // Check table-specific required fields
        const requiredFields = {
            'product': ['product_id'],
            'customer': ['customer_id'],
            'supplier': ['supplier_id'],
            'sales_order': ['sales_order_id'],
            'purchase_order': ['purchase_order_id'],
            'investor': ['investor_id'],
            'investment': ['investment_id', 'investor_id'],
            'product_category': ['category_id'],
            'product_brand': ['brand_id']
        };

        const required = requiredFields[tableName] || [];
        
        for (const field of required) {
            if (!doc[field]) {
                console.warn(`Document missing required field '${field}' for table ${tableName}`);
                return false;
            }
        }

        return true;
    }

    /**
     * Generate deduplication key for document
     */
    generateDeduplicationKey(doc, tableName) {
        // Use primary key or combination of identifying fields
        const keyFields = {
            'product': ['product_name', 'brand_id', 'supplier_id'],
            'customer': ['customer_name', 'email', 'phone'],
            'supplier': ['supplier_name', 'email'],
            'sales_order': ['customer_id', 'order_date', 'total_amount'],
            'purchase_order': ['supplier_id', 'order_date', 'total_amount'],
            'investor': ['investor_name', 'email'],
            'investment': ['investor_id', 'investment_date', 'investment_amount']
        };

        const fields = keyFields[tableName] || ['id'];
        const values = fields.map(f => doc[f] || '').filter(Boolean);
        
        return `${tableName}:${values.join('|')}`;
    }


    /**
     * Transform a single document based on mapping rules
     */
    transformDocument(sourceDoc, mappingResult, businessId) {
        try {
            const transformedDoc = {
                business_id: businessId // Add business ID to all records (should be UUID)
            };

            console.log(`Transforming document for business: ${businessId}, table: ${mappingResult.primary_table}`);

            mappingResult.field_mappings.forEach(mapping => {
                if (mapping.skip || !mapping.target_field) return;

                const sourceValue = sourceDoc[mapping.source_field];
                if (sourceValue === undefined || sourceValue === null) return;

                // Apply transformations based on target field type
                let transformedValue = this.applyFieldTransformation(
                    sourceValue,
                    mapping.target_field,
                    mapping.transformation_needed
                );

                if (transformedValue !== null && transformedValue !== undefined) {
                    transformedDoc[mapping.target_field] = transformedValue;
                }
            });

            // Generate IDs if needed
            this.generateRequiredIds(transformedDoc, mappingResult.primary_table);

            // Add timestamps
            if (mappingResult.primary_table === 'product' && !transformedDoc.created_date) {
                transformedDoc.created_date = new Date().toISOString();
            }

            // Validate that we have more than just business_id
            const fieldsCount = Object.keys(transformedDoc).length;
            if (fieldsCount <= 1) {
                console.warn('Transformed document only has business_id, skipping...');
                return null;
            }

            console.log(`Transformed document has ${fieldsCount} fields`);
            return transformedDoc;

        } catch (error) {
            console.error('Error transforming document:', error, sourceDoc);
            return null;
        }
    }

    /**
     * Apply field-specific transformations
     */
    applyFieldTransformation(value, targetField, transformationNeeded) {
        try {
            let transformedValue = value;

            // Convert to string for processing
            const stringValue = String(value).trim();

            // Handle different field types
            if (targetField.includes('_id') && targetField !== 'business_id') {
                // Generate or extract IDs
                transformedValue = this.generateIdFromValue(stringValue);
            } else if (targetField.includes('price') || targetField.includes('amount') ||
                targetField.includes('cost') || targetField.includes('total')) {
                // Handle monetary fields
                transformedValue = this.parseMonetaryValue(stringValue);
            } else if (targetField.includes('date')) {
                // Handle date fields
                transformedValue = this.parseDateValue(stringValue);
            } else if (targetField.includes('email')) {
                // Validate email
                transformedValue = this.isEmailLike(stringValue) ? stringValue.toLowerCase() : null;
            } else if (targetField.includes('phone')) {
                // Clean phone number
                transformedValue = this.cleanPhoneNumber(stringValue);
            } else if (targetField.includes('quantity')) {
                // Handle quantity fields
                transformedValue = this.parseNumericValue(stringValue);
            }

            return transformedValue;

        } catch (error) {
            console.error(`Error transforming value ${value} for field ${targetField}:`, error);
            return null;
        }
    }

    /**
     * Generate IDs from values
     */
    generateIdFromValue(value) {
        if (this.isNumericLike(value)) {
            const numValue = parseInt(value);
            // Ensure it's within PostgreSQL INTEGER range (-2147483648 to 2147483647)
            if (numValue >= -2147483648 && numValue <= 2147483647) {
                return numValue;
            }
            // If too large, hash it to get a smaller value
            console.warn(`⚠️  ID value ${numValue} exceeds PostgreSQL INTEGER range, generating hash`);
        }
        
        // Generate hash-based ID for non-numeric values or out-of-range numbers
        let hash = 0;
        const str = String(value);
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        
        // Ensure positive and within safe range
        const result = Math.abs(hash) % 2147483647;
        return result;
    }

    /**
     * Parse monetary values
     */
    parseMonetaryValue(value) {
        if (typeof value === 'number') return value;
        const cleanValue = String(value).replace(/[,$\s]/g, '');
        const parsed = parseFloat(cleanValue);
        return isNaN(parsed) ? null : parsed;
    }

    /**
     * Parse date values
     */
    parseDateValue(value) {
        if (value instanceof Date) return value.toISOString();
        try {
            const date = new Date(value);
            return isNaN(date.getTime()) ? null : date.toISOString();
        } catch {
            return null;
        }
    }

    /**
     * Parse numeric values
     */
    parseNumericValue(value) {
        if (typeof value === 'number') return value;
        const parsed = parseInt(String(value).replace(/[^\d]/g, ''));
        return isNaN(parsed) ? null : parsed;
    }

    /**
     * Clean phone numbers
     */
    cleanPhoneNumber(value) {
        return String(value).replace(/[^\d+]/g, '');
    }

    /**
     * Generate required IDs for tables
     */
    generateRequiredIds(doc, tableName) {
        const primaryKeys = {
            'product_category': 'category_id',
            'product_brand': 'brand_id',
            'supplier': 'supplier_id',
            'customer': 'customer_id',
            'investor': 'investor_id',
            'investment': 'investment_id',
            'investors_capital': 'capital_id',
            'product': 'product_id',
            'purchase_order': 'purchase_order_id',
            'sales_order': 'sales_order_id'
        };

        const primaryKey = primaryKeys[tableName];
        if (primaryKey && !doc[primaryKey]) {
            if (primaryKey === 'product_id') {
                // Generate string ID for products (VARCHAR type)
                doc[primaryKey] = `PROD_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            } else {
                // Generate numeric ID for others (within INTEGER range)
                // Use a counter-based approach instead of timestamp to avoid overflow
                const baseId = Math.floor(Math.random() * 1000000); // 1-1,000,000 range
                const randomSuffix = Math.floor(Math.random() * 1000);
                doc[primaryKey] = baseId + randomSuffix;
            }
        }
    }

    /**
     * Main method to orchestrate the entire mapping process
     */
    async processBusinessData(businessId) {
        const startTime = Date.now();
        
        // Reset progress
        this.progress = {
            stage: 'Initialization',
            step: 'Starting pipeline',
            percentage: 0,
            details: {},
            logs: []
        };
        
        try {
            this.log('info', '═══════════════════════════════════════════════════════════════════════════════');
            this.log('info', 'DATA TRANSFORMATION PIPELINE STARTED', {
                businessId,
                timestamp: new Date().toISOString()
            });
            this.log('info', '═══════════════════════════════════════════════════════════════════════════════');

            // Get all MongoDB collections for this business
            this.updateProgress('Initialization', 'Discovering collections', 5);
            
            const db = mongoose.connection.db;
            const collections = await db.listCollections({
                name: new RegExp(`^${businessId}_`)
            }).toArray();

            if (collections.length === 0) {
                this.log('error', 'No collections found for business', { businessId });
                throw new Error(`No collections found for business: ${businessId}`);
            }

            this.log('success', `Found ${collections.length} collections to process`, {
                collections: collections.map(c => c.name)
            });

            const results = [];
            let totalRecordsProcessed = 0;
            let totalRecordsInserted = 0;

            for (let i = 0; i < collections.length; i++) {
                const collectionInfo = collections[i];
                const collectionStartTime = Date.now();
                const collectionProgress = ((i / collections.length) * 85) + 10; // 10-95% for collections
                
                try {
                    this.log('info', '───────────────────────────────────────────────────────────────────────────────');
                    this.log('info', `PROCESSING COLLECTION ${i + 1}/${collections.length}`, {
                        collection: collectionInfo.name,
                        progress: `${i + 1}/${collections.length}`
                    });
                    this.log('info', '───────────────────────────────────────────────────────────────────────────────');

                    // 1. Analyze collection structure
                    this.updateProgress(
                        `Collection ${i + 1}/${collections.length}`, 
                        'Step 1/3: Analyzing structure', 
                        collectionProgress,
                        { collection: collectionInfo.name }
                    );
                    
                    const analysis = await this.analyzeCollectionStructure(businessId, collectionInfo.name);
                    
                    this.log('data', 'Analysis Summary', {
                        documents: analysis.totalDocuments,
                        fields: analysis.fields.length,
                        cashFlowFields: analysis.fields.filter(f => f.isCashFlowRelated).length
                    });

                    // 2. Use LLM to determine mapping
                    this.updateProgress(
                        `Collection ${i + 1}/${collections.length}`, 
                        'Step 2/3: Determining mappings with LLM', 
                        collectionProgress + 5,
                        { collection: collectionInfo.name }
                    );
                    
                    const mapping = await this.determineTableMapping(analysis);
                    
                    this.log('data', 'Mapping Summary', {
                        targetTables: mapping.tables.map(t => t.table_name).join(', '),
                        tablesCount: mapping.tables.length,
                        unmappedFields: mapping.unmapped_fields?.length || 0
                    });

                    // 3. Migrate data to Supabase
                    this.updateProgress(
                        `Collection ${i + 1}/${collections.length}`, 
                        'Step 3/3: Migrating data to database', 
                        collectionProgress + 10,
                        { collection: collectionInfo.name }
                    );
                    
                    const migration = await this.migrateDataToSupabase(businessId, collectionInfo.name, mapping);
                    
                    const collectionTime = ((Date.now() - collectionStartTime) / 1000).toFixed(2);
                    
                    // Calculate totals
                    const collectionInserted = migration.reduce((sum, m) => sum + (m.insertedCount || 0), 0);
                    totalRecordsProcessed += analysis.totalDocuments;
                    totalRecordsInserted += collectionInserted;

                    this.log('success', `Collection processed successfully in ${collectionTime}s`, {
                        collection: collectionInfo.name,
                        recordsInserted: collectionInserted,
                        totalRecords: analysis.totalDocuments,
                        insertionRate: `${((collectionInserted / analysis.totalDocuments) * 100).toFixed(1)}%`,
                        processingTime: `${collectionTime}s`
                    });

                    results.push({
                        collection: collectionInfo.name,
                        analysis,
                        mapping,
                        migration,
                        processingTime: collectionTime,
                        recordsInserted: collectionInserted,
                        totalRecords: analysis.totalDocuments,
                        success: true
                    });

                } catch (collectionError) {
                    this.log('error', `Failed to process collection: ${collectionInfo.name}`, {
                        error: collectionError.message,
                        stack: collectionError.stack
                    });
                    
                    results.push({
                        collection: collectionInfo.name,
                        error: collectionError.message,
                        stack: collectionError.stack,
                        success: false
                    });
                }
            }

            const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
            const successCount = results.filter(r => r.success).length;
            const failedCount = results.filter(r => !r.success).length;
            const successRate = totalRecordsProcessed > 0 
                ? ((totalRecordsInserted / totalRecordsProcessed) * 100).toFixed(1) 
                : 0;

            this.updateProgress('Complete', 'Pipeline finished', 100, {
                totalTime: `${totalTime}s`,
                successCount,
                failedCount
            });

            this.log('info', '═══════════════════════════════════════════════════════════════════════════════');
            this.log('success', 'TRANSFORMATION PIPELINE COMPLETE', {
                totalTime: `${totalTime}s`,
                collectionsProcessed: successCount,
                collectionsFailed: failedCount,
                totalCollections: collections.length,
                recordsProcessed: totalRecordsProcessed,
                recordsInserted: totalRecordsInserted,
                successRate: `${successRate}%`
            });
            this.log('info', '═══════════════════════════════════════════════════════════════════════════════');

            // Detailed summary by collection
            this.log('data', 'Collection Summary', {
                collections: results.map(r => ({
                    name: r.collection,
                    success: r.success,
                    records: r.success ? `${r.recordsInserted}/${r.totalRecords}` : 'failed',
                    time: r.processingTime ? `${r.processingTime}s` : 'n/a',
                    error: r.error || null
                }))
            });

            const finalResult = {
                businessId,
                totalCollections: collections.length,
                processedCollections: successCount,
                failedCollections: failedCount,
                totalRecordsProcessed,
                totalRecordsInserted,
                successRate,
                processingTime: totalTime,
                results,
                logs: this.progress.logs // Include all logs for frontend
            };

            this.log('success', 'Pipeline result prepared for frontend', {
                logsCount: this.progress.logs.length
            });

            return finalResult;

        } catch (error) {
            this.log('error', 'CRITICAL ERROR in data processing pipeline', {
                error: error.message,
                stack: error.stack
            });
            
            throw error;
        }
    }
}

module.exports = DataMapper;