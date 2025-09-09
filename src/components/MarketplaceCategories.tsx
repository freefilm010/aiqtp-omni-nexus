import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Coins, 
  Home, 
  Gem, 
  Trophy, 
  Palette, 
  Gamepad2, 
  Wine, 
  ShieldCheck,
  TrendingUp,
  Building,
  Landmark,
  Globe
} from "lucide-react";

const categories = [
  {
    icon: Coins,
    title: "Cryptocurrency",
    description: "Trade all digital assets across multiple blockchains",
    color: "gold",
    features: ["Cross-chain trading", "DeFi integration", "Staking rewards"]
  },
  {
    icon: Home,
    title: "Real Estate",
    description: "Global property investments and tokenized real estate",
    color: "accent",
    features: ["Property tokens", "REITs", "Global markets"]
  },
  {
    icon: Gem,
    title: "Precious Metals",
    description: "Gold, silver, platinum and rare earth elements",
    color: "gold",
    features: ["Physical delivery", "Vault storage", "Spot pricing"]
  },
  {
    icon: Trophy,
    title: "Collectibles",
    description: "Trading cards, memorabilia, and rare collectibles",
    color: "accent",
    features: ["Authentication", "Grading", "Insurance"]
  },
  {
    icon: Palette,
    title: "Art & NFTs",
    description: "Digital and physical art marketplace",
    color: "primary",
    features: ["Provenance", "Appraisals", "Exhibitions"]
  },
  {
    icon: Gamepad2,
    title: "Virtual Assets",
    description: "Gaming items, virtual worlds, and metaverse properties",
    color: "accent",
    features: ["Cross-game items", "Virtual land", "Gaming tokens"]
  },
  {
    icon: Wine,
    title: "Luxury Goods",
    description: "Fine wines, watches, and premium collectibles",
    color: "gold",
    features: ["Certification", "Storage", "Auction house"]
  },
  {
    icon: Building,
    title: "Financial Products",
    description: "Insurance, investments, and institutional vehicles",
    color: "primary",
    features: ["Life insurance", "Investment funds", "Derivatives"]
  }
];

const MarketplaceCategories = () => {
  return (
    <section className="py-24 bg-gradient-premium">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
            Every Asset Class
            <span className="text-gradient-gold block mt-2">Under One Roof</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            From traditional investments to cutting-edge digital assets, 
            AIQTP provides institutional-grade access to global markets.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {categories.map((category, index) => {
            const Icon = category.icon;
            const colorClass = category.color === 'gold' ? 'text-gold' : 
                             category.color === 'accent' ? 'text-accent' : 'text-primary';
            
            return (
              <Card 
                key={category.title}
                className="card-premium p-6 group cursor-pointer border-none"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="text-center">
                  <div className={`inline-flex p-4 rounded-full bg-gradient-premium mb-4 group-hover:shadow-gold transition-smooth`}>
                    <Icon className={`w-8 h-8 ${colorClass}`} />
                  </div>
                  
                  <h3 className="text-xl font-semibold mb-3 text-foreground">
                    {category.title}
                  </h3>
                  
                  <p className="text-muted-foreground mb-4 text-sm leading-relaxed">
                    {category.description}
                  </p>
                  
                  <div className="space-y-2 mb-4">
                    {category.features.map((feature, i) => (
                      <div key={i} className="flex items-center text-xs text-muted-foreground">
                        <ShieldCheck className="w-3 h-3 text-success mr-2" />
                        {feature}
                      </div>
                    ))}
                  </div>
                  
                  <Button variant="outline" size="sm" className="w-full group-hover:border-gold transition-smooth">
                    Explore
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div className="space-y-2">
            <div className="text-3xl md:text-4xl font-bold text-primary">$2.5T+</div>
            <div className="text-muted-foreground text-sm">Total Asset Value</div>
          </div>
          <div className="space-y-2">
            <div className="text-3xl md:text-4xl font-bold text-gold">50M+</div>
            <div className="text-muted-foreground text-sm">Active Traders</div>
          </div>
          <div className="space-y-2">
            <div className="text-3xl md:text-4xl font-bold text-accent">99.9%</div>
            <div className="text-muted-foreground text-sm">Uptime</div>
          </div>
          <div className="space-y-2">
            <div className="text-3xl md:text-4xl font-bold text-primary">200+</div>
            <div className="text-muted-foreground text-sm">Countries</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MarketplaceCategories;