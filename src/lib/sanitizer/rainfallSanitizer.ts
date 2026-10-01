/**
 * Rainfall Sanitizer & Ingestion Normalizer
 * Single Source of Truth (SSOT) untuk pembersihan, validasi, dan normalisasi
 * data curah hujan harian (SNI Compliant).
 */

export interface SanitizedRainfallRecord {
  tanggal: string;          // ISO format YYYY-MM-DD
  curah_hujan: number;       // Nilai curah hujan dalam mm (>= 0)
  is_infilled?: boolean;
  warning?: string;
}

export interface SanitizerResult {
  records: SanitizedRainfallRecord[];
  missingCount: number;      // Jumlah data kosong / NR yang diabaikan atau diset null
  extremeCount: number;      // Jumlah data ekstrem (> 300 mm)
  errors: string[];
  yearSummary: { [year: number]: number };
}

/**
 * Nilai batas fisik curah hujan harian (mm)
 */
export const RAINFALL_LIMITS = {
  MIN_VALUE: 0,
  WARNING_EXTREME: 300,  // Peringatan hujan sangat lebat / probabilitas saltik
  MAX_PHYSICAL: 600,     // Ambang batas maksimum fisik (PMP ekstrem Indonesia)
};

/**
 * Membersihkan dan memvalidasi satu nilai curah hujan dari string mentah
 * Mengembalikan null jika terdeteksi kode data kosong/hilang ('-', 'NR', 'NA', '', 'null', '8888', '9999')
 */
export const parseRainfallValue = (raw: any): { val: number | null; warning?: string; error?: string } => {
  if (raw === null || raw === undefined) {
    return { val: null };
  }

  if (typeof raw === 'number') {
    if (isNaN(raw)) return { val: null };
    if (raw < 0) return { val: 0, warning: 'Nilai negatif dinormalkan menjadi 0.0 mm' };
    if (raw > RAINFALL_LIMITS.MAX_PHYSICAL) {
      return { val: null, error: `Nilai ${raw} mm melampaui batas fisik maksimum (${RAINFALL_LIMITS.MAX_PHYSICAL} mm)` };
    }
    const warning = raw > RAINFALL_LIMITS.WARNING_EXTREME 
      ? `Nilai ${raw} mm tergolong hujan ekstrem (> ${RAINFALL_LIMITS.WARNING_EXTREME} mm)` 
      : undefined;
    return { val: Number(raw.toFixed(2)), warning };
  }

  const str = String(raw).trim();
  if (str === '' || str === '-' || str === '–' || str.toUpperCase() === 'NR' || str.toUpperCase() === 'NA' || str === '8888' || str === '9999') {
    return { val: null };
  }

  // Konversi koma desimal Indonesia menjadi titik desimal standar
  const normalizedStr = str.replace(',', '.');
  const parsed = parseFloat(normalizedStr);

  if (isNaN(parsed)) {
    return { val: null, error: `Karakter '${str}' bukan format numerik yang valid` };
  }

  if (parsed < 0) {
    return { val: 0, warning: `Nilai negatif '${str}' dinormalkan menjadi 0.0 mm` };
  }

  if (parsed > RAINFALL_LIMITS.MAX_PHYSICAL) {
    return { val: null, error: `Nilai ${parsed} mm melampaui batas fisik maksimum (${RAINFALL_LIMITS.MAX_PHYSICAL} mm)` };
  }

  const warning = parsed > RAINFALL_LIMITS.WARNING_EXTREME 
    ? `Nilai ${parsed} mm tergolong hujan ekstrem (> ${RAINFALL_LIMITS.WARNING_EXTREME} mm)` 
    : undefined;

  return { val: Number(parsed.toFixed(2)), warning };
};

/**
 * Validasi keabsahan format tanggal YYYY-MM-DD
 */
export const isValidDate = (year: number, month: number, day: number): boolean => {
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;

  const d = new Date(year, month - 1, day);
  return d.getFullYear() === year && d.getMonth() === (month - 1) && d.getDate() === day;
};

/**
 * Parser terpadu untuk format teks matriks bulk-paste (31 baris x 12 bulan)
 */
export const parseBulkMatrixText = (text: string, defaultYear: number): SanitizerResult => {
  const lines = text.trim().split(/\r?\n/);
  const records: SanitizedRainfallRecord[] = [];
  const errors: string[] = [];
  const yearSummary: { [year: number]: number } = {};
  let missingCount = 0;
  let extremeCount = 0;

  lines.forEach((line, lineIdx) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    // Mendukung pemisah tab, spasi jamak, atau titik koma
    const parts = trimmed.split(/[\t;]|\s+/);
    if (parts.length < 2) return;

    const day = parseInt(parts[0], 10);
    if (isNaN(day) || day < 1 || day > 31) {
      errors.push(`Baris ${lineIdx + 1}: Tanggal '${parts[0]}' di luar rentang 1-31`);
      return;
    }

    const values = parts.slice(1);
    values.forEach((rawVal, monthIdx) => {
      if (monthIdx >= 12) return;
      const month = monthIdx + 1;

      if (!isValidDate(defaultYear, month, day)) {
        // Tanggal tidak valid untuk bulan ini (misal 30 Februari, 31 April)
        return;
      }

      const { val, warning, error } = parseRainfallValue(rawVal);
      if (error) {
        errors.push(`Tgl ${day}/${month}/${defaultYear}: ${error}`);
        return;
      }

      const dateStr = `${defaultYear}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

      if (val === null) {
        missingCount++;
      } else {
        if (warning && val > RAINFALL_LIMITS.WARNING_EXTREME) {
          extremeCount++;
        }
        records.push({
          tanggal: dateStr,
          curah_hujan: val,
          warning
        });
        yearSummary[defaultYear] = (yearSummary[defaultYear] || 0) + 1;
      }
    });
  });

  return {
    records,
    missingCount,
    extremeCount,
    errors,
    yearSummary
  };
};

/**
 * Helper untuk memecah array menjadi potongan batch berukuran tertentu (misal 365 item per batch)
 */
export const chunkArray = <T>(array: T[], chunkSize: number = 365): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
};
