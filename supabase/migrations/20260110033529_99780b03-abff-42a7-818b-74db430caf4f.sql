-- Create education courses table (admin-managed content)
CREATE TABLE public.education_courses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('basics', 'trading', 'defi', 'technical', 'risk', 'ai')),
  level TEXT NOT NULL CHECK (level IN ('beginner', 'intermediate', 'advanced')),
  duration_minutes INTEGER NOT NULL DEFAULT 0,
  lessons_count INTEGER NOT NULL DEFAULT 0,
  is_premium BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create education articles table
CREATE TABLE public.education_articles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  excerpt TEXT,
  content TEXT,
  category TEXT NOT NULL,
  read_time_minutes INTEGER DEFAULT 5,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user course progress table
CREATE TABLE public.user_course_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  course_id UUID NOT NULL REFERENCES public.education_courses(id) ON DELETE CASCADE,
  lessons_completed INTEGER NOT NULL DEFAULT 0,
  total_time_seconds INTEGER NOT NULL DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_accessed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, course_id)
);

-- Create course ratings table
CREATE TABLE public.course_ratings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  course_id UUID NOT NULL REFERENCES public.education_courses(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, course_id)
);

-- Enable RLS
ALTER TABLE public.education_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.education_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_course_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_ratings ENABLE ROW LEVEL SECURITY;

-- Courses and articles are publicly readable
CREATE POLICY "Anyone can view active courses" ON public.education_courses
  FOR SELECT USING (is_active = true);

CREATE POLICY "Anyone can view published articles" ON public.education_articles
  FOR SELECT USING (is_published = true);

-- User progress is private to each user
CREATE POLICY "Users can view own progress" ON public.user_course_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress" ON public.user_course_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress" ON public.user_course_progress
  FOR UPDATE USING (auth.uid() = user_id);

-- Ratings are public to read, private to write
CREATE POLICY "Anyone can view ratings" ON public.course_ratings
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own ratings" ON public.course_ratings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ratings" ON public.course_ratings
  FOR UPDATE USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_user_course_progress_user ON public.user_course_progress(user_id);
CREATE INDEX idx_user_course_progress_course ON public.user_course_progress(course_id);
CREATE INDEX idx_course_ratings_course ON public.course_ratings(course_id);
CREATE INDEX idx_education_courses_category ON public.education_courses(category);
CREATE INDEX idx_education_articles_category ON public.education_articles(category);