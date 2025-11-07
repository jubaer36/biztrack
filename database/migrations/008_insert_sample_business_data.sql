-- Migration: 005_insert_sample_business_data.sql
-- Description: Inserts a sample business and comprehensive sample data for user 451e7ac7-34fb-4200-afac-fe7768d6ae93
-- Includes at least 40 products with supporting data in all merchandising tables

-- Insert sample business
INSERT INTO public.businesses (id, name, description, user_id) VALUES
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 'Smart Tech Solutions', 'A comprehensive merchandising business specializing in electronics and lifestyle products', '451e7ac7-34fb-4200-afac-fe7768d6ae93');

-- Insert product categories
INSERT INTO public.product_category (business_id, category_id, category_name, description) VALUES
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 20001, 'Electronics', 'Electronic devices and accessories'),
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 20002, 'Clothing', 'Apparel and fashion items'),
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 20003, 'Home and Garden', 'Home improvement and gardening products'),
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 20004, 'Sports', 'Sports equipment and apparel'),
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 20005, 'Books', 'Books and publications'),
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 20006, 'Beauty', 'Beauty and personal care products'),
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 20007, 'Automotive', 'Automotive parts and accessories'),
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 20008, 'Health', 'Health and wellness products');

-- Insert product brands
INSERT INTO public.product_brand (business_id, brand_id, brand_name, description, unit_price) VALUES
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 20001, 'Apple', 'Premium electronics brand', 999.99),
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 20002, 'Samsung', 'Consumer electronics manufacturer', 799.99),
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 20003, 'Nike', 'Athletic footwear and apparel', 129.99),
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 20004, 'Adidas', 'Sports and lifestyle brand', 89.99),
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 20005, 'Sony', 'Entertainment and electronics', 599.99),
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 20006, 'Dell', 'Computer hardware and accessories', 899.99),
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 20007, 'HP', 'Computing and printing solutions', 699.99),
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 20008, 'Canon', 'Imaging and optical products', 499.99),
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 20009, 'Levis', 'Denim and casual wear', 79.99),
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 20010, 'HM', 'Fashion and clothing retailer', 39.99),
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 20011, 'IKEA', 'Home furnishings and decor', 149.99),
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 20012, 'Home Depot', 'Home improvement supplies', 199.99),
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 20013, 'Under Armour', 'Athletic apparel and gear', 69.99),
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 20014, 'Penguin Books', 'Book publishing company', 14.99),
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 20015, 'L Oreal', 'Beauty and cosmetics', 24.99),
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 20016, 'Michelin', 'Tire and automotive products', 299.99),
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 20017, 'Johnson and Johnson', 'Health and wellness products', 19.99);

-- Insert suppliers
INSERT INTO public.supplier (business_id, supplier_id, supplier_name, contact_person, email, phone, address) VALUES
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 20001, 'Tech Distributors Inc.', 'John Smith', 'john@techdist.com', '+1-555-0101', '123 Tech Street, Silicon Valley, CA'),
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 20002, 'Fashion Wholesale Co.', 'Sarah Johnson', 'sarah@fashionwholesale.com', '+1-555-0102', '456 Fashion Ave, New York, NY'),
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 20003, 'Home Goods Supply', 'Mike Davis', 'mike@homegoods.com', '+1-555-0103', '789 Home Blvd, Chicago, IL'),
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 20004, 'Sports Equipment Ltd.', 'Tom Wilson', 'tom@sportseq.com', '+1-555-0104', '321 Sports Way, Denver, CO'),
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 20005, 'Book Publishers Corp.', 'Lisa Brown', 'lisa@bookpub.com', '+1-555-0105', '654 Book Lane, Boston, MA'),
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 20006, 'Beauty Products Inc.', 'Emma White', 'emma@beautyprod.com', '+1-555-0106', '987 Beauty Blvd, Los Angeles, CA'),
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 20007, 'Auto Parts Warehouse', 'David Lee', 'david@autoparts.com', '+1-555-0107', '147 Auto Drive, Detroit, MI'),
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 20008, 'Health Supplies Co.', 'Anna Garcia', 'anna@healthsup.com', '+1-555-0108', '258 Health St, Atlanta, GA');

