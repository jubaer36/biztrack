-- Create function to get sales summary for a business and date range
CREATE OR REPLACE FUNCTION get_sales_summary(
    p_business_id TEXT,
    p_start_date DATE,
    p_end_date DATE
)
RETURNS TABLE (
    total_revenue NUMERIC,
    total_cost NUMERIC,
    total_sales INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(so.total_amount), 0)::NUMERIC as total_revenue,
        COALESCE(SUM(soi.line_total), 0)::NUMERIC as total_cost,
        COUNT(DISTINCT so.sales_order_id)::INTEGER as total_sales
    FROM sales_order so
    LEFT JOIN sales_order_items soi ON so.sales_order_id = soi.sales_order_id
    WHERE so.business_id::TEXT = p_business_id
    AND so.order_date::DATE >= p_start_date
    AND so.order_date::DATE <= p_end_date;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_sales_summary(TEXT, DATE, DATE) TO authenticated;

-- Create comment for documentation
COMMENT ON FUNCTION get_sales_summary IS 'Get sales summary including total revenue, cost, and number of sales for a business within a date range';
