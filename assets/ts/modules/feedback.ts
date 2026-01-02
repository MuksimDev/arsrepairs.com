/**
 * Feedback Form + Sidebar Progress Module
 *
 * Handles:
 * - Feedback form validation and branching logic
 * - Sidebar feedback progress bar + steps (kept in sync with form sections)
 */

import { onDOMReady } from "../utils/dom";

type Nullable<T> = T | null;

interface FeedbackElements {
  form: HTMLFormElement;
  submitButton: Nullable<HTMLButtonElement>;
  liveRegion: Nullable<HTMLElement>;
  errorContainer: Nullable<HTMLElement>;
  lowRatingMessage: Nullable<HTMLElement>;
  recommendationReasonWrapper: Nullable<HTMLElement>;
  serviceDetailsSection: Nullable<HTMLElement>;
  serviceDetailsHelp: Nullable<HTMLElement>;
  serviceDetailsSimplified: Nullable<HTMLElement>;
  contactDetailsWrapper: Nullable<HTMLElement>;
  contactDetailsIntro: Nullable<HTMLElement>;
  progressRoot: Nullable<HTMLElement>;
  progressBar: Nullable<HTMLElement>;
  progressStepText: Nullable<HTMLElement>;
  progressSteps: NodeListOf<HTMLElement> | null;
  stepFieldsets: NodeListOf<HTMLFieldSetElement>;
  totalSteps: number;
}

function getElements(): FeedbackElements | null {
  const form = document.querySelector('form[name="feedback"]') as HTMLFormElement | null;
  if (!form) return null;

  const progressRoot = document.getElementById("feedback-progress");
  const progressBar = document.getElementById("feedback-progress-bar");
  const progressStepText = document.getElementById("feedback-progress-step-text");

  const progressSteps =
    progressRoot?.querySelectorAll<HTMLElement>("[data-progress-step]") ?? null;
  const stepFieldsets = form.querySelectorAll<HTMLFieldSetElement>("fieldset[data-step]");
  const totalSteps = stepFieldsets.length || 4;

  return {
    form,
    submitButton: document.getElementById("feedback-submit") as HTMLButtonElement | null,
    liveRegion: document.getElementById("feedback-live-region"),
    errorContainer: document.getElementById("feedback-error"),
    lowRatingMessage: document.getElementById("feedback-low-rating-message"),
    recommendationReasonWrapper: document.getElementById("recommendation-reason-wrapper"),
    serviceDetailsSection: document.getElementById("service-details-section"),
    serviceDetailsHelp: document.getElementById("service-details-help"),
    serviceDetailsSimplified: document.getElementById("service-details-simplified"),
    contactDetailsWrapper: document.getElementById("contact-details-wrapper"),
    contactDetailsIntro: document.getElementById("contact-details-intro"),
    progressRoot,
    progressBar,
    progressStepText,
    progressSteps,
    stepFieldsets,
    totalSteps,
  };
}

function showError(fieldId: string, message: string): void {
  const errorEl = document.getElementById(fieldId + "-error");
  if (errorEl) {
    errorEl.textContent = message;
    (errorEl as HTMLElement).style.display = "block";
  }

  // Reflect error state on associated form controls for a11y
  const form = document.querySelector('form[name="feedback"]') as HTMLFormElement | null;
  if (!form) return;

  const controls: HTMLElement[] = [];
  const named = form.elements.namedItem(fieldId);

  if (named instanceof RadioNodeList) {
    Array.prototype.forEach.call(named, (el: Element) => {
      if (el instanceof HTMLElement) controls.push(el);
    });
  } else if (named instanceof HTMLElement) {
    controls.push(named);
  } else {
    const byId = document.getElementById(fieldId);
    if (byId instanceof HTMLElement) {
      controls.push(byId);
    }
  }

  controls.forEach((control) => {
    control.setAttribute("aria-invalid", "true");

    const errorId = fieldId + "-error";
    const existingDescribedBy = control.getAttribute("aria-describedby") || "";
    const tokens = existingDescribedBy.split(" ").filter(Boolean);
    if (!tokens.includes(errorId)) {
      tokens.push(errorId);
      control.setAttribute("aria-describedby", tokens.join(" "));
    }
  });
}

