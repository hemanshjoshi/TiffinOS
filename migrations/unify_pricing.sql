-- Migration to centralize pricing logic and configuration

-- 1. Create global_config table
CREATE TABLE IF NOT EXISTS global_config (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Seed default fee values
INSERT INTO global_config (key, value) VALUES 
('order_fees', '{
    "packaging_charge": 10.00,
    "platform_fee": 12.50,
    "gst_rate": 0.05,
    "delivery_base_fee": 37.00,
    "delivery_free_threshold": 169.00
}'::jsonb)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- 3. Create helper function for cart calculations
CREATE OR REPLACE FUNCTION get_cart_summary(
    p_items JSONB, -- Array of { menu_item_id, quantity, variant_id, addon_ids }
    p_coupon_code TEXT DEFAULT NULL,
    p_kitchen_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_item_total DECIMAL(10, 2) := 0;
    v_packaging_charge DECIMAL(10, 2);
    v_platform_fee DECIMAL(10, 2);
    v_gst_rate DECIMAL(10, 2);
    v_delivery_base_fee DECIMAL(10, 2);
    v_delivery_free_threshold DECIMAL(10, 2);
    v_fees JSONB;
    
    v_item JSONB;
    v_menu_item RECORD;
    v_item_price DECIMAL(10, 2);
    v_variant_price DECIMAL(10, 2);
    v_addon_price DECIMAL(10, 2);
    
    v_discount_amount DECIMAL(10, 2) := 0;
    v_coupon RECORD;
    
    v_delivery_fee DECIMAL(10, 2);
    v_gst_amount DECIMAL(10, 2);
    v_grand_total DECIMAL(10, 2);
BEGIN
    -- Get fees from config
    SELECT value INTO v_fees FROM global_config WHERE key = 'order_fees';
    v_packaging_charge := (v_fees->>'packaging_charge')::DECIMAL;
    v_platform_fee := (v_fees->>'platform_fee')::DECIMAL;
    v_gst_rate := (v_fees->>'gst_rate')::DECIMAL;
    v_delivery_base_fee := (v_fees->>'delivery_base_fee')::DECIMAL;
    v_delivery_free_threshold := (v_fees->>'delivery_free_threshold')::DECIMAL;

    -- Calculate Item Total
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        SELECT * INTO v_menu_item FROM menu_items WHERE id = (v_item->>'menu_item_id')::UUID;
        IF NOT FOUND THEN CONTINUE; END IF;

        v_item_price := v_menu_item.price;

        -- Variant
        IF v_item->>'variant_id' IS NOT NULL AND v_item->>'variant_id' != 'default' THEN
            SELECT COALESCE((elem->>'price')::DECIMAL, 0) INTO v_variant_price
            FROM jsonb_array_elements(v_menu_item.variants) elem
            WHERE elem->>'id' = v_item->>'variant_id';
            IF v_variant_price IS NOT NULL THEN v_item_price := v_variant_price; END IF;
        END IF;

        -- Addons
        IF v_item->'addon_ids' IS NOT NULL AND jsonb_array_length(v_item->'addon_ids') > 0 THEN
            SELECT COALESCE(SUM((elem->>'price')::DECIMAL), 0) INTO v_addon_price
            FROM jsonb_array_elements(v_menu_item.addons) elem
            WHERE elem->>'id' IN (SELECT * FROM jsonb_array_elements_text(v_item->'addon_ids'));
            v_item_price := v_item_price + v_addon_price;
        END IF;

        v_item_total := v_item_total + (v_item_price * (v_item->>'quantity')::INT);
    END LOOP;

    -- Apply Coupon
    IF p_coupon_code IS NOT NULL THEN
        SELECT * INTO v_coupon FROM coupons 
        WHERE code = p_coupon_code AND is_active = TRUE 
        AND (valid_until IS NULL OR valid_until > NOW())
        AND (kitchen_id IS NULL OR kitchen_id = p_kitchen_id);
        
        IF FOUND AND v_item_total >= COALESCE(v_coupon.min_order_value, 0) THEN
            IF v_coupon.discount_type = 'FLAT' THEN
                v_discount_amount := v_coupon.discount_value;
            ELSE
                v_discount_amount := (v_item_total * v_coupon.discount_value) / 100;
                IF v_coupon.max_discount IS NOT NULL THEN
                    v_discount_amount := LEAST(v_discount_amount, v_coupon.max_discount);
                END IF;
            END IF;
        END IF;
    END IF;

    -- Final Calculations
    v_delivery_fee := CASE WHEN v_item_total > v_delivery_free_threshold THEN 0 ELSE v_delivery_base_fee END;
    v_gst_amount := ROUND(v_item_total * v_gst_rate, 2);
    v_grand_total := v_item_total + v_packaging_charge + v_delivery_fee + v_platform_fee + v_gst_amount - v_discount_amount;

    RETURN jsonb_build_object(
        'item_total', v_item_total,
        'packaging_charge', v_packaging_charge,
        'delivery_fee', v_delivery_fee,
        'platform_fee', v_platform_fee,
        'gst_amount', v_gst_amount,
        'discount_amount', v_discount_amount,
        'grand_total', GREATEST(v_grand_total, 0)
    );
END;
$$;
