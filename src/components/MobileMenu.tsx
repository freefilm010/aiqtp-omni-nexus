import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, Home, Wallet, ExternalLink, LogOut, User } from "lucide-react";
import type { User as AuthUser } from "@supabase/supabase-js";

interface NavLink {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface PopoutLink {
  tool: string;
  label: string;
}

interface MobileMenuProps {
  user: AuthUser | null;
  signOut: () => void;
  onClose: () => void;
  openPopout: (tool: string) => void;
  tradingLinks: NavLink[];
  agentLinks: NavLink[];
  aiQuantumLinks: NavLink[];
  strategyLinks: NavLink[];
  assetLinks: NavLink[];
  infoLinks: NavLink[];
  moreLinks: NavLink[];
  popoutLinks: PopoutLink[];
}

const CollapsibleSection = ({ 
  title, 
  links, 
  onClose 
}: { 
  title: string; 
  links: NavLink[]; 
  onClose: () => void;
}) => {
  const [open, setOpen] = useState(false);
  
  return (
    <div className="border-b border-border/30">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full px-4 py-3 text-sm font-semibold text-foreground hover:bg-accent/50 transition-colors"
      >
        <span className="uppercase tracking-wider text-xs text-muted-foreground">{title}</span>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="pb-2 px-2">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-accent text-foreground text-sm transition-colors"
              onClick={onClose}
            >
              <link.icon className="h-4 w-4 text-muted-foreground" />
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

const MobileMenu = ({
  user,
  signOut,
  onClose,
  openPopout,
  tradingLinks,
  agentLinks,
  aiQuantumLinks,
  strategyLinks,
  assetLinks,
  infoLinks,
  moreLinks,
  popoutLinks,
}: MobileMenuProps) => {
  return (
    <div className="md:hidden border-t border-border/30 max-h-[80vh] overflow-y-auto bg-background/95 backdrop-blur-lg">
      <nav>
        {/* Quick Access - Always Visible */}
        <div className="px-2 py-2 border-b border-border/30">
          <Link
            to="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-accent text-foreground font-medium transition-colors"
            onClick={onClose}
          >
            <Home className="h-4 w-4" />
            Home
          </Link>
          <Link
            to="/wallet-assets"
            className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-accent text-foreground font-medium transition-colors"
            onClick={onClose}
          >
            <Wallet className="h-4 w-4" />
            Assets & Wallets
          </Link>
        </div>

        {/* Collapsible Sections */}
        <CollapsibleSection title="Trading" links={tradingLinks} onClose={onClose} />
        <CollapsibleSection title="AI Agents" links={agentLinks} onClose={onClose} />
        <CollapsibleSection title="AI & Quantum" links={aiQuantumLinks} onClose={onClose} />
        <CollapsibleSection title="Strategies" links={strategyLinks} onClose={onClose} />
        <CollapsibleSection title="Assets & Tools" links={assetLinks} onClose={onClose} />
        <CollapsibleSection title="Information" links={infoLinks} onClose={onClose} />
        <CollapsibleSection title="More" links={moreLinks} onClose={onClose} />

        {/* Popouts */}
        <div className="border-b border-border/30">
          <div className="px-4 py-2">
            <span className="uppercase tracking-wider text-xs text-muted-foreground font-semibold">Multi-Monitor</span>
          </div>
          <div className="px-2 pb-2">
            {popoutLinks.map((link) => (
              <button
                key={link.tool}
                onClick={() => { openPopout(link.tool); onClose(); }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-accent text-foreground text-sm w-full text-left transition-colors"
              >
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
                {link.label}
              </button>
            ))}
          </div>
        </div>

        {/* User Actions */}
        <div className="px-2 py-3">
          {user ? (
            <div className="space-y-1">
              <div className="px-3 py-2 text-xs text-muted-foreground truncate">{user.email}</div>
              <button
                onClick={() => { signOut(); onClose(); }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-accent text-foreground text-sm w-full text-left transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Log Out
              </button>
            </div>
          ) : (
            <Link
              to="/auth"
              className="flex items-center gap-3 px-3 py-2.5 rounded-md bg-primary text-primary-foreground font-medium text-sm transition-colors"
              onClick={onClose}
            >
              <User className="h-4 w-4" />
              Sign In / Get Started
            </Link>
          )}
        </div>
      </nav>
    </div>
  );
};

export default MobileMenu;
