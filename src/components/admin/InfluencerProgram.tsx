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
  Users, Plus, Send as TelegramIcon, TrendingUp, DollarSign, UserPlus, Gift, Star, Crown, Diamond } from "lucide-react";
import { Twitter, Youtube, Instagram } from "@/lib/icons/brand-icons";

interface Influencer {
  id: string;
  name: string;
  email: string;
  platform: string;
  handle: string;
  follower_count: number;
  tier: string;
  referral_code: string;
  commission_rate: number;
  total_referrals: number;
  total_earnings: number;
  status: string;
  created_at: string;
}

const PLATFORMS = [
  { id: 'twitter', name: 'Twitter/X', icon: Twitter },
  { id: 'youtube', name: 'YouTube', icon: Youtube },
  { id: 'instagram', name: 'Instagram', icon: Instagram },
  { id: 'telegram', name: 'Telegram', icon: TelegramIcon },
  { id: 'tiktok', name: 'TikTok', icon: TrendingUp },
];

const TIERS = [
  { id: 'bronze', name: 'Bronze', color: 'bg-orange-600', commission: 10 },
  { id: 'silver', name: 'Silver', color: 'bg-gray-400', commission: 15 },
  { id: 'gold', name: 'Gold', color: 'bg-yellow-500', commission: 20 },
  { id: 'platinum', name: 'Platinum', color: 'bg-cyan-400', commission: 25 },
  { id: 'diamond', name: 'Diamond', color: 'bg-purple-500', commission: 30 },
];

