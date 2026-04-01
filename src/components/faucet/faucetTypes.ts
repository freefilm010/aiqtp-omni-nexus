import type { ReactNode } from "react";

export interface FaucetToken {
  id: string;
  symbol: string;
  name: string;
  icon: ReactNode;
  claimAmount: number;
  claimInterval: number; // hours
  available: boolean;
  category: 'stablecoin' | 'platform' | 'testnet' | 'defi' | 'lightning' | 'l2' | 'privacy';
  description: string;
  chain: string;
  bonus?: string;
}

export interface ClaimRecord {
  id: string;
  amount: number;
  chain: string;
  status: string;
  created_at: string;
}
