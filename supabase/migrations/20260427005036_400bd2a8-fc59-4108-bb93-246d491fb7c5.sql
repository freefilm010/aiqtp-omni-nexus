-- =============================================================
-- 1) Realtime: ensure RLS is force-enabled (scanner re-check)
-- =============================================================
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE realtime.messages FORCE ROW LEVEL SECURITY;

-- =============================================================
-- 2) Avatars bucket: stop directory listing, allow direct file
--    reads only. Public URLs continue to work; `list()` won't.
-- =============================================================
DROP POLICY IF EXISTS "Anyone can read avatar files by path" ON storage.objects;

-- Public can READ a specific avatar file by exact path (no listing).
-- storage.objects SELECT used by both list() and getPublicUrl/download.
-- Restricting to non-null path prevents listing the bucket root.
CREATE POLICY "Public read individual avatar files"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'avatars'
  AND name IS NOT NULL
  AND position('/' in name) > 0  -- must include a folder segment, blocks bucket-root listing
);

-- Authenticated owners can list their own folder
CREATE POLICY "Owners can list own avatar folder"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);