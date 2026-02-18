-- Migration 05: Performance Indexes & Favorites

BEGIN;

-- 1. Favorites Table (if not exists)
CREATE TABLE IF NOT EXISTS public.favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  kitchen_id UUID REFERENCES public.kitchens(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, kitchen_id)
);

ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own favorites" ON public.favorites;
CREATE POLICY "Users can manage their own favorites" ON public.favorites FOR ALL USING (auth.uid() = user_id);

-- 2. Performance Indexes
-- Kitchens
CREATE INDEX IF NOT EXISTS idx_kitchens_is_active ON public.kitchens(is_active);
CREATE INDEX IF NOT EXISTS idx_kitchens_rating ON public.kitchens(rating DESC);
CREATE INDEX IF NOT EXISTS idx_kitchens_location ON public.kitchens(location_lat, location_lng);

-- Menu Items
CREATE INDEX IF NOT EXISTS idx_menu_items_kitchen_id ON public.menu_items(kitchen_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_is_available ON public.menu_items(is_available);

-- Orders
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);

-- Order Items
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);

-- Favorites
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON public.favorites(user_id);

COMMIT;
