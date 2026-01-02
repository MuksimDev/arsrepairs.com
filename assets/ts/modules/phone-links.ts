/**
 * Phone links module
 * Initializes phone number links throughout the site
 */

import { PHONE_DATA_ATTR } from "../constants";

/**
 * Initializes phone links by setting href and text content
 */
export const initPhoneLinks = (): void => {
  const phone = document.body.dataset[PHONE_DATA_ATTR as keyof DOMStringMap];
  if (!phone) return;

  const telHref = `tel:${phone.replace(/[^0-9+]/g, "")}`;
  document.querySelectorAll<HTMLAnchorElement>("[data-phone-link]").forEach((link) => {
    if (!link.textContent?.trim()) link.textContent = phone;
    link.href = telHref;
  });
};

