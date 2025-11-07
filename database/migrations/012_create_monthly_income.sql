-- Migration: 012_create_monthly_income.sql
-- Description: Adds monthly_income table for storing monthly profit per business
-- Date: November 7, 2025

BEGIN;

CREATE TABLE IF NOT EXISTS public.monthly_income (
    id SERIAL PRIMARY KEY,
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    year INTEGER NOT NULL CHECK (year >= 2000 AND year <= 2100),
    month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
    profit_value DECIMAL(15,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (business_id, year, month)
);

CREATE INDEX IF NOT EXISTS idx_monthly_income_business ON public.monthly_income(business_id);
CREATE INDEX IF NOT EXISTS idx_monthly_income_ym ON public.monthly_income(year, month);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_monthly_income_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_monthly_income_updated_at ON public.monthly_income;
CREATE TRIGGER trg_update_monthly_income_updated_at
    BEFORE UPDATE ON public.monthly_income
    FOR EACH ROW
    EXECUTE FUNCTION update_monthly_income_updated_at();

COMMIT;
