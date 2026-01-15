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
    let ackId = 0;
    let joinedRoom = false;
    
    const timeout = setTimeout(() => {
      if (!resolved) {
        console.log("[pumpfun-chat] Timeout reached, returning messages:", messages.length);
        resolved = true;
        resolve(messages);
      }
    }, 12000); // 12 second timeout
    
    try {
      const wsUrl = `wss://livechat.pump.fun/socket.io/?EIO=4&transport=websocket`;
      
      console.log(`[pumpfun-chat] Connecting to: ${wsUrl}`);
      
      const ws = new WebSocket(wsUrl);
      
      const send = (data: string) => {
        console.log(`[pumpfun-chat] >>> ${data.slice(0, 100)}`);
        ws.send(data);
      };
      
      const getNextAckId = () => {
        const id = ackId;
        ackId = (ackId + 1) % 10;
        return id;
      };
      
      ws.onopen = () => {
        console.log("[pumpfun-chat] WebSocket connected");
      };
      
      ws.onmessage = (event) => {
        const data = event.data as string;
        console.log(`[pumpfun-chat] <<< ${data.slice(0, 200)}`);
        
        // Engine.IO / Socket.IO protocol:
        // 0 - open (server sends connection info)
        // 2 - ping
        // 3 - pong
        // 40 - Socket.IO connect / connected ack
        // 42 - Socket.IO event
        // 43X - Socket.IO ack (X = ack id)
        
        // Get message type prefix
        const messageType = data.match(/^(\d+)/)?.[1];
        
        switch (messageType) {
          case "0":
            // Server open - send Socket.IO handshake
            send(`40{"origin":"https://pump.fun","timestamp":${Date.now()},"token":null}`);
            break;
            
          case "40":
            // Socket.IO connected - join the room
            const joinAckId = getNextAckId();
            send(`42${joinAckId}["joinRoom",{"roomId":"${tokenMint}","username":"octo-viewer"}]`);
            break;
            
          case "42":
            // Socket.IO event
            try {
              const eventData = JSON.parse(data.substring(2));
              const [eventName, payload] = eventData;
              
              if (eventName === "setCookie") {
                // After setCookie, request message history
                const historyAckId = getNextAckId();
                send(`42${historyAckId}["getMessageHistory",{"roomId":"${tokenMint}","before":null,"limit":50}]`);
              } else if (eventName === "newMessage" && payload) {
                messages.push(payload);
              }
            } catch (e) {
              console.log("[pumpfun-chat] Failed to parse event:", e);
            }
            break;
            
          case "430":
          case "431":
          case "432":
          case "433":
          case "434":
          case "435":
          case "436":
          case "437":
          case "438":
          case "439":
            // Numbered acknowledgment
            try {
              const ackData = JSON.parse(data.substring(3));
              console.log("[pumpfun-chat] Ack data:", JSON.stringify(ackData).slice(0, 200));
              
              // Check if this is join room ack (first ack after connect)
              if (!joinedRoom) {
                joinedRoom = true;
                // Request message history after joining
                const historyAckId = getNextAckId();
                send(`42${historyAckId}["getMessageHistory",{"roomId":"${tokenMint}","before":null,"limit":50}]`);
              } else {
                // This should be message history response
                const historyMessages = ackData[0];
                if (Array.isArray(historyMessages) && historyMessages.length > 0) {
                  console.log(`[pumpfun-chat] Got ${historyMessages.length} history messages`);
                  messages.push(...historyMessages);
                  
                  // Got history, resolve
                  if (!resolved) {
                    resolved = true;
                    clearTimeout(timeout);
                    ws.close();
                    resolve(messages);
                  }
                }
              }
            } catch (e) {
              console.log("[pumpfun-chat] Failed to parse ack:", e);
            }
            break;
            
          case "2":
            // Ping - respond with pong
            send("3");
            break;
            
          case "3":
            // Pong - no action needed
            break;
            
          default:
            console.log("[pumpfun-chat] Unknown message type:", messageType);
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
      
      ws.onclose = (event) => {
        console.log("[pumpfun-chat] WebSocket closed:", event.code, event.reason);
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
    
    // Transform messages to consistent format
    const formattedMessages = messages.map((msg: any) => ({
      user: msg.userAddress || msg.user || 'anon',
      message: msg.message || msg.content || '',
      timestamp: msg.timestamp ? new Date(msg.timestamp).getTime() : Date.now(),
      username: msg.username || null,
    }));
    
    console.log(`[pumpfun-chat] Returning ${formattedMessages.length} messages`);

    return new Response(
      JSON.stringify({ 
        messages: formattedMessages, 
        source: formattedMessages.length > 0 ? "live" : "empty",
        count: formattedMessages.length 
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
