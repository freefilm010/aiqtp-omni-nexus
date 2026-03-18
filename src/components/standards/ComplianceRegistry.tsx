import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  Shield,
  FileText,
  Coins,
  Image,
  Lock,
  Search,
  ExternalLink,
  CheckCircle,
  AlertTriangle,
  BookOpen,
} from "lucide-react";
import {
  ALL_STANDARDS,
  EIP_STANDARDS,
  SECURITY_STANDARDS,
  ISO_STANDARDS,
  OPENZEPPELIN_STANDARDS,
  PQC_STANDARDS,
  EXTENDED_EIP_STANDARDS,
  VALUE_NATURE_LABELS,
  type ProtocolStandard,
} from "@/lib/standards/protocolRegistry";

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  erc: <Coins className="h-4 w-4" />,
  eip: <FileText className="h-4 w-4" />,
  fips: <Lock className="h-4 w-4" />,
  nist: <Shield className="h-4 w-4" />,
  iso: <BookOpen className="h-4 w-4" />,
};

const STATUS_COLORS: Record<string, string> = {
  final: 'bg-green-500/10 text-green-400 border-green-500/20',
  active: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  draft: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  superseded: 'bg-muted text-muted-foreground',
};

function StandardCard({ standard }: { standard: ProtocolStandard }) {
  const valueNature = VALUE_NATURE_LABELS[standard.valueNature];

  return (
    <AccordionItem value={standard.id} className="border rounded-lg px-4 mb-3">
      <AccordionTrigger className="hover:no-underline py-3">
        <div className="flex items-start gap-3 text-left w-full pr-4">
          <div className="mt-0.5">{CATEGORY_ICONS[standard.category]}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-sm">{standard.name}</span>
              <Badge variant="outline" className={`text-[10px] ${STATUS_COLORS[standard.status]}`}>
                {standard.status.toUpperCase()}
              </Badge>
              {standard.requiredForCompliance && (
                <Badge variant="destructive" className="text-[10px]">
                  <CheckCircle className="h-3 w-3 mr-0.5" />
                  REQUIRED
                </Badge>
              )}
            </div>
            <p className={`text-xs mt-0.5 ${valueNature.color}`}>{valueNature.label}</p>
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent className="pb-4 space-y-3">
        <p className="text-sm text-muted-foreground leading-relaxed">{standard.description}</p>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Value Classification</p>
            <p className="text-xs">{valueNature.description}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Applicable To</p>
            <div className="flex flex-wrap gap-1">
              {standard.applicableTo.map((item, i) => (
                <Badge key={i} variant="secondary" className="text-[10px]">{item}</Badge>
              ))}
            </div>
          </div>
        </div>

        {standard.relatedStandards.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Related Standards</p>
            <div className="flex flex-wrap gap-1">
              {standard.relatedStandards.map((rel, i) => (
                <Badge key={i} variant="outline" className="text-[10px] uppercase">{rel}</Badge>
              ))}
            </div>
          </div>
        )}

        {standard.url && (
          <a
            href={standard.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <ExternalLink className="h-3 w-3" />
            Official specification
          </a>
        )}
      </AccordionContent>
    </AccordionItem>
  );
}

const ComplianceRegistry = () => {
  const [search, setSearch] = useState("");

  const filterStandards = (standards: ProtocolStandard[]) =>
    standards.filter(
      (s) =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.description.toLowerCase().includes(search.toLowerCase()) ||
        s.number.toLowerCase().includes(search.toLowerCase()) ||
        s.applicableTo.some((a) => a.toLowerCase().includes(search.toLowerCase()))
    );

  const requiredCount = ALL_STANDARDS.filter((s) => s.requiredForCompliance).length;

  return (
    <div className="space-y-6">
      {/* Header Summary */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-2xl font-bold text-primary">{EIP_STANDARDS.length}</p>
            <p className="text-[10px] text-muted-foreground">EIP/ERC</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-2xl font-bold text-primary">{OPENZEPPELIN_STANDARDS.length}</p>
            <p className="text-[10px] text-muted-foreground">OpenZeppelin</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-2xl font-bold text-primary">{SECURITY_STANDARDS.length}</p>
            <p className="text-[10px] text-muted-foreground">NIST/FIPS</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-2xl font-bold text-primary">{PQC_STANDARDS.length}</p>
            <p className="text-[10px] text-muted-foreground">PQC/CSRC</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-2xl font-bold text-primary">{ISO_STANDARDS.length}</p>
            <p className="text-[10px] text-muted-foreground">ISO</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-2xl font-bold text-destructive">{requiredCount}</p>
            <p className="text-[10px] text-muted-foreground">Required</p>
          </CardContent>
        </Card>
      </div>

      {/* Value Classification Guide */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            Asset Value Classification Guide
          </CardTitle>
          <CardDescription className="text-xs">
            Understanding how different token standards relate to asset fungibility and value
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {Object.entries(VALUE_NATURE_LABELS).map(([key, v]) => (
              <div key={key} className="p-3 rounded-lg border bg-muted/30">
                <p className={`font-semibold text-xs ${v.color}`}>{v.label}</p>
                <p className="text-[11px] text-muted-foreground mt-1">{v.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search standards (e.g. ERC-20, Kyber, royalty, quantum...)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Standards Tabs */}
      <Tabs defaultValue="eip" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 md:grid-cols-6">
          <TabsTrigger value="eip" className="text-xs gap-1">
            <Coins className="h-3.5 w-3.5" />
            EIP/ERC
          </TabsTrigger>
          <TabsTrigger value="oz" className="text-xs gap-1">
            <Shield className="h-3.5 w-3.5" />
            OpenZeppelin
          </TabsTrigger>
          <TabsTrigger value="security" className="text-xs gap-1">
            <Lock className="h-3.5 w-3.5" />
            NIST/FIPS
          </TabsTrigger>
          <TabsTrigger value="pqc" className="text-xs gap-1">
            <Lock className="h-3.5 w-3.5" />
            PQC/CSRC
          </TabsTrigger>
          <TabsTrigger value="iso" className="text-xs gap-1">
            <BookOpen className="h-3.5 w-3.5" />
            ISO
          </TabsTrigger>
          <TabsTrigger value="all" className="text-xs gap-1">
            <Shield className="h-3.5 w-3.5" />
            All ({ALL_STANDARDS.length})
          </TabsTrigger>
        </TabsList>

        {[
          { value: 'eip', data: EIP_STANDARDS },
          { value: 'oz', data: OPENZEPPELIN_STANDARDS },
          { value: 'security', data: SECURITY_STANDARDS },
          { value: 'pqc', data: PQC_STANDARDS },
          { value: 'iso', data: ISO_STANDARDS },
          { value: 'all', data: ALL_STANDARDS },
        ].map(({ value, data }) => (
          <TabsContent key={value} value={value}>
            <ScrollArea className="h-[600px]">
              <Accordion type="multiple" className="space-y-1">
                {filterStandards(data).map((s) => (
                  <StandardCard key={s.id} standard={s} />
                ))}
                {filterStandards(data).length === 0 && (
                  <div className="py-12 text-center text-muted-foreground">
                    <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No standards match your search</p>
                  </div>
                )}
              </Accordion>
            </ScrollArea>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default ComplianceRegistry;
