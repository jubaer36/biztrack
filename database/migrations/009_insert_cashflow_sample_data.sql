-- Migration: 009_insert_cashflow_sample_data.sql
-- Description: Inserts sample data for Cash Flow Intelligence & Prediction System
-- Date: November 7, 2025
-- Purpose: Provide initial data for testing and demonstration of cash flow features

BEGIN;

-- Business UUID used in sample data
-- 09c3d58e-b7d1-41f1-be37-e648f559387b

-- Sample customer payment behavior data
INSERT INTO public.customer_payment_behavior (business_id, customer_id, average_payment_days, total_orders, total_paid_amount, overdue_amount, overdue_count, longest_overdue_days, credit_score, risk_category, payment_reliability, last_payment_date, recommended_credit_terms) VALUES
('09c3d58e-b7d1-41f1-be37-e648f559387b', 1, 7.5, 15, 245000.00, 0.00, 0, 0, 95.0, 'low', 98.0, '2025-11-05 14:30:00', 'Net 30'),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 2, 22.3, 8, 125000.00, 35000.00, 2, 45, 45.0, 'high', 65.0, '2025-10-15 09:20:00', 'Immediate'),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 3, 18.1, 12, 189000.00, 15000.00, 1, 15, 72.0, 'medium', 82.0, '2025-10-28 16:45:00', 'Net 15'),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 4, 35.8, 6, 95000.00, 45000.00, 3, 55, 25.0, 'high', 45.0, '2025-09-20 11:30:00', 'Immediate'),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 5, 12.4, 20, 320000.00, 8000.00, 1, 8, 88.0, 'low', 92.0, '2025-11-02 13:15:00', 'Net 45'),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 6, 15.7, 18, 275000.00, 0.00, 0, 0, 85.0, 'low', 89.0, '2025-11-04 10:20:00', 'Net 30'),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 7, 25.9, 9, 142000.00, 22000.00, 2, 32, 58.0, 'medium', 75.0, '2025-10-22 15:40:00', 'Net 15'),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 8, 8.2, 25, 385000.00, 0.00, 0, 0, 96.0, 'low', 99.0, '2025-11-06 17:00:00', 'Net 60'),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 9, 42.1, 4, 67000.00, 35000.00, 3, 65, 15.0, 'high', 35.0, '2025-09-05 08:45:00', 'Immediate'),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 10, 19.6, 14, 198000.00, 12000.00, 1, 12, 78.0, 'medium', 85.0, '2025-10-30 12:25:00', 'Net 20');

-- Sample cash flow predictions for next 30 days
INSERT INTO public.cash_flow_predictions (business_id, prediction_date, predicted_cash_in, predicted_cash_out, predicted_net_cash, confidence_score, prediction_horizon_days, seasonal_factor) VALUES
('09c3d58e-b7d1-41f1-be37-e648f559387b', '2025-11-08', 85000.00, 45000.00, 40000.00, 85.5, 7, 1.1),
('09c3d58e-b7d1-41f1-be37-e648f559387b', '2025-11-09', 92000.00, 52000.00, 40000.00, 82.3, 7, 1.1),
('09c3d58e-b7d1-41f1-be37-e648f559387b', '2025-11-10', 78000.00, 41000.00, 37000.00, 88.1, 7, 1.05),
('09c3d58e-b7d1-41f1-be37-e648f559387b', '2025-11-11', 115000.00, 68000.00, 47000.00, 79.8, 7, 1.15),
('09c3d58e-b7d1-41f1-be37-e648f559387b', '2025-11-12', 89000.00, 43000.00, 46000.00, 86.2, 7, 1.1),
('09c3d58e-b7d1-41f1-be37-e648f559387b', '2025-11-13', 95000.00, 55000.00, 40000.00, 83.7, 7, 1.08),
('09c3d58e-b7d1-41f1-be37-e648f559387b', '2025-11-14', 72000.00, 38000.00, 34000.00, 87.4, 7, 1.02),
('09c3d58e-b7d1-41f1-be37-e648f559387b', '2025-11-15', 125000.00, 75000.00, 50000.00, 75.6, 15, 1.2),
('09c3d58e-b7d1-41f1-be37-e648f559387b', '2025-11-22', 145000.00, 85000.00, 60000.00, 72.1, 15, 1.25),
('09c3d58e-b7d1-41f1-be37-e648f559387b', '2025-11-30', 180000.00, 105000.00, 75000.00, 68.9, 30, 1.35),
('09c3d58e-b7d1-41f1-be37-e648f559387b', '2025-12-07', 220000.00, 125000.00, 95000.00, 65.2, 30, 1.5),
('09c3d58e-b7d1-41f1-be37-e648f559387b', '2025-12-15', 275000.00, 145000.00, 130000.00, 62.8, 30, 1.8);

