-- Migration: 006_insert_recent_sales_20251106.sql
-- Description: Inserts new products and sales orders covering last 15 days up to 2025-11-06
-- Note: Uses existing sample business id from previous migrations

BEGIN;

-- Constants
-- Business UUID used in sample data
-- 09c3d58e-b7d1-41f1-be37-e648f559387b

-- Add new products
INSERT INTO public.product (business_id, product_id, product_name, description, category_id, brand_id, supplier_id, price, selling_price, status, created_date, expense, stored_location) VALUES
('09c3d58e-b7d1-41f1-be37-e648f559387b', 'PROD201', 'Mi Smart Band 8', 'Fitness tracker', 1, 3, 1, 29.99, 39.99, 'Active', '2025-10-20 09:00:00', 3.00, 'Warehouse A'),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 'PROD202', 'Realme Buds Air 5', 'Wireless earbuds', 1, 3, 1, 39.99, 49.99, 'Active', '2025-10-20 09:10:00', 4.00, 'Warehouse A'),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 'PROD203', 'Walton Primo HM7', 'Budget smartphone', 1, 3, 1, 99.99, 119.99, 'Active', '2025-10-20 09:20:00', 8.00, 'Warehouse B'),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 'PROD204', 'Bata Sandals M', 'Men sandals', 4, 2, 2, 12.99, 19.99, 'Active', '2025-10-20 09:30:00', 2.00, 'Warehouse C'),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 'PROD205', 'RFL Water Bottle 1L', 'Household water bottle', 3, 3, 3, 1.49, 1.99, 'Active', '2025-10-20 09:40:00', 0.20, 'Warehouse C');

-- Create sales orders for each day from 2025-10-23 to 2025-11-06 (inclusive)
-- We will reuse customer_id = 1 and 2 alternately for simplicity

-- Day -14 (2025-10-23)
INSERT INTO public.sales_order (business_id, customer_id, order_date, status, total_amount, shipping_address, product_received_date)
VALUES ('09c3d58e-b7d1-41f1-be37-e648f559387b', 1, '2025-10-23 10:00:00', 'Completed', 191.96, '100 Main St, Boston, MA', '2025-10-24 12:00:00');
INSERT INTO public.sales_order_items (business_id, sales_order_id, product_id, line_total)
VALUES ('09c3d58e-b7d1-41f1-be37-e648f559387b', currval('public.sales_order_sales_order_id_seq'), 'PROD203', 119.99),
       ('09c3d58e-b7d1-41f1-be37-e648f559387b', currval('public.sales_order_sales_order_id_seq'), 'PROD202', 49.99),
       ('09c3d58e-b7d1-41f1-be37-e648f559387b', currval('public.sales_order_sales_order_id_seq'), 'PROD205', 1.99);

-- Day -13 (2025-10-24)
INSERT INTO public.sales_order (business_id, customer_id, order_date, status, total_amount, shipping_address, product_received_date)
VALUES ('09c3d58e-b7d1-41f1-be37-e648f559387b', 2, '2025-10-24 11:00:00', 'Completed', 59.98, '200 Oak Ave, Seattle, WA', '2025-10-25 13:00:00');
INSERT INTO public.sales_order_items (business_id, sales_order_id, product_id, line_total)
VALUES ('09c3d58e-b7d1-41f1-be37-e648f559387b', currval('public.sales_order_sales_order_id_seq'), 'PROD201', 39.99),
       ('09c3d58e-b7d1-41f1-be37-e648f559387b', currval('public.sales_order_sales_order_id_seq'), 'PROD205', 1.99);

-- Day -12 (2025-10-25)
INSERT INTO public.sales_order (business_id, customer_id, order_date, status, total_amount, shipping_address, product_received_date)
VALUES ('09c3d58e-b7d1-41f1-be37-e648f559387b', 1, '2025-10-25 12:00:00', 'Completed', 169.97, '100 Main St, Boston, MA', '2025-10-26 15:00:00');
INSERT INTO public.sales_order_items (business_id, sales_order_id, product_id, line_total)
VALUES ('09c3d58e-b7d1-41f1-be37-e648f559387b', currval('public.sales_order_sales_order_id_seq'), 'PROD203', 119.99),
       ('09c3d58e-b7d1-41f1-be37-e648f559387b', currval('public.sales_order_sales_order_id_seq'), 'PROD204', 19.99),
       ('09c3d58e-b7d1-41f1-be37-e648f559387b', currval('public.sales_order_sales_order_id_seq'), 'PROD205', 1.99);

-- Day -11 (2025-10-26)
INSERT INTO public.sales_order (business_id, customer_id, order_date, status, total_amount, shipping_address, product_received_date)
VALUES ('09c3d58e-b7d1-41f1-be37-e648f559387b', 2, '2025-10-26 13:00:00', 'Completed', 89.98, '200 Oak Ave, Seattle, WA', NULL);
INSERT INTO public.sales_order_items (business_id, sales_order_id, product_id, line_total)
VALUES ('09c3d58e-b7d1-41f1-be37-e648f559387b', currval('public.sales_order_sales_order_id_seq'), 'PROD202', 49.99),
       ('09c3d58e-b7d1-41f1-be37-e648f559387b', currval('public.sales_order_sales_order_id_seq'), 'PROD204', 19.99);

