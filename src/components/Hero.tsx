import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Shield, Zap, Globe, Bot, Atom, TrendingUp, Users } from "lucide-react";
import heroImage from "@/assets/hero-marketplace.jpg";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-hero">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        <img 
          src={heroImage} 
          alt="AIQTP Financial Marketplace"
          className="w-full h-full object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-hero opacity-80"></div>
      </div>
      
      {/* Animated Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="animate-float absolute top-20 left-20 w-32 h-32 bg-gold/10 rounded-full blur-xl"></div>
        <div className="animate-float absolute top-40 right-32 w-24 h-24 bg-accent/10 rounded-full blur-lg" style={{ animationDelay: '1s' }}></div>
        <div className="animate-float absolute bottom-32 left-1/3 w-40 h-40 bg-primary/10 rounded-full blur-2xl" style={{ animationDelay: '2s' }}></div>
        <div className="animate-float absolute top-1/3 right-1/4 w-20 h-20 bg-purple-500/10 rounded-full blur-xl" style={{ animationDelay: '1.5s' }}></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 text-center px-4 max-w-6xl mx-auto">
        <div className="flex justify-center gap-3 mb-6">
          <Badge variant="outline" className="glass-effect border-purple-500/30 text-purple-400">
            <Atom className="w-3 h-3 mr-1" />
            Quantum AI
          </Badge>
          <Badge variant="outline" className="glass-effect border-gold/30 text-gold">
            <Shield className="w-3 h-3 mr-1" />
            Institutional-Grade
          </Badge>
        </div>
        
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 text-white leading-tight">
          The World's Most
          <span className="text-gradient-gold block mt-2 animate-glow">
            Advanced Trading Platform
          </span>
        </h1>
        
        <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-4xl mx-auto leading-relaxed">
          Trade crypto, stocks, derivatives, and more with AI-powered insights and quantum-secure infrastructure.
          Outperforming top-tier competitors.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Link to="/auth">
            <Button variant="hero" size="xl" className="group">
              Start Trading Now
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
          <Link to="/qaqi">
            <Button variant="glass" size="xl" className="group">
              <Atom className="w-5 h-5 mr-2 text-purple-400 group-hover:animate-spin" />
              QAQI Agent
            </Button>
          </Link>
          <Link to="/vault">
            <Button variant="glass" size="xl">
              <Zap className="w-5 h-5 mr-2 text-gold" />
              Lightning Vault
            </Button>
          </Link>
        </div>

        {/* Live Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto mb-12">
          <div className="glass-effect rounded-lg p-4">
            <div className="text-2xl md:text-3xl font-bold text-gold">$2.4B+</div>
            <div className="text-xs text-white/60">24h Volume</div>
          </div>
          <div className="glass-effect rounded-lg p-4">
            <div className="text-2xl md:text-3xl font-bold text-white">50K+</div>
            <div className="text-xs text-white/60">Active Traders</div>
          </div>
          <div className="glass-effect rounded-lg p-4">
            <div className="text-2xl md:text-3xl font-bold text-accent">200+</div>
            <div className="text-xs text-white/60">Trading Pairs</div>
          </div>
          <div className="glass-effect rounded-lg p-4">
            <div className="text-2xl md:text-3xl font-bold text-purple-400">&lt;10ms</div>
            <div className="text-xs text-white/60">Execution Speed</div>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="flex flex-wrap justify-center items-center gap-6 text-white/80 text-sm">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-gold" />
            <span>Post-Quantum Encryption</span>
          </div>
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-accent" />
            <span>200+ Countries</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-gold" />
            <span>Lightning Network</span>
          </div>
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-purple-400" />
            <span>AI Trading Bots</span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-success" />
            <span>ML Predictions</span>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-white/70 rounded-full mt-2 animate-pulse"></div>
        </div>
      </div>
    </section>
  );
};

export default Hero;