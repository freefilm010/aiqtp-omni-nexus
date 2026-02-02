import { useLocation } from "react-router-dom";
import EconomicCalendar from "@/components/trading/EconomicCalendar";
import HeatMap from "@/components/trading/HeatMap";
import Watchlist from "@/components/trading/Watchlist";
import TokenCreator from "@/components/token/TokenCreator";
import NFTCreator from "@/components/nft/NFTCreator";
import AdvancedCharts from "@/components/trading/AdvancedCharts";
import UnifiedOrderBook from "@/components/exchange/UnifiedOrderBook";
import AdvancedOrderEntry from "@/components/trading/AdvancedOrderEntry";
import PositionsOrders from "@/components/trading/PositionsOrders";
import FloatingWindow from "@/components/floating/FloatingWindow";
import { useFloatingWindows } from "@/contexts/FloatingWindowsContext";

const FloatingWindowsLayer = () => {
  const location = useLocation();
  const { windows, closeWindow, bringToFront, updateWindow } = useFloatingWindows();

  // Don’t overlay windows on the auth screen.
  if (location.pathname === "/auth") return null;
  if (windows.length === 0) return null;

  const renderContent = (key: string) => {
    switch (key) {
      case "economic_calendar":
        return (
          <div className="p-3">
            <EconomicCalendar />
          </div>
        );
      case "heat_map":
        return (
          <div className="p-3">
            <HeatMap />
          </div>
        );
      case "watchlist":
        return (
          <div className="p-3">
            <Watchlist />
          </div>
        );
      case "token_creator":
        return (
          <div className="p-3">
            <TokenCreator />
          </div>
        );
      case "nft_creator":
        return (
          <div className="p-3">
            <NFTCreator />
          </div>
        );
      case "advanced_charts":
        return (
          <div className="p-3">
            <AdvancedCharts />
          </div>
        );
      case "unified_order_book":
        return (
          <div className="p-3">
            <UnifiedOrderBook />
          </div>
        );
      case "order_entry":
        return (
          <div className="p-3">
            <AdvancedOrderEntry />
          </div>
        );
      case "positions_orders":
        return (
          <div className="p-3">
            <PositionsOrders />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-[60]">
      {windows.map((w) => (
        <FloatingWindow
          key={w.id}
          id={w.id}
          title={w.title}
          x={w.x}
          y={w.y}
          width={w.width}
          height={w.height}
          minimized={w.minimized}
          zIndex={w.zIndex}
          onClose={() => closeWindow(w.id)}
          onFocus={() => bringToFront(w.id)}
          onUpdate={(patch) => updateWindow(w.id, patch)}
        >
          {renderContent(w.key)}
        </FloatingWindow>
      ))}
    </div>
  );
};

export default FloatingWindowsLayer;
