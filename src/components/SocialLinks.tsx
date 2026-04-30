import { Button } from "@/components/ui/button";
import { MessageCircle, Send, ExternalLink, Rocket, BookOpen, Wallet, Globe } from "lucide-react";
import { Twitter, Youtube, Github, Linkedin } from "@/lib/icons/brand-icons";

interface SocialLink {
  name: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  hoverColor: string;
}

const SOCIAL_LINKS: SocialLink[] = [
  { 
    name: 'Twitter/X', 
    url: 'https://twitter.com/aiqtp', 
    icon: Twitter, 
    color: 'text-foreground',
    hoverColor: 'hover:text-blue-400'
  },
  { 
    name: 'Discord', 
    url: 'https://discord.gg/6BYH6ssDg', 
    icon: MessageCircle, 
    color: 'text-foreground',
    hoverColor: 'hover:text-indigo-400'
  },
  { 
    name: 'Telegram', 
    url: 'https://t.me/aiqtp', 
    icon: Send, 
    color: 'text-foreground',
    hoverColor: 'hover:text-blue-400'
  },
  { 
    name: 'YouTube', 
    url: 'https://youtube.com/@aiqtp', 
    icon: Youtube, 
    color: 'text-foreground',
    hoverColor: 'hover:text-red-500'
  },
  { 
    name: 'GitHub', 
    url: 'https://github.com/aiqtp', 
    icon: Github, 
    color: 'text-foreground',
    hoverColor: 'hover:text-purple-400'
  },
  { 
    name: 'LinkedIn', 
    url: 'https://linkedin.com/company/aiqtp', 
    icon: Linkedin, 
    color: 'text-foreground',
    hoverColor: 'hover:text-blue-600'
  },
];

// Extended ecosystem links for footer/dedicated section
export const ECOSYSTEM_LINKS: SocialLink[] = [
  { 
    name: 'Income Factory', 
    url: 'https://incomefactory.manus.space', 
    icon: Wallet, 
    color: 'text-foreground',
    hoverColor: 'hover:text-cyan-400'
  },
  { 
    name: 'Research Lab', 
    url: 'https://notebooklm.google.com/notebook/c03ec2a6-302e-4870-b1c3-19c452941f10', 
    icon: BookOpen, 
    color: 'text-foreground',
    hoverColor: 'hover:text-green-400'
  },
  { 
    name: 'Moonshot', 
    url: 'https://moonshot.com/8PqsearWtYHMuf1e8ytFPtHdqZGtz4tqKETEYYwAmoon?ref=gDNoh6', 
    icon: Rocket, 
    color: 'text-foreground',
    hoverColor: 'hover:text-orange-400'
  },
  { 
    name: 'FineTune AI', 
    url: 'https://ftn.ai/0556287174677364736', 
    icon: Globe, 
    color: 'text-foreground',
    hoverColor: 'hover:text-purple-400'
  },
];

interface SocialLinksProps {
  variant?: 'inline' | 'grid' | 'minimal';
  showLabels?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const SocialLinks = ({ variant = 'inline', showLabels = false, size = 'md' }: SocialLinksProps) => {
  const iconSize = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  }[size];

  const buttonSize = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12'
  }[size];

  if (variant === 'minimal') {
    return (
      <div className="flex items-center gap-4">
        {SOCIAL_LINKS.map((social) => (
          <a
            key={social.name}
            href={social.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`${social.color} ${social.hoverColor} transition-colors`}
            aria-label={social.name}
          >
            <social.icon className={iconSize} />
          </a>
        ))}
      </div>
    );
  }

  if (variant === 'grid') {
    return (
      <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
        {SOCIAL_LINKS.map((social) => (
          <a
            key={social.name}
            href={social.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-2 p-4 rounded-lg border hover:border-primary/50 transition-colors group"
          >
            <div className={`p-3 rounded-full bg-muted group-hover:bg-primary/10 transition-colors`}>
              <social.icon className={`${iconSize} ${social.hoverColor} transition-colors`} />
            </div>
            {showLabels && (
              <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                {social.name}
              </span>
            )}
          </a>
        ))}
      </div>
    );
  }

  // Default inline variant
  return (
    <div className="flex items-center gap-2">
      {SOCIAL_LINKS.map((social) => (
        <Button
          key={social.name}
          variant="ghost"
          size="icon"
          className={`${buttonSize} ${social.hoverColor}`}
          asChild
        >
          <a
            href={social.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={social.name}
          >
            <social.icon className={iconSize} />
          </a>
        </Button>
      ))}
    </div>
  );
};

export default SocialLinks;