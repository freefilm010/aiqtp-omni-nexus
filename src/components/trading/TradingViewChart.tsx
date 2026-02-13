/**
 * TradingViewChart — Embeds the REAL TradingView Advanced Chart Widget.
 * Full TradingView experience: 100+ indicators, drawing tools, studies,
 * multi-timeframe, alerts — exactly what you see on tradingview.com.
 */
import { useEffect, useRef, useState, useCallback } from "react";
import { Card } from "@/components/ui/card";

/* ═══════════════════ CONFIG ═══════════════════ */

type SymbolValue =
  | "BTC/USDT"
  | "ETH/USDT"
  | "SOL/USDT"
  | "BNB/USDT"
  | "XRP/USDT"
  | "ADA/USDT"
  | "DOGE/USDT"
  | "AVAX/USDT";

type TimeframeValue = "1m" | "5m" | "15m" | "1h" | "4h" | "1d" | "1w";

/** Map our symbol format to TradingView format */
const toTVSymbol = (sym: SymbolValue): string => {
  const base = sym.replace("/", "");
  return `BINANCE:${base}`;
};

/** Map our timeframe to TradingView interval */
const toTVInterval = (tf: TimeframeValue): string => {
  const map: Record<TimeframeValue, string> = {
    "1m": "1",
    "5m": "5",
    "15m": "15",
    "1h": "60",
    "4h": "240",
    "1d": "D",
    "1w": "W",
  };
  return map[tf];
};

interface TradingViewChartProps {
  height?: number;
  showToolbar?: boolean;
  pollMs?: number;
  defaultSymbol?: SymbolValue;
  defaultTimeframe?: TimeframeValue;
  symbol?: SymbolValue;
  timeframe?: TimeframeValue;
  onSymbolChange?: (symbol: SymbolValue) => void;
  onTimeframeChange?: (timeframe: TimeframeValue) => void;
}

/* ═══════════════════ COMPONENT ═══════════════════ */

const TradingViewChart = ({
  height = 600,
  showToolbar = true,
  defaultSymbol = "BTC/USDT",
  defaultTimeframe = "1h",
  symbol: controlledSymbol,
  timeframe: controlledTimeframe,
}: TradingViewChartProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<any>(null);
  const scriptLoadedRef = useRef(false);

  const symbol = controlledSymbol ?? defaultSymbol;
  const timeframe = controlledTimeframe ?? defaultTimeframe;

  const [isLoading, setIsLoading] = useState(true);

  const containerId = useRef(
    `tradingview_${Math.random().toString(36).substring(2, 9)}`
  ).current;

  const createWidget = useCallback(() => {
    if (!containerRef.current) return;
    if (!(window as any).TradingView) return;

    // Clear previous widget
    const el = document.getElementById(containerId);
    if (el) el.innerHTML = "";

    try {
      widgetRef.current = new (window as any).TradingView.widget({
        container_id: containerId,
        autosize: true,
        symbol: toTVSymbol(symbol as SymbolValue),
        interval: toTVInterval(timeframe as TimeframeValue),
        timezone: "Etc/UTC",
        theme: "dark",
        style: "1", // Candlestick
        locale: "en",
        toolbar_bg: "#0a0e17",
        enable_publishing: false,
        allow_symbol_change: true,
        withdateranges: true,
        hide_side_toolbar: false,
        hide_top_toolbar: !showToolbar,
        hide_legend: false,
        save_image: true,
        details: true,
        hotlist: true,
        calendar: false,
        studies: [
          "MASimple@tv-basicstudies",
          "MAExp@tv-basicstudies",
        ],
        show_popup_button: true,
        popup_width: "1200",
        popup_height: "800",
        support_host: "https://www.tradingview.com",
        overrides: {
          // Dark pro background
          "paneProperties.background": "#0a0e17",
          "paneProperties.backgroundType": "solid",
          "paneProperties.vertGridProperties.color": "rgba(42, 46, 57, 0.3)",
          "paneProperties.horzGridProperties.color": "rgba(42, 46, 57, 0.3)",
          // Candle colors (TradingView standard)
          "mainSeriesProperties.candleStyle.upColor": "#089981",
          "mainSeriesProperties.candleStyle.downColor": "#f23645",
          "mainSeriesProperties.candleStyle.borderUpColor": "#089981",
          "mainSeriesProperties.candleStyle.borderDownColor": "#f23645",
          "mainSeriesProperties.candleStyle.wickUpColor": "#089981",
          "mainSeriesProperties.candleStyle.wickDownColor": "#f23645",
          // Scale
          "scalesProperties.textColor": "#787b86",
          "scalesProperties.lineColor": "rgba(42, 46, 57, 0.5)",
        },
        loading_screen: {
          backgroundColor: "#0a0e17",
          foregroundColor: "#2962ff",
        },
      });

      setIsLoading(false);
    } catch (err) {
      console.error("TradingView widget error:", err);
    }
  }, [symbol, timeframe, containerId, showToolbar]);

  // Load TradingView library script once
  useEffect(() => {
    if (scriptLoadedRef.current) {
      createWidget();
      return;
    }

    // Check if script already exists
    const existing = document.querySelector(
      'script[src="https://s3.tradingview.com/tv.js"]'
    );
    if (existing) {
      scriptLoadedRef.current = true;
      // Wait for it to be ready
      const check = setInterval(() => {
        if ((window as any).TradingView) {
          clearInterval(check);
          createWidget();
        }
      }, 100);
      return () => clearInterval(check);
    }

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/tv.js";
    script.async = true;
    script.onload = () => {
      scriptLoadedRef.current = true;
      createWidget();
    };
    document.head.appendChild(script);

    return () => {
      // Don't remove the script on unmount — it's cached globally
    };
  }, [createWidget]);

  // Recreate widget when symbol/timeframe changes
  useEffect(() => {
    if (scriptLoadedRef.current && (window as any).TradingView) {
      createWidget();
    }
  }, [symbol, timeframe, createWidget]);

  return (
    <Card className="overflow-hidden border-panel-border bg-[#0a0e17]">
      <div className="relative" style={{ height }}>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#0a0e17] z-10">
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-mono text-muted-foreground">
                Loading TradingView...
              </span>
            </div>
          </div>
        )}
        <div
          id={containerId}
          ref={containerRef}
          className="w-full h-full"
        />
      </div>
    </Card>
  );
};

export default TradingViewChart;
