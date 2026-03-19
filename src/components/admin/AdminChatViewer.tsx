import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Download, User, Bot, Clock } from "lucide-react";

interface Message {
  id: string;
  role: string;
  content: string;
  model_used: string | null;
  created_at: string | null;
  attachments: any;
  tool_executions: any;
}

interface AdminChatViewerProps {
  conversationId: string;
  conversationTitle: string;
  onBack: () => void;
}

const AdminChatViewer = ({ conversationId, conversationTitle, onBack }: AdminChatViewerProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMessages();
  }, [conversationId]);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load messages");
    } finally {
      setLoading(false);
    }
  };

  const exportConversation = () => {
    const exportData = {
      conversationId,
      title: conversationTitle,
      exportedAt: new Date().toISOString(),
      messageCount: messages.length,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
        model: m.model_used,
        timestamp: m.created_at,
      })),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chat-export-${conversationId.slice(0, 8)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Conversation exported");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <div>
            <h3 className="font-semibold">{conversationTitle}</h3>
            <p className="text-xs text-muted-foreground">{messages.length} messages</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={exportConversation}>
          <Download className="h-4 w-4 mr-2" /> Export JSON
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <ScrollArea className="h-[600px]">
            <div className="p-4 space-y-4">
              {loading ? (
                <p className="text-center text-muted-foreground py-8">Loading messages...</p>
              ) : messages.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No messages in this conversation</p>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-3 ${msg.role === "user" ? "" : "flex-row-reverse"}`}
                  >
                    <div
                      className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                        msg.role === "user"
                          ? "bg-primary/20 text-primary"
                          : msg.role === "system"
                          ? "bg-amber-500/20 text-amber-500"
                          : "bg-green-500/20 text-green-500"
                      }`}
                    >
                      {msg.role === "user" ? (
                        <User className="h-4 w-4" />
                      ) : (
                        <Bot className="h-4 w-4" />
                      )}
                    </div>
                    <div
                      className={`flex-1 max-w-[80%] rounded-lg p-3 text-sm ${
                        msg.role === "user"
                          ? "bg-primary/10 border border-primary/20"
                          : msg.role === "system"
                          ? "bg-amber-500/10 border border-amber-500/20"
                          : "bg-muted border border-border"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-[10px] px-1 py-0">
                          {msg.role}
                        </Badge>
                        {msg.model_used && (
                          <Badge variant="secondary" className="text-[10px] px-1 py-0">
                            {msg.model_used.split("/").pop()}
                          </Badge>
                        )}
                        {msg.created_at && (
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(msg.created_at).toLocaleString()}
                          </span>
                        )}
                      </div>
                      <div className="whitespace-pre-wrap break-words">{msg.content}</div>
                      {msg.tool_executions && (
                        <details className="mt-2 text-xs">
                          <summary className="cursor-pointer text-muted-foreground">Tool Executions</summary>
                          <pre className="mt-1 p-2 bg-background rounded text-[10px] overflow-auto max-h-32">
                            {JSON.stringify(msg.tool_executions, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminChatViewer;
