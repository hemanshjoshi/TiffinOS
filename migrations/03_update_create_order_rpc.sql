-- Update create_order RPC to use 'kitchens' table instead of 'profiles'

CREATE OR REPLACE FUNCTION create_order(
  p_kitchen_id UUID,
  p_items JSONB, -- Array of objects: { "menu_item_id": uuid, "quantity": int, "variant_id": text/uuid (optional), "addon_ids": text[] (optional) }
  p_delivery_address_id UUID,
  p_coupon_code TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_order_id UUID;
  v_total_amount DECIMAL(10, 2) := 0;
  v_item_total DECIMAL(10, 2) := 0;
  v_discount_amount DECIMAL(10, 2) := 0;
  v_delivery_fee DECIMAL(10, 2) := 40.00;
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

  -- 2. Verify Kitchen is Active (using KITCHENS table now)
  IF NOT EXISTS (SELECT 1 FROM kitchens WHERE id = p_kitchen_id AND is_active = TRUE) THEN
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
    v_item_price := v_menu_item.price;
    
    -- Check Variant
    IF v_item->>'variant_id' IS NOT NULL AND v_item->>'variant_id' != 'default' THEN
      SELECT COALESCE((elem->>'price')::DECIMAL, 0) INTO v_variant_price
      FROM jsonb_array_elements(v_menu_item.variants) elem
      WHERE elem->>'id' = v_item->>'variant_id';
      
      IF v_variant_price IS NOT NULL THEN
        v_item_price := v_variant_price;
      ELSE
         RAISE EXCEPTION 'Variant % not found for item %', (v_item->>'variant_id'), v_menu_item.name;
      END IF;
    END IF;

    -- Check Addons
    IF v_item->'addon_ids' IS NOT NULL AND jsonb_array_length(v_item->'addon_ids') > 0 THEN
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
  v_taxes := ROUND(v_item_total * 0.05, 2); 
  v_platform_fee := 0; 

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
    'UPI',
    'Pending'
  ) RETURNING id INTO v_order_id;

  -- 9. Create Order Items
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    SELECT * INTO v_menu_item FROM menu_items WHERE id = (v_item->>'menu_item_id')::UUID;
    v_item_price := v_menu_item.price;
    
    IF v_item->>'variant_id' IS NOT NULL AND v_item->>'variant_id' != 'default' THEN
      SELECT COALESCE((elem->>'price')::DECIMAL, 0) INTO v_variant_price
      FROM jsonb_array_elements(v_menu_item.variants) elem
      WHERE elem->>'id' = v_item->>'variant_id';
       v_item_price := v_variant_price;
    END IF;

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
  RAISE;
END;
$$;
