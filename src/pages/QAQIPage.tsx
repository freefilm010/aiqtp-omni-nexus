import Header from "@/components/Header";
import Footer from "@/components/Footer";
import QAQIAgent from "@/components/qaqi/QAQIAgent";

const QAQIPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 pt-24">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">QAQI Agent</h1>
            <span className="px-2 py-1 text-xs font-mono bg-purple-500/20 text-purple-500 rounded">
              AUTONOMOUS // OMEGA
            </span>
          </div>
          <p className="text-muted-foreground">
            Quantum Artificial Qubit Intelligent Agent • Deep Learning • Pattern Recognition • Autonomous Execution
          </p>
        </div>
        <QAQIAgent />
      </main>
      <Footer />
    </div>
  );
};

export default QAQIPage;
