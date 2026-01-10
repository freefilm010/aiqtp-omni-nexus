import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Shield, Zap, Globe, Bot, Atom, TrendingUp, Crown, Sparkles } from "lucide-react";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background">
      {/* Premium Background with Neon Accents */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-conglomerate"></div>
        
        {/* Neon grid lines */}
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: `
            linear-gradient(hsl(275, 100%, 60%) 1px, transparent 1px),
            linear-gradient(90deg, hsl(275, 100%, 60%) 1px, transparent 1px)
          `,
          backgroundSize: '100px 100px'
        }}></div>
        
        {/* Neon glow orbs */}
        <div className="absolute top-[10%] right-[15%] w-[500px] h-[500px] bg-royal-purple/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[20%] left-[10%] w-[400px] h-[400px] bg-royal-blue/10 rounded-full blur-[100px]"></div>
        <div className="absolute top-[40%] left-[50%] w-[300px] h-[300px] bg-gold/8 rounded-full blur-[80px]"></div>
      </div>
      
      {/* Animated Neon Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="animate-float absolute top-20 left-[10%] w-32 h-32 bg-accent/10 rounded-full blur-2xl"></div>
        <div className="animate-float absolute top-40 right-[15%] w-24 h-24 bg-royal-purple/15 rounded-full blur-xl" style={{ animationDelay: '1s' }}></div>
        <div className="animate-float absolute bottom-32 left-1/3 w-40 h-40 bg-royal-blue/10 rounded-full blur-3xl" style={{ animationDelay: '2s' }}></div>
        <div className="animate-float absolute top-1/3 right-1/4 w-20 h-20 bg-gold/10 rounded-full blur-xl" style={{ animationDelay: '1.5s' }}></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 text-center px-4 max-w-6xl mx-auto">
        {/* Neon Badge Row */}
        <div className="flex justify-center gap-3 mb-8">
          <Badge variant="outline" className="glass-effect border-gold/50 text-gold px-4 py-1.5 shadow-[0_0_15px_hsl(45,100%,50%,0.3)]">
            <Crown className="w-3.5 h-3.5 mr-1.5" />
            Next-Gen Trading
          </Badge>
          <Badge variant="outline" className="glass-effect border-royal-purple/50 text-royal-purple px-4 py-1.5 shadow-[0_0_15px_hsl(275,100%,60%,0.3)]">
            <Atom className="w-3.5 h-3.5 mr-1.5" />
            Quantum AI
          </Badge>
          <Badge variant="outline" className="glass-effect border-accent/50 text-accent px-4 py-1.5 shadow-[0_0_15px_hsl(155,100%,45%,0.3)]">
            <Shield className="w-3.5 h-3.5 mr-1.5" />
            Institutional-Grade
          </Badge>
        </div>
        
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 text-foreground leading-tight tracking-tight">
          <span className="text-gradient-gold drop-shadow-[0_0_30px_hsl(45,100%,50%,0.5)]">AIQTP™</span>
          <span className="block mt-2 text-foreground/90">
            Intelligent Trading Conglomerate
          </span>
        </h1>
        
        <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-4xl mx-auto leading-relaxed">
          The world's most advanced trading platform. AI-powered analytics, quantum-secure infrastructure, 
          and institutional-grade tools — all unified under one powerful ecosystem.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-14">
          <Link to="/auth">
            <Button variant="gold" size="xl" className="group shadow-[0_0_30px_hsl(45,100%,50%,0.4)] hover:shadow-[0_0_50px_hsl(45,100%,50%,0.6)] transition-all">
              <Sparkles className="w-5 h-5 mr-2" />
              Start Trading Now
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
          <Link to="/qaqi">
            <Button variant="glass" size="xl" className="group border-royal-purple/40 hover:border-royal-purple/70 hover:shadow-[0_0_25px_hsl(275,100%,60%,0.4)] transition-all">
              <Atom className="w-5 h-5 mr-2 text-royal-purple group-hover:animate-spin" />
              QAQI™ Agent
            </Button>
          </Link>
          <Link to="/vault">
            <Button variant="glass" size="xl" className="border-gold/40 hover:border-gold/70 hover:shadow-[0_0_25px_hsl(45,100%,50%,0.4)] transition-all">
              <Zap className="w-5 h-5 mr-2 text-gold" />
              Lightning Vault®
            </Button>
          </Link>
        </div>

        {/* Live Stats - Neon Glow Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mb-14">
          <div className="glass-effect rounded-xl p-5 border-gold/30 hover:border-gold/60 hover:shadow-[0_0_25px_hsl(45,100%,50%,0.3)] transition-all group">
            <div className="text-2xl md:text-3xl font-bold text-gold mb-1 group-hover:drop-shadow-[0_0_10px_hsl(45,100%,50%,0.8)]">$2.4B+</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider">24h Volume</div>
          </div>
          <div className="glass-effect rounded-xl p-5 border-accent/30 hover:border-accent/60 hover:shadow-[0_0_25px_hsl(155,100%,45%,0.3)] transition-all group">
            <div className="text-2xl md:text-3xl font-bold text-accent mb-1 group-hover:drop-shadow-[0_0_10px_hsl(155,100%,45%,0.8)]">50K+</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider">Active Traders</div>
          </div>
          <div className="glass-effect rounded-xl p-5 border-royal-blue/30 hover:border-royal-blue/60 hover:shadow-[0_0_25px_hsl(210,100%,55%,0.3)] transition-all group">
            <div className="text-2xl md:text-3xl font-bold text-royal-blue mb-1 group-hover:drop-shadow-[0_0_10px_hsl(210,100%,55%,0.8)]">200+</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider">Trading Pairs</div>
          </div>
          <div className="glass-effect rounded-xl p-5 border-royal-purple/30 hover:border-royal-purple/60 hover:shadow-[0_0_25px_hsl(275,100%,60%,0.3)] transition-all group">
            <div className="text-2xl md:text-3xl font-bold text-royal-purple mb-1 group-hover:drop-shadow-[0_0_10px_hsl(275,100%,60%,0.8)]">&lt;10ms</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider">Execution Speed</div>
          </div>
        </div>

        {/* Trust Indicators with Neon Icons */}
        <div className="flex flex-wrap justify-center items-center gap-8 text-muted-foreground text-sm">
          <div className="flex items-center gap-2 hover:text-gold transition-colors group">
            <Shield className="w-4 h-4 text-gold group-hover:drop-shadow-[0_0_8px_hsl(45,100%,50%,0.8)]" />
            <span>Post-Quantum Encryption</span>
          </div>
          <div className="flex items-center gap-2 hover:text-accent transition-colors group">
            <Globe className="w-4 h-4 text-accent group-hover:drop-shadow-[0_0_8px_hsl(155,100%,45%,0.8)]" />
            <span>200+ Countries</span>
          </div>
          <div className="flex items-center gap-2 hover:text-gold transition-colors group">
            <Zap className="w-4 h-4 text-gold group-hover:drop-shadow-[0_0_8px_hsl(45,100%,50%,0.8)]" />
            <span>Lightning Network</span>
          </div>
          <div className="flex items-center gap-2 hover:text-royal-purple transition-colors group">
            <Bot className="w-4 h-4 text-royal-purple group-hover:drop-shadow-[0_0_8px_hsl(275,100%,60%,0.8)]" />
            <span>AI Trading Bots™</span>
          </div>
          <div className="flex items-center gap-2 hover:text-royal-blue transition-colors group">
            <TrendingUp className="w-4 h-4 text-royal-blue group-hover:drop-shadow-[0_0_8px_hsl(210,100%,55%,0.8)]" />
            <span>ML Predictions</span>
          </div>
        </div>
      </div>

      {/* Scroll Indicator with Neon Glow */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-gold/50 rounded-full flex justify-center shadow-[0_0_15px_hsl(45,100%,50%,0.3)]">
          <div className="w-1 h-3 bg-gold rounded-full mt-2 animate-pulse shadow-[0_0_10px_hsl(45,100%,50%,0.8)]"></div>
        </div>
      </div>
    </section>
  );
};

export default Hero;