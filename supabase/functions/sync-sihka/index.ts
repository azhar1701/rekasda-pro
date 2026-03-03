import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import * as cheerio from "https://esm.sh/cheerio@1.0.0-rc.12"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { stationId, year, month } = await req.json()
    console.log(`[SERVER-SYNC] Scrapping SIHKA for Station: ${stationId}, ${year}-${month}`)

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('DB_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("Missing SUPABASE_URL or DB_SERVICE_ROLE_KEY")
    }

    const supabaseClient = createClient(supabaseUrl, serviceRoleKey)
    const SIHKA_BASE_URL = 'https://sihka.bbwscitanduy.id/pch'
    const results = []
    const daysInMonth = new Date(year, month, 0).getDate()

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      const url = `${SIHKA_BASE_URL}?s=${dateStr}`

      try {
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          }
        })

        if (!response.ok) continue
        const html = await response.text()
        const $ = cheerio.load(html)
        
        const stationLink = $(`a[href$="/pch/${stationId}"]`)
        if (stationLink.length > 0) {
          const row = stationLink.closest('tr')
          const cells = row.find('td')
          
          let manualVal = $(cells[1]).text().trim().replace(',', '.')
          let telemetryVal = $(cells[2]).text().trim().replace(',', '.')
          
          let finalVal = (manualVal && manualVal !== '-') ? manualVal : telemetryVal
          if (finalVal === '-' || !finalVal) finalVal = '0'
          
          const num = parseFloat(finalVal.replace(/[^0-9.-]/g, ''))

          results.push({
            stasiun_id: stationId,
            tanggal: dateStr,
            curah_hujan: isNaN(num) ? 0 : num
          })
        }
      } catch (err) {
        console.error(`Skip ${dateStr}: ${err.message}`)
      }
    }

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
