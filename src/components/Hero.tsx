import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Shield, Zap, Globe, Bot, Atom, TrendingUp, Crown, Sparkles } from "lucide-react";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background">
      {/* Premium Background Pattern */}
      <div className="absolute inset-0">
        {/* Dark gradient base */}
        <div className="absolute inset-0 bg-gradient-conglomerate"></div>
        
        {/* Subtle gold accent lines */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `repeating-linear-gradient(
            45deg,
            transparent,
            transparent 100px,
            hsl(45, 100%, 50%) 100px,
            hsl(45, 100%, 50%) 101px
          )`
        }}></div>
        
        {/* Corner accent glow */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-radial from-gold/5 via-transparent to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-radial from-royal-purple/5 via-transparent to-transparent rounded-full blur-3xl"></div>
      </div>
      
      {/* Animated Accent Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="animate-float absolute top-20 left-[10%] w-32 h-32 bg-gold/5 rounded-full blur-2xl"></div>
        <div className="animate-float absolute top-40 right-[15%] w-24 h-24 bg-accent/5 rounded-full blur-xl" style={{ animationDelay: '1s' }}></div>
        <div className="animate-float absolute bottom-32 left-1/3 w-40 h-40 bg-royal-blue/5 rounded-full blur-3xl" style={{ animationDelay: '2s' }}></div>
        <div className="animate-float absolute top-1/3 right-1/4 w-20 h-20 bg-royal-purple/5 rounded-full blur-xl" style={{ animationDelay: '1.5s' }}></div>
        <div className="animate-float absolute bottom-1/4 right-[10%] w-28 h-28 bg-royal-red/3 rounded-full blur-2xl" style={{ animationDelay: '0.5s' }}></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 text-center px-4 max-w-6xl mx-auto">
        {/* Premium Badge Row */}
        <div className="flex justify-center gap-3 mb-8">
          <Badge variant="outline" className="glass-effect border-gold/40 text-gold px-4 py-1.5">
            <Crown className="w-3.5 h-3.5 mr-1.5" />
            Next-Gen Trading
          </Badge>
          <Badge variant="outline" className="glass-effect border-royal-purple/40 text-royal-purple px-4 py-1.5">
            <Atom className="w-3.5 h-3.5 mr-1.5" />
            Quantum AI
          </Badge>
          <Badge variant="outline" className="glass-effect border-accent/40 text-accent px-4 py-1.5">
            <Shield className="w-3.5 h-3.5 mr-1.5" />
            Institutional-Grade
          </Badge>
        </div>
        
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 text-foreground leading-tight tracking-tight">
          <span className="text-gradient-gold">AIQTP™</span>
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
            <Button variant="gold" size="xl" className="group shadow-gold hover:shadow-glow-gold transition-all">
              <Sparkles className="w-5 h-5 mr-2" />
              Start Trading Now
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
          <Link to="/qaqi">
            <Button variant="glass" size="xl" className="group border-royal-purple/30 hover:border-royal-purple/50">
              <Atom className="w-5 h-5 mr-2 text-royal-purple group-hover:animate-spin" />
              QAQI™ Agent
            </Button>
          </Link>
          <Link to="/vault">
            <Button variant="glass" size="xl" className="border-gold/30 hover:border-gold/50">
              <Zap className="w-5 h-5 mr-2 text-gold" />
              Lightning Vault®
            </Button>
          </Link>
        </div>

        {/* Live Stats - Premium Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mb-14">
          <div className="glass-effect rounded-xl p-5 border-gold/20 hover:border-gold/40 transition-all">
            <div className="text-2xl md:text-3xl font-bold text-gold mb-1">$2.4B+</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider">24h Volume</div>
          </div>
          <div className="glass-effect rounded-xl p-5 border-accent/20 hover:border-accent/40 transition-all">
            <div className="text-2xl md:text-3xl font-bold text-accent mb-1">50K+</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider">Active Traders</div>
          </div>
          <div className="glass-effect rounded-xl p-5 border-royal-blue/20 hover:border-royal-blue/40 transition-all">
            <div className="text-2xl md:text-3xl font-bold text-royal-blue mb-1">200+</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider">Trading Pairs</div>
          </div>
          <div className="glass-effect rounded-xl p-5 border-royal-purple/20 hover:border-royal-purple/40 transition-all">
            <div className="text-2xl md:text-3xl font-bold text-royal-purple mb-1">&lt;10ms</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider">Execution Speed</div>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="flex flex-wrap justify-center items-center gap-8 text-muted-foreground text-sm">
          <div className="flex items-center gap-2 hover:text-gold transition-colors">
            <Shield className="w-4 h-4 text-gold" />
            <span>Post-Quantum Encryption</span>
          </div>
          <div className="flex items-center gap-2 hover:text-accent transition-colors">
            <Globe className="w-4 h-4 text-accent" />
            <span>200+ Countries</span>
          </div>
          <div className="flex items-center gap-2 hover:text-gold transition-colors">
            <Zap className="w-4 h-4 text-gold" />
            <span>Lightning Network</span>
          </div>
          <div className="flex items-center gap-2 hover:text-royal-purple transition-colors">
            <Bot className="w-4 h-4 text-royal-purple" />
            <span>AI Trading Bots™</span>
          </div>
          <div className="flex items-center gap-2 hover:text-accent transition-colors">
            <TrendingUp className="w-4 h-4 text-accent" />
            <span>ML Predictions</span>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-gold/40 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-gold/70 rounded-full mt-2 animate-pulse"></div>
        </div>
      </div>
    </section>
  );
};

export default Hero;