import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Pump.fun chat messages cache
interface ChatMessage {
  user: string;
  message: string;
  timestamp: number;
}

// In-memory cache of recent messages (shared across requests within the same instance)
const messageCache: Map<string, ChatMessage[]> = new Map();

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tokenMint, action } = await req.json();

    if (!tokenMint) {
      return new Response(
        JSON.stringify({ error: "tokenMint is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "getMessages") {
      // Try to fetch messages from pump.fun API
      // Note: This is a simplified version - real implementation would need to handle
      // pump.fun's actual API structure
      
      try {
        // Try to fetch from pump.fun's frontend API
        const response = await fetch(
          `https://frontend-api.pump.fun/coins/${tokenMint}/chat?limit=20`,
          {
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
              "Accept": "application/json",
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          const messages = Array.isArray(data) ? data : (data.messages || []);
          
          return new Response(
            JSON.stringify({ messages, source: "live" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      } catch (e) {
        console.log("Failed to fetch from pump.fun API:", e);
      }

      // If API fails, return cached messages or empty
      const cached = messageCache.get(tokenMint) || [];
      return new Response(
        JSON.stringify({ messages: cached, source: "cache" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // For WebSocket proxy, we would need a more complex setup
    // This is a polling-based fallback
    return new Response(
      JSON.stringify({ 
        error: "Unknown action",
        supportedActions: ["getMessages"]
      }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (e) {
    console.error("pumpfun-chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
