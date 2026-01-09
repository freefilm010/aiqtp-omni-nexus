import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  Crown,
  Send,
  Users,
  Trophy,
  Star,
  Lock,
  MessageSquare,
} from "lucide-react";

interface EliteMessage {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  user_email?: string;
}

interface EliteMember {
  id: string;
  user_id: string;
  tier: string;
  lifetime_earnings: number;
  total_strategies_graduated: number;
}

const EliteClubChat = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<EliteMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isEliteMember, setIsEliteMember] = useState<boolean | null>(null);
  const [memberInfo, setMemberInfo] = useState<EliteMember | null>(null);
  const [onlineCount, setOnlineCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      checkMembership();
    } else {
      setIsEliteMember(false);
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (isEliteMember) {
      fetchMessages();
      subscribeToMessages();
    }
  }, [isEliteMember]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const checkMembership = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("elite_club_members")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      
      setIsEliteMember(!!data);
      setMemberInfo(data);
    } catch (err) {
      console.error("Error checking membership:", err);
      setIsEliteMember(false);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from("elite_club_messages")
        .select("*")
        .order("created_at", { ascending: true })
        .limit(100);

      if (error) throw error;
      setMessages(data || []);
    } catch (err) {
      console.error("Error fetching messages:", err);
    }
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel("elite-chat")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "elite_club_messages" },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as EliteMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    try {
      const { error } = await supabase.from("elite_club_messages").insert({
        user_id: user.id,
        content: newMessage.trim(),
      });

      if (error) throw error;
      setNewMessage("");
    } catch (err) {
      console.error("Error sending message:", err);
      toast.error("Failed to send message");
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
          <p className="mt-4 text-muted-foreground">Checking membership...</p>
        </CardContent>
      </Card>
    );
  }

  if (!isEliteMember) {
    return (
      <Card className="border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-amber-500/10">
        <CardContent className="py-12 text-center">
          <Lock className="h-16 w-16 mx-auto text-amber-500 mb-4" />
          <h3 className="text-2xl font-bold mb-2">Elite Creators Club</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            This exclusive chat is only available to creators with graduated strategies.
            Graduate a strategy with 92.5%+ profitability to join.
          </p>
          <div className="flex flex-wrap justify-center gap-4 mb-6">
            <Badge variant="outline" className="text-amber-500 border-amber-500/30">
              <Trophy className="h-3 w-3 mr-1" />
              Exclusive Access
            </Badge>
            <Badge variant="outline" className="text-amber-500 border-amber-500/30">
              <Users className="h-3 w-3 mr-1" />
              Network with Top Creators
            </Badge>
            <Badge variant="outline" className="text-amber-500 border-amber-500/30">
              <Star className="h-3 w-3 mr-1" />
              Premium Insights
            </Badge>
          </div>
          <Button className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700">
            <Crown className="h-4 w-4 mr-2" />
            Learn How to Join
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col h-[600px]">
      <CardHeader className="border-b pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-amber-500" />
            Elite Creators Club
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-amber-500/10 text-amber-500">
              {memberInfo?.tier || "Member"}
            </Badge>
            <Badge variant="outline">
              <Users className="h-3 w-3 mr-1" />
              {onlineCount || "—"} online
            </Badge>
          </div>
        </div>
        {memberInfo && (
          <div className="flex gap-4 text-xs text-muted-foreground mt-2">
            <span>Lifetime Earnings: ${memberInfo.lifetime_earnings.toFixed(2)}</span>
            <span>Graduated Strategies: {memberInfo.total_strategies_graduated}</span>
          </div>
        )}
      </CardHeader>

      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((message) => {
              const isOwnMessage = message.user_id === user?.id;
              return (
                <div
                  key={message.id}
                  className={`flex gap-3 ${isOwnMessage ? "flex-row-reverse" : ""}`}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-amber-500/20 text-amber-500 text-xs">
                      {message.user_email?.[0]?.toUpperCase() || "E"}
                    </AvatarFallback>
                  </Avatar>
                  <div
                    className={`max-w-[70%] p-3 rounded-lg ${
                      isOwnMessage
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <p className="text-[10px] mt-1 opacity-70">
                      {new Date(message.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>

      <form onSubmit={sendMessage} className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Message the Elite Club..."
            className="flex-1"
          />
          <Button type="submit" disabled={!newMessage.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default EliteClubChat;
