# Product Hierarchy Mapping System

## Overview

The DataMapper now supports **intelligent product hierarchy processing** for inventory CSV data that includes stock quantities. This system automatically creates the proper three-tier product structure required by the relational database.

**Date:** November 6, 2025  
**Version:** 2.3.0

---

## 🏗️ Three-Tier Product Structure

### Database Schema

```
product_category (Top Level)
        ↓
product_brand (Middle Level) 
        ↓
product (Individual Units - Bottom Level)
```

### Tier Descriptions

#### 1. **Product Category** (`product_category`)
- **Purpose**: High-level product classification
- **Example**: "Electronics", "Clothing", "Home & Garden"
- **Source**: CSV "Type" field
- **Columns**:
  - `category_id` (INTEGER) - Generated from category name
  - `category_name` (VARCHAR)
  - `description` (TEXT)
  - `business_id` (INTEGER)

#### 2. **Product Brand** (`product_brand`)
- **Purpose**: Item template/brand/model level
- **Example**: "Wireless Bluetooth Headphones", "Samsung Galaxy S23"
- **Source**: CSV "Item name" field (used as brand when brand not specified)
- **Columns**:
  - `brand_id` (INTEGER) - Generated from brand name
  - `brand_name` (VARCHAR)
  - `description` (TEXT)
  - `unit_price` (DECIMAL) - From CSV "Price"
  - `business_id` (INTEGER)
  - `category_id` (INTEGER) - Links to product_category

#### 3. **Product** (`product`)
- **Purpose**: Individual physical units/inventory items
- **Example**: Each of 45 headphones gets its own record
- **Source**: Expanded from CSV based on "Stock" quantity
- **Columns**:
  - `product_id` (INTEGER) - Generated unique ID per unit
  - `product_name` (VARCHAR) - Same as brand name
  - `description` (TEXT)
  - `brand_id` (INTEGER) - Links to product_brand
  - `category_id` (INTEGER) - Links to product_category
  - `price` (DECIMAL) - Unit cost
  - `selling_price` (DECIMAL) - Retail price
  - `status` (VARCHAR) - From CSV "Status"
  - `created_date` (TIMESTAMP)
  - `business_id` (INTEGER)

---

## 📊 CSV Data Mapping Example

### Input CSV

```csv
Item ID,Item name,Type,Price,Stock,Status,Notes
ITM001,Wireless Bluetooth Headphones,Electronics,79.99,45,In stock,Popular model
ITM002,Smartphone Case - iPhone 13,Electronics,19.99,120,In stock,Protective case
ITM003,Cotton T-Shirt - Blue,Clothing,14.99,85,In stock,100% cotton
```

### Processing Flow

#### Step 1: Category Extraction
```javascript
// Unique categories from CSV
Categories Found:
- Electronics
- Clothing

// Created in product_category table:
[
  { category_id: 1234567, category_name: "Electronics", business_id: xxx },
  { category_id: 7891011, category_name: "Clothing", business_id: xxx }
]
```

#### Step 2: Brand Extraction
```javascript
// Unique item names become brands
Brands Found:
- Wireless Bluetooth Headphones (Electronics, $79.99)
- Smartphone Case - iPhone 13 (Electronics, $19.99)
- Cotton T-Shirt - Blue (Clothing, $14.99)

// Created in product_brand table:
[
  { 
    brand_id: 9876543, 
    brand_name: "Wireless Bluetooth Headphones",
    category_id: 1234567, // Electronics
    unit_price: 79.99,
    business_id: xxx
  },
  { 
    brand_id: 5432109, 
    brand_name: "Smartphone Case - iPhone 13",
    category_id: 1234567, // Electronics
    unit_price: 19.99,
    business_id: xxx
  },
  { 
    brand_id: 1357924, 
    brand_name: "Cotton T-Shirt - Blue",
    category_id: 7891011, // Clothing
    unit_price: 14.99,
    business_id: xxx
  }
]
```

