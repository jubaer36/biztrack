-- Migration: 009_fix_purchase_order_items_schema.sql
-- Description: Adds product_id column to purchase_order_items table and populates it with data

-- Add new column product_id
ALTER TABLE public.purchase_order_items ADD COLUMN product_id VARCHAR(100);

-- Populate product_id based on product_brand_id
-- For each brand, select the first product (by product_id alphabetically)
UPDATE public.purchase_order_items
SET product_id = sub.product_id
FROM (
    SELECT DISTINCT ON (brand_id, business_id)
        brand_id,
        business_id,
        product_id
    FROM public.product
    ORDER BY brand_id, business_id, product_id
) sub
WHERE public.purchase_order_items.product_brand_id = sub.brand_id
  AND public.purchase_order_items.business_id = sub.business_id
  AND public.purchase_order_items.product_id IS NULL;