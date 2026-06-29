
CREATE TABLE public.shared_scripts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  language TEXT NOT NULL CHECK (language IN ('pinescript','thinkscript','freqtrade','mql4','mql5','easylanguage','python','other')),
  category TEXT NOT NULL DEFAULT 'indicator' CHECK (category IN ('indicator','strategy','study','screener','scanner','library','utility')),
  code TEXT NOT NULL,
  tags TEXT[] NOT NULL DEFAULT '{}',
  asset_class TEXT,
  timeframe TEXT,
  visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public','unlisted','private')),
  source_url TEXT,
  license TEXT DEFAULT 'MIT',
  version TEXT DEFAULT '1.0.0',
  downloads INTEGER NOT NULL DEFAULT 0,
  likes INTEGER NOT NULL DEFAULT 0,
  rating NUMERIC(3,2) NOT NULL DEFAULT 0,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.shared_scripts TO authenticated;
GRANT SELECT ON public.shared_scripts TO anon;
GRANT ALL ON public.shared_scripts TO service_role;

ALTER TABLE public.shared_scripts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public scripts viewable by all"
  ON public.shared_scripts FOR SELECT
  USING (visibility = 'public' OR auth.uid() = user_id);

CREATE POLICY "Users insert own scripts"
  ON public.shared_scripts FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own scripts"
  ON public.shared_scripts FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own scripts"
  ON public.shared_scripts FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX idx_shared_scripts_lang ON public.shared_scripts(language);
CREATE INDEX idx_shared_scripts_cat ON public.shared_scripts(category);
CREATE INDEX idx_shared_scripts_user ON public.shared_scripts(user_id);
CREATE INDEX idx_shared_scripts_created ON public.shared_scripts(created_at DESC);

CREATE TRIGGER trg_shared_scripts_updated_at
  BEFORE UPDATE ON public.shared_scripts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.shared_script_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  script_id UUID NOT NULL REFERENCES public.shared_scripts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(script_id, user_id)
);

GRANT SELECT, INSERT, DELETE ON public.shared_script_likes TO authenticated;
GRANT ALL ON public.shared_script_likes TO service_role;

ALTER TABLE public.shared_script_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Likes visible to all auth"
  ON public.shared_script_likes FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users like as self"
  ON public.shared_script_likes FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users unlike own"
  ON public.shared_script_likes FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
