-- Ensure 'orders' table has payment columns needed for the app
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='payment_method') THEN
        ALTER TABLE orders ADD COLUMN payment_method TEXT DEFAULT 'CASH_ON_DELIVERY';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='payment_status') THEN
        ALTER TABLE orders ADD COLUMN payment_status TEXT DEFAULT 'Pending';
    END IF;

    -- Ensure delivery_address_snapshot exists (from db_schema.sql design)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='delivery_address_snapshot') THEN
        ALTER TABLE orders ADD COLUMN delivery_address_snapshot JSONB;
    END IF;

    -- Ensure delivery_lat/lng exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='delivery_lat') THEN
        ALTER TABLE orders ADD COLUMN delivery_lat DECIMAL(10, 8);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='delivery_lng') THEN
        ALTER TABLE orders ADD COLUMN delivery_lng DECIMAL(11, 8);
    END IF;
END $$;