-- Insert customers
INSERT INTO public.customer (business_id, customer_id, customer_name, email, phone, billing_address, shipping_address, customer_type) VALUES
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 20001, 'Alice Cooper', 'alice@email.com', '+1-555-0201', '100 Main St, Boston, MA', '100 Main St, Boston, MA', 'Retail'),
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 20002, 'Bob Wilson', 'bob@email.com', '+1-555-0202', '200 Oak Ave, Seattle, WA', '200 Oak Ave, Seattle, WA', 'Wholesale'),
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 20003, 'Carol Brown', 'carol@email.com', '+1-555-0203', '300 Pine Rd, Austin, TX', '300 Pine Rd, Austin, TX', 'Retail'),
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 20004, 'David Miller', 'david@email.com', '+1-555-0204', '400 Elm St, Miami, FL', '400 Elm St, Miami, FL', 'Retail'),
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 20005, 'Eva Davis', 'eva@email.com', '+1-555-0205', '500 Maple Ave, Chicago, IL', '500 Maple Ave, Chicago, IL', 'Wholesale'),
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 20006, 'Frank Johnson', 'frank@email.com', '+1-555-0206', '600 Cedar Ln, Denver, CO', '600 Cedar Ln, Denver, CO', 'Retail'),
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 20007, 'Grace Lee', 'grace@email.com', '+1-555-0207', '700 Birch Rd, Phoenix, AZ', '700 Birch Rd, Phoenix, AZ', 'Retail'),
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 20008, 'Henry Taylor', 'henry@email.com', '+1-555-0208', '800 Spruce St, Portland, OR', '800 Spruce St, Portland, OR', 'Wholesale'),
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 20009, 'Ivy Chen', 'ivy@email.com', '+1-555-0209', '900 Fir Ave, San Diego, CA', '900 Fir Ave, San Diego, CA', 'Retail'),
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 20010, 'Jack Anderson', 'jack@email.com', '+1-555-0210', '1000 Pine St, Nashville, TN', '1000 Pine St, Nashville, TN', 'Retail');

-- Insert investors
INSERT INTO public.investor (business_id, investor_id, investor_name, contact_person, email, phone, address, initial_investment_date, investment_terms, status) VALUES
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 20001, 'Venture Capital Partners', 'Robert King', 'robert@vcpartners.com', '+1-555-0301', '500 Investment Way, San Francisco, CA', '2023-01-15', 'Standard equity terms', 'Active'),
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 20002, 'Angel Investors Group', 'Sophia Martinez', 'sophia@angelinvestors.com', '+1-555-0302', '600 Angel St, Los Angeles, CA', '2023-03-20', 'Preferred shares', 'Active'),
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 20003, 'Private Equity Fund', 'Oliver Brown', 'oliver@pefund.com', '+1-555-0303', '700 Equity Blvd, New York, NY', '2023-06-10', 'Mezzanine financing', 'Active');

-- Insert investments
INSERT INTO public.investment (business_id, investor_id, investment_amount, investment_date) VALUES
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 20001, 100000.00, '2023-01-15'),
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 20002, 75000.00, '2023-03-20'),
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 20003, 50000.00, '2023-06-10'),
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 20001, 50000.00, '2023-09-15');

-- Insert investors capital
INSERT INTO public.investors_capital (business_id, investor_id, calculation_date, current_capital, total_invested, total_returned, net_capital, current_roi, profit_share_paid, last_profit_calculation_date, notes) VALUES
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 20001, '2024-01-01', 165000.00, 150000.00, 15000.00, 165000.00, 0.1000, 7500.00, '2023-12-31', 'Quarterly profit distribution'),
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 20002, '2024-01-01', 82500.00, 75000.00, 7500.00, 82500.00, 0.1000, 3750.00, '2023-12-31', 'Annual ROI calculation'),
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 20003, '2024-01-01', 55000.00, 50000.00, 5000.00, 55000.00, 0.1000, 2500.00, '2023-12-31', 'Semi-annual distribution');

