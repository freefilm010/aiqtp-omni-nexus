import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Landmark, Shield, FileText, Building2, Clock, Target,
  CheckCircle2, AlertTriangle, Rocket, Crown, Scale
} from "lucide-react";

interface MilestoneItem {
  id: string;
  label: string;
  description: string;
  deadline?: string;
  status: "done" | "in_progress" | "pending";
}

const milestones: MilestoneItem[] = [
  { id: "trust", label: "File Wyoming Trust (TAH)", description: "Parent entity — TRUST AIQTP HOLDINGS", deadline: "ASAP", status: "pending" },
  { id: "llc_nj", label: "File NJ LLC (ATE)", description: "Operating entity — AIQTP TRUST ENTERPRISE", deadline: "ASAP", status: "pending" },
  { id: "ein", label: "Obtain EIN from IRS", description: "Free, same-day online application", deadline: "After LLC", status: "pending" },
  { id: "loi", label: "Draft LOI — IP Lease (Trust → LLC)", description: "Intellectual property licensing agreement", deadline: "Week 2", status: "pending" },
  { id: "bank", label: "Open Business Bank Account", description: "With EIN + LLC docs", deadline: "Week 3", status: "pending" },
  { id: "credit", label: "Apply for Business Credit Line", description: "Initial credit establishment", deadline: "Week 4", status: "pending" },
  { id: "llc_50", label: "File 50-State LLCs", description: "DE, TX, FL, NV first → scale to 50", deadline: "Days 30-60", status: "pending" },
  { id: "compliance_page", label: "Publish Compliance Page on aiqtp.com", description: "Reserve transparency + KYC/AML documentation", deadline: "Day 45", status: "pending" },
  { id: "whitepaper", label: "Publish Platform Whitepaper", description: "Token economics, architecture, governance", deadline: "Day 50", status: "pending" },
  { id: "occ_app", label: "Submit OCC Charter Application", description: "GENIUS Act federal crypto banking charter", deadline: "Day 75", status: "pending" },
  { id: "charter", label: "🏆 Federal Charter Granted", description: "Top 50 applicant — licensed crypto bank", deadline: "Target", status: "pending" },
];

const FederalCharterMission = () => {
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>(() => {
    try {
      return JSON.parse(localStorage.getItem("charter_checklist") || "{}");
    } catch { return {}; }
  });

  const toggle = (id: string) => {
    const next = { ...checkedItems, [id]: !checkedItems[id] };
    setCheckedItems(next);
    localStorage.setItem("charter_checklist", JSON.stringify(next));
  };

  const completedCount = Object.values(checkedItems).filter(Boolean).length;
  const progress = Math.round((completedCount / milestones.length) * 100);

  const targets = [
    { label: "$10M", desc: "Trust funded, 50 LLCs, credit maxed", icon: Building2 },
    { label: "$100M", desc: "Federal charter, institutional clients", icon: Shield },
    { label: "$1B", desc: "Industry standard platform", icon: Crown },
    { label: "$100B", desc: "Legendary legacy", icon: Rocket },
  ];

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <Card className="bg-gradient-to-r from-primary/20 via-primary/10 to-accent/20 border-primary/30">
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-xl bg-primary/20">
              <Landmark className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                🏛️ Federal Charter Mission Control
              </h2>
              <p className="text-muted-foreground">
                GENIUS Act — OCC Crypto Banking Charter Race • 83-Day Window
              </p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Overall Progress</span>
              <span className="font-bold text-primary">{progress}% ({completedCount}/{milestones.length})</span>
            </div>
            <Progress value={progress} className="h-3" />
          </div>
        </CardContent>
      </Card>

      {/* Wealth Ladder */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {targets.map((t, i) => (
          <Card key={i} className="bg-card border-border">
            <CardContent className="p-4 text-center">
              <t.icon className="h-6 w-6 mx-auto mb-2 text-primary" />
              <p className="text-lg font-bold text-foreground">{t.label}</p>
              <p className="text-xs text-muted-foreground">{t.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Mission Checklist */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Mission Checklist
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          {milestones.map((item) => {
            const checked = !!checkedItems[item.id];
            return (
              <div
                key={item.id}
                className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
                  checked ? "bg-primary/5" : "hover:bg-muted/50"
                }`}
              >
                <Checkbox
                  checked={checked}
                  onCheckedChange={() => toggle(item.id)}
                  className="mt-1"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`font-medium ${checked ? "line-through text-muted-foreground" : "text-foreground"}`}>
                      {item.label}
                    </span>
                    {item.deadline && (
                      <Badge variant="outline" className="text-xs">
                        <Clock className="h-3 w-3 mr-1" />
                        {item.deadline}
                      </Badge>
                    )}
                    {checked && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Platform Readiness */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-primary" />
            Platform Readiness for OCC Application
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { name: "Event-Sourced Ledger", status: "Live", ok: true },
              { name: "KYC/AML + 2FA Auth", status: "Enforced", ok: true },
              { name: "Post-Quantum Security", status: "Integrated", ok: true },
              { name: "90+ Compliance Standards", status: "Registry Live", ok: true },
              { name: "Token Price Feeds", status: "Active", ok: true },
              { name: "Audit Trail (trade_events)", status: "Append-Only", ok: true },
              { name: "Insurance Framework", status: "4-Tier Model", ok: true },
              { name: "Treasury Wallet System", status: "Operational", ok: true },
              { name: "Reserve Transparency Page", status: "Needed", ok: false },
              { name: "Published Whitepaper", status: "Needed", ok: false },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                <div className="flex items-center gap-2">
                  {item.ok ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  )}
                  <span className="text-sm font-medium text-foreground">{item.name}</span>
                </div>
                <Badge variant={item.ok ? "default" : "outline"} className={item.ok ? "bg-green-500/10 text-green-500 border-green-500/20" : "text-yellow-500 border-yellow-500/30"}>
                  {item.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Corporate Structure */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Corporate Structure
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 text-center">
              <p className="text-xs text-muted-foreground">PARENT ENTITY</p>
              <p className="font-bold text-foreground">TRUST AIQTP HOLDINGS (TAH)</p>
              <p className="text-xs text-muted-foreground">Wyoming • IP Owner</p>
            </div>
            <div className="flex justify-center">
              <div className="w-px h-6 bg-border" />
            </div>
            <div className="p-4 rounded-lg bg-accent/10 border border-accent/20 text-center">
              <p className="text-xs text-muted-foreground">OPERATING ENTITY</p>
              <p className="font-bold text-foreground">AIQTP TRUST ENTERPRISE (ATE)</p>
              <p className="text-xs text-muted-foreground">New Jersey • Licensed Operator</p>
            </div>
            <div className="flex justify-center">
              <div className="w-px h-6 bg-border" />
            </div>
            <div className="p-4 rounded-lg bg-secondary/50 border border-border text-center">
              <p className="text-xs text-muted-foreground">SCALE TARGET</p>
              <p className="font-bold text-foreground">50 State LLCs → $12.5M Credit Line</p>
              <p className="text-xs text-muted-foreground">$250K per state LLC credit allocation</p>
            </div>
            <div className="flex justify-center">
              <div className="w-px h-6 bg-border" />
            </div>
            <div className="p-4 rounded-lg bg-primary/10 border border-primary/30 text-center">
              <p className="text-xs text-muted-foreground">ULTIMATE GOAL</p>
              <p className="font-bold text-primary text-lg">🏛️ Federal Crypto Banking Charter</p>
              <p className="text-xs text-muted-foreground">OCC • GENIUS Act</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FederalCharterMission;
