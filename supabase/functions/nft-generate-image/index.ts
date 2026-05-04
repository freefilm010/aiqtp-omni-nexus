import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { checkRateLimit, logGeneration, rateLimitResponse } from "../_shared/rateLimiter.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY not configured");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const serviceClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const rateLimitResult = await checkRateLimit(serviceClient, user.id, 'nft-generate-image', 10);
    if (!rateLimitResult.allowed) {
      return rateLimitResponse('nft-generate-image', rateLimitResult);
    }

    const body = await req.json();
    const prompt = body.prompt;
    const nftId = body.nft_id;
    const style = body.style || "digital art";

    if (!prompt || typeof prompt !== "string" || prompt.length < 3 || prompt.length > 2000) {
      return new Response(JSON.stringify({ error: "Prompt must be 3-2000 characters" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const fullPrompt = `Create a high-quality NFT artwork: ${prompt}. Style: ${style}. The image should be vibrant, detailed, and suitable as a collectible digital art piece. Square format, centered composition.`;

    // Ask Claude to generate a detailed SVG representing the NFT art
    const claudePrompt = `You are an expert SVG artist specializing in NFT artwork.

Generate a complete, self-contained SVG (512x512 viewBox) representing the following NFT concept:

"${fullPrompt}"

Requirements:
- Output ONLY the raw SVG markup — no explanations, no markdown fences, no extra text.
- The SVG must start with <svg and end with </svg>.
- Use rich colors, gradients, shapes, and patterns to make it visually striking.
- Include a descriptive <title> element inside the SVG.
- Square format (viewBox="0 0 512 512").`;

    const aiResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 4096,
        messages: [{ role: "user", content: claudePrompt }],
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("Anthropic API error:", errText);
      throw new Error(`AI generation failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();

    // Extract the SVG text from Claude's response
    const rawText: string = aiData.content?.find((c: any) => c.type === "text")?.text || "";

    // Pull out just the <svg>...</svg> block in case Claude added any surrounding text
    const svgMatch = rawText.match(/<svg[\s\S]*<\/svg>/i);
    const svgContent = svgMatch ? svgMatch[0] : rawText;

    // Base64-encode the SVG and produce a data URL
    const svgBase64 = btoa(unescape(encodeURIComponent(svgContent)));
    let imageUrl: string | null = `data:image/svg+xml;base64,${svgBase64}`;

    // Update the NFT record with the image URL if nft_id provided
    if (nftId && imageUrl) {
      await serviceClient.from("user_nfts").update({
        image_url: imageUrl,
        ai_generated: true,
        ai_prompt: prompt,
      }).eq("id", nftId).eq("user_id", user.id);
    }

    await logGeneration(serviceClient, user.id, 'nft-generate-image');

    return new Response(JSON.stringify({ 
      success: true, 
      image_url: imageUrl,
      message: imageUrl ? "Image generated successfully" : "Image generation completed but no image was extracted"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("NFT generation error:", error);
    return new Response(JSON.stringify({ error: (error instanceof Error ? error.message : String(error)) || "Internal server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
