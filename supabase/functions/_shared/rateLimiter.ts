const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  used: number;
  limit: number;
  canExtend: boolean;
  extensionCost: number;
}

/**
 * Check rate limit for a user on a specific function.
 * Base limit: 10 calls/hour. Extensions add extra calls at 15% surcharge.
 */
export async function checkRateLimit(
  supabaseClient: any,
  userId: string,
  functionName: string,
  baseLimit = 10
): Promise<RateLimitResult> {
  const oneHourAgo = new Date(Date.now() - 3600000).toISOString();

  // Count recent calls
  const { count, error } = await supabaseClient
    .from('ai_generation_logs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('function_name', functionName)
    .gte('created_at', oneHourAgo);

  if (error) {
    console.error('Rate limit check error:', error);
  }

  const used = count || 0;

  // Check for active extensions
  const { data: extensions } = await supabaseClient
    .from('rate_limit_extensions')
    .select('extra_calls, calls_used')
    .eq('user_id', userId)
    .eq('function_name', functionName)
    .eq('status', 'active')
    .gte('expires_at', new Date().toISOString());

  let extraCalls = 0;
  let extraUsed = 0;
  if (extensions && extensions.length > 0) {
    for (const ext of extensions as Array<{ extra_calls: number; calls_used: number }>) {
      extraCalls += ext.extra_calls;
      extraUsed += ext.calls_used;
    }
  }

  const totalLimit = baseLimit + extraCalls;
  const totalUsed = used;
  const allowed = totalUsed < totalLimit;

  return {
    allowed,
    remaining: Math.max(0, totalLimit - totalUsed),
    used: totalUsed,
    limit: totalLimit,
    canExtend: !allowed,
    extensionCost: 15, // 15% surcharge
  };
}

/**
 * Log an AI generation call for rate limiting.
 */
export async function logGeneration(
  supabaseClient: any,
  userId: string,
  functionName: string
): Promise<void> {
  await supabaseClient
    .from('ai_generation_logs')
    .insert({ user_id: userId, function_name: functionName });
}

/**
 * Create a rate limit exceeded response with extension offer.
 */
export function rateLimitResponse(functionName: string, result: RateLimitResult) {
  return new Response(
    JSON.stringify({
      error: `Rate limit exceeded: Maximum ${result.limit} calls per hour for ${functionName}.`,
      rate_limit: {
        used: result.used,
        limit: result.limit,
        remaining: 0,
        resets_in_seconds: 3600,
      },
      extension_available: {
        extra_calls: 10,
        surcharge_percent: 15,
        message: "Purchase a rate limit extension for 10 additional calls at a 15% surcharge.",
        action: "POST /rate-limit-extension",
      },
    }),
    { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

/**
 * Validate and sanitize a text input.
 */
export function validateText(input: unknown, fieldName: string, maxLength: number): string | null {
  if (!input || typeof input !== 'string') return null;
  const sanitized = input.trim();
  if (sanitized.length === 0) return null;
  if (sanitized.length > maxLength) return sanitized.substring(0, maxLength);
  return sanitized;
}

/**
 * Validate messages array for chat-style inputs.
 */
export function validateMessages(
  messages: unknown,
  maxMessages = 50,
  maxContentLength = 10000
): { valid: boolean; error?: string; sanitized?: Array<{ role: string; content: string }> } {
  if (!Array.isArray(messages)) {
    return { valid: false, error: 'messages must be an array' };
  }
  if (messages.length === 0) {
    return { valid: false, error: 'messages cannot be empty' };
  }
  if (messages.length > maxMessages) {
    return { valid: false, error: `Too many messages: maximum ${maxMessages}` };
  }

  const sanitized = [];
  for (const msg of messages as Array<{ role?: unknown; content?: unknown }>) {
    if (!msg || typeof msg !== 'object') {
      return { valid: false, error: 'Each message must be an object' };
    }
    const role = typeof msg.role === 'string' ? msg.role.trim() : '';
    const content = typeof msg.content === 'string' ? msg.content.trim() : '';
    
    if (!['user', 'assistant', 'system'].includes(role)) {
      return { valid: false, error: `Invalid role: ${role}` };
    }
    if (content.length === 0) {
      return { valid: false, error: 'Message content cannot be empty' };
    }
    if (content.length > maxContentLength) {
      return { valid: false, error: `Message too long: maximum ${maxContentLength} characters` };
    }
    sanitized.push({ role, content });
  }

  return { valid: true, sanitized };
}

/**
 * Standard AI error response with user-friendly messages.
 */
export function aiErrorResponse(status: number, errorText: string) {
  if (status === 429) {
    return new Response(
      JSON.stringify({ error: 'AI service is temporarily busy. Please wait a moment and try again.' }),
      { status: 429, headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' } }
    );
  }
  if (status === 402) {
    return new Response(
      JSON.stringify({ error: 'AI credits exhausted. Please add credits to your workspace to continue.' }),
      { status: 402, headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' } }
    );
  }
  console.error('AI API error:', status, errorText);
  return new Response(
    JSON.stringify({ error: 'An unexpected error occurred with the AI service. Please try again.' }),
    { status: 502, headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' } }
  );
}
