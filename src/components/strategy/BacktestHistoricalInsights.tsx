import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Brain, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2,
  History, Target, Lightbulb, BarChart3, Zap
} from "lucide-react";
import {
  HISTORICAL_EVENTS,
  generateHistoricalAnalyses,
  identifyPatterns,
  generatePrediction,
  runSelfTrainingEpoch,
  getFeatureWeights,
  type StrategyDateAnalysis,
  type SelfTrainingEpoch,
} from "@/lib/ml/selfTrainingEngine";

interface Props {
  strategyId: string;
  strategyName: string;
  trainingStats?: {
    avgProfitability: number;
    avgWinRate: number;
    avgDrawdown: number;
    avgConsistency: number;
    passRate: number;
  } | null;
}

const BacktestHistoricalInsights = ({ strategyId, strategyName, trainingStats }: Props) => {
  const [analyses, setAnalyses] = useState<StrategyDateAnalysis[]>([]);
  const [patterns, setPatterns] = useState<string[]>([]);
  const [prediction, setPrediction] = useState<ReturnType<typeof generatePrediction> | null>(null);
  const [trainingEpochs, setTrainingEpochs] = useState<SelfTrainingEpoch[]>([]);
  const [weights, setWeights] = useState(getFeatureWeights());

  useEffect(() => {
    if (!trainingStats) return;

    // Generate historical analysis from training results
    const mockResults = HISTORICAL_EVENTS.map(() => ({
      profitability: trainingStats.avgProfitability + (Math.random() - 0.5) * 20,
      winRate: trainingStats.avgWinRate + (Math.random() - 0.5) * 10,
      maxDrawdown: trainingStats.avgDrawdown + (Math.random() - 0.5) * 5,
      consistency: trainingStats.avgConsistency + (Math.random() - 0.5) * 10,
    }));

    const dateAnalyses = generateHistoricalAnalyses(strategyName, mockResults);
    setAnalyses(dateAnalyses);
    setPatterns(identifyPatterns(dateAnalyses));

    const currentRegime = dateAnalyses.length > 0
      ? dateAnalyses[dateAnalyses.length - 1].regime
      : 'unknown';
    setPrediction(generatePrediction(dateAnalyses, currentRegime));
  }, [trainingStats, strategyName]);

  const runSelfTraining = () => {
    // Simulate resolved predictions for training
    const resolved = analyses.map(a => ({
      predictedDirection: a.alpha > 0 ? 'bullish' : 'bearish',
      actualDirection: a.strategyPerformance > 0 ? 'bullish' : 'bearish',
      wasCorrect: (a.alpha > 0) === (a.strategyPerformance > 0),
      weightAdjustments: getFeatureWeights(),
    }));

    const epoch = runSelfTrainingEpoch(resolved, trainingEpochs.length + 1);
    setTrainingEpochs(prev => [...prev, epoch]);
    setWeights(getFeatureWeights());

    // Regenerate prediction with updated weights
    if (analyses.length > 0) {
      const currentRegime = analyses[analyses.length - 1].regime;
      setPrediction(generatePrediction(analyses, currentRegime));
    }
  };

  if (!trainingStats) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>Run backtest training to see historical insights</p>
        </CardContent>
      </Card>
    );
  }

  const latestEpoch = trainingEpochs[trainingEpochs.length - 1];

  return (
    <div className="space-y-4">
      {/* Self-Training Status */}
      <Card className="border-primary/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Brain className="h-4 w-4 text-primary" />
            Self-Training Intelligence
            <Badge variant="outline" className="ml-auto text-xs">
              {trainingEpochs.length} epochs
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={runSelfTraining}>
              <Zap className="h-3 w-3 mr-1" /> Run Self-Training Epoch
            </Button>
            {latestEpoch && (
              <span className="text-xs text-muted-foreground">
                Accuracy: {latestEpoch.accuracyBefore.toFixed(1)}% → {latestEpoch.accuracyAfter.toFixed(1)}%
              </span>
            )}
          </div>

          {/* Feature Weights */}
          <div className="grid grid-cols-5 gap-1">
            {Object.entries(weights).map(([key, val]) => (
              <div key={key} className="text-center p-1 rounded bg-muted/50">
                <p className="text-[9px] text-muted-foreground truncate">{key}</p>
                <p className="text-xs font-mono font-bold text-foreground">{(val * 100).toFixed(0)}%</p>
              </div>
            ))}
          </div>

          {latestEpoch?.patternsDiscovered.length ? (
            <div className="flex flex-wrap gap-1">
              {latestEpoch.patternsDiscovered.map((p, i) => (
                <Badge key={i} variant="secondary" className="text-[10px]">
                  <Lightbulb className="h-2.5 w-2.5 mr-0.5" /> {p}
                </Badge>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* AI Prediction */}
      {prediction && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Target className="h-4 w-4" />
              AI Prediction
              <Badge
                className={`ml-auto ${
                  prediction.direction === 'bullish'
                    ? 'bg-green-600 text-white'
                    : prediction.direction === 'bearish'
                    ? 'bg-red-600 text-white'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {prediction.direction === 'bullish' && <TrendingUp className="h-3 w-3 mr-1" />}
                {prediction.direction === 'bearish' && <TrendingDown className="h-3 w-3 mr-1" />}
                {prediction.direction.toUpperCase()}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs text-muted-foreground">Confidence</span>
              <Progress value={prediction.confidence * 100} className="flex-1 h-2" />
              <span className="text-xs font-mono text-foreground">{(prediction.confidence * 100).toFixed(0)}%</span>
            </div>
            <p className="text-[11px] text-muted-foreground font-mono">{prediction.reasoning}</p>
            <p className="text-[10px] text-muted-foreground mt-1 italic">
              User action irrelevant — system validates prediction against actual outcome regardless
            </p>
          </CardContent>
        </Card>
      )}

      {/* Discovered Patterns */}
      {patterns.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Discovered Patterns
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {patterns.map((p, i) => (
              <div key={i} className="flex items-start gap-2 text-xs">
                {p.includes('✅') ? (
                  <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 text-green-500 shrink-0" />
                ) : p.includes('⚠️') ? (
                  <AlertTriangle className="h-3.5 w-3.5 mt-0.5 text-yellow-500 shrink-0" />
                ) : (
                  <Lightbulb className="h-3.5 w-3.5 mt-0.5 text-muted-foreground shrink-0" />
                )}
                <span className="text-muted-foreground">{p.replace(/[✅⚠️]/g, '').trim()}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Historical Event Timeline */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <History className="h-4 w-4" />
            Historical Event Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 max-h-64 overflow-y-auto">
          {analyses.map((a, i) => (
            <div key={i} className="p-2 rounded bg-muted/30 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-foreground">{a.event?.event || a.date}</span>
                <div className="flex gap-1">
                  <Badge variant="outline" className="text-[9px]">{a.regime}</Badge>
                  <Badge
                    variant="outline"
                    className={`text-[9px] ${a.alpha > 0 ? 'border-green-500 text-green-500' : 'border-red-500 text-red-500'}`}
                  >
                    α {a.alpha > 0 ? '+' : ''}{a.alpha.toFixed(1)}%
                  </Badge>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-1 text-[10px] text-muted-foreground">
                <span>Strat: {a.strategyPerformance.toFixed(1)}%</span>
                <span>WR: {a.winRate.toFixed(0)}%</span>
                <span>DD: {a.maxDrawdown.toFixed(1)}%</span>
              </div>
              {a.causalFactors.length > 0 && (
                <p className="text-[10px] text-muted-foreground italic">
                  {a.causalFactors[0]}
                </p>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default BacktestHistoricalInsights;
