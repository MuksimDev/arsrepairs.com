import { logger } from "../utils/logger";

type Nullable<T> = T | null;

interface ReviewsFormConfig {
  redirectLowTo: string;
  threshold: number;
  googleReviewUrl: string | null;
  endpointUrl: string | null;
}

interface ReviewsFormElements {
  root: HTMLElement;
  form: HTMLFormElement;
  liveRegion: Nullable<HTMLElement>;
  statusError: Nullable<HTMLElement>;
  statusSuccess: Nullable<HTMLElement>;
  honeypot: Nullable<HTMLInputElement>;
  continueButton: Nullable<HTMLButtonElement>;
  submitButton: Nullable<HTMLButtonElement>;
  stageTwo: Nullable<HTMLElement>;
  ratingInput: Nullable<HTMLInputElement>;
  ratingValue: Nullable<HTMLElement>;
  ratingLabel: Nullable<HTMLElement>;
  nameInput: Nullable<HTMLInputElement>;
  emailInput: Nullable<HTMLInputElement>;
  phoneInput: Nullable<HTMLInputElement>;
  applianceSelect: Nullable<HTMLSelectElement>;
  messageInput: Nullable<HTMLTextAreaElement>;
  consentCheckbox: Nullable<HTMLInputElement>;
}

const STORAGE_KEY = "ars_reviews_stage1";
const STORAGE_TTL_MS = 15 * 60 * 1000; // 15 minutes

const RATING_LABELS_EN: Record<number, string> = {
  1: "Not great",
  2: "Could be better",
  3: "Okay",
  4: "Great",
  5: "Amazing",
};

const RATING_LABELS_ES: Record<number, string> = {
  1: "No está bien",
  2: "Podría ser mejor",
  3: "Regular",
  4: "Excelente",
  5: "Increíble",
};

function getRatingLabels(): Record<number, string> {
  const lang = document.documentElement.lang || "en";
  return lang.startsWith("es") ? RATING_LABELS_ES : RATING_LABELS_EN;
}

function getDatasetNumber(value: string | null | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = parseInt(value, 10);
  if (Number.isNaN(parsed)) return fallback;
  return parsed;
}

function getConfig(root: HTMLElement): ReviewsFormConfig {
  const redirectLowTo = root.getAttribute("data-redirect-low-to") || "/give-feedback/";
  const thresholdAttr = root.getAttribute("data-threshold");
  const threshold = getDatasetNumber(thresholdAttr, 2);

  const googleReviewUrl = root.getAttribute("data-google-review-url");
  const endpointUrl = root.getAttribute("data-endpoint-url");

  return {
    redirectLowTo,
    threshold,
    googleReviewUrl: googleReviewUrl && googleReviewUrl.trim() !== "" ? googleReviewUrl : null,
    endpointUrl: endpointUrl && endpointUrl.trim() !== "" ? endpointUrl : null,
  };
}

function getElements(root: HTMLElement): ReviewsFormElements | null {
  const form = root.querySelector("form") as HTMLFormElement | null;
  if (!form) return null;

  const ratingInput = form.querySelector<HTMLInputElement>("#reviews-rating");
  const ratingValue = form.querySelector<HTMLElement>("[data-reviews-rating-value]");
  const ratingLabel = form.querySelector<HTMLElement>("[data-reviews-rating-label]");

  return {
    root,
    form,
    liveRegion: form.querySelector<HTMLElement>("[data-reviews-live-region]"),
    statusError: form.querySelector<HTMLElement>("[data-reviews-status-error]"),
    statusSuccess: form.querySelector<HTMLElement>("[data-reviews-status-success]"),
    honeypot: form.querySelector<HTMLInputElement>("[data-reviews-honeypot]"),
    continueButton: form.querySelector<HTMLButtonElement>("[data-reviews-continue]"),
    submitButton: form.querySelector<HTMLButtonElement>("[data-reviews-submit]"),
    stageTwo: form.querySelector<HTMLElement>("[data-reviews-stage-two]"),
    ratingInput,
    ratingValue,
    ratingLabel,
    nameInput: form.querySelector<HTMLInputElement>("#reviews-name"),
    emailInput: form.querySelector<HTMLInputElement>("#reviews-email"),
    phoneInput: form.querySelector<HTMLInputElement>("#reviews-phone"),
    applianceSelect: form.querySelector<HTMLSelectElement>("#reviews-appliance"),
    messageInput: form.querySelector<HTMLTextAreaElement>("#reviews-message"),
    consentCheckbox: form.querySelector<HTMLInputElement>("#reviews-consent"),
  };
}

