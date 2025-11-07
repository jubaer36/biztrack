-- Migration: 004_insert_merchandising_sample_data.sql
-- Description: Inserts sample data into the merchandising schema for testing purposes

-- First, truncate all tables and reset sequences to ensure clean start
TRUNCATE TABLE public.sales_order_items RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.purchase_order_items RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.sales_order RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.purchase_order RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.product RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.investors_capital RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.investment RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.investor RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.customer RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.supplier RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.product_brand RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.product_category RESTART IDENTITY CASCADE;

-- Insert sample product categories
INSERT INTO public.product_category (business_id, category_name, description) VALUES
('09c3d58e-b7d1-41f1-be37-e648f559387b', 'Electronics', 'Electronic devices and accessories'),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 'Clothing', 'Apparel and fashion items'),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 'Home & Garden', 'Home improvement and gardening products'),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 'Sports', 'Sports equipment and apparel');

-- Insert sample product brands
INSERT INTO public.product_brand (business_id, brand_name, description, unit_price) VALUES
('09c3d58e-b7d1-41f1-be37-e648f559387b', 'Apple', 'Premium electronics brand', 999.99),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 'Nike', 'Athletic footwear and apparel', 129.99),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 'Samsung', 'Consumer electronics', 799.99),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 'Adidas', 'Sports and lifestyle brand', 89.99);

-- Insert sample suppliers
INSERT INTO public.supplier (business_id, supplier_name, contact_person, email, phone, address) VALUES
('09c3d58e-b7d1-41f1-be37-e648f559387b', 'Tech Distributors Inc.', 'John Smith', 'john@techdist.com', '+1-555-0101', '123 Tech Street, Silicon Valley, CA'),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 'Fashion Wholesale Co.', 'Sarah Johnson', 'sarah@fashionwholesale.com', '+1-555-0102', '456 Fashion Ave, New York, NY'),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 'Home Goods Supply', 'Mike Davis', 'mike@homegoods.com', '+1-555-0103', '789 Home Blvd, Chicago, IL');

-- Insert sample customers
INSERT INTO public.customer (business_id, customer_name, email, phone, billing_address, shipping_address, customer_type) VALUES
('09c3d58e-b7d1-41f1-be37-e648f559387b', 'Alice Cooper', 'alice@email.com', '+1-555-0201', '100 Main St, Boston, MA', '100 Main St, Boston, MA', 'Retail'),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 'Bob Wilson', 'bob@email.com', '+1-555-0202', '200 Oak Ave, Seattle, WA', '200 Oak Ave, Seattle, WA', 'Wholesale'),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 'Carol Brown', 'carol@email.com', '+1-555-0203', '300 Pine Rd, Austin, TX', '300 Pine Rd, Austin, TX', 'Retail');

-- Insert sample investors
INSERT INTO public.investor (business_id, investor_name, contact_person, email, phone, address, initial_investment_date, investment_terms, status) VALUES
('09c3d58e-b7d1-41f1-be37-e648f559387b', 'Venture Capital Partners', 'David Lee', 'david@vcpartners.com', '+1-555-0301', '500 Investment Way, San Francisco, CA', '2023-01-15', 'Standard equity terms', 'Active'),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 'Angel Investors Group', 'Emma White', 'emma@angelinvestors.com', '+1-555-0302', '600 Angel St, Los Angeles, CA', '2023-03-20', 'Preferred shares', 'Active');

-- Insert sample investments
INSERT INTO public.investment (business_id, investor_id, investment_amount, investment_date) VALUES
('09c3d58e-b7d1-41f1-be37-e648f559387b', 1, 50000.00, '2023-01-15'),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 2, 25000.00, '2023-03-20'),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 1, 30000.00, '2023-06-10');

-- Insert sample investors capital
INSERT INTO public.investors_capital (business_id, investor_id, calculation_date, current_capital, total_invested, total_returned, net_capital, current_roi, profit_share_paid, last_profit_calculation_date, notes) VALUES
('09c3d58e-b7d1-41f1-be37-e648f559387b', 1, '2024-01-01', 85000.00, 80000.00, 5000.00, 85000.00, 0.0625, 2500.00, '2023-12-31', 'Quarterly profit distribution'),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 2, '2024-01-01', 27500.00, 25000.00, 2500.00, 27500.00, 0.1000, 1250.00, '2023-12-31', 'Annual ROI calculation');

