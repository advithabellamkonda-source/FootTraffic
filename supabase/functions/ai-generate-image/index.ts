// Image generation via Gemini (Nano Banana), uploaded to a public Supabase
// Storage bucket so `posts.image_url` stays a short URL instead of a giant
// base64 blob in every row. Requires a valid Supabase user JWT (verified by
// the Edge Functions gateway before this code runs — see deploy command).
import { createClient } from "npm:@supabase/supabase-js@2";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const IMAGE_MODEL = "gemini-3.1-flash-lite-image";
const BUCKET = "post-images";

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
    const { prompt } = await req.json();
    if (!prompt) {
      return json({ error: "prompt is required" }, 400);
    }

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${IMAGE_MODEL}:generateContent`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": GEMINI_API_KEY ?? "" },
        body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }] }),
      },
    );

    if (!res.ok) {
      const errText = await res.text();
      return json({ error: `Gemini API error: ${errText}` }, 502);
    }

    const data = await res.json();
    const parts = data?.candidates?.[0]?.content?.parts ?? [];
    const imagePart = parts.find((p: { inlineData?: { data: string; mimeType: string } }) => p.inlineData);
    if (!imagePart) {
      return json({ error: "Model did not return an image" }, 502);
    }

    const { mimeType, data: base64 } = imagePart.inlineData;
    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    const ext = mimeType.split("/")[1] ?? "png";
    const path = `${crypto.randomUUID()}.${ext}`;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, bytes, { contentType: mimeType });
    if (uploadError) {
      return json({ error: `Storage upload failed: ${uploadError.message}` }, 502);
    }

    const { data: publicUrlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return json({ url: publicUrlData.publicUrl });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
