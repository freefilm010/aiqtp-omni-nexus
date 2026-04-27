import { useEffect, useState, lazy, Suspense } from "react";
import { useNavigate, Routes, Route, Navigate } from "react-router-dom";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { Loader2 } from "lucide-react";

const AdminOverview = lazy(() => import("@/components/admin/AdminOverview"));
const AdminFinancials = lazy(() => import("@/components/admin/AdminFinancials"));
const ChatManagement = lazy(() => import("@/components/admin/ChatManagement"));
const RevenueManager = lazy(() => import("@/components/admin/RevenueManager"));
const InvestmentManager = lazy(() => import("@/components/admin/InvestmentManager"));
const PaymentProcessors = lazy(() => import("@/components/admin/PaymentProcessors"));
const AICopilot = lazy(() => import("@/components/admin/AICopilot"));
const SecurityCenter = lazy(() => import("@/components/admin/SecurityCenter"));
const AutomationCenter = lazy(() => import("@/components/admin/AutomationCenter"));
const TreasuryWallets = lazy(() => import("@/components/admin/TreasuryWallets"));
const ProfitAutomation = lazy(() => import("@/components/admin/ProfitAutomation"));
const ProfitDistributionRules = lazy(() => import("@/components/admin/ProfitDistributionRules"));
const PlatformDocumentation = lazy(() => import("@/components/admin/PlatformDocumentation"));
const TokenFactory = lazy(() => import("@/components/admin/TokenFactory"));
const InfluencerProgram = lazy(() => import("@/components/admin/InfluencerProgram"));
const ContestManager = lazy(() => import("@/components/admin/ContestManager"));
const OperatorManager = lazy(() => import("@/components/admin/OperatorManager"));
const ExchangeManager = lazy(() => import("@/components/admin/ExchangeManager"));
const AutoNFTGenerator = lazy(() => import("@/components/admin/AutoNFTGenerator"));
const DataMarketplace = lazy(() => import("@/components/admin/DataMarketplace"));
const BrandingRegistry = lazy(() => import("@/components/admin/BrandingRegistry"));
const MarketCrawlerAnalytics = lazy(() => import("@/components/intelligence/MarketCrawlerAnalytics"));
const StoreListingAutomation = lazy(() => import("@/components/admin/StoreListingAutomation"));
const FeedbackManager = lazy(() => import("@/components/admin/FeedbackManager"));
const AdminKnowledgeBase = lazy(() => import("@/components/admin/AdminKnowledgeBase"));
const AdminReportsCenter = lazy(() => import("@/components/admin/AdminReportsCenter"));
const AdminUsersManagement = lazy(() => import("@/components/admin/AdminUsersManagement"));
const AdminSettingsPage = lazy(() => import("@/components/admin/AdminSettingsPage"));
const ApexDashboard = lazy(() => import("@/components/admin/ApexDashboard"));
const FederalCharterMission = lazy(() => import("@/components/admin/FederalCharterMission"));
const CEOMissionControl = lazy(() => import("@/components/admin/CEOMissionControl"));
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
          <Suspense fallback={<div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
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
              <Route path="feedback" element={<FeedbackManager />} />
              <Route path="knowledge" element={<AdminKnowledgeBase />} />
              <Route path="reports" element={<AdminReportsCenter />} />
              <Route path="users" element={<AdminUsersManagement />} />
              <Route path="logs" element={<AdminReportsCenter />} />
              <Route path="settings" element={<AdminSettingsPage />} />
              <Route path="apex" element={<ApexDashboard />} />
              <Route path="charter-mission" element={<FederalCharterMission />} />
              <Route path="mission-control" element={<CEOMissionControl />} />
              <Route path="*" element={<Navigate to="/admin" replace />} />
            </Routes>
          </Suspense>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
