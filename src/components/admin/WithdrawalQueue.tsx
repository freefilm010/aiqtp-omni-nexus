import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader2, Check, X, Banknote } from "lucide-react";
import { toast } from "sonner";

interface WithdrawalRow {
  id: string;
  user_id: string;
  amount_usd: number;
  destination_type: string;
  destination_details: Record<string, unknown> | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
  reviewed_at: string | null;
}

const statusVariant = (status: string) => {
  switch (status) {
    case "pending":
      return "secondary" as const;
    case "approved":
      return "default" as const;
    case "paid":
      return "outline" as const;
    default:
      return "destructive" as const;
  }
};

const WithdrawalQueue = () => {
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState<Record<string, string>>({});

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-withdrawals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("withdrawal_requests")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as unknown as WithdrawalRow[];
    },
    staleTime: 5_000,
    refetchInterval: 15_000,
  });

  const review = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: "approve" | "reject" | "mark_paid" }) => {
      const { data, error } = await supabase.rpc("review_withdrawal" as never, {
        p_withdrawal_id: id,
        p_action: action,
        p_notes: notes[id]?.trim() || null,
      } as never);
      if (error) throw error;
      return data as unknown as string;
    },
    onSuccess: (status) => {
      toast.success(`Withdrawal ${status}`);
      queryClient.invalidateQueries({ queryKey: ["admin-withdrawals"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rows = data ?? [];
  const pendingTotal = rows
    .filter((r) => r.status === "pending")
    .reduce((sum, r) => sum + Number(r.amount_usd || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Banknote className="h-6 w-6 text-primary" /> Withdrawal Queue
        </h1>
        <p className="text-muted-foreground text-sm">
          Approve, reject, or settle member cash-out requests. Rejecting returns the funds to the member's cash balance.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Pending exposure</CardTitle>
          <CardDescription>
            ${pendingTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} awaiting review
          </CardDescription>
        </CardHeader>
      </Card>

      {isLoading && (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      )}

      {error && <p className="text-sm text-destructive">Could not load withdrawals: {(error as Error).message}</p>}

      {!isLoading && rows.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground text-sm">
            No withdrawal requests yet.
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {rows.map((row) => (
          <Card key={row.id}>
            <CardContent className="pt-5 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-mono text-lg font-semibold">
                    ${Number(row.amount_usd).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {row.destination_type} · {new Date(row.created_at).toLocaleString()}
                  </p>
                </div>
                <Badge variant={statusVariant(row.status)}>{row.status}</Badge>
              </div>

              {row.admin_notes && <p className="text-xs text-muted-foreground">Note: {row.admin_notes}</p>}

              {(row.status === "pending" || row.status === "approved") && (
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    placeholder="Review note (optional)"
                    value={notes[row.id] ?? ""}
                    onChange={(e) => setNotes((n) => ({ ...n, [row.id]: e.target.value }))}
                    className="sm:max-w-xs"
                  />
                  {row.status === "pending" ? (
                    <>
                      <Button
                        size="sm"
                        disabled={review.isPending}
                        onClick={() => review.mutate({ id: row.id, action: "approve" })}
                      >
                        <Check className="h-4 w-4 mr-1" /> Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={review.isPending}
                        onClick={() => review.mutate({ id: row.id, action: "reject" })}
                      >
                        <X className="h-4 w-4 mr-1" /> Reject &amp; refund
                      </Button>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={review.isPending}
                      onClick={() => review.mutate({ id: row.id, action: "mark_paid" })}
                    >
                      <Banknote className="h-4 w-4 mr-1" /> Mark paid
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default WithdrawalQueue;
