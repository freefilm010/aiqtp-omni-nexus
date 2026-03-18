import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import {
  Plug, Unlink, ExternalLink, Link2, Shield,
  CheckCircle2, Dice5, Cpu, Coins, Wallet,
  ArrowRightLeft, Globe
} from "lucide-react";

interface SatelliteService {
  id: string;
  name: string;
  category: string;
  subcategory: string | null;
  description: string | null;
  website_url: string | null;
  supported_chains: string[];
  features: Record<string, boolean>;
  is_usa_compatible: boolean;
  is_crypto_native: boolean;
  requires_api_key: boolean;
  revenue_model: string | null;
}

interface UserConnection {
  id: string;
  service_id: string;
  connection_status: string;
  connected_at: string | null;
}

const categoryMeta: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  casino: { icon: <Dice5 className="h-5 w-5" />, label: "Casino & Gaming", color: "text-amber-500" },
  mining: { icon: <Cpu className="h-5 w-5" />, label: "Mining Pools", color: "text-orange-500" },
  staking: { icon: <Coins className="h-5 w-5" />, label: "Staking", color: "text-emerald-500" },
  wallet: { icon: <Wallet className="h-5 w-5" />, label: "Wallets", color: "text-blue-500" },
  dex: { icon: <ArrowRightLeft className="h-5 w-5" />, label: "DEX & Security", color: "text-purple-500" },
  exchange: { icon: <Globe className="h-5 w-5" />, label: "Exchanges", color: "text-cyan-500" },
};

interface Props {
  filter?: string;
  categories?: string[];
}

