/**
 * Service to simulate Auto-Delineasi DAS from a DEM file upload.
 * This is a mock service for Phase 3 of the Modul Data Master & Parameter Spasial.
 */

export interface DelineationResult {
  luasDAS: number;      // km²
  panjangSungai: number; // km
}

/**
 * Simulates processing a DEM file to perform auto-delineation.
 * @param file The DEM file to process (mocked)
 * @returns A promise that resolves with mock Area and Length after a delay.
 */
export const processDEM = async (_file: File): Promise<DelineationResult> => {
  // Simulate network/processing delay (1.5 - 3 seconds)
  const delay = 1500 + Math.random() * 1500;
  await new Promise((resolve) => setTimeout(resolve, delay));

  // Return realistic mock values
  // Area: 100 - 500 km²
  // Length: 10 - 50 km
  return {
    luasDAS: parseFloat((100 + Math.random() * 400).toFixed(2)),
    panjangSungai: parseFloat((10 + Math.random() * 40).toFixed(2)),
  };
};
