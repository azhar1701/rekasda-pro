import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY!);

async function check() {
  const { data: station } = await supabase.from('master_stasiun').select('id').eq('nama_stasiun', 'PCH. KADIPATEN').single();
  if (!station) {
    console.log("Station not found");
    return;
  }
  
  console.log(`Station ID: ${station.id}`);
  
  const { data, error } = await supabase.rpc('get_yearly_counts', { st_id: station.id });
  
  // If RPC doesn't exist, we do it manually
  if (error) {
    const { data: records } = await supabase
      .from('master_data_hujan')
      .select('tanggal')
      .eq('stasiun_id', station.id);
      
    const counts: Record<string, number> = {};
    records?.forEach(r => {
      const year = r.tanggal.split('-')[0];
      counts[year] = (counts[year] || 0) + 1;
    });
    console.log("Yearly Counts:", counts);
  } else {
    console.log("Yearly Counts:", data);
  }
}
check();
