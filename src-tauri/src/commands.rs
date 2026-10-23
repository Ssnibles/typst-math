//! Tauri commands exposed to the webview.

use crate::render;

/// Compile a Typst maths expression and return the SVG for the webview to show.
#[tauri::command]
pub async fn render_math(source: String, colour: String) -> Result<String, String> {
    tauri::async_runtime::spawn_blocking(move || render::compile(&source, &colour))
        .await
        .map_err(|error| format!("render task failed: {error}"))?
}
