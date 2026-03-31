import * as React from "react";
import { useState, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, Info, Lightbulb, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

interface ExplainerTooltipProps {
  children: React.ReactNode;
  term: string;
  explanation: string;
  category?: string;
  learnMoreUrl?: string;
  delayMs?: number;
  className?: string;
}

const ExplainerTooltip = ({
  children,
  term,
  explanation,
  category,
  learnMoreUrl,
  delayMs = 5000, // 5 seconds default
  className,
}: ExplainerTooltipProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const elementRef = useRef<HTMLSpanElement>(null);

  const showTooltip = useCallback((e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setPosition({
      x: rect.left + rect.width / 2,
      y: rect.bottom + 8,
    });
    
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delayMs);
  }, [delayMs]);

  const hideTooltip = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsVisible(false);
  }, []);

  const closeTooltip = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsVisible(false);
  }, []);

  return (
    <>
      <span
        ref={elementRef}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        className={cn(
          "cursor-help border-b border-dotted border-muted-foreground/50 hover:border-primary transition-colors",
          className
        )}
      >
        {children}
      </span>

      {isVisible && (
        <div
          className="fixed z-[9999] animate-in fade-in-0 zoom-in-95 duration-200"
          style={{
            left: Math.min(position.x, window.innerWidth - 320),
            top: position.y,
            transform: "translateX(-50%)",
          }}
          onMouseEnter={() => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
          }}
          onMouseLeave={hideTooltip}
        >
          <Card className="w-[300px] shadow-xl border-primary/20 bg-popover backdrop-blur-sm">
            <CardHeader className="py-3 px-4 flex-row items-start justify-between space-y-0 border-b">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-primary/10">
                  <Lightbulb className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-sm font-semibold">{term}</CardTitle>
                  {category && (
                    <Badge variant="outline" className="text-[10px] mt-1 px-1.5 py-0">
                      {category}
                    </Badge>
                  )}
                </div>
              </div>
              <button
                onClick={closeTooltip}
                className="p-1 rounded-md hover:bg-muted transition-colors"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </CardHeader>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground leading-relaxed">
                {explanation}
              </p>
              {learnMoreUrl && (
                <a
                  href={learnMoreUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-3"
                >
                  <BookOpen className="h-3 w-3" />
                  Learn more
                </a>
              )}
            </CardContent>
          </Card>
          {/* Arrow pointer */}
          <div 
            className="absolute -top-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-b-8 border-l-transparent border-r-transparent border-b-popover"
          />
        </div>
      )}
    </>
  );
};

