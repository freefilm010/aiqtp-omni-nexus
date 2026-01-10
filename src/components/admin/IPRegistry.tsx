import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Copyright, 
  Shield, 
  FileText, 
  Hash, 
  Globe, 
  Sparkles,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Plus,
  Search,
  ExternalLink
} from "lucide-react";
import { toast } from "sonner";
import { sovereignRegistry, SovereignNFT } from "@/lib/registry/sovereignAssetRegistry";

const ASSET_TYPES = [
  { value: "trademark", label: "Trademark", icon: Shield, description: "Brand names, logos, slogans" },
  { value: "copyright", label: "Copyright", icon: Copyright, description: "Software, content, creative works" },
  { value: "patent", label: "Patent", icon: FileText, description: "Inventions, processes, designs" },
  { value: "hashtag", label: "Hashtag", icon: Hash, description: "Social media identifiers" },
  { value: "domain", label: "Domain", icon: Globe, description: "Web domains and URLs" },
];

const PLATFORM_ASSETS = [
  { name: "QAQI™ Agent", type: "trademark", value: "QAQI™", status: "registered" },
  { name: "Titan Codex™", type: "trademark", value: "Titan Codex™", status: "registered" },
  { name: "Quantum Time Crystal™", type: "trademark", value: "$QTC™", status: "registered" },
  { name: "QuWallet®", type: "trademark", value: "QuWallet®", status: "registered" },
  { name: "Proof of Temporal Resonance™", type: "patent", value: "PoTR™ Consensus", status: "registered" },
  { name: "AIQTP™ Portal", type: "copyright", value: "AIQTP™ AI Quantum Trading Portal", status: "registered" },
  { name: "AI Strategy Trading Bots™", type: "trademark", value: "AI Strategy Trading Bots™", status: "registered" },
  { name: "Lightning Vault Wallet®", type: "trademark", value: "Lightning Vault Wallet®", status: "registered" },
  { name: "Data Economy™", type: "trademark", value: "Data Economy™", status: "registered" },
];

