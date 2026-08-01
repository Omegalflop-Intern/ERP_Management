/**
 * Utility to block browser inspection, Developer Console, and right-click context menu.
 */
export function initDevToolsProtection() {
  // Only enable DevTools protection in Production builds
  if (typeof window === 'undefined' || !import.meta.env.PROD) return;

  // 1. Disable Right-Click Context Menu
  document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    return false;
  });

  // 2. Disable DevTools Keyboard Shortcuts
  document.addEventListener('keydown', (e) => {
    // F12
    if (e.key === 'F12' || e.keyCode === 123) {
      e.preventDefault();
      return false;
    }

    const isCtrlOrCmd = e.ctrlKey || e.metaKey;
    const isShift = e.shiftKey;
    const isAlt = e.altKey;
    const key = e.key.toLowerCase();

    // Ctrl+Shift+I / Cmd+Opt+I (Inspect)
    // Ctrl+Shift+J / Cmd+Opt+J (Console)
    // Ctrl+Shift+C / Cmd+Opt+C (Element picker)
    // Ctrl+U / Cmd+U (View Source)
    // Ctrl+S / Cmd+S (Save page)
    if (
      (isCtrlOrCmd && isShift && (key === 'i' || key === 'j' || key === 'c')) ||
      (isCtrlOrCmd && isAlt && (key === 'i' || key === 'j' || key === 'c')) ||
      (isCtrlOrCmd && (key === 'u' || key === 's'))
    ) {
      e.preventDefault();
      return false;
    }
  });

  // 3. Active DevTools Detection Loop (Debugger / Timing check)
  const detectDevTools = () => {
    const start = performance.now();
    // Execute a debugger statement wrapped in evaluation
    (() => {}).constructor('debugger')();
    const duration = performance.now() - start;

    if (duration > 100) {
      // DevTools open detected
      console.clear();
    }
  };

  // Run initial check and set interval
  try {
    setInterval(detectDevTools, 1000);
  } catch (err) {
    // Ignore execution errors
  }

  // 4. Overwrite Console Methods in Production or Restricted Environment
  if (import.meta.env.PROD) {
    const noop = () => {};
    window.console.log = noop;
    window.console.debug = noop;
    window.console.info = noop;
    window.console.warn = noop;
  }
}
