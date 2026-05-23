import { useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Archive, Bot, Cloud, Code2, Database, Download, ExternalLink, FileUp, FolderLock, RefreshCw, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Database as SupabaseDatabase } from "@/integrations/supabase/types";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";

type AdminFileAsset = SupabaseDatabase["public"]["Tables"]["admin_file_assets"]["Row"];
type StrategyCodeRow = Pick<SupabaseDatabase["public"]["Tables"]["ai_strategies"]["Row"], "id" | "name" | "user_id" | "status" | "code" | "code_protected" | "updated_at">;
type FactorCodeRow = Pick<SupabaseDatabase["public"]["Tables"]["ai_factors"]["Row"], "id" | "name" | "user_id" | "factor_type" | "code" | "code_protected" | "updated_at">;

const CATEGORY_LABELS: Record<string, string> = {
  codebase_backup: "Codebase Backup",
  cloud_export: "Cloud Export",
  repository: "Repository",
  database_export: "Database Export",
  storage_export: "Storage Export",
  deployment: "Deployment",
  security_audit: "Security Audit",
  other: "Other",
};

const formatBytes = (bytes: number | null) => {
  if (!bytes) return "—";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(unit === 0 ? 0 : 1)} ${units[unit]}`;
};

const formatDate = (value: string | null) => value ? new Date(value).toLocaleString() : "—";

const fileChecksum = async (file: File) => {
  const buffer = await file.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
};

const AdminFilesVault = () => {
  const { isAdmin, loading } = useAdminAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);

  const assetsQuery = useQuery({
    queryKey: ["admin-file-assets"],
    enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_file_assets")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as AdminFileAsset[];
    },
  });

  const strategiesQuery = useQuery({
    queryKey: ["admin-strategy-code-index"],
    enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_strategies")
        .select("id,name,user_id,status,code,code_protected,updated_at")
        .order("updated_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data as StrategyCodeRow[];
    },
  });

  const factorsQuery = useQuery({
    queryKey: ["admin-factor-code-index"],
    enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_factors")
        .select("id,name,user_id,factor_type,code,code_protected,updated_at")
        .order("updated_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data as FactorCodeRow[];
    },
  });

  const groupedAssets = useMemo(() => {
    const records = assetsQuery.data ?? [];
    return {
      backups: records.filter((asset) => ["codebase_backup", "cloud_export", "database_export", "storage_export"].includes(asset.category)),
      repos: records.filter((asset) => asset.category === "repository"),
      operations: records.filter((asset) => ["deployment", "security_audit", "other"].includes(asset.category)),
    };
  }, [assetsQuery.data]);

  const openAsset = async (asset: AdminFileAsset) => {
    if (asset.storage_bucket && asset.storage_path) {
      const { data, error } = await supabase.storage.from(asset.storage_bucket).createSignedUrl(asset.storage_path, 120);
      if (error || !data?.signedUrl) {
        toast.error("Unable to create secure download link");
        return;
      }
      window.open(data.signedUrl, "_blank", "noopener,noreferrer");
      return;
    }

    if (asset.source_url) {
      window.open(asset.source_url, "_blank", "noopener,noreferrer");
      return;
    }

    toast.info("No downloadable file or external reference is attached to this record");
  };

  const handleUpload = async (file: File | undefined) => {
    if (!file || !isAdmin) return;
    setUploading(true);
    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const storagePath = `manual/${Date.now()}-${safeName}`;
      const checksum = await fileChecksum(file);
      const { error: uploadError } = await supabase.storage
        .from("admin-backups")
        .upload(storagePath, file, { upsert: false, contentType: file.type || "application/octet-stream" });
      if (uploadError) throw uploadError;

      const { error: insertError } = await supabase.from("admin_file_assets").insert({
        title: file.name,
        category: "cloud_export",
        source_type: "admin_upload",
        storage_bucket: "admin-backups",
        storage_path: storagePath,
        checksum_sha256: checksum,
        size_bytes: file.size,
        description: "Manual admin vault upload.",
        status: "verified",
        metadata: { content_type: file.type || "application/octet-stream" },
      });
      if (insertError) throw insertError;

      toast.success("File added to the admin-only vault");
      await queryClient.invalidateQueries({ queryKey: ["admin-file-assets"] });
    } catch (error) {
      console.error(error);
      toast.error("Admin file upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  if (loading || !isAdmin) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-normal flex items-center gap-3">
            <FolderLock className="h-8 w-8 text-primary" />
            Admin Files Vault
          </h1>
          <p className="text-muted-foreground mt-2">
            Admin-only access to backups, repository references, cloud records, and protected bot code indexes.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => queryClient.invalidateQueries({ queryKey: ["admin-file-assets"] })}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => fileInputRef.current?.click()} disabled={uploading}>
            <FileUp className="h-4 w-4 mr-2" />
            {uploading ? "Uploading" : "Upload Backup"}
          </Button>
          <input ref={fileInputRef} type="file" className="hidden" onChange={(event) => handleUpload(event.target.files?.[0])} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <VaultStat icon={Archive} label="Backups" value={groupedAssets.backups.length} />
        <VaultStat icon={Code2} label="Repositories" value={groupedAssets.repos.length} />
        <VaultStat icon={Cloud} label="Ops Records" value={groupedAssets.operations.length} />
        <VaultStat icon={Bot} label="Bot Code Index" value={(strategiesQuery.data?.length ?? 0) + (factorsQuery.data?.length ?? 0)} />
      </div>

      <Tabs defaultValue="backups" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="backups">Backups</TabsTrigger>
          <TabsTrigger value="repositories">Repos</TabsTrigger>
          <TabsTrigger value="bot-code">Bot Code</TabsTrigger>
          <TabsTrigger value="operations">Cloud</TabsTrigger>
        </TabsList>

        <TabsContent value="backups">
          <AssetsTable assets={groupedAssets.backups} loading={assetsQuery.isLoading} onOpen={openAsset} />
        </TabsContent>
        <TabsContent value="repositories">
          <AssetsTable assets={groupedAssets.repos} loading={assetsQuery.isLoading} onOpen={openAsset} />
        </TabsContent>
        <TabsContent value="bot-code" className="space-y-4">
          <CodeIndexCard title="Strategy bots" rows={strategiesQuery.data ?? []} loading={strategiesQuery.isLoading} kind="strategy" />
          <CodeIndexCard title="Data miner / factor bots" rows={factorsQuery.data ?? []} loading={factorsQuery.isLoading} kind="factor" />
        </TabsContent>
        <TabsContent value="operations">
          <AssetsTable assets={groupedAssets.operations} loading={assetsQuery.isLoading} onOpen={openAsset} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

const VaultStat = ({ icon: Icon, label, value }: { icon: typeof Archive; label: string; value: number }) => (
  <Card>
    <CardContent className="p-4 flex items-center gap-3">
      <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div>
        <div className="text-2xl font-bold">{value}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </div>
    </CardContent>
  </Card>
);

const AssetsTable = ({ assets, loading, onOpen }: { assets: AdminFileAsset[]; loading: boolean; onOpen: (asset: AdminFileAsset) => void }) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-primary" />Protected Files & References</CardTitle>
      <CardDescription>Visible only after server-verified admin role access.</CardDescription>
    </CardHeader>
    <CardContent>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Size</TableHead>
            <TableHead>Updated</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Loading admin vault…</TableCell></TableRow>
          ) : assets.length === 0 ? (
            <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">No records in this section.</TableCell></TableRow>
          ) : assets.map((asset) => (
            <TableRow key={asset.id}>
              <TableCell>
                <div className="font-medium">{asset.title}</div>
                <div className="text-xs text-muted-foreground line-clamp-1">{asset.description || asset.source_url || asset.storage_path}</div>
              </TableCell>
              <TableCell><Badge variant="secondary">{CATEGORY_LABELS[asset.category] ?? asset.category}</Badge></TableCell>
              <TableCell><Badge variant={asset.status === "verified" ? "default" : "outline"}>{asset.status}</Badge></TableCell>
              <TableCell>{formatBytes(asset.size_bytes)}</TableCell>
              <TableCell>{formatDate(asset.updated_at)}</TableCell>
              <TableCell className="text-right">
                <Button size="sm" variant="outline" onClick={() => onOpen(asset)}>
                  {asset.storage_path ? <Download className="h-4 w-4 mr-2" /> : <ExternalLink className="h-4 w-4 mr-2" />}
                  Open
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </CardContent>
  </Card>
);

const CodeIndexCard = ({ title, rows, loading, kind }: { title: string; rows: Array<StrategyCodeRow | FactorCodeRow>; loading: boolean; kind: "strategy" | "factor" }) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2"><Database className="h-5 w-5 text-primary" />{title}</CardTitle>
      <CardDescription>Admin visibility includes owner, protection status, and stored code presence.</CardDescription>
    </CardHeader>
    <CardContent>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Owner</TableHead>
            <TableHead>Type / Status</TableHead>
            <TableHead>Code</TableHead>
            <TableHead>Updated</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Loading protected code index…</TableCell></TableRow>
          ) : rows.length === 0 ? (
            <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">No bot code records found.</TableCell></TableRow>
          ) : rows.map((row) => (
            <TableRow key={`${kind}-${row.id}`}>
              <TableCell className="font-medium">{row.name}</TableCell>
              <TableCell><span className="font-mono text-xs">{row.user_id.slice(0, 8)}…</span></TableCell>
              <TableCell>{kind === "strategy" ? (row as StrategyCodeRow).status : (row as FactorCodeRow).factor_type}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Badge variant={row.code_protected ? "default" : "secondary"}>{row.code_protected ? "Protected" : "Visible"}</Badge>
                  <span className="text-xs text-muted-foreground">{row.code ? `${row.code.length.toLocaleString()} chars` : "No code"}</span>
                </div>
              </TableCell>
              <TableCell>{formatDate(row.updated_at)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </CardContent>
  </Card>
);

export default AdminFilesVault;