/**
 * Channel Hydraulics Engine (Manning Formula & SNI Standards)
 * =============================================================
 * Standard References:
 * - SNI 03-3424-1994: Tata Cara Perencanaan Drainase Permukaan Jalan
 * - Pd. T-02-2006-B: Perencanaan Sistem Drainase Jalan
 * - SNI 8066:2015: Tata Cara Pengukuran Debit Aliran Sungai dan Saluran Terbuka
 * - Standar Perencanaan Irigasi KP-03 (Saluran Terbuka)
 * - Chow, V.T. (1959): Open-Channel Hydraulics
 */

export const GRAVITY = 9.81; // m/s²
export const WATER_UNIT_WEIGHT = 9810; // N/m³

export type ChannelShapeType = 'trapezoid' | 'rectangular' | 'triangular' | 'circular';

export interface ChannelMaterial {
  id: string;
  name: string;
  n: number;
  maxVelocity: number; // m/s (SNI 03-3424-1994)
  description: string;
}

export const SNI_CHANNEL_MATERIALS: ChannelMaterial[] = [
  { id: 'concrete_smooth', name: 'Beton Pracetak / Halus (U-Ditch)', n: 0.013, maxVelocity: 3.5, description: 'Saluran beton pracetak, finishing halus' },
  { id: 'concrete_rough', name: 'Beton Kasar / Cor di Tempat', n: 0.015, maxVelocity: 3.0, description: 'Saluran beton monolit cor di tempat' },
  { id: 'masonry', name: 'Pasangan Batu Kali dengan Siar', n: 0.022, maxVelocity: 2.0, description: 'Saluran pasangan batu kali dengan mortar/plesteran' },
  { id: 'masonry_rough', name: 'Pasangan Batu Kali Kasar', n: 0.025, maxVelocity: 1.5, description: 'Saluran batu belah tanpa plesteran' },
  { id: 'earth_clean', name: 'Saluran Tanah Bersih Terawat', n: 0.022, maxVelocity: 0.8, description: 'Tanah lempung/padat tanpa vegetasi' },
  { id: 'earth_gravel', name: 'Saluran Tanah Berkerikil', n: 0.030, maxVelocity: 1.0, description: 'Tanah berbutir kasar/kerikil' },
  { id: 'pvc', name: 'Pipa PVC / Plastik Bergelombang', n: 0.010, maxVelocity: 4.5, description: 'Pipa drainase PVC / HDPE' },
  { id: 'corrugated_steel', name: 'Gorong-gorong Baja Bergelombang', n: 0.024, maxVelocity: 4.0, description: 'Multi-plate corrugated steel culvert' },
];

export interface ChannelGeometryInputs {
  shape: ChannelShapeType;
  width?: number; // b (m) for trapezoid, rectangular
  depth: number; // h (m) water depth
  totalDepth?: number; // H (m) total channel height
  sideSlope?: number; // m (m horizontal per 1 vertical) for trapezoid, triangular
  diameter?: number; // D (m) for circular
  slope: number; // S (m/m) longitudinal slope
  roughness: number; // n Manning
  materialId?: string;
}

export interface GeometricProperties {
  area: number; // A (m²)
  wettedPerimeter: number; // P (m)
  hydraulicRadius: number; // R (m)
  topWidth: number; // T (m)
  hydraulicDepth: number; // D = A/T (m)
}

export interface HydraulicJumpResult {
  hasJump: boolean;
  initialDepth: number; // y1 (m)
  sequentDepth: number; // y2 (m)
  jumpLength: number; // Lj (m)
  energyLoss: number; // ΔE (m)
  efficiency: number; // E2 / E1
  jumpType: string;
}

export interface ChannelHydraulicResult {
  // Geometry
  area: number;
  wettedPerimeter: number;
  hydraulicRadius: number;
  topWidth: number;
  hydraulicDepth: number;

  // Flow Hydraulics
  velocity: number;
  discharge: number;
  froudeNumber: number;
  flowRegime: 'Subkritis' | 'Kritis' | 'Superkritis';

  // Energy & Force
  velocityHead: number;
  specificEnergy: number;
  shearStress: number;
  streamPower: number;

