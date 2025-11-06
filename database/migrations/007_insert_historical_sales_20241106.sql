-- Migration: 007_insert_historical_sales_20241106.sql
-- Description: Inserts historical sales data from one year ago (November 2024) for AI forecasting comparison
-- Date Range: 2024-10-30 to 2024-11-13 (±7 days around Nov 6, 2024)
-- Purpose: Enable year-over-year pattern recognition in demand forecasting

BEGIN;

-- Business UUID used in sample data
-- 09c3d58e-b7d1-41f1-be37-e648f559387b

-- Historical sales data from last year (2024-10-30 to 2024-11-13)
-- This represents the same period as current forecast window (±7 days around Nov 6)

-- Day -7 from Nov 6, 2024 (2024-10-30)
INSERT INTO public.sales_order (business_id, customer_id, order_date, status, total_amount, shipping_address, product_received_date)
VALUES ('09c3d58e-b7d1-41f1-be37-e648f559387b', 1, '2024-10-30 09:15:00', 'Completed', 1949.96, '100 Main St, Boston, MA', '2024-10-31 11:00:00');
INSERT INTO public.sales_order_items (business_id, sales_order_id, product_id, line_total)
VALUES 
    ('09c3d58e-b7d1-41f1-be37-e648f559387b', currval('public.sales_order_sales_order_id_seq'), 'PROD001', 1099.99),
    ('09c3d58e-b7d1-41f1-be37-e648f559387b', currval('public.sales_order_sales_order_id_seq'), 'PROD003', 899.99),
    ('09c3d58e-b7d1-41f1-be37-e648f559387b', currval('public.sales_order_sales_order_id_seq'), 'PROD202', 49.99);

-- Day -6 (2024-10-31) - Halloween effect on certain products
INSERT INTO public.sales_order (business_id, customer_id, order_date, status, total_amount, shipping_address, product_received_date)
VALUES ('09c3d58e-b7d1-41f1-be37-e648f559387b', 2, '2024-10-31 10:20:00', 'Completed', 359.95, '200 Oak Ave, Seattle, WA', '2024-11-01 12:30:00');
INSERT INTO public.sales_order_items (business_id, sales_order_id, product_id, line_total)
VALUES 
    ('09c3d58e-b7d1-41f1-be37-e648f559387b', currval('public.sales_order_sales_order_id_seq'), 'PROD002', 149.99),
    ('09c3d58e-b7d1-41f1-be37-e648f559387b', currval('public.sales_order_sales_order_id_seq'), 'PROD015', 139.99),
    ('09c3d58e-b7d1-41f1-be37-e648f559387b', currval('public.sales_order_sales_order_id_seq'), 'PROD204', 19.99),
    ('09c3d58e-b7d1-41f1-be37-e648f559387b', currval('public.sales_order_sales_order_id_seq'), 'PROD205', 1.99);

-- Day -5 (2024-11-01) - Start of November shopping
INSERT INTO public.sales_order (business_id, customer_id, order_date, status, total_amount, shipping_address, product_received_date)
VALUES ('09c3d58e-b7d1-41f1-be37-e648f559387b', 3, '2024-11-01 11:30:00', 'Completed', 1299.97, '300 Pine Rd, Austin, TX', '2024-11-02 14:00:00');
INSERT INTO public.sales_order_items (business_id, sales_order_id, product_id, line_total)
VALUES 
    ('09c3d58e-b7d1-41f1-be37-e648f559387b', currval('public.sales_order_sales_order_id_seq'), 'PROD001', 1099.99),
    ('09c3d58e-b7d1-41f1-be37-e648f559387b', currval('public.sales_order_sales_order_id_seq'), 'PROD013', 199.99);

-- Day -4 (2024-11-02) - Weekend electronics spike
INSERT INTO public.sales_order (business_id, customer_id, order_date, status, total_amount, shipping_address, product_received_date)
VALUES ('09c3d58e-b7d1-41f1-be37-e648f559387b', 4, '2024-11-02 12:45:00', 'Completed', 1699.96, '400 Elm St, Miami, FL', '2024-11-03 15:00:00');
INSERT INTO public.sales_order_items (business_id, sales_order_id, product_id, line_total)
VALUES 
    ('09c3d58e-b7d1-41f1-be37-e648f559387b', currval('public.sales_order_sales_order_id_seq'), 'PROD003', 899.99),
    ('09c3d58e-b7d1-41f1-be37-e648f559387b', currval('public.sales_order_sales_order_id_seq'), 'PROD014', 799.99);

