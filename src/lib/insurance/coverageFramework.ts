/**
 * AIQTP Insurance & Asset Protection Framework
 * 
 * Tiered coverage model where grouping many accounts under a master policy
 * reduces costs collectively. Users benefit from institutional-grade coverage
 * at individual pricing that would be impossible to obtain alone.
 * 
 * Revenue Model:
 * - Commission on embedded insurance products (10-25% of premium)
 * - Tiered coverage included with paid subscriptions (cost absorbed into tier pricing)
 * - Optional add-on protection plans at user's choice
 * 
 * ═══════════════════════════════════════════════════════════════
 * INSURANCE PROVIDER SHORTLIST (Narrowed for final review)
 * ═══════════════════════════════════════════════════════════════
 * 
 * PLATFORM-LEVEL COVERAGE (for AIQTP as a business):
 * ┌──────────────────────────────────────────────────────────────┐
 * │ Provider              │ Coverage Type        │ Notes         │
 * ├──────────────────────────────────────────────────────────────┤
 * │ Crum & Forster        │ FInTECH ONE          │ Integrated    │
 * │   (FInTECH ONE)       │ E&O + Cyber +        │ E&O/Cyber/    │
 * │                       │ Multimedia           │ Media bundle  │
 * │                       │                      │ Best-in-class │
 * ├──────────────────────────────────────────────────────────────┤
 * │ Canopius              │ Bespoke Fintech      │ Tailored to   │
 * │                       │ E&O + Cyber          │ fintech scale │
 * ├──────────────────────────────────────────────────────────────┤
 * │ Vouch Insurance       │ Startup Cyber/E&O    │ Fast quoting, │
 * │                       │                      │ startup focus │
 * ├──────────────────────────────────────────────────────────────┤
 * │ 1Fort                 │ Tech E&O             │ AI-powered    │
 * │                       │                      │ instant quote │
 * ├──────────────────────────────────────────────────────────────┤
 * │ Anzen                 │ Cyber Risk           │ Dynamic       │
 * │                       │                      │ quoting       │
 * └──────────────────────────────────────────────────────────────┘
 * 
 * USER-FACING EMBEDDED INSURANCE (revenue stream):
 * ┌──────────────────────────────────────────────────────────────┐
 * │ Provider              │ Type                 │ Revenue Model │
 * ├──────────────────────────────────────────────────────────────┤
 * │ WithBelay API         │ Stock downside       │ Commission on │
 * │   withbelay.com/api   │ protection ("flight  │ premium; API  │
 * │                       │ insurance for stocks")│ integration   │
 * ├──────────────────────────────────────────────────────────────┤
 * │ Nexus Mutual          │ Crypto/DeFi cover    │ On-chain;     │
 * │   nexusmutual.io      │ $6B+ protected       │ referral fee  │
 * ├──────────────────────────────────────────────────────────────┤
 * │ CoinCover             │ Crypto custody       │ B2B; custody  │
 * │   coincover.com       │ insurance            │ insurance API │
 * ├──────────────────────────────────────────────────────────────┤
 * │ Qover                 │ Embedded insurance   │ 10-25%        │
 * │   qover.com           │ platform for banks   │ commission    │
 * │                       │ & fintechs           │ on premiums   │
 * ├──────────────────────────────────────────────────────────────┤
 * │ Weecover              │ Embedded insurance   │ Revenue share │
 * │   weecover.com        │ sales platform       │ on policies   │
 * └──────────────────────────────────────────────────────────────┘
 * 
 * PRIORITY ACTIONS:
 * 1. Get quotes from Crum & Forster FInTECH ONE (platform E&O+Cyber)
 * 2. Get quotes from Vouch (fastest for startups)
 * 3. Evaluate WithBelay API for embedded stock protection (revenue)
 * 4. Evaluate Nexus Mutual integration for crypto coverage (revenue)
 * 5. Contact Qover for embedded insurance platform partnership
 */

// ============================================
// TIERED INSURANCE COVERAGE MODEL
// ============================================

