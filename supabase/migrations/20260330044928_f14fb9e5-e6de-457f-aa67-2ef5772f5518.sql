-- Fix: Users can read their own connected accounts
CREATE POLICY "Users can view own connected accounts"
  ON public.connected_accounts
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Create avatars storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- RLS for avatars bucket: users upload to their own folder
CREATE POLICY "Users upload own avatar"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users update own avatar"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users delete own avatar"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Public avatar read access"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'avatars');

-- Add webhook_url_masked column to automation_templates for safe display
ALTER TABLE public.automation_templates ADD COLUMN IF NOT EXISTS webhook_url_masked text GENERATED ALWAYS AS (
  CASE 
    WHEN webhook_url IS NOT NULL THEN 
      substring(webhook_url from '^(https?://[^/]+)')  || '/***'
    ELSE NULL
  END
) STORED;