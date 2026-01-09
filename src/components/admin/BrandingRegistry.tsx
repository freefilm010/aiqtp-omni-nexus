import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Globe,
  ExternalLink,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Copy,
  Plus,
  Twitter,
  MessageCircle,
  Youtube,
  Github,
  Linkedin,
  Instagram,
  Send,
  Music2,
  Twitch,
  Search,
  Shield,
  Wallet
} from "lucide-react";
import { toast } from "sonner";

interface DomainEntry {
  domain: string;
  tld: string;
  status: 'owned' | 'available' | 'pending' | 'taken';
  registrar?: string;
  expires?: string;
  cost: string;
  priority: 'high' | 'medium' | 'low';
}

interface SocialLink {
  platform: string;
  handle: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  status: 'claimed' | 'available' | 'pending';
  color: string;
}

// AIQTP Domain Portfolio
const DOMAIN_PORTFOLIO: DomainEntry[] = [
  // Priority TLDs
  { domain: 'aiqtp', tld: '.com', status: 'available', cost: '$12/yr', priority: 'high' },
  { domain: 'aiqtp', tld: '.io', status: 'available', cost: '$40/yr', priority: 'high' },
  { domain: 'aiqtp', tld: '.ai', status: 'available', cost: '$80/yr', priority: 'high' },
  { domain: 'aiqtp', tld: '.dev', status: 'available', cost: '$12/yr', priority: 'high' },
  { domain: 'aiqtp', tld: '.app', status: 'available', cost: '$14/yr', priority: 'high' },
  { domain: 'aiqtp', tld: '.org', status: 'available', cost: '$10/yr', priority: 'medium' },
  { domain: 'aiqtp', tld: '.net', status: 'available', cost: '$12/yr', priority: 'medium' },
  { domain: 'aiqtp', tld: '.co', status: 'available', cost: '$25/yr', priority: 'medium' },
  { domain: 'aiqtp', tld: '.us', status: 'available', cost: '$8/yr', priority: 'medium' },
  { domain: 'aiqtp', tld: '.store', status: 'available', cost: '$15/yr', priority: 'low' },
  { domain: 'aiqtp', tld: '.xyz', status: 'available', cost: '$1/yr', priority: 'low' },
  { domain: 'aiqtp', tld: '.tech', status: 'available', cost: '$10/yr', priority: 'low' },
  { domain: 'aiqtp', tld: '.finance', status: 'available', cost: '$35/yr', priority: 'medium' },
  { domain: 'aiqtp', tld: '.trading', status: 'available', cost: '$20/yr', priority: 'medium' },
  { domain: 'aiqtp', tld: '.crypto', status: 'available', cost: '$50/yr', priority: 'high' },
  // Lovable subdomain (FREE)
  { domain: 'aiqtp', tld: '.lovable.app', status: 'owned', registrar: 'Lovable', cost: 'FREE', priority: 'high' },
];

// Free domain/hosting resources
const FREE_RESOURCES = [
  { name: 'Freenom', url: 'https://freenom.com', type: 'Domains', description: '.tk, .ml, .ga, .cf, .gq (FREE)' },
  { name: 'GitHub Pages', url: 'https://pages.github.com', type: 'Hosting', description: 'Free static hosting + SSL' },
  { name: 'Netlify', url: 'https://netlify.com', type: 'Hosting', description: 'Free tier with custom domains' },
  { name: 'Vercel', url: 'https://vercel.com', type: 'Hosting', description: 'Free hobby tier' },
  { name: 'Cloudflare Pages', url: 'https://pages.cloudflare.com', type: 'Hosting', description: 'Unlimited bandwidth' },
  { name: 'Railway', url: 'https://railway.app', type: 'Backend', description: '$5 free credit/month' },
  { name: 'Render', url: 'https://render.com', type: 'Hosting', description: 'Free static sites' },
  { name: 'Surge.sh', url: 'https://surge.sh', type: 'Hosting', description: 'Free static hosting' },
  { name: 'Firebase', url: 'https://firebase.google.com', type: 'Backend', description: 'Generous free tier' },
  { name: 'Supabase', url: 'https://supabase.com', type: 'Backend', description: 'Free tier (via Lovable Cloud)' },
  { name: 'Cloudflare', url: 'https://cloudflare.com', type: 'CDN/DNS', description: 'Free DNS & CDN' },
  { name: 'ProtonVPN', url: 'https://protonvpn.com', type: 'VPN', description: 'Free tier available' },
  { name: 'Windscribe', url: 'https://windscribe.com', type: 'VPN', description: '10GB free/month' },
  { name: 'Oracle Cloud', url: 'https://oracle.com/cloud/free', type: 'VPS', description: 'Always free VPS tier' },
  { name: 'Google Cloud', url: 'https://cloud.google.com/free', type: 'Cloud', description: '$300 free credit' },
  { name: 'AWS', url: 'https://aws.amazon.com/free', type: 'Cloud', description: '12 months free tier' },
];

