import { useState, useCallback, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  LayoutGrid,
  Plus,
  Save,
  FolderOpen,
  Trash2,
  Maximize2,
  Minimize2,
  X,
  Settings,
  Monitor,
  BarChart3,
  Activity,
  Wallet,
  TrendingUp,
  Bell,
  Globe,
  Newspaper,
  BookOpen,
  Zap,
  Layers,
  Grid3X3,
  Square,
  Columns,
  Rows,
  ExternalLink,
  MonitorPlay,
  Tv,
  PanelTop,
  Copy
} from "lucide-react";
import { toast } from "sonner";

// Track popup windows for multi-monitor support
interface PopupWindow {
  id: string;
  widgetType: string;
  symbol?: string;
  windowRef: Window | null;
}

// State to track detached windows
const popupWindows = new Map<string, Window>();

// Widget types available for the workspace
const WIDGET_TYPES = [
  { id: 'chart', name: 'Price Chart', icon: BarChart3, description: 'Candlestick/line charts with indicators' },
  { id: 'orderbook', name: 'Order Book', icon: Layers, description: 'Level II depth data' },
  { id: 'positions', name: 'Positions', icon: Wallet, description: 'Open positions & P&L' },
  { id: 'watchlist', name: 'Watchlist', icon: TrendingUp, description: 'Custom asset watchlists' },
  { id: 'alerts', name: 'Alerts Feed', icon: Bell, description: 'Real-time market alerts' },
  { id: 'heatmap', name: 'Heat Map', icon: Grid3X3, description: 'Market sector heatmap' },
  { id: 'news', name: 'News Feed', icon: Newspaper, description: 'Breaking market news' },
  { id: 'calendar', name: 'Economic Calendar', icon: Globe, description: 'Economic events' },
  { id: 'options', name: 'Options Flow', icon: Activity, description: 'Unusual options activity' },
  { id: 'scanner', name: 'Market Scanner', icon: Zap, description: 'Real-time screener' },
  { id: 'fundamentals', name: 'Fundamentals', icon: BookOpen, description: 'Financial metrics' },
  { id: 'terminal', name: 'Script Console', icon: Monitor, description: 'Custom script execution' },
];

// Preset layouts
const LAYOUT_PRESETS = [
  { id: 'single', name: 'Single', icon: Square, grid: { cols: 1, rows: 1 } },
  { id: '2x1', name: '2 Column', icon: Columns, grid: { cols: 2, rows: 1 } },
  { id: '1x2', name: '2 Row', icon: Rows, grid: { cols: 1, rows: 2 } },
  { id: '2x2', name: '2×2 Grid', icon: Grid3X3, grid: { cols: 2, rows: 2 } },
  { id: '3x2', name: '3×2 Grid', icon: LayoutGrid, grid: { cols: 3, rows: 2 } },
  { id: '3x3', name: '3×3 Grid', icon: LayoutGrid, grid: { cols: 3, rows: 3 } },
  { id: '4x3', name: '4×3 Grid', icon: LayoutGrid, grid: { cols: 4, rows: 3 } },
  { id: '4x4', name: '4×4 Grid', icon: LayoutGrid, grid: { cols: 4, rows: 4 } },
];

