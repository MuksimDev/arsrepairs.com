/**
 * Booking Form Module
 * Handles form validation, coupon code processing, and submission for the booking form
 */

import { onDOMReady, isLocalhost } from '../utils/dom';

interface Coupon {
  title: string;
  amount?: number;        // explicit dollar amount
  code?: string;          // optional, future-proof
  start_date?: string;
  end_date?: string;
}

interface CouponsData {
  regular?: Coupon[];
  seasonal?: Coupon[];
}

// Constants
const DEV_LOG = isLocalhost();
const VALIDATION_DEBOUNCE_MS = 300;
const MIN_NAME_LENGTH = 2;
const MAX_NAME_LENGTH = 100;
const MIN_PHONE_DIGITS = 10;
const MAX_PHONE_DIGITS = 15;
const MIN_PROBLEM_LENGTH = 10;

// Cache current local date (normalized) to avoid UTC off-by-one issues
const CURRENT_DATE = (() => {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().split('T')[0];
})();

/**
 * Development logging helper
 */
function devLog(...args: unknown[]): void {
  if (DEV_LOG) {
    console.log(...args);
  }
}

/**
 * Development error logging helper
 */
function devError(...args: unknown[]): void {
  if (DEV_LOG) {
    console.error(...args);
  }
}

/**
 * Development warning logging helper
 */
function devWarn(...args: unknown[]): void {
  if (DEV_LOG) {
    console.warn(...args);
  }
}

/**
 * Check if browser supports date input type
 */
function supportsDateInput(): boolean {
  const input = document.createElement('input');
  input.setAttribute('type', 'date');
  // In browsers that don't support date input, the type falls back to "text"
  return input.type === 'date';
}

/**
 * Set minimum date to today for date input
 */
function setMinDate(): void {
  const dateInput = document.getElementById('booking-date') as HTMLInputElement | null;
  if (dateInput) {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    dateInput.min = now.toISOString().slice(0, 10);
  }
}

/**
 * Handle date input with progressive enhancement
 * Upgrades to date input if supported, otherwise uses text input with formatting
 */
function handleDateInputFallback(): void {
  const dateInput = document.getElementById('booking-date') as HTMLInputElement | null;
  if (!dateInput) return;

  // Check if date input is supported
  if (supportsDateInput()) {
    devLog('Date input supported, upgrading to date type');
    
    // Upgrade to date input type
    dateInput.type = 'date';
    
    // Set minimum date
    setMinDate();
    
    // Update help text for date picker
    const helpText = document.getElementById('booking-date-help');
    if (helpText) {
      helpText.textContent = 'Please select a date for your preferred appointment';
    }
  } else {
    devLog('Date input not supported, using text input with formatting');
    
    // Keep as text input and add formatting helper
    // Pattern and placeholder are already set in HTML
    
    // Add input formatting to help users enter dates correctly
    dateInput.addEventListener('input', function(e: Event) {
      const target = e.target as HTMLInputElement;
      let value = target.value.replace(/\D/g, ''); // Remove non-digits
      
      // Format as YYYY-MM-DD
      if (value.length > 4) {
        value = value.slice(0, 4) + '-' + value.slice(4);
      }
      if (value.length > 7) {
        value = value.slice(0, 7) + '-' + value.slice(7, 9);
      }
      
      target.value = value;
    });
  }
}

/**
 * Extract discount amount from URL query string
 * Handles formats like: ?25, ?code=25, ?coupon=25
 */
function getDiscountAmountFromURL(): string | null {
  if (typeof window === 'undefined' || !window.location) {
    return null;
  }

  const params = new URLSearchParams(window.location.search);
  const code = params.get('coupon') || params.get('code');
  if (code) return code.replace(/[^0-9]/g, '');

  // Keep backward compatibility with existing ?25 links
  const legacy = window.location.search.match(/[?&](\d+)/);
  return legacy ? legacy[1] : null;
}

/**
 * Find matching coupon by discount amount
 * Returns the coupon and its type ('regular' or 'seasonal')
 */
function findMatchingCoupon(
  discountAmountStr: string,
  couponsData: CouponsData
): { coupon: Coupon; type: 'regular' | 'seasonal' } | null {
  const amount = Number(discountAmountStr);
  if (isNaN(amount)) return null;

  // Regular coupons
  const regularMatch = couponsData.regular?.find(c => c.amount === amount);
  if (regularMatch) {
    devLog('Regular coupon matched:', regularMatch.title);
    return { coupon: regularMatch, type: 'regular' };
  }

  // Seasonal coupons (only if active today)
  const today = CURRENT_DATE;
  const seasonalMatch = couponsData.seasonal?.find(c =>
    c.amount === amount &&
    c.start_date && c.end_date &&
    today >= c.start_date && today <= c.end_date
  );

  if (seasonalMatch) {
    devLog('Seasonal coupon matched:', seasonalMatch.title);
    return { coupon: seasonalMatch, type: 'seasonal' };
  }

  devLog('No coupon found for amount:', amount);
  return null;
}

