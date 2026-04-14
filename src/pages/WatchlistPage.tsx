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
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <div className="mb-4 sm:mb-8">
          <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Star className="h-4 w-4 sm:h-6 sm:w-6 text-amber-500" />
            </div>
            <div>
              <h1 className="text-xl sm:text-3xl font-bold">My Watchlist</h1>
              <p className="text-muted-foreground text-xs sm:text-sm">
                Track assets • Real-time prices • Alerts
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="lg:col-span-2">
            <Watchlist />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-1 gap-3 sm:gap-4">
            <Card>
              <CardHeader className="pb-2 p-3 sm:p-6 sm:pb-2">
                <CardTitle className="text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2">
                  <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-emerald-500" />
                  Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-xs">Assets</span>
                    <Badge variant="secondary" className="text-[10px] sm:text-xs">4</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-xs">Alerts</span>
                    <Badge variant="secondary" className="bg-amber-500/20 text-amber-500 text-[10px] sm:text-xs">2</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-xs">Gainers</span>
                    <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-500 text-[10px] sm:text-xs">3</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2 p-3 sm:p-6 sm:pb-2">
                <CardTitle className="text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2">
                  <Bell className="h-3 w-3 sm:h-4 sm:w-4 text-amber-500" />
                  Alerts
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
                <div className="space-y-1.5 text-[10px] sm:text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Above = Sell
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                    Below = Buy
                  </div>
                </div>
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
