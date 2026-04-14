import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AccountConnections from "@/components/connections/AccountConnections";
import CloudStorageConnectors from "@/components/connections/CloudStorageConnectors";
import AutomationIntegrations from "@/components/integrations/AutomationIntegrations";
import MoonshotIntegration from "@/components/integrations/MoonshotIntegration";
import BTCCTrading from "@/components/integrations/BTCCTrading";
import AlpacaStockTrading from "@/components/trading/AlpacaStockTrading";
import StockMarketHub from "@/components/trading/StockMarketHub";
import PaymentHub from "@/components/payments/PaymentHub";
import AutomationTemplates from "@/components/admin/AutomationTemplates";

const ConnectionsPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 space-y-6">
        <div className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-3xl font-bold mb-2">Connections & Integrations</h1>
          <p className="text-muted-foreground">
            Connect exchanges, fund accounts, automate workflows, and integrate external platforms
          </p>
        </div>

        {/* Cloud Storage & Notes */}
        <CloudStorageConnectors />

        {/* Automation Templates */}
        <AutomationTemplates />

        {/* Stock Market Data */}
        <StockMarketHub />
        
        {/* Stock Trading & Exchange Connections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AlpacaStockTrading />
          <BTCCTrading />
        </div>

        {/* Payment Processing & Account Linking */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PaymentHub />
          <AccountConnections />
        </div>
        
        {/* Token Launchpad & Automation */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MoonshotIntegration />
          <AutomationIntegrations />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ConnectionsPage;
