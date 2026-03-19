import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import AdminChatViewer from "./AdminChatViewer";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  MessageSquare,
  Archive,
  Trash2,
  Search,
  Filter,
  RefreshCw,
  Clock,
  User,
  Bot,
  ArchiveX,
  CheckSquare,
  Calendar
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Conversation {
  id: string;
  user_id: string;
  agent_type: string;
  title: string | null;
  folder: string | null;
  is_archived: boolean;
  is_shared: boolean;
  message_count: number;
  model_used: string | null;
  created_at: string;
  updated_at: string;
}

const ChatManagement = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [viewingConversation, setViewingConversation] = useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [filterAgent, setFilterAgent] = useState<string>("all");
  const [filterArchived, setFilterArchived] = useState<string>("active");

  useEffect(() => {
    fetchConversations();
  }, [filterAgent, filterArchived]);

  const fetchConversations = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('chat_conversations')
        .select('*')
        .order('updated_at', { ascending: false });

      if (filterAgent !== 'all') {
        query = query.eq('agent_type', filterAgent);
      }

      if (filterArchived === 'active') {
        query = query.eq('is_archived', false);
      } else if (filterArchived === 'archived') {
        query = query.eq('is_archived', true);
      }

      const { data, error } = await query;

      if (error) throw error;
      setConversations(data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch conversations");
    } finally {
      setIsLoading(false);
    }
  };

  const archiveSelected = async () => {
    if (selectedIds.size === 0) {
      toast.error("No conversations selected");
      return;
    }

    try {
      const { error } = await supabase
        .from('chat_conversations')
        .update({ is_archived: true })
        .in('id', Array.from(selectedIds));

      if (error) throw error;

      toast.success(`Archived ${selectedIds.size} conversation(s)`);
      setSelectedIds(new Set());
      fetchConversations();
    } catch (err) {
      console.error(err);
      toast.error("Failed to archive conversations");
    }
  };

  const unarchiveSelected = async () => {
    if (selectedIds.size === 0) {
      toast.error("No conversations selected");
      return;
    }

    try {
      const { error } = await supabase
        .from('chat_conversations')
        .update({ is_archived: false })
        .in('id', Array.from(selectedIds));

      if (error) throw error;

      toast.success(`Unarchived ${selectedIds.size} conversation(s)`);
      setSelectedIds(new Set());
      fetchConversations();
    } catch (err) {
      console.error(err);
      toast.error("Failed to unarchive conversations");
    }
  };

  const deleteSelected = async () => {
    if (selectedIds.size === 0) {
      toast.error("No conversations selected");
      return;
    }

    try {
      const { error } = await supabase
        .from('chat_conversations')
        .delete()
        .in('id', Array.from(selectedIds));

      if (error) throw error;

      toast.success(`Deleted ${selectedIds.size} conversation(s)`);
      setSelectedIds(new Set());
      fetchConversations();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete conversations");
    }
  };

  const autoArchiveOld = async (daysOld: number = 30) => {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const { data, error } = await supabase
        .from('chat_conversations')
        .update({ is_archived: true })
        .eq('is_archived', false)
        .lt('updated_at', cutoffDate.toISOString())
        .select();

      if (error) throw error;

      const count = data?.length || 0;
      toast.success(`Auto-archived ${count} conversation(s) older than ${daysOld} days`);
      fetchConversations();
    } catch (err) {
      console.error(err);
      toast.error("Failed to auto-archive conversations");
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const selectAll = () => {
    if (selectedIds.size === filteredConversations.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredConversations.map(c => c.id)));
    }
  };

  const filteredConversations = conversations.filter(c => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      c.title?.toLowerCase().includes(query) ||
      c.agent_type.toLowerCase().includes(query) ||
      c.user_id.toLowerCase().includes(query)
    );
  });

  const getAgentIcon = (type: string) => {
    switch (type) {
      case 'qaqi': return '🔮';
      case 'aiqtp': return '🤖';
      case 'copilot': return '💎';
      default: return '💬';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Chat Management</h1>
          <p className="text-muted-foreground">
            Manage, archive, and organize all chat conversations
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => fetchConversations()} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">{conversations.filter(c => !c.is_archived).length}</p>
                <p className="text-sm text-muted-foreground">Active Chats</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Archive className="h-5 w-5 text-amber-500" />
              <div>
                <p className="text-2xl font-bold">{conversations.filter(c => c.is_archived).length}</p>
                <p className="text-sm text-muted-foreground">Archived</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{conversations.filter(c => c.agent_type === 'qaqi').length}</p>
                <p className="text-sm text-muted-foreground">QAQI Chats</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">
                  {conversations.reduce((sum, c) => sum + (c.message_count || 0), 0)}
                </p>
                <p className="text-sm text-muted-foreground">Total Messages</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex gap-2 flex-1 min-w-[300px]">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterAgent} onValueChange={setFilterAgent}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Agent" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Agents</SelectItem>
                  <SelectItem value="qaqi">QAQI</SelectItem>
                  <SelectItem value="aiqtp">AIQTP</SelectItem>
                  <SelectItem value="copilot">Copilot</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterArchived} onValueChange={setFilterArchived}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => autoArchiveOld(30)}
              >
                <Calendar className="h-4 w-4 mr-2" />
                Auto-Archive (30d+)
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={archiveSelected}
                disabled={selectedIds.size === 0}
              >
                <Archive className="h-4 w-4 mr-2" />
                Archive ({selectedIds.size})
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={unarchiveSelected}
                disabled={selectedIds.size === 0}
              >
                <ArchiveX className="h-4 w-4 mr-2" />
                Unarchive
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={selectedIds.size === 0}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Conversations?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete {selectedIds.size} conversation(s) and all their messages. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={deleteSelected}>Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Conversations Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Conversations ({filteredConversations.length})</span>
            <Button variant="ghost" size="sm" onClick={selectAll}>
              <CheckSquare className="h-4 w-4 mr-2" />
              {selectedIds.size === filteredConversations.length ? 'Deselect All' : 'Select All'}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]"></TableHead>
                  <TableHead>Agent</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Messages</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredConversations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      No conversations found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredConversations.map((conv) => (
                    <TableRow key={conv.id} className={selectedIds.has(conv.id) ? 'bg-muted/50' : ''}>
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.has(conv.id)}
                          onCheckedChange={() => toggleSelect(conv.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{getAgentIcon(conv.agent_type)}</span>
                          <span className="font-medium uppercase text-xs">{conv.agent_type}</span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {conv.title || 'Untitled Conversation'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{conv.message_count || 0}</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {conv.model_used?.split('/')[1] || 'default'}
                      </TableCell>
                      <TableCell>
                        {conv.is_archived ? (
                          <Badge variant="outline" className="text-amber-500">Archived</Badge>
                        ) : (
                          <Badge variant="outline" className="text-green-500">Active</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(conv.updated_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default ChatManagement;