function clearError(fieldId: string): void {
  const errorEl = document.getElementById(fieldId + "-error");
  if (errorEl) {
    errorEl.textContent = "";
    (errorEl as HTMLElement).style.display = "none";
  }

  // Clear error state on associated form controls for a11y
  const form = document.querySelector('form[name="feedback"]') as HTMLFormElement | null;
  if (!form) return;

  const controls: HTMLElement[] = [];
  const named = form.elements.namedItem(fieldId);

  if (named instanceof RadioNodeList) {
    Array.prototype.forEach.call(named, (el: Element) => {
      if (el instanceof HTMLElement) controls.push(el);
    });
  } else if (named instanceof HTMLElement) {
    controls.push(named);
  } else {
    const byId = document.getElementById(fieldId);
    if (byId instanceof HTMLElement) {
      controls.push(byId);
    }
  }

  controls.forEach((control) => {
    control.removeAttribute("aria-invalid");

    const errorId = fieldId + "-error";
    const existingDescribedBy = control.getAttribute("aria-describedby") || "";
    const tokens = existingDescribedBy
      .split(" ")
      .filter((token) => token && token !== errorId);

    if (tokens.length > 0) {
      control.setAttribute("aria-describedby", tokens.join(" "));
    } else {
      control.removeAttribute("aria-describedby");
    }
  });
}

function hasChecked(form: HTMLFormElement, name: string): boolean {
  const inputs = form.querySelectorAll<HTMLInputElement>('input[name="' + name + '"]');
  return Array.prototype.some.call(inputs, (input: HTMLInputElement) => input.checked);
}

function getCheckedValue(form: HTMLFormElement, name: string): string {
  const inputs = form.querySelectorAll<HTMLInputElement>('input[name="' + name + '"]');
  const checked = Array.prototype.find.call(
    inputs,
    (input: HTMLInputElement) => input.checked
  ) as HTMLInputElement | undefined;
  return checked ? checked.value : "";
}

function setSectionVisibility(el: Nullable<HTMLElement>, visible: boolean): void {
  if (!el) return;
  el.style.display = visible ? "" : "none";
  el.setAttribute("aria-hidden", visible ? "false" : "true");
}

// ---------------------------------------------------------------------------
// Progress bar behavior
// ---------------------------------------------------------------------------

function getStepFromFieldset(fieldset: HTMLFieldSetElement | null): number {
  if (!fieldset) return 0;
  const v = parseInt(fieldset.getAttribute("data-step") || "0", 10);
  return Number.isNaN(v) ? 0 : v;
}

function getStepFromElement(el: Element | null): number {
  if (!el) return 0;
  const fieldset = el.closest("fieldset[data-step]") as HTMLFieldSetElement | null;
  return getStepFromFieldset(fieldset);
}

/**
 * Calculate question-level progress based on answered fields.
 * Each "question" contributes equally to the progress bar.
 */
function getQuestionProgress(els: FeedbackElements): { answered: number; total: number } {
  const { form } = els;
  let answered = 0;

  // Track which logical questions count toward progress
  // Keep in sync with checks below. Only required questions count here.
  const total = 9;

  // 1. Overall experience
  if (hasChecked(form, "overall_experience")) answered++;

  // 2. Recommendation
  if (hasChecked(form, "recommendation")) answered++;

  // 3. Visit type
  const visitType = (document.getElementById("visit_type") as HTMLSelectElement | null)?.value || "";
  if (visitType) answered++;

  // 4. Technician knowledge (required)
  if (hasChecked(form, "tech_knowledge")) answered++;

  // 5. Timeliness (required)
  if (hasChecked(form, "timeliness")) answered++;

  // 6. What went well (required)
  const wentWell =
    (document.getElementById("went_well") as HTMLTextAreaElement | null)?.value || "";
  if (wentWell.trim().length > 0) answered++;

  // 7. Share permission (required)
  if (hasChecked(form, "share_permission")) answered++;

  // 8. Follow-up preference (required)
  if (hasChecked(form, "follow_up")) answered++;

  // 9. Contact details (email or phone provided when user chooses follow-up)
  const emailVal =
    (document.getElementById("email") as HTMLInputElement | null)?.value?.trim() || "";
  const phoneVal =
    (document.getElementById("phone") as HTMLInputElement | null)?.value?.trim() || "";
  if (emailVal || phoneVal) answered++;

  // Clamp just in case
  const clampedAnswered = Math.max(0, Math.min(total, answered));

  return { answered: clampedAnswered, total };
}

