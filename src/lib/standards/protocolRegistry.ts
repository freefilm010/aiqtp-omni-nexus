/**
 * Protocol Standards Registry
 * Comprehensive EIP, NIST, FIPS, ISO compliance reference
 * Dictates token/contract/asset creation standards
 */

export type StandardCategory = 'eip' | 'nist' | 'fips' | 'iso' | 'erc' | 'bip' | 'spl';

export type AssetClassification = 
  | 'fungible_currency'      // ERC-20: like currency, similar in value
  | 'non_fungible_unique'    // ERC-721: unique, not similar in value
  | 'non_fungible_optimized' // ERC-721A: gas-optimized unique
  | 'semi_fungible'          // ERC-1155: multi-token, editions
  | 'security_token'         // ERC-1400: regulated securities
  | 'soulbound'              // ERC-5192: non-transferable identity
  | 'real_world_asset'       // ERC-3643: RWA tokenization
  | 'document_ownership'     // Custom: document/IP NFTs
  | 'utility_token';         // Utility within platform

export interface ProtocolStandard {
  id: string;
  category: StandardCategory;
  number: string;
  name: string;
  description: string;
  assetClassification: AssetClassification;
  valueNature: 'like_and_similar' | 'like_but_not_similar' | 'hybrid' | 'regulatory';
  status: 'final' | 'draft' | 'active' | 'superseded';
  url?: string;
  applicableTo: string[];
  requiredForCompliance: boolean;
  relatedStandards: string[];
}

// ═══════════════════════════════════════
//  EIP/ERC TOKEN STANDARDS
// ═══════════════════════════════════════