-- Insert products (40+ products)
INSERT INTO public.product (business_id, product_id, product_name, description, category_id, brand_id, supplier_id, price, selling_price, status, created_date, expense, stored_location) VALUES
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 'PROD20001', 'iPhone 15 Pro', 'Latest flagship smartphone from Apple', 20001, 20001, 20001, 999.99, 1199.99, 'Active', '2024-01-01 10:00:00', 50.00, 'Warehouse A'),
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 'PROD20002', 'Samsung Galaxy S24', 'Premium Android smartphone', 20001, 20002, 20001, 799.99, 999.99, 'Active', '2024-01-02 11:00:00', 40.00, 'Warehouse A'),
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 'PROD20003', 'MacBook Pro 16"', 'Professional laptop computer', 20001, 20001, 20001, 2499.99, 2799.99, 'Active', '2024-01-03 12:00:00', 100.00, 'Warehouse B'),
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 'PROD20004', 'Dell XPS 13', 'Ultrabook laptop', 20001, 20006, 20001, 1299.99, 1499.99, 'Active', '2024-01-04 13:00:00', 60.00, 'Warehouse B'),
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 'PROD20005', 'Sony WH-1000XM5', 'Wireless noise-canceling headphones', 20001, 20005, 20001, 349.99, 399.99, 'Active', '2024-01-05 14:00:00', 25.00, 'Warehouse A'),
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 'PROD20006', 'Canon EOS R5', 'Professional mirrorless camera', 20001, 20008, 20001, 3899.99, 4199.99, 'Active', '2024-01-06 15:00:00', 150.00, 'Warehouse C'),
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 'PROD20007', 'Nike Air Max 270', 'Athletic running shoes', 20004, 20003, 20004, 129.99, 159.99, 'Active', '2024-01-07 16:00:00', 20.00, 'Warehouse D'),
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 'PROD20008', 'Adidas Ultraboost 22', 'Performance running shoes', 20004, 20004, 20004, 189.99, 219.99, 'Active', '2024-01-08 17:00:00', 25.00, 'Warehouse D'),
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 'PROD20009', 'Under Armour HeatGear T-Shirt', 'Moisture-wicking athletic shirt', 20004, 20013, 20004, 29.99, 39.99, 'Active', '2024-01-09 18:00:00', 8.00, 'Warehouse D'),
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 'PROD20010', 'Levis 501 Jeans', 'Classic straight fit jeans', 20002, 20009, 20002, 69.99, 89.99, 'Active', '2024-01-10 19:00:00', 15.00, 'Warehouse E'),
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 'PROD20011', 'HM Cotton T-Shirt', 'Basic crew neck t-shirt', 20002, 20010, 20002, 9.99, 19.99, 'Active', '2024-01-11 20:00:00', 3.00, 'Warehouse E'),
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 'PROD20012', 'IKEA KIVIK Sofa', '3-seater fabric sofa', 20003, 20011, 20003, 499.99, 699.99, 'Active', '2024-01-12 21:00:00', 80.00, 'Warehouse F'),
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 'PROD20013', 'Home Depot Garden Hose', '50ft expandable garden hose', 20003, 20012, 20003, 24.99, 34.99, 'Active', '2024-01-13 22:00:00', 5.00, 'Warehouse F'),
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 'PROD20014', 'Penguin Classics Book Set', 'Collection of classic literature', 20005, 20014, 20005, 49.99, 69.99, 'Active', '2024-01-14 23:00:00', 10.00, 'Warehouse G'),
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 'PROD20015', 'L Oreal Shampoo', 'Hydrating shampoo 250ml', 20006, 20015, 20006, 4.99, 9.99, 'Active', '2024-01-15 09:00:00', 1.50, 'Warehouse H'),
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 'PROD20016', 'Michelin Pilot Sport 4', 'High-performance tires', 20007, 20016, 20007, 199.99, 249.99, 'Active', '2024-01-16 10:00:00', 30.00, 'Warehouse I'),
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 'PROD20017', 'Johnson and Johnson Band-Aids', 'Assorted adhesive bandages', 20008, 20017, 20008, 3.99, 7.99, 'Active', '2024-01-17 11:00:00', 1.00, 'Warehouse J'),
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 'PROD20018', 'iPad Air', '10.9-inch tablet computer', 20001, 20001, 20001, 599.99, 699.99, 'Active', '2024-01-18 12:00:00', 25.00, 'Warehouse A'),
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 'PROD20019', 'Samsung 4K TV 55"', '55-inch 4K UHD Smart TV', 20001, 20002, 20001, 699.99, 899.99, 'Active', '2024-01-19 13:00:00', 50.00, 'Warehouse A'),
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 'PROD20020', 'HP LaserJet Printer', 'Color laser printer', 20001, 20007, 20001, 299.99, 399.99, 'Active', '2024-01-20 14:00:00', 20.00, 'Warehouse B'),
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 'PROD20021', 'Nike Basketball', 'Official size basketball', 20004, 20003, 20004, 39.99, 49.99, 'Active', '2024-01-21 15:00:00', 8.00, 'Warehouse D'),
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 'PROD20022', 'Adidas Yoga Mat', 'Non-slip exercise mat', 20004, 20004, 20004, 24.99, 34.99, 'Active', '2024-01-22 16:00:00', 5.00, 'Warehouse D'),
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 'PROD20023', 'Levis Denim Jacket', 'Classic denim jacket', 20002, 20009, 20002, 89.99, 119.99, 'Active', '2024-01-23 17:00:00', 18.00, 'Warehouse E'),
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 'PROD20024', 'HM Hoodie', 'Cotton blend hoodie', 20002, 20010, 20002, 29.99, 49.99, 'Active', '2024-01-24 18:00:00', 7.00, 'Warehouse E'),
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 'PROD20025', 'IKEA Desk Lamp', 'LED desk lamp with adjustable arm', 20003, 20011, 20003, 19.99, 29.99, 'Active', '2024-01-25 19:00:00', 4.00, 'Warehouse F'),
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 'PROD20026', 'Home Depot Tool Set', '24-piece screwdriver set', 20003, 20012, 20003, 34.99, 49.99, 'Active', '2024-01-26 20:00:00', 8.00, 'Warehouse F'),
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 'PROD20027', 'Penguin Mystery Novel', 'Latest bestselling mystery book', 20005, 20014, 20005, 14.99, 19.99, 'Active', '2024-01-27 21:00:00', 3.00, 'Warehouse G'),
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 'PROD20028', 'L Oreal Lipstick', 'Long-lasting matte lipstick', 20006, 20015, 20006, 12.99, 19.99, 'Active', '2024-01-28 22:00:00', 3.00, 'Warehouse H'),
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 'PROD20029', 'Michelin Car Wax', 'Premium car wax and sealant', 20007, 20016, 20007, 14.99, 24.99, 'Active', '2024-01-29 23:00:00', 4.00, 'Warehouse I'),
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 'PROD20030', 'Johnson and Johnson First Aid Kit', 'Complete first aid kit', 20008, 20017, 20008, 24.99, 39.99, 'Active', '2024-01-30 09:00:00', 6.00, 'Warehouse J'),
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 'PROD20031', 'Apple Watch Series 9', 'Smartwatch with health monitoring', 20001, 20001, 20001, 399.99, 499.99, 'Active', '2024-01-31 10:00:00', 20.00, 'Warehouse A'),
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 'PROD20032', 'Samsung Wireless Earbuds', 'True wireless earbuds', 20001, 20002, 20001, 149.99, 199.99, 'Active', '2024-02-01 11:00:00', 15.00, 'Warehouse A'),
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 'PROD20033', 'Dell Monitor 27"', '27-inch 4K monitor', 20001, 20006, 20001, 349.99, 449.99, 'Active', '2024-02-02 12:00:00', 25.00, 'Warehouse B'),
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 'PROD20034', 'Nike Running Shorts', 'Breathable running shorts', 20004, 20003, 20004, 34.99, 44.99, 'Active', '2024-02-03 13:00:00', 7.00, 'Warehouse D'),
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 'PROD20035', 'Adidas Training Shoes', 'Cross-training athletic shoes', 20004, 20004, 20004, 79.99, 99.99, 'Active', '2024-02-04 14:00:00', 15.00, 'Warehouse D'),
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 'PROD20036', 'Levis Hoodie', 'Cotton hoodie with logo', 20002, 20009, 20002, 49.99, 69.99, 'Active', '2024-02-05 15:00:00', 10.00, 'Warehouse E'),
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 'PROD20037', 'HM Leggings', 'High-waisted yoga leggings', 20002, 20010, 20002, 19.99, 29.99, 'Active', '2024-02-06 16:00:00', 5.00, 'Warehouse E'),
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 'PROD20038', 'IKEA Bookshelf', '5-tier wooden bookshelf', 20003, 20011, 20003, 79.99, 119.99, 'Active', '2024-02-07 17:00:00', 20.00, 'Warehouse F'),
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 'PROD20039', 'Home Depot Paint Set', 'Interior paint kit with brushes', 20003, 20012, 20003, 39.99, 59.99, 'Active', '2024-02-08 18:00:00', 10.00, 'Warehouse F'),
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 'PROD20040', 'Penguin Cookbook', 'Gourmet cooking recipes book', 20005, 20014, 20005, 19.99, 29.99, 'Active', '2024-02-09 19:00:00', 4.00, 'Warehouse G'),
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 'PROD20041', 'L Oreal Face Cream', 'Anti-aging moisturizer', 20006, 20015, 20006, 29.99, 49.99, 'Active', '2024-02-10 20:00:00', 8.00, 'Warehouse H'),
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 'PROD20042', 'Michelin Wiper Blades', 'Premium windshield wipers', 20007, 20016, 20007, 24.99, 39.99, 'Active', '2024-02-11 21:00:00', 6.00, 'Warehouse I'),
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 'PROD20043', 'Johnson and Johnson Vitamins', 'Multivitamin supplement pack', 20008, 20017, 20008, 14.99, 24.99, 'Active', '2024-02-12 22:00:00', 3.50, 'Warehouse J');