const SatelliteServicesSection = ({ filter = "", categories }: Props) => {
  const { user } = useAuth();
  const [services, setServices] = useState<SatelliteService[]>([]);
  const [connections, setConnections] = useState<UserConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectDialog, setConnectDialog] = useState<SatelliteService | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    fetchServices();
    if (user) fetchConnections();
  }, [user]);

  const fetchServices = async () => {
    const { data } = await supabase
      .from("satellite_services")
      .select("id,name,category,subcategory,description,website_url,supported_chains,features,is_usa_compatible,is_crypto_native,requires_api_key,revenue_model")
      .eq("is_active", true)
      .order("sort_order");
    setServices((data as SatelliteService[]) || []);
    setLoading(false);
  };

  const fetchConnections = async () => {
    const { data } = await supabase
      .from("user_service_connections")
      .select("id,service_id,connection_status,connected_at")
      .eq("user_id", user!.id);
    setConnections((data as UserConnection[]) || []);
  };

  const isConnected = (serviceId: string) =>
    connections.some(c => c.service_id === serviceId && c.connection_status === "connected");

  const handleConnect = async (service: SatelliteService) => {
    if (!user) { toast.error("Sign in to connect services"); return; }
    if (service.requires_api_key) { setConnectDialog(service); return; }
    setConnecting(true);
    const { error } = await supabase.from("user_service_connections").upsert({
      user_id: user.id, service_id: service.id,
      connection_status: "connected", connected_at: new Date().toISOString(),
    }, { onConflict: "user_id,service_id" });
    if (error) toast.error("Connection failed");
    else { toast.success(`Connected to ${service.name}`); fetchConnections(); }
    setConnecting(false);
  };

  const handleApiKeyConnect = async () => {
    if (!connectDialog || !user || !apiKeyInput.trim()) return;
    setConnecting(true);
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(apiKeyInput));
    const hashHex = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");
    const { error } = await supabase.from("user_service_connections").upsert({
      user_id: user.id, service_id: connectDialog.id,
      connection_status: "connected", api_key_hash: hashHex,
      connected_at: new Date().toISOString(),
    }, { onConflict: "user_id,service_id" });
    if (error) toast.error("Connection failed");
    else { toast.success(`Connected to ${connectDialog.name}`); fetchConnections(); }
    setConnecting(false);
    setConnectDialog(null);
    setApiKeyInput("");
  };

  const handleDisconnect = async (serviceId: string) => {
    if (!user) return;
    await supabase.from("user_service_connections")
      .update({ connection_status: "disconnected" })
      .eq("user_id", user.id).eq("service_id", serviceId);
    toast.success("Disconnected");
    fetchConnections();
  };

  const filtered = services.filter(s => {
    if (categories && !categories.includes(s.category)) return false;
    if (!filter) return true;
    const q = filter.toLowerCase();
    return s.name.toLowerCase().includes(q) ||
      s.category.toLowerCase().includes(q) ||
      s.supported_chains.some(c => c.toLowerCase().includes(q));
  });

  const groupedByCategory = Object.keys(categoryMeta)
    .filter(cat => !categories || categories.includes(cat))
    .map(cat => ({ cat, items: filtered.filter(s => s.category === cat) }))
    .filter(g => g.items.length > 0);

  if (loading) return null;
  if (groupedByCategory.length === 0) return null;

  return (
    <>
      <div className="space-y-6">
        {groupedByCategory.map(({ cat, items }) => {
          const meta = categoryMeta[cat];
          return (
            <div key={cat} className="space-y-3">
              <div className="flex items-center gap-2">
                <span className={meta.color}>{meta.icon}</span>
                <h3 className="text-lg font-semibold">{meta.label}</h3>
                <Badge variant="outline" className="text-xs">{items.length}</Badge>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {items.map(service => {
                  const connected = isConnected(service.id);
                  const featureKeys = Object.entries(service.features || {}).filter(([, v]) => v).map(([k]) => k);
                  return (
                    <Card key={service.id} className={`transition-all hover:shadow-lg ${connected ? "border-emerald-500/40 bg-emerald-500/5" : "hover:border-primary/30"}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-sm truncate">{service.name}</h4>
                              {service.is_usa_compatible && (
                                <Badge variant="outline" className="text-[10px] shrink-0 border-blue-500 text-blue-500">🇺🇸</Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{service.description}</p>
                          </div>
                          {connected && <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />}
                        </div>
                        <div className="flex flex-wrap gap-1 mb-3">
                          {service.supported_chains.slice(0, 4).map(chain => (
                            <Badge key={chain} variant="secondary" className="text-[10px] px-1.5">{chain}</Badge>
                          ))}
                          {service.supported_chains.length > 4 && (
                            <Badge variant="outline" className="text-[10px] px-1.5">+{service.supported_chains.length - 4}</Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1 mb-3">
                          {featureKeys.slice(0, 3).map(f => (
                            <span key={f} className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                              {f.replace(/_/g, " ")}
                            </span>
                          ))}
                        </div>
                        <div className="flex items-center gap-2">
                          {connected ? (
                            <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => handleDisconnect(service.id)}>
                              <Unlink className="h-3 w-3 mr-1" /> Disconnect
                            </Button>
                          ) : (
                            <Button variant="default" size="sm" className="w-full text-xs" onClick={() => handleConnect(service)} disabled={connecting}>
                              <Plug className="h-3 w-3 mr-1" /> Connect
                            </Button>
                          )}
                          {service.website_url && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" asChild>
                              <a href={service.website_url} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* API Key Dialog */}
      <Dialog open={!!connectDialog} onOpenChange={() => { setConnectDialog(null); setApiKeyInput(""); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5" /> Connect to {connectDialog?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Enter your API key from {connectDialog?.name}. Your key is hashed locally — we never store the original.
            </p>
            {connectDialog?.website_url && (
              <a href={connectDialog.website_url} target="_blank" rel="noopener noreferrer"
                className="text-xs text-primary hover:underline flex items-center gap-1">
                Get your API key at {connectDialog.name} <ExternalLink className="h-3 w-3" />
              </a>
            )}
            <Input type="password" placeholder="Paste your API key" value={apiKeyInput}
              onChange={e => setApiKeyInput(e.target.value)} />
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Shield className="h-3 w-3" /> SHA-256 hashed • Never stored in plaintext • Disconnect anytime
            </div>
            <Button className="w-full" onClick={handleApiKeyConnect} disabled={!apiKeyInput.trim() || connecting}>
              {connecting ? "Connecting..." : "Connect Securely"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SatelliteServicesSection;
