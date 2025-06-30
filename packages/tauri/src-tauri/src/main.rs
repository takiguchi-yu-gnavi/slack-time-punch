#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::Manager;

// Command to open developer tools (called from JavaScript)
#[tauri::command]
fn open_devtools(window: tauri::WebviewWindow) -> String {
    println!("🛠️ DevTools request received");

    // Open developer tools in Tauri v2
    #[cfg(debug_assertions)]
    {
        window.open_devtools();
        println!("✅ DevTools opened successfully");
        return "DevTools opened successfully".to_string();
    }

    #[cfg(not(debug_assertions))]
    {
        println!("ℹ️ DevTools not available in production build");
        println!("💡 Use console logs for debugging instead");
        "Use console logs for debugging in production".to_string()
    }
}

// Command to output console logs
#[tauri::command]
fn log_to_console(message: String) {
    println!("📋 Frontend Log: {}", message);
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let mut builder = tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_deep_link::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .invoke_handler(tauri::generate_handler![open_devtools, log_to_console]);

    // macOS-specific single instance plugin
    #[cfg(target_os = "macos")]
    {
        builder = builder.plugin(tauri_plugin_single_instance::init(|app, argv, cwd| {
            println!("Single instance detected: {:?}, {:?}", argv, cwd);
            // Focus on existing window
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
                let _ = window.set_focus();
            }
        }));
    }

    builder
        .setup(|app| {
            let window = app.get_webview_window("main").unwrap();

            // Automatically open DevTools in development mode
            #[cfg(debug_assertions)]
            {
                window.open_devtools();
                println!("🛠️ DevTools auto-opened (debug mode)");
            }

            println!("🚀 Application startup complete");
            println!("📋 Debug info available in terminal/console logs");
            println!("💡 JavaScript console logs transferred via window.logToRust()");

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn main() {
    run();
}
