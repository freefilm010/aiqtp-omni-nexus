import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  Trophy,
  Star,
  Award,
  Crown,
  Zap,
  Target,
  Users,
  TrendingUp,
  Sparkles,
  Lock,
  CheckCircle
} from "lucide-react";

interface Achievement {
  id: string;
  achievement_type: string;
  achievement_name: string;
  description: string;
  points: number;
  tier: string;
  unlocked_at: string;
}

interface AchievementDef {
  id: string;
  name: string;
  description: string;
  category: string;
  points: number;
}

interface EliteStatus {
  tier: string;
  lifetime_earnings: number;
  total_strategies_graduated: number;
  perks: Record<string, boolean>;
}

const TIER_COLORS: Record<string, string> = {
  bronze: "bg-amber-700",
  silver: "bg-slate-400",
  gold: "bg-amber-500",
  platinum: "bg-slate-300",
  diamond: "bg-cyan-400"
};

const TIER_ICONS: Record<string, any> = {
  bronze: Star,
  silver: Star,
  gold: Trophy,
  platinum: Crown,
  diamond: Sparkles
};

const CATEGORY_ICONS: Record<string, any> = {
  strategy: Target,
  trading: TrendingUp,
  community: Users,
  milestone: Award
};

const AchievementsPanel = () => {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [allAchievements, setAllAchievements] = useState<AchievementDef[]>([]);
  const [eliteStatus, setEliteStatus] = useState<EliteStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      // Fetch user's unlocked achievements
      const { data: userAchievements } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', user?.id);

      setAchievements((userAchievements as Achievement[]) || []);

      // Fetch all achievement definitions
      const { data: defs } = await supabase
        .from('achievement_definitions')
        .select('*');

      setAllAchievements((defs as AchievementDef[]) || []);

      // Fetch elite club status
      const { data: elite } = await supabase
        .from('elite_club_members')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (elite) {
        setEliteStatus(elite as EliteStatus);
      }
    } catch (err) {
      console.error('Error fetching achievements:', err);
    } finally {
      setLoading(false);
    }
  };

  const totalPoints = achievements.reduce((sum, a) => sum + a.points, 0);
  const unlockedIds = new Set(achievements.map(a => a.achievement_type));

  const achievementsByCategory = allAchievements.reduce((acc, def) => {
    if (!acc[def.category]) acc[def.category] = [];
    acc[def.category].push({
      ...def,
      unlocked: unlockedIds.has(def.id)
    });
    return acc;
  }, {} as Record<string, (AchievementDef & { unlocked: boolean })[]>);

  return (
    <div className="space-y-6">
      {/* Stats Header */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Trophy className="h-8 w-8 text-amber-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Points</p>
                <p className="text-3xl font-bold">{totalPoints}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Award className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Achievements</p>
                <p className="text-3xl font-bold">
                  {achievements.length}/{allAchievements.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={eliteStatus ? "border-amber-500 bg-amber-500/5" : ""}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Crown className={`h-8 w-8 ${eliteStatus ? 'text-amber-500' : 'text-muted-foreground'}`} />
              <div>
                <p className="text-sm text-muted-foreground">Elite Status</p>
                <p className="text-xl font-bold capitalize">
                  {eliteStatus?.tier || 'Not Yet'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Zap className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Strategies Graduated</p>
                <p className="text-3xl font-bold">
                  {eliteStatus?.total_strategies_graduated || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Elite Club Card */}
      {eliteStatus && (
        <Card className="border-amber-500 bg-gradient-to-r from-amber-500/10 to-orange-500/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-amber-500" />
              Elite Creators Club Member
            </CardTitle>
            <CardDescription>
              You've earned exclusive perks for your successful strategies
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 rounded-lg bg-background/50 text-center">
                <Sparkles className="h-6 w-6 mx-auto text-amber-500 mb-1" />
                <p className="text-sm font-medium">Exclusive Chat</p>
                <p className="text-xs text-muted-foreground">Access granted</p>
              </div>
              <div className="p-3 rounded-lg bg-background/50 text-center">
                <TrendingUp className="h-6 w-6 mx-auto text-green-500 mb-1" />
                <p className="text-sm font-medium">25% Profit Share</p>
                <p className="text-xs text-muted-foreground">Lifetime earnings</p>
              </div>
              <div className="p-3 rounded-lg bg-background/50 text-center">
                <Target className="h-6 w-6 mx-auto text-blue-500 mb-1" />
                <p className="text-sm font-medium">Priority Testing</p>
                <p className="text-xs text-muted-foreground">Faster graduation</p>
              </div>
              <div className="p-3 rounded-lg bg-background/50 text-center">
                <Award className="h-6 w-6 mx-auto text-purple-500 mb-1" />
                <p className="text-sm font-medium">Creator Badge</p>
                <p className="text-xs text-muted-foreground">Profile highlight</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Achievements by Category */}
      <Card>
        <CardHeader>
          <CardTitle>All Achievements</CardTitle>
          <CardDescription>
            Unlock achievements by using the platform and creating successful strategies
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="strategy">
            <TabsList className="mb-4 flex-wrap">
              {Object.keys(achievementsByCategory).map(category => {
                const Icon = CATEGORY_ICONS[category] || Star;
                const unlocked = achievementsByCategory[category]?.filter(a => a.unlocked).length || 0;
                const total = achievementsByCategory[category]?.length || 0;
                return (
                  <TabsTrigger key={category} value={category} className="capitalize">
                    <Icon className="h-4 w-4 mr-1" />
                    {category} ({unlocked}/{total})
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {Object.entries(achievementsByCategory).map(([category, items]) => (
              <TabsContent key={category} value={category}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {items.map(achievement => (
                    <Card 
                      key={achievement.id}
                      className={`transition-all ${
                        achievement.unlocked 
                          ? 'border-primary/50 bg-primary/5' 
                          : 'opacity-60'
                      }`}
                    >
                      <CardContent className="pt-4">
                        <div className="flex items-start gap-3">
                          <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${
                            achievement.unlocked 
                              ? 'bg-primary text-primary-foreground' 
                              : 'bg-muted text-muted-foreground'
                          }`}>
                            {achievement.unlocked ? (
                              <CheckCircle className="h-6 w-6" />
                            ) : (
                              <Lock className="h-6 w-6" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium">{achievement.name}</h4>
                              <Badge variant="secondary">
                                +{achievement.points} pts
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {achievement.description}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AchievementsPanel;
