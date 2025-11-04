-- Migration: 004_insert_merchandising_sample_data.sql
-- Description: Inserts sample data into the merchandising schema for testing purposes

-- Insert sample product categories
INSERT INTO merchandising.product_category (category_name, description) VALUES
('Electronics', 'Electronic devices and accessories'),
('Clothing', 'Apparel and fashion items'),
('Home & Garden', 'Home improvement and gardening products'),
('Sports', 'Sports equipment and apparel');

-- Insert sample product brands
INSERT INTO merchandising.product_brand (brand_name, description, unit_price) VALUES
('Apple', 'Premium electronics brand', 999.99),
('Nike', 'Athletic footwear and apparel', 129.99),
('Samsung', 'Consumer electronics', 799.99),
('Adidas', 'Sports and lifestyle brand', 89.99);

-- Insert sample suppliers
INSERT INTO merchandising.supplier (supplier_name, contact_person, email, phone, address) VALUES
('Tech Distributors Inc.', 'John Smith', 'john@techdist.com', '+1-555-0101', '123 Tech Street, Silicon Valley, CA'),
('Fashion Wholesale Co.', 'Sarah Johnson', 'sarah@fashionwholesale.com', '+1-555-0102', '456 Fashion Ave, New York, NY'),
('Home Goods Supply', 'Mike Davis', 'mike@homegoods.com', '+1-555-0103', '789 Home Blvd, Chicago, IL');

-- Insert sample customers
INSERT INTO merchandising.customer (customer_name, email, phone, billing_address, shipping_address, customer_type) VALUES
('Alice Cooper', 'alice@email.com', '+1-555-0201', '100 Main St, Boston, MA', '100 Main St, Boston, MA', 'Retail'),
('Bob Wilson', 'bob@email.com', '+1-555-0202', '200 Oak Ave, Seattle, WA', '200 Oak Ave, Seattle, WA', 'Wholesale'),
('Carol Brown', 'carol@email.com', '+1-555-0203', '300 Pine Rd, Austin, TX', '300 Pine Rd, Austin, TX', 'Retail');

-- Insert sample investors
INSERT INTO merchandising.investor (investor_name, contact_person, email, phone, address, initial_investment_date, investment_terms, status) VALUES
('Venture Capital Partners', 'David Lee', 'david@vcpartners.com', '+1-555-0301', '500 Investment Way, San Francisco, CA', '2023-01-15', 'Standard equity terms', 'Active'),
('Angel Investors Group', 'Emma White', 'emma@angelinvestors.com', '+1-555-0302', '600 Angel St, Los Angeles, CA', '2023-03-20', 'Preferred shares', 'Active');

-- Insert sample investments
INSERT INTO merchandising.investment (investor_id, investment_amount, investment_date) VALUES
(1, 50000.00, '2023-01-15'),
(2, 25000.00, '2023-03-20'),
(1, 30000.00, '2023-06-10');

-- Insert sample investors capital
INSERT INTO merchandising.investors_capital (investor_id, calculation_date, current_capital, total_invested, total_returned, net_capital, current_roi, profit_share_paid, last_profit_calculation_date, notes) VALUES
(1, '2024-01-01', 85000.00, 80000.00, 5000.00, 85000.00, 0.0625, 2500.00, '2023-12-31', 'Quarterly profit distribution'),
(2, '2024-01-01', 27500.00, 25000.00, 2500.00, 27500.00, 0.1000, 1250.00, '2023-12-31', 'Annual ROI calculation');

-- Insert sample products
INSERT INTO merchandising.product (product_id, product_name, description, category_id, brand_id, supplier_id, price, selling_price, status, created_date, expense, stored_location) VALUES
('PROD001', 'iPhone 15', 'Latest smartphone from Apple', 1, 1, 1, 999.99, 1099.99, 'Active', '2024-01-01 10:00:00', 50.00, 'Warehouse A'),
('PROD002', 'Air Jordan Sneakers', 'Basketball shoes', 4, 2, 2, 129.99, 149.99, 'Active', '2024-01-02 11:00:00', 20.00, 'Warehouse B'),
('PROD003', 'Samsung Galaxy S24', 'Android smartphone', 1, 3, 1, 799.99, 899.99, 'Active', '2024-01-03 12:00:00', 40.00, 'Warehouse A'),
('PROD004', 'Nike Running Shirt', 'Athletic wear', 2, 2, 2, 29.99, 39.99, 'Active', '2024-01-04 13:00:00', 5.00, 'Warehouse C');

-- Insert sample purchase orders
INSERT INTO merchandising.purchase_order (supplier_id, order_date, delivery_date, status, total_amount, notes) VALUES
(1, '2024-01-05 09:00:00', '2024-01-15', 'Delivered', 1799.98, 'Electronics shipment'),
(2, '2024-01-06 10:00:00', '2024-01-20', 'In Transit', 159.98, 'Sports apparel order');

-- Insert sample purchase order items
INSERT INTO merchandising.purchase_order_items (purchase_order_id, product_brand_id, quantity_ordered, unit_cost, line_total) VALUES
(1, 1, 2, 999.99, 1999.98),
(1, 3, 1, 799.99, 799.99),
(2, 2, 5, 25.00, 125.00),
(2, 4, 3, 15.00, 45.00);

-- Insert sample sales orders
INSERT INTO merchandising.sales_order (customer_id, order_date, status, total_amount, shipping_address, product_received_date) VALUES
(1, '2024-01-10 14:00:00', 'Completed', 1249.98, '100 Main St, Boston, MA', '2024-01-12 16:00:00'),
(2, '2024-01-11 15:00:00', 'Shipped', 189.98, '200 Oak Ave, Seattle, WA', NULL),
(3, '2024-01-12 16:00:00', 'Processing', 39.99, '300 Pine Rd, Austin, TX', NULL);

-- Insert sample sales order items
INSERT INTO merchandising.sales_order_items (sales_order_id, product_id, line_total) VALUES
(1, 'PROD001', 1099.99),
(1, 'PROD003', 899.99),
(2, 'PROD002', 149.99),
(3, 'PROD004', 39.99);