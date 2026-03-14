/**
 * Return Period Infrastructure Guidance
 * Berdasarkan Permen PUPR No. 18/2021
 */

export const RETURN_PERIOD_GUIDANCE: Record<string, { infrastructure: string; color: string }> = {
 'Q2': { 
 infrastructure: 'Drainase lokal, saluran tersier', 
 color: 'text-slate-600 dark:text-slate-400' 
 },
 'Q5': { 
 infrastructure: 'Drainase sekunder, jalan lokal', 
 color: 'text-pupr-blue' 
 },
 'Q10': { 
 infrastructure: 'Drainase primer, jalan arteri', 
 color: 'text-cyan-600' 
 },
 'Q25': { 
 infrastructure: 'Jembatan kecil, gorong-gorong besar', 
 color: 'text-teal-600' 
 },
 'Q50': { 
 infrastructure: 'Jembatan strategis, bendung', 
 color: 'text-orange-600' 
 },
 'Q100': { 
 infrastructure: 'Bendungan, infrastruktur vital', 
 color: 'text-red-600' 
 },
};
