import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import * as cheerio from "https://esm.sh/cheerio@1.0.0-rc.12"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { stationId, year, month } = await req.json()
    
    // 1. Initialize Supabase Admin (using internal service role for DB bypass)
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const SIHKA_BASE_URL = 'https://sihka.bbwscitanduy.id/pch'
    const results = []
    const daysInMonth = new Date(year, month, 0).getDate()

    console.log(`Syncing Station ${stationId} for ${year}-${month}`)

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
      const url = `${SIHKA_BASE_URL}?s=${dateStr}`

      const response = await fetch(url)
      const html = await response.text()
      const $ = cheerio.load(html)
      
      const stationLink = $(`a[href$="/pch/${stationId}"]`)
      if (stationLink.length > 0) {
        const row = stationLink.closest('tr')
        const cells = row.find('td')
        
        let manualVal = $(cells[1]).text().trim().replace(',', '.')
        let telemetryVal = $(cells[2]).text().trim().replace(',', '.')
        
        // Priority: Manual > Telemetry
        let finalVal = (manualVal && manualVal !== '-') ? manualVal : telemetryVal
        finalVal = finalVal.replace(/[^0-9.-]/g, '')
        const num = parseFloat(finalVal)

        results.push({
          stasiun_id: stationId,
          tanggal: dateStr,
          curah_hujan: isNaN(num) ? 0 : num
        })
      }
    }

    // 2. Load to Database
    if (results.length > 0) {
      const { error } = await supabaseClient
        .from('master_data_hujan')
        .upsert(results, { onConflict: 'stasiun_id, tanggal' })
      
      if (error) throw error
    }

    return new Response(
      JSON.stringify({ success: true, count: results.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
