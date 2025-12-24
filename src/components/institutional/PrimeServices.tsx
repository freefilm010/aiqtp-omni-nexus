import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Building2,
  Shield,
  Wallet,
  TrendingUp,
  Lock,
  FileText,
  Users,
  Briefcase,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Banknote,
  PiggyBank,
  BarChart3
} from "lucide-react";

interface CustodyAccount {
  id: string;
  name: string;
  type: string;
  balance: number;
  currency: string;
  status: "active" | "pending" | "restricted";
  insurance: number;
  lastAudit: string;
}

interface MarginFacility {
  id: string;
  type: string;
  limit: number;
  used: number;
  rate: number;
  collateral: number;
  ltv: number;
  status: "active" | "warning" | "margin_call";
}

const mockCustodyAccounts: CustodyAccount[] = [
  {
    id: "1",
    name: "Main Custody Vault",
    type: "Cold Storage",
    balance: 125000000,
    currency: "USD",
    status: "active",
    insurance: 100000000,
    lastAudit: "2024-01-15"
  },
  {
    id: "2",
    name: "Trading Hot Wallet",
    type: "Hot Wallet",
    balance: 8500000,
    currency: "USD",
    status: "active",
    insurance: 10000000,
    lastAudit: "2024-01-18"
  },
  {
    id: "3",
    name: "Staking Pool",
    type: "Staking",
    balance: 42000000,
    currency: "USD",
    status: "active",
    insurance: 50000000,
    lastAudit: "2024-01-10"
  }
];

const mockMarginFacilities: MarginFacility[] = [
  {
    id: "1",
    type: "Portfolio Margin",
    limit: 50000000,
    used: 32000000,
    rate: 4.5,
    collateral: 85000000,
    ltv: 37.6,
    status: "active"
  },
  {
    id: "2",
    type: "Securities Lending",
    limit: 25000000,
    used: 18500000,
    rate: 3.2,
    collateral: 28000000,
    ltv: 66.1,
    status: "warning"
  }
];

const PrimeServices = () => {
  const [activeTab, setActiveTab] = useState("custody");

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "text-green-500 bg-green-500/10";
      case "pending": return "text-yellow-500 bg-yellow-500/10";
      case "restricted": return "text-red-500 bg-red-500/10";
      case "warning": return "text-yellow-500 bg-yellow-500/10";
      case "margin_call": return "text-red-500 bg-red-500/10";
      default: return "text-muted-foreground";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Prime Services</h2>
          <p className="text-muted-foreground">Institutional-grade custody, margin, and lending</p>
        </div>
        <Button>
          <FileText className="h-4 w-4 mr-2" />
          Request Statement
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Wallet className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total AUM</p>
                <p className="text-xl font-bold text-foreground">$175.5M</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Shield className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Insurance Coverage</p>
                <p className="text-xl font-bold text-green-500">$160M</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Banknote className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Credit Available</p>
                <p className="text-xl font-bold text-foreground">$24.5M</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/10">
                <PiggyBank className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Staking Yield</p>
                <p className="text-xl font-bold text-foreground">6.8% APY</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="custody">Custody</TabsTrigger>
          <TabsTrigger value="margin">Margin & Lending</TabsTrigger>
          <TabsTrigger value="reporting">Reporting</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
        </TabsList>

        <TabsContent value="custody" className="space-y-4">
          {mockCustodyAccounts.map((account) => (
            <Card key={account.id} className="bg-card border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-primary/10">
                      {account.type === "Cold Storage" ? (
                        <Lock className="h-6 w-6 text-primary" />
                      ) : account.type === "Staking" ? (
                        <TrendingUp className="h-6 w-6 text-primary" />
                      ) : (
                        <Wallet className="h-6 w-6 text-primary" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-foreground">{account.name}</h3>
                        <Badge className={getStatusColor(account.status)}>
                          {account.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{account.type}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-8 text-right">
                    <div>
                      <p className="text-xs text-muted-foreground">Balance</p>
                      <p className="font-bold text-foreground">
                        ${(account.balance / 1000000).toFixed(1)}M
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Insurance</p>
                      <p className="font-bold text-green-500">
                        ${(account.insurance / 1000000).toFixed(0)}M
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Last Audit</p>
                      <p className="font-bold text-foreground">{account.lastAudit}</p>
                    </div>
                  </div>

                  <Button variant="outline" size="sm">
                    Manage
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Features
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Multi-Sig", status: "Active", icon: Users },
                  { label: "HSM Protection", status: "Enabled", icon: Lock },
                  { label: "SOC 2 Type II", status: "Certified", icon: CheckCircle2 },
                  { label: "Cold Storage", status: "95%", icon: Shield }
                ].map((feature, i) => (
                  <div key={i} className="p-4 rounded-lg bg-secondary/50">
                    <feature.icon className="h-5 w-5 text-primary mb-2" />
                    <p className="text-sm text-muted-foreground">{feature.label}</p>
                    <p className="font-bold text-foreground">{feature.status}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="margin" className="space-y-4">
          {mockMarginFacilities.map((facility) => (
            <Card key={facility.id} className="bg-card border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-foreground">{facility.type}</h3>
                      <Badge className={getStatusColor(facility.status)}>
                        {facility.status.replace("_", " ")}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Rate: {facility.rate}% APR
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">LTV Ratio</p>
                    <p className={`font-bold ${facility.ltv > 60 ? 'text-yellow-500' : 'text-foreground'}`}>
                      {facility.ltv}%
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Credit Used</span>
                    <span className="text-foreground">
                      ${(facility.used / 1000000).toFixed(1)}M / ${(facility.limit / 1000000).toFixed(0)}M
                    </span>
                  </div>
                  <Progress 
                    value={(facility.used / facility.limit) * 100} 
                    className="h-2"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border">
                  <div>
                    <p className="text-xs text-muted-foreground">Collateral</p>
                    <p className="font-bold text-foreground">
                      ${(facility.collateral / 1000000).toFixed(0)}M
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Available</p>
                    <p className="font-bold text-green-500">
                      ${((facility.limit - facility.used) / 1000000).toFixed(1)}M
                    </p>
                  </div>
                  <div className="text-right">
                    <Button size="sm">Draw Funds</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="reporting" className="space-y-4">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Available Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { name: "Daily NAV Statement", period: "Daily", lastGenerated: "Today" },
                  { name: "Monthly Performance Report", period: "Monthly", lastGenerated: "Jan 1, 2024" },
                  { name: "Quarterly Audit Report", period: "Quarterly", lastGenerated: "Dec 31, 2023" },
                  { name: "Tax Documentation (K-1)", period: "Annual", lastGenerated: "Dec 31, 2023" },
                  { name: "Regulatory Filings", period: "As Required", lastGenerated: "Jan 15, 2024" }
                ].map((report, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-lg bg-secondary/30">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-foreground">{report.name}</p>
                        <p className="text-sm text-muted-foreground">{report.period}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-muted-foreground">
                        Last: {report.lastGenerated}
                      </span>
                      <Button variant="outline" size="sm">Download</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-4">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Compliance Status</CardTitle>
            </CardHeader>
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
                    <div className="flex items-center gap-3">
                      <item.icon className={`h-5 w-5 ${item.color}`} />
                      <span className="font-medium text-foreground">{item.name}</span>
                    </div>
                    <Badge variant="outline" className={item.color}>
                      {item.status}
                    </Badge>
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
