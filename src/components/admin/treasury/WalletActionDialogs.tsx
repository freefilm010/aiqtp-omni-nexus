import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, RefreshCw, ArrowRightLeft, Repeat, Landmark, PiggyBank, ArrowDownToLine } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PlatformWallet {
  id: string;
  wallet_type: string;
  currency: string;
  balance: number;
  available_balance: number;
  locked_balance: number;
  wallet_address: string | null;
  is_active: boolean;
}

type WalletAction = "deposit" | "transfer" | "convert" | "swap" | "stake" | null;

interface WalletActionDialogsProps {
  action: WalletAction;
  wallet: PlatformWallet | null;
  allWallets: PlatformWallet[];
  onClose: () => void;
  onRefresh: () => void;
}

const actionMeta: Record<string, { icon: React.ElementType; title: string; color: string }> = {
  deposit: { icon: ArrowDownToLine, title: "Deposit Funds", color: "text-green-500" },
  transfer: { icon: ArrowRightLeft, title: "Transfer Between Wallets", color: "text-blue-500" },
  convert: { icon: Repeat, title: "Convert Currency", color: "text-purple-500" },
  swap: { icon: ArrowRightLeft, title: "Swap Assets", color: "text-orange-500" },
  stake: { icon: PiggyBank, title: "Stake Assets", color: "text-yellow-500" },
};

const FIAT_DEPOSIT_METHODS = [
  { id: "bank_wire", label: "Bank Wire (ACH/SEPA)", fee: "Free" },
  { id: "card", label: "Credit/Debit Card (Stripe)", fee: "2.9% + $0.30" },
  { id: "paypal", label: "PayPal", fee: "2.5%" },
];

const STAKE_DURATIONS = [
  { days: 30, apy: "4.5%" },
  { days: 90, apy: "7.2%" },
  { days: 180, apy: "10.0%" },
  { days: 365, apy: "14.5%" },
];

