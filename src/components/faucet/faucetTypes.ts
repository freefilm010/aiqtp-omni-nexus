import type { ReactNode } from "react";

export type FaucetCategory =
  | 'platform'        // QTC, AIQ, NXS — real platform tokens
  | 'mining'          // Mining rewards
  | 'staking'         // Staking yield
  | 'referral'        // Referral / affiliate rewards
  | 'micro-earn'      // FaucetPay-style micro-task rewards
  | 'testnet'         // Sepolia, Bitcoin testnet, etc.
  | 'testnet-l2'      // Arbitrum/Optimism/Base testnets
  | 'testnet-defi'    // Test UNI/AAVE/LINK etc.
  | 'testnet-privacy'; // Test XMR/ZEC

export interface FaucetToken {
  id: string;
  symbol: string;
  name: string;
  icon: ReactNode;
  claimAmount: number;
  claimInterval: number; // hours
  available: boolean;
  category: FaucetCategory;
  description: string;
  chain: string;
  bonus?: string;
  /** True = token has real or simulated USD value */
  hasValue?: boolean;
}

export interface ClaimRecord {
  id: string;
  amount: number;
  chain: string;
  status: string;
  created_at: string;
}
