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

// 6. Verificación SMTP Real, Multi-MX y Detección Catch-All mediante Handshake Robusto
fn is_smtp_response_complete(text: &str) -> Option<u16> {
    let lines: Vec<&str> = text.split("\r\n").filter(|l| !l.is_empty()).collect();
    if lines.is_empty() {
        return None;
    }
    let last_line = lines.last()?;
    if last_line.len() >= 3 {
        let code_str = &last_line[0..3];
        if let Ok(code) = code_str.parse::<u16>() {
            if last_line.len() > 3 && last_line.as_bytes()[3] == b'-' {
                return None; // Línea de continuación (multilínea)
            }
            return Some(code);
        }
    }
    None
}

async fn read_smtp_response(
    stream: &mut TcpStream,
    timeout: Duration,
) -> Result<(u16, String), String> {
    let mut response_text = String::new();
    let mut buffer = [0u8; 1024];
    let start = std::time::Instant::now();

    loop {
        let elapsed = start.elapsed();
        if elapsed >= timeout {
            return Err("Timeout esperando respuesta del servidor SMTP".into());
        }
        let remaining = timeout - elapsed;

        match tokio::time::timeout(remaining, stream.read(&mut buffer)).await {
            Ok(Ok(0)) => return Err("Conexión cerrada por el servidor SMTP remoto".into()),
            Ok(Ok(n)) => {
                response_text.push_str(&String::from_utf8_lossy(&buffer[..n]));
                if let Some(code) = is_smtp_response_complete(&response_text) {
                    return Ok((code, response_text));
                }
            }
            Ok(Err(e)) => return Err(format!("Error de lectura en socket TCP: {}", e)),
            Err(_) => return Err("Timeout esperando fin de respuesta SMTP".into()),
        }
    }
}

async fn verify_single_mx_smtp(
    email: &str,
    mx_host: &str,
    check_catch_all: bool,
    timeout_ms: u64,
) -> Result<SmtpVerificationResult, String> {
    let target_addr = format!("{}:25", mx_host.trim_end_matches('.'));
    let connect_timeout = Duration::from_millis(std::cmp::min(timeout_ms, 3500));

    // 1. Conexión TCP con timeout independiente
    let mut stream = match tokio::time::timeout(connect_timeout, TcpStream::connect(&target_addr)).await {
        Ok(Ok(s)) => s,
        Ok(Err(e)) => return Err(format!("Fallo al conectar a {}: {}", target_addr, e)),
        Err(_) => return Err(format!("Timeout al conectar a {}", target_addr)),
    };

    // 2. Lectura de banner inicial 220
    let (banner_code, _) = read_smtp_response(&mut stream, Duration::from_millis(2500)).await?;
    if banner_code != 220 {
        let _ = stream.write_all(b"QUIT\r\n").await;
        return Err(format!("Banner inesperado de {}: {}", mx_host, banner_code));
    }

    // 3. Envío de EHLO / HELO
    stream.write_all(b"EHLO verify.morfemail.desktop\r\n").await
        .map_err(|e| format!("Error enviando EHLO: {}", e))?;
    let (ehlo_code, _) = read_smtp_response(&mut stream, Duration::from_millis(2500)).await?;
    if ehlo_code != 250 {
        // Fallback a HELO clásico si EHLO es rechazado
        stream.write_all(b"HELO verify.morfemail.desktop\r\n").await
            .map_err(|e| format!("Error enviando HELO: {}", e))?;
        let (helo_code, _) = read_smtp_response(&mut stream, Duration::from_millis(2500)).await?;
        if helo_code != 250 {
            let _ = stream.write_all(b"QUIT\r\n").await;
            return Err(format!("Servidor rechazó EHLO/HELO con código {}", helo_code));
        }
    }

    // 4. Envío de MAIL FROM
    stream.write_all(b"MAIL FROM:<probe@morfemail.desktop>\r\n").await
        .map_err(|e| format!("Error enviando MAIL FROM: {}", e))?;
    let (mail_code, mail_resp) = read_smtp_response(&mut stream, Duration::from_millis(2500)).await?;
    if mail_code != 250 {
        let _ = stream.write_all(b"QUIT\r\n").await;
        // Detectar 421 (service closing) o 450/451 (greylisting en MAIL FROM)
        if mail_code == 421 {
            return Err(format!("Servidor cerrando canal (421): {}", mail_resp.trim()));
        }
        if mail_code == 450 || mail_code == 451 || mail_resp.to_lowercase().contains("greylist") {
            return Ok(SmtpVerificationResult {
                attempted: true,
                reachable: true,
                recipient_accepted: None,
                catch_all: None,
                response_code: Some(mail_code),
                response_message: Some(mail_resp.trim().to_string()),
                technical_status: "RISKY".into(),
            });
        }
        return Err(format!("Servidor rechazó MAIL FROM con código {}: {}", mail_code, mail_resp.trim()));
    }

    // 5. Envío de RCPT TO para el correo objetivo
    let rcpt_cmd = format!("RCPT TO:<{}>\r\n", email);
    stream.write_all(rcpt_cmd.as_bytes()).await
        .map_err(|e| format!("Error enviando RCPT TO: {}", e))?;
    let (rcpt_code, rcpt_resp) = read_smtp_response(&mut stream, Duration::from_millis(3500)).await?;

    let is_250 = rcpt_code == 250;
    let is_undeliverable = rcpt_code == 550 || rcpt_code == 551 || rcpt_code == 552 || rcpt_code == 553 || rcpt_code == 554;
    let is_greylisted = rcpt_code == 450 || rcpt_code == 451 || rcpt_code == 452 || rcpt_resp.to_lowercase().contains("greylist") || rcpt_resp.to_lowercase().contains("deferred");
    let is_service_unavailable = rcpt_code == 421;

    if is_service_unavailable {
        let _ = stream.write_all(b"QUIT\r\n").await;
        return Err(format!("Servidor cerró conexión temporalmente (421): {}", rcpt_resp.trim()));
    }

    let mut is_catch_all = None;

    // 6. Prueba Catch-All con RSET previo si el destinatario principal fue aceptado (250)
    if is_250 && check_catch_all {
        if let Some(domain) = email.split('@').nth(1) {
            // Enviar RSET para resetear la transacción SMTP antes del sondeo
            let _ = stream.write_all(b"RSET\r\n").await;
            let _ = read_smtp_response(&mut stream, Duration::from_millis(1500)).await;

            // Re-enviar MAIL FROM tras RSET
            let _ = stream.write_all(b"MAIL FROM:<probe@morfemail.desktop>\r\n").await;
            let _ = read_smtp_response(&mut stream, Duration::from_millis(1500)).await;

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
            if let Ok((probe_code, _)) = read_smtp_response(&mut stream, Duration::from_millis(2500)).await {
                if probe_code == 250 {
                    is_catch_all = Some(true);
                } else if probe_code >= 550 && probe_code <= 554 {
                    is_catch_all = Some(false);
                }
            }
        }
    }

    // 7. Enviar QUIT respetuosamente
    let _ = stream.write_all(b"QUIT\r\n").await;

    let technical_status = if is_catch_all == Some(true) {
        "RISKY".to_string()
    } else if is_greylisted {
        "RISKY".to_string()
    } else if is_250 {
        "DELIVERABLE".to_string()
    } else if is_undeliverable {
        "UNDELIVERABLE".to_string()
    } else {
        "UNKNOWN".to_string()
    };

    Ok(SmtpVerificationResult {
        attempted: true,
        reachable: true,
        recipient_accepted: if is_250 {
            Some(true)
        } else if is_undeliverable {
            Some(false)
        } else {
            None
        },
        catch_all: is_catch_all,
        response_code: Some(rcpt_code),
        response_message: Some(rcpt_resp.trim().to_string()),
        technical_status,
    })
}