export const WalletActionDialogs = ({ action, wallet, allWallets, onClose, onRefresh }: WalletActionDialogsProps) => {
  const [amount, setAmount] = useState("");
  const [processing, setProcessing] = useState(false);
  const [depositMethod, setDepositMethod] = useState("bank_wire");
  const [targetWalletId, setTargetWalletId] = useState("");
  const [convertTo, setConvertTo] = useState("");
  const [stakeDuration, setStakeDuration] = useState("90");

  if (!action || !wallet) return null;

  const meta = actionMeta[action];
  const Icon = meta.icon;

  const otherWallets = allWallets.filter(w => w.id !== wallet.id);

  const handleSubmit = async () => {
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      toast.error("Enter a valid amount");
      return;
    }

    setProcessing(true);
    try {
      switch (action) {
        case "deposit": {
          const { error } = await supabase
            .from("platform_wallets")
            .update({
              balance: Number(wallet.balance) + amt,
              available_balance: Number(wallet.available_balance) + amt,
              updated_at: new Date().toISOString(),
            })
            .eq("id", wallet.id);
          if (error) throw error;

          await supabase.from("profit_distribution_log").insert({
            from_wallet_id: wallet.id,
            amount: amt,
            currency: wallet.currency,
            status: "completed",
            metadata: { type: "admin_deposit", method: depositMethod },
          });

          // Record as admin revenue
          await supabase.from("admin_revenue").insert({
            source: "treasury_deposit",
            type: "deposit",
            amount: amt,
            currency: wallet.currency,
            status: "completed",
            metadata: { wallet_id: wallet.id, method: depositMethod },
          });

          toast.success(`Deposited ${amt} ${wallet.currency} via ${depositMethod}`);
          break;
        }

        case "transfer": {
          if (!targetWalletId) { toast.error("Select a target wallet"); return; }
          if (amt > Number(wallet.available_balance)) { toast.error("Insufficient balance"); return; }

          const target = allWallets.find(w => w.id === targetWalletId);
          if (!target) { toast.error("Target wallet not found"); return; }

          // Debit source
          const { error: e1 } = await supabase.from("platform_wallets").update({
            balance: Number(wallet.balance) - amt,
            available_balance: Number(wallet.available_balance) - amt,
            updated_at: new Date().toISOString(),
          }).eq("id", wallet.id);
          if (e1) throw e1;

          // Credit target
          const { error: e2 } = await supabase.from("platform_wallets").update({
            balance: Number(target.balance) + amt,
            available_balance: Number(target.available_balance) + amt,
            updated_at: new Date().toISOString(),
          }).eq("id", targetWalletId);
          if (e2) throw e2;

          await supabase.from("profit_distribution_log").insert({
            from_wallet_id: wallet.id,
            to_wallet_id: targetWalletId,
            amount: amt,
            currency: wallet.currency,
            status: "completed",
            metadata: { type: "internal_transfer" },
          });

          toast.success(`Transferred ${amt} ${wallet.currency} → ${target.currency}`);
          break;
        }

        case "convert":
        case "swap": {
          if (!convertTo) { toast.error("Select target currency"); return; }
          if (amt > Number(wallet.available_balance)) { toast.error("Insufficient balance"); return; }

          // Simulate conversion rate (in production, pull from real FX/crypto feeds)
          const mockRate = 1.0; // placeholder
          const converted = amt * mockRate;

          // Debit source
          const { error: ce1 } = await supabase.from("platform_wallets").update({
            balance: Number(wallet.balance) - amt,
            available_balance: Number(wallet.available_balance) - amt,
            updated_at: new Date().toISOString(),
          }).eq("id", wallet.id);
          if (ce1) throw ce1;

          // Find or create target wallet
          const targetW = allWallets.find(w => w.currency === convertTo);
          if (targetW) {
            const { error: ce2 } = await supabase.from("platform_wallets").update({
              balance: Number(targetW.balance) + converted,
              available_balance: Number(targetW.available_balance) + converted,
              updated_at: new Date().toISOString(),
            }).eq("id", targetW.id);
            if (ce2) throw ce2;
          }

          await supabase.from("profit_distribution_log").insert({
            from_wallet_id: wallet.id,
            amount: amt,
            currency: wallet.currency,
            status: "completed",
            metadata: { type: action, from: wallet.currency, to: convertTo, rate: mockRate, received: converted },
          });

          toast.success(`${action === "convert" ? "Converted" : "Swapped"} ${amt} ${wallet.currency} → ${converted} ${convertTo}`);
          break;
        }

        case "stake": {
          if (amt > Number(wallet.available_balance)) { toast.error("Insufficient balance"); return; }

          // Lock funds
          const { error: se } = await supabase.from("platform_wallets").update({
            available_balance: Number(wallet.available_balance) - amt,
            locked_balance: Number(wallet.locked_balance) + amt,
            updated_at: new Date().toISOString(),
          }).eq("id", wallet.id);
          if (se) throw se;

          const dur = STAKE_DURATIONS.find(d => d.days === parseInt(stakeDuration));

          await supabase.from("profit_distribution_log").insert({
            from_wallet_id: wallet.id,
            amount: amt,
            currency: wallet.currency,
            status: "staking",
            metadata: { type: "stake", duration_days: parseInt(stakeDuration), apy: dur?.apy },
          });

          toast.success(`Staked ${amt} ${wallet.currency} for ${stakeDuration} days at ${dur?.apy} APY`);
          break;
        }
      }

      onClose();
      onRefresh();
    } catch (err: any) {
      console.error(`${action} error:`, err);
      toast.error(`Failed to ${action}`);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Dialog open={!!action} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className={`h-5 w-5 ${meta.color}`} />
            {meta.title} — {wallet.currency}
          </DialogTitle>
          <DialogDescription>
            Available: {Number(wallet.available_balance).toLocaleString()} {wallet.currency}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Deposit method selector */}
          {action === "deposit" && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Funding Method</label>
              <Select value={depositMethod} onValueChange={setDepositMethod}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FIAT_DEPOSIT_METHODS.map(m => (
                    <SelectItem key={m.id} value={m.id}>
                      <span className="flex items-center justify-between w-full gap-2">
                        {m.label}
                        <Badge variant="outline" className="text-xs ml-2">{m.fee}</Badge>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Transfer target */}
          {action === "transfer" && (
            <div className="space-y-2">
              <label className="text-sm font-medium">To Wallet</label>
              <Select value={targetWalletId} onValueChange={setTargetWalletId}>
                <SelectTrigger><SelectValue placeholder="Select wallet" /></SelectTrigger>
                <SelectContent>
                  {otherWallets.map(w => (
                    <SelectItem key={w.id} value={w.id}>
                      {w.currency} ({w.wallet_type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Convert/Swap target */}
          {(action === "convert" || action === "swap") && (
            <div className="space-y-2">
              <label className="text-sm font-medium">To Currency</label>
              <Select value={convertTo} onValueChange={setConvertTo}>
                <SelectTrigger><SelectValue placeholder="Select currency" /></SelectTrigger>
                <SelectContent>
                  {["USD", "EUR", "GBP", "BTC", "ETH", "SOL", "USDC", "USDT", "GOLD"].filter(c => c !== wallet.currency).map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Stake duration */}
          {action === "stake" && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Lock Duration</label>
              <Select value={stakeDuration} onValueChange={setStakeDuration}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STAKE_DURATIONS.map(d => (
                    <SelectItem key={d.days} value={String(d.days)}>
                      {d.days} days — {d.apy} APY
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Amount */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Amount</label>
            <Input
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            {action !== "deposit" && (
              <div className="flex gap-1">
                {[25, 50, 75, 100].map(pct => (
                  <Button
                    key={pct}
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={() => setAmount(String((Number(wallet.available_balance) * pct / 100).toFixed(8)))}
                  >
                    {pct}%
                  </Button>
                ))}
              </div>
            )}
            {action === "deposit" && (
              <div className="flex gap-1">
                {[100, 500, 1000, 5000].map(preset => (
                  <Button
                    key={preset}
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={() => setAmount(String(preset))}
                  >
                    ${preset.toLocaleString()}
                  </Button>
                ))}
              </div>
            )}
          </div>

          {action === "stake" && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <PiggyBank className="h-4 w-4 text-yellow-500 mt-0.5" />
              <p className="text-xs text-yellow-500">
                Staked assets are locked for the selected duration. Early unstaking may incur penalties.
              </p>
            </div>
          )}

          {(action === "transfer" || action === "convert" || action === "swap") && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5" />
              <p className="text-xs text-amber-500">
                {action === "transfer" ? "Internal transfers are instant and irreversible." : "Exchange rates are indicative. Final rate locked at execution."}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={processing}>
            {processing ? (
              <><RefreshCw className="h-4 w-4 mr-2 animate-spin" />Processing...</>
            ) : (
              <><Icon className="h-4 w-4 mr-2" />Confirm {action}</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