-- Insert sample products
INSERT INTO public.product (business_id, product_id, product_name, description, category_id, brand_id, supplier_id, price, selling_price, status, created_date, expense, stored_location) VALUES
('09c3d58e-b7d1-41f1-be37-e648f559387b', 'PROD001', 'iPhone 15', 'Latest smartphone from Apple', 1, 1, 1, 999.99, 1099.99, 'Active', '2024-01-01 10:00:00', 50.00, 'Warehouse A'),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 'PROD002', 'Air Jordan Sneakers', 'Basketball shoes', 4, 2, 2, 129.99, 149.99, 'Active', '2024-01-02 11:00:00', 20.00, 'Warehouse B'),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 'PROD003', 'Samsung Galaxy S24', 'Android smartphone', 1, 3, 1, 799.99, 899.99, 'Active', '2024-01-03 12:00:00', 40.00, 'Warehouse A'),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 'PROD004', 'Nike Running Shirt', 'Athletic wear', 2, 2, 2, 29.99, 39.99, 'Active', '2024-01-04 13:00:00', 5.00, 'Warehouse C');

-- Insert sample purchase orders
INSERT INTO public.purchase_order (business_id, supplier_id, order_date, delivery_date, status, total_amount, notes) VALUES
('09c3d58e-b7d1-41f1-be37-e648f559387b', 1, '2024-01-05 09:00:00', '2024-01-15', 'Delivered', 1799.98, 'Electronics shipment'),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 2, '2024-01-06 10:00:00', '2024-01-20', 'In Transit', 159.98, 'Sports apparel order');

-- Insert sample purchase order items
INSERT INTO public.purchase_order_items (business_id, purchase_order_id, product_id, quantity_ordered, unit_cost, line_total) VALUES
('09c3d58e-b7d1-41f1-be37-e648f559387b', 1, 'PROD001', 1, 999.99, 999.99),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 1, 'PROD003', 1, 799.99, 799.99),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 2, 'PROD002', 1, 129.99, 129.99),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 2, 'PROD004', 1, 29.99, 29.99);

-- Insert sample sales orders
INSERT INTO public.sales_order (business_id, customer_id, order_date, status, total_amount, shipping_address, product_received_date) VALUES
('09c3d58e-b7d1-41f1-be37-e648f559387b', 1, '2024-01-10 14:00:00', 'Completed', 1249.98, '100 Main St, Boston, MA', '2024-01-12 16:00:00'),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 2, '2024-01-11 15:00:00', 'Shipped', 189.98, '200 Oak Ave, Seattle, WA', NULL),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 3, '2024-01-12 16:00:00', 'Processing', 39.99, '300 Pine Rd, Austin, TX', NULL);

-- Insert sample sales order items
INSERT INTO public.sales_order_items (business_id, sales_order_id, product_id, line_total) VALUES
('09c3d58e-b7d1-41f1-be37-e648f559387b', 1, 'PROD001', 1099.99),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 1, 'PROD003', 899.99),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 2, 'PROD002', 149.99),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 3, 'PROD004', 39.99);

-- Additional product categories
INSERT INTO public.product_category (business_id, category_name, description) VALUES
('09c3d58e-b7d1-41f1-be37-e648f559387b', 'Books', 'Books and publications'),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 'Toys', 'Toys and games'),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 'Beauty', 'Beauty and personal care'),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 'Automotive', 'Automotive parts and accessories'),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 'Health', 'Health and wellness products'),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 'Food', 'Food and beverages'),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 'Furniture', 'Furniture and home decor'),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 'Office Supplies', 'Office and stationery supplies');

-- Additional product brands
INSERT INTO public.product_brand (business_id, brand_name, description, unit_price) VALUES
('09c3d58e-b7d1-41f1-be37-e648f559387b', 'Sony', 'Consumer electronics and entertainment', 599.99),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 'Levis', 'Denim and casual wear', 79.99),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 'Coca-Cola', 'Beverages and soft drinks', 1.99),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 'Toyota', 'Automotive manufacturer', 25000.00),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 'Pfizer', 'Pharmaceutical products', 15.99),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 'Amazon', 'Online retail and technology', 199.99),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 'IKEA', 'Furniture and home goods', 149.99),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 'Microsoft', 'Software and technology', 299.99);

