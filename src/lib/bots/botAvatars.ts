// Bot avatar mapping — 16 characters assigned to bot types, data categories, and lifecycle stages

export const BOT_AVATARS = {
  // ── By bot_type (strategy_registry / DataBotBuilder) ──────────────────────
  price_tracker:       '/bots/datacollector-yellow.png',
  api_aggregator:      '/bots/elite-gold.png',
  blockchain_indexer:  '/bots/execution-blue.png',
  sentiment_analyzer:  '/bots/sentiment-purple.png',
  social_listener:     '/bots/social-red-lg.png',
  scraper:             '/bots/analyst-orange.png',
  arbitrage:           '/bots/arb-purple.png',
  momentum:            '/bots/momentum-green.png',
  screener:            '/bots/screener-green-sm.png',
  researcher:          '/bots/researcher-yellow.png',
  quant:               '/bots/quant-white-reader.png',
  alert:               '/bots/alert-pink-sm.png',
  notification:        '/bots/alert-pink-lg.png',
  social_trader:       '/bots/social-red-sm.png',
  execution:           '/bots/execution-blue.png',
  default:             '/bots/quant-white-tech.png',

  // ── By lifecycle stage (ai_strategies graduation) ─────────────────────────
  lifecycle: {
    Generated:      '/bots/momentum-green.png',
    Testing:        '/bots/researcher-yellow.png',
    Qualified:      '/bots/quant-white-reader.png',
    Listed:         '/bots/elite-gold.png',
    'Client Visible': '/bots/elite-gold.png',
  },

  // ── Special characters ─────────────────────────────────────────────────────
  qaqi:    '/bots/qaqi-brain.png',   // QAQI AI brain / platform mascot
  premium: '/bots/elite-gold.png',   // Graduated elite bots
} as const;

/** Returns the avatar URL for a given bot_type string. Falls back to default. */
export function getBotAvatar(botType?: string | null, lifecycle?: string | null): string {
  if (lifecycle && lifecycle in BOT_AVATARS.lifecycle) {
    return BOT_AVATARS.lifecycle[lifecycle as keyof typeof BOT_AVATARS.lifecycle];
  }
  if (botType && botType in BOT_AVATARS) {
    return BOT_AVATARS[botType as keyof Omit<typeof BOT_AVATARS, 'lifecycle'>] as string;
  }
  return BOT_AVATARS.default;
}
