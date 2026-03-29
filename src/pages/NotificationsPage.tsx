import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TradePushNotifications from "@/components/notifications/TradePushNotifications";

const NotificationsPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 pt-24">
        <TradePushNotifications />
      </main>
      <Footer />
    </div>
  );
};

export default NotificationsPage;
