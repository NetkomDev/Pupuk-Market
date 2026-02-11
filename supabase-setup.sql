-- =============================================
-- PUPUK MARKETPLACE - DATABASE SETUP
-- Run this in Supabase SQL Editor for project: ppheftathlniqphituey
-- =============================================

-- Categories
CREATE TABLE IF NOT EXISTS pupuk_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Brands
CREATE TABLE IF NOT EXISTS pupuk_brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Suppliers (admin only)
CREATE TABLE IF NOT EXISTS pupuk_suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Products
CREATE TABLE IF NOT EXISTS pupuk_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  category_id UUID REFERENCES pupuk_categories(id) ON DELETE SET NULL,
  brand_id UUID REFERENCES pupuk_brands(id) ON DELETE SET NULL,
  supplier_id UUID REFERENCES pupuk_suppliers(id) ON DELETE SET NULL,
  image_url TEXT,
  cost_price NUMERIC DEFAULT 0,
  selling_price NUMERIC NOT NULL DEFAULT 0,
  stock INTEGER DEFAULT 0,
  unit TEXT DEFAULT 'kg',
  weight TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Orders
CREATE TABLE IF NOT EXISTS pupuk_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  shipping_province TEXT,
  shipping_kabupaten TEXT,
  shipping_kecamatan TEXT,
  shipping_kelurahan TEXT,
  shipping_address_detail TEXT,
  total_amount NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'baru' CHECK (status IN ('baru', 'diproses', 'dikirim', 'selesai', 'dibatalkan')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Order Items
CREATE TABLE IF NOT EXISTS pupuk_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES pupuk_orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES pupuk_products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  subtotal NUMERIC NOT NULL DEFAULT 0
);

-- =============================================
-- ENABLE RLS
-- =============================================
ALTER TABLE pupuk_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE pupuk_brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE pupuk_suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE pupuk_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE pupuk_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE pupuk_order_items ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS POLICIES
-- =============================================
CREATE POLICY "pupuk_categories_public_read" ON pupuk_categories FOR SELECT USING (true);
CREATE POLICY "pupuk_categories_admin_write" ON pupuk_categories FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "pupuk_brands_public_read" ON pupuk_brands FOR SELECT USING (true);
CREATE POLICY "pupuk_brands_admin_write" ON pupuk_brands FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "pupuk_suppliers_admin_only" ON pupuk_suppliers FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "pupuk_products_public_read" ON pupuk_products FOR SELECT USING (true);
CREATE POLICY "pupuk_products_admin_write" ON pupuk_products FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "pupuk_orders_public_insert" ON pupuk_orders FOR INSERT WITH CHECK (true);
CREATE POLICY "pupuk_orders_admin_manage" ON pupuk_orders FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "pupuk_order_items_public_insert" ON pupuk_order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "pupuk_order_items_admin_manage" ON pupuk_order_items FOR ALL USING (auth.role() = 'authenticated');

-- =============================================
-- TRIGGER: auto update updated_at
-- =============================================
CREATE OR REPLACE FUNCTION update_pupuk_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER pupuk_products_updated_at
  BEFORE UPDATE ON pupuk_products
  FOR EACH ROW
  EXECUTE FUNCTION update_pupuk_products_updated_at();

-- =============================================
-- STORAGE BUCKET
-- =============================================
INSERT INTO storage.buckets (id, name, public) VALUES ('pupuk-images', 'pupuk-images', true) ON CONFLICT DO NOTHING;

-- Storage policies
CREATE POLICY "pupuk_images_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'pupuk-images');
CREATE POLICY "pupuk_images_admin_upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'pupuk-images' AND auth.role() = 'authenticated');
CREATE POLICY "pupuk_images_admin_update" ON storage.objects FOR UPDATE USING (bucket_id = 'pupuk-images' AND auth.role() = 'authenticated');
CREATE POLICY "pupuk_images_admin_delete" ON storage.objects FOR DELETE USING (bucket_id = 'pupuk-images' AND auth.role() = 'authenticated');
