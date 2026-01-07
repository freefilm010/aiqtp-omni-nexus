import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AccountConnections from "@/components/connections/AccountConnections";

const ConnectionsPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <AccountConnections />
      </main>
      <Footer />
    </div>
  );
};

export default ConnectionsPage;
