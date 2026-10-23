//! Typst Math — a small Tauri shell around the Typst CLI.
//!
//! The webview owns the editor and the preview; the Rust side only compiles the
//! expression and hands the SVG back. Platform start-up fixes live in
//! [`platform`] and the command itself in [`commands`].

mod commands;
mod platform;
mod render;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    platform::normalise_dpi();

    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![commands::render_math])
        .run(tauri::generate_context!())
        .expect("error while running typst-math");
}
