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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
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
          <Route path="/admin/*" element={<AdminDashboard />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
