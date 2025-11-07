-- Migration: 010_simplify_cashflow_schema.sql
-- Description: Simplifies cash flow schema to work with existing tables
-- Date: November 7, 2025
-- Purpose: Use existing sales_order, purchase_order, and investment tables for cash flow tracking

BEGIN;

-- Drop complex tables that are no longer needed
DROP TABLE IF EXISTS public.customer_payment_behavior CASCADE;
DROP TABLE IF EXISTS public.payment_schedules CASCADE;
DROP TABLE IF EXISTS public.supplier_payment_priority CASCADE;

-- Create simplified due_payments table
CREATE TABLE public.due_payments (
    due_payment_id SERIAL PRIMARY KEY,
    business_id UUID REFERENCES public.businesses(id),
    purchase_order_id INTEGER REFERENCES public.purchase_order(purchase_order_id),
    due_amount DECIMAL(15,2) NOT NULL,
    due_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'paid', 'overdue'
    paid_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(business_id, purchase_order_id) -- One due payment per purchase order
);

-- Create index for performance
CREATE INDEX idx_due_payments_business_id ON public.due_payments(business_id);
CREATE INDEX idx_due_payments_purchase_order_id ON public.due_payments(purchase_order_id);
CREATE INDEX idx_due_payments_due_date ON public.due_payments(due_date);
CREATE INDEX idx_due_payments_status ON public.due_payments(status);

-- Keep cash_flow_predictions table (simplified)
-- Keep cash_positions table for tracking actual positions
-- Keep seasonal_patterns table for seasonal analysis
-- Keep loan_recommendations table
-- Keep cash_flow_alerts table

-- Update cash_flow_predictions to remove unnecessary fields if needed
-- (keeping it as is for now)

-- Create trigger for updating updated_at timestamp
CREATE OR REPLACE FUNCTION update_due_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_due_payments_updated_at 
    BEFORE UPDATE ON public.due_payments 
    FOR EACH ROW 
    EXECUTE FUNCTION update_due_payments_updated_at();

COMMIT;

