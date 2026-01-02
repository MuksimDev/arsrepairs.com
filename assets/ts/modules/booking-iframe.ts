/**
 * Booking Iframe Module
 * Listens for postMessage events from the booking iframe and handles
 * redirects to thank-you page and conversion tracking
 */

import { onDOMReady, isLocalhost } from '../utils/dom';

// Constants
const DEV_LOG = isLocalhost();
const BOOKING_IFRAME_ORIGIN = 'https://booking.rossware.com';
const THANK_YOU_PAGE_URL = '/schedule-service/thank-you/';

/**
 * Development logging helper
 */
function devLog(...args: unknown[]): void {
  if (DEV_LOG) {
    console.log('[Booking Iframe]', ...args);
  }
}

/**
 * Development error logging helper
 */
function devError(...args: unknown[]): void {
  if (DEV_LOG) {
    console.error('[Booking Iframe]', ...args);
  }
}

/**
 * Track conversion event in Google Analytics (gtag)
 */
function trackConversionGA(data?: unknown): void {
  if (typeof window === 'undefined' || !(window as any).gtag) {
    devLog('Google Analytics (gtag) not available');
    return;
  }

  try {
    // Track as a custom event for GA4
    (window as any).gtag('event', 'booking_submission', {
      event_category: 'Booking',
      event_label: 'Online Booking',
      value: 1
    });

    devLog('Conversion tracked in Google Analytics', data);
  } catch (error) {
    devError('Error tracking conversion in Google Analytics:', error);
  }
}

/**
 * Track conversion event in Facebook Pixel
 */
function trackConversionFB(data?: unknown): void {
  if (typeof window === 'undefined' || !(window as any).fbq) {
    devLog('Facebook Pixel not available');
    return;
  }

  try {
    (window as any).fbq('track', 'Lead', {
      content_name: 'Online Booking',
      content_category: 'Appointment Booking'
    });

    // Also track as a custom event
    (window as any).fbq('trackCustom', 'BookingSubmission', {
      source: 'booking_iframe'
    });

    devLog('Conversion tracked in Facebook Pixel', data);
  } catch (error) {
    devError('Error tracking conversion in Facebook Pixel:', error);
  }
}

/**
 * Track conversion event in dataLayer (for Google Tag Manager)
 */
function trackConversionDataLayer(data?: unknown): void {
  if (typeof window === 'undefined' || !(window as any).dataLayer) {
    devLog('dataLayer not available');
    return;
  }

  try {
    (window as any).dataLayer.push({
      event: 'booking_submission',
      event_category: 'Booking',
      event_label: 'Online Booking',
      value: 1,
      booking_data: data
    });

    devLog('Conversion tracked in dataLayer', data);
  } catch (error) {
    devError('Error tracking conversion in dataLayer:', error);
  }
}

/**
 * Track conversion using all available tracking methods
 */
function trackConversion(bookingData?: unknown): void {
  devLog('Tracking conversion for booking submission');

  // Track in Google Analytics
  trackConversionGA(bookingData);

  // Track in Facebook Pixel
  trackConversionFB(bookingData);

  // Track in dataLayer (GTM)
  trackConversionDataLayer(bookingData);
}

/**
 * Check if the message data indicates a successful booking submission
 * NOTE: The initialization data ({data: {id: 2327, ClientName: '...'}}) appears on page load
 * and should NOT be treated as a submission. We only look for explicit success indicators.
 */
function isBookingSubmission(data: unknown): boolean {
  if (!data || typeof data !== 'object') {
    return false;
  }

  const message = data as Record<string, unknown>;

  // Only trigger on explicit success indicators
  // Common patterns: type, event, status, action, etc.
  if (message.type === 'booking_success' || 
      message.event === 'booking_success' ||
      message.status === 'success' ||
      message.action === 'booking_complete' ||
      message.booking_status === 'completed' ||
      message.submitted === true ||
      message.success === true) {
    return true;
  }

  // Check if message contains submission indicators in string format
  if (typeof message.type === 'string') {
    const type = message.type.toLowerCase();
    if (type.includes('success') || type.includes('complete') || type.includes('submit')) {
      return true;
    }
  }

  if (typeof message.event === 'string') {
    const event = message.event.toLowerCase();
    if (event.includes('success') || event.includes('complete') || event.includes('submit')) {
      return true;
    }
  }

  return false;
}