function setFieldError(
  els: ReviewsFormElements,
  fieldKey: "rating" | "name" | "email" | "phone",
  message: string | null
): void {
  const errorSpan = els.form.querySelector<HTMLElement>(`[data-reviews-error="${fieldKey}"]`);
  let field: Nullable<HTMLElement> = null;

  switch (fieldKey) {
    case "rating":
      field = els.ratingInput;
      break;
    case "name":
      field = els.nameInput;
      break;
    case "email":
      field = els.emailInput;
      break;
    case "phone":
      field = els.phoneInput;
      break;
    default:
      break;
  }

  if (errorSpan) {
    errorSpan.textContent = message || "";
    (errorSpan as HTMLElement).style.display = message ? "block" : "none";
  }

  if (field) {
    if (message) {
      field.setAttribute("aria-invalid", "true");
      field.classList.add("contact-form__input--error");
    } else {
      field.removeAttribute("aria-invalid");
      field.classList.remove("contact-form__input--error");
    }
  }
}

function clearAllErrors(els: ReviewsFormElements): void {
  setFieldError(els, "rating", null);
  setFieldError(els, "name", null);
  setFieldError(els, "email", null);
  setFieldError(els, "phone", null);

  if (els.statusError) {
    els.statusError.textContent = "";
    els.statusError.classList.add("contact-form__status--hidden");
  }
}

function showStatus(
  els: ReviewsFormElements,
  type: "error" | "success",
  message: string
): void {
  const target = type === "error" ? els.statusError : els.statusSuccess;
  const other = type === "error" ? els.statusSuccess : els.statusError;

  if (other) {
    other.textContent = "";
    other.classList.add("contact-form__status--hidden");
  }

  if (target) {
    target.textContent = message;
    target.classList.remove("contact-form__status--hidden");
  }

  if (els.liveRegion) {
    els.liveRegion.textContent = message;
  }
}

function validateStageOne(els: ReviewsFormElements): boolean {
  let isValid = true;

  const lang = document.documentElement.lang || "en";
  const isSpanish = lang.startsWith("es");
  
  const ratingRaw = els.ratingInput?.value;
  const rating = ratingRaw ? parseInt(ratingRaw, 10) : NaN;
  if (!ratingRaw || Number.isNaN(rating)) {
    setFieldError(els, "rating", isSpanish ? "Por favor seleccione qué tan satisfecho está." : "Please select how satisfied you are.");
    isValid = false;
  } else {
    setFieldError(els, "rating", null);
  }

  const nameVal = els.nameInput?.value?.trim() || "";
  if (!nameVal) {
    setFieldError(els, "name", isSpanish ? "Por favor ingrese su nombre." : "Please enter your name.");
    isValid = false;
  } else if (nameVal.length < 2) {
    setFieldError(els, "name", isSpanish ? "El nombre debe tener al menos 2 caracteres." : "Name should be at least 2 characters.");
    isValid = false;
  } else {
    setFieldError(els, "name", null);
  }

  const emailVal = els.emailInput?.value?.trim() || "";
  if (!emailVal) {
    setFieldError(els, "email", isSpanish ? "Por favor ingrese su correo electrónico." : "Please enter your email.");
    isValid = false;
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailVal)) {
      setFieldError(els, "email", isSpanish ? "Por favor ingrese un correo electrónico válido." : "Please enter a valid email address.");
      isValid = false;
    } else {
      setFieldError(els, "email", null);
    }
  }

  const phoneVal = els.phoneInput?.value?.trim() || "";
  if (phoneVal) {
    const digitsOnly = phoneVal.replace(/\D/g, "");
    if (digitsOnly.length > 0 && digitsOnly.length < 10) {
      setFieldError(els, "phone", isSpanish ? "Por favor ingrese un número de teléfono válido." : "Please enter a valid phone number.");
      isValid = false;
    } else {
      setFieldError(els, "phone", null);
    }
  } else {
    setFieldError(els, "phone", null);
  }

  if (!isValid) {
    showStatus(
      els,
      "error",
      isSpanish ? "Por favor corrija los campos resaltados antes de continuar." : "Please fix the highlighted fields before continuing."
    );
    const firstErrorField = els.form.querySelector<HTMLElement>(
      '[aria-invalid="true"]'
    );
    if (firstErrorField && typeof firstErrorField.focus === "function") {
      firstErrorField.focus();
    }
  }

  return isValid;
}

