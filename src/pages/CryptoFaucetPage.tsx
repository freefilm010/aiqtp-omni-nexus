import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CryptoFaucet from "@/components/faucet/CryptoFaucet";

const CryptoFaucetPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Crypto Faucet</h1>
          <p className="text-muted-foreground mt-1">
            Claim testnet tokens • Build and test without risk
          </p>
        </div>
        <CryptoFaucet />
      </main>
      <Footer />
    </div>
  );
};

export default CryptoFaucetPage;
