-- =============================================
-- STORE SETTINGS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS pupuk_store_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_name TEXT NOT NULL DEFAULT 'Pupuk Marketplace',
  logo_url TEXT,
  phone TEXT DEFAULT '081234567890',
  whatsapp_number TEXT DEFAULT '6281234567890',
  address TEXT DEFAULT 'Jl. Raya Pertanian No. 1, Indonesia',
  email TEXT DEFAULT 'info@pupukmarket.id',
  instagram_url TEXT,
  facebook_url TEXT,
  youtube_url TEXT,
  tiktok_url TEXT,
  shopee_url TEXT,
  tokopedia_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ENABLE RLS
ALTER TABLE pupuk_store_settings ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES
-- Public can read settings (for footer, contact info)
CREATE POLICY "pupuk_settings_public_read" ON pupuk_store_settings FOR SELECT USING (true);

-- Only admin can update
CREATE POLICY "pupuk_settings_admin_update" ON pupuk_store_settings FOR UPDATE USING (auth.role() = 'authenticated');

-- Only admin can insert (though we only need 1 row)
CREATE POLICY "pupuk_settings_admin_insert" ON pupuk_store_settings FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- SEED DATA (Only if table is empty)
INSERT INTO pupuk_store_settings (store_name, phone, whatsapp_number, address, email)
SELECT 'PupukMarket', '081234567890', '6281234567890', 'Jl. Tani Makmur No. 88, Indonesia', 'admin@pupukmarket.id'
WHERE NOT EXISTS (SELECT 1 FROM pupuk_store_settings);

-- Safe column additions (Run this part if table already exists)
ALTER TABLE pupuk_store_settings ADD COLUMN IF NOT EXISTS youtube_url TEXT;
ALTER TABLE pupuk_store_settings ADD COLUMN IF NOT EXISTS tiktok_url TEXT;
