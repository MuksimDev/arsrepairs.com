// ns-hugo-imp:C:\Users\maxim\Documents\Dev\arsrepairs.com\assets\ts\utils\dom.ts
var isLocalhost = () => {
  return window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
};
var onDOMReady = (callback) => {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", callback);
  } else {
    callback();
  }
};

// <stdin>
var DEV_LOG = isLocalhost();
var VALIDATION_DEBOUNCE_MS = 300;
var MIN_NAME_LENGTH = 2;
var MAX_NAME_LENGTH = 100;
var MIN_PHONE_DIGITS = 10;
var MAX_PHONE_DIGITS = 15;
var MIN_PROBLEM_LENGTH = 10;
var CURRENT_DATE = (() => {
  const now = /* @__PURE__ */ new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().split("T")[0];
})();
function devLog(...args) {
  if (DEV_LOG) {
    console.log(...args);
  }
}
function devError(...args) {
  if (DEV_LOG) {
    console.error(...args);
  }
}
function devWarn(...args) {
  if (DEV_LOG) {
    console.warn(...args);
  }
}
function supportsDateInput() {
  const input = document.createElement("input");
  input.setAttribute("type", "date");
  return input.type === "date";
}
function setMinDate() {
  const dateInput = document.getElementById("booking-date");
  if (dateInput) {
    const now = /* @__PURE__ */ new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    dateInput.min = now.toISOString().slice(0, 10);
  }
}
function handleDateInputFallback() {
  const dateInput = document.getElementById("booking-date");
  if (!dateInput) return;
  if (supportsDateInput()) {
    devLog("Date input supported, upgrading to date type");
    dateInput.type = "date";
    setMinDate();
    const helpText = document.getElementById("booking-date-help");
    if (helpText) {
      helpText.textContent = "Please select a date for your preferred appointment";
    }
  } else {
    devLog("Date input not supported, using text input with formatting");
    dateInput.addEventListener("input", function(e) {
      const target = e.target;
      let value = target.value.replace(/\D/g, "");
      if (value.length > 4) {
        value = value.slice(0, 4) + "-" + value.slice(4);
      }
      if (value.length > 7) {
        value = value.slice(0, 7) + "-" + value.slice(7, 9);
      }
      target.value = value;
    });
  }
}
function getDiscountAmountFromURL() {
  if (typeof window === "undefined" || !window.location) {
    return null;
  }
  const params = new URLSearchParams(window.location.search);
  const code = params.get("coupon") || params.get("code");
  if (code) return code.replace(/[^0-9]/g, "");
  const legacy = window.location.search.match(/[?&](\d+)/);
  return legacy ? legacy[1] : null;
}
function findMatchingCoupon(discountAmountStr, couponsData) {
  const amount = Number(discountAmountStr);
  if (isNaN(amount)) return null;
  const regularMatch = couponsData.regular?.find((c) => c.amount === amount);
  if (regularMatch) {
    devLog("Regular coupon matched:", regularMatch.title);
    return { coupon: regularMatch, type: "regular" };
  }
  const today = CURRENT_DATE;
  const seasonalMatch = couponsData.seasonal?.find(
    (c) => c.amount === amount && c.start_date && c.end_date && today >= c.start_date && today <= c.end_date
  );
  if (seasonalMatch) {
    devLog("Seasonal coupon matched:", seasonalMatch.title);
    return { coupon: seasonalMatch, type: "seasonal" };
  }
  devLog("No coupon found for amount:", amount);
  return null;
}
function extractCouponTitle(coupon) {
  return coupon.title.split(" - ")[0].split(" \u2013 ")[0];
}
function applyCoupon(coupon, type) {
  devLog("Applying coupon:", coupon, "Type:", type);
  const couponAppliedEl = document.getElementById("coupon-applied");
  const couponTitleEl = document.getElementById("coupon-applied-title");
  const couponCodeEl = document.getElementById("coupon-code");
  const couponTypeEl = document.getElementById("coupon-type");
  const infoContainer = document.getElementById("booking-info");
  devLog("Coupon elements found:", {
    couponAppliedEl: !!couponAppliedEl,
    couponTitleEl: !!couponTitleEl,
    couponCodeEl: !!couponCodeEl,
    couponTypeEl: !!couponTypeEl
  });
  const niceTitle = extractCouponTitle(coupon);
  const successMessage = `${niceTitle} Coupon Applied!`;
  if (couponAppliedEl && couponTitleEl) {
    couponTitleEl.textContent = successMessage;
    devLog("Coupon applied successfully:", coupon.title, "Type:", type);
    couponAppliedEl.classList.remove("coupon-applied--hidden");
    if (infoContainer) {
      infoContainer.classList.add("contact-form__status--hidden");
    }
  } else {
    devError("Coupon banner elements are missing after coupon match. Banner may have been detached by DOM mutation.", {
      couponAppliedEl,
      couponTitleEl
    });
    if (infoContainer) {
      infoContainer.textContent = successMessage;
      infoContainer.classList.remove("contact-form__status--hidden");
      devLog("Fell back to showing coupon message in info container");
    }
  }
  if (couponCodeEl) {
    couponCodeEl.value = coupon.title;
  }
  if (couponTypeEl) {
    couponTypeEl.value = type;
    devLog("Coupon type set to:", type);
  }
}
function createCouponFromAmount(discountAmount) {
  const amount = Number(discountAmount);
  if (isNaN(amount) || amount <= 0) {
    devWarn("Invalid discount amount:", discountAmount);
    return null;
  }
  return {
    title: `$${discountAmount} Off`,
    amount
  };
}
function processCouponCode() {
  const discountAmount = getDiscountAmountFromURL();
  if (!discountAmount) {
    devLog("No discount amount found in URL");
    return;
  }
  devLog("Discount amount from URL:", discountAmount);
  const couponFromURL = createCouponFromAmount(discountAmount);
  if (!couponFromURL) {
    devError("Invalid discount amount in URL:", discountAmount);
    return;
  }
  const couponsScript = document.getElementById("coupons-data");
  if (!couponsScript || !couponsScript.textContent) {
    devWarn("Coupons data script not found or empty, applying coupon directly from URL");
    applyCoupon(couponFromURL, "regular");
    return;
  }
  try {
    const couponsData = JSON.parse(couponsScript.textContent);
    devLog("Coupons data loaded:", couponsData);
    devLog("Regular coupons:", couponsData.regular?.length || 0);
    devLog("Seasonal coupons:", couponsData.seasonal?.length || 0);
    if ((!couponsData.regular || couponsData.regular.length === 0) && (!couponsData.seasonal || couponsData.seasonal.length === 0)) {
      devWarn("Coupons data is empty, applying coupon directly from URL");
      applyCoupon(couponFromURL, "regular");
      return;
    }
    const matchResult = findMatchingCoupon(discountAmount, couponsData);
    devLog("Matched coupon:", matchResult);
    if (matchResult) {
      applyCoupon(matchResult.coupon, matchResult.type);
    } else {
      devWarn("No matching coupon found in data, applying coupon directly from URL");
      applyCoupon(couponFromURL, "regular");
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    devError("Error parsing coupons data:", errorMessage);
    devWarn("Applying coupon directly from URL due to parsing error");
    applyCoupon(couponFromURL, "regular");
  }
}
function showError(fieldId, message) {
  const field = document.getElementById(fieldId);
  const errorEl = document.getElementById(fieldId + "-error");
  if (field && errorEl) {
    field.setAttribute("aria-invalid", "true");
    field.classList.add("contact-form__input--error");
    field.classList.remove("contact-form__input--success");
    errorEl.textContent = message;
  }
}
function clearError(fieldId) {
  const field = document.getElementById(fieldId);
  const errorEl = document.getElementById(fieldId + "-error");
  if (field && errorEl) {
    field.removeAttribute("aria-invalid");
    field.classList.remove("contact-form__input--error");
    errorEl.textContent = "";
  }
}
function validateField(fieldId, value, validator) {
  const error = validator(value);
  if (error) {
    showError(fieldId, error);
    return false;
  } else {
    clearError(fieldId);
    return true;
  }
}
var validators = {
  "booking-name": (value) => {
    if (!value || value.trim().length === 0) return "Name is required";
    if (value.length < MIN_NAME_LENGTH) return `Name must be at least ${MIN_NAME_LENGTH} characters`;
    if (value.length > MAX_NAME_LENGTH) return `Name must be less than ${MAX_NAME_LENGTH} characters`;
    return null;
  },
  "booking-email": (value) => {
    if (!value || value.trim().length === 0) return "Email is required";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) return "Please enter a valid email address";
    return null;
  },
  "booking-phone": (value) => {
    if (!value || value.trim().length === 0) return "Phone number is required";
    const digitsOnly = value.replace(/\D/g, "");
    const digitCount = digitsOnly.length;
    if (digitCount < MIN_PHONE_DIGITS || digitCount > MAX_PHONE_DIGITS) {
      return `Please enter a valid phone number (${MIN_PHONE_DIGITS}-${MAX_PHONE_DIGITS} digits)`;
    }
    if (digitCount === 11 && digitsOnly[0] !== "1") {
      return "Please enter a valid phone number";
    }
    return null;
  },
  "booking-make": (value) => {
    if (!value || value.trim().length === 0) return "Appliance make is required";
    return null;
  },
  "booking-model": (value) => {
    if (!value || value.trim().length === 0) return "Appliance model is required";
    return null;
  },
  "booking-date": (value) => {
    if (!value) return "Preferred date is required";
    const datePattern = /^\d{4}-\d{2}-\d{2}$/;
    if (!datePattern.test(value)) {
      return "Please enter a valid date in YYYY-MM-DD format";
    }
    const selectedDate = /* @__PURE__ */ new Date(value + "T00:00:00");
    if (isNaN(selectedDate.getTime())) {
      return "Please enter a valid date";
    }
    const dateParts = value.split("-").map(Number);
    if (dateParts.length !== 3) {
      return "Please enter a valid date";
    }
    const [year, month, day] = dateParts;
    if (selectedDate.getFullYear() !== year || selectedDate.getMonth() + 1 !== month || selectedDate.getDate() !== day) {
      return "Please enter a valid date";
    }
    const now = /* @__PURE__ */ new Date();
    now.setHours(0, 0, 0, 0);
    if (selectedDate < now) return "Please select a future date";
    return null;
  },
  "booking-time": (value) => {
    if (!value || value.trim().length === 0) return "Preferred time is required";
    return null;
  },
  "booking-problem": (value) => {
    if (!value || value.trim().length === 0) return "Problem description is required";
    if (value.length < MIN_PROBLEM_LENGTH) return `Please provide more details (at least ${MIN_PROBLEM_LENGTH} characters)`;
    return null;
  }
};
function debounce(func, wait) {
  let timeout = null;
  return function executedFunction(...args) {
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
function initFieldValidation() {
  Object.keys(validators).forEach((fieldId) => {
    const field = document.getElementById(fieldId);
    if (!field) {
      devWarn(`Field not found: ${fieldId}`);
      return;
    }
    const validator = validators[fieldId];
    if (!validator) {
      devWarn(`No validator found for field: ${fieldId}`);
      return;
    }
    field.addEventListener("blur", () => {
      validateField(fieldId, field.value, validator);
    });
    const debouncedValidate = debounce(() => {
      if (field.getAttribute("aria-invalid") === "true") {
        validateField(fieldId, field.value, validator);
      }
    }, VALIDATION_DEBOUNCE_MS);
    field.addEventListener("input", debouncedValidate);
  });
}
function initFormSubmission() {
  const form = document.querySelector('form[name="booking"]');
  if (!form) return;
  const submitButton = document.getElementById("booking-submit");
  const liveRegion = document.getElementById("booking-live-region");
  const errorContainer = document.getElementById("booking-error");
  const infoContainer = document.getElementById("booking-info");
  form.addEventListener("submit", async function(e) {
    e.preventDefault();
    if (errorContainer) errorContainer.classList.add("contact-form__status--hidden");
    if (infoContainer) infoContainer.classList.add("contact-form__status--hidden");
    let isValid = true;
    Object.keys(validators).forEach((fieldId) => {
      const field = document.getElementById(fieldId);
      const validator = validators[fieldId];
      if (field && validator) {
        if (!validateField(fieldId, field.value, validator)) {
          isValid = false;
        }
      }
    });
    if (!isValid) {
      if (errorContainer) {
        errorContainer.textContent = "Please correct the errors below before submitting.";
        errorContainer.classList.remove("contact-form__status--hidden");
      }
      if (liveRegion) {
        liveRegion.textContent = "Form has errors. Please review and correct them.";
      }
      const firstError = form.querySelector('[aria-invalid="true"]');
      if (firstError) firstError.focus();
      return;
    }
    if (submitButton) {
      submitButton.classList.add("contact-form__submit--loading");
      submitButton.disabled = true;
      const btnText = submitButton.querySelector(".btn__text");
      if (btnText) btnText.textContent = "Submitting...";
    }
    if (liveRegion) {
      liveRegion.textContent = "Submitting your booking request...";
    }
    const formData = new FormData(form);
    try {
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        body: formData
      });
      const data = await response.json();
      if (data.success) {
        if (liveRegion) {
          liveRegion.textContent = "Booking request sent successfully! Redirecting...";
        }
        const redirectUrl = form.querySelector('input[name="redirect"]')?.value || "/book/thank-you/";
        window.location.replace(redirectUrl);
      } else {
        throw new Error(data.message || "Failed to send booking request");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An error occurred. Please try again later.";
      if (errorContainer) {
        errorContainer.textContent = errorMessage;
        errorContainer.classList.remove("contact-form__status--hidden");
      }
      if (liveRegion) {
        liveRegion.textContent = "Error sending booking request. Please try again.";
      }
      if (submitButton) {
        submitButton.classList.remove("contact-form__submit--loading");
        submitButton.disabled = false;
        const btnText = submitButton.querySelector(".btn__text");
        if (btnText) btnText.textContent = "Book Appointment";
      }
    }
  });
}
var initBookingForm = () => {
  onDOMReady(() => {
    processCouponCode();
    handleDateInputFallback();
    initFieldValidation();
    initFormSubmission();
  });
};
export {
  initBookingForm
};