type StepCompletionState = "none" | "partial" | "complete";

/**
 * Determine completion state for a given step based on required questions
 * within that section.
 */
function getStepCompletion(step: number, els: FeedbackElements): StepCompletionState {
  const { form } = els;
  let answered = 0;
  let total = 0;

  switch (step) {
    case 1: {
      // Overall experience, recommendation, visit type
      total = 3;
      if (hasChecked(form, "overall_experience")) answered++;
      if (hasChecked(form, "recommendation")) answered++;
      const visitType =
        (document.getElementById("visit_type") as HTMLSelectElement | null)?.value || "";
      if (visitType) answered++;
      break;
    }
    case 2: {
      // Service details section.
      // Only the required questions (technician knowledge and timeliness) are needed
      // to mark the step as complete. Optional contextual fields contribute to a
      // "partial" state when filled.

      let requiredAnswered = 0;
      const requiredTotal = 2;

      if (hasChecked(form, "tech_knowledge")) requiredAnswered++;
      if (hasChecked(form, "timeliness")) requiredAnswered++;

      let anyOptionalAnswered = false;

      const applianceType =
        (document.getElementById("appliance_type") as HTMLSelectElement | null)?.value || "";
      if (applianceType) anyOptionalAnswered = true;

      const serviceDate =
        (document.getElementById("service_date") as HTMLInputElement | null)?.value || "";
      if (serviceDate) anyOptionalAnswered = true;

      const techName =
        (document.getElementById("technician_name") as HTMLInputElement | null)?.value?.trim() ||
        "";
      if (techName) anyOptionalAnswered = true;

      // If nothing in the section has been answered, keep the step "none"
      if (requiredAnswered === 0 && !anyOptionalAnswered) {
        return "none";
      }

      // All required questions answered → complete,
      // otherwise there is at least some progress → partial.
      if (requiredAnswered === requiredTotal) {
        return "complete";
      }

      return "partial";
    }
    case 3: {
      // Feedback section: treat "what went well" as required with a minimum length,
      // and "what could be improved" as optional but contributing to partial state.
      const wentWell =
        (document.getElementById("went_well") as HTMLTextAreaElement | null)?.value || "";
      const wentWellTrimmedLen = wentWell.trim().length;

      const couldImprove =
        (document.getElementById("could_improve") as HTMLTextAreaElement | null)?.value || "";
      const couldImproveLen = couldImprove.trim().length;

      // No input in either textarea → step not started.
      if (wentWellTrimmedLen === 0 && couldImproveLen === 0) {
        return "none";
      }

      // Match validation logic: "what went well" must have some non-whitespace content
      // and be at least 10 characters long (untrimmed) to be considered fully answered.
      if (wentWellTrimmedLen > 0 && wentWell.length >= 10) {
        return "complete";
      }

      return "partial";
    }
    case 4: {
      // Permissions & follow-up (contact details required when follow-up is requested)
      total = 2;
      if (hasChecked(form, "share_permission")) answered++;
      const followUp = getCheckedValue(form, "follow_up");
      if (followUp) answered++;

      if (followUp && followUp !== "No follow-up needed") {
        total = 3;
        const emailVal =
          (document.getElementById("email") as HTMLInputElement | null)?.value?.trim() || "";
        const phoneVal =
          (document.getElementById("phone") as HTMLInputElement | null)?.value?.trim() || "";
        if (emailVal || phoneVal) answered++;
      }
      break;
    }
    default:
      return "none";
  }

  if (answered <= 0) return "none";
  if (answered < total) return "partial";
  return "complete";
}

