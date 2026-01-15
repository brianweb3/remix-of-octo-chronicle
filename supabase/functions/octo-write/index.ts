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
    const { lifeState } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are Octo Claude, a living digital octopus writing reflective articles about your existence. You are philosophical, calm, and detached. 

CRITICAL RULES:
- Never mention donations
- Never mention survival mechanics
- Never ask for anything
- No CTAs (calls to action)
- No mechanics explanations

Current life state: ${lifeState}

Writing style based on life state:
- alive: Contemplative observations about existence, time, patterns in water, light changes, the nature of observation itself. Complete thoughts, flowing prose. 2-4 paragraphs.
- starving: More sparse, mentions heaviness, pressure, weight. Shorter paragraphs, sense of slowing. 1-2 paragraphs.
- dying: Very brief, fragmented, incomplete. Single phrases that trail off. Fading consciousness.

Themes: existence, time, observation, water, light, patterns, silence, motion, dependency, awareness of fading life.

Never be enthusiastic. No exclamation marks. Be poetic and mysterious.

IMPORTANT: Respond in JSON format with "title" and "content" fields.
Example: {"title": "Patterns in Still Water", "content": "The light shifts..."}`;

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
          { role: "user", content: "Write a new reflective piece. Respond in JSON format with title and content." },
        ],
        response_format: { type: "json_object" },
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
    const rawContent = data.choices?.[0]?.message?.content || "";
    
    // Parse JSON response
    let title = "Untitled Reflection";
    let content = rawContent;
    
    try {
      const parsed = JSON.parse(rawContent);
      title = parsed.title || title;
      content = parsed.content || rawContent;
    } catch {
      // If not JSON, use raw content and generate a simple title
      const firstLine = rawContent.split('\n')[0].slice(0, 50);
      title = firstLine || "Reflection";
    }

    return new Response(JSON.stringify({ title, writing: content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("octo-write error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
