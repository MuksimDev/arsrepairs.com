/**
 * Services Auto-Scroll Module
 * Handles automatic horizontal scrolling for services section
 * - Auto-scrolls from right to left at steady pace
 * - Loops when reaching the end
 * - Pauses on hover (desktop) or touch (mobile)
 * - Allows manual scrolling
 */

import { MOBILE_BREAKPOINT } from "../constants";

const SCROLL_SPEED = 0.5; // pixels per frame (adjust for speed)

let animationFrameId: number | null = null;
let isPaused = false;
let isUserScrolling = false;
let isProgrammaticScroll = false; // Flag to prevent scroll event from pausing auto-scroll
let userScrollTimeout: ReturnType<typeof setTimeout> | null = null;
let servicesGrid: HTMLElement | null = null;
let isInitialized = false;
let originalContentWidth = 0; // Width of the original content (before duplication)
let isDesktopLayout = false;
let resizeTimeout: ReturnType<typeof setTimeout> | null = null;
let isResizeListenerAttached = false;

/**
 * Checks if we're on desktop viewport
 */
const isDesktop = (): boolean => window.innerWidth > MOBILE_BREAKPOINT;

/**
 * Resets scroll position to start for seamless looping
 * When we've scrolled past the original content, reset to beginning
 */
const resetScrollPosition = (): void => {
  if (!servicesGrid || originalContentWidth === 0) return;
  
  // If we've scrolled past the original content width, reset to beginning
  // This creates a seamless loop since the duplicate content matches the original
  if (servicesGrid.scrollLeft >= originalContentWidth) {
    isProgrammaticScroll = true;
    servicesGrid.scrollLeft = servicesGrid.scrollLeft - originalContentWidth;
    requestAnimationFrame(() => {
      isProgrammaticScroll = false;
    });
  }
};

/**
 * Performs one frame of auto-scrolling
 */
const scrollFrame = (): void => {
  if (!servicesGrid || isPaused || isUserScrolling) {
    animationFrameId = null;
    return;
  }

  const scrollWidth = servicesGrid.scrollWidth;
  const clientWidth = servicesGrid.clientWidth;
  const maxScroll = scrollWidth - clientWidth;

  // If content doesn't overflow, don't scroll
  if (maxScroll <= 0) {
    animationFrameId = null;
    return;
  }

  // Increment scroll position (mark as programmatic to prevent scroll event handler from interfering)
  isProgrammaticScroll = true;
  servicesGrid.scrollLeft += SCROLL_SPEED;

  // Reset scroll position when we've scrolled past the original content
  // This creates a seamless infinite loop
  resetScrollPosition();
  
  // Reset flag after a brief moment to allow scroll event to process
  requestAnimationFrame(() => {
    isProgrammaticScroll = false;
  });

  // Continue animation
  animationFrameId = requestAnimationFrame(scrollFrame);
};

/**
 * Starts the auto-scroll animation
 */
const startAutoScroll = (): void => {
  if (animationFrameId !== null) return;
  
  isPaused = false;
  animationFrameId = requestAnimationFrame(scrollFrame);
};

/**
 * Stops the auto-scroll animation
 */
const stopAutoScroll = (): void => {
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
};

/**
 * Handles mouse enter - pauses auto-scroll
 */
const handleMouseEnter = (): void => {
  isPaused = true;
  stopAutoScroll();
};

/**
 * Handles mouse leave - resumes auto-scroll (desktop)
 */
const handleMouseLeave = (): void => {
  if (!isUserScrolling) {
    isPaused = false;
    startAutoScroll();
  }
};

/**
 * Handles touch start - pauses auto-scroll (mobile)
 */
const handleTouchStart = (): void => {
  isPaused = true;
  stopAutoScroll();
};

/**
 * Handles touch end - resumes auto-scroll (mobile)
 */
const handleTouchEnd = (): void => {
  // Resume after a brief delay to allow for scrolling
  setTimeout(() => {
    if (!isUserScrolling) {
      isPaused = false;
      startAutoScroll();
    }
  }, 100);
};

/**
 * Handles user scroll - pauses auto-scroll temporarily
 */
const handleUserScroll = (): void => {
  // Ignore programmatic scrolling (from auto-scroll)
  if (isProgrammaticScroll) {
    // Still need to check for reset even during programmatic scroll
    resetScrollPosition();
    return;
  }
  
  isUserScrolling = true;
  stopAutoScroll();

  // Reset scroll position for seamless loop during user scrolling
  resetScrollPosition();

  // Clear existing timeout
  if (userScrollTimeout) {
    clearTimeout(userScrollTimeout);
  }

  // Resume auto-scroll after user stops scrolling for 2 seconds
  userScrollTimeout = setTimeout(() => {
    isUserScrolling = false;
    if (!isPaused) {
      startAutoScroll();
    }
  }, 2000);
};

