import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
    let rawResponse: any = null;
    
    // pump.fun client API for replies/chat
    const apiUrl = `https://client-api-2-74b1891ee9f9.herokuapp.com/replies/${tokenMint}?limit=100&offset=0`;
    
    console.log(`[pumpfun-chat] Fetching: ${apiUrl}`);
    
    const response = await fetch(apiUrl, {
      headers: {
        "Accept": "application/json",
      },
    });
    
    console.log(`[pumpfun-chat] Response status: ${response.status}`);
    
    if (response.ok) {
      rawResponse = await response.json();
      console.log(`[pumpfun-chat] Raw response type: ${typeof rawResponse}, isArray: ${Array.isArray(rawResponse)}`);
      
      if (Array.isArray(rawResponse)) {
        messages = rawResponse;
      } else if (rawResponse && typeof rawResponse === 'object') {
        // Log the keys to understand the structure
        console.log(`[pumpfun-chat] Response keys: ${Object.keys(rawResponse).join(', ')}`);
        messages = rawResponse.replies || rawResponse.messages || rawResponse.data || [];
      }
      
      console.log(`[pumpfun-chat] Got ${messages.length} raw messages`);
      
      // Log first message structure for debugging
      if (messages.length > 0) {
        console.log(`[pumpfun-chat] First message keys: ${Object.keys(messages[0]).join(', ')}`);
        console.log(`[pumpfun-chat] First message sample: ${JSON.stringify(messages[0]).slice(0, 300)}`);
      }
    } else {
      const errorText = await response.text();
      console.log(`[pumpfun-chat] Error response: ${errorText.slice(0, 200)}`);
    }

    // Normalize message format based on pump.fun structure
    // pump.fun messages have: id, user (wallet), text, mint, created_timestamp
    const normalizedMessages = messages.map((msg: any) => ({
      id: msg.id?.toString() || `${msg.user}-${msg.created_timestamp || Date.now()}`,
      user: msg.user || 'anon',
      message: msg.text || msg.message || msg.content || '',
      timestamp: msg.created_timestamp ? msg.created_timestamp * 1000 : Date.now(),
    })).filter((msg: any) => msg.message && msg.message.trim()); // Filter out empty messages

    console.log(`[pumpfun-chat] Normalized: ${normalizedMessages.length} messages`);

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