-- Day -10 (2025-10-27)
INSERT INTO public.sales_order (business_id, customer_id, order_date, status, total_amount, shipping_address, product_received_date)
VALUES ('09c3d58e-b7d1-41f1-be37-e648f559387b', 1, '2025-10-27 14:00:00', 'Completed', 209.96, '100 Main St, Boston, MA', '2025-10-28 16:00:00');
INSERT INTO public.sales_order_items (business_id, sales_order_id, product_id, line_total)
VALUES ('09c3d58e-b7d1-41f1-be37-e648f559387b', currval('public.sales_order_sales_order_id_seq'), 'PROD203', 119.99),
       ('09c3d58e-b7d1-41f1-be37-e648f559387b', currval('public.sales_order_sales_order_id_seq'), 'PROD201', 39.99),
       ('09c3d58e-b7d1-41f1-be37-e648f559387b', currval('public.sales_order_sales_order_id_seq'), 'PROD202', 49.99);

-- Day -9 (2025-10-28)
INSERT INTO public.sales_order (business_id, customer_id, order_date, status, total_amount, shipping_address, product_received_date)
VALUES ('09c3d58e-b7d1-41f1-be37-e648f559387b', 2, '2025-10-28 15:00:00', 'Completed', 61.97, '200 Oak Ave, Seattle, WA', NULL);
INSERT INTO public.sales_order_items (business_id, sales_order_id, product_id, line_total)
VALUES ('09c3d58e-b7d1-41f1-be37-e648f559387b', currval('public.sales_order_sales_order_id_seq'), 'PROD205', 1.99),
       ('09c3d58e-b7d1-41f1-be37-e648f559387b', currval('public.sales_order_sales_order_id_seq'), 'PROD204', 19.99),
       ('09c3d58e-b7d1-41f1-be37-e648f559387b', currval('public.sales_order_sales_order_id_seq'), 'PROD201', 39.99);

-- Day -8 (2025-10-29)
INSERT INTO public.sales_order (business_id, customer_id, order_date, status, total_amount, shipping_address, product_received_date)
VALUES ('09c3d58e-b7d1-41f1-be37-e648f559387b', 1, '2025-10-29 10:30:00', 'Completed', 171.97, '100 Main St, Boston, MA', '2025-10-30 12:30:00');
INSERT INTO public.sales_order_items (business_id, sales_order_id, product_id, line_total)
VALUES ('09c3d58e-b7d1-41f1-be37-e648f559387b', currval('public.sales_order_sales_order_id_seq'), 'PROD202', 49.99),
       ('09c3d58e-b7d1-41f1-be37-e648f559387b', currval('public.sales_order_sales_order_id_seq'), 'PROD203', 119.99),
       ('09c3d58e-b7d1-41f1-be37-e648f559387b', currval('public.sales_order_sales_order_id_seq'), 'PROD205', 1.99);

-- Day -7 (2025-10-30)
INSERT INTO public.sales_order (business_id, customer_id, order_date, status, total_amount, shipping_address, product_received_date)
VALUES ('09c3d58e-b7d1-41f1-be37-e648f559387b', 2, '2025-10-30 11:30:00', 'Completed', 59.98, '200 Oak Ave, Seattle, WA', NULL);
INSERT INTO public.sales_order_items (business_id, sales_order_id, product_id, line_total)
VALUES ('09c3d58e-b7d1-41f1-be37-e648f559387b', currval('public.sales_order_sales_order_id_seq'), 'PROD201', 39.99),
       ('09c3d58e-b7d1-41f1-be37-e648f559387b', currval('public.sales_order_sales_order_id_seq'), 'PROD205', 1.99);

-- Day -6 (2025-10-31)
INSERT INTO public.sales_order (business_id, customer_id, order_date, status, total_amount, shipping_address, product_received_date)
VALUES ('09c3d58e-b7d1-41f1-be37-e648f559387b', 1, '2025-10-31 12:30:00', 'Completed', 139.98, '100 Main St, Boston, MA', '2025-11-01 14:30:00');
INSERT INTO public.sales_order_items (business_id, sales_order_id, product_id, line_total)
VALUES ('09c3d58e-b7d1-41f1-be37-e648f559387b', currval('public.sales_order_sales_order_id_seq'), 'PROD204', 19.99),
       ('09c3d58e-b7d1-41f1-be37-e648f559387b', currval('public.sales_order_sales_order_id_seq'), 'PROD202', 49.99),
       ('09c3d58e-b7d1-41f1-be37-e648f559387b', currval('public.sales_order_sales_order_id_seq'), 'PROD201', 39.99);

