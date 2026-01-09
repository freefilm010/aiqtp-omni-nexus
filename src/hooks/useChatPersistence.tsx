import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  toolExecutions?: any[];
  model_used?: string;
  attachments?: any[];
}

interface UseChatPersistenceProps {
  agentType: "qaqi" | "aiqtp" | "copilot";
  initialSystemMessage?: string;
}

export const useChatPersistence = ({ agentType, initialSystemMessage }: UseChatPersistenceProps) => {
  const { user } = useAuth();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Load conversation messages when conversationId changes
  useEffect(() => {
    if (conversationId && user) {
      loadMessages(conversationId);
    } else if (!conversationId && initialSystemMessage) {
      // Set initial system message for new conversations
      setMessages([{
        id: "init",
        role: "system",
        content: initialSystemMessage,
        timestamp: new Date(),
      }]);
    }
  }, [conversationId, user]);

  const loadMessages = async (convId: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("conversation_id", convId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        const loadedMessages: Message[] = data.map(msg => ({
          id: msg.id,
          role: msg.role as "user" | "assistant" | "system",
          content: msg.content,
          timestamp: new Date(msg.created_at || Date.now()),
          toolExecutions: msg.tool_executions as any[] || undefined,
          model_used: msg.model_used || undefined,
          attachments: msg.attachments as any[] || undefined,
        }));
        setMessages(loadedMessages);
      } else if (initialSystemMessage) {
        // No messages yet, add initial system message
        setMessages([{
          id: "init",
          role: "system",
          content: initialSystemMessage,
          timestamp: new Date(),
        }]);
      }
    } catch (err) {
      console.error("Error loading messages:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const saveMessage = useCallback(async (message: Message, modelUsed?: string) => {
    if (!user || !conversationId) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("chat_messages")
        .insert({
          id: message.id,
          conversation_id: conversationId,
          role: message.role,
          content: message.content,
          model_used: modelUsed || null,
          tool_executions: message.toolExecutions || null,
          attachments: message.attachments || null,
        });

      if (error) throw error;

      // Update conversation message count and timestamp
      await supabase
        .from("chat_conversations")
        .update({ 
          updated_at: new Date().toISOString(),
          message_count: messages.length + 1,
        })
        .eq("id", conversationId);

    } catch (err) {
      console.error("Error saving message:", err);
    } finally {
      setIsSaving(false);
    }
  }, [user, conversationId, messages.length]);

  const createConversation = async (title?: string): Promise<string | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from("chat_conversations")
        .insert({
          user_id: user.id,
          agent_type: agentType,
          title: title || "New Conversation",
          folder: "default",
        })
        .select()
        .single();

      if (error) throw error;
      
      setConversationId(data.id);
      return data.id;
    } catch (err) {
      console.error("Error creating conversation:", err);
      toast.error("Failed to create conversation");
      return null;
    }
  };

  const updateConversationTitle = async (title: string) => {
    if (!conversationId) return;

    try {
      await supabase
        .from("chat_conversations")
        .update({ title })
        .eq("id", conversationId);
    } catch (err) {
      console.error("Error updating title:", err);
    }
  };

  const addMessage = useCallback((message: Message, modelUsed?: string) => {
    setMessages(prev => [...prev, message]);
    
    // Save to database if we have a conversation
    if (conversationId && message.role !== "system") {
      saveMessage(message, modelUsed);
    }
  }, [conversationId, saveMessage]);

  const startNewConversation = useCallback(() => {
    setConversationId(null);
    if (initialSystemMessage) {
      setMessages([{
        id: "init",
        role: "system",
        content: initialSystemMessage,
        timestamp: new Date(),
      }]);
    } else {
      setMessages([]);
    }
  }, [initialSystemMessage]);

  const selectConversation = useCallback((id: string | null) => {
    if (id) {
      setConversationId(id);
    } else {
      startNewConversation();
    }
  }, [startNewConversation]);

  // Auto-create conversation on first user message
  const ensureConversation = async (firstMessageContent: string): Promise<string | null> => {
    if (conversationId) return conversationId;
    
    // Generate title from first message (first 50 chars)
    const title = firstMessageContent.slice(0, 50) + (firstMessageContent.length > 50 ? "..." : "");
    return await createConversation(title);
  };

  return {
    messages,
    setMessages,
    conversationId,
    isLoading,
    isSaving,
    addMessage,
    saveMessage,
    createConversation,
    selectConversation,
    startNewConversation,
    updateConversationTitle,
    ensureConversation,
  };
};

export default useChatPersistence;
