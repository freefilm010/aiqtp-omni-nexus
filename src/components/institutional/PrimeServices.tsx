import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  Building2, Shield, Wallet, TrendingUp, Lock, FileText, Users, ChevronRight,
  CheckCircle2, AlertTriangle, Clock, Banknote, PiggyBank
} from "lucide-react";

const PrimeServices = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("custody");
  const [custodyAccounts, setCustodyAccounts] = useState<any[]>([]);
  const [marginFacilities, setMarginFacilities] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    const [custodyRes, marginRes] = await Promise.all([
      supabase.from('custody_accounts').select('*').order('created_at', { ascending: false }),
      supabase.from('margin_facilities').select('*').order('created_at', { ascending: false }),
    ]);
    if (custodyRes.data) setCustodyAccounts(custodyRes.data);
    if (marginRes.data) setMarginFacilities(marginRes.data);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "text-green-500 bg-green-500/10";
      case "pending": return "text-yellow-500 bg-yellow-500/10";
      case "warning": return "text-yellow-500 bg-yellow-500/10";
      case "margin_call": case "restricted": return "text-red-500 bg-red-500/10";
      default: return "text-muted-foreground";
    }
  };

  const totalBalance = custodyAccounts.reduce((s, a) => s + Number(a.balance), 0);
  const totalInsurance = custodyAccounts.reduce((s, a) => s + Number(a.insurance_coverage), 0);
  const totalCreditAvail = marginFacilities.reduce((s, f) => s + Number(f.credit_limit) - Number(f.credit_used), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Prime Services</h2>
          <p className="text-muted-foreground">Institutional-grade custody, margin, and lending</p>
        </div>
        <Button><FileText className="h-4 w-4 mr-2" />Request Statement</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
        <Card className="bg-card border-border"><CardContent className="p-3 sm:p-4"><div className="flex items-center gap-2 sm:gap-3"><div className="p-1.5 sm:p-2 rounded-lg bg-primary/10"><Wallet className="h-4 w-4 sm:h-5 sm:w-5 text-primary" /></div><div><p className="text-[10px] sm:text-sm text-muted-foreground">Total AUM</p><p className="text-sm sm:text-xl font-bold text-foreground">${(totalBalance / 1e6).toFixed(1)}M</p></div></div></CardContent></Card>
        <Card className="bg-card border-border"><CardContent className="p-3 sm:p-4"><div className="flex items-center gap-2 sm:gap-3"><div className="p-1.5 sm:p-2 rounded-lg bg-green-500/10"><Shield className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" /></div><div><p className="text-[10px] sm:text-sm text-muted-foreground">Insurance</p><p className="text-sm sm:text-xl font-bold text-green-500">${(totalInsurance / 1e6).toFixed(0)}M</p></div></div></CardContent></Card>
        <Card className="bg-card border-border"><CardContent className="p-3 sm:p-4"><div className="flex items-center gap-2 sm:gap-3"><div className="p-1.5 sm:p-2 rounded-lg bg-blue-500/10"><Banknote className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" /></div><div><p className="text-[10px] sm:text-sm text-muted-foreground">Credit</p><p className="text-sm sm:text-xl font-bold text-foreground">${(totalCreditAvail / 1e6).toFixed(1)}M</p></div></div></CardContent></Card>
        <Card className="bg-card border-border"><CardContent className="p-3 sm:p-4"><div className="flex items-center gap-2 sm:gap-3"><div className="p-1.5 sm:p-2 rounded-lg bg-yellow-500/10"><PiggyBank className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" /></div><div><p className="text-[10px] sm:text-sm text-muted-foreground">Accounts</p><p className="text-sm sm:text-xl font-bold text-foreground">{custodyAccounts.length}</p></div></div></CardContent></Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="w-full flex-wrap">
          <TabsTrigger value="custody" className="text-[10px] sm:text-sm px-2 sm:px-3">Custody</TabsTrigger>
          <TabsTrigger value="margin" className="text-[10px] sm:text-sm px-2 sm:px-3">Margin</TabsTrigger>
          <TabsTrigger value="reporting" className="text-[10px] sm:text-sm px-2 sm:px-3">Reports</TabsTrigger>
          <TabsTrigger value="compliance" className="text-[10px] sm:text-sm px-2 sm:px-3">Comply</TabsTrigger>
        </TabsList>

        <TabsContent value="custody" className="space-y-4">
          {custodyAccounts.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground"><Lock className="h-12 w-12 mx-auto mb-4 opacity-50" /><p>No custody accounts set up yet</p></CardContent></Card>
          ) : custodyAccounts.map((account) => (
            <Card key={account.id} className="bg-card border-border">
              <CardContent className="p-3 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="p-2 sm:p-3 rounded-lg bg-primary/10">
                      {account.account_type === 'cold_storage' ? <Lock className="h-4 w-4 sm:h-6 sm:w-6 text-primary" /> : account.account_type === 'staking' ? <TrendingUp className="h-4 w-4 sm:h-6 sm:w-6 text-primary" /> : <Wallet className="h-4 w-4 sm:h-6 sm:w-6 text-primary" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2"><h3 className="font-bold text-xs sm:text-base text-foreground">{account.name}</h3><Badge className={`text-[9px] sm:text-xs ${getStatusColor(account.status)}`}>{account.status}</Badge></div>
                      <p className="text-[10px] sm:text-sm text-muted-foreground">{account.account_type}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 sm:gap-8 text-right">
                    <div><p className="text-[9px] sm:text-xs text-muted-foreground">Balance</p><p className="font-bold text-xs sm:text-base text-foreground">${(Number(account.balance) / 1e6).toFixed(1)}M</p></div>
                    <div><p className="text-[9px] sm:text-xs text-muted-foreground">Insurance</p><p className="font-bold text-xs sm:text-base text-green-500">${(Number(account.insurance_coverage) / 1e6).toFixed(0)}M</p></div>
                    <div><p className="text-[9px] sm:text-xs text-muted-foreground">Audit</p><p className="font-bold text-[10px] sm:text-base text-foreground">{account.last_audit_date || 'N/A'}</p></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          <Card className="bg-card border-border">
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Shield className="h-5 w-5" />Security Features</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[{ label: "Multi-Sig", status: "Active", icon: Users }, { label: "HSM Protection", status: "Enabled", icon: Lock }, { label: "SOC 2 Type II", status: "Certified", icon: CheckCircle2 }, { label: "Cold Storage", status: "95%", icon: Shield }].map((feature, i) => (
                  <div key={i} className="p-4 rounded-lg bg-secondary/50"><feature.icon className="h-5 w-5 text-primary mb-2" /><p className="text-sm text-muted-foreground">{feature.label}</p><p className="font-bold text-foreground">{feature.status}</p></div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="margin" className="space-y-4">
          {marginFacilities.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground"><Banknote className="h-12 w-12 mx-auto mb-4 opacity-50" /><p>No margin facilities set up yet</p></CardContent></Card>
          ) : marginFacilities.map((facility) => (
            <Card key={facility.id} className="bg-card border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2"><h3 className="font-bold text-foreground">{facility.facility_type}</h3><Badge className={getStatusColor(facility.status)}>{facility.status.replace("_", " ")}</Badge></div>
                    <p className="text-sm text-muted-foreground">Rate: {Number(facility.interest_rate).toFixed(1)}% APR</p>
                  </div>
                  <div className="text-right"><p className="text-sm text-muted-foreground">LTV Ratio</p><p className={`font-bold ${Number(facility.ltv_ratio) > 60 ? 'text-yellow-500' : 'text-foreground'}`}>{Number(facility.ltv_ratio).toFixed(1)}%</p></div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Credit Used</span><span className="text-foreground">${(Number(facility.credit_used) / 1e6).toFixed(1)}M / ${(Number(facility.credit_limit) / 1e6).toFixed(0)}M</span></div>
                  <Progress value={(Number(facility.credit_used) / Number(facility.credit_limit)) * 100} className="h-2" />
                </div>
                <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border">
                  <div><p className="text-xs text-muted-foreground">Collateral</p><p className="font-bold text-foreground">${(Number(facility.collateral_value) / 1e6).toFixed(0)}M</p></div>
                  <div><p className="text-xs text-muted-foreground">Available</p><p className="font-bold text-green-500">${((Number(facility.credit_limit) - Number(facility.credit_used)) / 1e6).toFixed(1)}M</p></div>
                  <div className="text-right"><Button size="sm">Draw Funds</Button></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="reporting" className="space-y-4">
          <Card className="bg-card border-border">
            <CardHeader><CardTitle>Available Reports</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { name: "Daily NAV Statement", period: "Daily" },
                  { name: "Monthly Performance Report", period: "Monthly" },
                  { name: "Quarterly Audit Report", period: "Quarterly" },
                  { name: "Tax Documentation (K-1)", period: "Annual" },
                  { name: "Regulatory Filings", period: "As Required" }
                ].map((report, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-lg bg-secondary/30">
                    <div className="flex items-center gap-3"><FileText className="h-5 w-5 text-muted-foreground" /><div><p className="font-medium text-foreground">{report.name}</p><p className="text-sm text-muted-foreground">{report.period}</p></div></div>
                    <Button variant="outline" size="sm">Download</Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-4">
          <Card className="bg-card border-border">
            <CardHeader><CardTitle>Compliance Status</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { name: "KYC/AML", status: "Verified", icon: CheckCircle2, color: "text-green-500" },
                  { name: "Accredited Investor", status: "Verified", icon: CheckCircle2, color: "text-green-500" },
                  { name: "FATCA Reporting", status: "Compliant", icon: CheckCircle2, color: "text-green-500" },
                  { name: "Risk Disclosure", status: "Acknowledged", icon: CheckCircle2, color: "text-green-500" },
                  { name: "Annual Review", status: "Due in 45 days", icon: Clock, color: "text-yellow-500" },
                  { name: "Beneficial Ownership", status: "Update Required", icon: AlertTriangle, color: "text-red-500" }
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-lg bg-secondary/30">
                    <div className="flex items-center gap-3"><item.icon className={`h-5 w-5 ${item.color}`} /><span className="font-medium text-foreground">{item.name}</span></div>
                    <Badge variant="outline" className={item.color}>{item.status}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PrimeServices;
