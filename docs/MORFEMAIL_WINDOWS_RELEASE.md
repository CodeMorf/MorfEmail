# MorfEmail para Windows

## Instalador

El instalador NSIS x64 generado es:

`src-tauri/target/release/bundle/nsis/MorfEmail_2.2.1_x64-setup.exe`

Incluye la interfaz MorfEmail, el motor Node local, SQLite, Playwright, JSDOM y Chromium. El cliente no necesita instalar Node ni otro servidor.

## Licencia

La compra y recuperación de claves se realiza en [codemorf.tech/license/](https://codemorf.tech/license/). Cada cliente recibe su propia clave y debe pegarla en MorfEmail para desbloquear el panel. La aplicación consulta la licencia central, muestra plan, activación, vencimiento y tiempo restante, y bloquea el uso sin una licencia válida.

## Datos y privacidad local

El motor usa una base SQLite dentro de la carpeta de datos de aplicación de cada usuario de Windows. Dos usuarios de Windows tienen datos separados; reinstalar la aplicación con el mismo usuario conserva esa carpeta salvo que se elimine manualmente.

## Segundo plano y avisos

Una búsqueda puede enviarse a segundo plano. El motor continúa ejecutándose y, al terminar, actualiza resultados/historial, muestra una notificación dentro de MorfEmail y solicita la notificación nativa de Windows cuando está disponible.

## Verificación realizada

- `npm run lint`: correcto.
- Suite de validación: 77 pasadas, 0 fallos.
- Runtime instalado: `/api/health` correcto con SQLite.
- Instalación silenciosa del NSIS: correcta; ejecutable, desinstalador, runtime y Chromium extraídos.
- SHA-256 del instalador: `4AB90912B616575FE3B333FB640E15D62260E6EF81D9F120FB7609BC6D444526`.

El instalador aún no está firmado con un certificado de CodeMorf (`NotSigned`). Para distribución comercial falta aplicar el certificado Authenticode de Windows y su timestamp.
