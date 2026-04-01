import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, Bell, Calendar, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { FaucetToken } from "./faucetTypes";

interface FaucetSchedulerProps {
  tokens: FaucetToken[];
  userId: string | null;
}

interface Schedule {
  id: string;
  token_id: string;
  interval_hours: number;
  is_active: boolean;
  next_claim_at: string;
  total_auto_claims: number;
}

const INTERVAL_OPTIONS = [
  { value: "4", label: "Every 4h" },
  { value: "6", label: "Every 6h" },
  { value: "8", label: "Every 8h" },
  { value: "12", label: "Every 12h" },
  { value: "24", label: "Daily" },
];

const FaucetScheduler = ({ tokens, userId }: FaucetSchedulerProps) => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [notifyOnClaim, setNotifyOnClaim] = useState(true);

  useEffect(() => {
    if (!userId) return;
    const load = async () => {
      const { data } = await supabase
        .from("faucet_schedules")
        .select("*")
        .eq("user_id", userId);
      setSchedules((data || []) as Schedule[]);
      setLoading(false);
    };
    load();
  }, [userId]);

  const upsertSchedule = async (tokenId: string, intervalHours: number, isActive: boolean) => {
    if (!userId) return;
    const existing = schedules.find(s => s.token_id === tokenId);
    if (existing) {
      await supabase.from("faucet_schedules").update({
        interval_hours: intervalHours,
        is_active: isActive,
      }).eq("id", existing.id);
    } else {
      await supabase.from("faucet_schedules").insert({
        user_id: userId,
        token_id: tokenId,
        interval_hours: intervalHours,
        is_active: isActive,
      });
    }

    const { data } = await supabase
      .from("faucet_schedules" as any)
      .select("*")
      .eq("user_id", userId) as any;
    setSchedules(data || []);
    toast.success(isActive ? "Schedule activated" : "Schedule paused");
  };

  const enableAll = async () => {
    if (!userId) return;
    const inserts = tokens
      .filter(t => !schedules.find(s => s.token_id === t.id))
      .map(t => ({
        user_id: userId,
        token_id: t.id,
        interval_hours: t.claimInterval,
        is_active: true,
      }));

    if (inserts.length > 0) {
      await supabase.from("faucet_schedules" as any).insert(inserts as any) as any;
    }

    await supabase.from("faucet_schedules" as any)
      .update({ is_active: true } as any)
      .eq("user_id", userId) as any;

    const { data } = await supabase.from("faucet_schedules" as any).select("*").eq("user_id", userId) as any;
    setSchedules(data || []);
    toast.success("All schedules activated!");
  };

  if (!userId) return null;

  const activeCount = schedules.filter(s => s.is_active).length;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4 text-primary" />
          Claim Schedules
          {activeCount > 0 && (
            <Badge variant="secondary" className="text-[9px] ml-auto">{activeCount} active</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs">Notify on claim</span>
          </div>
          <Switch checked={notifyOnClaim} onCheckedChange={setNotifyOnClaim} />
        </div>

        <Button size="sm" variant="outline" className="w-full text-xs gap-1.5" onClick={enableAll}>
          <CheckCircle className="h-3 w-3" /> Enable All (Max Frequency)
        </Button>

        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {tokens.map(token => {
            const schedule = schedules.find(s => s.token_id === token.id);
            const isActive = schedule?.is_active ?? false;
            const interval = schedule?.interval_hours ?? token.claimInterval;

            return (
              <div key={token.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors">
                <div className="shrink-0">{token.icon}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{token.symbol}</p>
                  {schedule && (
                    <p className="text-[9px] text-muted-foreground">{schedule.total_auto_claims} auto-claims</p>
                  )}
                </div>
                <Select
                  value={String(interval)}
                  onValueChange={v => upsertSchedule(token.id, Number(v), isActive || true)}
                >
                  <SelectTrigger className="h-7 w-[90px] text-[10px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {INTERVAL_OPTIONS.filter(o => Number(o.value) >= token.claimInterval).map(opt => (
                      <SelectItem key={opt.value} value={opt.value} className="text-xs">{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Switch
                  checked={isActive}
                  onCheckedChange={v => upsertSchedule(token.id, interval, v)}
                />
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default FaucetScheduler;
