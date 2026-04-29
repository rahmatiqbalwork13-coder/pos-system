-- ============================================================
-- Tambah Fitur: Kategori Dinamis & Metode Pembayaran
-- Jalankan di Supabase SQL Editor
-- ============================================================

-- 1. Hapus constraint kategori statis pada tabel products
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_category_check;

-- 2. Tabel kategori dinamis
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO categories (name, slug, sort_order) VALUES
  ('Kebab', 'kebab', 1),
  ('Roti Maryam', 'roti_maryam', 2),
  ('Donat', 'donat', 3)
ON CONFLICT (slug) DO NOTHING;

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_all_categories" ON categories FOR ALL TO authenticated
  USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- 3. Tambah metode pembayaran ke settings
INSERT INTO settings (key, value) VALUES
  ('payment_methods', '["Cash","Transfer BCA","Transfer BRI","Transfer BNI","Transfer Mandiri","GoPay","OVO","DANA","ShopeePay"]')
ON CONFLICT (key) DO NOTHING;
