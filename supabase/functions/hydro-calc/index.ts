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
    const { method, parameters } = await req.json();

    if (!method || !parameters) {
      return new Response(JSON.stringify({ error: "method and parameters are required" }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let data: Record<string, number> = {};
    let compliance = {
      standard: "SNI 2415:2016",
      is_valid: true,
      notes: ""
    };

    if (method === 'rational') {
      const { c, i, a } = parameters;
      
      // Validation against SNI 2415:2016 - Rational Method is generally applied for DAS <= 300 ha (3.0 km2)
      if (a > 3) {
        compliance.is_valid = false;
        compliance.notes = `Area ${a} km2 exceeds the 300 ha (3.0 km2) limit recommended by SNI 2415:2016 for the Rational Method.`;
      } else {
        compliance.notes = `Area ${a} km2 is within the 300 ha (3.0 km2) limit prescribed by SNI 2415:2016.`;
      }
      
      // Calculate Peak Discharge: Q = 0.278 * C * I * A
      const peak_discharge = 0.278 * c * i * a;
      data = { peak_discharge: Number(peak_discharge.toFixed(3)) };
      
    } else if (method === 'snyder') {
      const { area, l, lc, cp, ct } = parameters;
      
      // Time lag
      const time_lag = ct * Math.pow(l * lc, 0.3);
      // Duration of effective rainfall
      const tr = time_lag / 5.5; 
      // Time to peak
      const time_to_peak = time_lag + 0.25 * tr;
      // Peak Discharge
      const peak_discharge = (2.78 * cp * area) / time_to_peak;
      
      data = { 
        peak_discharge: Number(peak_discharge.toFixed(3)), 
        time_to_peak: Number(time_to_peak.toFixed(2))
      };
      
      compliance.notes = "Snyder method parameterization processed according to standard hydrological guidelines.";
      
    } else {
      return new Response(JSON.stringify({ error: `Unsupported method: ${method}` }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const result = {
      status: "success",
      data,
      compliance
    };

    return new Response(JSON.stringify(result), {
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
