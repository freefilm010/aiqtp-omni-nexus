import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useMarketPrices } from "@/hooks/useMarketPrices";
import {
  Brain,
  TrendingUp,
  TrendingDown,
  Minus,
  Loader2,
  Target,
  Activity,
  AlertTriangle,
  Shield,
  Zap,
  RefreshCw
} from "lucide-react";

interface PredictionResult {
  symbol: string;
  timeframe: string;
  model: string;
  prediction: {
    predictedPrice: number;
    confidence: number;
    direction: 'bullish' | 'bearish' | 'neutral';
    analysis: string;
    supportLevel: number;
    resistanceLevel: number;
    volatilityScore: number;
    riskScore: number;
  };
  timestamp: string;
  currentPrice: number;
}

const AIPredictionEngine = () => {
  const { prices } = useMarketPrices(10000);
  const [selectedSymbol, setSelectedSymbol] = useState('BTC');
  const [selectedTimeframe, setSelectedTimeframe] = useState<'1h' | '4h' | '24h' | '7d'>('24h');
  const [selectedModel, setSelectedModel] = useState<'LSTM' | 'AR' | 'Ensemble'>('Ensemble');
  const [isLoading, setIsLoading] = useState(false);
  const [predictions, setPredictions] = useState<PredictionResult[]>([]);
  const [currentPrediction, setCurrentPrediction] = useState<PredictionResult | null>(null);

  const symbols = [
    { value: 'BTC', label: 'Bitcoin' },
    { value: 'ETH', label: 'Ethereum' },
    { value: 'SOL', label: 'Solana' },
    { value: 'BNB', label: 'BNB' },
    { value: 'XRP', label: 'XRP' },
    { value: 'ADA', label: 'Cardano' },
  ];

  const generatePrediction = useCallback(async () => {
    setIsLoading(true);
    
    try {
      const currentPrice = prices[selectedSymbol]?.priceNumeric || 0;
      const changeStr = prices[selectedSymbol]?.change || '0';
      const change24h = parseFloat(String(changeStr).replace(/[^0-9.-]/g, '')) || 0;
      
      // Derive historical price estimates from current price and 24h change
      // This provides a realistic trend rather than random noise
      const priceYesterday = currentPrice / (1 + change24h / 100);
      const historicalPrices: number[] = [];
      
      for (let i = 0; i < 24; i++) {
        // Linear interpolation from yesterday to now with slight volatility
        const progress = i / 23;
        const basePrice = priceYesterday + (currentPrice - priceYesterday) * progress;
        // Add small controlled variance based on typical hourly volatility
        const hourlyVolatility = 0.005; // 0.5% per hour typical
        const variance = Math.sin(i * 0.5) * hourlyVolatility * basePrice;
        historicalPrices.push(basePrice + variance);
      }

      const { data, error } = await supabase.functions.invoke('ml-predictions', {
        body: {
          symbol: selectedSymbol,
          timeframe: selectedTimeframe,
          model: selectedModel,
          historicalPrices,
          currentPrice,
          change24h
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      const result: PredictionResult = {
        ...data,
        currentPrice
      };

      setCurrentPrediction(result);
      setPredictions(prev => [result, ...prev.slice(0, 9)]);
      toast.success(`Prediction generated for ${selectedSymbol}`);
    } catch (error) {
      console.error('Prediction error:', error);
      toast.error('Failed to generate prediction. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedSymbol, selectedTimeframe, selectedModel, prices]);

  const getDirectionIcon = (direction: string) => {
    switch (direction) {
      case 'bullish': return <TrendingUp className="h-5 w-5 text-green-500" />;
      case 'bearish': return <TrendingDown className="h-5 w-5 text-red-500" />;
      default: return <Minus className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getDirectionColor = (direction: string) => {
    switch (direction) {
      case 'bullish': return 'bg-green-500/10 text-green-500 border-green-500/30';
      case 'bearish': return 'bg-red-500/10 text-red-500 border-red-500/30';
      default: return 'bg-muted';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-500';
    if (score >= 40) return 'text-amber-500';
    return 'text-red-500';
  };

  return (
    <div className="space-y-6">
      {/* Control Panel */}
      <Card className="bg-gradient-to-br from-purple-500/5 to-blue-500/5 border-purple-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-500" />
            AI Prediction Engine
          </CardTitle>
          <CardDescription>
            Powered by Lovable AI • Uses LSTM, AR, and Ensemble models based on research methodology
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 sm:flex gap-2 sm:gap-4 items-end">
            <div className="space-y-1 sm:space-y-2 flex-1">
              <label className="text-[10px] sm:text-sm font-medium">Asset</label>
              <Select value={selectedSymbol} onValueChange={setSelectedSymbol}>
                <SelectTrigger className="h-8 sm:h-10 text-xs sm:text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {symbols.map(s => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1 sm:space-y-2 flex-1">
              <label className="text-[10px] sm:text-sm font-medium">Timeframe</label>
              <Select value={selectedTimeframe} onValueChange={(v) => setSelectedTimeframe(v as any)}>
                <SelectTrigger className="h-8 sm:h-10 text-xs sm:text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1h">1H</SelectItem>
                  <SelectItem value="4h">4H</SelectItem>
                  <SelectItem value="24h">24H</SelectItem>
                  <SelectItem value="7d">7D</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1 sm:space-y-2 flex-1">
              <label className="text-[10px] sm:text-sm font-medium">Model</label>
              <Select value={selectedModel} onValueChange={(v) => setSelectedModel(v as any)}>
                <SelectTrigger className="h-8 sm:h-10 text-xs sm:text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LSTM">LSTM</SelectItem>
                  <SelectItem value="AR">AR</SelectItem>
                  <SelectItem value="Ensemble">Ensemble</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={generatePrediction} 
              disabled={isLoading}
              className="col-span-3 sm:col-span-1 h-8 sm:h-10 text-xs sm:text-sm bg-gradient-to-r from-purple-500 to-blue-500"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 animate-spin" />
                  <span className="hidden sm:inline">Analyzing...</span>
                  <span className="sm:hidden">Analyze</span>
                </>
              ) : (
                <>
                  <Zap className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  <span className="hidden sm:inline">Generate Prediction</span>
                  <span className="sm:hidden">Predict</span>
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        {/* Current Prediction */}
        <div className="sm:col-span-2">
          {currentPrediction ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CardTitle className="flex items-center gap-2">
                      {currentPrediction.symbol}
                      {getDirectionIcon(currentPrediction.prediction.direction)}
                    </CardTitle>
                    <Badge variant="outline">{currentPrediction.timeframe}</Badge>
                    <Badge variant="secondary">{currentPrediction.model}</Badge>
                  </div>
                  <Badge className={getDirectionColor(currentPrediction.prediction.direction)}>
                    {currentPrediction.prediction.direction.toUpperCase()}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Price Prediction */}
                <div className="grid grid-cols-3 gap-2 sm:gap-4">
                  <div className="text-center p-2 sm:p-4 bg-muted/50 rounded-lg">
                    <p className="text-[10px] sm:text-sm text-muted-foreground mb-1">Current</p>
                    <p className="text-sm sm:text-2xl font-bold">
                      ${currentPrediction.currentPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </p>
                  </div>
                  <div className="text-center p-2 sm:p-4 bg-primary/10 rounded-lg">
                    <p className="text-[10px] sm:text-sm text-muted-foreground mb-1">Predicted</p>
                    <p className="text-sm sm:text-2xl font-bold text-primary">
                      ${currentPrediction.prediction.predictedPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </p>
                  </div>
                  <div className="text-center p-2 sm:p-4 bg-muted/50 rounded-lg">
                    <p className="text-[10px] sm:text-sm text-muted-foreground mb-1">Change</p>
                    <p className={`text-sm sm:text-2xl font-bold ${
                      currentPrediction.prediction.predictedPrice > currentPrediction.currentPrice 
                        ? 'text-green-500' 
                        : 'text-red-500'
                    }`}>
                      {((currentPrediction.prediction.predictedPrice - currentPrediction.currentPrice) / currentPrediction.currentPrice * 100).toFixed(2)}%
                    </p>
                  </div>
                </div>

                {/* Analysis */}
                <div className="p-4 bg-muted/30 rounded-lg">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Brain className="h-4 w-4" />
                    AI Analysis
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {currentPrediction.prediction.analysis}
                  </p>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Target className="h-3 w-3" />
                        Confidence
                      </span>
                      <span className={getScoreColor(currentPrediction.prediction.confidence)}>
                        {currentPrediction.prediction.confidence.toFixed(0)}%
                      </span>
                    </div>
                    <Progress value={currentPrediction.prediction.confidence} className="h-2" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Activity className="h-3 w-3" />
                        Volatility
                      </span>
                      <span className={getScoreColor(100 - currentPrediction.prediction.volatilityScore)}>
                        {currentPrediction.prediction.volatilityScore.toFixed(0)}%
                      </span>
                    </div>
                    <Progress value={currentPrediction.prediction.volatilityScore} className="h-2" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Risk
                      </span>
                      <span className={getScoreColor(100 - currentPrediction.prediction.riskScore)}>
                        {currentPrediction.prediction.riskScore.toFixed(0)}%
                      </span>
                    </div>
                    <Progress value={currentPrediction.prediction.riskScore} className="h-2" />
                  </div>

                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-1">Support / Resistance</p>
                    <p className="font-mono text-sm">
                      ${currentPrediction.prediction.supportLevel?.toLocaleString() || 'N/A'} / ${currentPrediction.prediction.resistanceLevel?.toLocaleString() || 'N/A'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-16 text-center">
                <Brain className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Prediction Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Select an asset and timeframe, then click "Generate Prediction"
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Prediction History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Recent Predictions
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[400px]">
              {predictions.length > 0 ? (
                <div className="space-y-2 p-4">
                  {predictions.map((pred, idx) => (
                    <div
                      key={idx}
                      className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => setCurrentPrediction(pred)}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold">{pred.symbol}</span>
                          {getDirectionIcon(pred.prediction.direction)}
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {pred.timeframe}
                        </Badge>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          ${pred.prediction.predictedPrice?.toLocaleString(undefined, { maximumFractionDigits: 0 }) || 'N/A'}
                        </span>
                        <span className={getScoreColor(pred.prediction.confidence)}>
                          {pred.prediction.confidence?.toFixed(0) || 0}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  No predictions yet
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AIPredictionEngine;