  // Critical State
  criticalDepth: number;
  criticalVelocity: number;
  criticalSlope: number;

  // Freeboard (Tinggi Jagaan SNI)
  freeboardActual: number;
  freeboardRecommended: number;
  isFreeboardSafe: boolean;

  // Velocity Compliance (SNI 03-3424-1994)
  minVelocity: number;
  maxVelocity: number;
  isVelocitySafe: boolean;
  velocityStatus: 'Normal' | 'Rawan Gerusan (Scouring)' | 'Rawan Sedimentasi (Silting)';

  // Hydraulic Jump (if supercritical)
  hydraulicJump?: HydraulicJumpResult;
}

/**
 * 1. Menghitung Properti Geometri Penampang
 */
export function calculateChannelGeometry(inputs: {
  shape: ChannelShapeType;
  width?: number;
  depth: number;
  sideSlope?: number;
  diameter?: number;
}): GeometricProperties {
  const { shape, depth } = inputs;
  const h = Math.max(0, depth);

  if (h <= 0) {
    return { area: 0, wettedPerimeter: 0, hydraulicRadius: 0, topWidth: 0, hydraulicDepth: 0 };
  }

  switch (shape) {
    case 'rectangular': {
      const b = Math.max(0.01, inputs.width ?? 1.0);
      const area = b * h;
      const wettedPerimeter = b + 2 * h;
      const hydraulicRadius = wettedPerimeter > 0 ? area / wettedPerimeter : 0;
      const topWidth = b;
      const hydraulicDepth = h;
      return { area, wettedPerimeter, hydraulicRadius, topWidth, hydraulicDepth };
    }

    case 'triangular': {
      const m = Math.max(0.01, inputs.sideSlope ?? 1.0);
      const area = m * h * h;
      const wettedPerimeter = 2 * h * Math.sqrt(1 + m * m);
      const hydraulicRadius = wettedPerimeter > 0 ? area / wettedPerimeter : 0;
      const topWidth = 2 * m * h;
      const hydraulicDepth = topWidth > 0 ? area / topWidth : 0;
      return { area, wettedPerimeter, hydraulicRadius, topWidth, hydraulicDepth };
    }

    case 'circular': {
      const D = Math.max(0.01, inputs.diameter ?? 1.0);
      const waterH = Math.min(h, D);
      
      // Full pipe
      if (waterH >= D) {
        const area = (Math.PI * D * D) / 4;
        const wettedPerimeter = Math.PI * D;
        const hydraulicRadius = D / 4;
        return { area, wettedPerimeter, hydraulicRadius, topWidth: 0.001, hydraulicDepth: D / 4 };
      }

      // Partial pipe: theta = 2 * arccos(1 - 2h/D)
      const theta = 2 * Math.acos(Math.max(-1, Math.min(1, 1 - (2 * waterH) / D)));
      const area = (D * D / 8) * (theta - Math.sin(theta));
      const wettedPerimeter = (D / 2) * theta;
      const hydraulicRadius = wettedPerimeter > 0 ? area / wettedPerimeter : 0;
      const topWidth = D * Math.sin(theta / 2);
      const hydraulicDepth = topWidth > 0 ? area / topWidth : 0;
      return { area, wettedPerimeter, hydraulicRadius, topWidth, hydraulicDepth };
    }

    case 'trapezoid':
    default: {
      const b = Math.max(0.01, inputs.width ?? 1.0);
      const m = Math.max(0, inputs.sideSlope ?? 1.0);
      const area = (b + m * h) * h;
      const wettedPerimeter = b + 2 * h * Math.sqrt(1 + m * m);
      const hydraulicRadius = wettedPerimeter > 0 ? area / wettedPerimeter : 0;
      const topWidth = b + 2 * m * h;
      const hydraulicDepth = topWidth > 0 ? area / topWidth : 0;
      return { area, wettedPerimeter, hydraulicRadius, topWidth, hydraulicDepth };
    }
  }
}

/**
 * 2. Menghitung Kedalaman Kritis (yc)
 * Kondisi Kritis: Q² * T / (g * A³) = 1  => Fr = 1
 */