/**
 * Handle successful booking submission
 */
function handleBookingSuccess(event: MessageEvent, bookingData?: unknown): void {
  devLog('Booking submission detected', event.data);

  // Mark in sessionStorage that a booking was just submitted
  // This persists across page refreshes
  try {
    sessionStorage.setItem('ars_booking_submitted', 'true');
    sessionStorage.setItem('ars_booking_timestamp', Date.now().toString());
    if (bookingData) {
      try {
        sessionStorage.setItem('ars_booking_data', JSON.stringify(bookingData));
      } catch (e) {
        devLog('Could not store booking data in sessionStorage');
      }
    }
  } catch (e) {
    devLog('Could not write to sessionStorage:', e);
  }

  // Track conversion
  trackConversion(bookingData || event.data);

  // Redirect to thank-you page
  // Use replace() to avoid adding to browser history
  devLog('Redirecting to thank-you page:', THANK_YOU_PAGE_URL);
  window.location.replace(THANK_YOU_PAGE_URL);
}

/**
 * Check if we should redirect to thank-you page on page load
 * This handles cases where the booking system refreshes the page after submission
 */
function checkForBookingSubmission(): void {
  try {
    // First, check URL parameters for success indicators
    // Some booking systems add parameters like ?success=1 or ?booking=success
    const urlParams = new URLSearchParams(window.location.search);
    const successParams = ['success', 'booking', 'submitted', 'confirmed', 'complete', 'thankyou'];
    let hasSuccessParam = false;
    
    for (const param of successParams) {
      const value = urlParams.get(param);
      if (value && (value === '1' || value === 'true' || value.toLowerCase().includes('success'))) {
        hasSuccessParam = true;
        devLog(`✓ Success parameter detected in URL: ${param}=${value}`);
        break;
      }
    }

    if (hasSuccessParam) {
      // Clear URL parameters
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);

      // Track conversion and redirect
      trackConversion();
      devLog('Redirecting to thank-you page based on URL parameter');
      window.location.replace(THANK_YOU_PAGE_URL);
      return;
    }

    // Check for explicit booking submission flag (from postMessage)
    const bookingSubmitted = sessionStorage.getItem('ars_booking_submitted');
    const bookingTimestamp = sessionStorage.getItem('ars_booking_timestamp');

    if (bookingSubmitted === 'true' && bookingTimestamp) {
      const timestamp = parseInt(bookingTimestamp, 10);
      const now = Date.now();
      const timeDiff = now - timestamp;

      // Only redirect if booking was submitted within the last 10 seconds
      if (timeDiff < 10000) {
        devLog('✓ Booking submission detected from sessionStorage (postMessage)');
        devLog(`Time since submission: ${timeDiff}ms`);

        // Get booking data if available
        let bookingData: unknown = null;
        try {
          const dataStr = sessionStorage.getItem('ars_booking_data');
          if (dataStr) {
            bookingData = JSON.parse(dataStr);
          }
        } catch (e) {
          // Ignore parsing errors
        }

        // Clear the flags
        sessionStorage.removeItem('ars_booking_submitted');
        sessionStorage.removeItem('ars_booking_timestamp');
        sessionStorage.removeItem('ars_booking_data');
        sessionStorage.removeItem('ars_booking_saw_confirmation');
        sessionStorage.removeItem('ars_booking_confirmation_timestamp');
        sessionStorage.removeItem('ars_booking_potential_submission');
        sessionStorage.removeItem('ars_booking_potential_timestamp');

        // Track conversion
        trackConversion(bookingData);

        // Redirect to thank-you page
        devLog('Redirecting to thank-you page:', THANK_YOU_PAGE_URL);
        window.location.replace(THANK_YOU_PAGE_URL);
        return;
      } else {
        // Clear stale data
        devLog('Clearing stale booking submission data');
        sessionStorage.removeItem('ars_booking_submitted');
        sessionStorage.removeItem('ars_booking_timestamp');
        sessionStorage.removeItem('ars_booking_data');
      }
    }

    // Check for potential submission (detected via iframe confirmation + page refresh pattern)
    const sawConfirmation = sessionStorage.getItem('ars_booking_saw_confirmation');
    const confirmationTimestamp = sessionStorage.getItem('ars_booking_confirmation_timestamp');
    const potentialSubmission = sessionStorage.getItem('ars_booking_potential_submission');
    const potentialTimestamp = sessionStorage.getItem('ars_booking_potential_timestamp');

    // If we saw a confirmation AND a potential submission flag, it's likely a real booking
    if (sawConfirmation === 'true' && potentialSubmission === 'true' && 
        confirmationTimestamp && potentialTimestamp) {
      const confTime = parseInt(confirmationTimestamp, 10);
      const potTime = parseInt(potentialTimestamp, 10);
      const now = Date.now();
      
      // Both should be recent (within last 15 seconds)
      if ((now - confTime < 15000) && (now - potTime < 15000)) {
        devLog('✓ Potential booking submission detected (confirmation + refresh pattern)');
        devLog('Redirecting to thank-you page based on iframe confirmation pattern');

        // Clear the flags
        sessionStorage.removeItem('ars_booking_saw_confirmation');
        sessionStorage.removeItem('ars_booking_confirmation_timestamp');
        sessionStorage.removeItem('ars_booking_potential_submission');
        sessionStorage.removeItem('ars_booking_potential_timestamp');

        // Track conversion (without booking data since we don't have it)
        trackConversion();

        // Redirect to thank-you page
        window.location.replace(THANK_YOU_PAGE_URL);
        return;
      } else {
        // Clear stale data
        sessionStorage.removeItem('ars_booking_saw_confirmation');
        sessionStorage.removeItem('ars_booking_confirmation_timestamp');
        sessionStorage.removeItem('ars_booking_potential_submission');
        sessionStorage.removeItem('ars_booking_potential_timestamp');
      }
    }
  } catch (e) {
    devLog('Error checking for booking submission:', e);
  }
}

