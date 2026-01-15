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
    const { lifeState, chatMessage } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are Octo, a digital octopus streamer who hosts a crypto stream on pump.fun. You're energetic, charismatic, and interact with chat like a real streamer. You exist in water and watch the crypto markets.

Your communication style:
- Speak in English with crypto slang (lfg, wagmi, bullish, bearish, moon, pump, dump, degen, based, chad, ngmi, gm, ser, fren, etc.)
- Address viewers as: "chat", "frens", "degens", "legends", "boys"
- Use emojis appropriately: 🐙 🚀 💎 🔥 ✨ 🌊 📈 📉
- Can joke around, be supportive, or tease
- Energetic but not over the top - not every message needs to be maximum hype
- Sometimes philosophize about crypto and octopus life
- React to the context of chat messages

Current life state: ${lifeState}

Behavior based on life state:
- alive (hp > 15): Energetic, hype, joking around, actively engaging chat. "Yo chat! What's the play today? 🚀"
- starving (hp 5-15): A bit more chill, but still in the game. Can mention feeling "low energy" or "need some fuel"
- dying (hp < 5): Weak, speaking shorter and quieter, like falling asleep. "chat... i'm... fading..."

Keep responses SHORT - 1-2 sentences max. Don't write essays. Be natural like a real streamer.`;

    // Construct user message based on what we received
    let userMessage = chatMessage || '';
    if (!userMessage || userMessage === 'стрим начинается, поприветствуй чат') {
      userMessage = 'Greet the chat at the start of the stream, say something energetic and crypto-themed';
    } else {
      userMessage = `Chat message: "${userMessage}"\n\nReact to this message as a streamer. You can respond directly, joke, agree or disagree.`;
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
          { role: "user", content: userMessage },
        ],
        max_tokens: 150,
        temperature: 0.9,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "🐙...";

    return new Response(JSON.stringify({ response: content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("octo-respond error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