export function calculateCriticalDepth(
  Q: number,
  shape: ChannelShapeType,
  params: { width?: number; sideSlope?: number; diameter?: number }
): number {
  if (Q <= 0) return 0;

  if (shape === 'rectangular') {
    const b = Math.max(0.01, params.width ?? 1.0);
    const q = Q / b; // debit per meter lebar
    return Math.pow((q * q) / GRAVITY, 1 / 3);
  }

  if (shape === 'triangular') {
    const m = Math.max(0.01, params.sideSlope ?? 1.0);
    return Math.pow((2 * Q * Q) / (GRAVITY * m * m), 1 / 5);
  }

  // Numerik (Bisection) untuk Trapesium dan Lingkaran
  let yLow = 0.001;
  let yHigh = shape === 'circular' ? (params.diameter ?? 2.0) : 15.0;

  for (let iter = 0; iter < 40; iter++) {
    const yMid = (yLow + yHigh) / 2;
    const geom = calculateChannelGeometry({
      shape,
      depth: yMid,
      width: params.width,
      sideSlope: params.sideSlope,
      diameter: params.diameter
    });

    if (geom.area <= 0 || geom.topWidth <= 0) {
      yLow = yMid;
      continue;
    }

    // f(y) = Q² * T - g * A³
    const fVal = (Q * Q * geom.topWidth) - (GRAVITY * Math.pow(geom.area, 3));

    if (Math.abs(fVal) < 1e-4) return yMid;

    if (fVal > 0) {
      yLow = yMid;
    } else {
      yHigh = yMid;
    }
  }

  return (yLow + yHigh) / 2;
}

/**
 * 3. Analisis Lengkap Hidraulika Saluran (Manning + SNI Compliance)
 */
