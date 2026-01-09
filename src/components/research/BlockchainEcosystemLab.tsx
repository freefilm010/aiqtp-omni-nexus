import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import {
  Brain,
  Sparkles,
  Search,
  Loader2,
  Atom,
  Shield,
  Database,
  Layers,
  TrendingUp,
  Globe,
  Zap,
  Building2,
  Heart,
  Truck,
  Wallet,
  Scale
} from 'lucide-react';

const RESEARCH_TYPES = [
  {
    id: 'ecosystem_opportunities',
    name: 'Ecosystem Opportunities',
    description: 'Discover the top blockchain ecosystems needed in the market',
    icon: TrendingUp,
    color: 'from-green-500 to-emerald-600'
  },
  {
    id: 'quantum_insurance',
    name: 'Quantum Insurance',
    description: 'Design quantum-enhanced insurance blockchain systems',
    icon: Shield,
    color: 'from-blue-500 to-cyan-600'
  },
  {
    id: 'data_ecosystem_analysis',
    name: '$DATA Expansion',
    description: 'Analyze expansion opportunities for the DATA token ecosystem',
    icon: Database,
    color: 'from-purple-500 to-pink-600'
  }
];

const ECOSYSTEM_IDEAS = [
  { name: 'Quantum Insurance', icon: Shield, category: 'InsurTech', status: 'researching' },
  { name: 'Healthcare Data Chain', icon: Heart, category: 'HealthTech', status: 'concept' },
  { name: 'Supply Chain Oracle', icon: Truck, category: 'Logistics', status: 'concept' },
  { name: 'DeFi Credit Score', icon: Wallet, category: 'DeFi', status: 'concept' },
  { name: 'Legal Smart Contracts', icon: Scale, category: 'LegalTech', status: 'concept' },
  { name: 'Real Estate Tokenization', icon: Building2, category: 'PropTech', status: 'concept' }
];

export const BlockchainEcosystemLab = () => {
  const [selectedResearch, setSelectedResearch] = useState(RESEARCH_TYPES[0].id);
  const [context, setContext] = useState('');
  const [isResearching, setIsResearching] = useState(false);
  const [researchOutput, setResearchOutput] = useState('');

  const runResearch = async () => {
    setIsResearching(true);
    setResearchOutput('');

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/blockchain-research`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            researchType: selectedResearch,
            context: context || undefined
          }),
        }
      );

      if (!response.ok) {
        if (response.status === 429) {
          toast.error('Rate limit exceeded. Please wait a moment and try again.');
          return;
        }
        if (response.status === 402) {
          toast.error('Credits required. Please add funds to continue.');
          return;
        }
        throw new Error('Research request failed');
      }

      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              setResearchOutput(prev => prev + content);
            }
          } catch {
            buffer = line + '\n' + buffer;
            break;
          }
        }
      }

      toast.success('Research complete!');
    } catch (error) {
      console.error('Research error:', error);
      toast.error('Failed to complete research. Please try again.');
    } finally {
      setIsResearching(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            Blockchain Ecosystem Research Lab
          </h2>
          <p className="text-muted-foreground">
            AI-powered research to discover the next big blockchain ecosystems
          </p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          <Sparkles className="h-4 w-4 mr-2" />
          AI Research
        </Badge>
      </div>

      {/* Quick Ideas Panel */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Ecosystem Ideas Pipeline</CardTitle>
          <CardDescription>Concepts being researched and developed</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            {ECOSYSTEM_IDEAS.map((idea, i) => (
              <div 
                key={i}
                className="p-3 rounded-lg border bg-card hover:border-primary/50 transition-colors cursor-pointer"
              >
                <idea.icon className="h-6 w-6 text-primary mb-2" />
                <p className="text-sm font-medium">{idea.name}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-muted-foreground">{idea.category}</span>
                  <Badge 
                    variant="outline" 
                    className={`text-[10px] ${idea.status === 'researching' ? 'bg-green-500/10 text-green-500' : ''}`}
                  >
                    {idea.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="research" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="research">AI Research</TabsTrigger>
          <TabsTrigger value="output">Research Output</TabsTrigger>
        </TabsList>

        <TabsContent value="research" className="space-y-4">
          {/* Research Type Selection */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {RESEARCH_TYPES.map((type) => (
              <Card 
                key={type.id}
                className={`cursor-pointer transition-all ${
                  selectedResearch === type.id 
                    ? 'ring-2 ring-primary border-primary' 
                    : 'hover:border-primary/50'
                }`}
                onClick={() => setSelectedResearch(type.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`h-10 w-10 rounded-lg bg-gradient-to-br ${type.color} flex items-center justify-center`}>
                      <type.icon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-medium">{type.name}</h4>
                      <p className="text-sm text-muted-foreground">{type.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Context Input */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Search className="h-5 w-5" />
                Research Context (Optional)
              </CardTitle>
              <CardDescription>
                Add specific areas of interest, constraints, or focus areas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="E.g., Focus on quantum computing applications for parametric insurance, or explore healthcare data privacy solutions..."
                value={context}
                onChange={(e) => setContext(e.target.value)}
                className="min-h-24"
              />
              <Button 
                className="w-full" 
                size="lg"
                onClick={runResearch}
                disabled={isResearching}
              >
                {isResearching ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Researching with AI...
                  </>
                ) : (
                  <>
                    <Atom className="h-4 w-4 mr-2" />
                    Run AI Research
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="output" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Research Findings
              </CardTitle>
              <CardDescription>
                AI-generated analysis and recommendations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px] rounded-lg border bg-muted/30 p-4">
                {researchOutput ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                    {researchOutput}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <Brain className="h-12 w-12 mb-4 opacity-50" />
                    <p>Run a research query to see AI-generated insights</p>
                    <p className="text-sm">Select a research type and click "Run AI Research"</p>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Featured Ecosystem: Quantum Insurance */}
      <Card className="bg-gradient-to-br from-blue-500/10 via-cyan-500/5 to-purple-500/10 border-blue-500/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle>Quantum Insurance Blockchain</CardTitle>
                <CardDescription>Featured Ecosystem Concept</CardDescription>
              </div>
            </div>
            <Badge className="bg-blue-500/20 text-blue-400">Hot Topic</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-background/50">
              <Atom className="h-5 w-5 text-purple-400 mb-2" />
              <h4 className="font-medium">Quantum Risk Models</h4>
              <p className="text-xs text-muted-foreground mt-1">
                Quantum algorithms for actuarial calculations and risk assessment
              </p>
            </div>
            <div className="p-4 rounded-lg bg-background/50">
              <Zap className="h-5 w-5 text-yellow-400 mb-2" />
              <h4 className="font-medium">Parametric Triggers</h4>
              <p className="text-xs text-muted-foreground mt-1">
                Instant payouts based on oracle-verified events
              </p>
            </div>
            <div className="p-4 rounded-lg bg-background/50">
              <Globe className="h-5 w-5 text-green-400 mb-2" />
              <h4 className="font-medium">Global Coverage</h4>
              <p className="text-xs text-muted-foreground mt-1">
                Cross-border insurance pools with unified claims
              </p>
            </div>
            <div className="p-4 rounded-lg bg-background/50">
              <Layers className="h-5 w-5 text-blue-400 mb-2" />
              <h4 className="font-medium">Multi-Token Model</h4>
              <p className="text-xs text-muted-foreground mt-1">
                $QINS parent token with category-specific child tokens
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
