/*
# Create astra-docs storage bucket

1. Purpose
   Creates a public storage bucket named "astra-docs" for storing supplier
   documents (COA, SGS, ISCC, photos, licenses, BLs, contracts, etc.).

2. Storage
   - Bucket "astra-docs" (public, 50MB file size limit).
   - Policies allow anon + authenticated to upload, read, and delete objects
     (single-tenant, no-auth app).

3. Notes
   - This is a single-tenant app with no sign-in, so storage access is open.
*/

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('astra-docs', 'astra-docs', true, 52428800)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "anon_upload_astra_docs" ON storage.objects;
CREATE POLICY "anon_upload_astra_docs" ON storage.objects
  FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'astra-docs');

DROP POLICY IF EXISTS "anon_read_astra_docs" ON storage.objects;
CREATE POLICY "anon_read_astra_docs" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'astra-docs');

DROP POLICY IF EXISTS "anon_delete_astra_docs" ON storage.objects;
CREATE POLICY "anon_delete_astra_docs" ON storage.objects
  FOR DELETE TO anon, authenticated
  USING (bucket_id = 'astra-docs');
