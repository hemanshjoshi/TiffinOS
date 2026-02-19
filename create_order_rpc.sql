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
  v_summary JSONB;
  
  -- Address
  v_address_snapshot JSONB;
  
  -- Loop variables for order items
  v_item JSONB;
  v_menu_item RECORD;
  v_item_price DECIMAL(10, 2);
  v_variant_price DECIMAL(10, 2);
  v_addon_price DECIMAL(10, 2);
  
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

  -- 4. Calculate Unified Pricing via get_cart_summary
  v_summary := get_cart_summary(p_items, p_coupon_code, p_kitchen_id);

  -- 5. Create Order
  INSERT INTO orders (
    user_id,
    kitchen_id,
    status,
    total_amount,
    item_total,
    delivery_fee,
    taxes,
    discount_amount,
    platform_fee,
    delivery_address_id,
    delivery_address_snapshot,
    payment_method,
    payment_status
  ) VALUES (
    v_user_id,
    p_kitchen_id,
    'Pending',
    (v_summary->>'grand_total')::DECIMAL,
    (v_summary->>'item_total')::DECIMAL,
    (v_summary->>'delivery_fee')::DECIMAL,
    (v_summary->>'gst_amount')::DECIMAL,
    (v_summary->>'discount_amount')::DECIMAL,
    (v_summary->>'platform_fee')::DECIMAL,
    p_delivery_address_id,
    v_address_snapshot,
    'UPI', -- Defaulting for now as per frontend
    'Pending'
  ) RETURNING id INTO v_order_id;

  -- 6. Create Order Items
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
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
      quantity,
      price_at_time,
      selected_variant,
      selected_addons
    ) VALUES (
      v_order_id,
      (v_item->>'menu_item_id')::UUID,
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
    'total_amount', (v_summary->>'grand_total')::DECIMAL,
    'status', 'success'
  );

EXCEPTION WHEN OTHERS THEN
  RAISE; -- Propagate error to client
END;
$$;
