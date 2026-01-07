/**
 * AIQTP Platform Fee Structure
 * 
 * Revenue Model: Free platform access, fees only on realized profits
 * $0 to initiate, $20 minimum investment
 * Gas/transfer fees applied separately
 */

// Tiered profit-based fees - applies to trading bots and most asset classes
export const PROFIT_TIERS = [
  { min: 0.01, max: 9999.99, rate: 0.09, label: "9%" },
  { min: 10000, max: 99999.99, rate: 0.06, label: "6%" },
  { min: 100000, max: 999999.99, rate: 0.03, label: "3%" },
  { min: 1000000, max: Infinity, rate: 0.01, label: "1%" },
] as const;

// Minimum investment requirement
export const MIN_INVESTMENT = 20;

// Calculate fee based on profit amount
export function calculatePlatformFee(profitAmount: number): { fee: number; rate: number; tierLabel: string } {
  if (profitAmount <= 0) {
    return { fee: 0, rate: 0, tierLabel: "No charge (no profit)" };
  }

  for (const tier of PROFIT_TIERS) {
    if (profitAmount >= tier.min && profitAmount <= tier.max) {
      return { 
        fee: profitAmount * tier.rate, 
        rate: tier.rate,
        tierLabel: tier.label 
      };
    }
  }

  // Default to highest tier
  return { 
    fee: profitAmount * 0.01, 
    rate: 0.01,
    tierLabel: "1%" 
  };
}

// NFT Marketplace fees - competitive with OpenSea (2.5%), LooksRare (2%), Blur (0.5%)
export const NFT_FEES = {
  listingFee: 0, // $0 to list
  saleFee: 0.02, // 2% on sale (matching/beating competition)
  royaltyMax: 0.10, // 10% max creator royalty support
  comparison: [
    { platform: "OpenSea", fee: "2.5%" },
    { platform: "LooksRare", fee: "2%" },
    { platform: "Blur", fee: "0.5%" },
    { platform: "AIQTP", fee: "2%", highlight: true },
  ]
} as const;

// Strategy/Bot Marketplace - profit sharing model
export const STRATEGY_FEES = {
  listingFee: 0, // $0 to list
  profitShare: {
    creator: 0.40, // 40% to strategy creator
    renter: 0.40, // 40% to person renting
    platform: 0.20, // 20% to platform (before tiered fee)
  },
  // Platform's 20% is then subject to tiered fees
  // Effectively: platform gets between 1-9% of the 20% share
} as const;

// Real Estate / Tokenized Property
export const REAL_ESTATE_FEES = {
  listingFee: 0, // $0 to list
  transactionFee: 0.01, // 1% finder's fee (industry: 3-6%)
  // Higher value = lower tier kicks in
  comparison: [
    { platform: "Traditional Broker", fee: "3-6%" },
    { platform: "RealT", fee: "2%" },
    { platform: "AIQTP", fee: "1%", highlight: true },
  ]
} as const;

// Collectibles (Trading Cards, Memorabilia)
// Uses tiered profit model - 9%/6%/3%/1%
export const COLLECTIBLES_FEES = {
  listingFee: 0,
  saleFee: "tiered", // Uses PROFIT_TIERS
  authenticationFee: 0, // Included free
  comparison: [
    { platform: "eBay", fee: "12.9-15%" },
    { platform: "COMC", fee: "10-20%" },
    { platform: "StockX", fee: "8-12%" },
    { platform: "AIQTP", fee: "1-9%", highlight: true },
  ]
} as const;

// Precious Metals
export const PRECIOUS_METALS_FEES = {
  listingFee: 0,
  spreadFee: 0.015, // 1.5% spread (industry: 2-5%)
  storageFee: 0, // No storage fee for first year
  comparison: [
    { platform: "JM Bullion", fee: "2-4% spread" },
    { platform: "APMEX", fee: "3-5% spread" },
    { platform: "AIQTP", fee: "1.5% spread", highlight: true },
  ]
} as const;

// Luxury Goods (Watches, Wine, Art)
export const LUXURY_FEES = {
  listingFee: 0,
  saleFee: "tiered", // Uses PROFIT_TIERS
  authenticationFee: 0, // Included
  insuranceFee: "included", // Included in sale
  comparison: [
    { platform: "Christie's", fee: "25% buyer premium" },
    { platform: "1stDibs", fee: "15-20%" },
    { platform: "Sotheby's", fee: "20-25%" },
    { platform: "AIQTP", fee: "1-9%", highlight: true },
  ]
} as const;

// Virtual Assets (Gaming, Metaverse)
export const VIRTUAL_ASSETS_FEES = {
  listingFee: 0,
  saleFee: 0.025, // 2.5% flat
  comparison: [
    { platform: "Steam Market", fee: "15%" },
    { platform: "G2G", fee: "5-10%" },
    { platform: "AIQTP", fee: "2.5%", highlight: true },
  ]
} as const;

// Affiliate/Finder's Fees (for referrals)
export const AFFILIATE_FEES = {
  referralBonus: 0.10, // 10% of platform's fee share
  lifetimeReferral: true, // Lifetime earnings from referrals
  tierBonuses: [
    { referrals: 10, bonus: 0.15 }, // 15% after 10 referrals
    { referrals: 50, bonus: 0.20 }, // 20% after 50 referrals
    { referrals: 100, bonus: 0.25 }, // 25% after 100 referrals
  ]
} as const;

// Summary for display
export const FEE_SUMMARY = {
  headline: "Free to Start. Pay Only on Profits.",
  subheadline: "$0 platform fee • $20 minimum investment • Fees only when you profit",
  tiers: [
    { range: "$0.01 - $9,999.99", rate: "9% of profit" },
    { range: "$10,000 - $99,999.99", rate: "6% of profit" },
    { range: "$100,000 - $999,999.99", rate: "3% of profit" },
    { range: "$1,000,000+", rate: "1% of profit" },
  ],
  additionalCosts: [
    "Gas fees (network dependent)",
    "Transfer/withdrawal fees (at cost)",
    "Third-party authentication (if applicable)",
  ],
  freeIncludes: [
    "Full platform access",
    "All trading tools",
    "AI predictions",
    "Backtesting",
    "Strategy builder",
    "Portfolio analytics",
    "Educational content",
  ]
} as const;

// Helper to format fee comparison
export function formatFeeComparison(fees: readonly { platform: string; fee: string; highlight?: boolean }[]) {
  return fees.map(f => ({
    ...f,
    isBest: f.highlight === true
  }));
}
