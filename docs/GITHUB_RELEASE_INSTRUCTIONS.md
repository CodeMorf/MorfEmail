# Publicar nuevas versiones de MorfEmail desde GitHub

Guía para el responsable de CodeMorf. Está escrita para este repositorio y su flujo real de Tauri para Windows.

## Estado de referencia

- Rama principal: main.
- Versión de referencia: 2.2.1.
- Commit de referencia: se publicará con esta versión.
- Workflow de integración: .github/workflows/ci.yml.
- Workflow de instalador: .github/workflows/release-windows.yml.
- Instalador generado: src-tauri/target/release/bundle/nsis/MorfEmail_<versión>_x64-setup.exe.
- El workflow de release se ejecuta cuando se publica una etiqueta con formato v*, por ejemplo v2.2.1.

El repositorio actual es privado. Un enlace de un Release privado no es un enlace de descarga comercial para cualquier cliente: el cliente necesitaría permisos de GitHub. Para vender MorfEmail, el instalador debe publicarse mediante el portal de CodeMorf, un CDN o un Release público separado, manteniendo la activación de licencia en https://codemorf.tech/license/.

## Regla principal

Cada versión debe ser reproducible, comprobada y reversible. No se debe mover una etiqueta existente ni reemplazar un instalador ya publicado. Si hay un problema, se conserva la versión anterior y se publica una versión correctiva nueva.

## Proceso recomendado para una nueva versión

### 1. Preparar una rama

Desde PowerShell, en la carpeta del repositorio:

~~~
Set-Location "C:\ruta\al\MorfEmail"
git status --short --branch
git fetch origin --tags
git switch main
git pull --ff-only origin main
git switch -c release/v2.2.1
~~~

Si git status muestra cambios que no pertenecen a esta versión, detenerse y guardarlos de forma separada. No usar reset --hard, clean -fd ni sobrescribir trabajo ajeno.

### 2. Cambiar la versión en todos los archivos del producto

Actualizar el mismo número, por ejemplo 2.2.1, en:

- package.json;
- package-lock.json mediante npm;
- src-tauri/tauri.conf.json;
- src-tauri/Cargo.toml.

Después comprobar que no quedó 2.2.0 como versión del producto:

~~~
rg -n '2\.2\.0|2\.2\.1' package.json package-lock.json src-tauri/tauri.conf.json src-tauri/Cargo.toml
~~~

El archivo scripts/smoke-installer.ps1 tiene actualmente el nombre del instalador MorfEmail_2.2.0_x64-setup.exe escrito de forma fija. Al subir una versión nueva, actualizar ese nombre o ejecutar el smoke test apuntando manualmente al instalador real. Si se automatiza con frecuencia, conviene convertir ese nombre en un parámetro del script.

### 3. Ejecutar las comprobaciones locales

~~~
npm ci
npm run setup:browser
npm run lint
npm test
npm run build
npm run build:server
npm run test:runtime
cargo check --manifest-path src-tauri/Cargo.toml
~~~

Si se está en Windows con el entorno Tauri completo, generar el instalador:

~~~
npm run tauri:build
~~~

Comprobar que existe un instalador esperado:

~~~
$installer = Get-ChildItem "src-tauri\target\release\bundle\nsis\*-setup.exe" | Select-Object -First 1
if (-not $installer) { throw "No se generó el instalador NSIS" }
Get-FileHash -Algorithm SHA256 $installer.FullName
~~~

El instalador también debe probarse en una máquina o usuario de prueba: instalar, abrir MorfEmail, comprobar el runtime incluido, activar una licencia de prueba, crear un registro de demo, cerrar, abrir de nuevo y verificar que los datos siguen allí.

### 4. Revisar licencia y datos antes de publicar

La prueba mínima de aceptación es:

- sin licencia: solo aparece la pantalla de activación y el panel queda bloqueado;
- con una licencia válida: aparecen plan, fecha de activación, vencimiento y tiempo restante;
- con licencia vencida o revocada: se bloquea el panel y se conserva la opción de activar otra clave;
- la actualización no borra la base local, el historial, las listas ni las configuraciones del usuario;
- antes de instalar se recomienda copiar la carpeta local de datos como respaldo;
- una instalación nueva y otra cuenta de Windows no deben compartir los leads de la primera.

No se deben incluir API keys, tokens, cookies, bases de datos reales, conversaciones personales ni datos privados en el repositorio, el instalador, las capturas o el vídeo.

### 5. Commit, revisión y etiqueta

~~~
git diff --check
git status --short
git add package.json package-lock.json src-tauri/tauri.conf.json src-tauri/Cargo.toml docs
git commit -m "release: MorfEmail 2.2.1"
git push -u origin release/v2.2.1
~~~

Abrir un Pull Request hacia main, revisar el diff y esperar a que CI quede verde. Después de fusionar:

~~~
git switch main
git pull --ff-only origin main
git tag -a v2.2.1 -m "MorfEmail 2.2.1"
git push origin v2.2.1
~~~

La etiqueta dispara .github/workflows/release-windows.yml. Ese workflow instala Node 22, Chromium y dependencias, ejecuta lint y test, genera el instalador Tauri y publica el .exe en un GitHub Release.

### 6. Verificar el Release de GitHub

En GitHub comprobar:

1. El workflow terminó en verde.
2. El Release tiene la etiqueta correcta.
3. El .exe descargado abre y se instala.
4. El nombre del instalador contiene la versión correcta.
5. El SHA-256 del archivo descargado coincide con el hash calculado en el entorno de build.
6. La instalación conserva datos de una instalación anterior en una máquina de prueba.
7. El enlace que se entrega al cliente apunta al portal/CDN comercial, no a un artefacto privado de GitHub.

Guardar junto al release el hash SHA-256 y las notas de cambios. No anunciar la versión mientras el instalador no haya sido instalado y ejecutado después de descargarlo.

## Publicación para clientes

El flujo recomendado es:

1. El cliente compra o recupera su licencia desde CodeMorf License.
2. El portal entrega la clave y el enlace de descarga autorizado.
3. El cliente instala la versión de Windows.
4. MorfEmail valida la clave y desbloquea el panel.
5. Las nuevas versiones se descargan desde el mismo portal y se instalan encima de la anterior.
6. La licencia permanece asociada al cliente; la instalación no debe generar una licencia nueva ni borrar sus datos.

Si se habilitan actualizaciones automáticas en el futuro, primero publicar metadatos de actualización, comprobar firma/hash y ofrecer rollback. No descargar ni ejecutar un instalador sin verificar su firma o SHA-256.

## Rollback

Si una versión falla:

1. Desactivar temporalmente el enlace de descarga de la versión defectuosa.
2. Mantener disponible el instalador anterior.
3. No borrar ni reutilizar la etiqueta defectuosa.
4. Corregir en una rama nueva.
5. Publicar, por ejemplo, v2.2.2.
6. Repetir todas las comprobaciones antes de anunciarla.

## Criterio de salida

Una versión está lista para clientes solo cuando CI, instalador, licencia, conservación de datos, extracción, exportación y la prueba de actualización han sido comprobados en el ejecutable instalado. Un build verde o un HTTP 200 por sí solos no son suficientes.
