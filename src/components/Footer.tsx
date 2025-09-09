import { Button } from "@/components/ui/button";
import { 
  Zap, 
  Mail, 
  Phone, 
  MapPin, 
  Globe, 
  Shield, 
  Twitter, 
  Linkedin, 
  Youtube,
  Github
} from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-gradient-hero text-white">
      <div className="max-w-7xl mx-auto px-4">
        {/* Main Footer Content */}
        <div className="py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Company Info */}
          <div className="space-y-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-gold rounded-lg flex items-center justify-center">
                <Zap className="w-6 h-6 text-gold-foreground font-bold" />
              </div>
              <div>
                <div className="text-xl font-bold">AIQTP</div>
                <div className="text-sm text-white/70">Global Marketplace</div>
              </div>
            </div>
            
            <p className="text-white/80 leading-relaxed">
              The world's most comprehensive asset trading platform, combining traditional 
              finance with cutting-edge blockchain technology.
            </p>
            
            <div className="flex space-x-4">
              <Button variant="glass" size="icon">
                <Twitter className="w-4 h-4" />
              </Button>
              <Button variant="glass" size="icon">
                <Linkedin className="w-4 h-4" />
              </Button>
              <Button variant="glass" size="icon">
                <Youtube className="w-4 h-4" />
              </Button>
              <Button variant="glass" size="icon">
                <Github className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Products */}
          <div>
            <h3 className="text-lg font-semibold mb-6">Products</h3>
            <ul className="space-y-3 text-white/80">
              <li><a href="#" className="hover:text-gold transition-smooth">Cryptocurrency Trading</a></li>
              <li><a href="#" className="hover:text-gold transition-smooth">Real Estate Investment</a></li>
              <li><a href="#" className="hover:text-gold transition-smooth">Precious Metals</a></li>
              <li><a href="#" className="hover:text-gold transition-smooth">Collectibles Market</a></li>
              <li><a href="#" className="hover:text-gold transition-smooth">Lightning Vault</a></li>
              <li><a href="#" className="hover:text-gold transition-smooth">Virtual Assets</a></li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-lg font-semibold mb-6">Services</h3>
            <ul className="space-y-3 text-white/80">
              <li><a href="#" className="hover:text-gold transition-smooth">Institutional Trading</a></li>
              <li><a href="#" className="hover:text-gold transition-smooth">Asset Management</a></li>
              <li><a href="#" className="hover:text-gold transition-smooth">Insurance Products</a></li>
              <li><a href="#" className="hover:text-gold transition-smooth">Cross-Chain Bridge</a></li>
              <li><a href="#" className="hover:text-gold transition-smooth">AI Trading Bots</a></li>
              <li><a href="#" className="hover:text-gold transition-smooth">Market Analytics</a></li>
            </ul>
          </div>

          {/* Contact & Legal */}
          <div>
            <h3 className="text-lg font-semibold mb-6">Contact</h3>
            <div className="space-y-4 text-white/80">
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-gold" />
                <span>support@aiqtp.com</span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-gold" />
                <span>+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center space-x-3">
                <Globe className="w-5 h-5 text-gold" />
                <span>200+ Countries</span>
              </div>
              <div className="flex items-center space-x-3">
                <Shield className="w-5 h-5 text-gold" />
                <span>SHA-3 2048-bit Secure</span>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-white/20">
              <ul className="space-y-2 text-sm text-white/70">
                <li><a href="#" className="hover:text-gold transition-smooth">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-gold transition-smooth">Terms of Service</a></li>
                <li><a href="#" className="hover:text-gold transition-smooth">Compliance</a></li>
                <li><a href="#" className="hover:text-gold transition-smooth">Security</a></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="py-8 border-t border-white/20 flex flex-col md:flex-row justify-between items-center">
          <div className="text-white/70 text-sm mb-4 md:mb-0">
            © 2024 AIQTP Global Marketplace. All rights reserved.
          </div>
          
          <div className="flex flex-wrap items-center gap-6 text-sm text-white/70">
            <span>🔒 FIPS 204-206 Compliant</span>
            <span>🌍 ISO 27001 Certified</span>
            <span>⚡ Lightning Network</span>
            <span>🛡️ Quantum Resistant</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;