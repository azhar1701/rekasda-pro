import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Configuration ---
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase credentials in environment variables.');
  process.exit(1);
}

const seedSupabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// --- Zod Schema for Validation ---
const RawDataSchema = z.array(
  z.object({
    year: z.number().int().min(1900).max(2100),
    station_id: z.string(),
    data: z.array(z.array(z.union([z.number(), z.string(), z.null()]))).length(31),
  })
);

// --- Helper Functions ---
function parseRainfallValue(val: any): number {
  if (val === null || val === undefined || val === '' || val === '-') {
    return 0;
  }
  if (typeof val === 'string') {
    const parsed = parseFloat(val.replace(',', '.'));
    return isNaN(parsed) ? 0 : parsed;
  }
  return typeof val === 'number' ? val : 0;
}

async function seedData() {
  
  const dataFilePath = path.join(__dirname, 'data', 'kadipaten_2011_2020.json');

  if (!fs.existsSync(dataFilePath)) {
    console.error(`❌ Data file not found at: ${dataFilePath}`);
    process.exit(1);
  }

  try {
    const rawContent = fs.readFileSync(dataFilePath, 'utf-8');
    const jsonData = JSON.parse(rawContent);

    // Validate input
        const validatedData = RawDataSchema.parse(jsonData);
    
    for (const yearData of validatedData) {
            
      // 1. Ensure station exists or get its ID
      const { data: station, error: stError } = await seedSupabase
        .from('master_stasiun')
        .select('id')
        .eq('nama_stasiun', yearData.station_id)
        .maybeSingle();

      if (stError) {
        console.error(`❌ Error fetching station ${yearData.station_id}:`, stError.message);
        continue;
      }

      let stationUuid: string;
      if (!station) {
                const { data: newStation, error: createError } = await seedSupabase
          .from('master_stasiun')
          .insert([{ nama_stasiun: yearData.station_id }])
          .select()
          .single();
        
        if (createError) {
          console.error(`❌ Failed to create station ${yearData.station_id}:`, createError.message);
          continue;
        }
        stationUuid = newStation.id;
      } else {
        stationUuid = station.id;
      }

      const batchData: any[] = [];

      // 2. Parse 31x12 matrix
      for (let dayIdx = 0; dayIdx < 31; dayIdx++) {
        for (let monthIdx = 0; monthIdx < 12; monthIdx++) {
          const rawValue = yearData.data[dayIdx][monthIdx];
          const rainfall = parseRainfallValue(rawValue);

          // Construct date (1-indexed)
          const day = dayIdx + 1;
          const month = monthIdx + 1;
          
          // Validate date existence (e.g., Feb 30)
          const dateStr = `${yearData.year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const dateObj = new Date(dateStr);
          
          if (dateObj.getFullYear() === yearData.year && dateObj.getMonth() === monthIdx && dateObj.getDate() === day) {
            batchData.push({
              stasiun_id: stationUuid,
              tanggal: dateStr,
              curah_hujan: rainfall
            });
          }
        }
      }

      // 3. Upsert batch
            
      const { error: upsertError } = await seedSupabase
        .from('master_data_hujan')
        .upsert(batchData, { onConflict: 'stasiun_id, tanggal' });

      if (upsertError) {
        console.error(`❌ Error upserting data for ${yearData.year}:`, upsertError.message);
      } else {
              }
    }

      } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Validation Error:', JSON.stringify(error.format(), null, 2));
    } else {
      console.error('❌ Unexpected Error:', error);
    }
    process.exit(1);
  }
}

seedData();
