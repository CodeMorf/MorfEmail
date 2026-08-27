# MorfEmail Open Source Stack

Objetivo: construir un motor local de descubrimiento B2B superior a un simple email finder, combinando discovery, crawling, extracción, validación, persistencia y desktop Windows.

## Stack principal

| Proyecto | Función en MorfEmail | Estado |
|---|---|---|
| Tauri 2 | Contenedor Windows `.exe/.msi`, permisos y backend Rust | Integrado |
| Playwright | Renderizado real de sitios dinámicos/SPA | Integrado en backend local |
| Cheerio | Parsing HTML rápido | Integrado |
| Crawlee | Cola persistente y orquestación de crawling | Runtime agregado; validar en localhost |
| better-sqlite3 | SQLite local real en backend Node | Adaptador agregado; conectar a flujo UI tras prueba local |
| libphonenumber-js | Validación y normalización internacional de teléfonos | Integrado en PhoneExtractor |
| tldts | Dominio registrable/Public Suffix List y deduplicación | Integrado en UrlNormalizer |
| robots-parser | Lectura y cumplimiento de `robots.txt` | Módulo de política agregado; validar en localhost |
| p-queue | Concurrencia/rate limit por host | Módulo de política agregado; validar en localhost |
| hickory-resolver | DNS/MX nativo desde Tauri/Rust | Integrado en validación de email |
| OpenStreetMap + Overpass | Discovery público de negocios por ubicación/categoría | Integrado para desarrollo local moderado |

## Arquitectura objetivo

```text
UI React
  |
  v
Discovery (OpenStreetMap/Overpass + futuros providers)
  |
  v
Crawlee RequestQueue
  |
  +--> HTTP -> Cheerio
  |
  +--> Dynamic -> Playwright
  |
  v
MorfExtractor
  |
  +--> Email
  +--> libphonenumber-js
  +--> WhatsApp
  +--> Social links
  +--> JSON-LD / Schema.org
  +--> Address
  |
  v
tldts + Deduplication
  |
  v
Validation Engine (DNS/MX/SMTP)
  |
  v
SQLite (better-sqlite3 / desktop adapter)
  |
  v
Results / Export / History
```

## Reglas de calidad

1. No generar emails por adivinación.
2. No inventar empresas, teléfonos, direcciones o estadísticas.
3. Guardar `sourceUrl` y fecha de descubrimiento.
4. Respetar límites por dominio y `robots.txt`.
5. No implementar bypass de CAPTCHA, autenticación o controles de acceso.
6. `UNKNOWN` no equivale a `INVALID` en validación SMTP.
7. Playwright solo se usa cuando HTTP/Cheerio no basta.
8. SQLite debe ser la fuente persistente local antes de empaquetar Windows.

## Gates antes de Windows

### Gate 1 — localhost
- instalar dependencias
- instalar Chromium
- lint PASS
- build PASS
- API `/api/health` PASS
- búsqueda real PASS
- extracción real de correo/teléfono PASS
- Playwright fallback PASS
- sin datos mock en resultados funcionales

### Gate 2 — motor
- Crawlee procesando la cola real
- robots-parser activo
- p-queue limitando por host
- SQLite guardando leads/búsquedas
- reanudación y cancelación verificadas

### Gate 3 — desktop
- mover/adaptar persistencia al contexto Tauri
- validar permisos mínimos
- compilar `.exe/.msi`
- smoke test Windows 10/11

## No obligatorio en V1

Crawl4AI y Scrapy no son requisitos para el MVP. El motor básico no debe depender de IA ni de Python. Se pueden evaluar después si aportan valor medible en extracción compleja.
