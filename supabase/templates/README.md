# Plantillas de mail

## Qué mail manda la app

Solo uno: **restablecer contraseña** (`recuperacion.html`). El registro entra
derecho, sin confirmar nada — `enable_confirmations = false` en `config.toml`, y
en el dashboard remoto, Authentication → Sign In / Providers → Email →
*Confirm email* apagado.

`confirmacion.html` queda para las cuentas viejas, creadas cuando la
confirmación estaba prendida.

## Sí, se puede editar la plantilla — pero hay que editarla

`confirmacion.html` no es cosmético: la app **no funciona con la plantilla que
viene por defecto**.

La default manda a `{{ .ConfirmationURL }}`, que pasa por
`/auth/v1/verify` de Supabase y devuelve los tokens en el **fragmento** de la
URL (`#access_token=...`). El fragmento nunca viaja al servidor, así que
`app/auth/confirmar/route.ts` no puede leerlo y la confirmación no cierra.

Esta plantilla usa `{{ .TokenHash }}`, que viaja como query param normal y sí
llega al Route Handler, que lo canjea con `verifyOtp`.

## Cómo aplicarla

**Local** (`supabase start`): ya está enganchada en `config.toml`, en
`[auth.email.template.confirmation]`.

**Proyecto remoto:** hay que pegarla a mano.

1. Dashboard → Authentication → Emails → *Reset password*
2. Asunto: `Restablecé tu contraseña de Paletita`
3. Pegar el contenido de `recuperacion.html` en el body
   (mismo trámite en *Confirm signup* con `confirmacion.html` si algún día se
   vuelve a prender la confirmación)
4. Authentication → URL Configuration → *Redirect URLs*: agregar
   `http://localhost:3000/auth/confirmar` y la URL de producción cuando exista.
   Sin esto Supabase ignora el `emailRedirectTo` y usa el Site URL.

No se puede automatizar desde acá: la Management API pide un Personal Access
Token de la cuenta (`SUPABASE_ACCESS_TOKEN`), que es distinto de la service
role key. Con uno, sería:

```
PATCH https://api.supabase.com/v1/projects/{ref}/config/auth
{ "mailer_templates_confirmation_content": "<el html>",
  "mailer_subjects_confirmation": "Confirmá tu cuenta en Paletita" }
```

## El SMTP por defecto no sirve para usuarios reales

Dos límites del mailer que trae Supabase, y son la razón por la que restablecer
la contraseña tira `over_email_send_rate_limit`:

- **Solo manda a miembros de tu organización.** Un usuario cualquiera que se
  registre no recibe nada.
- **Pocos mails por hora**, compartidos con todo el proyecto.

Para producción hay que configurar SMTP propio (Resend, SendGrid, Postmark) en
Authentication → Emails → SMTP Settings. Recién ahí la confirmación por mail es
usable de verdad.
