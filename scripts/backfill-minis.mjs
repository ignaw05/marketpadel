// Genera la miniatura -mini.webp de las fotos que se subieron antes de que
// publish-screen empezara a generarlas.
//
//   npm i -D sharp
//   node --env-file=.env.local scripts/backfill-minis.mjs
//   npm un sharp     (cuando ya corrio; es de un solo uso)
//
// Idempotente: saltea las fotos que ya tienen mini, asi que se puede volver a
// correr las veces que haga falta.
//
// ponytail: lee las fotos de la tabla, no del bucket. Solo toca lo que alguna
// pantalla realmente muestra; las huerfanas del bucket no interesan.

import sharp from "sharp";

const U = process.env.NEXT_PUBLIC_SUPABASE_URL;
const S = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!U || !S) throw new Error("faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY");

// Mismo valor que MINI_LADO en lib/paletas.ts.
const MINI_LADO = 400;
const PUBLICO = `${U}/storage/v1/object/public/paletas/`;
const h = { apikey: S, Authorization: `Bearer ${S}` };

const miniatura = (url) => url.replace(/(\.[^./]+)$/, "-mini$1");

const res = await fetch(`${U}/rest/v1/paletas?select=fotos`, { headers: h });
if (!res.ok) throw new Error(`GET paletas -> ${res.status} ${await res.text()}`);
const urls = [...new Set((await res.json()).flatMap((p) => p.fotos ?? []))];

let hechas = 0;
let salteadas = 0;
const fallidas = [];

for (const url of urls) {
  if (!url.startsWith(PUBLICO) || miniatura(url) === url) {
    fallidas.push(`${url} (no es una foto del bucket)`);
    continue;
  }
  const ruta = url.slice(PUBLICO.length);
  const mini = miniatura(url);

  if ((await fetch(mini, { method: "HEAD" })).ok) {
    salteadas++;
    continue;
  }

  try {
    const foto = await fetch(url);
    if (!foto.ok) throw new Error(`bajar -> ${foto.status}`);
    const chica = await sharp(Buffer.from(await foto.arrayBuffer()))
      .rotate()
      .resize({ width: MINI_LADO, height: MINI_LADO, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();

    const subida = await fetch(`${U}/storage/v1/object/paletas/${miniatura(ruta)}`, {
      method: "POST",
      headers: { ...h, "Content-Type": "image/webp" },
      body: chica,
    });
    if (!subida.ok) throw new Error(`subir -> ${subida.status} ${await subida.text()}`);
    hechas++;
    process.stdout.write(`.`);
  } catch (e) {
    fallidas.push(`${ruta}: ${e.message}`);
  }
}

console.log(`\n${hechas} minis nuevas, ${salteadas} ya estaban, ${fallidas.length} con error`);
for (const f of fallidas) console.log(`  ${f}`);
