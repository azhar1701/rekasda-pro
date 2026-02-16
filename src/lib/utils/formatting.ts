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
