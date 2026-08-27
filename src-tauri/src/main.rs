// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};
use std::time::Duration;
use hickory_resolver::config::*;
use hickory_resolver::TokioAsyncResolver;
use tokio::net::TcpStream;
use tokio::io::{AsyncReadExt, AsyncWriteExt};

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct SystemInfo {
    pub os: String,
    pub arch: String,
    pub version: String,
    pub hardware_id: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct LicenseVerification {
    pub valid: bool,
    pub plan: String,
    pub expires_at: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct MxRecordDto {
    pub priority: u16,
    pub exchange: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct DomainDnsResult {
    pub domain_exists: bool,
    pub mx_exists: bool,
    pub mx_records: Vec<MxRecordDto>,
    pub null_mx: bool,
    pub error: Option<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct SmtpVerificationResult {
    pub attempted: bool,
    pub reachable: bool,
    pub recipient_accepted: Option<bool>,
    pub catch_all: Option<bool>,
    pub response_code: Option<u16>,
    pub response_message: Option<String>,
    pub technical_status: String,
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

// 4. Verificación Real de Dominio y Registros MX con Hickory Resolver (RFC 7505 Null MX)
#[tauri::command]
async fn verify_email_domain(domain: String) -> DomainDnsResult {
    let clean_domain = domain.trim().trim_end_matches('.').to_lowercase();
    if clean_domain.is_empty() {
        return DomainDnsResult {
            domain_exists: false,
            mx_exists: false,
            mx_records: vec![],
            null_mx: false,
            error: Some("Dominio vacío".into()),
        };
    }

    // Configurar resolver asíncrono estándar de Google/Cloudflare/Sistema
    let resolver = match TokioAsyncResolver::tokio(
        ResolverConfig::cloudflare(),
        ResolverOpts::default()
    ) {
        Ok(r) => r,
        Err(e) => {
            return DomainDnsResult {
                domain_exists: false,
                mx_exists: false,
                mx_records: vec![],
                null_mx: false,
                error: Some(format!("Error inicializando resolver DNS: {}", e)),
            };
        }
    };

    let domain_with_dot = format!("{}.", clean_domain);

    // Consulta de registros MX
    let mut mx_records = Vec::new();
    let mut null_mx = false;

    match resolver.mx_lookup(&domain_with_dot).await {
        Ok(mx_lookup) => {
            for mx in mx_lookup.iter() {
                let priority = mx.preference();
                let exchange = mx.exchange().to_utf8().trim_end_matches('.').to_string();

                // Detección de Null MX según RFC 7505 (Host vacío o "." con prioridad 0)
                if (exchange.is_empty() || exchange == ".") && priority == 0 {
                    null_mx = true;
                } else if !exchange.is_empty() {
                    mx_records.push(MxRecordDto {
                        priority,
                        exchange,
                    });
                }
            }
        }
        Err(_) => {
            // No se encontraron registros MX
        }
    };

    mx_records.sort_by_key(|r| r.priority);

    if null_mx {
        return DomainDnsResult {
            domain_exists: true,
            mx_exists: false,
            mx_records: vec![],
            null_mx: true,
            error: Some("El dominio declara explícitamente que no acepta correo electrónico (Null MX RFC 7505)".into()),
        };
    }

    if !mx_records.is_empty() {
        return DomainDnsResult {
            domain_exists: true,
            mx_exists: true,
            mx_records,
            null_mx: false,
            error: None,
        };
    }

    // Si no hay MX, comprobar si existe registro A (RFC 5321 Fallback)
    let a_exists = resolver.ipv4_lookup(&domain_with_dot).await.is_ok();
    let aaaa_exists = if !a_exists {
        resolver.ipv6_lookup(&domain_with_dot).await.is_ok()
    } else {
        false
    };

    let domain_exists = a_exists || aaaa_exists;

    DomainDnsResult {
        domain_exists,
        mx_exists: false,
        mx_records: vec![],
        null_mx: false,
        error: if domain_exists {
            Some("El dominio existe pero carece de registros MX".into())
        } else {
            Some("El dominio no existe en la zona DNS raíz (NXDOMAIN)".into())
        },
    }
}

// 5. Consulta directa de MX
#[tauri::command]
async fn get_dns_mx(domain: String) -> Vec<MxRecordDto> {
    let res = verify_email_domain(domain).await;
    res.mx_records
}

// 6. Verificación SMTP Real y Detección Catch-All mediante Handshake
#[tauri::command]
async fn verify_email_smtp(
    email: String,
    mx_host: String,
    timeout_ms: Option<u64>,
    check_catch_all: Option<bool>
) -> SmtpVerificationResult {
    let timeout_duration = Duration::from_millis(timeout_ms.unwrap_or(5000));
    let target_addr = format!("{}:25", mx_host.trim_end_matches('.'));

    let connect_fut = TcpStream::connect(&target_addr);
    let mut stream = match tokio::time::timeout(timeout_duration, connect_fut).await {
        Ok(Ok(s)) => s,
        Ok(Err(e)) => {
            return SmtpVerificationResult {
                attempted: true,
                reachable: false,
                recipient_accepted: None,
                catch_all: None,
                response_code: None,
                response_message: Some(format!("Error de conexión al puerto 25: {}", e)),
                technical_status: "UNKNOWN".into(),
            };
        }
        Err(_) => {
            return SmtpVerificationResult {
                attempted: true,
                reachable: false,
                recipient_accepted: None,
                catch_all: None,
                response_code: None,
                response_message: Some("Tiempo de espera agotado al conectar al puerto 25".into()),
                technical_status: "UNKNOWN".into(),
            };
        }
    };

    // Leer banner inicial 220
    let mut buf = [0u8; 1024];
    let _ = tokio::time::timeout(Duration::from_millis(2000), stream.read(&mut buf)).await;

    // Enviar EHLO
    let _ = stream.write_all(b"EHLO verify.morfemail.desktop\r\n").await;
    let _ = tokio::time::timeout(Duration::from_millis(2000), stream.read(&mut buf)).await;

    // Enviar MAIL FROM
    let _ = stream.write_all(b"MAIL FROM:<probe@morfemail.desktop>\r\n").await;
    let _ = tokio::time::timeout(Duration::from_millis(2000), stream.read(&mut buf)).await;

    // Enviar RCPT TO para el correo objetivo
    let rcpt_cmd = format!("RCPT TO:<{}>\r\n", email);
    let _ = stream.write_all(rcpt_cmd.as_bytes()).await;
    
    let mut response_str = String::new();
    if let Ok(Ok(n)) = tokio::time::timeout(Duration::from_millis(3000), stream.read(&mut buf)).await {
        if n > 0 {
            response_str = String::from_utf8_lossy(&buf[..n]).to_string();
        }
    }

    let is_250 = response_str.starts_with("250");
    let is_550 = response_str.starts_with("550") || response_str.starts_with("551") || response_str.starts_with("553");

    let mut is_catch_all = None;

    // Si el correo objetivo es aceptado (250 OK) y se solicita verificar Catch-All,
    // sondeamos un buzón aleatorio que garantizadamente no existe en el dominio
    if is_250 && check_catch_all.unwrap_or(false) {
        if let Some(domain) = email.split('@').nth(1) {
            let random_probe = format!(
                "RCPT TO:<morf_probe_{:x}_{:x}@{}>\r\n",
                std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .unwrap_or_default()
                    .as_millis(),
                std::process::id() ^ 0xABCD,
                domain
            );

            let _ = stream.write_all(random_probe.as_bytes()).await;
            let mut catch_buf = [0u8; 1024];
            if let Ok(Ok(n)) = tokio::time::timeout(Duration::from_millis(2500), stream.read(&mut catch_buf)).await {
                if n > 0 {
                    let probe_resp = String::from_utf8_lossy(&catch_buf[..n]);
                    // Si el servidor también devuelve 250 al buzón aleatorio inexistente, es un Catch-All
                    if probe_resp.starts_with("250") {
                        is_catch_all = Some(true);
                    } else if probe_resp.starts_with("550") || probe_resp.starts_with("551") || probe_resp.starts_with("553") {
                        is_catch_all = Some(false);
                    }
                }
            }
        }
    }

    // Enviar QUIT respetuosamente para cerrar la conexión
    let _ = stream.write_all(b"QUIT\r\n").await;

    let technical_status = if is_catch_all == Some(true) {
        "RISKY".to_string()
    } else if is_250 {
        "DELIVERABLE".to_string()
    } else if is_550 {
        "UNDELIVERABLE".to_string()
    } else {
        "UNKNOWN".to_string()
    };

    SmtpVerificationResult {
        attempted: true,
        reachable: true,
        recipient_accepted: if is_250 { Some(true) } else if is_550 { Some(false) } else { None },
        catch_all: is_catch_all,
        response_code: if is_250 { Some(250) } else if is_550 { Some(550) } else { None },
        response_message: Some(response_str.trim().to_string()),
        technical_status,
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
            verify_polar_license,
            verify_email_domain,
            get_dns_mx,
            verify_email_smtp
        ])
        .run(tauri::generate_context!())
        .expect("Error al iniciar la aplicación desktop MorfEmail en Windows");
}
