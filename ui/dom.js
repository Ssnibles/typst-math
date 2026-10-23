// Centralised DOM lookups, so feature modules do not repeat `getElementById`.

const highlight = document.getElementById("highlight");
const code = highlight.querySelector("code");

export const elements = {
  app: document.getElementById("app"),
  workspace: document.querySelector(".workspace"),
  divider: document.getElementById("divider"),
  input: document.getElementById("input"),
  highlight,
  code,
  previewMath: document.getElementById("preview-math"),
  previewHint: document.getElementById("preview-hint"),
  errorCard: document.getElementById("error"),
  layoutButtons: [...document.querySelectorAll(".layout-btn")],
};

/** The UI text colour, used to colour the rendered maths. */
export const TEXT_COLOUR =
  getComputedStyle(document.documentElement).getPropertyValue("--text").trim() ||
  "#e6edf3";
