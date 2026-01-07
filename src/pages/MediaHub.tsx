import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Music, 
  Radio, 
  Headphones, 
  Play, 
  ExternalLink,
  Link2,
  Check,
  Twitter,
  Instagram,
  Youtube,
  Linkedin,
  MessageCircle,
  Send,
  Globe,
  Podcast,
  Mic2,
  Volume2,
  Sparkles,
  Facebook,
  Video,
  Ghost,
  Camera
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface MediaService {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  connected: boolean;
  category: "music" | "social" | "radio" | "podcast";
  url?: string;
}

const MediaHub = () => {
  const [services, setServices] = useState<MediaService[]>([
    // Music Streaming
    {
      id: "spotify",
      name: "Spotify",
      description: "Stream music, podcasts, and playlists while you trade",
      icon: <Headphones className="h-6 w-6" />,
      color: "bg-green-500",
      connected: false,
      category: "music",
      url: "https://open.spotify.com"
    },
    {
      id: "soundcloud",
      name: "SoundCloud",
      description: "Discover underground tracks and DJ mixes",
      icon: <Volume2 className="h-6 w-6" />,
      color: "bg-orange-500",
      connected: false,
      category: "music",
      url: "https://soundcloud.com"
    },
    {
      id: "youtube-music",
      name: "YouTube Music",
      description: "Music videos and audio streaming",
      icon: <Youtube className="h-6 w-6" />,
      color: "bg-red-500",
      connected: false,
      category: "music",
      url: "https://music.youtube.com"
    },
    {
      id: "shazam",
      name: "Shazam",
      description: "Identify songs playing around you",
      icon: <Mic2 className="h-6 w-6" />,
      color: "bg-blue-500",
      connected: false,
      category: "music",
      url: "https://www.shazam.com"
    },

    // Radio
    {
      id: "radio-garden",
      name: "Radio Garden",
      description: "Listen to live radio from around the world",
      icon: <Globe className="h-6 w-6" />,
      color: "bg-emerald-500",
      connected: false,
      category: "radio",
      url: "https://radio.garden"
    },
    {
      id: "tunein",
      name: "TuneIn Radio",
      description: "100,000+ radio stations, podcasts, and news",
      icon: <Radio className="h-6 w-6" />,
      color: "bg-cyan-500",
      connected: false,
      category: "radio",
      url: "https://tunein.com"
    },
    {
      id: "bloomberg-radio",
      name: "Bloomberg Radio",
      description: "24/7 business and market news",
      icon: <Podcast className="h-6 w-6" />,
      color: "bg-purple-600",
      connected: false,
      category: "radio",
      url: "https://www.bloomberg.com/audio"
    },

    // Podcasts
    {
      id: "apple-podcasts",
      name: "Apple Podcasts",
      description: "Trading and finance podcasts",
      icon: <Podcast className="h-6 w-6" />,
      color: "bg-purple-500",
      connected: false,
      category: "podcast",
      url: "https://podcasts.apple.com"
    },

    // Social Media
    {
      id: "twitter",
      name: "X (Twitter)",
      description: "Follow crypto influencers and market news",
      icon: <Twitter className="h-6 w-6" />,
      color: "bg-sky-500",
      connected: false,
      category: "social",
      url: "https://twitter.com"
    },
    {
      id: "youtube",
      name: "YouTube",
      description: "Trading tutorials and market analysis",
      icon: <Youtube className="h-6 w-6" />,
      color: "bg-red-600",
      connected: false,
      category: "social",
      url: "https://youtube.com"
    },
    {
      id: "discord",
      name: "Discord",
      description: "Join trading communities and chat rooms",
      icon: <MessageCircle className="h-6 w-6" />,
      color: "bg-indigo-500",
      connected: false,
      category: "social",
      url: "https://discord.com"
    },
    {
      id: "telegram",
      name: "Telegram",
      description: "Crypto signals and trading groups",
      icon: <Send className="h-6 w-6" />,
      color: "bg-blue-400",
      connected: false,
      category: "social",
      url: "https://telegram.org"
    },
    {
      id: "reddit",
      name: "Reddit",
      description: "r/wallstreetbets and crypto subreddits",
      icon: <Globe className="h-6 w-6" />,
      color: "bg-orange-600",
      connected: false,
      category: "social",
      url: "https://reddit.com"
    },
    {
      id: "linkedin",
      name: "LinkedIn",
      description: "Professional finance network",
      icon: <Linkedin className="h-6 w-6" />,
      color: "bg-blue-700",
      connected: false,
      category: "social",
      url: "https://linkedin.com"
    },
    {
      id: "instagram",
      name: "Instagram",
      description: "Trading lifestyle and motivation",
      icon: <Instagram className="h-6 w-6" />,
      color: "bg-pink-500",
      connected: false,
      category: "social",
      url: "https://instagram.com"
    },
    {
      id: "tiktok",
      name: "TikTok",
      description: "Short-form trading content and tips",
      icon: <Video className="h-6 w-6" />,
      color: "bg-black",
      connected: false,
      category: "social",
      url: "https://tiktok.com"
    },
    {
      id: "facebook",
      name: "Facebook",
      description: "Trading groups and communities",
      icon: <Facebook className="h-6 w-6" />,
      color: "bg-blue-600",
      connected: false,
      category: "social",
      url: "https://facebook.com"
    },
    {
      id: "snapchat",
      name: "Snapchat",
      description: "Trading stories and updates",
      icon: <Ghost className="h-6 w-6" />,
      color: "bg-yellow-400",
      connected: false,
      category: "social",
      url: "https://snapchat.com"
    },
  ]);

  const toggleConnection = (id: string) => {
    setServices(prev => prev.map(s => 
      s.id === id ? { ...s, connected: !s.connected } : s
    ));
    const service = services.find(s => s.id === id);
    if (service) {
      if (!service.connected) {
        toast.success(`Connected to ${service.name}`);
      } else {
        toast.info(`Disconnected from ${service.name}`);
      }
    }
  };

  const openService = (url?: string) => {
    if (url) {
      window.open(url, "_blank");
    }
  };

  const renderServiceCard = (service: MediaService) => (
    <Card key={service.id} className="hover:shadow-lg transition-all">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between mb-4">
          <div className={`p-3 rounded-xl ${service.color} text-white`}>
            {service.icon}
          </div>
          {service.connected && (
            <Badge variant="secondary" className="gap-1">
              <Check className="h-3 w-3" />
              Connected
            </Badge>
          )}
        </div>
        <h3 className="font-semibold text-lg mb-1">{service.name}</h3>
        <p className="text-sm text-muted-foreground mb-4">{service.description}</p>
        <div className="flex gap-2">
          <Button 
            variant={service.connected ? "outline" : "default"}
            size="sm"
            onClick={() => toggleConnection(service.id)}
            className="flex-1"
          >
            <Link2 className="h-4 w-4 mr-1" />
            {service.connected ? "Disconnect" : "Connect"}
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => openService(service.url)}
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const musicServices = services.filter(s => s.category === "music");
  const radioServices = services.filter(s => s.category === "radio" || s.category === "podcast");
  const socialServices = services.filter(s => s.category === "social");
  const connectedCount = services.filter(s => s.connected).length;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 pt-24">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-pink-500/20 to-purple-500/20">
              <Music className="h-6 w-6 text-pink-500" />
            </div>
            <h1 className="text-3xl font-bold">Media Hub</h1>
          </div>
          <p className="text-muted-foreground">
            Connect your music, radio, and social accounts for motivation and market insights while you trade
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-3xl font-bold text-primary">{connectedCount}</div>
              <div className="text-sm text-muted-foreground">Connected</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-3xl font-bold">{musicServices.length}</div>
              <div className="text-sm text-muted-foreground">Music Services</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-3xl font-bold">{radioServices.length}</div>
              <div className="text-sm text-muted-foreground">Radio/Podcasts</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-3xl font-bold">{socialServices.length}</div>
              <div className="text-sm text-muted-foreground">Social Networks</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="music" className="space-y-6">
          <TabsList className="grid w-full max-w-lg grid-cols-3">
            <TabsTrigger value="music" className="gap-2">
              <Headphones className="h-4 w-4" />
              Music
            </TabsTrigger>
            <TabsTrigger value="radio" className="gap-2">
              <Radio className="h-4 w-4" />
              Radio
            </TabsTrigger>
            <TabsTrigger value="social" className="gap-2">
              <MessageCircle className="h-4 w-4" />
              Social
            </TabsTrigger>
          </TabsList>

          <TabsContent value="music">
            <div className="mb-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-yellow-500" />
                Music Streaming
              </h2>
              <p className="text-sm text-muted-foreground">Stay motivated with your favorite tracks</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {musicServices.map(renderServiceCard)}
            </div>
          </TabsContent>

          <TabsContent value="radio">
            <div className="mb-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Radio className="h-5 w-5 text-emerald-500" />
                Radio & Podcasts
              </h2>
              <p className="text-sm text-muted-foreground">Live streams and financial podcasts</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {radioServices.map(renderServiceCard)}
            </div>
          </TabsContent>

          <TabsContent value="social">
            <div className="mb-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-blue-500" />
                Social Networks
              </h2>
              <p className="text-sm text-muted-foreground">Stay connected with the trading community</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {socialServices.map(renderServiceCard)}
            </div>
          </TabsContent>
        </Tabs>

        {/* Quick Launch Bar */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5" />
              Quick Launch
            </CardTitle>
            <CardDescription>One-click access to your connected services</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {services.filter(s => s.connected).length > 0 ? (
                services.filter(s => s.connected).map(service => (
                  <Button
                    key={service.id}
                    variant="outline"
                    size="sm"
                    onClick={() => openService(service.url)}
                    className="gap-2"
                  >
                    <div className={`p-1 rounded ${service.color}`}>
                      {service.icon}
                    </div>
                    {service.name}
                  </Button>
                ))
              ) : (
                <p className="text-muted-foreground text-sm">
                  Connect services above to see them here for quick access
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default MediaHub;
