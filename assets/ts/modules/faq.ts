/**
 * FAQ module
 * Handles expand/collapse functionality for FAQ items with accordion behavior
 */

/**
 * Closes a FAQ item with smooth transition
 */
const closeItem = (item: HTMLElement, button: HTMLButtonElement, content: HTMLElement): void => {
  // Update ARIA attributes
  button.setAttribute("aria-expanded", "false");
  
  // Remove open class to trigger CSS transition
  item.classList.remove("faq-item--open");
  
  // Wait for transition to complete before adding hidden attribute
  const handleTransitionEnd = (): void => {
    content.setAttribute("hidden", "");
    content.removeEventListener("transitionend", handleTransitionEnd);
  };
  
  content.addEventListener("transitionend", handleTransitionEnd, { once: true });
  
  // Fallback: if transition doesn't fire, add hidden after timeout
  setTimeout(() => {
    if (button.getAttribute("aria-expanded") === "false") {
      content.setAttribute("hidden", "");
    }
  }, 350);
};

/**
 * Opens a FAQ item with smooth transition
 */
const openItem = (item: HTMLElement, button: HTMLButtonElement, content: HTMLElement): void => {
  // Remove hidden attribute first to allow transition
  content.removeAttribute("hidden");
  
  // Use requestAnimationFrame to ensure the DOM update is processed
  requestAnimationFrame(() => {
    // Update ARIA attributes
    button.setAttribute("aria-expanded", "true");
    
    // Add open class to trigger CSS transition
    item.classList.add("faq-item--open");
  });
};

/**
 * Closes all FAQ items in the same FAQ list container
 */
const closeOtherItems = (currentItem: HTMLElement): void => {
  // Find the parent FAQ list container
  const faqList = currentItem.closest(".faq__list");
  if (!faqList) return;
  
  // Get all FAQ items in the same list
  const allItems = faqList.querySelectorAll<HTMLElement>("[data-faq-item]");
  
  allItems.forEach((item) => {
    // Skip the current item
    if (item === currentItem) return;
    
    const button = item.querySelector<HTMLButtonElement>(".faq-item__button");
    const content = item.querySelector<HTMLElement>(".faq-item__content");
    
    if (!button || !content) return;
    
    // Only close if it's currently open
    if (button.getAttribute("aria-expanded") === "true") {
      closeItem(item, button, content);
    }
  });
};

/**
 * Initializes the FAQ expand/collapse functionality with accordion behavior
 */
export const initFAQ = (): void => {
  const faqItems = document.querySelectorAll<HTMLElement>("[data-faq-item]");
  
  faqItems.forEach((item) => {
    const button = item.querySelector<HTMLButtonElement>(".faq-item__button");
    const content = item.querySelector<HTMLElement>(".faq-item__content");
    
    if (!button || !content) return;
    
    const toggle = (): void => {
      const isExpanded = button.getAttribute("aria-expanded") === "true";
      const newState = !isExpanded;
      
      // If opening, close all other items in the same FAQ list first
      if (newState) {
        closeOtherItems(item);
      }
      
      // Toggle the current item
      if (newState) {
        openItem(item, button, content);
      } else {
        closeItem(item, button, content);
      }
    };
    
    button.addEventListener("click", (event) => {
      event.preventDefault();
      toggle();
    });
  });
};

