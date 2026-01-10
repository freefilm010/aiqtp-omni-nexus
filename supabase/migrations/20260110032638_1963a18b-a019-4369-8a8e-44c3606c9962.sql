-- =============================================
-- SECURITY FIX: Add RLS policies for exposed tables
-- =============================================

-- 1. Fix influencer_partners - restrict to admins and own record
DROP POLICY IF EXISTS "Anyone can view influencer_partners" ON public.influencer_partners;
DROP POLICY IF EXISTS "Influencer partners are publicly readable" ON public.influencer_partners;

CREATE POLICY "Users can view own influencer record"
  ON public.influencer_partners
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all influencer partners"
  ON public.influencer_partners
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage influencer partners"
  ON public.influencer_partners
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 2. Fix faucet_claims - restrict IP/wallet visibility
DROP POLICY IF EXISTS "Anyone can view faucet_claims" ON public.faucet_claims;
DROP POLICY IF EXISTS "Faucet claims are publicly readable" ON public.faucet_claims;

CREATE POLICY "Users can view own faucet claims"
  ON public.faucet_claims
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own faucet claims"
  ON public.faucet_claims
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all faucet claims"
  ON public.faucet_claims
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- 3. Fix contest_participants - prevent viewing others' scores
DROP POLICY IF EXISTS "Anyone can view contest_participants" ON public.contest_participants;
DROP POLICY IF EXISTS "Contest participants are publicly readable" ON public.contest_participants;

CREATE POLICY "Users can view own contest participation"
  ON public.contest_participants
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own contest participation"
  ON public.contest_participants
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all contest participants"
  ON public.contest_participants
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 4. Setup chat-attachments storage bucket with proper RLS
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat-attachments',
  'chat-attachments',
  false,
  10485760,
  ARRAY[
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/csv', 'text/plain', 'application/json'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 10485760;

-- Storage policies for chat-attachments
CREATE POLICY "Users can upload to own folder in chat-attachments"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'chat-attachments' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can view own files in chat-attachments"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'chat-attachments' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete own files in chat-attachments"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'chat-attachments' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Admins can view all chat attachments"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'chat-attachments' AND
    public.has_role(auth.uid(), 'admin')
  );