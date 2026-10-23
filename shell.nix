{ pkgs ? import <nixpkgs> { } }:

let
  projectRoot = toString ./.;

  # Tauri uses GTK + WebKitGTK on Linux. GTK, WebKit and the GL stack dlopen
  # these at runtime, so they need to be on the loader path as well.
  runtimeLibs = with pkgs; [
    wayland
    libxkbcommon
    libGL
    mesa
    vulkan-loader
    libX11
    libXcursor
    libXi
    libXrandr
    libXinerama
    gtk3
    webkitgtk_4_1
    libsoup_3
    librsvg
  ];
in
pkgs.mkShell {
  nativeBuildInputs = with pkgs; [ cargo rustc rustfmt pkg-config wrapGAppsHook3 ];

  buildInputs = runtimeLibs ++ (with pkgs; [
    glib
    gdk-pixbuf
    pango
    cairo
    atk
    harfbuzz
    openssl
    glib-networking
  ]);

  shellHook = ''
    export LD_LIBRARY_PATH=${pkgs.lib.makeLibraryPath runtimeLibs}:$LD_LIBRARY_PATH
    export GIO_EXTRA_MODULES=${pkgs.glib-networking}/lib/gio/modules

    # WebKitGTK's DMA-BUF renderer is unreliable on some Wayland/NixOS setups.
    export WEBKIT_DISABLE_DMABUF_RENDERER=1

    # Convenience commands: `run` builds and launches the app; `build`
    # produces the release binary and prints its path.
    run() {
      cargo run --manifest-path "${projectRoot}/src-tauri/Cargo.toml" "$@"
    }

    build() {
      cargo build --release --manifest-path "${projectRoot}/src-tauri/Cargo.toml" "$@" &&
        printf 'binary: %s\n' "${projectRoot}/src-tauri/target/release/typst-math"
    }

    export -f run build
  '';
}
