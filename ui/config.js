// Shared constants for the editor, layout and render pipeline.

/** How long to wait after the last keystroke before rendering, in ms. */
export const DEBOUNCE_MS = 120;

/**
 * Fallback thickness of the divider, in px. The live value comes from the
 * `--divider-size` CSS variable, which keeps CSS and JS in step.
 */
export const DIVIDER_SIZE = 14;

/** Smallest height/width the preview may take, in px. */
export const PREVIEW_MIN = 200;

/** The two supported workspace layouts. */
export const LAYOUT = Object.freeze({
  ROWS: "rows",
  COLUMNS: "columns",
});

/** Smallest editor size per layout, in px. */
export const MIN_SIZE = {
  [LAYOUT.ROWS]: 96,
  [LAYOUT.COLUMNS]: 260,
};

/** Editor size used the first time each layout is shown, in px. */
export const DEFAULT_SIZE = {
  [LAYOUT.ROWS]: 168,
  [LAYOUT.COLUMNS]: 380,
};

/** Shown on first launch; also the initial caret position. */
export const DEFAULT_SOURCE = [
  "sum_(k=1)^n k^2 = (n(n+1)(2n+1))/6 \\",
  "integral_0^infinity e^(-x^2) dif x = sqrt(pi)/2",
].join("\n");
