import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BarChart2, Plus, Vote, X, Clock, CheckCircle2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

interface Poll {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  ticker: string | null;
  expires_at: string | null;
  is_active: boolean;
  total_votes: number;
  created_at: string;
  options: PollOption[];
}

interface PollOption {
  id: string;
  option_text: string;
  vote_count: number;
  sort_order: number;
}

const CommunityPolls = () => {
  const { user } = useAuth();
  const [polls, setPolls] = useState<Poll[]>([]);
  const [userVotes, setUserVotes] = useState<Record<string, string>>({});
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState("");
  const [newTicker, setNewTicker] = useState("");
  const [newOptions, setNewOptions] = useState(["", "", ""]);

  const fetchPolls = useCallback(async () => {
    const { data: pollsData } = await supabase
      .from("community_polls")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(20);

    if (!pollsData) { setLoading(false); return; }

    const pollIds = pollsData.map(p => p.id);
    const { data: optionsData } = await supabase
      .from("community_poll_options")
      .select("*")
      .in("poll_id", pollIds)
      .order("sort_order", { ascending: true });

    const optionsByPoll: Record<string, PollOption[]> = {};
    (optionsData || []).forEach(o => {
      if (!optionsByPoll[o.poll_id]) optionsByPoll[o.poll_id] = [];
      optionsByPoll[o.poll_id].push(o as PollOption);
    });

    setPolls(pollsData.map(p => ({ ...p, options: optionsByPoll[p.id] || [] })) as Poll[]);
    setLoading(false);
  }, []);

  const fetchUserVotes = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("community_poll_votes")
      .select("poll_id, option_id")
      .eq("user_id", user.id);
    const map: Record<string, string> = {};
    (data || []).forEach(v => { map[v.poll_id] = v.option_id; });
    setUserVotes(map);
  }, [user]);

  useEffect(() => {
    fetchPolls();
    fetchUserVotes();
  }, [fetchPolls, fetchUserVotes]);

  const handleVote = async (pollId: string, optionId: string) => {
    if (!user) { toast.error("Sign in to vote"); return; }
    if (userVotes[pollId]) { toast.info("Already voted"); return; }

    const { error } = await supabase.from("community_poll_votes").insert({
      poll_id: pollId, option_id: optionId, user_id: user.id,
    });
    if (error) { toast.error("Vote failed"); return; }

    setUserVotes(prev => ({ ...prev, [pollId]: optionId }));
    setPolls(prev => prev.map(p => {
      if (p.id !== pollId) return p;
      return {
        ...p,
        total_votes: p.total_votes + 1,
        options: p.options.map(o => o.id === optionId ? { ...o, vote_count: o.vote_count + 1 } : o),
      };
    }));
    toast.success("Vote recorded!");
  };

  const handleCreatePoll = async () => {
    if (!user) { toast.error("Sign in to create polls"); return; }
    const validOptions = newOptions.filter(o => o.trim());
    if (!newTitle.trim() || validOptions.length < 2) {
      toast.error("Title and at least 2 options required");
      return;
    }

    const { data: poll, error } = await supabase.from("community_polls").insert({
      user_id: user.id,
      title: newTitle.trim(),
      ticker: newTicker.trim() || null,
    }).select().single();

    if (error || !poll) { toast.error("Failed to create poll"); return; }

    await supabase.from("community_poll_options").insert(
      validOptions.map((text, i) => ({ poll_id: poll.id, option_text: text.trim(), sort_order: i }))
    );

    toast.success("Poll created!");
    setNewTitle(""); setNewTicker(""); setNewOptions(["", "", ""]);
    setShowCreate(false);
    fetchPolls();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Vote className="h-5 w-5 text-primary" /> Community Polls
        </h3>
        <Button size="sm" variant="outline" onClick={() => setShowCreate(!showCreate)} className="h-8">
          {showCreate ? <X className="h-3.5 w-3.5 mr-1" /> : <Plus className="h-3.5 w-3.5 mr-1" />}
          {showCreate ? "Cancel" : "Create Poll"}
        </Button>
      </div>

      {showCreate && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="pt-4 space-y-3">
            <Input placeholder="Poll question..." value={newTitle} onChange={e => setNewTitle(e.target.value)} className="bg-background" />
            <Input placeholder="Ticker (optional)" value={newTicker} onChange={e => setNewTicker(e.target.value.toUpperCase())} className="bg-background w-32" />
            {newOptions.map((opt, i) => (
              <Input
                key={i}
                placeholder={`Option ${i + 1}`}
                value={opt}
                onChange={e => {
                  const copy = [...newOptions];
                  copy[i] = e.target.value;
                  if (i === newOptions.length - 1 && e.target.value && newOptions.length < 6) copy.push("");
                  setNewOptions(copy);
                }}
                className="bg-background"
              />
            ))}
            <Button onClick={handleCreatePoll} className="w-full">Create Poll</Button>
          </CardContent>
        </Card>
      )}

      <ScrollArea className="h-[400px]">
        <div className="space-y-3 pr-2">
          {polls.map(poll => {
            const hasVoted = !!userVotes[poll.id];
            const totalVotes = poll.options.reduce((s, o) => s + o.vote_count, 0) || 1;
            return (
              <Card key={poll.id} className="border-border/50">
                <CardContent className="pt-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {poll.ticker && <Badge variant="secondary" className="text-[10px] mr-1.5 font-mono">${poll.ticker}</Badge>}
                        {poll.title}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {formatDistanceToNow(new Date(poll.created_at), { addSuffix: true })} · {totalVotes} votes
                      </p>
                    </div>
                    {hasVoted && <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />}
                  </div>
                  <div className="space-y-2">
                    {poll.options.map(opt => {
                      const pct = Math.round((opt.vote_count / totalVotes) * 100);
                      const isSelected = userVotes[poll.id] === opt.id;
                      return (
                        <button
                          key={opt.id}
                          onClick={() => !hasVoted && handleVote(poll.id, opt.id)}
                          disabled={hasVoted}
                          className={`w-full text-left rounded-md p-2 border transition-colors ${
                            isSelected ? "border-primary bg-primary/10" : "border-border/50 hover:border-border"
                          } ${!hasVoted ? "cursor-pointer" : "cursor-default"}`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-foreground">{opt.option_text}</span>
                            {hasVoted && <span className="text-[10px] text-muted-foreground">{pct}%</span>}
                          </div>
                          {hasVoted && <Progress value={pct} className="h-1" />}
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {polls.length === 0 && !loading && (
            <p className="text-center text-muted-foreground py-8 text-sm">No active polls yet. Create one!</p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default CommunityPolls;
