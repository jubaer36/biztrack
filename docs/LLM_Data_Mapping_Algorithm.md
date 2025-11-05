# LLM-Based Data Mapping Algorithm for BizTrack

## Overview

The LLM-Based Data Mapping Algorithm is a sophisticated system that automatically converts unstructured business data stored in MongoDB collections into a unified, structured database schema in Supabase. This algorithm leverages the power of Large Language Models (LLMs) from Groq API to intelligently analyze, understand, and map disparate data sources.

## Core Features

### 🧠 Intelligent Data Analysis
- **Automatic Structure Detection**: Analyzes MongoDB collections to understand data patterns and relationships
- **Field Type Inference**: Automatically identifies data types (numeric, date, email, phone, text)
- **Cash Flow Prioritization**: Prioritizes mapping of financial data (prices, amounts, costs, revenues)
- **Sample-Based Learning**: Uses first 4-5 rows to understand data structure and mapping requirements

### 🤖 LLM-Powered Mapping
- **Groq LLama 3.1 70B**: Uses advanced LLM for complex data mapping decisions
- **Confidence Scoring**: Provides confidence levels for each mapping decision
- **Contextual Understanding**: Understands business context and relationships between data entities
- **Multi-Table Mapping**: Can map single source to multiple related tables

### 🗄️ Unified Schema Integration
- **Merchandising-Focused**: Optimized for small merchandising businesses in Bangladesh
- **Comprehensive Coverage**: Supports 12 core business tables
- **Foreign Key Relationships**: Maintains data integrity and relationships
- **Business Isolation**: Each business maintains separate data spaces

## Algorithm Architecture

### 1. Data Analysis Phase

```javascript
// Analyze collection structure
const analysis = await analyzeCollectionStructure(businessId, collectionName);

// Extract field information
const fieldAnalysis = extractFieldInfo(sampleDocuments);
```

**Process:**
- Fetches sample documents (5 rows) from MongoDB collection
- Extracts all field names and analyzes their characteristics
- Infers data types using pattern matching
- Identifies cash-flow related fields for prioritization
- Creates comprehensive field analysis report

### 2. LLM Mapping Phase

```javascript
// Generate intelligent mapping using LLM
const mappingResult = await determineTableMapping(collectionAnalysis);
```

**LLM Prompt Structure:**
- **Context**: Provides unified schema definition and relationships
- **Data Sample**: Includes field analysis and sample records
- **Instructions**: Specific mapping requirements and cash-flow prioritization
- **Response Format**: Structured JSON with confidence scores

**LLM Decision Factors:**
- Field name similarity to target schema
- Data type compatibility
- Business logic understanding
- Cash flow and financial data prioritization
- Data quality assessment

### 3. Data Transformation Phase

```javascript
// Transform and migrate data
const migrationResult = await migrateDataToSupabase(businessId, collectionName, mappingResult);
```

**Transformation Rules:**
- **ID Generation**: Creates appropriate IDs for primary keys
- **Type Conversion**: Converts data types (monetary, date, numeric)
- **Data Cleaning**: Cleans phone numbers, emails, and addresses
- **Validation**: Ensures data integrity and constraint compliance
- **Batch Processing**: Handles large datasets efficiently (100 records per batch)

## Supported Tables & Mappings

### Core Business Entities

1. **product_category** - Product categorization
2. **product_brand** - Brand information with pricing
3. **supplier** - Supplier management and contacts
4. **customer** - Customer data and addresses
5. **investor** - Investment partners and terms
6. **investment** - Investment transactions
7. **investors_capital** - Capital calculations and ROI
8. **product** - Product catalog and inventory
9. **purchase_order** - Purchase order headers
10. **purchase_order_items** - Purchase order line items
11. **sales_order** - Sales order headers
12. **sales_order_items** - Sales order line items

### Data Type Transformations

| Source Type | Target Type | Transformation |
|------------|-------------|----------------|
| String numbers | DECIMAL | Remove commas, currency symbols |
| Date strings | TIMESTAMP | Parse various date formats |
| Phone strings | VARCHAR | Clean formatting, keep numbers |
| Email strings | VARCHAR | Validate and normalize |
| ID fields | SERIAL/VARCHAR | Generate or extract IDs |

## Usage Examples

### 1. Automatic Full Business Mapping

```javascript
// Map all collections for a business
const mapper = new DataMapper();
const result = await mapper.processBusinessData(businessId);
```

### 2. Single Collection Analysis

```javascript
// Analyze specific collection
const analysis = await mapper.analyzeCollectionStructure(businessId, collectionName);
const mapping = await mapper.determineTableMapping(analysis);
```

### 3. Custom Data Migration

```javascript
// Custom migration with specific mapping
await mapper.migrateDataToSupabase(businessId, collectionName, customMapping);
```

## API Endpoints

### POST `/api/mapping/map/:businessId`
Triggers complete LLM-based mapping for all business collections.

