import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkData() {
  console.log('Checking master_stasiun...')
  const { data: stations, error: stError } = await supabase.from('master_stasiun').select('id, nama_stasiun')
  if (stError) {
    console.error('Error fetching stations:', stError)
  } else {
    console.log(`Found ${stations?.length || 0} stations:`, stations?.map(s => s.nama_stasiun).join(', '))
    
    if (stations && stations.length > 0) {
      console.log('\nChecking master_data_hujan row counts per station...')
      for (const st of stations) {
        const { count, error: countError } = await supabase
          .from('master_data_hujan')
          .select('*', { count: 'exact', head: true })
          .eq('stasiun_id', st.id)
        
        if (countError) {
          console.error(`Error counting data for ${st.nama_stasiun}:`, countError)
        } else {
          console.log(`${st.nama_stasiun}: ${count} rows`)
        }
      }
    }
  }
}

checkData()
