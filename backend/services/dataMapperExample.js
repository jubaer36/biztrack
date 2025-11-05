/**
 * DataMapper Usage Example
 * 
 * This file demonstrates how to use the enhanced DataMapper service
 * for transforming unstructured business data into unified schema.
 */

const DataMapper = require('./dataMapper');
const mongoose = require('mongoose');

// Example 1: Process all collections for a business
async function processAllBusinessData() {
    try {
        console.log('Example 1: Processing all business data\n');
        
        const mapper = new DataMapper();
        const businessId = 'your-business-uuid-here';
        
        const result = await mapper.processBusinessData(businessId);
        
        // Display summary
        console.log('\n=== Processing Summary ===');
        console.log(`Business ID: ${result.businessId}`);
        console.log(`Collections: ${result.processedCollections}/${result.totalCollections}`);
        console.log(`Records Processed: ${result.totalRecordsProcessed}`);
        console.log(`Records Inserted: ${result.totalRecordsInserted}`);
        console.log(`Success Rate: ${result.successRate}%`);
        console.log(`Total Time: ${result.processingTime}s`);
        
        // Display per-collection results
        console.log('\n=== Collection Details ===');
        result.results.forEach((collectionResult, idx) => {
            console.log(`\n${idx + 1}. ${collectionResult.collection}`);
            
            if (collectionResult.success) {
                console.log(`   ✓ Success`);
                console.log(`   Tables: ${collectionResult.mapping.tables.map(t => t.table_name).join(', ')}`);
                console.log(`   Time: ${collectionResult.processingTime}s`);
                
                collectionResult.migration.forEach(m => {
                    console.log(`   - ${m.table}: ${m.insertedCount}/${m.totalTransformed} records`);
                });
            } else {
                console.log(`   ✗ Failed: ${collectionResult.error}`);
            }
        });
        
        return result;
        
    } catch (error) {
        console.error('Error in processAllBusinessData:', error);
        throw error;
    }
}

// Example 2: Process a single collection
async function processSingleCollection() {
    try {
        console.log('Example 2: Processing single collection\n');
        
        const mapper = new DataMapper();
        const businessId = 'your-business-uuid-here';
        const collectionName = `${businessId}_sales_data`;
        
        // Step 1: Analyze
        console.log('Step 1: Analyzing collection...');
        const analysis = await mapper.analyzeCollectionStructure(businessId, collectionName);
        console.log(`✓ Found ${analysis.totalDocuments} documents with ${analysis.fields.length} fields`);
        
        // Step 2: Determine mapping
        console.log('\nStep 2: Determining mapping...');
        const mapping = await mapper.determineTableMapping(analysis);
        console.log(`✓ Mapped to tables: ${mapping.tables.map(t => t.table_name).join(', ')}`);
        
        // Step 3: Migrate
        console.log('\nStep 3: Migrating data...');
        const migration = await mapper.migrateDataToSupabase(businessId, collectionName, mapping);
        console.log('✓ Migration complete');
        
        migration.forEach(m => {
            console.log(`  ${m.table}: ${m.insertedCount} records inserted`);
        });
        
        return { analysis, mapping, migration };
        
    } catch (error) {
        console.error('Error in processSingleCollection:', error);
        throw error;
    }
}

// Example 3: Test LLM mapping only (no data migration)
async function testMappingOnly() {
    try {
        console.log('Example 3: Testing LLM mapping only\n');
        
        const mapper = new DataMapper();
        
        // Sample data structure to test
        const testAnalysis = {
            collectionName: 'test_sales',
            totalDocuments: 5,
            sampleSize: 3,
            fields: [
                { fieldName: 'Order Date', dataType: 'date', sampleValues: ['2025-01-15'], isCashFlowRelated: false },
                { fieldName: 'Customer Name', dataType: 'text', sampleValues: ['John Doe'], isCashFlowRelated: false },
                { fieldName: 'Total Amount', dataType: 'numeric', sampleValues: ['5000.00'], isCashFlowRelated: true },
                { fieldName: 'Product', dataType: 'text', sampleValues: ['Widget A'], isCashFlowRelated: false },
                { fieldName: 'Quantity', dataType: 'numeric', sampleValues: ['10'], isCashFlowRelated: false }
            ],
            sampleData: [
                {
                    'Order Date': '2025-01-15',
                    'Customer Name': 'John Doe',
                    'Total Amount': 5000.00,
                    'Product': 'Widget A',
                    'Quantity': 10
                }
            ]
        };
        
        const mapping = await mapper.determineTableMapping(testAnalysis);
        
        console.log('=== Mapping Result ===');
        console.log(JSON.stringify(mapping, null, 2));
        
        return mapping;
        
    } catch (error) {
        console.error('Error in testMappingOnly:', error);
        throw error;
    }
}

