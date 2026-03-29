import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Lightbulb, ThumbsUp, MessageSquare, TrendingUp, Clock,
  CheckCircle2, Circle, Loader2, Send, Sparkles, Flame
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Suggestion {
  id: string;
  title: string;
  description: string;
  user_id: string;
  votes: number;
  comments: number;
  status: string;
  category: string;
  created_at: string;
  is_hot: boolean;
}

interface MarketplaceSuggestionsProps {
  marketType: "nft" | "strategy" | "token" | "general";
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "completed": return "bg-green-500";
    case "in_progress": return "bg-blue-500";
    case "planned": return "bg-purple-500";
    case "under_review": return "bg-yellow-500";
    case "declined": return "bg-red-500";
    default: return "bg-muted";
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case "completed": return <CheckCircle2 className="h-3 w-3" />;
    case "in_progress": return <Loader2 className="h-3 w-3 animate-spin" />;
    case "planned": return <Clock className="h-3 w-3" />;
    default: return <Circle className="h-3 w-3" />;
  }
};

export const MarketplaceSuggestions = ({ marketType }: MarketplaceSuggestionsProps) => {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [voted, setVoted] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<"votes" | "recent">("votes");
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [loading, setLoading] = useState(true);

  const loadSuggestions = useCallback(async () => {
    const { data } = await supabase
      .from("marketplace_suggestions" as any)
      .select("*")
      .order(sortBy === "votes" ? "votes" : "created_at", { ascending: false }) as any;
    if (data) setSuggestions(data);

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: myVotes } = await supabase
        .from("suggestion_votes" as any)
        .select("suggestion_id")
        .eq("user_id", user.id) as any;
      if (myVotes) setVoted(myVotes.map((v: any) => v.suggestion_id));
    }
    setLoading(false);
  }, [sortBy]);

  useEffect(() => { loadSuggestions(); }, [loadSuggestions]);

  const handleVote = async (id: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error("Sign in to vote"); return; }

    if (voted.includes(id)) {
      await supabase.from("suggestion_votes" as any).delete().eq("suggestion_id", id).eq("user_id", user.id);
      await supabase.from("marketplace_suggestions" as any).update({ votes: suggestions.find(s => s.id === id)!.votes - 1 } as any).eq("id", id);
      setVoted(prev => prev.filter(v => v !== id));
    } else {
      await supabase.from("suggestion_votes" as any).insert({ suggestion_id: id, user_id: user.id } as any);
      await supabase.from("marketplace_suggestions" as any).update({ votes: suggestions.find(s => s.id === id)!.votes + 1 } as any).eq("id", id);
      setVoted(prev => [...prev, id]);
      toast.success("Vote recorded!");
    }
    loadSuggestions();
  };

  const handleSubmit = async () => {
    if (!newTitle.trim() || !newDesc.trim()) { toast.error("Please fill in all fields"); return; }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error("Sign in first"); return; }

    const category = marketType === "nft" ? "NFT" : marketType === "strategy" ? "Strategy" : marketType === "token" ? "Token" : "Platform";
    await supabase.from("marketplace_suggestions" as any).insert({
      user_id: user.id,
      title: newTitle,
      description: newDesc,
      category,
    } as any);

    toast.success("Suggestion submitted!");
    setNewTitle("");
    setNewDesc("");
    setShowForm(false);
    loadSuggestions();
  };

  const filteredSuggestions = suggestions.filter(s => {
    if (marketType === "nft") return s.category === "NFT" || s.category === "Platform";
    if (marketType === "strategy") return s.category === "Strategy" || s.category === "Trading";
    if (marketType === "token") return s.category === "Token" || s.category === "Trading";
    return true;
  });

  const totalVotes = filteredSuggestions.reduce((sum, s) => sum + s.votes, 0);
  const completedCount = filteredSuggestions.filter(s => s.status === "completed").length;

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <Card className="bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 border-purple-500/30">
        <CardContent className="py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500">
                <Lightbulb className="h-8 w-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Community Suggestions</h2>
                <p className="text-muted-foreground">Vote on features and shape the platform's future</p>
              </div>
            </div>
            <div className="flex gap-6 text-center">
              <div>
                <p className="text-2xl font-bold text-primary">{filteredSuggestions.length}</p>
                <p className="text-xs text-muted-foreground">Ideas</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-500">{completedCount}</p>
                <p className="text-xs text-muted-foreground">Shipped</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-500">{totalVotes}</p>
                <p className="text-xs text-muted-foreground">Votes</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submit New */}
      <Card>
        <CardContent className="py-4">
          {!showForm ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Sparkles className="h-5 w-5 text-primary" />
                <span className="font-medium">Have an idea? Share it with the community!</span>
              </div>
              <Button onClick={() => setShowForm(true)}><Send className="h-4 w-4 mr-2" />Submit Suggestion</Button>
            </div>
          ) : (
            <div className="space-y-4">
              <Input placeholder="Suggestion title..." value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
              <Textarea placeholder="Describe your idea in detail..." value={newDesc} onChange={(e) => setNewDesc(e.target.value)} rows={3} />
              <div className="flex gap-2">
                <Button onClick={handleSubmit}>Submit</Button>
                <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sort */}
      <div className="flex gap-2">
        <Button variant={sortBy === "votes" ? "default" : "outline"} size="sm" onClick={() => setSortBy("votes")}>
          <TrendingUp className="h-4 w-4 mr-1" />Top Voted
        </Button>
        <Button variant={sortBy === "recent" ? "default" : "outline"} size="sm" onClick={() => setSortBy("recent")}>
          <Clock className="h-4 w-4 mr-1" />Recent
        </Button>
      </div>

      {/* List */}
      <div className="space-y-4">
        {loading ? (
          <Card><CardContent className="py-8 text-center text-muted-foreground">Loading suggestions...</CardContent></Card>
        ) : filteredSuggestions.length === 0 ? (
          <Card><CardContent className="py-8 text-center text-muted-foreground">No suggestions yet — be the first!</CardContent></Card>
        ) : filteredSuggestions.map(suggestion => (
          <Card key={suggestion.id} className="hover:border-primary/50 transition-colors">
            <CardContent className="py-4">
              <div className="flex gap-4">
                <div className="flex flex-col items-center gap-1">
                  <Button
                    variant={voted.includes(suggestion.id) ? "default" : "outline"}
                    size="sm"
                    className="h-12 w-12"
                    onClick={() => handleVote(suggestion.id)}
                  >
                    <ThumbsUp className="h-5 w-5" />
                  </Button>
                  <span className="font-bold text-lg">{suggestion.votes}</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{suggestion.title}</h3>
                        {suggestion.is_hot && (
                          <Badge className="bg-orange-500 gap-1"><Flame className="h-3 w-3" />Hot</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{suggestion.description}</p>
                    </div>
                    <Badge className={`${getStatusColor(suggestion.status)} gap-1`}>
                      {getStatusIcon(suggestion.status)}
                      {suggestion.status.replace("_", " ")}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />{suggestion.comments} comments
                    </span>
                    <Badge variant="outline">{suggestion.category}</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default MarketplaceSuggestions;
