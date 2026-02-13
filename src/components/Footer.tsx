import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import GitHubEcosystem from "@/components/github/GitHubEcosystem";
import { GITHUB_USERNAME } from "@/lib/github/repositories";
import { useAdminAuth } from "@/hooks/useAdminAuth";
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
  Send,
  Activity,
  LineChart,
  Crosshair,
  TrendingUp,
  Layers,
  Atom,
  Brain,
  Cpu,
  FlaskConical,
  Target,
  ShoppingCart,
  LayoutGrid,
  BarChart3,
  Calendar,
  Newspaper,
  BellRing,
  BookOpen,
  Music,
  DollarSign,
  Percent,
  Bot,
  Coins,
  Trophy
} from "lucide-react";

const Footer = () => {
  const { isAdmin } = useAdminAuth();
  // All navigation links matching the app routes
  const tradingLinks = [
    { to: "/trading", label: "Trading Dashboard", icon: Activity },
    { to: "/advanced-trading", label: "Advanced Trading", icon: LineChart },
    { to: "/exchange", label: "Exchange Hub", icon: Globe },
    { to: "/defi-sniper", label: "DeFi Sniper", icon: Crosshair },
    { to: "/screener", label: "Crypto Screener", icon: TrendingUp },
    { to: "/derivatives", label: "Derivatives", icon: Layers },
    { to: "/cockpit", label: "Trading Cockpit", icon: LayoutGrid },
    { to: "/social", label: "Copy Trading", icon: Activity },
    { to: "/vault", label: "Lightning Vault", icon: Zap },
    { to: "/portfolio", label: "Portfolio", icon: BarChart3 },
    { to: "/watchlist", label: "Watchlist", icon: TrendingUp },
  ];

  const aiQuantumLinks = [
    { to: "/qaqi", label: "QAQI™ Agent", icon: Atom },
    { to: "/ai-lab", label: "AI Research Lab", icon: Brain },
    { to: "/ml-predictions", label: "ML Predictions", icon: Cpu },
    { to: "/quantum-lab", label: "Quantum Lab", icon: FlaskConical },
    { to: "/titan-codex", label: "Titan Codex™", icon: Shield },
    { to: "/ai-assistant", label: "AI Assistant", icon: Bot },
    { to: "/intelligence", label: "Market Intelligence", icon: Brain },
  ];

  const strategyLinks = [
    { to: "/strategy-studio", label: "Strategy Studio", icon: Target },
    { to: "/strategy-lab", label: "Strategy Lab", icon: FlaskConical },
    { to: "/marketplace", label: "Strategy Marketplace", icon: ShoppingCart },
    { to: "/risk", label: "Risk Management", icon: Shield },
  ];

  const assetLinks = [
    { to: "/nft-studio", label: "NFT Studio", icon: Layers },
    { to: "/token-launchpad", label: "Token Launchpad", icon: Zap },
    { to: "/faucet", label: "Crypto Faucet", icon: Crosshair },
    { to: "/connections", label: "Connections", icon: Globe },
    { to: "/data-ecosystem", label: "Data Ecosystem", icon: Layers },
  ];

  const infoLinks = [
    { to: "/news", label: "News Feed", icon: Newspaper },
    { to: "/calendar", label: "Economic Calendar", icon: Calendar },
    { to: "/alerts", label: "Market Alerts", icon: BellRing },
    { to: "/education", label: "Education Library", icon: BookOpen },
    { to: "/analytics", label: "Advanced Analytics", icon: BarChart3 },
  ];

  const moreLinks = [
    { to: "/media", label: "Media Hub", icon: Music },
    { to: "/revenue", label: "Revenue Center", icon: Coins },
    { to: "/pricing", label: "Pricing", icon: DollarSign },
    { to: "/fees", label: "Platform Fees", icon: Percent },
    { to: "/achievements", label: "Achievements", icon: Trophy },
    { to: "/institutional", label: "Institutional Services", icon: Shield },
    { to: "/admin", label: "Admin Dashboard", icon: Shield },
  ];

  const legalLinks = [
    { to: "/legal", label: "Risk Disclaimers" },
    { to: "/settings/accessibility", label: "Accessibility" },
  ];

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

        {/* Main Footer Navigation - Matches Header */}
        <div className="py-12 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
          {/* Trading */}
          <div>
            <h3 className="text-sm font-semibold mb-4 text-gold">Trading</h3>
            <ul className="space-y-2 text-xs text-white/70">
              {tradingLinks.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="hover:text-gold transition-smooth flex items-center gap-1.5">
                    <link.icon className="h-3 w-3" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* AI & Quantum */}
          <div>
            <h3 className="text-sm font-semibold mb-4 text-gold">AI & Quantum</h3>
            <ul className="space-y-2 text-xs text-white/70">
              {aiQuantumLinks.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="hover:text-gold transition-smooth flex items-center gap-1.5">
                    <link.icon className="h-3 w-3" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Strategies */}
          <div>
            <h3 className="text-sm font-semibold mb-4 text-gold">Strategies</h3>
            <ul className="space-y-2 text-xs text-white/70">
              {strategyLinks.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="hover:text-gold transition-smooth flex items-center gap-1.5">
                    <link.icon className="h-3 w-3" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Assets */}
          <div>
            <h3 className="text-sm font-semibold mb-4 text-gold">Assets</h3>
            <ul className="space-y-2 text-xs text-white/70">
              {assetLinks.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="hover:text-gold transition-smooth flex items-center gap-1.5">
                    <link.icon className="h-3 w-3" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Info */}
          <div>
            <h3 className="text-sm font-semibold mb-4 text-gold">Information</h3>
            <ul className="space-y-2 text-xs text-white/70">
              {infoLinks.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="hover:text-gold transition-smooth flex items-center gap-1.5">
                    <link.icon className="h-3 w-3" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* More */}
          <div>
            <h3 className="text-sm font-semibold mb-4 text-gold">More</h3>
            <ul className="space-y-2 text-xs text-white/70">
              {moreLinks.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="hover:text-gold transition-smooth flex items-center gap-1.5">
                    <link.icon className="h-3 w-3" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Company Info & Contact Row */}
        <div className="py-8 border-t border-white/10 grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-gold rounded-lg flex items-center justify-center">
                <Zap className="w-6 h-6 text-gold-foreground font-bold" />
              </div>
              <div>
                <div className="text-xl font-bold">AIQTP™</div>
                <div className="text-sm text-white/70">AI Quantum Trading Portal</div>
              </div>
            </div>
            
            <p className="text-white/80 text-sm leading-relaxed">
              The world's most comprehensive asset trading platform, combining traditional 
              finance with cutting-edge blockchain technology.
            </p>
          </div>

          {/* Contact */}
          <div className="space-y-3 text-white/80 text-sm">
            <h4 className="font-semibold text-white">Contact</h4>
            <div className="flex items-center space-x-3">
              <Mail className="w-4 h-4 text-gold" />
              <span>support@aiqtp.com</span>
            </div>
            <div className="flex items-center space-x-3">
              <Phone className="w-4 h-4 text-gold" />
              <span>+1 (555) 123-4567</span>
            </div>
            <div className="flex items-center space-x-3">
              <Globe className="w-4 h-4 text-gold" />
              <span>200+ Countries</span>
            </div>
            <div className="flex items-center space-x-3">
              <Shield className="w-4 h-4 text-gold" />
              <span>SHA-3 2048-bit Secure</span>
            </div>
          </div>

          {/* Social & Legal */}
          <div className="space-y-4">
            <h4 className="font-semibold text-white">Connect</h4>
            <div className="flex flex-wrap gap-2">
              <Button variant="glass" size="icon" asChild>
                <a href="https://twitter.com/aiqtp" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
                  <Twitter className="w-4 h-4" />
                </a>
              </Button>
              <Button variant="glass" size="icon" asChild>
                <a href="https://discord.gg/6BYH6ssDg" target="_blank" rel="noopener noreferrer" aria-label="Discord">
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
                <a href={`https://github.com/${GITHUB_USERNAME}`} target="_blank" rel="noopener noreferrer" aria-label="GitHub">
                  <Github className="w-4 h-4" />
                </a>
              </Button>
              <Button variant="glass" size="icon" asChild>
                <a href="https://linkedin.com/company/aiqtp" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                  <Linkedin className="w-4 h-4" />
                </a>
              </Button>
            </div>

            <ul className="flex flex-wrap gap-4 text-xs text-white/70 mt-4">
              {legalLinks.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="hover:text-gold transition-smooth flex items-center gap-1">
                    {link.label === "Accessibility" && <Accessibility className="w-3 h-3" />}
                    {link.label}
                  </Link>
                </li>
              ))}
              <li><a href="#" className="hover:text-gold transition-smooth">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-gold transition-smooth">Terms of Service</a></li>
            </ul>
          </div>
        </div>

        {/* GitHub Ecosystem Section - Admin Only */}
        {isAdmin && (
          <div className="py-8 border-t border-white/10">
            <GitHubEcosystem />
          </div>
        )}

        {/* Legal Disclaimer Section */}
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

        {/* Sitemap */}
        <div className="py-4 border-t border-white/10">
          <h4 className="text-xs font-semibold text-white/50 mb-3">SITEMAP</h4>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-white/40">
            <Link to="/" className="hover:text-gold">Home</Link>
            <Link to="/auth" className="hover:text-gold">Sign In</Link>
            {[...tradingLinks, ...aiQuantumLinks, ...strategyLinks, ...assetLinks, ...infoLinks, ...moreLinks].map((link) => (
              <Link key={link.to} to={link.to} className="hover:text-gold">{link.label}</Link>
            ))}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="py-8 border-t border-white/20 flex flex-col md:flex-row justify-between items-center">
          <div className="text-white/70 text-sm mb-4 md:mb-0">
            © {new Date().getFullYear()} AIQTP™ AI Quantum Trading Portal. All rights reserved.
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