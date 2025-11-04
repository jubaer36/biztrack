-- Migration: 003_create_merchandising_schema.sql
-- Description: Creates the complete database schema for the merchandising company
-- This schema is designed for a separate Supabase schema within the main database

-- Create the schema
CREATE SCHEMA IF NOT EXISTS merchandising;

-- Create product_category table
CREATE TABLE merchandising.product_category (
    category_id SERIAL PRIMARY KEY,
    category_name VARCHAR(255),
    description TEXT
);

-- Create product_brand table
CREATE TABLE merchandising.product_brand (
    brand_id SERIAL PRIMARY KEY,
    brand_name VARCHAR(255),
    description TEXT,
    unit_price DECIMAL(10,2)
);

-- Create supplier table
CREATE TABLE merchandising.supplier (
    supplier_id SERIAL PRIMARY KEY,
    supplier_name VARCHAR(255),
    contact_person VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT
);

-- Create customer table
CREATE TABLE merchandising.customer (
    customer_id SERIAL PRIMARY KEY,
    customer_name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    billing_address TEXT,
    shipping_address TEXT,
    customer_type VARCHAR(100)
);

-- Create investor table
CREATE TABLE merchandising.investor (
    investor_id SERIAL PRIMARY KEY,
    investor_name VARCHAR(255),
    contact_person VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    initial_investment_date DATE,
    investment_terms TEXT,
    status VARCHAR(100)
);

-- Create investment table
CREATE TABLE merchandising.investment (
    investment_id SERIAL PRIMARY KEY,
    investor_id INTEGER REFERENCES merchandising.investor(investor_id),
    investment_amount DECIMAL(15,2),
    investment_date DATE
);

-- Create investors_capital table
CREATE TABLE merchandising.investors_capital (
    capital_id SERIAL PRIMARY KEY,
    investor_id INTEGER REFERENCES merchandising.investor(investor_id),
    calculation_date DATE,
    current_capital DECIMAL(15,2),
    total_invested DECIMAL(15,2),
    total_returned DECIMAL(15,2),
    net_capital DECIMAL(15,2),
    current_roi DECIMAL(10,4),
    profit_share_paid DECIMAL(15,2),
    last_profit_calculation_date DATE,
    notes TEXT
);

-- Create product table
CREATE TABLE merchandising.product (
    product_id VARCHAR(100) PRIMARY KEY,
    product_name VARCHAR(255),
    description TEXT,
    category_id INTEGER REFERENCES merchandising.product_category(category_id),
    brand_id INTEGER REFERENCES merchandising.product_brand(brand_id),
    supplier_id INTEGER REFERENCES merchandising.supplier(supplier_id),
    price DECIMAL(10,2),
    selling_price DECIMAL(10,2),
    status TEXT,
    created_date TIMESTAMP,
    expense DECIMAL(10,2),
    stored_location VARCHAR(255)
);

-- Create purchase_order table
CREATE TABLE merchandising.purchase_order (
    purchase_order_id SERIAL PRIMARY KEY,
    supplier_id INTEGER REFERENCES merchandising.supplier(supplier_id),
    order_date TIMESTAMP,
    delivery_date DATE,
    status VARCHAR(100),
    total_amount DECIMAL(15,2),
    notes TEXT
);

-- Create purchase_order_items table
CREATE TABLE merchandising.purchase_order_items (
    purchase_order_id INTEGER REFERENCES merchandising.purchase_order(purchase_order_id),
    product_brand_id INTEGER REFERENCES merchandising.product_brand(brand_id),
    quantity_ordered INTEGER,
    unit_cost DECIMAL(10,2),
    line_total DECIMAL(10,2),
    PRIMARY KEY (purchase_order_id, product_brand_id)
);

-- Create sales_order table
CREATE TABLE merchandising.sales_order (
    sales_order_id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES merchandising.customer(customer_id),
    order_date TIMESTAMP,
    status VARCHAR(100),
    total_amount DECIMAL(15,2),
    shipping_address TEXT,
    product_received_date TIMESTAMP  -- Corrected from product_received_data
);

-- Create sales_order_items table
CREATE TABLE merchandising.sales_order_items (
    sales_order_id INTEGER REFERENCES merchandising.sales_order(sales_order_id),
    product_id VARCHAR(100) REFERENCES merchandising.product(product_id),
    line_total DECIMAL(10,2),
    PRIMARY KEY (sales_order_id, product_id)
);