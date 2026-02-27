mod commands;

use commands::config::{detect_npm_registry, read_openclaw_config, test_api_connection, write_openclaw_config};
use commands::detect::detect_environment;
use commands::download::download_dependency;
use commands::install::{install_dependency, install_openclaw};
use commands::resources::{extract_bundled_openclaw, get_mirrors, list_bundled_resources};
use commands::service::{gateway_start, gateway_stop, gateway_restart, gateway_status};
use commands::doctor::run_doctor;

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
            list_bundled_resources,
            get_mirrors,
            extract_bundled_openclaw,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
