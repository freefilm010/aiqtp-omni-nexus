
-- Drop the overly broad SELECT policy
DROP POLICY IF EXISTS "Public avatar read access" ON storage.objects;

-- Create a scoped policy: anyone can read a specific avatar file (needed for display),
-- but the path must be under a specific user folder (prevents listing all files)
CREATE POLICY "Anyone can read avatar files by path"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] IS NOT NULL
);
