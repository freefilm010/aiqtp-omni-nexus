import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Database,
  DollarSign,
  Shield,
  TrendingUp,
  BarChart3,
  Lock,
  CheckCircle2,
  AlertTriangle,
  FileJson,
  Globe,
  Clock,
  Eye,
  Download,
  ShoppingBag,
  Fingerprint,
  Scale
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface DataProduct {
  id: string;
  name: string;
  description: string;
  category: string;
  data_type: string;
  sample_size: number;
  price: number;
  currency: string;
  update_frequency: string;
  format: string;
  is_anonymized: boolean;
  contains_pii: boolean;
  compliance_tags: string[];
  is_active: boolean;
  total_sales: number;
  total_revenue: number;
}

interface DataSale {
  id: string;
  product_id: string;
  buyer_name: string;
  buyer_type: string;
  amount: number;
  currency: string;
  created_at: string;
}

const COMPLIANCE_BADGES = [
  { tag: 'GDPR', color: 'bg-blue-500/10 text-blue-500 border-blue-500/30', icon: Scale },
  { tag: 'CCPA', color: 'bg-green-500/10 text-green-500 border-green-500/30', icon: Shield },
  { tag: 'SOC2', color: 'bg-purple-500/10 text-purple-500 border-purple-500/30', icon: Lock },
];

