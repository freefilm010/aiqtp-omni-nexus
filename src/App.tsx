import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import TradingDashboard from "./pages/TradingDashboard";
import LightningVault from "./pages/LightningVault";
import AIResearchLab from "./pages/AIResearchLab";
import AdvancedAnalytics from "./pages/AdvancedAnalytics";
import AdminDashboard from "./pages/AdminDashboard";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import ExchangeHub from "./pages/ExchangeHub";
import FreqtradeStudio from "./pages/FreqtradeStudio";
import MLPredictions from "./pages/MLPredictions";
import DefiSniperPage from "./pages/DefiSniperPage";
import StrategyMarketplacePage from "./pages/StrategyMarketplacePage";
import RiskManagement from "./pages/RiskManagement";
import SocialTrading from "./pages/SocialTrading";
import InstitutionalServices from "./pages/InstitutionalServices";
import AdvancedTrading from "./pages/AdvancedTrading";
import NFTStudio from "./pages/NFTStudio";
import TokenLaunchpad from "./pages/TokenLaunchpad";
import { AccessibilityProvider } from "./contexts/AccessibilityContext";
import AccessibilityToolbar from "./components/accessibility/AccessibilityToolbar";
import SkipLinks from "./components/accessibility/SkipLinks";
import ScreenReaderAnnouncer from "./components/accessibility/ScreenReaderAnnouncer";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AccessibilityProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <SkipLinks />
          <ScreenReaderAnnouncer />
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
            <Route path="/nft-studio" element={<ProtectedRoute><NFTStudio /></ProtectedRoute>} />
            <Route path="/token-launchpad" element={<ProtectedRoute><TokenLaunchpad /></ProtectedRoute>} />
            <Route path="/admin/*" element={<AdminDashboard />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <AccessibilityToolbar />
          {/* SVG Filters for Color Blind Modes */}
          <svg style={{ position: 'absolute', height: 0 }}>
            <defs>
              <filter id="protanopia-filter">
                <feColorMatrix type="matrix" values="0.567, 0.433, 0, 0, 0  0.558, 0.442, 0, 0, 0  0, 0.242, 0.758, 0, 0  0, 0, 0, 1, 0" />
              </filter>
              <filter id="deuteranopia-filter">
                <feColorMatrix type="matrix" values="0.625, 0.375, 0, 0, 0  0.7, 0.3, 0, 0, 0  0, 0.3, 0.7, 0, 0  0, 0, 0, 1, 0" />
              </filter>
              <filter id="tritanopia-filter">
                <feColorMatrix type="matrix" values="0.95, 0.05, 0, 0, 0  0, 0.433, 0.567, 0, 0  0, 0.475, 0.525, 0, 0  0, 0, 0, 1, 0" />
              </filter>
            </defs>
          </svg>
        </BrowserRouter>
      </TooltipProvider>
    </AccessibilityProvider>
  </QueryClientProvider>
);

export default App;