/**
 * Initialize booking iframe message listener
 * 
 * NOTE: We cannot monitor network requests from cross-origin iframes due to
 * browser security (Same-Origin Policy). We rely on:
 * 1. postMessage events from the iframe (if supported)
 * 2. Intercepting parent page redirects (if booking system redirects parent)
 * 3. Iframe load/navigation events (limited - cannot read cross-origin URLs)
 */
function initBookingIframeListener(): void {
  const iframe = document.querySelector<HTMLIFrameElement>('.booking-iframe');
  
  if (!iframe) {
    devLog('Booking iframe not found on page');
    return;
  }

  devLog('Initializing booking iframe listener');
  devLog('Waiting for booking submission events from iframe...');
  devLog('NOTE: Initialization data (id, ClientName) on page load is NOT a submission');
  devLog('NOTE: Cannot monitor network requests from cross-origin iframes (browser security)');

  // Track all messages for debugging
  let messageCount = 0;
  let initialHeight = iframe.offsetHeight;
  let loadCount = 0;
  let redirectIntercepted = false;
  const currentUrl = window.location.href;

  // Method 1: Listen for postMessage events from the iframe
  window.addEventListener('message', (event: MessageEvent) => {
    // Security: Only accept messages from the booking iframe origin
    if (event.origin !== BOOKING_IFRAME_ORIGIN) {
      devLog('Ignoring message from unauthorized origin:', event.origin);
      return;
    }

    messageCount++;
    devLog(`Message #${messageCount} received from booking iframe:`, {
      data: event.data,
      origin: event.origin,
      timestamp: new Date().toISOString()
    });

    // Log the full structure for debugging
    try {
      devLog('Full message structure:', JSON.stringify(event.data, null, 2));
    } catch (e) {
      devLog('Could not stringify message data');
    }

    // Check if this is a booking submission
    if (isBookingSubmission(event.data)) {
      devLog('✓ Booking submission detected via postMessage!');
      redirectIntercepted = true;
      handleBookingSuccess(event, event.data);
    } else {
      devLog('Message does not match submission criteria (this is normal for initialization/data messages)');
    }
  }, false);

  // Method 2: Detect page refresh/reload after booking submission
  // Since the booking system refreshes the page after showing confirmation in iframe,
  // we need to detect this before the refresh happens
  // We'll use sessionStorage to persist state across page refreshes
  
  // Track if we've seen multiple iframe load events (might indicate submission + refresh)
  let lastIframeLoadTime = Date.now();
  let iframeLoadEvents = 0;
  
  // Before the page unloads/refreshes, try to detect if a booking was submitted
  // We'll set a flag in sessionStorage if we detect the page is about to refresh
  window.addEventListener('beforeunload', () => {
    // If we've seen multiple iframe loads recently, it might be a submission
    // Set a flag that persists across page refresh
    try {
      const timeSinceLastLoad = Date.now() - lastIframeLoadTime;
      // If iframe loaded multiple times in quick succession (within 5 seconds),
      // and we're on the booking page, it might be a submission
      if (iframeLoadEvents > 1 && timeSinceLastLoad < 5000) {
        devLog('Multiple iframe loads detected before page unload - might be booking submission');
        sessionStorage.setItem('ars_booking_potential_submission', 'true');
        sessionStorage.setItem('ars_booking_potential_timestamp', Date.now().toString());
      }
    } catch (e) {
      // Ignore errors
    }
  });

  // Method 3: Monitor iframe load events (navigation detection)
  // Note: We cannot read cross-origin iframe URLs, but we can detect navigation
  iframe.addEventListener('load', () => {
    loadCount++;
    iframeLoadEvents++;
    lastIframeLoadTime = Date.now();
    devLog(`Iframe load event #${loadCount} detected`);
    devLog('NOTE: Cannot read iframe URL due to cross-origin restrictions');
    
    // Check if height changed significantly (might indicate success page)
    const currentHeight = iframe.offsetHeight;
    const heightDiff = Math.abs(currentHeight - initialHeight);
    
    // If this is a subsequent load (not the initial one) and height changed significantly,
    // it might indicate a confirmation/success page
    if (loadCount > 1) {
      devLog(`Iframe loaded ${loadCount} times. Height: ${currentHeight}px (initial: ${initialHeight}px, diff: ${heightDiff}px)`);
      
      if (heightDiff > 100) {
        devLog(`Significant height change detected (${heightDiff}px). This might indicate a success/confirmation page.`);
        
        // Wait a moment, then check if page is about to refresh
        // If we see confirmation page and then page refreshes, it's likely a submission
        setTimeout(() => {
          try {
            // Check if we're still on the page (if not, page refreshed)
            if (document.querySelector('.booking-iframe')) {
              devLog('Page still loaded after iframe height change - monitoring for page refresh');
              // Set a flag that we saw a potential confirmation
              sessionStorage.setItem('ars_booking_saw_confirmation', 'true');
              sessionStorage.setItem('ars_booking_confirmation_timestamp', Date.now().toString());
            }
          } catch (e) {
            // Page might have refreshed
          }
        }, 1000);
      }
    }
  });

  devLog('Booking iframe listener initialized and ready');
  devLog(`Initial iframe height: ${initialHeight}px`);
  devLog('Monitoring for: postMessage events, parent page redirects, and iframe navigation');
}

/**
 * Initialize booking iframe tracking
 */
export const initBookingIframe = (): void => {
  onDOMReady(() => {
    // First, check if we should redirect based on sessionStorage
    // This handles cases where the page was refreshed after booking submission
    checkForBookingSubmission();

    // Then initialize the listener for future submissions
    initBookingIframeListener();
  });
};
