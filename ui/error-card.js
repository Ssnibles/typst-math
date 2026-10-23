/**
 * The diagnostics card under the workspace.
 *
 * Showing or hiding it changes the height available to the workspace, hence
 * the `onResize` callback.
 */
export function createErrorCard(element, onResize) {
  function set(message) {
    if (message) {
      element.textContent = message;
      element.hidden = false;
      element.scrollTop = 0;
    } else {
      element.hidden = true;
      element.textContent = "";
    }

    // The error card changes the height available to the workspace.
    requestAnimationFrame(onResize);
  }

  return { set };
}
