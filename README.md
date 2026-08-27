# MorfEmail

MorfEmail is a Windows-focused B2B business contact discovery and email validation application built by CodeMorf.

It is designed to discover publicly available business information, crawl company websites, extract contact details, validate email infrastructure, organize leads, and export results from a desktop-first interface.

> MorfEmail is intended for legitimate B2B research using public business information. It must not be used to bypass authentication, CAPTCHAs, anti-bot protections, private pages, or access controls.

## What MorfEmail does

MorfEmail combines business discovery, web crawling, structured extraction, validation, deduplication, and local persistence in a single workflow:

```text
Country / Region / City / Category
              ↓
   Business Discovery Sources
              ↓
        Crawling Queue
              ↓
     HTTP + Cheerio parser
              ↓
 Playwright fallback for JS pages
              ↓
        MorfExtractor
              ↓
 Email / Phone / WhatsApp / Socials
              ↓
  DNS / MX / SMTP validation
              ↓
     Deduplication + SQLite
              ↓
        MorfEmail UI
```

## Main features

- Country, region, city, and business-category search
- Public business website discovery
- Website crawling and contact-page traversal
- Public email extraction
- Phone number extraction and international normalization
- Public WhatsApp link extraction
- Facebook, Instagram, LinkedIn, X/Twitter, TikTok, and YouTube discovery
- Address and Schema.org / JSON-LD extraction
- Email syntax, DNS, MX, Null MX, SMTP, catch-all, disposable-domain, and free-provider checks
- Batch email verification
- Lead deduplication
- CSV, XLSX, JSON, and TXT export workflows
- Pause, resume, cancel, retries, and rate-control architecture
- Local-first desktop architecture

## Open-source stack

MorfEmail uses and is being integrated around the following open-source components:

| Project | Purpose |
| --- | --- |
| Tauri 2 | Windows desktop shell |
| React + TypeScript | Desktop UI |
| Crawlee | Crawling orchestration, queues, retries, and request lifecycle |
| Playwright | Rendering JavaScript-heavy websites |
| Cheerio | Fast HTML parsing and extraction |
| better-sqlite3 | Local SQLite persistence |
| libphonenumber-js | International phone parsing and normalization |
| tldts | Domain and public-suffix normalization |
| robots-parser | robots.txt policy parsing |
| p-queue | Concurrency and rate-control helpers |
| Hickory Resolver | Native DNS/MX resolution in the Tauri backend |
| OpenStreetMap / Overpass | Public business discovery for local development and supported discovery flows |

Crawl4AI remains an optional future intelligent-extraction layer. The core application must continue to work without AI.

## Repository structure

```text
MorfEmail/
├── src/                  # React UI
├── engine/
│   ├── crawler/          # Crawling and request orchestration
│   ├── discovery/        # Business/URL discovery providers
│   ├── extraction/       # MorfExtractor and contact extractors
│   ├── validation/       # Email validation engine
│   ├── normalization/    # URL/domain/phone normalization
│   └── database/         # Local persistence adapters
├── server/               # Local development engine/API
├── src-tauri/            # Tauri/Rust Windows backend
├── tests/                # Automated tests
├── docs/                 # Technical documentation and roadmaps
└── exports/              # Export-related resources
```

## Local development

### Requirements

- Node.js 20+
- npm
- Rust stable toolchain for Tauri checks/builds
- Windows is the primary desktop target

### Install dependencies

```bash
npm install
```

### Install Chromium for Playwright

```bash
npm run setup:browser
```

### Start localhost

```bash
npm run dev
```

Default development endpoints:

- Web UI: `http://127.0.0.1:3000`
- Local engine API: `http://127.0.0.1:3100`
- Health check: `http://127.0.0.1:3100/api/health`

### Quality checks

```bash
npm run lint
npm test
npm run build
cargo check --manifest-path src-tauri/Cargo.toml
```

## Discovery and crawling policy

MorfEmail should only process public business information and must use respectful crawling practices.

The crawler should:

- respect configured concurrency and per-domain limits;
- respect robots.txt where applicable;
- cache and deduplicate requests;
- retry transient failures with backoff;
- record source URLs and discovery timestamps;
- mark blocked/restricted sources instead of attempting circumvention.

MorfEmail must not implement CAPTCHA bypass, credential theft, authenticated/private-page scraping, fingerprint spoofing, Cloudflare/access-control bypass, or proxy rotation intended to evade restrictions.

## Email validation

The email validation engine is designed around real technical signals rather than fabricated confidence values.

Validation signals include:

- syntax and normalization;
- domain existence;
- MX records;
- Null MX (RFC 7505);
- disposable-domain detection;
- free-email-provider classification;
- optional SMTP reachability and recipient response;
- catch-all detection;
- greylisting and temporary-response handling.

`UNKNOWN` is not treated as `INVALID`. Timeouts, blocked port 25, firewalls, anti-verification behavior, or inconclusive SMTP responses should remain inconclusive.

## Local-first architecture

The goal is for most crawling, extraction, validation, and lead storage to run locally on the user's machine.

Cloud/backend services are intended primarily for features such as:

- authentication;
- subscriptions and licensing;
- plan/quota management;
- device activation;
- update metadata;
- optional remote configuration.

Lead databases should not be uploaded automatically.

## Current development status

MorfEmail is under active development.

The current focus is to validate the complete localhost pipeline before final Windows packaging:

1. Real discovery
2. Crawling and browser fallback
3. Contact extraction
4. Email validation
5. Real SQLite persistence
6. End-to-end localhost testing
7. Tauri Windows packaging
8. Licensing and production release hardening

Some modules in the repository may still be transitional while the localhost pipeline is being validated. Do not treat a dependency being present as proof that its complete production integration has already been certified.

## Documentation

Additional technical notes and implementation status live in the `docs/` directory.

Notable areas include:

- email validation architecture;
- open-source stack decisions;
- localhost validation roadmap;
- crawler and persistence architecture.

## License

The MorfEmail application code is proprietary unless a file states otherwise.

Third-party open-source dependencies retain their respective licenses.

---

**MorfEmail — Find. Organize. Connect.**
