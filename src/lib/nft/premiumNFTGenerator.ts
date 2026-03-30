/**
 * Premium NFT Generator - AIQTP™ IP Collection
 * 10,000 piece collections with trending attributes
 * Timestamped and dated for provenance
 */

// Trending NFT Attributes based on market research
export const TRENDING_ATTRIBUTES = {
  backgrounds: [
    'Cosmic Void', 'Quantum Matrix', 'Neural Network', 'Digital Aurora', 
    'Cyber Grid', 'Neon Abyss', 'Holographic Mist', 'Plasma Field',
    'Data Stream', 'Binary Rain', 'Crystal Lattice', 'Dimensional Rift'
  ],
  styles: [
    'Pixel Art', 'Glitch Art', 'Vaporwave', '3D Rendered', 'Hand Drawn',
    'Generative', 'Motion Loop', 'Fractalized', 'Low Poly', 'Isometric',
    'Cyberpunk', 'Synthwave', 'Minimalist', 'Maximalist', 'Abstract'
  ],
  effects: [
    'Neon Glow', 'Particle Storm', 'Holographic Shine', 'Rainbow Shimmer',
    'Electric Arc', 'Plasma Burst', 'Data Cascade', 'Quantum Entangle',
    'AI Neural Fire', 'Crystal Refraction', 'Motion Blur', 'Scanlines'
  ],
  rarityTiers: [
    { name: 'Common', weight: 50, color: '#8B9A9A' },
    { name: 'Uncommon', weight: 25, color: '#00D4AA' },
    { name: 'Rare', weight: 15, color: '#3B82F6' },
    { name: 'Epic', weight: 7, color: '#A855F7' },
    { name: 'Legendary', weight: 2.5, color: '#FFD700' },
    { name: 'Mythic', weight: 0.5, color: '#FF00FF' }
  ],
  motionTypes: [
    'Static', 'Subtle Pulse', 'Floating', 'Rotating', 'Morphing',
    'Breathing', 'Wave Motion', 'Glitch Loop', 'Particle Animation'
  ],
  auras: [
    'None', 'Golden Halo', 'Electric Surge', 'Quantum Field', 
    'Divine Light', 'Dark Matter', 'Chromatic Pulse', 'Celestial Glow'
  ],
  patterns: [
    'Solid', 'Gradient', 'Geometric', 'Organic', 'Circuit Board',
    'Mandala', 'Fractal', 'Tessellation', 'Wave', 'Noise'
  ]
};

// Copyright NFT themes
export const COPYRIGHT_THEMES = [
  { category: 'Trading Systems', prefix: 'TradeCore' },
  { category: 'AI Algorithms', prefix: 'NeuralForge' },
  { category: 'Security Protocols', prefix: 'CipherShield' },
  { category: 'Data Analytics', prefix: 'DataPulse' },
  { category: 'Market Intelligence', prefix: 'MarketMind' },
  { category: 'Risk Management', prefix: 'RiskGuard' },
  { category: 'Portfolio Optimization', prefix: 'PortfolioAI' },
  { category: 'Quantum Computing', prefix: 'QuantumEdge' },
  { category: 'Blockchain Infrastructure', prefix: 'ChainCore' },
  { category: 'DeFi Protocols', prefix: 'DeFiForge' }
];

// Trademark NFT themes
export const TRADEMARK_THEMES = [
  { category: 'Platform Brands', prefix: 'AIQTP' },
  { category: 'AI Agents', prefix: 'QAQI' },
  { category: 'Wallet Systems', prefix: 'QuWallet' },
  { category: 'Trading Bots', prefix: 'TradoBot' },
  { category: 'Market Tools', prefix: 'MarketPro' },
  { category: 'Security Solutions', prefix: 'SecureVault' },
  { category: 'Analytics Suite', prefix: 'InsightAI' },
  { category: 'Lightning Network', prefix: 'LightningVault' },
  { category: 'Data Products', prefix: 'DataForge' },
  { category: 'Ecosystem Tokens', prefix: 'QTC' }
];

export interface GeneratedNFT {
  id: string;
  tokenId: string;
  name: string;
  description: string;
  type: 'copyright' | 'trademark';
  category: string;
  mintedAt: string; // ISO timestamp
  mintedDate: string; // Human readable
  edition: number;
  maxEdition: number;
  attributes: NFTAttribute[];
  rarity: string;
  rarityScore: number;
  estimatedValue: number;
  chain: string;
  status: 'minted' | 'listed' | 'reserved';
  owner: string;
  imagePrompt: string;
}

