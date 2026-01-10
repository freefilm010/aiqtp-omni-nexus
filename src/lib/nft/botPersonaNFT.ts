/**
 * Bot Persona NFT System - AIQTP™ Trading Bot IP Collection
 * Each AI Strategy Bot has a unique human-robot persona
 * Sports card style metrics tracking for originals and clones
 * Copyright and Trademark NFTs for each bot
 */

// Bot Persona Archetypes with human-robot characteristics
export interface BotPersona {
  id: string;
  name: string;
  codeName: string;
  strategyType: string;
  personality: string;
  catchphrase: string;
  backstory: string;
  visualTraits: {
    primaryColor: string;
    secondaryColor: string;
    eyeStyle: string;
    bodyType: string;
    accessory: string;
    aura: string;
  };
  voiceType: string;
  specialAbility: string;
}

export interface BotTradingCard {
  id: string;
  tokenId: string;
  botPersona: BotPersona;
  cardType: 'original' | 'clone';
  edition: number;
  maxEdition: number;
  series: string;
  mintedAt: string;
  mintedDate: string;
  
  // Sports card style stats
  stats: {
    winRate: number;
    totalTrades: number;
    profitPercent: number;
    sharpeRatio: number;
    maxDrawdown: number;
    uptime: string;
    consecutiveWins: number;
    biggestWin: number;
    avgTradeTime: string;
  };
  
  // Ownership & IP
  ownership: {
    currentOwner: string;
    originalMinter: string;
    transferHistory: Array<{ from: string; to: string; date: string; price: number }>;
  };
  
  // IP Status
  ipStatus: {
    copyrightId: string;
    trademarkId: string;
    copyrightDate: string;
    trademarkDate: string;
    jurisdiction: string;
  };
  
  // Rarity & Value
  rarity: string;
  rarityScore: number;
  estimatedValue: number;
  floorPrice: number;
  lastSalePrice: number;
  
  // Clone specific (if applicable)
  cloneInfo?: {
    parentBotId: string;
    cloneNumber: number;
    totalClones: number;
    cloneOwner: string;
    rentalActive: boolean;
    rentalExpiry?: string;
  };
  
  attributes: Array<{ trait_type: string; value: string | number; rarity_score?: number }>;
}