/**
 * Duplicates the content for seamless infinite scrolling
 */
const duplicateContent = (): void => {
  if (!servicesGrid) return;
  
  // Clone all service items and append them to create seamless loop
  const serviceItems = servicesGrid.querySelectorAll<HTMLElement>(".service-item");
  
  if (serviceItems.length === 0) return;
  
  // Store the width of original content before duplication
  // This is the scrollWidth of just the original items
  originalContentWidth = servicesGrid.scrollWidth;
  
  // Only duplicate if content actually overflows (needs scrolling)
  const clientWidth = servicesGrid.clientWidth;
  if (originalContentWidth <= clientWidth) {
    // Content doesn't overflow, no need to duplicate or scroll
    originalContentWidth = 0;
    return;
  }
  
  // Clone each service item and append
  serviceItems.forEach((item) => {
    const clone = item.cloneNode(true) as HTMLElement;
    servicesGrid!.appendChild(clone);
  });
};

/**
 * Cleans up event listeners and stops animation
 */
const cleanup = (): void => {
  stopAutoScroll();
  
  if (userScrollTimeout) {
    clearTimeout(userScrollTimeout);
    userScrollTimeout = null;
  }
  
  if (servicesGrid && isInitialized) {
    servicesGrid.removeEventListener("mouseenter", handleMouseEnter);
    servicesGrid.removeEventListener("mouseleave", handleMouseLeave);
    servicesGrid.removeEventListener("touchstart", handleTouchStart);
    servicesGrid.removeEventListener("touchend", handleTouchEnd);
    servicesGrid.removeEventListener("scroll", handleUserScroll);
    
    // Remove duplicated content
    const serviceItems = servicesGrid.querySelectorAll<HTMLElement>(".service-item");
    const originalCount = serviceItems.length / 2; // Assuming we duplicated, so half are duplicates
    if (originalCount > 0) {
      // Remove the duplicated items (the second half)
      for (let i = serviceItems.length - 1; i >= originalCount; i--) {
        serviceItems[i].remove();
      }
    }
  }
  
  isInitialized = false;
  isPaused = false;
  isUserScrolling = false;
  originalContentWidth = 0;
  servicesGrid = null;
};

/**
 * Handles viewport changes; re-initialize when crossing the desktop breakpoint.
 */
const handleResize = (): void => {
  if (resizeTimeout) {
    clearTimeout(resizeTimeout);
  }

  // Debounce resize to avoid thrashing during orientation changes.
  resizeTimeout = setTimeout(() => {
    const nowDesktop = isDesktop();

    // Only act when we cross the breakpoint to avoid unnecessary work.
    if (nowDesktop !== isDesktopLayout) {
      cleanup();
      // Only initialize on desktop; mobile/tablet stays static grid.
      if (nowDesktop) {
        initServicesAutoScroll();
      }
    }

    isDesktopLayout = nowDesktop;
  }, 150);
};

/**
 * Initializes the services auto-scroll functionality
 */
export const initServicesAutoScroll = (): void => {
  // Clean up previous initialization if it exists
  if (isInitialized) {
    cleanup();
  }
  
  // Only enable auto-scroll on desktop viewports; mobile/tablet stays static grid.
  if (!isDesktop()) {
    isDesktopLayout = false;
    return;
  }
  isDesktopLayout = true;

  servicesGrid = document.querySelector<HTMLElement>(".services-grid");
  
  if (!servicesGrid) return;

  // Duplicate content for seamless infinite loop
  duplicateContent();

  // Set up event listeners
  // Desktop: hover events
  servicesGrid.addEventListener("mouseenter", handleMouseEnter);
  servicesGrid.addEventListener("mouseleave", handleMouseLeave);
  // Mobile: touch events
  servicesGrid.addEventListener("touchstart", handleTouchStart, { passive: true });
  servicesGrid.addEventListener("touchend", handleTouchEnd, { passive: true });
  // Both: scroll detection
  servicesGrid.addEventListener("scroll", handleUserScroll, { passive: true });
  
  isInitialized = true;

  // Start auto-scroll
  startAutoScroll();

  // Attach a resize listener once to react to breakpoint changes.
  if (!isResizeListenerAttached) {
    window.addEventListener("resize", handleResize, { passive: true });
    isResizeListenerAttached = true;
  }
};