/**
 * Extract clean title from coupon (removes dashes and extra text)
 */
function extractCouponTitle(coupon: Coupon): string {
  return coupon.title.split(' - ')[0].split(' – ')[0];
}

/**
 * Apply coupon to the form
 */
function applyCoupon(coupon: Coupon, type: 'regular' | 'seasonal'): void {
  devLog('Applying coupon:', coupon, 'Type:', type);
  
  const couponAppliedEl = document.getElementById('coupon-applied');
  const couponTitleEl = document.getElementById('coupon-applied-title');
  const couponCodeEl = document.getElementById('coupon-code') as HTMLInputElement | null;
  const couponTypeEl = document.getElementById('coupon-type') as HTMLInputElement | null;
  const infoContainer = document.getElementById('booking-info');

  devLog('Coupon elements found:', {
    couponAppliedEl: !!couponAppliedEl,
    couponTitleEl: !!couponTitleEl,
    couponCodeEl: !!couponCodeEl,
    couponTypeEl: !!couponTypeEl
  });

  const niceTitle = extractCouponTitle(coupon);
  const successMessage = `${niceTitle} Coupon Applied!`;

  if (couponAppliedEl && couponTitleEl) {
    couponTitleEl.textContent = successMessage;
    devLog('Coupon applied successfully:', coupon.title, 'Type:', type);
    couponAppliedEl.classList.remove('coupon-applied--hidden');
    
    // Hide any previous error/info messages
    if (infoContainer) {
      infoContainer.classList.add('contact-form__status--hidden');
    }
  } else {
    devError('Coupon banner elements are missing after coupon match. Banner may have been detached by DOM mutation.', {
      couponAppliedEl: couponAppliedEl,
      couponTitleEl: couponTitleEl
    });
    
    // Fallback: Show success message in #booking-info if banner is missing
    if (infoContainer) {
      infoContainer.textContent = successMessage;
      infoContainer.classList.remove('contact-form__status--hidden');
      devLog('Fell back to showing coupon message in info container');
    }
  }

  if (couponCodeEl) {
    couponCodeEl.value = coupon.title;
  }

  if (couponTypeEl) {
    couponTypeEl.value = type;
    devLog('Coupon type set to:', type);
  }
}

/**
 * Create a coupon object from discount amount string
 */
function createCouponFromAmount(discountAmount: string): Coupon | null {
  const amount = Number(discountAmount);
  if (isNaN(amount) || amount <= 0) {
    devWarn('Invalid discount amount:', discountAmount);
    return null;
  }
  return {
    title: `$${discountAmount} Off`,
    amount: amount
  };
}

/**
 * Process coupon code from URL
 */
