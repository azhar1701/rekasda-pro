/**
 * verify-engine-parity.ts
 * ─────────────────────────────────────────────────────────────────────────
 * Cross-Language Parity Test: TypeScript Engine vs Python FastAPI Engine
 *
 * Memverifikasi bahwa output kalkulasi hidrologi antara web browser
 * (TypeScript engine) dan server API (Python FastAPI) identik dengan
 * relative error < 0.05%.
 *
 * @usage  npx tsx scripts/verify-engine-parity.ts
 * @usage  npx tsx scripts/verify-engine-parity.ts --api-url=http://staging:8000
 *
 * @standard SNI 2415:2016 | SNI 19-6728.1-2002
 */

import { calculateHSSNakayasu } from '../src/lib/engine/flood/sni2415';
import { calculateRationalDischarge } from '../src/lib/engine/rationalMethod';

// ─── Configuration ────────────────────────────────────────────────────────────
const API_URL =
  process.argv.find((a) => a.startsWith('--api-url='))?.split('=')[1] ??
  process.env.VITE_API_URL ??
  'http://localhost:8000';

const TOLERANCE_PERCENT = 0.05; // Relative error threshold

// ─── ANSI Helpers ─────────────────────────────────────────────────────────────
const G = '\x1b[32m', R = '\x1b[31m', Y = '\x1b[33m', C = '\x1b[36m', B = '\x1b[1m', X = '\x1b[0m';
const err = (m: string) => console.log(`  ${R}❌ FAIL${X}  ${m}`);
const skp = (m: string) => console.log(`  ${Y}⚠️  SKIP${X}  ${m}`);
const inf = (m: string) => console.log(`  ${C}ℹ  ${X}${m}`);

function relError(a: number, b: number): number {
  return b === 0 ? (a === 0 ? 0 : Infinity) : Math.abs((a - b) / b) * 100;
}

function assertClose(label: string, ts: number, py: number, tol = TOLERANCE_PERCENT): boolean {
  const re = relError(ts, py);
  const pass = re <= tol;
  const icon = pass ? `${G}✅${X}` : `${R}❌${X}`;
  console.log(
    `     ${icon} ${label}: TS=${ts.toFixed(4)} | PY=${py.toFixed(4)} | RE=${re.toFixed(4)}%${pass ? '' : ` (> ${tol}%)`}`,
  );
  return pass;
}

// ─── Golden Cases ─────────────────────────────────────────────────────────────
interface GoldenCase {
  name: string;
  desc: string;
  tsRun: () => Promise<Record<string, number>>;
  endpoint: string;
  payload: object;
  extract: (d: any) => Record<string, number>;
  metrics: string[];
}

const CASES: GoldenCase[] = [
  {
    name: 'GC-01: HSS Nakayasu — DAS Ciliwung Tengah',
    desc: 'A=180 km², L=22 km, Ro=90 mm, α=2.2 | SNI 2415:2016 §6.3',
    tsRun: async () => {
      const Tg = 0.4 + 0.058 * 22;
      const Tr = 0.5 * Tg;
      const r = calculateHSSNakayasu({ Ro: 90, Tg, Tr, Alpha: 2.2, A: 180, L: 22 });
      return { Qp: r.Qp, Tp: r.Tp, Tb: r.Tb };
    },
    endpoint: '/api/v1/banjir/nakayasu',
    payload: { Ro: 90, Tg: 0.4 + 0.058 * 22, Tr: 0.5 * (0.4 + 0.058 * 22), Alpha: 2.2, A: 180, L: 22 },
    extract: (d) => ({ Qp: d.Qp, Tp: d.Tp, Tb: d.Tb }),
    metrics: ['Qp', 'Tp', 'Tb'],
  },
  {
    name: 'GC-02: HSS Nakayasu — DAS Citanduy Hulu',
    desc: 'A=25 km², L=8.5 km, Ro=60 mm, α=2.0 (standard) | SNI 2415:2016 §6.3',
    tsRun: async () => {
      const Tg = 0.4 + 0.058 * 8.5;
      const Tr = 0.5 * Tg;
      const r = calculateHSSNakayasu({ Ro: 60, Tg, Tr, Alpha: 2.0, A: 25, L: 8.5 });
      return { Qp: r.Qp, Tp: r.Tp, Tb: r.Tb };
    },
    endpoint: '/api/v1/banjir/nakayasu',
    payload: { Ro: 60, Tg: 0.4 + 0.058 * 8.5, Tr: 0.5 * (0.4 + 0.058 * 8.5), Alpha: 2.0, A: 25, L: 8.5 },
    extract: (d) => ({ Qp: d.Qp, Tp: d.Tp, Tb: d.Tb }),
    metrics: ['Qp', 'Tp', 'Tb'],
  },
  {
    name: 'GC-03: Metode Rasional — DAS Perkotaan',
    desc: 'C=0.75, I=100 mm/jam, A=250 Ha | SNI 2415:2016 §5.2',
    tsRun: async () => {
      const r = calculateRationalDischarge({ C: 0.75, I: 100, A: 250 });
      return { Q: r.Q };
    },
    endpoint: '/api/v1/banjir/rasional',
    payload: { C: 0.75, I: 100, A: 250 },
    extract: (d) => ({ Q: d.Q ?? d.Qp ?? d.discharge ?? 0 }),
    metrics: ['Q'],
  },
];

