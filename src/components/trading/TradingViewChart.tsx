/**
 * TradingViewChart — Embeds the REAL TradingView Advanced Chart Widget
 * via their official iframe embed. Works reliably in all environments.
 */
import { useMemo } from "react";
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

  const src = useMemo(() => {
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
  }, [symbol, timeframe, showToolbar]);

  return (
    <Card className="overflow-hidden border-panel-border bg-[#0a0e17]">
      <iframe
        src={src}
        style={{ width: "100%", height, border: 0 }}
        allow="autoplay; encrypted-media"
        allowFullScreen
        loading="lazy"
        title="TradingView Chart"
      />
    </Card>
  );
};

export default TradingViewChart;
