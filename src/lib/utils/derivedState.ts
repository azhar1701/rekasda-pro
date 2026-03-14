/**
 * Derived State Calculations
 * Auto-computed values from SSOT parameters
 */

/**
 * Calculate Time of Concentration using Kirpich formula
 * tc = 0.0195 × L^0.77 × S^-0.385
 * @param L - Stream length (km)
 * @param S - Stream slope (m/m)
 * @returns Time of concentration (hours)
 */
export function calculateTimeOfConcentration(L: number, S: number): number {
 if (L <= 0 || S <= 0) return 0;
 return 0.0195 * Math.pow(L * 1000, 0.77) * Math.pow(S, -0.385) / 60; // Convert to hours
}

/**
 * Convert rainfall depth to volume
 * V = R × A × 1000 (m³)
 * @param rainfall - Rainfall depth (mm)
 * @param area - Catchment area (km²)
 * @returns Volume (m³)
 */
export function rainfallToVolume(rainfall: number, area: number): number {
 return rainfall * area * 1000;
}

/**
 * Calculate weighted average from items
 * @param items - Array of items with luas and value
 * @returns Weighted average
 */
export function calculateWeightedAverage(
 items: Array<{ luas: number; value: number }>
): number {
 const totalLuas = items.reduce((sum, item) => sum + item.luas, 0);
 if (totalLuas === 0) return 0;
 return items.reduce((sum, item) => sum + (item.value * item.luas), 0) / totalLuas;
}

/**
 * Get design discharge based on channel type
 * @param type - Channel type ('flood' | 'irrigation')
 * @param floodPeak - Peak flood discharge (m³/s)
 * @param dependableFlow - Dependable flow (m³/s)
 * @returns Design discharge (m³/s)
 */
export function getDesignDischarge(
 type: 'flood' | 'irrigation',
 floodPeak: number | null,
 dependableFlow: number | null
): number | null {
 if (type === 'flood') return floodPeak;
 if (type === 'irrigation') return dependableFlow;
 return null;
}
