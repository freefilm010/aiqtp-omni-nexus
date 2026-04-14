import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import MultiExchangeAggregator from "@/components/trading/MultiExchangeAggregator";
import ExchangeConnector from "@/components/exchange/ExchangeConnector";
import ArbitrageScanner from "@/components/exchange/ArbitrageScanner";
import UnifiedOrderBook from "@/components/exchange/UnifiedOrderBook";
import { useSupportedChains, useSupportedExchanges } from "@/hooks/useSupportedNetworks";
import { Globe, Layers, Shield, Zap, Link2 } from "lucide-react";

const ExchangeHub = () => {
  const { chains, loading: chainsLoading, getChainsByType } = useSupportedChains();
  const { exchanges, loading: exchangesLoading, getCexExchanges, getDexExchanges } = useSupportedExchanges();

  const chainTypeIcons: Record<string, React.ReactNode> = {
    layer1: <Globe className="h-3 w-3 sm:h-4 sm:w-4" />,
    layer2: <Layers className="h-3 w-3 sm:h-4 sm:w-4" />,
    privacy: <Shield className="h-3 w-3 sm:h-4 sm:w-4" />,
    sidechain: <Link2 className="h-3 w-3 sm:h-4 sm:w-4" />,
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <div className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-3xl font-bold">Multi-Exchange Hub</h1>
          <p className="text-muted-foreground mt-1 text-xs sm:text-sm">
            100+ exchanges • 30+ blockchains • CCXT architecture
          </p>
          <div className="flex gap-1.5 sm:gap-2 mt-2 sm:mt-3">
            <Badge variant="outline" className="text-emerald-500 border-emerald-500 text-[10px] sm:text-xs">
              {chains.length} Chains
            </Badge>
            <Badge variant="outline" className="text-blue-500 border-blue-500 text-[10px] sm:text-xs">
              {exchanges.length} Exchanges
            </Badge>
            <Badge variant="outline" className="text-purple-500 border-purple-500 text-[10px] sm:text-xs">
              5000+ Pairs
            </Badge>
          </div>
        </div>

        <Tabs defaultValue="aggregator" className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="aggregator" className="text-[9px] sm:text-sm px-1">Prices</TabsTrigger>
            <TabsTrigger value="networks" className="text-[9px] sm:text-sm px-1">Networks</TabsTrigger>
            <TabsTrigger value="connect" className="text-[9px] sm:text-sm px-1">Connect</TabsTrigger>
            <TabsTrigger value="arbitrage" className="text-[9px] sm:text-sm px-1">Arb</TabsTrigger>
            <TabsTrigger value="orderbook" className="text-[9px] sm:text-sm px-1">Book</TabsTrigger>
          </TabsList>

          <TabsContent value="aggregator">
            <MultiExchangeAggregator />
          </TabsContent>

          <TabsContent value="networks" className="space-y-4 sm:space-y-6">
            <Card>
              <CardHeader className="p-3 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                  <Globe className="h-4 w-4 sm:h-5 sm:w-5" />
                  Blockchains ({chains.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3">
                  {chains.map(chain => (
                    <div key={chain.id} className="p-2 sm:p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-1.5 mb-0.5 sm:mb-1">
                        {chainTypeIcons[chain.chain_type] || <Zap className="h-3 w-3 sm:h-4 sm:w-4" />}
                        <span className="font-medium text-xs sm:text-sm">{chain.symbol}</span>
                      </div>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">{chain.name}</p>
                      <div className="flex gap-1 mt-1.5 sm:mt-2 flex-wrap">
                        <Badge variant="outline" className="text-[9px] sm:text-xs">{chain.chain_type}</Badge>
                        {chain.is_evm_compatible && (
                          <Badge variant="secondary" className="text-[9px] sm:text-xs">EVM</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="p-3 sm:p-6">
                <CardTitle className="text-sm sm:text-base">CEX ({getCexExchanges().length})</CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3">
                  {getCexExchanges().map(exchange => (
                    <div key={exchange.id} className="p-2 sm:p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                      <span className="font-medium text-xs sm:text-sm">{exchange.name}</span>
                      <div className="flex gap-1 mt-1.5 sm:mt-2 flex-wrap">
                        {exchange.features?.spot && <Badge variant="outline" className="text-[9px] sm:text-xs">Spot</Badge>}
                        {exchange.features?.futures && <Badge variant="outline" className="text-[9px] sm:text-xs">Futures</Badge>}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="p-3 sm:p-6">
                <CardTitle className="text-sm sm:text-base">DEX ({getDexExchanges().length})</CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3">
                  {getDexExchanges().map(exchange => (
                    <div key={exchange.id} className="p-2 sm:p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                      <span className="font-medium text-xs sm:text-sm">{exchange.name}</span>
                      <div className="flex gap-1 mt-1.5 sm:mt-2 flex-wrap">
                        {exchange.supported_chains.slice(0, 2).map(chain => (
                          <Badge key={chain} variant="secondary" className="text-[9px] sm:text-xs">{chain}</Badge>
                        ))}
                        {exchange.supported_chains.length > 2 && (
                          <Badge variant="outline" className="text-[9px] sm:text-xs">+{exchange.supported_chains.length - 2}</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="connect"><ExchangeConnector /></TabsContent>
          <TabsContent value="arbitrage"><ArbitrageScanner /></TabsContent>
          <TabsContent value="orderbook"><UnifiedOrderBook /></TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
};

export default ExchangeHub;