function setProgress(step: number, els: FeedbackElements): void {
  const { progressRoot, progressBar, progressStepText, progressSteps, totalSteps } = els;
  if (!progressRoot || !progressBar || !progressSteps) return;

  const clampedStep = Math.max(0, Math.min(totalSteps, step));
  const { answered, total } = getQuestionProgress(els);
  const percent = total > 0 ? (answered / total) * 100 : 0;

  (progressBar as HTMLElement).style.width = percent + "%";

  const label =
    answered === 0
      ? "Feedback progress: Not started"
      : "Feedback progress: " + answered + " of " + total + " questions answered";
  progressRoot.setAttribute("aria-label", label);
  if (progressStepText) {
    progressStepText.textContent =
      clampedStep === 0 ? "Not started" : "Step " + clampedStep + " of " + totalSteps;
  }

  Array.prototype.forEach.call(progressSteps, (stepEl: HTMLElement) => {
    const stepNum = parseInt(stepEl.getAttribute("data-progress-step") || "0", 10);
    stepEl.classList.remove("is-active", "is-complete", "is-partial");

    const completion = getStepCompletion(stepNum, els);

    if (clampedStep === 0 && completion === "none") {
      // No steps started yet
      return;
    }

    if (stepNum === clampedStep) {
      stepEl.classList.add("is-active");
    }

    if (completion === "complete") {
      stepEl.classList.add("is-complete");
    } else if (completion === "partial") {
      stepEl.classList.add("is-partial");
    }
  });
}

// ---------------------------------------------------------------------------
// Branching logic
// ---------------------------------------------------------------------------