// Social platforms
const SOCIAL_PLATFORMS: SocialLink[] = [
  { platform: 'Twitter/X', handle: '@aiqtp', url: 'https://twitter.com/aiqtp', icon: Twitter, status: 'available', color: 'bg-black' },
  { platform: 'Discord', handle: 'aiqtp', url: 'https://discord.gg/aiqtp', icon: MessageCircle, status: 'available', color: 'bg-indigo-500' },
  { platform: 'Telegram', handle: '@aiqtp', url: 'https://t.me/aiqtp', icon: Send, status: 'available', color: 'bg-blue-500' },
  { platform: 'YouTube', handle: '@aiqtp', url: 'https://youtube.com/@aiqtp', icon: Youtube, status: 'available', color: 'bg-red-500' },
  { platform: 'GitHub', handle: 'aiqtp', url: 'https://github.com/aiqtp', icon: Github, status: 'available', color: 'bg-gray-800' },
  { platform: 'LinkedIn', handle: 'aiqtp', url: 'https://linkedin.com/company/aiqtp', icon: Linkedin, status: 'available', color: 'bg-blue-700' },
  { platform: 'Instagram', handle: '@aiqtp', url: 'https://instagram.com/aiqtp', icon: Instagram, status: 'available', color: 'bg-pink-500' },
  { platform: 'TikTok', handle: '@aiqtp', url: 'https://tiktok.com/@aiqtp', icon: Music2, status: 'available', color: 'bg-black' },
  { platform: 'Twitch', handle: 'aiqtp', url: 'https://twitch.tv/aiqtp', icon: Twitch, status: 'available', color: 'bg-purple-500' },
  { platform: 'Reddit', handle: 'r/aiqtp', url: 'https://reddit.com/r/aiqtp', icon: MessageCircle, status: 'available', color: 'bg-orange-500' },
  { platform: 'Medium', handle: '@aiqtp', url: 'https://medium.com/@aiqtp', icon: MessageCircle, status: 'available', color: 'bg-black' },
  { platform: 'Mirror', handle: 'aiqtp.eth', url: 'https://mirror.xyz/aiqtp.eth', icon: Wallet, status: 'available', color: 'bg-blue-400' },
];

