# marketpadel

Marketplace de pádel. es-AR, mobile-first: la mayoría entra desde el celular.

## Cómo trabajar

- Sin emojis. Ni en respuestas, ni en código, ni en commits, ni en la UI.
- Respuestas concisas. Código primero, después lo mínimo para entenderlo.
  Si la explicación es más larga que el diff, sobra explicación.
- Preguntar antes de asumir. Si hay dos lecturas razonables del pedido, o falta
  un dato que cambia el resultado, preguntar antes de escribir.
- Plantear alternativas. Cuando hay más de un camino válido, listarlos con el
  trade-off de cada uno y una recomendación. No presentar una sola opción como
  si fuera la única.

## UX/UI

Accesibilidad y mobile-first no son opcionales — no se simplifican para ahorrar
código.

Mínimos que se verifican en toda pantalla:

- Todo lo clickeable es `<button>` o `<a>`. Un `<div onClick>` es un bug.
- Cada input con su `<label htmlFor>`. El placeholder no es un label.
- Foco visible siempre. Target táctil 44px. Contraste 4.5:1.
- Estilo base para celular; `sm:` / `md:` solo para agrandar.
- Toda vista con datos tiene sus cuatro estados: loading, empty, error, success.

Detalle completo (estados, formularios, formato es-AR, trampas conocidas):
skill `ui`. Invocarla siempre que se toque una pantalla, componente o flujo.
Para dirección estética, además `frontend-design`.

## Skills del proyecto

- `ui` — cualquier pantalla, componente, formulario o flujo.
- `mercadopago` — pagos, checkout, webhooks, estados del pedido.
- `ship` — cerrar trabajo: tests, commits, PR.
