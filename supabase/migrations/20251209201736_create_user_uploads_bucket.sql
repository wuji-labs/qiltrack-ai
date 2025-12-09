-- Create storage bucket for user uploads (avatars, etc.)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'user-uploads',
  'user-uploads',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for user uploads bucket
-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'user-uploads' AND
  (storage.foldername(name))[1] = 'avatars'
);

-- Allow users to update their own files
CREATE POLICY "Users can update their own files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'user-uploads' AND
  (storage.foldername(name))[1] = 'avatars' AND
  auth.uid()::text = split_part((storage.foldername(name))[2], '-', 1)
)
WITH CHECK (
  bucket_id = 'user-uploads' AND
  (storage.foldername(name))[1] = 'avatars'
);

-- Allow users to delete their own files
CREATE POLICY "Users can delete their own files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'user-uploads' AND
  (storage.foldername(name))[1] = 'avatars' AND
  auth.uid()::text = split_part((storage.foldername(name))[2], '-', 1)
);

-- Allow public read access to all files in the bucket
CREATE POLICY "Public read access for user uploads"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'user-uploads');
