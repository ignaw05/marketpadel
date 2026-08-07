# Propuesta: cuatro mejoras de performance

## Contexto

Un test de stress contra `paletita.vercel.app` (10.000 paletas sembradas y
borradas, concurrencia hasta 50, 3.925 requests, 0% de errores) dejó dos
conclusiones medidas:

1. **La lentitud de hoy es costo fijo, no volumen.** Con 3 paletas el home
   tarda ~330 ms y el piso de red (un asset del CDN) es ~170 ms: hay ~200 ms de
   servidor sin que ninguna query esté trabajando.
2. **Lo que no escala es el tamaño del resultado.** Con 10k paletas, `filtros`
   y `detalle` no se movieron ni un milisegundo; `home` y `busqueda` se
   degradaron 152% y 403%.

La paginación (ya implementada, 24 por página) atacó el punto 2. Esta propuesta
ataca el punto 1.

**El número que lo resume**: hay **13 llamadas a `getUser()`** en el código, y
cada una es un round-trip a Supabase Auth. Las rutas acumulan: `/editar/[id]`
paga cuatro (middleware, layout, page, `obtenerMiPaleta`) antes de renderizar
nada.

### Mediciones de referencia

| | 3 paletas | 10.000 |
|---|---|---|
| home p50 @ conc 50 | 327 ms | 823 ms |
| busqueda p50 @ conc 50 | 284 ms | 1.428 ms |
| filtros p50 @ conc 50 | 294 ms | 297 ms |
| HTML del home | 62 KB | 462 KB |

Detalle completo en `scratchpad/mediciones.md` de la sesión del test.

### Decisiones tomadas

- `getClaims()` en lectura y routing; las 6 server actions que escriben siguen
  con `getUser()`.
- La migración `0006` se recorta a lo que el test demostró.
- Catálogos cacheados 5 minutos, con invalidación inmediata al publicar.

## Alcance

### Incluido

1. Recortar la migración `0006` a lo medido.
2. `ciudades_activas()`: mover el `distinct` a Postgres.
3. Cachear los catálogos de marcas y ciudades.
4. Un solo chequeo de sesión por request.

### Excluido

- Cachear el feed. Las combinaciones de filtros son demasiadas y el resultado
  cambia con cada publicación.
- `cacheComponents` / `use cache` de Next 16: vuelve estática toda la app por
  defecto y obliga a envolver en `<Suspense>`. Es un cambio de arquitectura
  para conseguir lo mismo que `unstable_cache`.
- El RPC de visitas (`contar-visita.tsx`). No se midió bajo carga.

---

## 1. Recortar la migración `0006`

**Primero verificar si ya está aplicada**:

```sql
select 1 from information_schema.columns
 where table_name = 'paletas' and column_name = 'promocionada_hasta';
```

Si lo está, esto va como `0007` en vez de editarse en el lugar.

De `supabase/migrations/0006_performance.sql`:

- **Se queda** `pg_trgm` + los índices GIN trigram en `paletas.modelo` y
  `marcas.nombre`, y el `drop` de `paletas_modelo_idx`. Evidencia: la búsqueda
  se degradó 403% y el RPS cayó 4,6x. El índice tsvector viejo nunca se usó
  (tsvector matchea palabras completas, no infijos, y `ilike` ni siquiera es el
  operador `@@`).
- **Se queda** `promocionada_hasta` + trigger + backfill + la vista. Es
  estructural: el `exists()` correlacionado se evalúa una vez por paleta activa
  antes de ordenar y recortar.
- **Se van** los 6 índices parciales de `provincia`, `ciudad`, `precio`,
  `marca_id`, `created_at`, `vence_at`, y el `drop index paletas_feed_idx`. El
  escenario `filtros` no se movió con 10k (294 → 297 ms): cuestan escrituras
  más lentas para un beneficio no demostrado.

Los bloques `do $checks$` se quedan enteros, incluido el que verifica que no se
perdió el filtro `vence_at` que trajo `0005_vencimiento.sql`.

## 2. `ciudades_activas()`: el `distinct` en Postgres

En la misma migración. Hoy `listarCiudades` (`lib/paletas-db.ts:154`) se trae
**500 filas** para deduplicarlas en JS; con 10k eran 13 KB por carga del home.

```sql
create function ciudades_activas() returns setof text
language sql stable as $$
  select distinct ciudad from paletas_publicas;
$$;
```

`stable` y sin `security definer`: la vista ya tiene `security_invoker = on`,
así que respeta RLS igual que la query actual.

El orden es-AR se sigue haciendo en JS con `localeCompare`, como hoy: son ~20
strings y la collation de Postgres no ordena los acentos igual.

Sin índice para esto: con el cache del punto 3 la función corre una vez cada
5 minutos, no una vez por request.

## 3. Cachear marcas y ciudades

`listarMarcas` y `listarCiudades` devuelven **exactamente lo mismo para todos
los usuarios** y se recalculan en cada carga del home.

**Nuevo `lib/supabase/publico.ts`**: cliente anon sin cookies. Es un requisito
técnico, no un gusto: dentro de `unstable_cache` no se puede llamar a
`cookies()`, y estos catálogos no necesitan sesión (RLS los deja leer a `anon`
vía `marcas_lectura using (true)`). Sigue el patrón de `lib/supabase/admin.ts`.

En `lib/paletas-db.ts`, envolver ambas:

```ts
unstable_cache(fn, ["catalogo-marcas"], { revalidate: 300, tags: ["catalogos"] })
```