// Predefined explanations for common terms
export const EXPLAINER_TERMS: Record<string, { term: string; explanation: string; category?: string }> = {
  // Lightning Network
  "bolt11": {
    term: "BOLT11 Invoice",
    explanation: "A standardized payment request format for the Lightning Network. It encodes payment details like amount, recipient, and expiry time into a string that starts with 'lnbc'. Simply scan or paste to pay instantly.",
    category: "Lightning Network",
  },
  "lightning": {
    term: "Lightning Network",
    explanation: "A Layer 2 payment protocol built on top of Bitcoin enabling instant, low-cost transactions. Perfect for micropayments and high-frequency trading without blockchain confirmation delays.",
    category: "Crypto Infrastructure",
  },
  "channel": {
    term: "Payment Channel",
    explanation: "A two-party payment pathway on Lightning Network. Funds are locked in a multi-sig address, allowing unlimited off-chain transactions between parties until the channel is closed.",
    category: "Lightning Network",
  },

  // Trading Bots & Strategies
  "aiTradingBots": {
    term: "AI Trading Bots",
    explanation: "Rentable automated trading systems powered by AI. Each bot is based on strategies that have graduated our rigorous 10-stage backtesting process, meeting or exceeding minimum performance thresholds including positive Sharpe ratio, controlled drawdown, and consistent profitability.",
    category: "Automation",
  },
  "strategyGraduation": {
    term: "Strategy Graduation",
    explanation: "Our 10-test validation pipeline that strategies must pass before going live. Tests include historical backtesting, walk-forward analysis, Monte Carlo simulation, stress testing, and live validation.",
    category: "Quality Assurance",
  },
  "backtesting": {
    term: "Backtesting",
    explanation: "Testing a trading strategy against historical market data to evaluate its performance. We run strategies through multiple market regimes (bull, bear, sideways) to ensure robustness.",
    category: "Research",
  },
  "sharpeRatio": {
    term: "Sharpe Ratio",
    explanation: "A measure of risk-adjusted returns. Calculated as (Return - Risk-Free Rate) / Standard Deviation. A Sharpe > 1 is good, > 2 is excellent. We require minimum 1.0 for graduation.",
    category: "Risk Metrics",
  },
  "maxDrawdown": {
    term: "Maximum Drawdown",
    explanation: "The largest peak-to-trough decline in portfolio value. Measures worst-case loss. Our strategies target < 20% max drawdown to protect capital during adverse conditions.",
    category: "Risk Metrics",
  },

  // DeFi Terms
  "defi": {
    term: "DeFi (Decentralized Finance)",
    explanation: "Financial services built on blockchain without traditional intermediaries. Includes lending, borrowing, trading, and yield farming through smart contracts. Higher yields but requires understanding of protocol risks.",
    category: "Crypto",
  },
  "dex": {
    term: "DEX (Decentralized Exchange)",
    explanation: "Peer-to-peer trading platforms where you trade directly from your wallet. No KYC, no custody risk, but may have lower liquidity and higher slippage than centralized exchanges.",
    category: "Trading",
  },
  "slippage": {
    term: "Slippage",
    explanation: "The difference between expected and actual execution price. Higher in low-liquidity markets. Set slippage tolerance to protect against unfavorable fills during volatile conditions.",
    category: "Trading",
  },
  "impermanentLoss": {
    term: "Impermanent Loss",
    explanation: "Potential loss when providing liquidity to AMM pools if token prices diverge. Called 'impermanent' because it reverses if prices return to original ratio. Consider this risk when yield farming.",
    category: "DeFi Risk",
  },
  "mev": {
    term: "MEV (Miner Extractable Value)",
    explanation: "Profit extracted by block producers through transaction ordering. Includes front-running and sandwich attacks. Our sniper tools help you avoid MEV exploitation.",
    category: "Advanced",
  },

  // Technical Analysis
  "rsi": {
    term: "RSI (Relative Strength Index)",
    explanation: "Momentum oscillator measuring speed and magnitude of price changes. Scale 0-100. Above 70 suggests overbought, below 30 suggests oversold. Best used with other confirmation signals.",
    category: "Technical Indicators",
  },
  "macd": {
    term: "MACD",
    explanation: "Moving Average Convergence Divergence. Shows relationship between two EMAs. Signal line crossovers and histogram can indicate momentum shifts and potential trend reversals.",
    category: "Technical Indicators",
  },
  "bollingerBands": {
    term: "Bollinger Bands",
    explanation: "Volatility bands placed 2 standard deviations above/below a moving average. Price touching bands may signal overbought/oversold conditions. Band width indicates volatility.",
    category: "Technical Indicators",
  },
  "vwap": {
    term: "VWAP",
    explanation: "Volume Weighted Average Price. The average price weighted by volume throughout the day. Institutional benchmark - trading above VWAP suggests bullish sentiment.",
    category: "Technical Indicators",
  },

  // Quantum & AI
  "quantumComputing": {
    term: "Quantum Computing",
    explanation: "Computing using quantum mechanical phenomena. Our Quantum Lab explores portfolio optimization, option pricing, and pattern recognition that classical computers struggle with.",
    category: "Advanced Tech",
  },
  "mlModels": {
    term: "Machine Learning Models",
    explanation: "AI systems trained on market data to predict price movements, detect patterns, and generate trading signals. Our models use ensemble methods combining multiple algorithms for robustness.",
    category: "AI/ML",
  },
  "sentimentAnalysis": {
    term: "Sentiment Analysis",
    explanation: "NLP-powered analysis of news, social media, and market commentary to gauge market mood. Bullish/bearish scores help anticipate market moves before they happen.",
    category: "AI/ML",
  },

  // Risk Management
  "var": {
    term: "VaR (Value at Risk)",
    explanation: "Statistical measure of potential portfolio loss. '95% VaR of $10K' means there's a 5% chance of losing more than $10K in the given period. Essential for position sizing.",
    category: "Risk Management",
  },
  "positionSizing": {
    term: "Position Sizing",
    explanation: "Determining how much capital to allocate to each trade based on risk tolerance. We use Kelly Criterion and fixed-fractional methods to optimize returns while limiting drawdown.",
    category: "Risk Management",
  },
  "stopLoss": {
    term: "Stop Loss",
    explanation: "Automatic order to exit a position at a specified loss level. Protects capital and removes emotion from exit decisions. Essential for disciplined trading.",
    category: "Order Types",
  },

  // Platform Features
  "copyTrading": {
    term: "Copy Trading",
    explanation: "Automatically mirror trades from successful traders. View their track record, risk metrics, and strategies before following. You control allocation and can stop anytime.",
    category: "Social Trading",
  },
  "strategyMarketplace": {
    term: "Strategy Marketplace",
    explanation: "Rent or purchase proven trading strategies from other users. All listed strategies have passed graduation requirements. Creators earn passive income from rentals.",
    category: "Marketplace",
  },
  "quantScript": {
    term: "QuantScript",
    explanation: "Our custom scripting language for building indicators, strategies, and screeners. Similar to TradingView's Pine Script but with more advanced features for algorithmic trading.",
    category: "Development",
  },
};

// Helper component for common terms
export const Explain = ({ 
  term, 
  children,
  className 
}: { 
  term: keyof typeof EXPLAINER_TERMS; 
  children: React.ReactNode;
  className?: string;
}) => {
  const data = EXPLAINER_TERMS[term];
  if (!data) return <>{children}</>;
  
  return (
    <ExplainerTooltip
      term={data.term}
      explanation={data.explanation}
      category={data.category}
      className={className}
    >
      {children}
    </ExplainerTooltip>
  );
};

export { ExplainerTooltip };
