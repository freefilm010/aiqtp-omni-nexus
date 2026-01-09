import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Watchlist from "@/components/trading/Watchlist";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, TrendingUp, Bell, LayoutGrid } from "lucide-react";

const WatchlistPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Star className="h-6 w-6 text-amber-500" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">My Watchlist</h1>
              <p className="text-muted-foreground">
                Track your favorite assets • Real-time prices • Price alerts
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Watchlist */}
          <div className="lg:col-span-2">
            <Watchlist />
          </div>

          {/* Quick Stats & Tips */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                  Watchlist Stats
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-sm">Total Assets</span>
                    <Badge variant="secondary">4</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-sm">Alerts Active</span>
                    <Badge variant="secondary" className="bg-amber-500/20 text-amber-500">2</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-sm">Gainers Today</span>
                    <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-500">3</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-sm">Losers Today</span>
                    <Badge variant="secondary" className="bg-red-500/20 text-red-500">1</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Bell className="h-4 w-4 text-amber-500" />
                  Price Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Set price alerts to get notified when assets reach your target price.
                </p>
                <div className="space-y-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    Above target = Sell signal
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-red-500" />
                    Below target = Buy signal
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <LayoutGrid className="h-4 w-4" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  • Click + to add new assets
                </p>
                <p className="text-xs text-muted-foreground">
                  • Click ⋮ for alert & remove options
                </p>
                <p className="text-xs text-muted-foreground">
                  • Prices update every 2 seconds
                </p>
                <p className="text-xs text-muted-foreground">
                  • Sign in to save your watchlist
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default WatchlistPage;
