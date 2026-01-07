import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Trophy,
  Clock,
  Users,
  Gift,
  Star,
  TrendingUp,
  Zap,
  Crown,
  Medal,
  Target,
  Flame,
  Award
} from "lucide-react";

interface Competition {
  id: string;
  name: string;
  description: string;
  type: "trading" | "nft" | "strategy" | "community";
  prizePool: string;
  participants: number;
  maxParticipants: number;
  startDate: Date;
  endDate: Date;
  status: "active" | "upcoming" | "ended";
  requirements: string[];
  prizes: { place: string; prize: string }[];
}

interface MarketplaceCompetitionsProps {
  marketType: "nft" | "strategy" | "token" | "general";
}

const mockCompetitions: Competition[] = [
  {
    id: "1",
    name: "Weekly Trading Challenge",
    description: "Compete for the highest returns using AI trading bots",
    type: "trading",
    prizePool: "$10,000 USDC",
    participants: 847,
    maxParticipants: 1000,
    startDate: new Date(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    status: "active",
    requirements: ["$20 minimum deposit", "Use any graduated bot"],
    prizes: [
      { place: "1st", prize: "$5,000 USDC" },
      { place: "2nd", prize: "$3,000 USDC" },
      { place: "3rd", prize: "$2,000 USDC" }
    ]
  },
  {
    id: "2",
    name: "NFT Creator Showcase",
    description: "Submit your best NFT artwork for community voting",
    type: "nft",
    prizePool: "5 ETH + Promotion",
    participants: 234,
    maxParticipants: 500,
    startDate: new Date(),
    endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    status: "active",
    requirements: ["Original artwork only", "Mint on AIQTP platform"],
    prizes: [
      { place: "1st", prize: "3 ETH + Featured spot" },
      { place: "2nd", prize: "1.5 ETH" },
      { place: "3rd", prize: "0.5 ETH" }
    ]
  },
  {
    id: "3",
    name: "Strategy Builder Sprint",
    description: "Build the best performing strategy in 48 hours",
    type: "strategy",
    prizePool: "$25,000 + Lifetime Revenue Share",
    participants: 0,
    maxParticipants: 200,
    startDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    status: "upcoming",
    requirements: ["Pass graduation threshold", "Submit backtests"],
    prizes: [
      { place: "1st", prize: "$15,000 + 10% lifetime share" },
      { place: "2nd", prize: "$7,000 + 5% lifetime share" },
      { place: "3rd", prize: "$3,000 + 2% lifetime share" }
    ]
  },
  {
    id: "4",
    name: "Community Referral Race",
    description: "Invite friends and earn bonus rewards",
    type: "community",
    prizePool: "$5,000 in bonus credits",
    participants: 1250,
    maxParticipants: 5000,
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
    status: "active",
    requirements: ["Valid referrals only", "Referees must trade $100+"],
    prizes: [
      { place: "Top 10", prize: "$500 each" },
      { place: "Top 50", prize: "$50 each" },
      { place: "All", prize: "10% of referral fees" }
    ]
  }
];

const getTimeRemaining = (endDate: Date) => {
  const diff = endDate.getTime() - Date.now();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  if (days > 0) return `${days}d ${hours}h left`;
  return `${hours}h left`;
};

const getTypeIcon = (type: string) => {
  switch (type) {
    case "trading": return <TrendingUp className="h-4 w-4" />;
    case "nft": return <Star className="h-4 w-4" />;
    case "strategy": return <Target className="h-4 w-4" />;
    case "community": return <Users className="h-4 w-4" />;
    default: return <Trophy className="h-4 w-4" />;
  }
};

export const MarketplaceCompetitions = ({ marketType }: MarketplaceCompetitionsProps) => {
  const [activeTab, setActiveTab] = useState("active");

  const filteredCompetitions = mockCompetitions.filter(c => {
    if (marketType === "nft") return c.type === "nft" || c.type === "community";
    if (marketType === "strategy") return c.type === "strategy" || c.type === "trading";
    if (marketType === "token") return c.type === "trading" || c.type === "community";
    return true;
  });

  const activeComps = filteredCompetitions.filter(c => c.status === "active");
  const upcomingComps = filteredCompetitions.filter(c => c.status === "upcoming");

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <Card className="bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-red-500/20 border-amber-500/30">
        <CardContent className="py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500">
                <Trophy className="h-8 w-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Competitions & Contests</h2>
                <p className="text-muted-foreground">Compete to win prizes and earn recognition</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Total Prize Pool</p>
              <p className="text-3xl font-bold text-amber-500">$40,000+</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="active" className="gap-2">
            <Flame className="h-4 w-4" />
            Active ({activeComps.length})
          </TabsTrigger>
          <TabsTrigger value="upcoming" className="gap-2">
            <Clock className="h-4 w-4" />
            Upcoming ({upcomingComps.length})
          </TabsTrigger>
          <TabsTrigger value="leaderboard" className="gap-2">
            <Crown className="h-4 w-4" />
            Leaderboards
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4 mt-4">
          <div className="grid md:grid-cols-2 gap-4">
            {activeComps.map(comp => (
              <Card key={comp.id} className="hover:border-primary/50 transition-colors">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="gap-1">
                        {getTypeIcon(comp.type)}
                        {comp.type}
                      </Badge>
                      <Badge className="bg-green-500">Live</Badge>
                    </div>
                    <div className="flex items-center gap-1 text-amber-500">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm font-medium">{getTimeRemaining(comp.endDate)}</span>
                    </div>
                  </div>
                  <CardTitle className="mt-2">{comp.name}</CardTitle>
                  <CardDescription>{comp.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Gift className="h-4 w-4 text-amber-500" />
                      <span className="font-bold text-amber-500">{comp.prizePool}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      {comp.participants}/{comp.maxParticipants}
                    </div>
                  </div>
                  
                  <Progress value={(comp.participants / comp.maxParticipants) * 100} className="h-2" />
                  
                  <div className="flex flex-wrap gap-2">
                    {comp.prizes.slice(0, 3).map((prize, i) => (
                      <Badge key={i} variant="secondary" className="gap-1">
                        {i === 0 ? <Crown className="h-3 w-3 text-amber-500" /> : 
                         i === 1 ? <Medal className="h-3 w-3 text-gray-400" /> :
                         <Award className="h-3 w-3 text-amber-700" />}
                        {prize.place}: {prize.prize}
                      </Badge>
                    ))}
                  </div>

                  <Button className="w-full">
                    <Zap className="h-4 w-4 mr-2" />
                    Join Competition
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="upcoming" className="space-y-4 mt-4">
          <div className="grid md:grid-cols-2 gap-4">
            {upcomingComps.map(comp => (
              <Card key={comp.id} className="hover:border-primary/50 transition-colors opacity-90">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="gap-1">
                        {getTypeIcon(comp.type)}
                        {comp.type}
                      </Badge>
                      <Badge variant="secondary">Coming Soon</Badge>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm">Starts in 3 days</span>
                    </div>
                  </div>
                  <CardTitle className="mt-2">{comp.name}</CardTitle>
                  <CardDescription>{comp.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Gift className="h-4 w-4 text-amber-500" />
                    <span className="font-bold text-amber-500">{comp.prizePool}</span>
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    <p className="font-medium mb-1">Requirements:</p>
                    <ul className="list-disc list-inside space-y-1">
                      {comp.requirements.map((req, i) => (
                        <li key={i}>{req}</li>
                      ))}
                    </ul>
                  </div>

                  <Button variant="outline" className="w-full">
                    Get Notified
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="leaderboard" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-amber-500" />
                Top Performers This Week
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { rank: 1, name: "CryptoKing_42", score: "247.3%", prize: "$5,000" },
                  { rank: 2, name: "AlphaTrader", score: "198.7%", prize: "$3,000" },
                  { rank: 3, name: "QuantWizard", score: "156.2%", prize: "$2,000" },
                  { rank: 4, name: "DeFiMaster", score: "134.8%", prize: "$500" },
                  { rank: 5, name: "BotBuilder99", score: "128.4%", prize: "$500" },
                ].map(user => (
                  <div key={user.rank} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        user.rank === 1 ? 'bg-amber-500' :
                        user.rank === 2 ? 'bg-gray-400' :
                        user.rank === 3 ? 'bg-amber-700' :
                        'bg-muted'
                      }`}>
                        <span className="font-bold text-white text-sm">{user.rank}</span>
                      </div>
                      <span className="font-medium">{user.name}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-green-500 font-bold">+{user.score}</span>
                      <Badge variant="outline" className="text-amber-500 border-amber-500">{user.prize}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MarketplaceCompetitions;
