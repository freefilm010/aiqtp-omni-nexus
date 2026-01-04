import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { BarChart3, TrendingUp, Zap } from "lucide-react";

const features = [
  { name: 'RSI', importance: 0.85, category: 'Technical' },
  { name: 'MACD', importance: 0.78, category: 'Technical' },
  { name: 'Volume', importance: 0.72, category: 'Market' },
  { name: 'Sentiment Score', importance: 0.68, category: 'Alternative' },
  { name: 'Moving Average', importance: 0.65, category: 'Technical' },
  { name: 'Bollinger Width', importance: 0.58, category: 'Volatility' },
  { name: 'Open Interest', importance: 0.52, category: 'Market' },
  { name: 'Funding Rate', importance: 0.48, category: 'Market' },
  { name: 'Fear & Greed', importance: 0.45, category: 'Alternative' },
  { name: 'ATR', importance: 0.42, category: 'Volatility' },
];

const FeatureImportance = () => {
  return (
    <div className="grid grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Feature Importance
          </CardTitle>
          <CardDescription>Which features contribute most to predictions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={features} layout="vertical">
                <XAxis type="number" domain={[0, 1]} tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} />
                <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v: number) => `${(v * 100).toFixed(1)}%`} />
                <Bar 
                  dataKey="importance" 
                  fill="hsl(var(--primary))" 
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Feature Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {features.map((feature, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-muted-foreground w-6">#{i + 1}</span>
                <div>
                  <span className="font-medium">{feature.name}</span>
                  <Badge variant="outline" className="ml-2 text-xs">{feature.category}</Badge>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Progress value={feature.importance * 100} className="w-20" />
                <span className="font-mono text-sm w-12 text-right">
                  {(feature.importance * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default FeatureImportance;
