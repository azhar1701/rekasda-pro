/**
 * Number Formatting Utilities
 * Helper functions for formatting numbers with precision and localization
 */

/**
 * Format number to fixed decimal places
 * @param value - Number to format
 * @param decimals - Number of decimal places (default: 3)
 * @returns Formatted number as string
 * @example
 * formatNumber(5.123456, 2) // "5.12"
 * formatNumber(1000.5, 0) // "1001" (rounded)
 */
export function formatNumber(value: number, decimals = 3): string {
 if (!isFinite(value)) return 'N/A';
 return parseFloat(value.toFixed(decimals)).toString();
}

/**
 * Format number with thousand separators and decimals
 * @example
 * formatCurrency(1234.567) // "1,234.57"
 */
export function formatWithCommas(
 value: number,
 decimals = 2,
 locale = 'en-US'
): string {
 return parseFloat(value.toFixed(decimals)).toLocaleString(locale);
}

/**
 * Format number as percentage
 * @example
 * formatPercentage(0.85) // "85%"
 * formatPercentage(0.8523, 1) // "85.2%"
 */
export function formatPercentage(value: number, decimals = 0): string {
 return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Format hydraulic parameters with appropriate precision
 */
export const HydraulicFormatter = {
 /**
 * Area (m²) - typically 3-4 decimals
 */
 area: (value: number) => formatNumber(value, 4),

 /**
 * Velocity (m/s) - typically 2-3 decimals
 */
 velocity: (value: number) => formatNumber(value, 3),

 /**
 * Discharge (m³/s) - 2-3 decimals
 */
 discharge: (value: number) => formatNumber(value, 3),

 /**
 * Distance (m) - 2-3 decimals
 */
 distance: (value: number) => formatNumber(value, 3),

 /**
 * Slope (m/m) - 4-6 decimals
 */
 slope: (value: number) => formatNumber(value, 6),

 /**
 * Manning coefficient - 3-4 decimals
 */
 manning: (value: number) => formatNumber(value, 4),

 /**
 * Dimensionless numbers (Froude, Reynolds) - 2-3 decimals
 */
 dimensionless: (value: number) => formatNumber(value, 3),

 /**
 * Time (hours) - 2 decimals
 */
 time: (value: number) => formatNumber(value, 2),

 /**
 * Rainfall (mm) - 1-2 decimals
 */
 rainfall: (value: number) => formatNumber(value, 2),
};

/**
 * Parse input string to number safely
 */
export function parseNumberInput(input: string | number): number {
 if (typeof input === 'number') return input;
 const parsed = parseFloat(input);
 return isNaN(parsed) ? 0 : parsed;
}

/**
 * Check if number is within valid range
 */
export function isInRange(value: number, min: number, max: number): boolean {
 return value >= min && value <= max;
}
