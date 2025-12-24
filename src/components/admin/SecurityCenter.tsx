import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import {
  Shield,
  Lock,
  Eye,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  FileText,
  Globe,
  Key,
  Activity
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

interface SecurityEvent {
  id: string;
  type: string;
  severity: "low" | "medium" | "high";
  description: string;
  timestamp: Date;
  resolved: boolean;
}

const SecurityCenter = () => {
  const [securityScore, setSecurityScore] = useState(94);
  const [autoUpdate, setAutoUpdate] = useState(true);
  const [lastScan, setLastScan] = useState(new Date());
  const [isScanning, setIsScanning] = useState(false);
  
  const [securityEvents] = useState<SecurityEvent[]>([
    { id: "1", type: "Login Attempt", severity: "low", description: "Multiple failed login attempts from IP 192.168.1.100", timestamp: new Date(Date.now() - 3600000), resolved: true },
    { id: "2", type: "API Rate Limit", severity: "medium", description: "Rate limit exceeded for API key ak_xxx...xxx", timestamp: new Date(Date.now() - 7200000), resolved: true },
    { id: "3", type: "New Admin", severity: "low", description: "New admin role assigned to user@example.com", timestamp: new Date(Date.now() - 86400000), resolved: true },
  ]);

  const securityChecks = [
    { name: "Row Level Security", status: "enabled", icon: Lock },
    { name: "Database Encryption", status: "enabled", icon: Key },
    { name: "API Authentication", status: "enabled", icon: Shield },
    { name: "Rate Limiting", status: "enabled", icon: Activity },
    { name: "SSL/TLS", status: "enabled", icon: Globe },
    { name: "Leaked Password Protection", status: "warning", icon: AlertTriangle },
  ];

  const runSecurityScan = async () => {
    setIsScanning(true);
    toast.info("Running security scan...");
    
    // Simulate scan
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    setLastScan(new Date());
    setSecurityScore(prev => Math.min(100, prev + Math.floor(Math.random() * 3)));
    setIsScanning(false);
    toast.success("Security scan completed");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Security Center</h1>
          <p className="text-muted-foreground">
            Monitor and manage platform security
          </p>
        </div>
        <Button onClick={runSecurityScan} disabled={isScanning}>
          {isScanning ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Shield className="h-4 w-4 mr-2" />
          )}
          Run Security Scan
        </Button>
      </div>

      {/* Security Score */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="col-span-1 md:col-span-2">
          <CardHeader>
            <CardTitle>Security Score</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative w-32 h-32">
                <svg className="w-32 h-32 -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    className="text-muted"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${securityScore * 3.52} 352`}
                    className={securityScore >= 90 ? "text-green-500" : securityScore >= 70 ? "text-amber-500" : "text-red-500"}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-3xl font-bold">{securityScore}</span>
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold">
                  {securityScore >= 90 ? "Excellent" : securityScore >= 70 ? "Good" : "Needs Attention"}
                </h3>
                <p className="text-muted-foreground">
                  Last scan: {lastScan.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Auto-Updates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Security Updates</p>
                <p className="text-sm text-muted-foreground">Automatically apply patches</p>
              </div>
              <Switch checked={autoUpdate} onCheckedChange={setAutoUpdate} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Scheduled Scans</p>
                <p className="text-sm text-muted-foreground">Every hour</p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Security Checks */}
      <Card>
        <CardHeader>
          <CardTitle>Security Checks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {securityChecks.map((check, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg border">
                <check.icon className={`h-5 w-5 ${
                  check.status === 'enabled' ? 'text-green-500' : 'text-amber-500'
                }`} />
                <div>
                  <p className="font-medium text-sm">{check.name}</p>
                  <Badge variant={check.status === 'enabled' ? 'default' : 'secondary'}>
                    {check.status === 'enabled' ? (
                      <CheckCircle className="h-3 w-3 mr-1" />
                    ) : (
                      <AlertTriangle className="h-3 w-3 mr-1" />
                    )}
                    {check.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Security Events */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Security Events</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {securityEvents.map((event) => (
                <TableRow key={event.id}>
                  <TableCell className="font-medium">{event.type}</TableCell>
                  <TableCell className="text-muted-foreground max-w-xs truncate">
                    {event.description}
                  </TableCell>
                  <TableCell>
                    <Badge variant={
                      event.severity === 'high' ? 'destructive' :
                      event.severity === 'medium' ? 'default' : 'secondary'
                    }>
                      {event.severity}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {event.timestamp.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {event.resolved ? (
                      <Badge variant="outline" className="text-green-500 border-green-500">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Resolved
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-amber-500 border-amber-500">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Pending
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default SecurityCenter;
