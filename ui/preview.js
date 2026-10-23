/**
 * The SVG preview pane.
 *
 * The SVG is inserted as-is and scaled to fit the pane, up to twice its
 * typeset size, so it stays sharp at any window size.
 */
export function createPreview({ previewMath, previewHint }) {
  let fitQueued = false;

  function fit() {
    if (fitQueued) return;
    fitQueued = true;

    requestAnimationFrame(() => {
      fitQueued = false;
      const svg = previewMath.querySelector("svg");
      if (!svg) return;

      const box = svg.viewBox && svg.viewBox.baseVal;
      const width =
        box && box.width ? box.width : parseFloat(svg.getAttribute("width")) || 0;
      const height =
        box && box.height
          ? box.height
          : parseFloat(svg.getAttribute("height")) || 0;
      if (!width || !height) return;

      const area = previewMath.getBoundingClientRect();
      if (area.width < 1 || area.height < 1) return;

      // Never enlarge past 2x the typeset size.
      const scale = Math.min(area.width / width, area.height / height, 2);
      svg.style.width = `${width * scale}px`;
      svg.style.height = `${height * scale}px`;
    });
  }

  function clear() {
    previewMath.replaceChildren();
    previewHint.hidden = false;
  }

  function showSvg(markup) {
    const parsed = new DOMParser().parseFromString(markup, "image/svg+xml");
    const root = parsed.documentElement;
    const isSvg = root && root.localName === "svg";
    if (!isSvg || parsed.querySelector("parsererror")) {
      throw new Error("typst returned an invalid SVG");
    }

    previewMath.replaceChildren(document.importNode(root, true));
    previewHint.hidden = true;
    fit();
  }

  return { fit, clear, showSvg };
}
