// Runner de carga HTTP para medir performance de paletita.vercel.app (Vercel free tier).
// Node 25, ESM, sin dependencias npm. Uso:
//   node scripts/carga.mjs [--url ...] [--presupuesto-req 6000] [--presupuesto-mb 50]
//   node scripts/carga.mjs --self-check

import { parseArgs } from 'node:util';
import assert from 'node:assert/strict';

// Percentil nearest-rank: sobre [1..100] da p50=50, p90=90, p95=95 exacto,
// eso es lo que verifica el self-check.
function percentil(muestras, p) {
  const s = [...muestras].sort((a, b) => a - b);
  const idx = Math.max(0, Math.ceil((p / 100) * s.length) - 1);
  return s[idx];
}

function selfCheck() {
  assert.equal(percentil([42], 50), 42);
  assert.equal(percentil([42], 95), 42);
  const cien = Array.from({ length: 100 }, (_, i) => i + 1);
  assert.equal(percentil(cien, 50), 50);
  assert.equal(percentil(cien, 90), 90);
  assert.equal(percentil(cien, 95), 95);
  const desordenado = [...cien].reverse();
  assert.equal(percentil(desordenado, 50), 50);
  assert.equal(percentil(desordenado, 90), 90);
  console.log('self-check ok');
  process.exit(0);
}

const { values: args } = parseArgs({
  options: {
    url: { type: 'string', default: 'https://paletita.vercel.app' },
    'presupuesto-req': { type: 'string', default: '6000' },
    'presupuesto-mb': { type: 'string', default: '50' },
    'self-check': { type: 'boolean', default: false },
  },
});

if (args['self-check']) selfCheck();

const BASE_URL = args.url;
const PRESUPUESTO_REQ = Number(args['presupuesto-req']);
const PRESUPUESTO_MB = Number(args['presupuesto-mb']);
const PRESUPUESTO_BYTES = PRESUPUESTO_MB * 1024 * 1024;

let totalReq = 0;
let totalBytes = 0; // bytes del body descomprimido (arrayBuffer): el transfer
// facturado real (comprimido) es menor, asi que este contador sobreestima
// a proposito -- es la lectura conservadora que queremos para la guarda.
let abortado = null;

function presupuestoOk() {
  if (totalReq >= PRESUPUESTO_REQ) {
    abortado = `techo de requests alcanzado (${totalReq}/${PRESUPUESTO_REQ})`;
    return false;
  }
  if (totalBytes >= PRESUPUESTO_BYTES) {
    abortado = `techo de MB alcanzado (${(totalBytes / 1024 / 1024).toFixed(1)}/${PRESUPUESTO_MB}MB)`;
    return false;
  }
  return true;
}

async function hacerRequest(path) {
  const t0 = performance.now();
  try {
    const res = await fetch(BASE_URL + path);
    const buf = await res.arrayBuffer();
    totalReq++;
    totalBytes += buf.byteLength;
    return { latencia: performance.now() - t0, status: res.status, vercelId: res.headers.get('x-vercel-id') };
  } catch {
    totalReq++; // igual cuenta como intento contra el presupuesto
    return { latencia: performance.now() - t0, status: 0, vercelId: null };
  }
}

async function correrEscalon(path, concurrencia) {
  const muestras = [];
  const inicio = Date.now();
  const worker = async () => {
    while (true) {
      if (abortado) return;
      if (muestras.length >= 200 || Date.now() - inicio >= 10000) return;
      if (!presupuestoOk()) return;
      muestras.push(await hacerRequest(path));
    }
  };
  await Promise.all(Array.from({ length: concurrencia }, worker));
  return { muestras, duracionMs: Date.now() - inicio };
}

function procesar(nombre, concurrencia, muestras, duracionMs) {
  if (muestras.length === 0) {
    return { escenario: nombre, concurrencia, n: 0, rps: '0.0', p50: 0, p90: 0, p95: 0, errorPct: '0.0' };
  }
  const nWarmup = Math.floor(muestras.length * 0.1);
  const utiles = muestras.slice(nWarmup);
  const latencias = utiles.map((m) => m.latencia);
  const errores = utiles.filter((m) => m.status !== 200).length;
  const rps = muestras.length / (duracionMs / 1000);
  return {
    escenario: nombre,
    concurrencia,
    n: muestras.length, // cuantas muestras entraron en este escalon (con 10s de corte y concurrencia alta puede ser bien menos de 200)
    rps: rps.toFixed(1),
    p50: Math.round(percentil(latencias, 50)),
    p90: Math.round(percentil(latencias, 90)),
    p95: Math.round(percentil(latencias, 95)),
    errorPct: ((errores / utiles.length) * 100).toFixed(1),
  };
}

// Descubrir el escenario "detalle": primer link /paletas/<uuid> en el home.
// Puede haber muy pocos productos activos (a veces 3-5 links) -- alcanza con
// que aparezca uno solo, no se asume ningun volumen minimo.
async function descubrirDetalle() {
  const res = await fetch(BASE_URL + '/');
  const buf = await res.arrayBuffer();
  totalReq++;
  totalBytes += buf.byteLength;
  const html = Buffer.from(buf).toString('utf8');
  const m = html.match(/href="(\/paletas\/[0-9a-fA-F-]{36})"/);
  return m ? m[1] : null;
}

const escenarios = [
  { nombre: 'home', path: '/' },
  { nombre: 'busqueda', path: '/?q=nox' },
  { nombre: 'filtros', path: '/?marca=Nox&provincia=CABA' },
];

console.log(`Descubriendo escenario "detalle" en ${BASE_URL}...`);
const detallePath = await descubrirDetalle();
if (detallePath) {
  escenarios.push({ nombre: 'detalle', path: detallePath });
  console.log(`  encontrado: ${detallePath}`);
} else {
  console.log('  no se encontro ningun /paletas/<uuid> en el home, se saltea el escenario "detalle"');
}

const escalones = [1, 10, 50];
const resultados = [];

afuera: for (const esc of escenarios) {
  for (const conc of escalones) {
    if (!presupuestoOk()) break afuera;
    console.log(`Corriendo "${esc.nombre}" @ concurrencia ${conc}...`);
    const { muestras, duracionMs } = await correrEscalon(esc.path, conc);
    resultados.push(procesar(esc.nombre, conc, muestras, duracionMs));
    if (abortado) break afuera;
    await new Promise((r) => setTimeout(r, 1000)); // pausa entre escalones para no encadenar rafagas
  }
}

console.log('\n=== Resultados ===');
console.table(
  resultados.map((r) => ({
    escenario: r.escenario,
    concurrencia: r.concurrencia,
    n: r.n, // muestras que entraron en el escalon (post-corte por tiempo/limite)
    rps: r.rps,
    'p50(ms)': r.p50,
    'p90(ms)': r.p90,
    // no se reporta p99: con 200 muestras (y a veces bastante menos, ver "n")
    // el percentil 99 no es estadisticamente confiable.
    'p95(ms)': r.p95,
    'error%': r.errorPct,
  })),
);

if (abortado) console.log(`\nCORRIDA ABORTADA: ${abortado}`);

console.log(
  `\nConsumo total: ${totalReq}/${PRESUPUESTO_REQ} requests, ${(totalBytes / 1024 / 1024).toFixed(2)}/${PRESUPUESTO_MB} MB`,
);

// ponytail: la carga sale de una sola laptop y una sola conexion. Si el p95
// sube pero el tiempo de query no se movio, el cuello puede ser local o de
// red, no la app.