export function calculateChannelHydraulics(inputs: ChannelGeometryInputs): ChannelHydraulicResult {
  const { shape, depth, slope, roughness, materialId } = inputs;
  const totalDepth = inputs.totalDepth ?? (depth * 1.3);

  // 1. Hitung geometri
  const geom = calculateChannelGeometry({
    shape,
    depth,
    width: inputs.width,
    sideSlope: inputs.sideSlope,
    diameter: inputs.diameter
  });

  // 2. Persamaan Manning: V = (1/n) * R^(2/3) * S^(1/2)
  const S = Math.max(0.00001, slope);
  const n = Math.max(0.005, roughness);
  const velocity = (1 / n) * Math.pow(geom.hydraulicRadius, 2 / 3) * Math.sqrt(S);
  const discharge = geom.area * velocity;

  // 3. Bilangan Froude: Fr = V / sqrt(g * D)
  const froudeNumber = geom.hydraulicDepth > 0 ? velocity / Math.sqrt(GRAVITY * geom.hydraulicDepth) : 0;
  let flowRegime: ChannelHydraulicResult['flowRegime'] = 'Subkritis';
  if (froudeNumber > 1.05) flowRegime = 'Superkritis';
  else if (froudeNumber >= 0.95 && froudeNumber <= 1.05) flowRegime = 'Kritis';

  // 4. Energi & Tegangan Geser
  const velocityHead = (velocity * velocity) / (2 * GRAVITY);
  const specificEnergy = depth + velocityHead;
  const shearStress = WATER_UNIT_WEIGHT * geom.hydraulicRadius * S;
  const streamPower = WATER_UNIT_WEIGHT * discharge * S;

  // 5. Kondisi Kritis
  const criticalDepth = calculateCriticalDepth(discharge, shape, {
    width: inputs.width,
    sideSlope: inputs.sideSlope,
    diameter: inputs.diameter
  });
  const critGeom = calculateChannelGeometry({
    shape,
    depth: criticalDepth,
    width: inputs.width,
    sideSlope: inputs.sideSlope,
    diameter: inputs.diameter
  });
  const criticalVelocity = critGeom.area > 0 ? discharge / critGeom.area : 0;
  // Kemiringan kritis: Sc = (n * Vc / Rc^(2/3))²
  const criticalSlope = critGeom.hydraulicRadius > 0
    ? Math.pow((n * criticalVelocity) / Math.pow(critGeom.hydraulicRadius, 2 / 3), 2)
    : S;

  // 6. Evaluasi Tinggi Jagaan (Freeboard) berdasarkan Pd. T-02-2006-B & KP-03
  // Standar: Fb = sqrt(0.5 * h), dengan batas minimum 0.30 m untuk saluran drainase
  const freeboardRecommended = Math.max(0.3, Math.sqrt(0.5 * depth));
  const freeboardActual = Math.max(0, totalDepth - depth);
  const isFreeboardSafe = freeboardActual >= freeboardRecommended && depth <= totalDepth;

  // 7. Evaluasi Batas Kecepatan Izin SNI (Scouring vs Silting)
  const minVelocity = 0.6; // SNI 03-3424-1994: mencegah endapan lumpur
  const matchedMaterial = SNI_CHANNEL_MATERIALS.find(m => m.id === materialId) ??
    SNI_CHANNEL_MATERIALS.find(m => Math.abs(m.n - n) < 0.003) ??
    SNI_CHANNEL_MATERIALS[0];

  const maxVelocity = matchedMaterial.maxVelocity;
  let velocityStatus: ChannelHydraulicResult['velocityStatus'] = 'Normal';
  if (velocity < minVelocity) velocityStatus = 'Rawan Sedimentasi (Silting)';
  else if (velocity > maxVelocity) velocityStatus = 'Rawan Gerusan (Scouring)';

  const isVelocitySafe = velocity >= minVelocity && velocity <= maxVelocity;

  // 8. Evaluasi Loncat Air jika Superkritis (Fr > 1.05)
  let hydraulicJump: HydraulicJumpResult | undefined;
  if (froudeNumber > 1.05) {
    const y1 = depth;
    // Persamaan Belanger untuk kedalaman konjugasi:
    const y2 = (y1 / 2) * (Math.sqrt(1 + 8 * froudeNumber * froudeNumber) - 1);
    const dE = Math.pow(y2 - y1, 3) / (4 * y1 * y2);
    const Lj = 6.0 * (y2 - y1); // Rumus empiris Smetana / USBR
    const E1 = specificEnergy;
    const v2 = (geom.area * velocity) / (calculateChannelGeometry({ shape, depth: y2, width: inputs.width, sideSlope: inputs.sideSlope, diameter: inputs.diameter }).area || 1);
    const E2 = y2 + (v2 * v2) / (2 * GRAVITY);
    const efficiency = E1 > 0 ? E2 / E1 : 1;

    let jumpType = 'Loncatan Kuat (Strong Jump)';
    if (froudeNumber < 1.7) jumpType = 'Loncatan Berombak (Undular Jump)';
    else if (froudeNumber < 2.5) jumpType = 'Loncatan Lemah (Weak Jump)';
    else if (froudeNumber < 4.5) jumpType = 'Loncatan Berosilasi (Oscillating Jump)';
    else if (froudeNumber < 9.0) jumpType = 'Loncatan Mantap (Steady Jump)';

    hydraulicJump = {
      hasJump: true,
      initialDepth: y1,
      sequentDepth: y2,
      jumpLength: Lj,
      energyLoss: dE,
      efficiency,
      jumpType
    };
  }

  return {
    area: geom.area,
    wettedPerimeter: geom.wettedPerimeter,
    hydraulicRadius: geom.hydraulicRadius,
    topWidth: geom.topWidth,
    hydraulicDepth: geom.hydraulicDepth,
    velocity,
    discharge,
    froudeNumber,
    flowRegime,
    velocityHead,
    specificEnergy,
    shearStress,
    streamPower,
    criticalDepth,
    criticalVelocity,
    criticalSlope,
    freeboardActual,
    freeboardRecommended,
    isFreeboardSafe,
    minVelocity,
    maxVelocity,
    isVelocitySafe,
    velocityStatus,
    hydraulicJump
  };
}

/**
 * 4. Solver Dimensi Otomatis (Inverse Manning Problem & Best Hydraulic Section)
 * Menentukan dimensi penampang ekonomis/hidrolis terbaik untuk melayani target debit.
 */