-- Day -5 (2025-11-01)
INSERT INTO public.sales_order (business_id, customer_id, order_date, status, total_amount, shipping_address, product_received_date)
VALUES ('09c3d58e-b7d1-41f1-be37-e648f559387b', 2, '2025-11-01 13:30:00', 'Completed', 121.97, '200 Oak Ave, Seattle, WA', NULL);
INSERT INTO public.sales_order_items (business_id, sales_order_id, product_id, line_total)
VALUES ('09c3d58e-b7d1-41f1-be37-e648f559387b', currval('public.sales_order_sales_order_id_seq'), 'PROD203', 119.99),
       ('09c3d58e-b7d1-41f1-be37-e648f559387b', currval('public.sales_order_sales_order_id_seq'), 'PROD205', 1.99);

-- Day -4 (2025-11-02)
INSERT INTO public.sales_order (business_id, customer_id, order_date, status, total_amount, shipping_address, product_received_date)
VALUES ('09c3d58e-b7d1-41f1-be37-e648f559387b', 1, '2025-11-02 14:30:00', 'Completed', 169.97, '100 Main St, Boston, MA', '2025-11-03 16:30:00');
INSERT INTO public.sales_order_items (business_id, sales_order_id, product_id, line_total)
VALUES ('09c3d58e-b7d1-41f1-be37-e648f559387b', currval('public.sales_order_sales_order_id_seq'), 'PROD202', 49.99),
       ('09c3d58e-b7d1-41f1-be37-e648f559387b', currval('public.sales_order_sales_order_id_seq'), 'PROD201', 39.99),
       ('09c3d58e-b7d1-41f1-be37-e648f559387b', currval('public.sales_order_sales_order_id_seq'), 'PROD204', 19.99);

-- Day -3 (2025-11-03)
INSERT INTO public.sales_order (business_id, customer_id, order_date, status, total_amount, shipping_address, product_received_date)
VALUES ('09c3d58e-b7d1-41f1-be37-e648f559387b', 2, '2025-11-03 15:30:00', 'Completed', 91.97, '200 Oak Ave, Seattle, WA', NULL);
INSERT INTO public.sales_order_items (business_id, sales_order_id, product_id, line_total)
VALUES ('09c3d58e-b7d1-41f1-be37-e648f559387b', currval('public.sales_order_sales_order_id_seq'), 'PROD201', 39.99),
       ('09c3d58e-b7d1-41f1-be37-e648f559387b', currval('public.sales_order_sales_order_id_seq'), 'PROD205', 1.99),
       ('09c3d58e-b7d1-41f1-be37-e648f559387b', currval('public.sales_order_sales_order_id_seq'), 'PROD202', 49.99);

-- Day -2 (2025-11-04)
INSERT INTO public.sales_order (business_id, customer_id, order_date, status, total_amount, shipping_address, product_received_date)
VALUES ('09c3d58e-b7d1-41f1-be37-e648f559387b', 1, '2025-11-04 16:30:00', 'Completed', 161.96, '100 Main St, Boston, MA', '2025-11-05 18:30:00');
INSERT INTO public.sales_order_items (business_id, sales_order_id, product_id, line_total)
VALUES ('09c3d58e-b7d1-41f1-be37-e648f559387b', currval('public.sales_order_sales_order_id_seq'), 'PROD203', 119.99),
       ('09c3d58e-b7d1-41f1-be37-e648f559387b', currval('public.sales_order_sales_order_id_seq'), 'PROD202', 39.99),
       ('09c3d58e-b7d1-41f1-be37-e648f559387b', currval('public.sales_order_sales_order_id_seq'), 'PROD205', 1.99);

-- Day -1 (2025-11-05)
INSERT INTO public.sales_order (business_id, customer_id, order_date, status, total_amount, shipping_address, product_received_date)
VALUES ('09c3d58e-b7d1-41f1-be37-e648f559387b', 2, '2025-11-05 17:30:00', 'Completed', 59.98, '200 Oak Ave, Seattle, WA', NULL);
INSERT INTO public.sales_order_items (business_id, sales_order_id, product_id, line_total)
VALUES ('09c3d58e-b7d1-41f1-be37-e648f559387b', currval('public.sales_order_sales_order_id_seq'), 'PROD201', 39.99),
       ('09c3d58e-b7d1-41f1-be37-e648f559387b', currval('public.sales_order_sales_order_id_seq'), 'PROD205', 1.99);

-- Day 0 (2025-11-06)
INSERT INTO public.sales_order (business_id, customer_id, order_date, status, total_amount, shipping_address, product_received_date)
VALUES ('09c3d58e-b7d1-41f1-be37-e648f559387b', 1, '2025-11-06 18:30:00', 'Completed', 179.97, '100 Main St, Boston, MA', '2025-11-07 20:30:00');
INSERT INTO public.sales_order_items (business_id, sales_order_id, product_id, line_total)
VALUES ('09c3d58e-b7d1-41f1-be37-e648f559387b', currval('public.sales_order_sales_order_id_seq'), 'PROD203', 119.99),
       ('09c3d58e-b7d1-41f1-be37-e648f559387b', currval('public.sales_order_sales_order_id_seq'), 'PROD202', 49.99),
       ('09c3d58e-b7d1-41f1-be37-e648f559387b', currval('public.sales_order_sales_order_id_seq'), 'PROD205', 1.99);

COMMIT;
