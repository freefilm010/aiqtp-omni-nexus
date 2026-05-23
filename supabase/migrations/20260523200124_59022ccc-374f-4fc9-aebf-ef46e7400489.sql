CREATE TABLE IF NOT EXISTS public.admin_file_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  category text NOT NULL CHECK (category IN ('codebase_backup','cloud_export','repository','database_export','storage_export','deployment','security_audit','other')),
  source_type text NOT NULL DEFAULT 'manual',
  source_url text,
  storage_bucket text,
  storage_path text,
  checksum_sha256 text,
  size_bytes bigint,
  description text,
  status text NOT NULL DEFAULT 'tracked' CHECK (status IN ('tracked','pending','verified','archived','failed')),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_file_assets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view file assets" ON public.admin_file_assets;
DROP POLICY IF EXISTS "Admins can create file assets" ON public.admin_file_assets;
DROP POLICY IF EXISTS "Admins can update file assets" ON public.admin_file_assets;
DROP POLICY IF EXISTS "Admins can delete file assets" ON public.admin_file_assets;

CREATE POLICY "Admins can view file assets"
ON public.admin_file_assets
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can create file assets"
ON public.admin_file_assets
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update file assets"
ON public.admin_file_assets
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete file assets"
ON public.admin_file_assets
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_admin_file_assets_category ON public.admin_file_assets(category);
CREATE INDEX IF NOT EXISTS idx_admin_file_assets_status ON public.admin_file_assets(status);
CREATE INDEX IF NOT EXISTS idx_admin_file_assets_created_at ON public.admin_file_assets(created_at DESC);

DROP TRIGGER IF EXISTS update_admin_file_assets_updated_at ON public.admin_file_assets;
CREATE TRIGGER update_admin_file_assets_updated_at
BEFORE UPDATE ON public.admin_file_assets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO storage.buckets (id, name, public)
VALUES ('admin-backups', 'admin-backups', false)
ON CONFLICT (id) DO UPDATE SET public = false;

DROP POLICY IF EXISTS "Admins can read admin backups" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload admin backups" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update admin backups" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete admin backups" ON storage.objects;

CREATE POLICY "Admins can read admin backups"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'admin-backups' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can upload admin backups"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'admin-backups' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update admin backups"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'admin-backups' AND public.has_role(auth.uid(), 'admin'))
WITH CHECK (bucket_id = 'admin-backups' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete admin backups"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'admin-backups' AND public.has_role(auth.uid(), 'admin'));