export interface InsuranceTier {
  name: string;
  level: 'free' | 'basic' | 'pro' | 'institutional';
  monthlyPremium: number; // $0 for included, or add-on price
  included: boolean; // true = included with subscription tier
  coverages: InsuranceCoverage[];
  maxCoverageUSD: number;
  deductibleUSD: number;
  description: string;
}

export interface InsuranceCoverage {
  type: InsuranceCoverageType;
  description: string;
  maxPayout: number;
  included: boolean;
}

export type InsuranceCoverageType =
  | 'platform_outage' // Protection against platform downtime losses
  | 'cyber_breach' // Protection if platform is hacked
  | 'smart_contract' // Smart contract failure coverage
  | 'exchange_failure' // Third-party exchange goes down
  | 'custody_loss' // Custodial asset loss protection
  | 'downside_protection' // Stock/crypto downside insurance
  | 'regulatory_action' // Regulatory freeze/seizure protection
  | 'flash_crash' // Extreme market volatility protection
  | 'key_compromise' // Private key/wallet compromise
  | 'force_majeure'; // Acts of god coverage

/**
 * Master Policy Group Pricing Model
 * 
 * By pooling all platform users under a master policy, per-user costs drop
 * dramatically compared to individual policies:
 * 
 * Individual Policy: ~$500-2000/year per user
 * Group Master Policy: ~$50-200/year per user (75-90% savings)
 * 
 * The platform absorbs the master policy cost and distributes it across
 * tier pricing, making it a built-in benefit that increases retention.
 */

export const INSURANCE_TIERS: InsuranceTier[] = [
  {
    name: 'Explorer',
    level: 'free',
    monthlyPremium: 0,
    included: true,
    maxCoverageUSD: 0,
    deductibleUSD: 0,
    description: 'Platform-level protections only. No individual coverage.',
    coverages: [
      {
        type: 'platform_outage',
        description: 'Platform maintains E&O insurance for operational errors',
        maxPayout: 0,
        included: true,
      },
      {
        type: 'cyber_breach',
        description: 'Platform cyber insurance covers data breach notification costs',
        maxPayout: 0,
        included: true,
      },
    ],
  },
  {
    name: 'Shield',
    level: 'basic',
    monthlyPremium: 9.99,
    included: false, // Add-on for free users, included with Pro subscription
    maxCoverageUSD: 10_000,
    deductibleUSD: 500,
    description: 'Basic asset protection up to $10,000. Covers platform outages and cyber incidents.',
    coverages: [
      {
        type: 'platform_outage',
        description: 'Compensation for verified losses during platform outages',
        maxPayout: 5_000,
        included: true,
      },
      {
        type: 'cyber_breach',
        description: 'Coverage for losses from platform security incidents',
        maxPayout: 10_000,
        included: true,
      },
      {
        type: 'exchange_failure',
        description: 'Protection if connected third-party exchange fails',
        maxPayout: 5_000,
        included: true,
      },
    ],
  },
  {
    name: 'Fortress',
    level: 'pro',
    monthlyPremium: 29.99,
    included: false, // Add-on; included with Institutional subscription
    maxCoverageUSD: 100_000,
    deductibleUSD: 250,
    description: 'Comprehensive coverage up to $100K. Includes smart contract and custody protection.',
    coverages: [
      {
        type: 'platform_outage',
        description: 'Full outage compensation with priority claims processing',
        maxPayout: 25_000,
        included: true,
      },
      {
        type: 'cyber_breach',
        description: 'Comprehensive breach coverage including identity monitoring',
        maxPayout: 50_000,
        included: true,
      },
      {
        type: 'smart_contract',
        description: 'Smart contract failure and exploit protection',
        maxPayout: 25_000,
        included: true,
      },
      {
        type: 'custody_loss',
        description: 'Custodial asset loss protection for platform-held assets',
        maxPayout: 50_000,
        included: true,
      },
      {
        type: 'exchange_failure',
        description: 'Extended third-party exchange failure protection',
        maxPayout: 25_000,
        included: true,
      },
      {
        type: 'key_compromise',
        description: 'Private key or wallet compromise coverage',
        maxPayout: 25_000,
        included: true,
      },
    ],
  },
  {
    name: 'Citadel',
    level: 'institutional',
    monthlyPremium: 99.99,
    included: false, // Premium add-on
    maxCoverageUSD: 1_000_000,
    deductibleUSD: 0,
    description: 'Institutional-grade protection up to $1M. Zero deductible. All coverage types included.',
    coverages: [
      {
        type: 'platform_outage',
        description: 'Full outage compensation with SLA guarantees',
        maxPayout: 100_000,
        included: true,
      },
      {
        type: 'cyber_breach',
        description: 'Comprehensive cyber incident coverage with forensics',
        maxPayout: 500_000,
        included: true,
      },
      {
        type: 'smart_contract',
        description: 'Smart contract audit guarantee and exploit coverage',
        maxPayout: 250_000,
        included: true,
      },
      {
        type: 'custody_loss',
        description: 'Full custodial asset protection with cold storage guarantee',
        maxPayout: 500_000,
        included: true,
      },
      {
        type: 'exchange_failure',
        description: 'Multi-exchange failure protection with instant claims',
        maxPayout: 250_000,
        included: true,
      },
      {
        type: 'downside_protection',
        description: 'Market crash downside protection (flash crash guard)',
        maxPayout: 100_000,
        included: true,
      },
      {
        type: 'regulatory_action',
        description: 'Regulatory freeze or seizure legal defense coverage',
        maxPayout: 100_000,
        included: true,
      },
      {
        type: 'flash_crash',
        description: 'Extreme volatility and flash crash loss mitigation',
        maxPayout: 100_000,
        included: true,
      },
      {
        type: 'key_compromise',
        description: 'Private key compromise with full recovery assistance',
        maxPayout: 250_000,
        included: true,
      },
      {
        type: 'force_majeure',
        description: 'Acts of god / force majeure event coverage',
        maxPayout: 100_000,
        included: true,
      },
    ],
  },
];