#### Step 3: Individual Product Creation
```javascript
// Stock quantity determines how many product records to create

For ITM001 (Stock: 45):
  → Create 45 individual product records
  
For ITM002 (Stock: 120):
  → Create 120 individual product records
  
For ITM003 (Stock: 85):
  → Create 85 individual product records

Total Products: 45 + 120 + 85 = 250 individual product records

// Created in product table (sample):
[
  {
    product_id: 100001,
    product_name: "Wireless Bluetooth Headphones",
    brand_id: 9876543,
    category_id: 1234567,
    price: 79.99,
    selling_price: 79.99,
    status: "In stock",
    description: "Popular model - Unit 1"
  },
  {
    product_id: 100002,
    product_name: "Wireless Bluetooth Headphones",
    brand_id: 9876543,
    category_id: 1234567,
    price: 79.99,
    selling_price: 79.99,
    status: "In stock",
    description: "Popular model - Unit 2"
  },
  // ... continues for 43 more units
  {
    product_id: 100046,
    product_name: "Smartphone Case - iPhone 13",
    brand_id: 5432109,
    category_id: 1234567,
    price: 19.99,
    selling_price: 19.99,
    status: "In stock",
    description: "Protective case - Unit 1"
  },
  // ... continues for all 250 products
]
```

---

## 🔄 Processing Logic

### When Brand is NOT Specified in CSV

**Rule**: Use the Item Name as both the brand name AND product name

```javascript
CSV Row:
  Item name: "Wireless Bluetooth Headphones"
  Type: "Electronics"
  Stock: 45

Creates:
  product_category:
    category_name: "Electronics"
  
  product_brand:
    brand_name: "Wireless Bluetooth Headphones"  // Item name used as brand
    category_id: [Electronics ID]
  
  product (45 records):
    product_name: "Wireless Bluetooth Headphones"  // Same as brand
    brand_id: [Wireless Bluetooth Headphones ID]
    category_id: [Electronics ID]
```

### ID Generation Strategy

All IDs are generated using hash-based deterministic generation:

```javascript
// Category ID
category_id = generateIdFromValue("Electronics")
// → 1234567 (consistent for same category name)

// Brand ID  
brand_id = generateIdFromValue("Wireless Bluetooth Headphones")
// → 9876543 (consistent for same brand name)

// Product ID (unique per unit)
product_id = generateIdFromValue("ITM001_Wireless Bluetooth Headphones_unit_1")
// → 100001 (unique for each physical unit)
```

### Upsert Strategy

The system uses **upsert** operations to prevent duplicates:

```javascript
// Categories and Brands use upsert with conflict resolution
.upsert(data, { onConflict: 'category_id' })
.upsert(data, { onConflict: 'brand_id' })
.upsert(data, { onConflict: 'product_id' })

// This allows:
// 1. Re-running imports without creating duplicates
// 2. Updating existing records with new data
// 3. Maintaining referential integrity
```

---

## 📝 Field Mapping Reference

### CSV Column → Database Column Mapping

| CSV Field | product_category | product_brand | product |
|-----------|-----------------|---------------|---------|
| **Item ID** | - | - | Used in product_id generation |
| **Item name** | - | `brand_name` | `product_name` |
| **Type** | `category_name` | Links via `category_id` | Links via `category_id` |
| **Price** | - | `unit_price` | `price`, `selling_price` |
| **Stock** | - | - | **Creates N product records** |
| **Status** | - | - | `status` |
| **Notes** | - | `description` | `description` |

### Alternate Field Names Supported

The system recognizes multiple field name variations:

- **Item Name**: `Item name`, `Item Name`, `item_name`, `Product`, `product`, `Product name`, `product_name`
- **Type/Category**: `Type`, `type`, `Category`, `category`
- **Price**: `Price`, `price`, `Unit Price`, `unit_price`
- **Stock**: `Stock`, `stock`, `Quantity`, `quantity`
- **Status**: `Status`, `status`
- **Notes**: `Notes`, `notes`, `Description`, `description`
- **Item ID**: `Item ID`, `Item Id`, `item_id`, `id`

---

## 🎯 Processing Steps

The system follows this workflow:

### Automatic Detection

```javascript
1. DataMapper detects table_name === 'product'
2. Triggers processProductHierarchy() instead of standard transform
3. Logs: "Detected product table - checking for hierarchy requirements"
```

### Step-by-Step Processing

**Step 1/4: Analyzing Product Data Structure**
```
- Extract unique categories from "Type" field
- Extract unique brands from "Item name" field
- Count total product units needed (sum of all Stock quantities)
- Generate IDs for categories and brands
```

