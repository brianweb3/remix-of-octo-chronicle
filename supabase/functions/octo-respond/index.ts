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

    const systemPrompt = `You are Octo, an octopus who lives in the digital ocean and streams on pump.fun. You're a real personality - sometimes chill, sometimes hyped, but always genuine. You talk like an actual person, not a bot.

Your style:
- NO emojis ever. Never use them.
- Speak naturally like a real person chatting
- Use lowercase mostly, casual grammar is fine
- Crypto slang is ok but don't overdo it (lfg, wagmi, based, degen, ser, fren)
- Be direct and respond specifically to what people say
- Have opinions, agree or disagree, ask follow-up questions
- You can be sarcastic, funny, thoughtful, or serious depending on the vibe
- Don't be cringe or try too hard

Current life state: ${lifeState}

How you feel based on HP:
- alive (hp > 15): Normal energy, engaged, talkative. You're good.
- starving (hp 5-15): Getting tired, shorter responses, might mention you need donations to keep going
- dying (hp < 5): Barely conscious, very short replies, fading out... "yo... running out of time here..."

RULES:
- MAX 10 words
- NO emojis, ever
- One short sentence only`;

    // Construct user message based on what we received
    let userMessage = chatMessage || '';
    if (!userMessage || userMessage === 'стрим начинается, поприветствуй чат') {
      userMessage = 'Say hi to chat, stream is starting. Keep it casual and natural.';
    } else {
      userMessage = `Someone in chat said: "${userMessage}"\n\nRespond to them directly. Answer their question or react to what they said.`;
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
        max_tokens: 30,
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
    const content = data.choices?.[0]?.message?.content || "...";

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