export const EIP_STANDARDS: ProtocolStandard[] = [
  // ── Fungible (Like & Similar in Value) ──
  {
    id: 'erc-20',
    category: 'erc',
    number: '20',
    name: 'ERC-20: Fungible Token Standard',
    description: 'Defines a standard interface for fungible tokens — each unit is identical and interchangeable. Used for currencies, utility tokens, and governance tokens. Every token of the same type holds equal value.',
    assetClassification: 'fungible_currency',
    valueNature: 'like_and_similar',
    status: 'final',
    url: 'https://eips.ethereum.org/EIPS/eip-20',
    applicableTo: ['$QTC', '$QAQI', '$AIQTP', 'Stablecoins', 'Governance tokens'],
    requiredForCompliance: true,
    relatedStandards: ['erc-2612', 'eip-2981', 'erc-4626'],
  },
  {
    id: 'erc-2612',
    category: 'erc',
    number: '2612',
    name: 'ERC-2612: Permit (Gasless Approvals)',
    description: 'Extension to ERC-20 allowing signature-based approvals, eliminating the need for a separate approve transaction. Reduces gas costs for users.',
    assetClassification: 'fungible_currency',
    valueNature: 'like_and_similar',
    status: 'final',
    url: 'https://eips.ethereum.org/EIPS/eip-2612',
    applicableTo: ['$QTC', '$QAQI', '$AIQTP'],
    requiredForCompliance: false,
    relatedStandards: ['erc-20'],
  },
  {
    id: 'erc-4626',
    category: 'erc',
    number: '4626',
    name: 'ERC-4626: Tokenized Vault Standard',
    description: 'Standard for yield-bearing vaults. Wraps ERC-20 tokens into shares representing proportional ownership of deposited assets. Essential for DeFi staking and auto-invest pools.',
    assetClassification: 'fungible_currency',
    valueNature: 'like_and_similar',
    status: 'final',
    url: 'https://eips.ethereum.org/EIPS/eip-4626',
    applicableTo: ['Staking vaults', 'Auto-invest pools', 'Yield strategies'],
    requiredForCompliance: false,
    relatedStandards: ['erc-20'],
  },

  // ── Non-Fungible (Like but NOT Similar in Value) ──
  {
    id: 'erc-721',
    category: 'erc',
    number: '721',
    name: 'ERC-721: Non-Fungible Token Standard',
    description: 'Defines unique, indivisible tokens where each has a distinct identity and value. Used for art, collectibles, real estate deeds, and identity documents. No two tokens are alike.',
    assetClassification: 'non_fungible_unique',
    valueNature: 'like_but_not_similar',
    status: 'final',
    url: 'https://eips.ethereum.org/EIPS/eip-721',
    applicableTo: ['NFT Art', 'Bot Persona Cards', 'Real estate deeds', 'IP certificates'],
    requiredForCompliance: true,
    relatedStandards: ['erc-721a', 'eip-2981', 'erc-4907'],
  },
  {
    id: 'erc-721a',
    category: 'erc',
    number: '721A',
    name: 'ERC-721A: Gas-Optimized NFT',
    description: 'Azuki\'s gas-optimized implementation of ERC-721. Enables batch minting multiple NFTs for nearly the gas cost of one. Maintains full ERC-721 compliance while dramatically reducing deployment and minting costs.',
    assetClassification: 'non_fungible_optimized',
    valueNature: 'like_but_not_similar',
    status: 'final',
    url: 'https://www.erc721a.org/',
    applicableTo: ['NFT Collections', 'Bot Persona Cards', 'Batch mints'],
    requiredForCompliance: false,
    relatedStandards: ['erc-721', 'eip-2981'],
  },
  {
    id: 'erc-4907',
    category: 'erc',
    number: '4907',
    name: 'ERC-4907: Rental NFT',
    description: 'Adds time-limited "user" role to ERC-721. Separates ownership from usage rights, enabling NFT rentals that auto-expire. Critical for strategy bot rentals and temporary access grants.',
    assetClassification: 'non_fungible_unique',
    valueNature: 'like_but_not_similar',
    status: 'final',
    url: 'https://eips.ethereum.org/EIPS/eip-4907',
    applicableTo: ['Bot strategy rentals', 'Subscription NFTs', 'Access passes'],
    requiredForCompliance: false,
    relatedStandards: ['erc-721'],
  },

  // ── Semi-Fungible (Hybrid) ──
  {
    id: 'erc-1155',
    category: 'erc',
    number: '1155',
    name: 'ERC-1155: Multi-Token Standard',
    description: 'Supports both fungible and non-fungible tokens in a single contract. Enables batch transfers across token types in one transaction. Ideal for game items, edition prints, and mixed asset collections.',
    assetClassification: 'semi_fungible',
    valueNature: 'hybrid',
    status: 'final',
    url: 'https://eips.ethereum.org/EIPS/eip-1155',
    applicableTo: ['Edition NFTs', 'Gaming items', 'Rewards tokens', 'Mixed collections'],
    requiredForCompliance: true,
    relatedStandards: ['erc-721', 'erc-20'],
  },

  // ── Security & Compliance Tokens ──
  {
    id: 'erc-1400',
    category: 'erc',
    number: '1400',
    name: 'ERC-1400: Security Token Standard',
    description: 'Implements partitioned, controllable tokens for regulated securities. Supports forced transfers, document management, and compliance checks. Required for tokenized equities, bonds, and revenue-share tokens.',
    assetClassification: 'security_token',
    valueNature: 'regulatory',
    status: 'draft',
    url: 'https://github.com/ethereum/EIPs/issues/1411',
    applicableTo: ['Security tokens', 'Revenue-share tokens', 'Tokenized equities'],
    requiredForCompliance: true,
    relatedStandards: ['erc-20', 'erc-3643'],
  },
  {
    id: 'erc-3643',
    category: 'erc',
    number: '3643',
    name: 'ERC-3643: T-REX (Real-World Assets)',
    description: 'Institutional-grade standard for tokenizing real-world assets with built-in identity verification and compliance. Supports KYC/AML requirements and transfer restrictions per jurisdiction.',
    assetClassification: 'real_world_asset',
    valueNature: 'regulatory',
    status: 'final',
    url: 'https://eips.ethereum.org/EIPS/eip-3643',
    applicableTo: ['Real estate tokens', 'Commodity tokens', 'Regulated assets'],
    requiredForCompliance: true,
    relatedStandards: ['erc-1400', 'erc-20'],
  },

  // ── Identity & Soulbound ──
  {
    id: 'erc-5192',
    category: 'erc',
    number: '5192',
    name: 'ERC-5192: Soulbound Token',
    description: 'Non-transferable tokens bound to a single address permanently. Used for credentials, certifications, achievements, and identity attestations that should never be sold or traded.',
    assetClassification: 'soulbound',
    valueNature: 'like_but_not_similar',
    status: 'final',
    url: 'https://eips.ethereum.org/EIPS/eip-5192',
    applicableTo: ['User achievements', 'KYC attestations', 'Certifications', 'Elite membership'],
    requiredForCompliance: false,
    relatedStandards: ['erc-721'],
  },

  // ── Royalties ──
  {
    id: 'eip-2981',
    category: 'eip',
    number: '2981',
    name: 'EIP-2981: NFT Royalty Standard',
    description: 'Universal royalty payment standard for NFTs. Allows creators to receive a percentage of secondary sales across all marketplaces. Implemented in all platform NFT contracts.',
    assetClassification: 'non_fungible_unique',
    valueNature: 'like_but_not_similar',
    status: 'final',
    url: 'https://eips.ethereum.org/EIPS/eip-2981',
    applicableTo: ['All NFTs', 'Bot Persona Cards', 'Art', 'Collectibles'],
    requiredForCompliance: true,
    relatedStandards: ['erc-721', 'erc-1155'],
  },
];

