# Product Hierarchy - Quick Reference

## CSV → Database Transformation

### Example: 3 Items with Different Stock Quantities

```
CSV Input (3 rows):
┌─────────┬────────────────────────────────────┬─────────────┬────────┬────────┐
│ Item ID │ Item name                          │ Type        │ Price  │ Stock  │
├─────────┼────────────────────────────────────┼─────────────┼────────┼────────┤
│ ITM001  │ Wireless Bluetooth Headphones      │ Electronics │ 79.99  │ 45     │
│ ITM002  │ Smartphone Case - iPhone 13        │ Electronics │ 19.99  │ 120    │
│ ITM003  │ Cotton T-Shirt - Blue              │ Clothing    │ 14.99  │ 85     │
└─────────┴────────────────────────────────────┴─────────────┴────────┴────────┘

Database Output:
═══════════════════════════════════════════════════════════════════════════════

TABLE: product_category (2 rows)
┌──────────────┬────────────────┐
│ category_id  │ category_name  │
├──────────────┼────────────────┤
│ 1234567      │ Electronics    │
│ 7891011      │ Clothing       │
└──────────────┴────────────────┘

TABLE: product_brand (3 rows)
┌───────────┬────────────────────────────────────┬──────────────┬────────────┐
│ brand_id  │ brand_name                         │ category_id  │ unit_price │
├───────────┼────────────────────────────────────┼──────────────┼────────────┤
│ 9876543   │ Wireless Bluetooth Headphones      │ 1234567      │ 79.99      │
│ 5432109   │ Smartphone Case - iPhone 13        │ 1234567      │ 19.99      │
│ 1357924   │ Cotton T-Shirt - Blue              │ 7891011      │ 14.99      │
└───────────┴────────────────────────────────────┴──────────────┴────────────┘

TABLE: product (250 rows = 45 + 120 + 85)
┌────────────┬────────────────────────────────────┬───────────┬──────────────┬────────┐
│ product_id │ product_name                       │ brand_id  │ category_id  │ price  │
├────────────┼────────────────────────────────────┼───────────┼──────────────┼────────┤
│ 100001     │ Wireless Bluetooth Headphones      │ 9876543   │ 1234567      │ 79.99  │
│ 100002     │ Wireless Bluetooth Headphones      │ 9876543   │ 1234567      │ 79.99  │
│ ...        │ ... (43 more units)                │ ...       │ ...          │ ...    │
│ 100045     │ Wireless Bluetooth Headphones      │ 9876543   │ 1234567      │ 79.99  │
├────────────┼────────────────────────────────────┼───────────┼──────────────┼────────┤
│ 100046     │ Smartphone Case - iPhone 13        │ 5432109   │ 1234567      │ 19.99  │
│ 100047     │ Smartphone Case - iPhone 13        │ 5432109   │ 1234567      │ 19.99  │
│ ...        │ ... (118 more units)               │ ...       │ ...          │ ...    │
│ 100165     │ Smartphone Case - iPhone 13        │ 5432109   │ 1234567      │ 19.99  │
├────────────┼────────────────────────────────────┼───────────┼──────────────┼────────┤
│ 100166     │ Cotton T-Shirt - Blue              │ 1357924   │ 7891011      │ 14.99  │
│ 100167     │ Cotton T-Shirt - Blue              │ 1357924   │ 7891011      │ 14.99  │
│ ...        │ ... (83 more units)                │ ...       │ ...          │ ...    │
│ 100250     │ Cotton T-Shirt - Blue              │ 1357924   │ 7891011      │ 14.99  │
└────────────┴────────────────────────────────────┴───────────┴──────────────┴────────┘

RESULT: 3 CSV rows → 2 categories + 3 brands + 250 individual products
```

## Relationship Diagram

```
product_category              product_brand                    product
┌──────────────┐             ┌───────────────┐               ┌──────────────┐
│ category_id  │◄────────────│  category_id  │               │ category_id  │
│              │             │               │               │              │
│ Electronics  │             │ Headphones    │◄──────────────│ brand_id     │
│              │             │  unit_price:  │               │              │
│              │             │  $79.99       │               │ Unit 1       │
│              │             │               │               │ Unit 2       │
│              │             │               │               │ ...          │
│              │             │               │               │ Unit 45      │
└──────────────┘             └───────────────┘               └──────────────┘
      1                             Many                           Many
```

## Key Formula

```
Total Product Records = Σ(Stock for each CSV row)

Example:
  CSV Row 1: Stock = 45
  CSV Row 2: Stock = 120  
  CSV Row 3: Stock = 85
  ─────────────────────────
  Total Products: 250
```

## Processing Summary

```
📊 CSV Analysis
   ├─ 3 CSV rows read
   ├─ 2 unique categories found (Electronics, Clothing)
   ├─ 3 unique brands found (item names)
   └─ 250 total product units calculated (sum of stock)

🏗️ Database Creation
   ├─ Step 1: Create 2 categories
   ├─ Step 2: Create 3 brands (linked to categories)
   └─ Step 3: Create 250 individual products (linked to brands)

✅ Result
   ├─ product_category: 2 records
   ├─ product_brand: 3 records  
   └─ product: 250 records
```

## When to Use This System

### ✅ GOOD Use Cases
- Tracking individual electronics with serial numbers
- Clothing inventory with per-unit status
- Items that need individual history (sales, returns, repairs)
- Multiple store locations needing unit assignments

### ❌ NOT Recommended
- Bulk commodities (e.g., "Bag of Rice - 100kg")
- Very high stock quantities (10,000+ units per item)
- Aggregate-only reporting (just totals needed)

## Quick Test

```bash
# 1. Upload CSV via frontend
# 2. Trigger mapping
curl -X POST http://localhost:5000/api/data/map/YOUR_BUSINESS_ID

# 3. Check results
docker compose logs -f backend | grep "product hierarchy"

# 4. Query database
SELECT 
    pc.category_name,
    pb.brand_name,
    COUNT(p.product_id) as units
FROM product_category pc
JOIN product_brand pb ON pc.category_id = pb.category_id  
JOIN product p ON pb.brand_id = p.brand_id
GROUP BY pc.category_name, pb.brand_name;
```

---

**Key Point**: When brand is not specified in CSV, the **Item Name becomes the Brand Name** to maintain relational integrity. Each physical unit gets its own product record based on the Stock quantity.