-- Sample actual cash positions for model training
INSERT INTO public.cash_positions (business_id, position_date, actual_cash_in, actual_cash_out, actual_net_cash, bank_balance, accounts_receivable, accounts_payable) VALUES
('09c3d58e-b7d1-41f1-be37-e648f559387b', '2025-11-01', 82000.00, 47000.00, 35000.00, 420000.00, 180000.00, 125000.00),
('09c3d58e-b7d1-41f1-be37-e648f559387b', '2025-11-02', 95000.00, 55000.00, 40000.00, 460000.00, 175000.00, 130000.00),
('09c3d58e-b7d1-41f1-be37-e648f559387b', '2025-11-03', 78000.00, 42000.00, 36000.00, 496000.00, 168000.00, 115000.00),
('09c3d58e-b7d1-41f1-be37-e648f559387b', '2025-11-04', 105000.00, 65000.00, 40000.00, 536000.00, 162000.00, 135000.00),
('09c3d58e-b7d1-41f1-be37-e648f559387b', '2025-11-05', 88000.00, 48000.00, 40000.00, 576000.00, 155000.00, 125000.00),
('09c3d58e-b7d1-41f1-be37-e648f559387b', '2025-11-06', 92000.00, 52000.00, 40000.00, 616000.00, 148000.00, 142000.00),
('09c3d58e-b7d1-41f1-be37-e648f559387b', '2025-11-07', 75000.00, 38000.00, 37000.00, 653000.00, 145000.00, 135000.00);

-- Sample payment schedules (receivables and payables)
INSERT INTO public.payment_schedules (business_id, type, reference_id, customer_id, supplier_id, amount, due_date, priority_score, status, payment_terms) VALUES
-- Receivables
('09c3d58e-b7d1-41f1-be37-e648f559387b', 'receivable', 1, 1, NULL, 25000.00, '2025-11-10', 8, 'pending', 'Net 7'),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 'receivable', 2, 2, NULL, 35000.00, '2025-10-25', 10, 'overdue', 'Immediate'),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 'receivable', 3, 3, NULL, 15000.00, '2025-11-12', 7, 'pending', 'Net 15'),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 'receivable', 4, 4, NULL, 45000.00, '2025-10-15', 10, 'overdue', 'Immediate'),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 'receivable', 5, 5, NULL, 8000.00, '2025-11-15', 6, 'pending', 'Net 45'),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 'receivable', 6, 6, NULL, 42000.00, '2025-11-18', 8, 'pending', 'Net 30'),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 'receivable', 7, 7, NULL, 22000.00, '2025-11-08', 9, 'pending', 'Net 15'),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 'receivable', 8, 8, NULL, 65000.00, '2025-11-25', 7, 'pending', 'Net 60'),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 'receivable', 9, 9, NULL, 35000.00, '2025-09-20', 10, 'overdue', 'Immediate'),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 'receivable', 10, 10, NULL, 12000.00, '2025-11-14', 7, 'pending', 'Net 20'),
-- Payables
('09c3d58e-b7d1-41f1-be37-e648f559387b', 'payable', 1, NULL, 1, 35000.00, '2025-11-12', 9, 'pending', 'Net 30'),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 'payable', 2, NULL, 2, 22000.00, '2025-11-15', 6, 'pending', 'Net 45'),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 'payable', 3, NULL, 3, 18000.00, '2025-11-10', 8, 'pending', 'Net 15'),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 'payable', 4, NULL, 4, 45000.00, '2025-11-08', 10, 'pending', 'Net 7'),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 'payable', 5, NULL, 5, 28000.00, '2025-11-20', 7, 'pending', 'Net 30');

