# MorfEmail — Production Readiness

**Fecha de corte:** 2026-08-28  
**Estado:** `NOT READY`

Este informe separa lo que fue comprobado en localhost/servidor de lo que todavía necesita una condición externa. No se considera “terminado” solo porque compile o responda HTTP 200.

## Resultado ejecutivo

| Área | Resultado | Evidencia |
|---|---|---|
| Sistema de licencias | PASS | `/cupones/` protegido para administrador; hash SHA-256 y copia cifrada AES-GCM; estados y duración en backend |
| Cupones | PASS | Cupón mensual de 1 mes canjeado una vez; segundo canje rechazado |
| Activación | PASS | Licencia `created` pasó a `active`; se calculó vencimiento desde la activación |
| Dispositivos | PASS | Segundo dispositivo rechazado con `maxDevices=1` |
| Gracia offline | PASS condicionado | Token RSA firmado emitido y ligado a licencia/instalación, con gracia de 72 h |
| Email de licencia | NOT VERIFIED | El modo sin envío devuelve `not_sent`; no se envió correo real a un buzón autorizado en esta corrida |
| Polar | NOT READY | Catálogo publicado, pero `polarEnabled=false` y `configuredInPolar=false`; faltan token/product IDs/webhook válidos |
| Crawler y discovery | PASS local | OpenStreetMap/Overpass + Crawlee + Cheerio; Playwright solo cuando realmente renderiza |
| Datos públicos | PASS en muestra | 10/10 fuentes originales respondieron y sus nombres coincidieron; teléfonos presentes en la fuente cuando fueron extraídos |
| `cargo check` | NOT VERIFIED | `cargo` no está instalado en este equipo |
| Seguridad de dependencias | BLOCKED | `npm audit --omit=dev`: `xlsx@0.18.5` con 1 vulnerabilidad HIGH y sin fix disponible |
| Producción | **NOT READY** | Polar y email de licencia no están comprobados; queda pendiente `cargo check` y resolver la dependencia XLSX |

## Licencias CodeMorf

Ruta creada y protegida: `https://codemorf.tech/cupones/`.

El panel permite generar licencias MorfEmail para los planes:

- Mensual: US$5.99.
- Anual: US$50.
- De por vida: US$499.

Permite duración por días, meses, años o lifetime, máximo de dispositivos, envío opcional y canje de cupones. La key completa solo se muestra en el momento de creación/canje; el listado administrativo no la devuelve.

El servidor registra cliente, plan, duración, activación, vencimiento, estado, entrega, proveedor y último control. Las keys se buscan por hash y se conserva una copia cifrada únicamente para reenvío autorizado.

## Pruebas de licencia

- Licencia anual de QA: activación correcta, `remainingDays=731`, `maxDevices=1`; segundo dispositivo rechazado con `device_limit`.
- Expiración forzada de QA: respondió `expired`.
- Revocación de QA: respondió `revoked`.
- Cupón final: `morfemail-monthly`, duración `1 mes`, key creada como `created`, activación correcta con `31` días restantes, segundo canje rechazado.
- Token offline: firmado por el servidor, validado con la clave pública del cliente, expiración de gracia hasta 72 horas. No se usa `licenseValid=true` como mecanismo de autorización.

Las pruebas de QA no se consideran clientes comerciales ni sustituyen una prueba de entrega a un buzón controlado.

## Pruebas progresivas reales

**Ubicación:** República Dominicana → Santo Domingo → Santo Domingo → Restaurantes.  
**Fuente:** OpenStreetMap/Overpass, con atribución ODbL.  
**Persistencia:** `data/morfemail.db`, `better-sqlite3`, WAL activo, foreign keys activas.

### Discovery progresivo

| TEST | Solicitadas | Devueltas | IDs OSM únicos | Websites | Emails públicos | Phones públicos | Direcciones | Resultado |
|---:|---:|---:|---:|---:|---:|---:|---:|---|
| 10 | 10 | 10 | 10 | 1 | 0 | 1 | 2 | PASS |
| 50 | 50 | 50 | 50 | 3 | 0 | 5 | 17 | PASS |
| 100 | 100 | 100 | 100 | 10 | 0 | 14 | 41 | PASS |
| 200 | 200 | 200 | 200 | 13 | 0 | 27 | 74 | PASS |
| 400 | 400 | 400 | 400 | 21 | 2 | 55 | 153 | PASS |

Los emails permanecen vacíos cuando no aparecen públicamente. No se generan direcciones `info@`, `ventas@` ni similares por suposición.

### Crawls progresivos y estabilidad