-- Insert purchase orders
INSERT INTO public.purchase_order (business_id, purchase_order_id, supplier_id, order_date, delivery_date, status, total_amount, notes) VALUES
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 20001, 20001, '2024-01-05 09:00:00', '2024-01-15', 'Delivered', 5000.00, 'Electronics bulk order'),
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 20002, 20002, '2024-01-10 10:00:00', '2024-01-25', 'Delivered', 2500.00, 'Clothing and apparel order'),
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 20003, 20003, '2024-01-15 11:00:00', '2024-01-30', 'Delivered', 1500.00, 'Home and garden supplies'),
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 20004, 20004, '2024-01-20 12:00:00', '2024-02-05', 'In Transit', 2000.00, 'Sports equipment order'),
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 20005, 20005, '2024-01-25 13:00:00', '2024-02-10', 'Processing', 800.00, 'Book inventory order'),
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 20006, 20006, '2024-01-30 14:00:00', '2024-02-15', 'Processing', 600.00, 'Beauty products order'),
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 20007, 20007, '2024-02-05 15:00:00', '2024-02-20', 'Pending', 1200.00, 'Automotive parts order'),
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 20008, 20008, '2024-02-10 16:00:00', '2024-02-25', 'Pending', 400.00, 'Health supplies order');

-- Insert purchase order items
INSERT INTO public.purchase_order_items (business_id, purchase_order_id, product_brand_id, quantity_ordered, unit_cost, line_total) VALUES
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 20001, 20001, 10, 950.00, 9500.00),
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 20001, 20002, 15, 750.00, 11250.00),
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 20001, 20005, 20, 320.00, 6400.00),
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 20002, 20003, 25, 120.00, 3000.00),
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 20002, 20004, 30, 80.00, 2400.00),
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 20002, 20013, 40, 25.00, 1000.00),
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 20003, 20011, 15, 40.00, 600.00),
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 20003, 20012, 20, 180.00, 3600.00),
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 20004, 20003, 35, 120.00, 4200.00),
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 20004, 20004, 25, 80.00, 2000.00),
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 20005, 20014, 50, 12.00, 600.00),
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 20006, 20015, 100, 4.00, 400.00),
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 20007, 20016, 10, 180.00, 1800.00),
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 20008, 20017, 80, 3.50, 280.00);