function processCouponCode(): void {
  const discountAmount = getDiscountAmountFromURL();
  if (!discountAmount) {
    devLog('No discount amount found in URL');
    return;
  }

  devLog('Discount amount from URL:', discountAmount);

  // Create a coupon object from the discount amount (fallback if data not available)
  const couponFromURL = createCouponFromAmount(discountAmount);
  if (!couponFromURL) {
    devError('Invalid discount amount in URL:', discountAmount);
    return;
  }

  // Try to load coupons data to find a matching coupon with full details
  const couponsScript = document.getElementById('coupons-data');
  if (!couponsScript || !couponsScript.textContent) {
    devWarn('Coupons data script not found or empty, applying coupon directly from URL');
    applyCoupon(couponFromURL, 'regular');
    return;
  }

  try {
    const couponsData: CouponsData = JSON.parse(couponsScript.textContent);
    devLog('Coupons data loaded:', couponsData);
    devLog('Regular coupons:', couponsData.regular?.length || 0);
    devLog('Seasonal coupons:', couponsData.seasonal?.length || 0);
    
    // Validate coupons data structure
    if ((!couponsData.regular || couponsData.regular.length === 0) && 
        (!couponsData.seasonal || couponsData.seasonal.length === 0)) {
      devWarn('Coupons data is empty, applying coupon directly from URL');
      applyCoupon(couponFromURL, 'regular');
      return;
    }
    
    const matchResult = findMatchingCoupon(discountAmount, couponsData);
    devLog('Matched coupon:', matchResult);

    if (matchResult) {
      applyCoupon(matchResult.coupon, matchResult.type);
    } else {
      devWarn('No matching coupon found in data, applying coupon directly from URL');
      applyCoupon(couponFromURL, 'regular');
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    devError('Error parsing coupons data:', errorMessage);
    devWarn('Applying coupon directly from URL due to parsing error');
    applyCoupon(couponFromURL, 'regular');
  }
}

/**
 * Show error message for a field
 */
function showError(fieldId: string, message: string): void {
  const field = document.getElementById(fieldId);
  const errorEl = document.getElementById(fieldId + '-error');

  if (field && errorEl) {
    field.setAttribute('aria-invalid', 'true');
    field.classList.add('contact-form__input--error');
    field.classList.remove('contact-form__input--success');
    errorEl.textContent = message;
    // Note: Error messages for individual fields don't use --hidden class
    // They are always visible when they have content
  }
}

/**
 * Clear error message for a field
 */
function clearError(fieldId: string): void {
  const field = document.getElementById(fieldId);
  const errorEl = document.getElementById(fieldId + '-error');

  if (field && errorEl) {
    field.removeAttribute('aria-invalid');
    field.classList.remove('contact-form__input--error');
    errorEl.textContent = '';
    // Note: Error messages for individual fields don't use --hidden class
    // They are hidden by clearing their text content
  }
}

/**
 * Validator function type
 */
type Validator = (value: string) => string | null;

/**
 * Validate a field using its validator
 */
function validateField(fieldId: string, value: string, validator: Validator): boolean {
  const error = validator(value);
  if (error) {
    showError(fieldId, error);
    return false;
  } else {
    clearError(fieldId);
    return true;
  }
}

/**
 * Validators for all form fields
 */
const validators: Record<string, Validator> = {
  'booking-name': (value: string) => {
    if (!value || value.trim().length === 0) return 'Name is required';
    if (value.length < MIN_NAME_LENGTH) return `Name must be at least ${MIN_NAME_LENGTH} characters`;
    if (value.length > MAX_NAME_LENGTH) return `Name must be less than ${MAX_NAME_LENGTH} characters`;
    return null;
  },
  'booking-email': (value: string) => {
    if (!value || value.trim().length === 0) return 'Email is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) return 'Please enter a valid email address';
    return null;
  },
  'booking-phone': (value: string) => {
    if (!value || value.trim().length === 0) return 'Phone number is required';
    const digitsOnly = value.replace(/\D/g, '');
    const digitCount = digitsOnly.length;
    
    // Validate digit count (supports international: 10-15 digits)
    if (digitCount < MIN_PHONE_DIGITS || digitCount > MAX_PHONE_DIGITS) {
      return `Please enter a valid phone number (${MIN_PHONE_DIGITS}-${MAX_PHONE_DIGITS} digits)`;
    }
    
    // North American format: if 11 digits, first must be 1 (country code)
    if (digitCount === 11 && digitsOnly[0] !== '1') {
        return 'Please enter a valid phone number';
    }
    
    return null;
  },
  'booking-make': (value: string) => {
    if (!value || value.trim().length === 0) return 'Appliance make is required';
    return null;
  },
  'booking-model': (value: string) => {
    if (!value || value.trim().length === 0) return 'Appliance model is required';
    return null;
  },
  'booking-date': (value: string) => {
    if (!value) return 'Preferred date is required';
    
    // Validate date format (YYYY-MM-DD)
    const datePattern = /^\d{4}-\d{2}-\d{2}$/;
    if (!datePattern.test(value)) {
      return 'Please enter a valid date in YYYY-MM-DD format';
    }
    
    // Validate that it's a valid date
    const selectedDate = new Date(value + 'T00:00:00');
    if (isNaN(selectedDate.getTime())) {
      return 'Please enter a valid date';
    }
    
    // Validate that the date matches the input (catches invalid dates like 2025-13-45)
    const dateParts = value.split('-').map(Number);
    if (dateParts.length !== 3) {
      return 'Please enter a valid date';
    }
    const [year, month, day] = dateParts;
    if (selectedDate.getFullYear() !== year || 
        selectedDate.getMonth() + 1 !== month || 
        selectedDate.getDate() !== day) {
      return 'Please enter a valid date';
    }
    
    // Validate that it's a future date
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    if (selectedDate < now) return 'Please select a future date';
    return null;
  },
  'booking-time': (value: string) => {
    if (!value || value.trim().length === 0) return 'Preferred time is required';
    return null;
  },
  'booking-problem': (value: string) => {
    if (!value || value.trim().length === 0) return 'Problem description is required';
    if (value.length < MIN_PROBLEM_LENGTH) return `Please provide more details (at least ${MIN_PROBLEM_LENGTH} characters)`;
    return null;
  }
};

/**
 * Debounce function to limit how often a function is called
 */
function debounce<T extends (...args: unknown[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Initialize real-time validation for all fields
 */
function initFieldValidation(): void {
  Object.keys(validators).forEach(fieldId => {
    const field = document.getElementById(fieldId) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null;
    if (!field) {
      devWarn(`Field not found: ${fieldId}`);
      return;
    }

    const validator = validators[fieldId];
    if (!validator) {
      devWarn(`No validator found for field: ${fieldId}`);
      return;
    }

      // Validate on blur (immediate)
      field.addEventListener('blur', () => {
      validateField(fieldId, field.value, validator);
      });

      // Debounced validation on input (only if field already has errors)
      const debouncedValidate = debounce(() => {
        if (field.getAttribute('aria-invalid') === 'true') {
        validateField(fieldId, field.value, validator);
        }
    }, VALIDATION_DEBOUNCE_MS);

      field.addEventListener('input', debouncedValidate);
  });
}


/**
 * Handle form submission
 */
function initFormSubmission(): void {
  const form = document.querySelector<HTMLFormElement>('form[name="booking"]');
  if (!form) return;

  const submitButton = document.getElementById('booking-submit');
  const liveRegion = document.getElementById('booking-live-region');
  const errorContainer = document.getElementById('booking-error');
  const infoContainer = document.getElementById('booking-info');

  form.addEventListener('submit', async function(e: Event) {
    e.preventDefault();

    // Hide previous messages
    if (errorContainer) errorContainer.classList.add('contact-form__status--hidden');
    if (infoContainer) infoContainer.classList.add('contact-form__status--hidden');

    // Validate all fields
    let isValid = true;
    Object.keys(validators).forEach(fieldId => {
      const field = document.getElementById(fieldId) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null;
      const validator = validators[fieldId];
      if (field && validator) {
        if (!validateField(fieldId, field.value, validator)) {
          isValid = false;
        }
      }
    });

    if (!isValid) {
      if (errorContainer) {
        errorContainer.textContent = 'Please correct the errors below before submitting.';
        errorContainer.classList.remove('contact-form__status--hidden');
      }
      if (liveRegion) {
        liveRegion.textContent = 'Form has errors. Please review and correct them.';
      }
      // Focus first error field
      const firstError = form.querySelector<HTMLElement>('[aria-invalid="true"]');
      if (firstError) firstError.focus();
      return;
    }

    // Show loading state
    if (submitButton) {
      submitButton.classList.add('contact-form__submit--loading');
      (submitButton as HTMLButtonElement).disabled = true;
      const btnText = submitButton.querySelector<HTMLElement>('.btn__text');
      if (btnText) btnText.textContent = 'Submitting...';
    }

    if (liveRegion) {
      liveRegion.textContent = 'Submitting your booking request...';
    }

    // Prepare form data for Web3Forms
    const formData = new FormData(form);

    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        // Success - redirect to thank you page
        if (liveRegion) {
          liveRegion.textContent = 'Booking request sent successfully! Redirecting...';
        }
        // Use replace() to avoid adding to browser history
        const redirectUrl = form.querySelector<HTMLInputElement>('input[name="redirect"]')?.value || '/book/thank-you/';
        window.location.replace(redirectUrl);
      } else {
        // Handle error from Web3Forms
        throw new Error(data.message || 'Failed to send booking request');
      }
    } catch (error) {
      // Handle network or other errors
      const errorMessage = error instanceof Error ? error.message : 'An error occurred. Please try again later.';
      
      if (errorContainer) {
        errorContainer.textContent = errorMessage;
        errorContainer.classList.remove('contact-form__status--hidden');
      }
      if (liveRegion) {
        liveRegion.textContent = 'Error sending booking request. Please try again.';
      }
      
      if (submitButton) {
        submitButton.classList.remove('contact-form__submit--loading');
        (submitButton as HTMLButtonElement).disabled = false;
        const btnText = submitButton.querySelector<HTMLElement>('.btn__text');
        if (btnText) btnText.textContent = 'Book Appointment';
      }
    }
  });
}

/**
 * Initialize booking form
 */
export const initBookingForm = (): void => {
  // Wait for DOM to be ready before initializing
  onDOMReady(() => {
    // Process coupon code from URL FIRST
    // This must run before handleDateInputFallback() because changing input.type
    // in Safari triggers DOM mutations that can detach the coupon banner elements
    processCouponCode();

    // Handle date input (with Safari < 14.1 fallback)
    // This runs after coupon processing to avoid DOM mutations affecting coupon banner
    handleDateInputFallback();

    // Initialize form validation
    initFieldValidation();

    // Initialize form submission
    initFormSubmission();
  });
};

