-- Chat conversations table for persistent chat history
CREATE TABLE public.chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  agent_type TEXT NOT NULL CHECK (agent_type IN ('qaqi', 'aiqtp', 'copilot')),
  title TEXT,
  folder TEXT DEFAULT 'default',
  is_archived BOOLEAN DEFAULT false,
  is_shared BOOLEAN DEFAULT false,
  model_used TEXT DEFAULT 'google/gemini-2.5-flash',
  message_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Chat messages table
CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.chat_conversations ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  model_used TEXT,
  attachments JSONB DEFAULT '[]',
  tool_executions JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Elite club messages for exclusive chat
CREATE TABLE public.elite_club_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- QAQI learning data for real self-enhancement persistence
CREATE TABLE public.qaqi_learning_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern_type TEXT NOT NULL,
  pattern_data JSONB NOT NULL,
  confidence FLOAT DEFAULT 0.5,
  times_used INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- QAQI performance metrics
CREATE TABLE public.qaqi_performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name TEXT NOT NULL,
  metric_value FLOAT NOT NULL,
  recorded_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.elite_club_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qaqi_learning_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qaqi_performance_metrics ENABLE ROW LEVEL SECURITY;

-- Chat conversations policies
CREATE POLICY "Users can view own conversations" ON public.chat_conversations 
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own conversations" ON public.chat_conversations 
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own conversations" ON public.chat_conversations 
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own conversations" ON public.chat_conversations 
  FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all conversations" ON public.chat_conversations 
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- Chat messages policies
CREATE POLICY "Users can view messages in own conversations" ON public.chat_messages 
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.chat_conversations WHERE id = conversation_id AND user_id = auth.uid()
  ));
CREATE POLICY "Users can create messages in own conversations" ON public.chat_messages 
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM public.chat_conversations WHERE id = conversation_id AND user_id = auth.uid()
  ));
CREATE POLICY "Users can delete messages in own conversations" ON public.chat_messages 
  FOR DELETE USING (EXISTS (
    SELECT 1 FROM public.chat_conversations WHERE id = conversation_id AND user_id = auth.uid()
  ));
CREATE POLICY "Admins can view all messages" ON public.chat_messages 
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- Elite club messages policies
CREATE POLICY "Elite members can view messages" ON public.elite_club_messages 
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.elite_club_members WHERE user_id = auth.uid()
  ));
CREATE POLICY "Elite members can create messages" ON public.elite_club_messages 
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM public.elite_club_members WHERE user_id = auth.uid()
  ));
CREATE POLICY "Admins can manage elite messages" ON public.elite_club_messages 
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- QAQI learning data policies (admin only)
CREATE POLICY "Admins can manage learning data" ON public.qaqi_learning_data 
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- QAQI performance metrics policies (admin only)
CREATE POLICY "Admins can manage performance metrics" ON public.qaqi_performance_metrics 
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Enable realtime for live chat updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.elite_club_messages;

-- Create trigger for updating conversation message count
CREATE OR REPLACE FUNCTION public.update_conversation_message_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.chat_conversations 
  SET message_count = (
    SELECT COUNT(*) FROM public.chat_messages WHERE conversation_id = NEW.conversation_id
  ),
  updated_at = now()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_message_count_trigger
AFTER INSERT ON public.chat_messages
FOR EACH ROW
EXECUTE FUNCTION public.update_conversation_message_count();