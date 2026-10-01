/**
 * Empirical Flood Hydrograph Synthesis
 * Sesuai SNI 2415:2016 Pasal 5.3
 * 
 * Menghasilkan kurva hidrograf banjir sintetis untuk metode-metode debit puncak empiris
 * (Metode Rasional, Melchior, Haspers, Der Weduwen) agar dapat dikomparasikan
 * secara visual dan dianalisis kapasitas tampungan (routing embung/waduk).
 */

export interface EmpiricalHydrographPoint {
  time: number;
  discharge: number;
}

/**
 * Generate hidrograf sintetis untuk metode empiris
 * @param method Nama metode (rational, melchior, haspers, der_weduwen)
 * @param Qp Debit puncak banjir rencana (m³/s)
 * @param tc Waktu konsentrasi (jam)
 * @param maxDuration Durasi total hidrograf (jam, default 24 jam)
 */
export function generateEmpiricalHydrograph(
  _method: string,
  Qp: number,
  tc: number,
  maxDuration: number = 24
): EmpiricalHydrographPoint[] {
  if (Qp <= 0) return [];

  const safeTc = Math.max(0.2, tc || 1.5);
  const Tp = safeTc;
  // Waktu dasar Tb: umumnya 2.67 - 3.5 kali Tp untuk DAS alami di Indonesia
  const Tb = Math.min(maxDuration, Math.max(safeTc * 3.2, 6.0));
  const timeStep = 0.25;

  const hydrograph: EmpiricalHydrographPoint[] = [];

  for (let t = 0; t <= Tb; t += timeStep) {
    let q = 0;
    if (t <= 0.001) {
      q = 0;
    } else if (t <= Tp) {
      // Kurva naik (Rising limb): Qt = Qp * (t / Tp)^1.8
      q = Qp * Math.pow(t / Tp, 1.8);
    } else {
      // Kurva turun (Recession limb): Qt = Qp * exp(-k * (t - Tp))
      const k = 2.2 / (Tb - Tp);
      q = Qp * Math.exp(-k * (t - Tp));
      if (t >= Tb) q = 0;
    }

    hydrograph.push({
      time: parseFloat(t.toFixed(2)),
      discharge: parseFloat(Math.max(0, q).toFixed(4))
    });
  }

  // Pastikan titik puncak tepat Qp ada pada Tp
  const peakMatch = hydrograph.find(h => Math.abs(h.time - Tp) < 0.15);
  if (peakMatch) {
    peakMatch.discharge = parseFloat(Qp.toFixed(4));
  }

  return hydrograph;
}
