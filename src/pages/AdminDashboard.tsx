import { useEffect, useState } from "react";
import { useNavigate, Routes, Route, Navigate } from "react-router-dom";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminOverview from "@/components/admin/AdminOverview";
import AdminFinancials from "@/components/admin/AdminFinancials";
import ChatManagement from "@/components/admin/ChatManagement";
import RevenueManager from "@/components/admin/RevenueManager";
import InvestmentManager from "@/components/admin/InvestmentManager";
import PaymentProcessors from "@/components/admin/PaymentProcessors";
import AICopilot from "@/components/admin/AICopilot";
import SecurityCenter from "@/components/admin/SecurityCenter";
import AutomationCenter from "@/components/admin/AutomationCenter";
import TreasuryWallets from "@/components/admin/TreasuryWallets";
import ProfitAutomation from "@/components/admin/ProfitAutomation";
import ProfitDistributionRules from "@/components/admin/ProfitDistributionRules";
import PlatformDocumentation from "@/components/admin/PlatformDocumentation";
import TokenFactory from "@/components/admin/TokenFactory";
import InfluencerProgram from "@/components/admin/InfluencerProgram";
import ContestManager from "@/components/admin/ContestManager";
import OperatorManager from "@/components/admin/OperatorManager";
import ExchangeManager from "@/components/admin/ExchangeManager";
import AutoNFTGenerator from "@/components/admin/AutoNFTGenerator";
import DataMarketplace from "@/components/admin/DataMarketplace";
import BrandingRegistry from "@/components/admin/BrandingRegistry";
import MarketCrawlerAnalytics from "@/components/intelligence/MarketCrawlerAnalytics";
import StoreListingAutomation from "@/components/admin/StoreListingAutomation";
import FeedbackManager from "@/components/admin/FeedbackManager";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const AdminDashboard = () => {
  const { isAdmin, loading, user } = useAdminAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      toast.error("Please sign in to access the admin dashboard");
      navigate("/auth");
    } else if (!loading && user && !isAdmin) {
      toast.error("You don't have admin privileges");
      navigate("/");
    }
  }, [isAdmin, loading, user, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="container max-w-7xl py-6 px-4 md:px-6">
          <Routes>
            <Route index element={<AdminOverview />} />
            <Route path="financials" element={<AdminFinancials />} />
            <Route path="chats" element={<ChatManagement />} />
            <Route path="revenue" element={<RevenueManager />} />
            <Route path="investments" element={<InvestmentManager />} />
            <Route path="payments" element={<PaymentProcessors />} />
            <Route path="automation" element={<AutomationCenter />} />
            <Route path="treasury" element={<TreasuryWallets />} />
            <Route path="profit-automation" element={<ProfitDistributionRules />} />
            <Route path="security" element={<SecurityCenter />} />
            <Route path="copilot" element={<AICopilot />} />
            <Route path="documentation" element={<PlatformDocumentation />} />
            <Route path="tokens" element={<TokenFactory />} />
            <Route path="influencers" element={<InfluencerProgram />} />
            <Route path="contests" element={<ContestManager />} />
            <Route path="operators" element={<OperatorManager />} />
            <Route path="exchange" element={<ExchangeManager />} />
            <Route path="nft-generator" element={<AutoNFTGenerator />} />
            <Route path="data-marketplace" element={<DataMarketplace />} />
            <Route path="branding" element={<BrandingRegistry />} />
            <Route path="market-intel" element={<MarketCrawlerAnalytics />} />
            <Route path="store-listings" element={<StoreListingAutomation />} />
            <Route path="users" element={<AdminOverview />} />
            <Route path="logs" element={<AdminOverview />} />
            <Route path="settings" element={<AdminOverview />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
