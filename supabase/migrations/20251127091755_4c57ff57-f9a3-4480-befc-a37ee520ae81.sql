-- Create table for tracking AI generation rate limits
CREATE TABLE public.ai_generation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  function_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.ai_generation_logs ENABLE ROW LEVEL SECURITY;

-- Users can view their own logs
CREATE POLICY "Users can view their own generation logs"
  ON public.ai_generation_logs
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own logs
CREATE POLICY "Users can insert their own generation logs"
  ON public.ai_generation_logs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create index for efficient rate limit queries
CREATE INDEX idx_ai_generation_logs_user_function_time 
  ON public.ai_generation_logs(user_id, function_name, created_at DESC);