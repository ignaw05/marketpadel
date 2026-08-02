---
name: mercadopago
description: Integrar pagos con MercadoPago Checkout Pro en Next.js (App Router + TypeScript) usando el SDK oficial mercadopago v2. Usar al crear preferencias de pago, el botón/redirect de checkout, las páginas de retorno (success/failure/pending) o el webhook de notificaciones con validación de firma x-signature. Incluye el flujo de estados del pedido y qué probar en sandbox.
---

# MercadoPago — Checkout Pro

`npm i mercadopago` (v2). Todo lo que toque el access token corre **solo en el servidor**:
route handlers o Server Actions. Nunca en un Client Component.

## Env

```
MP_ACCESS_TOKEN=       # privado, server-only, NUNCA con prefijo NEXT_PUBLIC_
MP_WEBHOOK_SECRET=     # el que genera MP en el panel de webhooks
NEXT_PUBLIC_BASE_URL=  # https://... — MP no acepta localhost en back_urls
```

Credenciales de test y de producción son distintas. Un token de test contra datos
reales cobra $0 y confunde durante horas.

## Cliente

```ts
// lib/mercadopago.ts
import { MercadoPagoConfig } from 'mercadopago';
export const mp = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN! });
```

## Crear la preferencia

La regla que evita el fraude: **el precio sale de la base de datos, nunca del body
del request**. El cliente manda el id del ítem; el servidor busca cuánto vale.

```ts
import { Preference } from 'mercadopago';
import { mp } from '@/lib/mercadopago';

const orden = await crearOrdenPendiente(userId, itemId); // precio desde la DB

const pref = await new Preference(mp).create({
  body: {
    items: [{
      id: orden.itemId,
      title: orden.titulo,
      quantity: orden.cantidad,
      unit_price: orden.precio,        // number, en pesos (no centavos)
      currency_id: 'ARS',
    }],
    external_reference: orden.id,      // clave: así el webhook sabe qué pedido es
    back_urls: {
      success: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout/exito`,
      failure: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout/error`,
      pending: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout/pendiente`,
    },
    auto_return: 'approved',
  },
});

redirect(pref.init_point!);  // sandbox_init_point con credenciales de test
```

`external_reference` no es opcional en la práctica. Sin eso el webhook llega y no
sabés a qué pedido corresponde.

## Webhook

`app/api/mercadopago/webhook/route.ts`. Registrar esa URL en el panel de MP
(o pasarla como `notification_url` en la preferencia).

```ts
import crypto from 'node:crypto';
import { Payment } from 'mercadopago';
import { mp } from '@/lib/mercadopago';

export async function POST(req: Request) {
  const url = new URL(req.url);
  const dataId = url.searchParams.get('data.id') ?? '';
  const requestId = req.headers.get('x-request-id') ?? '';
  const sig = req.headers.get('x-signature') ?? '';

  const parts = Object.fromEntries(
    sig.split(',').map((p) => p.split('=').map((s) => s.trim()) as [string, string]),
  );
  const { ts, v1 } = parts;
  if (!ts || !v1) return new Response('bad signature', { status: 401 });

  // El id va en minúscula si es alfanumérico. Los ; y el orden son literales.
  const manifest = `id:${dataId.toLowerCase()};request-id:${requestId};ts:${ts};`;
  const hash = crypto
    .createHmac('sha256', process.env.MP_WEBHOOK_SECRET!)
    .update(manifest)
    .digest('hex');

  const ok =
    hash.length === v1.length &&
    crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(v1));
  if (!ok) return new Response('unauthorized', { status: 401 });

  // El body no es fuente de verdad: solo trae el id. Preguntale a la API.
  const pago = await new Payment(mp).get({ id: dataId });

  await marcarOrden(pago.external_reference!, pago.status); // idempotente
  return new Response(null, { status: 200 });               // 200 o MP reintenta
}
```

Cuatro cosas que rompen esto en producción:

- **No validar la firma.** El endpoint es público; cualquiera puede postear
  "pago aprobado". Es la única barrera.
- **Confiar en el body.** Trae `data.id` y nada más que sirva. El estado se
  consulta con `Payment.get`.
- **No ser idempotente.** MP manda el mismo evento varias veces. Actualizar por
  `external_reference` con guarda de estado; no sumar saldo ni despachar dos veces.
- **Devolver != 200.** Cualquier otra cosa dispara reintentos por días. Si el
  procesamiento falla, logueá y devolvé 200 igual — salvo firma inválida (401).

## Estados

`approved` → pagado. `pending` / `in_process` → esperar el webhook, no entregar.
`rejected` → mostrar el motivo (`status_detail`) y ofrecer reintentar.

La página de `back_url` **no confirma nada**: el usuario puede cerrar el navegador
antes de volver, o abrir la URL a mano. Ahí se muestra "recibimos tu pago, te
avisamos"; el estado real lo escribe el webhook.

## Probar

Cuentas de prueba (vendedor y comprador) desde el panel de MP; no uses tu cuenta real.
Tarjetas de test y `status_detail` forzado por el nombre del titular:
`APRO` aprueba, `OTHE` rechaza por error general, `FUND` fondos insuficientes.

Para el webhook en local: túnel (`ngrok http 3000`) y esa URL como `notification_url`.
Sin túnel el webhook nunca llega y todo queda `pending`.
