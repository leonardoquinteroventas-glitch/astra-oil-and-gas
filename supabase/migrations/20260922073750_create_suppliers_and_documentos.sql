/*
# Create suppliers and Documentos tables for Astra Procurement Intelligence OS

1. Purpose
   This is a single-tenant app with no sign-in screen. All data is intentionally
   shared/public, so policies allow both anon and authenticated roles full CRUD access.

2. New Tables
   - `suppliers`: stores all procurement supplier records.
     Columns include company, country, location, CNPJ, CNAE, admin, manager, contact
     info (phone, whatsapp, email, website), product details (product, origin, FFA,
     moisture, MIU, insolubles, iodine, TFM, capacity, consistency), commercial terms
     (price, currency, incoterm, payment), compliance (ISCC, export history, logistics,
     environmental), evidence/internal notes, status, and a JSONB metadata column for
     flexible extra fields like the diligence (dd) object.
   - `Documentos`: stores metadata for uploaded files (COA, SGS, ISCC, photos, etc.).
     Columns: id, name, category, supplier_id (links to supplier), storage_path
     (Supabase Storage path), and created_at.

3. Security
   - RLS enabled on both tables.
   - Policies allow anon + authenticated full CRUD (single-tenant, no-auth app).

4. Notes
   - All text columns are nullable since many suppliers have pending data.
   - `metadata` is JSONB to accommodate the dd (diligence) object and other extras.
*/

CREATE TABLE IF NOT EXISTS suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text,
  company text,
  country text,
  location text,
  cnpj text,
  cnae text,
  admin text,
  manager text,
  phone text,
  whatsapp text,
  email text,
  website text,
  product text,
  origin text,
  ffa text,
  moisture text,
  miu text,
  insolubles text,
  iodine text,
  tfm text,
  capacity text,
  consistency text,
  price text,
  currency text,
  incoterm text,
  payment text,
  iscc text,
  export_history text,
  logistics text,
  environmental text,
  evidence text,
  internal text,
  status text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_suppliers" ON suppliers;
CREATE POLICY "anon_select_suppliers" ON suppliers FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_suppliers" ON suppliers;
CREATE POLICY "anon_insert_suppliers" ON suppliers FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_suppliers" ON suppliers;
CREATE POLICY "anon_update_suppliers" ON suppliers FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_suppliers" ON suppliers;
CREATE POLICY "anon_delete_suppliers" ON suppliers FOR DELETE
  TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS "Documentos" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  category text,
  supplier_id text,
  storage_path text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE "Documentos" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_documentos" ON "Documentos";
CREATE POLICY "anon_select_documentos" ON "Documentos" FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_documentos" ON "Documentos";
CREATE POLICY "anon_insert_documentos" ON "Documentos" FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_documentos" ON "Documentos";
CREATE POLICY "anon_update_documentos" ON "Documentos" FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_documentos" ON "Documentos";
CREATE POLICY "anon_delete_documentos" ON "Documentos" FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_suppliers_code ON suppliers(code);
CREATE INDEX IF NOT EXISTS idx_suppliers_status ON suppliers(status);
CREATE INDEX IF NOT EXISTS idx_documentos_supplier_id ON "Documentos"(supplier_id);
