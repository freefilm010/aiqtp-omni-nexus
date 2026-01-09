import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { 
  Trophy, Plus, Gift, Users, Calendar, TrendingUp, 
  Medal, Target, Zap, Play, Pause, CheckCircle
} from "lucide-react";

interface Contest {
  id: string;
  title: string;
  description: string;
  token_id: string;
  prize_pool: number;
  prize_distribution: any;
  contest_type: string;
  start_date: string;
  end_date: string;
  status: string;
  max_participants: number;
  created_at: string;
}

interface Airdrop {
  id: string;
  name: string;
  token_id: string;
  total_amount: number;
  amount_per_user: number;
  distribution_type: string;
  max_recipients: number;
  claimed_count: number;
  status: string;
  start_date: string;
  end_date: string;
}

const CONTEST_TYPES = [
  { id: 'trading', name: 'Trading Competition', icon: TrendingUp },
  { id: 'referral', name: 'Referral Contest', icon: Users },
  { id: 'social', name: 'Social Challenge', icon: Zap },
  { id: 'quiz', name: 'Quiz Contest', icon: Target },
];

export default function ContestManager() {
  const [contests, setContests] = useState<Contest[]>([]);
  const [airdrops, setAirdrops] = useState<Airdrop[]>([]);
  const [tokens, setTokens] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showContestDialog, setShowContestDialog] = useState(false);
  const [showAirdropDialog, setShowAirdropDialog] = useState(false);

  const [newContest, setNewContest] = useState({
    title: '',
    description: '',
    token_id: '',
    prize_pool: 10000,
    contest_type: 'trading',
    start_date: '',
    end_date: '',
    max_participants: 1000,
    prize_distribution: { first: 50, second: 30, third: 20 },
  });

  const [newAirdrop, setNewAirdrop] = useState({
    name: '',
    token_id: '',
    total_amount: 100000,
    amount_per_user: 100,
    distribution_type: 'first_come',
    max_recipients: 1000,
    start_date: '',
    end_date: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [contestsRes, airdropsRes, tokensRes] = await Promise.all([
      supabase.from('token_contests').select('*').order('created_at', { ascending: false }),
      supabase.from('token_airdrops').select('*').order('created_at', { ascending: false }),
      supabase.from('platform_tokens').select('*').eq('is_active', true),
    ]);

    if (contestsRes.data) setContests(contestsRes.data);
    if (airdropsRes.data) setAirdrops(airdropsRes.data);
    if (tokensRes.data) setTokens(tokensRes.data);
    setLoading(false);
  };

  const createContest = async () => {
    const { error } = await supabase.from('token_contests').insert({
      title: newContest.title,
      description: newContest.description,
      token_id: newContest.token_id,
      prize_pool: newContest.prize_pool,
      prize_distribution: newContest.prize_distribution,
      contest_type: newContest.contest_type,
      start_date: newContest.start_date,
      end_date: newContest.end_date,
      max_participants: newContest.max_participants,
      status: 'draft',
    });

    if (error) {
      toast.error('Failed to create contest');
      console.error(error);
    } else {
      toast.success('Contest created successfully!');
      setShowContestDialog(false);
      fetchData();
    }
  };

  const createAirdrop = async () => {
    const { error } = await supabase.from('token_airdrops').insert({
      name: newAirdrop.name,
      token_id: newAirdrop.token_id,
      total_amount: newAirdrop.total_amount,
      amount_per_user: newAirdrop.amount_per_user,
      distribution_type: newAirdrop.distribution_type,
      max_recipients: newAirdrop.max_recipients,
      start_date: newAirdrop.start_date,
      end_date: newAirdrop.end_date,
      status: 'scheduled',
    });

    if (error) {
      toast.error('Failed to create airdrop');
      console.error(error);
    } else {
      toast.success('Airdrop campaign created!');
      setShowAirdropDialog(false);
      fetchData();
    }
  };

  const updateContestStatus = async (contest: Contest, status: string) => {
    const { error } = await supabase
      .from('token_contests')
      .update({ status })
      .eq('id', contest.id);

    if (error) {
      toast.error('Failed to update contest');
    } else {
      toast.success(`Contest ${status === 'active' ? 'started' : status}`);
      fetchData();
    }
  };

  const updateAirdropStatus = async (airdrop: Airdrop, status: string) => {
    const { error } = await supabase
      .from('token_airdrops')
      .update({ status })
      .eq('id', airdrop.id);

    if (error) {
      toast.error('Failed to update airdrop');
    } else {
      toast.success(`Airdrop ${status}`);
      fetchData();
    }
  };

  const getTokenSymbol = (tokenId: string) => {
    const token = tokens.find(t => t.id === tokenId);
    return token?.symbol || 'Unknown';
  };

  const formatNumber = (num: number) => {
    if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
    return num.toString();
  };

  const activeContests = contests.filter(c => c.status === 'active').length;
  const totalPrizePool = contests.reduce((acc, c) => acc + c.prize_pool, 0);
  const activeAirdrops = airdrops.filter(a => a.status === 'active').length;
  const totalAirdropAmount = airdrops.reduce((acc, a) => acc + a.total_amount, 0);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-yellow-500/20 to-yellow-500/5 border-yellow-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Contests</p>
                <p className="text-3xl font-bold">{activeContests}</p>
              </div>
              <Trophy className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/20 to-green-500/5 border-green-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Prizes</p>
                <p className="text-3xl font-bold">{formatNumber(totalPrizePool)}</p>
              </div>
              <Medal className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/20 to-purple-500/5 border-purple-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Airdrops</p>
                <p className="text-3xl font-bold">{activeAirdrops}</p>
              </div>
              <Gift className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/20 to-blue-500/5 border-blue-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Airdrop Pool</p>
                <p className="text-3xl font-bold">{formatNumber(totalAirdropAmount)}</p>
              </div>
              <Zap className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="contests" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="contests" className="gap-2">
              <Trophy className="h-4 w-4" /> Contests
            </TabsTrigger>
            <TabsTrigger value="airdrops" className="gap-2">
              <Gift className="h-4 w-4" /> Airdrops
            </TabsTrigger>
          </TabsList>

          <div className="flex gap-2">
            <Dialog open={showContestDialog} onOpenChange={setShowContestDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Trophy className="h-4 w-4" /> New Contest
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Contest</DialogTitle>
                  <DialogDescription>
                    Launch a competition to engage users and distribute tokens
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Contest Title</Label>
                      <Input
                        placeholder="Trading Championship Q1"
                        value={newContest.title}
                        onChange={(e) => setNewContest({ ...newContest, title: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Contest Type</Label>
                      <Select
                        value={newContest.contest_type}
                        onValueChange={(v) => setNewContest({ ...newContest, contest_type: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CONTEST_TYPES.map(type => (
                            <SelectItem key={type.id} value={type.id}>
                              <div className="flex items-center gap-2">
                                <type.icon className="h-4 w-4" />
                                {type.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      placeholder="Describe the contest rules and objectives..."
                      value={newContest.description}
                      onChange={(e) => setNewContest({ ...newContest, description: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Prize Token</Label>
                      <Select
                        value={newContest.token_id}
                        onValueChange={(v) => setNewContest({ ...newContest, token_id: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select token" />
                        </SelectTrigger>
                        <SelectContent>
                          {tokens.map(token => (
                            <SelectItem key={token.id} value={token.id}>
                              ${token.symbol}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Prize Pool</Label>
                      <Input
                        type="number"
                        value={newContest.prize_pool}
                        onChange={(e) => setNewContest({ ...newContest, prize_pool: Number(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Max Participants</Label>
                      <Input
                        type="number"
                        value={newContest.max_participants}
                        onChange={(e) => setNewContest({ ...newContest, max_participants: Number(e.target.value) })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Start Date</Label>
                      <Input
                        type="datetime-local"
                        value={newContest.start_date}
                        onChange={(e) => setNewContest({ ...newContest, start_date: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>End Date</Label>
                      <Input
                        type="datetime-local"
                        value={newContest.end_date}
                        onChange={(e) => setNewContest({ ...newContest, end_date: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-sm font-medium mb-2">Prize Distribution</p>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>🥇 1st Place: 50%</div>
                      <div>🥈 2nd Place: 30%</div>
                      <div>🥉 3rd Place: 20%</div>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowContestDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createContest} disabled={!newContest.title || !newContest.token_id}>
                    Create Contest
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={showAirdropDialog} onOpenChange={setShowAirdropDialog}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Gift className="h-4 w-4" /> New Airdrop
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Airdrop Campaign</DialogTitle>
                  <DialogDescription>
                    Distribute tokens to users through an airdrop
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label>Campaign Name</Label>
                    <Input
                      placeholder="Early Adopter Airdrop"
                      value={newAirdrop.name}
                      onChange={(e) => setNewAirdrop({ ...newAirdrop, name: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Token</Label>
                      <Select
                        value={newAirdrop.token_id}
                        onValueChange={(v) => setNewAirdrop({ ...newAirdrop, token_id: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select token" />
                        </SelectTrigger>
                        <SelectContent>
                          {tokens.map(token => (
                            <SelectItem key={token.id} value={token.id}>
                              ${token.symbol}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Distribution Type</Label>
                      <Select
                        value={newAirdrop.distribution_type}
                        onValueChange={(v) => setNewAirdrop({ ...newAirdrop, distribution_type: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="first_come">First Come First Serve</SelectItem>
                          <SelectItem value="random">Random Selection</SelectItem>
                          <SelectItem value="targeted">Targeted Users</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Total Amount</Label>
                      <Input
                        type="number"
                        value={newAirdrop.total_amount}
                        onChange={(e) => setNewAirdrop({ ...newAirdrop, total_amount: Number(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Per User</Label>
                      <Input
                        type="number"
                        value={newAirdrop.amount_per_user}
                        onChange={(e) => setNewAirdrop({ ...newAirdrop, amount_per_user: Number(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Max Recipients</Label>
                      <Input
                        type="number"
                        value={newAirdrop.max_recipients}
                        onChange={(e) => setNewAirdrop({ ...newAirdrop, max_recipients: Number(e.target.value) })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Start Date</Label>
                      <Input
                        type="datetime-local"
                        value={newAirdrop.start_date}
                        onChange={(e) => setNewAirdrop({ ...newAirdrop, start_date: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>End Date (optional)</Label>
                      <Input
                        type="datetime-local"
                        value={newAirdrop.end_date}
                        onChange={(e) => setNewAirdrop({ ...newAirdrop, end_date: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowAirdropDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createAirdrop} disabled={!newAirdrop.name || !newAirdrop.token_id}>
                    Create Airdrop
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <TabsContent value="contests">
          <Card>
            <CardHeader>
              <CardTitle>Contests & Competitions</CardTitle>
              <CardDescription>
                Manage trading contests, referral challenges, and more
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Contest</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Prize Token</TableHead>
                    <TableHead className="text-right">Prize Pool</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contests.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No contests created yet. Launch your first contest!
                      </TableCell>
                    </TableRow>
                  ) : (
                    contests.map(contest => (
                      <TableRow key={contest.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{contest.title}</p>
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {contest.description}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {CONTEST_TYPES.find(t => t.id === contest.contest_type)?.name || contest.contest_type}
                          </Badge>
                        </TableCell>
                        <TableCell>${getTokenSymbol(contest.token_id)}</TableCell>
                        <TableCell className="text-right font-mono">
                          {formatNumber(contest.prize_pool)}
                        </TableCell>
                        <TableCell className="text-sm">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(contest.start_date).toLocaleDateString()} - {new Date(contest.end_date).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            contest.status === 'active' ? 'default' :
                            contest.status === 'ended' ? 'secondary' : 'outline'
                          }>
                            {contest.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {contest.status === 'draft' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => updateContestStatus(contest, 'active')}
                              >
                                <Play className="h-4 w-4" />
                              </Button>
                            )}
                            {contest.status === 'active' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => updateContestStatus(contest, 'ended')}
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="airdrops">
          <Card>
            <CardHeader>
              <CardTitle>Airdrop Campaigns</CardTitle>
              <CardDescription>
                Distribute tokens to users through targeted airdrops
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campaign</TableHead>
                    <TableHead>Token</TableHead>
                    <TableHead>Distribution</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Per User</TableHead>
                    <TableHead className="text-right">Claims</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {airdrops.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        No airdrops created yet. Create your first airdrop campaign!
                      </TableCell>
                    </TableRow>
                  ) : (
                    airdrops.map(airdrop => (
                      <TableRow key={airdrop.id}>
                        <TableCell className="font-medium">{airdrop.name}</TableCell>
                        <TableCell>${getTokenSymbol(airdrop.token_id)}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {airdrop.distribution_type.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatNumber(airdrop.total_amount)}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatNumber(airdrop.amount_per_user)}
                        </TableCell>
                        <TableCell className="text-right">
                          {airdrop.claimed_count} / {airdrop.max_recipients}
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            airdrop.status === 'active' ? 'default' :
                            airdrop.status === 'completed' ? 'secondary' : 'outline'
                          }>
                            {airdrop.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {airdrop.status === 'scheduled' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => updateAirdropStatus(airdrop, 'active')}
                              >
                                <Play className="h-4 w-4" />
                              </Button>
                            )}
                            {airdrop.status === 'active' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => updateAirdropStatus(airdrop, 'completed')}
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
