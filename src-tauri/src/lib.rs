use std::fs;
use std::process::Command;
use std::path::PathBuf;
use std::env;

#[tauri::command]
async fn execute_cpp(code: String) -> Result<String, String> {
    // 1. Dapatkan direktori temporary sistem
    let mut temp_dir = env::temp_dir();
    let source_file = temp_dir.join("lkpj_main.cpp");
    
    #[cfg(target_os = "windows")]
    let exe_file = temp_dir.join("lkpj_main.exe");
    
    #[cfg(not(target_os = "windows"))]
    let exe_file = temp_dir.join("lkpj_main");

    // 2. Tulis kode ke file .cpp
    if let Err(e) = fs::write(&source_file, code) {
        return Err(format!("Gagal menulis file source: {}", e));
    }

    // 3. Compile dengan g++
    let compile_output = Command::new("g++")
        .arg(source_file.to_str().unwrap())
        .arg("-o")
        .arg(exe_file.to_str().unwrap())
        .output()
        .map_err(|e| format!("Gagal memanggil kompilator (pastikan g++ terinstal): {}", e))?;

    // Jika terjadi error kompilasi
    if !compile_output.status.success() {
        let error_msg = String::from_utf8_lossy(&compile_output.stderr);
        return Err(format!("--- EROR KOMPILASI ---\n{}", error_msg));
    }

    // 4. Eksekusi file hasil build
    let run_output = Command::new(&exe_file)
        .output()
        .map_err(|e| format!("Kompilasi sukses, tapi eksekusi program gagal: {}", e))?;

    // Kumpulkan stdout dan stderr
    let stdout = String::from_utf8_lossy(&run_output.stdout).to_string();
    let stderr = String::from_utf8_lossy(&run_output.stderr).to_string();

    let mut final_result = stdout;
    if !stderr.is_empty() {
        final_result.push_str("\n[Runtime Error/Warning]:\n");
        final_result.push_str(&stderr);
    }
    
    Ok(final_result)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![execute_cpp])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
