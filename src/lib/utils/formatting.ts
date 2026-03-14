export const formatNumber = (value: number, decimals = 3): string => {
 if (!isFinite(value)) return 'N/A';
 return parseFloat(value.toFixed(decimals)).toString();
};

export const formatWithCommas = (value: number, decimals = 2, locale = 'en-US'): string => {
 if (!isFinite(value)) return 'N/A';
 return parseFloat(value.toFixed(decimals)).toLocaleString(locale);
};

export const formatPercentage = (value: number, decimals = 0): string => {
 if (!isFinite(value)) return 'N/A';
 return `${(value * 100).toFixed(decimals)}%`;
};

export const parseNumberInput = (input: string | number): number => {
 if (typeof input === 'number') return input;
 const parsed = parseFloat(input);
 return isNaN(parsed) ? 0 : parsed;
};

export const isInRange = (value: number, min: number, max: number): boolean => {
  return value >= min && value <= max;
};

/**
 * Sanitize numeric string input, handling Indonesian locale conventions.
 * Converts comma-decimal ("12,5") to dot-decimal ("12.5").
 * Strips thousand separators intelligently.
 * @param input - Raw string from user input
 * @returns Sanitized string suitable for parseFloat
 */
export const sanitizeNumericInput = (input: string): string => {
  const trimmed = input.trim();
  if (!trimmed) return '';
  
  // If string contains both dots and commas, determine format
  const hasDot = trimmed.includes('.');
  const hasComma = trimmed.includes(',');
  
  if (hasDot && hasComma) {
    // Determine which is the decimal separator (last one wins)
    const lastDot = trimmed.lastIndexOf('.');
    const lastComma = trimmed.lastIndexOf(',');
    if (lastComma > lastDot) {
      // Format: 1.234,56 (Indonesian/European) → 1234.56
      return trimmed.replace(/\./g, '').replace(',', '.');
    } else {
      // Format: 1,234.56 (US) → 1234.56
      return trimmed.replace(/,/g, '');
    }
  }
  
  if (hasComma && !hasDot) {
    // Could be "1,5" (decimal) or "1,000" (thousand sep)
    // Heuristic: if exactly 3 digits after comma, treat as thousand separator
    const parts = trimmed.split(',');
    if (parts.length === 2 && parts[1].length === 3 && /^\d+$/.test(parts[1])) {
      // Ambiguous — but in Indonesian engineering context, "1,500" likely means 1500
      // However, single comma with 3 trailing digits → thousand separator
      return trimmed.replace(',', '');
    }
    // Otherwise treat comma as decimal separator (Indonesian convention)
    return trimmed.replace(',', '.');
  }
  
  // No comma → return as-is (dot decimal or integer)
  return trimmed;
};

/**
 * Safely parse a float from string or number input.
 * Handles Indonesian comma-decimal notation ("12,5" → 12.5).
 * Returns fallback on NaN, Infinity, or empty input.
 * @param input - Raw user input (string or number)
 * @param fallback - Value to return on parse failure (default: 0)
 */
export const safeParseFloat = (input: string | number, fallback = 0): number => {
  if (typeof input === 'number') {
    return isFinite(input) ? input : fallback;
  }
  const sanitized = sanitizeNumericInput(input);
  if (!sanitized) return fallback;
  const parsed = parseFloat(sanitized);
  return isFinite(parsed) ? parsed : fallback;
};

/**
 * Safely parse an integer from string or number input.
 * Handles Indonesian comma-decimal notation.
 * Returns fallback on NaN or empty input.
 * @param input - Raw user input (string or number)
 * @param fallback - Value to return on parse failure (default: 0)
 */
export const safeParseInt = (input: string | number, fallback = 0): number => {
  if (typeof input === 'number') {
    return isFinite(input) ? Math.trunc(input) : fallback;
  }
  const sanitized = sanitizeNumericInput(input);
  if (!sanitized) return fallback;
  const parsed = parseInt(sanitized, 10);
  return isFinite(parsed) ? parsed : fallback;
};

/**
 * Guard a numeric value against NaN and Infinity.
 * Use when you already have a number but need safety.
 * @param value - The number to guard
 * @param fallback - Value to return if invalid (default: 0)
 */
export const safeNumber = (value: number, fallback = 0): number => {
  return isFinite(value) ? value : fallback;
};

/**
 * Parse numeric input and clamp to a valid range.
 * Returns fallback if parsing fails or value is outside [min, max].
 * @param input - Raw user input
 * @param min - Minimum valid value (inclusive)
 * @param max - Maximum valid value (inclusive)
 * @param fallback - Fallback value (must be within [min, max])
 */
export const parseInRange = (
  input: string | number,
  min: number,
  max: number,
  fallback?: number
): number => {
  const defaultFallback = fallback ?? min;
  const value = safeParseFloat(input, defaultFallback);
  return Math.max(min, Math.min(max, value));
};

/**
 * Safe division that guards against divide-by-zero.
 * Returns fallback when divisor is 0 or result is not finite.
 * @param numerator - Dividend
 * @param denominator - Divisor
 * @param fallback - Fallback value (default: 0)
 */
export const safeDivide = (numerator: number, denominator: number, fallback = 0): number => {
  if (denominator === 0) return fallback;
  const result = numerator / denominator;
  return isFinite(result) ? result : fallback;
};

