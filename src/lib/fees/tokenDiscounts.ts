/**
 * Token-Based Fee Discount System
 * 
 * Hold $QTC, $QAQI, or $AIQTP tokens to unlock fee reductions,
 * monthly futures vouchers, and exclusive perks.
 * Tokens can also be burned to pay fees at a discount (deflationary).
 */

export interface FeeDiscountTier {
  tokenSymbol: string;
  tierName: string;
  minHolding: number;
  feeDiscountPercent: number;
  futuresVoucherMonthly: number;
  extraPerks: string[];
}

// Token discount tiers — mirrors DB fee_discount_tiers
export const TOKEN_DISCOUNT_TIERS: FeeDiscountTier[] = [
  // QTC tiers
  { tokenSymbol: 'QTC', tierName: 'Bronze Holder', minHolding: 1_000, feeDiscountPercent: 10, futuresVoucherMonthly: 5, extraPerks: ['priority_support'] },
  { tokenSymbol: 'QTC', tierName: 'Silver Holder', minHolding: 10_000, feeDiscountPercent: 20, futuresVoucherMonthly: 15, extraPerks: ['priority_support', 'reduced_withdrawal'] },
  { tokenSymbol: 'QTC', tierName: 'Gold Holder', minHolding: 100_000, feeDiscountPercent: 35, futuresVoucherMonthly: 50, extraPerks: ['priority_support', 'reduced_withdrawal', 'exclusive_signals'] },
  { tokenSymbol: 'QTC', tierName: 'Platinum Holder', minHolding: 500_000, feeDiscountPercent: 50, futuresVoucherMonthly: 150, extraPerks: ['priority_support', 'zero_withdrawal', 'exclusive_signals', 'vip_chat'] },
  { tokenSymbol: 'QTC', tierName: 'Diamond Holder', minHolding: 1_000_000, feeDiscountPercent: 70, futuresVoucherMonthly: 500, extraPerks: ['priority_support', 'zero_withdrawal', 'exclusive_signals', 'vip_chat', 'personal_manager'] },
  // QAQI tiers
  { tokenSymbol: 'QAQI', tierName: 'QAQI Supporter', minHolding: 5_000, feeDiscountPercent: 15, futuresVoucherMonthly: 10, extraPerks: ['ai_priority_queue'] },
  { tokenSymbol: 'QAQI', tierName: 'QAQI Power', minHolding: 50_000, feeDiscountPercent: 30, futuresVoucherMonthly: 40, extraPerks: ['ai_priority_queue', 'advanced_models'] },
  { tokenSymbol: 'QAQI', tierName: 'QAQI Elite', minHolding: 500_000, feeDiscountPercent: 50, futuresVoucherMonthly: 200, extraPerks: ['ai_priority_queue', 'advanced_models', 'custom_training'] },
  // AIQTP tiers
  { tokenSymbol: 'AIQTP', tierName: 'AIQTP Starter', minHolding: 5_000, feeDiscountPercent: 12, futuresVoucherMonthly: 8, extraPerks: ['platform_beta_access'] },
  { tokenSymbol: 'AIQTP', tierName: 'AIQTP Pro', minHolding: 50_000, feeDiscountPercent: 28, futuresVoucherMonthly: 35, extraPerks: ['platform_beta_access', 'governance_vote'] },
  { tokenSymbol: 'AIQTP', tierName: 'AIQTP Whale', minHolding: 500_000, feeDiscountPercent: 55, futuresVoucherMonthly: 250, extraPerks: ['platform_beta_access', 'governance_vote', 'revenue_share'] },
];

