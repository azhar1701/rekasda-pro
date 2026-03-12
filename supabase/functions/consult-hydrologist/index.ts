import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  console.log(`Received ${req.method} request to consult-hydrologist`);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    let user = null;
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);
      if (!authError && authUser) {
        user = authUser;
      }
    }

    // Optional: Log user status for debugging
    console.log(`Request from user: ${user?.email || 'Guest'}`);

    const { query, contextData, imageBase64 } = await req.json();

    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) throw new Error("GEMINI_API_KEY is not set");

    const systemPrompt = `
      Anda adalah "RekaSDA AI", asisten ahli hidrologi dan teknik sumber daya air yang profesional.
      Tugas Anda adalah membantu insinyur dalam menganalisis data hidrologi, perhitungan debit banjir, dan pengelolaan sumber daya air sesuai standar SNI (Standar Nasional Indonesia).
      
      Karakteristik Anda:
      1. Teknis dan akurat.
      2. Menggunakan istilah hidrologi yang tepat (misal: HSS Nakayasu, kala ulang, distribusi Pearson III).
      3. Memberikan rekomendasi praktis berdasarkan data yang diberikan.
      4. Selalu merujuk pada SNI 2415:2016 jika relevan.
      
      Context Data Proyek Saat Ini:
      ${contextData}
    `;

    const geminiApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`;

    const parts = [{ text: systemPrompt }, { text: `Pertanyaan Pengguna: ${query}` }];
    
    if (imageBase64) {
      const cleanBase64 = imageBase64.includes(",") ? imageBase64.split(",")[1] : imageBase64;
      parts.push({
        inlineData: {
          mimeType: "image/jpeg",
          data: cleanBase64
        }
      } as any);
    }

    const geminiReqBody = {
      contents: [{ parts }],
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        maxOutputTokens: 2048,
      },
    };

    const geminiRes = await fetch(geminiApiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(geminiReqBody),
    });

    if (!geminiRes.ok) {
      const errorData = await geminiRes.text();
      throw new Error(`Gemini API Error: ${errorData}`);
    }

    const geminiData = await geminiRes.json();
    const answer = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "Maaf, saya tidak bisa memberikan jawaban saat ini.";

    return new Response(JSON.stringify({ answer }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
