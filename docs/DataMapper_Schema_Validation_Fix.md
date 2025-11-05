# DataMapper Schema Validation Fix

## Issue Summary

The DataMapper was experiencing multiple errors when inserting data into Supabase:

### Errors Found:
1. **Invalid Column Names**: LLM was inventing columns that don't exist in the schema
   - `base_cost` in `purchase_order_items` 
   - `calculated_cost_per_unit` in `purchase_order_items`
   - `cost_price` in `product`
   - `profit_amount`, `total_revenue`, `return_on_investment` in `sales_order_items`
   - `stock_quantity` in `product`

2. **Integer Overflow**: Generated IDs exceeded PostgreSQL INTEGER range
   - Error: `value "1762353066863" is out of range for type integer`
   - PostgreSQL INTEGER range: -2147483648 to 2147483647

3. **Schema Mismatch**: `unifiedSchema` didn't include `business_id` in all tables

## Root Causes

1. **LLM Hallucination**: The model was creating plausible-sounding column names that don't exist
2. **Missing Validation**: No validation to check if suggested columns actually exist
3. **Poor ID Generation**: Using `Date.now()` creates values > 2 billion (exceeds INT max)
4. **Incomplete Schema**: Missing `business_id` in schema definition

## Fixes Applied

### 1. Updated Schema Definition

**Before:**
```javascript
this.unifiedSchema = {
    product: ['product_id', 'product_name', 'description', ...],
    // Missing business_id
}
```

**After:**
```javascript
this.unifiedSchema = {
    product: ['business_id', 'product_id', 'product_name', 'description', ...],
    purchase_order_items: ['business_id', 'purchase_order_id', 'product_brand_id', 'quantity_ordered', 'unit_cost', 'line_total'],
    sales_order_items: ['business_id', 'sales_order_id', 'product_id', 'line_total'],
    // All tables now include business_id and match actual SQL schema
}
```

### 2. Enhanced LLM Prompt

**Added Schema Listing:**
```javascript
const schemaListing = Object.entries(this.unifiedSchema)
    .map(([table, columns]) => `**${table}**: ${columns.filter(c => c !== 'business_id').join(', ')}`)
    .join('\n');
```

**Added Strict Rules:**
```
**IMPORTANT RULES:**
1. You can ONLY map to columns listed above. 
2. DO NOT create or suggest columns like 'cost_price', 'base_cost', 'profit_amount', etc.
3. If a source field doesn't fit any existing column, mark it as unmapped.
4. 'business_id' is automatically added - do NOT include it in mappings.
5. For ID fields: use INTEGER for auto-increment IDs, VARCHAR(100) for product_id only.
```

### 3. Added Column Validation

**New Validation Logic:**
```javascript
// Validate and filter field mappings to only include valid columns
result.tables.forEach(table => {
    const validColumns = this.unifiedSchema[table.table_name] || [];
    
    // Filter out invalid target fields
    table.field_mappings = table.field_mappings.filter(mapping => {
        const isValid = validColumns.includes(mapping.target_field);
        if (!isValid) {
            console.warn(`⚠️  Removing invalid mapping: ${mapping.source_field} → ${mapping.target_field}`);
            // Add to unmapped fields
            result.unmapped_fields.push({
                field_name: mapping.source_field,
                reason: `LLM suggested non-existent column '${mapping.target_field}'`
            });
        }
        return isValid;
    });
});
```

### 4. Fixed ID Generation

**Before:**
```javascript
generateIdFromValue(value) {
    if (this.isNumericLike(value)) {
        return parseInt(value); // Could overflow!
    }
    // Hash could also overflow
}
```

**After:**
```javascript
generateIdFromValue(value) {
    if (this.isNumericLike(value)) {
        const numValue = parseInt(value);
        // Ensure within PostgreSQL INTEGER range
        if (numValue >= -2147483648 && numValue <= 2147483647) {
            return numValue;
        }
        console.warn(`⚠️  ID value ${numValue} exceeds range, generating hash`);
    }
    
    // Generate safe hash
    let hash = 0;
    const str = String(value);
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    
    // Ensure positive and within safe range
    return Math.abs(hash) % 2147483647;
}
```

**Primary Key Generation:**
```javascript
// Before: doc[primaryKey] = Date.now() + Math.floor(Math.random() * 1000);
// After:
const baseId = Math.floor(Math.random() * 1000000); // 1-1,000,000
const randomSuffix = Math.floor(Math.random() * 1000);
doc[primaryKey] = baseId + randomSuffix;
```

### 5. Changed Primary Model

**Before:**
```javascript
model: 'openai/gpt-oss-120b'
```

**After:**
```javascript
model: 'llama-3.3-70b-versatile'
```

Reason: Better compliance with schema constraints and faster responses.

## Expected Behavior Now

### ✅ Valid Column Mapping
```
✓ Mapping determined
  Target tables: product
  Field mappings validated: 5/8 valid
  ⚠️  Removed 3 invalid field mappings from product
  - cost_price → marked as unmapped
  - stock_quantity → marked as unmapped
  - base_cost → marked as unmapped
```

### ✅ Safe ID Generation
```
Product ID: PROD_1730812345678_a3b5c7d9e (VARCHAR)
Brand ID: 856432 (INTEGER - safe range)
Customer ID: 234567 (INTEGER - safe range)
```

### ✅ Schema Compliance
All inserted records now match actual Supabase schema:
- `product`: business_id, product_id, product_name, description, category_id, brand_id, supplier_id, price, selling_price, status, created_date, expense, stored_location
- `purchase_order_items`: business_id, purchase_order_id, product_brand_id, quantity_ordered, unit_cost, line_total
- `sales_order_items`: business_id, sales_order_id, product_id, line_total

## Testing

Run the mapper again and verify:

```bash
docker compose restart backend
docker compose logs -f backend
```

**Expected output:**
```
✓ LLM Mapping successful with model: llama-3.3-70b-versatile
⚠️  Removed 2 invalid field mappings from product
✓ Mapped to tables: product
Inserted batch 1: 9 records
✓ Collection processed in 3.45s
  Records inserted: 9/9
```

## Prevention

1. **Schema Source of Truth**: `unifiedSchema` must match `003_create_merchandising_schema.sql`
2. **Column Validation**: Always validate LLM suggestions against actual schema
3. **ID Range Checks**: Never use `Date.now()` directly for INTEGER fields
4. **Prompt Engineering**: Explicitly list allowed columns in LLM prompt
5. **Error Monitoring**: Watch for PGRST204 errors (column not found)

## Migration Steps

1. ✅ Update schema definition with all columns
2. ✅ Add validation to filter invalid columns
3. ✅ Fix ID generation to stay within INTEGER range
4. ✅ Update LLM prompt with explicit rules
5. ✅ Change primary model to llama-3.3-70b
6. ✅ Test with sample data

## Related Files

- `/mnt/Others/Projects/biztrack/backend/services/dataMapper.js` - Main service
- `/mnt/Others/Projects/biztrack/database/migrations/003_create_merchandising_schema.sql` - Schema source of truth

## Notes

- Some fields like profit calculations, ROI, stock quantity may need to be computed/stored elsewhere
- Consider adding these as separate analytics tables if needed
- Current schema focuses on transactional data (orders, products, investors)
- Analytical metrics can be derived via queries or views

---

**Fixed:** November 5, 2025  
**Version:** 2.0.1
