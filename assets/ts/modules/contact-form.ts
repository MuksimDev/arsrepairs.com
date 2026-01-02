/**
 * Contact Form Module
 * Handles form validation and submission for the contact form using Web3Forms
 */

import { onDOMReady } from '../utils/dom';

/**
 * Show error message for a field
 */
function showError(fieldId: string, message: string): void {
  const field = document.getElementById(fieldId);
  const errorEl = document.getElementById(fieldId + '-error');
  
  if (field && errorEl) {
    field.setAttribute('aria-invalid', 'true');
    field.classList.add('contact-form__input--error');
    errorEl.textContent = message;
    errorEl.style.display = 'block';
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
    errorEl.style.display = 'none';
  }
}

/**
 * Validator function type
 */
type Validator = (value: string) => string | null;

/**
 * Validators for all form fields
 */
const validators: Record<string, Validator> = {
  'name': (value: string) => {
    if (!value || value.trim().length === 0) return 'Name is required';
    if (value.length < 2) return 'Name must be at least 2 characters';
    return null;
  },
  'email': (value: string) => {
    if (!value || value.trim().length === 0) return 'Email is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) return 'Please enter a valid email address';
    return null;
  },
  'phone': (value: string) => {
    if (value && value.trim().length > 0) {
      const digitsOnly = value.replace(/\D/g, '');
      if (digitsOnly.length > 0 && digitsOnly.length < 10) {
        return 'Please enter a valid phone number';
      }
    }
    return null;
  },
  'message': (value: string) => {
    if (!value || value.trim().length === 0) return 'Message is required';
    if (value.length < 10) return 'Message must be at least 10 characters';
    return null;
  }
};

/**
 * Initialize real-time validation for all fields
 */
function initFieldValidation(): void {
  Object.keys(validators).forEach(fieldId => {
    const field = document.getElementById(fieldId);
    if (!field) return;

    const validator = validators[fieldId];
    if (!validator) return;

    // Validate on blur
    field.addEventListener('blur', function(this: HTMLElement) {
      const input = this as HTMLInputElement | HTMLTextAreaElement;
      const error = validator(input.value);
      if (error) {
        showError(fieldId, error);
      } else {
        clearError(fieldId);
      }
    });
    
    // Validate on input (only if field already has errors)
    field.addEventListener('input', function(this: HTMLElement) {
      if (this.getAttribute('aria-invalid') === 'true') {
        const input = this as HTMLInputElement | HTMLTextAreaElement;
        const error = validator(input.value);
        if (error) {
          showError(fieldId, error);
        } else {
          clearError(fieldId);
        }
      }
    });
  });
}

/**
 * Initialize contact form
 */
export const initContactForm = (): void => {
  const form = document.querySelector<HTMLFormElement>('form[name="contact"]');
  if (!form) return;

  const submitButton = document.getElementById('contact-submit');
  const liveRegion = document.getElementById('contact-live-region');
  const errorContainer = document.getElementById('contact-error');

  // Initialize field validation
  initFieldValidation();

  // Handle form submission
  form.addEventListener('submit', async function(e: Event) {
    e.preventDefault();
    
    if (errorContainer) errorContainer.style.display = 'none';
    
    let isValid = true;
    Object.keys(validators).forEach(fieldId => {
      const field = document.getElementById(fieldId) as HTMLInputElement | HTMLTextAreaElement | null;
      if (field) {
        const error = validators[fieldId](field.value);
        if (error) {
          showError(fieldId, error);
          isValid = false;
        } else {
          clearError(fieldId);
        }
      }
    });

    if (!isValid) {
      if (errorContainer) {
        errorContainer.textContent = 'Please correct the errors below before submitting.';
        errorContainer.style.display = 'block';
      }
      if (liveRegion) {
        liveRegion.textContent = 'Form has errors. Please review and correct them.';
      }
      const firstError = form.querySelector<HTMLElement>('[aria-invalid="true"]');
      if (firstError) firstError.focus();
      return;
    }

    if (submitButton) {
      submitButton.classList.add('contact-form__submit--loading');
      (submitButton as HTMLButtonElement).disabled = true;
      const btnText = submitButton.querySelector<HTMLElement>('.btn__text');
      if (btnText) btnText.textContent = 'Sending...';
    }

    if (liveRegion) {
      liveRegion.textContent = 'Sending your message...';
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
        // Success - redirect to thank you page immediately
        if (liveRegion) {
          liveRegion.textContent = 'Message sent successfully! Redirecting...';
        }
        // Use replace() to avoid adding to browser history
        const redirectUrl = form.querySelector<HTMLInputElement>('input[name="redirect"]')?.value || '/contact-us/thank-you/';
        window.location.replace(redirectUrl);
      } else {
        // Handle error from Web3Forms
        throw new Error(data.message || 'Failed to send message');
      }
    } catch (error) {
      // Handle network or other errors
      const errorMessage = error instanceof Error ? error.message : 'An error occurred. Please try again later.';
      
      if (errorContainer) {
        errorContainer.textContent = errorMessage;
        errorContainer.style.display = 'block';
      }
      if (liveRegion) {
        liveRegion.textContent = 'Error sending message. Please try again.';
      }
      
      if (submitButton) {
        submitButton.classList.remove('contact-form__submit--loading');
        (submitButton as HTMLButtonElement).disabled = false;
        const btnText = submitButton.querySelector<HTMLElement>('.btn__text');
        if (btnText) btnText.textContent = 'Send Message';
      }
    }
  });
};

