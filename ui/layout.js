import {
  DEFAULT_SIZE,
  DIVIDER_SIZE,
  LAYOUT,
  MIN_SIZE,
  PREVIEW_MIN,
} from "./config.js";

/**
 * Wire up the two-pane workspace: the layout buttons, the draggable divider and
 * keyboard resizing.
 *
 * `onChange` is called whenever the pane geometry changes, so the caller can
 * re-fit the preview.
 */
export function createLayout(
  { app, workspace, divider, layoutButtons },
  onChange,
) {
  let split = LAYOUT.ROWS;
  const sizes = { ...DEFAULT_SIZE };
  let drag = null;

  /** The divider's live thickness, read from CSS to keep one source of truth. */
  function dividerSize() {
    const value = getComputedStyle(document.documentElement)
      .getPropertyValue("--divider-size")
      .trim();
    return parseFloat(value) || DIVIDER_SIZE;
  }

  function contentSize(axis) {
    const style = getComputedStyle(workspace);
    return axis === LAYOUT.ROWS
      ? workspace.clientHeight -
          parseFloat(style.paddingTop) -
          parseFloat(style.paddingBottom)
      : workspace.clientWidth -
          parseFloat(style.paddingLeft) -
          parseFloat(style.paddingRight);
  }

  function maxPaneSize() {
    const available = contentSize(split) - dividerSize() - PREVIEW_MIN;
    return Math.max(MIN_SIZE[split], available);
  }

  function clampPaneSize(value) {
    return Math.min(Math.max(value, MIN_SIZE[split]), maxPaneSize());
  }

  function applyPaneSize() {
    sizes[split] = clampPaneSize(sizes[split]);
    workspace.style.setProperty("--pane-size", `${sizes[split]}px`);
    divider.setAttribute("aria-valuenow", String(Math.round(sizes[split])));
    divider.setAttribute("aria-valuemin", String(MIN_SIZE[split]));
    divider.setAttribute("aria-valuemax", String(Math.round(maxPaneSize())));
  }

  function applySplit(next) {
    split = next;
    app.dataset.split = next;

    for (const button of layoutButtons) {
      const active = button.dataset.layout === next;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    }

    divider.setAttribute(
      "aria-orientation",
      next === LAYOUT.ROWS ? "horizontal" : "vertical",
    );
    applyPaneSize();
    requestAnimationFrame(onChange);
  }

  function pointerPosition(event) {
    return split === LAYOUT.ROWS ? event.clientY : event.clientX;
  }

  divider.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) return;
    event.preventDefault();
    divider.setPointerCapture(event.pointerId);
    divider.classList.add("dragging");
    divider.focus({ preventScroll: true });
    drag = { start: pointerPosition(event), size: sizes[split] };
  });

  divider.addEventListener("pointermove", (event) => {
    if (!drag) return;
    sizes[split] = clampPaneSize(
      drag.size + pointerPosition(event) - drag.start,
    );
    applyPaneSize();
  });

  function endDrag(event) {
    if (!drag) return;
    drag = null;
    divider.classList.remove("dragging");
    if (divider.hasPointerCapture(event.pointerId)) {
      divider.releasePointerCapture(event.pointerId);
    }
    onChange();
  }

  divider.addEventListener("pointerup", endDrag);
  divider.addEventListener("pointercancel", endDrag);
  divider.addEventListener("lostpointercapture", () => {
    drag = null;
    divider.classList.remove("dragging");
  });

  divider.addEventListener("keydown", (event) => {
    const step = event.shiftKey ? 48 : 16;
    let delta = 0;

    if (split === LAYOUT.ROWS) {
      if (event.key === "ArrowUp") delta = -step;
      else if (event.key === "ArrowDown") delta = step;
    } else {
      if (event.key === "ArrowLeft") delta = -step;
      else if (event.key === "ArrowRight") delta = step;
    }

    if (!delta) return;
    event.preventDefault();
    sizes[split] = clampPaneSize(sizes[split] + delta);
    applyPaneSize();
    onChange();
  });

  for (const button of layoutButtons) {
    button.addEventListener("click", () => {
      if (button.dataset.layout !== split) applySplit(button.dataset.layout);
    });
  }

  return {
    applySplit,

    /** Re-clamp the current pane size, e.g. after the window changed. */
    refresh: applyPaneSize,

    get split() {
      return split;
    },
  };
}
