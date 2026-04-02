import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Landmark, Shield, FileText, Building2, Clock, Target,
  Crown, Rocket, Scale, BookOpen, Gavel, AlertCircle, ExternalLink,
  DollarSign, Bot, Settings, Zap
} from "lucide-react";

import CharterChecklist, { milestones } from "./charter/CharterChecklist";
import CharterRequirements from "./charter/CharterRequirements";
import CharterReadiness from "./charter/CharterReadiness";
import CharterStructure from "./charter/CharterStructure";
import CharterPenalties from "./charter/CharterPenalties";
import CharterResources from "./charter/CharterResources";
import CharterFundraising from "./charter/CharterFundraising";
import CharterAIPresidents from "./charter/CharterAIPresidents";
import CharterEntityManager from "./charter/CharterEntityManager";
import CapitalSprint from "@/components/charter/CapitalSprint";

/* ─── QIP-001: GENIUS Act Federal Charter Application ─── */
/* ─── MOST IMPORTANT 83 DAYS ─── */

const DEADLINE = new Date("2026-06-24T23:59:59Z");

const FederalCharterMission = () => {
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>(() => {
    try { return JSON.parse(localStorage.getItem("charter_checklist_v3") || "{}"); }
    catch { return {}; }
  });
  const [daysLeft, setDaysLeft] = useState(0);
  const [hoursLeft, setHoursLeft] = useState(0);

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const diff = DEADLINE.getTime() - now.getTime();
      setDaysLeft(Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24))));
      setHoursLeft(Math.max(0, Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))));
    };
    update();
    const timer = setInterval(update, 60000);
    return () => clearInterval(timer);
  }, []);

  const toggle = (id: string) => {
    const next = { ...checkedItems, [id]: !checkedItems[id] };
    setCheckedItems(next);
    localStorage.setItem("charter_checklist_v3", JSON.stringify(next));
  };

  const completedCount = Object.values(checkedItems).filter(Boolean).length;
  const totalItems = milestones.length;
  const progress = Math.round((completedCount / totalItems) * 100);

  const criticalItems = milestones.filter(m => m.priority === "critical");
  const criticalDone = criticalItems.filter(m => checkedItems[m.id]).length;
  const criticalPct = Math.round((criticalDone / criticalItems.length) * 100);

  const categories = ["Corporate", "OCC Application", "Compliance", "Documentation", "Submission"];
  const getCatProgress = (cat: string) => {
    const items = milestones.filter(m => m.category === cat);
    const done = items.filter(m => checkedItems[m.id]).length;
    return { done, total: items.length, pct: items.length ? Math.round((done / items.length) * 100) : 0 };
  };

  const targets = [
    { label: "$10M", desc: "Trust funded, 50 LLCs, credit maxed", icon: Building2 },
    { label: "$100M", desc: "Federal charter, institutional clients", icon: Shield },
    { label: "$1B", desc: "Industry standard platform", icon: Crown },
    { label: "$100B", desc: "Legendary legacy — Bir Tawil HQ", icon: Rocket },
  ];

  return (
    <div className="space-y-6">
      {/* Hero Banner with Live Countdown */}
      <Card className="bg-gradient-to-r from-primary/20 via-primary/10 to-accent/20 border-primary/30">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-4">
            <div className="p-3 rounded-xl bg-primary/20">
              <Landmark className="h-8 w-8 text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                🏛️ QIP-001: Federal Charter Mission Control
              </h2>
              <p className="text-muted-foreground">
                GENIUS Act • OCC Federal Qualified Payment Stablecoin Issuer • 83-Day Sprint
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                12 CFR Part 15 (Proposed) • 376-Page NPRM • Published Feb 25, 2026
              </p>
            </div>
            <div className="text-center">
              <Badge className="bg-destructive/10 text-destructive border-destructive/20 text-lg px-4 py-2">
                <Clock className="h-4 w-4 mr-2" />
                {daysLeft}d {hoursLeft}h → June 24, 2026
              </Badge>
              <p className="text-xs text-muted-foreground mt-1">♦ Born 1983 • 83 Days of Destiny ♦</p>
            </div>
          </div>

          {/* Overall Progress */}
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Overall Progress ({totalItems} items)</span>
              <span className="font-bold text-primary">{progress}% ({completedCount}/{totalItems})</span>
            </div>
            <Progress value={progress} className="h-3" />
          </div>

          {/* Critical Items Progress */}
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-destructive font-medium">🔴 CRITICAL Items ({criticalItems.length})</span>
              <span className="font-bold text-destructive">{criticalPct}% ({criticalDone}/{criticalItems.length})</span>
            </div>
            <Progress value={criticalPct} className="h-2" />
          </div>

          {/* Category Progress */}
          <div className="grid grid-cols-5 gap-2">
            {categories.map(cat => {
              const p = getCatProgress(cat);
              return (
                <div key={cat} className="text-center">
                  <p className="text-xs text-muted-foreground">{cat}</p>
                  <p className="text-sm font-bold text-foreground">{p.done}/{p.total}</p>
                  <Progress value={p.pct} className="h-1 mt-1" />
                </div>
              );
            })}
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

      {/* Main Tabs */}
      <Tabs defaultValue="capital-sprint" className="space-y-4">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="capital-sprint" className="text-xs gap-1"><Zap className="h-3.5 w-3.5" />Day Zero Sprint</TabsTrigger>
          <TabsTrigger value="fundraising" className="text-xs gap-1"><DollarSign className="h-3.5 w-3.5" />Fundraising ($255M)</TabsTrigger>
          <TabsTrigger value="entities" className="text-xs gap-1"><Building2 className="h-3.5 w-3.5" />Entities (51)</TabsTrigger>
          <TabsTrigger value="presidents" className="text-xs gap-1"><Bot className="h-3.5 w-3.5" />AI Presidents</TabsTrigger>
          <TabsTrigger value="checklist" className="text-xs gap-1"><Target className="h-3.5 w-3.5" />Checklist ({completedCount}/{totalItems})</TabsTrigger>
          <TabsTrigger value="requirements" className="text-xs gap-1"><Gavel className="h-3.5 w-3.5" />Requirements</TabsTrigger>
          <TabsTrigger value="readiness" className="text-xs gap-1"><Scale className="h-3.5 w-3.5" />Readiness</TabsTrigger>
          <TabsTrigger value="structure" className="text-xs gap-1"><Settings className="h-3.5 w-3.5" />Structure</TabsTrigger>
          <TabsTrigger value="penalties" className="text-xs gap-1"><AlertCircle className="h-3.5 w-3.5" />Penalties</TabsTrigger>
          <TabsTrigger value="resources" className="text-xs gap-1"><BookOpen className="h-3.5 w-3.5" />Resources</TabsTrigger>
        </TabsList>

        <TabsContent value="fundraising">
          <CharterFundraising />
        </TabsContent>

        <TabsContent value="entities">
          <CharterEntityManager />
        </TabsContent>

        <TabsContent value="presidents">
          <CharterAIPresidents />
        </TabsContent>

        <TabsContent value="checklist">
          <CharterChecklist checkedItems={checkedItems} toggle={toggle} />
        </TabsContent>

        <TabsContent value="requirements">
          <CharterRequirements />
        </TabsContent>

        <TabsContent value="readiness">
          <CharterReadiness />
        </TabsContent>

        <TabsContent value="structure">
          <CharterStructure />
        </TabsContent>

        <TabsContent value="penalties">
          <CharterPenalties />
        </TabsContent>

        <TabsContent value="resources">
          <CharterResources />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FederalCharterMission;