-- Insert sales orders
INSERT INTO public.sales_order (business_id, sales_order_id, customer_id, order_date, status, total_amount, shipping_address, product_received_date) VALUES
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 20001, 20001, '2024-02-01 14:00:00', 'Completed', 2399.98, '100 Main St, Boston, MA', '2024-02-03 16:00:00'),
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 20002, 20002, '2024-02-02 15:00:00', 'Shipped', 1599.99, '200 Oak Ave, Seattle, WA', NULL),
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 20003, 20003, '2024-02-03 16:00:00', 'Processing', 699.99, '300 Pine Rd, Austin, TX', NULL),
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 20004, 20004, '2024-02-04 17:00:00', 'Completed', 1199.99, '400 Elm St, Miami, FL', '2024-02-06 18:00:00'),
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 20005, 20005, '2024-02-05 18:00:00', 'Shipped', 899.99, '500 Maple Ave, Chicago, IL', NULL),
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 20006, 20006, '2024-02-06 19:00:00', 'Processing', 399.99, '600 Cedar Ln, Denver, CO', NULL),
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 20007, 20007, '2024-02-07 20:00:00', 'Completed', 219.99, '700 Birch Rd, Phoenix, AZ', '2024-02-09 21:00:00'),
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 20008, 20008, '2024-02-08 21:00:00', 'Shipped', 1499.99, '800 Spruce St, Portland, OR', NULL),
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 20009, 20009, '2024-02-09 22:00:00', 'Processing', 79.99, '900 Fir Ave, San Diego, CA', NULL),
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 20010, 20010, '2024-02-10 23:00:00', 'Completed', 49.99, '1000 Pine St, Nashville, TN', '2024-02-12 10:00:00');

