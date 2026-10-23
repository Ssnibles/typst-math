import { renderHighlight } from "./highlight.js";

/**
 * Wire the textarea to the syntax-highlighted layer that sits underneath it.
 *
 * The textarea keeps native caret, selection, undo and IME behaviour; the layer
 * only mirrors its text and scroll offset. `onChange` is called after every
 * edit, once the highlighted layer has caught up.
 */
export function createEditor({ input, highlight, code }, { onChange }) {
  function syncScroll() {
    highlight.scrollTop = input.scrollTop;
    highlight.scrollLeft = input.scrollLeft;
  }

  function refreshHighlight() {
    renderHighlight(code, input.value);
    syncScroll();
  }

  input.addEventListener("input", () => {
    refreshHighlight();
    onChange();
  });
  input.addEventListener("scroll", syncScroll, { passive: true });

  return {
    get value() {
      return input.value;
    },

    /** Replace the editor contents and update the highlight layer. */
    setValue(value) {
      input.value = value;
      refreshHighlight();
    },

    /** Focus the editor and put the caret at the end of the text. */
    focusAtEnd() {
      input.focus({ preventScroll: true });
      input.setSelectionRange(input.value.length, input.value.length);
    },
  };
}
