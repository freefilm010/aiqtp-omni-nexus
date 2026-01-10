import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import {
  Bot,
  Crown,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Zap,
  Shield,
  Star,
  Gem,
  Copy,
  Activity,
  Target,
  Award,
  Search,
  Filter,
  Grid3x3,
  List,
  Copyright,
  Bookmark,
  Clock,
  BarChart3
} from "lucide-react";
import { 
  GENESIS_BOT_COLLECTION, 
  BOT_PERSONAS, 
  BOT_PERFORMANCE,
  BotTradingCard,
  getCollectionStats
} from "@/lib/nft/botPersonaNFT";

const BotTradingCardGallery = () => {
  const [selectedCard, setSelectedCard] = useState<BotTradingCard | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [rarityFilter, setRarityFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('originals');
  const [view, setView] = useState<'grid' | 'list'>('grid');

  const stats = useMemo(() => getCollectionStats(), []);

  const allCards = useMemo(() => {
    return activeTab === 'originals' 
      ? GENESIS_BOT_COLLECTION.originals 
      : GENESIS_BOT_COLLECTION.clones;
  }, [activeTab]);

  const filteredCards = useMemo(() => {
    return allCards.filter(card => {
      const matchesSearch = card.botPersona.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        card.botPersona.codeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        card.botPersona.strategyType.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRarity = rarityFilter === 'all' || card.rarity === rarityFilter;
      return matchesSearch && matchesRarity;
    });
  }, [allCards, searchQuery, rarityFilter]);

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'Mythic': return 'bg-fuchsia-500/20 text-fuchsia-400 border-fuchsia-500/50 shadow-[0_0_20px_hsl(292,100%,50%,0.5)]';
      case 'Legendary': return 'bg-gold/20 text-gold border-gold/50 shadow-[0_0_20px_hsl(48,100%,55%,0.5)]';
      case 'Epic': return 'bg-royal-purple/20 text-royal-purple border-royal-purple/50 shadow-[0_0_15px_hsl(280,100%,65%,0.4)]';
      case 'Rare': return 'bg-royal-blue/20 text-royal-blue border-royal-blue/50';
      case 'Uncommon': return 'bg-accent/20 text-accent border-accent/50';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getPersonaColor = (color: string) => {
    const colorMap: Record<string, string> = {
      'neon-blue': 'from-royal-blue/30 to-royal-blue/10',
      'neon-green': 'from-accent/30 to-accent/10',
      'electric-yellow': 'from-gold/30 to-gold/10',
      'royal-purple': 'from-royal-purple/30 to-royal-purple/10',
      'forest-green': 'from-accent/25 to-emerald-900/10',
      'ghost-white': 'from-neon-cyan/20 to-white/5',
      'matrix-green': 'from-accent/35 to-emerald-500/10',
      'viper-red': 'from-royal-red/30 to-royal-red/10'
    };
    return colorMap[color] || 'from-muted to-card';
  };

  const getStatusIcon = (status: string) => {
    if (status === 'running') return <Activity className="w-3 h-3 text-accent animate-pulse" />;
    if (status === 'paused') return <Clock className="w-3 h-3 text-gold" />;
    return <Shield className="w-3 h-3 text-muted-foreground" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Bot className="h-6 w-6 text-royal-purple" />
            Bot Trading Cards™
          </h2>
          <p className="text-muted-foreground">Genesis Fleet Collection - Sports Card Style NFTs</p>
        </div>
        <Badge variant="outline" className="border-royal-purple/50 text-royal-purple px-4 py-2">
          <Crown className="h-4 w-4 mr-2" />
          Genesis Series
        </Badge>
      </div>

      {/* Collection Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card className="border-gold/20 bg-gradient-to-br from-gold/5 to-transparent">
          <CardContent className="pt-4 pb-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-gold">{stats.totalCards}</p>
              <p className="text-xs text-muted-foreground">Total Cards</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-royal-purple/20">
          <CardContent className="pt-4 pb-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-royal-purple">{stats.originals}</p>
              <p className="text-xs text-muted-foreground">Originals (1/1)</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-royal-blue/20">
          <CardContent className="pt-4 pb-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-royal-blue">{stats.clones}</p>
              <p className="text-xs text-muted-foreground">Clone Editions</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-accent/20">
          <CardContent className="pt-4 pb-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-accent">{stats.totalValue.toFixed(1)} ETH</p>
              <p className="text-xs text-muted-foreground">Est. Value</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-fuchsia-500/20">
          <CardContent className="pt-4 pb-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-fuchsia-400">{stats.byRarity.Mythic + stats.byRarity.Legendary}</p>
              <p className="text-xs text-muted-foreground">Mythic + Legendary</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-royal-red/20">
          <CardContent className="pt-4 pb-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-royal-red">{BOT_PERSONAS.length}</p>
              <p className="text-xs text-muted-foreground">Bot Personas</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="originals" className="flex items-center gap-2">
              <Crown className="h-4 w-4" />
              Originals ({GENESIS_BOT_COLLECTION.originals.length})
            </TabsTrigger>
            <TabsTrigger value="clones" className="flex items-center gap-2">
              <Copy className="h-4 w-4" />
              Clones ({GENESIS_BOT_COLLECTION.clones.length})
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search bots..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-52"
              />
            </div>
            <Select value={rarityFilter} onValueChange={setRarityFilter}>
              <SelectTrigger className="w-36">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Rarity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="Mythic">Mythic</SelectItem>
                <SelectItem value="Legendary">Legendary</SelectItem>
                <SelectItem value="Epic">Epic</SelectItem>
                <SelectItem value="Rare">Rare</SelectItem>
                <SelectItem value="Uncommon">Uncommon</SelectItem>
                <SelectItem value="Common">Common</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-1">
              <Button variant={view === 'grid' ? 'default' : 'outline'} size="icon" onClick={() => setView('grid')}>
                <Grid3x3 className="h-4 w-4" />
              </Button>
              <Button variant={view === 'list' ? 'default' : 'outline'} size="icon" onClick={() => setView('list')}>
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <TabsContent value={activeTab} className="mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Card Gallery */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {activeTab === 'originals' ? <Crown className="h-5 w-5 text-gold" /> : <Copy className="h-5 w-5 text-royal-blue" />}
                  {activeTab === 'originals' ? 'Original Genesis Cards' : 'Clone Edition Cards'}
                </CardTitle>
                <CardDescription>
                  {activeTab === 'originals' 
                    ? 'One-of-one original bot personas - Each with unique IP rights'
                    : 'Collectible clone editions - Track performance like sports cards'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px] pr-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {filteredCards.map((card) => {
                      const perf = BOT_PERFORMANCE[card.botPersona.id];
                      return (
                        <div
                          key={card.id}
                          onClick={() => setSelectedCard(card)}
                          className={`rounded-xl border-2 overflow-hidden cursor-pointer transition-all hover:scale-[1.02] ${
                            selectedCard?.id === card.id 
                              ? 'border-gold ring-2 ring-gold/30' 
                              : 'border-border hover:border-gold/50'
                          }`}
                        >
                          {/* Card Image Area - Sports Card Style */}
                          <div className={`aspect-[3/4] bg-gradient-to-br ${getPersonaColor(card.botPersona.visualTraits.primaryColor)} relative p-3 flex flex-col`}>
                            {/* Top badges */}
                            <div className="flex justify-between items-start">
                              <Badge className={`text-xs ${getRarityColor(card.rarity)}`}>
                                {card.rarity}
                              </Badge>
                              <div className="flex items-center gap-1">
                                {getStatusIcon(perf.status)}
                                {card.cardType === 'original' && <Crown className="w-4 h-4 text-gold" />}
                              </div>
                            </div>
                            
                            {/* Bot Avatar */}
                            <div className="flex-1 flex items-center justify-center">
                              <div className="relative">
                                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-card to-muted flex items-center justify-center border-2 border-gold/30 shadow-[0_0_30px_hsl(280,100%,65%,0.3)]">
                                  <Bot className="w-10 h-10 text-royal-purple" />
                                </div>
                                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-card border border-gold flex items-center justify-center">
                                  <span className="text-xs font-bold text-gold">#{card.edition}</span>
                                </div>
                              </div>
                            </div>
                            
                            {/* Name & Type */}
                            <div className="text-center mt-2">
                              <p className="font-bold text-sm truncate">{card.botPersona.name}</p>
                              <p className="text-xs text-muted-foreground truncate">{card.botPersona.strategyType}</p>
                            </div>
                          </div>
                          
                          {/* Stats Area - Sports Card Style */}
                          <div className="p-3 bg-card space-y-2">
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div className="text-center p-1.5 rounded bg-muted/50">
                                <p className="text-muted-foreground">Win Rate</p>
                                <p className={`font-bold ${card.stats.winRate >= 60 ? 'text-accent' : card.stats.winRate >= 50 ? 'text-gold' : 'text-royal-red'}`}>
                                  {card.stats.winRate}%
                                </p>
                              </div>
                              <div className="text-center p-1.5 rounded bg-muted/50">
                                <p className="text-muted-foreground">Profit</p>
                                <p className={`font-bold ${card.stats.profitPercent >= 0 ? 'text-accent' : 'text-royal-red'}`}>
                                  {card.stats.profitPercent >= 0 ? '+' : ''}{card.stats.profitPercent}%
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center justify-between pt-1">
                              <span className="text-sm font-bold text-gold">{card.estimatedValue.toFixed(2)} ETH</span>
                              <div className="flex gap-1">
                                <Copyright className="w-3 h-3 text-muted-foreground" />
                                <Bookmark className="w-3 h-3 text-muted-foreground" />
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Selected Card Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Card Details</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedCard ? (
                  <ScrollArea className="h-[600px] pr-2">
                    <div className="space-y-4">
                      {/* Card Preview */}
                      <div className={`aspect-[3/4] rounded-xl bg-gradient-to-br ${getPersonaColor(selectedCard.botPersona.visualTraits.primaryColor)} p-4 relative border border-gold/30`}>
                        <Badge className={`absolute top-3 right-3 ${getRarityColor(selectedCard.rarity)}`}>
                          <Star className="h-3 w-3 mr-1" />
                          {selectedCard.rarity}
                        </Badge>
                        {selectedCard.cardType === 'original' && (
                          <Badge className="absolute top-3 left-3 bg-gold/20 text-gold border-gold/50">
                            <Crown className="h-3 w-3 mr-1" />
                            Original
                          </Badge>
                        )}
                        <div className="h-full flex flex-col items-center justify-center">
                          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-royal-purple/30 to-neon-cyan/30 flex items-center justify-center border-2 border-gold/40 shadow-[0_0_40px_hsl(280,100%,65%,0.4)]">
                            <Bot className="w-12 h-12 text-royal-purple" />
                          </div>
                          <h3 className="text-xl font-bold mt-4">{selectedCard.botPersona.name}</h3>
                          <p className="text-sm text-muted-foreground">{selectedCard.botPersona.codeName}</p>
                        </div>
                      </div>

                      {/* Persona Info */}
                      <div className="p-3 rounded-lg bg-muted/30 border border-border">
                        <p className="text-xs text-muted-foreground mb-1">Catchphrase</p>
                        <p className="text-sm italic">"{selectedCard.botPersona.catchphrase}"</p>
                      </div>

                      {/* Stats Card - Sports Style */}
                      <div className="space-y-3">
                        <h4 className="font-medium flex items-center gap-2">
                          <BarChart3 className="h-4 w-4 text-gold" />
                          Performance Stats
                        </h4>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="p-2 rounded bg-muted/30 text-center">
                            <p className="text-xs text-muted-foreground">Win Rate</p>
                            <p className="text-lg font-bold text-accent">{selectedCard.stats.winRate}%</p>
                          </div>
                          <div className="p-2 rounded bg-muted/30 text-center">
                            <p className="text-xs text-muted-foreground">Total Trades</p>
                            <p className="text-lg font-bold">{selectedCard.stats.totalTrades}</p>
                          </div>
                          <div className="p-2 rounded bg-muted/30 text-center">
                            <p className="text-xs text-muted-foreground">Profit</p>
                            <p className={`text-lg font-bold ${selectedCard.stats.profitPercent >= 0 ? 'text-accent' : 'text-royal-red'}`}>
                              {selectedCard.stats.profitPercent >= 0 ? '+' : ''}{selectedCard.stats.profitPercent}%
                            </p>
                          </div>
                          <div className="p-2 rounded bg-muted/30 text-center">
                            <p className="text-xs text-muted-foreground">Sharpe Ratio</p>
                            <p className="text-lg font-bold text-royal-blue">{selectedCard.stats.sharpeRatio}</p>
                          </div>
                          <div className="p-2 rounded bg-muted/30 text-center">
                            <p className="text-xs text-muted-foreground">Max DD</p>
                            <p className="text-lg font-bold text-royal-red">-{selectedCard.stats.maxDrawdown}%</p>
                          </div>
                          <div className="p-2 rounded bg-muted/30 text-center">
                            <p className="text-xs text-muted-foreground">Uptime</p>
                            <p className="text-sm font-bold">{selectedCard.stats.uptime}</p>
                          </div>
                        </div>
                      </div>

                      {/* IP Status */}
                      <div className="space-y-2">
                        <h4 className="font-medium flex items-center gap-2">
                          <Shield className="h-4 w-4 text-royal-blue" />
                          IP Protection
                        </h4>
                        <div className="p-3 rounded-lg bg-muted/30 space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <Copyright className="h-3 w-3" /> Copyright
                            </span>
                            <span className="font-mono text-xs">{selectedCard.ipStatus.copyrightId}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <Bookmark className="h-3 w-3" /> Trademark
                            </span>
                            <span className="font-mono text-xs">{selectedCard.ipStatus.trademarkId}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Jurisdiction</span>
                            <span>{selectedCard.ipStatus.jurisdiction}</span>
                          </div>
                        </div>
                      </div>

                      {/* Attributes */}
                      <div className="space-y-2">
                        <h4 className="font-medium">Attributes</h4>
                        <div className="grid grid-cols-2 gap-1.5">
                          {selectedCard.attributes.slice(0, 10).map((attr, i) => (
                            <div key={i} className="p-1.5 rounded bg-muted/30 text-xs">
                              <p className="text-muted-foreground truncate">{attr.trait_type}</p>
                              <p className="font-medium truncate">{attr.value}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Value & Actions */}
                      <div className="pt-4 border-t space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Estimated Value</span>
                          <span className="text-2xl font-bold text-gold">{selectedCard.estimatedValue.toFixed(2)} ETH</span>
                        </div>
                        <Button className="w-full" variant="gold">
                          <Sparkles className="h-4 w-4 mr-2" />
                          List for Sale
                        </Button>
                        <Button className="w-full" variant="outline">
                          <Award className="h-4 w-4 mr-2" />
                          View Certificate
                        </Button>
                      </div>
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="h-[600px] flex flex-col items-center justify-center text-center">
                    <Bot className="h-20 w-20 text-muted-foreground/20 mb-4" />
                    <p className="text-muted-foreground">Select a trading card to view details</p>
                    <p className="text-xs text-muted-foreground mt-2">Each card tracks real-time bot performance</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BotTradingCardGallery;
