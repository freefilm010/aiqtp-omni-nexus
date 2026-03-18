import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Cloud,
  FileText,
  HardDrive,
  Upload,
  Download,
  FolderOpen,
  Link2,
  Check,
  Loader2,
  BookOpen,
  Smartphone,
} from "lucide-react";

interface CloudProvider {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  connected: boolean;
  fileCount?: number;
  syncStatus?: "synced" | "syncing" | "error";
  color: string;
}

const CloudStorageConnectors = () => {
  const [providers, setProviders] = useState<CloudProvider[]>([
    {
      id: "google-drive",
      name: "Google Drive",
      icon: <HardDrive className="h-6 w-6" />,
      description: "Link Google Docs, Sheets, and files directly to your workspace",
      connected: false,
      color: "text-blue-400",
    },
    {
      id: "notebooklm",
      name: "Google NotebookLM",
      icon: <BookOpen className="h-6 w-6" />,
      description: "Import AI-generated research summaries and audio overviews",
      connected: false,
      color: "text-purple-400",
    },
    {
      id: "samsung-notes",
      name: "Samsung Notes",
      icon: <Smartphone className="h-6 w-6" />,
      description: "Sync Samsung Notes via Samsung Cloud or exported files",
      connected: false,
      color: "text-indigo-400",
    },
    {
      id: "microsoft-onedrive",
      name: "Microsoft OneDrive",
      icon: <Cloud className="h-6 w-6" />,
      description: "Share Office 365 docs, Excel spreadsheets, and PowerBI reports",
      connected: false,
      color: "text-cyan-400",
    },
    {
      id: "google-cloud",
      name: "Google Cloud Storage",
      icon: <FolderOpen className="h-6 w-6" />,
      description: "Access raw data, ML model files, and large datasets",
      connected: false,
      color: "text-emerald-400",
    },
  ]);

  const [connecting, setConnecting] = useState<string | null>(null);
  const [importUrl, setImportUrl] = useState("");

  const handleConnect = async (providerId: string) => {
    setConnecting(providerId);

    // Simulate OAuth / connection flow
    await new Promise((r) => setTimeout(r, 1500));

    setProviders((prev) =>
      prev.map((p) =>
        p.id === providerId
          ? { ...p, connected: true, fileCount: 0, syncStatus: "synced" as const }
          : p
      )
    );
    setConnecting(null);
    toast.success(
      `Connected to ${providers.find((p) => p.id === providerId)?.name}!`
    );
  };

  const handleDisconnect = (providerId: string) => {
    setProviders((prev) =>
      prev.map((p) =>
        p.id === providerId
          ? { ...p, connected: false, fileCount: undefined, syncStatus: undefined }
          : p
      )
    );
    toast.success("Disconnected");
  };

  const handleImportFile = () => {
    if (!importUrl.trim()) {
      toast.error("Please paste a file URL or share link");
      return;
    }
    toast.success("File imported to workspace!");
    setImportUrl("");
  };

  const connectedCount = providers.filter((p) => p.connected).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Cloud className="h-6 w-6 text-primary" />
            Cloud Storage &amp; Notes
          </h2>
          <p className="text-muted-foreground">
            Link cloud drives and note apps to share data across your workspace
          </p>
        </div>
        <Badge variant="secondary" className="text-lg px-4 py-2">
          {connectedCount} Linked
        </Badge>
      </div>

      {/* Quick Import */}
      <Card className="border-dashed border-2 border-primary/30 bg-primary/5">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Upload className="h-5 w-5 text-primary shrink-0" />
            <Input
              placeholder="Paste a Google Drive, OneDrive, or NotebookLM share link..."
              value={importUrl}
              onChange={(e) => setImportUrl(e.target.value)}
              className="flex-1"
            />
            <Button size="sm" onClick={handleImportFile}>
              <Download className="h-4 w-4 mr-1" />
              Import
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Provider Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {providers.map((provider) => (
          <Card
            key={provider.id}
            className={`transition-all ${
              provider.connected
                ? "border-green-500/30 bg-green-500/5"
                : "hover:border-primary/30"
            }`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={provider.color}>{provider.icon}</div>
                  <div>
                    <CardTitle className="text-base">{provider.name}</CardTitle>
                    {provider.connected && (
                      <Badge
                        variant="outline"
                        className="mt-1 border-green-500 text-green-500 text-[10px]"
                      >
                        <Check className="h-3 w-3 mr-1" /> Connected
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              <p className="text-xs text-muted-foreground">
                {provider.description}
              </p>

              {provider.connected ? (
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="flex-1 text-xs">
                    <FolderOpen className="h-3 w-3 mr-1" />
                    Browse Files
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-destructive"
                    onClick={() => handleDisconnect(provider.id)}
                  >
                    Unlink
                  </Button>
                </div>
              ) : (
                <Button
                  className="w-full"
                  size="sm"
                  onClick={() => handleConnect(provider.id)}
                  disabled={connecting === provider.id}
                >
                  {connecting === provider.id ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      Connecting…
                    </>
                  ) : (
                    <>
                      <Link2 className="h-4 w-4 mr-1" />
                      Connect
                    </>
                  )}
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default CloudStorageConnectors;
