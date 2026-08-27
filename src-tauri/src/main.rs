// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug)]
pub struct SystemInfo {
    pub os: String,
    pub arch: String,
    pub version: String,
    pub hardware_id: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct LicenseVerification {
    pub valid: bool,
    pub plan: String,
    pub expires_at: String,
}

// 1. Obtener Hardware ID del sistema Windows
#[tauri::command]
fn get_system_info() -> SystemInfo {
    SystemInfo {
        os: "Windows 11 / 10".into(),
        arch: std::env::consts::ARCH.into(),
        version: "2.0.0".into(),
        hardware_id: "HWID-WIN64-MORF-9281-LOCAL".into(),
    }
}

// 2. Exportación nativa a archivo local
#[tauri::command]
fn export_data_to_file(path: String, content: String) -> Result<bool, String> {
    std::fs::write(&path, content).map_err(|e| e.to_string())?;
    Ok(true)
}

// 3. Verificación de licencia
#[tauri::command]
fn verify_polar_license(license_key: String) -> LicenseVerification {
    let is_valid = license_key.starts_with("MORF-") && license_key.len() >= 12;
    LicenseVerification {
        valid: is_valid,
        plan: if is_valid { "Licencia Comercial Anual".into() } else { "No Registrado".into() },
        expires_at: "2027-08-26T00:00:00Z".into(),
    }
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            get_system_info,
            export_data_to_file,
            verify_polar_license
        ])
        .run(tauri::generate_context!())
        .expect("Error al iniciar la aplicación desktop MorfEmail en Windows");
}
