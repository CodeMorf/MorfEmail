# Integración real con Polar

MorfEmail ya no contiene una licencia activa, precios o validaciones simuladas. El API local usa `@polar-sh/sdk` y mantiene el estado comercial que recibe desde Polar.

## Variables de entorno

Copiar `.env.example` a `.env` y completar únicamente en el entorno local o del servidor:

- `POLAR_SERVER=sandbox` para pruebas sin cobros reales; usar `production` solo con el catálogo publicado.
- `POLAR_ACCESS_TOKEN`: Organization Access Token. Nunca se envía al frontend ni se guarda en el repositorio.
- `POLAR_PRODUCT_*_ID`: IDs reales de productos recurrentes creados en Polar.
- `POLAR_WEBHOOK_SECRET`: secreto del endpoint de webhooks de Polar.
- `MORFEMAIL_APP_URL`: URL de retorno del checkout.

## Cupones y promociones de un año

Los cupones se crean en el superadmin de CodeMorf, en `Servicios -> Cupones Polar`, y se aplican dentro del checkout alojado por Polar.

- Plan mensual con promoción durante un año: descuento `repeating` y `durationInMonths=12`.
- Plan anual con descuento sobre el año contratado: duración `once`.
- Un descuento del 100% es un año gratis; úsalo solamente con un código y límite de usos definidos.

Polar permite restringir el cupón a productos concretos, establecer fechas y limitar redenciones. El checkout acepta códigos porque el backend envía `allow_discount_codes=true`.

## Flujo integrado

1. `GET /api/billing/plans` consulta los productos configurados en Polar y devuelve sus nombres, descripciones, ciclos y precios activos.
2. `POST /api/billing/checkout` crea una Checkout Session real con el producto seleccionado y devuelve la URL de Polar.
3. Polar redirige a `MORFEMAIL_APP_URL` después del checkout.
4. `POST /api/webhooks/polar` valida la firma, aplica idempotencia por `webhook-id` y persiste suscripciones en SQLite.
5. `POST /api/billing/portal` crea una Customer Session real cuando ya existe un cliente Polar sincronizado.

## Webhook Polar

Crear en Polar un endpoint público que apunte a `/api/webhooks/polar` y suscribir al menos:

- `subscription.created`
- `subscription.active`
- `subscription.updated`
- `subscription.canceled`
- `subscription.revoked`
- `subscription.past_due`
- `subscription.paused`
- `subscription.resumed`

Para desarrollo local, usar el Polar CLI o un túnel HTTPS y reenviar al API local. La firma se valida con el helper oficial del SDK; no se acepta un webhook sin secreto válido.

## Verificación local

Sin credenciales, el resultado correcto es `configured=false`, catálogo vacío y checkout HTTP 503: la aplicación no inventa planes ni permite aparentar una compra. Con credenciales de Sandbox, verificar el checkout y los webhooks desde el panel de entregas de Polar.

Referencias oficiales:

- [Polar Checkout API](https://polar.sh/docs/features/checkout/session)
- [Polar Webhooks](https://polar.sh/docs/integrate/webhooks/delivery)
- [Polar Customer Portal](https://polar.sh/docs/features/customer-portal/introduction)
