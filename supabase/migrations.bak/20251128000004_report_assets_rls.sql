-- Migration: Add RLS policies for report-assets storage bucket
-- Purpose: Secure storage bucket access with row-level security
-- Note: storage.objects table RLS is managed by Supabase, we only add policies

-- Policy 1: Authenticated users can read (SELECT/download) files from report-assets
DROP POLICY IF EXISTS "Authenticated users can read report-assets" ON storage.objects;
CREATE POLICY "Authenticated users can read report-assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'report-assets' AND auth.role() = 'authenticated');

-- Policy 2: Service role can upload (INSERT) files to report-assets
DROP POLICY IF EXISTS "Service role can upload to report-assets" ON storage.objects;
CREATE POLICY "Service role can upload to report-assets"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'report-assets' AND auth.role() = 'service_role');

-- Policy 3: Service role can delete files from report-assets
DROP POLICY IF EXISTS "Service role can delete from report-assets" ON storage.objects;
CREATE POLICY "Service role can delete from report-assets"
ON storage.objects FOR DELETE
USING (bucket_id = 'report-assets' AND auth.role() = 'service_role');

-- Policy 4: Service role can update (move/rename) files
DROP POLICY IF EXISTS "Service role can update report-assets" ON storage.objects;
CREATE POLICY "Service role can update report-assets"
ON storage.objects FOR UPDATE
USING (bucket_id = 'report-assets' AND auth.role() = 'service_role')
WITH CHECK (bucket_id = 'report-assets' AND auth.role() = 'service_role');

-- Verification: List all policies on storage.objects for report-assets
-- SELECT policyname, permissive, roles, qual, with_check
-- FROM pg_policies
-- WHERE tablename = 'objects' AND schemaname = 'storage'
-- AND policyname LIKE '%report-assets%';

