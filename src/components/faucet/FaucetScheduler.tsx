import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, Bell, Calendar, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { usePersistentState } from "@/hooks/usePersistentState";
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
  next_claim_at: string | null;
  total_auto_claims: number | null;
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
  const [notifyOnClaim, setNotifyOnClaim] = usePersistentState<boolean>(
    userId ? `faucet:notify-on-claim:${userId}` : null,
    true
  );

  const loadSchedules = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    const { data, error } = await supabase
      .from("faucet_schedules")
      .select("*")
      .eq("user_id", userId);

    if (error) {
      toast.error("Failed to load schedules");
      setLoading(false);
      return;
    }

    setSchedules((data || []) as Schedule[]);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    void loadSchedules();
  }, [userId, loadSchedules]);

  // Auto-enable all schedules on first load if none exist
  useEffect(() => {
    if (!userId || loading || schedules.length > 0) return;
    void enableAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, loading, schedules.length]);

  const upsertSchedule = async (tokenId: string, intervalHours: number, isActive: boolean) => {
    if (!userId) return;

    const existing = schedules.find(s => s.token_id === tokenId);
    const previousSchedules = schedules;

    const optimisticSchedule: Schedule = existing
      ? { ...existing, interval_hours: intervalHours, is_active: isActive }
      : {
          id: `temp-${tokenId}`,
          token_id: tokenId,
          interval_hours: intervalHours,
          is_active: isActive,
          next_claim_at: null,
          total_auto_claims: 0,
        };

    setSchedules(prev => {
      if (existing) {
        return prev.map(schedule =>
          schedule.token_id === tokenId
            ? { ...schedule, interval_hours: intervalHours, is_active: isActive }
            : schedule
        );
      }

      return [...prev, optimisticSchedule];
    });

    const { error } = existing
      ? await supabase
          .from("faucet_schedules")
          .update({
            interval_hours: intervalHours,
            is_active: isActive,
          })
          .eq("id", existing.id)
      : await supabase.from("faucet_schedules").insert({
          user_id: userId,
          token_id: tokenId,
          interval_hours: intervalHours,
          is_active: isActive,
        });

    if (error) {
      setSchedules(previousSchedules);
      toast.error("Failed to save schedule");
      return;
    }

    await loadSchedules();
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
      const { error } = await supabase.from("faucet_schedules").insert(inserts);
      if (error) {
        toast.error("Failed to create schedules");
        return;
      }
    }

    const { error } = await supabase.from("faucet_schedules")
      .update({ is_active: true })
      .eq("user_id", userId);

    if (error) {
      toast.error("Failed to enable schedules");
      return;
    }

    await loadSchedules();
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
                    <p className="text-[9px] text-muted-foreground">{schedule.total_auto_claims ?? 0} auto-claims</p>
                  )}
                </div>
                <Select
                  value={String(interval)}
                  onValueChange={v => upsertSchedule(token.id, Number(v), isActive)}
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
