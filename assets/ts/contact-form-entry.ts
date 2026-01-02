/**
 * Contact Form Entry Point
 * This file is compiled separately and loaded only when the contact form is present
 */

import { initContactForm } from './modules/contact-form';
import { onDOMReady } from './utils/dom';

// Initialize the contact form when DOM is ready
onDOMReady(() => {
  initContactForm();
});