function initBranching(els: FeedbackElements): void {
  const {
    form,
    recommendationReasonWrapper,
    contactDetailsIntro,
    contactDetailsWrapper,
    serviceDetailsHelp,
    serviceDetailsSimplified,
  } = els;

  function updateRecommendationBranching(): void {
    const value = getCheckedValue(form, "recommendation");
    const shouldShow = value === "No" || value === "Maybe / not sure";
    setSectionVisibility(recommendationReasonWrapper, shouldShow);
  }

  function updateFollowUpBranching(): void {
    const value = getCheckedValue(form, "follow_up");
    const wantsFollowUp = !!value && value !== "No follow-up needed";

    setSectionVisibility(contactDetailsIntro, wantsFollowUp);
    setSectionVisibility(contactDetailsWrapper, wantsFollowUp);
  }

  function updateServiceDetailsBranching(): void {
    const value = getCheckedValue(form, "overall_experience");
    if (!value) {
      // No selection yet; keep default messaging
      if (serviceDetailsHelp) {
        serviceDetailsHelp.style.display = "";
      }
      if (serviceDetailsSimplified) {
        serviceDetailsSimplified.style.display = "none";
      }
      return;
    }

    const isPoor = value.startsWith("1 -") || value.startsWith("2 -");

    if (isPoor) {
      if (serviceDetailsHelp) {
        serviceDetailsHelp.style.display = "none";
      }
      if (serviceDetailsSimplified) {
        serviceDetailsSimplified.style.display = "";
      }
    } else {
      if (serviceDetailsHelp) {
        serviceDetailsHelp.style.display = "";
      }
      if (serviceDetailsSimplified) {
        serviceDetailsSimplified.style.display = "none";
      }
    }
  }

  // Attach listeners
  Array.prototype.forEach.call(
    form.querySelectorAll('input[name="recommendation"]'),
    (input: HTMLInputElement) => {
      input.addEventListener("change", updateRecommendationBranching);
    }
  );

  Array.prototype.forEach.call(
    form.querySelectorAll('input[name="follow_up"]'),
    (input: HTMLInputElement) => {
      input.addEventListener("change", updateFollowUpBranching);
    }
  );

  Array.prototype.forEach.call(
    form.querySelectorAll('input[name="overall_experience"]'),
    (input: HTMLInputElement) => {
      input.addEventListener("change", updateServiceDetailsBranching);
    }
  );

  // Initial branching state
  updateRecommendationBranching();
  updateFollowUpBranching();
  updateServiceDetailsBranching();
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

function initValidation(els: FeedbackElements): void {
  const { form, errorContainer, liveRegion, submitButton } = els;

  const validators: Record<string, () => string | null> = {
    overall_experience: () => {
      if (!hasChecked(form, "overall_experience"))
        return "Please select your overall experience.";
      return null;
    },
    recommendation: () => {
      if (!hasChecked(form, "recommendation"))
        return "Please let us know if you would recommend us.";
      return null;
    },
    visit_type: () => {
      const value = (document.getElementById("visit_type") as HTMLSelectElement | null)?.value || "";
      if (!value) return "Please select the type of visit.";
      return null;
    },
    tech_knowledge: () => {
      if (!hasChecked(form, "tech_knowledge"))
        return "Please rate the technician's knowledge and explanation.";
      return null;
    },
    timeliness: () => {
      if (!hasChecked(form, "timeliness")) return "Please rate our timeliness.";
      return null;
    },
    went_well: () => {
      const value =
        (document.getElementById("went_well") as HTMLTextAreaElement | null)?.value || "";
      if (!value.trim()) return "Please tell us at least one thing that went well.";
      if (value.length < 10)
        return "Please add a bit more detail so we can understand your experience.";
      return null;
    },
    share_permission: () => {
      if (!hasChecked(form, "share_permission"))
        return "Please choose how we may use your feedback.";
      return null;
    },
    follow_up: () => {
      if (!hasChecked(form, "follow_up"))
        return "Please let us know if you would like a follow-up.";
      return null;
    },
    email: () => {
      const emailField = document.getElementById("email") as HTMLInputElement | null;
      const phoneField = document.getElementById("phone") as HTMLInputElement | null;
      const followUp = getCheckedValue(form, "follow_up");

      const emailVal = emailField?.value?.trim() || "";
      const phoneVal = phoneField?.value?.trim() || "";

      if (followUp && followUp !== "No follow-up needed" && !emailVal && !phoneVal) {
        return "Please provide at least an email or phone number so we can follow up.";
      }

      if (emailVal) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailVal)) return "Please enter a valid email address.";
      }

      return null;
    },
    phone: () => {
      const field = document.getElementById("phone") as HTMLInputElement | null;
      if (!field || !field.value) return null;
      const digitsOnly = field.value.replace(/\D/g, "");
      if (digitsOnly.length > 0 && digitsOnly.length < 10) {
        return "Please enter a valid phone number.";
      }
      return null;
    },
  };

  form.addEventListener("submit", (e: Event) => {
    e.preventDefault();

    if (errorContainer) (errorContainer as HTMLElement).style.display = "none";

    Object.keys(validators).forEach((fieldId) => {
      clearError(fieldId);
    });

    let isValid = true;
    Object.keys(validators).forEach((fieldId) => {
      const error = validators[fieldId]();
      if (error) {
        showError(fieldId, error);
        isValid = false;
      }
    });

    if (!isValid) {
      if (errorContainer) {
        errorContainer.textContent =
          "Please review the highlighted questions and complete any missing answers.";
        (errorContainer as HTMLElement).style.display = "block";
      }
      if (liveRegion) {
        liveRegion.textContent =
          "Form has errors. Please review the highlighted questions.";
      }

      const firstError = form.querySelector<HTMLElement>(
        '.contact-form__error[style*="block"]'
      );
      if (firstError) {
        let target: HTMLElement | HTMLFormElement | null =
          (firstError.previousElementSibling as HTMLElement | null) ?? form;
        if (target && typeof (target as HTMLElement).focus === "function") {
          (target as HTMLElement).focus();
        }
      }
      return;
    }

    if (submitButton) {
      submitButton.classList.add("contact-form__submit--loading");
      submitButton.disabled = true;
      const btnText = submitButton.querySelector(".btn__text");
      if (btnText) btnText.textContent = "Sending...";
    }

    if (liveRegion) {
      liveRegion.textContent = "Sending your feedback...";
    }

    // Prepare form data for Web3Forms
    const formData = new FormData(form);

    fetch("https://api.web3forms.com/submit", {
      method: "POST",
      body: formData,
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          // Success - redirect to thank you page
          if (liveRegion) {
            liveRegion.textContent = "Feedback sent successfully! Redirecting...";
          }
          const redirectInput = form.querySelector<HTMLInputElement>(
            'input[name="redirect"]'
          );
          const redirectUrl = redirectInput?.value || "/give-feedback/thank-you/";
          window.location.replace(redirectUrl);
        } else {
          // Handle error from Web3Forms
          throw new Error(data.message || "Failed to send feedback");
        }
      })
      .catch((error) => {
        // Handle network or other errors
        const errorMessage =
          error instanceof Error
            ? error.message
            : "An error occurred. Please try again later.";

        if (errorContainer) {
          errorContainer.textContent = errorMessage;
          (errorContainer as HTMLElement).style.display = "block";
        }
        if (liveRegion) {
          liveRegion.textContent = "Error sending feedback. Please try again.";
        }

        if (submitButton) {
          submitButton.classList.remove("contact-form__submit--loading");
          submitButton.disabled = false;
          const btnText = submitButton.querySelector(".btn__text");
          if (btnText) btnText.textContent = "Submit Feedback";
        }
      });
  });
}