-- Sample supplier payment priority data
INSERT INTO public.supplier_payment_priority (business_id, supplier_id, relationship_score, payment_terms_flexibility, critical_supplier, average_order_value, payment_history_score, business_impact_score) VALUES
('09c3d58e-b7d1-41f1-be37-e648f559387b', 1, 85.0, 'Flexible - Can extend 15 days', TRUE, 45000.00, 92.0, 95.0),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 2, 72.0, 'Moderate - 5 days max extension', FALSE, 25000.00, 78.0, 65.0),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 3, 68.0, 'Strict - No extensions', FALSE, 18000.00, 85.0, 45.0),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 4, 95.0, 'Very Flexible - 30 days extension', TRUE, 55000.00, 98.0, 98.0),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 5, 58.0, 'Moderate - 10 days max extension', FALSE, 22000.00, 65.0, 55.0);

-- Sample seasonal patterns
INSERT INTO public.seasonal_patterns (business_id, month_number, seasonal_multiplier, avg_cash_in, avg_cash_out, volatility_index, pattern_confidence, year_analyzed) VALUES
('09c3d58e-b7d1-41f1-be37-e648f559387b', 1, 0.8, 75000.00, 55000.00, 25.0, 85.0, 2024),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 2, 0.9, 82000.00, 58000.00, 22.0, 88.0, 2024),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 3, 1.1, 95000.00, 65000.00, 18.0, 92.0, 2024),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 4, 1.2, 105000.00, 72000.00, 15.0, 95.0, 2024),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 5, 1.3, 115000.00, 78000.00, 12.0, 96.0, 2024),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 6, 1.1, 98000.00, 68000.00, 20.0, 90.0, 2024),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 7, 0.9, 85000.00, 62000.00, 28.0, 82.0, 2024),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 8, 0.85, 78000.00, 58000.00, 30.0, 80.0, 2024),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 9, 1.0, 88000.00, 64000.00, 22.0, 88.0, 2024),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 10, 1.15, 102000.00, 71000.00, 16.0, 93.0, 2024),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 11, 1.4, 125000.00, 85000.00, 10.0, 98.0, 2024),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 12, 1.8, 165000.00, 110000.00, 8.0, 99.0, 2024);

-- Sample loan recommendations
INSERT INTO public.loan_recommendations (business_id, recommended_amount, optimal_timing, loan_purpose, repayment_capacity, risk_assessment, confidence_score) VALUES
('09c3d58e-b7d1-41f1-be37-e648f559387b', 500000.00, '2025-12-01', 'Seasonal inventory buildup for peak sales period', 85000.00, 'low', 92.5),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 250000.00, '2025-11-15', 'Bridge financing for large customer orders', 45000.00, 'medium', 78.3);

-- Sample cash flow alerts
INSERT INTO public.cash_flow_alerts (business_id, alert_type, severity, message, trigger_amount, current_amount, threshold_percentage, acknowledged, resolved) VALUES
('09c3d58e-b7d1-41f1-be37-e648f559387b', 'overdue_payment', 'high', 'Customer Rahman Trading has ৳45,000 overdue for 45+ days', 45000.00, 45000.00, 100.0, FALSE, FALSE),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 'payment_reminder', 'medium', 'Payment of ৳35,000 due to Supplier ABC in 2 days', 35000.00, 35000.00, 100.0, TRUE, FALSE),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 'seasonal_warning', 'medium', 'Approaching peak season - recommend building cash reserves', 500000.00, 653000.00, 76.8, FALSE, FALSE),
('09c3d58e-b7d1-41f1-be37-e648f559387b', 'low_cash', 'low', 'Cash position will drop below ৳400,000 in 15 days', 400000.00, 435000.00, 91.3, TRUE, TRUE);

COMMIT;