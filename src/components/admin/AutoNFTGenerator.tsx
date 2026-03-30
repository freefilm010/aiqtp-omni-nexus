import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sparkles,
  Palette,
  Zap,
  DollarSign,
  TrendingUp,
  Image,
  Layers,
  Play,
  Pause,
  Settings,
  ShoppingCart,
  Clock,
  CheckCircle2,
  Bot,
  Rocket
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface NFTGeneration {
  id: string;
  name: string;
  prompt: string;
  chain: string;
  mint_status: string;
  list_price: number;
  currency: string;
  generated_at: string;
  sold_at?: string;
  sale_price?: number;
}

interface GenerationQueue {
  id: string;
  batch_name: string;
  total_count: number;
  completed_count: number;
  theme: string;
  style: string;
  base_price: number;
  chain: string;
  status: string;
}

const NFT_THEMES = [
  { value: "cosmic", label: "Cosmic Voyagers", prompts: ["ethereal space traveler", "nebula spirit", "galactic entity"] },
  { value: "cyberpunk", label: "Cyber Artifacts", prompts: ["neon cybernetic sculpture", "digital artifact", "tech relic"] },
  { value: "nature", label: "Digital Nature", prompts: ["bioluminescent flora", "crystal formation", "elemental spirit"] },
  { value: "abstract", label: "Abstract Dreams", prompts: ["geometric consciousness", "color symphony", "dimensional rift"] },
  { value: "mythology", label: "Neo Mythology", prompts: ["digital deity", "crypto god", "blockchain spirit"] },
];

const NFT_STYLES = [
  { value: "3d-render", label: "3D Rendered" },
  { value: "pixel-art", label: "Pixel Art" },
  { value: "oil-painting", label: "Oil Painting" },
  { value: "vaporwave", label: "Vaporwave" },
  { value: "minimalist", label: "Minimalist" },
];

