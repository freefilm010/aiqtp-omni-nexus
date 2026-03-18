import { lazy, Suspense } from "react";
import Header from "@/components/Header";

const CapitolTradesDashboard = lazy(() => import("@/components/capitol/CapitolTradesDashboard"));

const CapitolTradesPage = () => (
  <div className="min-h-screen bg-background">
    <Header />
    <main className="pt-20">
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        }
      >
        <CapitolTradesDashboard />
      </Suspense>
    </main>
  </div>
);

export default CapitolTradesPage;
