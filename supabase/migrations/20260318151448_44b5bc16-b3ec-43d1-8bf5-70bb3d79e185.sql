
-- Community posts table
CREATE TABLE public.capitol_community_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_type text NOT NULL DEFAULT 'discussion',
  title text NOT NULL,
  content text NOT NULL,
  ticker text,
  chart_url text,
  image_url text,
  tags text[] DEFAULT '{}',
  likes_count integer DEFAULT 0,
  comments_count integer DEFAULT 0,
  is_pinned boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Comments table
CREATE TABLE public.capitol_community_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.capitol_community_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_comment_id uuid REFERENCES public.capitol_community_comments(id) ON DELETE CASCADE,
  content text NOT NULL,
  likes_count integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Likes table
CREATE TABLE public.capitol_community_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id uuid REFERENCES public.capitol_community_posts(id) ON DELETE CASCADE,
  comment_id uuid REFERENCES public.capitol_community_comments(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, post_id),
  UNIQUE(user_id, comment_id)
);

-- Enable RLS
ALTER TABLE public.capitol_community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.capitol_community_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.capitol_community_likes ENABLE ROW LEVEL SECURITY;

-- Posts: anyone can read, authenticated can create, owners can update/delete
CREATE POLICY "Anyone can read posts" ON public.capitol_community_posts FOR SELECT USING (true);
CREATE POLICY "Auth users can create posts" ON public.capitol_community_posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owners can update posts" ON public.capitol_community_posts FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Owners can delete posts" ON public.capitol_community_posts FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Comments: anyone can read, authenticated can create, owners can delete
CREATE POLICY "Anyone can read comments" ON public.capitol_community_comments FOR SELECT USING (true);
CREATE POLICY "Auth users can create comments" ON public.capitol_community_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owners can delete comments" ON public.capitol_community_comments FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Likes: anyone can read, authenticated can create/delete own
CREATE POLICY "Anyone can read likes" ON public.capitol_community_likes FOR SELECT USING (true);
CREATE POLICY "Auth users can like" ON public.capitol_community_likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike" ON public.capitol_community_likes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Realtime for posts and comments
ALTER PUBLICATION supabase_realtime ADD TABLE public.capitol_community_posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.capitol_community_comments;

-- Trigger for updated_at
CREATE TRIGGER update_capitol_posts_updated_at
  BEFORE UPDATE ON public.capitol_community_posts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
