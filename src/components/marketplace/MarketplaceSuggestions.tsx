import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Lightbulb,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  TrendingUp,
  Clock,
  CheckCircle2,
  Circle,
  Loader2,
  Send,
  Sparkles,
  Flame,
  Star
} from "lucide-react";
import { toast } from "sonner";

interface Suggestion {
  id: string;
  title: string;
  description: string;
  author: string;
  votes: number;
  comments: number;
  status: "new" | "under_review" | "planned" | "in_progress" | "completed" | "declined";
  category: string;
  createdAt: Date;
  isHot?: boolean;
}

interface MarketplaceSuggestionsProps {
  marketType: "nft" | "strategy" | "token" | "general";
}

const mockSuggestions: Suggestion[] = [
  {
    id: "1",
    title: "Add cross-chain NFT bridging",
    description: "Allow users to move NFTs between Ethereum, Polygon, and Solana seamlessly",
    author: "CryptoDesigner",
    votes: 342,
    comments: 28,
    status: "planned",
    category: "NFT",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    isHot: true
  },
  {
    id: "2",
    title: "Strategy performance comparison tool",
    description: "Side-by-side comparison of multiple strategies with detailed metrics",
    author: "QuantTrader",
    votes: 256,
    comments: 15,
    status: "in_progress",
    category: "Strategy",
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
  },
  {
    id: "3",
    title: "Mobile push notifications for trades",
    description: "Get instant alerts when bot executes trades or hits targets",
    author: "MobileFirst",
    votes: 189,
    comments: 12,
    status: "under_review",
    category: "Platform",
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  },
  {
    id: "4",
    title: "NFT rarity analyzer integration",
    description: "Auto-analyze rarity scores for any NFT collection on listing",
    author: "NFTHunter",
    votes: 145,
    comments: 8,
    status: "new",
    category: "NFT",
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
  },
  {
    id: "5",
    title: "Copy trading with profit limits",
    description: "Set max profit/loss limits when copying other traders",
    author: "SafeTrader",
    votes: 423,
    comments: 45,
    status: "completed",
    category: "Trading",
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    isHot: true
  },
  {
    id: "6",
    title: "Token launch countdown timers",
    description: "Visual countdown for upcoming token launches with alerts",
    author: "LaunchPad",
    votes: 98,
    comments: 6,
    status: "new",
    category: "Token",
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
  }
];

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
  const [voted, setVoted] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<"votes" | "recent">("votes");
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");

  const handleVote = (id: string) => {
    if (voted.includes(id)) {
      setVoted(prev => prev.filter(v => v !== id));
    } else {
      setVoted(prev => [...prev, id]);
      toast.success("Vote recorded!");
    }
  };

  const handleSubmit = () => {
    if (!newTitle.trim() || !newDesc.trim()) {
      toast.error("Please fill in all fields");
      return;
    }
    toast.success("Suggestion submitted! Community can now vote on it.");
    setNewTitle("");
    setNewDesc("");
    setShowForm(false);
  };

  const filteredSuggestions = mockSuggestions
    .filter(s => {
      if (marketType === "nft") return s.category === "NFT" || s.category === "Platform";
      if (marketType === "strategy") return s.category === "Strategy" || s.category === "Trading";
      if (marketType === "token") return s.category === "Token" || s.category === "Trading";
      return true;
    })
    .sort((a, b) => sortBy === "votes" ? b.votes - a.votes : b.createdAt.getTime() - a.createdAt.getTime());

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

      {/* Submit New Suggestion */}
      <Card>
        <CardContent className="py-4">
          {!showForm ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Sparkles className="h-5 w-5 text-primary" />
                <span className="font-medium">Have an idea? Share it with the community!</span>
              </div>
              <Button onClick={() => setShowForm(true)}>
                <Send className="h-4 w-4 mr-2" />
                Submit Suggestion
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <Input 
                placeholder="Suggestion title..." 
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
              />
              <Textarea 
                placeholder="Describe your idea in detail..."
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                rows={3}
              />
              <div className="flex gap-2">
                <Button onClick={handleSubmit}>Submit</Button>
                <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sort Options */}
      <div className="flex gap-2">
        <Button 
          variant={sortBy === "votes" ? "default" : "outline"} 
          size="sm"
          onClick={() => setSortBy("votes")}
        >
          <TrendingUp className="h-4 w-4 mr-1" />
          Top Voted
        </Button>
        <Button 
          variant={sortBy === "recent" ? "default" : "outline"} 
          size="sm"
          onClick={() => setSortBy("recent")}
        >
          <Clock className="h-4 w-4 mr-1" />
          Recent
        </Button>
      </div>

      {/* Suggestions List */}
      <div className="space-y-4">
        {filteredSuggestions.map(suggestion => (
          <Card key={suggestion.id} className="hover:border-primary/50 transition-colors">
            <CardContent className="py-4">
              <div className="flex gap-4">
                {/* Vote Button */}
                <div className="flex flex-col items-center gap-1">
                  <Button
                    variant={voted.includes(suggestion.id) ? "default" : "outline"}
                    size="sm"
                    className="h-12 w-12"
                    onClick={() => handleVote(suggestion.id)}
                  >
                    <ThumbsUp className={`h-5 w-5 ${voted.includes(suggestion.id) ? '' : ''}`} />
                  </Button>
                  <span className="font-bold text-lg">
                    {suggestion.votes + (voted.includes(suggestion.id) ? 1 : 0)}
                  </span>
                </div>

                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{suggestion.title}</h3>
                        {suggestion.isHot && (
                          <Badge className="bg-orange-500 gap-1">
                            <Flame className="h-3 w-3" />
                            Hot
                          </Badge>
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
                    <span>by {suggestion.author}</span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      {suggestion.comments} comments
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
