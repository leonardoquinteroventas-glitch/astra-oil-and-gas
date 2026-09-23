/*
# Astra Oil & Gas — Supplier 360 Schema Enhancement

## Purpose
Transform the single suppliers + Documentos setup into a full Supplier 360
architecture with separate tables for contacts, products, certifications, and
timeline/activity. Add Feedstock vs Energy business-area separation. Enhance
the Documentos table with richer metadata.

## Changes
1. ALTER suppliers: add business_area, company_type, constitution_date, share_capital, legal_status
2. New table supplier_contacts (supplier_id FK CASCADE)
3. New table supplier_products (supplier_id FK CASCADE)
4. ALTER Documentos: add description, issue_date, expiry_date, doc_status, uploaded_by, supplier_uuid
5. New table supplier_certifications (supplier_id FK CASCADE)
6. New table supplier_timeline (supplier_id FK CASCADE)
7. RLS enabled on all new tables, anon+authenticated full CRUD (single-tenant no-auth)
*/

-- 1. ALTER suppliers
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS business_area text;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS company_type text;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS constitution_date text;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS share_capital text;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS legal_status text;

UPDATE suppliers SET business_area = 'feedstock' WHERE business_area IS NULL;

-- 2. supplier_contacts
CREATE TABLE IF NOT EXISTS supplier_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  name text,
  role text,
  department text,
  email text,
  phone text,
  whatsapp text,
  is_primary boolean DEFAULT false,
  is_technical boolean DEFAULT false,
  is_commercial boolean DEFAULT false,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE supplier_contacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_supplier_contacts" ON supplier_contacts;
CREATE POLICY "anon_select_supplier_contacts" ON supplier_contacts FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_supplier_contacts" ON supplier_contacts;
CREATE POLICY "anon_insert_supplier_contacts" ON supplier_contacts FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_supplier_contacts" ON supplier_contacts;
CREATE POLICY "anon_update_supplier_contacts" ON supplier_contacts FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_supplier_contacts" ON supplier_contacts;
CREATE POLICY "anon_delete_supplier_contacts" ON supplier_contacts FOR DELETE TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_supplier_contacts_supplier_id ON supplier_contacts(supplier_id);

-- 3. supplier_products
CREATE TABLE IF NOT EXISTS supplier_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  name text,
  category text,
  origin text,
  description text,
  volume text,
  unit text,
  frequency text,
  availability text,
  ffa text,
  moisture text,
  miu text,
  insolubles text,
  phosphorus text,
  sulfur text,
  iodine text,
  tfm text,
  price text,
  currency text,
  incoterm text,
  port text,
  observations text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE supplier_products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_supplier_products" ON supplier_products;
CREATE POLICY "anon_select_supplier_products" ON supplier_products FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_supplier_products" ON supplier_products;
CREATE POLICY "anon_insert_supplier_products" ON supplier_products FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_supplier_products" ON supplier_products;
CREATE POLICY "anon_update_supplier_products" ON supplier_products FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_supplier_products" ON supplier_products;
CREATE POLICY "anon_delete_supplier_products" ON supplier_products FOR DELETE TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_supplier_products_supplier_id ON supplier_products(supplier_id);

-- 4. ALTER Documentos
ALTER TABLE "Documentos" ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE "Documentos" ADD COLUMN IF NOT EXISTS issue_date date;
ALTER TABLE "Documentos" ADD COLUMN IF NOT EXISTS expiry_date date;
ALTER TABLE "Documentos" ADD COLUMN IF NOT EXISTS doc_status text;
ALTER TABLE "Documentos" ADD COLUMN IF NOT EXISTS uploaded_by text;
ALTER TABLE "Documentos" ADD COLUMN IF NOT EXISTS supplier_uuid uuid;

-- Migrate text supplier_id to uuid where possible
DO $$
BEGIN
  UPDATE "Documentos" d
  SET supplier_uuid = s.id
  FROM suppliers s
  WHERE d.supplier_id = s.id::text AND d.supplier_uuid IS NULL;
END $$;

-- 5. supplier_certifications
CREATE TABLE IF NOT EXISTS supplier_certifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  type text,
  number text,
  issuer text,
  issue_date date,
  expiry_date date,
  cert_status text DEFAULT 'pending',
  document_id uuid REFERENCES "Documentos"(id) ON DELETE SET NULL,
  observations text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE supplier_certifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_supplier_certifications" ON supplier_certifications;
CREATE POLICY "anon_select_supplier_certifications" ON supplier_certifications FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_supplier_certifications" ON supplier_certifications;
CREATE POLICY "anon_insert_supplier_certifications" ON supplier_certifications FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_supplier_certifications" ON supplier_certifications;
CREATE POLICY "anon_update_supplier_certifications" ON supplier_certifications FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_supplier_certifications" ON supplier_certifications;
CREATE POLICY "anon_delete_supplier_certifications" ON supplier_certifications FOR DELETE TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_supplier_certifications_supplier_id ON supplier_certifications(supplier_id);

-- 6. supplier_timeline
CREATE TABLE IF NOT EXISTS supplier_timeline (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  event_type text,
  description text,
  event_date date,
  created_by text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE supplier_timeline ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_supplier_timeline" ON supplier_timeline;
CREATE POLICY "anon_select_supplier_timeline" ON supplier_timeline FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_supplier_timeline" ON supplier_timeline;
CREATE POLICY "anon_insert_supplier_timeline" ON supplier_timeline FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_supplier_timeline" ON supplier_timeline;
CREATE POLICY "anon_update_supplier_timeline" ON supplier_timeline FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_supplier_timeline" ON supplier_timeline;
CREATE POLICY "anon_delete_supplier_timeline" ON supplier_timeline FOR DELETE TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_supplier_timeline_supplier_id ON supplier_timeline(supplier_id);