-- Additional suppliers
INSERT INTO public.supplier (business_id, supplier_name, contact_person, email, phone, address) VALUES
('09c3d58e-b7d1-41f1-be37-e648f559387b', 'Global Electronics Ltd.', 'Tom Wilson', 'tom@globalelec.com', '+1-555-0104', '321 Global Ave, Miami, FL'),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 'Fashion Central', 'Lisa Garcia', 'lisa@fashioncentral.com', '+1-555-0105', '654 Style Blvd, Los Angeles, CA'),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 'Home Essentials Co.', 'Robert Taylor', 'robert@homeessentials.com', '+1-555-0106', '987 Home St, Denver, CO'),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 'Sports Gear Inc.', 'Anna Martinez', 'anna@sportsgear.com', '+1-555-0107', '147 Sports Way, Phoenix, AZ'),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 'Book World Distributors', 'James Anderson', 'james@bookworld.com', '+1-555-0108', '258 Book Ln, Portland, OR'),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 'Toy Manufacturers', 'Maria Lopez', 'maria@toymanufacturers.com', '+1-555-0109', '369 Toy Rd, Atlanta, GA'),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 'Beauty Products Wholesale', 'David Rodriguez', 'david@beautywholesale.com', '+1-555-0110', '741 Beauty Dr, Nashville, TN');

-- Additional customers
INSERT INTO public.customer (business_id, customer_name, email, phone, billing_address, shipping_address, customer_type) VALUES
('09c3d58e-b7d1-41f1-be37-e648f559387b', 'David Johnson', 'david@email.com', '+1-555-0204', '400 Elm St, Miami, FL', '400 Elm St, Miami, FL', 'Retail'),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 'Emma Davis', 'emma@email.com', '+1-555-0205', '500 Pine Ave, Denver, CO', '500 Pine Ave, Denver, CO', 'Wholesale'),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 'Frank Miller', 'frank@email.com', '+1-555-0206', '600 Oak Rd, Phoenix, AZ', '600 Oak Rd, Phoenix, AZ', 'Retail'),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 'Grace Lee', 'grace@email.com', '+1-555-0207', '700 Maple Ln, Portland, OR', '700 Maple Ln, Portland, OR', 'Retail'),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 'Henry Wilson', 'henry@email.com', '+1-555-0208', '800 Cedar St, Atlanta, GA', '800 Cedar St, Atlanta, GA', 'Wholesale'),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 'Isabella Garcia', 'isabella@email.com', '+1-555-0209', '900 Birch Ave, Nashville, TN', '900 Birch Ave, Nashville, TN', 'Retail'),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 'Jack Thompson', 'jack@email.com', '+1-555-0210', '1000 Walnut Rd, Salt Lake City, UT', '1000 Walnut Rd, Salt Lake City, UT', 'Retail');

-- Additional investors
INSERT INTO public.investor (business_id, investor_name, contact_person, email, phone, address, initial_investment_date, investment_terms, status) VALUES
('09c3d58e-b7d1-41f1-be37-e648f559387b', 'Tech Ventures LLC', 'Sophia Brown', 'sophia@techventures.com', '+1-555-0303', '700 Tech Blvd, Austin, TX', '2023-05-10', 'Convertible notes', 'Active'),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 'Growth Capital Partners', 'Oliver Jones', 'oliver@growthcapital.com', '+1-555-0304', '800 Growth St, Boston, MA', '2023-07-15', 'Equity investment', 'Active'),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 'Innovation Fund', 'Ava Williams', 'ava@innovationfund.com', '+1-555-0305', '900 Innovation Ave, Seattle, WA', '2023-09-20', 'Series A funding', 'Active'),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 'Strategic Investors Inc.', 'William Garcia', 'william@strategicinv.com', '+1-555-0306', '1000 Strategy Rd, Chicago, IL', '2023-11-25', 'Strategic partnership', 'Active'),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 'Future Investments', 'Charlotte Miller', 'charlotte@futureinv.com', '+1-555-0307', '1100 Future Ln, San Diego, CA', '2024-01-30', 'Venture capital', 'Active'),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 'Capital Growth Corp', 'Benjamin Davis', 'benjamin@capitalgrowth.com', '+1-555-0308', '1200 Capital Dr, Dallas, TX', '2024-03-15', 'Growth equity', 'Active'),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 'Pioneer Ventures', 'Amelia Wilson', 'amelia@pioneerventures.com', '+1-555-0309', '1300 Pioneer Way, Miami, FL', '2024-05-20', 'Seed funding', 'Active'),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 'Elite Investment Group', 'Lucas Martinez', 'lucas@eliteinv.com', '+1-555-0310', '1400 Elite St, Denver, CO', '2024-07-25', 'Private equity', 'Active');

