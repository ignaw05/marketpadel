// Check end-to-end contra el proyecto real. Crea 2 usuarios de prueba, publica,
// lee el feed y el detalle, prueba RLS, y borra todo al final.
import { createClient } from "@supabase/supabase-js";
import assert from "node:assert/strict";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;

const admin = createClient(URL, SERVICE, { auth: { persistSession: false } });

const VISTA =
  "id, vendedor_id, marca, modelo, forma, anio, estado, precio, provincia, ciudad, descripcion, fotos, visitas, promocionada";

const sufijo = Date.now();
const creados = [];

// Se crea con el admin API para no pegarle al rate limit de mails del proyecto.
// Dispara el mismo trigger on-insert de auth.users que un signUp normal.
async function nuevoUsuario(nombre) {
  const email = `check-${nombre}-${sufijo}@example.com`;
  const password = "unaClaveLarga123";

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { nombre, apellido: "Test", whatsapp: "+5491155555555" },
  });
  if (error) throw new Error(`createUser ${nombre}: ${error.message}`);
  creados.push(data.user.id);

  const c = createClient(URL, ANON, { auth: { persistSession: false } });
  const { error: eLogin } = await c.auth.signInWithPassword({ email, password });
  if (eLogin) throw new Error(`login ${nombre}: ${eLogin.message}`);

  return { cliente: c, uid: data.user.id };
}

async function limpiar() {
  for (const id of creados) await admin.auth.admin.deleteUser(id);
}

const paso = (n) => console.log(`  ok  ${n}`);

