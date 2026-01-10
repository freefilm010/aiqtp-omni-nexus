import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Shield, Zap, Globe, Bot, Atom, TrendingUp, Crown, Sparkles, BarChart3, Wallet } from "lucide-react";

// AI Bot Minion SVG Component
const AIBotMinion = ({ className, delay = 0 }: { className?: string; delay?: number }) => (
  <div 
    className={`absolute opacity-30 hover:opacity-60 transition-opacity ${className}`}
    style={{ animationDelay: `${delay}s` }}
  >
    <div className="relative animate-float">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-royal-purple to-neon-cyan flex items-center justify-center shadow-[0_0_15px_hsl(280,100%,65%,0.5)]">
        <Bot className="w-4 h-4 text-white" />
      </div>
      <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-accent animate-pulse"></div>
    </div>
  </div>
);

// Candlestick Component for Chart Backdrop
const CandlestickChart = () => {
  // Generate realistic candlestick data showing struggle with overall gains
  const candles = [
    { open: 45, close: 52, high: 55, low: 42, type: 'bull' },
    { open: 52, close: 48, high: 54, low: 46, type: 'bear' },
    { open: 48, close: 55, high: 58, low: 47, type: 'bull' },
    { open: 55, close: 51, high: 57, low: 49, type: 'bear' },
    { open: 51, close: 58, high: 62, low: 50, type: 'bull' },
    { open: 58, close: 54, high: 60, low: 52, type: 'bear' },
    { open: 54, close: 62, high: 65, low: 53, type: 'bull' },
    { open: 62, close: 59, high: 64, low: 57, type: 'bear' },
    { open: 59, close: 68, high: 72, low: 58, type: 'bull' },
    { open: 68, close: 65, high: 70, low: 63, type: 'bear' },
    { open: 65, close: 74, high: 78, low: 64, type: 'bull' },
    { open: 74, close: 71, high: 76, low: 69, type: 'bear' },
    { open: 71, close: 80, high: 84, low: 70, type: 'bull' },
    { open: 80, close: 78, high: 82, low: 75, type: 'bear' },
    { open: 78, close: 88, high: 92, low: 77, type: 'bull' },
  ];

  return (
    <div className="absolute inset-0 flex items-end justify-center pb-20 opacity-[0.08]">
      <div className="flex items-end gap-3 h-80">
        {candles.map((candle, i) => {
          const bodyHeight = Math.abs(candle.close - candle.open) * 2;
          const wickTop = (candle.high - Math.max(candle.open, candle.close)) * 2;
          const wickBottom = (Math.min(candle.open, candle.close) - candle.low) * 2;
          const bodyBottom = (Math.min(candle.open, candle.close) - 30) * 2;
          
          return (
            <div key={i} className="relative flex flex-col items-center" style={{ height: '100%' }}>
              {/* Upper wick */}
              <div 
                className={`w-0.5 ${candle.type === 'bull' ? 'bg-accent' : 'bg-royal-red'}`}
                style={{ 
                  height: `${wickTop}px`,
                  position: 'absolute',
                  bottom: `${bodyBottom + bodyHeight}px`
                }}
              />
              {/* Body */}
              <div 
                className={`w-4 rounded-sm ${candle.type === 'bull' ? 'bg-accent shadow-[0_0_10px_hsl(145,100%,50%,0.5)]' : 'bg-royal-red shadow-[0_0_10px_hsl(0,100%,60%,0.3)]'}`}
                style={{ 
                  height: `${bodyHeight}px`,
                  position: 'absolute',
                  bottom: `${bodyBottom}px`
                }}
              />
              {/* Lower wick */}
              <div 
                className={`w-0.5 ${candle.type === 'bull' ? 'bg-accent' : 'bg-royal-red'}`}
                style={{ 
                  height: `${wickBottom}px`,
                  position: 'absolute',
                  bottom: `${bodyBottom - wickBottom}px`
                }}
              />
            </div>
          );
        })}
      </div>
      {/* Trend line showing overall gains */}
      <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="trendGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(145, 100%, 50%)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="hsl(48, 100%, 55%)" stopOpacity="0.6" />
          </linearGradient>
        </defs>
        <path 
          d="M 0 300 Q 150 280 300 250 T 600 180 T 900 120 T 1200 60" 
          stroke="url(#trendGradient)" 
          strokeWidth="2" 
          fill="none"
          className="drop-shadow-[0_0_8px_hsl(145,100%,50%,0.5)]"
        />
      </svg>
    </div>
  );
};

