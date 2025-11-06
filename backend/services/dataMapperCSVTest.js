/**
 * CSV Data Mapping Test Examples
 * 
 * This file demonstrates how the enhanced DataMapper handles
 * different CSV data structures with pattern recognition.
 */

const DataMapper = require('./dataMapper');
const mongoose = require('mongoose');

// Test data simulating CSV imports

const inventoryCSVData = [
    {
        "Item ID": "P001",
        "Item name": "Samsung Galaxy S23",
        "Type": "Electronics",
        "Price": "85000",
        "Stock": "50",
        "Status": "Active",
        "Notes": "Latest model with 5G support"
    },
    {
        "Item ID": "P002",
        "Item name": "Office Desk",
        "Type": "Furniture",
        "Price": "12000",
        "Stock": "20",
        "Status": "Active",
        "Notes": "Ergonomic design"
    },
    {
        "Item ID": "P003",
        "Item name": "LED Monitor 24\"",
        "Type": "Electronics",
        "Price": "18000",
        "Stock": "35",
        "Status": "Active",
        "Notes": "Full HD display"
    }
];

const vendorCSVData = [
    {
        "Vendor": "ABC Electronics Ltd",
        "Vendor type": "Wholesale",
        "Contact": "Kamal Ahmed - 01712345678",
        "Address": "Gulshan-2, Dhaka",
        "Website": "www.abcelectronics.com.bd",
        "Reliability": "High",
        "Notes": "Preferred supplier for electronics"
    },
    {
        "Vendor": "XYZ Furniture House",
        "Vendor type": "Retail",
        "Contact": "Rina Begum - 01898765432",
        "Address": "Banani, Dhaka",
        "Website": "www.xyzfurniture.com",
        "Reliability": "Medium",
        "Notes": "New vendor, trial period"
    }
];

const purchaseOrderCSVData = [
    {
        "Priority": "High",
        "Order": "PO-2025-001",
        "Category": "Electronics",
        "Status": "Pending",
        "Order date": "2025-01-15",
        "Arrive by": "2025-01-20",
        "Cost": "500000",
        "Point of contact": "ABC Electronics Ltd",
        "Notes": "Urgent order for new store opening"
    },
    {
        "Priority": "Medium",
        "Order": "PO-2025-002",
        "Category": "Furniture",
        "Status": "Confirmed",
        "Order date": "2025-01-16",
        "Arrive by": "2025-01-25",
        "Cost": "300000",
        "Point of contact": "XYZ Furniture House",
        "Notes": "Regular monthly order"
    }
];

const salesOrderCSVData = [
    {
        "Priority": "High",
        "Order": "SO-2025-001",
        "Product": "Samsung Galaxy S23",
        "Status": "Shipped",
        "Order date": "2025-01-15",
        "Price": "90000",
        "Sales platform": "Daraz",
        "Point of contact": "Customer A - 01723456789",
        "Notes": "Express delivery requested"
    },
    {
        "Priority": "Medium",
        "Order": "SO-2025-002",
        "Product": "Office Desk",
        "Status": "Pending",
        "Order date": "2025-01-16",
        "Price": "15000",
        "Sales platform": "Facebook Marketplace",
        "Point of contact": "Customer B - 01834567890",
        "Notes": "Normal delivery"
    }
];

/**
 * Test 1: Inventory CSV Mapping
 */
