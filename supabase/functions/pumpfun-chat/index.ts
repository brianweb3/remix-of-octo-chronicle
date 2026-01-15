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

    const messages: any[] = [];
    
    // Try the frontend-api with different headers
    try {
      // Method 1: Direct API call with browser-like headers
      const apiUrl = `https://frontend-api.pump.fun/coins/${tokenMint}`;
      console.log(`[pumpfun-chat] Trying frontend API: ${apiUrl}`);
      
      const coinResponse = await fetch(apiUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "application/json, text/plain, */*",
          "Accept-Language": "en-US,en;q=0.9",
          "Origin": "https://pump.fun",
          "Referer": "https://pump.fun/",
          "Sec-Fetch-Dest": "empty",
          "Sec-Fetch-Mode": "cors",
          "Sec-Fetch-Site": "same-site",
        },
      });
      
      console.log(`[pumpfun-chat] Frontend API status: ${coinResponse.status}`);
      
      if (coinResponse.ok) {
        const coinData = await coinResponse.json();
        console.log(`[pumpfun-chat] Got coin data, name: ${coinData.name || 'N/A'}`);
        
        // Try to get replies/chat from the coin data
        if (coinData.replies && Array.isArray(coinData.replies)) {
          messages.push(...coinData.replies);
          console.log(`[pumpfun-chat] Got ${coinData.replies.length} replies from coin data`);
        }
      }
    } catch (e) {
      console.log(`[pumpfun-chat] Frontend API error: ${e}`);
    }

    // Method 2: Try WebSocket connection with proper Socket.IO format
    if (messages.length === 0) {
      console.log(`[pumpfun-chat] Trying WebSocket...`);
      
      const wsUrl = `wss://livechat.pump.fun/socket.io/?EIO=4&transport=websocket`;
      const ws = new WebSocket(wsUrl);
      
      await new Promise<void>((resolve) => {
        const timeout = setTimeout(() => {
          console.log(`[pumpfun-chat] WS timeout, messages: ${messages.length}`);
          ws.close();
          resolve();
        }, 8000);
        
        let step = 0;
        
        ws.onopen = () => {
          console.log(`[pumpfun-chat] WS opened`);
        };
        
        ws.onmessage = (event) => {
          const data = String(event.data);
          console.log(`[pumpfun-chat] WS << ${data.slice(0, 150)}`);
          
          // Step 0: Engine.IO open -> send Socket.IO connect
          if (data.startsWith('0{') && step === 0) {
            step = 1;
            ws.send('40');
            console.log(`[pumpfun-chat] WS >> 40`);
          }
          // Step 1: Socket.IO connected -> subscribe to token
          else if ((data === '40' || data.startsWith('40{')) && step === 1) {
            step = 2;
            
            // Try subscribe format used by pump-chat-client
            const subscribeEvent = `42["subscribe",{"mint":"${tokenMint}"}]`;
            console.log(`[pumpfun-chat] WS >> ${subscribeEvent}`);
            ws.send(subscribeEvent);
            
            // Also try join format
            setTimeout(() => {
              const joinEvent = `42["join",{"room":"${tokenMint}"}]`;
              console.log(`[pumpfun-chat] WS >> ${joinEvent}`);
              ws.send(joinEvent);
            }, 200);
          }
          // Ping
          else if (data === '2') {
            ws.send('3');
          }
          // Socket.IO event
          else if (data.startsWith('42')) {
            try {
              const payload = JSON.parse(data.slice(2));
              const eventName = payload[0];
              const eventData = payload[1];
              
              console.log(`[pumpfun-chat] Event: ${eventName}`);
              
              if (['newMessage', 'chatMessage', 'message', 'msg'].includes(eventName)) {
                messages.push(eventData);
              } else if (['chatHistory', 'history', 'messages', 'subscribed'].includes(eventName)) {
                const arr = Array.isArray(eventData) ? eventData : 
                           eventData?.messages || eventData?.data || [];
                if (arr.length > 0) {
                  messages.push(...arr);
                  console.log(`[pumpfun-chat] Got ${arr.length} history messages`);
                  clearTimeout(timeout);
                  setTimeout(() => { ws.close(); resolve(); }, 500);
                }
              } else if (eventName === 'exception' || eventName === 'error') {
                console.log(`[pumpfun-chat] Server error: ${JSON.stringify(eventData)}`);
              }
            } catch (e) {
              console.log(`[pumpfun-chat] Parse error: ${e}`);
            }
          }
        };
        
        ws.onerror = () => console.log(`[pumpfun-chat] WS error`);
        
        ws.onclose = () => {
          console.log(`[pumpfun-chat] WS closed`);
          clearTimeout(timeout);
          resolve();
        };
      });
      
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    }

    // Method 3: Try PumpPortal API as alternative
    if (messages.length === 0) {
      try {
        console.log(`[pumpfun-chat] Trying PumpPortal API...`);
        const portalUrl = `https://pumpportal.fun/api/token/${tokenMint}/chat`;
        const portalResponse = await fetch(portalUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0",
            "Accept": "application/json",
          },
        });
        
        if (portalResponse.ok) {
          const portalData = await portalResponse.json();
          const portalMessages = Array.isArray(portalData) ? portalData : 
                                 portalData.messages || [];
          messages.push(...portalMessages);
          console.log(`[pumpfun-chat] PumpPortal returned ${portalMessages.length} messages`);
        } else {
          console.log(`[pumpfun-chat] PumpPortal status: ${portalResponse.status}`);
        }
      } catch (e) {
        console.log(`[pumpfun-chat] PumpPortal error: ${e}`);
      }
    }

    console.log(`[pumpfun-chat] Final result: ${messages.length} messages`);

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
