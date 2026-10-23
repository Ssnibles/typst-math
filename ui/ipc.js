import { TEXT_COLOUR } from "./dom.js";

/**
 * Ask the Rust side to compile a maths expression.
 *
 * The Tauri IPC bridge is only present when the page is served by the app; the
 * explicit error keeps the failure readable when `ui/index.html` is opened
 * directly in a browser.
 */
export function renderMath(source) {
  const invoke = window.__TAURI__?.core?.invoke;
  if (typeof invoke !== "function") {
    return Promise.reject(
      new Error(
        "Tauri IPC is unavailable. Start the app with `cargo run --manifest-path src-tauri/Cargo.toml` or `npm run tauri dev` instead of opening ui/index.html directly.",
      ),
    );
  }
  return invoke("render_math", { source, colour: TEXT_COLOUR });
}
