import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Rocket, Loader2, Search } from "lucide-react";

interface Market {
  symbol: string;
  base: string;
  quote: string;
  active: boolean;
}

interface StrategyOption {
  id: string;
  name: string;
  status: string;
  is_graduated: boolean;
}

interface Props {
  onDeployed?: () => void;
  trigger?: React.ReactNode;
}

const StrategyDeployDialog = ({ onDeployed, trigger }: Props) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [strategies, setStrategies] = useState<StrategyOption[]>([]);
  const [strategyId, setStrategyId] = useState<string>("");
  const [venue, setVenue] = useState<"binance" | "kraken">("binance");
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loadingMarkets, setLoadingMarkets] = useState(false);
  const [quote, setQuote] = useState<string>("USDT");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [maxPositions, setMaxPositions] = useState("3");
  const [riskPct, setRiskPct] = useState("1");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !user) return;
    supabase
      .from("ai_strategies")
      .select("id,name,status,is_graduated")
      .eq("user_id", user.id)
      .order("is_graduated", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(200)
      .then(({ data }) => setStrategies((data as StrategyOption[]) || []));
  }, [open, user]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoadingMarkets(true);
    setMarkets([]);
    supabase.functions
      .invoke("ccxt-trading", { body: { action: "fetch_markets", exchange: venue } })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error || !data?.success) {
          toast.error("Could not load the venue's instrument list");
        } else {
          setMarkets((data.data as Market[]).filter((m) => m.active));
        }
      })
      .finally(() => !cancelled && setLoadingMarkets(false));
    return () => {
      cancelled = true;
    };
  }, [open, venue]);

  const quotes = useMemo(() => {
    const counts = new Map<string, number>();
    markets.forEach((m) => counts.set(m.quote, (counts.get(m.quote) || 0) + 1));
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([q]) => q);
  }, [markets]);

  useEffect(() => {
    if (quotes.length && !quotes.includes(quote)) setQuote(quotes[0]);
  }, [quotes, quote]);

  const visible = useMemo(() => {
    const term = search.trim().toUpperCase();
    return markets
      .filter((m) => m.quote === quote && (!term || m.base.includes(term)))
      .slice(0, 300);
  }, [markets, quote, search]);

  const toggle = (symbol: string) =>
    setSelected((prev) => (prev.includes(symbol) ? prev.filter((s) => s !== symbol) : [...prev, symbol]));

  const deploy = async () => {
    if (!user) return;
    const strategy = strategies.find((s) => s.id === strategyId);
    if (!strategy) return toast.error("Pick a strategy first");
    if (selected.length === 0) return toast.error("Pick at least one instrument");

    setSaving(true);
    const { error } = await supabase.from("live_strategies").insert({
      user_id: user.id,
      strategy_id: strategy.id,
      name: strategy.name,
      code_name: `${venue.toUpperCase()} · ${selected.length} instrument${selected.length > 1 ? "s" : ""}`,
      status: "paused",
      pairs: selected,
      personality: `Risk ${riskPct}% per position · max ${maxPositions} open`,
    });
    setSaving(false);

    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Deployment created in validation mode — start it when you're ready");
    setSelected([]);
    setStrategyId("");
    setOpen(false);
    onDeployed?.();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <Rocket className="h-4 w-4 mr-2" /> Deploy Strategy
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Deploy a strategy</DialogTitle>
          <DialogDescription>
            A strategy is trading logic — it isn't tied to a currency. You choose the venue and the instruments it runs
            on here, at deployment time.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Strategy</Label>
              <Select value={strategyId} onValueChange={setStrategyId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a strategy" />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {strategies.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} {s.is_graduated ? "· graduated" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Venue</Label>
              <Select value={venue} onValueChange={(v) => { setVenue(v as "binance" | "kraken"); setSelected([]); }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="binance">Binance</SelectItem>
                  <SelectItem value="kraken">Kraken</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>Settlement currency</Label>
              <Select value={quote} onValueChange={(q) => { setQuote(q); setSelected([]); }}>
                <SelectTrigger>
                  <SelectValue placeholder={loadingMarkets ? "Loading…" : "Select"} />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {quotes.map((q) => (
                    <SelectItem key={q} value={q}>
                      {q}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Max open positions</Label>
              <Input value={maxPositions} onChange={(e) => setMaxPositions(e.target.value)} inputMode="numeric" />
            </div>
            <div className="space-y-1.5">
              <Label>Risk per position (%)</Label>
              <Input value={riskPct} onChange={(e) => setRiskPct(e.target.value)} inputMode="decimal" />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label>Instruments {selected.length > 0 && `· ${selected.length} selected`}</Label>
              <div className="relative w-40">
                <Search className="absolute left-2 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  className="pl-7 h-9"
                  placeholder="Search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <ScrollArea className="h-56 rounded-md border p-2">
              {loadingMarkets ? (
                <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Loading live instruments
                </div>
              ) : visible.length === 0 ? (
                <p className="text-sm text-muted-foreground p-4 text-center">No instruments match.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {visible.map((m) => (
                    <Badge
                      key={m.symbol}
                      variant={selected.includes(m.symbol) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggle(m.symbol)}
                    >
                      {m.symbol}
                    </Badge>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          <Button onClick={deploy} disabled={saving || !strategyId || selected.length === 0}>
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Rocket className="h-4 w-4 mr-2" />}
            Create deployment (validation mode)
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StrategyDeployDialog;
