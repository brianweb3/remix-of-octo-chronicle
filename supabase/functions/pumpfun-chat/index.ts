import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Browser-like headers
const browserHeaders = {
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  "Accept": "application/json",
  "Accept-Language": "en-US,en;q=0.9",
  "Origin": "https://pump.fun",
  "Referer": "https://pump.fun/",
};

async function tryFetchMessages(url: string, name: string): Promise<any[]> {
  try {
    console.log(`[pumpfun-chat] Trying ${name}: ${url}`);
    const response = await fetch(url, { headers: browserHeaders });
    console.log(`[pumpfun-chat] ${name} status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      
      if (Array.isArray(data)) {
        console.log(`[pumpfun-chat] ${name} returned ${data.length} messages (array)`);
        return data;
      } else if (data && typeof data === 'object') {
        const messages = data.replies || data.messages || data.data || [];
        console.log(`[pumpfun-chat] ${name} returned ${messages.length} messages (object)`);
        return messages;
      }
    } else {
      const text = await response.text();
      console.log(`[pumpfun-chat] ${name} error: ${text.slice(0, 100)}`);
    }
  } catch (e) {
    console.log(`[pumpfun-chat] ${name} failed: ${e}`);
  }
  return [];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tokenMint } = await req.json();

    if (!tokenMint) {
      return new Response(
        JSON.stringify({ error: "tokenMint is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[pumpfun-chat] Fetching messages for token: ${tokenMint}`);

    let messages: any[] = [];
    
    // Try multiple API endpoints
    const endpoints = [
      { url: `https://frontend-api.pump.fun/replies/${tokenMint}?limit=100&offset=0`, name: "frontend-api" },
      { url: `https://client-api-2-74b1891ee9f9.herokuapp.com/replies/${tokenMint}?limit=100&offset=0`, name: "client-api-2" },
      { url: `https://client-api.pump.fun/replies/${tokenMint}?limit=100&offset=0`, name: "client-api" },
    ];
    
    for (const endpoint of endpoints) {
      messages = await tryFetchMessages(endpoint.url, endpoint.name);
      if (messages.length > 0) {
        console.log(`[pumpfun-chat] Success with ${endpoint.name}`);
        break;
      }
    }
    
    // Log first message for debugging
    if (messages.length > 0) {
      console.log(`[pumpfun-chat] Sample message: ${JSON.stringify(messages[0]).slice(0, 300)}`);
    }

    // Normalize message format
    // pump.fun messages typically have: id, user, text, mint, created_timestamp
    const normalizedMessages = messages.map((msg: any) => ({
      id: msg.id?.toString() || `${msg.user}-${msg.created_timestamp || Date.now()}`,
      user: msg.user || msg.wallet || msg.author || 'anon',
      message: msg.text || msg.message || msg.content || msg.body || '',
      timestamp: msg.created_timestamp 
        ? (msg.created_timestamp > 9999999999 ? msg.created_timestamp : msg.created_timestamp * 1000)
        : (msg.timestamp || Date.now()),
    })).filter((msg: any) => msg.message && msg.message.trim());

    console.log(`[pumpfun-chat] Final: ${normalizedMessages.length} messages`);

    return new Response(
      JSON.stringify({ 
        messages: normalizedMessages, 
        source: normalizedMessages.length > 0 ? "live" : "empty",
        count: normalizedMessages.length 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (e) {
    console.error("[pumpfun-chat] Error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
