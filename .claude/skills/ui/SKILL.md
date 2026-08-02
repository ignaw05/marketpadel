---
name: ui
description: Convenciones de UI/UX para marketpadel (Next.js App Router + TypeScript + Tailwind). Usar al crear o modificar cualquier pantalla, componente, formulario o flujo de la app. Cubre estados (loading/error/empty), accesibilidad, formularios, mobile-first y formato es-AR. Para dirección estética (paleta, tipografía, "que no parezca template") invocar además la skill frontend-design.
---

# UI de marketpadel

Marketplace de pádel, es-AR, mobile-first. La mayoría entra desde el celular.

## Antes de escribir un componente

1. ¿Existe HTML nativo que lo haga? `<dialog>`, `<details>`, `<input type="date">`,
   `popover`, `<select>`. Nada de librerías de modal/dropdown/datepicker.
2. ¿Ya está en el proyecto? Reusar antes de crear.
3. Server Component por default. `"use client"` solo si hay estado, evento o efecto,
   y lo más abajo posible en el árbol.

No crear un design system. Los componentes compartidos nacen cuando el mismo markup
aparece por tercera vez, no antes.

## Los cuatro estados

Toda vista que traiga datos necesita los cuatro. Falta uno = está incompleta.

- **loading** — `loading.tsx` o `<Suspense>` con skeleton del mismo tamaño que el
  contenido real. Nunca un spinner centrado que corre el layout al resolver.
- **empty** — qué es esto, por qué está vacío, y un botón para llenarlo.
  "Todavía no publicaste ninguna paleta" + "Publicar paleta". Nunca "No hay datos".
- **error** — `error.tsx` con mensaje humano y botón de reintentar. Nunca el stack.
- **success** — el contenido.

## Accesibilidad (no negociable)

- Todo lo clickeable es `<button>` o `<a>`. Un `<div onClick>` es un bug.
- Imagen de producto → `alt` con lo que se ve. Decorativa → `alt=""`.
- Label real asociado a cada input (`htmlFor`), no placeholder como label.
- Foco visible. Si sacás el outline, poné otro.
- Target táctil mínimo 44px.
- Contraste 4.5:1 en texto.

## Formularios

- Server Actions + `useActionState`. Sin librerías de formularios.
- Validar en el servidor siempre; el cliente es solo comodidad.
- Error al lado del campo, no un toast que se va.
- Botón de submit deshabilitado + texto de progreso mientras corre (`useFormStatus`).
- El input nunca pierde lo que el usuario escribió cuando falla la validación.

## Formato es-AR

```ts
// ponytail: Intl nativo, sin date-fns ni dinero.js
new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS',
  maximumFractionDigits: 0 }).format(precio)              // $ 145.000
new Intl.DateTimeFormat('es-AR', { dateStyle: 'medium' }).format(fecha)
```

Precios en centavos (enteros) en la base y en el código. Float solo al mostrar.

## Mobile-first

- Escribí el estilo base para celular; `sm:` / `md:` solo para agrandar.
- Grilla de productos: 2 columnas en mobile, no 1.
- Filtros en un `<dialog>` a pantalla completa en mobile, sidebar en desktop.
- `next/image` con `sizes` correcto en toda foto de producto — es la mitad del peso
  de un marketplace.

## Trampas conocidas

- Layout shift por imágenes sin `width`/`height` o `aspect-ratio`.
- `useEffect` para traer datos: en App Router eso es fetch en el Server Component.
- Estado de filtros/paginación en `useState`: va en la URL (`searchParams`), así se
  comparte y sobrevive al back.
