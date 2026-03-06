import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface AutomationRequest {
  action: "trigger_webhook" | "schedule_task" | "get_automations" | "create_automation" | "run_automation" | "get_logs";
  webhookUrl?: string;
  webhookData?: any;
  automationType?: "zapier" | "n8n" | "molt" | "custom";
  automationId?: string;
  schedule?: string; // cron expression
  name?: string;
  description?: string;
  config?: any;
}

interface Automation {
  id: string;
  name: string;
  type: "zapier" | "n8n" | "molt" | "custom";
  webhookUrl: string;
  schedule?: string;
  isActive: boolean;
  lastRun?: string;
  config: any;
}

// Trigger a webhook (Zapier, n8n, Molt, custom)
async function triggerWebhook(webhookUrl: string, data: any): Promise<any> {
  console.log(`Triggering webhook: ${webhookUrl}`);
  
  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...data,
        timestamp: new Date().toISOString(),
        source: "aiqtp_automation_hub",
        platform: "AI Quantum Trading Portal",
      }),
    });
    
    // Some webhooks (Zapier) don't return proper responses
    let responseData = null;
    try {
      responseData = await response.json();
    } catch {
      responseData = { status: response.status, statusText: response.statusText };
    }
    
    return {
      success: response.ok || response.status === 0, // no-cors returns 0
      statusCode: response.status,
      response: responseData,
      triggeredAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Webhook trigger error:", error);
    throw new Error(`Failed to trigger webhook: ${error.message}`);
  }
}

// Log automation execution
async function logAutomationRun(supabase: any, automationId: string, type: string, status: string, details: any) {
  await supabase
    .from("admin_automation_logs")
    .insert({
      automation_type: type,
      action: `run_${automationId}`,
      status,
      details: {
        automationId,
        ...details,
        timestamp: new Date().toISOString(),
      },
    });
}

// Get all automations for user
async function getAutomations(supabase: any, userId: string): Promise<Automation[]> {
  const { data, error } = await supabase
    .from("admin_settings")
    .select("*")
    .eq("category", "automations")
    .order("updated_at", { ascending: false });
  
  if (error) {
    console.error("Error fetching automations:", error);
    return [];
  }
  
  return (data || []).map((item: any) => ({
    id: item.id,
    name: item.key,
    ...item.value,
  }));
}

// Create or update automation
async function createAutomation(
  supabase: any,
  userId: string,
  name: string,
  type: "zapier" | "n8n" | "molt" | "custom",
  webhookUrl: string,
  schedule?: string,
  config?: any
): Promise<Automation> {
  const automationData = {
    type,
    webhookUrl,
    schedule,
    isActive: true,
    createdAt: new Date().toISOString(),
    userId,
    config: config || {},
  };
  
  const { data, error } = await supabase
    .from("admin_settings")
    .upsert({
      key: name,
      category: "automations",
      value: automationData,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();
  
  if (error) {
    throw new Error(`Failed to create automation: ${error.message}`);
  }
  
  return {
    id: data.id,
    name,
    ...automationData,
  };
}

// Run a specific automation
async function runAutomation(supabase: any, automationId: string, triggerData?: any): Promise<any> {
  // Fetch automation config
  const { data: automation, error } = await supabase
    .from("admin_settings")
    .select("*")
    .eq("id", automationId)
    .single();
  
  if (error || !automation) {
    throw new Error(`Automation not found: ${automationId}`);
  }
  
  const config = automation.value;
  
  if (!config.webhookUrl) {
    throw new Error("Automation has no webhook URL configured");
  }
  
  // Trigger the webhook
  const result = await triggerWebhook(config.webhookUrl, {
    automationId,
    automationName: automation.key,
    automationType: config.type,
    ...triggerData,
  });
  
  // Log the execution
  await logAutomationRun(supabase, automationId, config.type, result.success ? "success" : "failed", result);
  
  // Update last run timestamp
  await supabase
    .from("admin_settings")
    .update({
      value: {
        ...config,
        lastRun: new Date().toISOString(),
      },
      updated_at: new Date().toISOString(),
    })
    .eq("id", automationId);
  
  return result;
}

// Get automation logs
async function getAutomationLogs(supabase: any, limit: number = 100): Promise<any[]> {
  const { data, error } = await supabase
    .from("admin_automation_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  
  if (error) {
    console.error("Error fetching logs:", error);
    return [];
  }
  
  return data || [];
}

// Pre-built automation templates
const AUTOMATION_TEMPLATES = {
  price_alert: {
    name: "Price Alert Notification",
    description: "Send notification when price crosses threshold",
    triggers: ["price_above", "price_below", "price_change_percent"],
    actions: ["send_notification", "trigger_webhook", "execute_trade"],
  },
  trade_executed: {
    name: "Trade Execution Hook",
    description: "Trigger automation when trade is executed",
    triggers: ["order_filled", "order_partial", "order_cancelled"],
    actions: ["log_trade", "update_spreadsheet", "send_notification"],
  },
  daily_report: {
    name: "Daily Portfolio Report",
    description: "Generate and send daily portfolio summary",
    triggers: ["schedule_daily"],
    actions: ["generate_report", "send_email", "trigger_webhook"],
  },
  strategy_signal: {
    name: "Strategy Signal Processor",
    description: "Process AI strategy signals",
    triggers: ["signal_generated", "regime_change"],
    actions: ["evaluate_signal", "create_order", "log_signal"],
  },
  revenue_tracker: {
    name: "Revenue Tracking Automation",
    description: "Track and process platform revenue",
    triggers: ["payment_received", "commission_earned"],
    actions: ["log_revenue", "update_dashboard", "trigger_reinvestment"],
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const body: AutomationRequest = await req.json();
    const { action, webhookUrl, webhookData, automationType, automationId, schedule, name, description, config } = body;
    
    // Get user ID from auth header
    const authHeader = req.headers.get("Authorization");
    let userId: string | null = null;
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id || null;
    }
    
    console.log(`Automation Hub: ${action}`);
    
    let result: any;
    
    switch (action) {
      case "trigger_webhook":
        if (!webhookUrl) throw new Error("Webhook URL required");
        result = await triggerWebhook(webhookUrl, webhookData || {});
        // Log the trigger
        await logAutomationRun(supabase, "direct_trigger", automationType || "custom", result.success ? "success" : "failed", result);
        break;
        
      case "get_automations":
        result = {
          automations: await getAutomations(supabase, userId || "system"),
          templates: AUTOMATION_TEMPLATES,
        };
        break;
        
      case "create_automation":
        if (!name || !webhookUrl || !automationType) {
          throw new Error("Name, webhookUrl, and automationType required");
        }
        result = await createAutomation(supabase, userId || "system", name, automationType, webhookUrl, schedule, config);
        break;
        
      case "run_automation":
        if (!automationId) throw new Error("Automation ID required");
        result = await runAutomation(supabase, automationId, webhookData);
        break;
        
      case "get_logs":
        result = await getAutomationLogs(supabase, 100);
        break;
        
      default:
        throw new Error(`Unknown action: ${action}`);
    }
    
    return new Response(
      JSON.stringify({ success: true, data: result }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    console.error("Automation Hub error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
