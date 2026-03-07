import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 1. Verify Supabase JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Parse Request Body
    const body = await req.json();
    const { fileData, mimeType, prompt, year } = body;

    if (!fileData || !mimeType) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: fileData, mimeType" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Migrate prompt logic: use provided prompt or construct it if year is provided
    const finalPrompt = prompt || `
      Ekstrak tabel curah hujan harian dari dokumen PDF ini untuk tahun ${year || "yang tertera"}.
      
      ATURAN EKSTRAKSI:
      1. Hasil HARUS berupa matriks 2D dengan format JSON: { "data": number[][] }
      2. Matriks harus memiliki tepat 31 baris (Hari 1 s/d 31) and 12 kolom (Januari s/d Desember).
      3. Gunakan nilai 0 untuk hari tanpa hujan.
      4. Gunakan nilai null untuk sel yang kosong, strip (-), atau tidak memiliki data (misalnya 31 Februari).
      5. Pastikan semua angka desimal menggunakan titik (.) sebagai pemisah.
      6. Jika ada teks "NR" atau "Tidak ada data", anggap sebagai null.
      
      Kembalikan hanya objek JSON dengan key "data".
    `;

    // 3. Call Gemini API
    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not set");
    }

    const cleanBase64 = fileData.includes(",") ? fileData.split(",")[1] : fileData;

    // Using standard fetch to call Gemini API
    const geminiApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`;

    const geminiReqBody = {
      contents: [
        {
          parts: [
            {
              inlineData: {
                mimeType: mimeType,
                data: cleanBase64,
              },
            },
            {
              text: finalPrompt,
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
      },
    };

    const geminiRes = await fetch(geminiApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(geminiReqBody),
    });

    if (!geminiRes.ok) {
      const errorData = await geminiRes.text();
      console.error("Gemini API Error:", errorData);
      throw new Error(`Gemini API returned status ${geminiRes.status}`);
    }

    const geminiData = await geminiRes.json();

    // Extract text from Gemini response
    const textResponse = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textResponse) {
      throw new Error("Invalid response format from Gemini API");
    }

    let jsonResult;
    try {
      jsonResult = JSON.parse(textResponse);
    } catch (e) {
      console.error("Failed to parse Gemini response as JSON:", textResponse);
      throw new Error("Gemini did not return valid JSON");
    }

    return new Response(JSON.stringify(jsonResult), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error processing request:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
