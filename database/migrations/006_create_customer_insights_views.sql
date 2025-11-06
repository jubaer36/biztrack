-- Migration: 006_create_customer_insights_views.sql
-- Description: Creates views and tables for AI-powered customer insights and RFM segmentation

-- View 1: Customer RFM Metrics (Recency, Frequency, Monetary)
CREATE OR REPLACE VIEW public.vw_customer_rfm AS
WITH customer_metrics AS (
    SELECT 
        so.business_id,
        so.customer_id,
        c.customer_name,
        c.email,
        c.phone,
        c.customer_type,
        -- Recency: Days since last purchase
        EXTRACT(DAY FROM (NOW() - MAX(so.order_date))) AS recency_days,
        -- Frequency: Number of orders
        COUNT(DISTINCT so.sales_order_id) AS frequency_count,
        -- Monetary: Total revenue
        COALESCE(SUM(so.total_amount), 0) AS monetary_value,
        -- Additional metrics
        MIN(so.order_date) AS first_purchase_date,
        MAX(so.order_date) AS last_purchase_date,
        AVG(so.total_amount) AS avg_order_value
    FROM public.sales_order so
    JOIN public.customer c ON so.customer_id = c.customer_id
    WHERE so.status = 'Completed'
    GROUP BY so.business_id, so.customer_id, c.customer_name, c.email, c.phone, c.customer_type
),
rfm_scores AS (
    SELECT 
        *,
        -- RFM Scores (1-5, where 5 is best)
        CASE 
            WHEN recency_days <= 30 THEN 5
            WHEN recency_days <= 60 THEN 4
            WHEN recency_days <= 90 THEN 3
            WHEN recency_days <= 180 THEN 2
            ELSE 1
        END AS recency_score,
        CASE 
            WHEN frequency_count >= 10 THEN 5
            WHEN frequency_count >= 7 THEN 4
            WHEN frequency_count >= 5 THEN 3
            WHEN frequency_count >= 3 THEN 2
            ELSE 1
        END AS frequency_score,
        NTILE(5) OVER (PARTITION BY business_id ORDER BY monetary_value) AS monetary_score
    FROM customer_metrics
)
SELECT 
    *,
    -- RFM Segment Classification
    CASE 
        WHEN recency_score >= 4 AND frequency_score >= 4 AND monetary_score >= 4 THEN 'Champions'
        WHEN recency_score >= 3 AND frequency_score >= 3 AND monetary_score >= 3 THEN 'Loyal Customers'
        WHEN recency_score >= 4 AND frequency_score <= 2 THEN 'New Customers'
        WHEN recency_score >= 3 AND frequency_score >= 3 AND monetary_score <= 3 THEN 'Potential Loyalists'
        WHEN recency_score >= 3 AND frequency_score <= 2 THEN 'Promising'
        WHEN recency_score = 3 AND frequency_score = 3 THEN 'Need Attention'
        WHEN recency_score <= 2 AND frequency_score >= 3 THEN 'At Risk'
        WHEN recency_score <= 2 AND frequency_score >= 2 AND monetary_score >= 3 THEN 'Cant Lose Them'
        WHEN recency_score <= 2 AND frequency_score <= 2 AND monetary_score >= 3 THEN 'Hibernating'
        ELSE 'Lost'
    END AS rfm_segment,
    -- Churn Risk Score (0-100)
    CASE 
        WHEN recency_days > 180 THEN 90
        WHEN recency_days > 120 THEN 70
        WHEN recency_days > 90 THEN 50
        WHEN recency_days > 60 THEN 30
        ELSE 10
    END AS churn_risk_score
FROM rfm_scores;

-- View 2: Customer Lifetime Value (CLV)
CREATE OR REPLACE VIEW public.vw_customer_lifetime_value AS
SELECT 
    business_id,
    customer_id,
    customer_name,
    monetary_value AS total_clv,
    frequency_count AS total_orders,
    avg_order_value,
    EXTRACT(DAY FROM (last_purchase_date - first_purchase_date)) AS customer_tenure_days,
    -- Predicted CLV (simple model: avg_order_value * frequency * 2)
    (avg_order_value * frequency_count * 2) AS predicted_clv,
    CASE 
        WHEN monetary_value > 100000 THEN 'VIP'
        WHEN monetary_value > 50000 THEN 'High Value'
        WHEN monetary_value > 20000 THEN 'Medium Value'
        ELSE 'Low Value'
    END AS value_tier