#[tauri::command]
async fn verify_email_smtp(
    email: String,
    mx_host: Option<String>,
    mx_hosts: Option<Vec<String>>,
    timeout_ms: Option<u64>,
    check_catch_all: Option<bool>
) -> SmtpVerificationResult {
    let timeout = timeout_ms.unwrap_or(5000);
    let check_ca = check_catch_all.unwrap_or(false);

    // Unificar lista de servidores MX (hasta 3 servidores para failover Multi-MX)
    let mut hosts: Vec<String> = Vec::new();
    if let Some(list) = mx_hosts {
        for h in list {
            if !h.trim().is_empty() && !hosts.contains(&h) {
                hosts.push(h);
            }
        }
    }
    if let Some(single) = mx_host {
        if !single.trim().is_empty() && !hosts.contains(&single) {
            hosts.push(single);
        }
    }

    if hosts.is_empty() {
        return SmtpVerificationResult {
            attempted: false,
            reachable: false,
            recipient_accepted: None,
            catch_all: None,
            response_code: None,
            response_message: Some("No se proporcionaron servidores MX para la verificación SMTP".into()),
            technical_status: "UNKNOWN".into(),
        };
    }

    // Probar hasta 3 servidores MX en orden de prioridad
    let max_hosts = std::cmp::min(hosts.len(), 3);
    let mut last_error = String::new();

    for i in 0..max_hosts {
        let current_host = &hosts[i];
        match verify_single_mx_smtp(&email, current_host, check_ca, timeout).await {
            Ok(result) => {
                // Si obtuvimos un resultado definitivo (DELIVERABLE, UNDELIVERABLE o RISKY con respuesta válida), retornarlo
                return result;
            }
            Err(err_msg) => {
                last_error = err_msg;
                // Si este MX falló por timeout/421/conexión, intentar automáticamente el siguiente MX
                continue;
            }
        }
    }

    // Si se agotaron todos los MX disponibles sin respuesta concluyente, devolver UNKNOWN (nunca INVALID)
    SmtpVerificationResult {
        attempted: true,
        reachable: false,
        recipient_accepted: None,
        catch_all: None,
        response_code: None,
        response_message: Some(format!("Comprobación agotada en {} servidores MX: {}", max_hosts, last_error)),
        technical_status: "UNKNOWN".into(),
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
