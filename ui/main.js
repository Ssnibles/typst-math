import { DEFAULT_SOURCE, LAYOUT } from "./config.js";
import { elements } from "./dom.js";
import { createEditor } from "./editor.js";
import { createErrorCard } from "./error-card.js";
import { renderMath } from "./ipc.js";
import { createLayout } from "./layout.js";
import { createPreview } from "./preview.js";
import { createRenderPipeline } from "./renderer.js";

const preview = createPreview(elements);
const layout = createLayout(elements, () => preview.fit());
const errorCard = createErrorCard(elements.errorCard, () => {
  layout.refresh();
  preview.fit();
});

function handleInput() {
  pipeline.invalidate();
  pipeline.schedule();
}

const editor = createEditor(elements, { onChange: handleInput });
const pipeline = createRenderPipeline({
  getSource: () => editor.value,
  renderMath,
  preview,
  setError: errorCard.set,
});

// Keep the split sensible when the window or the error card changes size.
const resizeObserver = new ResizeObserver(() => {
  layout.refresh();
  preview.fit();
});
resizeObserver.observe(elements.workspace);
resizeObserver.observe(elements.previewMath);

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

editor.setValue(DEFAULT_SOURCE);
layout.applySplit(LAYOUT.ROWS);
editor.focusAtEnd();
pipeline.schedule();