export default function InfluencerProgram() {
  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showAllocateDialog, setShowAllocateDialog] = useState(false);
  const [selectedInfluencer, setSelectedInfluencer] = useState<Influencer | null>(null);

  const [newInfluencer, setNewInfluencer] = useState({
    name: '',
    email: '',
    platform: 'twitter',
    handle: '',
    follower_count: 0,
    tier: 'bronze',
  });

  const [tokenAllocation, setTokenAllocation] = useState({
    token_symbol: 'QTC',
    amount: 10000,
    message: '',
  });

  useEffect(() => {
    fetchInfluencers();
  }, []);

  const fetchInfluencers = async () => {
    const { data, error } = await supabase
      .from('influencer_partners')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to load influencers');
      console.error(error);
    } else {
      setInfluencers(data || []);
    }
    setLoading(false);
  };

  const generateReferralCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'AIQTP-';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const inviteInfluencer = async () => {
    const referralCode = generateReferralCode();
    const tierInfo = TIERS.find(t => t.id === newInfluencer.tier);

    const { error } = await supabase.from('influencer_partners').insert({
      name: newInfluencer.name,
      email: newInfluencer.email,
      platform: newInfluencer.platform,
      handle: newInfluencer.handle,
      follower_count: newInfluencer.follower_count,
      tier: newInfluencer.tier,
      referral_code: referralCode,
      commission_rate: tierInfo?.commission || 10,
      status: 'pending',
    });

    if (error) {
      toast.error('Failed to invite influencer');
      console.error(error);
    } else {
      toast.success(`Invitation sent to ${newInfluencer.name}!`);
      setShowInviteDialog(false);
      fetchInfluencers();
      setNewInfluencer({
        name: '',
        email: '',
        platform: 'twitter',
        handle: '',
        follower_count: 0,
        tier: 'bronze',
      });
    }
  };

  const updateInfluencerStatus = async (influencer: Influencer, status: string) => {
    const updates: any = { status };
    if (status === 'active') {
      updates.onboarded_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('influencer_partners')
      .update(updates)
      .eq('id', influencer.id);

    if (error) {
      toast.error('Failed to update status');
    } else {
      toast.success(`${influencer.name} is now ${status}`);
      fetchInfluencers();
    }
  };

  const allocateTokens = async () => {
    // In a real implementation, this would transfer tokens
    toast.success(`Allocated ${tokenAllocation.amount} ${tokenAllocation.token_symbol} to ${selectedInfluencer?.name}`);
    setShowAllocateDialog(false);
  };

  const getPlatformIcon = (platform: string) => {
    const platformInfo = PLATFORMS.find(p => p.id === platform);
    const Icon = platformInfo?.icon || Users;
    return <Icon className="h-4 w-4" />;
  };

  const getTierBadge = (tier: string) => {
    const tierInfo = TIERS.find(t => t.id === tier);
    return (
      <Badge className={`${tierInfo?.color || 'bg-muted'} text-white`}>
        {tierInfo?.name || tier}
      </Badge>
    );
  };

  const formatNumber = (num: number) => {
    if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
    return num.toString();
  };

  const totalInfluencers = influencers.length;
  const activeInfluencers = influencers.filter(i => i.status === 'active').length;
  const totalReferrals = influencers.reduce((acc, i) => acc + i.total_referrals, 0);
  const totalEarnings = influencers.reduce((acc, i) => acc + i.total_earnings, 0);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary/20 to-primary/5 border-primary/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Partners</p>
                <p className="text-3xl font-bold">{totalInfluencers}</p>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/20 to-green-500/5 border-green-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-3xl font-bold">{activeInfluencers}</p>
              </div>
              <Star className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/20 to-blue-500/5 border-blue-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Referrals</p>
                <p className="text-3xl font-bold">{formatNumber(totalReferrals)}</p>
              </div>
              <UserPlus className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/20 to-purple-500/5 border-purple-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Payouts</p>
                <p className="text-3xl font-bold">${formatNumber(totalEarnings)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="partners" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="partners" className="gap-2">
              <Users className="h-4 w-4" /> Partners
            </TabsTrigger>
            <TabsTrigger value="tiers" className="gap-2">
              <Crown className="h-4 w-4" /> Tier System
            </TabsTrigger>
          </TabsList>

          <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" /> Invite Partner
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite Influencer Partner</DialogTitle>
                <DialogDescription>
                  Send an invitation to join the AIQTP influencer program
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input
                      placeholder="Full name"
                      value={newInfluencer.name}
                      onChange={(e) => setNewInfluencer({ ...newInfluencer, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      placeholder="email@example.com"
                      value={newInfluencer.email}
                      onChange={(e) => setNewInfluencer({ ...newInfluencer, email: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Platform</Label>
                    <Select
                      value={newInfluencer.platform}
                      onValueChange={(v) => setNewInfluencer({ ...newInfluencer, platform: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PLATFORMS.map(platform => (
                          <SelectItem key={platform.id} value={platform.id}>
                            <div className="flex items-center gap-2">
                              <platform.icon className="h-4 w-4" />
                              {platform.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Handle</Label>
                    <Input
                      placeholder="@username"
                      value={newInfluencer.handle}
                      onChange={(e) => setNewInfluencer({ ...newInfluencer, handle: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Followers</Label>
                    <Input
                      type="number"
                      placeholder="10000"
                      value={newInfluencer.follower_count}
                      onChange={(e) => setNewInfluencer({ ...newInfluencer, follower_count: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Starting Tier</Label>
                    <Select
                      value={newInfluencer.tier}
                      onValueChange={(v) => setNewInfluencer({ ...newInfluencer, tier: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TIERS.map(tier => (
                          <SelectItem key={tier.id} value={tier.id}>
                            {tier.name} ({tier.commission}% commission)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={inviteInfluencer} disabled={!newInfluencer.name || !newInfluencer.email}>
                  Send Invitation
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <TabsContent value="partners">
          <Card>
            <CardHeader>
              <CardTitle>Influencer Partners</CardTitle>
              <CardDescription>
                Manage influencer partnerships and token allocations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Partner</TableHead>
                    <TableHead>Platform</TableHead>
                    <TableHead>Followers</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead>Referral Code</TableHead>
                    <TableHead className="text-right">Referrals</TableHead>
                    <TableHead className="text-right">Earnings</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {influencers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                        No influencer partners yet. Start by inviting one!
                      </TableCell>
                    </TableRow>
                  ) : (
                    influencers.map(influencer => (
                      <TableRow key={influencer.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{influencer.name}</p>
                            <p className="text-xs text-muted-foreground">{influencer.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getPlatformIcon(influencer.platform)}
                            <span>{influencer.handle}</span>
                          </div>
                        </TableCell>
                        <TableCell>{formatNumber(influencer.follower_count)}</TableCell>
                        <TableCell>{getTierBadge(influencer.tier)}</TableCell>
                        <TableCell>
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            {influencer.referral_code}
                          </code>
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {influencer.total_referrals}
                        </TableCell>
                        <TableCell className="text-right font-mono text-green-500">
                          ${influencer.total_earnings.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            influencer.status === 'active' ? 'default' :
                            influencer.status === 'pending' ? 'secondary' : 'destructive'
                          }>
                            {influencer.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {influencer.status === 'pending' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => updateInfluencerStatus(influencer, 'active')}
                              >
                                Activate
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedInfluencer(influencer);
                                setShowAllocateDialog(true);
                              }}
                            >
                              <Gift className="h-4 w-4" />
                            </Button>
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

        <TabsContent value="tiers">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {TIERS.map(tier => (
              <Card key={tier.id} className={`border-2 ${
                tier.id === 'diamond' ? 'border-purple-500 bg-purple-500/5' :
                tier.id === 'platinum' ? 'border-cyan-400 bg-cyan-400/5' :
                tier.id === 'gold' ? 'border-yellow-500 bg-yellow-500/5' :
                tier.id === 'silver' ? 'border-gray-400 bg-gray-400/5' :
                'border-orange-600 bg-orange-600/5'
              }`}>
                <CardHeader className="text-center">
                  <div className={`mx-auto w-12 h-12 rounded-full ${tier.color} flex items-center justify-center`}>
                    {tier.id === 'diamond' ? <Diamond className="h-6 w-6 text-white" /> :
                     tier.id === 'platinum' || tier.id === 'gold' ? <Crown className="h-6 w-6 text-white" /> :
                     <Star className="h-6 w-6 text-white" />}
                  </div>
                  <CardTitle className="text-lg">{tier.name}</CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                  <div>
                    <p className="text-3xl font-bold">{tier.commission}%</p>
                    <p className="text-sm text-muted-foreground">Commission</p>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {tier.id === 'bronze' && 'Entry level partnership'}
                    {tier.id === 'silver' && '5+ successful referrals'}
                    {tier.id === 'gold' && '25+ referrals, 50K+ reach'}
                    {tier.id === 'platinum' && '100+ referrals, verified'}
                    {tier.id === 'diamond' && 'Elite partner status'}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Token Allocation Dialog */}
      <Dialog open={showAllocateDialog} onOpenChange={setShowAllocateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Allocate Tokens to {selectedInfluencer?.name}</DialogTitle>
            <DialogDescription>
              Gift tokens as part of the influencer partnership
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Token</Label>
                <Select
                  value={tokenAllocation.token_symbol}
                  onValueChange={(v) => setTokenAllocation({ ...tokenAllocation, token_symbol: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="QTC">$QTC</SelectItem>
                    <SelectItem value="QAQI">$QAQI</SelectItem>
                    <SelectItem value="AIQTP">$AIQTP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Amount</Label>
                <Input
                  type="number"
                  value={tokenAllocation.amount}
                  onChange={(e) => setTokenAllocation({ ...tokenAllocation, amount: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Message (optional)</Label>
              <Textarea
                placeholder="Welcome to the AIQTP partnership program..."
                value={tokenAllocation.message}
                onChange={(e) => setTokenAllocation({ ...tokenAllocation, message: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAllocateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={allocateTokens}>
              Allocate Tokens
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
