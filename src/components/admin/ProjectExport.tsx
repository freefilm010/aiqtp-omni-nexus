import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Download, Github, Copy, ExternalLink, Database, KeyRound } from "lucide-react";
import { toast } from "sonner";

const DEFAULT_OWNER = "freefilm010";
const DEFAULT_REPO = "aiqtpreprepo";
const DEFAULT_BRANCH = "main";
const STORAGE_KEY = "admin.projectExport.repo";

type RepoConfig = { owner: string; repo: string; branch: string };

const loadRepo = (): RepoConfig => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        owner: parsed.owner || DEFAULT_OWNER,
        repo: parsed.repo || DEFAULT_REPO,
        branch: parsed.branch || DEFAULT_BRANCH,
      };
    }
  } catch {}
  return { owner: DEFAULT_OWNER, repo: DEFAULT_REPO, branch: DEFAULT_BRANCH };
};

const ProjectExport = () => {
  const [cfg, setCfg] = useState<RepoConfig>(loadRepo);

  const repoUrl = `https://github.com/${cfg.owner}/${cfg.repo}`;
  const zipUrl = `${repoUrl}/archive/refs/heads/${cfg.branch}.zip`;
  const cloneUrl = `${repoUrl}.git`;

  const persist = (next: RepoConfig) => {
    setCfg(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {}
  };

  const downloadZip = () => {
    window.open(zipUrl, "_blank", "noopener,noreferrer");
    toast.success("Opening repository ZIP download…", {
      description: `${cfg.owner}/${cfg.repo}@${cfg.branch}`,
    });
  };

  const copy = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copied to clipboard`);
    } catch {
      toast.error("Copy failed — select and copy manually");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Github className="h-5 w-5 text-primary" />
          Project Export
          <Badge variant="outline" className="ml-2 text-xs">Admin only</Badge>
        </CardTitle>
        <CardDescription>
          One-click full source download via the connected GitHub repository. Database rows
          and secrets are exported separately (see notes below).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="gh-owner" className="text-xs">GitHub owner</Label>
            <Input
              id="gh-owner"
              value={cfg.owner}
              onChange={(e) => persist({ ...cfg, owner: e.target.value.trim() })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="gh-repo" className="text-xs">Repository</Label>
            <Input
              id="gh-repo"
              value={cfg.repo}
              onChange={(e) => persist({ ...cfg, repo: e.target.value.trim() })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="gh-branch" className="text-xs">Branch</Label>
            <Input
              id="gh-branch"
              value={cfg.branch}
              onChange={(e) => persist({ ...cfg, branch: e.target.value.trim() })}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={downloadZip} variant="premium" className="gap-2">
            <Download className="h-4 w-4" />
            Download ZIP ({cfg.branch})
          </Button>
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => window.open(repoUrl, "_blank", "noopener,noreferrer")}
          >
            <ExternalLink className="h-4 w-4" />
            Open repo
          </Button>
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => copy(cloneUrl, "Clone URL")}
          >
            <Copy className="h-4 w-4" />
            Copy clone URL
          </Button>
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => copy(zipUrl, "ZIP URL")}
          >
            <Copy className="h-4 w-4" />
            Copy ZIP URL
          </Button>
        </div>

        <div className="rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground space-y-2">
          <p className="flex items-start gap-2">
            <Database className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary" />
            <span>
              <strong className="text-foreground">Database data</strong> is not in the ZIP.
              Export from Cloud → Database → Tables → CSV per table.
            </span>
          </p>
          <p className="flex items-start gap-2">
            <KeyRound className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary" />
            <span>
              <strong className="text-foreground">Secrets</strong> are never committed.
              Co-developers must re-add them in their environment (Cloud → Secrets).
            </span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectExport;