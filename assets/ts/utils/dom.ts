/**
 * DOM utility functions
 */

/**
 * Checks if the current viewport is mobile size
 */
export const isMobile = (): boolean => window.innerWidth <= 1280;

/**
 * Checks if running on localhost
 */
export const isLocalhost = (): boolean => {
  return window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
};

/**
 * Safely executes a function when DOM is ready
 */
export const onDOMReady = (callback: () => void): void => {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", callback);
  } else {
    callback();
  }
};

