import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowDownToLine, ArrowRightLeft, Repeat, PiggyBank, Send } from "lucide-react";

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

type WalletAction = "deposit" | "transfer" | "convert" | "swap" | "stake" | "withdraw";

interface WalletCardProps {
  wallet: PlatformWallet;
  onAction: (wallet: PlatformWallet, action: WalletAction) => void;
}

const actionButtons: { action: WalletAction; icon: React.ElementType; label: string }[] = [
  { action: "deposit", icon: ArrowDownToLine, label: "Deposit" },
  { action: "withdraw", icon: Send, label: "Withdraw" },
  { action: "transfer", icon: ArrowRightLeft, label: "Transfer" },
  { action: "convert", icon: Repeat, label: "Convert" },
  { action: "swap", icon: ArrowRightLeft, label: "Swap" },
  { action: "stake", icon: PiggyBank, label: "Stake" },
];

export const WalletCard = ({ wallet, onAction }: WalletCardProps) => {
  return (
    <div className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <span className="font-bold text-lg">{wallet.currency}</span>
        <Badge variant={wallet.is_active ? "default" : "secondary"}>
          {wallet.is_active ? "Active" : "Inactive"}
        </Badge>
      </div>
      <div className="space-y-1 mb-3">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Balance:</span>
          <span className="font-medium">{Number(wallet.balance).toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Available:</span>
          <span className="text-green-500">{Number(wallet.available_balance).toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Locked:</span>
          <span className="text-yellow-500">{Number(wallet.locked_balance).toLocaleString()}</span>
        </div>
      </div>
      {wallet.wallet_address && (
        <p className="text-xs text-muted-foreground mb-2 truncate">{wallet.wallet_address}</p>
      )}
      <div className="grid grid-cols-3 gap-1">
        {actionButtons.map(({ action, icon: Icon, label }) => (
          <Button
            key={action}
            variant="outline"
            size="sm"
            className="text-xs h-7 px-1"
            onClick={() => onAction(wallet, action)}
            disabled={action !== "deposit" && Number(wallet.available_balance) <= 0}
          >
            <Icon className="h-3 w-3 mr-1" />
            {label}
          </Button>
        ))}
      </div>
    </div>
  );
};