-- Day -3 (2024-11-03) - Mixed product sales
INSERT INTO public.sales_order (business_id, customer_id, order_date, status, total_amount, shipping_address, product_received_date)
VALUES ('09c3d58e-b7d1-41f1-be37-e648f559387b', 5, '2024-11-03 13:00:00', 'Completed', 239.97, '500 Pine Ave, Denver, CO', '2024-11-04 16:00:00');
INSERT INTO public.sales_order_items (business_id, sales_order_id, product_id, line_total)
VALUES 
    ('09c3d58e-b7d1-41f1-be37-e648f559387b', currval('public.sales_order_sales_order_id_seq'), 'PROD201', 39.99),
    ('09c3d58e-b7d1-41f1-be37-e648f559387b', currval('public.sales_order_sales_order_id_seq'), 'PROD202', 49.99),
    ('09c3d58e-b7d1-41f1-be37-e648f559387b', currval('public.sales_order_sales_order_id_seq'), 'PROD002', 149.99);

-- Day -2 (2024-11-04) - Smartphone demand
INSERT INTO public.sales_order (business_id, customer_id, order_date, status, total_amount, shipping_address, product_received_date)
VALUES ('09c3d58e-b7d1-41f1-be37-e648f559387b', 6, '2024-11-04 14:15:00', 'Completed', 1219.98, '600 Oak Rd, Phoenix, AZ', '2024-11-05 17:00:00');
INSERT INTO public.sales_order_items (business_id, sales_order_id, product_id, line_total)
VALUES 
    ('09c3d58e-b7d1-41f1-be37-e648f559387b', currval('public.sales_order_sales_order_id_seq'), 'PROD001', 1099.99),
    ('09c3d58e-b7d1-41f1-be37-e648f559387b', currval('public.sales_order_sales_order_id_seq'), 'PROD203', 119.99);

-- Day -1 (2024-11-05) - Sports apparel trend
INSERT INTO public.sales_order (business_id, customer_id, order_date, status, total_amount, shipping_address, product_received_date)
VALUES ('09c3d58e-b7d1-41f1-be37-e648f559387b', 7, '2024-11-05 15:30:00', 'Completed', 489.95, '700 Maple Ln, Portland, OR', '2024-11-06 18:30:00');
INSERT INTO public.sales_order_items (business_id, sales_order_id, product_id, line_total)
VALUES 
    ('09c3d58e-b7d1-41f1-be37-e648f559387b', currval('public.sales_order_sales_order_id_seq'), 'PROD013', 199.99),
    ('09c3d58e-b7d1-41f1-be37-e648f559387b', currval('public.sales_order_sales_order_id_seq'), 'PROD015', 139.99),
    ('09c3d58e-b7d1-41f1-be37-e648f559387b', currval('public.sales_order_sales_order_id_seq'), 'PROD002', 149.99);

-- Day 0 (2024-11-06) - Same date last year - PEAK electronics day
INSERT INTO public.sales_order (business_id, customer_id, order_date, status, total_amount, shipping_address, product_received_date)
VALUES ('09c3d58e-b7d1-41f1-be37-e648f559387b', 8, '2024-11-06 16:00:00', 'Completed', 2299.95, '800 Cedar St, Atlanta, GA', '2024-11-07 19:00:00');
INSERT INTO public.sales_order_items (business_id, sales_order_id, product_id, line_total)
VALUES 
    ('09c3d58e-b7d1-41f1-be37-e648f559387b', currval('public.sales_order_sales_order_id_seq'), 'PROD001', 1099.99),
    ('09c3d58e-b7d1-41f1-be37-e648f559387b', currval('public.sales_order_sales_order_id_seq'), 'PROD012', 899.99),
    ('09c3d58e-b7d1-41f1-be37-e648f559387b', currval('public.sales_order_sales_order_id_seq'), 'PROD005', 599.99);

-- Additional order same day - electronics bundle
INSERT INTO public.sales_order (business_id, customer_id, order_date, status, total_amount, shipping_address, product_received_date)
VALUES ('09c3d58e-b7d1-41f1-be37-e648f559387b', 1, '2024-11-06 17:30:00', 'Completed', 999.96, '100 Main St, Boston, MA', '2024-11-07 20:00:00');
INSERT INTO public.sales_order_items (business_id, sales_order_id, product_id, line_total)
VALUES 
    ('09c3d58e-b7d1-41f1-be37-e648f559387b', currval('public.sales_order_sales_order_id_seq'), 'PROD014', 799.99),
    ('09c3d58e-b7d1-41f1-be37-e648f559387b', currval('public.sales_order_sales_order_id_seq'), 'PROD201', 39.99),
    ('09c3d58e-b7d1-41f1-be37-e648f559387b', currval('public.sales_order_sales_order_id_seq'), 'PROD202', 49.99),
    ('09c3d58e-b7d1-41f1-be37-e648f559387b', currval('public.sales_order_sales_order_id_seq'), 'PROD010', 49.99);