export interface NFTAttribute {
  trait_type: string;
  value: string | number;
  rarity_score?: number;
}

// Deterministic seeded pseudo-random for reproducible NFT generation
function seededValue(seed: number, offset: number): number {
  return Math.abs(Math.sin(seed * 0.7127 + offset * 1.618033));
}

function getSeededElement<T>(arr: T[], seed: number, offset: number): T {
  return arr[Math.floor(seededValue(seed, offset) * arr.length)];
}

function calculateRarity(seed: number): { name: string; score: number; color: string } {
  const roll = seededValue(seed, 99) * 100;
  let cumulative = 0;
  for (const tier of TRENDING_ATTRIBUTES.rarityTiers) {
    cumulative += tier.weight;
    if (roll <= cumulative) {
      return { name: tier.name, score: 100 - cumulative + tier.weight, color: tier.color };
    }
  }
  return { name: 'Common', score: 50, color: '#8B9A9A' };
}

function generateTokenId(edition: number): string {
  const timestamp = Date.now().toString(36);
  const editionHex = edition.toString(36).padStart(6, '0');
  return `AIQTP-${timestamp}-${editionHex}`.toUpperCase();
}

export function generateCopyrightNFT(edition: number): GeneratedNFT {
  const seed = edition * 31;
  const theme = getSeededElement(COPYRIGHT_THEMES, seed, 0);
  const rarity = calculateRarity(seed);
  const now = new Date();
  
  const background = getSeededElement(TRENDING_ATTRIBUTES.backgrounds, seed, 1);
  const style = getSeededElement(TRENDING_ATTRIBUTES.styles, seed, 2);
  const effect = getSeededElement(TRENDING_ATTRIBUTES.effects, seed, 3);
  const motion = getSeededElement(TRENDING_ATTRIBUTES.motionTypes, seed, 4);
  const aura = getSeededElement(TRENDING_ATTRIBUTES.auras, seed, 5);
  const pattern = getSeededElement(TRENDING_ATTRIBUTES.patterns, seed, 6);

  const attributes: NFTAttribute[] = [
    { trait_type: 'Type', value: 'Copyright', rarity_score: 100 },
    { trait_type: 'Category', value: theme.category, rarity_score: 85 },
    { trait_type: 'Background', value: background, rarity_score: seededValue(seed, 10) * 50 + 50 },
    { trait_type: 'Style', value: style, rarity_score: seededValue(seed, 11) * 60 + 40 },
    { trait_type: 'Effect', value: effect, rarity_score: seededValue(seed, 12) * 70 + 30 },
    { trait_type: 'Motion', value: motion, rarity_score: motion !== 'Static' ? 75 : 30 },
    { trait_type: 'Aura', value: aura, rarity_score: aura !== 'None' ? 80 : 20 },
    { trait_type: 'Pattern', value: pattern, rarity_score: seededValue(seed, 13) * 55 + 45 },
    { trait_type: 'Edition', value: edition },
    { trait_type: 'Genesis', value: 'AIQTP Platform' },
    { trait_type: 'Rarity Tier', value: rarity.name, rarity_score: rarity.score }
  ];

  const baseValue = {
    'Common': 0.05, 'Uncommon': 0.15, 'Rare': 0.5, 
    'Epic': 1.5, 'Legendary': 5, 'Mythic': 20
  }[rarity.name] || 0.05;

  return {
    id: `copyright-${edition}`,
    tokenId: generateTokenId(edition),
    name: `${theme.prefix} © #${edition.toString().padStart(4, '0')}`,
    description: `Official AIQTP™ AI Quantum Trading Portal Copyright NFT for ${theme.category}. Protected intellectual property registered on the Quantum Time Crystal Chain. Edition ${edition} of 10,000. Features ${style} style with ${effect} effects.`,
    type: 'copyright',
    category: theme.category,
    mintedAt: now.toISOString(),
    mintedDate: now.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }),
    edition,
    maxEdition: 10000,
    attributes,
    rarity: rarity.name,
    rarityScore: rarity.score,
    estimatedValue: baseValue * (1 + seededValue(seed, 20) * 0.5),
    chain: 'QTC',
    status: 'minted',
    owner: 'admin-wallet-0x000',
    imagePrompt: `A ${style} NFT artwork featuring ${background} background, ${effect} visual effects, ${motion} animation, ${aura} surrounding glow, ${pattern} pattern overlay. Professional copyright certificate aesthetic with ${theme.prefix} branding. Ultra high resolution, 8K quality.`
  };
}