// Helper to generate HTML content for popup windows
function getWidgetHtmlContent(widget: WorkspaceWidget): string {
  const symbol = widget.symbol || 'BTC';
  const basePrice = symbol === 'BTC' ? 67500 : symbol === 'ETH' ? 3400 : symbol === 'SOL' ? 142 : 450;
  
  switch (widget.type) {
    case 'chart':
      return `
        <div class="price-display">
          <div class="price-value">$${basePrice.toLocaleString()}</div>
          <div class="price-change">+2.34% ($${(basePrice * 0.0234).toFixed(2)})</div>
        </div>
        <div class="chart-container">
          ${Array.from({ length: 50 }, () => 
            `<div class="chart-bar" style="height: ${20 + Math.random() * 60}%"></div>`
          ).join('')}
        </div>
      `;
    case 'orderbook':
      return `
        <div class="data-grid" style="grid-template-columns: 1fr 1fr;">
          <div>
            <div style="text-align:center;font-weight:bold;color:#22c55e;margin-bottom:8px;">BIDS</div>
            ${[67500, 67495, 67490, 67485, 67480, 67475, 67470].map(p => 
              `<div class="data-item bid"><span class="data-label">${(Math.random() * 5).toFixed(3)}</span><span class="data-value bid">$${p.toLocaleString()}</span></div>`
            ).join('')}
          </div>
          <div>
            <div style="text-align:center;font-weight:bold;color:#ef4444;margin-bottom:8px;">ASKS</div>
            ${[67510, 67515, 67520, 67525, 67530, 67535, 67540].map(p => 
              `<div class="data-item ask"><span class="data-label">${(Math.random() * 5).toFixed(3)}</span><span class="data-value ask">$${p.toLocaleString()}</span></div>`
            ).join('')}
          </div>
        </div>
      `;
    case 'positions':
      return `
        <div style="space-y:8px;">
          <div class="data-item" style="display:flex;justify-content:space-between;margin-bottom:8px;">
            <span>BTC Long</span><span class="bid">+1.2% (+$847)</span>
          </div>
          <div class="data-item" style="display:flex;justify-content:space-between;margin-bottom:8px;">
            <span>ETH Short</span><span class="ask">-0.4% (-$136)</span>
          </div>
          <div class="data-item" style="display:flex;justify-content:space-between;margin-bottom:8px;">
            <span>SOL Long</span><span class="bid">+5.1% (+$728)</span>
          </div>
          <div style="margin-top:20px;padding:12px;background:rgba(34,197,94,0.1);border-radius:8px;">
            <div class="data-label">Total P&L</div>
            <div class="data-value bid" style="font-size:24px;">+$1,439.00</div>
          </div>
        </div>
      `;
    case 'alerts':
      return `
        <div style="space-y:8px;">
          <div style="padding:12px;background:rgba(251,191,36,0.2);border-radius:8px;margin-bottom:8px;">
            <div style="font-weight:600;">⚠️ BTC RSI > 70</div>
            <div class="data-label">Overbought territory - consider taking profits</div>
          </div>
          <div style="padding:12px;background:rgba(59,130,246,0.2);border-radius:8px;margin-bottom:8px;">
            <div style="font-weight:600;">📊 ETH Volume Spike</div>
            <div class="data-label">3x average volume detected</div>
          </div>
          <div style="padding:12px;background:rgba(139,92,246,0.2);border-radius:8px;margin-bottom:8px;">
            <div style="font-weight:600;">📅 Fed Speech 2:00 PM</div>
            <div class="data-label">High impact event - volatility expected</div>
          </div>
        </div>
      `;
    default:
      return `<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#71717a;">Widget content loading...</div>`;
  }
}

interface WorkspaceWidget {
  id: string;
  type: string;
  symbol?: string;
  config?: Record<string, unknown>;
}

interface SavedWorkspace {
  id: string;
  name: string;
  layout: { cols: number; rows: number };
  widgets: WorkspaceWidget[];
  createdAt: Date;
}

// Mini widget renderers (simplified views)
const MiniChart = ({ symbol = 'BTC' }: { symbol?: string }) => (
  <div className="h-full flex flex-col">
    <div className="flex items-center justify-between p-2 border-b">
      <span className="font-semibold text-sm">{symbol}/USD</span>
      <Badge variant="outline" className="text-green-500 text-xs">+2.4%</Badge>
    </div>
    <div className="flex-1 p-2 flex items-end justify-around gap-0.5">
      {Array.from({ length: 30 }, (_, i) => (
        <div
          key={i}
          className="bg-primary/60 rounded-sm"
          style={{ width: '3%', height: `${20 + Math.random() * 60}%` }}
        />
      ))}
    </div>
  </div>
);

