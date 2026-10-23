# typst-math

A tiny native app: type a Typst maths expression, see it typeset underneath.
The input is syntax-highlighted and the preview re-renders as you type
(debounced, ~120 ms).

Built with **Tauri v2**. The Rust side spawns the Typst CLI and hands the SVG it
returns to the webview, which displays it directly — no rasterisation step, so
the preview stays sharp at any window size. The frontend is plain HTML/CSS/JS
(no bundler, no runtime npm packages) and is embedded in the binary.

Two buttons in the editor header switch between a **stacked** layout (editor on
top, preview below) and a **side-by-side** one (editor as a full-height sidebar
you resize with the grip on the divider); the active one is highlighted. The
divider can also be resized with the arrow keys when focused.

## Layout

| file                        | what it does                                               |
| --------------------------- | ---------------------------------------------------------- |
| `src-tauri/src/lib.rs`      | Tauri setup and start-up wiring                            |
| `src-tauri/src/commands.rs` | the `render_math` command                                  |
| `src-tauri/src/render.rs`   | Typst CLI → SVG                                            |
| `src-tauri/src/platform.rs` | Native-Wayland/GTK DPI fix                                 |
| `ui/main.js`                | composes the modules and starts the app                    |
| `ui/config.js`              | shared constants and the default source                    |
| `ui/dom.js`                 | element lookups and the UI text colour                     |
| `ui/editor.js`              | textarea ↔ highlight layer, scroll mirroring               |
| `ui/highlight.js`           | Typst-maths tokenizer → coloured spans                     |
| `ui/layout.js`              | split layout, divider drag and keyboard resizing           |
| `ui/preview.js`             | SVG validation and fitting                                 |
| `ui/error-card.js`          | diagnostics card                                           |
| `ui/ipc.js`                 | Tauri IPC bridge                                           |
| `ui/renderer.js`            | debounced, single-flight rendering                         |
| `ui/style.css`              | theme, cards, dot-grid preview, editor overlay             |
| `ui/index.html`             | static shell                                               |

**Rendering.** `render.rs` pipes the expression into `typst compile - --format
svg -` inside this document:

```typst
#set page(width: auto, height: auto, margin: 4pt, fill: none)
#set text(size: 22pt, fill: rgb("<ui text colour>"))
$ <your expression> $
```

so there is no page-sized white box and the maths picks up the UI text colour.
The returned SVG is inserted into the preview and scaled to fit (up to 2× its
typeset size) with CSS/JS. Typst's diagnostics come back as the command error
and are shown in a card under the workspace.

**Highlighting.** The tokenizer produces coloured spans in a `<pre>` layer
sitting underneath a transparent `<textarea>`, so the editor gets real syntax
colouring while the browser keeps its native caret, selection, undo and IME
handling. The two layers share every font metric and scroll position.

**Native Wayland.** On some wlroots-based compositors (Mango, for example)
nothing sets GTK's `gtk-xft-dpi` or GDK's screen resolution, which stay at `-1`.
WebKitGTK then derives a negative device pixel ratio and a negative layout
viewport (`innerWidth = -width × 96`), collapsing every percentage-sized element
and leaving a blank window. `normalise_dpi()` in `platform.rs` sets both to the
standard 96 DPI before the webview is created, which fixes native Wayland
without falling back to XWayland. An explicitly configured HiDPI value is left
alone.

## Requirements

- The [Typst CLI](https://typst.app) (`typst`) on `PATH` — 0.13 or newer.
- A Rust toolchain.
- On Linux, GTK 3 + WebKitGTK 4.1 development packages. `shell.nix` provides
  them (plus the windowing/GL libraries and the GTK/WebKit runtime paths).
- Node/npm is **not** needed to build or run; it is only useful if you want the
  `tauri` CLI convenience scripts in `package.json`.

## Run

With Nix, the shell provides two convenience commands:

```sh
nix-shell
run     # debug build + launch
build   # release build; prints the binary path
```

They also work non-interactively:

```sh
nix-shell --run run
nix-shell --run build   # -> src-tauri/target/release/typst-math
```

Without Nix (with the usual GTK/WebKit dev packages installed):

```sh
cargo run --manifest-path src-tauri/Cargo.toml
cargo build --release --manifest-path src-tauri/Cargo.toml
```

Or from the Tauri CLI (installs dev dependencies first):

```sh
npm install
npm run tauri dev
npm run tauri build     # bundles an AppImage/deb/rpm, not the raw binary
```

## Notes

- Everything is stateless: no files are written, nothing is cached on disk.
- `ui/` is the source; the assets are embedded into the binary at compile time
  (`frontendDist` points at it, there is no separate build output).
- Icons in `src-tauri/icons/` were generated from `icon.svg`.
- The WebView renders the SVG, so there is no `resvg`/`tiny-skia` or texture
  management — that is the main simplification over the previous egui version.
