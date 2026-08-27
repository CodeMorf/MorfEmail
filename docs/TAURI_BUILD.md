# Guía de Compilación para Windows (Tauri 2)

Instrucciones para compilar MorfEmail como ejecutable `.exe` y paquete de instalación `.msi` para Windows 10 y Windows 11.

---

## 1. Requisitos Previos en Windows

1. **Node.js**: v18.0 o superior (con npm).
2. **Rust**: Instalado mediante `rustup` ([https://rustup.rs](https://rustup.rs)) con target `x86_64-pc-windows-msvc`.
3. **Visual Studio C++ Build Tools**: Incluyendo el Windows 10/11 SDK.
4. **WebView2**: Viene preinstalado en Windows 10 (actualizado) y Windows 11.

---

## 2. Configuración del Entorno de Desarrollo

Instalar dependencias del proyecto:

```bash
npm install
```

Probar en modo de desarrollo desktop:

```bash
npx tauri dev
```

---

## 3. Generación del Instalador Windows (.exe / .msi)

Para compilar la versión de producción optimizada:

```bash
npx tauri build
```

Los binarios e instaladores generados se encontrarán en:

```text
src-tauri/target/release/bundle/
├── msi/
│   └── MorfEmail_2.0.0_x64_en-US.msi
└── nsis/
    └── MorfEmail_2.0.0_x64-setup.exe
```

---

## 4. Personalización de Iconos

Para generar todos los tamaños de iconos Windows a partir de una imagen `app-icon.png` (1024x1024):

```bash
npx tauri icon app-icon.png
```

Esto generará automáticamente los formatos requeridos en `src-tauri/icons/`:
- `icon.ico`
- `32x32.png`
- `128x128.png`
- `128x128@2x.png`