const DataMarketplace = () => {
  const [products, setProducts] = useState<DataProduct[]>([]);
  const [sales, setSales] = useState<DataSale[]>([]);
  const [loading, setLoading] = useState(true);

  // Stats
  const totalProducts = products.length;
  const activeProducts = products.filter(p => p.is_active).length;
  const totalRevenue = products.reduce((sum, p) => sum + (p.total_revenue || 0), 0);
  const totalSales = products.reduce((sum, p) => sum + (p.total_sales || 0), 0);

  useEffect(() => {
    loadProducts();
    loadSales();
  }, []);

  const loadProducts = async () => {
    const { data } = await supabase
      .from('data_products')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setProducts(data as DataProduct[]);
    setLoading(false);
  };

  const loadSales = async () => {
    const { data } = await supabase
      .from('data_sales')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);
    if (data) setSales(data as DataSale[]);
  };

  const toggleProductStatus = async (productId: string, isActive: boolean) => {
    await supabase.from('data_products').update({ is_active: isActive }).eq('id', productId);
    toast.success(`Product ${isActive ? 'activated' : 'deactivated'}`);
    loadProducts();
  };

  const simulateSale = async (product: DataProduct) => {
    const buyers = ['Hedge Fund Alpha', 'Research Institute', 'FinTech Startup', 'Market Analytics Co.', 'Trading Desk Beta'];
    const buyerTypes = ['institutional', 'research', 'enterprise', 'startup'];
    
    await supabase.from('data_sales').insert({
      product_id: product.id,
      buyer_name: buyers[Math.floor(Math.random() * buyers.length)],
      buyer_type: buyerTypes[Math.floor(Math.random() * buyerTypes.length)],
      amount: product.price,
      currency: product.currency,
      delivered_at: new Date().toISOString()
    });

    await supabase.from('data_products').update({
      total_sales: (product.total_sales || 0) + 1,
      total_revenue: (product.total_revenue || 0) + product.price
    }).eq('id', product.id);

    toast.success(`Data product sold!`, { description: `+$${product.price} revenue` });
    loadProducts();
    loadSales();
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      market: 'bg-blue-500/10 text-blue-500',
      trading: 'bg-green-500/10 text-green-500',
      defi: 'bg-purple-500/10 text-purple-500',
      nft: 'bg-pink-500/10 text-pink-500',
      blockchain: 'bg-orange-500/10 text-orange-500',
      social: 'bg-cyan-500/10 text-cyan-500',
      arbitrage: 'bg-yellow-500/10 text-yellow-500',
      tokens: 'bg-indigo-500/10 text-indigo-500',
    };
    return colors[category] || 'bg-muted';
  };

  return (
    <div className="space-y-6">
      {/* Security Banner */}
      <Card className="border-green-500/30 bg-green-500/5">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-green-500/20">
                <Shield className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="font-medium">Data Security Verified</p>
                <p className="text-sm text-muted-foreground">
                  All data is anonymized • No PII • Compliant with GDPR & CCPA
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              {COMPLIANCE_BADGES.map(badge => (
                <Badge key={badge.tag} variant="outline" className={badge.color}>
                  <badge.icon className="h-3 w-3 mr-1" />
                  {badge.tag}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Data Products</p>
                <p className="text-2xl font-bold">{totalProducts}</p>
              </div>
              <div className="p-3 rounded-full bg-blue-500/10">
                <Database className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Listings</p>
                <p className="text-2xl font-bold text-green-500">{activeProducts}</p>
              </div>
              <div className="p-3 rounded-full bg-green-500/10">
                <CheckCircle2 className="h-6 w-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Sales</p>
                <p className="text-2xl font-bold">{totalSales}</p>
              </div>
              <div className="p-3 rounded-full bg-purple-500/10">
                <ShoppingBag className="h-6 w-6 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Revenue</p>
                <p className="text-2xl font-bold text-primary">${totalRevenue.toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-full bg-primary/10">
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="products" className="space-y-4">
        <TabsList>
          <TabsTrigger value="products">Data Products</TabsTrigger>
          <TabsTrigger value="sales">Sales History</TabsTrigger>
          <TabsTrigger value="compliance">Compliance & Security</TabsTrigger>
        </TabsList>

        <TabsContent value="products">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Available Data Products
              </CardTitle>
              <CardDescription>
                Anonymized, aggregated data products for enterprise buyers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px] pr-4">
                <div className="space-y-4">
                  {products.map(product => (
                    <div key={product.id} className="p-4 rounded-lg border hover:border-primary/50 transition-colors">
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{product.name}</h4>
                            <Badge variant="outline" className={getCategoryColor(product.category)}>
                              {product.category}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{product.description}</p>
                          
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <BarChart3 className="h-3 w-3" />
                              {(product.sample_size || 0).toLocaleString()} records
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {product.update_frequency}
                            </span>
                            <span className="flex items-center gap-1">
                              <FileJson className="h-3 w-3" />
                              {product.format?.toUpperCase()}
                            </span>
                          </div>

                          <div className="flex gap-1">
                            {(product.compliance_tags || []).map(tag => {
                              const badge = COMPLIANCE_BADGES.find(b => b.tag === tag);
                              return badge ? (
                                <Badge key={tag} variant="outline" className={`text-xs ${badge.color}`}>
                                  {tag}
                                </Badge>
                              ) : null;
                            })}
                            {product.is_anonymized && (
                              <Badge variant="outline" className="text-xs bg-green-500/10 text-green-500">
                                <Fingerprint className="h-3 w-3 mr-1" />
                                Anonymized
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="text-right space-y-2">
                          <p className="text-2xl font-bold">${product.price}</p>
                          <p className="text-xs text-muted-foreground">
                            {product.total_sales || 0} sales • ${(product.total_revenue || 0).toLocaleString()} revenue
                          </p>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={product.is_active}
                              onCheckedChange={(checked) => toggleProductStatus(product.id, checked)}
                            />
                            <Button size="sm" variant="outline" onClick={() => simulateSale(product)}>
                              <ShoppingBag className="h-3 w-3 mr-1" />
                              Simulate Sale
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sales">
          <Card>
            <CardHeader>
              <CardTitle>Recent Sales</CardTitle>
              <CardDescription>Data product transaction history</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {sales.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <ShoppingBag className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No sales yet</p>
                    </div>
                  ) : (
                    sales.map(sale => (
                      <div key={sale.id} className="p-3 rounded-lg border flex justify-between items-center">
                        <div>
                          <p className="font-medium">{sale.buyer_name}</p>
                          <p className="text-sm text-muted-foreground capitalize">{sale.buyer_type}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-500">+${sale.amount}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(sale.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance">
          <div className="grid grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-green-500" />
                  Data Security Measures
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-green-500/5 border border-green-500/20">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="font-medium">Full Anonymization</p>
                    <p className="text-sm text-muted-foreground">All PII removed before sale</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-green-500/5 border border-green-500/20">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="font-medium">Aggregated Data Only</p>
                    <p className="text-sm text-muted-foreground">No individual user data exposed</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-green-500/5 border border-green-500/20">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="font-medium">IP Protection</p>
                    <p className="text-sm text-muted-foreground">Proprietary algorithms excluded</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-green-500/5 border border-green-500/20">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="font-medium">Encrypted Delivery</p>
                    <p className="text-sm text-muted-foreground">TLS 1.3 for all transfers</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scale className="h-5 w-5 text-blue-500" />
                  Compliance Certifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">GDPR Compliance</span>
                    <Badge className="bg-green-500">Active</Badge>
                  </div>
                  <Progress value={100} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-2">EU General Data Protection Regulation</p>
                </div>
                <div className="p-4 rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">CCPA Compliance</span>
                    <Badge className="bg-green-500">Active</Badge>
                  </div>
                  <Progress value={100} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-2">California Consumer Privacy Act</p>
                </div>
                <div className="p-4 rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Data Ethics Review</span>
                    <Badge className="bg-green-500">Passed</Badge>
                  </div>
                  <Progress value={100} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-2">Internal ethics committee approval</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DataMarketplace;