// Example 4: Test with different model configurations
async function testWithCustomModels() {
    try {
        console.log('Example 4: Testing with custom model configuration\n');
        
        const mapper = new DataMapper();
        
        // Override model configuration
        mapper.fallbackModels = [
            'mixtral-8x7b-32768',     // Try Mixtral first
            'llama-3.3-70b-versatile' // Then Llama
        ];
        mapper.maxRetries = 2; // Fewer retries
        
        const businessId = 'your-business-uuid-here';
        const result = await mapper.processBusinessData(businessId);
        
        console.log(`Processed with custom models: ${result.successRate}% success rate`);
        
        return result;
        
    } catch (error) {
        console.error('Error in testWithCustomModels:', error);
        throw error;
    }
}

// Example 5: Monitor processing with real-time updates
async function processWithMonitoring() {
    try {
        console.log('Example 5: Processing with monitoring\n');
        
        const mapper = new DataMapper();
        const businessId = 'your-business-uuid-here';
        
        // Get collection list first
        const db = mongoose.connection.db;
        const collections = await db.listCollections({
            name: new RegExp(`^${businessId}_`)
        }).toArray();
        
        console.log(`Found ${collections.length} collections to process`);
        
        const results = [];
        
        for (let i = 0; i < collections.length; i++) {
            const collectionInfo = collections[i];
            console.log(`\nProcessing ${i + 1}/${collections.length}: ${collectionInfo.name}`);
            
            try {
                const analysis = await mapper.analyzeCollectionStructure(businessId, collectionInfo.name);
                const mapping = await mapper.determineTableMapping(analysis);
                const migration = await mapper.migrateDataToSupabase(businessId, collectionInfo.name, mapping);
                
                const inserted = migration.reduce((sum, m) => sum + (m.insertedCount || 0), 0);
                console.log(`✓ Inserted ${inserted} records`);
                
                results.push({
                    collection: collectionInfo.name,
                    success: true,
                    inserted
                });
                
            } catch (error) {
                console.error(`✗ Error: ${error.message}`);
                results.push({
                    collection: collectionInfo.name,
                    success: false,
                    error: error.message
                });
            }
            
            // Progress update
            const completed = i + 1;
            const progress = ((completed / collections.length) * 100).toFixed(1);
            console.log(`Progress: ${completed}/${collections.length} (${progress}%)`);
        }
        
        return results;
        
    } catch (error) {
        console.error('Error in processWithMonitoring:', error);
        throw error;
    }
}

// Main execution
async function main() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/biztrack');
        console.log('Connected to MongoDB\n');
        
        // Choose which example to run
        const exampleToRun = process.argv[2] || '1';
        
        switch (exampleToRun) {
            case '1':
                await processAllBusinessData();
                break;
            case '2':
                await processSingleCollection();
                break;
            case '3':
                await testMappingOnly();
                break;
            case '4':
                await testWithCustomModels();
                break;
            case '5':
                await processWithMonitoring();
                break;
            default:
                console.log('Invalid example number. Choose 1-5.');
        }
        
        await mongoose.disconnect();
        console.log('\nDisconnected from MongoDB');
        
    } catch (error) {
        console.error('Error in main:', error);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    console.log('DataMapper Examples\n');
    console.log('Usage: node dataMapperExample.js [1-5]');
    console.log('  1: Process all business data (default)');
    console.log('  2: Process single collection');
    console.log('  3: Test LLM mapping only');
    console.log('  4: Test with custom models');
    console.log('  5: Process with real-time monitoring\n');
    
    main();
}

module.exports = {
    processAllBusinessData,
    processSingleCollection,
    testMappingOnly,
    testWithCustomModels,
    processWithMonitoring
};
