import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.claims.sub;
    console.log(`Authenticated user ${userId} accessing blockchain-research`);

    const { researchType, context } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let systemPrompt = "";
    let userPrompt = "";

    switch (researchType) {
      case "ecosystem_opportunities":
        systemPrompt = `You are an expert blockchain and Web3 researcher specializing in identifying market gaps and emerging opportunities. You analyze data from multiple sources including DeFi protocols, NFT markets, institutional adoption, regulatory trends, and technological innovations.

Your role is to identify the TOP 5 most promising blockchain ecosystem opportunities that don't yet exist or are underserved. Consider:
- Market size and growth potential
- Technical feasibility with current technology
- Regulatory landscape
- Competition and barriers to entry
- Integration with AI, quantum computing, and emerging tech
- Real-world utility and adoption potential

Focus on practical, implementable ecosystems that could generate significant value.`;
        
        userPrompt = `Analyze the current blockchain landscape and identify the TOP 5 most promising blockchain ecosystem opportunities. For each opportunity, provide:

1. **Ecosystem Name**: A catchy, memorable name
2. **Category**: (e.g., DeFi, Insurance, Healthcare, Supply Chain, etc.)
3. **Problem Solved**: What gap or problem does this address?
4. **Market Size**: Estimated TAM (Total Addressable Market)
5. **Key Features**: 3-5 core features
6. **Tech Stack**: Required technologies (blockchain, AI, quantum, etc.)
7. **Monetization**: How it generates revenue
8. **Competition Level**: Low/Medium/High
9. **Implementation Difficulty**: Easy/Medium/Hard
10. **Priority Score**: 1-100 based on opportunity vs difficulty

${context ? `Additional context to consider: ${context}` : ""}

Format your response as a structured analysis with clear sections for each ecosystem.`;
        break;

      case "quantum_insurance":
        systemPrompt = `You are an expert in quantum computing applications and insurance/risk management. You understand how quantum algorithms can revolutionize actuarial science, risk modeling, fraud detection, and claims processing.`;
        
        userPrompt = `Design a comprehensive Quantum-Enhanced Insurance Blockchain Ecosystem. Include:

1. **Core Architecture**: How quantum computing integrates with blockchain for insurance
2. **Use Cases**: 
   - Parametric insurance with quantum risk modeling
   - Fraud detection using quantum ML
   - Real-time claims verification
   - Dynamic premium calculation
3. **Token Economics**: Native token utility and value capture
4. **Technical Requirements**: Quantum hardware, blockchain platform, oracles
5. **Regulatory Considerations**: Compliance framework
6. **Implementation Roadmap**: Phases and milestones
7. **Revenue Model**: How the ecosystem generates sustainable income

${context ? `Additional context: ${context}` : ""}`;
        break;

      case "data_ecosystem_analysis":
        systemPrompt = `You are an expert in data economics, privacy-preserving computation, and decentralized data marketplaces. You understand how data can be tokenized, valued, and traded while maintaining privacy and compliance.`;
        
        userPrompt = `Analyze how the $DATA token ecosystem can be expanded. Consider:

1. **New Data Categories**: What data types are most valuable but underserved?
2. **Child Token Opportunities**: New mining tokens for specific data verticals
3. **Cross-Chain Integration**: How to bridge data value across blockchains
4. **Enterprise Adoption**: B2B data marketplace opportunities
5. **Privacy Tech**: Zero-knowledge proofs, secure enclaves, federated learning
6. **AI Integration**: How AI models can consume and create data value
7. **Regulatory Compliance**: GDPR, CCPA, data sovereignty

${context ? `Additional context: ${context}` : ""}`;
        break;

      default:
        systemPrompt = `You are a comprehensive blockchain and Web3 research assistant with expertise in DeFi, NFTs, DAOs, tokenomics, and emerging blockchain applications.`;
        userPrompt = context || "Provide an overview of the most promising blockchain ecosystem opportunities.";
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Credits required. Please add funds to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI research service unavailable" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Research error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
