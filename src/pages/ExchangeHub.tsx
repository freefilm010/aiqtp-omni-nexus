import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import MultiExchangeAggregator from "@/components/trading/MultiExchangeAggregator";
import ExchangeConnector from "@/components/exchange/ExchangeConnector";
import ArbitrageScanner from "@/components/exchange/ArbitrageScanner";
import UnifiedOrderBook from "@/components/exchange/UnifiedOrderBook";
import { useSupportedChains, useSupportedExchanges } from "@/hooks/useSupportedNetworks";
import { Globe, Layers, Shield, Zap, Link2, RefreshCw } from "lucide-react";

const ExchangeHub = () => {
  const { chains, loading: chainsLoading, getChainsByType } = useSupportedChains();
  const { exchanges, loading: exchangesLoading, getCexExchanges, getDexExchanges } = useSupportedExchanges();

  const chainTypeIcons: Record<string, React.ReactNode> = {
    layer1: <Globe className="h-4 w-4" />,
    layer2: <Layers className="h-4 w-4" />,
    privacy: <Shield className="h-4 w-4" />,
    sidechain: <Link2 className="h-4 w-4" />,
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Multi-Exchange Hub</h1>
          <p className="text-muted-foreground mt-1">
            Connect to 100+ exchanges across 30+ blockchains • Real CoinGecko data • CCXT architecture
          </p>
          <div className="flex gap-2 mt-3">
            <Badge variant="outline" className="text-emerald-500 border-emerald-500">
              {chains.length} Chains
            </Badge>
            <Badge variant="outline" className="text-blue-500 border-blue-500">
              {exchanges.length} Exchanges
            </Badge>
            <Badge variant="outline" className="text-purple-500 border-purple-500">
              5000+ Trading Pairs
            </Badge>
          </div>
        </div>

        <Tabs defaultValue="aggregator" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="aggregator">Price Aggregator</TabsTrigger>
            <TabsTrigger value="networks">Networks</TabsTrigger>
            <TabsTrigger value="connect">Connect Exchanges</TabsTrigger>
            <TabsTrigger value="arbitrage">Arbitrage Scanner</TabsTrigger>
            <TabsTrigger value="orderbook">Unified Order Book</TabsTrigger>
          </TabsList>

          <TabsContent value="aggregator">
            <MultiExchangeAggregator />
          </TabsContent>

          <TabsContent value="networks" className="space-y-6">
            {/* Supported Blockchains */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Supported Blockchains ({chains.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {chains.map(chain => (
                    <div 
                      key={chain.id}
                      className="p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {chainTypeIcons[chain.chain_type] || <Zap className="h-4 w-4" />}
                        <span className="font-medium text-sm">{chain.symbol}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{chain.name}</p>
                      <div className="flex gap-1 mt-2 flex-wrap">
                        <Badge variant="outline" className="text-xs">
                          {chain.chain_type}
                        </Badge>
                        {chain.is_evm_compatible && (
                          <Badge variant="secondary" className="text-xs">EVM</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* CEX Exchanges */}
            <Card>
              <CardHeader>
                <CardTitle>Centralized Exchanges ({getCexExchanges().length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {getCexExchanges().map(exchange => (
                    <div 
                      key={exchange.id}
                      className="p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <span className="font-medium">{exchange.name}</span>
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {exchange.features?.spot && <Badge variant="outline" className="text-xs">Spot</Badge>}
                        {exchange.features?.futures && <Badge variant="outline" className="text-xs">Futures</Badge>}
                        {exchange.features?.margin && <Badge variant="outline" className="text-xs">Margin</Badge>}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* DEX Exchanges */}
            <Card>
              <CardHeader>
                <CardTitle>Decentralized Exchanges ({getDexExchanges().length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {getDexExchanges().map(exchange => (
                    <div 
                      key={exchange.id}
                      className="p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <span className="font-medium">{exchange.name}</span>
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {exchange.supported_chains.slice(0, 3).map(chain => (
                          <Badge key={chain} variant="secondary" className="text-xs">{chain}</Badge>
                        ))}
                        {exchange.supported_chains.length > 3 && (
                          <Badge variant="outline" className="text-xs">+{exchange.supported_chains.length - 3}</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
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