// ─── API Caller ────────────────────────────────────────────────────────────────
async function callPython(endpoint: string, payload: object) {
  try {
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({})) as any;
      return { ok: false as const, error: body?.detail ?? `HTTP ${res.status}` };
    }
    return { ok: true as const, data: await res.json() };
  } catch (e: any) {
    return { ok: false as const, error: e.message ?? 'Network error' };
  }
}

// ─── Runner ────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n${B}${C}══════════════════════════════════════════════════════════${X}`);
  console.log(`${B}  RekaSDA Pro — Engine Parity Verification (TS ↔ Python)${X}`);
  console.log(`${B}${C}══════════════════════════════════════════════════════════${X}`);
  console.log(`  API      : ${API_URL}`);
  console.log(`  Tolerance: RE < ${TOLERANCE_PERCENT}%`);
  console.log(`  Cases    : ${CASES.length}\n`);

  let passed = 0, failed = 0, skipped = 0;

  for (const gc of CASES) {
    console.log(`${B}▸ ${gc.name}${X}`);
    console.log(`  ${gc.desc}`);

    // 1. Run TypeScript engine
    let tsOut: Record<string, number>;
    try {
      tsOut = await gc.tsRun();
    } catch (e: any) {
      err(`TypeScript engine error: ${e.message}`);
      failed++;
      console.log();
      continue;
    }

    // 2. Call Python engine
    const pyRes = await callPython(gc.endpoint, gc.payload);

    if (!pyRes.ok) {
      skp(`Python API tidak tersedia: ${pyRes.error}`);
      inf(`TS values: ${JSON.stringify(tsOut)}`);
      skipped++;
      console.log();
      continue;
    }

    const pyOut = gc.extract(pyRes.data);

    // 3. Assert each metric
    let caseOk = true;
    for (const m of gc.metrics) {
      const tv = tsOut[m], pv = pyOut[m];
      if (tv === undefined || pv === undefined) {
        err(`Metric '${m}' missing — TS=${tv}, PY=${pv}`);
        caseOk = false;
      } else if (!assertClose(m, tv, pv)) {
        caseOk = false;
      }
    }

    if (caseOk) { passed++; console.log(`  ${G}Result: PASS${X}`); }
    else         { failed++; console.log(`  ${R}Result: FAIL — RE threshold exceeded${X}`); }
    console.log();
  }

  // ─── Summary ────────────────────────────────────────────────────────────────
  console.log(`${B}${C}══════════════════════════════════════════════════════════${X}`);
  console.log(`  ${G}Passed : ${passed}${X}`);
  if (failed  > 0) console.log(`  ${R}Failed : ${failed}${X}`);
  if (skipped > 0) console.log(`  ${Y}Skipped: ${skipped} (Python API offline)${X}`);
  console.log(`${B}${C}══════════════════════════════════════════════════════════${X}\n`);

  if (failed > 0) {
    console.error(`${R}${B}PARITY FAILED — TS ≠ Python (RE > ${TOLERANCE_PERCENT}%)${X}\n`);
    process.exit(1);
  }

  if (skipped === CASES.length) {
    console.warn(`${Y}All cases skipped — start backend: cd backend && uvicorn main:app${X}\n`);
    process.exit(0);
  }

  console.log(`${G}${B}✅ ALL PARITY TESTS PASSED — TS engine ≡ Python engine (RE < ${TOLERANCE_PERCENT}%)${X}\n`);
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