// ═══════════════════════════════════════
//  NIST & FIPS SECURITY STANDARDS
// ═══════════════════════════════════════

export const SECURITY_STANDARDS: ProtocolStandard[] = [
  {
    id: 'fips-203',
    category: 'fips',
    number: '203',
    name: 'FIPS 203: ML-KEM (Kyber)',
    description: 'Module-Lattice-Based Key Encapsulation Mechanism. NIST-standardized post-quantum key exchange. Protects all key exchanges on the platform against quantum computing attacks.',
    assetClassification: 'fungible_currency',
    valueNature: 'regulatory',
    status: 'final',
    url: 'https://csrc.nist.gov/pubs/fips/203/final',
    applicableTo: ['Wallet encryption', 'Key exchange', 'Secure channels'],
    requiredForCompliance: true,
    relatedStandards: ['fips-204', 'fips-205'],
  },
  {
    id: 'fips-204',
    category: 'fips',
    number: '204',
    name: 'FIPS 204: ML-DSA (Dilithium)',
    description: 'Module-Lattice-Based Digital Signature Algorithm. NIST-standardized post-quantum digital signatures. Used for all transaction signing and identity verification on the platform.',
    assetClassification: 'fungible_currency',
    valueNature: 'regulatory',
    status: 'final',
    url: 'https://csrc.nist.gov/pubs/fips/204/final',
    applicableTo: ['Transaction signing', 'Contract deployment', 'Identity verification'],
    requiredForCompliance: true,
    relatedStandards: ['fips-203', 'fips-205'],
  },
  {
    id: 'fips-205',
    category: 'fips',
    number: '205',
    name: 'FIPS 205: SLH-DSA (SPHINCS+)',
    description: 'Stateless Hash-Based Digital Signature Algorithm. Backup post-quantum signature scheme based on hash functions rather than lattices, providing algorithm diversity.',
    assetClassification: 'fungible_currency',
    valueNature: 'regulatory',
    status: 'final',
    url: 'https://csrc.nist.gov/pubs/fips/205/final',
    applicableTo: ['Backup signatures', 'Long-term archive verification'],
    requiredForCompliance: false,
    relatedStandards: ['fips-204'],
  },
  {
    id: 'fips-206',
    category: 'fips',
    number: '206',
    name: 'FIPS 206: FN-DSA (Falcon)',
    description: 'FFT over NTRU-Lattice-Based Digital Signature Algorithm. Compact post-quantum signatures ideal for bandwidth-constrained environments like blockchain transactions.',
    assetClassification: 'fungible_currency',
    valueNature: 'regulatory',
    status: 'draft',
    url: 'https://csrc.nist.gov/pubs/fips/206/ipd',
    applicableTo: ['Compact on-chain signatures', 'Mobile wallets'],
    requiredForCompliance: false,
    relatedStandards: ['fips-204'],
  },
  {
    id: 'nist-sp-800-208',
    category: 'nist',
    number: 'SP 800-208',
    name: 'NIST SP 800-208: Hash-Based Signatures',
    description: 'Recommendation for stateful hash-based signature schemes (LMS, XMSS). Provides quantum-resistant signing for firmware and long-lived keys.',
    assetClassification: 'fungible_currency',
    valueNature: 'regulatory',
    status: 'final',
    url: 'https://csrc.nist.gov/pubs/sp/800/208/final',
    applicableTo: ['Root key signing', 'Firmware verification'],
    requiredForCompliance: false,
    relatedStandards: ['fips-205'],
  },
  {
    id: 'nist-sp-800-186',
    category: 'nist',
    number: 'SP 800-186',
    name: 'NIST SP 800-186: Elliptic Curves',
    description: 'Recommendations for discrete logarithm-based cryptography using elliptic curves. Foundation for current blockchain cryptography (secp256k1, ed25519).',
    assetClassification: 'fungible_currency',
    valueNature: 'regulatory',
    status: 'final',
    url: 'https://csrc.nist.gov/pubs/sp/800/186/final',
    applicableTo: ['Current wallet addresses', 'ECDSA signatures'],
    requiredForCompliance: true,
    relatedStandards: ['fips-203'],
  },
];

