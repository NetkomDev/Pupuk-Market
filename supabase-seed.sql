-- =============================================
-- SEED DATA - Run AFTER supabase-setup.sql
-- =============================================

-- Seed Categories
INSERT INTO pupuk_categories (name, slug, icon) VALUES
  ('Pupuk Organik', 'pupuk-organik', '🌱'),
  ('Pupuk Anorganik', 'pupuk-anorganik', '🧪'),
  ('Pupuk NPK', 'pupuk-npk', '🌾'),
  ('Pupuk Cair', 'pupuk-cair', '💧'),
  ('Pupuk Hayati', 'pupuk-hayati', '🦠')
ON CONFLICT (slug) DO NOTHING;

-- Seed Brands
INSERT INTO pupuk_brands (name) VALUES
  ('Phonska'),
  ('Petroganik'),
  ('SP-36'),
  ('Urea'),
  ('ZA Pusri'),
  ('NPK Mutiara'),
  ('Pupuk Indonesia');

-- Seed Suppliers
INSERT INTO pupuk_suppliers (name, phone, address, notes) VALUES
  ('PT Pupuk Kalimantan Timur', '081234567890', 'Bontang, Kalimantan Timur', 'Suplier utama pupuk NPK'),
  ('PT Petrokimia Gresik', '082345678901', 'Gresik, Jawa Timur', 'Suplier Phonska dan Petroganik'),
  ('CV Tani Makmur', '083456789012', 'Makassar, Sulawesi Selatan', 'Suplier lokal pupuk organik');

-- Seed Products with images
DO $$
DECLARE
  cat_organik UUID;
  cat_anorganik UUID;
  cat_npk UUID;
  cat_cair UUID;
  brand_phonska UUID;
  brand_petroganik UUID;
  brand_urea UUID;
  brand_npk UUID;
  sup1 UUID;
  sup2 UUID;
  sup3 UUID;
BEGIN
  SELECT id INTO cat_organik FROM pupuk_categories WHERE slug = 'pupuk-organik';
  SELECT id INTO cat_anorganik FROM pupuk_categories WHERE slug = 'pupuk-anorganik';
  SELECT id INTO cat_npk FROM pupuk_categories WHERE slug = 'pupuk-npk';
  SELECT id INTO cat_cair FROM pupuk_categories WHERE slug = 'pupuk-cair';
  SELECT id INTO brand_phonska FROM pupuk_brands WHERE name = 'Phonska' LIMIT 1;
  SELECT id INTO brand_petroganik FROM pupuk_brands WHERE name = 'Petroganik' LIMIT 1;
  SELECT id INTO brand_urea FROM pupuk_brands WHERE name = 'Urea' LIMIT 1;
  SELECT id INTO brand_npk FROM pupuk_brands WHERE name = 'NPK Mutiara' LIMIT 1;
  SELECT id INTO sup1 FROM pupuk_suppliers WHERE name LIKE '%Kalimantan%' LIMIT 1;
  SELECT id INTO sup2 FROM pupuk_suppliers WHERE name LIKE '%Petrokimia%' LIMIT 1;
  SELECT id INTO sup3 FROM pupuk_suppliers WHERE name LIKE '%Tani%' LIMIT 1;

  INSERT INTO pupuk_products (name, slug, description, image_url, category_id, brand_id, supplier_id, cost_price, selling_price, stock, unit, is_active) VALUES
    ('Phonska NPK 15-15-15', 'phonska-npk-15-15-15', 'Pupuk NPK majemuk dengan kandungan Nitrogen 15%, Fosfor 15%, Kalium 15%. Cocok untuk berbagai jenis tanaman pangan dan hortikultura.', '/images/products/phonska-npk.png', cat_npk, brand_phonska, sup2, 280000, 350000, 100, 'karung', true),
    ('Petroganik Granul', 'petroganik-granul', 'Pupuk organik granul dari Petrokimia Gresik. Memperbaiki struktur tanah, meningkatkan daya serap air, dan menambah unsur hara organik.', '/images/products/petroganik-granul.png', cat_organik, brand_petroganik, sup2, 50000, 75000, 200, 'karung', true),
    ('Urea Subsidi 50kg', 'urea-subsidi-50kg', 'Pupuk Urea bersubsidi dengan kandungan Nitrogen 46%. Pupuk dasar yang paling banyak digunakan untuk tanaman padi dan palawija.', '/images/products/urea-subsidi.png', cat_anorganik, brand_urea, sup1, 90000, 112500, 150, 'karung', true),
    ('NPK Mutiara 16-16-16', 'npk-mutiara-16-16-16', 'Pupuk NPK premium dengan formula seimbang. Mengandung unsur hara makro yang lengkap untuk tanaman buah, sayuran, dan tanaman hias.', '/images/products/npk-mutiara.png', cat_npk, brand_npk, sup1, 320000, 400000, 80, 'karung', true),
    ('Pupuk Organik Cair Bio', 'pupuk-organik-cair-bio', 'Pupuk organik cair bio-fermentasi kaya mikroorganisme. Meningkatkan kesuburan tanah secara alami dan ramah lingkungan.', '/images/products/pupuk-cair-bio.png', cat_cair, NULL, sup3, 25000, 45000, 300, 'liter', true),
    ('Pupuk Kompos Premium', 'pupuk-kompos-premium', 'Pupuk kompos organik premium dari bahan alami pilihan. Cocok untuk lahan pertanian organik dan kebun rumah.', '/images/products/pupuk-kompos.png', cat_organik, NULL, sup3, 15000, 35000, 500, 'kg', true),
    ('SP-36 Fosfat Alam', 'sp36-fosfat-alam', 'Pupuk fosfat alam dengan kandungan P2O5 36%. Penting untuk pembentukan bunga dan buah pada tanaman palawija dan hortikultura.', '/images/products/sp36-fosfat.png', cat_anorganik, NULL, sup2, 180000, 240000, 120, 'karung', true),
    ('ZA Pusri Nitrogen', 'za-pusri-nitrogen', 'Pupuk ZA dengan Nitrogen 21% dan Sulfur 24%. Cocok untuk tanaman yang membutuhkan unsur belerang seperti bawang dan cabai.', '/images/products/za-pusri.png', cat_anorganik, NULL, sup1, 135000, 175000, 90, 'karung', true)
  ON CONFLICT (slug) DO NOTHING;
END $$;
