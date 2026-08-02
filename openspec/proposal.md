# Propuesta: Migrar UIpadel a Next.js App Router

## Contexto
UIpadel es un prototipo funcional de marketplace de paletas de pádel. Está construido con React 18 + Vite + TypeScript + Tailwind CSS v4 + React Router. Contiene 5 pantallas completas, 40+ componentes UI estilo shadcn, y un tema visual definido.

El objetivo es migrar todo este frontend a **Next.js 15 App Router**, manteniendo la UI tal cual y preparando la estructura para futura integración con Supabase.

## Alcance

### Incluido
- Las 5 pantallas: Auth, Home, Detail, Publish, My Listings
- Todos los componentes UI shadcn existentes (40+ primitivas)
- Tema visual, colores, tipografía, espaciado
- Animaciones (Framer Motion) e interacciones
- Estados de loading, empty, error en cada vista
- Responsive mobile-first existente

### Excluido (para trabajo futuro)
- Autenticación real (se mantiene mock por ahora)
- Base de datos (datos mock, estructura preparada para Supabase)
- Pagos (skill `mercadopago` aplicará después)
- Backend/Edge Functions

## Estructura de archivos propuesta

```
app/
  layout.tsx                    # Root layout: fonts, metadata, Toaster
  globals.css                   # Tailwind v4 + theme CSS variables
  page.tsx                      # Home: grid + filtros + search
  auth/
    page.tsx                    # Login / Registro tabs
  publicar/
    page.tsx                    # Formulario de publicación
  mis-publicaciones/
    page.tsx                    # Dashboard del vendedor
  paletas/
    [id]/
      page.tsx                  # Detalle de paleta (página dedicada)
      layout.tsx                # Layout con botón volver

components/
  layout/
    header.tsx                  # Header sticky (client)
    logo.tsx                    # SVG logo
  screens/
    auth-screen.tsx
    home-screen.tsx
    publish-screen.tsx
    my-listings.tsx
  cards/
    paleta-card.tsx
  shared/
    image-with-fallback.tsx
    detail-view.tsx             # Extraído de detail-modal
  ui/                           # 40+ shadcn primitives

lib/
  utils.ts                      # cn() helper

types/
  paleta.ts                     # Paleta, Forma, etc.

data/
  constants.ts                  # MARCAS, FORMAS, PROVINCIAS, ANIOS, PRECIOS, ESTADOS
  mock.ts                       # PALETAS, MIS_PALETAS
  utils.ts                      # estadoLabel, formatPrecio
```

## Routing mapping

| UIpadel (React Router) | Next.js App Router     | Notas                          |
|---|---|---|
| `vista="home"`         | `/`                    | Grid con filtros y búsqueda    |
| `!autenticado`         | `/auth`                | Login / Registro en tabs       |
| `vista="publicar"`     | `/publicar`            | Formulario completo            |
| `vista="mis"`          | `/mis-publicaciones`   | Dashboard con métricas         |
| `detail-modal`         | `/paletas/[id]`        | Página dedicada (reemplaza modal)|

## Client vs Server Components

**Server Components (default):**
- Root `layout.tsx` (solo setup, metadata, fonts)
- `page.tsx` wrappers (preparados para data fetching futuro)

**Client Components (`"use client"`):**
- Todas las `screen` components (usan `useState`, `useEffect`, eventos)
- `Header` (maneja query de búsqueda)
- `PaletaCard` (navegación al hacer click)
- Todos los componentes UI shadcn (primitivas Radix)
- `DetailView` (si usa animaciones de Framer Motion)

## Dependencias a instalar

### Core
```bash
# Next.js (se crea con create-next-app)
```

### Styling
```bash
npm install tailwindcss @tailwindcss/postcss postcss
```

### UI (mantener desde UIpadel)
```bash
npm install lucide-react motion sonner class-variance-authority clsx tailwind-merge
```

### Radix primitives (instalar según uso)
```bash
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-tabs @radix-ui/react-slider @radix-ui/react-select @radix-ui/react-label @radix-ui/react-separator @radix-ui/react-avatar @radix-ui/react-popover @radix-ui/react-tooltip
```

### shadcn/ui (vía CLI, luego de bootstrap)
```bash
npx shadcn@latest init
npx shadcn add button card badge dialog tabs slider select label separator avatar popover tooltip
```

## Adaptación del tema

Copiar `theme.css` de UIpadel a `app/globals.css` con estos ajustes:

1. Reemplazar `@import 'tailwindcss' source(none);` por `@import 'tailwindcss';`
2. Mantener todas las CSS variables en `:root` y `.dark`
3. Mantener `@theme inline` con mapeo de colores
4. Mantener `@layer base` con estilos tipográficos
5. Agregar `@import 'tw-animate-css';` si se usa

