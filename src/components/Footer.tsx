import { Link } from "react-router-dom";
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
  Github,
  Accessibility,
  AlertTriangle,
  MessageCircle,
  Send
} from "lucide-react";
import { LEGAL_DISCLAIMERS } from "@/lib/fees/platformFees";

const Footer = () => {
  return (
    <footer className="bg-gradient-hero text-white">
      <div className="max-w-7xl mx-auto px-4">
        {/* Risk Warning Banner */}
        <div className="py-4 border-b border-white/10">
          <div className="flex items-start gap-3 text-xs text-white/70 bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
            <AlertTriangle className="h-4 w-4 text-yellow-500 shrink-0 mt-0.5" />
            <p>
              <strong className="text-yellow-400">RISK WARNING:</strong> Trading cryptocurrencies, digital assets, and other financial instruments involves substantial risk. 
              Past performance is not indicative of future results. Not financial advice. Never invest more than you can afford to lose.
            </p>
          </div>
        </div>

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
            
            <div className="flex flex-wrap gap-2">
              <Button variant="glass" size="icon" asChild>
                <a href="https://twitter.com/aiqtp" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
                  <Twitter className="w-4 h-4" />
                </a>
              </Button>
              <Button variant="glass" size="icon" asChild>
                <a href="https://discord.gg/aiqtp" target="_blank" rel="noopener noreferrer" aria-label="Discord">
                  <MessageCircle className="w-4 h-4" />
                </a>
              </Button>
              <Button variant="glass" size="icon" asChild>
                <a href="https://t.me/aiqtp" target="_blank" rel="noopener noreferrer" aria-label="Telegram">
                  <Send className="w-4 h-4" />
                </a>
              </Button>
              <Button variant="glass" size="icon" asChild>
                <a href="https://youtube.com/@aiqtp" target="_blank" rel="noopener noreferrer" aria-label="YouTube">
                  <Youtube className="w-4 h-4" />
                </a>
              </Button>
              <Button variant="glass" size="icon" asChild>
                <a href="https://github.com/aiqtp" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
                  <Github className="w-4 h-4" />
                </a>
              </Button>
              <Button variant="glass" size="icon" asChild>
                <a href="https://linkedin.com/company/aiqtp" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                  <Linkedin className="w-4 h-4" />
                </a>
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
                <li><Link to="/legal" className="hover:text-gold transition-smooth">Risk Disclaimers</Link></li>
                <li><a href="#" className="hover:text-gold transition-smooth">Compliance</a></li>
                <li><a href="#" className="hover:text-gold transition-smooth">Security</a></li>
                <li>
                  <Link to="/settings/accessibility" className="hover:text-gold transition-smooth flex items-center gap-1">
                    <Accessibility className="w-3 h-3" />
                    Accessibility
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Full Legal Disclaimer Section */}
        <div className="py-6 border-t border-white/10 space-y-4">
          <div className="text-[10px] text-white/50 leading-relaxed space-y-3">
            <p>
              <strong>⚠️ RISK DISCLOSURE:</strong> Trading cryptocurrencies, digital assets, NFTs, and other financial instruments involves substantial risk of loss and is not suitable for all investors. The possibility exists that you could sustain a loss of some or all of your initial investment.
            </p>
            <p>
              <strong>📋 NOT FINANCIAL ADVICE:</strong> AIQTP does not provide investment, legal, or tax advice. All content is for informational purposes only. We are not a registered broker-dealer, investment adviser, or financial institution.
            </p>
            <p>
              <strong>🖼️ VISUAL PURPOSES:</strong> All images, charts, and visual representations are for illustrative purposes only and do not represent actual trading results or guaranteed outcomes.
            </p>
            <p>
              <strong>💰 FEES:</strong> All fees subject to change. Actual costs may vary based on network conditions, gas fees, and third-party services. $20 minimum investment. Platform earns 9%/6%/3%/1% on profits only.
            </p>
            <p>
              <strong>🤖 AI DISCLAIMER:</strong> AI predictions are experimental technologies and may produce inaccurate results. Do not use as sole basis for trading decisions.
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="py-8 border-t border-white/20 flex flex-col md:flex-row justify-between items-center">
          <div className="text-white/70 text-sm mb-4 md:mb-0">
            © {new Date().getFullYear()} AIQTP Global Marketplace. All rights reserved.
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