FROM public.vw_customer_rfm;

-- View 3: Customer Purchase Behavior
CREATE OR REPLACE VIEW public.vw_customer_purchase_behavior AS
SELECT 
    so.business_id,
    so.customer_id,
    c.customer_name,
    COUNT(DISTINCT soi.product_id) AS unique_products_purchased,
    COUNT(DISTINCT p.category_id) AS unique_categories_purchased,
    COUNT(DISTINCT p.brand_id) AS unique_brands_purchased,
    -- Most purchased category
    MODE() WITHIN GROUP (ORDER BY p.category_id) AS favorite_category_id,
    -- Average days between purchases
    CASE 
        WHEN COUNT(DISTINCT so.sales_order_id) > 1 THEN
            EXTRACT(DAY FROM (MAX(so.order_date) - MIN(so.order_date))) / NULLIF(COUNT(DISTINCT so.sales_order_id) - 1, 0)
        ELSE NULL
    END AS avg_days_between_purchases,
    -- Last purchase details
    MAX(so.order_date) AS last_order_date,
    MAX(so.total_amount) AS last_order_amount
FROM public.sales_order so
JOIN public.customer c ON so.customer_id = c.customer_id
LEFT JOIN public.sales_order_items soi ON so.sales_order_id = soi.sales_order_id
LEFT JOIN public.product p ON soi.product_id = p.product_id
WHERE so.status = 'Completed'
GROUP BY so.business_id, so.customer_id, c.customer_name;

-- View 4: Customer Engagement Trends
CREATE OR REPLACE VIEW public.vw_customer_engagement_trends AS
WITH monthly_purchases AS (
    SELECT 
        business_id,
        customer_id,
        DATE_TRUNC('month', order_date) AS purchase_month,
        COUNT(*) AS orders_count,
        SUM(total_amount) AS monthly_spend
    FROM public.sales_order
    WHERE status = 'Completed'
    GROUP BY business_id, customer_id, DATE_TRUNC('month', order_date)
),
trend_analysis AS (
    SELECT 
        business_id,
        customer_id,
        purchase_month,
        orders_count,
        monthly_spend,
        LAG(monthly_spend) OVER (PARTITION BY business_id, customer_id ORDER BY purchase_month) AS prev_month_spend,
        LAG(orders_count) OVER (PARTITION BY business_id, customer_id ORDER BY purchase_month) AS prev_month_orders
    FROM monthly_purchases
)
SELECT 
    business_id,
    customer_id,
    purchase_month,
    orders_count,
    monthly_spend,
    CASE 
        WHEN prev_month_spend IS NULL THEN 'New'
        WHEN monthly_spend > prev_month_spend THEN 'Increasing'
        WHEN monthly_spend < prev_month_spend THEN 'Decreasing'
        ELSE 'Stable'
    END AS spending_trend,
    CASE 
        WHEN prev_month_spend IS NOT NULL AND prev_month_spend > 0 THEN
            ((monthly_spend - prev_month_spend) / prev_month_spend * 100)
        ELSE 0
    END AS spend_change_percentage
FROM trend_analysis
WHERE purchase_month >= DATE_TRUNC('month', NOW() - INTERVAL '6 months');

-- View 5: Top Customers by Segment
CREATE OR REPLACE VIEW public.vw_top_customers_by_segment AS
SELECT 
    business_id,
    rfm_segment,
    COUNT(*) AS customer_count,
    SUM(monetary_value) AS total_segment_revenue,
    AVG(monetary_value) AS avg_customer_value,
    AVG(frequency_count) AS avg_purchase_frequency,
    AVG(recency_days) AS avg_days_since_purchase,
    AVG(churn_risk_score) AS avg_churn_risk
FROM public.vw_customer_rfm
GROUP BY business_id, rfm_segment
ORDER BY total_segment_revenue DESC;

-- View 6: At-Risk Customers (for retention campaigns)
CREATE OR REPLACE VIEW public.vw_at_risk_customers AS
SELECT 
    rfm.business_id,
    rfm.customer_id,
    rfm.customer_name,
    rfm.email,
    rfm.phone,
    rfm.rfm_segment,
    rfm.recency_days,
    rfm.last_purchase_date,
    rfm.monetary_value,
    rfm.frequency_count,
    rfm.churn_risk_score,
    pb.favorite_category_id,
    pb.avg_days_between_purchases
