import { supabase } from '@/lib/supabaseClient';

async function invoke(fn, body) {
  const { data, error } = await supabase.functions.invoke(fn, { body });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data;
}

// prompt: string. jsonSchema: optional Gemini-style JSON schema object — when
// given, resolves to the parsed object instead of { text }. grounding: true
// to ground the response in live Google Search results (for trend-aware
// suggestions); combine with jsonSchema and the object is still returned.
export async function invokeLLM({ prompt, jsonSchema, grounding = false }) {
  const result = await invoke('ai-generate', { prompt, jsonSchema, grounding });
  return jsonSchema ? result : result.text;
}

// prompt: string. Returns a public image URL.
export async function generateImage({ prompt }) {
  const result = await invoke('ai-generate-image', { prompt });
  return result.url;
}
