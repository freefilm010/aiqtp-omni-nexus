import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import {
  Coins,
  Upload,
  Rocket,
  TrendingUp,
  Lock,
  Droplets,
  Zap,
  AlertTriangle
} from "lucide-react";

const TokenCreator = () => {
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [description, setDescription] = useState("");
  const [chain, setChain] = useState("solana");
  const [totalSupply, setTotalSupply] = useState("1000000000");
  const [initialLiquidity, setInitialLiquidity] = useState("1");
  const [bondingCurve, setBondingCurve] = useState("linear");
  const [devAllocation, setDevAllocation] = useState([5]);
  const [lpLock, setLpLock] = useState(true);
  const [lpLockDays, setLpLockDays] = useState("30");
  const [antiBot, setAntiBot] = useState(true);

  const estimatedMarketCap = parseFloat(initialLiquidity) * 2 * 1000; // Simplified calculation

  const launch = () => {
    if (!name || !symbol) {
      toast.error("Please fill in token name and symbol");
      return;
    }
    toast.success("Token launch initiated!", {
      description: `${name} (${symbol}) is being deployed on ${chain}`
    });
  };

  return (
    <div className="grid grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            Create New Token
          </CardTitle>
          <CardDescription>Launch your token with a bonding curve like pump.fun</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Logo Upload */}
          <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer">
            <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">Upload token logo</p>
            <p className="text-xs text-muted-foreground">PNG or JPG (500x500 recommended)</p>
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Token Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My Awesome Token"
              />
            </div>
            <div>
              <Label>Symbol</Label>
              <Input
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                placeholder="MAT"
                maxLength={10}
              />
            </div>
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your token and its purpose..."
            />
          </div>

          {/* Chain & Supply */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Blockchain</Label>
              <Select value={chain} onValueChange={setChain}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="solana">Solana</SelectItem>
                  <SelectItem value="base">Base</SelectItem>
                  <SelectItem value="ethereum">Ethereum</SelectItem>
                  <SelectItem value="bsc">BNB Chain</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Total Supply</Label>
              <Input
                type="number"
                value={totalSupply}
                onChange={(e) => setTotalSupply(e.target.value)}
              />
            </div>
          </div>

          {/* Bonding Curve */}
          <div className="p-4 rounded-lg bg-muted/50 space-y-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <span className="font-medium">Bonding Curve</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {['linear', 'exponential', 'logarithmic'].map((curve) => (
                <Button
                  key={curve}
                  variant={bondingCurve === curve ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setBondingCurve(curve)}
                  className="capitalize"
                >
                  {curve}
                </Button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {bondingCurve === 'linear' && "Price increases linearly with each purchase"}
              {bondingCurve === 'exponential' && "Price increases exponentially - higher upside potential"}
              {bondingCurve === 'logarithmic' && "Price increases slow over time - more stable"}
            </p>
          </div>

          {/* Liquidity */}
          <div className="space-y-4">
            <div>
              <Label>Initial Liquidity ({chain === 'solana' ? 'SOL' : 'ETH'})</Label>
              <Input
                type="number"
                value={initialLiquidity}
                onChange={(e) => setInitialLiquidity(e.target.value)}
                step="0.1"
              />
            </div>
            <div>
              <Label>Dev Allocation: {devAllocation}%</Label>
              <Slider
                value={devAllocation}
                onValueChange={setDevAllocation}
                min={0}
                max={20}
                step={1}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {((parseFloat(totalSupply) * devAllocation[0]) / 100).toLocaleString()} tokens reserved
              </p>
            </div>
          </div>

          {/* Safety Features */}
          <div className="space-y-4">
            <Label>Safety Features</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Lock LP</span>
                </div>
                <Switch checked={lpLock} onCheckedChange={setLpLock} />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-amber-500" />
                  <span className="text-sm">Anti-Bot</span>
                </div>
                <Switch checked={antiBot} onCheckedChange={setAntiBot} />
              </div>
            </div>
            {lpLock && (
              <div>
                <Label>LP Lock Duration (days)</Label>
                <Select value={lpLockDays} onValueChange={setLpLockDays}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 days</SelectItem>
                    <SelectItem value="90">90 days</SelectItem>
                    <SelectItem value="180">180 days</SelectItem>
                    <SelectItem value="365">1 year</SelectItem>
                    <SelectItem value="forever">Forever 🔥</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <Button className="w-full" size="lg" onClick={launch}>
            <Rocket className="h-4 w-4 mr-2" />
            Launch Token
          </Button>
        </CardContent>
      </Card>

      {/* Preview */}
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Token Preview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                <Coins className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-xl font-bold">{name || "Token Name"}</h3>
                <p className="text-muted-foreground">${symbol || "SYMBOL"}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Badge>{chain}</Badge>
              {lpLock && <Badge variant="outline" className="text-green-500">LP Locked</Badge>}
              {antiBot && <Badge variant="outline" className="text-amber-500">Anti-Bot</Badge>}
            </div>
            <p className="text-sm text-muted-foreground">
              {description || "No description provided"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Tokenomics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Supply</span>
              <span className="font-bold">{parseFloat(totalSupply).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Initial Liquidity</span>
              <span className="font-bold">{initialLiquidity} {chain === 'solana' ? 'SOL' : 'ETH'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Dev Allocation</span>
              <span className="font-bold">{devAllocation}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Bonding Curve</span>
              <span className="font-bold capitalize">{bondingCurve}</span>
            </div>
            <div className="pt-2 border-t">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Est. Initial MCap</span>
                <span className="font-bold text-green-500">${estimatedMarketCap.toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-500/50 bg-amber-500/5">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-amber-500">Trading Warning</p>
                <p className="text-muted-foreground">
                  Cryptocurrency trading involves significant risk. Only invest what you can afford to lose.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TokenCreator;
