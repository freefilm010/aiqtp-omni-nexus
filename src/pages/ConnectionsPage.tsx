import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AccountConnections from "@/components/connections/AccountConnections";
import AutomationIntegrations from "@/components/integrations/AutomationIntegrations";
import MoonshotIntegration from "@/components/integrations/MoonshotIntegration";
import BTCCTrading from "@/components/integrations/BTCCTrading";

const ConnectionsPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 space-y-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Connections & Integrations</h1>
          <p className="text-muted-foreground">
            Connect exchanges, automate workflows, and integrate external platforms
          </p>
        </div>
        
        {/* Exchange Connections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <BTCCTrading />
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
