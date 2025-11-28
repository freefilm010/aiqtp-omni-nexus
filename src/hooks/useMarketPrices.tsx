import { useState, useEffect } from 'react';

export interface MarketPrice {
  symbol: string;
  name: string;
  price: string;
  priceNumeric: number;
  change: string;
  changePercent: number;
  volume: string;
  trend: 'up' | 'down';
  lastUpdate: Date;
}

const INITIAL_PRICES: Record<string, MarketPrice> = {
  'BTC/USD': { symbol: 'BTC/USD', name: 'Bitcoin', price: '67234.89', priceNumeric: 67234.89, change: '+5.23%', changePercent: 5.23, volume: '$2.4B', trend: 'up', lastUpdate: new Date() },
  'ETH/USD': { symbol: 'ETH/USD', name: 'Ethereum', price: '3456.12', priceNumeric: 3456.12, change: '+3.45%', changePercent: 3.45, volume: '$1.2B', trend: 'up', lastUpdate: new Date() },
  'GOLD/USD': { symbol: 'GOLD/USD', name: 'Gold', price: '2123.45', priceNumeric: 2123.45, change: '-0.23%', changePercent: -0.23, volume: '$890M', trend: 'down', lastUpdate: new Date() },
  'AAPL': { symbol: 'AAPL', name: 'Apple Inc', price: '178.34', priceNumeric: 178.34, change: '+1.23%', changePercent: 1.23, volume: '$3.2B', trend: 'up', lastUpdate: new Date() },
  'RE-NYC-01': { symbol: 'RE-NYC-01', name: 'NYC Property Token', price: '245.67', priceNumeric: 245.67, change: '+2.34%', changePercent: 2.34, volume: '$45M', trend: 'up', lastUpdate: new Date() },
  'ART-MON-01': { symbol: 'ART-MON-01', name: 'Monet NFT', price: '1234567', priceNumeric: 1234567, change: '-1.23%', changePercent: -1.23, volume: '$12M', trend: 'down', lastUpdate: new Date() },
  'BTC': { symbol: 'BTC', name: 'Bitcoin', price: '67234.89', priceNumeric: 67234.89, change: '+5.23%', changePercent: 5.23, volume: '$2.4B', trend: 'up', lastUpdate: new Date() },
  'ETH': { symbol: 'ETH', name: 'Ethereum', price: '3456.12', priceNumeric: 3456.12, change: '+3.45%', changePercent: 3.45, volume: '$1.2B', trend: 'up', lastUpdate: new Date() },
  'USDC': { symbol: 'USDC', name: 'USD Coin', price: '1.00', priceNumeric: 1.00, change: '+0.00%', changePercent: 0, volume: '$450M', trend: 'up', lastUpdate: new Date() },
};

// Simulate real-time price updates
const updatePrice = (price: MarketPrice): MarketPrice => {
  const volatility = Math.random() * 0.002 - 0.001; // -0.1% to +0.1%
  const newPriceNumeric = price.priceNumeric * (1 + volatility);
  const changeFromStart = ((newPriceNumeric - price.priceNumeric) / price.priceNumeric) * 100;
  
  return {
    ...price,
    priceNumeric: newPriceNumeric,
    price: newPriceNumeric.toFixed(price.symbol.includes('ART') ? 0 : 2),
    changePercent: price.changePercent + changeFromStart,
    change: `${changeFromStart >= 0 ? '+' : ''}${changeFromStart.toFixed(2)}%`,
    trend: changeFromStart >= 0 ? 'up' : 'down',
    lastUpdate: new Date(),
  };
};

export const useMarketPrices = (updateInterval: number = 3000) => {
  const [prices, setPrices] = useState<Record<string, MarketPrice>>(INITIAL_PRICES);
  const [isLive, setIsLive] = useState(true);

  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      setPrices((currentPrices) => {
        const updated: Record<string, MarketPrice> = {};
        Object.entries(currentPrices).forEach(([symbol, price]) => {
          updated[symbol] = updatePrice(price);
        });
        return updated;
      });
    }, updateInterval);

    return () => clearInterval(interval);
  }, [updateInterval, isLive]);

  const getPrice = (symbol: string): MarketPrice | undefined => {
    return prices[symbol];
  };

  const getAllPrices = (): MarketPrice[] => {
    return Object.values(prices);
  };

  const toggleLive = () => {
    setIsLive(!isLive);
  };

  return {
    prices,
    getPrice,
    getAllPrices,
    isLive,
    toggleLive,
  };
};