-- Additional investments
INSERT INTO public.investment (business_id, investor_id, investment_amount, investment_date) VALUES
('09c3d58e-b7d1-41f1-be37-e648f559387b', 3, 40000.00, '2023-05-10'),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 4, 35000.00, '2023-07-15'),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 5, 45000.00, '2023-09-20'),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 6, 55000.00, '2023-11-25'),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 7, 30000.00, '2024-01-30'),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 8, 60000.00, '2024-03-15'),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 9, 25000.00, '2024-05-20'),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 10, 70000.00, '2024-07-25'),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 1, 20000.00, '2024-09-10'),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 2, 15000.00, '2024-11-15');

-- Additional investors capital
INSERT INTO public.investors_capital (business_id, investor_id, calculation_date, current_capital, total_invested, total_returned, net_capital, current_roi, profit_share_paid, last_profit_calculation_date, notes) VALUES
('09c3d58e-b7d1-41f1-be37-e648f559387b', 3, '2024-01-01', 42000.00, 40000.00, 2000.00, 42000.00, 0.0500, 1000.00, '2023-12-31', 'Initial profit distribution'),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 4, '2024-01-01', 36750.00, 35000.00, 1750.00, 36750.00, 0.0500, 875.00, '2023-12-31', 'Quarterly returns'),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 5, '2024-01-01', 47250.00, 45000.00, 2250.00, 47250.00, 0.0500, 1125.00, '2023-12-31', 'Performance bonus'),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 6, '2024-01-01', 57750.00, 55000.00, 2750.00, 57750.00, 0.0500, 1375.00, '2023-12-31', 'Annual dividend'),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 7, '2024-01-01', 31500.00, 30000.00, 1500.00, 31500.00, 0.0500, 750.00, '2023-12-31', 'Monthly payouts'),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 8, '2024-01-01', 63000.00, 60000.00, 3000.00, 63000.00, 0.0500, 1500.00, '2023-12-31', 'Capital appreciation'),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 9, '2024-01-01', 26250.00, 25000.00, 1250.00, 26250.00, 0.0500, 625.00, '2023-12-31', 'Seed investment returns'),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 10, '2024-01-01', 73500.00, 70000.00, 3500.00, 73500.00, 0.0500, 1750.00, '2023-12-31', 'High yield investment');

-- Additional products
INSERT INTO public.product (business_id, product_id, product_name, description, category_id, brand_id, supplier_id, price, selling_price, status, created_date, expense, stored_location) VALUES
('09c3d58e-b7d1-41f1-be37-e648f559387b', 'PROD005', 'Sony PlayStation 5', 'Gaming console', 1, 5, 1, 499.99, 599.99, 'Active', '2024-01-05 14:00:00', 30.00, 'Warehouse A'),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 'PROD006', 'Levis 501 Jeans', 'Classic denim jeans', 2, 6, 2, 69.99, 89.99, 'Active', '2024-01-06 15:00:00', 10.00, 'Warehouse B'),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 'PROD007', 'Coca-Cola Classic', 'Soft drink', 10, 7, 3, 1.49, 1.99, 'Active', '2024-01-07 16:00:00', 0.50, 'Warehouse C'),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 'PROD008', 'Toyota Corolla', 'Compact car', 8, 8, 4, 20000.00, 22000.00, 'Active', '2024-01-08 17:00:00', 1000.00, 'Warehouse D'),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 'PROD009', 'Pfizer Vitamin D', 'Health supplement', 9, 9, 5, 12.99, 15.99, 'Active', '2024-01-09 18:00:00', 2.00, 'Warehouse A'),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 'PROD010', 'Amazon Echo Dot', 'Smart speaker', 1, 10, 1, 39.99, 49.99, 'Active', '2024-01-10 19:00:00', 5.00, 'Warehouse B'),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 'PROD011', 'IKEA Billy Bookcase', 'Bookshelf', 11, 11, 3, 79.99, 99.99, 'Active', '2024-01-11 20:00:00', 15.00, 'Warehouse C'),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 'PROD012', 'Microsoft Surface Pro', 'Tablet computer', 1, 12, 1, 799.99, 899.99, 'Active', '2024-01-12 21:00:00', 40.00, 'Warehouse A'),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 'PROD013', 'Adidas Ultraboost', 'Running shoes', 4, 4, 2, 179.99, 199.99, 'Active', '2024-01-13 22:00:00', 25.00, 'Warehouse B'),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 'PROD014', 'Samsung 4K TV', 'Television', 1, 3, 1, 699.99, 799.99, 'Active', '2024-01-14 23:00:00', 35.00, 'Warehouse A'),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 'PROD015', 'Nike Air Max', 'Casual sneakers', 4, 2, 2, 119.99, 139.99, 'Active', '2024-01-15 00:00:00', 18.00, 'Warehouse B');