// Financial Documents Floating Elements
const FloatingDocs = () => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden">
    {/* Floating financial document icons */}
    <div className="absolute top-[15%] left-[5%] w-16 h-20 rounded bg-card/30 border border-gold/10 opacity-20 rotate-[-5deg] animate-float">
      <div className="p-2 space-y-1">
        <div className="h-1 w-10 bg-gold/30 rounded"></div>
        <div className="h-1 w-8 bg-gold/20 rounded"></div>
        <div className="h-1 w-12 bg-gold/20 rounded"></div>
      </div>
    </div>
    <div className="absolute top-[25%] right-[8%] w-14 h-18 rounded bg-card/30 border border-royal-blue/10 opacity-15 rotate-[8deg] animate-float" style={{ animationDelay: '1.5s' }}>
      <div className="p-2 space-y-1">
        <BarChart3 className="w-6 h-6 text-royal-blue/40" />
      </div>
    </div>
    <div className="absolute bottom-[30%] left-[12%] w-12 h-16 rounded bg-card/30 border border-accent/10 opacity-20 rotate-[3deg] animate-float" style={{ animationDelay: '2s' }}>
      <div className="p-2">
        <TrendingUp className="w-5 h-5 text-accent/40" />
      </div>
    </div>
  </div>
);

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background">
      {/* Premium Background with Financial Backdrop */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-hero"></div>
        
        {/* Candlestick Chart Background */}
        <CandlestickChart />
        
        {/* Symmetric Grid Pattern */}
        <div className="absolute inset-0 opacity-[0.015]" style={{
          backgroundImage: `
            linear-gradient(hsl(215, 100%, 60%) 1px, transparent 1px),
            linear-gradient(90deg, hsl(215, 100%, 60%) 1px, transparent 1px)
          `,
          backgroundSize: '80px 80px'
        }}></div>
        
        {/* Symmetric Neon glow orbs */}
        <div className="absolute top-[10%] right-[10%] w-[450px] h-[450px] bg-royal-purple/8 rounded-full blur-[150px]"></div>
        <div className="absolute top-[10%] left-[10%] w-[450px] h-[450px] bg-royal-blue/6 rounded-full blur-[150px]"></div>
        <div className="absolute bottom-[15%] right-[15%] w-[350px] h-[350px] bg-accent/6 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[15%] left-[15%] w-[350px] h-[350px] bg-gold/5 rounded-full blur-[120px]"></div>
        <div className="absolute top-[45%] left-[50%] -translate-x-1/2 w-[500px] h-[500px] bg-gold/4 rounded-full blur-[180px]"></div>
      </div>
      
      {/* Floating Financial Documents */}
      <FloatingDocs />
      
      {/* AI Bot Minions scattered throughout */}
      <AIBotMinion className="top-[18%] left-[8%]" delay={0} />
      <AIBotMinion className="top-[22%] right-[12%]" delay={0.5} />
      <AIBotMinion className="bottom-[35%] left-[6%]" delay={1} />
      <AIBotMinion className="bottom-[28%] right-[9%]" delay={1.5} />
      <AIBotMinion className="top-[45%] left-[3%]" delay={2} />
      <AIBotMinion className="top-[40%] right-[5%]" delay={2.5} />
      <AIBotMinion className="bottom-[50%] left-[15%]" delay={0.8} />
      <AIBotMinion className="bottom-[45%] right-[18%]" delay={1.3} />

      {/* Main Content */}
      <div className="relative z-10 text-center px-4 max-w-6xl mx-auto">
        {/* Neon Badge Row - Feature Specific Colors */}
        <div className="flex justify-center gap-3 mb-8 flex-wrap">
          <Badge variant="outline" className="glass-effect border-gold/50 text-gold px-4 py-1.5 shadow-[0_0_20px_hsl(48,100%,55%,0.3)]">
            <Crown className="w-3.5 h-3.5 mr-1.5" />
            Next-Gen Trading
          </Badge>
          <Badge variant="outline" className="glass-effect border-royal-purple/50 text-royal-purple px-4 py-1.5 shadow-[0_0_20px_hsl(280,100%,65%,0.3)]">
            <Atom className="w-3.5 h-3.5 mr-1.5" />
            QAQI™ Quantum AI
          </Badge>
          <Badge variant="outline" className="glass-effect border-accent/50 text-accent px-4 py-1.5 shadow-[0_0_20px_hsl(145,100%,50%,0.3)]">
            <Shield className="w-3.5 h-3.5 mr-1.5" />
            Institutional-Grade
          </Badge>
        </div>
        
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 text-foreground leading-tight tracking-tight">
          <span className="text-gradient-gold drop-shadow-[0_0_40px_hsl(48,100%,55%,0.5)]">AIQTP™</span>
          <span className="block mt-2 text-foreground/90">
            Intelligent Trading Conglomerate
          </span>
        </h1>
        
        <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-4xl mx-auto leading-relaxed">
          The world's most advanced trading platform. <span className="text-royal-purple">AI-powered analytics</span>, <span className="text-gold">quantum-secure infrastructure</span>, 
          and <span className="text-accent">institutional-grade tools</span> — all unified under one powerful ecosystem.
        </p>

        {/* Action Buttons - Feature Specific Colors */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-14">
          {/* Trading - Green */}
          <Link to="/auth">
            <Button variant="default" size="xl" className="group bg-accent hover:bg-accent-hover text-accent-foreground shadow-[0_0_35px_hsl(145,100%,50%,0.4)] hover:shadow-[0_0_50px_hsl(145,100%,50%,0.6)] transition-all">
              <Sparkles className="w-5 h-5 mr-2" />
              Start Trading Now
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
          {/* QAQI - Purple */}
          <Link to="/qaqi">
            <Button variant="glass" size="xl" className="group border-royal-purple/50 hover:border-royal-purple hover:bg-royal-purple/10 hover:shadow-[0_0_30px_hsl(280,100%,65%,0.4)] transition-all">
              <Atom className="w-5 h-5 mr-2 text-royal-purple group-hover:animate-spin" />
              <span className="text-royal-purple">QAQI™ Agent</span>
            </Button>
          </Link>
          {/* Lightning Vault - Gold/Yellow */}
          <Link to="/vault">
            <Button variant="glass" size="xl" className="border-gold/50 hover:border-gold hover:bg-gold/10 hover:shadow-[0_0_30px_hsl(48,100%,55%,0.4)] transition-all">
              <Zap className="w-5 h-5 mr-2 text-gold" />
              <span className="text-gold">Lightning Vault®</span>
            </Button>
          </Link>
        </div>

        {/* Live Stats - Symmetric Layout with Feature Colors */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mb-14">
          <div className="glass-effect rounded-xl p-5 border-gold/30 hover:border-gold/60 hover:shadow-[0_0_30px_hsl(48,100%,55%,0.3)] transition-all group">
            <div className="text-2xl md:text-3xl font-bold text-gold mb-1 group-hover:drop-shadow-[0_0_15px_hsl(48,100%,55%,0.8)]">$2.4B+</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider">24h Volume</div>
          </div>
          <div className="glass-effect rounded-xl p-5 border-accent/30 hover:border-accent/60 hover:shadow-[0_0_30px_hsl(145,100%,50%,0.3)] transition-all group">
            <div className="text-2xl md:text-3xl font-bold text-accent mb-1 group-hover:drop-shadow-[0_0_15px_hsl(145,100%,50%,0.8)]">50K+</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider">Active Traders</div>
          </div>
          <div className="glass-effect rounded-xl p-5 border-royal-blue/30 hover:border-royal-blue/60 hover:shadow-[0_0_30px_hsl(215,100%,60%,0.3)] transition-all group">
            <div className="text-2xl md:text-3xl font-bold text-royal-blue mb-1 group-hover:drop-shadow-[0_0_15px_hsl(215,100%,60%,0.8)]">200+</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider">Trading Pairs</div>
          </div>
          <div className="glass-effect rounded-xl p-5 border-royal-purple/30 hover:border-royal-purple/60 hover:shadow-[0_0_30px_hsl(280,100%,65%,0.3)] transition-all group">
            <div className="text-2xl md:text-3xl font-bold text-royal-purple mb-1 group-hover:drop-shadow-[0_0_15px_hsl(280,100%,65%,0.8)]">&lt;10ms</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider">AI Execution</div>
          </div>
        </div>

        {/* Trust Indicators with Feature-Specific Colors */}
        <div className="flex flex-wrap justify-center items-center gap-8 text-muted-foreground text-sm">
          <div className="flex items-center gap-2 hover:text-gold transition-colors group">
            <Shield className="w-4 h-4 text-gold group-hover:drop-shadow-[0_0_10px_hsl(48,100%,55%,0.8)]" />
            <span>Post-Quantum Encryption</span>
          </div>
          <div className="flex items-center gap-2 hover:text-royal-blue transition-colors group">
            <Globe className="w-4 h-4 text-royal-blue group-hover:drop-shadow-[0_0_10px_hsl(215,100%,60%,0.8)]" />
            <span>200+ Countries</span>
          </div>
          <div className="flex items-center gap-2 hover:text-gold transition-colors group">
            <Zap className="w-4 h-4 text-gold group-hover:drop-shadow-[0_0_10px_hsl(48,100%,55%,0.8)]" />
            <span>Lightning Vault®</span>
          </div>
          <div className="flex items-center gap-2 hover:text-royal-purple transition-colors group">
            <Bot className="w-4 h-4 text-royal-purple group-hover:drop-shadow-[0_0_10px_hsl(280,100%,65%,0.8)]" />
            <span>AI Trading Bots™</span>
          </div>
          <div className="flex items-center gap-2 hover:text-accent transition-colors group">
            <TrendingUp className="w-4 h-4 text-accent group-hover:drop-shadow-[0_0_10px_hsl(145,100%,50%,0.8)]" />
            <span>ML Predictions</span>
          </div>
        </div>
      </div>

      {/* Scroll Indicator with Neon Glow */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-gold/50 rounded-full flex justify-center shadow-[0_0_20px_hsl(48,100%,55%,0.3)]">
          <div className="w-1 h-3 bg-gold rounded-full mt-2 animate-pulse shadow-[0_0_12px_hsl(48,100%,55%,0.8)]"></div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
