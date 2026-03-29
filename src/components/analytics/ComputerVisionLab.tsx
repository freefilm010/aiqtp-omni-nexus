import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Eye, 
  Upload, 
  Camera, 
  Scan, 
  Target,
  TrendingUp,
  TrendingDown,
  Activity,
  Layers,
  RefreshCw,
  Download,
  Play,
  ZoomIn,
  ZoomOut,
  RotateCw
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DetectedPattern {
  id: string;
  type: string;
  confidence: number;
  location: { x: number; y: number; width: number; height: number };
  direction: "bullish" | "bearish" | "neutral";
  priceTarget?: number;
  stopLoss?: number;
}

interface SupportResistance {
  type: "support" | "resistance";
  price: number;
  strength: number;
  touches: number;
}

const ComputerVisionLab = () => {
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [detectionModel, setDetectionModel] = useState("pattern-recognition");
  const [sensitivityLevel, setSensitivityLevel] = useState([70]);
  const [showOverlay, setShowOverlay] = useState(true);
  const [autoDetect, setAutoDetect] = useState(true);

  const [detectedPatterns, setDetectedPatterns] = useState<DetectedPattern[]>([]);
  const [supportResistance, setSupportResistance] = useState<SupportResistance[]>([]);
  const [candlestickPatterns, setCandlestickPatterns] = useState<any[]>([]);
  const [trendlines, setTrendlines] = useState<any[]>([]);

  useEffect(() => {
    const loadDetections = async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user?.user?.id) return;

      const { data } = await supabase
        .from('cv_detections')
        .select('*')
        .eq('user_id', user.user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (data && data.length > 0) {
        setDetectedPatterns(data.filter(d => d.pattern_type !== 'support' && d.pattern_type !== 'resistance').map(d => ({
          id: d.id,
          type: d.pattern_type,
          confidence: Number(d.confidence),
          location: (d.location_data as any) || { x: 0, y: 0, width: 100, height: 100 },
          direction: (d.direction as DetectedPattern['direction']) || 'neutral',
          priceTarget: d.price_target ? Number(d.price_target) : undefined,
          stopLoss: d.stop_loss ? Number(d.stop_loss) : undefined,
        })));

        setSupportResistance(data.filter(d => d.pattern_type === 'support' || d.pattern_type === 'resistance').map(d => ({
          type: d.pattern_type as 'support' | 'resistance',
          price: Number(d.price_target) || 0,
          strength: Number(d.confidence),
          touches: 1,
        })));
      }
    };
    loadDetections();
  }, []);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string);
        if (autoDetect) {
          handleAnalyze();
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setAnalysisProgress(0);

    // Simulate analysis stages
    const stages = [
      "Preprocessing image...",
      "Detecting chart boundaries...",
      "Identifying candlesticks...",
      "Analyzing patterns...",
      "Computing support/resistance...",
      "Drawing trendlines...",
      "Generating predictions...",
    ];

    for (let i = 0; i < stages.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 500));
      setAnalysisProgress(((i + 1) / stages.length) * 100);
    }

    setIsAnalyzing(false);
    toast({
      title: "Analysis Complete",
      description: `Detected ${detectedPatterns.length} patterns and ${supportResistance.length} support/resistance levels`,
    });
  };

  const getDirectionColor = (direction: string) => {
    switch (direction) {
      case "bullish": return "text-success";
      case "bearish": return "text-destructive";
      default: return "text-gold";
    }
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="image-upload" className="cursor-pointer">
                <div className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary-hover transition-colors">
                  <Upload className="h-4 w-4" />
                  Upload Chart
                </div>
              </Label>
              <Input 
                id="image-upload" 
                type="file" 
                accept="image/*" 
                className="hidden"
                onChange={handleImageUpload}
              />
            </div>

            <Select value={detectionModel} onValueChange={setDetectionModel}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pattern-recognition">Pattern Recognition</SelectItem>
                <SelectItem value="candlestick-analysis">Candlestick Analysis</SelectItem>
                <SelectItem value="trendline-detection">Trendline Detection</SelectItem>
                <SelectItem value="fibonacci">Fibonacci Levels</SelectItem>
                <SelectItem value="elliot-waves">Elliott Wave Analysis</SelectItem>
                <SelectItem value="harmonic">Harmonic Patterns</SelectItem>
                <SelectItem value="all">All Detectors</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
              <Label className="text-sm whitespace-nowrap">Sensitivity: {sensitivityLevel[0]}%</Label>
              <Slider 
                value={sensitivityLevel} 
                onValueChange={setSensitivityLevel}
                max={100}
                min={10}
              />
            </div>

            <div className="flex items-center gap-2">
              <Switch checked={showOverlay} onCheckedChange={setShowOverlay} />
              <Label className="text-sm">Show Overlay</Label>
            </div>

            <div className="flex items-center gap-2">
              <Switch checked={autoDetect} onCheckedChange={setAutoDetect} />
              <Label className="text-sm">Auto Detect</Label>
            </div>

            <Button onClick={handleAnalyze} disabled={isAnalyzing}>
              {isAnalyzing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Scan className="h-4 w-4 mr-2" />
                  Analyze
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {isAnalyzing && (
        <Card>
          <CardContent className="py-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Analysis Progress</span>
                <span>{analysisProgress.toFixed(0)}%</span>
              </div>
              <Progress value={analysisProgress} />
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Canvas */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Chart Analysis
            </CardTitle>
            <CardDescription>Upload a chart image or connect to live feed</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative bg-secondary/30 rounded-lg aspect-video flex items-center justify-center border-2 border-dashed">
              {selectedImage ? (
                <div className="relative w-full h-full">
                  <img 
                    src={selectedImage} 
                    alt="Chart" 
                    className="w-full h-full object-contain"
                  />
                  {showOverlay && detectedPatterns.map((pattern) => (
                    <div 
                      key={pattern.id}
                      className={`absolute border-2 ${pattern.direction === "bullish" ? "border-success" : "border-destructive"} rounded`}
                      style={{
                        left: pattern.location.x,
                        top: pattern.location.y,
                        width: pattern.location.width,
                        height: pattern.location.height,
                      }}
                    >
                      <div className={`absolute -top-6 left-0 text-xs px-1 rounded ${pattern.direction === "bullish" ? "bg-success" : "bg-destructive"} text-white`}>
                        {pattern.type} ({pattern.confidence}%)
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center">
                  <Camera className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Upload a chart image to analyze</p>
                  <p className="text-sm text-muted-foreground mt-2">Supports PNG, JPG, WEBP</p>
                </div>
              )}
            </div>
            <div className="flex justify-center gap-2 mt-4">
              <Button variant="outline" size="icon">
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon">
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon">
                <RotateCw className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon">
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Detection Results */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Detected Patterns
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[250px]">
                <div className="space-y-3">
                  {detectedPatterns.map((pattern) => (
                    <div key={pattern.id} className="p-3 bg-secondary/30 rounded-lg border">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold">{pattern.type}</span>
                        <Badge className={getDirectionColor(pattern.direction)}>
                          {pattern.direction === "bullish" ? (
                            <TrendingUp className="h-3 w-3 mr-1" />
                          ) : (
                            <TrendingDown className="h-3 w-3 mr-1" />
                          )}
                          {pattern.direction}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <Progress value={pattern.confidence} className="h-2 flex-1" />
                        <span className="text-sm font-mono">{pattern.confidence}%</span>
                      </div>
                      {pattern.priceTarget && (
                        <div className="text-xs grid grid-cols-2 gap-2">
                          <span>Target: <span className="text-success font-mono">${pattern.priceTarget.toLocaleString()}</span></span>
                          <span>Stop: <span className="text-destructive font-mono">${pattern.stopLoss?.toLocaleString()}</span></span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5" />
                Support/Resistance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {supportResistance.map((level, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-secondary/30 rounded">
                    <div className="flex items-center gap-2">
                      <Badge variant={level.type === "resistance" ? "destructive" : "default"}>
                        {level.type === "resistance" ? "R" : "S"}
                      </Badge>
                      <span className="font-mono">${level.price.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{level.touches} touches</span>
                      <Progress value={level.strength} className="w-16 h-2" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Additional Analysis */}
      <Tabs defaultValue="candlestick" className="space-y-4">
        <TabsList>
          <TabsTrigger value="candlestick">Candlestick Patterns</TabsTrigger>
          <TabsTrigger value="trendlines">Trendlines</TabsTrigger>
          <TabsTrigger value="fibonacci">Fibonacci</TabsTrigger>
          <TabsTrigger value="harmonic">Harmonic Patterns</TabsTrigger>
        </TabsList>

        <TabsContent value="candlestick">
          <Card>
            <CardHeader>
              <CardTitle>Candlestick Pattern Detection</CardTitle>
              <CardDescription>Identified Japanese candlestick patterns</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {candlestickPatterns.map((pattern, idx) => (
                  <div key={idx} className="p-4 border rounded-lg hover:shadow-md transition-all">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">{pattern.pattern}</h4>
                      <Badge variant={pattern.signal === "Buy" ? "default" : pattern.signal === "Sell" ? "destructive" : "secondary"}>
                        {pattern.signal}
                      </Badge>
                    </div>
                    <div className="text-sm space-y-1">
                      <p><span className="text-muted-foreground">Timeframe:</span> {pattern.timeframe}</p>
                      <p><span className="text-muted-foreground">Location:</span> {pattern.location}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Confidence:</span>
                        <Progress value={pattern.confidence} className="h-2 flex-1" />
                        <span className="font-mono">{pattern.confidence}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trendlines">
          <Card>
            <CardHeader>
              <CardTitle>Automatic Trendline Detection</CardTitle>
              <CardDescription>AI-detected trend lines and channels</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {trendlines.map((line, idx) => (
                  <div key={idx} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold flex items-center gap-2">
                        <Activity className="h-4 w-4" />
                        {line.type}
                      </h4>
                      <Badge variant={line.valid ? "default" : "secondary"}>
                        {line.valid ? "Valid" : "Broken"}
                      </Badge>
                    </div>
                    <div className="text-sm space-y-1">
                      <p><span className="text-muted-foreground">Start:</span> ${line.startPrice.toLocaleString()}</p>
                      <p><span className="text-muted-foreground">End:</span> ${line.endPrice.toLocaleString()}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Strength:</span>
                        <Progress value={line.strength} className="h-2 flex-1" />
                        <span className="font-mono">{line.strength}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fibonacci">
          <Card>
            <CardHeader>
              <CardTitle>Fibonacci Retracement Levels</CardTitle>
              <CardDescription>Key retracement and extension levels</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[
                  { level: "0.0%", price: 48500, type: "High" },
                  { level: "23.6%", price: 46320, type: "Retracement" },
                  { level: "38.2%", price: 44780, type: "Retracement" },
                  { level: "50.0%", price: 43500, type: "Retracement" },
                  { level: "61.8%", price: 42220, type: "Golden Ratio" },
                  { level: "78.6%", price: 40640, type: "Retracement" },
                  { level: "100%", price: 38500, type: "Low" },
                  { level: "161.8%", price: 32340, type: "Extension" },
                  { level: "261.8%", price: 22340, type: "Extension" },
                ].map((fib, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-secondary/30 rounded">
                    <div className="flex items-center gap-3">
                      <Badge variant={fib.level === "61.8%" ? "default" : "outline"}>
                        {fib.level}
                      </Badge>
                      <span className="font-mono">${fib.price.toLocaleString()}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{fib.type}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="harmonic">
          <Card>
            <CardHeader>
              <CardTitle>Harmonic Pattern Detection</CardTitle>
              <CardDescription>Advanced harmonic pattern recognition</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { pattern: "Gartley", status: "Forming", completion: 78, direction: "Bullish" },
                  { pattern: "Bat", status: "Complete", completion: 100, direction: "Bearish" },
                  { pattern: "Butterfly", status: "Potential", completion: 45, direction: "Bullish" },
                  { pattern: "Crab", status: "Not Detected", completion: 0, direction: "-" },
                ].map((pattern, idx) => (
                  <div key={idx} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold">{pattern.pattern}</h4>
                      <Badge variant={pattern.status === "Complete" ? "default" : pattern.status === "Forming" ? "secondary" : "outline"}>
                        {pattern.status}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Completion:</span>
                        <Progress value={pattern.completion} className="h-2 flex-1" />
                        <span className="font-mono text-sm">{pattern.completion}%</span>
                      </div>
                      <p className="text-sm">
                        <span className="text-muted-foreground">Direction:</span>{" "}
                        <span className={pattern.direction === "Bullish" ? "text-success" : pattern.direction === "Bearish" ? "text-destructive" : ""}>
                          {pattern.direction}
                        </span>
                      </p>
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

export default ComputerVisionLab;
