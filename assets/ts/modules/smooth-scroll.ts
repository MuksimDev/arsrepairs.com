/**
 * Smooth scroll with offset for anchor links
 * Handles anchor link clicks and adds offset to account for fixed/sticky headers
 */

/**
 * Calculate the offset needed for smooth scrolling
 * Accounts for sticky header height
 */
const getScrollOffset = (): number => {
  const header = document.querySelector<HTMLElement>('.site-header');
  if (header) {
    // Get the actual height of the header
    const headerHeight = header.offsetHeight;
    // Add a small buffer (e.g., 20px) for better spacing
    return headerHeight + 20;
  }
  // Fallback offset if header not found
  return 100;
};

/**
 * Smooth scroll to element with offset
 */
const scrollToElement = (element: HTMLElement, offset: number): void => {
  const elementPosition = element.getBoundingClientRect().top;
  const offsetPosition = elementPosition + window.pageYOffset - offset;

  window.scrollTo({
    top: offsetPosition,
    behavior: 'smooth'
  });
};

/**
 * Handle anchor link clicks
 */
const handleAnchorClick = (e: Event): void => {
  const link = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="#"]');
  if (!link) return;

  const href = link.getAttribute('href');

  // Only handle anchor links (starting with #)
  if (!href || !href.startsWith('#')) {
    return;
  }

  // Skip if it's just "#" (empty anchor)
  if (href === '#') {
    return;
  }

  // Extract the target ID
  const targetId = href.substring(1);
  const targetElement = document.getElementById(targetId);

  if (targetElement) {
    e.preventDefault();
    const offset = getScrollOffset();
    scrollToElement(targetElement, offset);

    // Update URL hash without triggering scroll
    if (history.pushState) {
      history.pushState(null, '', href);
    } else {
      window.location.hash = href;
    }
  }
};

/**
 * Handle initial page load with hash in URL
 */
const handleInitialHash = (): void => {
  if (window.location.hash) {
    const hash = window.location.hash.substring(1);
    const targetElement = document.getElementById(hash);

    if (targetElement) {
      // Small delay to ensure page is fully rendered
      setTimeout(() => {
        const offset = getScrollOffset();
        scrollToElement(targetElement, offset);
      }, 100);
    }
  }
};

/**
 * Initialize smooth scroll functionality
 */
export const initSmoothScroll = (): void => {
  // Use event delegation to handle all anchor links, including dynamically added ones
  // This ensures TOC links and any other dynamically created anchor links work
  document.addEventListener('click', handleAnchorClick);

  // Handle initial hash if present in URL
  handleInitialHash();

  // Handle hash changes (e.g., when user navigates back/forward)
  window.addEventListener('hashchange', () => {
    if (window.location.hash) {
      const hash = window.location.hash.substring(1);
      const targetElement = document.getElementById(hash);

      if (targetElement) {
        const offset = getScrollOffset();
        scrollToElement(targetElement, offset);
      }
    }
  });
};