const BrandingRegistry = () => {
  const [domains, setDomains] = useState<DomainEntry[]>(DOMAIN_PORTFOLIO);
  const [socials, setSocials] = useState<SocialLink[]>(SOCIAL_PLATFORMS);
  const [searchDomain, setSearchDomain] = useState('');

  const ownedDomains = domains.filter(d => d.status === 'owned').length;
  const availableDomains = domains.filter(d => d.status === 'available').length;
  const claimedSocials = socials.filter(s => s.status === 'claimed').length;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const markAsClaimed = (platform: string) => {
    setSocials(prev => prev.map(s => 
      s.platform === platform ? { ...s, status: 'claimed' as const } : s
    ));
    toast.success(`${platform} marked as claimed!`);
  };

  const markDomainOwned = (domain: string, tld: string) => {
    setDomains(prev => prev.map(d => 
      d.domain === domain && d.tld === tld ? { ...d, status: 'owned' as const } : d
    ));
    toast.success(`${domain}${tld} marked as owned!`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'owned':
      case 'claimed': return 'bg-green-500/10 text-green-500 border-green-500/30';
      case 'available': return 'bg-blue-500/10 text-blue-500 border-blue-500/30';
      case 'pending': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30';
      case 'taken': return 'bg-red-500/10 text-red-500 border-red-500/30';
      default: return 'bg-muted';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-500';
      case 'medium': return 'text-yellow-500';
      case 'low': return 'text-green-500';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Domains Owned</p>
                <p className="text-2xl font-bold text-green-500">{ownedDomains}</p>
              </div>
              <Globe className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Available to Claim</p>
                <p className="text-2xl font-bold text-blue-500">{availableDomains}</p>
              </div>
              <Search className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Social Accounts</p>
                <p className="text-2xl font-bold">{claimedSocials}/{socials.length}</p>
              </div>
              <Twitter className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Free Resources</p>
                <p className="text-2xl font-bold text-purple-500">{FREE_RESOURCES.length}</p>
              </div>
              <Shield className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="domains" className="space-y-4">
        <TabsList>
          <TabsTrigger value="domains">Domain Portfolio</TabsTrigger>
          <TabsTrigger value="socials">Social Links</TabsTrigger>
          <TabsTrigger value="free">Free Resources</TabsTrigger>
        </TabsList>

        <TabsContent value="domains">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                AIQTP Domain Portfolio
              </CardTitle>
              <CardDescription>
                Track and manage all AIQTP domain names across TLDs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px] pr-4">
                <div className="space-y-2">
                  {domains.sort((a, b) => {
                    const priorityOrder = { high: 0, medium: 1, low: 2 };
                    return priorityOrder[a.priority] - priorityOrder[b.priority];
                  }).map((domain, idx) => (
                    <div key={idx} className="p-3 rounded-lg border flex items-center justify-between hover:border-primary/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <span className="font-mono font-bold">{domain.domain}</span>
                          <span className="font-mono text-primary">{domain.tld}</span>
                        </div>
                        <Badge variant="outline" className={getStatusColor(domain.status)}>
                          {domain.status === 'owned' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                          {domain.status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                          {domain.status}
                        </Badge>
                        <span className={`text-xs ${getPriorityColor(domain.priority)}`}>
                          {domain.priority} priority
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-muted-foreground">{domain.cost}</span>
                        {domain.status === 'available' ? (
                          <Button size="sm" variant="outline" onClick={() => markDomainOwned(domain.domain, domain.tld)}>
                            Mark Owned
                          </Button>
                        ) : domain.status === 'owned' ? (
                          <Button size="sm" variant="ghost" onClick={() => copyToClipboard(`${domain.domain}${domain.tld}`)}>
                            <Copy className="h-4 w-4" />
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="socials">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Twitter className="h-5 w-5" />
                AIQTP Social Links
              </CardTitle>
              <CardDescription>
                Claim and manage all social media handles for AIQTP brand
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {socials.map((social, idx) => (
                  <div key={idx} className="p-4 rounded-lg border hover:border-primary/50 transition-colors">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`p-2 rounded-lg ${social.color}`}>
                        <social.icon className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium">{social.platform}</p>
                        <p className="text-sm text-muted-foreground">{social.handle}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className={getStatusColor(social.status)}>
                        {social.status}
                      </Badge>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => window.open(social.url, '_blank')}>
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                        {social.status === 'available' && (
                          <Button size="sm" variant="outline" onClick={() => markAsClaimed(social.platform)}>
                            Claim
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="free">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-green-500" />
                Free Resources & Services
              </CardTitle>
              <CardDescription>
                Free domains, hosting, VPN, cloud services - maximize value without cost
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {FREE_RESOURCES.map((resource, idx) => (
                  <a
                    key={idx}
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-4 rounded-lg border hover:border-primary/50 transition-colors block"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium">{resource.name}</p>
                      <Badge variant="outline" className="bg-green-500/10 text-green-500">
                        {resource.type}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{resource.description}</p>
                    <div className="flex items-center gap-1 mt-2 text-xs text-primary">
                      <ExternalLink className="h-3 w-3" />
                      Visit Site
                    </div>
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BrandingRegistry;