async function testInventoryMapping() {
    console.log('\n' + '═'.repeat(80));
    console.log('TEST 1: INVENTORY CSV DATA MAPPING');
    console.log('═'.repeat(80) + '\n');
    
    const mapper = new DataMapper();
    
    // Simulate collection analysis
    const collectionAnalysis = {
        collectionName: 'biztrack_inventory_tracker',
        totalDocuments: inventoryCSVData.length,
        sampleData: inventoryCSVData,
        fields: mapper.extractFieldInfo(inventoryCSVData)
    };
    
    console.log('📊 Detected Fields:');
    collectionAnalysis.fields.forEach(field => {
        console.log(`  - ${field.fieldName}`);
        console.log(`    Type: ${field.dataType}`);
        if (field.fieldCategory && field.fieldCategory.category !== 'unknown') {
            console.log(`    Category: ${field.fieldCategory.category}:${field.fieldCategory.fieldType}`);
            console.log(`    Matched Pattern: "${field.fieldCategory.matchedPattern}"`);
        }
        console.log(`    Samples: [${field.sampleValues.slice(0, 3).join(', ')}]`);
        console.log('');
    });
    
    // Test rule-based mapping
    const mappingResult = mapper.fallbackRuleBasedMapping(collectionAnalysis);
    
    console.log('🎯 Mapping Results:');
    console.log(`  Target Table: ${mappingResult.tables[0].table_name}`);
    console.log(`  Confidence: ${mappingResult.tables[0].confidence.toFixed(2)}`);
    console.log(`  Reasoning: ${mappingResult.tables[0].reasoning}\n`);
    
    console.log('📍 Field Mappings:');
    mappingResult.tables[0].field_mappings.forEach(mapping => {
        console.log(`  ✓ "${mapping.source_field}" → ${mapping.target_field}`);
        console.log(`    Confidence: ${mapping.confidence.toFixed(2)}`);
        console.log(`    Transformation: ${mapping.transformation_needed}\n`);
    });
    
    console.log('⚠️  Unmapped Fields:');
    mappingResult.unmapped_fields.forEach(field => {
        console.log(`  ✗ ${field.field_name}`);
        console.log(`    Reason: ${field.reason}`);
        if (field.suggestions && field.suggestions.length > 0) {
            console.log(`    Suggestions: ${field.suggestions.map(s => `${s.field} (${s.similarity})`).join(', ')}`);
        }
        console.log('');
    });
}

/**
 * Test 2: Vendor CSV Mapping
 */
async function testVendorMapping() {
    console.log('\n' + '═'.repeat(80));
    console.log('TEST 2: VENDOR/SUPPLIER CSV DATA MAPPING');
    console.log('═'.repeat(80) + '\n');
    
    const mapper = new DataMapper();
    
    const collectionAnalysis = {
        collectionName: 'biztrack_vendor_list',
        totalDocuments: vendorCSVData.length,
        sampleData: vendorCSVData,
        fields: mapper.extractFieldInfo(vendorCSVData)
    };
    
    console.log('📊 Detected Fields:');
    collectionAnalysis.fields.forEach(field => {
        console.log(`  - ${field.fieldName}`);
        if (field.fieldCategory && field.fieldCategory.category !== 'unknown') {
            console.log(`    Category: ${field.fieldCategory.category}:${field.fieldCategory.fieldType}`);
        }
    });
    
    const mappingResult = mapper.fallbackRuleBasedMapping(collectionAnalysis);
    
    console.log(`\n🎯 Target Table: ${mappingResult.tables[0].table_name} (${(mappingResult.tables[0].confidence * 100).toFixed(0)}% confidence)`);
    
    console.log('\n📍 Mapped Fields:');
    mappingResult.tables[0].field_mappings.forEach(mapping => {
        console.log(`  ✓ "${mapping.source_field}" → ${mapping.target_field}`);
    });
    
    console.log('\n⚠️  Unmapped Fields:');
    mappingResult.unmapped_fields.forEach(field => {
        console.log(`  ✗ ${field.field_name} - ${field.reason}`);
    });
}

/**
 * Test 3: Purchase Order CSV Mapping
 */
async function testPurchaseOrderMapping() {
    console.log('\n' + '═'.repeat(80));
    console.log('TEST 3: PURCHASE ORDER CSV DATA MAPPING');
    console.log('═'.repeat(80) + '\n');
    
    const mapper = new DataMapper();
    
    const collectionAnalysis = {
        collectionName: 'biztrack_purchase_orders',
        totalDocuments: purchaseOrderCSVData.length,
        sampleData: purchaseOrderCSVData,
        fields: mapper.extractFieldInfo(purchaseOrderCSVData)
    };
    
    const mappingResult = mapper.fallbackRuleBasedMapping(collectionAnalysis);
    
    console.log(`🎯 Target Table: ${mappingResult.tables[0].table_name}`);
    console.log(`Confidence: ${(mappingResult.tables[0].confidence * 100).toFixed(0)}%\n`);
    
    console.log('📍 Key Field Mappings:');
    mappingResult.tables[0].field_mappings
        .filter(m => m.confidence > 0.8)
        .forEach(mapping => {
            console.log(`  ✓ "${mapping.source_field}" → ${mapping.target_field} (${(mapping.confidence * 100).toFixed(0)}%)`);
        });
    
    if (mappingResult.tables[0].relationships && mappingResult.tables[0].relationships.length > 0) {
        console.log('\n🔗 Detected Relationships:');
        mappingResult.tables[0].relationships.forEach(rel => {
            console.log(`  → ${rel.related_table} (via ${rel.key})`);
        });
    }
}