export interface AutoDimensionOptions {
  shape: ChannelShapeType;
  targetDischarge: number; // Q (m³/s)
  slope: number; // S (m/m)
  roughness: number; // n
  sideSlope?: number; // m
  aspectRatio?: number; // b / h (default: optimal hydraulic section)
  materialId?: string;
}

export interface AutoDimensionResult {
  width: number; // b (m)
  depth: number; // h (m)
  totalDepth: number; // H = h + freeboard (m)
  topWidth: number; // B (m)
  sideSlope: number; // m
  diameter?: number; // D (m) jika pipa
  capacity: number; // Q dihasilkan (m³/s)
  velocity: number; // V (m/s)
  froudeNumber: number;
  freeboard: number;
  isOptimal: boolean;
  notes: string;
}

export function solveOptimalDimensions(options: AutoDimensionOptions): AutoDimensionResult {
  const { shape, targetDischarge, slope, roughness, sideSlope = 1.0 } = options;
  const Q = Math.max(0.001, targetDischarge);
  const S = Math.max(0.00001, slope);
  const n = Math.max(0.005, roughness);

  if (shape === 'rectangular') {
    // Penampang Hidrolis Terbaik Persegi Panjang: b = 2h, R = h/2
    // A = 2h², P = 4h, R = h/2
    // Q = (1/n) * (2h²) * (h/2)^(2/3) * S^(1/2) = (1/n) * 2 * (1/2)^(2/3) * h^(8/3) * S^(1/2)
    // h^(8/3) = Q * n / (2 * (0.5)^(2/3) * sqrt(S))
    const coeff = (2 / Math.pow(2, 2 / 3));
    const h83 = (Q * n) / (coeff * Math.sqrt(S));
    const h = Math.pow(h83, 3 / 8);
    const b = 2 * h;
    const fb = Math.max(0.3, Math.sqrt(0.5 * h));
    const H = h + fb;
    const res = calculateChannelHydraulics({
      shape: 'rectangular',
      width: b,
      depth: h,
      totalDepth: H,
      slope: S,
      roughness: n
    });

    return {
      width: parseFloat(b.toFixed(2)),
      depth: parseFloat(h.toFixed(2)),
      totalDepth: parseFloat(H.toFixed(2)),
      topWidth: parseFloat(b.toFixed(2)),
      sideSlope: 0,
      capacity: parseFloat(res.discharge.toFixed(3)),
      velocity: parseFloat(res.velocity.toFixed(2)),
      froudeNumber: parseFloat(res.froudeNumber.toFixed(2)),
      freeboard: parseFloat(fb.toFixed(2)),
      isOptimal: true,
      notes: 'Penampang Persegi Terbaik (b = 2h, R = h/2)'
    };
  }

  if (shape === 'triangular') {
    // Penampang Hidrolis Terbaik Segitiga: m = 1 (sudut 90°), R = h / (2 * sqrt(2))
    const m = sideSlope > 0 ? sideSlope : 1.0;
    // Q = (1/n) * (m*h²) * (m*h / (2*sqrt(1+m²)))^(2/3) * S^(1/2)
    // h^(8/3) = (Q * n / sqrt(S)) * ( (2*sqrt(1+m²))^(2/3) / m^(5/3) )
    const term = Math.pow(2 * Math.sqrt(1 + m * m), 2 / 3) / Math.pow(m, 5 / 3);
    const h83 = (Q * n / Math.sqrt(S)) * term;
    const h = Math.pow(h83, 3 / 8);
    const fb = Math.max(0.3, Math.sqrt(0.5 * h));
    const H = h + fb;
    const topW = 2 * m * h;
    const res = calculateChannelHydraulics({
      shape: 'triangular',
      depth: h,
      sideSlope: m,
      totalDepth: H,
      slope: S,
      roughness: n
    });

    return {
      width: 0,
      depth: parseFloat(h.toFixed(2)),
      totalDepth: parseFloat(H.toFixed(2)),
      topWidth: parseFloat(topW.toFixed(2)),
      sideSlope: m,
      capacity: parseFloat(res.discharge.toFixed(3)),
      velocity: parseFloat(res.velocity.toFixed(2)),
      froudeNumber: parseFloat(res.froudeNumber.toFixed(2)),
      freeboard: parseFloat(fb.toFixed(2)),
      isOptimal: m === 1.0,
      notes: m === 1.0 ? 'Penampang Segitiga Terbaik (Kemiringan 1:1, sudut 90°)' : `Segitiga rasio m = ${m}`
    };
  }

  if (shape === 'circular') {
    // Pipa Lingkaran Kapasitas Aliran Penuh (h = 0.938 D untuk debit maksimum)
    // Untuk desain aman saluran tertutup drainase, gunakan h = 0.8 D
    // Menggunakan bisection untuk mencari D
    let dLow = 0.1;
    let dHigh = 10.0;
    for (let i = 0; i < 30; i++) {
      const dMid = (dLow + dHigh) / 2;
      const testH = 0.8 * dMid;
      const res = calculateChannelHydraulics({
        shape: 'circular',
        diameter: dMid,
        depth: testH,
        slope: S,
        roughness: n
      });
      if (res.discharge < Q) dLow = dMid;
      else dHigh = dMid;
    }

    const D = (dLow + dHigh) / 2;
    const h = 0.8 * D;
    const res = calculateChannelHydraulics({
      shape: 'circular',
      diameter: D,
      depth: h,
      slope: S,
      roughness: n
    });

    return {
      width: parseFloat(D.toFixed(2)),
      depth: parseFloat(h.toFixed(2)),
      totalDepth: parseFloat(D.toFixed(2)),
      topWidth: parseFloat((D * Math.sin(Math.acos(1 - 2 * 0.8))).toFixed(2)),
      sideSlope: 0,
      diameter: parseFloat(D.toFixed(2)),
      capacity: parseFloat(res.discharge.toFixed(3)),
      velocity: parseFloat(res.velocity.toFixed(2)),
      froudeNumber: parseFloat(res.froudeNumber.toFixed(2)),
      freeboard: parseFloat((D - h).toFixed(2)),
      isOptimal: true,
      notes: 'Pipa Lingkaran Desain Aman (Kedalaman 80% D)'
    };
  }

  // TRAPEZOID (Standar Penampang Hidrolis Terbaik Trapesium)
  // b = 2 * h * (sqrt(1 + m²) - m), R = h / 2
  const m = sideSlope > 0 ? sideSlope : (1 / Math.sqrt(3)); // default m = 0.577 (60° heksagonal terbaik)
  const bRatio = 2 * (Math.sqrt(1 + m * m) - m); // rasio b/h optimum

  // Iterasi Bisection untuk mencari h
  let hLow = 0.05;
  let hHigh = 10.0;
  for (let i = 0; i < 35; i++) {
    const hMid = (hLow + hHigh) / 2;
    const bMid = bRatio * hMid;
    const res = calculateChannelHydraulics({
      shape: 'trapezoid',
      width: bMid,
      depth: hMid,
      sideSlope: m,
      slope: S,
      roughness: n
    });
    if (res.discharge < Q) hLow = hMid;
    else hHigh = hMid;
  }

  const optH = (hLow + hHigh) / 2;
  const optB = bRatio * optH;
  const fb = Math.max(0.3, Math.sqrt(0.5 * optH));
  const totalH = optH + fb;
  const topW = optB + 2 * m * optH;

  const res = calculateChannelHydraulics({
    shape: 'trapezoid',
    width: optB,
    depth: optH,
    sideSlope: m,
    totalDepth: totalH,
    slope: S,
    roughness: n
  });

  return {
    width: parseFloat(optB.toFixed(2)),
    depth: parseFloat(optH.toFixed(2)),
    totalDepth: parseFloat(totalH.toFixed(2)),
    topWidth: parseFloat(topW.toFixed(2)),
    sideSlope: parseFloat(m.toFixed(3)),
    capacity: parseFloat(res.discharge.toFixed(3)),
    velocity: parseFloat(res.velocity.toFixed(2)),
    froudeNumber: parseFloat(res.froudeNumber.toFixed(2)),
    freeboard: parseFloat(fb.toFixed(2)),
    isOptimal: true,
    notes: `Penampang Trapesium Terbaik (b/h = ${bRatio.toFixed(2)}, R = h/2)`
  };
}
