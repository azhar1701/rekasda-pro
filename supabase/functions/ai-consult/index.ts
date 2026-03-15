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
    const { user_query, active_context } = await req.json();

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
${JSON.stringify(active_context, null, 2)}

Provide your response STRICTLY as a JSON object with the following keys and data types. Do not include any HTML tags or markdown blocks, like \`\`\`json, around the output. 
- "markdown_text": A detailed markdown formatted text block explaining the compliance status, any issues, and professional hydrology feedback.
- "confidence_score": A number between 0 and 100 representing your confidence in this standard compliance assessment.
- "agent_state": A string representing the next action state (e.g., "NEEDS_REVISION", "APPROVED", "AWAITING_INPUT").
`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent?key=${GEMINI_API_KEY}`;
    
    const contents = [
      { role: "user", parts: [{ text: `${systemPrompt}\n\nUser Query: ${user_query}` }] }
    ];

    const geminiResponse = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // Use responseMimeType to enforce JSON structure in the Gemini API
      body: JSON.stringify({ contents, generationConfig: { responseMimeType: "application/json" } }) 
    });

    const body = await geminiResponse.json();

    if (!geminiResponse.ok) {
      throw new Error(body.error?.message || "Failed to fetch from Gemini API");
    }

    let aiText = body.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    
    // Fallback cleanup: Remove potential markdown wrappers in case the model ignored responseMimeType
    aiText = aiText.replace(/```json/g, "").replace(/```/g, "").trim();
    
    let parsedData;
    try {
      parsedData = JSON.parse(aiText);
    } catch (e) {
      parsedData = {
        markdown_text: "System could not parse the AI response properly. Here is the raw output:\n\n" + aiText,
        confidence_score: 0,
        agent_state: "ERROR"
      };
    }

    return new Response(JSON.stringify(parsedData), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
