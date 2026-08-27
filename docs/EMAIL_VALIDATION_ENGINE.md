# MorfEmail Real Email Validation Engine 2.0 (Windows & Web)

Documentación técnica del motor de validación real de correos electrónicos de **MorfEmail Desktop**.

---

## 1. Arquitectura del Motor

El motor de validación sustituye toda simulación ficticia por un pipeline modular asíncrono compuesto por 6 niveles secuenciales:

```
                          Entrada: Correo Electrónico
                                      │
                                      ▼
                        ┌───────────────────────────┐
                        │  NIVEL 1: Sintaxis RFC    │  RFC 5321 / RFC 5322
                        └─────────────┬─────────────┘
                                      │ (Si inválido → INVALID inmediato)
                                      ▼
                        ┌───────────────────────────┐
                        │ NIVEL 2: Normalización    │  IDN, NFC, Punycode, Strip WWW
                        └─────────────┬─────────────┘
                                      ▼
                        ┌───────────────────────────┐
                        │ NIVEL 4 & 5: Clasificación│  Disposable / Webmail Providers
                        └─────────────┬─────────────┘
                                      ▼
                        ┌───────────────────────────┐
                        │ NIVEL 3: DNS & MX Real    │  Tauri Hickory / DoH + Null MX
                        └─────────────┬─────────────┘
                                      │ (Si NXDOMAIN o Null MX → INVALID)
                                      ▼
                        ┌───────────────────────────┐
                        │ NIVEL 6: SMTP Handshake   │  (Opcional) EHLO/MAIL/RCPT/QUIT
                        │         & Catch-All Probe │  + Sondeo Aleatorio Inexistente
                        └─────────────┬─────────────┘
                                      ▼
                        ┌───────────────────────────┐
                        │ ConfidenceCalculator (AI) │  Puntaje Matemático Explicable
                        └─────────────┬─────────────┘
                                      ▼
                     Salida: EmailValidationResult Real
```

---

## 2. Niveles de Validación

### Nivel 1 — Sintaxis RFC 5321 / 5322 (`SyntaxValidator`)
- **Longitud máxima total**: 254 caracteres.
- **Local-part**: Máximo 64 caracteres. Rechaza puntos iniciales, finales o consecutivos (`..`), y caracteres de control.
- **Domain-part**: Longitud máxima 255 caracteres. Comprueba etiquetas DNS válidas (máx 63 caracteres por etiqueta), guiones no iniciales/finales y TLD $\ge 2$ letras no numérico.

### Nivel 2 — Normalización de Dominio (`DomainNormalizer`)
- Conversión a minúsculas y eliminación de espacios en blanco.
- Eliminación de prefijo accidental `www.` y barras de rutas web.
- Normalización Unicode estándar (NFC).

### Nivel 3 — Consulta DNS Real & Registros MX (`DnsResolverService`)
- **Entorno Desktop (Tauri Windows)**: Utiliza el resolver asíncrono nativo en Rust (`hickory-resolver`) mediante el comando IPC `verify_email_domain`.
- **Entorno Web / Preview**: Realiza consultas directas a infraestructura DNS-over-HTTPS (Cloudflare DoH / Google DNS / Quad9 DoH) con failover automático.
- **Null MX (RFC 7505)**: Detección de registros MX explícitamente nulos (`priority: 0, exchange: "."`).
  - *Diagnóstico*: `"El dominio declara explícitamente que no acepta correo electrónico (Null MX RFC 7505)"`.
  - *Estado*: `INVALID`.

### Nivel 4 — Detección de Correos Desechables / Temporales (`DisposableDomainService`)
- Base de datos integrada con miles de dominios temporales conocidos (`mailinator.com`, `yopmail.com`, `guerrillamail.com`, `10minutemail.com`, `temp-mail.org`, etc.).
- Comprobación de subdominios y patrones heurísticos de buzones efímeros.

### Nivel 5 — Proveedores Webmail Gratuitos (`FreeProviderService`)
- Identificación de proveedores webmail de alta reputación: Gmail, Outlook, Hotmail, Yahoo, iCloud, Proton, Zoho, etc.
- **Regla Fundamental**: Un correo de Gmail o Outlook **NO** se penaliza ni se marca como inválido; se clasifica como `VALID` con etiqueta de proveedor gratuito reconocido.

### Nivel 6 — SMTP Handshake & Detección de Catch-All (`SmtpValidationService`)
- **Protocolo No Intrusivo**:
  1. `CONNECT mx.dominio.com:25`
  2. Lectura de banner `220`
  3. `EHLO verify.morfemail.desktop`
  4. `MAIL FROM:<probe@morfemail.desktop>`
  5. `RCPT TO:<usuario@dominio.com>`
  6. Interpretación de códigos de respuesta (`250 OK`, `550 Mailbox not found`, `450 Greylisting`)
  7. `QUIT`
