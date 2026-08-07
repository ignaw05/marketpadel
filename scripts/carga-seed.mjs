// Siembra/borra datos sinteticos para el test de carga, via API REST.
//
//   node --env-file=.env.local scripts/carga-seed.mjs sembrar
//   node --env-file=.env.local scripts/carga-seed.mjs borrar
//
// Es el plan B de supabase/carga-seed.sql: ese archivo hace lo mismo mejor
// (y ademas puede correr ANALYZE), pero necesita psql, y el host directo de
// este proyecto solo resuelve por IPv6. Cuando la conexion psql funcione,
// usar el .sql y borrar este archivo.
//
// ponytail: sin ANALYZE. PostgREST no lo expone, asi que las estadisticas
// del planner quedan a merced del autovacuum. Para medir por HTTP alcanza;
// para leer un EXPLAIN honesto, no.

const U = process.env.NEXT_PUBLIC_SUPABASE_URL;
const S = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!U || !S) throw new Error("faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY");

const SEMILLA = "00000000-0000-0000-0000-00000000ca11";
const EMAIL = "carga@test.local";
const TOTAL = 10000;
const LOTE = 1000;

const h = {
  apikey: S,
  Authorization: `Bearer ${S}`,
  "Content-Type": "application/json",
};

async function api(path, init = {}) {
  const res = await fetch(U + path, { ...init, headers: { ...h, ...init.headers } });
  const txt = await res.text();
  if (!res.ok) throw new Error(`${init.method ?? "GET"} ${path} -> ${res.status} ${txt.slice(0, 300)}`);
  return txt ? JSON.parse(txt) : null;
}

// Una sola foto por paleta, rotando entre EXACTAMENTE 3 que ya existen en
// public/paletas/. Cada url distinta consume una transformacion del
// optimizador de Vercel (free tier ~5000/mes): 3 compartidas entre 10.000
// filas son despreciables, una por fila seria una factura.
const FOTOS = [
  "/paletas/p0-babolat-air-veron-2023.webp",
  "/paletas/p1-adidas-metalbone-pro-edt-2026.webp",
  "/paletas/p2-adidas-metalbone-reserve-edt-2026.webp",
];
const MODELOS = ["Nox AT10", "Bullpadel Vertex", "Adidas Metalbone", "Babolat Technical Viper",
  "Head Extreme", "Siux Electra", "StarVie Metheora", "Varlion Lethal Zone",
  "Vibor-A King", "Wilson Bela"];
const FORMAS = ["Diamante", "Lágrima", "Redonda"];
const LUGARES = [["CABA", "CABA"], ["Buenos Aires", "La Plata"], ["Buenos Aires", "Mar del Plata"],
  ["Córdoba", "Córdoba"], ["Santa Fe", "Rosario"], ["Mendoza", "Mendoza"],
  ["Tucumán", "San Miguel de Tucumán"], ["Neuquén", "Neuquén"]];

async function sembrar() {
  const marcas = await api("/rest/v1/marcas?select=id&activa=eq.true");
  const ids = marcas.map((m) => m.id);
  console.log(`${ids.length} marcas activas`);

  const previas = await contar();
  console.log(`paletas activas antes de sembrar: ${previas}`);

  await fetch(`${U}/auth/v1/admin/users`, {
    method: "POST",
    headers: h,
    body: JSON.stringify({
      id: SEMILLA,
      email: EMAIL,
      password: "unaClaveLargaDeCarga123",
      email_confirm: true,
      user_metadata: { nombre: "Carga", apellido: "Test" },
    }),
  }).then(async (r) => {
    if (!r.ok && r.status !== 422) throw new Error(`crear usuario: ${r.status} ${await r.text()}`);
    console.log(r.ok ? "usuario semilla creado" : "usuario semilla ya existia");
  });

  const ahora = Date.now();
  for (let base = 0; base < TOTAL; base += LOTE) {
    const filas = Array.from({ length: LOTE }, (_, k) => {
      const i = base + k;
      const [provincia, ciudad] = LUGARES[i % 8];
      return {
        vendedor_id: SEMILLA,
        marca_id: ids[i % ids.length],
        modelo: `${MODELOS[i % 10]} ${i}`,
        forma: FORMAS[i % 3],
        anio: 2019 + (i % 8),
        estado: 6 + (i % 5),
        precio: 30000 + (i % 771) * 1000,
        provincia,
        ciudad,
        descripcion: "Paleta en buen estado, poco uso. Ideal para el club.",
        fotos: [FOTOS[i % 3]],
        estado_publicacion: "activa",
        created_at: new Date(ahora - (i % 180) * 86400000).toISOString(),
      };
    });
    await api("/rest/v1/paletas", {
      method: "POST",
      headers: { Prefer: "return=minimal" }, // no devolver 10k filas: es egress al pedo
      body: JSON.stringify(filas),
    });
    console.log(`  ${base + LOTE}/${TOTAL}`);
  }

  // 5% promocionadas, para que el `order by promocionada` tenga que decidir algo.
  const propias = await api(`/rest/v1/paletas?select=id&vendedor_id=eq.${SEMILLA}&limit=${TOTAL}`);
  const promos = propias.filter((_, i) => i % 20 === 0).map((p) => ({
    paleta_id: p.id,
    origen: "cortesia",
    hasta: new Date(ahora + 30 * 86400000).toISOString(),
  }));
  await api("/rest/v1/promociones", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify(promos),
  });
  console.log(`${promos.length} promociones`);
  console.log(`paletas activas ahora: ${await contar()}`);
}

async function borrar() {
  const res = await fetch(`${U}/auth/v1/admin/users/${SEMILLA}`, { method: "DELETE", headers: h });
  if (!res.ok && res.status !== 404) throw new Error(`borrar usuario: ${res.status} ${await res.text()}`);
  // La cascada (paletas.vendedor_id -> perfiles, promociones.paleta_id ->
  // paletas) se lleva perfil, paletas y promociones sin tocar nada mas.
  console.log(`borrado. paletas activas ahora: ${await contar()}`);
}

async function contar() {
  const res = await fetch(`${U}/rest/v1/paletas_publicas?select=id`, {
    headers: { ...h, Prefer: "count=exact", Range: "0-0" },
  });
  return res.headers.get("content-range")?.split("/")[1] ?? "?";
}

const modo = process.argv[2];
if (modo === "sembrar") await sembrar();
else if (modo === "borrar") await borrar();
else {
  console.error("uso: node --env-file=.env.local scripts/carga-seed.mjs sembrar|borrar");
  process.exit(1);
}
