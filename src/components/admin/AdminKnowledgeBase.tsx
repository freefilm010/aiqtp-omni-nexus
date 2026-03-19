import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  BookOpen, FileText, Search, ExternalLink, Shield, Atom,
  Scale, Building2, AlertTriangle, Download, Globe
} from "lucide-react";

interface DocItem {
  title: string;
  description: string;
  path: string;
  category: string;
  type: "pdf" | "md" | "internal";
}

const platformDocs: DocItem[] = [
  { title: "Architecture Overview", description: "Full platform architecture and stack details", path: "/AIQTP-Project/ARCHITECTURE.md", category: "architecture", type: "md" },
  { title: "Features Specification", description: "Complete feature catalog and roadmap", path: "/AIQTP-Project/FEATURES.md", category: "architecture", type: "md" },
  { title: "Omni-Nexus Codex v3", description: "Shadow Shepherd directive and AI agent architecture", path: "/AIQTP-Project/OMNI_NEXUS_CODEX_v3.md", category: "architecture", type: "md" },
  { title: "QuantClaw Blueprint", description: "QuantClaw trading system specification", path: "/AIQTP-Project/QUANTCLAW_BLUEPRINT.md", category: "architecture", type: "md" },
  { title: "Quantum Research Compendium", description: "Quantum computing research and integration notes", path: "/AIQTP-Project/QUANTUM_RESEARCH_COMPENDIUM.md", category: "research", type: "md" },
  { title: "Backend Setup Guide", description: "Database, auth, and backend configuration guide", path: "/AIQTP-Project/SUPABASE_SETUP.md", category: "infrastructure", type: "md" },
  { title: "Project README", description: "Project overview and quick start guide", path: "/AIQTP-Project/README.md", category: "architecture", type: "md" },
  { title: "Chat History Archive", description: "Development chat history and decisions", path: "/AIQTP-Project/CHAT_HISTORY.md", category: "operations", type: "md" },
];

const researchPapers: DocItem[] = [
  { title: "Bitcoin Dual Nature", description: "Analysis of Bitcoin's dual nature as currency and asset", path: "/AIQTP-Project/research-papers/bitcoin-dual-nature.pdf", category: "research", type: "pdf" },
  { title: "Lattice Signature PQB", description: "Post-quantum lattice-based signature schemes", path: "/AIQTP-Project/research-papers/lattice-signature-pqb.pdf", category: "security", type: "pdf" },
  { title: "Quantum Bitcoin", description: "Quantum computing implications for Bitcoin", path: "/AIQTP-Project/research-papers/quantum-bitcoin.pdf", category: "research", type: "pdf" },
  { title: "Quantum Walk Entanglement", description: "Quantum walk entanglement properties", path: "/AIQTP-Project/research-papers/quantum-walk-entanglement.pdf", category: "research", type: "pdf" },
  { title: "Quantum Walk Revivals", description: "Revival patterns in quantum walks", path: "/AIQTP-Project/research-papers/quantum-walk-revivals.pdf", category: "research", type: "pdf" },
  { title: "Solid State Time Crystal", description: "Solid state time crystal implementations", path: "/AIQTP-Project/research-papers/solid-state-time-crystal.pdf", category: "research", type: "pdf" },
  { title: "Thermodynamic Time Crystals", description: "Thermodynamic properties of time crystals", path: "/AIQTP-Project/research-papers/thermodynamic-time-crystals.pdf", category: "research", type: "pdf" },
  { title: "Time Crystal Computing", description: "Computing applications of time crystals", path: "/AIQTP-Project/research-papers/time-crystal-computing.pdf", category: "research", type: "pdf" },
  { title: "Large Period DTC", description: "Large period discrete time crystals", path: "/AIQTP-Project/research-papers/large-period-dtc.pdf", category: "research", type: "pdf" },
];

const financialDocs: DocItem[] = [
  { title: "Capital Investment Q1 2025", description: "Quarterly capital investment analysis", path: "/documents/CapInvestment2025Q1.pdf", category: "finance", type: "pdf" },
  { title: "EQPM & Analyst Cheat Sheet", description: "Equity portfolio management reference", path: "/documents/EQPM_and_Analyst_Cheat_Sheet.pdf", category: "finance", type: "pdf" },
  { title: "Economics Cheat Sheet", description: "Key economics concepts and formulas", path: "/documents/Economics_Cheat_Sheet.pdf", category: "finance", type: "pdf" },
  { title: "IRS & Structured Notes", description: "Interest rate swaps and structured notes guide", path: "/documents/IRS_and_Structured_Notes_Cheat_Sheet.pdf", category: "finance", type: "pdf" },
  { title: "FX Market Tools", description: "Foreign exchange market analysis tools", path: "/documents/Tools_for_FX_Market_Cheat_Sheet.pdf", category: "finance", type: "pdf" },
  { title: "Future of Digital Money", description: "Digital currency evolution and projections", path: "/documents/future-of-digital-money.pdf", category: "finance", type: "pdf" },
];

