/**
 * QuantumAssetRegistry — QAQI quantum-asset regeneration tier.
 *
 * Regenerates the signed-in user's legacy holdings as quantum-resistant twin
 * assets and shows the real attestation provenance for each one. Values are
 * mirrored from the portfolio; nothing here mints or simulates balance.
 */
import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Atom, ShieldCheck, RefreshCw, Cpu, KeyRound, AlertTriangle } from "lucide-react";

interface QuantumAsset {
  id: string;
  legacy_symbol: string;
  legacy_name: string;
  legacy_quantity: number;
  legacy_value_usd: number;
  quantum_symbol: string;
  quantum_class: string;
  asset_hash: string;
  entropy_source: string;
  quantum_backend: string | null;
  quantum_job_id: string | null;
  entropy_bits: number;
  shannon_entropy: number | null;
  sig_algorithm: string;
  kem_algorithm: string;
  wallet_id: string | null;
  status: string;
  verified_at: string | null;
  created_at: string;
}

const ENTROPY_LABEL: Record<string, { label: string; tone: string }> = {
  ibm_quantum_hardware: { label: "IBM Quantum hardware", tone: "text-primary border-primary/40" },
  ibm_quantum_queued: { label: "IBM Quantum job queued", tone: "text-amber-500 border-amber-500/40" },
  local_csprng: { label: "Platform CSPRNG", tone: "text-muted-foreground border-border" },
};

export default function QuantumAssetRegistry() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = useMemo(() => ["quantum-asset-registry", user?.id] as const, [user?.id]);

  const { data, isLoading } = useQuery({
    queryKey,
    enabled: Boolean(user?.id),
    staleTime: 5_000,
    queryFn: async (): Promise<QuantumAsset[]> => {
      const { data: res, error } = await supabase.functions.invoke("quantum-regenerate", {
        body: { action: "list" },
      });
      if (error) throw error;
      return (res?.assets ?? []) as QuantumAsset[];
    },
  });

  const regenerate = useMutation({
    mutationFn: async () => {
      const { data: res, error } = await supabase.functions.invoke("quantum-regenerate", {
        body: { action: "regenerate" },
      });
      if (error) throw error;
      if (res?.success === false) throw new Error(res.error ?? "Regeneration failed");
      return res;
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey });
      const hw = res?.entropy?.hardware_backed;
      toast({
        title: `${res?.regenerated ?? 0} asset(s) regenerated`,
        description: hw
          ? `Entropy sourced from ${res.entropy.backend} (hardware-backed).`
          : "Entropy sourced from the platform CSPRNG — IBM Quantum credentials are not configured in the backend vault.",
      });
    },
    onError: (e: Error) =>
      toast({ title: "Regeneration failed", description: e.message, variant: "destructive" }),
  });

  const verify = useMutation({
    mutationFn: async (id: string) => {
      const { data: res, error } = await supabase.functions.invoke("quantum-regenerate", {
        body: { action: "verify", id },
      });
      if (error) throw error;
      return res as { valid: boolean };
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey });
      toast({
        title: res.valid ? "Attestation valid" : "Attestation INVALID",
        description: res.valid
          ? "Fingerprint and signature recomputed and matched."
          : "Recomputed signature does not match the stored attestation.",
        variant: res.valid ? "default" : "destructive",
      });
    },
    onError: (e: Error) =>
      toast({ title: "Verification failed", description: e.message, variant: "destructive" }),
  });

  const assets = data ?? [];

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <CardTitle className="flex items-center gap-2 text-base">
              <Atom className="h-4 w-4 text-primary" />
              Quantum Asset Registry
            </CardTitle>
            <CardDescription className="text-xs">
              Legacy holdings regenerated as quantum-resistant twins (QTC class), each bound to a
              post-quantum attestation.
            </CardDescription>
          </div>
          <Button
            size="sm"
            onClick={() => regenerate.mutate()}
            disabled={regenerate.isPending || !user}
            className="shrink-0"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${regenerate.isPending ? "animate-spin" : ""}`} />
            Regenerate
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-2">
        {isLoading && (
          <>
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </>
        )}

        {!isLoading && assets.length === 0 && (
          <div className="flex items-start gap-2 rounded-md border border-dashed border-border p-4 text-xs text-muted-foreground">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>
              No quantum twins yet. Run <span className="font-mono">Regenerate</span> to fingerprint
              every legacy holding in your portfolio and issue its quantum-resistant counterpart.
            </span>
          </div>
        )}

        {assets.map((a) => {
          const entropy = ENTROPY_LABEL[a.entropy_source] ?? {
            label: a.entropy_source,
            tone: "text-muted-foreground border-border",
          };
          return (
            <div key={a.id} className="rounded-md border border-border p-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-mono text-xs font-semibold truncate">{a.quantum_symbol}</p>
                  <p className="text-[10px] text-muted-foreground truncate">
                    from {a.legacy_symbol} · {Number(a.legacy_quantity).toLocaleString()} units ·{" "}
                    {Number(a.legacy_value_usd).toLocaleString(undefined, {
                      style: "currency",
                      currency: "USD",
                    })}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={
                    a.status === "verified"
                      ? "text-primary border-primary/40 shrink-0"
                      : "text-muted-foreground shrink-0"
                  }
                >
                  {a.status}
                </Badge>
              </div>

              <div className="flex flex-wrap gap-1.5">
                <Badge variant="outline" className={`text-[10px] ${entropy.tone}`}>
                  <Cpu className="h-3 w-3 mr-1" />
                  {entropy.label}
                </Badge>
                <Badge variant="outline" className="text-[10px]">
                  <KeyRound className="h-3 w-3 mr-1" />
                  {a.kem_algorithm}
                </Badge>
                <Badge variant="outline" className="text-[10px]">
                  {a.sig_algorithm}
                </Badge>
                {a.shannon_entropy !== null && (
                  <Badge variant="outline" className="text-[10px]">
                    H={a.shannon_entropy} bits
                  </Badge>
                )}
                {a.wallet_id && (
                  <Badge variant="outline" className="text-[10px] text-primary border-primary/40">
                    QuWallet bound
                  </Badge>
                )}
              </div>

              <p className="font-mono text-[10px] text-muted-foreground break-all">
                {a.asset_hash.slice(0, 48)}…
              </p>

              <div className="flex items-center justify-between gap-2">
                {a.quantum_job_id ? (
                  <span className="font-mono text-[10px] text-muted-foreground truncate">
                    job {a.quantum_job_id}
                  </span>
                ) : (
                  <span className="text-[10px] text-muted-foreground">no hardware job reference</span>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-[11px]"
                  onClick={() => verify.mutate(a.id)}
                  disabled={verify.isPending}
                >
                  <ShieldCheck className="h-3.5 w-3.5 mr-1" />
                  Verify
                </Button>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
