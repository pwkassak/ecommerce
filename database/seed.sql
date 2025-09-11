-- Seed data for CubeCraft Ecommerce Database
-- Insert sample categories, products, and test data

-- Insert categories
INSERT INTO categories (name, display_name, description, image_url) VALUES
('speed-cubes', 'Speed Cubes', 'Professional racing cubes for competitive speedcubing', '/images/category-speed.jpg'),
('puzzle-cubes', 'Puzzle Cubes', 'Classic and specialty puzzle cubes for all skill levels', '/images/category-puzzle.jpg'),
('megaminx', 'Megaminx', '12-sided dodecahedron puzzle cubes', '/images/category-megaminx.jpg'),
('pyraminx', 'Pyraminx', 'Triangular tetrahedral puzzle cubes', '/images/category-pyraminx.jpg'),
('skewb', 'Skewb', 'Corner-turning cubic puzzle variations', '/images/category-skewb.jpg'),
('other', 'Other Puzzles', 'Unique and specialty puzzle designs', '/images/category-other.jpg');

-- Insert sample products
INSERT INTO products (name, description, price, category, image_url, images, specifications, in_stock, stock_count, featured) VALUES
(
    'GAN 356 M 3x3 Speed Cube',
    'The GAN 356 M is a professional magnetic speed cube designed for competitive speedcubing. Features exceptional corner cutting, smooth turning, and premium magnetic positioning system for enhanced stability and control.',
    39.99,
    'speed-cubes',
    '/images/gan-356m.jpg',
    '["/images/gan-356m.jpg", "/images/gan-356m-2.jpg", "/images/gan-356m-3.jpg"]',
    '{"Size": "56mm x 56mm x 56mm", "Weight": "75g", "Magnetic": "Yes (48 magnets)", "Brand": "GAN", "Material": "ABS Plastic", "Corner Cutting": "50° / 30°", "Speed": "Fast", "Difficulty": "Advanced"}',
    true,
    25,
    true
),
(
    'MoYu Weilong WR M 3x3',
    'World record setting cube with premium magnetic positioning and exceptional performance. Used by professional speedcubers worldwide.',
    34.99,
    'speed-cubes',
    '/images/moyu-weilong.jpg',
    '["/images/moyu-weilong.jpg", "/images/moyu-weilong-2.jpg"]',
    '{"Size": "55.5mm x 55.5mm x 55.5mm", "Weight": "78g", "Magnetic": "Yes (48 magnets)", "Brand": "MoYu", "Material": "ABS Plastic", "Corner Cutting": "45° / 30°", "Speed": "Very Fast", "Difficulty": "Advanced"}',
    true,
    18,
    true
),
(
    'Megaminx Dodecahedron Puzzle',
    'A 12-sided puzzle cube that provides a unique challenge for advanced solvers. Features smooth turning and vibrant colors.',
    24.99,
    'megaminx',
    '/images/megaminx.jpg',
    '["/images/megaminx.jpg", "/images/megaminx-2.jpg"]',
    '{"Faces": "12", "Colors": "12", "Difficulty": "Advanced", "Brand": "QiYi", "Material": "ABS Plastic", "Size": "70mm diameter", "Weight": "120g", "Magnetic": "No"}',
    true,
    12,
    true
),
(
    'QiYi Valk 3 Elite M',
    'Premium flagship cube with customizable magnets and exceptional performance.',
    42.99,
    'speed-cubes',
    '/images/qiyi-valk3.jpg',
    '["/images/qiyi-valk3.jpg"]',
    '{"Size": "55.5mm x 55.5mm x 55.5mm", "Magnetic": "Yes (48 magnets)", "Brand": "QiYi", "Material": "ABS Plastic", "Corner Cutting": "50° / 35°", "Speed": "Fast", "Difficulty": "Advanced"}',
    true,
    15,
    false
),
(
    'Rubiks Brand 3x3 Cube',
    'The original Rubiks cube for beginners and collectors.',
    12.99,
    'puzzle-cubes',
    '/images/rubiks-original.jpg',
    '["/images/rubiks-original.jpg"]',
    '{"Size": "57mm x 57mm x 57mm", "Magnetic": "No", "Brand": "Rubiks", "Material": "ABS Plastic", "Difficulty": "Beginner", "Speed": "Medium", "Type": "Original"}',
    true,
    50,
    false
),
(
    'Pyraminx Triangle Puzzle',
    'Triangular puzzle with unique solving mechanics and colorful design.',
    18.99,
    'pyraminx',
    '/images/pyraminx.jpg',
    '["/images/pyraminx.jpg"]',
    '{"Shape": "Triangle", "Difficulty": "Medium", "Brand": "QiYi", "Material": "ABS Plastic", "Size": "98mm x 98mm x 98mm", "Colors": "4", "Type": "Tetrahedron"}',
    false,
    0,
    false
),
(
    'Skewb Diamond Cube',
    'Corner-turning puzzle with diamond shape and smooth mechanism.',
    16.99,
    'skewb',
    '/images/skewb.jpg',
    '["/images/skewb.jpg"]',
    '{"Shape": "Diamond", "Difficulty": "Medium", "Brand": "MoYu", "Material": "ABS Plastic", "Size": "60mm x 60mm x 60mm", "Colors": "6", "Type": "Corner-turning"}',
    true,
    8,
    false
),
(
    'XMan Design Tornado V3 M',
    'Latest flagship speed cube with advanced magnetic system.',
    45.99,
    'speed-cubes',
    '/images/tornado-v3.jpg',
    '["/images/tornado-v3.jpg"]',
    '{"Size": "55.5mm x 55.5mm x 55.5mm", "Magnetic": "Yes (48 magnets)", "Brand": "XMan Design", "Material": "ABS Plastic", "Corner Cutting": "50° / 30°", "Speed": "Very Fast", "Difficulty": "Expert"}',
    true,
    22,
    false
),
(
    'YuXin Little Magic 3x3',
    'Budget-friendly speed cube perfect for beginners.',
    8.99,
    'speed-cubes',
    '/images/yuxin-little-magic.jpg',
    '["/images/yuxin-little-magic.jpg"]',
    '{"Size": "55mm x 55mm x 55mm", "Magnetic": "No", "Brand": "YuXin", "Material": "ABS Plastic", "Corner Cutting": "40° / 25°", "Speed": "Medium", "Difficulty": "Beginner"}',
    true,
    35,
    false
),
(
    'QiYi 2x2 Speed Cube',
    'Compact 2x2 speed cube for pocket solving.',
    9.99,
    'speed-cubes',
    '/images/qiyi-2x2.jpg',
    '["/images/qiyi-2x2.jpg"]',
    '{"Size": "50mm x 50mm x 50mm", "Magnetic": "No", "Brand": "QiYi", "Material": "ABS Plastic", "Pieces": "8", "Difficulty": "Intermediate"}',
    true,
    20,
    false
),
(
    'MoYu 4x4 Aosu WR M',
    'Professional 4x4 speed cube with magnetic positioning.',
    29.99,
    'speed-cubes',
    '/images/moyu-4x4.jpg',
    '["/images/moyu-4x4.jpg"]',
    '{"Size": "62mm x 62mm x 62mm", "Magnetic": "Yes", "Brand": "MoYu", "Material": "ABS Plastic", "Pieces": "56", "Difficulty": "Advanced"}',
    true,
    12,
    false
),
(
    'Kilominx Mini Megaminx',
    'Smaller version of the classic megaminx puzzle.',
    19.99,
    'megaminx',
    '/images/kilominx.jpg',
    '["/images/kilominx.jpg"]',
    '{"Faces": "12", "Colors": "6", "Difficulty": "Intermediate", "Brand": "QiYi", "Material": "ABS Plastic", "Size": "55mm diameter", "Weight": "80g"}',
    true,
    15,
    false
);

