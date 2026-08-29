# MorfEmail Localhost Audit

Fecha de la auditoría: 2026-08-27  
Alcance: integración real en localhost, integración de facturación Polar sin credenciales expuestas, sin empaquetado Windows y sin rediseño visual.

## Veredicto

`READY` para el flujo localhost web + API. La aplicación levanta en `127.0.0.1:3000`, el API local en `127.0.0.1:3100`, persiste en SQLite y la búsqueda puede recorrer discovery, HTTP, Cheerio, Playwright, extracción y resultados.

Este veredicto no equivale a producción: Cargo/Rust no está instalado en el entorno de auditoría, GitHub Actions no se ejecutó desde este checkout, la cobertura de websites de OpenStreetMap en RD es limitada y el checkout/webhook de Polar requiere credenciales de Sandbox del propietario.

## Estado por componente

| Componente | Estado | Evidencia ejecutable |
| --- | --- | --- |
| Discovery | DONE | `POST /api/discovery` usa Nominatim + Overpass. RD devolvió 20 entidades reales y España devolvió 20; no se generan nombres, dominios ni contactos. |
| Crawlee | DONE | `CheerioCrawler`, `RequestQueue`, retries, lifecycle, `maxConcurrency` y deduplicación de requests están en `server/crawlJobManager.ts`. |
| HTTP | DONE | La ruta normal ejecuta Crawlee HTTP antes de cualquier render; fallos de DNS/TLS quedan registrados y no bloquean el cierre del job. |
| Cheerio | DONE | El HTML HTTP se carga con Cheerio y pasa a `MorfExtractor`. |
| Playwright | DONE | Chromium instalado con `npm run setup:browser`; `TARGET DOMAIN https://quotes.toscrape.com/js/` registró `parser: playwright` con HTTP 200. |
| robots.txt | DONE | Google `/search` fue omitido: `restrictedCount=1`, `pagesAnalyzed=0`, `errorsCount=0`; no se descargó la página restringida. |
| p-queue | DONE | Cola global de render con concurrencia 2 y cola por host con límite/delay en `server/crawlPolicy.ts`. |
| MorfExtractor | DONE | Extrae nombre, categoría, HTML/JSON-LD/Schema.org, website, dirección, email, teléfono, WhatsApp y perfiles sociales. |
| Emails | DONE | Solo se guardan emails publicados por `mailto`, texto visible, JSON-LD o Schema.org; cada fila guarda `source_url`, dominio y fecha. |
| Phones | DONE | `libphonenumber-js` normaliza y valida teléfonos según país; se conserva el teléfono normalizado en el lead y el valor extraído en `lead_phones`. |
| WhatsApp | DONE | Se extraen enlaces `wa.me`, `whatsapp.com` y `whatsapp://` publicados. |
| Socials | DONE | Facebook, Instagram, LinkedIn, X/Twitter, TikTok y YouTube se guardan en `lead_socials` cuando aparecen públicamente. |
| Validation | DONE | La suite existente pasó 77/77 e incluye syntax, DNS, MX, Null MX, disposable, webmail, SMTP opcional, catch-all, greylisting y UNKNOWN. |
| SQLite | DONE | `better-sqlite3` real en `data/morfemail.db`; WAL activo, foreign keys activas, tablas `searches`, `leads`, `lead_emails`, `lead_phones`, `lead_socials`, `crawl_urls`, `crawl_events`, `exports` e índices de búsqueda. |
| UI | DONE | React carga leads e historial desde el API; una instalación limpia inicia sin `INITIAL_LEADS`; E2E visual completó búsqueda y llegó a Resultados sin errores de consola. Vite excluye `data/` y `storage/` para no recargar la SPA al escribir SQLite/Crawlee. |
| Polar billing | PARTIAL | El SDK oficial consulta productos, crea Checkout Sessions, crea Customer Sessions y valida webhooks firmados con idempotencia SQLite. Sin credenciales/productos del propietario se verificaron los estados seguros `configured=false`, catálogo vacío, checkout 503 y webhook 503; queda pendiente una transacción Sandbox real. |
| Tauri | PARTIAL | El manifiesto permanece en `src-tauri`; `cargo check --manifest-path src-tauri/Cargo.toml` no pudo ejecutarse porque Cargo/Rust no está instalado aquí. |
| CI | PARTIAL | `.github/workflows/ci.yml` contiene install, lint, tests, build y cargo check; no se disparó GitHub Actions desde esta auditoría. |

## Evidencia de localhost

- `GET http://127.0.0.1:3100/api/health` respondió `ok=true`, servicio `MorfEmail Local Engine`, almacenamiento `better-sqlite3`.
- Polar sin secretos locales respondió de forma segura: `configured=false`, `GET /api/billing/plans` con catálogo vacío, checkout `503`, portal `409` y webhook `503`; no se mostraron precios ni licencias inventadas.
- Después de borrar los artefactos de prueba, un arranque limpio respondió `ok=true` con `leads=0`, `searches=0` y `GET /api/searches` devolviendo `searches: []`.
- `GET http://127.0.0.1:3000/` respondió HTTP 200; `npm run dev` levantó el proceso combinado API + WEB.
- La base auditada mostró `journalMode=wal`, `foreignKeys=1` y las ocho tablas requeridas.
- Al iniciar una búsqueda desde la UI, el nuevo registro se guardó antes de iniciar el job. El API también crea el registro si se invoca directamente con un `searchId` nuevo, evitando errores de foreign key en `crawl_events`.

## Prueba RD

Entrada: República Dominicana / Santo Domingo / Restaurantes / 20.