// Get best discount tier for a user's holdings across all tokens
export function getBestDiscountTier(
  holdings: { symbol: string; balance: number }[]
): { tier: FeeDiscountTier | null; totalDiscountPercent: number; stackedPerks: string[] } {
  let bestDiscount = 0;
  let bestTier: FeeDiscountTier | null = null;
  const allPerks = new Set<string>();

  for (const holding of holdings) {
    const tiers = TOKEN_DISCOUNT_TIERS
      .filter(t => t.tokenSymbol === holding.symbol)
      .sort((a, b) => b.minHolding - a.minHolding);

    for (const tier of tiers) {
      if (holding.balance >= tier.minHolding) {
        if (tier.feeDiscountPercent > bestDiscount) {
          bestDiscount = tier.feeDiscountPercent;
          bestTier = tier;
        }
        tier.extraPerks.forEach(p => allPerks.add(p));
        break;
      }
    }
  }

  // Multi-token stacking bonus: +5% for each additional token held at any tier
  const tokensAtTier = holdings.filter(h => {
    const tiers = TOKEN_DISCOUNT_TIERS.filter(t => t.tokenSymbol === h.symbol);
    return tiers.some(t => h.balance >= t.minHolding);
  }).length;

  const stackBonus = Math.max(0, (tokensAtTier - 1) * 5);
  const totalDiscount = Math.min(bestDiscount + stackBonus, 80); // cap at 80%

  return {
    tier: bestTier,
    totalDiscountPercent: totalDiscount,
    stackedPerks: Array.from(allPerks),
  };
}

// Calculate fee after token discount
export function applyTokenDiscount(
  baseFee: number,
  discountPercent: number,
  voucherValueUsd = 0
): { finalFee: number; savings: number; voucherApplied: number } {
  const afterDiscount = baseFee * (1 - discountPercent / 100);
  const voucherApplied = Math.min(voucherValueUsd, afterDiscount);
  const finalFee = Math.max(0, afterDiscount - voucherApplied);

  return {
    finalFee,
    savings: baseFee - finalFee,
    voucherApplied,
  };
}

// Token burn fee payment — burn tokens at market price to pay fees
export function calculateBurnForFee(
  feeUsd: number,
  tokenPriceUsd: number,
  burnBonusPercent = 10 // 10% bonus value when burning tokens for fees
): { tokensRequired: number; effectiveRate: number } {
  const effectivePrice = tokenPriceUsd * (1 + burnBonusPercent / 100);
  const tokensRequired = feeUsd / effectivePrice;

  return {
    tokensRequired: Math.ceil(tokensRequired),
    effectiveRate: effectivePrice,
  };
}

// Token ecosystem summary for UI
export const TOKEN_ECOSYSTEM = {
  tokens: [
    {
      symbol: 'QTC',
      name: 'Quantum Time Crystal',
      totalSupply: '1,000,000,000',
      chain: 'QTC Mainnet',
      pairs: ['QTC/USDT', 'QTC/USD', 'QTC/BTC', 'QTC/ETH'],
      utility: ['Fee discounts up to 70%', 'Futures vouchers', 'Governance', 'Mining rewards', 'Burn-to-pay'],
    },
    {
      symbol: 'QAQI',
      name: 'QAQI Intelligence Token',
      totalSupply: '500,000,000',
      chain: 'Ethereum',
      pairs: ['QAQI/USDT', 'QAQI/USD', 'QAQI/BTC', 'QAQI/ETH', 'QAQI/QTC'],
      utility: ['AI priority access', 'Advanced model access', 'Custom training', 'Fee discounts up to 50%'],
    },
    {
      symbol: 'AIQTP',
      name: 'AIQTP Platform Token',
      totalSupply: '750,000,000',
      chain: 'Polygon',
      pairs: ['AIQTP/USDT', 'AIQTP/USD', 'AIQTP/BTC', 'AIQTP/ETH', 'AIQTP/QTC'],
      utility: ['Platform beta access', 'Governance voting', 'Revenue share', 'Fee discounts up to 55%'],
    },
  ],
  totalCoins: '2,250,000,000',
  burnMechanism: 'Deflationary — tokens burned when used to pay fees (10% bonus value)',
  crossPairs: ['QAQI/QTC', 'AIQTP/QTC'],
} as const;

// Perk label map for UI display
export const PERK_LABELS: Record<string, string> = {
  priority_support: '⚡ Priority Support',
  reduced_withdrawal: '💸 Reduced Withdrawal Fees',
  zero_withdrawal: '🆓 Zero Withdrawal Fees',
  exclusive_signals: '📡 Exclusive Trading Signals',
  vip_chat: '💬 VIP Chat Room',
  personal_manager: '🤝 Personal Account Manager',
  ai_priority_queue: '🧠 AI Priority Queue',
  advanced_models: '🔬 Advanced AI Models',
  custom_training: '🎯 Custom Model Training',
  platform_beta_access: '🚀 Platform Beta Access',
  governance_vote: '🗳️ Governance Voting',
  revenue_share: '💰 Revenue Share',
};
