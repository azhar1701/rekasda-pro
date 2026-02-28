import { DataHujan } from '@/stores/useHydrologyStore';

/**
 * Service to fetch rainfall data from satellite sources (Mock CHIRPS/GPM).
 * In a real scenario, this would call an API like NASA POWER or Google Earth Engine.
 */
export const fetchSatelliteRainfall = async (
  lat: number,
  lon: number,
  startYear: number = 2010,
  endYear: number = 2024
): Promise<DataHujan[]> => {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 2000));

  const data: DataHujan[] = [];
  
  // Simple seeded pseudo-random based on coordinates to get deterministic data
  let seed = Math.abs(Math.floor(lat * 1000) + Math.floor(lon * 1000));
  const seededRandom = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return (seed % 10000) / 10000;
  };

  // Satellite data characteristics (often slightly different from ground stations)
  // CHIRPS/GPM often has a slight bias or different variance
  const baseline = 110 + (seed % 70); 

  for (let year = startYear; year <= endYear; year++) {
    // Generate annual maximum
    const u1 = Math.max(0.0001, seededRandom());
    const u2 = seededRandom();
    const normalRandom = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    
    // Satellite data might be smoother, so we use a slightly different distribution
    const annualMax = Math.max(45, baseline + normalRandom * 30);

    // Random date in rainy season (Nov-Mar)
    const months = [1, 2, 3, 11, 12];
    const month = months[Math.floor(seededRandom() * months.length)];
    const day = Math.floor(seededRandom() * 28) + 1;
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    data.push({
      id: crypto.randomUUID(),
      stasiun_id: 'satellite-mock', // Identifier for satellite source
      tanggal: dateStr,
      curah_hujan: parseFloat(annualMax.toFixed(1)),
    });
  }

  // Sort by date
  return data.sort((a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime());
};
