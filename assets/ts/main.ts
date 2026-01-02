/**
 * Main entry point
 * Initializes all application modules
 */

import { MOBILE_BREAKPOINT, RESIZE_DEBOUNCE_DELAY } from "./constants";
import { onDOMReady } from "./utils/dom";
import { initNav, initDropdownHover, resetDropdowns } from "./modules/navigation";
import { initHeaderShadow } from "./modules/header";
import { initPhoneLinks } from "./modules/phone-links";
import { initYearStamp } from "./modules/year-stamp";
import { initPageHeaderCityPersonalization, initGeolocationShortcodes } from "./utils/city-personalization";
import { initServicesAutoScroll } from "./modules/services-auto-scroll";
import { initPageList } from "./modules/page-list";
import { initPageListSidebar } from "./modules/page-list-sidebar";
import { initTOC } from "./modules/toc";
import { initDevScoreBubble } from "./modules/dev-score-bubble";
import { initBlog } from "./modules/blog";
import { initSitemap } from "./modules/sitemap";
import { initSmoothScroll } from "./modules/smooth-scroll";
import { initFAQ } from "./modules/faq";
import { initFeedback } from "./modules/feedback";
import { initServiceAreasLeaflet } from "./modules/service-areas-leaflet";
import { initReviewsForm } from "./modules/reviews-form";
import { initReviews } from "./modules/reviews";
import { initVIPModal } from "./modules/vip-modal";
import { initBookingIframe } from "./modules/booking-iframe";

/**
 * Initialize all modules
 */
const init = (): void => {
  try {
    initNav();
    initHeaderShadow();
    initPhoneLinks();
    initYearStamp();
    initDropdownHover();
    initPageHeaderCityPersonalization();
    initGeolocationShortcodes();
    initServicesAutoScroll();
    initTOC();
    initSmoothScroll();
    initFAQ();
    initVIPModal();

    // Initialize feedback form + sidebar progress if present
    if (document.querySelector('form[name="feedback"]')) {
      initFeedback();
    }

    // Initialize reviews form if present
    if (document.querySelector('[data-reviews-form="true"]')) {
      initReviewsForm();
    }
    
    // Initialize reviews filter if present
    if (document.querySelector('.reviews')) {
      initReviews();
    }
    
    // Initialize service areas Leaflet map if present
    if (document.getElementById('service-areas-leaflet-map')) {
      initServiceAreasLeaflet();
    }
    
    // Initialize booking iframe tracking if present
    if (document.querySelector('.booking-iframe')) {
      initBookingIframe();
    }
    
    // ============================================================================
    // Dev-Only Modules (Development Mode Only)
    // ============================================================================
    // These modules are only initialized in development (localhost).
    // Both modules also check isLocalhost() internally as a safety measure.
    // ============================================================================
    const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    if (isDev) {
      // Mark document as dev mode (for CSS safety rules if needed)
      document.documentElement.setAttribute('data-dev-mode', 'true');
      
      // Initialize page list if on page-list page
      if (document.querySelector('.page-list-container')) {
        initPageList();
        initPageListSidebar();
      }
      
      // Initialize dev score bubble
      initDevScoreBubble();
    }
    
    // Initialize blog if on blog page
    if (document.querySelector('[data-blog-controls]')) {
      initBlog();
    }
    
    // Initialize sitemap if on sitemap page
    if (document.querySelector('.section-sitemap')) {
      initSitemap();
    }
  } catch (error) {
    console.error('Error initializing application:', error);
    // Don't let errors break the page - content should still render
  }
};

// Run on DOM ready
onDOMReady(init);

// Responsive dropdown handling
let resizeTimeout: ReturnType<typeof setTimeout>;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    if (window.innerWidth > MOBILE_BREAKPOINT) {
      resetDropdowns();
    }
    initDropdownHover();
    // Re-initialize services auto-scroll on resize
    initServicesAutoScroll();
    // Re-initialize TOC to handle responsive state changes
    initTOC();
  }, RESIZE_DEBOUNCE_DELAY);
});