function saveStageOneToSession(
  rating: number,
  name: string,
  email: string,
  phone: string
): void {
  try {
    const now = Date.now();
    const payload = {
      mode: "review_stage1",
      rating,
      name,
      email,
      phone,
      pageUrl: window.location.href,
      createdAt: now,
      expiresAt: now + STORAGE_TTL_MS,
    };

    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (error) {
    logger.warn("Unable to persist review stage1 data to sessionStorage:", error);
  }
}

function showStageTwo(els: ReviewsFormElements): void {
  if (!els.stageTwo) return;

  els.stageTwo.style.display = "";
  els.stageTwo.setAttribute("aria-hidden", "false");

  if (els.continueButton) {
    els.continueButton.disabled = true;
  }

  const firstInput =
    els.applianceSelect || els.messageInput || els.consentCheckbox || null;
  if (firstInput && typeof firstInput.focus === "function") {
    firstInput.focus();
  }
}

function setSubmitLoading(els: ReviewsFormElements, isLoading: boolean): void {
  const btn = els.submitButton;
  if (!btn) return;

  const textSpan = btn.querySelector<HTMLElement>(".btn__text");
  const lang = document.documentElement.lang || "en";
  const isSpanish = lang.startsWith("es");

  if (isLoading) {
    btn.classList.add("contact-form__submit--loading");
    btn.disabled = true;
    if (textSpan) textSpan.textContent = isSpanish ? "Enviando..." : "Sending...";
  } else {
    btn.classList.remove("contact-form__submit--loading");
    btn.disabled = false;
    if (textSpan) textSpan.textContent = isSpanish ? "Enviar reseña" : "Submit review";
  }
}

function buildPayload(
  els: ReviewsFormElements,
  config: ReviewsFormConfig
): Record<string, unknown> {
  const rating = els.ratingInput?.value ? parseInt(els.ratingInput.value, 10) : null;
  const name = els.nameInput?.value?.trim() || "";
  const email = els.emailInput?.value?.trim() || "";
  const phone = els.phoneInput?.value?.trim() || "";
  const appliance = els.applianceSelect?.value?.trim() || "";
  const message = els.messageInput?.value?.trim() || "";
  const consent = !!els.consentCheckbox?.checked;

  const url = new URL(window.location.href);
  const params = url.searchParams;
  const utm: Record<string, string> = {};
  ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"].forEach(
    (key) => {
      const value = params.get(key);
      if (value) utm[key] = value;
    }
  );

  return {
    mode: "review_submit",
    timestamp: new Date().toISOString(),
    rating,
    name,
    email,
    phone,
    appliance: appliance || null,
    message: message || null,
    consent,
    pageUrl: window.location.href,
    referrer: document.referrer || null,
    utm,
    config: {
      threshold: config.threshold,
      redirectLowTo: config.redirectLowTo,
    },
  };
}