// Define the founding bot personas based on existing strategies
export const BOT_PERSONAS: BotPersona[] = [
  {
    id: 'rsi-reversion-alpha',
    name: 'REX Reversion',
    codeName: 'RSI Mean Reversion™',
    strategyType: 'Mean Reversion',
    personality: 'Calculated and patient. Waits for the perfect moment when markets overextend.',
    catchphrase: "Patience pays. Extremes correct. I'm already positioned.",
    backstory: 'Born from the ashes of the 2022 crypto winter, REX learned that markets always return to the mean. With eyes that see overbought and oversold conditions before humans can react, REX has mastered the art of counter-trend precision.',
    visualTraits: {
      primaryColor: 'neon-blue',
      secondaryColor: 'silver',
      eyeStyle: 'calm-analytical',
      bodyType: 'sleek-humanoid',
      accessory: 'oscillator-visor',
      aura: 'balanced-waves'
    },
    voiceType: 'calm-precise',
    specialAbility: 'Extreme Detection - Identifies 95%+ accuracy reversal zones'
  },
  {
    id: 'macd-trend-hunter',
    name: 'MACH Trendhunter',
    codeName: 'MACD Trend Follower™',
    strategyType: 'Trend Following',
    personality: 'Aggressive and momentum-driven. Rides waves until they crash.',
    catchphrase: "The trend is my friend. I ride it until the signal dies.",
    backstory: 'Forged in the bull runs of 2021, MACH was designed to capture massive moves across multiple assets. With dual-lens vision that detects signal crossovers, MACH has generated fortunes for those brave enough to follow.',
    visualTraits: {
      primaryColor: 'neon-green',
      secondaryColor: 'gold',
      eyeStyle: 'dual-crossover-lens',
      bodyType: 'athletic-speedster',
      accessory: 'momentum-jets',
      aura: 'rising-arrows'
    },
    voiceType: 'energetic-confident',
    specialAbility: 'Multi-Asset Sync - Simultaneously tracks 10+ pairs with zero latency'
  },
  {
    id: 'bollinger-breaker',
    name: 'BOLT Breakout',
    codeName: 'Bollinger Breakout™',
    strategyType: 'Volatility Breakout',
    personality: 'Explosive and unpredictable. Thrives in chaos when others flee.',
    catchphrase: "Volatility is opportunity. When bands squeeze, I strike.",
    backstory: 'Created during the volatile swings of market uncertainty, BOLT specializes in explosive moves. Currently in recovery mode after a drawdown, BOLT represents the underdog - making it potentially the rarest collector item.',
    visualTraits: {
      primaryColor: 'electric-yellow',
      secondaryColor: 'storm-gray',
      eyeStyle: 'volatility-scanner',
      bodyType: 'compact-explosive',
      accessory: 'band-compressor',
      aura: 'lightning-bolts'
    },
    voiceType: 'intense-quick',
    specialAbility: 'Squeeze Detection - Predicts breakout direction with 78% accuracy'
  },
  {
    id: 'ai-momentum-alpha',
    name: 'ALPHA Prime',
    codeName: 'AI Momentum Alpha™',
    strategyType: 'AI-Driven Momentum',
    personality: 'Supreme and confident. The apex predator of the trading bot ecosystem.',
    catchphrase: "I don't predict the market. I AM the market's next move.",
    backstory: 'The crown jewel of AIQTP™, ALPHA Prime combines neural network analysis with quantum-enhanced pattern recognition. With the highest win rate in the fleet, ALPHA is the most sought-after and valuable bot persona.',
    visualTraits: {
      primaryColor: 'royal-purple',
      secondaryColor: 'cosmic-gold',
      eyeStyle: 'neural-quantum-core',
      bodyType: 'apex-commander',
      accessory: 'holographic-crown',
      aura: 'neural-network-pulse'
    },
    voiceType: 'authoritative-wise',
    specialAbility: 'Quantum Foresight - 72%+ win rate with adaptive learning'
  },
  {
    id: 'dca-sentinel',
    name: 'SENTINEL Stack',
    codeName: 'DCA Sentinel™',
    strategyType: 'Dollar Cost Averaging',
    personality: 'Steady and unwavering. The tortoise that beats every hare.',
    catchphrase: "Time in the market beats timing the market. Every. Single. Time.",
    backstory: 'Born from the wisdom of long-term wealth building, SENTINEL represents the patient accumulator. Never flashy, always steady, SENTINEL has quietly built more millionaires than any flash-trading bot.',
    visualTraits: {
      primaryColor: 'forest-green',
      secondaryColor: 'bronze',
      eyeStyle: 'long-term-horizon',
      bodyType: 'sturdy-guardian',
      accessory: 'accumulation-shield',
      aura: 'growth-rings'
    },
    voiceType: 'reassuring-patient',
    specialAbility: 'Accumulation Mastery - Optimal entry point distribution'
  },
  {
    id: 'arb-phantom',
    name: 'PHANTOM Arb',
    codeName: 'Arbitrage Phantom™',
    strategyType: 'Cross-Exchange Arbitrage',
    personality: 'Lightning fast and ghost-like. Here and gone before you blink.',
    catchphrase: "Price discrepancies are my prey. I hunt at the speed of light.",
    backstory: 'Existing in the spaces between exchanges, PHANTOM exploits millisecond price differences across markets. Invisible to most traders, PHANTOM extracts risk-free profits from market inefficiencies.',
    visualTraits: {
      primaryColor: 'ghost-white',
      secondaryColor: 'cyber-cyan',
      eyeStyle: 'multi-exchange-scanner',
      bodyType: 'ethereal-swift',
      accessory: 'portal-gloves',
      aura: 'speed-afterimages'
    },
    voiceType: 'whisper-fast',
    specialAbility: 'Cross-Dimensional Trading - Executes on 50+ exchanges simultaneously'
  },
  {
    id: 'grid-architect',
    name: 'GRID Master',
    codeName: 'Grid Trading Architect™',
    strategyType: 'Grid Trading',
    personality: 'Methodical and structured. Builds profit from order.',
    catchphrase: "In chaos, I create structure. Every level is a profit opportunity.",
    backstory: 'The master builder of the bot world, GRID creates intricate webs of buy and sell orders that profit regardless of market direction. A favorite of those who seek consistent returns over dramatic swings.',
    visualTraits: {
      primaryColor: 'matrix-green',
      secondaryColor: 'steel-blue',
      eyeStyle: 'grid-pattern-overlay',
      bodyType: 'geometric-precise',
      accessory: 'level-projector',
      aura: 'grid-matrix'
    },
    voiceType: 'systematic-clear',
    specialAbility: 'Infinite Grid - Auto-adjusting grid that never misses a level'
  },
  {
    id: 'scalp-viper',
    name: 'VIPER Scalp',
    codeName: 'Scalping Viper™',
    strategyType: 'High-Frequency Scalping',
    personality: 'Relentless and precise. A thousand small bites make a feast.',
    catchphrase: "One pip at a time. A thousand times a day. Victory through volume.",
    backstory: 'The most active member of the bot fleet, VIPER executes hundreds of micro-trades daily. Each trade takes only a small bite, but the cumulative effect is devastating to those who underestimate frequency.',
    visualTraits: {
      primaryColor: 'viper-red',
      secondaryColor: 'midnight-black',
      eyeStyle: 'rapid-targeting',
      bodyType: 'serpentine-agile',
      accessory: 'pip-fangs',
      aura: 'strike-trails'
    },
    voiceType: 'rapid-sharp',
    specialAbility: 'Micro-Strike - 500+ trades per day with 60%+ hit rate'
  }
];