- Discovery: 20 negocios reales de OpenStreetMap/Overpass; 1 tenía website público en los primeros 20 resultados.
- Website disponible: Instagram de Mango's Burger; robots.txt lo restringe para este User-Agent.
- Crawl final respetando robots: `pages=0`, `businesses=0`, `websitesDiscovered=1`, `emails=0`, `phones=0`, `WhatsApp=0`, `restricted=1`, `errors=0`.
- La fuente sí entregó teléfonos y direcciones OSM en algunos resultados sin website, pero no se convierten en páginas rastreadas ni en websites inventados.
- Pendiente: una prueba de tres websites manuales de restaurantes RD requiere que la fuente pública seleccionada exponga al menos tres websites rastreables; no se fabricaron resultados para cumplir ese número.

## Prueba España

Entrada: España / Madrid / Abogados / 20.

- Discovery: 20 negocios reales de OpenStreetMap/Overpass; 5 websites públicos.
- Crawl: `pages=3`, `businesses=2`, `websitesDiscovered=5`, `emails=2`, `phones=2`, `WhatsApp=1`, `restricted=1`, `errors=2`, duración aproximada 6 s.
- Los dos errores fueron reproducibles y quedaron en el log: un dominio con `ENOTFOUND` y otro con TLS `dh key too small`. El job terminó en `completed` y no dejó requests bloqueadas.
- Los leads guardados provinieron de directorio CGPE y Aydesa Abogados; el email, teléfono, WhatsApp y `sourceUrl` se conservan con el registro.

## TARGET DOMAIN

- `https://www.python.org/`: homepage más `/about`, `/about/apps` y `/about/quotes`; 4 páginas analizadas, 1 lead y 0 errores. Las páginas secundarias provinieron de enlaces reales del DOM.
- `https://quotes.toscrape.com/js/`: Chromium real; 1 página, 1 lead de prueba, log con `parser: playwright`, HTTP 200.
- Los enlaces de contacto/about se encolan solo cuando aparecen en el DOM extraído y respetan la profundidad configurada.

## Comandos ejecutados

| Comando | Resultado |
| --- | --- |
| `git pull origin main` | PASS; rama actualizada |
| `npm install` | PASS |
| `npm run setup:browser` | PASS; Chromium disponible |
| `npm run lint` | PASS |
| `npm test` | PASS; 77 pasadas, 0 fallidas |
| `npm run build` | PASS; solo warning de tamaño de chunk |
| `npm audit --omit=dev` | PARTIAL; `xlsx` mantiene dos avisos HIGH sin fix disponible según npm |
| `cargo check --manifest-path src-tauri/Cargo.toml` | NOT RUN; Cargo no instalado |
| `npm run dev` | PASS; `concurrently` levantó API + WEB y ambos endpoints respondieron |

## Problemas pendientes

- Cargo/Rust no está instalado en este equipo y GitHub Actions no se ejecutó remotamente.
- `xlsx` reporta dos avisos HIGH sin corrección disponible en `npm audit --omit=dev`; requiere sustituir o aislar el lector antes de una entrega de producción.
- La consulta OSM de RD solo expuso un website entre los primeros 20 resultados; no se inventaron tres websites para forzar la prueba manual solicitada.
- El dominio dinámico `https://aydesabogados.com/` respondió fuera del crawler, pero una ejecución dirigida quedó más lenta de lo aceptable; debe cubrirse con fixture local y pruebas de timeout/reanudación en la Fase 3.
- OSM/Nominatim/Overpass públicos son adecuados para la prueba local, no una garantía operativa de producción; la Fase 7 debe usar un proveedor o instancia controlada.
- Polar requiere completar la configuración del propietario (`POLAR_ACCESS_TOKEN`, IDs de productos, `POLAR_WEBHOOK_SECRET` y URL pública o túnel) y ejecutar una prueba Sandbox de checkout + webhook.
- No se implementaron empaquetado Windows ni actualización, tal como se solicitó.

## Roadmap de producción

### Phase 1 — Localhost real

Estado: DONE para web + API. Mantener la validación de health, UI, SQLite y crawls reales como puerta de entrada.

### Phase 2 — Persistencia completa

Estado: PARTIAL. Completar persistencia de listas, programaciones, exportaciones de archivos y configuración local; agregar migraciones versionadas y pruebas de recuperación WAL.

### Phase 3 — estabilidad crawler

Estado: PARTIAL. Añadir pruebas de carga controladas, métricas por host, límites configurables, reanudación desde checkpoints y fixtures locales para DNS/TLS/robots sin depender de servicios públicos.

### Phase 4 — Windows/Tauri

Estado: NOT STARTED. Instalar Rust/Cargo y dependencias Tauri en CI y Windows; ejecutar `cargo check`, build firmado y prueba del bridge sin incluir credenciales.

### Phase 5 — licencia/subscription

Estado: PARTIAL. La UI y el backend ya usan el catálogo, checkout, Customer Portal y webhooks reales de Polar; falta configurar productos/secretos del propietario y ejecutar la prueba E2E en Sandbox. No se agrega modo offline ni se inventa una licencia local.

### Phase 6 — installer/update

Estado: NOT STARTED. Crear instalador, artefactos de rollback, canales de actualización y verificación de integridad después de validar Tauri.

### Phase 7 — producción

Estado: NOT STARTED. Sustituir endpoints públicos de OSM por proveedor/instancia compatible, definir consentimiento y retención, observabilidad, alertas, cuotas, seguridad operativa y pruebas E2E autenticadas.
