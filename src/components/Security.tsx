import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Lock, Eye, CheckCircle, Globe, Users, Award, Server, FileCheck } from "lucide-react";

const securityFeatures = [
  { icon: Shield, title: "SHA-3 2048-bit Encryption", description: "Military-grade encryption with FIPS 204-206 compliance" },
  { icon: Lock, title: "Quantum-Resistant Security", description: "Future-proof cryptographic signatures and keys" },
  { icon: Eye, title: "Real-Time Monitoring", description: "24/7 threat detection and automated response" },
  { icon: Server, title: "Distributed Infrastructure", description: "Redundant systems across global data centers" },
];

const compliance = [
  { name: "FIPS 204", description: "Digital Signatures" },
  { name: "FIPS 205", description: "Key Encapsulation" },
  { name: "FIPS 203", description: "Encryption Standards" },
  { name: "FIPS 206", description: "Hash Functions" },
  { name: "ISO 27001", description: "Information Security" },
  { name: "SOC 2 Type II", description: "Security Controls" },
];

const Security = () => (
  <section className="py-12 md:py-24 bg-gradient-hero text-white">
    <div className="max-w-7xl mx-auto px-4">
      {/* Header */}
      <div className="text-center mb-8 md:mb-16">
        <Badge variant="outline" className="mb-3 md:mb-6 glass-effect border-white/30 text-white text-xs">
          <Award className="w-3.5 h-3.5 mr-1.5" />
          Institutional-Grade Security
        </Badge>
        <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold mb-3 md:mb-6">
          Your Assets Are
          <span className="text-gradient-gold block mt-1 animate-glow">Completely Secure</span>
        </h2>
        <p className="text-sm md:text-xl text-white/90 max-w-3xl mx-auto">
          We employ the same security standards used by central banks and military institutions.
        </p>
      </div>

      {/* Security Features Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-8 md:mb-16">
        {securityFeatures.map((feature) => {
          const Icon = feature.icon;
          return (
            <Card key={feature.title} className="glass-effect p-3 md:p-6 border-white/20 group hover:bg-white/20 transition-smooth">
              <div className="text-center space-y-2 md:space-y-4">
                <div className="inline-flex p-2 md:p-3 rounded-full bg-gold/20">
                  <Icon className="w-5 h-5 md:w-8 md:h-8 text-gold" />
                </div>
                <h3 className="text-xs md:text-lg font-semibold text-white">{feature.title}</h3>
                <p className="text-white/80 text-[10px] md:text-sm leading-relaxed hidden sm:block">{feature.description}</p>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Compliance & Trust */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-12 items-start">
        <div>
          <h3 className="text-xl md:text-3xl font-bold mb-3 md:mb-6">Regulatory Compliance</h3>
          <p className="text-white/90 mb-4 md:mb-8 text-xs md:text-lg leading-relaxed">
            AIQTP adheres to the highest international standards for financial services, data protection, and cryptographic security.
          </p>
          <div className="grid grid-cols-2 gap-2 md:gap-4">
            {compliance.map((cert) => (
              <div key={cert.name} className="flex items-center space-x-2 p-2 md:p-3 glass-effect rounded-lg border-white/20">
                <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
                <div>
                  <div className="font-semibold text-white text-[11px] md:text-sm">{cert.name}</div>
                  <div className="text-white/70 text-[9px] md:text-xs">{cert.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3 md:space-y-6">
          {[
            { icon: Users, title: "One Account Per Person", desc: "Single SSN/EIN verification eliminates fake accounts and ensures marketplace integrity.", color: "text-gold" },
            { icon: Globe, title: "Global Coverage", desc: "Operating in 200+ countries with local regulatory compliance and 24/7 support.", color: "text-accent" },
            { icon: FileCheck, title: "Asset Protection", desc: "All assets backed by comprehensive insurance policies and institutional-grade custody.", color: "text-gold" },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.title} className="glass-effect p-4 md:p-8 border-white/20">
                <div className="flex items-start gap-3 md:text-center md:flex-col md:items-center space-y-0 md:space-y-3">
                  <Icon className={`w-8 h-8 md:w-12 md:h-12 ${item.color} flex-shrink-0`} />
                  <div>
                    <h4 className="text-sm md:text-2xl font-bold text-white mb-1">{item.title}</h4>
                    <p className="text-white/80 text-[11px] md:text-base">{item.desc}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  </section>
);

export default Security;
