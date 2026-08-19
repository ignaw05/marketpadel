// Repara las fotos que ya estan en el bucket.
//
//   npm i -D sharp
//   node --env-file=.env.local scripts/backfill-minis.mjs              solo las minis que falten
//   node --env-file=.env.local scripts/backfill-minis.mjs --grandes    ademas achica las grandes
//   node --env-file=.env.local scripts/backfill-minis.mjs --grandes --respaldo ~/fotos-viejas
//   npm un sharp
//
// Sin --grandes solo agrega archivos y no toca nada existente.
//
// Con --grandes REEMPLAZA en el bucket las fotos que superan MAX_LADO. Es lo que
// arregla las que se subieron mientras achicar() no tenia fallback a JPEG y se
// iban crudas, de 4032px y varios MB. La ruta y el formato no cambian, asi que
// las URLs de fotos[] siguen sirviendo. El original se pisa: con --respaldo se
// guarda antes en esa carpeta, y si no se puede escribir ahi la foto no se toca.
//
// Idempotente en los dos modos: se puede volver a correr las veces que haga falta.
//
// ponytail: lee las fotos de la tabla, no del bucket. Solo toca lo que alguna
// pantalla realmente muestra; las huerfanas del bucket no interesan.

import sharp from "sharp";
import { mkdirSync, writeFileSync } from "node:fs";

const U = process.env.NEXT_PUBLIC_SUPABASE_URL;
const S = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!U || !S) throw new Error("faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY");

const GRANDES = process.argv.includes("--grandes");
const RESPALDO = process.argv[process.argv.indexOf("--respaldo") + 1];
if (process.argv.includes("--respaldo") && !RESPALDO) throw new Error("--respaldo necesita una carpeta");
if (RESPALDO) mkdirSync(RESPALDO, { recursive: true });

// Mismos valores que MAX_LADO y MINI_LADO en lib/paletas.ts.
const MAX_LADO = 1600;
const MINI_LADO = 400;
const PUBLICO = `${U}/storage/v1/object/public/paletas/`;
const h = { apikey: S, Authorization: `Bearer ${S}` };

const miniatura = (url) => url.replace(/(\.[^./]+)$/, "-mini$1");

/** El formato de salida lo manda la extension, para que la URL no mienta. */
const FORMATOS = { webp: "image/webp", jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png" };
const formato = (ruta) => FORMATOS[ruta.split(".").pop()?.toLowerCase()];

async function encodar(buf, lado, tipo) {
  const img = sharp(buf)
    .rotate()
    .resize({ width: lado, height: lado, fit: "inside", withoutEnlargement: true });
  if (tipo === "image/webp") return img.webp({ quality: 82 }).toBuffer();
  if (tipo === "image/png") return img.png({ compressionLevel: 9 }).toBuffer();
  return img.jpeg({ quality: 82, mozjpeg: true }).toBuffer();
}

async function subir(ruta, buf, tipo, reemplazar) {
  const res = await fetch(`${U}/storage/v1/object/paletas/${ruta}`, {
    method: "POST",
    headers: { ...h, "Content-Type": tipo, ...(reemplazar && { "x-upsert": "true" }) },
    body: buf,
  });
  if (!res.ok) throw new Error(`subir ${ruta} -> ${res.status} ${await res.text()}`);
}

const res = await fetch(`${U}/rest/v1/paletas?select=fotos`, { headers: h });
if (!res.ok) throw new Error(`GET paletas -> ${res.status} ${await res.text()}`);
const urls = [...new Set((await res.json()).flatMap((p) => p.fotos ?? []))];

let minis = 0;
let achicadas = 0;
let ahorro = 0;
let intactas = 0;
const fallidas = [];

for (const url of urls) {
  if (!url.startsWith(PUBLICO) || miniatura(url) === url) {
    fallidas.push(`${url} (no es una foto del bucket)`);
    continue;
  }
  const ruta = url.slice(PUBLICO.length);
  const tipo = formato(ruta);
  if (!tipo) {
    fallidas.push(`${ruta} (extension desconocida)`);
    continue;
  }

  try {
    const faltaMini = !(await fetch(miniatura(url), { method: "HEAD" })).ok;
    if (!faltaMini && !GRANDES) {
      intactas++;
      continue;
    }

    const foto = await fetch(url);
    if (!foto.ok) throw new Error(`bajar -> ${foto.status}`);
    const buf = Buffer.from(await foto.arrayBuffer());

    if (faltaMini) {
      await subir(miniatura(ruta), await encodar(buf, MINI_LADO, tipo), tipo, false);
      minis++;
    }

    if (GRANDES) {
      const { width, height } = await sharp(buf).metadata();
      if (Math.max(width, height) > MAX_LADO) {
        const chica = await encodar(buf, MAX_LADO, tipo);
        // Primero el respaldo: si no se puede escribir, tira y la foto queda intacta.
        if (RESPALDO) writeFileSync(`${RESPALDO}/${ruta.replaceAll("/", "_")}`, buf);
        await subir(ruta, chica, tipo, true);
        achicadas++;
        ahorro += buf.length - chica.length;
      }
    }
    process.stdout.write(".");
  } catch (e) {
    fallidas.push(`${ruta}: ${e.message}`);
  }
}

const mb = (b) => (b / 1048576).toFixed(1);
console.log(`\n${urls.length} fotos: ${minis} minis nuevas, ${intactas} ya estaban al dia`);
if (GRANDES) console.log(`${achicadas} grandes achicadas, ${mb(ahorro)} MB liberados`);
if (RESPALDO) console.log(`originales guardados en ${RESPALDO}`);
console.log(`${fallidas.length} con error`);
for (const f of fallidas) console.log(`  ${f}`);