async function handleSubmit(
  els: ReviewsFormElements,
  config: ReviewsFormConfig
): Promise<void> {
  const lang = document.documentElement.lang || "en";
  const isSpanish = lang.startsWith("es");
  
  if (!config.endpointUrl) {
    showStatus(
      els,
      "error",
      isSpanish ? "El endpoint de reseñas aún no está configurado. Por favor intente más tarde o use el enlace de reseña de Google." : "Review endpoint is not configured yet. Please try again later or use the Google review link."
    );
    return;
  }

  if (els.honeypot && els.honeypot.value.trim() !== "") {
    logger.warn("Blocking review submission due to honeypot being filled.");
    return;
  }

  const isValid = validateStageOne(els);
  if (!isValid) return;

  const payload = buildPayload(els, config);

  try {
    setSubmitLoading(els, true);
    showStatus(els, "success", isSpanish ? "Enviando su reseña..." : "Sending your review...");

    const response = await fetch(config.endpointUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      credentials: "same-origin",
    });

    if (!response.ok) {
      logger.error("Review submission failed with status:", response.status);
      showStatus(
        els,
        "error",
        isSpanish ? "No pudimos enviar su reseña en este momento. Por favor intente nuevamente en un momento." : "We couldn't send your review right now. Please try again in a moment."
      );
      return;
    }

    showStatus(
      els,
      "success",
      isSpanish ? "¡Gracias por compartir su experiencia! Su reseña ha sido enviada." : "Thank you for sharing your experience! Your review has been submitted."
    );
  } catch (error) {
    logger.error("Review submission error:", error);
    showStatus(
      els,
      "error",
      isSpanish ? "Algo salió mal al enviar su reseña. Por favor intente nuevamente en breve." : "Something went wrong while sending your review. Please try again shortly."
    );
  } finally {
    setSubmitLoading(els, false);
  }
}

function initSlider(els: ReviewsFormElements): void {
  if (!els.ratingInput) return;

  const update = (): void => {
    const raw = els.ratingInput?.value;
    const rating = raw ? parseInt(raw, 10) : 5;
    const clamped = Math.min(5, Math.max(1, rating));

    if (els.ratingValue) {
      els.ratingValue.textContent = String(clamped);
    }

    if (els.ratingLabel) {
      const labels = getRatingLabels();
      els.ratingLabel.textContent = labels[clamped] || "";
    }

    els.ratingInput?.setAttribute("aria-valuenow", String(clamped));

    const container = els.root.querySelector<HTMLElement>(".reviews-form__rating");
    if (container) {
      container.classList.remove("reviews-form__rating--low", "reviews-form__rating--mid", "reviews-form__rating--high");
      if (clamped <= 2) {
        container.classList.add("reviews-form__rating--low");
      } else if (clamped === 3) {
        container.classList.add("reviews-form__rating--mid");
      } else {
        container.classList.add("reviews-form__rating--high");
      }
    }

    const faces = els.root.querySelectorAll<HTMLElement>(".reviews-form__face");
    faces.forEach((face) => {
      const valueAttr = face.getAttribute("data-value");
      const faceValue = valueAttr ? parseInt(valueAttr, 10) : null;
      if (faceValue === clamped) {
        face.classList.add("is-active");
      } else {
        face.classList.remove("is-active");
      }
    });
  };

  els.ratingInput.addEventListener("input", update);
  els.ratingInput.addEventListener("change", update);

  // Make faces interactive: clicking (or pressing Enter/Space) sets the slider value
  const faces = els.root.querySelectorAll<HTMLElement>(".reviews-form__face");
  faces.forEach((face) => {
    const valueAttr = face.getAttribute("data-value");
    const faceValue = valueAttr ? parseInt(valueAttr, 10) : null;
    if (!faceValue || !els.ratingInput) return;

    face.setAttribute("role", "button");
    face.setAttribute("tabindex", "0");

    const setFromFace = (): void => {
      if (!els.ratingInput) return;
      els.ratingInput.value = String(faceValue);
      els.ratingInput.dispatchEvent(new Event("input", { bubbles: true }));
      els.ratingInput.dispatchEvent(new Event("change", { bubbles: true }));
      els.ratingInput.focus();
    };

    face.addEventListener("click", setFromFace);
    face.addEventListener("keydown", (event: KeyboardEvent) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        setFromFace();
      }
    });
  });

  update();
}