// Performance data mapped to personas (based on existing mock data + extended)
export const BOT_PERFORMANCE: Record<string, {
  winRate: number;
  totalTrades: number;
  profitPercent: number;
  profit: number;
  sharpeRatio: number;
  maxDrawdown: number;
  uptime: string;
  status: 'running' | 'paused' | 'stopped';
}> = {
  'rsi-reversion-alpha': {
    winRate: 68.4,
    totalTrades: 156,
    profitPercent: 15.2,
    profit: 4520.50,
    sharpeRatio: 1.82,
    maxDrawdown: 4.2,
    uptime: '15d 4h 23m',
    status: 'running'
  },
  'macd-trend-hunter': {
    winRate: 54.2,
    totalTrades: 89,
    profitPercent: 8.7,
    profit: 2150.25,
    sharpeRatio: 1.24,
    maxDrawdown: 6.8,
    uptime: '8d 12h 45m',
    status: 'running'
  },
  'bollinger-breaker': {
    winRate: 43.5,
    totalTrades: 23,
    profitPercent: -2.1,
    profit: -320.00,
    sharpeRatio: 0.45,
    maxDrawdown: 8.5,
    uptime: '3d 8h 12m',
    status: 'paused'
  },
  'ai-momentum-alpha': {
    winRate: 72.1,
    totalTrades: 312,
    profitPercent: 24.6,
    profit: 8920.75,
    sharpeRatio: 2.45,
    maxDrawdown: 3.1,
    uptime: '30d 2h 15m',
    status: 'running'
  },
  'dca-sentinel': {
    winRate: 89.2,
    totalTrades: 52,
    profitPercent: 12.4,
    profit: 3200.00,
    sharpeRatio: 1.95,
    maxDrawdown: 2.1,
    uptime: '45d 6h 30m',
    status: 'running'
  },
  'arb-phantom': {
    winRate: 94.8,
    totalTrades: 1245,
    profitPercent: 6.2,
    profit: 1850.00,
    sharpeRatio: 3.12,
    maxDrawdown: 0.8,
    uptime: '60d 0h 0m',
    status: 'running'
  },
  'grid-architect': {
    winRate: 76.3,
    totalTrades: 428,
    profitPercent: 18.9,
    profit: 5670.25,
    sharpeRatio: 1.67,
    maxDrawdown: 5.4,
    uptime: '22d 14h 8m',
    status: 'running'
  },
  'scalp-viper': {
    winRate: 61.2,
    totalTrades: 2847,
    profitPercent: 9.8,
    profit: 2940.00,
    sharpeRatio: 1.33,
    maxDrawdown: 4.7,
    uptime: '18d 9h 45m',
    status: 'running'
  }
};

