import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { getCachedUser } from "@/lib/auth/getCachedUser";
import { CreditCard, Plus, Star, Trash2, Edit2, Check, Wallet } from "lucide-react";

interface SavedMethod {
  id: string;
  nickname: string;
  method_type: string;
  last_four: string | null;
  card_brand: string | null;
  bank_name: string | null;
  exp_month: number | null;
  exp_year: number | null;
  is_default: boolean;
  created_at: string;
}

const SavedPaymentMethods = () => {
  const { toast } = useToast();
  const [methods, setMethods] = useState<SavedMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    nickname: "",
    method_type: "card",
    last_four: "",
    card_brand: "",
    bank_name: "",
  });

  useEffect(() => {
    loadMethods();
  }, []);

  const loadMethods = async () => {
    const user = await getCachedUser();
    if (!user) { setLoading(false); return; }

    const { data } = await supabase
      .from("saved_payment_methods_safe" as any)
      .select("id, nickname, method_type, last_four, card_brand, bank_name, is_default, created_at, exp_month, exp_year")
      .order("is_default", { ascending: false }) as { data: SavedMethod[] | null };

    setMethods(data || []);
    setLoading(false);
  };

  const resetForm = () => {
    setForm({ nickname: "", method_type: "card", last_four: "", card_brand: "", bank_name: "" });
    setEditingId(null);
  };

  const handleSave = async () => {
    if (!form.nickname.trim()) {
      toast({ title: "Name required", description: "Give this payment method a name", variant: "destructive" });
      return;
    }

    const user = await getCachedUser();
    if (!user) {
      toast({ title: "Sign in required", description: "Please sign in to save payment methods", variant: "destructive" });
      return;
    }

    if (editingId) {
      const { error } = await supabase
        .from("saved_payment_methods")
        .update({
          nickname: form.nickname,
          method_type: form.method_type,
          last_four: form.last_four || null,
          card_brand: form.card_brand || null,
          bank_name: form.bank_name || null,
        })
        .eq("id", editingId) as any;

      if (error) {
        toast({ title: "Error", description: "Failed to update", variant: "destructive" });
        return;
      }
      toast({ title: "Updated", description: `"${form.nickname}" saved` });
    } else {
      const { error } = await supabase
        .from("saved_payment_methods")
        .insert({
          user_id: user.id,
          nickname: form.nickname,
          method_type: form.method_type,
          last_four: form.last_four || null,
          card_brand: form.card_brand || null,
          bank_name: form.bank_name || null,
          is_default: methods.length === 0,
        }) as any;

      if (error) {
        toast({ title: "Error", description: "Failed to save", variant: "destructive" });
        return;
      }
      toast({ title: "Saved!", description: `"${form.nickname}" added to your payment methods` });
    }

    setDialogOpen(false);
    resetForm();
    loadMethods();
  };

  const handleSetDefault = async (id: string) => {
    const user = await getCachedUser();
    if (!user) return;

    // Unset all defaults first
    await supabase
      .from("saved_payment_methods")
      .update({ is_default: false })
      .eq("user_id", user.id) as any;

    // Set the selected one
    await supabase
      .from("saved_payment_methods")
      .update({ is_default: true })
      .eq("id", id) as any;

    toast({ title: "Default set" });
    loadMethods();
  };

  const handleDelete = async (id: string, name: string) => {
    await supabase.from("saved_payment_methods").delete().eq("id", id) as any;
    toast({ title: "Removed", description: `"${name}" deleted` });
    loadMethods();
  };

  const startEdit = (method: SavedMethod) => {
    setForm({
      nickname: method.nickname,
      method_type: method.method_type,
      last_four: method.last_four || "",
      card_brand: method.card_brand || "",
      bank_name: method.bank_name || "",
    });
    setEditingId(method.id);
    setDialogOpen(true);
  };

  const getIcon = (type: string) => {
    if (type === "bank") return <Wallet className="h-4 w-4" />;
    return <CreditCard className="h-4 w-4" />;
  };

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <CreditCard className="h-4 w-4 text-primary" />
            Saved Payment Methods
          </CardTitle>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="gap-1">
                <Plus className="h-3 w-3" /> Add
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingId ? "Edit" : "Add"} Payment Method</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label>Name (e.g. "My Visa", "Chase Checking")</Label>
                  <Input
                    placeholder="Give it a name..."
                    value={form.nickname}
                    onChange={(e) => setForm(f => ({ ...f, nickname: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={form.method_type} onValueChange={(v) => setForm(f => ({ ...f, method_type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="card">Credit / Debit Card</SelectItem>
                      <SelectItem value="bank">Bank Account</SelectItem>
                      <SelectItem value="crypto">Crypto Wallet</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {form.method_type === "card" && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Last 4 Digits</Label>
                      <Input placeholder="1234" maxLength={4} value={form.last_four}
                        onChange={(e) => setForm(f => ({ ...f, last_four: e.target.value.replace(/\D/g, "") }))} />
                    </div>
                    <div className="space-y-2">
                      <Label>Brand</Label>
                      <Select value={form.card_brand} onValueChange={(v) => setForm(f => ({ ...f, card_brand: v }))}>
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="visa">Visa</SelectItem>
                          <SelectItem value="mastercard">Mastercard</SelectItem>
                          <SelectItem value="amex">Amex</SelectItem>
                          <SelectItem value="discover">Discover</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
                {form.method_type === "bank" && (
                  <div className="space-y-2">
                    <Label>Bank Name</Label>
                    <Input placeholder="e.g. Chase, Bank of America" value={form.bank_name}
                      onChange={(e) => setForm(f => ({ ...f, bank_name: e.target.value }))} />
                  </div>
                )}
                <Button className="w-full" onClick={handleSave}>
                  <Check className="h-4 w-4 mr-2" />
                  {editingId ? "Update" : "Save"} Payment Method
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : methods.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No saved methods yet. Add one to speed up future payments.
          </p>
        ) : (
          <div className="space-y-2">
            {methods.map((m) => (
              <div key={m.id} className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-background/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-muted">{getIcon(m.method_type)}</div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{m.nickname}</span>
                      {m.is_default && (
                        <Badge variant="secondary" className="text-[10px] gap-1 px-1.5">
                          <Star className="h-2.5 w-2.5" /> Default
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {m.card_brand && `${m.card_brand.charAt(0).toUpperCase() + m.card_brand.slice(1)} `}
                      {m.last_four && `••••${m.last_four}`}
                      {m.exp_month && m.exp_year && ` · Exp ${String(m.exp_month).padStart(2, '0')}/${String(m.exp_year).slice(-2)}`}
                      {m.bank_name && m.bank_name}
                      {!m.last_four && !m.bank_name && m.method_type}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {!m.is_default && (
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleSetDefault(m.id)} title="Set default">
                      <Star className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => startEdit(m)} title="Edit">
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDelete(m.id, m.nickname)} title="Remove">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SavedPaymentMethods;
