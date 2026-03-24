import { PRECISION, PrecisionKey } from '../constants/precision';
import { roundEng } from './precision';

/**
 * Format angka ke standar presentasi UI (menggunakan locale id-ID)
 * dengan desimal yang merujuk pada standar SNI (objek PRECISION).
 *
 * @param value - Nilai angka murni (engine result)
 * @param precisionKey - Key untuk jumlah desimal presisi (misal 'discharge' -> 3)
 */
export function formatNumber(value: number, precisionKey: PrecisionKey = 'discharge'): string {
    if (isNaN(value) || !isFinite(value)) return '0';
    
    // Gunakan roundEng untuk menghindari floating point drift sebelum diubah ke string
    const rounded = roundEng(value, PRECISION[precisionKey]);
    
    return rounded.toLocaleString('id-ID', {
        minimumFractionDigits: PRECISION[precisionKey],
        maximumFractionDigits: PRECISION[precisionKey],
    });
}