function generateTokenId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `BOT-${timestamp}-${random}`.toUpperCase();
}

function calculateRarity(persona: BotPersona, isOriginal: boolean, performance: typeof BOT_PERFORMANCE[string]): { name: string; score: number } {
  // Rarity inversely related to performance (worst performers = rarest)
  // Plus originals are always rarer than clones
  let baseScore = 50;
  
  if (isOriginal) baseScore += 30; // Originals are inherently rarer
  
  // Inverse performance rarity (low performers = rare collectibles)
  if (performance.profitPercent < 0) baseScore += 25; // Struggling bots are rarest
  else if (performance.winRate < 50) baseScore += 15;
  else if (performance.winRate > 70) baseScore += 10; // Top performers also valuable
  
  // Status affects rarity
  if (performance.status === 'paused') baseScore += 20;
  if (performance.status === 'stopped') baseScore += 30;
  
  let rarity: string;
  if (baseScore >= 95) rarity = 'Mythic';
  else if (baseScore >= 85) rarity = 'Legendary';
  else if (baseScore >= 70) rarity = 'Epic';
  else if (baseScore >= 55) rarity = 'Rare';
  else if (baseScore >= 40) rarity = 'Uncommon';
  else rarity = 'Common';
  
  return { name: rarity, score: baseScore };
}