Y `revalidateTag("catalogos")` en `app/(main)/publicar/actions.ts` y
`app/(main)/editar/[id]/actions.ts`, al lado de los `revalidatePath` que ya
existen. Publicar en una ciudad nueva la muestra en el filtro al instante;
cualquier otro camino se corrige solo en 5 minutos.

## 4. Un solo chequeo de sesión

La parte más delicada y la de mayor impacto: se paga en **todas** las rutas.

**a. `lib/auth.ts` nuevo** — una función deduplicada por request:

```ts
export const usuarioActual = cache(async () => { ... })
```

`cache()` de React deduplica dentro del mismo render pass, así que layout y
page dejan de pedir lo mismo dos veces.

Usa `getClaims()`, que con las claves ES256 de este proyecto (verificado:
`.well-known/jwks.json` publica una clave `ES256`) valida la firma **local** en
vez de preguntarle al servidor, y **mantiene el refresh** del token porque
internamente pasa por `getSession()` (verificado en `auth-js/GoTrueClient.js`).

Devuelve `{ id, nombre, apellido } | null` para no tocar los call sites, que
hoy usan `user.id`. El id sale de `claims.sub`.

**b. Reemplazar `getUser()` por `usuarioActual()`** en las lecturas:
`app/(main)/layout.tsx`, `paletas/[id]/page.tsx`, `cuenta/page.tsx`,
`publicar/page.tsx`, `editar/[id]/page.tsx`, y `lib/paletas-db.ts` líneas 107 y
138.

**c. `proxy.ts:28`** pasa a `getClaims()`. El comentario "Refresca el token
vencido y lo escribe en la respuesta. No sacar." sigue valiendo, y el
comportamiento se mantiene.

**d. Las 6 server actions no se tocan.** `publicar`, `editar`, las de
`mis-publicaciones` y las dos de `cuenta` siguen con `getUser()`, que valida
contra el servidor. Un usuario borrado o baneado puede ver UI hasta que venza
su token (~1h), pero no puede escribir nada, y RLS es la defensa real de todos
modos.

**e. El nombre del header, sin query extra.** `app/(main)/layout.tsx` hace hoy
un `getUser()` **y** una query a `perfiles` solo para el saludo. El JWT ya trae
`user_metadata` con `nombre` y `apellido` (los pone el trigger
`perfil_al_registrarse`), así que `usuarioActual()` los saca de los claims y la
query desaparece. **Con fallback**: si los claims no los traen (usuarios
viejos), se consulta `perfiles` como hoy.

Costo: si alguien cambia su nombre en `/cuenta`, el header muestra el viejo
hasta que refresque el token. Es un saludo, no un dato de negocio.

## Archivos

| Archivo | Qué |
|---|---|
| `supabase/migrations/0006_performance.sql` | recortar + agregar `ciudades_activas()` |
| `lib/auth.ts` | nuevo: `usuarioActual()` y `usuarioDeClaims()` |
| `lib/supabase/publico.ts` | nuevo: cliente anon sin cookies |
| `lib/paletas-db.ts` | `unstable_cache` en los catálogos, RPC de ciudades, `usuarioActual` |
| `proxy.ts`, `app/(main)/layout.tsx`, 4 `page.tsx` | `getClaims` / `usuarioActual` |
| `app/(main)/publicar/actions.ts`, `editar/[id]/actions.ts` | `revalidateTag("catalogos")` |
| `lib/auth.test.ts` | nuevo |

## Verificación

**Tests.** `usuarioDeClaims()` se escribe como función pura (claims → usuario o
null) justamente para poder testearla sin red: claims completos, claims sin
`user_metadata` (debe disparar el fallback), claims vacíos, `sub` ausente.
Después `npm test`, `npx tsc --noEmit` y `npm run build`.

**Contar round-trips, que es la métrica real de esta propuesta.** Con el server
local (`next start`) y un log temporal en `lib/supabase/publico.ts` y
`server.ts`, verificar que una carga del home de un usuario logueado pasa de ~4
requests a Supabase a 1 o 0. Es más honesto que mirar el TTFB, que tiene mucho
ruido de red.

**Medir.** `node scripts/carga.mjs --presupuesto-req 2600 --presupuesto-mb 200`
contra la URL desplegada, y comparar con el baseline (home p50 328 ms con 3
paletas). Ojo: el runner mide anónimo, y el grueso de la mejora de auth es para
usuarios logueados; el home anónimo debería mejorar sobre todo por el cache de
catálogos.

**Manual.** Login, ver el nombre en el header, publicar en una ciudad nueva y
confirmar que aparece en el filtro al instante. Cerrar sesión y confirmar que
`/publicar` redirige a `/auth`.

**Verificar que la sesión sobrevive.** El riesgo real de tocar `proxy.ts` es
romper el refresh del token. Dejar una sesión abierta más de una hora (el TTL
del access token) y confirmar que sigue logueado.

## Pendiente, fuera de esta propuesta

- **Sin `EXPLAIN`**: el host directo de Supabase solo resuelve por IPv6 y la red
  no lo alcanza; el pooler IPv4 rechaza la contraseña del `.env.local` (tiene un
  `@` de más: `...pass@@db.`). Sin planes de ejecución, el impacto real de
  `promocionada_hasta` queda estimado, no medido.
- **Bug ajeno a performance**: `OTROS_FILTROS` en `components/header.tsx:9` no
  incluye `provincia`, así que buscar borra ese filtro y conserva los otros.
