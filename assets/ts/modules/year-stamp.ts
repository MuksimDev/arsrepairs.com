/**
 * Year stamp module
 * Updates elements with the current year
 */

/**
 * Initializes year stamp by setting current year in elements with [data-current-year]
 */
export const initYearStamp = (): void => {
  const el = document.querySelector<HTMLElement>("[data-current-year]");
  if (el) el.textContent = new Date().getFullYear().toString();
};