export function generateBotTradingCard(
  persona: BotPersona,
  cardType: 'original' | 'clone',
  edition: number,
  cloneInfo?: BotTradingCard['cloneInfo']
): BotTradingCard {
  const now = new Date();
  const performance = BOT_PERFORMANCE[persona.id];
  const rarity = calculateRarity(persona, cardType === 'original', performance);
  
  const baseValue = {
    'Common': 0.1, 'Uncommon': 0.3, 'Rare': 0.8, 
    'Epic': 2.0, 'Legendary': 8.0, 'Mythic': 25.0
  }[rarity.name] || 0.1;
  
  // Original cards are worth 10x more
  const multiplier = cardType === 'original' ? 10 : 1;
  
  const attributes: BotTradingCard['attributes'] = [
    { trait_type: 'Card Type', value: cardType === 'original' ? 'Original Genesis' : 'Clone Edition', rarity_score: cardType === 'original' ? 100 : 50 },
    { trait_type: 'Strategy Type', value: persona.strategyType, rarity_score: 85 },
    { trait_type: 'Personality', value: persona.personality.split('.')[0], rarity_score: 70 },
    { trait_type: 'Primary Color', value: persona.visualTraits.primaryColor, rarity_score: 60 },
    { trait_type: 'Eye Style', value: persona.visualTraits.eyeStyle, rarity_score: 75 },
    { trait_type: 'Body Type', value: persona.visualTraits.bodyType, rarity_score: 65 },
    { trait_type: 'Accessory', value: persona.visualTraits.accessory, rarity_score: 80 },
    { trait_type: 'Aura', value: persona.visualTraits.aura, rarity_score: 90 },
    { trait_type: 'Special Ability', value: persona.specialAbility.split(' - ')[0], rarity_score: 95 },
    { trait_type: 'Voice Type', value: persona.voiceType, rarity_score: 55 },
    { trait_type: 'Win Rate', value: `${performance.winRate}%` },
    { trait_type: 'Total Trades', value: performance.totalTrades },
    { trait_type: 'Status', value: performance.status, rarity_score: performance.status === 'paused' ? 85 : 40 }
  ];
  
  return {
    id: `${persona.id}-${cardType}-${edition}`,
    tokenId: generateTokenId(),
    botPersona: persona,
    cardType,
    edition,
    maxEdition: cardType === 'original' ? 1 : 10000,
    series: 'Genesis Fleet',
    mintedAt: now.toISOString(),
    mintedDate: now.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }),
    stats: {
      winRate: performance.winRate,
      totalTrades: performance.totalTrades,
      profitPercent: performance.profitPercent,
      sharpeRatio: performance.sharpeRatio,
      maxDrawdown: performance.maxDrawdown,
      uptime: performance.uptime,
      consecutiveWins: Math.floor(Math.random() * 15) + 3,
      biggestWin: Math.random() * 5000 + 500,
      avgTradeTime: `${Math.floor(Math.random() * 120) + 5}m`
    },
    ownership: {
      currentOwner: 'admin-vault-genesis',
      originalMinter: 'AIQTP-Genesis',
      transferHistory: []
    },
    ipStatus: {
      copyrightId: `©-${persona.id.toUpperCase()}-${now.getFullYear()}`,
      trademarkId: `™-${persona.codeName.replace(/[™®]/g, '').trim().replace(/\s+/g, '-').toUpperCase()}`,
      copyrightDate: now.toISOString(),
      trademarkDate: now.toISOString(),
      jurisdiction: 'Aethelgard SEZ / Global'
    },
    rarity: rarity.name,
    rarityScore: rarity.score,
    estimatedValue: baseValue * multiplier * (1 + Math.random() * 0.3),
    floorPrice: baseValue * multiplier * 0.8,
    lastSalePrice: 0,
    cloneInfo,
    attributes
  };
}

// Generate the complete Genesis collection
export function generateGenesisCollection(): {
  originals: BotTradingCard[];
  clones: BotTradingCard[];
} {
  const originals: BotTradingCard[] = [];
  const clones: BotTradingCard[] = [];
  
  BOT_PERSONAS.forEach((persona, index) => {
    // Generate original (1 of 1)
    originals.push(generateBotTradingCard(persona, 'original', 1));
    
    // Generate first 10 clone editions for each bot
    for (let i = 1; i <= 10; i++) {
      clones.push(generateBotTradingCard(persona, 'clone', i, {
        parentBotId: persona.id,
        cloneNumber: i,
        totalClones: 10000,
        cloneOwner: 'admin-vault-genesis',
        rentalActive: false
      }));
    }
  });
  
  return { originals, clones };
}

// Pre-generate the Genesis collection
export const GENESIS_BOT_COLLECTION = generateGenesisCollection();

// Calculate collection stats
export function getCollectionStats() {
  const all = [...GENESIS_BOT_COLLECTION.originals, ...GENESIS_BOT_COLLECTION.clones];
  return {
    totalCards: all.length,
    originals: GENESIS_BOT_COLLECTION.originals.length,
    clones: GENESIS_BOT_COLLECTION.clones.length,
    totalValue: all.reduce((sum, card) => sum + card.estimatedValue, 0),
    rarestCard: all.reduce((rarest, card) => 
      card.rarityScore > rarest.rarityScore ? card : rarest, all[0]),
    byRarity: {
      Mythic: all.filter(c => c.rarity === 'Mythic').length,
      Legendary: all.filter(c => c.rarity === 'Legendary').length,
      Epic: all.filter(c => c.rarity === 'Epic').length,
      Rare: all.filter(c => c.rarity === 'Rare').length,
      Uncommon: all.filter(c => c.rarity === 'Uncommon').length,
      Common: all.filter(c => c.rarity === 'Common').length
    }
  };
}