/**
 * Test 4: Sales Order CSV Mapping
 */
async function testSalesOrderMapping() {
    console.log('\n' + '═'.repeat(80));
    console.log('TEST 4: SALES ORDER CSV DATA MAPPING');
    console.log('═'.repeat(80) + '\n');
    
    const mapper = new DataMapper();
    
    const collectionAnalysis = {
        collectionName: 'biztrack_sales_orders',
        totalDocuments: salesOrderCSVData.length,
        sampleData: salesOrderCSVData,
        fields: mapper.extractFieldInfo(salesOrderCSVData)
    };
    
    const mappingResult = mapper.fallbackRuleBasedMapping(collectionAnalysis);
    
    console.log(`🎯 Target Table: ${mappingResult.tables[0].table_name}`);
    console.log(`Confidence: ${(mappingResult.tables[0].confidence * 100).toFixed(0)}%\n`);
    
    console.log('📍 Field Mappings:');
    mappingResult.tables[0].field_mappings.forEach(mapping => {
        const confidence = (mapping.confidence * 100).toFixed(0);
        console.log(`  ${mapping.source_field.padEnd(20)} → ${mapping.target_field.padEnd(25)} (${confidence}%)`);
    });
}

/**
 * Test 5: Pattern Recognition Accuracy
 */
async function testPatternRecognition() {
    console.log('\n' + '═'.repeat(80));
    console.log('TEST 5: PATTERN RECOGNITION ACCURACY');
    console.log('═'.repeat(80) + '\n');
    
    const mapper = new DataMapper();
    
    const testCases = [
        { input: "Item ID", expected: { category: "inventory", fieldType: "id" } },
        { input: "Item name", expected: { category: "inventory", fieldType: "name" } },
        { input: "Vendor", expected: { category: "vendor", fieldType: "name" } },
        { input: "Order date", expected: { category: "purchase_order", fieldType: "order_date" } },
        { input: "Price", expected: { category: "inventory", fieldType: "price" } },
    ];
    
    console.log('Testing field categorization:\n');
    
    let correct = 0;
    testCases.forEach(test => {
        const result = mapper.categorizeField(test.input);
        const isCorrect = result.category === test.expected.category && 
                         result.fieldType === test.expected.fieldType;
        
        if (isCorrect) correct++;
        
        const status = isCorrect ? '✅' : '❌';
        console.log(`${status} "${test.input}"`);
        console.log(`   Expected: ${test.expected.category}:${test.expected.fieldType}`);
        console.log(`   Got: ${result.category}:${result.fieldType}`);
        if (result.matchedPattern) {
            console.log(`   Matched: "${result.matchedPattern}"`);
        }
        console.log('');
    });
    
    const accuracy = (correct / testCases.length * 100).toFixed(0);
    console.log(`Accuracy: ${correct}/${testCases.length} (${accuracy}%)`);
}

/**
 * Run all tests
 */
async function runAllTests() {
    try {
        console.log('\n');
        console.log('╔' + '═'.repeat(78) + '╗');
        console.log('║' + ' '.repeat(20) + 'CSV DATA MAPPING TEST SUITE' + ' '.repeat(31) + '║');
        console.log('║' + ' '.repeat(25) + 'Enhanced Pattern Recognition' + ' '.repeat(26) + '║');
        console.log('╚' + '═'.repeat(78) + '╝');
        
        await testInventoryMapping();
        await testVendorMapping();
        await testPurchaseOrderMapping();
        await testSalesOrderMapping();
        await testPatternRecognition();
        
        console.log('\n' + '═'.repeat(80));
        console.log('✅ ALL TESTS COMPLETED');
        console.log('═'.repeat(80) + '\n');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

// Run tests if called directly
if (require.main === module) {
    runAllTests();
}

module.exports = {
    testInventoryMapping,
    testVendorMapping,
    testPurchaseOrderMapping,
    testSalesOrderMapping,
    testPatternRecognition,
    runAllTests
};
