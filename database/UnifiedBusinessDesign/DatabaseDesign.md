# Database Design for Merchandising Company

## Overview
This document outlines the database schema for a merchandising company, including tables for product categories, brands, suppliers, customers, investors, products, purchase orders, and sales orders.

## Tables

### product_category
- `category_id` (INT) - Primary Key
- `category_name` (VARCHAR)
- `description` (TEXT)

### product_brand
- `brand_id` (INT) - Primary Key
- `brand_name` (VARCHAR)
- `description` (TEXT)
- `unit_price` (DECIMAL)

### supplier
- `supplier_id` (INT) - Primary Key
- `supplier_name` (VARCHAR)
- `contact_person` (VARCHAR)
- `email` (VARCHAR)
- `phone` (VARCHAR)
- `address` (TEXT)

### customer
- `customer_id` (INT) - Primary Key
- `customer_name` (VARCHAR)
- `email` (VARCHAR)
- `phone` (VARCHAR)
- `billing_address` (TEXT)
- `shipping_address` (TEXT)
- `customer_type` (VARCHAR)

### investor
- `investor_id` (INT) - Primary Key
- `investor_name` (VARCHAR)
- `contact_person` (VARCHAR)
- `email` (VARCHAR)
- `phone` (VARCHAR)
- `address` (TEXT)
- `initial_investment_date` (DATE)
- `investment_terms` (TEXT)
- `status` (VARCHAR)

### investment
- `investment_id` (INT) - Primary Key
- `investor_id` (INT) - Foreign Key to investor
- `investment_amount` (DECIMAL)
- `investment_date` (DATE)

### investors_capital
- `capital_id` (INT) - Primary Key
- `investor_id` (INT) - Foreign Key to investor
- `calculation_date` (DATE)
- `current_capital` (DECIMAL)
- `total_invested` (DECIMAL)
- `total_returned` (DECIMAL)
- `net_capital` (DECIMAL)
- `current_roi` (DECIMAL)
- `profit_share_paid` (DECIMAL)
- `last_profit_calculation_date` (DATE)
- `notes` (TEXT)

### product
- `product_id` (VARCHAR) - Primary Key
- `product_name` (VARCHAR)
- `description` (TEXT)
- `category_id` (INT) - Foreign Key to product_category
- `brand_id` (INT) - Foreign Key to product_brand
- `supplier_id` (INT) - Foreign Key to supplier
- `price` (DECIMAL)
- `selling_price` (DECIMAL)
- `status` (TEXT)
- `created_date` (DATETIME)
- `expense` (DECIMAL)
- `stored_location` (VARCHAR)

### purchase_order
- `purchase_order_id` (INT) - Primary Key
- `supplier_id` (INT) - Foreign Key to supplier
- `order_date` (DATETIME)
- `delivery_date` (DATE)
- `status` (VARCHAR)
- `total_amount` (DECIMAL)
- `notes` (TEXT)

### purchase_order_items
- `purchase_order_id` (INT) - Foreign Key to purchase_order
- `product_brand_id` (VARCHAR) - Foreign Key to product_brand
- `quantity_ordered` (INT)
- `unit_cost` (DECIMAL)
- `line_total` (DECIMAL)

### sales_order
- `sales_order_id` (INT) - Primary Key
- `customer_id` (INT) - Foreign Key to customer
- `order_date` (DATETIME)
- `status` (VARCHAR)
- `total_amount` (DECIMAL)
- `shipping_address` (TEXT)
- `product_received_data` (DATETIME)

### sales_order_items
- `sales_order_id` (INT) - Foreign Key to sales_order
- `product_id` (VARCHAR) - Foreign Key to product
- `line_total` (DECIMAL)