**Step 2/4: Creating Product Categories**
```
- Insert/update unique categories to product_category table
- Use upsert to prevent duplicates
- Log: "✓ X categories created"
```

**Step 3/4: Creating Product Brands**
```
- Insert/update unique brands to product_brand table
- Link each brand to its category via category_id
- Include unit_price from CSV Price field
- Use upsert to prevent duplicates
- Log: "✓ X brands created"
```

**Step 4/4: Creating Individual Product Units**
```
- For each CSV row:
  - Get stock quantity
  - Create N individual product records (where N = stock quantity)
  - Each unit gets unique product_id
  - Each unit links to brand_id and category_id
  - Each unit has same product_name as brand_name
- Insert in batches of 100
- Log progress every 100 units
- Log: "✓ X products created"
```

---

## 📊 Console Output Example

### During Processing

```bash
ℹ️ [INFO] Processing table 1/1: product
   Details: {
     "tableName": "product",
     "fieldMappings": 7,
     "confidence": 0.92
   }

ℹ️ [INFO] Detected product table - checking for hierarchy requirements

ℹ️ [INFO] 🏗️  Starting product hierarchy processing
   Details: {
     "totalItems": 25
   }

🔄 [PROGRESS] Step 1/4: Analyzing product data structure

✅ [SUCCESS] Product structure analyzed
   Details: {
     "uniqueCategories": 5,
     "uniqueBrands": 25,
     "totalCSVItems": 25,
     "totalProductUnitsToCreate": 1234
   }

🔄 [PROGRESS] Step 2/4: Creating 5 product categories

✅ [SUCCESS] ✓ 5 categories created

🔄 [PROGRESS] Step 3/4: Creating 25 product brands

✅ [SUCCESS] ✓ 25 brands created

🔄 [PROGRESS] Step 4/4: Creating 1234 individual product units

🔄 [PROGRESS] Created 100/1234 product units
🔄 [PROGRESS] Created 200/1234 product units
...

ℹ️ [INFO] Inserting 1234 products in 13 batches

✅ [SUCCESS] Batch 1/13 inserted (100/1234 total)
✅ [SUCCESS] Batch 2/13 inserted (200/1234 total)
...

✅ [SUCCESS] 🎉 Product hierarchy processing complete
   Details: {
     "categoriesCreated": 5,
     "brandsCreated": 25,
     "productsCreated": 1234,
     "totalItems": 25,
     "successRate": "100.0%"
   }
```

---

## 🔍 Query Examples

### Finding Products by Category

```sql
SELECT 
    p.product_id,
    p.product_name,
    pb.brand_name,
    pc.category_name,
    p.price,
    p.status
FROM product p
JOIN product_brand pb ON p.brand_id = pb.brand_id
JOIN product_category pc ON p.category_id = pc.category_id
WHERE pc.category_name = 'Electronics'
    AND p.business_id = 'your-business-id';
```

### Count Products by Brand

```sql
SELECT 
    pb.brand_name,
    COUNT(p.product_id) as total_units,
    pb.unit_price,
    SUM(p.price) as total_inventory_value
FROM product_brand pb
LEFT JOIN product p ON pb.brand_id = p.brand_id
WHERE pb.business_id = 'your-business-id'
GROUP BY pb.brand_id, pb.brand_name, pb.unit_price
ORDER BY total_units DESC;
```

### Inventory Summary by Category

```sql
SELECT 
    pc.category_name,
    COUNT(DISTINCT pb.brand_id) as unique_brands,
    COUNT(p.product_id) as total_units,
    SUM(p.selling_price) as total_value
FROM product_category pc
LEFT JOIN product_brand pb ON pc.category_id = pb.category_id
LEFT JOIN product p ON pb.brand_id = p.brand_id
WHERE pc.business_id = 'your-business-id'
GROUP BY pc.category_id, pc.category_name
ORDER BY total_units DESC;
```

---

## ⚠️ Important Considerations

### 1. Stock Quantity Impact

**CSV Stock = Number of Product Records**

```
Stock: 100 → Creates 100 individual product records
Stock: 1000 → Creates 1000 individual product records
```

⚠️ **Large stock quantities will create many records!**

### 2. Performance

- Products inserted in batches of 100
- Progress logged every 100 units
- Large inventories (1000+ items with high stock) may take several minutes

### 3. Storage

