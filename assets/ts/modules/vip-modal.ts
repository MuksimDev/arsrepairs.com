/**
 * VIP Membership Modal
 * - Opens from [data-vip-modal-open]
 * - Accessible dialog with focus trap and ESC/overlay close
 * - Triggers confetti on successful form submission
 */

import { createConfetti } from "./confetti";

const SELECTORS = {
  modal: "#vip-membership-modal",
  openTriggers: "[data-vip-modal-open]",
  closeTriggers: "[data-vip-modal-close]",
  successMessage: "#success-message",
} as const;

let lastFocusedElement: HTMLElement | null = null;

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const focusableSelectors = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled]):not([type="hidden"])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(", ");

  return Array.from(container.querySelectorAll<HTMLElement>(focusableSelectors)).filter(
    (el) => !el.hasAttribute("aria-hidden") && !el.closest("[aria-hidden='true']"),
  );
}

function openModal(modal: HTMLElement): void {
  if (modal.getAttribute("aria-hidden") === "false") return;

  lastFocusedElement = (document.activeElement as HTMLElement) || null;

  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";

  // Reset confetti trigger when modal opens
  confettiTriggered = false;

  const focusable = getFocusableElements(modal);
  const firstFocusable = focusable[0];
  if (firstFocusable) {
    firstFocusable.focus();
  }

  modal.addEventListener("keydown", handleKeydown);
  
  // Start watching for success when modal opens
  setTimeout(watchForSuccess, 100);
}

function closeModal(modal: HTMLElement): void {
  if (modal.getAttribute("aria-hidden") === "true") return;

  modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";

  modal.removeEventListener("keydown", handleKeydown);

  if (lastFocusedElement && document.contains(lastFocusedElement)) {
    lastFocusedElement.focus();
  }
}

function handleKeydown(event: KeyboardEvent): void {
  const modal = document.querySelector<HTMLElement>(SELECTORS.modal);
  if (!modal || modal.getAttribute("aria-hidden") === "true") return;

  if (event.key === "Escape") {
    event.preventDefault();
    closeModal(modal);
    return;
  }

  if (event.key === "Tab") {
    const focusable = getFocusableElements(modal);
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const current = document.activeElement as HTMLElement;

    if (event.shiftKey) {
      if (current === first || !modal.contains(current)) {
        event.preventDefault();
        last.focus();
      }
    } else {
      if (current === last || !modal.contains(current)) {
        event.preventDefault();
        first.focus();
      }
    }
  }
}

let confettiTriggered = false;

function triggerConfettiIfSuccess(): boolean {
  if (confettiTriggered) return true;
  
  const successMessage = document.querySelector<HTMLElement>(SELECTORS.successMessage);
  const modal = document.querySelector<HTMLElement>(SELECTORS.modal);
  
  if (!successMessage || !modal || modal.getAttribute("aria-hidden") === "true") {
    return false;
  }
  
  // Check if success message is visible
  const isVisible = successMessage.offsetParent !== null &&
                    window.getComputedStyle(successMessage).display !== "none" &&
                    successMessage.textContent?.trim();
  
  if (isVisible) {
    confettiTriggered = true;
    
    createConfetti({
      particleCount: 120,
    });
    
    return true;
  }
  
  return false;
}

function watchForSuccess(): void {
  const successMessage = document.querySelector<HTMLElement>(SELECTORS.successMessage);
  if (!successMessage) return;

  // Use MutationObserver to watch for when success message becomes visible
  const observer = new MutationObserver(() => {
    if (triggerConfettiIfSuccess()) {
      observer.disconnect();
      clearInterval(checkInterval);
    }
  });

  // Observe style, class, and content changes
  observer.observe(successMessage, {
    attributes: true,
    attributeFilter: ["style", "class"],
    childList: true,
    subtree: true,
  });

  // Also check periodically in case Brevo uses other methods
  let checkCount = 0;
  const maxChecks = 20; // Check for 10 seconds (20 * 500ms)
  const checkInterval = setInterval(() => {
    checkCount++;
    
    if (triggerConfettiIfSuccess()) {
      observer.disconnect();
      clearInterval(checkInterval);
      return;
    }
    
    if (checkCount >= maxChecks) {
      clearInterval(checkInterval);
      observer.disconnect();
    }
  }, 500);
}

export function initVIPModal(): void {
  const modal = document.querySelector<HTMLElement>(SELECTORS.modal);
  const openButtons = document.querySelectorAll<HTMLElement>(SELECTORS.openTriggers);
  const closeButtons = document.querySelectorAll<HTMLElement>(SELECTORS.closeTriggers);

  if (!modal || openButtons.length === 0) {
    return;
  }

  openButtons.forEach((btn) => {
    btn.addEventListener("click", (event) => {
      event.preventDefault();
      openModal(modal);
    });
  });

  closeButtons.forEach((btn) => {
    btn.addEventListener("click", (event) => {
      event.preventDefault();
      closeModal(modal);
    });
  });

  const backdrop = modal.querySelector<HTMLElement>(".modal__backdrop");
  if (backdrop) {
    backdrop.addEventListener("click", (event) => {
      event.preventDefault();
      closeModal(modal);
    });
  }
}


