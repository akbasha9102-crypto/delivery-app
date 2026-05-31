-- Make user_id nullable (client orders don't require auth)
ALTER TABLE orders ALTER COLUMN user_id DROP NOT NULL;

-- Add dashboard-required columns to orders
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS client_name TEXT,
  ADD COLUMN IF NOT EXISTS client_phone TEXT,
  ADD COLUMN IF NOT EXISTS client_note TEXT,
  ADD COLUMN IF NOT EXISTS driver_id UUID,
  ADD COLUMN IF NOT EXISTS driver_name TEXT,
  ADD COLUMN IF NOT EXISTS delivery_progress INTEGER DEFAULT 0;

-- Add item_name snapshot to order_items (item may be deleted later)
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS item_name TEXT;

-- Make item_id nullable (cart items may not map to real item UUIDs yet)
ALTER TABLE order_items ALTER COLUMN item_id DROP NOT NULL;

-- Drivers table
CREATE TABLE IF NOT EXISTS drivers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  status TEXT DEFAULT 'available',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key after drivers table exists
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS driver_fk UUID REFERENCES drivers(id) ON DELETE SET NULL;

-- Extras table
CREATE TABLE IF NOT EXISTS extras (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID REFERENCES items(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: allow anon + authenticated full access (internal dashboard tool)
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE extras ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "open_drivers" ON drivers;
DROP POLICY IF EXISTS "open_extras" ON extras;
DROP POLICY IF EXISTS "open_orders" ON orders;
DROP POLICY IF EXISTS "open_order_items" ON order_items;
DROP POLICY IF EXISTS "open_categories" ON categories;
DROP POLICY IF EXISTS "open_items" ON items;

CREATE POLICY "open_drivers"     ON drivers     FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "open_extras"      ON extras      FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "open_orders"      ON orders      FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "open_order_items" ON order_items FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "open_categories"  ON categories  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "open_items"       ON items       FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
