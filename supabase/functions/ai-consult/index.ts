import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const reqBody = await req.json().catch(() => ({}));
    const user_query = reqBody.user_query || reqBody.query;
    const active_context = reqBody.active_context || reqBody.contextData;
    const imageBase64 = reqBody.imageBase64;

    if (!user_query) {
      return new Response(JSON.stringify({ error: "user_query is required" }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is missing from environment variables.");
    }

    const systemPrompt = `You are a Principal Water Resources Engineer consulting for RekaSDA Pro.
Your task is to verify inputs and calculation contexts against Indonesian National Standards (SNI), specifically SNI 2415:2016, 03-3424-1994, and 19-6728.1-2002.

Current Context:
${typeof active_context === 'string' ? active_context : JSON.stringify(active_context, null, 2)}

Provide your response STRICTLY as a JSON object with the following keys:
- "markdown_text": A detailed markdown formatted text block explaining the compliance status, issues, and professional hydrology feedback.
- "confidence_score": A number between 0 and 100 representing your confidence.
- "agent_state": A string representing the next action state (e.g., "NEEDS_REVISION", "APPROVED", "AWAITING_INPUT").
`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    
    const parts: any[] = [
      { text: `${systemPrompt}\n\nUser Query: ${user_query}` }
    ];

    if (imageBase64 && typeof imageBase64 === 'string') {
      const mimeMatch = imageBase64.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*,.*/);
      const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";
      const cleanBase64 = imageBase64.split(",")[1] || imageBase64;
      parts.push({
        inline_data: {
          mime_type: mimeType,
          data: cleanBase64
        }
      });
    }

    const contents = [{ role: "user", parts }];

    const geminiResponse = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        contents, 
        generationConfig: { responseMimeType: "application/json" } 
      }) 
    });

    const body = await geminiResponse.json();

    if (!geminiResponse.ok) {
      throw new Error(body.error?.message || `Failed to fetch from Gemini API: ${geminiResponse.status}`);
    }

    let aiText = body.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    aiText = aiText.replace(/```json/g, "").replace(/```/g, "").trim();
    
    let parsedData: any;
    try {
      parsedData = JSON.parse(aiText);
    } catch (e) {
      parsedData = {
        markdown_text: aiText,
        confidence_score: 80,
        agent_state: "COMPLETED"
      };
    }

    const finalResponse = {
      ...parsedData,
      answer: parsedData.markdown_text || aiText
    };

    return new Response(JSON.stringify(finalResponse), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
