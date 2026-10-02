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
  detectedYear?: number;
  verification?: {
    isVerified: boolean;
    message: string;
    details?: string;
  };
  stats?: {
    totalDays: number;
    rainyDays: number;
    maxRainfall: number;
    maxDate: string;
    annualTotal: number;
  };
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
  if (
    str === '' ||
    str === '-' ||
    str === '–' ||
    str === '—' ||
    str.toUpperCase() === 'NR' ||
    str.toUpperCase() === 'NA' ||
    str === '8888' ||
    str === '9999'
  ) {
    return { val: null };
  }

  // Standar legenda BMKG: Huruf "O" atau "o" digunakan untuk menandakan tidak ada hujan (0 mm)
  if (str.toUpperCase() === 'O') {
    return { val: 0 };
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
 * Parser cerdas untuk format teks matriks bulk-paste (31 baris x 12 bulan)
 * Kompatibel penuh dengan format standar BMKG & PU (Excel / Google Sheets).
 *
 * Fitur:
 * - Menangani copy-paste dengan atau tanpa kolom tanggal (13 kolom atau 12 kolom)
 * - Otomatis mendeteksi tahun dari teks (misal: "Tanggal: 2008")
 * - Otomatis mengabaikan baris header ("Tanggal", "Jan", "Feb", dsb.)
 * - Otomatis membuang baris footer / rekapitulasi statistik ("Hujan Maximum", "Jml Curah Hujan", dsb.)
 * - Menjaga pemisah tab kosong (\t\t) agar tidak terjadi pergeseran kolom bulan
 * - Melakukan validasi silang (cross-verification) jika terdapat baris rekapitulasi Excel
 */
export const parseBulkMatrixText = (text: string, defaultYear: number): SanitizerResult => {
  const lines = text.split(/\r?\n/);
  const records: SanitizedRainfallRecord[] = [];
  const errors: string[] = [];
  const yearSummary: { [year: number]: number } = {};
  let missingCount = 0;
  let extremeCount = 0;

  // 1. Deteksi Tahun dari Teks
  let detectedYear: number | undefined;
  for (const line of lines.slice(0, 10)) {
    const yearMatch = line.match(/(?:tanggal|tahun)[\s:._-]*.*?(\b(19\d\d|20\d\d)\b)/i) || line.match(/\b(19\d\d|20\d\d)\b/);
    if (yearMatch) {
      const yr = parseInt(yearMatch[1], 10);
      if (yr >= 1950 && yr <= 2050) {
        detectedYear = yr;
        break;
      }
    }
  }

  const targetYear = detectedYear || defaultYear;

  // Array untuk validasi silang dengan rekapitulasi Excel
  const calculatedMonthlyTotals = Array(12).fill(0);
  let reportedMonthlyTotals: number[] | null = null;
  let dataRowCount = 0;

  const stats = {
    totalDays: 0,
    rainyDays: 0,
    maxRainfall: 0,
    maxDate: '',
    annualTotal: 0,
  };

  // 2. Iterasi Setiap Baris
  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const line = lines[lineIdx];
    const trimmed = line.trim();
    if (!trimmed) continue;

    const lower = trimmed.toLowerCase();

    // A. Deteksi & Abaikan Baris Header (nama bulan atau kata 'tanggal')
    if (
      lower.includes('tanggal') ||
      lower.includes('bulan') ||
      (lower.includes('jan') && lower.includes('feb') && lower.includes('mar'))
    ) {
      continue;
    }

    // B. Deteksi Baris Rekapitulasi Footer
    if (lower.startsWith('hujan max') || lower.startsWith('hujan maks')) {
      continue;
    }

    if (lower.startsWith('jml curah hujan') || lower.startsWith('jumlah curah hujan') || lower.startsWith('total curah hujan')) {
      // Ekstrak angka total bulanan yang dilaporkan
      const parts = line.includes('\t') ? line.split('\t') : trimmed.split(/;|\s{2,}|\s+/);
      const nums = parts
        .map((p) => parseFloat(p.trim().replace(',', '.')))
        .filter((n) => !isNaN(n));
      if (nums.length === 12) {
        reportedMonthlyTotals = nums;
      }
      continue;
    }

    // Abaikan baris rekapitulasi statistik lainnya & legenda
    if (
      lower.startsWith('jml') ||
      lower.startsWith('jumlah') ||
      lower.startsWith('hari hujan') ||
      lower.startsWith('"o"') ||
      lower.startsWith('\'o\'') ||
      lower.startsWith('"-') ||
      lower.startsWith('ket')
    ) {
      continue;
    }

    // C. Parsing Baris Data Hujan
    // Gunakan pemisah Tab jika ada (menjaga sel kosong Excel agar tidak bergeser kolomnya)
    let parts: string[];
    if (line.includes('\t')) {
      parts = line.split('\t');
    } else if (line.includes(';')) {
      parts = line.split(';');
    } else {
      parts = trimmed.split(/\s{2,}|\s+/);
    }

    // Bersihkan nilai kolom kosong di awal/akhir baris
    if (parts.length < 2) continue;

    let day: number;
    let monthValues: string[];

    const firstColNumber = parseInt(parts[0].trim(), 10);

    if (!isNaN(firstColNumber) && firstColNumber >= 1 && firstColNumber <= 31 && parts.length >= 13) {
      // Format 13 Kolom: [Tanggal, Jan, Feb, ..., Des]
      day = firstColNumber;
      monthValues = parts.slice(1, 13);
    } else if (parts.length >= 12 && dataRowCount < 31) {
      // Format 12 Kolom tanpa kolom Tanggal: [Jan, Feb, ..., Des]
      dataRowCount++;
      day = dataRowCount;
      monthValues = parts.slice(0, 12);
    } else {
      // Baris teks non-data
      continue;
    }

    // D. Iterasi 12 Bulan
    for (let monthIdx = 0; monthIdx < 12; monthIdx++) {
      const month = monthIdx + 1;
      const rawVal = monthValues[monthIdx];

      // Jika tanggal tidak valid di kalender (misal 30 Februari, 31 April), lewati tanpa error (sel abu-abu)
      if (!isValidDate(targetYear, month, day)) {
        continue;
      }

      const { val, warning, error } = parseRainfallValue(rawVal);
      if (error) {
        errors.push(`Tgl ${day}/${month}/${targetYear}: ${error}`);
        continue;
      }

      const dateStr = `${targetYear}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

      if (val === null) {
        missingCount++;
      } else {
        if (warning && val > RAINFALL_LIMITS.WARNING_EXTREME) {
          extremeCount++;
        }
        records.push({
          tanggal: dateStr,
          curah_hujan: val,
          warning,
        });

        yearSummary[targetYear] = (yearSummary[targetYear] || 0) + 1;
        stats.totalDays++;
        stats.annualTotal += val;
        calculatedMonthlyTotals[monthIdx] += val;

        if (val > 0) {
          stats.rainyDays++;
        }

        if (val > stats.maxRainfall) {
          stats.maxRainfall = val;
          stats.maxDate = dateStr;
        }
      }
    }
  }

  // 3. Validasi Silang dengan Baris Rekapitulasi Excel
  let verification: SanitizerResult['verification'];
  if (reportedMonthlyTotals && reportedMonthlyTotals.length === 12) {
    let allMatched = true;
    for (let m = 0; m < 12; m++) {
      if (Math.abs(calculatedMonthlyTotals[m] - reportedMonthlyTotals[m]) > 0.5) {
        allMatched = false;
        break;
      }
    }

    if (allMatched) {
      verification = {
        isVerified: true,
        message: 'Validasi Sempurna: Total curah hujan bulanan cocok 100% dengan baris rekapitulasi Excel!',
      };
    } else {
      verification = {
        isVerified: false,
        message: 'Perhatian: Terdeteksi sedikit perbedaan antara akumulasi data harian dengan rekapitulasi Excel.',
      };
    }
  }

  stats.annualTotal = Number(stats.annualTotal.toFixed(2));

  return {
    records,
    missingCount,
    extremeCount,
    errors,
    yearSummary,
    detectedYear,
    verification,
    stats,
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
