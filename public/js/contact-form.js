// ns-hugo-imp:C:\Users\maxim\Documents\Dev\arsrepairs.com\themes\arsrepairs-theme\assets\ts\modules\contact-form.ts
function showError(fieldId, message) {
  const field = document.getElementById(fieldId);
  const errorEl = document.getElementById(fieldId + "-error");
  if (field && errorEl) {
    field.setAttribute("aria-invalid", "true");
    field.classList.add("contact-form__input--error");
    errorEl.textContent = message;
    errorEl.style.display = "block";
  }
}
function clearError(fieldId) {
  const field = document.getElementById(fieldId);
  const errorEl = document.getElementById(fieldId + "-error");
  if (field && errorEl) {
    field.removeAttribute("aria-invalid");
    field.classList.remove("contact-form__input--error");
    errorEl.textContent = "";
    errorEl.style.display = "none";
  }
}
var validators = {
  "name": (value) => {
    if (!value || value.trim().length === 0) return "Name is required";
    if (value.length < 2) return "Name must be at least 2 characters";
    return null;
  },
  "email": (value) => {
    if (!value || value.trim().length === 0) return "Email is required";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) return "Please enter a valid email address";
    return null;
  },
  "phone": (value) => {
    if (value && value.trim().length > 0) {
      const digitsOnly = value.replace(/\D/g, "");
      if (digitsOnly.length > 0 && digitsOnly.length < 10) {
        return "Please enter a valid phone number";
      }
    }
    return null;
  },
  "message": (value) => {
    if (!value || value.trim().length === 0) return "Message is required";
    if (value.length < 10) return "Message must be at least 10 characters";
    return null;
  }
};
function initFieldValidation() {
  Object.keys(validators).forEach((fieldId) => {
    const field = document.getElementById(fieldId);
    if (!field) return;
    const validator = validators[fieldId];
    if (!validator) return;
    field.addEventListener("blur", function() {
      const input = this;
      const error = validator(input.value);
      if (error) {
        showError(fieldId, error);
      } else {
        clearError(fieldId);
      }
    });
    field.addEventListener("input", function() {
      if (this.getAttribute("aria-invalid") === "true") {
        const input = this;
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
var initContactForm = () => {
  const form = document.querySelector('form[name="contact"]');
  if (!form) return;
  const submitButton = document.getElementById("contact-submit");
  const liveRegion = document.getElementById("contact-live-region");
  const errorContainer = document.getElementById("contact-error");
  initFieldValidation();
  form.addEventListener("submit", async function(e) {
    e.preventDefault();
    if (errorContainer) errorContainer.style.display = "none";
    let isValid = true;
    Object.keys(validators).forEach((fieldId) => {
      const field = document.getElementById(fieldId);
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
        errorContainer.textContent = "Please correct the errors below before submitting.";
        errorContainer.style.display = "block";
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
      if (btnText) btnText.textContent = "Sending...";
    }
    if (liveRegion) {
      liveRegion.textContent = "Sending your message...";
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
          liveRegion.textContent = "Message sent successfully! Redirecting...";
        }
        const redirectUrl = form.querySelector('input[name="redirect"]')?.value || "/contact-us/thank-you/";
        window.location.replace(redirectUrl);
      } else {
        throw new Error(data.message || "Failed to send message");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An error occurred. Please try again later.";
      if (errorContainer) {
        errorContainer.textContent = errorMessage;
        errorContainer.style.display = "block";
      }
      if (liveRegion) {
        liveRegion.textContent = "Error sending message. Please try again.";
      }
      if (submitButton) {
        submitButton.classList.remove("contact-form__submit--loading");
        submitButton.disabled = false;
        const btnText = submitButton.querySelector(".btn__text");
        if (btnText) btnText.textContent = "Send Message";
      }
    }
  });
};

// ns-hugo-imp:C:\Users\maxim\Documents\Dev\arsrepairs.com\themes\arsrepairs-theme\assets\ts\utils\dom.ts
var onDOMReady = (callback) => {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", callback);
  } else {
    callback();
  }
};

// <stdin>
onDOMReady(() => {
  initContactForm();
});