## Cambios arquitectónicos clave

### 1. Modal → Página dedicada
El `DetailModal` de UIpadel se convierte en página `/paletas/[id]`. Esto mejora:
- **SEO**: cada paleta tiene URL propia indexable
- **Shareability**: se puede compartir el link directo
- **UX**: al hacer atrás en mobile, vuelve al grid

Desde el grid, `PaletaCard` navega a `/paletas/${paleta.id}` en lugar de abrir modal.

### 2. Estado global
Reemplazar el `useState` central de `App.tsx` por:
- **URL search params** para query y filtros (shallow routing, shareable URLs)
- **Local state** para UI interna (tabs, modales, dropdowns)
- **Supabase Auth** (futuro) para autenticación real

### 3. Data fetching
Todas las páginas preparadas para migrar a Server Components que fetcheen de Supabase. Por ahora usan mock data importada.

### 4. Mobile-first
Se mantienen todos los breakpoints responsive existentes. Estilo base para celular; `sm:` / `md:` solo para agrandar.

## Orden de implementación (slices)

| # | Slice | Archivos principales | Estimado líneas |
|---|---|---|---|
| 1 | Bootstrap Next.js + Tailwind v4 + tema | `package.json`, `next.config.*`, `tsconfig.json`, `postcss.config.mjs`, `app/globals.css`, `app/layout.tsx` | ~80 |
| 2 | Layout + Header + Logo + Tipos + Constants | `components/layout/*`, `types/paleta.ts`, `data/constants.ts`, `data/utils.ts` | ~150 |
| 3 | Mock data + PaletaCard | `data/mock.ts`, `components/cards/paleta-card.tsx` | ~120 |
| 4 | Home screen (grid + filtros + search) | `app/page.tsx`, `components/screens/home-screen.tsx` | ~220 |
| 5 | Detail page | `app/paletas/[id]/page.tsx`, `app/paletas/[id]/layout.tsx`, `components/shared/detail-view.tsx` | ~150 |
| 6 | Auth screen | `app/auth/page.tsx`, `components/screens/auth-screen.tsx` | ~140 |
| 7 | Publish screen | `app/publicar/page.tsx`, `components/screens/publish-screen.tsx` | ~280 |
| 8 | My Listings screen | `app/mis-publicaciones/page.tsx`, `components/screens/my-listings.tsx` | ~220 |
| 9 | Animaciones + Toasts + Polish | `components/ui/sonner.tsx`, integración en layout, ajustes finales | ~60 |

**Total estimado:** ~1.420 líneas nuevas.

## Riesgos

| Riesgo | Mitigación |
|---|---|
| Tailwind v4 en Next.js puede tener diferencias con Vite | Usar `@tailwindcss/postcss` en lugar de `@tailwindcss/vite`; probar build temprano |
| Framer Motion requiere `"use client"` en App Router | Marcar explícitamente los componentes que usan animaciones |
| Uploader de fotos usa `URL.createObjectURL` (solo cliente) | Mantener como client component; en producción se subirá a Supabase Storage |
| Filtros con shallow routing pueden ser complejos | Empezar con local state; migrar a URL params en iteración posterior |
| ~40 componentes UI shadcn es mucho código | Migrar solo los que se usan en las 5 pantallas; el resto bajo demanda |
| Total supera ampliamente las 400 líneas de presupuesto | Requiere PRs encadenados o excepción de tamaño |

## Tecnología final

- **Framework:** Next.js 15 (App Router)
- **React:** 19
- **TypeScript:** 5.x
- **Styling:** Tailwind CSS v4
- **UI Components:** shadcn/ui (Radix + Tailwind)
- **Icons:** Lucide React
- **Animations:** Framer Motion (`motion`)
- **Toasts:** Sonner
- **Locale:** es-AR
- **Paradigma:** Mobile-first

## Decisiones pendientes

1. **¿Mantener Detail como modal interactivo?**
   - Recomendación: No. Página dedicada es mejor para SEO y UX.
   - Alternativa: Intercepting routes (`@modal`) para modal desde grid + página dedicada al recargar.

2. **¿URL params para filtros en iteración 1?**
   - Recomendación: No. Local state primero, URL params en iteración 2.

3. **¿Cuántos componentes UI shadcn migrar?**
   - Recomendación: Solo los usados activamente en las 5 pantallas. El resto se agrega bajo demanda.

4. **¿Auth real o mock?**
   - Recomendación: Mock por ahora. Integrar Supabase Auth en trabajo futuro.

---

*Generado por SDD / Fase: Propuesta*
