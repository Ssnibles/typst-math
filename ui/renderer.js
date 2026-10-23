import { DEBOUNCE_MS } from "./config.js";

/**
 * Debounced, single-flight rendering.
 *
 * A render only starts when the previous one has finished; requests that
 * arrive in the meantime are coalesced into one follow-up render. Call
 * `invalidate()` whenever the source changes and then `schedule()` to ask for
 * a new one.
 */
export function createRenderPipeline({
  getSource,
  renderMath,
  preview,
  setError,
}) {
  let debounceTimer = 0;
  let generation = 0;
  let running = false;
  let queued = false;

  /** Mark any in-flight render as stale. */
  function invalidate() {
    generation += 1;
  }

  function schedule() {
    clearTimeout(debounceTimer);
    debounceTimer = window.setTimeout(run, DEBOUNCE_MS);
  }

  async function run() {
    if (running) {
      queued = true;
      return;
    }

    const source = getSource();
    const id = generation;

    if (!source.trim()) {
      preview.clear();
      setError(null);
      return;
    }

    running = true;
    try {
      const markup = await renderMath(source);
      if (id !== generation) return;

      try {
        preview.showSvg(markup);
        setError(null);
      } catch (error) {
        setError(String(error?.message ?? error));
      }
    } catch (error) {
      if (id === generation) setError(String(error?.message ?? error));
    } finally {
      running = false;
      if (queued) {
        queued = false;
        schedule();
      }
    }
  }

  return { invalidate, schedule };
}
