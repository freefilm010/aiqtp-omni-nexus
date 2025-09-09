import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, 
  Lock, 
  Eye, 
  CheckCircle, 
  Globe, 
  Zap,
  Users,
  Award,
  Server,
  FileCheck
} from "lucide-react";

const securityFeatures = [
  {
    icon: Shield,
    title: "SHA-3 2048-bit Encryption",
    description: "Military-grade encryption with FIPS 204-206 compliance"
  },
  {
    icon: Lock,
    title: "Quantum-Resistant Security",
    description: "Future-proof cryptographic signatures and keys"
  },
  {
    icon: Eye,
    title: "Real-Time Monitoring",
    description: "24/7 threat detection and automated response systems"
  },
  {
    icon: Server,
    title: "Distributed Infrastructure",
    description: "Redundant systems across multiple global data centers"
  }
];

const compliance = [
  { name: "FIPS 204", description: "Digital Signatures" },
  { name: "FIPS 205", description: "Key Encapsulation" },
  { name: "FIPS 203", description: "Encryption Standards" },
  { name: "FIPS 206", description: "Hash Functions" },
  { name: "ISO 27001", description: "Information Security" },
  { name: "SOC 2 Type II", description: "Security Controls" }
];

const Security = () => {
  return (
    <section className="py-24 bg-gradient-hero text-white">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-6 glass-effect border-white/30 text-white">
            <Award className="w-4 h-4 mr-2" />
            Institutional-Grade Security
          </Badge>
          
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Your Assets Are
            <span className="text-gradient-gold block mt-2 animate-glow">
              Completely Secure
            </span>
          </h2>
          
          <p className="text-xl text-white/90 max-w-3xl mx-auto">
            We employ the same security standards used by central banks and military institutions 
            to protect your digital and physical assets.
          </p>
        </div>

        {/* Security Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {securityFeatures.map((feature, index) => {
            const Icon = feature.icon;
            
            return (
              <Card 
                key={feature.title}
                className="glass-effect p-6 border-white/20 group hover:bg-white/20 transition-smooth"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="text-center space-y-4">
                  <div className="inline-flex p-3 rounded-full bg-gold/20 group-hover:bg-gold/30 transition-smooth">
                    <Icon className="w-8 h-8 text-gold" />
                  </div>
                  
                  <h3 className="text-lg font-semibold text-white">
                    {feature.title}
                  </h3>
                  
                  <p className="text-white/80 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Compliance & Trust */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h3 className="text-3xl font-bold mb-6">
              Regulatory Compliance
            </h3>
            <p className="text-white/90 mb-8 text-lg leading-relaxed">
              AIQTP adheres to the highest international standards for financial services, 
              data protection, and cryptographic security. Our compliance framework ensures 
              your investments are protected under multiple jurisdictions.
            </p>
            
            <div className="grid grid-cols-2 gap-4">
              {compliance.map((cert, index) => (
                <div 
                  key={cert.name}
                  className="flex items-center space-x-3 p-3 glass-effect rounded-lg border-white/20"
                >
                  <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />
                  <div>
                    <div className="font-semibold text-white text-sm">{cert.name}</div>
                    <div className="text-white/70 text-xs">{cert.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <Card className="glass-effect p-8 border-white/20">
              <div className="text-center space-y-4">
                <Users className="w-12 h-12 text-gold mx-auto" />
                <h4 className="text-2xl font-bold text-white">One Account Per Person</h4>
                <p className="text-white/80">
                  Single SSN/EIN verification eliminates fake accounts and ensures marketplace integrity. 
                  Maximum one business account per entity, multiple personal accounts per household allowed.
                </p>
              </div>
            </Card>

            <Card className="glass-effect p-8 border-white/20">
              <div className="text-center space-y-4">
                <Globe className="w-12 h-12 text-accent mx-auto" />
                <h4 className="text-2xl font-bold text-white">Global Coverage</h4>
                <p className="text-white/80">
                  Operating in 200+ countries with local regulatory compliance, 
                  native payment methods, and 24/7 multilingual support.
                </p>
              </div>
            </Card>

            <Card className="glass-effect p-8 border-white/20">
              <div className="text-center space-y-4">
                <FileCheck className="w-12 h-12 text-gold mx-auto" />
                <h4 className="text-2xl font-bold text-white">Asset Protection</h4>
                <p className="text-white/80">
                  All assets backed by comprehensive insurance policies, 
                  segregated custody, and institutional-grade vault security.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Security;