const AutoNFTGenerator = () => {
  const [isAutoMode, setIsAutoMode] = useState(true);
  const [generations, setGenerations] = useState<NFTGeneration[]>([]);
  const [queue, setQueue] = useState<GenerationQueue[]>([]);
  const [selectedTheme, setSelectedTheme] = useState("cosmic");
  const [selectedStyle, setSelectedStyle] = useState("3d-render");
  const [batchSize, setBatchSize] = useState([10]);
  const [basePrice, setBasePrice] = useState([0.1]);
  const [selectedChain, setSelectedChain] = useState("ethereum");
  const [autoList, setAutoList] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  // Stats
  const totalGenerated = generations.length;
  const totalSold = generations.filter(n => n.sold_at).length;
  const totalRevenue = generations.filter(n => n.sale_price).reduce((sum, n) => sum + (n.sale_price || 0), 0);
  const pendingMints = generations.filter(n => n.mint_status === 'pending').length;

  useEffect(() => {
    loadGenerations();
    loadQueue();
  }, []);

  const loadGenerations = async () => {
    const { data } = await supabase
      .from('auto_nft_generations')
      .select('*')
      .order('generated_at', { ascending: false })
      .limit(50);
    if (data) setGenerations(data as NFTGeneration[]);
  };

  const loadQueue = async () => {
    const { data } = await supabase
      .from('nft_generation_queue')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    if (data) setQueue(data as GenerationQueue[]);
  };

  const startBatchGeneration = async () => {
    setIsGenerating(true);
    const theme = NFT_THEMES.find(t => t.value === selectedTheme);
    
    // Create queue entry
    const { data: queueEntry } = await supabase.from('nft_generation_queue').insert({
      batch_name: `${theme?.label} Collection`,
      total_count: batchSize[0],
      theme: selectedTheme,
      style: selectedStyle,
      base_price: basePrice[0],
      chain: selectedChain,
      status: 'processing',
      started_at: new Date().toISOString()
    }).select().single();

    // Generate NFTs with deterministic seeding per batch item
    const generatedNFTs: any[] = [];
    const batchSeed = Date.now();
    for (let i = 0; i < batchSize[0]; i++) {
      const s = (offset: number) => Math.abs(Math.sin(batchSeed * 0.0001 + i * 1.618 + offset));
      const promptBase = theme?.prompts[Math.floor(s(0) * (theme?.prompts.length || 1))] || 'digital art';
      const rarityRoll = s(5);
      const nft = {
        name: `${theme?.label} #${(batchSeed % 10000 + i).toString().padStart(4, '0')}`,
        description: `AI-generated ${theme?.label} NFT in ${selectedStyle} style`,
        prompt: `${promptBase}, ${selectedStyle} style, ultra detailed, 8k`,
        chain: selectedChain,
        mint_status: autoList ? 'listed' : 'minted',
        list_price: basePrice[0] * (0.8 + s(1) * 0.4),
        currency: selectedChain === 'ethereum' ? 'ETH' : selectedChain === 'solana' ? 'SOL' : 'ETH',
        attributes: JSON.stringify([
          { trait: 'Theme', value: theme?.label },
          { trait: 'Style', value: selectedStyle },
          { trait: 'Rarity', value: rarityRoll > 0.9 ? 'Legendary' : rarityRoll > 0.7 ? 'Epic' : 'Rare' }
        ])
      };
      generatedNFTs.push(nft);
    }

    // Insert all generated NFTs
    await supabase.from('auto_nft_generations').insert(generatedNFTs);

    // Update queue entry
    await supabase.from('nft_generation_queue').update({
      completed_count: batchSize[0],
      status: 'completed',
      completed_at: new Date().toISOString()
    }).eq('id', queueEntry?.id);

    toast.success(`Generated ${batchSize[0]} NFTs!`, {
      description: `Listed on ${selectedChain} at ~${basePrice[0]} ${selectedChain === 'ethereum' ? 'ETH' : 'SOL'}`
    });

    setIsGenerating(false);
    loadGenerations();
    loadQueue();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'listed': return 'bg-green-500/10 text-green-500 border-green-500/30';
      case 'minted': return 'bg-blue-500/10 text-blue-500 border-blue-500/30';
      case 'sold': return 'bg-purple-500/10 text-purple-500 border-purple-500/30';
      case 'pending': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30';
      default: return 'bg-muted';
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Generated</p>
                <p className="text-2xl font-bold">{totalGenerated}</p>
              </div>
              <div className="p-3 rounded-full bg-blue-500/10">
                <Image className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Sold</p>
                <p className="text-2xl font-bold text-green-500">{totalSold}</p>
              </div>
              <div className="p-3 rounded-full bg-green-500/10">
                <ShoppingCart className="h-6 w-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Revenue</p>
                <p className="text-2xl font-bold text-primary">{totalRevenue.toFixed(2)} ETH</p>
              </div>
              <div className="p-3 rounded-full bg-primary/10">
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-yellow-500">{pendingMints}</p>
              </div>
              <div className="p-3 rounded-full bg-yellow-500/10">
                <Clock className="h-6 w-6 text-yellow-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="generator" className="space-y-4">
        <TabsList>
          <TabsTrigger value="generator">AI Generator</TabsTrigger>
          <TabsTrigger value="queue">Generation Queue</TabsTrigger>
          <TabsTrigger value="gallery">Generated NFTs</TabsTrigger>
        </TabsList>

        <TabsContent value="generator">
          <div className="grid grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Auto NFT Generator
                </CardTitle>
                <CardDescription>
                  AI-powered NFT creation and marketplace listing
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <div className="flex items-center gap-3">
                    <Bot className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">Autonomous Mode</p>
                      <p className="text-sm text-muted-foreground">Generate & list automatically</p>
                    </div>
                  </div>
                  <Switch checked={isAutoMode} onCheckedChange={setIsAutoMode} />
                </div>

                <div className="space-y-4">
                  <div>
                    <Label>Collection Theme</Label>
                    <Select value={selectedTheme} onValueChange={setSelectedTheme}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {NFT_THEMES.map(theme => (
                          <SelectItem key={theme.value} value={theme.value}>
                            {theme.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Art Style</Label>
                    <Select value={selectedStyle} onValueChange={setSelectedStyle}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {NFT_STYLES.map(style => (
                          <SelectItem key={style.value} value={style.value}>
                            {style.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Blockchain</Label>
                    <Select value={selectedChain} onValueChange={setSelectedChain}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ethereum">Ethereum</SelectItem>
                        <SelectItem value="solana">Solana</SelectItem>
                        <SelectItem value="polygon">Polygon</SelectItem>
                        <SelectItem value="base">Base</SelectItem>
                        <SelectItem value="arbitrum">Arbitrum</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <Label>Batch Size</Label>
                      <span className="text-sm font-medium">{batchSize[0]} NFTs</span>
                    </div>
                    <Slider
                      value={batchSize}
                      onValueChange={setBatchSize}
                      min={1}
                      max={100}
                      step={1}
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <Label>Base Price</Label>
                      <span className="text-sm font-medium">{basePrice[0]} {selectedChain === 'ethereum' ? 'ETH' : 'SOL'}</span>
                    </div>
                    <Slider
                      value={basePrice}
                      onValueChange={setBasePrice}
                      min={0.01}
                      max={10}
                      step={0.01}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <Label>Auto-List for Sale</Label>
                      <p className="text-xs text-muted-foreground">Immediately list on marketplace</p>
                    </div>
                    <Switch checked={autoList} onCheckedChange={setAutoList} />
                  </div>
                </div>

                <Button 
                  className="w-full" 
                  size="lg" 
                  onClick={startBatchGeneration}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Rocket className="h-4 w-4 mr-2" />
                      Generate {batchSize[0]} NFTs
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  Revenue Projection
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 rounded-lg bg-muted/50 space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Batch Value</span>
                    <span className="font-bold">{(batchSize[0] * basePrice[0]).toFixed(2)} {selectedChain === 'ethereum' ? 'ETH' : 'SOL'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Est. Sales Rate</span>
                    <span className="font-medium">~15%/week</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Royalties (5%)</span>
                    <span className="text-green-500">Ongoing</span>
                  </div>
                  <div className="border-t pt-4 flex justify-between">
                    <span className="text-muted-foreground">Weekly Projection</span>
                    <span className="text-xl font-bold text-green-500">
                      +{(batchSize[0] * basePrice[0] * 0.15).toFixed(2)} {selectedChain === 'ethereum' ? 'ETH' : 'SOL'}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium">Theme Preview</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="aspect-square rounded-lg bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center">
                        <Layers className="h-8 w-8 text-muted-foreground" />
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    {NFT_THEMES.find(t => t.value === selectedTheme)?.label} • {NFT_STYLES.find(s => s.value === selectedStyle)?.label}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="queue">
          <Card>
            <CardHeader>
              <CardTitle>Generation Queue</CardTitle>
              <CardDescription>Track batch generation jobs</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {queue.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Layers className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No generation jobs yet</p>
                    </div>
                  ) : (
                    queue.map(job => (
                      <div key={job.id} className="p-4 rounded-lg border">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-medium">{job.batch_name}</h4>
                            <p className="text-sm text-muted-foreground">{job.theme} • {job.style}</p>
                          </div>
                          <Badge variant="outline" className={getStatusColor(job.status)}>
                            {job.status}
                          </Badge>
                        </div>
                        <Progress value={(job.completed_count / job.total_count) * 100} className="mb-2" />
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>{job.completed_count}/{job.total_count} generated</span>
                          <span>{job.base_price} {job.chain === 'ethereum' ? 'ETH' : 'SOL'} each</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gallery">
          <Card>
            <CardHeader>
              <CardTitle>Generated NFTs Gallery</CardTitle>
              <CardDescription>All auto-generated NFTs</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="grid grid-cols-4 gap-4">
                  {generations.map(nft => (
                    <div key={nft.id} className="rounded-lg border overflow-hidden">
                      <div className="aspect-square bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center">
                        <Palette className="h-12 w-12 text-muted-foreground" />
                      </div>
                      <div className="p-3">
                        <h4 className="font-medium text-sm truncate">{nft.name}</h4>
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-xs text-muted-foreground">{nft.list_price.toFixed(3)} {nft.currency}</span>
                          <Badge variant="outline" className={getStatusColor(nft.mint_status)}>
                            {nft.mint_status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AutoNFTGenerator;