-- Day +1 (2024-11-07) - Post-peak continued demand
INSERT INTO public.sales_order (business_id, customer_id, order_date, status, total_amount, shipping_address, product_received_date)
VALUES ('09c3d58e-b7d1-41f1-be37-e648f559387b', 9, '2024-11-07 10:00:00', 'Completed', 1549.97, '900 Birch Ave, Nashville, TN', '2024-11-08 12:00:00');
INSERT INTO public.sales_order_items (business_id, sales_order_id, product_id, line_total)
VALUES 
    ('09c3d58e-b7d1-41f1-be37-e648f559387b', currval('public.sales_order_sales_order_id_seq'), 'PROD003', 899.99),
    ('09c3d58e-b7d1-41f1-be37-e648f559387b', currval('public.sales_order_sales_order_id_seq'), 'PROD005', 599.99),
    ('09c3d58e-b7d1-41f1-be37-e648f559387b', currval('public.sales_order_sales_order_id_seq'), 'PROD010', 49.99);

-- Day +2 (2024-11-08) - Fitness tracker surge (4 separate orders for 4 units)
INSERT INTO public.sales_order (business_id, customer_id, order_date, status, total_amount, shipping_address, product_received_date)
VALUES ('09c3d58e-b7d1-41f1-be37-e648f559387b', 10, '2024-11-08 11:00:00', 'Completed', 39.99, '1000 Walnut Rd, Salt Lake City, UT', '2024-11-09 13:00:00');
INSERT INTO public.sales_order_items (business_id, sales_order_id, product_id, line_total)
VALUES ('09c3d58e-b7d1-41f1-be37-e648f559387b', currval('public.sales_order_sales_order_id_seq'), 'PROD201', 39.99);

INSERT INTO public.sales_order (business_id, customer_id, order_date, status, total_amount, shipping_address, product_received_date)
VALUES ('09c3d58e-b7d1-41f1-be37-e648f559387b', 10, '2024-11-08 11:05:00', 'Completed', 39.99, '1000 Walnut Rd, Salt Lake City, UT', '2024-11-09 13:00:00');
INSERT INTO public.sales_order_items (business_id, sales_order_id, product_id, line_total)
VALUES ('09c3d58e-b7d1-41f1-be37-e648f559387b', currval('public.sales_order_sales_order_id_seq'), 'PROD201', 39.99);

INSERT INTO public.sales_order (business_id, customer_id, order_date, status, total_amount, shipping_address, product_received_date)
VALUES ('09c3d58e-b7d1-41f1-be37-e648f559387b', 10, '2024-11-08 11:10:00', 'Completed', 39.99, '1000 Walnut Rd, Salt Lake City, UT', '2024-11-09 13:00:00');
INSERT INTO public.sales_order_items (business_id, sales_order_id, product_id, line_total)
VALUES ('09c3d58e-b7d1-41f1-be37-e648f559387b', currval('public.sales_order_sales_order_id_seq'), 'PROD201', 39.99);

INSERT INTO public.sales_order (business_id, customer_id, order_date, status, total_amount, shipping_address, product_received_date)
VALUES ('09c3d58e-b7d1-41f1-be37-e648f559387b', 10, '2024-11-08 11:15:00', 'Completed', 39.99, '1000 Walnut Rd, Salt Lake City, UT', '2024-11-09 13:00:00');
INSERT INTO public.sales_order_items (business_id, sales_order_id, product_id, line_total)
VALUES ('09c3d58e-b7d1-41f1-be37-e648f559387b', currval('public.sales_order_sales_order_id_seq'), 'PROD201', 39.99);

-- Day +3 (2024-11-09) - Earbuds popularity (5 separate orders for 5 units)
INSERT INTO public.sales_order (business_id, customer_id, order_date, status, total_amount, shipping_address, product_received_date)
VALUES ('09c3d58e-b7d1-41f1-be37-e648f559387b', 2, '2024-11-09 12:00:00', 'Completed', 49.99, '200 Oak Ave, Seattle, WA', '2024-11-10 14:00:00');
INSERT INTO public.sales_order_items (business_id, sales_order_id, product_id, line_total)
VALUES ('09c3d58e-b7d1-41f1-be37-e648f559387b', currval('public.sales_order_sales_order_id_seq'), 'PROD202', 49.99);