/**
 * Coverage type display labels and icons
 */
export const COVERAGE_TYPE_INFO: Record<InsuranceCoverageType, { label: string; icon: string }> = {
  platform_outage: { label: 'Platform Outage Protection', icon: '🔌' },
  cyber_breach: { label: 'Cyber Breach Coverage', icon: '🛡️' },
  smart_contract: { label: 'Smart Contract Protection', icon: '📜' },
  exchange_failure: { label: 'Exchange Failure Coverage', icon: '🏦' },
  custody_loss: { label: 'Custody Loss Protection', icon: '🔐' },
  downside_protection: { label: 'Downside Protection', icon: '📉' },
  regulatory_action: { label: 'Regulatory Action Coverage', icon: '⚖️' },
  flash_crash: { label: 'Flash Crash Guard', icon: '⚡' },
  key_compromise: { label: 'Key Compromise Coverage', icon: '🔑' },
  force_majeure: { label: 'Force Majeure Coverage', icon: '🌪️' },
};

/**
 * Calculate group discount based on total enrolled users.
 * More users = lower per-user premium.
 */
export function calculateGroupDiscount(totalEnrolled: number): number {
  if (totalEnrolled >= 10000) return 0.30; // 30% discount
  if (totalEnrolled >= 5000) return 0.25;
  if (totalEnrolled >= 1000) return 0.20;
  if (totalEnrolled >= 500) return 0.15;
  if (totalEnrolled >= 100) return 0.10;
  return 0; // No discount under 100 users
}

/**
 * Estimate annual platform insurance revenue from user protection plans.
 */
export function estimateInsuranceRevenue(
  enrolledByTier: Record<string, number>,
  commissionRate = 0.15 // 15% commission on premiums
): { totalPremiums: number; platformRevenue: number; perUserAvg: number } {
  let totalPremiums = 0;
  let totalUsers = 0;

  for (const tier of INSURANCE_TIERS) {
    const enrolled = enrolledByTier[tier.level] || 0;
    totalPremiums += enrolled * tier.monthlyPremium * 12;
    totalUsers += enrolled;
  }

  const discount = calculateGroupDiscount(totalUsers);
  const discountedPremiums = totalPremiums * (1 - discount);

  return {
    totalPremiums: discountedPremiums,
    platformRevenue: discountedPremiums * commissionRate,
    perUserAvg: totalUsers > 0 ? discountedPremiums / totalUsers : 0,
  };
}
