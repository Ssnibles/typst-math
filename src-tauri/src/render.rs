//! Compile a maths expression with the Typst CLI and return the SVG it emits.
//!
//! The webview can display SVG directly, so there is no rasterisation step and
//! the preview stays sharp at any window size.

use std::io::Write;
use std::process::{Command, Output, Stdio};

/// One auto-sized, transparent page containing just the expression.
const PREAMBLE: &str = "#set page(width: auto, height: auto, margin: 4pt, fill: none)\n";

/// A sensible light-on-dark default for the maths text.
const FALLBACK_COLOUR: &str = "#e6edf3";

/// Typeset size of the rendered maths.
const TEXT_SIZE: &str = "22pt";

/// Length of a `#rrggbb` colour string.
const HEX_COLOUR_LENGTH: usize = 7;

pub fn compile(source: &str, colour: &str) -> Result<String, String> {
    let document = build_document(source, colour);
    let output = run_typst(&document)?;
    svg_from_output(output)
}

/// Strip an optional pair of surrounding `$…$` delimiters and wrap the body in
/// the minimal document the preview needs.
fn build_document(source: &str, colour: &str) -> String {
    let body = strip_math_delimiters(source);
    format!(
        "{PREAMBLE}#set text(size: {TEXT_SIZE}, fill: rgb(\"{}\"))\n$ {body} $\n",
        sanitise_colour(colour)
    )
}

/// Remove leading/trailing whitespace and one pair of `$…$` delimiters.
fn strip_math_delimiters(source: &str) -> &str {
    let body = source.trim();
    let body = body.strip_prefix('$').unwrap_or(body);
    body.strip_suffix('$').unwrap_or(body)
}

/// Accept only `#rrggbb`; anything else falls back to [`FALLBACK_COLOUR`].
fn sanitise_colour(colour: &str) -> &str {
    let is_hex = colour.len() == HEX_COLOUR_LENGTH
        && colour.starts_with('#')
        && colour[1..].chars().all(|c| c.is_ascii_hexdigit());

    if is_hex {
        colour
    } else {
        FALLBACK_COLOUR
    }
}

/// Pipe the document through `typst compile`.
fn run_typst(document: &str) -> Result<Output, String> {
    let mut child = Command::new("typst")
        .args(["compile", "-", "--format", "svg", "-"])
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| {
            format!("could not run `typst`: {e}\n\nIs the Typst CLI installed and on PATH?")
        })?;

    child
        .stdin
        .take()
        .expect("stdin was piped")
        .write_all(document.as_bytes())
        .map_err(|e| format!("failed to send source to typst: {e}"))?;

    child
        .wait_with_output()
        .map_err(|e| format!("failed to read typst output: {e}"))
}

/// Surface Typst's diagnostics on failure, otherwise return its SVG.
fn svg_from_output(output: Output) -> Result<String, String> {
    if !output.status.success() {
        return Err(String::from_utf8_lossy(&output.stderr).trim().to_owned());
    }

    let svg = String::from_utf8_lossy(&output.stdout).into_owned();
    if svg.trim().is_empty() {
        return Err("typst produced no output".to_owned());
    }

    Ok(svg)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn strips_surrounding_delimiters_and_whitespace() {
        assert_eq!(strip_math_delimiters("  $x^2$  "), "x^2");
        assert_eq!(strip_math_delimiters("$ x^2 $"), " x^2 ");
        assert_eq!(strip_math_delimiters("x^2"), "x^2");
    }

    #[test]
    fn accepts_only_six_digit_hex_colours() {
        assert_eq!(sanitise_colour("#e6edf3"), "#e6edf3");
        assert_eq!(sanitise_colour("#ABCDEF"), "#ABCDEF");
        assert_eq!(sanitise_colour("#fff"), FALLBACK_COLOUR);
        assert_eq!(sanitise_colour("e6edf3"), FALLBACK_COLOUR);
        assert_eq!(sanitise_colour("#e6edfg"), FALLBACK_COLOUR);
    }

    #[test]
    fn builds_a_self_contained_document() {
        let document = build_document("$x$", "#123456");
        assert!(document.starts_with(PREAMBLE));
        assert!(document.contains("fill: rgb(\"#123456\")"));
        assert!(document.ends_with("$ x $\n"));
    }
}