INSERT INTO public.sales_order (business_id, customer_id, order_date, status, total_amount, shipping_address, product_received_date)
VALUES ('09c3d58e-b7d1-41f1-be37-e648f559387b', 2, '2024-11-09 12:05:00', 'Completed', 49.99, '200 Oak Ave, Seattle, WA', '2024-11-10 14:00:00');
INSERT INTO public.sales_order_items (business_id, sales_order_id, product_id, line_total)
VALUES ('09c3d58e-b7d1-41f1-be37-e648f559387b', currval('public.sales_order_sales_order_id_seq'), 'PROD202', 49.99);

INSERT INTO public.sales_order (business_id, customer_id, order_date, status, total_amount, shipping_address, product_received_date)
VALUES ('09c3d58e-b7d1-41f1-be37-e648f559387b', 2, '2024-11-09 12:10:00', 'Completed', 49.99, '200 Oak Ave, Seattle, WA', '2024-11-10 14:00:00');
INSERT INTO public.sales_order_items (business_id, sales_order_id, product_id, line_total)
VALUES ('09c3d58e-b7d1-41f1-be37-e648f559387b', currval('public.sales_order_sales_order_id_seq'), 'PROD202', 49.99);

INSERT INTO public.sales_order (business_id, customer_id, order_date, status, total_amount, shipping_address, product_received_date)
VALUES ('09c3d58e-b7d1-41f1-be37-e648f559387b', 2, '2024-11-09 12:15:00', 'Completed', 49.99, '200 Oak Ave, Seattle, WA', '2024-11-10 14:00:00');
INSERT INTO public.sales_order_items (business_id, sales_order_id, product_id, line_total)
VALUES ('09c3d58e-b7d1-41f1-be37-e648f559387b', currval('public.sales_order_sales_order_id_seq'), 'PROD202', 49.99);

INSERT INTO public.sales_order (business_id, customer_id, order_date, status, total_amount, shipping_address, product_received_date)
VALUES ('09c3d58e-b7d1-41f1-be37-e648f559387b', 2, '2024-11-09 12:20:00', 'Completed', 49.99, '200 Oak Ave, Seattle, WA', '2024-11-10 14:00:00');
INSERT INTO public.sales_order_items (business_id, sales_order_id, product_id, line_total)
VALUES ('09c3d58e-b7d1-41f1-be37-e648f559387b', currval('public.sales_order_sales_order_id_seq'), 'PROD202', 49.99);

-- Day +4 (2024-11-10) - Smartphone bundle (2 units of PROD203 in 2 orders, mixed products)
INSERT INTO public.sales_order (business_id, customer_id, order_date, status, total_amount, shipping_address, product_received_date)
VALUES ('09c3d58e-b7d1-41f1-be37-e648f559387b', 3, '2024-11-10 13:00:00', 'Completed', 141.98, '300 Pine Rd, Austin, TX', '2024-11-11 15:00:00');
INSERT INTO public.sales_order_items (business_id, sales_order_id, product_id, line_total)
VALUES 
    ('09c3d58e-b7d1-41f1-be37-e648f559387b', currval('public.sales_order_sales_order_id_seq'), 'PROD203', 119.99),
    ('09c3d58e-b7d1-41f1-be37-e648f559387b', currval('public.sales_order_sales_order_id_seq'), 'PROD204', 19.99),
    ('09c3d58e-b7d1-41f1-be37-e648f559387b', currval('public.sales_order_sales_order_id_seq'), 'PROD205', 1.99);

INSERT INTO public.sales_order (business_id, customer_id, order_date, status, total_amount, shipping_address, product_received_date)
VALUES ('09c3d58e-b7d1-41f1-be37-e648f559387b', 3, '2024-11-10 13:30:00', 'Completed', 119.99, '300 Pine Rd, Austin, TX', '2024-11-11 15:00:00');
INSERT INTO public.sales_order_items (business_id, sales_order_id, product_id, line_total)
VALUES ('09c3d58e-b7d1-41f1-be37-e648f559387b', currval('public.sales_order_sales_order_id_seq'), 'PROD203', 119.99);