try {
  // 1. signup + trigger de perfiles
  const a = await nuevoUsuario("Ana");
  const b = await nuevoUsuario("Beto");
  paso("createUser + signInWithPassword devuelven sesion");

  const { data: perfil } = await a.cliente
    .from("perfiles")
    .select("nombre, apellido, whatsapp, created_at")
    .eq("id", a.uid)
    .single();
  assert.equal(perfil.nombre, "Ana");
  assert.equal(perfil.whatsapp, "+5491155555555");
  paso("el trigger creo el perfil con nombre y whatsapp");

  // 2. storage: la policy exige carpeta = uid
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
    "base64",
  );
  const ruta = `${a.uid}/check-${sufijo}.png`;
  const { error: eUp } = await a.cliente.storage
    .from("paletas")
    .upload(ruta, png, { contentType: "image/png" });
  assert.equal(eUp, null, `upload propio: ${eUp?.message}`);
  paso("subida al bucket bajo la carpeta propia");

  const { error: eAjeno } = await b.cliente.storage
    .from("paletas")
    .upload(`${a.uid}/intruso-${sufijo}.png`, png, { contentType: "image/png" });
  assert.ok(eAjeno, "otro usuario no deberia poder subir a la carpeta ajena");
  paso("RLS de storage bloquea subir a la carpeta de otro");

  const publicUrl = a.cliente.storage.from("paletas").getPublicUrl(ruta).data.publicUrl;
  assert.ok(publicUrl.includes("/storage/v1/object/public/paletas/"), publicUrl);
  assert.equal((await fetch(publicUrl)).status, 200);
  paso("la URL publica de la foto resuelve");

  // 3. insert como en el server action de publicar
  const { data: marca } = await a.cliente
    .from("marcas")
    .select("id, nombre")
    .eq("nombre", "Bullpadel")
    .single();

  const { data: creada, error: eIns } = await a.cliente
    .from("paletas")
    .insert({
      vendedor_id: a.uid,
      marca_id: marca.id,
      modelo: `Check ${sufijo}`,
      forma: "Lágrima",
      anio: 2026,
      estado: 9,
      precio: 275000,
      provincia: "Mendoza",
      ciudad: "Mendoza",
      descripcion: "publicacion de prueba del check",
      fotos: [publicUrl],
    })
    .select("id")
    .single();
  assert.equal(eIns, null, `insert: ${eIns?.message}`);
  paso("insert de paleta con las columnas del server action");

  // 4. el feed, con la lista exacta de columnas de listarPaletas
  const { data: feed, error: eFeed } = await a.cliente
    .from("paletas_publicas")
    .select(VISTA)
    .eq("id", creada.id)
    .single();
  assert.equal(eFeed, null, `feed: ${eFeed?.message}`);
  assert.equal(feed.marca, "Bullpadel", "la vista resuelve el nombre de la marca");
  assert.equal(feed.promocionada, false);
  assert.deepEqual(feed.fotos, [publicUrl]);
  paso("paletas_publicas devuelve todas las columnas que pide listarPaletas");

  // 5. filtros de listarPaletas
  const { data: filtrado } = await a.cliente
    .from("paletas_publicas")
    .select(VISTA)
    .or(`modelo.ilike.%${sufijo}%,marca.ilike.%${sufijo}%`)
    .eq("forma", "Lágrima")
    .gte("precio", 200000)
    .lte("precio", 350000)
    .gte("estado", 9);
  assert.equal(filtrado.length, 1, "busqueda + filtros combinados");
  paso("busqueda .or() + filtros de marca/forma/precio/estado");

  // 6. el embed de vendedor que usa obtenerPaleta
  const { data: detalle, error: eDet } = await a.cliente
    .from("paletas_publicas")
    .select(`${VISTA}, perfiles!vendedor_id (nombre, apellido, whatsapp, created_at)`)
    .eq("id", creada.id)
    .maybeSingle();
  assert.equal(eDet, null, `embed: ${eDet?.message}`);
  assert.equal(detalle.perfiles.nombre, "Ana");
  assert.equal(detalle.perfiles.whatsapp, "+5491155555555");
  paso("el embed perfiles!vendedor_id trae al vendedor");

  // 7. id que no es uuid -> 22P02, tratado como 404
  const { error: eUuid } = await a.cliente
    .from("paletas_publicas")
    .select(VISTA)
    .eq("id", "no-es-uuid")
    .maybeSingle();
  assert.equal(eUuid?.code, "22P02", `codigo para id invalido: ${eUuid?.code}`);
  paso("un id no-uuid da 22P02 (la app lo trata como 404)");

  // 8. RPC de visitas, llamada anonima como en ContarVisita
  const anon = createClient(URL, ANON, { auth: { persistSession: false } });
  const { error: eRpc } = await anon.rpc("incrementar_visitas", { p_paleta_id: creada.id });
  assert.equal(eRpc, null, `rpc: ${eRpc?.message}`);
  const { data: conVisita } = await anon
    .from("paletas_publicas")
    .select("visitas")
    .eq("id", creada.id)
    .single();
  assert.equal(conVisita.visitas, 1);
  paso("incrementar_visitas suma desde un cliente anonimo");

  // 9. RLS: otro usuario no puede tocar la publicacion
  const { data: tocada } = await b.cliente
    .from("paletas")
    .update({ precio: 1 })
    .eq("id", creada.id)
    .select("id");
  assert.equal(tocada.length, 0, "otro usuario no deberia poder editar");
  paso("RLS bloquea editar la paleta de otro");

  // 10. promocionar (accion promocionar, origen 'cortesia' hasta que entre MP)
  const hasta = new Date(Date.now() + 15 * 86_400_000).toISOString();

  const { error: ePromoAjena } = await b.cliente
    .from("promociones")
    .insert({ paleta_id: creada.id, origen: "cortesia", hasta });
  assert.ok(ePromoAjena, "otro usuario no deberia poder promocionar tu paleta");
  paso("RLS bloquea promocionar la paleta de otro");

  const { error: ePromo } = await a.cliente
    .from("promociones")
    .insert({ paleta_id: creada.id, origen: "cortesia", hasta });
  assert.equal(ePromo, null, `promocionar: ${ePromo?.message}`);

  const { data: destacada } = await anon
    .from("paletas_publicas")
    .select("promocionada")
    .eq("id", creada.id)
    .single();
  assert.equal(destacada.promocionada, true, "la vista tendria que verla promocionada");
  paso("promocionar la propia la marca como destacada en el feed");

  // 11. pausar la saca del feed publico (accion cambiarEstado)
  await a.cliente
    .from("paletas")
    .update({ estado_publicacion: "pausada" })
    .eq("id", creada.id)
    .eq("vendedor_id", a.uid);
  const { data: pausada } = await anon
    .from("paletas_publicas")
    .select("id")
    .eq("id", creada.id)
    .maybeSingle();
  assert.equal(pausada, null, "una pausada no deberia aparecer en el feed");
  paso("pausar saca la publicacion del feed publico");

  // 12. pero sigue en "mis publicaciones" (listarMisPaletas)
  const { data: mias, error: eMias } = await a.cliente
    .from("paletas")
    .select(
      "id, vendedor_id, modelo, forma, anio, estado, precio, provincia, ciudad, descripcion, fotos, visitas, estado_publicacion, marcas (nombre), promociones (hasta)",
    )
    .eq("vendedor_id", a.uid)
    .neq("estado_publicacion", "eliminada");
  assert.equal(eMias, null, `mis paletas: ${eMias?.message}`);
  assert.equal(mias.length, 1);
  assert.equal(mias[0].marcas.nombre, "Bullpadel");
  assert.equal(mias[0].estado_publicacion, "pausada");
  assert.equal(mias[0].promociones.length, 1, "el embed de promociones para el badge");
  paso("listarMisPaletas ve la pausada, la marca y su promocion");

  // 13. borrar la paleta y su foto (accion eliminar)
  await a.cliente.from("paletas").delete().eq("id", creada.id).eq("vendedor_id", a.uid);
  const rutaDerivada = publicUrl.split("/paletas/").pop();
  assert.equal(rutaDerivada, ruta, "la ruta que deriva la accion eliminar");

  const { data: borradas, error: eRm } = await a.cliente.storage
    .from("paletas")
    .remove([rutaDerivada]);
  assert.equal(eRm, null, `remove: ${eRm?.message}`);
  assert.equal(borradas.length, 1, "remove tendria que reportar 1 objeto borrado");

  // Contra la API, no contra la URL publica: el CDN puede seguir cacheando.
  const { data: quedan } = await a.cliente.storage.from("paletas").list(a.uid);
  assert.equal(quedan.length, 0, "no tendrian que quedar fotos del usuario");
  paso("eliminar borra la fila y su foto del bucket");

  console.log("\nTODO OK");
} catch (err) {
  console.error("\nFALLO:", err.message);
  process.exitCode = 1;
} finally {
  await limpiar();
  console.log("usuarios de prueba borrados");
}
