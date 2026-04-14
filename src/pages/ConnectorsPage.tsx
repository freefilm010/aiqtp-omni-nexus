import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Plug, Cloud, Cpu, Coins, Wallet, ArrowRightLeft, Globe, Dice5, Wrench, CreditCard, Bot } from "lucide-react";
import CloudStorageConnectors from "@/components/connections/CloudStorageConnectors";
import AccountConnections from "@/components/connections/AccountConnections";
import AutomationIntegrations from "@/components/integrations/AutomationIntegrations";
import MoonshotIntegration from "@/components/integrations/MoonshotIntegration";
import BTCCTrading from "@/components/integrations/BTCCTrading";
import AlpacaStockTrading from "@/components/trading/AlpacaStockTrading";
import StockMarketHub from "@/components/trading/StockMarketHub";
import PaymentHub from "@/components/payments/PaymentHub";
import AutomationTemplates from "@/components/admin/AutomationTemplates";
import SatelliteServicesSection from "@/components/connectors/SatelliteServicesSection";

const tabConfig = [
  { value: "all", label: "All", icon: <Plug className="h-4 w-4" /> },
  { value: "cloud", label: "Cloud & Tools", icon: <Cloud className="h-4 w-4" /> },
  { value: "exchanges", label: "Exchanges", icon: <Globe className="h-4 w-4" /> },
  { value: "wallets", label: "Wallets & DEX", icon: <Wallet className="h-4 w-4" /> },
  { value: "trading", label: "Trading", icon: <ArrowRightLeft className="h-4 w-4" /> },
  { value: "staking", label: "Staking & Mining", icon: <Coins className="h-4 w-4" /> },
  { value: "casino", label: "Casino & Gaming", icon: <Dice5 className="h-4 w-4" /> },
  { value: "payments", label: "Payments", icon: <CreditCard className="h-4 w-4" /> },
  { value: "automation", label: "Automation", icon: <Bot className="h-4 w-4" /> },
];

const ConnectorsPage = () => {
  const [search, setSearch] = useState("");

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <div className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-3xl font-bold flex items-center gap-2">
            <Plug className="h-7 w-7 text-primary" />
            Connectors
          </h1>
          <p className="text-muted-foreground mt-1 text-xs sm:text-sm">
            One place to connect everything — exchanges, wallets, cloud storage, mining, staking, gaming, payments & automation
          </p>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search connectors, services, chains..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="flex flex-wrap h-auto gap-1">
            {tabConfig.map(t => (
              <TabsTrigger key={t.value} value={t.value} className="gap-1.5 text-xs sm:text-sm">
                {t.icon} {t.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* ALL */}
          <TabsContent value="all" className="space-y-8">
            <CloudStorageConnectors />
            <SatelliteServicesSection filter={search} categories={["exchange", "wallet", "dex", "staking", "mining", "casino"]} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AlpacaStockTrading />
              <BTCCTrading />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <PaymentHub />
              <AccountConnections />
            </div>
            <AutomationTemplates />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <MoonshotIntegration />
              <AutomationIntegrations />
            </div>
          </TabsContent>

          {/* Cloud & Tools */}
          <TabsContent value="cloud">
            <CloudStorageConnectors />
          </TabsContent>

          {/* Exchanges */}
          <TabsContent value="exchanges" className="space-y-6">
            <SatelliteServicesSection filter={search} categories={["exchange"]} />
            <StockMarketHub />
          </TabsContent>

          {/* Wallets & DEX */}
          <TabsContent value="wallets">
            <SatelliteServicesSection filter={search} categories={["wallet", "dex"]} />
          </TabsContent>

          {/* Trading */}
          <TabsContent value="trading" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AlpacaStockTrading />
              <BTCCTrading />
            </div>
            <MoonshotIntegration />
          </TabsContent>

          {/* Staking & Mining */}
          <TabsContent value="staking">
            <SatelliteServicesSection filter={search} categories={["staking", "mining"]} />
          </TabsContent>

          {/* Casino & Gaming */}
          <TabsContent value="casino">
            <SatelliteServicesSection filter={search} categories={["casino"]} />
          </TabsContent>

          {/* Payments */}
          <TabsContent value="payments" className="space-y-6">
            <PaymentHub />
            <AccountConnections />
          </TabsContent>

          {/* Automation */}
          <TabsContent value="automation" className="space-y-6">
            <AutomationTemplates />
            <AutomationIntegrations />
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
};

export default ConnectorsPage;