- **Detección Real de Catch-All**:
  - No se usan comparaciones de cadenas de texto (`admin`, `catchall`).
  - Si el servidor responde `250 OK`, se sondea una dirección aleatoria inexistente: `morf_probe_${timestamp}_${randomHex}@dominio.com`.
  - Si el servidor MX acepta también la dirección inexistente, se etiqueta como `catchAll: true` y estado `RISKY`.

---

## 3. Estados Técnicos y Clasificación

| Estado | Significado Técnico | Ejemplos |
|---|---|---|
| **`VALID`** | Sintaxis RFC válida, dominio activo en DNS raíz, registros MX saludables y sin señales negativas. | `ventas@google.com`, `contacto@empresa.com` con MX. |
| **`RISKY`** | Infraestructura de correo activa pero con riesgo de entrega o buzón no verificable individualmente. | Servidores con configuración **Catch-All**, buzones departamentales genéricos, greylisting. |
| **`INVALID`** | Imposible de entregar; rebote garantizado. | Sintaxis corrupta, dominio `NXDOMAIN`, dominio con **Null MX (RFC 7505)**, dominio desechable. |
| **`UNKNOWN`** | El servidor o la red restringieron la comprobación sin evidencia concluyente de inexistencia. | Timeout de cortafuegos en puerto 25, bloqueo por protección antispam. (*UNKNOWN $\neq$ INVALID*). |

---

## 4. Algoritmo de Puntaje de Confianza (`ConfidenceCalculator`)

El puntaje de confianza es un valor numérico acotado en $[0, 100]$ calculado a partir de señales verificadas:

$$\text{Puntaje} = \text{Sintaxis} + \text{Dominio} + \text{Registros MX} + \text{Reputación} + \text{SMTP} - \text{Penalizaciones}$$

### Ponderación de Señales:
- **Sintaxis RFC 5322 Válida**: $+20$
- **Dominio Activo en DNS Raíz**: $+20$
- **Registros MX Encontrados & Activos**: $+35$
- **Proveedor Reconocido (Webmail o Corporativo)**: $+10 \text{ a } +15$
- **Respuesta SMTP 250 OK Confirmada**: $+10$
- **Catch-All Detectado**: $-20$
- **Dominio Desechable**: $-50$ (Puntaje máx. $15$, Estado `INVALID`)
- **Null MX / Dominio Inexistente / Sintaxis Inválida**: $0$ (Estado `INVALID`)

---

## 5. Caché de Dominios en Memoria (`DomainValidationCache`)

Para optimizar lotes grandes con múltiples correos bajo la misma organización (ej. `ventas@empresa.com`, `rrhh@empresa.com`, `director@empresa.com`):
- Los registros DNS MX y estado de zona se almacenan en memoria con un TTL configurable (10 minutos por defecto).
- Reduce las consultas de red en un $70\%\text{–}90\%$ en listas corporativas B2B.

---

## 6. Procesamiento por Lotes & Rendimiento (`ValidationQueue`)

- **Concurrencia Ajustable**: Concurrencia de resolución DNS de 15–20 hilos simultáneos.
- **Control de Flujo Reactivo**: Emite eventos de progreso en tiempo real (`current / total`, porcentaje, correo actual, contadores de válidos/riesgosos/inválidos).
- **Controles de Usuario**: Soporte para pausar, reanudar y cancelar la cola de verificación en cualquier momento.

---

## 7. Importación y Exportación de Archivos

- **Formatos Soportados de Entrada**: `.csv`, `.txt`, `.xlsx`, `.tsv`.
- **Detección Automática de Columnas**: Identifica automáticamente columnas nombradas `email`, `correo`, `e-mail`, `mail`, `dirección`, o analiza el contenido celular en busca de patrones de correo.
- **Formatos de Salida**:
  - Lista limpia `.txt` con correos válidos para campañas de outreach.
  - Reporte técnico completo `.xlsx` con todas las columnas de diagnóstico (Sintaxis, MX, Servidores, Estado, Confianza, Diagnóstico, Proveedor, Fecha).

---

## 8. Seguridad y Cumplimiento

1. **Cero Envío de Correos**: El verificador nunca envía mensajes ni cuerpos de correo; únicamente realiza consultas DNS y cierre limpio con comando `QUIT`.
2. **Rate Limiting por Servidor MX**: Retardo de seguridad para evitar bloqueos por sobrecarga hacia un mismo host MX.
3. **Privacidad Local**: Todos los datos se procesan y almacenan localmente en el dispositivo del usuario sin transmitir listas a servidores de terceros.