| TEST | Empresas únicas | Páginas | Websites | Emails | Phones | Restricted | Errors | Duración | Peak working set | Resultado |
|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| 10 | 9 | 0 | 1 | 0 | 0 | 1 | 0 | 8.8 s | no medido | PASS; 1 web restringida |
| 100 | 95 | 5 | 10 | 3 | 11 | 2 | 3 | 6.0 s | 362.9 MB | PASS |
| 200 | 194 | 8 | 13 | 5 | 24 | 2 | 3 | 17.7 s | 388.1 MB | PASS |
| 400 | 391 | 14 | 21 | 8 | 50 | 3 | 4 | 9.1 s | 365.6 MB | PASS; 9 duplicados filtrados |
| 500 stress | 490 | 14 | 22 | 8 | 55 | 3 | 5 | 23.8 s | no medido | PASS; supera 400 |

En la prueba de 400, los 9 descartes fueron deduplicación por empresa/datos, no resultados inventados. Las fallas observadas fueron dominios publicados en OSM que ya no resuelven por DNS. Las restricciones fueron robots.txt de Instagram/Facebook/PedidosYa; no se intentó evasión.

### Zonas adicionales

| Caso | Filtro | Devueltas | IDs únicos | País incorrecto | Resultado |
|---|---|---:|---:|---:|---|
| A | RD · Santo Domingo · Restaurantes | 10 | 10 | 0 | PASS |
| B | RD · Santiago de los Caballeros · Hoteles | 10 | 10 | 0 | PASS |
| C | España · Madrid · Abogados | 10 | 10 | 0 | PASS |
| D | Estados Unidos · Miami · Tecnología | 4 | 4 | 0 | PASS; 4 públicos disponibles |

En la consulta de 200 hubo 9 etiquetas de ciudad distintas a la cadena exacta “Santo Domingo” dentro del bbox metropolitano. Se conserva la etiqueta de fuente y no se reemplaza silenciosamente por una ciudad inventada; para producción comercial conviene añadir un proveedor geográfico con polígonos municipales/licencia de datos, no ampliar el bbox sin control.

### Validación manual de fuente

Se abrieron 10 fichas originales de OSM correspondientes a los primeros resultados de la prueba de 50:

- Fuente original respondió: 10/10.
- Nombre de empresa coincidió: 10/10.
- Teléfono consistente cuando existía: 10/10.
- Dirección consistente cuando existía: 10/10.

Esto comprueba procedencia pública, no garantiza que una línea telefónica esté atendida ni que un buzón acepte correo. Para declarar emails `DELIVERABLE` se debe ejecutar el validador DNS/MX y conservar su resultado; no se enviaron mensajes de prueba.

## Correcciones realizadas durante las pruebas

1. Las fichas OSM sin website se perdían porque solo entraban URLs a Crawlee. Ahora se guardan como leads públicos con su fuente OSM, sin fingir un website.
2. La deduplicación trataba el dominio vacío como si todos los leads compartieran el mismo dominio. Ahora exige dominios no vacíos y también compara email, teléfono y empresa+dirección.
3. Discovery Overpass tenía fallos transitorios 502/fetch. Ahora rota endpoints, respeta una pausa de 1.1 s y reintenta hasta 3 rondas sin paralelizar consultas públicas.
4. Se eliminó el HWID fijo `HWID-WIN64-MORF-9281-LOCAL`. El cliente usa un identificador opaco estable de instalación; el código nativo genera un identificador derivado y anonimizado.
5. La UI quedó bloqueada en la pantalla de licencia cuando no hay validación central válida.
6. El cliente muestra plan, activación, vencimiento y tiempo restante usando la respuesta del servidor.

## Pendientes para poder declarar READY

1. Configurar y verificar en Polar el token, los tres product IDs y el webhook; el estado actual es manual/local y no ofrece checkout Polar real.
2. Autorizar un buzón controlado de QA y comprobar la plantilla `license_issued`, `sent_at`, proveedor, message ID y estado de entrega real.
3. Ejecutar `cargo check` en una máquina con Rust instalado.
4. Sustituir o aislar `xlsx@0.18.5`, que mantiene avisos HIGH de prototype pollution/ReDoS sin corrección disponible.
5. Repetir la prueba de activación desde la UI, cerrar/reabrir MorfEmail y comprobar la licencia persistente en un instalador Windows real.
6. Configurar una fuente de discovery comercial/propia para producción; los endpoints públicos de Overpass son aptos para QA moderada, no una garantía de capacidad comercial.

## Resultado final requerido

```text
MORFEMAIL PRODUCTION STATUS: NOT READY
LICENSE SYSTEM: PASS
LICENSE EMAIL: NOT VERIFIED
LICENSE ACTIVATION: PASS
```
