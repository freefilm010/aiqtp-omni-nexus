import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  CreditCard,
  Settings,
  CheckCircle,
  XCircle,
  AlertCircle,
  ExternalLink,
  Key
} from "lucide-react";
import { paymentProcessors, PaymentProcessor } from "@/lib/payments/mockProcessors";
import { toast } from "sonner";

const PaymentProcessors = () => {
  const [processors, setProcessors] = useState<(PaymentProcessor & { enabled: boolean })[]>(
    paymentProcessors.map(p => ({ ...p, enabled: p.isConfigured }))
  );
  const [selectedProcessor, setSelectedProcessor] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState("");

  const toggleProcessor = (id: string) => {
    setProcessors(prev =>
      prev.map(p =>
        p.id === id ? { ...p, enabled: !p.enabled } : p
      )
    );
  };

  const configureProcessor = (id: string) => {
    if (apiKey.trim()) {
      setProcessors(prev =>
        prev.map(p =>
          p.id === id ? { ...p, isConfigured: true, enabled: true } : p
        )
      );
      toast.success(`${id} configured successfully`);
      setApiKey("");
      setSelectedProcessor(null);
    } else {
      toast.error("Please enter an API key");
    }
  };

  const getProcessorIcon = (id: string) => {
    const icons: Record<string, string> = {
      stripe: "💳",
      paypal: "🅿️",
      onramper: "🔗",
      simplex: "💎",
      moonpay: "🌙"
    };
    return icons[id] || "💰";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Payment Processors</h1>
          <p className="text-muted-foreground">
            Configure payment gateways and crypto on-ramps
          </p>
        </div>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Processors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {processors.filter(p => p.enabled).length} / {processors.length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Configured
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {processors.filter(p => p.isConfigured).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Setup
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-500">
              {processors.filter(p => !p.isConfigured).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Processor Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {processors.map((processor) => (
          <Card key={processor.id} className={processor.enabled ? "border-primary" : ""}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{getProcessorIcon(processor.id)}</span>
                  <div>
                    <CardTitle>{processor.name}</CardTitle>
                    <CardDescription>
                      {processor.fees.percent}% + ${processor.fees.fixed} per tx
                    </CardDescription>
                  </div>
                </div>
                <Switch
                  checked={processor.enabled}
                  onCheckedChange={() => toggleProcessor(processor.id)}
                  disabled={!processor.isConfigured}
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                {processor.isConfigured ? (
                  <Badge variant="default" className="bg-green-500">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Configured
                  </Badge>
                ) : (
                  <Badge variant="secondary">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Needs Setup
                  </Badge>
                )}
                {processor.enabled && (
                  <Badge variant="outline" className="text-green-500 border-green-500">
                    Active
                  </Badge>
                )}
              </div>

              <div className="flex flex-wrap gap-1">
                {processor.supportedCurrencies.slice(0, 4).map(currency => (
                  <Badge key={currency} variant="secondary" className="text-xs">
                    {currency}
                  </Badge>
                ))}
                {processor.supportedCurrencies.length > 4 && (
                  <Badge variant="secondary" className="text-xs">
                    +{processor.supportedCurrencies.length - 4}
                  </Badge>
                )}
              </div>

              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant={processor.isConfigured ? "outline" : "default"}
                    className="w-full"
                    onClick={() => setSelectedProcessor(processor.id)}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    {processor.isConfigured ? "Update Configuration" : "Configure"}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Configure {processor.name}</DialogTitle>
                    <DialogDescription>
                      Enter your API credentials to enable {processor.name} payments.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="apiKey">API Key</Label>
                      <div className="relative">
                        <Key className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="apiKey"
                          type="password"
                          placeholder="Enter your API key"
                          value={apiKey}
                          onChange={(e) => setApiKey(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <p>Don't have an API key?</p>
                      <a
                        href={`https://${processor.id === 'stripe' ? 'dashboard.stripe.com' : processor.id === 'paypal' ? 'developer.paypal.com' : processor.id + '.com'}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline flex items-center gap-1"
                      >
                        Get one from {processor.name}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      onClick={() => configureProcessor(processor.id)}
                    >
                      Save Configuration
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Integration Guide */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Setup Guide</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium">Fiat Payments (Stripe, PayPal)</h4>
              <ol className="text-sm text-muted-foreground list-decimal list-inside space-y-1">
                <li>Create an account on the payment provider</li>
                <li>Generate API keys from the dashboard</li>
                <li>Enter keys in the configuration dialog</li>
                <li>Enable the processor</li>
              </ol>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Crypto On-Ramps (Onramper, Simplex, MoonPay)</h4>
              <ol className="text-sm text-muted-foreground list-decimal list-inside space-y-1">
                <li>Apply for a merchant account</li>
                <li>Complete KYB verification</li>
                <li>Configure webhook endpoints</li>
                <li>Add API credentials here</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentProcessors;
