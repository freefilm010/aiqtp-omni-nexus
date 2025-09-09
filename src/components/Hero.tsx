import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Shield, Zap, Globe } from "lucide-react";
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
      </div>

      {/* Main Content */}
      <div className="relative z-10 text-center px-4 max-w-6xl mx-auto">
        <Badge variant="outline" className="mb-6 glass-effect border-white/30 text-white">
          <Shield className="w-4 h-4 mr-2" />
          Institutional-Grade Security
        </Badge>
        
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 text-white leading-tight">
          The World's Most
          <span className="text-gradient-gold block mt-2 animate-glow">
            Comprehensive Marketplace
          </span>
        </h1>
        
        <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-4xl mx-auto leading-relaxed">
          Trade everything from crypto and real estate to collectibles and precious metals. 
          <span className="text-gold font-semibold"> One platform. Infinite possibilities.</span>
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Button variant="hero" size="xl" className="group">
            Start Trading Now
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Button>
          <Button variant="glass" size="xl">
            <Zap className="w-5 h-5 mr-2" />
            Lightning Vault
          </Button>
        </div>

        {/* Trust Indicators */}
        <div className="flex flex-wrap justify-center items-center gap-8 text-white/80">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-gold" />
            <span>SHA-3 2048-bit Encryption</span>
          </div>
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-accent" />
            <span>Global SWIFT Integration</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-gold" />
            <span>Lightning Network</span>
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