const MiniOrderBook = () => (
  <div className="h-full flex flex-col text-xs">
    <div className="p-2 border-b font-semibold">Order Book</div>
    <div className="flex-1 grid grid-cols-2 gap-1 p-2">
      <div className="space-y-0.5">
        {[67500, 67495, 67490, 67485, 67480].map((p, i) => (
          <div key={i} className="flex justify-between text-green-500">
            <span>{p}</span>
            <span>{(Math.random() * 5).toFixed(2)}</span>
          </div>
        ))}
      </div>
      <div className="space-y-0.5">
        {[67510, 67515, 67520, 67525, 67530].map((p, i) => (
          <div key={i} className="flex justify-between text-red-500">
            <span>{p}</span>
            <span>{(Math.random() * 5).toFixed(2)}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const MiniPositions = () => (
  <div className="h-full flex flex-col text-xs">
    <div className="p-2 border-b font-semibold">Open Positions</div>
    <div className="flex-1 p-2 space-y-1">
      {['BTC Long +1.2%', 'ETH Short -0.4%', 'SOL Long +5.1%'].map((pos, i) => (
        <div key={i} className="flex justify-between p-1 rounded bg-muted/50">
          <span>{pos.split(' ')[0]}</span>
          <span className={pos.includes('+') ? 'text-green-500' : 'text-red-500'}>
            {pos.split(' ').slice(1).join(' ')}
          </span>
        </div>
      ))}
    </div>
  </div>
);

const MiniWatchlist = () => (
  <div className="h-full flex flex-col text-xs">
    <div className="p-2 border-b font-semibold">Watchlist</div>
    <div className="flex-1 p-2 space-y-1">
      {[
        { s: 'BTC', p: '$67,521', c: '+2.1%' },
        { s: 'ETH', p: '$3,412', c: '+1.8%' },
        { s: 'SOL', p: '$142.50', c: '+4.2%' },
        { s: 'NVDA', p: '$875.32', c: '-0.5%' },
      ].map((item, i) => (
        <div key={i} className="flex justify-between p-1 rounded hover:bg-muted/50">
          <span className="font-medium">{item.s}</span>
          <span>{item.p}</span>
          <span className={item.c.startsWith('+') ? 'text-green-500' : 'text-red-500'}>{item.c}</span>
        </div>
      ))}
    </div>
  </div>
);

const MiniAlerts = () => (
  <div className="h-full flex flex-col text-xs">
    <div className="p-2 border-b font-semibold flex items-center gap-2">
      <Bell className="h-3 w-3" /> Alerts
    </div>
    <div className="flex-1 p-2 space-y-1 overflow-auto">
      {[
        { t: 'BTC RSI > 70', s: 'warn' },
        { t: 'ETH Vol spike', s: 'info' },
        { t: 'Fed speech 2PM', s: 'info' },
      ].map((a, i) => (
        <div key={i} className={`p-1 rounded text-xs ${a.s === 'warn' ? 'bg-amber-500/20' : 'bg-blue-500/20'}`}>
          {a.t}
        </div>
      ))}
    </div>
  </div>
);

const MiniHeatmap = () => (
  <div className="h-full flex flex-col">
    <div className="p-2 border-b font-semibold text-xs">Sector Heatmap</div>
    <div className="flex-1 p-1 grid grid-cols-4 gap-0.5">
      {['Tech', 'Fin', 'Health', 'Energy', 'Cons', 'Ind', 'Mat', 'Util'].map((s, i) => (
        <div
          key={s}
          className={`rounded flex items-center justify-center text-[10px] font-bold ${
            i % 3 === 0 ? 'bg-green-500/80' : i % 3 === 1 ? 'bg-red-500/60' : 'bg-green-500/40'
          }`}
        >
          {s}
        </div>
      ))}
    </div>
  </div>
);

const MiniNews = () => (
  <div className="h-full flex flex-col text-xs">
    <div className="p-2 border-b font-semibold">Breaking News</div>
    <div className="flex-1 p-2 space-y-2 overflow-auto">
      {['Fed holds rates steady', 'BTC ETF inflows surge', 'Tech earnings beat'].map((n, i) => (
        <div key={i} className="p-1 border-b border-dashed">{n}</div>
      ))}
    </div>
  </div>
);

const MiniCalendar = () => (
  <div className="h-full flex flex-col text-xs">
    <div className="p-2 border-b font-semibold">Economic Calendar</div>
    <div className="flex-1 p-2 space-y-1">
      {[
        { t: '10:00', e: 'CPI Release', i: 'High' },
        { t: '14:00', e: 'FOMC Minutes', i: 'High' },
        { t: '16:30', e: 'Oil Inventories', i: 'Med' },
      ].map((ev, i) => (
        <div key={i} className="flex justify-between p-1 rounded bg-muted/30">
          <span className="text-muted-foreground">{ev.t}</span>
          <span>{ev.e}</span>
          <Badge variant="outline" className="text-[10px]">{ev.i}</Badge>
        </div>
      ))}
    </div>
  </div>
);

const MiniOptions = () => (
  <div className="h-full flex flex-col text-xs">
    <div className="p-2 border-b font-semibold">Options Flow</div>
    <div className="flex-1 p-2 space-y-1">
      {[
        { s: 'SPY', t: 'Call', v: '$2.5M', sent: 'bull' },
        { s: 'TSLA', t: 'Put', v: '$1.2M', sent: 'bear' },
      ].map((o, i) => (
        <div key={i} className={`p-1 rounded ${o.sent === 'bull' ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
          <div className="flex justify-between">
            <span className="font-medium">{o.s}</span>
            <span>{o.t}</span>
            <span>{o.v}</span>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const MiniScanner = () => (
  <div className="h-full flex flex-col text-xs">
    <div className="p-2 border-b font-semibold">Scanner Hits</div>
    <div className="flex-1 p-2 space-y-1">
      {['AAPL: Golden Cross', 'MSFT: Vol Breakout', 'GOOG: RSI Oversold'].map((h, i) => (
        <div key={i} className="p-1 rounded bg-primary/10 text-primary">{h}</div>
      ))}
    </div>
  </div>
);

const MiniFundamentals = () => (
  <div className="h-full flex flex-col text-xs">
    <div className="p-2 border-b font-semibold">Fundamentals</div>
    <div className="flex-1 p-2 grid grid-cols-2 gap-1">
      {[
        { k: 'P/E', v: '28.5' },
        { k: 'EPS', v: '$4.21' },
        { k: 'Rev', v: '$95B' },
        { k: 'Margin', v: '24%' },
      ].map((m, i) => (
        <div key={i} className="p-1 rounded bg-muted/30 text-center">
          <div className="text-muted-foreground">{m.k}</div>
          <div className="font-bold">{m.v}</div>
        </div>
      ))}
    </div>
  </div>
);

const MiniTerminal = () => (
  <div className="h-full flex flex-col text-xs font-mono">
    <div className="p-2 border-b font-semibold font-sans">Script Console</div>
    <div className="flex-1 p-2 bg-black/50 text-green-400 overflow-auto">
      <div>&gt; strategy.loaded = true</div>
      <div>&gt; signal: BUY @ 67500</div>
      <div>&gt; risk: 2% portfolio</div>
      <div className="animate-pulse">&gt; _</div>
    </div>
  </div>
);

const WIDGET_RENDERERS: Record<string, React.ComponentType<{ symbol?: string }>> = {
  chart: MiniChart,
  orderbook: MiniOrderBook,
  positions: MiniPositions,
  watchlist: MiniWatchlist,
  alerts: MiniAlerts,
  heatmap: MiniHeatmap,
  news: MiniNews,
  calendar: MiniCalendar,
  options: MiniOptions,
  scanner: MiniScanner,
  fundamentals: MiniFundamentals,
  terminal: MiniTerminal,
};

const WorkspaceManager = () => {
  const [layout, setLayout] = useState({ cols: 2, rows: 2 });
  const [widgets, setWidgets] = useState<WorkspaceWidget[]>([
    { id: '1', type: 'chart', symbol: 'BTC' },
    { id: '2', type: 'orderbook' },
    { id: '3', type: 'positions' },
    { id: '4', type: 'alerts' },
  ]);
  const [savedWorkspaces, setSavedWorkspaces] = useState<SavedWorkspace[]>([
    { id: 'default', name: 'Day Trading Setup', layout: { cols: 3, rows: 2 }, widgets: [], createdAt: new Date() },
    { id: 'scalp', name: 'Scalping Mode', layout: { cols: 2, rows: 2 }, widgets: [], createdAt: new Date() },
  ]);
  const [workspaceName, setWorkspaceName] = useState('My Workspace');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedCell, setSelectedCell] = useState<number | null>(null);
  const [detachedWidgets, setDetachedWidgets] = useState<Set<string>>(new Set());
  const [multiMonitorMode, setMultiMonitorMode] = useState(false);

  const totalCells = layout.cols * layout.rows;

  // Cleanup popup windows on unmount
  useEffect(() => {
    return () => {
      popupWindows.forEach((win) => {
        if (win && !win.closed) win.close();
      });
      popupWindows.clear();
    };
  }, []);

  // Pop out widget to separate window (multi-monitor support)
  const popOutWidget = useCallback((widget: WorkspaceWidget, index: number) => {
    const widgetInfo = WIDGET_TYPES.find((w) => w.id === widget.type);
    const windowId = `widget_${widget.id}_${Date.now()}`;
    
    // Calculate window size and position for multi-monitor
    const width = 800;
    const height = 600;
    const left = (window.screen.width - width) / 2 + (index * 50);
    const top = (window.screen.height - height) / 2 + (index * 50);
    
    const popup = window.open(
      '',
      windowId,
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=no,toolbar=no,menubar=no,location=no,status=no`
    );
    
    if (popup) {
      popupWindows.set(widget.id, popup);
      setDetachedWidgets(prev => new Set(prev).add(widget.id));
      
      // Build popup HTML with same styling
      const popupContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>${widgetInfo?.name || 'Widget'} - ${widget.symbol || 'AIQTP'}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: system-ui, -apple-system, sans-serif;
              background: #0a0a0f;
              color: #e4e4e7;
              height: 100vh;
              overflow: hidden;
            }
            .widget-container {
              height: 100vh;
              display: flex;
              flex-direction: column;
            }
            .widget-header {
              padding: 12px 16px;
              background: linear-gradient(180deg, rgba(139, 92, 246, 0.1), transparent);
              border-bottom: 1px solid rgba(139, 92, 246, 0.3);
              display: flex;
              align-items: center;
              justify-content: space-between;
            }
            .widget-title {
              font-weight: 600;
              display: flex;
              align-items: center;
              gap: 8px;
            }
            .widget-badge {
              background: rgba(34, 197, 94, 0.2);
              color: #22c55e;
              padding: 2px 8px;
              border-radius: 4px;
              font-size: 11px;
            }
            .widget-content {
              flex: 1;
              padding: 16px;
              overflow: auto;
            }
            .chart-container {
              height: 100%;
              display: flex;
              align-items: flex-end;
              justify-content: space-around;
              gap: 2px;
              padding-bottom: 20px;
            }
            .chart-bar {
              background: linear-gradient(180deg, #8b5cf6, #6366f1);
              border-radius: 2px 2px 0 0;
              min-width: 8px;
              transition: height 0.3s ease;
            }
            .price-display {
              position: absolute;
              top: 60px;
              right: 20px;
              text-align: right;
            }
            .price-value {
              font-size: 28px;
              font-weight: bold;
              color: #22c55e;
            }
            .price-change {
              font-size: 14px;
              color: #22c55e;
            }
            .data-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 8px;
            }
            .data-item {
              padding: 8px 12px;
              background: rgba(255,255,255,0.05);
              border-radius: 4px;
            }
            .data-label { font-size: 11px; color: #71717a; }
            .data-value { font-size: 14px; font-weight: 600; }
            .bid { color: #22c55e; }
            .ask { color: #ef4444; }
          </style>
        </head>
        <body>
          <div class="widget-container">
            <div class="widget-header">
              <div class="widget-title">
                <span>${widgetInfo?.name || 'Widget'}</span>
                ${widget.symbol ? `<span style="color:#8b5cf6;font-size:13px;">${widget.symbol}/USD</span>` : ''}
              </div>
              <span class="widget-badge">● LIVE</span>
            </div>
            <div class="widget-content" id="content">
              ${getWidgetHtmlContent(widget)}
            </div>
          </div>
          <script>
            // Simulate live data updates
            function updateData() {
              const bars = document.querySelectorAll('.chart-bar');
              bars.forEach(bar => {
                bar.style.height = (20 + Math.random() * 60) + '%';
              });
              
              const priceEl = document.querySelector('.price-value');
              if (priceEl) {
                const base = ${widget.symbol === 'BTC' ? 67500 : widget.symbol === 'ETH' ? 3400 : 142};
                const change = (Math.random() - 0.5) * 100;
                priceEl.textContent = '$' + (base + change).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
              }
            }
            setInterval(updateData, 2000);
            
            // Notify parent when closed
            window.onbeforeunload = () => {
              window.opener?.postMessage({ type: 'WIDGET_CLOSED', widgetId: '${widget.id}' }, '*');
            };
          </script>
        </body>
        </html>
      `;
      
      popup.document.write(popupContent);
      popup.document.close();
      
      toast.success(`${widgetInfo?.name} popped out to new window`, {
        description: "Drag to another monitor for multi-screen trading"
      });
    } else {
      toast.error("Popup blocked! Please allow popups for multi-monitor support.");
    }
  }, []);
  
  // Listen for popup close messages
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'WIDGET_CLOSED') {
        const widgetId = event.data.widgetId;
        popupWindows.delete(widgetId);
        setDetachedWidgets(prev => {
          const next = new Set(prev);
          next.delete(widgetId);
          return next;
        });
      }
    };
    
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Pop out all widgets to separate windows
  const popOutAllWidgets = useCallback(() => {
    widgets.slice(0, totalCells).forEach((widget, index) => {
      setTimeout(() => popOutWidget(widget, index), index * 200);
    });
    setMultiMonitorMode(true);
  }, [widgets, totalCells, popOutWidget]);

  const handleLayoutChange = (preset: typeof LAYOUT_PRESETS[0]) => {
    setLayout(preset.grid);
    // Expand or trim widgets array
    const newTotal = preset.grid.cols * preset.grid.rows;
    if (widgets.length < newTotal) {
      const newWidgets = [...widgets];
      for (let i = widgets.length; i < newTotal; i++) {
        newWidgets.push({ id: `${Date.now()}-${i}`, type: 'chart', symbol: 'BTC' });
      }
      setWidgets(newWidgets);
    } else if (widgets.length > newTotal) {
      setWidgets(widgets.slice(0, newTotal));
    }
  };

  const handleWidgetChange = (index: number, widgetType: string) => {
    const newWidgets = [...widgets];
    newWidgets[index] = { ...newWidgets[index], type: widgetType };
    setWidgets(newWidgets);
    setSelectedCell(null);
  };

  const handleSymbolChange = (index: number, symbol: string) => {
    const newWidgets = [...widgets];
    newWidgets[index] = { ...newWidgets[index], symbol };
    setWidgets(newWidgets);
  };

  const saveWorkspace = () => {
    const newWorkspace: SavedWorkspace = {
      id: Date.now().toString(),
      name: workspaceName,
      layout,
      widgets,
      createdAt: new Date(),
    };
    setSavedWorkspaces([...savedWorkspaces, newWorkspace]);
    toast.success(`Workspace "${workspaceName}" saved!`);
  };

  const loadWorkspace = (workspace: SavedWorkspace) => {
    setLayout(workspace.layout);
    setWidgets(workspace.widgets.length ? workspace.widgets : widgets);
    setWorkspaceName(workspace.name);
    toast.success(`Loaded "${workspace.name}"`);
  };

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <Card>
        <CardContent className="py-3">
          <div className="flex items-center justify-between flex-wrap gap-2 sm:gap-4">
            {/* Layout Controls */}
            <div className="flex items-center gap-1 sm:gap-2">
              <span className="text-xs sm:text-sm text-muted-foreground hidden sm:inline">Layout:</span>
              <div className="flex gap-0.5 sm:gap-1 flex-wrap">
                {LAYOUT_PRESETS.map((preset) => (
                  <Button
                    key={preset.id}
                    variant={layout.cols === preset.grid.cols && layout.rows === preset.grid.rows ? 'default' : 'outline'}
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => handleLayoutChange(preset)}
                    title={preset.name}
                  >
                    <preset.icon className="h-4 w-4" />
                  </Button>
                ))}
              </div>
            </div>

            {/* Workspace Name */}
            <div className="hidden sm:flex items-center gap-2">
              <Input
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                className="w-48 h-8"
                placeholder="Workspace name..."
              />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={saveWorkspace}>
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>

              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <FolderOpen className="h-4 w-4 mr-2" />
                    Load
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Load Workspace</DialogTitle>
                  </DialogHeader>
                  <ScrollArea className="h-64">
                    <div className="space-y-2">
                      {savedWorkspaces.map((ws) => (
                        <div
                          key={ws.id}
                          className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer"
                          onClick={() => loadWorkspace(ws)}
                        >
                          <div>
                            <div className="font-medium">{ws.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {ws.layout.cols}×{ws.layout.rows} grid
                            </div>
                          </div>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Trash2 className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </DialogContent>
              </Dialog>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant={multiMonitorMode ? "default" : "outline"} 
                      size="sm"
                      onClick={popOutAllWidgets}
                      className={multiMonitorMode ? "bg-purple-600 hover:bg-purple-700" : ""}
                    >
                      <Tv className="h-4 w-4 mr-2" />
                      Multi-Monitor
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Pop out all panels to separate windows for multi-monitor setups</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <Button variant="outline" size="sm" onClick={toggleFullscreen}>
                {isFullscreen ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Widget Grid */}
      <div
        className="grid gap-2"
        style={{
          gridTemplateColumns: `repeat(${layout.cols}, 1fr)`,
          gridTemplateRows: `repeat(${layout.rows}, minmax(200px, 1fr))`,
          height: `calc(100vh - 280px)`,
        }}
      >
        {widgets.slice(0, totalCells).map((widget, index) => {
          const WidgetRenderer = WIDGET_RENDERERS[widget.type] || MiniChart;
          const widgetInfo = WIDGET_TYPES.find((w) => w.id === widget.type);

          return (
            <Card
              key={widget.id}
              className={`relative overflow-hidden transition-all ${
                selectedCell === index ? 'ring-2 ring-primary' : ''
              }`}
            >
              {/* Widget Header */}
              <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-1 bg-gradient-to-b from-background/90 to-transparent">
                <div className="flex items-center gap-1">
                  {widgetInfo && <widgetInfo.icon className="h-3 w-3 text-muted-foreground" />}
                  <span className="text-xs text-muted-foreground">{widgetInfo?.name}</span>
                </div>
                <div className="flex items-center gap-0.5">
                  {widget.type === 'chart' && (
                    <Select
                      value={widget.symbol || 'BTC'}
                      onValueChange={(v) => handleSymbolChange(index, v)}
                    >
                      <SelectTrigger className="h-5 w-16 text-xs border-0 bg-transparent">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BTC">BTC</SelectItem>
                        <SelectItem value="ETH">ETH</SelectItem>
                        <SelectItem value="SOL">SOL</SelectItem>
                        <SelectItem value="SPY">SPY</SelectItem>
                        <SelectItem value="QQQ">QQQ</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                  {/* Pop-out button for multi-monitor */}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-5 w-5"
                          onClick={() => popOutWidget(widget, index)}
                          disabled={detachedWidgets.has(widget.id)}
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        <p>Pop out to separate window</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-5 w-5">
                        <Settings className="h-3 w-3" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Change Widget</DialogTitle>
                      </DialogHeader>
                      <div className="grid grid-cols-3 gap-2">
                        {WIDGET_TYPES.map((wt) => (
                          <Button
                            key={wt.id}
                            variant={widget.type === wt.id ? 'default' : 'outline'}
                            className="h-auto py-3 flex-col gap-2"
                            onClick={() => handleWidgetChange(index, wt.id)}
                          >
                            <wt.icon className="h-5 w-5" />
                            <span className="text-xs">{wt.name}</span>
                          </Button>
                        ))}
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              {/* Widget Content */}
              <div className="h-full pt-7">
                <WidgetRenderer symbol={widget.symbol} />
              </div>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions Bar */}
      <Card>
        <CardContent className="py-2">
          <div className="flex items-center justify-between">
            <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
              <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono">Ctrl+1-9</kbd>
              <span>Switch windows</span>
              <span className="mx-2">|</span>
              <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono">Ctrl+S</kbd>
              <span>Save layout</span>
              <span className="mx-2">|</span>
              <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono">F11</kbd>
              <span>Fullscreen</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-green-500">
                <span className="w-2 h-2 rounded-full bg-green-500 mr-1 animate-pulse" />
                Live Data
              </Badge>
              <Badge variant="outline">
                {layout.cols}×{layout.rows} = {totalCells} panels
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WorkspaceManager;
