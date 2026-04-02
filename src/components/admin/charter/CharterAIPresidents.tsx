import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { Bot, Search, Shield, Wifi, WifiOff } from "lucide-react";

interface PresidentEntity {
  id: string;
  state: string;
  state_name: string;
  entity_name: string;
  entity_type: string;
  ai_president_name: string;
  ai_president_status: string;
  social_media_status: string;
  compliance_status: string;
  filing_status: string;
}

const CharterAIPresidents = () => {
  const [entities, setEntities] = useState<PresidentEntity[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await (supabase.from("charter_entities") as any)
        .select("id, state, state_name, entity_name, entity_type, ai_president_name, ai_president_status, social_media_status, compliance_status, filing_status")
        .order("priority_order", { ascending: true });
      if (data) setEntities(data);
      setLoading(false);
    };
    load();
  }, []);

  const filtered = entities.filter(e =>
    (e.ai_president_name || "").toLowerCase().includes(search.toLowerCase()) ||
    e.state_name.toLowerCase().includes(search.toLowerCase())
  );

  const active = entities.filter(e => e.ai_president_status === "active").length;
  const training = entities.filter(e => e.ai_president_status === "training").length;
  const pending = entities.filter(e => e.ai_president_status === "pending").length;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active": return <Wifi className="h-3 w-3 text-green-400" />;
      case "training": return <Bot className="h-3 w-3 text-yellow-400 animate-pulse" />;
      default: return <WifiOff className="h-3 w-3 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-500/20 text-green-400 border-green-500/30";
      case "training": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      default: return "bg-muted text-muted-foreground border-border";
    }
  };

  if (loading) return <div className="text-center p-8 text-muted-foreground">Loading AI Presidents...</div>;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-green-400">{active}</p>
          <p className="text-xs text-muted-foreground">Active</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-yellow-400">{training}</p>
          <p className="text-xs text-muted-foreground">Training</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-muted-foreground">{pending}</p>
          <p className="text-xs text-muted-foreground">Pending</p>
        </CardContent></Card>
      </div>

      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-4">
          <p className="text-sm font-medium text-foreground">🤖 AI President Program</p>
          <p className="text-xs text-muted-foreground mt-1">
            Each state LLC is managed by a dedicated AI President capable of autonomous enterprise management:
            compliance monitoring, social media, financial reporting, and regulatory filings.
          </p>
        </CardContent>
      </Card>

      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search AI Presidents..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[500px] overflow-y-auto">
        {filtered.map(entity => (
          <Card key={entity.id} className="border-border">
            <CardContent className="p-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Bot className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(entity.ai_president_status)}
                    <p className="text-sm font-bold text-foreground">{entity.ai_president_name || "Unassigned"}</p>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{entity.state_name} • {entity.entity_name}</p>
                </div>
                <div className="flex flex-col gap-1 items-end">
                  <Badge variant="outline" className={`text-[10px] ${getStatusColor(entity.ai_president_status)}`}>
                    {entity.ai_president_status}
                  </Badge>
                  <div className="flex gap-1">
                    <Badge variant="outline" className={`text-[9px] ${entity.social_media_status === 'active' ? 'text-green-400' : 'text-muted-foreground'}`}>
                      Social: {entity.social_media_status.replace("_", " ")}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default CharterAIPresidents;
