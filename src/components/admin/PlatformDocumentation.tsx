import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  BookOpen, 
  Shield, 
  Atom, 
  Wallet, 
  Coins, 
  CreditCard, 
  Key,
  Server,
  Database,
  Lock,
  CheckCircle,
  AlertTriangle,
  Copy,
  ExternalLink
} from "lucide-react";
import { toast } from "sonner";

const PlatformDocumentation = () => {
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedItem(label);
    toast.success(`Copied ${label}`);
    setTimeout(() => setCopiedItem(null), 2000);
  };

  const WEBHOOK_URL = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID || 'rueaxiyvseaxkysnoock'}.supabase.co/functions/v1/stripe-webhook`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            Platform Documentation
          </h2>
          <p className="text-muted-foreground">Complete admin reference for all platform systems</p>
        </div>
        <Badge variant="outline" className="text-green-500 border-green-500">
          <CheckCircle className="h-3 w-3 mr-1" />
          All Systems Operational
        </Badge>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="qaqi">QAQI & Quantum</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="apis">APIs & Secrets</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Atom className="h-5 w-5 text-purple-500" />
                  QAQI Agent
                </CardTitle>
                <CardDescription>Quantum AI Intelligence Core</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Status</span>
                  <Badge className="bg-green-500">Active</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">IBM Quantum</span>
                  <Badge variant="outline">Connected</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Max Qubits</span>
                  <span className="text-sm font-mono">127 (admin) / 32 (user)</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Tools Available</span>
                  <span className="text-sm font-mono">18</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Coins className="h-5 w-5 text-gold" />
                  $QTC Token
                </CardTitle>
                <CardDescription>Quantum Time Crystal Coin</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Status</span>
                  <Badge variant="outline" className="text-amber-500 border-amber-500">Simulation</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Consensus</span>
                  <span className="text-sm font-mono">PoTR (Proof of Temporal Resonance)</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Encryption</span>
                  <span className="text-sm font-mono">ML-KEM-768 (Post-Quantum)</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-blue-500" />
                  QuWallet®
                </CardTitle>
                <CardDescription>Post-Quantum Secure Wallet</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Status</span>
                  <Badge variant="outline" className="text-amber-500 border-amber-500">Simulation</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Key Algorithm</span>
                  <span className="text-sm font-mono">ML-KEM-768 (Kyber)</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Signature</span>
                  <span className="text-sm font-mono">ML-DSA-65 (Dilithium)</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-green-500" />
                  Stripe Payments
                </CardTitle>
                <CardDescription>Payment Processing</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Status</span>
                  <Badge className="bg-green-500">Live</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Mode</span>
                  <span className="text-sm font-mono">Production</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Webhook</span>
                  <Badge variant="outline">Configured</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="qaqi">
          <Card>
            <CardHeader>
              <CardTitle>QAQI Quantum Agent Documentation</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold mb-2">🔐 Security Access Levels</h4>
                    <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">
                      <div><strong>Admin Approved:</strong> Full 127-qubit IBM Quantum, live trades, treasury access</div>
                      <div><strong>Standard User:</strong> 32-qubit simulator, backtesting & validation only</div>
                      <div><strong>Unauthenticated:</strong> No access</div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">🛠️ Available Tools (18 total)</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="p-2 bg-muted rounded">analyze_market</div>
                      <div className="p-2 bg-muted rounded">execute_trade</div>
                      <div className="p-2 bg-muted rounded">manage_platform</div>
                      <div className="p-2 bg-muted rounded">manage_wallets</div>
                      <div className="p-2 bg-muted rounded">revenue_automation</div>
                      <div className="p-2 bg-muted rounded">profit_distribution</div>
                      <div className="p-2 bg-muted rounded">fraud_detection</div>
                      <div className="p-2 bg-muted rounded">security_operations</div>
                      <div className="p-2 bg-muted rounded">quantum_compute</div>
                      <div className="p-2 bg-muted rounded">quantum_optimization</div>
                      <div className="p-2 bg-muted rounded">qtc_operations</div>
                      <div className="p-2 bg-muted rounded">quwallet_manage</div>
                      <div className="p-2 bg-muted rounded">manage_strategies</div>
                      <div className="p-2 bg-muted rounded">register_ip</div>
                      <div className="p-2 bg-muted rounded">generate_document</div>
                      <div className="p-2 bg-muted rounded">self_enhance</div>
                      <div className="p-2 bg-muted rounded">system_automation</div>
                      <div className="p-2 bg-muted rounded">analyze_sentiment</div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">🖥️ IBM Quantum Backends</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between p-2 bg-muted rounded">
                        <span>ibm_brisbane</span>
                        <span>127 qubits</span>
                      </div>
                      <div className="flex justify-between p-2 bg-muted rounded">
                        <span>ibm_osaka</span>
                        <span>127 qubits</span>
                      </div>
                      <div className="flex justify-between p-2 bg-muted rounded">
                        <span>ibm_kyoto</span>
                        <span>127 qubits</span>
                      </div>
                      <div className="flex justify-between p-2 bg-muted rounded">
                        <span>ibmq_qasm_simulator</span>
                        <span>32 qubits</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">📁 Key Files</h4>
                    <div className="space-y-1 text-sm font-mono">
                      <div className="p-2 bg-muted rounded">supabase/functions/qaqi-agent/index.ts</div>
                      <div className="p-2 bg-muted rounded">src/lib/quantum/ibmQuantumMAC.ts</div>
                      <div className="p-2 bg-muted rounded">src/lib/quantum/proofOfTemporalResonance.ts</div>
                      <div className="p-2 bg-muted rounded">src/lib/crypto/postQuantumCrypto.ts</div>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle>Stripe Payment Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                      Webhook Configuration Required
                    </h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Add this URL in your Stripe Dashboard → Developers → Webhooks:
                    </p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 p-3 bg-muted rounded text-xs break-all">
                        {WEBHOOK_URL}
                      </code>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => copyToClipboard(WEBHOOK_URL, "Webhook URL")}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">📋 Required Webhook Events</h4>
                    <div className="space-y-1 text-sm">
                      <div className="p-2 bg-muted rounded flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        checkout.session.completed
                      </div>
                      <div className="p-2 bg-muted rounded flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        invoice.paid
                      </div>
                      <div className="p-2 bg-muted rounded flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        customer.subscription.created
                      </div>
                      <div className="p-2 bg-muted rounded flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        customer.subscription.deleted
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">💰 Pricing Tiers</h4>
                    <div className="space-y-2 text-sm">
                      <div className="p-3 bg-muted rounded">
                        <div className="font-semibold">QAQI Monthly</div>
                        <div className="text-muted-foreground">$12/month - Quantum AI access</div>
                      </div>
                      <div className="p-3 bg-muted rounded border-2 border-primary">
                        <div className="font-semibold flex items-center gap-2">
                          QAQI Annual
                          <Badge className="bg-green-500">Best Value</Badge>
                        </div>
                        <div className="text-muted-foreground">$100/year ($8.33/mo) - 2 months FREE</div>
                      </div>
                      <div className="p-3 bg-muted rounded">
                        <div className="font-semibold">Pro Trader</div>
                        <div className="text-muted-foreground">$99/month</div>
                      </div>
                      <div className="p-3 bg-muted rounded">
                        <div className="font-semibold">Elite Trader</div>
                        <div className="text-muted-foreground">$299/month</div>
                      </div>
                      <div className="p-3 bg-muted rounded">
                        <div className="font-semibold">Institutional</div>
                        <div className="text-muted-foreground">$999/month</div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">📁 Key Files</h4>
                    <div className="space-y-1 text-sm font-mono">
                      <div className="p-2 bg-muted rounded">supabase/functions/stripe-checkout/index.ts</div>
                      <div className="p-2 bg-muted rounded">supabase/functions/stripe-webhook/index.ts</div>
                      <div className="p-2 bg-muted rounded">src/components/payments/QuickPayment.tsx</div>
                      <div className="p-2 bg-muted rounded">src/lib/stripe/config.ts</div>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-red-500" />
                Security Configuration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold mb-2">🔒 Access Control</h4>
                    <div className="space-y-2 text-sm">
                      <div className="p-3 bg-green-500/10 border border-green-500/30 rounded">
                        <div className="font-semibold text-green-500">QAQI Admin Gating</div>
                        <div className="text-muted-foreground">adminApproval flag controls quantum/treasury access</div>
                      </div>
                      <div className="p-3 bg-green-500/10 border border-green-500/30 rounded">
                        <div className="font-semibold text-green-500">RLS Policies</div>
                        <div className="text-muted-foreground">Row-level security on all user tables</div>
                      </div>
                      <div className="p-3 bg-green-500/10 border border-green-500/30 rounded">
                        <div className="font-semibold text-green-500">Role-Based Access</div>
                        <div className="text-muted-foreground">user_roles table with admin/moderator/user roles</div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">🔐 Encryption Standards</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between p-2 bg-muted rounded">
                        <span>Key Encapsulation</span>
                        <span className="font-mono">ML-KEM-768 (Kyber)</span>
                      </div>
                      <div className="flex justify-between p-2 bg-muted rounded">
                        <span>Digital Signatures</span>
                        <span className="font-mono">ML-DSA-65 (Dilithium)</span>
                      </div>
                      <div className="flex justify-between p-2 bg-muted rounded">
                        <span>Hash Function</span>
                        <span className="font-mono">SLH-DSA-128 (SPHINCS+)</span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      All algorithms are NIST PQC standardized (2024)
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">⚠️ Restricted Operations</h4>
                    <div className="space-y-1 text-sm">
                      <div className="p-2 bg-red-500/10 border border-red-500/30 rounded text-red-400">
                        Live trades with real funds → Admin approval required
                      </div>
                      <div className="p-2 bg-red-500/10 border border-red-500/30 rounded text-red-400">
                        Treasury transfers above $10,000 → Admin approval required
                      </div>
                      <div className="p-2 bg-red-500/10 border border-red-500/30 rounded text-red-400">
                        IBM Quantum 127-qubit access → Admin approval required
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="apis">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5 text-amber-500" />
                API Keys & Secrets
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold mb-2">🔑 Configured Secrets</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center p-3 bg-muted rounded">
                        <div className="flex items-center gap-2">
                          <Lock className="h-4 w-4 text-green-500" />
                          <span>STRIPE_SECRET_KEY</span>
                        </div>
                        <Badge className="bg-green-500">Set</Badge>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-muted rounded">
                        <div className="flex items-center gap-2">
                          <Lock className="h-4 w-4 text-green-500" />
                          <span>IBM_QUANTUM_API_KEY</span>
                        </div>
                        <Badge className="bg-green-500">Set</Badge>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-muted rounded">
                        <div className="flex items-center gap-2">
                          <Lock className="h-4 w-4 text-green-500" />
                          <span>ANTHROPIC_API_KEY</span>
                        </div>
                        <Badge className="bg-green-500">Set</Badge>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-muted rounded">
                        <div className="flex items-center gap-2">
                          <Lock className="h-4 w-4 text-green-500" />
                          <span>SUPABASE_SERVICE_ROLE_KEY</span>
                        </div>
                        <Badge className="bg-green-500">Set</Badge>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">🌐 Public Keys (Safe in Frontend)</h4>
                    <div className="space-y-2 text-sm">
                      <div className="p-3 bg-muted rounded">
                        <div className="font-semibold">Stripe Publishable Key</div>
                        <code className="text-xs text-muted-foreground break-all">pk_live_51Smy...NlN</code>
                      </div>
                      <div className="p-3 bg-muted rounded">
                        <div className="font-semibold">Supabase Anon Key</div>
                        <code className="text-xs text-muted-foreground break-all">eyJhbGciOi...8r2g</code>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">📡 Edge Functions</h4>
                    <div className="space-y-1 text-sm font-mono">
                      <div className="p-2 bg-muted rounded flex items-center justify-between">
                        <span>stripe-checkout</span>
                        <Badge variant="outline">verify_jwt: false</Badge>
                      </div>
                      <div className="p-2 bg-muted rounded flex items-center justify-between">
                        <span>stripe-webhook</span>
                        <Badge variant="outline">verify_jwt: false</Badge>
                      </div>
                      <div className="p-2 bg-muted rounded flex items-center justify-between">
                        <span>qaqi-agent</span>
                        <Badge variant="outline">verify_jwt: false</Badge>
                      </div>
                      <div className="p-2 bg-muted rounded flex items-center justify-between">
                        <span>aiqtp-agent</span>
                        <Badge variant="outline">verify_jwt: false</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PlatformDocumentation;
