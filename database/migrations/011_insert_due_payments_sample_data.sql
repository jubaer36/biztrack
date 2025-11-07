-- Migration: 011_insert_due_payments_sample_data.sql
-- Description: Inserts sample due payments data based on purchase orders
-- Date: November 7, 2025
-- Purpose: Provide sample data for cash flow due payments tracking

BEGIN;

-- Insert due payments based on purchase orders
-- Typically due 30 days after order date, but some can be overdue or pending
-- Note: Using purchase_order total_amount as due_amount
INSERT INTO public.due_payments (business_id, purchase_order_id, due_amount, due_date, status, paid_date) VALUES
-- Purchase Order 1: Delivered on 2024-01-15, due 30 days later = 2024-02-14 (paid)
('09c3d58e-b7d1-41f1-be37-e648f559387b', 1, 1799.98, '2024-02-14', 'paid', '2024-02-14'),

-- Purchase Order 2: In Transit, due 30 days after order = 2024-02-05 (overdue - past due date)
('09c3d58e-b7d1-41f1-be37-e648f559387b', 2, 159.98, (CURRENT_DATE - INTERVAL '20 days')::DATE, 'overdue', NULL),

-- Purchase Order 3: Delivered on 2024-01-22, due 30 days later = 2024-02-21 (paid)
('09c3d58e-b7d1-41f1-be37-e648f559387b', 3, 2499.98, '2024-02-21', 'paid', '2024-02-21'),

-- Purchase Order 4: In Transit, due 30 days after order = 2024-02-07 (overdue - past due date)
('09c3d58e-b7d1-41f1-be37-e648f559387b', 4, 599.99, (CURRENT_DATE - INTERVAL '15 days')::DATE, 'overdue', NULL),

-- Purchase Order 5: Pending, due 30 days after order = 2024-02-08 (pending - due soon)
('09c3d58e-b7d1-41f1-be37-e648f559387b', 5, 139.98, (CURRENT_DATE + INTERVAL '3 days')::DATE, 'pending', NULL),

-- Purchase Order 6: Delivered on 2024-02-01, due 30 days later = 2024-03-02 (pending)
('09c3d58e-b7d1-41f1-be37-e648f559387b', 6, 29.97, (CURRENT_DATE + INTERVAL '25 days')::DATE, 'pending', NULL),

-- Purchase Order 7: In Transit, due 30 days after order = 2024-02-10 (overdue - large amount)
('09c3d58e-b7d1-41f1-be37-e648f559387b', 7, 20000.00, (CURRENT_DATE - INTERVAL '45 days')::DATE, 'overdue', NULL),

-- Purchase Order 8: Pending, due 30 days after order = 2024-02-11 (pending)
('09c3d58e-b7d1-41f1-be37-e648f559387b', 8, 25.98, (CURRENT_DATE + INTERVAL '7 days')::DATE, 'pending', NULL),

-- Purchase Order 9: Delivered on 2024-02-10, due 30 days later = 2024-03-11 (pending)
('09c3d58e-b7d1-41f1-be37-e648f559387b', 9, 839.98, (CURRENT_DATE + INTERVAL '30 days')::DATE, 'pending', NULL),

-- Purchase Order 10: In Transit, due 30 days after order = 2024-02-13 (pending)
('09c3d58e-b7d1-41f1-be37-e648f559387b', 10, 299.97, (CURRENT_DATE + INTERVAL '10 days')::DATE, 'pending', NULL);

COMMIT;

