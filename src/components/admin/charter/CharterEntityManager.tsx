import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Search, Save, Building2, CreditCard, FileCheck, Globe } from "lucide-react";

interface FullEntity {
  id: string;
  state: string;
  state_name: string;
  entity_name: string;
  entity_type: string;
  ein: string | null;
  filing_status: string;
  fundraising_target: number;
  funds_raised: number;
  ai_president_name: string | null;
  ai_president_status: string;
  compliance_status: string;
  bank_account_status: string;
  social_media_status: string;
  priority_order: number;
  notes: string | null;
}

const CharterEntityManager = () => {
  const [entities, setEntities] = useState<FullEntity[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<FullEntity | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const { data } = await (supabase.from("charter_entities") as any)
      .select("*")
      .order("priority_order", { ascending: true });
    if (data) {
      setEntities(data);
      if (!selected && data.length > 0) setSelected(data[0]);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = entities.filter(e =>
    e.entity_name.toLowerCase().includes(search.toLowerCase()) ||
    e.state_name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    const { error } = await (supabase.from("charter_entities") as any)
      .update({
        ein: selected.ein,
        filing_status: selected.filing_status,
        funds_raised: selected.funds_raised,
        compliance_status: selected.compliance_status,
        bank_account_status: selected.bank_account_status,
        social_media_status: selected.social_media_status,
        notes: selected.notes,
      })
      .eq("id", selected.id);
    if (error) toast.error("Failed to save");
    else { toast.success(`${selected.entity_name} updated`); load(); }
    setSaving(false);
  };

  const update = (field: string, value: any) => {
    if (!selected) return;
    setSelected({ ...selected, [field]: value });
  };

  const getStatusCounts = () => {
    const counts = { not_started: 0, in_progress: 0, filed: 0, approved: 0 };
    entities.forEach(e => { if (counts[e.filing_status as keyof typeof counts] !== undefined) counts[e.filing_status as keyof typeof counts]++; });
    return counts;
  };
  const sc = getStatusCounts();

  if (loading) return <div className="text-center p-8 text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-2">
        <Card><CardContent className="p-3 text-center">
          <p className="text-lg font-bold text-muted-foreground">{sc.not_started}</p>
          <p className="text-[10px] text-muted-foreground">Not Started</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <p className="text-lg font-bold text-yellow-400">{sc.in_progress}</p>
          <p className="text-[10px] text-muted-foreground">In Progress</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <p className="text-lg font-bold text-blue-400">{sc.filed}</p>
          <p className="text-[10px] text-muted-foreground">Filed</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <p className="text-lg font-bold text-green-400">{sc.approved}</p>
          <p className="text-[10px] text-muted-foreground">Approved</p>
        </CardContent></Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Entity List */}
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <div className="space-y-1 max-h-[500px] overflow-y-auto">
            {filtered.map(e => (
              <div
                key={e.id}
                onClick={() => setSelected(e)}
                className={`p-2 rounded-lg cursor-pointer transition-colors ${selected?.id === e.id ? 'bg-primary/10 border border-primary/30' : 'bg-muted/20 hover:bg-muted/40'}`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-foreground w-7">{e.state}</span>
                  <span className="text-xs text-foreground truncate flex-1">{e.entity_name}</span>
                  <div className={`w-2 h-2 rounded-full ${e.filing_status === 'approved' ? 'bg-green-400' : e.filing_status === 'filed' ? 'bg-blue-400' : e.filing_status === 'in_progress' ? 'bg-yellow-400' : 'bg-muted-foreground'}`} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Detail Panel */}
        {selected && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                {selected.entity_name}
              </CardTitle>
              <p className="text-xs text-muted-foreground">{selected.state_name} • Priority #{selected.priority_order}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">EIN</label>
                  <Input value={selected.ein || ""} onChange={e => update("ein", e.target.value)} placeholder="XX-XXXXXXX" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Filing Status</label>
                  <Select value={selected.filing_status} onValueChange={v => update("filing_status", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="not_started">Not Started</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="filed">Filed</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Funds Raised ($)</label>
                  <Input type="number" value={selected.funds_raised} onChange={e => update("funds_raised", Number(e.target.value))} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Compliance</label>
                  <Select value={selected.compliance_status} onValueChange={v => update("compliance_status", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in_review">In Review</SelectItem>
                      <SelectItem value="compliant">Compliant</SelectItem>
                      <SelectItem value="non_compliant">Non-Compliant</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Bank Account</label>
                  <Select value={selected.bank_account_status} onValueChange={v => update("bank_account_status", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="not_opened">Not Opened</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Social Media</label>
                  <Select value={selected.social_media_status} onValueChange={v => update("social_media_status", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="not_setup">Not Setup</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Notes</label>
                <Input value={selected.notes || ""} onChange={e => update("notes", e.target.value)} placeholder="Entity notes..." />
              </div>
              <Button onClick={handleSave} disabled={saving} className="w-full">
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default CharterEntityManager;
