import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MultiExchangeAggregator from "@/components/trading/MultiExchangeAggregator";
import ExchangeConnector from "@/components/exchange/ExchangeConnector";
import ArbitrageScanner from "@/components/exchange/ArbitrageScanner";
import UnifiedOrderBook from "@/components/exchange/UnifiedOrderBook";

const ExchangeHub = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Multi-Exchange Hub</h1>
          <p className="text-muted-foreground mt-1">
            Connect to 100+ exchanges with unified API • Powered by CCXT architecture
          </p>
        </div>

        <Tabs defaultValue="aggregator" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="aggregator">Price Aggregator</TabsTrigger>
            <TabsTrigger value="connect">Connect Exchanges</TabsTrigger>
            <TabsTrigger value="arbitrage">Arbitrage Scanner</TabsTrigger>
            <TabsTrigger value="orderbook">Unified Order Book</TabsTrigger>
          </TabsList>

          <TabsContent value="aggregator">
            <MultiExchangeAggregator />
          </TabsContent>

          <TabsContent value="connect">
            <ExchangeConnector />
          </TabsContent>

          <TabsContent value="arbitrage">
            <ArbitrageScanner />
          </TabsContent>

          <TabsContent value="orderbook">
            <UnifiedOrderBook />
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
};

export default ExchangeHub;