-- Insert sales order items
INSERT INTO public.sales_order_items (business_id, sales_order_id, product_id, line_total) VALUES
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 20001, 'PROD20001', 1199.99),
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 20001, 'PROD20018', 699.99),
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 20001, 'PROD20031', 499.99),
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 20002, 'PROD20003', 2799.99),
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 20002, 'PROD20004', 1499.99),
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 20002, 'PROD20033', 449.99),
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 20003, 'PROD20019', 899.99),
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 20003, 'PROD20020', 399.99),
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 20004, 'PROD20007', 159.99),
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 20004, 'PROD20008', 219.99),
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 20004, 'PROD20021', 49.99),
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 20004, 'PROD20034', 44.99),
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 20005, 'PROD20010', 89.99),
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 20005, 'PROD20023', 119.99),
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 20005, 'PROD20036', 69.99),
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 20006, 'PROD20012', 699.99),
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 20006, 'PROD20025', 29.99),
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 20006, 'PROD20038', 119.99),
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 20007, 'PROD20014', 69.99),
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 20007, 'PROD20027', 19.99),
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 20007, 'PROD20040', 29.99),
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 20008, 'PROD20015', 9.99),
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 20008, 'PROD20028', 19.99),
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 20008, 'PROD20041', 49.99),
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 20009, 'PROD20016', 249.99),
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 20009, 'PROD20029', 24.99),
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 20009, 'PROD20042', 39.99),
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 20010, 'PROD20017', 7.99),
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 20010, 'PROD20030', 39.99),
('550e8ac7-34fb-4200-afac-fe7768d6ae94', 20010, 'PROD20043', 24.99);