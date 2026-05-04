import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ShieldOff, ShieldCheck, AlertTriangle, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type SystemStatusRow = {
  key: string;
  active: boolean;
  updated_at: string;
  reason?: string | null;
};

const supabaseUnsafe = supabase as any;
const statusTable = () => supabaseUnsafe.from('system_status');

const MasterKillSwitch = () => {
  const [systemActive, setSystemActive] = useState<boolean | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [reason, setReason] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  const loadStatus = async () => {
    const { data } = await statusTable()
      .select('key, active, updated_at, reason')
      .eq('key', 'main')
      .maybeSingle();

    if (data) {
      const row = data as SystemStatusRow;
      setSystemActive(row.active);
      setLastUpdated(row.updated_at);
      setReason(row.reason ?? null);
    } else {
      // Table exists but no row yet — treat as active by default
      setSystemActive(true);
    }
  };

  useEffect(() => {
    loadStatus();

    const channel = supabase
      .channel(`system-status-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'system_status' }, (payload: { new: SystemStatusRow }) => {
        const row = payload.new;
        if (row?.key === 'main') {
          setSystemActive(row.active);
          setLastUpdated(row.updated_at);
          setReason(row.reason ?? null);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const halt = async () => {
    setIsBusy(true);
    try {
      const { error } = await statusTable().upsert(
        { key: 'main', active: false, updated_at: new Date().toISOString(), reason: 'Manual halt via Control Panel' },
        { onConflict: 'key' }
      );
      if (error) throw error;
      toast.error('System halted', {
        description: 'The Python worker will stop executing new orders on its next cycle.',
      });
    } catch (err: unknown) {
      toast.error('Failed to halt system', { description: String(err) });
    } finally {
      setIsBusy(false);
    }
  };

  const resume = async () => {
    setIsBusy(true);
    try {
      const { error } = await statusTable().upsert(
        { key: 'main', active: true, updated_at: new Date().toISOString(), reason: null },
        { onConflict: 'key' }
      );
      if (error) throw error;
      toast.success('System resumed', {
        description: 'The Python worker will re-activate on its next cycle.',
      });
    } catch (err: unknown) {
      toast.error('Failed to resume system', { description: String(err) });
    } finally {
      setIsBusy(false);
    }
  };

  const statusUnknown = systemActive === null;

  return (
    <Card className={`border-2 transition-colors ${
      systemActive === false ? 'border-destructive/60 bg-destructive/5' :
      systemActive === true  ? 'border-green-500/40 bg-green-500/5' :
                               'border-border'
    }`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            {systemActive === false ? (
              <ShieldOff className="h-5 w-5 text-destructive" />
            ) : (
              <ShieldCheck className="h-5 w-5 text-green-500" />
            )}
            Master Kill Switch
          </CardTitle>

          <Badge
            className={
              statusUnknown       ? 'bg-muted text-muted-foreground' :
              systemActive        ? 'bg-green-500 text-white'         :
                                    'bg-destructive text-white'
            }
          >
            {statusUnknown ? 'LOADING…' : systemActive ? 'SYSTEM ACTIVE' : 'SYSTEM HALTED'}
          </Badge>
        </div>
        <CardDescription>
          Controls the <code className="text-xs bg-muted px-1 rounded">system_status</code> table.
          The Python worker checks this flag before executing any order. Changes take effect within one worker cycle.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {lastUpdated && (
          <p className="text-xs text-muted-foreground">
            Last updated: {new Date(lastUpdated).toLocaleString()}
            {reason ? ` — ${reason}` : ''}
          </p>
        )}

        {/* ── HALT button ──────────────────────────────────────────────── */}
        {(systemActive === true || statusUnknown) && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                size="lg"
                className="w-full font-bold tracking-wide text-base h-14 shadow-lg shadow-destructive/30 hover:shadow-destructive/50 transition-shadow"
                disabled={isBusy || statusUnknown}
              >
                <AlertTriangle className="h-5 w-5 mr-2" />
                EMERGENCY STOP — Halt All Trading
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                  Confirm Emergency Halt
                </AlertDialogTitle>
                <AlertDialogDescription className="space-y-2 text-sm">
                  <p>
                    This will set <code className="bg-muted px-1 rounded">system_status.active = false</code> in Supabase.
                  </p>
                  <p>
                    The Python worker on Render will <strong>stop executing new orders</strong> within its next polling cycle.
                    Positions already open will remain open — the worker will not close them automatically unless
                    configured to do so.
                  </p>
                  <p className="font-medium text-foreground">
                    Are you sure you want to halt all trading operations?
                  </p>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={halt}
                >
                  Yes, Halt System Now
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

        {/* ── RESUME button ────────────────────────────────────────────── */}
        {systemActive === false && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="default"
                size="lg"
                className="w-full font-bold tracking-wide text-base h-14 bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/30 hover:shadow-green-600/50 transition-shadow"
                disabled={isBusy}
              >
                <RefreshCw className="h-5 w-5 mr-2" />
                RESUME SYSTEM — Re-enable Trading
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2 text-green-600">
                  <RefreshCw className="h-5 w-5" />
                  Confirm System Resume
                </AlertDialogTitle>
                <AlertDialogDescription className="text-sm">
                  <p>
                    This will set <code className="bg-muted px-1 rounded">system_status.active = true</code>.
                    The Python worker will resume normal trading operations on its next cycle.
                  </p>
                  <p className="mt-2 font-medium text-foreground">
                    Confirm that all risk checks have been reviewed before resuming.
                  </p>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-green-600 text-white hover:bg-green-700"
                  onClick={resume}
                >
                  Yes, Resume Trading
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

        <p className="text-xs text-muted-foreground text-center">
          Status synced via Supabase real-time subscription. Changes are instant.
        </p>
      </CardContent>
    </Card>
  );
};

export default MasterKillSwitch;
