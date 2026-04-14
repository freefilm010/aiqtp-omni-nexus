import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TradePushNotifications from "@/components/notifications/TradePushNotifications";

const NotificationsPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 pt-20 sm:pt-24">
        <TradePushNotifications />
      </main>
      <Footer />
    </div>
  );
};

export default NotificationsPage;
