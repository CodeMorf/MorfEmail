# Documentación del Motor MorfExtractor & CrawlerEngine

Detalles técnicos sobre el funcionamiento del pipeline de extracción y rastreo.

---

## 1. Modos de Rastreo Híbrido

1. **FAST (`fast`)**:
   - Ejecuta peticiones HTTP asíncronas ultraligeras.
   - Parsea el contenido mediante **Cheerio**.
   - Consume menos de 30 MB de RAM.
   - Ideal para directorios estáticos, páginas de contacto tradicionales y blogs corporativos.

2. **BROWSER (`browser`)**:
   - Inicia instancias de navegador **Playwright Chromium**.
   - Ejecuta en modo `headless` (configurable a Headless OFF en Ajustes).
   - Renderiza Single Page Applications (React, Next.js, Vue, Angular).
   - Espera eventos de red y mutaciones de DOM.

3. **AUTO (`auto`) — Recomendado**:
   - Intenta primero el modo FAST (HTTP + Cheerio).
   - Si detecta contenedores SPA vacíos (`#root`, `#app`, `#__next` con menos de 150 caracteres de texto), realiza fallback automático a **Playwright Chromium**.

---

## 2. Motor Propietario MorfExtractor

| Submódulo | Responsabilidad |
| :--- | :--- |
| **EmailExtractor** | Detecta emails en enlaces `mailto:`, texto plano y formatos ofuscados (`[at]`). Prioriza prefijos B2B (`info@`, `ventas@`, `contacto@`). |
| **PhoneExtractor** | Reconoce formatos internacionales (+1 809/829/849, +34, +57, +1, +52) y normaliza a formato limpio con código de país. |
| **WhatsappExtractor** | Extrae enlaces directos `wa.me/`, `api.whatsapp.com` y limpia los números a formato E.164. |
| **SocialExtractor** | Valida perfiles corporativos en LinkedIn, Instagram, Facebook, X, TikTok y YouTube ignorando enlaces de compartir. |
| **BusinessExtractor** | Extrae el nombre comercial desde OpenGraph (`og:site_name`), `<title>`, encabezados `<h1>` y footers. |
| **AddressExtractor** | Identifica etiquetas `<address>`, nomenclaturas de calles (`Av.`, `Calle`, `Carrera`) y códigos postales de 5 dígitos. |
| **StructuredDataExtractor** | Lee bloques `<script type="application/ld+json">` (`LocalBusiness`, `Organization`, `Restaurant`, `Hotel`, etc.). |
| **DeduplicationEngine** | Previene duplicados por dominio, website, email principal, teléfono y coincidencia de nombre + dirección. |

---

## 3. Política de Cumplimiento & No-Evasión

MorfEmail **no realiza evasión de autenticación, saltos de CAPTCHA ni suplantación de cookies privadas**.

Cuando un servidor devuelve estados restringidos o bloqueos, el motor aplica la política:
- Registra el estado (`blocked`, `restricted`, `login_required`, `robots_restricted`, `timeout`).
- Aplica Circuit Breaker en el dominio tras fallos reiterados.
- Continúa de forma segura con el siguiente objetivo en la cola.