-- Additional purchase orders
INSERT INTO public.purchase_order (business_id, supplier_id, order_date, delivery_date, status, total_amount, notes) VALUES
('09c3d58e-b7d1-41f1-be37-e648f559387b', 3, '2024-01-07 11:00:00', '2024-01-22', 'Delivered', 2499.98, 'Home goods shipment'),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 4, '2024-01-08 12:00:00', '2024-01-25', 'In Transit', 599.99, 'Gaming console order'),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 5, '2024-01-09 13:00:00', '2024-01-28', 'Pending', 139.98, 'Clothing order'),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 6, '2024-01-10 14:00:00', '2024-02-01', 'Delivered', 29.97, 'Beverage shipment'),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 7, '2024-01-11 15:00:00', '2024-02-05', 'In Transit', 20000.00, 'Automotive order'),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 8, '2024-01-12 16:00:00', '2024-02-08', 'Pending', 25.98, 'Health products'),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 9, '2024-01-13 17:00:00', '2024-02-10', 'Delivered', 839.98, 'Electronics shipment'),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 10, '2024-01-14 18:00:00', '2024-02-12', 'In Transit', 299.97, 'Sports apparel');

-- Additional purchase order items
INSERT INTO public.purchase_order_items (business_id, purchase_order_id, product_brand_id, quantity_ordered, unit_cost, line_total) VALUES
('09c3d58e-b7d1-41f1-be37-e648f559387b', 3, 5, 3, 499.99, 1499.97),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 3, 11, 2, 149.99, 299.98),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 3, 12, 1, 299.99, 299.99),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 4, 5, 1, 499.99, 499.99),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 4, 10, 1, 39.99, 39.99),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 5, 6, 2, 69.99, 139.98),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 6, 7, 15, 1.49, 22.35),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 6, 9, 1, 12.99, 12.99),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 7, 8, 1, 20000.00, 20000.00),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 8, 9, 2, 12.99, 25.98),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 9, 1, 1, 999.99, 999.99),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 9, 3, 1, 799.99, 799.99),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 9, 12, 1, 799.99, 799.99),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 10, 2, 3, 129.99, 389.97),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 10, 4, 2, 89.99, 179.98),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 10, 6, 1, 79.99, 79.99);

-- Additional sales orders
INSERT INTO public.sales_order (business_id, customer_id, order_date, status, total_amount, shipping_address, product_received_date) VALUES
('09c3d58e-b7d1-41f1-be37-e648f559387b', 4, '2024-01-13 17:00:00', 'Completed', 599.99, '400 Elm St, Miami, FL', '2024-01-15 19:00:00'),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 5, '2024-01-14 18:00:00', 'Shipped', 89.99, '500 Pine Ave, Denver, CO', NULL),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 6, '2024-01-15 19:00:00', 'Processing', 49.99, '600 Oak Rd, Phoenix, AZ', NULL),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 7, '2024-01-16 20:00:00', 'Completed', 139.99, '700 Maple Ln, Portland, OR', '2024-01-18 22:00:00'),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 8, '2024-01-17 21:00:00', 'Shipped', 199.99, '800 Cedar St, Atlanta, GA', NULL),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 9, '2024-01-18 22:00:00', 'Processing', 899.99, '900 Birch Ave, Nashville, TN', NULL),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 10, '2024-01-19 23:00:00', 'Completed', 99.99, '1000 Walnut Rd, Salt Lake City, UT', '2024-01-21 01:00:00');

-- Additional sales order items
INSERT INTO public.sales_order_items (business_id, sales_order_id, product_id, line_total) VALUES
('09c3d58e-b7d1-41f1-be37-e648f559387b', 4, 'PROD005', 599.99),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 5, 'PROD006', 89.99),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 6, 'PROD010', 49.99),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 7, 'PROD015', 139.99),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 8, 'PROD013', 199.99),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 9, 'PROD012', 899.99),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 10, 'PROD011', 99.99),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 4, 'PROD007', 1.99),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 5, 'PROD009', 15.99),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 6, 'PROD014', 799.99),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 7, 'PROD008', 22000.00),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 8, 'PROD001', 1099.99),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 9, 'PROD003', 899.99),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 10, 'PROD002', 149.99),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 4, 'PROD004', 39.99),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 5, 'PROD011', 99.99);