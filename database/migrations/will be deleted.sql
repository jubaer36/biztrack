-- Migration: 008_create_cashflow_intelligence_schema.sql
-- Description: Creates schema for Cash Flow Intelligence & Prediction System
-- Date: November 7, 2025
-- Purpose: Enable ML-based cash flow predictions, customer credit scoring, and payment optimization

BEGIN;

-- Table for tracking customer payment behavior and credit risk
CREATE TABLE public.customer_payment_behavior (
    behavior_id SERIAL PRIMARY KEY,
    business_id UUID REFERENCES public.businesses(id),
    customer_id INTEGER REFERENCES public.customer(customer_id),
    average_payment_days DECIMAL(5,2) DEFAULT 0,
    total_orders INTEGER DEFAULT 0,
    total_paid_amount DECIMAL(15,2) DEFAULT 0,
    overdue_amount DECIMAL(15,2) DEFAULT 0,
    overdue_count INTEGER DEFAULT 0,
    longest_overdue_days INTEGER DEFAULT 0,
    credit_score DECIMAL(5,2) DEFAULT 0, -- 0-100 scale
    risk_category VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high'
    payment_reliability DECIMAL(5,2) DEFAULT 0, -- 0-100 percentage
    last_payment_date TIMESTAMP,
    last_analysis_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    recommended_credit_terms VARCHAR(100), -- e.g., "Net 30", "Immediate", "Net 15"
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for cash flow predictions
CREATE TABLE public.cash_flow_predictions (
    prediction_id SERIAL PRIMARY KEY,
    business_id UUID REFERENCES public.businesses(id),
    prediction_date DATE,
    predicted_cash_in DECIMAL(15,2) DEFAULT 0,
    predicted_cash_out DECIMAL(15,2) DEFAULT 0,
    predicted_net_cash DECIMAL(15,2) DEFAULT 0,
    confidence_score DECIMAL(5,2) DEFAULT 0, -- 0-100 scale
    prediction_horizon_days INTEGER DEFAULT 30, -- 7, 15, 30, 60, 90 days
    seasonal_factor DECIMAL(5,2) DEFAULT 1.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    model_version VARCHAR(50) DEFAULT 'v1.0'
);

-- Table for actual cash positions (for model training and validation)
CREATE TABLE public.cash_positions (
    position_id SERIAL PRIMARY KEY,
    business_id UUID REFERENCES public.businesses(id),
    position_date DATE,
    actual_cash_in DECIMAL(15,2) DEFAULT 0,
    actual_cash_out DECIMAL(15,2) DEFAULT 0,
    actual_net_cash DECIMAL(15,2) DEFAULT 0,
    bank_balance DECIMAL(15,2) DEFAULT 0,
    accounts_receivable DECIMAL(15,2) DEFAULT 0,
    accounts_payable DECIMAL(15,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for payment schedules and reminders
CREATE TABLE public.payment_schedules (
    schedule_id SERIAL PRIMARY KEY,
    business_id UUID REFERENCES public.businesses(id),
    type VARCHAR(20), -- 'receivable', 'payable'
    reference_id INTEGER, -- sales_order_id or purchase_order_id
    customer_id INTEGER REFERENCES public.customer(customer_id) NULL,
    supplier_id INTEGER REFERENCES public.supplier(supplier_id) NULL,
    amount DECIMAL(15,2),
    due_date DATE,
    priority_score INTEGER DEFAULT 5, -- 1-10 scale (10 highest priority)
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'overdue', 'paid', 'cancelled'
    payment_terms VARCHAR(100),
    reminder_sent BOOLEAN DEFAULT FALSE,
    last_reminder_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for supplier payment prioritization
CREATE TABLE public.supplier_payment_priority (
    priority_id SERIAL PRIMARY KEY,
    business_id UUID REFERENCES public.businesses(id),
    supplier_id INTEGER REFERENCES public.supplier(supplier_id),
    relationship_score DECIMAL(5,2) DEFAULT 50, -- 0-100 scale
    payment_terms_flexibility VARCHAR(100),
    critical_supplier BOOLEAN DEFAULT FALSE,
    average_order_value DECIMAL(15,2) DEFAULT 0,
    payment_history_score DECIMAL(5,2) DEFAULT 50, -- 0-100 scale
    business_impact_score DECIMAL(5,2) DEFAULT 50, -- 0-100 scale
    last_analysis_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for seasonal cash flow patterns
CREATE TABLE public.seasonal_patterns (
    pattern_id SERIAL PRIMARY KEY,
    business_id UUID REFERENCES public.businesses(id),
    month_number INTEGER, -- 1-12
    seasonal_multiplier DECIMAL(5,2) DEFAULT 1.0,
    avg_cash_in DECIMAL(15,2) DEFAULT 0,
    avg_cash_out DECIMAL(15,2) DEFAULT 0,
    volatility_index DECIMAL(5,2) DEFAULT 0, -- 0-100 scale
    pattern_confidence DECIMAL(5,2) DEFAULT 0, -- 0-100 scale
    year_analyzed INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for loan optimization recommendations
CREATE TABLE public.loan_recommendations (
    recommendation_id SERIAL PRIMARY KEY,
    business_id UUID REFERENCES public.businesses(id),
    recommended_amount DECIMAL(15,2),
    optimal_timing DATE,
    loan_purpose VARCHAR(200),
    repayment_capacity DECIMAL(15,2),
    risk_assessment VARCHAR(50), -- 'low', 'medium', 'high'
    confidence_score DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'pending' -- 'pending', 'accepted', 'declined'
);

-- Table for cash flow alerts and monitoring
CREATE TABLE public.cash_flow_alerts (
    alert_id SERIAL PRIMARY KEY,
    business_id UUID REFERENCES public.businesses(id),
    alert_type VARCHAR(50), -- 'low_cash', 'overdue_payment', 'seasonal_warning', 'payment_reminder'
    severity VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
    message TEXT,
    trigger_amount DECIMAL(15,2),
    current_amount DECIMAL(15,2),
    threshold_percentage DECIMAL(5,2),
    alert_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    acknowledged BOOLEAN DEFAULT FALSE,
    resolved BOOLEAN DEFAULT FALSE,
    action_taken TEXT
);

-- Create indexes for performance
CREATE INDEX idx_customer_payment_behavior_business_customer ON public.customer_payment_behavior(business_id, customer_id);
CREATE INDEX idx_cash_flow_predictions_business_date ON public.cash_flow_predictions(business_id, prediction_date);
CREATE INDEX idx_cash_positions_business_date ON public.cash_positions(business_id, position_date);
CREATE INDEX idx_payment_schedules_business_due ON public.payment_schedules(business_id, due_date);
CREATE INDEX idx_payment_schedules_status ON public.payment_schedules(status);
CREATE INDEX idx_supplier_payment_priority_business ON public.supplier_payment_priority(business_id);
CREATE INDEX idx_seasonal_patterns_business_month ON public.seasonal_patterns(business_id, month_number);
CREATE INDEX idx_cash_flow_alerts_business_date ON public.cash_flow_alerts(business_id, alert_date);
CREATE INDEX idx_cash_flow_alerts_unresolved ON public.cash_flow_alerts(business_id, resolved) WHERE resolved = FALSE;

-- Create trigger function for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_customer_payment_behavior_updated_at BEFORE UPDATE ON public.customer_payment_behavior FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payment_schedules_updated_at BEFORE UPDATE ON public.payment_schedules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_supplier_payment_priority_updated_at BEFORE UPDATE ON public.supplier_payment_priority FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_seasonal_patterns_updated_at BEFORE UPDATE ON public.seasonal_patterns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMIT;