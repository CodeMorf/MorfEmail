# Arquitectura de Software MorfEmail Desktop (Windows)

MorfEmail es un software de escritorio para Windows desarrollado para el **descubrimiento, extracción y organización de contactos empresariales públicos (B2B)**.

---

## 1. Diagrama de Capas del Sistema

```text
┌─────────────────────────────────────────────────────────────┐
│                   MorfEmail Windows Desktop                 │
├─────────────────────────────────────────────────────────────┤
│   [ Capa 1: Frontend & UI ]                                 │
│   React 19 + TypeScript + Tailwind CSS                      │
│   - Panel de Búsqueda Jerárquica (País -> Región -> Ciudad) │
│   - Monitor de Métricas en Tiempo Real y Log de Rastreo     │
│   - Tablas de Prospectos, Verificador y Deduplicación       │
│   - Morf AI Studio & Configuración de Proxy / Licencias     │
├─────────────────────────────────────────────────────────────┤
│   [ Capa 2: Puente Seguro Tauri 2 (IPC) ]                   │
│   - Invocación de comandos nativos en Rust                  │
│   - Aislamiento de permisos y control de acceso local       │
├─────────────────────────────────────────────────────────────┤
│   [ Capa 3: Capa de Servicios ]                             │
│   SearchService · ValidationService · ExportService         │
├─────────────────────────────────────────────────────────────┤
│   [ Capa 4: Motor de Rastreo (CrawlerEngine) ]              │
│   - Modo FAST: HTTP + Cheerio (Ultra ligero)                │
│   - Modo BROWSER: Playwright Chromium Headless              │
│   - Modo AUTO: HTTP inicial con Fallback dinámico           │
│   - Control de Concurrencia, Rate-Limiting y Circuit Breaker│
├─────────────────────────────────────────────────────────────┤
│   [ Capa 5: Motor de Extracción Propietario (MorfExtractor) │
│   - EmailExtractor (Prefijos B2B, ofuscación, filtros spam) │
│   - PhoneExtractor (Normalización internacional: +1, +34...)│
│   - WhatsappExtractor (wa.me, api.whatsapp.com)             │
│   - SocialExtractor (LinkedIn, Instagram, Facebook, X, etc.)│
│   - BusinessExtractor & AddressExtractor                    │
│   - StructuredDataExtractor (JSON-LD Schemas)               │
│   - DeduplicationEngine (Dominio, Website, Email, Teléfono) │
├─────────────────────────────────────────────────────────────┤
│   [ Capa 6: Persistencia Local SQLite ]                     │
│   - searches · leads · websites · contacts                  │
│   - social_profiles · crawl_queue · crawl_history           │
│   - exports · settings · licenses                           │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Tecnologías Open Source Principales

1. **Tauri 2**: Contenedor desktop nativo de alto rendimiento para Windows.
2. **Crawlee**: Arquitectura de colas, retries, control de concurrencia y rastreo profundo.
3. **Playwright**: Motor de renderizado Chromium para páginas dinámicas y SPAs.
4. **Cheerio**: Analizador HTML estático ultra rápido para páginas tradicionales.
5. **SQLite 3**: Base de datos relacional local que garantiza que todos los prospectos se guarden en la máquina del usuario sin depender de la nube.