export function generateTrademarkNFT(edition: number): GeneratedNFT {
  const seed = edition * 37 + 10000;
  const theme = getSeededElement(TRADEMARK_THEMES, seed, 0);
  const rarity = calculateRarity(seed);
  const now = new Date();
  
  const background = getSeededElement(TRENDING_ATTRIBUTES.backgrounds, seed, 1);
  const style = getSeededElement(TRENDING_ATTRIBUTES.styles, seed, 2);
  const effect = getSeededElement(TRENDING_ATTRIBUTES.effects, seed, 3);
  const motion = getSeededElement(TRENDING_ATTRIBUTES.motionTypes, seed, 4);
  const aura = getSeededElement(TRENDING_ATTRIBUTES.auras, seed, 5);
  const pattern = getSeededElement(TRENDING_ATTRIBUTES.patterns, seed, 6);

  const attributes: NFTAttribute[] = [
    { trait_type: 'Type', value: 'Trademark', rarity_score: 100 },
    { trait_type: 'Category', value: theme.category, rarity_score: 90 },
    { trait_type: 'Brand', value: theme.prefix, rarity_score: 95 },
    { trait_type: 'Background', value: background, rarity_score: seededValue(seed, 10) * 50 + 50 },
    { trait_type: 'Style', value: style, rarity_score: seededValue(seed, 11) * 60 + 40 },
    { trait_type: 'Effect', value: effect, rarity_score: seededValue(seed, 12) * 70 + 30 },
    { trait_type: 'Motion', value: motion, rarity_score: motion !== 'Static' ? 75 : 30 },
    { trait_type: 'Aura', value: aura, rarity_score: aura !== 'None' ? 80 : 20 },
    { trait_type: 'Pattern', value: pattern, rarity_score: seededValue(seed, 13) * 55 + 45 },
    { trait_type: 'Edition', value: edition },
    { trait_type: 'Genesis', value: 'AIQTP Platform' },
    { trait_type: 'Rarity Tier', value: rarity.name, rarity_score: rarity.score },
    { trait_type: 'Legal Status', value: 'Registered™' }
  ];

  const baseValue = {
    'Common': 0.08, 'Uncommon': 0.25, 'Rare': 0.8, 
    'Epic': 2.5, 'Legendary': 8, 'Mythic': 35
  }[rarity.name] || 0.08;

  return {
    id: `trademark-${edition}`,
    tokenId: generateTokenId(edition + 10000),
    name: `${theme.prefix}™ #${edition.toString().padStart(4, '0')}`,
    description: `Official AIQTP™ AI Quantum Trading Portal Trademark NFT for ${theme.category}. Registered brand identity on the Quantum Time Crystal Chain. Edition ${edition} of 10,000. Features ${style} style with ${effect} effects.`,
    type: 'trademark',
    category: theme.category,
    mintedAt: now.toISOString(),
    mintedDate: now.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }),
    edition,
    maxEdition: 10000,
    attributes,
    rarity: rarity.name,
    rarityScore: rarity.score,
    estimatedValue: baseValue * (1 + seededValue(seed, 20) * 0.5),
    chain: 'QTC',
    status: 'minted',
    owner: 'admin-wallet-0x000',
    imagePrompt: `A ${style} NFT artwork featuring ${background} background, ${effect} visual effects, ${motion} animation, ${aura} surrounding glow, ${pattern} pattern overlay. Professional trademark certificate with ${theme.prefix}™ branding. Premium brand identity, luxurious gold accents. Ultra high resolution, 8K quality.`
  };
}

// Generate initial 200 NFT collection (100 copyright + 100 trademark)
export function generateInitialCollection(): { copyrights: GeneratedNFT[], trademarks: GeneratedNFT[] } {
  const copyrights: GeneratedNFT[] = [];
  const trademarks: GeneratedNFT[] = [];

  for (let i = 1; i <= 100; i++) {
    copyrights.push(generateCopyrightNFT(i));
    trademarks.push(generateTrademarkNFT(i));
  }

  return { copyrights, trademarks };
}

// Pre-generate the collection
export const INITIAL_COLLECTION = generateInitialCollection();
