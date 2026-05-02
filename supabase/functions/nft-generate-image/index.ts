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
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY") ?? Deno.env.get("ANTHROPIC_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

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

    // Use Lovable AI image generation model
    const aiResponse = await fetch("https://api.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: "google/gemini-3.1-flash-image-preview",
        messages: [
          {
            role: "user",
            content: fullPrompt,
          },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI API error:", errText);
      throw new Error(`AI generation failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    
    // Extract image from response
    let imageUrl: string | null = null;
    const message = aiData.choices?.[0]?.message;
    
    if (message?.content) {
      // Check for inline image data or URL in the response
      if (Array.isArray(message.content)) {
        for (const part of message.content) {
          if (part.type === "image_url") {
            imageUrl = part.image_url?.url || null;
          } else if (part.type === "image" && part.source?.data) {
            // Base64 image - upload to storage
            const base64Data = part.source.data;
            const imageBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
            const fileName = `nft-${user.id}-${Date.now()}.png`;
            
            const { error: uploadError } = await serviceClient.storage
              .from("chat-attachments")
              .upload(`nft-images/${fileName}`, imageBytes, {
                contentType: "image/png",
                upsert: true,
              });
            
            if (!uploadError) {
              const { data: urlData } = serviceClient.storage
                .from("chat-attachments")
                .getPublicUrl(`nft-images/${fileName}`);
              imageUrl = urlData.publicUrl;
            }
          }
        }
      } else if (typeof message.content === "string") {
        // Check if it contains a markdown image or data URL
        const imgMatch = message.content.match(/!\[.*?\]\((.*?)\)/);
        if (imgMatch) {
          imageUrl = imgMatch[1];
        }
        const dataUrlMatch = message.content.match(/(data:image\/[^;]+;base64,[^\s"]+)/);
        if (dataUrlMatch) {
          // Upload data URL to storage
          const dataUrl = dataUrlMatch[1];
          const base64Part = dataUrl.split(",")[1];
          const mimeMatch = dataUrl.match(/data:(image\/[^;]+)/);
          const mime = mimeMatch ? mimeMatch[1] : "image/png";
          const ext = mime.split("/")[1] || "png";
          
          const imageBytes = Uint8Array.from(atob(base64Part), c => c.charCodeAt(0));
          const fileName = `nft-${user.id}-${Date.now()}.${ext}`;
          
          const { error: uploadError } = await serviceClient.storage
            .from("chat-attachments")
            .upload(`nft-images/${fileName}`, imageBytes, {
              contentType: mime,
              upsert: true,
            });
          
          if (!uploadError) {
            const { data: urlData } = serviceClient.storage
              .from("chat-attachments")
              .getPublicUrl(`nft-images/${fileName}`);
            imageUrl = urlData.publicUrl;
          }
        }
      }
    }

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