const IPRegistry = () => {
  const [registeredAssets, setRegisteredAssets] = useState<SovereignNFT[]>(sovereignRegistry.exportRegistry());
  const [newAsset, setNewAsset] = useState({
    type: "trademark",
    name: "",
    value: "",
    description: "",
    jurisdiction: "Aethelgard SEZ / USPTO"
  });
  const [isRegistering, setIsRegistering] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleRegister = async () => {
    if (!newAsset.name || !newAsset.value) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsRegistering(true);
    
    // Simulate registration delay
    await new Promise(r => setTimeout(r, 1500));

    const result = sovereignRegistry.mintSovereignAsset(
      newAsset.type as SovereignNFT['assetType'],
      newAsset.value,
      "admin:david_richard_rey",
      {
        name: newAsset.name,
        description: newAsset.description,
        legalJurisdiction: newAsset.jurisdiction
      }
    );

    if ('error' in result) {
      toast.error(result.error);
    } else {
      toast.success(`✅ ${newAsset.type.toUpperCase()} "${newAsset.name}" registered successfully!`);
      setRegisteredAssets(sovereignRegistry.exportRegistry());
      setNewAsset({
        type: "trademark",
        name: "",
        value: "",
        description: "",
        jurisdiction: "Aethelgard SEZ / USPTO"
      });
    }

    setIsRegistering(false);
  };

  const handleBulkRegister = async () => {
    setIsRegistering(true);
    let registered = 0;

    for (const asset of PLATFORM_ASSETS) {
      const result = sovereignRegistry.mintSovereignAsset(
        asset.type as SovereignNFT['assetType'],
        asset.value,
        "admin:david_richard_rey",
        {
          name: asset.name,
          description: `Official ${asset.type} for ${asset.name}`,
          legalJurisdiction: "Aethelgard SEZ / USPTO"
        }
      );

      if (!('error' in result)) {
        registered++;
      }
      
      await new Promise(r => setTimeout(r, 300));
    }

    setRegisteredAssets(sovereignRegistry.exportRegistry());
    toast.success(`🎉 Registered ${registered} platform assets on QTC chain!`);
    setIsRegistering(false);
  };

  const stats = sovereignRegistry.getStats();
  const filteredAssets = registeredAssets.filter(asset => 
    asset.assetValue.toLowerCase().includes(searchQuery.toLowerCase()) ||
    asset.metadata.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Copyright className="h-6 w-6 text-purple-500" />
            Decentralized IP Registry
          </h2>
          <p className="text-muted-foreground">
            Mint immutable copyrights, trademarks, and patents on the QTC blockchain
          </p>
        </div>
        <Button onClick={handleBulkRegister} disabled={isRegistering}>
          <Sparkles className="h-4 w-4 mr-2" />
          Register All Platform Assets
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-purple-500">{stats.totalAssets}</p>
            <p className="text-xs text-muted-foreground">Total Registered</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-500">{stats.byType?.trademark || 0}</p>
            <p className="text-xs text-muted-foreground">Trademarks</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-500">{stats.byType?.copyright || 0}</p>
            <p className="text-xs text-muted-foreground">Copyrights</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-orange-500">{stats.byType?.patent || 0}</p>
            <p className="text-xs text-muted-foreground">Patents</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-red-500">{stats.activeDisputes}</p>
            <p className="text-xs text-muted-foreground">Disputes</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="register" className="space-y-4">
        <TabsList>
          <TabsTrigger value="register">Register New</TabsTrigger>
          <TabsTrigger value="registry">View Registry</TabsTrigger>
          <TabsTrigger value="platform">Platform Assets</TabsTrigger>
        </TabsList>

        {/* Register New Asset */}
        <TabsContent value="register">
          <Card>
            <CardHeader>
              <CardTitle>Register New IP Asset</CardTitle>
              <CardDescription>
                Mint a decentralized copyright, trademark, or patent NFT on the QTC chain
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Asset Type</Label>
                  <Select 
                    value={newAsset.type} 
                    onValueChange={(v) => setNewAsset({...newAsset, type: v})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ASSET_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <type.icon className="h-4 w-4" />
                            <span>{type.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Jurisdiction</Label>
                  <Select 
                    value={newAsset.jurisdiction} 
                    onValueChange={(v) => setNewAsset({...newAsset, jurisdiction: v})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Aethelgard SEZ / USPTO">Aethelgard SEZ / USPTO</SelectItem>
                      <SelectItem value="Aethelgard SEZ / WIPO">Aethelgard SEZ / WIPO</SelectItem>
                      <SelectItem value="Aethelgard SEZ / EUIPO">Aethelgard SEZ / EUIPO</SelectItem>
                      <SelectItem value="Decentralized Only">Decentralized Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Asset Name *</Label>
                  <Input
                    placeholder="e.g., QAQI Agent, Titan Codex"
                    value={newAsset.name}
                    onChange={(e) => setNewAsset({...newAsset, name: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Asset Value/Identifier *</Label>
                  <Input
                    placeholder="e.g., #QAQI, quantumchronos.io"
                    value={newAsset.value}
                    onChange={(e) => setNewAsset({...newAsset, value: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  placeholder="Describe the asset and its use..."
                  value={newAsset.description}
                  onChange={(e) => setNewAsset({...newAsset, description: e.target.value})}
                  rows={3}
                />
              </div>

              <Button onClick={handleRegister} disabled={isRegistering} className="w-full">
                {isRegistering ? (
                  <>Registering on QTC Chain...</>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Mint IP NFT
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* View Registry */}
        <TabsContent value="registry">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Sovereign Asset Registry</CardTitle>
                <div className="relative w-64">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search assets..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {filteredAssets.map((asset) => (
                    <div
                      key={asset.tokenId}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                        {asset.assetType === "trademark" && <Shield className="h-5 w-5 text-purple-500" />}
                          {asset.assetType === "patent" && <FileText className="h-5 w-5 text-orange-500" />}
                          {asset.assetType === "hashtag" && <Hash className="h-5 w-5 text-green-500" />}
                          {asset.assetType === "url" && <Copyright className="h-5 w-5 text-blue-500" />}
                          {asset.assetType === "domain" && <Globe className="h-5 w-5 text-cyan-500" />}
                        </div>
                        <div>
                          <p className="font-medium">{asset.metadata.name}</p>
                          <p className="text-xs text-muted-foreground font-mono">{asset.tokenId}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {asset.assetType}
                        </Badge>
                        {asset.status === "active" && (
                          <Badge className="bg-green-500/10 text-green-500 border-green-500/30">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Registered
                          </Badge>
                        )}
                        {asset.status === "disputed" && (
                          <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/30">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Disputed
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                  {filteredAssets.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No assets found. Register your first IP asset!
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Platform Assets */}
        <TabsContent value="platform">
          <Card>
            <CardHeader>
              <CardTitle>Platform Assets to Register</CardTitle>
              <CardDescription>
                Core platform intellectual property that should be registered
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {PLATFORM_ASSETS.map((asset, idx) => {
                  const isRegistered = registeredAssets.some(
                    r => r.assetValue.toLowerCase() === asset.value.toLowerCase()
                  );
                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                          {asset.type === "trademark" && <Shield className="h-5 w-5" />}
                          {asset.type === "copyright" && <Copyright className="h-5 w-5" />}
                          {asset.type === "patent" && <FileText className="h-5 w-5" />}
                        </div>
                        <div>
                          <p className="font-medium">{asset.name}</p>
                          <p className="text-xs text-muted-foreground">{asset.type} • {asset.value}</p>
                        </div>
                      </div>
                      {isRegistered ? (
                        <Badge className="bg-green-500/10 text-green-500">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Registered
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-yellow-500">
                          <Clock className="h-3 w-3 mr-1" />
                          Pending
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>

              <Button onClick={handleBulkRegister} disabled={isRegistering} className="w-full mt-4">
                <Sparkles className="h-4 w-4 mr-2" />
                Register All Pending Assets
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default IPRegistry;