function attachEvents(els: ReviewsFormElements, config: ReviewsFormConfig): void {
  initSlider(els);

  if (els.continueButton) {
    els.continueButton.addEventListener("click", () => {
      clearAllErrors(els);

      const ok = validateStageOne(els);
      if (!ok) return;

      const ratingVal = els.ratingInput?.value ? parseInt(els.ratingInput.value, 10) : NaN;
      const rating = Number.isNaN(ratingVal) ? config.threshold : ratingVal;
      const name = els.nameInput?.value?.trim() || "";
      const email = els.emailInput?.value?.trim() || "";
      const phone = els.phoneInput?.value?.trim() || "";

      // Rating 1-2: redirect to feedback form
      if (rating <= config.threshold) {
        saveStageOneToSession(rating, name, email, phone);
        window.location.href = config.redirectLowTo;
        return;
      }

      const lang = document.documentElement.lang || "en";
      const isSpanish = lang.startsWith("es");
      
      // Rating 3-4: redirect to thank you page
      if (rating === 3 || rating === 4) {
        window.location.href = isSpanish ? "/es/reviews/thank-you/" : "/reviews/thank-you/";
        return;
      }

      // Rating 5: show Stage 2 for detailed review
      if (rating === 5) {
        showStageTwo(els);
        showStatus(
          els,
          "success",
          isSpanish ? "¡Gracias! Opcionalmente puede agregar algunos detalles a continuación antes de enviar su reseña." : "Thanks! You can optionally add a few details below before submitting your review."
        );
        return;
      }
    });
  }

  els.form.addEventListener("submit", (event: Event) => {
    // Only intercept form submission if endpoint URL is configured for AJAX submission
    if (config.endpointUrl) {
      event.preventDefault();
      void handleSubmit(els, config);
      return;
    }
    
    // Otherwise, intercept and submit to web3forms via fetch to control redirect
    event.preventDefault();
    
    // Validate form before submission
    const isValid = validateStageOne(els);
    if (!isValid) return;
    
    const lang = document.documentElement.lang || "en";
    const isSpanish = lang.startsWith("es");
    
    // Prepare form data for Web3Forms
    const formData = new FormData(els.form);
    
    setSubmitLoading(els, true);
    showStatus(els, "success", isSpanish ? "Enviando su reseña..." : "Sending your review...");
    
    fetch("https://api.web3forms.com/submit", {
      method: "POST",
      body: formData,
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          // Success - redirect to thank you page
          const redirectInput = els.form.querySelector<HTMLInputElement>(
            'input[name="redirect"]'
          );
          const redirectUrl = redirectInput?.value || (isSpanish ? "/es/reviews/thank-you/" : "/reviews/thank-you/");
          window.location.replace(redirectUrl);
        } else {
          // Handle error from Web3Forms
          throw new Error(data.message || (isSpanish ? "Error al enviar la reseña" : "Failed to send review"));
        }
      })
      .catch((error) => {
        logger.error("Review submission error:", error);
        const errorMessage =
          error instanceof Error
            ? error.message
            : (isSpanish ? "Algo salió mal al enviar su reseña. Por favor intente nuevamente en breve." : "Something went wrong while sending your review. Please try again shortly.");
        showStatus(els, "error", errorMessage);
        setSubmitLoading(els, false);
      });
  });
}

export function initReviewsForm(): void {
  const roots = document.querySelectorAll<HTMLElement>('[data-reviews-form="true"]');
  if (!roots.length) return;

  roots.forEach((root) => {
    const config = getConfig(root);
    const els = getElements(root);
    if (!els) return;

    attachEvents(els, config);
  });
}


