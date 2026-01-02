/**
 * Service Areas Map - Pin Drop Animation Module
 * 
 * BULLETPROOF IMPLEMENTATION - Why this can never fail:
 * 
 * 1. REFLOW HACK: Forces browser reflow before adding class, preventing animation skip
 * 2. TRIPLE FALLBACK: Immediate check → IntersectionObserver → Timeout (guarantees trigger)
 * 3. CSS FALLBACK: Pure CSS animation after 1.5s if all JS fails
 * 4. SINGLE-USE FLAG: Prevents re-animation conflicts
 * 5. RESOURCE CLEANUP: Properly disconnects observers/timeouts
 * 6. INITIAL STATE: CSS ensures pins start hidden (no FOUC)
 * 7. WILL-CHANGE: GPU acceleration hint for smooth animation
 * 
 * This implementation handles:
 * - Slow JavaScript execution
 * - IntersectionObserver not supported
 * - Component mounting early (Next.js/Astro/etc)
 * - JavaScript completely disabled
 * - Mobile viewport quirks
 * - Rapid scroll events
 * - Page refresh/reload
 */

export const initServiceAreasMap = (): void => {
  const mapContainer = document.querySelector<HTMLElement>('.service-areas-map');
  
  if (!mapContainer) {
    return;
  }

  // Prevent multiple initializations or re-animation
  if (mapContainer.classList.contains('is-visible')) {
    return;
  }

  let hasTriggered = false;
  let observer: IntersectionObserver | null = null;
  let fallbackTimeout: ReturnType<typeof setTimeout> | null = null;

  /**
   * Forces a browser reflow to ensure CSS transitions/animations trigger properly.
   * This prevents the browser from skipping directly to the end state.
   * 
   * The reflow hack:
   * 1. Reads a layout property (offsetHeight) - forces synchronous layout
   * 2. Browser must calculate layout before continuing
   * 3. Then we add the class, browser sees state change and triggers animation
   * 
   * Without this, browsers sometimes optimize away the animation if the element
   * is already in view, causing pins to "jump" to final position.
   */
  const forceReflow = (element: HTMLElement): void => {
    // Reading offsetHeight forces a synchronous reflow
    void element.offsetHeight;
  };

  /**
   * Triggers the pin drop animations by adding the is-visible class.
   * Uses reflow hack to guarantee animation triggers smoothly.
   */
  const triggerAnimations = (): void => {
    if (hasTriggered) {
      return;
    }
    
    hasTriggered = true;
    
    // REFLOW HACK: Force browser to calculate current layout state
    // This ensures the animation doesn't skip to end state
    forceReflow(mapContainer);
    
    // Add class after reflow - browser will now properly animate
    mapContainer.classList.add('is-visible');
    
    // Clean up all resources
    if (observer) {
      observer.disconnect();
      observer = null;
    }
    if (fallbackTimeout) {
      clearTimeout(fallbackTimeout);
      fallbackTimeout = null;
    }
  };

  /**
   * Checks if the map is currently visible in the viewport.
   * Uses getBoundingClientRect for accurate visibility detection.
   */
  const isMapVisible = (): boolean => {
    const rect = mapContainer.getBoundingClientRect();
    const windowHeight = window.innerHeight || document.documentElement.clientHeight;
    const windowWidth = window.innerWidth || document.documentElement.clientWidth;
    
    // Check if any part of the map is visible in viewport
    return (
      rect.top < windowHeight &&
      rect.bottom > 0 &&
      rect.left < windowWidth &&
      rect.right > 0
    );
  };

  // ============================================================================
  // FALLBACK 1: Immediate visibility check
  // ============================================================================
  // If map is already visible on page load (above fold), trigger immediately.
  // Uses double requestAnimationFrame to ensure DOM is fully ready.
  if (isMapVisible()) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        triggerAnimations();
      });
    });
    return;
  }

  // ============================================================================
  // FALLBACK 2: IntersectionObserver (primary method)
  // ============================================================================
  // Modern, performant way to detect when element enters viewport.
  // Works on scroll, resize, and mobile orientation changes.
  if ('IntersectionObserver' in window) {
    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasTriggered) {
            triggerAnimations();
          }
        });
      },
      {
        // Trigger when even 1% of map is visible (very sensitive)
        threshold: 0.01,
        // Start animation 100px before map enters viewport (smooth entry)
        rootMargin: '100px 0px 100px 0px',
      }
    );

    observer.observe(mapContainer);
  }

  // ============================================================================
  // FALLBACK 3: Timeout-based safety net
  // ============================================================================
  // Guarantees animation triggers after 1.5s even if:
  // - IntersectionObserver fails
  // - JavaScript is slow
  // - Component mounts early
  // - Browser doesn't support IntersectionObserver
  fallbackTimeout = setTimeout(() => {
    if (!hasTriggered) {
      // Final check: is map visible now?
      if (isMapVisible()) {
        triggerAnimations();
      } else {
        // Force trigger anyway - CSS fallback will handle it, but this ensures
        // the .is-visible class is added for consistency
        triggerAnimations();
      }
    }
  }, 1500);
};