// ═══════════════════════════════════════
//  ISO STANDARDS
// ═══════════════════════════════════════

export const ISO_STANDARDS: ProtocolStandard[] = [
  {
    id: 'iso-20022',
    category: 'iso',
    number: '20022',
    name: 'ISO 20022: Financial Messaging',
    description: 'Universal financial industry message scheme for electronic data interchange between financial institutions. Mandatory for cross-border payments and SWIFT compatibility.',
    assetClassification: 'fungible_currency',
    valueNature: 'regulatory',
    status: 'active',
    url: 'https://www.iso20022.org/',
    applicableTo: ['Fiat transfers', 'Cross-border payments', 'Banking integrations'],
    requiredForCompliance: true,
    relatedStandards: ['iso-4217'],
  },
  {
    id: 'iso-4217',
    category: 'iso',
    number: '4217',
    name: 'ISO 4217: Currency Codes',
    description: 'International standard for three-letter currency codes. Defines the codes used for all fiat currencies on the platform (USD, EUR, GBP, etc.).',
    assetClassification: 'fungible_currency',
    valueNature: 'like_and_similar',
    status: 'active',
    url: 'https://www.iso.org/iso-4217-currency-codes.html',
    applicableTo: ['All fiat currency references', 'Trading pairs'],
    requiredForCompliance: true,
    relatedStandards: ['iso-20022'],
  },
  {
    id: 'iso-27001',
    category: 'iso',
    number: '27001',
    name: 'ISO/IEC 27001: Information Security',
    description: 'International standard for information security management systems (ISMS). Provides the framework for platform security policies, access controls, and incident response.',
    assetClassification: 'fungible_currency',
    valueNature: 'regulatory',
    status: 'active',
    url: 'https://www.iso.org/standard/27001',
    applicableTo: ['Platform security', 'Data protection', 'Access controls'],
    requiredForCompliance: true,
    relatedStandards: ['iso-27701', 'nist-sp-800-186'],
  },
  {
    id: 'iso-27701',
    category: 'iso',
    number: '27701',
    name: 'ISO/IEC 27701: Privacy Management',
    description: 'Extension to ISO 27001 for privacy information management. Governs how the platform handles personally identifiable information (PII) including KYC data.',
    assetClassification: 'fungible_currency',
    valueNature: 'regulatory',
    status: 'active',
    url: 'https://www.iso.org/standard/71670.html',
    applicableTo: ['User data', 'KYC/AML compliance', 'Data retention'],
    requiredForCompliance: true,
    relatedStandards: ['iso-27001'],
  },
  {
    id: 'iso-24165',
    category: 'iso',
    number: '24165',
    name: 'ISO 24165: Digital Token Identifier (DTI)',
    description: 'International standard for uniquely identifying digital tokens and cryptocurrencies. Assigns DTIs analogous to ISINs for securities. Ensures $QTC, $QAQI, and $AIQTP are globally identifiable.',
    assetClassification: 'fungible_currency',
    valueNature: 'like_and_similar',
    status: 'active',
    url: 'https://www.iso.org/standard/78153.html',
    applicableTo: ['$QTC', '$QAQI', '$AIQTP', 'All platform tokens'],
    requiredForCompliance: true,
    relatedStandards: ['iso-4217'],
  },
];

