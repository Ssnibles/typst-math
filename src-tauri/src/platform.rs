//! Platform-specific start-up fixes.

/// WebKitGTK derives its device pixel ratio from GDK's screen resolution (and
/// GTK's `gtk-xft-dpi`).  On some Wayland compositors (notably wlroots-based
/// ones such as Mango) nothing sets either, so GDK reports -1; WebKit then
/// computes a negative DPR and a negative layout viewport
/// (`innerWidth = -window_width * 96`), which collapses every percentage-sized
/// element.  Set both to 96 DPI before the webview is created.  An explicitly
/// configured DPI (HiDPI desktops) is left untouched.
#[cfg(target_os = "linux")]
pub fn normalise_dpi() {
    use gtk::prelude::*;

    if gtk::init().is_ok() {
        if let Some(settings) = gtk::Settings::default() {
            if settings.gtk_xft_dpi() <= 0 {
                settings.set_gtk_xft_dpi(96 * 1024);
            }
        }

        // The `gtk-xft-dpi` setting alone is not enough: GDK's screen
        // resolution stays -1 on Wayland unless something sets it, and
        // WebKitGTK latches its device pixel ratio from that at startup.
        if let Some(screen) = gtk::gdk::Screen::default() {
            if screen.resolution() <= 0.0 {
                screen.set_resolution(96.0);
            }
        }
    }
}

/// No-op on platforms that already report a valid DPI to the webview.
#[cfg(not(target_os = "linux"))]
pub fn normalise_dpi() {}
