mod commands;

use commands::config::{detect_npm_registry, read_openclaw_config, test_api_connection, write_openclaw_config};
use commands::detect::detect_environment;
use commands::download::download_dependency;
use commands::install::{install_dependency, install_openclaw};
use commands::models::{get_available_providers, get_model_presets, get_model_usage_stats, validate_model_parameters};
use commands::service::{gateway_start, gateway_stop, gateway_restart, gateway_status};
use commands::doctor::run_doctor;
use commands::troubleshoot::{fix_issue, run_diagnostics};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            detect_environment,
            download_dependency,
            install_dependency,
            install_openclaw,
            write_openclaw_config,
            read_openclaw_config,
            detect_npm_registry,
            test_api_connection,
            gateway_start,
            gateway_stop,
            gateway_restart,
            gateway_status,
            run_doctor,
            get_available_providers,
            get_model_presets,
            get_model_usage_stats,
            validate_model_parameters,
            run_diagnostics,
            fix_issue,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
