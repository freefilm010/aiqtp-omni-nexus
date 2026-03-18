import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  Palette,
  Upload,
  Image,
  Sparkles,
  Layers,
  Plus,
  X,
  Zap,
  Loader2
} from "lucide-react";

const NFTCreator = () => {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [chain, setChain] = useState("ethereum");
  const [royalties, setRoyalties] = useState("5");
  const [supply, setSupply] = useState("1");
  const [attributes, setAttributes] = useState<{trait: string, value: string}[]>([]);
  const [useAI, setUseAI] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isMinting, setIsMinting] = useState(false);

  const addAttribute = () => {
    setAttributes([...attributes, { trait: "", value: "" }]);
  };

  const removeAttribute = (index: number) => {
    setAttributes(attributes.filter((_, i) => i !== index));
  };

  const mint = async () => {
    if (!user) {
      toast.error("Please sign in to create NFTs");
      return;
    }
    if (!name.trim()) {
      toast.error("Please enter a name for your NFT");
      return;
    }

    setIsMinting(true);
    try {
      const { error } = await supabase.from("user_nfts").insert({
        user_id: user.id,
        name: name.trim(),
        description: description.trim() || null,
        chain,
        royalty_percent: parseFloat(royalties) || 5,
        supply: parseInt(supply) || 1,
        attributes: attributes.filter(a => a.trait && a.value),
        ai_generated: useAI,
        ai_prompt: useAI ? aiPrompt : null,
        mint_status: "minted",
      });

      if (error) throw error;

      toast.success("NFT created successfully!", {
        description: `${name} has been minted on ${chain}`
      });

      // Reset form
      setName("");
      setDescription("");
      setAttributes([]);
      setAiPrompt("");
      setUseAI(false);
    } catch (error: any) {
      console.error("NFT creation error:", error);
      toast.error("Failed to create NFT", { description: error.message });
    } finally {
      setIsMinting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Create New NFT
          </CardTitle>
          <CardDescription>Mint your digital artwork as an NFT</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Upload Area */}
          <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
            <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-2">Drag & drop your file here</p>
            <p className="text-xs text-muted-foreground mb-4">PNG, JPG, GIF, SVG, MP4, WEBM (Max 100MB)</p>
            <Button variant="outline">Choose File</Button>
          </div>

          {/* AI Generation */}
          <div className="p-4 rounded-lg bg-muted/50 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <span className="font-medium">AI Image Generation</span>
              </div>
              <Switch checked={useAI} onCheckedChange={setUseAI} />
            </div>
            {useAI && (
              <div className="space-y-2">
                <Label>Describe your NFT</Label>
                <Textarea
                  placeholder="A cyberpunk cat wearing VR goggles in a neon-lit city..."
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                />
                <Button className="w-full">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate with AI
                </Button>
              </div>
            )}
          </div>

          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="My Awesome NFT" />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe your NFT..." />
            </div>
          </div>

          {/* Chain & Settings */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Blockchain</Label>
              <Select value={chain} onValueChange={setChain}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ethereum">Ethereum</SelectItem>
                  <SelectItem value="polygon">Polygon</SelectItem>
                  <SelectItem value="solana">Solana</SelectItem>
                  <SelectItem value="base">Base</SelectItem>
                  <SelectItem value="arbitrum">Arbitrum</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Royalties (%)</Label>
              <Input type="number" value={royalties} onChange={(e) => setRoyalties(e.target.value)} min="0" max="50" />
            </div>
            <div>
              <Label>Supply</Label>
              <Input type="number" value={supply} onChange={(e) => setSupply(e.target.value)} min="1" />
            </div>
          </div>

          {/* Attributes */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Attributes</Label>
              <Button variant="outline" size="sm" onClick={addAttribute}>
                <Plus className="h-4 w-4 mr-1" /> Add Trait
              </Button>
            </div>
            {attributes.map((attr, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  placeholder="Trait (e.g. Background)"
                  value={attr.trait}
                  onChange={(e) => { const n = [...attributes]; n[i].trait = e.target.value; setAttributes(n); }}
                />
                <Input
                  placeholder="Value (e.g. Blue)"
                  value={attr.value}
                  onChange={(e) => { const n = [...attributes]; n[i].value = e.target.value; setAttributes(n); }}
                />
                <Button variant="ghost" size="icon" onClick={() => removeAttribute(i)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <Button className="w-full" size="lg" onClick={mint} disabled={isMinting || !name.trim()}>
            {isMinting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Zap className="h-4 w-4 mr-2" />}
            {isMinting ? "Creating..." : "Create NFT"}
          </Button>
        </CardContent>
      </Card>

      {/* Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image className="h-5 w-5" /> Preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="aspect-square rounded-lg bg-muted flex items-center justify-center mb-6">
            <Layers className="h-24 w-24 text-muted-foreground" />
          </div>
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-bold">{name || "Untitled"}</h3>
              <p className="text-sm text-muted-foreground mt-1">{description || "No description"}</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Badge>{chain}</Badge>
              <Badge variant="outline">{royalties}% royalties</Badge>
              <Badge variant="secondary">{supply} edition{parseInt(supply) > 1 ? 's' : ''}</Badge>
            </div>
            {attributes.length > 0 && (
              <div className="grid grid-cols-2 gap-2 mt-4">
                {attributes.filter(a => a.trait && a.value).map((attr, i) => (
                  <div key={i} className="p-2 rounded bg-muted/50 text-center">
                    <p className="text-xs text-muted-foreground">{attr.trait}</p>
                    <p className="font-medium">{attr.value}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NFTCreator;
