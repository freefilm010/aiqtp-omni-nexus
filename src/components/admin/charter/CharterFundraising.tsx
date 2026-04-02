import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { DollarSign, TrendingUp, Building2, Search, ArrowUpRight } from "lucide-react";

interface CharterEntity {
  id: string;
  state: string;
  state_name: string;
  entity_name: string;
  entity_type: string;
  filing_status: string;
  fundraising_target: number;
  funds_raised: number;
  priority_order: number;
}

const CharterFundraising = () => {
  const [entities, setEntities] = useState<CharterEntity[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await (supabase.from("charter_entities") as any)
        .select("id, state, state_name, entity_name, entity_type, filing_status, fundraising_target, funds_raised, priority_order")
        .order("priority_order", { ascending: true });
      if (data) setEntities(data);
      setLoading(false);
    };
    load();
  }, []);

  const filtered = entities.filter(e =>
    e.entity_name.toLowerCase().includes(search.toLowerCase()) ||
    e.state_name.toLowerCase().includes(search.toLowerCase())
  );

  const totalCapacity = entities.reduce((s, e) => s + e.fundraising_target, 0);
  const totalRaised = entities.reduce((s, e) => s + e.funds_raised, 0);
  const activeEntities = entities.filter(e => e.filing_status !== "not_started").length;
  const filedEntities = entities.filter(e => e.filing_status === "filed" || e.filing_status === "approved").length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved": return "bg-green-500/20 text-green-400 border-green-500/30";
      case "filed": return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "in_progress": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      default: return "bg-muted text-muted-foreground border-border";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "parent": return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      case "primary": return "bg-primary/20 text-primary border-primary/30";
      default: return "bg-muted text-muted-foreground border-border";
    }
  };

  const fmt = (n: number) => n >= 1e6 ? `$${(n / 1e6).toFixed(1)}M` : `$${n.toLocaleString()}`;

  if (loading) return <div className="text-center p-8 text-muted-foreground">Loading entities...</div>;

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <DollarSign className="h-6 w-6 mx-auto mb-1 text-green-500" />
            <p className="text-xl font-bold text-foreground">{fmt(totalCapacity)}</p>
            <p className="text-xs text-muted-foreground">Annual Capacity</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-6 w-6 mx-auto mb-1 text-primary" />
            <p className="text-xl font-bold text-foreground">{fmt(totalRaised)}</p>
            <p className="text-xs text-muted-foreground">Total Raised</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Building2 className="h-6 w-6 mx-auto mb-1 text-yellow-500" />
            <p className="text-xl font-bold text-foreground">{activeEntities}/51</p>
            <p className="text-xs text-muted-foreground">Entities Active</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <ArrowUpRight className="h-6 w-6 mx-auto mb-1 text-blue-500" />
            <p className="text-xl font-bold text-foreground">{filedEntities}/51</p>
            <p className="text-xs text-muted-foreground">Filed / Approved</p>
          </CardContent>
        </Card>
      </div>

      {/* Overall Fundraising Progress */}
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Total Fundraising Progress</span>
            <span className="font-bold">{fmt(totalRaised)} / {fmt(totalCapacity)}</span>
          </div>
          <Progress value={totalCapacity > 0 ? (totalRaised / totalCapacity) * 100 : 0} className="h-3" />
          <p className="text-xs text-muted-foreground mt-2">51 entities × $5M/yr = $255M annual fundraising capacity</p>
        </CardContent>
      </Card>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search entities..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      {/* Entity List */}
      <div className="space-y-2 max-h-[600px] overflow-y-auto">
        {filtered.map(entity => {
          const pct = entity.fundraising_target > 0 ? (entity.funds_raised / entity.fundraising_target) * 100 : 0;
          return (
            <Card key={entity.id} className="border-border">
              <CardContent className="p-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center text-xs font-bold text-foreground">
                    {entity.state}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-foreground truncate">{entity.entity_name}</p>
                      <Badge variant="outline" className={`text-[10px] ${getTypeColor(entity.entity_type)}`}>
                        {entity.entity_type}
                      </Badge>
                      <Badge variant="outline" className={`text-[10px] ${getStatusColor(entity.filing_status)}`}>
                        {entity.filing_status.replace("_", " ")}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Progress value={pct} className="h-1.5 flex-1" />
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {fmt(entity.funds_raised)} / {fmt(entity.fundraising_target)}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">#{entity.priority_order}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default CharterFundraising;
