import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Connect to pump.fun chat via WebSocket and get messages
async function fetchPumpfunMessages(tokenMint: string): Promise<any[]> {
  return new Promise((resolve) => {
    const messages: any[] = [];
    let resolved = false;
    
    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        resolve(messages);
      }
    }, 8000); // 8 second timeout
    
    try {
      // Use Engine.IO v4 WebSocket URL
      const wsUrl = `wss://livechat.pump.fun/socket.io/?EIO=4&transport=websocket`;
      
      console.log(`[pumpfun-chat] Connecting to: ${wsUrl}`);
      
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        console.log("[pumpfun-chat] WebSocket connected");
      };
      
      ws.onmessage = (event) => {
        const data = event.data as string;
        console.log(`[pumpfun-chat] Received: ${data.slice(0, 100)}`);
        
        // Engine.IO protocol:
        // 0 - open
        // 40 - Socket.IO connect
        // 42 - Socket.IO event
        
        if (data === "0") {
          // Send Socket.IO connect
          ws.send("40");
        } else if (data === "40") {
          // Connected, join the room
          const joinPayload = JSON.stringify(["joinRoom", { mint: tokenMint }]);
          ws.send(`42${joinPayload}`);
          console.log(`[pumpfun-chat] Joined room: ${tokenMint}`);
        } else if (data.startsWith("42")) {
          // Socket.IO event
          try {
            const payload = JSON.parse(data.slice(2));
            const [eventName, eventData] = payload;
            
            if (eventName === "messageHistory" && Array.isArray(eventData)) {
              console.log(`[pumpfun-chat] Got ${eventData.length} history messages`);
              messages.push(...eventData);
              
              // Got history, we can resolve now
              if (!resolved) {
                resolved = true;
                clearTimeout(timeout);
                ws.close();
                resolve(messages);
              }
            } else if (eventName === "message" && eventData) {
              messages.push(eventData);
            }
          } catch (e) {
            console.log("[pumpfun-chat] Failed to parse event:", e);
          }
        } else if (data === "2") {
          // Ping - respond with pong
          ws.send("3");
        }
      };
      
      ws.onerror = (error) => {
        console.error("[pumpfun-chat] WebSocket error:", error);
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          resolve(messages);
        }
      };
      
      ws.onclose = () => {
        console.log("[pumpfun-chat] WebSocket closed");
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          resolve(messages);
        }
      };
      
    } catch (e) {
      console.error("[pumpfun-chat] Connection error:", e);
      if (!resolved) {
        resolved = true;
        clearTimeout(timeout);
        resolve(messages);
      }
    }
  });
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

    const messages = await fetchPumpfunMessages(tokenMint);
    
    console.log(`[pumpfun-chat] Returning ${messages.length} messages`);

    return new Response(
      JSON.stringify({ 
        messages, 
        source: messages.length > 0 ? "live" : "empty",
        count: messages.length 
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
