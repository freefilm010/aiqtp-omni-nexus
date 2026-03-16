import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { 
  Coins, Home, Gem, Trophy, Palette, Gamepad2, Wine, ShieldCheck,
  Building, Percent, ArrowRight, Zap
} from "lucide-react";

interface CategoryFee {
  category: string;
  display_name: string;
  finder_fee_percent: number;
  pass_through_fee_percent: number;
  is_active: boolean;
}

const categoryMeta: Record<string, { icon: any; color: string; features: string[] }> = {
  cryptocurrency: { icon: Coins, color: 'gold', features: ['Cross-chain trading', 'DeFi integration', 'Staking rewards'] },
  real_estate: { icon: Home, color: 'accent', features: ['Property tokens', 'REITs', 'Global markets'] },
  precious_metals: { icon: Gem, color: 'gold', features: ['Physical delivery', 'Vault storage', 'Spot pricing'] },
  collectibles: { icon: Trophy, color: 'accent', features: ['Authentication', 'Grading', 'Insurance'] },
  art_nfts: { icon: Palette, color: 'primary', features: ['Provenance', 'Appraisals', 'Exhibitions'] },
  virtual_assets: { icon: Gamepad2, color: 'accent', features: ['Cross-game items', 'Virtual land', 'Gaming tokens'] },
  luxury_goods: { icon: Wine, color: 'gold', features: ['Certification', 'Storage', 'Auction house'] },
  financial_products: { icon: Building, color: 'primary', features: ['Life insurance', 'Investment funds', 'Derivatives'] },
};

const MarketplaceCategories = () => {
  const [fees, setFees] = useState<CategoryFee[]>([]);

  useEffect(() => {
    const fetchFees = async () => {
      const { data } = await supabase
        .from('marketplace_category_fees')
        .select('*')
        .eq('is_active', true)
        .order('display_name');
      if (data) setFees(data as CategoryFee[]);
    };
    fetchFees();
  }, []);

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
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-sm text-primary font-medium">
              Deal facilitation with competitive finder's fees — we connect buyers & sellers
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {fees.length > 0 ? fees.map((fee, index) => {
            const meta = categoryMeta[fee.category] || { icon: Building, color: 'primary', features: [] };
            const Icon = meta.icon;
            const colorClass = meta.color === 'gold' ? 'text-gold' : 
                             meta.color === 'accent' ? 'text-accent' : 'text-primary';
            
            return (
              <Card 
                key={fee.category}
                className="card-premium p-6 group cursor-pointer border-none"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="text-center">
                  <div className="inline-flex p-4 rounded-full bg-gradient-premium mb-4 group-hover:shadow-gold transition-smooth">
                    <Icon className={`w-8 h-8 ${colorClass}`} />
                  </div>
                  
                  <h3 className="text-xl font-semibold mb-3 text-foreground">
                    {fee.display_name}
                  </h3>
                  
                  {/* Fee badges */}
                  <div className="flex flex-wrap justify-center gap-2 mb-4">
                    <Badge variant="outline" className="text-[10px] border-gold/30 text-gold">
                      <Percent className="w-3 h-3 mr-1" />
                      {fee.finder_fee_percent}% Finder's Fee
                    </Badge>
                    <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">
                      {fee.pass_through_fee_percent}% Pass-through
                    </Badge>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    {meta.features.map((feature, i) => (
                      <div key={i} className="flex items-center text-xs text-muted-foreground">
                        <ShieldCheck className="w-3 h-3 text-success mr-2" />
                        {feature}
                      </div>
                    ))}
                  </div>
                  
                  <Button variant="outline" size="sm" className="w-full group-hover:border-gold transition-smooth">
                    Browse Deals <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                </div>
              </Card>
            );
          }) : (
            // Fallback while loading
            Object.entries(categoryMeta).map(([key, meta], index) => {
              const Icon = meta.icon;
              const colorClass = meta.color === 'gold' ? 'text-gold' : 
                               meta.color === 'accent' ? 'text-accent' : 'text-primary';
              return (
                <Card key={key} className="card-premium p-6 group cursor-pointer border-none animate-pulse">
                  <div className="text-center">
                    <div className="inline-flex p-4 rounded-full bg-gradient-premium mb-4">
                      <Icon className={`w-8 h-8 ${colorClass}`} />
                    </div>
                    <div className="h-5 bg-muted rounded w-3/4 mx-auto mb-3" />
                    <div className="h-3 bg-muted rounded w-full mb-4" />
                  </div>
                </Card>
              );
            })
          )}
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
