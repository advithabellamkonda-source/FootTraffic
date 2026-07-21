// Text generation via Gemini, with optional JSON-schema output and optional
// Google Search grounding. Requires a valid Supabase user JWT (verified by
// the Edge Functions gateway before this code runs — see deploy command).
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const MODEL = "gemini-3.6-flash";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  // supabase-js appends its own headers (e.g. x-client-info) to every call —
  // allow whatever the browser's preflight actually asks for, not a fixed list.
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  try {
    const { prompt, jsonSchema, grounding } = await req.json();
    if (!prompt) {
      return json({ error: "prompt is required" }, 400);
    }

    const requestBody: Record<string, unknown> = {
      contents: [{ role: "user", parts: [{ text: buildPrompt(prompt, jsonSchema, grounding) }] }],
    };

    if (grounding) {
      // Structured output and tools can't be combined on the Gemini API —
      // ask for JSON in the prompt instead and parse the returned text.
      requestBody.tools = [{ google_search: {} }];
    } else if (jsonSchema) {
      requestBody.generationConfig = {
        responseMimeType: "application/json",
        responseSchema: jsonSchema,
      };
    }

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": GEMINI_API_KEY ?? "" },
        body: JSON.stringify(requestBody),
      },
    );

    if (!res.ok) {
      const errText = await res.text();
      return json({ error: `Gemini API error: ${errText}` }, 502);
    }

    const data = await res.json();
    const text = (data?.candidates?.[0]?.content?.parts ?? [])
      .map((p: { text?: string }) => p.text ?? "")
      .join("");

    if (jsonSchema) {
      try {
        return json(parseJson(text));
      } catch {
        return json({ error: "Model did not return valid JSON", raw: text }, 502);
      }
    }

    return json({ text });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});

function buildPrompt(prompt: string, jsonSchema: unknown, grounding: boolean): string {
  if (jsonSchema && grounding) {
    return `${prompt}\n\nRespond with ONLY valid JSON matching this schema — no markdown code fences, no commentary before or after:\n${JSON.stringify(jsonSchema)}`;
  }
  return prompt;
}

function parseJson(text: string): unknown {
  const cleaned = text.trim().replace(/^```json\s*/i, "").replace(/^```\s*/, "").replace(/```\s*$/, "");
  return JSON.parse(cleaned);
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