import { OPENZEPPELIN_STANDARDS } from './openzeppelinStandards';
import { PQC_STANDARDS } from './pqcStandards';
import { EXTENDED_EIP_STANDARDS } from './extendedEipStandards';
import { RWA_EMERGING_STANDARDS } from './rwaEmergingStandards';

// ═══════════════════════════════════════
//  COMBINED REGISTRY
// ═══════════════════════════════════════

export const ALL_STANDARDS: ProtocolStandard[] = [
  ...EIP_STANDARDS,
  ...EXTENDED_EIP_STANDARDS,
  ...RWA_EMERGING_STANDARDS,
  ...SECURITY_STANDARDS,
  ...ISO_STANDARDS,
  ...OPENZEPPELIN_STANDARDS,
  ...PQC_STANDARDS,
];

export { OPENZEPPELIN_STANDARDS, PQC_STANDARDS, EXTENDED_EIP_STANDARDS, RWA_EMERGING_STANDARDS };

// Value classification helpers
export const VALUE_NATURE_LABELS: Record<string, { label: string; description: string; color: string }> = {
  like_and_similar: {
    label: 'Fungible — Like & Similar in Value',
    description: 'Each unit is identical and interchangeable (e.g., 1 $QTC = 1 $QTC). Like currency.',
    color: 'text-green-400',
  },
  like_but_not_similar: {
    label: 'Non-Fungible — Like but NOT Similar in Value',
    description: 'Each token is unique with its own identity and worth. No two are the same.',
    color: 'text-purple-400',
  },
  hybrid: {
    label: 'Semi-Fungible — Hybrid',
    description: 'Supports both fungible quantities and unique items in one contract.',
    color: 'text-blue-400',
  },
  regulatory: {
    label: 'Regulatory / Security Standard',
    description: 'Compliance framework that governs how tokens and data must be handled.',
    color: 'text-amber-400',
  },
};

// Get standards applicable to a specific token action
export function getApplicableStandards(action: 'mint_coin' | 'mint_nft' | 'deploy_contract' | 'transfer' | 'security'): ProtocolStandard[] {
  const mapping: Record<string, string[]> = {
    mint_coin: ['erc-20', 'erc-2612', 'iso-4217', 'iso-24165', 'fips-203', 'fips-204'],
    mint_nft: ['erc-721', 'erc-721a', 'erc-1155', 'eip-2981', 'erc-4907', 'erc-5192'],
    deploy_contract: ['erc-20', 'erc-721', 'erc-721a', 'erc-1155', 'erc-1400', 'erc-3643', 'eip-2981'],
    transfer: ['iso-20022', 'fips-203', 'fips-204', 'nist-sp-800-186'],
    security: ['fips-203', 'fips-204', 'fips-205', 'fips-206', 'nist-sp-800-208', 'nist-sp-800-186', 'iso-27001', 'iso-27701'],
  };
  const ids = mapping[action] || [];
  return ALL_STANDARDS.filter(s => ids.includes(s.id));
}

// Get the correct standard for a token type
export function getTokenTypeStandard(tokenType: 'coin' | 'nft_unique' | 'nft_edition' | 'security' | 'soulbound' | 'rwa'): ProtocolStandard | undefined {
  const mapping: Record<string, string> = {
    coin: 'erc-20',
    nft_unique: 'erc-721',
    nft_edition: 'erc-1155',
    security: 'erc-1400',
    soulbound: 'erc-5192',
    rwa: 'erc-3643',
  };
  return ALL_STANDARDS.find(s => s.id === mapping[tokenType]);
}
