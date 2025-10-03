import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Menu, 
  X, 
  Zap, 
  ChevronDown, 
  Globe,
  User,
  Settings
} from "lucide-react";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-effect border-b border-white/20">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-gold rounded-lg flex items-center justify-center">
              <Zap className="w-6 h-6 text-gold-foreground font-bold" />
            </div>
            <div>
              <div className="text-xl font-bold text-foreground">AIQTP</div>
              <div className="text-xs text-muted-foreground">Global Marketplace</div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <div className="flex items-center space-x-1 text-foreground hover:text-gold cursor-pointer transition-smooth">
              <span>Markets</span>
              <ChevronDown className="w-4 h-4" />
            </div>
            <Link to="/trading" className="flex items-center space-x-1 text-foreground hover:text-gold transition-smooth">
              <span>Trading</span>
            </Link>
            <Link to="/vault" className="flex items-center space-x-1 text-foreground hover:text-gold transition-smooth">
              <span>Vault</span>
              <Zap className="w-4 h-4" />
            </Link>
            <span className="text-foreground hover:text-gold cursor-pointer transition-smooth">Security</span>
            <span className="text-foreground hover:text-gold cursor-pointer transition-smooth">Support</span>
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            <Badge variant="outline" className="text-xs">
              <Globe className="w-3 h-3 mr-1" />
              200+ Countries
            </Badge>
            <Button variant="ghost" size="sm">
              <User className="w-4 h-4 mr-2" />
              Sign In
            </Button>
            <Button variant="premium" size="sm">
              Get Started
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-foreground hover:text-gold transition-smooth"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-white/20">
            <nav className="space-y-4">
              <div className="text-foreground hover:text-gold cursor-pointer transition-smooth py-2">
                Markets
              </div>
              <Link to="/trading" className="block text-foreground hover:text-gold transition-smooth py-2">
                Trading
              </Link>
              <Link to="/vault" className="flex items-center space-x-2 text-foreground hover:text-gold transition-smooth py-2">
                <Zap className="w-4 h-4" />
                <span>Lightning Vault</span>
              </Link>
              <div className="text-foreground hover:text-gold cursor-pointer transition-smooth py-2">
                Security
              </div>
              <div className="text-foreground hover:text-gold cursor-pointer transition-smooth py-2">
                Support
              </div>
              
              <div className="pt-4 space-y-3">
                <Button variant="ghost" className="w-full justify-start">
                  <User className="w-4 h-4 mr-2" />
                  Sign In
                </Button>
                <Button variant="premium" className="w-full">
                  Get Started
                </Button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;