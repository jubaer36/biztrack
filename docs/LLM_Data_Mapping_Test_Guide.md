# LLM-Based Data Mapping Algorithm - Testing Guide

## Overview
This algorithm automatically converts unstructured Excel data from MongoDB into a structured business intelligence database in Supabase using AI (Groq LLM).

## How It Works
1. **Analyzes Excel data** uploaded to MongoDB collections
2. **Uses AI (Groq LLM)** to determine the best mapping to structured database tables
3. **Transforms and stores data** directly in Supabase database tables
4. **Prioritizes cash flow data** (prices, amounts, costs) for business intelligence

## Testing Steps

### 1. Prepare Test Data
Create Excel files with typical business data:

**sales_data.xlsx:**
```
Date        | Customer Name | Product      | Quantity | Unit Price | Total Amount | Payment Method
2024-01-15  | John Doe     | Cotton Shirt | 5        | 25.00     | 125.00      | Cash
2024-01-16  | Jane Smith   | Denim Jacket | 2        | 75.50     | 151.00      | Credit Card
2024-01-17  | Mike Brown   | Cotton Shirt | 3        | 25.00     | 75.00       | Cash
```

**product_inventory.xlsx:**
```
Product ID | Product Name | Category  | Brand     | Cost Price | Selling Price | Stock Qty | Supplier Name
PROD001   | Cotton Shirt | Clothing  | ComfortW  | 15.00     | 25.00        | 100      | Textile Corp
PROD002   | Denim Jacket | Outerwear | StyleMax  | 45.00     | 75.50        | 25       | Fashion Imports
```

**customer_data.xlsx:**
```
Customer Name | Email           | Phone        | Address              | Customer Type
John Doe     | john@email.com  | +1234567890  | 123 Main St, NY     | Retail
Jane Smith   | jane@email.com  | +1234567891  | 456 Oak Ave, CA     | Wholesale
Mike Brown   | mike@email.com  | +1234567892  | 789 Pine Rd, TX     | Retail
```

### 2. Upload Data to MongoDB
1. Go to your business page: `/businesses/[business-id]`
2. Use "Choose Excel Files" to upload your test files
3. Verify upload success in "Uploaded Data Collections"

### 3. Run AI Mapping
1. In the "🤖 AI-Powered Data Mapping" section
2. Check the status overview showing Excel collections
3. Click "🚀 Start AI Mapping to Supabase"
4. Wait for processing to complete

### 4. Verify Results in Supabase
Check your Supabase database for these tables with mapped data:

**Expected Mappings:**
- **sales_data.xlsx** → `sales_order` + `sales_order_items` + `customer` + `product`
- **product_inventory.xlsx** → `product` + `product_category` + `product_brand` + `supplier`
- **customer_data.xlsx** → `customer`

**Key Fields Prioritized:**
- 💰 Price fields: `unit_price`, `cost_price`, `selling_price`, `total_amount`
- 📅 Date fields: `order_date`, `created_date`
- 🏷️ ID fields: Auto-generated primary and foreign keys
- 📧 Contact fields: Email, phone validation and formatting

### 5. View Unified Data
1. Click "View Unified Data" on your business page
2. Browse the structured tables with properly mapped data
3. Compare with "View Raw Data" to see the transformation

## API Endpoints

### Start Mapping Process
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/mapping/map/YOUR_BUSINESS_ID
```

### Check Mapping Status
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/mapping/mapping-status/YOUR_BUSINESS_ID
```

### Clear Mapped Data (for re-testing)
```bash
curl -X DELETE \
  -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/mapping/clear-mapped/YOUR_BUSINESS_ID
```

## Expected AI Behavior

The LLM (Groq Llama 3.1 70B) will:

1. **Identify data types** from field names and sample values
2. **Determine target tables** based on business logic understanding
3. **Map cash flow fields** with high priority (prices, amounts, costs)
4. **Handle relationships** between entities (customers, products, orders)
5. **Generate missing IDs** for primary/foreign key relationships
6. **Transform data types** (string numbers → decimals, date strings → timestamps)

## Sample Mapping Results

**Sales Data Mapping:**
```
Source: "Customer Name" → Target: customer.customer_name
Source: "Product" → Target: product.product_name  
Source: "Unit Price" → Target: sales_order_items.unit_cost 💰
Source: "Total Amount" → Target: sales_order.total_amount 💰
Source: "Date" → Target: sales_order.order_date 📅
```

**Product Data Mapping:**
```
Source: "Product ID" → Target: product.product_id
Source: "Cost Price" → Target: product.price 💰
Source: "Selling Price" → Target: product.selling_price 💰
Source: "Category" → Target: product_category.category_name
Source: "Brand" → Target: product_brand.brand_name
```

## Troubleshooting

**If mapping fails:**
1. Check browser console for errors
2. Verify Groq API key is valid in `.env`
3. Ensure Supabase permissions are correct
4. Try with smaller, simpler Excel files first
5. Check backend logs for detailed error messages

**Common issues:**
- Empty or invalid Excel files
- Missing required environment variables
- Supabase table permission errors
- Network connectivity to Groq API

## Success Indicators

✅ **Successful mapping shows:**
- Green "✅ Data Mapped" badge
- Data count in unified tables
- Properly structured data in Supabase
- Functional "View Unified Data" page

The algorithm transforms messy Excel data into a clean, structured business intelligence database ready for analytics and forecasting!