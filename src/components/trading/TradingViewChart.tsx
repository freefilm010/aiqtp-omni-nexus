/**
 * TradingViewChart — Embeds the REAL TradingView Advanced Chart Widget
 * via their official iframe embed. Defers loading until visible to avoid
 * blocking the main thread with 600+ KiB of unused JS on page load.
 */
import { useMemo, useRef, useState, useEffect } from "react";
import { Card } from "@/components/ui/card";

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

const toTVSymbol = (sym: SymbolValue): string =>
  `BINANCE:${sym.replace("/", "")}`;

const toTVInterval = (tf: TimeframeValue): string =>
  ({ "1m": "1", "5m": "5", "15m": "15", "1h": "60", "4h": "240", "1d": "D", "1w": "W" })[tf];

interface TradingViewChartProps {
  height?: number;
  showToolbar?: boolean;
  defaultSymbol?: SymbolValue;
  defaultTimeframe?: TimeframeValue;
  symbol?: SymbolValue;
  timeframe?: TimeframeValue;
  onSymbolChange?: (symbol: SymbolValue) => void;
  onTimeframeChange?: (timeframe: TimeframeValue) => void;
}

const TradingViewChart = ({
  height = 600,
  showToolbar = true,
  defaultSymbol = "BTC/USDT",
  defaultTimeframe = "1h",
  symbol: controlledSymbol,
  timeframe: controlledTimeframe,
}: TradingViewChartProps) => {
  const symbol = controlledSymbol ?? defaultSymbol;
  const timeframe = controlledTimeframe ?? defaultTimeframe;
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  // Only load the heavy TradingView iframe when the card scrolls into view
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const src = useMemo(() => {
    if (!isVisible) return "";
    const tvSymbol = toTVSymbol(symbol as SymbolValue);
    const interval = toTVInterval(timeframe as TimeframeValue);
    const params = new URLSearchParams({
      symbol: tvSymbol,
      interval,
      timezone: "Etc/UTC",
      theme: "dark",
      style: "1",
      locale: "en",
      toolbar_bg: "#0a0e17",
      enable_publishing: "false",
      allow_symbol_change: "true",
      withdateranges: "true",
      hide_side_toolbar: "false",
      hide_top_toolbar: showToolbar ? "false" : "true",
      hide_legend: "false",
      save_image: "true",
      details: "true",
      hotlist: "true",
      calendar: "false",
      studies: "MASimple@tv-basicstudies,MAExp@tv-basicstudies",
      show_popup_button: "true",
      popup_width: "1200",
      popup_height: "800",
    });
    return `https://s.tradingview.com/widgetembed/?${params.toString()}#${JSON.stringify({ "paneProperties.background": "#0a0e17", "paneProperties.backgroundType": "solid" })}`;
  }, [isVisible, symbol, timeframe, showToolbar]);

  return (
    <Card ref={containerRef} className="overflow-hidden border-panel-border bg-[#0a0e17]">
      {isVisible ? (
        <iframe
          src={src}
          style={{ width: "100%", height, border: 0 }}
          allow="autoplay; encrypted-media"
          allowFullScreen
          loading="lazy"
          title="TradingView Chart"
        />
      ) : (
        <div
          style={{ width: "100%", height }}
          className="flex items-center justify-center"
        >
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </Card>
  );
};

export default TradingViewChart;
