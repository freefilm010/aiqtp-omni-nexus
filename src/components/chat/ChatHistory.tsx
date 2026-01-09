import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  MessageSquare,
  Plus,
  Search,
  Folder,
  Archive,
  Star,
  MoreVertical,
  Trash2,
  Edit2,
  Share2,
  FolderOpen,
  Clock,
} from "lucide-react";

interface Conversation {
  id: string;
  title: string | null;
  folder: string;
  is_archived: boolean;
  is_shared: boolean;
  message_count: number;
  model_used: string;
  created_at: string;
  updated_at: string;
}

interface ChatHistoryProps {
  agentType: "qaqi" | "aiqtp" | "copilot";
  activeConversationId: string | null;
  onSelectConversation: (id: string | null) => void;
  onNewConversation: () => void;
}

export const ChatHistory = ({
  agentType,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
}: ChatHistoryProps) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [search, setSearch] = useState("");
  const [activeFolder, setActiveFolder] = useState<string>("default");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user, agentType]);

  const fetchConversations = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("chat_conversations")
        .select("*")
        .eq("user_id", user.id)
        .eq("agent_type", agentType)
        .order("updated_at", { ascending: false });

      if (error) throw error;
      setConversations(data || []);
    } catch (err) {
      console.error("Error fetching conversations:", err);
    } finally {
      setLoading(false);
    }
  };

  const createConversation = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("chat_conversations")
        .insert({
          user_id: user.id,
          agent_type: agentType,
          title: "New Conversation",
          folder: "default",
        })
        .select()
        .single();

      if (error) throw error;
      
      setConversations(prev => [data, ...prev]);
      onSelectConversation(data.id);
      toast.success("New conversation created");
    } catch (err) {
      console.error("Error creating conversation:", err);
      toast.error("Failed to create conversation");
    }
  };

  const deleteConversation = async (id: string) => {
    try {
      const { error } = await supabase
        .from("chat_conversations")
        .delete()
        .eq("id", id);

      if (error) throw error;
      
      setConversations(prev => prev.filter(c => c.id !== id));
      if (activeConversationId === id) {
        onSelectConversation(null);
      }
      toast.success("Conversation deleted");
    } catch (err) {
      console.error("Error deleting conversation:", err);
      toast.error("Failed to delete conversation");
    }
  };

  const archiveConversation = async (id: string) => {
    try {
      const { error } = await supabase
        .from("chat_conversations")
        .update({ is_archived: true, folder: "archived" })
        .eq("id", id);

      if (error) throw error;
      
      await fetchConversations();
      toast.success("Conversation archived");
    } catch (err) {
      console.error("Error archiving conversation:", err);
    }
  };

  const filteredConversations = conversations.filter(c => {
    const matchesSearch = !search || 
      c.title?.toLowerCase().includes(search.toLowerCase());
    const matchesFolder = activeFolder === "all" || 
      (activeFolder === "archived" ? c.is_archived : c.folder === activeFolder && !c.is_archived);
    return matchesSearch && matchesFolder;
  });

  const folders = ["default", "starred", "archived"];

  return (
    <div className="flex flex-col h-full border-r">
      {/* Header */}
      <div className="p-3 border-b">
        <Button 
          onClick={createConversation} 
          className="w-full" 
          size="sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Chat
        </Button>
      </div>

      {/* Search */}
      <div className="p-2 border-b">
        <div className="relative">
          <Search className="absolute left-2 top-2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search chats..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>
      </div>

      {/* Folder Tabs */}
      <div className="flex gap-1 p-2 border-b overflow-x-auto">
        {folders.map((folder) => (
          <Button
            key={folder}
            variant={activeFolder === folder ? "secondary" : "ghost"}
            size="sm"
            className="text-xs shrink-0"
            onClick={() => setActiveFolder(folder)}
          >
            {folder === "default" && <FolderOpen className="h-3 w-3 mr-1" />}
            {folder === "starred" && <Star className="h-3 w-3 mr-1" />}
            {folder === "archived" && <Archive className="h-3 w-3 mr-1" />}
            {folder.charAt(0).toUpperCase() + folder.slice(1)}
          </Button>
        ))}
      </div>

      {/* Conversation List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {loading ? (
            <div className="text-center py-4 text-sm text-muted-foreground">
              Loading...
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No conversations yet</p>
              <Button 
                variant="link" 
                size="sm" 
                onClick={createConversation}
                className="mt-2"
              >
                Start a new chat
              </Button>
            </div>
          ) : (
            filteredConversations.map((conv) => (
              <div
                key={conv.id}
                className={`group flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                  activeConversationId === conv.id
                    ? "bg-primary/10 border border-primary/30"
                    : "hover:bg-muted"
                }`}
                onClick={() => onSelectConversation(conv.id)}
              >
                <MessageSquare className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {conv.title || "Untitled"}
                  </p>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {new Date(conv.updated_at).toLocaleDateString()}
                    <Badge variant="outline" className="text-[9px] px-1 py-0">
                      {conv.message_count}
                    </Badge>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6 opacity-0 group-hover:opacity-100"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertical className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => archiveConversation(conv.id)}>
                      <Archive className="h-4 w-4 mr-2" />
                      Archive
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => deleteConversation(conv.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default ChatHistory;
