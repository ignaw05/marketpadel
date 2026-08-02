---
name: ship
description: Rutina de cierre de trabajo en marketpadel — escribir y correr los tests de lo que se tocó, y después partir los cambios en commits lógicos y abrir el PR. Usar cuando el usuario dice "shipealo", "abrí el PR", "testeá esto", "cerrá esto", "ya está listo", o cuando terminaste una feature y hay cambios sin commitear.
---

# Ship

Dos fases. No abrir el PR si la fase 1 no pasó.

## Fase 1 — Tests

### Qué se testea

Testear la lógica que puede estar mal sin que se note:

- **Plata.** Cálculo de precios, comisiones, redondeo, moneda. Siempre.
- **Webhooks de pago.** Firma inválida rechazada, evento repetido no cobra dos
  veces, `external_reference` desconocido no explota. Ver la skill `mercadopago`.
- **Auth y permisos.** Que el usuario B no pueda editar la publicación de A.
- **Parsers, filtros, validación de input.** Todo lo que tenga branches o loops.

Lo que **no** se testea: markup presentacional, wrappers de una línea, que Next.js
funcione. Un test que solo confirma que el framework anda es deuda, no cobertura.

### Cómo

Un archivo `*.test.ts` al lado del código, con Vitest (`npm i -D vitest`).
Sin fixtures, sin mocks elaborados, sin factories. Si el test necesita más setup
que el código que prueba, el código está mal acoplado — arreglá eso primero.

```ts
// ponytail: caso feliz + el borde que rompe. No más.
import { test, expect } from 'vitest';

test('la comisión redondea a favor del vendedor', () => {
  expect(comision(999)).toBe(99);
});
```

Cada bug que aparece deja un test que falla antes del fix. Ese es el único
momento en que agregar cobertura no se discute.

### Correr

```bash
npx vitest run && npx tsc --noEmit && npm run lint && npm run build
```

`tsc --noEmit` y `build` son parte del test suite acá: en Next.js la mitad de los
errores reales son de tipos o de `"use client"` mal puesto, y ningún test unitario
los ve.

Si algo falla: arreglarlo. Nunca borrar ni skipear un test para que pase el verde.

## Fase 2 — Commits y PR

Si el repo no es git todavía: `git init` y primer commit antes de nada.
Nunca commitear directo a `main` — rama primero.

### Partir los commits

Un commit = un cambio que se entiende solo y que se puede revertir solo.
Separar siempre:

1. Refactors y renames (ruido puro) — van en su propio commit, primero.
2. La feature o el fix.
3. Los tests, si son de algo que ya existía. Si son de la feature nueva, van
   en el mismo commit que la feature.
4. Migraciones de base de datos — commit propio, se revisan distinto.

Nada de `git add -A` a ciegas: mirá `git status` y `git diff` y armá cada commit
con `git add` de archivos o hunks concretos.

Mensajes en imperativo, una línea, sin prefijos de tipo salvo que el repo ya los use:
`Validar firma del webhook de MP`, no `feat(payments): added signature validation`.

Antes de commitear, revisar el diff por: `.env`, tokens, `console.log` olvidados,
código comentado, `TODO` sin dueño.

### El PR

```bash
gh pr create --title "..." --body "..."
```

Body corto, tres partes: **qué** cambia, **por qué**, **cómo probarlo**.
Si el PR pasa de ~400 líneas de diff real, proponé partirlo antes de abrirlo.

Pegá al final del body:

```
🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

Y en los commits:

```
Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
```

No pushear ni abrir el PR sin que el usuario lo pida explícitamente.
