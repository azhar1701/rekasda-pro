/**
 * Custom Hook - SNI 2415:2016 Workflow Validation
 * Untuk validasi pemilihan metode perhitungan debit banjir rencana
 */

import { validateSNI2415Workflow, type SNI2415WorkflowResult } from '@/lib/engine/flood/sni2415';

/**
 * Hook untuk validasi workflow SNI 2415:2016
 * 
 * Mengembalikan rekomendasi metode berdasarkan luas DAS:
 * - DAS ≤ 300 ha (3 km²): Metode Rasional
 * - DAS > 300 ha (3 km²): Metode HSS (wajib)
 * 
 * @param areaKm2 - Luas Daerah Aliran Sungai dalam km²
 * @returns Hasil validasi workflow dengan rekomendasi metode
 * 
 * @example
 * ```tsx
 * const MyComponent = () => {
 *   const [area, setArea] = useState(2.5);
 *   const workflow = useSNI2415Workflow(area);
 *   
 *   return (
 *     <div>
 *       {workflow.warning && <Alert>{workflow.warning}</Alert>}
 *       <p>Metode: {workflow.recommendedMethod}</p>
 *     </div>
 *   );
 * };
 * ```
 */
export const useSNI2415Workflow = (areaKm2: number): SNI2415WorkflowResult => {
  return validateSNI2415Workflow(areaKm2);
};
