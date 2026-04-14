import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CryptoNewsFeed from "@/components/news/CryptoNewsFeed";

const NewsFeedPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <div className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-3xl font-bold">Crypto News Feed</h1>
          <p className="text-muted-foreground mt-1 text-xs sm:text-sm">
            Real-time market news • AI sentiment analysis
          </p>
        </div>
        <CryptoNewsFeed />
      </main>
      <Footer />
    </div>
  );
};

export default NewsFeedPage;
