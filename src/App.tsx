import { useEffect, lazy, Suspense } from "react";
import { useRealtimePortfolio } from "@/hooks/useRealtimePortfolio";
import { useRealtimeMarketPrices } from "@/hooks/useRealtimeMarketPrices";
import { useWebSocketPrices } from "@/hooks/useWebSocketPrices";
import { usePortfolioSnapshot } from "@/hooks/usePortfolioSnapshot";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { AccessibilityProvider } from "./contexts/AccessibilityContext";
import { BaseCurrencyProvider } from "./contexts/BaseCurrencyContext";
import { AuthProvider } from "./contexts/AuthContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import SkipLinks from "./components/accessibility/SkipLinks";
import ScreenReaderAnnouncer from "./components/accessibility/ScreenReaderAnnouncer";
import ProtectedRoute from "./components/ProtectedRoute";
import FloatingWindowsLayer from "./components/floating/FloatingWindowsLayer";
import { FloatingWindowsProvider } from "./contexts/FloatingWindowsContext";
import Index from "./pages/Index";

// Lazy load non-home routes for code-splitting
const Auth = lazy(() => import("./pages/Auth"));
const TradingDashboard = lazy(() => import("./pages/TradingDashboard"));
const LightningVault = lazy(() => import("./pages/LightningVault"));
const AIResearchLab = lazy(() => import("./pages/AIResearchLab"));
const AdvancedAnalytics = lazy(() => import("./pages/AdvancedAnalytics"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const NotFound = lazy(() => import("./pages/NotFound"));
const ExchangeHub = lazy(() => import("./pages/ExchangeHub"));
const FreqtradeStudio = lazy(() => import("./pages/FreqtradeStudio"));
const MLPredictions = lazy(() => import("./pages/MLPredictions"));
const DefiSniperPage = lazy(() => import("./pages/DefiSniperPage"));
const StrategyMarketplacePage = lazy(() => import("./pages/StrategyMarketplacePage"));
const RiskManagement = lazy(() => import("./pages/RiskManagement"));
const SocialTrading = lazy(() => import("./pages/SocialTrading"));
const InstitutionalServices = lazy(() => import("./pages/InstitutionalServices"));
const AdvancedTrading = lazy(() => import("./pages/AdvancedTrading"));
const NFTStudio = lazy(() => import("./pages/NFTStudio"));
const TokenLaunchpad = lazy(() => import("./pages/TokenLaunchpad"));
const CryptoFaucetPage = lazy(() => import("./pages/CryptoFaucetPage"));
const EducationPage = lazy(() => import("./pages/EducationPage"));
const ScreenerPage = lazy(() => import("./pages/ScreenerPage"));
const NewsFeedPage = lazy(() => import("./pages/NewsFeedPage"));
const EconomicCalendarPage = lazy(() => import("./pages/EconomicCalendarPage"));
const DerivativesPage = lazy(() => import("./pages/DerivativesPage"));
const QuantumLabPage = lazy(() => import("./pages/QuantumLabPage"));
const StrategyLab = lazy(() => import("./pages/StrategyLab"));
const TitanCodexPage = lazy(() => import("./pages/TitanCodexPage"));
const QAQIPage = lazy(() => import("./pages/QAQIPage"));
const ConnectorsPage = lazy(() => import("./pages/ConnectorsPage"));
const AIAssistantPage = lazy(() => import("./pages/AIAssistantPage"));
const AccessibilitySettingsPage = lazy(() => import("./pages/AccessibilitySettingsPage"));
const AlertsFeedPage = lazy(() => import("./pages/AlertsFeedPage"));
const MarketIntelligencePage = lazy(() => import("./pages/MarketIntelligencePage"));
const PortfolioPage = lazy(() => import("./pages/PortfolioPage"));
const TradingCockpit = lazy(() => import("./pages/TradingCockpit"));
const PricingPage = lazy(() => import("./pages/PricingPage"));
const MediaHub = lazy(() => import("./pages/MediaHub"));
const LegalPage = lazy(() => import("./pages/LegalPage"));
const AchievementsPage = lazy(() => import("./pages/AchievementsPage"));
const FeesPage = lazy(() => import("./pages/FeesPage"));
const WatchlistPage = lazy(() => import("./pages/WatchlistPage"));
const PopoutTool = lazy(() => import("./pages/PopoutTool"));
const RevenueCommandCenter = lazy(() => import("./pages/RevenueCommandCenter"));
const PaymentSuccess = lazy(() => import("./pages/PaymentSuccess"));
const CheckoutReturn = lazy(() => import("./pages/CheckoutReturn"));
const Billing = lazy(() => import("./pages/Billing"));
const WithdrawalPage = lazy(() => import("./pages/WithdrawalPage"));
import { PaymentTestModeBanner } from "@/components/payments/PaymentTestModeBanner";
const DataEcosystem = lazy(() => import("./pages/DataEcosystem"));
const WalletAssets = lazy(() => import("./pages/WalletAssets"));
const AutoInvestPage = lazy(() => import("./pages/AutoInvestPage"));
const PerformanceShowcase = lazy(() => import("./pages/PerformanceShowcase"));
const QuantClawPage = lazy(() => import("./pages/QuantClawPage"));
const HiveMindPage = lazy(() => import("./pages/HiveMindPage"));
const CapitolTradesPage = lazy(() => import("./pages/CapitolTradesPage"));
const BroadcastStationPage = lazy(() => import("./pages/BroadcastStationPage"));
// SatelliteHub merged into ConnectorsPage
const GiveawayPage = lazy(() => import("./pages/GiveawayPage"));
const StatsArenaPage = lazy(() => import("./pages/StatsArenaPage"));
const RewardsStorePage = lazy(() => import("./pages/RewardsStorePage"));
const NotificationsPage = lazy(() => import("./pages/NotificationsPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const SimulationDashboard = lazy(() => import("./pages/SimulationDashboard"));
const MemeCoinLaunch = lazy(() => import("./pages/Launch"));
const NFTDrop = lazy(() => import("./pages/NFTDrop"));
const ViralLanding = lazy(() => import("./pages/ViralLanding"));
const VerifiedLedger = lazy(() => import("./pages/VerifiedLedger"));
const QuWalletPage = lazy(() => import("./pages/QuWalletPage"));
const StakingPage = lazy(() => import("./pages/StakingPage"));
const DEXPage = lazy(() => import("./pages/DEXPage"));
const TradingCommandCenter = lazy(() => import("./pages/TradingCommandCenter"));
const StrategyNFTMarketplace = lazy(() => import("./pages/StrategyNFTMarketplace"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      <p className="text-muted-foreground">Loading...</p>
    </div>
  </div>
);

const AuthDeepLinkHandler = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const url = `${location.search}${location.hash}`;
    const isRecovery = url.includes("type=recovery");

    // If the backend redirects recovery links to the site root, preserve the hash and
    // forward the user to /auth so they can set a new password.
    if (isRecovery && location.pathname !== "/auth") {
      navigate(
        {
          pathname: "/auth",
          search: location.search,
          hash: location.hash,
        },
        { replace: true }
      );
    }
  }, [location.hash, location.pathname, location.search, navigate]);

  return null;
};
/** Mounts global realtime subscriptions inside provider tree */
const RealtimeSync = () => { useRealtimePortfolio(); useRealtimeMarketPrices(); useWebSocketPrices(); usePortfolioSnapshot(); return null; };

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ThemeProvider>
        <LanguageProvider>
          <AccessibilityProvider>
          <BaseCurrencyProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <FloatingWindowsProvider>
                  <PaymentTestModeBanner />
                  <RealtimeSync />
                  <AuthDeepLinkHandler />
                  <SkipLinks />
                  <ScreenReaderAnnouncer />
                  <FloatingWindowsLayer />
                  <Suspense fallback={<PageLoader />}>
                    <Routes>
                      <Route path="/" element={<Index />} />
                      <Route path="/index" element={<Index />} />
                      <Route path="/auth" element={<Auth />} />
                      <Route path="/pricing" element={<PricingPage />} />
                      <Route
                        path="/trading"
                        element={
                          <ProtectedRoute>
                            <TradingDashboard />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/vault"
                        element={
                          <ProtectedRoute>
                            <LightningVault />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/ai-lab"
                        element={
                          <ProtectedRoute>
                            <AIResearchLab />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/analytics"
                        element={
                          <ProtectedRoute>
                            <AdvancedAnalytics />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/exchange"
                        element={
                          <ProtectedRoute>
                            <ExchangeHub />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/strategy-studio"
                        element={
                          <ProtectedRoute>
                            <FreqtradeStudio />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/ml-predictions"
                        element={
                          <ProtectedRoute>
                            <MLPredictions />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/defi-sniper"
                        element={
                          <ProtectedRoute>
                            <DefiSniperPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/marketplace"
                        element={
                          <ProtectedRoute>
                            <StrategyMarketplacePage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/risk"
                        element={
                          <ProtectedRoute>
                            <RiskManagement />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/social"
                        element={
                          <ProtectedRoute>
                            <SocialTrading />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/institutional"
                        element={
                          <ProtectedRoute>
                            <InstitutionalServices />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/advanced-trading"
                        element={
                          <ProtectedRoute>
                            <AdvancedTrading />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/nft-studio"
                        element={
                          <ProtectedRoute>
                            <NFTStudio />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/token-launchpad"
                        element={
                          <ProtectedRoute>
                            <TokenLaunchpad />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/faucet"
                        element={
                          <ProtectedRoute>
                            <CryptoFaucetPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/education"
                        element={
                          <ProtectedRoute>
                            <EducationPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/screener"
                        element={
                          <ProtectedRoute>
                            <ScreenerPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/news"
                        element={
                          <ProtectedRoute>
                            <NewsFeedPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/calendar"
                        element={
                          <ProtectedRoute>
                            <EconomicCalendarPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/derivatives"
                        element={
                          <ProtectedRoute>
                            <DerivativesPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/quantum-lab"
                        element={
                          <ProtectedRoute>
                            <QuantumLabPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/strategy-lab"
                        element={
                          <ProtectedRoute>
                            <StrategyLab />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/titan-codex"
                        element={
                          <ProtectedRoute>
                            <TitanCodexPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/qaqi"
                        element={
                          <ProtectedRoute>
                            <QAQIPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/connectors"
                        element={
                          <ProtectedRoute>
                            <ConnectorsPage />
                          </ProtectedRoute>
                        }
                      />
                      {/* Legacy redirects */}
                      <Route path="/connections" element={<ProtectedRoute><ConnectorsPage /></ProtectedRoute>} />
                      <Route path="/satellite" element={<ProtectedRoute><ConnectorsPage /></ProtectedRoute>} />
                      <Route path="/giveaway" element={<GiveawayPage />} />
                      <Route path="/stats" element={<StatsArenaPage />} />
                      <Route path="/rewards" element={<RewardsStorePage />} />
                      <Route
                        path="/ai-assistant"
                        element={
                          <ProtectedRoute>
                            <AIAssistantPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/admin/*"
                        element={
                          <ProtectedRoute>
                            <AdminDashboard />
                          </ProtectedRoute>
                        }
                      />
                      <Route path="/settings/accessibility" element={<ProtectedRoute><AccessibilitySettingsPage /></ProtectedRoute>} />
                      <Route
                        path="/alerts"
                        element={
                          <ProtectedRoute>
                            <AlertsFeedPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/intelligence"
                        element={
                          <ProtectedRoute>
                            <MarketIntelligencePage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/portfolio"
                        element={
                          <ProtectedRoute>
                            <PortfolioPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/ledger"
                        element={
                          <ProtectedRoute>
                            <VerifiedLedger />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/cockpit"
                        element={
                          <ProtectedRoute>
                            <TradingCockpit />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/media"
                        element={
                          <ProtectedRoute>
                            <MediaHub />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/popout/:tool"
                        element={
                          <ProtectedRoute>
                            <PopoutTool />
                          </ProtectedRoute>
                        }
                      />
                      <Route path="/legal" element={<LegalPage />} />
                      <Route path="/fees" element={<FeesPage />} />
                      <Route
                        path="/achievements"
                        element={
                          <ProtectedRoute>
                            <AchievementsPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route path="/watchlist" element={<ProtectedRoute><WatchlistPage /></ProtectedRoute>} />
                      <Route
                        path="/revenue"
                        element={
                          <ProtectedRoute>
                            <RevenueCommandCenter />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/data-ecosystem"
                        element={
                          <ProtectedRoute>
                            <DataEcosystem />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/wallet-assets"
                        element={
                          <ProtectedRoute>
                            <WalletAssets />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/auto-invest"
                        element={
                          <ProtectedRoute>
                            <AutoInvestPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route path="/performance" element={<PerformanceShowcase />} />
                      <Route path="/simulation" element={<SimulationDashboard />} />
                      <Route
                        path="/quantclaw"
                        element={
                          <ProtectedRoute>
                            <QuantClawPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/hivemind"
                        element={
                          <ProtectedRoute>
                            <HiveMindPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route path="/capitol-trades" element={<ProtectedRoute><CapitolTradesPage /></ProtectedRoute>} />
                      <Route path="/broadcast" element={<ProtectedRoute><BroadcastStationPage /></ProtectedRoute>} />
                      <Route path="/payment-success" element={<PaymentSuccess />} />
                      <Route path="/checkout/return" element={<CheckoutReturn />} />
                      <Route path="/billing" element={<ProtectedRoute><Billing /></ProtectedRoute>} />
                      <Route path="/withdrawal" element={<ProtectedRoute><WithdrawalPage /></ProtectedRoute>} />
                      <Route
                        path="/notifications"
                        element={
                          <ProtectedRoute>
                            <NotificationsPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                      <Route path="/launch" element={<MemeCoinLaunch />} />
                      <Route path="/nft-drop" element={<NFTDrop />} />
                      <Route path="/go" element={<ViralLanding />} />
                      <Route path="/quwallet" element={<ProtectedRoute><QuWalletPage /></ProtectedRoute>} />
                      <Route path="/staking" element={<ProtectedRoute><StakingPage /></ProtectedRoute>} />
                      <Route path="/dex" element={<ProtectedRoute><DEXPage /></ProtectedRoute>} />
                      <Route path="/trading-bots" element={<ProtectedRoute><TradingCommandCenter /></ProtectedRoute>} />
                      <Route path="/strategy-nft" element={<StrategyNFTMarketplace />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Suspense>
                </FloatingWindowsProvider>
              </BrowserRouter>
            </TooltipProvider>
          </BaseCurrencyProvider>
          </AccessibilityProvider>
        </LanguageProvider>
      </ThemeProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
