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

// Affiliate/Referral Program - Tiered by referral count
// Referrer earns % of PLATFORM'S earnings from their referrals
export const AFFILIATE_FEES = {
  baseTier: { minReferrals: 0, rate: 0.10, label: "10%" }, // Base: 10% of platform's cut
  tierBonuses: [
    { minReferrals: 10, rate: 0.15, label: "15%" }, // 10+ referrals: 15%
    { minReferrals: 50, rate: 0.20, label: "20%" }, // 50+ referrals: 20%
    { minReferrals: 100, rate: 0.25, label: "25%" }, // 100+ referrals: 25%
  ],
  lifetimeReferral: true, // Lifetime earnings from referrals
  example: {
    referredUserProfit: 5000,
    platformFee: 450, // 9% of $5,000
    referrerEarnings: {
      base: 45, // 10% of $450
      tier10: 67.50, // 15% of $450
      tier50: 90, // 20% of $450
      tier100: 112.50, // 25% of $450
    }
  }
} as const;

// Calculate affiliate earnings based on referral count
export function calculateAffiliateEarnings(
  platformFeeAmount: number, 
  referralCount: number
): { earnings: number; rate: number; tierLabel: string } {
  let rate: number = AFFILIATE_FEES.baseTier.rate;
  let tierLabel: string = AFFILIATE_FEES.baseTier.label;
  
  for (const tier of AFFILIATE_FEES.tierBonuses) {
    if (referralCount >= tier.minReferrals) {
      rate = tier.rate;
      tierLabel = tier.label;
    }
  }
  
  return {
    earnings: platformFeeAmount * rate,
    rate,
    tierLabel
  };
}

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

// ============================================
// LEGAL DISCLAIMERS & RISK WARNINGS
// ============================================

