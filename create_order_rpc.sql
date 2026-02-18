-- Create a type for the input items to make it cleaner (optional, but good for structure)
-- Or just use JSONB directly. Let's use JSONB for flexibility.

CREATE OR REPLACE FUNCTION create_order(
  p_kitchen_id UUID,
  p_items JSONB, -- Array of objects: { "menu_item_id": uuid, "quantity": int, "variant_id": text/uuid (optional), "addon_ids": text[] (optional) }
  p_delivery_address_id UUID,
  p_coupon_code TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with privileges of the creator (postgres) to ensure access to tables
AS $$
DECLARE
  v_user_id UUID;
  v_order_id UUID;
  v_total_amount DECIMAL(10, 2) := 0;
  v_item_total DECIMAL(10, 2) := 0;
  v_discount_amount DECIMAL(10, 2) := 0;
  v_delivery_fee DECIMAL(10, 2) := 40.00; -- Hardcoded for now based on frontend logic
  v_platform_fee DECIMAL(10, 2);
  v_taxes DECIMAL(10, 2);
  v_final_amount DECIMAL(10, 2);
  
  -- Loop variables
  v_item JSONB;
  v_menu_item RECORD;
  v_variant_price DECIMAL(10, 2);
  v_addon_price DECIMAL(10, 2);
  v_item_price DECIMAL(10, 2);
  v_line_total DECIMAL(10, 2);
  
  -- Coupon variables
  v_coupon RECORD;
  
  -- Address
  v_address_snapshot JSONB;
  
BEGIN
  -- 1. Get User ID from Auth
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;

  -- 2. Verify Kitchen is Active (using PROFILES table)
  -- Note: Assuming 'is_open' is the active flag as per search logic.
  -- Also verifying it has a kitchen_name to ensure it is a kitchen profile.
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = p_kitchen_id AND is_open = TRUE AND kitchen_name IS NOT NULL) THEN
    RAISE EXCEPTION 'Kitchen is not active/open or does not exist';
  END IF;

  -- 3. Get Address Snapshot
  SELECT to_jsonb(a.*) INTO v_address_snapshot
  FROM addresses a
  WHERE id = p_delivery_address_id AND user_id = v_user_id;
  
  IF v_address_snapshot IS NULL THEN
    RAISE EXCEPTION 'Delivery address not found or does not belong to user';
  END IF;

  -- 4. Process Items
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    -- Fetch Menu Item
    SELECT * INTO v_menu_item FROM menu_items WHERE id = (v_item->>'menu_item_id')::UUID;
    
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Menu item % not found', (v_item->>'menu_item_id');
    END IF;
    
    IF v_menu_item.is_available = FALSE THEN
      RAISE EXCEPTION 'Menu item % is currently unavailable', v_menu_item.name;
    END IF;

    -- Calculate Price
    -- Base logic: If variant selected, use variant price. Else use base price.
    v_item_price := v_menu_item.price;
    
    -- Check Variant
    IF v_item->>'variant_id' IS NOT NULL AND v_item->>'variant_id' != 'default' THEN
      -- Extract variant price from JSONB array
      -- Assuming variants is generic JSONB array of {id, price, ...}
      SELECT COALESCE((elem->>'price')::DECIMAL, 0) INTO v_variant_price
      FROM jsonb_array_elements(v_menu_item.variants) elem
      WHERE elem->>'id' = v_item->>'variant_id';
      
      IF v_variant_price IS NOT NULL THEN
        v_item_price := v_variant_price;
      ELSE
         -- If variant ID provided but not found, fallback or error?
         -- For robustness, we might want to error, but let's keep base price for safety or error.
         RAISE EXCEPTION 'Variant % not found for item %', (v_item->>'variant_id'), v_menu_item.name;
      END IF;
    END IF;

    -- Check Addons
    IF v_item->'addon_ids' IS NOT NULL AND jsonb_array_length(v_item->'addon_ids') > 0 THEN
       -- Sum addon prices
       SELECT COALESCE(SUM((elem->>'price')::DECIMAL), 0) INTO v_addon_price
       FROM jsonb_array_elements(v_menu_item.addons) elem
       WHERE elem->>'id' IN (SELECT * FROM jsonb_array_elements_text(v_item->'addon_ids'));
       
       v_item_price := v_item_price + v_addon_price;
    END IF;

    -- Calculate Line Total
    v_line_total := v_item_price * (v_item->>'quantity')::INT;
    v_item_total := v_item_total + v_line_total;

  END LOOP;

  -- 5. Calculate Fees
  -- Matching frontend logic: total + 40 + round(total * 0.05)
  -- Actually, let's verify frontend logic.
  -- "totalPrice + 40 + Math.round(totalPrice * 0.05)"
  v_taxes := ROUND(v_item_total * 0.05, 2); 
  -- Assuming platform fee is included in taxes or separate? 
  -- Frontend says "Math.round(totalPrice * 0.05)" which is likely platform fee or tax.
  -- Let's stick to explicit fields.
  v_platform_fee := 0; -- or maybe that 5% is platform fee? Let's assume it's taxes for now as usually 5% is GST on food.

  -- 6. Apply Coupon
  IF p_coupon_code IS NOT NULL THEN
    SELECT * INTO v_coupon FROM coupons 
    WHERE code = p_coupon_code 
    AND is_active = TRUE 
    AND (valid_until IS NULL OR valid_until > NOW())
    AND (kitchen_id IS NULL OR kitchen_id = p_kitchen_id);
    
    IF FOUND THEN
      IF v_item_total >= COALESCE(v_coupon.min_order_value, 0) THEN
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
  END IF;

  -- 7. Final Calculation
  v_final_amount := v_item_total + v_delivery_fee + v_taxes - v_discount_amount;
  IF v_final_amount < 0 THEN v_final_amount := 0; END IF;

  -- 8. Create Order
  INSERT INTO orders (
    user_id,
    kitchen_id,
    status,
    total_amount,
    item_total,
    delivery_fee,
    taxes,
    discount_amount,
    delivery_address_id,
    delivery_address_snapshot,
    payment_method,
    payment_status
  ) VALUES (
    v_user_id,
    p_kitchen_id,
    'Pending',
    v_final_amount,
    v_item_total,
    v_delivery_fee,
    v_taxes,
    v_discount_amount,
    p_delivery_address_id,
    v_address_snapshot,
    'UPI', -- Defaulting for now as per frontend
    'Pending'
  ) RETURNING id INTO v_order_id;

  -- 9. Create Order Items
  -- Re-iterate to insert. 
  -- Note: We could have stored them in a temp table or array, but re-looping is fine for small orders.
  -- Or better, insert inside the first loop? 
  -- Problem: Order ID is generated after first loop calculation (because we need total for order record).
  -- So we loop again.
  
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    -- Re-fetch or rely on previous check?
    -- We need to calculate specific price again or store it. 
    -- Let's just re-calculate simply or better, trust the previous validation but we need price_at_time.
    
    SELECT * INTO v_menu_item FROM menu_items WHERE id = (v_item->>'menu_item_id')::UUID;
    
    v_item_price := v_menu_item.price;
    
    -- Check Variant
    IF v_item->>'variant_id' IS NOT NULL AND v_item->>'variant_id' != 'default' THEN
      SELECT COALESCE((elem->>'price')::DECIMAL, 0) INTO v_variant_price
      FROM jsonb_array_elements(v_menu_item.variants) elem
      WHERE elem->>'id' = v_item->>'variant_id';
       v_item_price := v_variant_price;
    END IF;

    -- Check Addons
    IF v_item->'addon_ids' IS NOT NULL AND jsonb_array_length(v_item->'addon_ids') > 0 THEN
       SELECT COALESCE(SUM((elem->>'price')::DECIMAL), 0) INTO v_addon_price
       FROM jsonb_array_elements(v_menu_item.addons) elem
       WHERE elem->>'id' IN (SELECT * FROM jsonb_array_elements_text(v_item->'addon_ids'));
       v_item_price := v_item_price + v_addon_price;
    END IF;

    INSERT INTO order_items (
      order_id,
      menu_item_id,
      user_id,
      quantity,
      price_at_time,
      selected_variant,
      selected_addons
    ) VALUES (
      v_order_id,
      (v_item->>'menu_item_id')::UUID,
      v_user_id,
      (v_item->>'quantity')::INT,
      v_item_price,
      CASE WHEN v_item->>'variant_id' IS NOT NULL THEN 
          (SELECT elem FROM jsonb_array_elements(v_menu_item.variants) elem WHERE elem->>'id' = v_item->>'variant_id')
      ELSE NULL END,
      CASE WHEN v_item->'addon_ids' IS NOT NULL THEN 
          (SELECT jsonb_agg(elem) FROM jsonb_array_elements(v_menu_item.addons) elem WHERE elem->>'id' IN (SELECT * FROM jsonb_array_elements_text(v_item->'addon_ids')))
      ELSE NULL END
    );
  END LOOP;

  RETURN jsonb_build_object(
    'order_id', v_order_id,
    'total_amount', v_final_amount,
    'status', 'success'
  );

EXCEPTION WHEN OTHERS THEN
  RAISE; -- Propagate error to client
END;
$$;