const securityFramework = [
  { title: "Force Majeure & Liability", description: "Acts of God, cyberattacks, solar flares, infrastructure failures — liability caps and user waivers", icon: AlertTriangle, status: "active" },
  { title: "Circuit Breaker Pattern", description: "Automatic API failover with OPEN/HALF-OPEN/CLOSED states to prevent cascading failures", icon: Shield, status: "active" },
  { title: "RLS & Data Masking", description: "Row-level security on all tables with security-invoker views for sensitive data", icon: Shield, status: "active" },
  { title: "Post-Quantum Encryption", description: "ML-KEM-768 (Kyber) key encapsulation + ML-DSA-65 (Dilithium) signatures", icon: Atom, status: "active" },
  { title: "Insurance Coverage Framework", description: "4-tier user insurance (Explorer→Citadel) with group discount model and revenue projections", icon: Scale, status: "planned" },
  { title: "Incident Response Playbook", description: "Historical exchange failure analysis informing multi-tier incident response procedures", icon: Building2, status: "active" },
];

const AdminKnowledgeBase = () => {
  const [search, setSearch] = useState("");

  const filterDocs = (docs: DocItem[]) =>
    docs.filter(d =>
      !search || d.title.toLowerCase().includes(search.toLowerCase()) || d.description.toLowerCase().includes(search.toLowerCase())
    );

  const openDoc = (doc: DocItem) => {
    if (doc.type === "pdf") {
      window.open(doc.path, "_blank");
    } else {
      window.open(`https://github.com/freefilm010/aiqtp-omni-nexus/blob/main${doc.path.replace("/AIQTP-Project", "")}`, "_blank");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BookOpen className="h-7 w-7 text-primary" />
            Knowledge Base
          </h1>
          <p className="text-muted-foreground">
            All platform documentation, research, and operational guides
          </p>
        </div>
        <Badge variant="outline">{platformDocs.length + researchPapers.length + financialDocs.length} Documents</Badge>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search all documents..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <Tabs defaultValue="platform" className="space-y-4">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="platform">Platform Docs</TabsTrigger>
          <TabsTrigger value="research">Research Papers</TabsTrigger>
          <TabsTrigger value="finance">Financial Docs</TabsTrigger>
          <TabsTrigger value="security">Security Framework</TabsTrigger>
        </TabsList>

        <TabsContent value="platform">
          <div className="grid md:grid-cols-2 gap-4">
            {filterDocs(platformDocs).map((doc, i) => (
              <Card key={i} className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => openDoc(doc)}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    {doc.title}
                    <Badge variant="secondary" className="text-[10px] ml-auto">{doc.type.toUpperCase()}</Badge>
                  </CardTitle>
                  <CardDescription className="text-xs">{doc.description}</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <code className="text-[10px] text-muted-foreground">{doc.path}</code>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="research">
          <div className="grid md:grid-cols-2 gap-4">
            {filterDocs(researchPapers).map((doc, i) => (
              <Card key={i} className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => openDoc(doc)}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Atom className="h-4 w-4 text-purple-500" />
                    {doc.title}
                    <Badge variant="secondary" className="text-[10px] ml-auto">PDF</Badge>
                  </CardTitle>
                  <CardDescription className="text-xs">{doc.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="finance">
          <div className="grid md:grid-cols-2 gap-4">
            {filterDocs(financialDocs).map((doc, i) => (
              <Card key={i} className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => openDoc(doc)}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Globe className="h-4 w-4 text-green-500" />
                    {doc.title}
                    <Badge variant="secondary" className="text-[10px] ml-auto">PDF</Badge>
                  </CardTitle>
                  <CardDescription className="text-xs">{doc.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="security">
          <div className="grid md:grid-cols-2 gap-4">
            {securityFramework.map((item, i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <item.icon className="h-4 w-4 text-red-500" />
                    {item.title}
                    <Badge variant={item.status === "active" ? "default" : "secondary"} className="text-[10px] ml-auto">
                      {item.status}
                    </Badge>
                  </CardTitle>
                  <CardDescription className="text-xs">{item.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminKnowledgeBase;