export const LEGAL_DISCLAIMERS = {
  // Main risk warning
  riskWarning: `
RISK WARNING: Trading cryptocurrencies, digital assets, NFTs, and other financial instruments involves substantial risk of loss and is not suitable for all investors. The high degree of leverage can work against you as well as for you. Before deciding to trade, you should carefully consider your investment objectives, level of experience, and risk appetite. The possibility exists that you could sustain a loss of some or all of your initial investment and therefore you should not invest money that you cannot afford to lose.
  `.trim(),

  // Not financial advice
  notFinancialAdvice: `
NOT FINANCIAL ADVICE: AIQTP and its affiliates do not provide investment, legal, or tax advice. All content, tools, strategies, predictions, and information provided on this platform are for informational and educational purposes only. Nothing on this platform constitutes a recommendation to buy, sell, or hold any cryptocurrency, security, or other asset. Always conduct your own research and consult with qualified professionals before making any financial decisions.
  `.trim(),

  // Not a broker/adviser
  notBrokerAdviser: `
NOT A BROKER OR INVESTMENT ADVISER: AIQTP is a technology platform that provides tools and services. We are not a registered broker-dealer, investment adviser, or financial institution. We do not manage client funds, execute trades on behalf of users, or provide personalized investment recommendations. Users are solely responsible for their own trading decisions and actions.
  `.trim(),

  // No guarantees
  noGuarantees: `
NO GUARANTEES: Past performance is not indicative of future results. AI predictions, backtesting results, strategy performance metrics, and any other projections or analyses are provided for informational purposes only and do not guarantee future performance. All trading strategies carry risk, and there is no assurance that any strategy will be profitable.
  `.trim(),

  // Visual purposes disclaimer
  visualPurposes: `
VISUAL PURPOSES ONLY: All images, charts, graphs, mockups, screenshots, and visual representations on this platform are for illustrative and educational purposes only. They do not represent actual trading results, guaranteed outcomes, or real portfolio performance unless explicitly stated otherwise. Demo accounts and simulated trading do not reflect actual market conditions.
  `.trim(),

  // Fee disclaimer
  feeDisclaimer: `
FEE NOTICE: All fees, rates, and pricing displayed are subject to change without notice. Actual costs may vary based on network conditions, gas fees, exchange rates, third-party service providers, and other factors beyond our control. Users are responsible for verifying all applicable fees before executing transactions. Minimum investment amounts and fee structures are subject to adjustment based on market conditions and regulatory requirements.
  `.trim(),

  // Third-party disclaimer
  thirdPartyDisclaimer: `
THIRD-PARTY SERVICES: This platform may integrate with third-party services, exchanges, wallets, and APIs. AIQTP is not responsible for the actions, security, or reliability of third-party services. Users should review and accept the terms of service for any third-party integrations they choose to use.
  `.trim(),

  // Regulatory compliance
  regulatoryCompliance: `
REGULATORY NOTICE: Cryptocurrency and digital asset regulations vary by jurisdiction. It is your responsibility to ensure compliance with all applicable laws and regulations in your jurisdiction. Some features or services may not be available in certain regions due to regulatory restrictions. AIQTP reserves the right to restrict access to services based on geographic location.
  `.trim(),

  // Loss of funds
  lossOfFunds: `
POTENTIAL LOSS OF FUNDS: You acknowledge and accept that there is a risk of losing some or all of your invested capital. This includes but is not limited to: market volatility, technical failures, smart contract vulnerabilities, exchange failures, regulatory changes, hacking, and human error. Never invest more than you can afford to lose.
  `.trim(),

  // AI disclaimer
  aiDisclaimer: `
AI & ALGORITHM DISCLAIMER: AI-powered predictions, automated trading strategies, and algorithmic tools are experimental technologies. They may produce inaccurate predictions, execute trades at unfavorable prices, or fail to operate as expected. Users should monitor all automated systems and maintain the ability to intervene manually. AI predictions should be used as one of many inputs in your decision-making process, not as the sole basis for trading decisions.
  `.trim(),

  // Affiliate disclaimer
  affiliateDisclaimer: `
AFFILIATE PROGRAM: Referral bonuses and affiliate earnings are calculated based on the platform's actual fee collections from referred users. Earnings are subject to the platform's fee collection, user activity, and program terms. The platform reserves the right to modify, suspend, or terminate the affiliate program at any time. Affiliate earnings may be subject to applicable taxes in your jurisdiction.
  `.trim(),

  // Data accuracy
  dataAccuracy: `
DATA ACCURACY: While we strive to provide accurate and timely information, we do not warrant the accuracy, completeness, or reliability of any data, prices, charts, or information displayed on this platform. Data may be delayed, contain errors, or become outdated. Always verify information from multiple sources before making trading decisions.
  `.trim(),

  // Full legal footer
  fullDisclaimer: `
© ${new Date().getFullYear()} AIQTP. All rights reserved. By using this platform, you acknowledge that you have read, understood, and agree to be bound by our Terms of Service, Privacy Policy, and all applicable disclaimers. This platform is provided "as is" without warranties of any kind, either express or implied. AIQTP, its officers, directors, employees, agents, and affiliates shall not be liable for any damages arising from the use of this platform or reliance on any information provided herein. Trading involves substantial risk. Only risk capital should be used for trading. Past performance is not indicative of future results.
  `.trim(),
} as const;

// Compact disclaimers for UI badges/banners
export const COMPACT_DISCLAIMERS = {
  risk: "⚠️ Trading involves substantial risk of loss",
  notAdvice: "📋 Not financial advice",
  noGuarantee: "🎯 Past performance ≠ future results",
  visualOnly: "🖼️ Images for illustration only",
  feesVary: "💰 Fees subject to change & actual costs",
  aiExperimental: "🤖 AI predictions are experimental",
  dyor: "🔍 Always do your own research",
} as const;

// Required acknowledgment for onboarding
export const REQUIRED_ACKNOWLEDGMENTS = [
  "I understand that trading involves substantial risk of loss",
  "I acknowledge that AIQTP does not provide financial advice",
  "I understand that past performance does not guarantee future results",
  "I accept that all fees are subject to actual network costs",
  "I confirm I am trading with funds I can afford to lose",
  "I understand AI predictions are experimental and not guaranteed",
] as const;