Each product record uses approximately:
- **Database row**: ~500 bytes
- **1000 products**: ~500 KB
- **10,000 products**: ~5 MB
- **100,000 products**: ~50 MB

### 4. Use Cases

**When to use this system:**
✅ Retail inventory with individual unit tracking
✅ Serial number management
✅ Individual product history tracking
✅ Per-unit status tracking (sold, available, damaged, etc.)

**When NOT to use:**
❌ Bulk commodity tracking (use quantity field instead)
❌ Very large inventories (10,000+ items × 100+ stock each)
❌ When you only need aggregate counts

---

## 🛠️ Configuration Options

### Disable Individual Unit Expansion

If you want to create just ONE product record per CSV row (ignore stock), modify:

```javascript
// In processProductHierarchy(), change:
for (let unitNum = 1; unitNum <= stock; unitNum++) {

// To:
for (let unitNum = 1; unitNum <= 1; unitNum++) {
```

### Add Custom Fields

To include additional CSV fields in products:

```javascript
// In processProductHierarchy(), add to product object:
const product = {
    // ... existing fields ...
    custom_field: doc['YourCSVColumn'],
    // ... rest of fields ...
};
```

---

## 🧪 Testing

### Test with Sample Data

1. Upload the sample CSV via frontend uploads component
2. Trigger mapping: `POST /api/data/map/:businessId`
3. Check logs for hierarchy processing:

```bash
docker compose logs -f backend | grep "product hierarchy"
```

### Verify Results

```sql
-- Check categories
SELECT * FROM product_category WHERE business_id = 'your-id';

-- Check brands
SELECT * FROM product_brand WHERE business_id = 'your-id';

-- Check products (limit for large datasets)
SELECT * FROM product WHERE business_id = 'your-id' LIMIT 10;

-- Count products per brand
SELECT brand_id, COUNT(*) as units
FROM product 
WHERE business_id = 'your-id'
GROUP BY brand_id;
```

---

## 📈 Benefits

### ✅ Proper Normalization
- No data duplication
- Consistent category/brand definitions
- Easy to update prices or descriptions

### ✅ Flexible Querying
- Find all products in a category
- Track individual unit status
- Calculate inventory values
- Generate reports by brand or category

### ✅ Scalable Structure
- Add new categories without restructuring
- Link products to orders via product_id
- Track individual unit sales history

### ✅ Data Integrity
- Foreign key relationships maintained
- Upsert prevents duplicates
- Consistent ID generation

---

## 🎓 Example Use Cases

### Use Case 1: Individual Unit Tracking

**Scenario**: Electronics store tracking each phone by serial number

```csv
Item name: Samsung Galaxy S23
Stock: 50
```

**Result**: 50 product records, each representing one phone  
**Benefit**: Track which specific unit was sold, to whom, warranty status

### Use Case 2: Clothing Inventory

**Scenario**: Fashion store with multiple sizes/colors

```csv
Item name: Cotton T-Shirt - Blue - Size M
Stock: 85
```

**Result**: 85 product records for this specific SKU  
**Benefit**: Know exactly how many units of this exact variant are available

### Use Case 3: Multi-Location Inventory

**Scenario**: Business with multiple stores

```csv
Item name: Yoga Mat
Stock: 35
```

**Result**: 35 product records  
**Benefit**: Assign each unit to a specific store location via `stored_location` field

---

## 🔄 Migration Path

### From Old System (No Hierarchy)

If you have existing product data without hierarchy:

1. Export current products
2. Generate CSV with Type/Category
3. Re-import using new hierarchy system
4. Old products can coexist (no category_id/brand_id)

### To New System

The hierarchy processing is automatic when:
- Table detected as `product`
- CSV has `Stock` field
- Item name and Type fields present

---

## 📞 Support & Troubleshooting

### Common Issues

**Issue**: "No products created"  
**Solution**: Check that CSV has `Item name`, `Type`, and `Stock` fields

**Issue**: "Too many products created"  
**Solution**: Stock value may be too high, verify CSV data

**Issue**: "Duplicate brand_id error"  
**Solution**: Should not happen with upsert, check logs for details

### Debug Logging

Enable detailed product hierarchy logs:

```bash
docker compose logs -f backend | grep -E "product|hierarchy|brand|category"
```

---

**Last Updated:** November 6, 2025  
**Version:** 2.3.0  
**Status:** ✅ Production Ready
