import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { lazy, Suspense, useState } from "react";
import heroCosmos from "@/assets/hero-cosmos.jpg";
import { useKrakenTickers } from "@/hooks/useKrakenTickers";
import { useIsMobile } from "@/hooks/use-mobile";

const QuickStartStrategy = lazy(() => import("@/components/strategy/QuickStartStrategy"));

const LiveTicker = ({ tickers }: { tickers: Record<string, any> }) => {
  const entries = Object.entries(tickers)
    .sort((a: any, b: any) => (b[1].marketCap || 0) - (a[1].marketCap || 0))
    .slice(0, 16);

  const prices = entries.map(([s, t]: any) => {
    const change = t?.priceChangePercent ?? 0;
    return {
      symbol: s.replace("/USDT", "USD"),
      price: t?.lastPrice ?? 0,
      change,
      positive: change >= 0,
      ready: Boolean(t),
    };
  });

  if (prices.length === 0) return null;

  const formatPrice = (value: number) =>
    value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="absolute top-0 left-0 right-0 z-20 h-8 overflow-hidden border-b border-white/5 bg-black/40 backdrop-blur-md">
      <div className="flex h-full animate-ticker whitespace-nowrap">
        {[...prices, ...prices].map((t, i) => (
          <div key={i} className="flex h-full items-center gap-2 border-r border-white/5 px-4">
            <span className="font-mono text-[11px] font-medium text-white/85">{t.symbol}</span>
            <span className={`font-mono text-[11px] font-semibold ${t.positive ? "text-[hsl(162,91%,55%)]" : "text-[hsl(355,88%,68%)]"}`}>
              {t.ready ? formatPrice(t.price) : "—"}
            </span>
            <span className={`font-mono text-[10px] ${t.positive ? "text-[hsl(162,91%,55%)]" : "text-[hsl(355,88%,68%)]"}`}>
              {t.ready ? `${t.positive ? "+" : ""}${t.change.toFixed(2)}%` : ""}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

const Hero = () => {
  const isMobile = useIsMobile();
  const [quickStartOpen, setQuickStartOpen] = useState(false);
  const { tickers } = useKrakenTickers(undefined, isMobile ? 0 : 45_000);

  return (
    <section className="relative flex min-h-[88svh] items-center justify-center overflow-hidden bg-black md:min-h-screen">
      {/* Full-bleed cinematic background — TradingView style */}
      <img
        src={heroCosmos}
        alt=""
        aria-hidden="true"
        decoding="async"
        width={1920}
        height={1280}
        className="absolute inset-0 h-full w-full object-cover object-center"
      />
      {/* Vignette overlays for legibility */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/10 to-black/85" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.55)_85%)]" />

      {!isMobile && <LiveTicker tickers={tickers} />}

      {/* Centerpiece content */}
      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col items-center px-4 text-center">
        <h1 className="font-sans text-5xl font-extrabold leading-[0.95] tracking-tight text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.6)] sm:text-7xl md:text-[7rem] md:leading-[0.9]">
          Look first
          <span className="px-3 font-light text-white/45">/</span>
          Then leap.
        </h1>

        <p className="mt-6 max-w-2xl text-base text-white/85 sm:text-lg md:text-xl">
          Quantum-grade research, AI co-pilots, and institutional execution — all in one terminal.
        </p>

        <div className="mt-10 flex flex-col items-center gap-3">
          <Button
            size="lg"
            onClick={() => setQuickStartOpen(true)}
            className="h-14 rounded-full bg-white px-10 text-base font-semibold text-black shadow-[0_8px_40px_rgba(255,255,255,0.18)] hover:bg-white/95 hover:scale-[1.02] transition-all"
          >
            Get started for free
          </Button>
          <p className="text-xs text-white/65">$0 forever, no credit card needed</p>
        </div>

        <div className="mt-8 flex items-center gap-4 text-[11px] font-mono text-white/55">
          <Link to="/auth" className="hover:text-white transition-colors underline-offset-4 hover:underline">Launch Terminal</Link>
          <span className="text-white/20">·</span>
          <Link to="/qaqi" className="hover:text-white transition-colors underline-offset-4 hover:underline">QAQI™ AI</Link>
          <span className="text-white/20">·</span>
          <Link to="/vault" className="hover:text-white transition-colors underline-offset-4 hover:underline">Vault</Link>
        </div>
      </div>

      {/* Scroll indicator */}
      <button
        type="button"
        aria-label="Scroll to platform overview"
        onClick={() => window.scrollTo({ top: window.innerHeight, behavior: "smooth" })}
        className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2 text-white/60 hover:text-white transition-colors"
      >
        <ChevronDown className="h-7 w-7 animate-bounce" />
      </button>

      <Suspense fallback={null}>
        <QuickStartStrategy open={quickStartOpen} onOpenChange={setQuickStartOpen} />
      </Suspense>
    </section>
  );
};

export default Hero;