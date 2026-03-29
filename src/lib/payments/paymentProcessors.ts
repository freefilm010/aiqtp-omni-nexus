// Payment Processors Configuration
// Integrates with Stripe (enabled) and provides interface for additional processors
// Configure API keys through platform secrets for real payment processing

export interface PaymentProcessor {
  name: string;
  id: string;
  isConfigured: boolean;
  supportedCurrencies: string[];
  fees: { percent: number; fixed: number };
}

export const paymentProcessors: PaymentProcessor[] = [
  {
    name: 'Stripe',
    id: 'stripe',
    isConfigured: true,
    supportedCurrencies: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CHF', 'SEK', 'NOK', 'DKK', 'PLN', 'CZK', 'HUF', 'RON', 'BGN', 'HRK', 'BRL', 'MXN', 'SGD', 'HKD', 'NZD', 'THB', 'MYR', 'PHP', 'IDR', 'INR', 'AED', 'SAR', 'ZAR', 'KRW', 'TWD', 'CLP'],
    fees: { percent: 2.9, fixed: 0.30 }
  },
  {
    name: 'PayPal',
    id: 'paypal',
    isConfigured: false,
    supportedCurrencies: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY'],
    fees: { percent: 3.49, fixed: 0.49 }
  },
  {
    name: 'Plaid (Bank/ACH)',
    id: 'plaid',
    isConfigured: false,
    supportedCurrencies: ['USD'],
    fees: { percent: 0.8, fixed: 0 }
  },
  {
    name: 'Onramper',
    id: 'onramper',
    isConfigured: false,
    supportedCurrencies: ['BTC', 'ETH', 'USDT', 'USDC'],
    fees: { percent: 1.5, fixed: 0 }
  },
  {
    name: 'Simplex',
    id: 'simplex',
    isConfigured: false,
    supportedCurrencies: ['BTC', 'ETH', 'USDT', 'XRP', 'LTC'],
    fees: { percent: 3.5, fixed: 0 }
  },
  {
    name: 'MoonPay',
    id: 'moonpay',
    isConfigured: false,
    supportedCurrencies: ['BTC', 'ETH', 'USDT', 'USDC', 'SOL'],
    fees: { percent: 4.5, fixed: 3.99 }
  }
];

export interface MockTransaction {
  id: string;
  processor: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed';
  type: 'payment' | 'payout' | 'refund';
  createdAt: Date;
}

// Process a payment through configured processor
// When Stripe is connected, this will use real Stripe API
export const processPayment = async (
  processor: string,
  amount: number,
  currency: string
): Promise<MockTransaction> => {
  // Simulate network delay for demo
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // In production, this would call the actual payment processor API
  // For Stripe: Use stripe-checkout edge function
  // For others: Integrate respective SDKs
  
  const txnId = `txn_${Date.now()}_${crypto.randomUUID().split('-')[0]}`;
  
  return {
    id: txnId,
    processor,
    amount,
    currency,
    status: 'completed', // Real integration would return actual status
    type: 'payment',
    createdAt: new Date()
  };
};

// Simulate crypto on-ramp
export const processOnRamp = async (
  processor: string,
  fiatAmount: number,
  fiatCurrency: string,
  cryptoCurrency: string
): Promise<{ transaction: MockTransaction; cryptoAmount: number }> => {
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Mock exchange rates
  const rates: Record<string, number> = {
    'BTC': 67500,
    'ETH': 3450,
    'USDT': 1,
    'USDC': 1,
    'SOL': 145
  };
  
  const rate = rates[cryptoCurrency] || 1;
  const processorInfo = paymentProcessors.find(p => p.id === processor);
  const fee = processorInfo ? (fiatAmount * processorInfo.fees.percent / 100) + processorInfo.fees.fixed : 0;
  const netAmount = fiatAmount - fee;
  const cryptoAmount = netAmount / rate;
  
  return {
    transaction: {
      id: `onramp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      processor,
      amount: fiatAmount,
      currency: fiatCurrency,
      status: 'completed',
      type: 'payment',
      createdAt: new Date()
    },
    cryptoAmount
  };
};

// Revenue streams configuration
export interface RevenueStream {
  id: string;
  name: string;
  type: 'subscription' | 'commission' | 'spread' | 'api' | 'premium';
  isEnabled: boolean;
  rate: number; // percentage or fixed amount
  description: string;
}

export const revenueStreams: RevenueStream[] = [
  {
    id: 'premium_subscription',
    name: 'Premium Subscriptions',
    type: 'subscription',
    isEnabled: true,
    rate: 29.99,
    description: 'Monthly premium membership fees'
  },
  {
    id: 'trading_commission',
    name: 'Trading Commission',
    type: 'commission',
    isEnabled: true,
    rate: 0.1,
    description: '0.1% commission on all trades'
  },
  {
    id: 'spread_fees',
    name: 'Spread Fees',
    type: 'spread',
    isEnabled: true,
    rate: 0.05,
    description: 'Built-in spread on crypto trades'
  },
  {
    id: 'api_access',
    name: 'API Access Fees',
    type: 'api',
    isEnabled: true,
    rate: 99.99,
    description: 'Monthly API access for developers'
  },
  {
    id: 'premium_signals',
    name: 'Premium Trading Signals',
    type: 'premium',
    isEnabled: true,
    rate: 49.99,
    description: 'AI-powered premium signal subscription'
  }
];

// Investment allocation for aggressive strategy (30% stable, 70% growth)
export interface InvestmentAllocation {
  asset: string;
  symbol: string;
  type: 'stable' | 'growth';
  targetPercent: number;
  currentPercent: number;
  value: number;
}

export const getDefaultAllocations = (): InvestmentAllocation[] => [
  // Stable assets (30%)
  { asset: 'USDC Yield', symbol: 'USDC', type: 'stable', targetPercent: 15, currentPercent: 0, value: 0 },
  { asset: 'Treasury Bonds ETF', symbol: 'TLT', type: 'stable', targetPercent: 10, currentPercent: 0, value: 0 },
  { asset: 'Stablecoin Lending', symbol: 'DAI', type: 'stable', targetPercent: 5, currentPercent: 0, value: 0 },
  // Growth assets (70%)
  { asset: 'Bitcoin', symbol: 'BTC', type: 'growth', targetPercent: 25, currentPercent: 0, value: 0 },
  { asset: 'Ethereum', symbol: 'ETH', type: 'growth', targetPercent: 20, currentPercent: 0, value: 0 },
  { asset: 'S&P 500 ETF', symbol: 'SPY', type: 'growth', targetPercent: 15, currentPercent: 0, value: 0 },
  { asset: 'AI/Tech Stocks', symbol: 'QQQ', type: 'growth', targetPercent: 10, currentPercent: 0, value: 0 }
];