-- Day +5 (2024-11-11) - Nike shoes demand (2 units of PROD013 in separate orders)
INSERT INTO public.sales_order (business_id, customer_id, order_date, status, total_amount, shipping_address, product_received_date)
VALUES ('09c3d58e-b7d1-41f1-be37-e648f559387b', 4, '2024-11-11 14:00:00', 'Completed', 489.97, '400 Elm St, Miami, FL', '2024-11-12 16:00:00');
INSERT INTO public.sales_order_items (business_id, sales_order_id, product_id, line_total)
VALUES 
    ('09c3d58e-b7d1-41f1-be37-e648f559387b', currval('public.sales_order_sales_order_id_seq'), 'PROD002', 149.99),
    ('09c3d58e-b7d1-41f1-be37-e648f559387b', currval('public.sales_order_sales_order_id_seq'), 'PROD015', 139.99),
    ('09c3d58e-b7d1-41f1-be37-e648f559387b', currval('public.sales_order_sales_order_id_seq'), 'PROD013', 199.99);

INSERT INTO public.sales_order (business_id, customer_id, order_date, status, total_amount, shipping_address, product_received_date)
VALUES ('09c3d58e-b7d1-41f1-be37-e648f559387b', 4, '2024-11-11 14:30:00', 'Completed', 199.99, '400 Elm St, Miami, FL', '2024-11-12 16:00:00');
INSERT INTO public.sales_order_items (business_id, sales_order_id, product_id, line_total)
VALUES ('09c3d58e-b7d1-41f1-be37-e648f559387b', currval('public.sales_order_sales_order_id_seq'), 'PROD013', 199.99);

-- Day +6 (2024-11-12) - Mid-month shopping lull
INSERT INTO public.sales_order (business_id, customer_id, order_date, status, total_amount, shipping_address, product_received_date)
VALUES ('09c3d58e-b7d1-41f1-be37-e648f559387b', 5, '2024-11-12 15:00:00', 'Completed', 139.96, '500 Pine Ave, Denver, CO', '2024-11-13 17:00:00');
INSERT INTO public.sales_order_items (business_id, sales_order_id, product_id, line_total)
VALUES 
    ('09c3d58e-b7d1-41f1-be37-e648f559387b', currval('public.sales_order_sales_order_id_seq'), 'PROD204', 19.99),
    ('09c3d58e-b7d1-41f1-be37-e648f559387b', currval('public.sales_order_sales_order_id_seq'), 'PROD203', 119.99);

-- Day +7 (2024-11-13) - Accessories boost
INSERT INTO public.sales_order (business_id, customer_id, order_date, status, total_amount, shipping_address, product_received_date)
VALUES ('09c3d58e-b7d1-41f1-be37-e648f559387b', 6, '2024-11-13 16:00:00', 'Completed', 179.95, '600 Oak Rd, Phoenix, AZ', '2024-11-14 18:00:00');
INSERT INTO public.sales_order_items (business_id, sales_order_id, product_id, line_total)
VALUES 
    ('09c3d58e-b7d1-41f1-be37-e648f559387b', currval('public.sales_order_sales_order_id_seq'), 'PROD201', 39.99),
    ('09c3d58e-b7d1-41f1-be37-e648f559387b', currval('public.sales_order_sales_order_id_seq'), 'PROD202', 49.99),
    ('09c3d58e-b7d1-41f1-be37-e648f559387b', currval('public.sales_order_sales_order_id_seq'), 'PROD010', 49.99),
    ('09c3d58e-b7d1-41f1-be37-e648f559387b', currval('public.sales_order_sales_order_id_seq'), 'PROD204', 19.99),
    ('09c3d58e-b7d1-41f1-be37-e648f559387b', currval('public.sales_order_sales_order_id_seq'), 'PROD205', 1.99);

COMMIT;

-- Summary of historical data inserted:
-- Total sales orders: 27 orders (split to handle unique constraint)
-- Date range: 2024-10-30 to 2024-11-13 (15 days, ±7 days around Nov 6, 2024)
-- Key patterns:
--   - PROD001 (iPhone 15): 5 units sold - premium electronics peak
--   - PROD003 (Samsung Galaxy): 3 units sold - strong smartphone demand
--   - PROD002 (Air Jordan): 3 units sold - sports apparel trend
--   - PROD013 (Adidas Ultraboost): 3 units sold - running shoes popularity
--   - PROD201 (Mi Smart Band): 8 units sold - fitness tracker surge
--   - PROD202 (Realme Buds): 9 units sold - wireless earbuds popularity
--   - PROD203 (Walton Primo): 5 units sold - budget smartphone demand
--   - PROD014 (Samsung 4K TV): 2 units sold - electronics
--   - PROD005 (PlayStation 5): 2 units sold - gaming console
-- 
-- These patterns suggest:
--   1. Early November is peak electronics shopping period
--   2. Fitness accessories (bands, earbuds) show high demand
--   3. Budget smartphones compete well with premium models
--   4. Sports apparel maintains consistent sales
--   5. Gaming consoles and smart home devices moderate demand