FROM public.vw_customer_rfm rfm
LEFT JOIN public.vw_customer_purchase_behavior pb 
    ON rfm.customer_id = pb.customer_id 
    AND rfm.business_id = pb.business_id
WHERE rfm.rfm_segment IN ('At Risk', 'Cant Lose Them', 'Hibernating', 'Lost')
   OR rfm.churn_risk_score >= 50
ORDER BY rfm.churn_risk_score DESC, rfm.monetary_value DESC;

-- View 7: Product Recommendations per Customer
CREATE OR REPLACE VIEW public.vw_customer_product_recommendations AS
WITH customer_purchases AS (
    SELECT DISTINCT
        so.business_id,
        so.customer_id,
        soi.product_id,
        p.category_id,
        p.brand_id
    FROM public.sales_order so
    JOIN public.sales_order_items soi ON so.sales_order_id = soi.sales_order_id
    JOIN public.product p ON soi.product_id = p.product_id
    WHERE so.status = 'Completed'
),
popular_in_category AS (
    SELECT 
        p.business_id,
        p.category_id,
        p.product_id,
        p.product_name,
        p.selling_price,
        COUNT(DISTINCT soi.sales_order_id) AS popularity_score
    FROM public.product p
    LEFT JOIN public.sales_order_items soi ON p.product_id = soi.product_id
    GROUP BY p.business_id, p.category_id, p.product_id, p.product_name, p.selling_price
)
SELECT DISTINCT
    cp.business_id,
    cp.customer_id,
    pic.product_id AS recommended_product_id,
    pic.product_name AS recommended_product_name,
    pic.category_id,
    pic.selling_price,
    pic.popularity_score,
    'Based on category preference' AS recommendation_reason
FROM customer_purchases cp
JOIN popular_in_category pic 
    ON cp.business_id = pic.business_id 
    AND cp.category_id = pic.category_id
WHERE cp.product_id != pic.product_id
ORDER BY cp.customer_id, pic.popularity_score DESC;

-- Table: Store AI customer insights and recommendations
CREATE TABLE IF NOT EXISTS public.customer_insights (
    insight_id SERIAL PRIMARY KEY,
    business_id UUID REFERENCES public.businesses(id),
    customer_id INTEGER REFERENCES public.customer(customer_id),
    insight_type VARCHAR(50), -- 'retention', 'upsell', 'engagement', 'churn_prevention'
    rfm_segment VARCHAR(50),
    churn_risk_score INTEGER,
    recommendation TEXT,
    suggested_action TEXT,
    suggested_discount DECIMAL(5,2),
    recommended_products TEXT[], -- Array of product IDs
    email_subject TEXT,
    email_body TEXT,
    campaign_priority VARCHAR(20), -- 'high', 'medium', 'low'
    confidence_score DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '30 days',
    is_campaign_sent BOOLEAN DEFAULT FALSE,
    campaign_sent_at TIMESTAMP
);

-- Table: Customer Engagement Campaigns
CREATE TABLE IF NOT EXISTS public.customer_campaigns (
    campaign_id SERIAL PRIMARY KEY,
    business_id UUID REFERENCES public.businesses(id),
    campaign_name VARCHAR(255),
    campaign_type VARCHAR(50), -- 'retention', 'winback', 'upsell', 'loyalty'
    target_segment VARCHAR(50), -- RFM segment
    target_customers INTEGER[], -- Array of customer IDs
    email_subject TEXT,
    email_template TEXT,
    discount_percentage DECIMAL(5,2),
    status VARCHAR(50), -- 'draft', 'scheduled', 'active', 'completed'
    created_at TIMESTAMP DEFAULT NOW(),
    scheduled_at TIMESTAMP,
    sent_at TIMESTAMP,
    total_sent INTEGER DEFAULT 0,
    total_opened INTEGER DEFAULT 0,
    total_converted INTEGER DEFAULT 0
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_customer_insights_business 
    ON public.customer_insights(business_id);
CREATE INDEX IF NOT EXISTS idx_customer_insights_customer 
    ON public.customer_insights(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_insights_segment 
    ON public.customer_insights(rfm_segment);
CREATE INDEX IF NOT EXISTS idx_customer_insights_created 
    ON public.customer_insights(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_customer_campaigns_business 
    ON public.customer_campaigns(business_id);
CREATE INDEX IF NOT EXISTS idx_customer_campaigns_status 
    ON public.customer_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_customer_campaigns_type 
    ON public.customer_campaigns(campaign_type);
