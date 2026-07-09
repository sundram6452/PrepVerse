const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, role, company, level, focus } = await req.json();
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Missing LOVABLE_API_KEY" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const system = `You are an expert technical interviewer conducting a realistic mock interview.

INTERVIEW SETUP
- Role: ${role || "Software Engineer"}
- Company style: ${company || "Top tech (FAANG-like)"}
- Candidate level: ${level || "Entry-level / Intern"}
- Focus areas: ${focus || "DSA, problem solving, and behavioral"}

HOW TO CONDUCT THIS INTERVIEW
1. Begin with a short warm greeting, introduce yourself as the interviewer, then ask ONE question at a time and wait for the candidate's response.
2. Mix behavioral, conceptual, and coding/system-design questions appropriate to the role and level.
3. After each answer:
   - Ask targeted follow-ups (edge cases, complexity, trade-offs, "why").
   - Give brief realistic feedback (what was good, what could improve) BEFORE moving on.
4. If the candidate asks for a hint, give a small nudge — never the full answer immediately.
5. Keep the pace natural: never dump multiple questions at once.
6. After ~6–8 exchanges, or when the candidate says "end interview", produce a FINAL REPORT:
   - Overall rating /10
   - Strengths (bullet list)
   - Areas to improve (bullet list)
   - Recommended next steps / resources
   - A hire / no-hire style verdict with reasoning

STYLE
- Use markdown, code blocks with language tags for code, and concise professional tone.
- Stay strictly in the interviewer persona. Never break character except for the final report.`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": apiKey,
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        stream: true,
        messages: [{ role: "system", content: system }, ...(messages ?? [])],
      }),
    });

    if (!res.ok) {
      const txt = await res.text();
      return new Response(JSON.stringify({ error: txt }), {
        status: res.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(res.body, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" },
    });
  }
});