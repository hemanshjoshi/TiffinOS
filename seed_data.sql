-- Seed Data for Maakhana App (V2)

-- 1. Insert Users (Kitchen Partners & Delivery Partners)
INSERT INTO users (id, full_name, mobile_number, email, user_type) VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Anita Sharma', '+919876543210', 'anita@example.com', 'KITCHEN_PARTNER'),
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'Sunita Gupta', '+919876543211', 'sunita@example.com', 'KITCHEN_PARTNER'),
('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'Meera Patel', '+919876543212', 'meera@example.com', 'KITCHEN_PARTNER'),
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a99', 'Rahul Driver', '+919876543299', 'rahul@example.com', 'DELIVERY_PARTNER');

-- 2. Insert Delivery Profile
INSERT INTO delivery_profiles (user_id, vehicle_type, vehicle_number, driving_license_number, is_online, current_lat, current_lng) VALUES
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a99', 'BIKE', 'MH-02-AB-1234', 'DL-1234567890', TRUE, 19.0760, 72.8777);

-- 3. Insert Kitchens
INSERT INTO kitchens (id, owner_id, kitchen_name, maa_name, short_bio, profile_image_url, cover_image_url, rating, rating_count, is_verified, is_active, location_lat, location_lng, address, tags, fssai_license, maakhana_trust_score) VALUES
('11eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Anita''s Kitchen', 'Anita Ma', 'Authentic North Indian food made with love.', 'https://images.unsplash.com/photo-1556910103-1c02745a30bf?w=800&q=80', 'https://images.unsplash.com/photo-1556910103-1c02745a30bf?w=800&q=80', 4.8, 150, TRUE, TRUE, 19.0760, 72.8777, 'B-404, Gokuldham Society, Goregaon East, Mumbai', ARRAY['North Indian', 'Veg', 'Thali'], 'FSSAI123456789', 98),
('22eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'Sunita''s Delights', 'Sunita Ma', 'Delicious homemade snacks and meals.', 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80', 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80', 4.5, 80, TRUE, TRUE, 19.1136, 72.8697, 'A-101, Sunshine Apartments, Andheri West, Mumbai', ARRAY['Snacks', 'South Indian', 'Breakfast'], 'FSSAI987654321', 95),
('33eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'Meera''s Rasoi', 'Meera Ma', 'Pure vegetarian Gujarati thali.', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80', 4.9, 200, TRUE, TRUE, 19.0178, 72.8478, 'C-202, Green Valley, Dadar, Mumbai', ARRAY['Gujarati', 'Veg', 'Thali'], 'FSSAI456123789', 99);

-- 4. Insert MASTER MENU ITEMS (The Index)
INSERT INTO master_menu_items (id, name, category, tags) VALUES
('10000000-0000-0000-0000-000000000001', 'Paneer Butter Masala', 'Main Course', ARRAY['Veg', 'Paneer', 'North Indian']),
('10000000-0000-0000-0000-000000000002', 'Dal Makhani', 'Main Course', ARRAY['Veg', 'Dal', 'North Indian']),
('10000000-0000-0000-0000-000000000003', 'Butter Naan', 'Breads', ARRAY['Veg', 'Bread']),
('10000000-0000-0000-0000-000000000004', 'Masala Dosa', 'Breakfast', ARRAY['Veg', 'South Indian']),
('10000000-0000-0000-0000-000000000005', 'Idli Sambar', 'Breakfast', ARRAY['Veg', 'South Indian', 'Healthy']),
('10000000-0000-0000-0000-000000000006', 'Gujarati Thali', 'Thali', ARRAY['Veg', 'Thali', 'Gujarati']),
('10000000-0000-0000-0000-000000000007', 'Dhokla', 'Snacks', ARRAY['Veg', 'Snacks', 'Gujarati']);

-- 5. Insert Kitchen Menu Items (Linked to Master)
-- Kitchen 1 (Anita)
INSERT INTO menu_items (kitchen_id, master_item_id, name, description, price, image_url, tags, variants, addons) VALUES
('11eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '10000000-0000-0000-0000-000000000001', 'Paneer Butter Masala', 'Rich and creamy paneer curry cooked with butter and spices.', 250.00, 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=800&q=80', ARRAY['Veg', 'Paneer', 'Spicy'], '[{"name": "Full", "price": 250}, {"name": "Half", "price": 150}]', '[{"name": "Extra Butter", "price": 20}, {"name": "Extra Paneer", "price": 50}]'),
('11eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '10000000-0000-0000-0000-000000000002', 'Dal Makhani', 'Classic black lentil curry slow-cooked with kidney beans.', 200.00, 'https://images.unsplash.com/photo-1585937421612-70a008356f36?w=800&q=80', ARRAY['Veg', 'Dal'], '[{"name": "Full", "price": 200}, {"name": "Half", "price": 120}]', '[{"name": "Extra Cream", "price": 15}]'),
('11eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '10000000-0000-0000-0000-000000000003', 'Butter Naan', 'Soft and fluffy Indian bread topped with butter.', 40.00, 'https://images.unsplash.com/photo-1626074353765-517a681e40be?w=800&q=80', ARRAY['Veg', 'Bread'], NULL, '[{"name": "Garlic", "price": 10}]');

-- Kitchen 2 (Sunita)
INSERT INTO menu_items (kitchen_id, master_item_id, name, description, price, image_url, tags, variants, addons) VALUES
('22eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', '10000000-0000-0000-0000-000000000004', 'Masala Dosa', 'Crispy rice crepe filled with spiced potato mix.', 120.00, 'https://images.unsplash.com/photo-1589301760557-01db1b4dbd06?w=800&q=80', ARRAY['Veg', 'South Indian'], NULL, '[{"name": "Cheese", "price": 30}, {"name": "Extra Chutney", "price": 10}]'),
('22eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', '10000000-0000-0000-0000-000000000005', 'Idli Sambar', 'Steamed rice cakes served with lentil soup and coconut chutney.', 80.00, 'https://images.unsplash.com/photo-1589301760557-01db1b4dbd06?w=800&q=80', ARRAY['Veg', 'South Indian', 'Healthy'], NULL, '[{"name": "Extra Sambar", "price": 20}]');

-- Kitchen 3 (Meera)
INSERT INTO menu_items (kitchen_id, master_item_id, name, description, price, image_url, tags, variants, addons) VALUES
('33eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', '10000000-0000-0000-0000-000000000006', 'Gujarati Thali', 'Complete meal with roti, dal, rice, shaak, and sweet.', 300.00, 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80', ARRAY['Veg', 'Thali'], NULL, '[{"name": "Extra Roti", "price": 15}, {"name": "Extra Sweet", "price": 40}]'),
('33eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', '10000000-0000-0000-0000-000000000007', 'Dhokla', 'Steamed savory cake made from fermented batter.', 100.00, 'https://images.unsplash.com/photo-1589301760557-01db1b4dbd06?w=800&q=80', ARRAY['Veg', 'Snacks', 'Healthy'], NULL, '[{"name": "Fried Chillies", "price": 10}]');

-- 6. Insert Coupons
INSERT INTO coupons (code, description, discount_type, discount_value, min_order_value, max_discount, valid_until, kitchen_id) VALUES
('WELCOME50', 'Get 50% off on your first order', 'PERCENTAGE', 50.00, 100.00, 100.00, NOW() + INTERVAL '30 days', NULL),
('MAAKHANA20', 'Flat ₹20 off on orders above ₹150', 'FLAT', 20.00, 150.00, NULL, NOW() + INTERVAL '30 days', NULL),
('ANITA30', '30% off on Anita''s Kitchen', 'PERCENTAGE', 30.00, 200.00, 75.00, NOW() + INTERVAL '30 days', '11eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');
