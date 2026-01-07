import { useEffect, lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { AccessibilityProvider } from "./contexts/AccessibilityContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import SkipLinks from "./components/accessibility/SkipLinks";
import ScreenReaderAnnouncer from "./components/accessibility/ScreenReaderAnnouncer";
import ProtectedRoute from "./components/ProtectedRoute";

// Lazy load all page components for code-splitting
const Index = lazy(() => import("./pages/Index"));
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
const ConnectionsPage = lazy(() => import("./pages/ConnectionsPage"));
const AIAssistantPage = lazy(() => import("./pages/AIAssistantPage"));
const AccessibilitySettingsPage = lazy(() => import("./pages/AccessibilitySettingsPage"));
const AlertsFeedPage = lazy(() => import("./pages/AlertsFeedPage"));
const MarketIntelligencePage = lazy(() => import("./pages/MarketIntelligencePage"));

const queryClient = new QueryClient();

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

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
    <AccessibilityProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthDeepLinkHandler />
          <SkipLinks />
          <ScreenReaderAnnouncer />
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/trading" element={<ProtectedRoute><TradingDashboard /></ProtectedRoute>} />
              <Route path="/vault" element={<ProtectedRoute><LightningVault /></ProtectedRoute>} />
              <Route path="/ai-lab" element={<ProtectedRoute><AIResearchLab /></ProtectedRoute>} />
              <Route path="/analytics" element={<ProtectedRoute><AdvancedAnalytics /></ProtectedRoute>} />
              <Route path="/exchange" element={<ProtectedRoute><ExchangeHub /></ProtectedRoute>} />
              <Route path="/strategy-studio" element={<ProtectedRoute><FreqtradeStudio /></ProtectedRoute>} />
              <Route path="/ml-predictions" element={<ProtectedRoute><MLPredictions /></ProtectedRoute>} />
              <Route path="/defi-sniper" element={<ProtectedRoute><DefiSniperPage /></ProtectedRoute>} />
              <Route path="/marketplace" element={<ProtectedRoute><StrategyMarketplacePage /></ProtectedRoute>} />
              <Route path="/risk" element={<ProtectedRoute><RiskManagement /></ProtectedRoute>} />
              <Route path="/social" element={<ProtectedRoute><SocialTrading /></ProtectedRoute>} />
              <Route path="/institutional" element={<ProtectedRoute><InstitutionalServices /></ProtectedRoute>} />
              <Route path="/advanced-trading" element={<ProtectedRoute><AdvancedTrading /></ProtectedRoute>} />
              <Route path="/nft" element={<ProtectedRoute><NFTStudio /></ProtectedRoute>} />
              <Route path="/token" element={<ProtectedRoute><TokenLaunchpad /></ProtectedRoute>} />
              <Route path="/faucet" element={<ProtectedRoute><CryptoFaucetPage /></ProtectedRoute>} />
              <Route path="/education" element={<ProtectedRoute><EducationPage /></ProtectedRoute>} />
              <Route path="/screener" element={<ProtectedRoute><ScreenerPage /></ProtectedRoute>} />
              <Route path="/news" element={<ProtectedRoute><NewsFeedPage /></ProtectedRoute>} />
              <Route path="/calendar" element={<ProtectedRoute><EconomicCalendarPage /></ProtectedRoute>} />
              <Route path="/derivatives" element={<ProtectedRoute><DerivativesPage /></ProtectedRoute>} />
              <Route path="/quantum-lab" element={<ProtectedRoute><QuantumLabPage /></ProtectedRoute>} />
              <Route path="/strategy-lab" element={<ProtectedRoute><StrategyLab /></ProtectedRoute>} />
              <Route path="/titan-codex" element={<ProtectedRoute><TitanCodexPage /></ProtectedRoute>} />
              <Route path="/qaqi" element={<ProtectedRoute><QAQIPage /></ProtectedRoute>} />
              <Route path="/connections" element={<ProtectedRoute><ConnectionsPage /></ProtectedRoute>} />
              <Route path="/ai-assistant" element={<ProtectedRoute><AIAssistantPage /></ProtectedRoute>} />
              <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
              <Route path="/settings/accessibility" element={<AccessibilitySettingsPage />} />
              <Route path="/alerts" element={<ProtectedRoute><AlertsFeedPage /></ProtectedRoute>} />
              <Route path="/intelligence" element={<ProtectedRoute><MarketIntelligencePage /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </AccessibilityProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