// ---------------------------------------------------------------------------
// Public init
// ---------------------------------------------------------------------------

function checkAndShowLowRatingMessage(els: FeedbackElements): void {
  if (!els.lowRatingMessage) return;

  try {
    const stored = sessionStorage.getItem("ars_reviews_stage1");
    if (!stored) return;

    const data = JSON.parse(stored);
    const now = Date.now();

    // Check if data exists, hasn't expired, is from review form, AND rating is low (<= 2)
    if (
      data &&
      data.expiresAt &&
      data.expiresAt > now &&
      data.mode === "review_stage1" &&
      typeof data.rating === "number" &&
      data.rating <= 2
    ) {
      // Show the message box
      els.lowRatingMessage.classList.remove("contact-form__status--hidden");
      els.lowRatingMessage.style.display = "";

      // Announce to screen readers
      if (els.liveRegion) {
        els.liveRegion.textContent =
          "We noticed you weren't fully satisfied. Please share your feedback so we can improve.";
      }

      // Optionally clear the sessionStorage after showing (or keep it for reference)
      // sessionStorage.removeItem("ars_reviews_stage1");
    }
  } catch (error) {
    // Silently fail if sessionStorage is unavailable or data is corrupted
    console.warn("Could not check review stage1 data:", error);
  }
}

export function initFeedback(): void {
  onDOMReady(() => {
    const els = getElements();
    if (!els) return;

    // Check for low rating redirect and show message if applicable
    checkAndShowLowRatingMessage(els);

    // Initialize progress behavior
    const { form, stepFieldsets } = els;

    form.addEventListener("focusin", (event: FocusEvent) => {
      const step = getStepFromElement(event.target as Element | null);
      setProgress(step, els);
    });

    // Keep question-level progress in sync as users type or change answers
    const syncProgressForEvent = (event: Event): void => {
      const step = getStepFromElement(event.target as Element | null);
      setProgress(step, els);
    };

    form.addEventListener("input", syncProgressForEvent);
    form.addEventListener("change", syncProgressForEvent);

    // Scroll-driven step highlighting, throttled via requestAnimationFrame
    let scrollRafId: number | null = null;

    const handleScroll = (): void => {
      if (!stepFieldsets.length) return;

      let bestStep = 0;
      let bestTop = Infinity;

      stepFieldsets.forEach((fs) => {
        const rect = fs.getBoundingClientRect();
        if (rect.top >= 0 && rect.top < bestTop) {
          bestTop = rect.top;
          bestStep = getStepFromFieldset(fs);
        }
      });

      setProgress(bestStep, els);
    };

    window.addEventListener(
      "scroll",
      () => {
        if (scrollRafId !== null) return;
        scrollRafId = window.requestAnimationFrame(() => {
          scrollRafId = null;
          handleScroll();
        });
      },
      { passive: true }
    );

    // Initial progress state: 0 (empty) when form is untouched
    setProgress(0, els);

    // Branching + validation
    initBranching(els);
    initValidation(els);
  });
}