-- Insert a test customer
INSERT INTO customers (email, first_name, last_name, phone) VALUES
('test@example.com', 'Test', 'Customer', '+1-555-0123');

-- Insert a test address for the customer
INSERT INTO customer_addresses (customer_id, street, city, state, zip_code, country, is_default)
SELECT id, '123 Test Street', 'Test City', 'Test State', '12345', 'United States', true
FROM customers WHERE email = 'test@example.com';

-- Insert a sample order
INSERT INTO orders (customer_id, customer_email, customer_first_name, customer_last_name, shipping_address, subtotal, tax_amount, total, status)
SELECT 
    c.id,
    'test@example.com',
    'Test',
    'Customer',
    '{"street": "123 Test Street", "city": "Test City", "state": "Test State", "zipCode": "12345", "country": "United States"}',
    74.98,
    6.00,
    80.98,
    'processing'
FROM customers c WHERE email = 'test@example.com';

-- Insert order items for the sample order
INSERT INTO order_items (order_id, product_id, product_name, product_price, quantity, item_total)
SELECT 
    o.id,
    p.id,
    p.name,
    p.price,
    1,
    p.price
FROM orders o
CROSS JOIN products p
WHERE o.customer_email = 'test@example.com' 
  AND p.name IN ('GAN 356 M 3x3 Speed Cube', 'MoYu Weilong WR M 3x3')
LIMIT 2;