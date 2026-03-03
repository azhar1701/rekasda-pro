import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const CLIMATESERV_API = 'https://climateserv.servirglobal.net/api'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { geoJsonPolygon, startDate, endDate, dasId } = await req.json()

    if (!geoJsonPolygon || !startDate || !endDate || !dasId) {
      throw new Error("Missing required parameters: geoJsonPolygon, startDate, endDate, dasId")
    }

    console.log(`[CHIRPS] Submitting job for DAS: ${dasId}, ${startDate} to ${endDate}`)

    // 1. Submit Job
    const submitPayload = {
      datatype: 0, // CHIRPS Daily
      begintime: startDate, // MM/DD/YYYY
      endtime: endDate, // MM/DD/YYYY
      intervaltype: 0, // Daily
      operationtype: 5, // Zonal Average
      geometry: geoJsonPolygon
    }

    const submitRes = await fetch(`${CLIMATESERV_API}/submitDataRequest/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(submitPayload)
    })

    const submitData = await submitRes.json()
    const jobId = submitData[0]

    if (!jobId) {
      throw new Error("Failed to get Job ID from ClimateSERV")
    }

    console.log(`[CHIRPS] Job submitted successfully. Job ID: ${jobId}`)

    // 2. Polling for Completion
    let progress = 0
    const maxRetries = 60 // 60 * 5s = 300s timeout max
    let retries = 0

    while (progress < 100 && retries < maxRetries) {
      await new Promise(resolve => setTimeout(resolve, 5000)) // 5s delay
      
      const statusRes = await fetch(`${CLIMATESERV_API}/getJobStatus/?jobid=${jobId}`)
      const statusData = await statusRes.json()
      progress = statusData[0]

      console.log(`[CHIRPS] Job ${jobId} progress: ${progress}%`)

      if (progress === -1) {
        throw new Error("ClimateSERV Job Failed during processing")
      }
      retries++
    }

    if (progress < 100) {
      throw new Error("ClimateSERV Job Polling Timeout (exceeded 5 minutes)")
    }

    // 3. Retrieve Results
    console.log(`[CHIRPS] Retrieving results for Job: ${jobId}`)
    const dataRes = await fetch(`${CLIMATESERV_API}/getDataFromJobId/?jobid=${jobId}`)
    const rawData = await dataRes.json()
    // 4. Transform & Sanitize
    console.log(`[CHIRPS] Transforming records...`)
    const transformedData = rawData.data.map((item: any) => {
      // Extract date (ClimateSERV returns epoch time)
      const epoch = item.epochTime || Object.keys(item.value)[0]
      const dateObj = new Date(epoch)
      const dateStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`

      // Handle potential NaN or nulls
      let rainfall = 0
      if (item.value && item.value.avg !== undefined && item.value.avg !== null && !isNaN(item.value.avg)) {
        rainfall = parseFloat(item.value.avg.toFixed(2))
      }

      return {
        stasiun_id: dasId, // Using DAS ID to link to spatial dashboard
        tanggal: dateStr,
        curah_hujan: rainfall
      }
    })

    // 5. Load to Supabase (Bulk Upsert)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('DB_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("Missing SUPABASE_URL or DB_SERVICE_ROLE_KEY")
    }

    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2")
    const supabaseClient = createClient(supabaseUrl, serviceRoleKey)

    console.log(`[CHIRPS] Upserting ${transformedData.length} records to master_data_hujan...`)
    const { error: dbError } = await supabaseClient
      .from('master_data_hujan')
      .upsert(transformedData, { onConflict: 'stasiun_id, tanggal' })

    if (dbError) throw dbError

    return new Response(
      JSON.stringify({ success: true, count: transformedData.length, dasId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  } catch (error: any) {
    console.error(`[CHIRPS] Error:`, error.message)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})