**Response:**
```json
{
  "message": "Data mapping completed successfully",
  "businessId": "uuid",
  "businessName": "Business Name",
  "result": {
    "totalCollections": 3,
    "processedCollections": 3,
    "results": [...]
  }
}
```

### GET `/api/mapping/mapping-status/:businessId`
Gets current mapping status and statistics.

**Response:**
```json
{
  "businessId": "uuid",
  "supabaseStatus": {...},
  "mongoStatus": {...},
  "hasMappedData": true,
  "totalMongoCollections": 3,
  "totalSupabaseTables": 5
}
```

### POST `/api/mapping/analyze/:businessId/:collectionName`
Analyzes specific collection without mapping (preview mode).

### DELETE `/api/mapping/clear-mapped/:businessId`
Clears all mapped data for remapping.

## Configuration

### Environment Variables

```env
GROQ_API_KEY=your_groq_api_key_here
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
MONGODB_URI=your_mongodb_connection_string
```

### LLM Configuration

```javascript
this.groqClient = new ChatGroq({
    apiKey: process.env.GROQ_API_KEY,
    model: 'llama-3.1-70b-versatile', // High-performance model for complex mapping
    temperature: 0.1, // Low temperature for consistent results
});
```

## Frontend Integration

### React Component Usage

```tsx
import DataMapper from '@/components/DataMapper';

<DataMapper 
    businessId={businessId} 
    onMappingComplete={() => {
        // Handle completion
        refreshData();
    }}
/>
```

### Key Features:
- **Real-time Status**: Shows mapping progress and results
- **Collection Analysis**: Preview mapping before execution
- **Data Quality Insights**: Displays issues and recommendations
- **Interactive Controls**: Start, stop, and clear mapping operations

## Data Quality & Error Handling

### Quality Assurance
- **Field Validation**: Ensures data type compatibility
- **Relationship Integrity**: Maintains foreign key relationships
- **Duplicate Detection**: Handles duplicate records appropriately
- **Missing Data Handling**: Manages null and undefined values

### Error Recovery
- **Batch Error Isolation**: Failed batches don't stop entire process
- **Detailed Logging**: Comprehensive error tracking and reporting
- **Retry Mechanisms**: Automatic retry for transient failures
- **Rollback Support**: Can clear and remap data if needed

## Performance Optimization

### Processing Efficiency
- **Batch Processing**: 100-record batches for optimal performance
- **Parallel Analysis**: Concurrent field analysis for large datasets
- **Memory Management**: Efficient handling of large data volumes
- **Progress Tracking**: Real-time progress updates

### LLM Optimization
- **Structured Prompts**: Optimized prompts for consistent results
- **Response Caching**: Cache similar mapping decisions
- **Model Selection**: Use appropriate model size for task complexity
- **Rate Limiting**: Respect API limits and quotas

## Business Logic Considerations

### SME-Focused Features
- **Cash Flow Priority**: Financial data gets highest mapping priority
- **Flexible Schema**: Handles various business data structures
- **Cultural Context**: Optimized for Bangladesh business practices
- **Scalable Architecture**: Supports growing business needs

### Data Mapping Intelligence
- **Context Awareness**: Understands business relationships
- **Domain Knowledge**: Built-in understanding of merchandising business
- **Adaptive Learning**: Learns from mapping corrections
- **Quality Scoring**: Provides data quality assessments

## Troubleshooting

### Common Issues

1. **LLM Response Parsing Errors**
   - Check GROQ_API_KEY validity
   - Verify model availability
   - Review prompt structure

2. **Database Connection Issues**
   - Validate Supabase credentials
   - Check MongoDB connectivity
   - Verify table schemas exist

3. **Mapping Confidence Issues**
   - Review source data quality
   - Check field naming consistency
   - Analyze data samples

### Debugging Tools

```javascript
// Enable detailed logging
console.log('Field Analysis:', fieldAnalysis);
console.log('LLM Response:', mappingResult);
console.log('Migration Stats:', migrationResult);
```

## Future Enhancements

### Planned Features
- **Multi-Language Support**: Support for Bengali business terms
- **Custom Schema Support**: User-defined table structures
- **Advanced Analytics**: Mapping quality metrics and insights
- **Automated Corrections**: Learning from user corrections
- **Export Capabilities**: Export mapping rules for reuse

### Integration Possibilities
- **Real-time Sync**: Live data synchronization
- **API Webhooks**: Notification system for mapping events
- **Third-party Connectors**: Direct integration with accounting software
- **Mobile App Support**: Mobile-first mapping interface

---

## Contributing

When extending the algorithm:

1. **Maintain Schema Consistency**: Follow existing table structures
2. **Add Comprehensive Testing**: Include unit and integration tests
3. **Document Changes**: Update this README with new features
4. **Follow Patterns**: Use established coding patterns and conventions
5. **Consider Performance**: Optimize for large datasets and concurrent users

For more details, see the source code in `/backend/services/dataMapper.js` and related files.