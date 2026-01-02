/**
 * Common Issues module
 * Handles show more/less toggle functionality for common issues lists
 */

/**
 * Initializes the common issues toggle functionality
 */
export const initCommonIssues = (): void => {
  const containers = document.querySelectorAll<HTMLElement>("[data-common-issues]");
  
  containers.forEach((container) => {
    const toggleBtn = container.querySelector<HTMLButtonElement>("[data-common-issues-toggle]");
    const hiddenItem = container.querySelector<HTMLElement>("[data-common-issues-hidden]");
    
    if (!toggleBtn || !hiddenItem) return;
    
    const toggle = (): void => {
      const isExpanded = toggleBtn.getAttribute("aria-expanded") === "true";
      const newState = !isExpanded;
      const hiddenItems = container.querySelectorAll<HTMLElement>("[data-common-issues-hidden]");
      const toggleTexts = toggleBtn.querySelectorAll<HTMLElement>(".common-issues__toggle-text");
      
      toggleBtn.setAttribute("aria-expanded", newState.toString());
      hiddenItems.forEach((item) => {
        item.classList.toggle("is-visible", newState);
      });
      container.classList.toggle("is-expanded", newState);
      
      // Toggle text visibility - first text is "Show More", second is "Show Less"
      if (toggleTexts.length >= 2) {
        // Hide "Show More Issues" when expanded
        toggleTexts[0].classList.toggle("common-issues__toggle-text--hidden", newState);
        // Show "Show Less" when expanded
        toggleTexts[1].classList.toggle("common-issues__toggle-text--hidden", !newState);
      }
    };
    
    toggleBtn.addEventListener("click", (event) => {
      event.preventDefault();
      toggle();
    });
  });
};

