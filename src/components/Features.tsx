import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Zap, 
  Shield, 
  Brain, 
  Globe, 
  Lock, 
  TrendingUp,
  Users,
  RefreshCw,
  Eye,
  Smartphone
} from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Lightning Vault",
    description: "Revolutionary wallet technology powered by Lightning Network for instant, secure transactions across all asset classes.",
    benefits: ["Instant settlements", "Cross-chain compatibility", "Zero gas fees"],
    color: "gold"
  },
  {
    icon: Brain,
    title: "AI-Powered Trading",
    description: "Advanced machine learning algorithms provide market insights, automated trading, and risk management.",
    benefits: ["Predictive analytics", "Automated strategies", "Risk optimization"],
    color: "accent"
  },
  {
    icon: Shield,
    title: "Military-Grade Security",
    description: "SHA-3 2048-bit encryption with FIPS 204-206 standards ensuring your assets are completely secure.",
    benefits: ["Quantum-resistant", "Multi-layer protection", "Insurance coverage"],
    color: "primary"
  },
  {
    icon: Globe,
    title: "Global Integration",
    description: "Seamlessly connect with SWIFT networks, international exchanges, and regulatory frameworks worldwide.",
    benefits: ["200+ countries", "Regulatory compliance", "Local payment methods"],
    color: "accent"
  },
  {
    icon: Users,
    title: "One Account System",
    description: "Single KYC verification per SSN/EIN eliminates fake accounts and ensures marketplace integrity.",
    benefits: ["Verified users only", "Anti-fraud protection", "Trust scores"],
    color: "primary"
  },
  {
    icon: Eye,
    title: "Transparent Trading",
    description: "Real-time market data, authentic user reviews, and complete transaction transparency.",
    benefits: ["Live market data", "User verification", "Transaction history"],
    color: "gold"
  }
];

const Features = () => {
  return (
    <section className="py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
            Next-Generation
            <span className="text-gradient-gold block mt-2">Trading Technology</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Built for institutional traders and individual investors alike, 
            our platform combines cutting-edge technology with uncompromising security.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            const colorClass = feature.color === 'gold' ? 'text-gold' : 
                             feature.color === 'accent' ? 'text-accent' : 'text-primary';
            
            return (
              <Card 
                key={feature.title}
                className="card-premium p-8 h-full border-none group"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="text-center space-y-6">
                  <div className={`inline-flex p-4 rounded-full bg-gradient-premium group-hover:shadow-gold transition-smooth`}>
                    <Icon className={`w-10 h-10 ${colorClass}`} />
                  </div>
                  
                  <div>
                    <h3 className="text-2xl font-bold mb-4 text-foreground">
                      {feature.title}
                    </h3>
                    
                    <p className="text-muted-foreground mb-6 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    {feature.benefits.map((benefit, i) => (
                      <div key={i} className="flex items-center text-sm text-muted-foreground">
                        <div className={`w-2 h-2 rounded-full ${colorClass === 'text-gold' ? 'bg-gold' : colorClass === 'text-accent' ? 'bg-accent' : 'bg-primary'} mr-3`}></div>
                        {benefit}
                      </div>
                    ))}
                  </div>
                  
                  <Button variant="outline" className="w-full mt-6 group-hover:border-gold transition-smooth">
                    Learn More
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Call to Action */}
        <div className="text-center mt-16">
          <Card className="card-premium p-12 bg-gradient-hero text-white border-none max-w-4xl mx-auto">
            <div className="space-y-6">
              <Smartphone className="w-16 h-16 text-gold mx-auto" />
              <h3 className="text-3xl font-bold">
                Ready to revolutionize your trading experience?
              </h3>
              <p className="text-xl text-white/90 max-w-2xl mx-auto">
                Join thousands of traders who've already discovered the future of asset management.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="gold" size="lg">
                  Create Account
                </Button>
                <Button variant="glass" size="lg">
                  Request Demo
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default Features;