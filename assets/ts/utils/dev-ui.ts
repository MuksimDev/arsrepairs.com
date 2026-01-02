/**
 * Dev UI Utilities (DEV-ONLY)
 * ============================================================================
 * Shared UI components for dev tools (page-list, dev-score-bubble).
 * Provides dialogs, toasts, and input dialogs with consistent styling.
 * ============================================================================
 */

/**
 * Escape HTML to prevent XSS
 */
export function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Show toast notification
 */
export function showToast(
  message: string,
  type: 'success' | 'error' | 'info' = 'info',
  duration: number = 5000,
  prefix: string = 'dev' // 'dev' for dev-score-bubble, 'page-list' for page-list
): void {
  const toast = document.createElement('div');
  toast.className = `${prefix}-toast ${prefix}-toast--${type}`;
  toast.setAttribute('role', 'alert');
  toast.setAttribute('aria-live', 'polite');
  
  const iconMap = {
    success: 'check_circle',
    error: 'error',
    info: 'info'
  };
  
  const baseClass = prefix === 'page-list' ? 'page-list' : 'dev-score-bubble';
  
  toast.innerHTML = `
    <span class="${baseClass}-toast__icon material-symbols-outlined" aria-hidden="true">${iconMap[type]}</span>
    <span class="${baseClass}-toast__message">${escapeHtml(message)}</span>
    <button class="${baseClass}-toast__close" aria-label="Close notification" type="button">
      <span class="material-symbols-outlined" aria-hidden="true">close</span>
    </button>
  `;
  
  document.body.appendChild(toast);
  
  // Trigger animation
  requestAnimationFrame(() => {
    toast.classList.add(`${prefix}-toast--show`);
  });
  
  // Close button handler
  const closeBtn = toast.querySelector(`.${baseClass}-toast__close`);
  const closeToast = () => {
    toast.classList.remove(`${prefix}-toast--show`);
    setTimeout(() => toast.remove(), 300);
  };
  
  if (closeBtn) {
    closeBtn.addEventListener('click', closeToast);
  }
  
  // Auto-close
  if (duration > 0) {
    setTimeout(closeToast, duration);
  }
}

/**
 * Create confirmation dialog
 */
export function createConfirmationDialog(
  title: string,
  message: string,
  confirmText: string = 'Continue',
  cancelText?: string,
  prefix: string = 'dev' // 'dev' for dev-score-bubble, 'page-list' for page-list
): Promise<boolean> {
  return new Promise((resolve) => {
    const isSingleButton = !cancelText;
    const baseClass = prefix === 'page-list' ? 'page-list' : 'dev-score-bubble';
    const dialog = document.createElement('div');
    dialog.className = `${baseClass}-modal`;
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-labelledby', `${baseClass}-confirm-title`);
    dialog.setAttribute('aria-modal', 'true');
    
    const modalContentClass = prefix === 'page-list' 
      ? `${baseClass}-modal__content ${baseClass}-modal__content--small`
      : `${baseClass}-modal-content ${baseClass}-modal-content--small`;
    
    const headerClass = prefix === 'page-list'
      ? `${baseClass}-modal__header`
      : `${baseClass}-modal-header`;
    
    const headerIconClass = prefix === 'page-list'
      ? `${baseClass}-modal__header-icon ${baseClass}-modal__header-icon--${isSingleButton ? 'info' : 'warning'}`
      : `${baseClass}-modal-header-icon ${baseClass}-modal-header-icon--${isSingleButton ? 'info' : 'warning'}`;
    
    const titleClass = prefix === 'page-list'
      ? `${baseClass}-modal__title`
      : `${baseClass}-modal-title`;
    
    const bodyClass = prefix === 'page-list'
      ? `${baseClass}-modal__body`
      : `${baseClass}-modal-body`;
    
    const messageClass = prefix === 'page-list'
      ? `${baseClass}-confirm-message`
      : `${baseClass}-confirm-message`;
    
    const actionsClass = prefix === 'page-list'
      ? `${baseClass}-modal__actions`
      : `${baseClass}-modal-actions`;
    
    const buttonClass = prefix === 'page-list'
      ? `${baseClass}-modal__button`
      : `${baseClass}-modal-button`;
    
    const overlayClass = prefix === 'page-list'
      ? `${baseClass}-modal__overlay`
      : `${baseClass}-modal-overlay`;
    
    dialog.innerHTML = `
      <div class="${overlayClass}" aria-hidden="true"></div>
      <div class="${modalContentClass}">
        <div class="${headerClass}">
          <div class="${headerIconClass}">
            <span class="material-symbols-outlined" aria-hidden="true">${isSingleButton ? 'info' : 'warning'}</span>
          </div>
          <h2 class="${titleClass}" id="${baseClass}-confirm-title">${escapeHtml(title)}</h2>
        </div>
        <div class="${bodyClass}">
          <div class="${messageClass}">${escapeHtml(message).replace(/\n/g, '<br>')}</div>
          <div class="${actionsClass}">
            ${!isSingleButton ? `
            <button 
              class="${buttonClass} ${buttonClass}--secondary" 
              id="${baseClass}-confirm-cancel"
              type="button"
            >
              ${escapeHtml(cancelText || 'Cancel')}
            </button>
            ` : ''}
            <button 
              class="${buttonClass} ${buttonClass}--primary" 
              id="${baseClass}-confirm-ok"
              type="button"
              autofocus
            >
              ${!isSingleButton ? '<span class="material-symbols-outlined" aria-hidden="true">check</span>' : ''}
              ${escapeHtml(confirmText)}
            </button>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(dialog);
    
    // Focus management
    const okBtn = dialog.querySelector(`#${baseClass}-confirm-ok`) as HTMLElement;
    const cancelBtn = dialog.querySelector(`#${baseClass}-confirm-cancel`) as HTMLElement;
    
    if (okBtn) {
      okBtn.focus();
    }
    
    const cleanup = () => {
      dialog.remove();
      document.removeEventListener('keydown', handleEscape);
    };
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        resolve(isSingleButton ? true : false);
        cleanup();
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    
    okBtn?.addEventListener('click', () => {
      resolve(true);
      cleanup();
    });
    
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        resolve(false);
        cleanup();
      });
    }
    
    // Close on overlay click (only if not single button)
    if (!isSingleButton) {
      const overlay = dialog.querySelector(`.${overlayClass}`);
      overlay?.addEventListener('click', () => {
        resolve(false);
        cleanup();
      });
    }
  });
}

/**
 * Create URL input dialog (replaces native prompt)
 */
export function createUrlInputDialog(
  label: string,
  defaultValue: string = '',
  prefix: string = 'dev' // 'dev' for dev-score-bubble, 'page-list' for page-list
): Promise<string | null> {
  return new Promise((resolve) => {
    const baseClass = prefix === 'page-list' ? 'page-list' : 'dev-score-bubble';
    const dialog = document.createElement('div');
    dialog.className = `${baseClass}-modal`;
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-labelledby', `${baseClass}-url-input-title`);
    dialog.setAttribute('aria-modal', 'true');
    
    const modalContentClass = prefix === 'page-list'
      ? `${baseClass}-modal__content ${baseClass}-modal__content--small`
      : `${baseClass}-modal-content ${baseClass}-modal-content--small`;
    
    const headerClass = prefix === 'page-list'
      ? `${baseClass}-modal__header`
      : `${baseClass}-modal-header`;
    
    const titleClass = prefix === 'page-list'
      ? `${baseClass}-modal__title`
      : `${baseClass}-modal-title`;
    
    const bodyClass = prefix === 'page-list'
      ? `${baseClass}-modal__body`
      : `${baseClass}-modal-body`;
    
    const actionsClass = prefix === 'page-list'
      ? `${baseClass}-modal__actions`
      : `${baseClass}-modal-actions`;
    
    const buttonClass = prefix === 'page-list'
      ? `${baseClass}-modal__button`
      : `${baseClass}-modal-button`;
    
    const overlayClass = prefix === 'page-list'
      ? `${baseClass}-modal__overlay`
      : `${baseClass}-modal-overlay`;
    
    dialog.innerHTML = `
      <div class="${overlayClass}" aria-hidden="true"></div>
      <div class="${modalContentClass}">
        <div class="${headerClass}">
          <h2 class="${titleClass}" id="${baseClass}-url-input-title">${escapeHtml(label)}</h2>
        </div>
        <div class="${bodyClass}">
          <label class="${baseClass}-input-label" for="${baseClass}-url-input-field">
            Enter new URL:
          </label>
          <input
            type="text"
            id="${baseClass}-url-input-field"
            class="${baseClass}-input-field"
            value="${escapeHtml(defaultValue)}"
            placeholder="/path/to/page"
            autofocus
          />
          <div class="${actionsClass}">
            <button 
              class="${buttonClass} ${buttonClass}--secondary" 
              id="${baseClass}-url-input-cancel"
              type="button"
            >
              Cancel
            </button>
            <button 
              class="${buttonClass} ${buttonClass}--primary" 
              id="${baseClass}-url-input-ok"
              type="button"
            >
              <span class="material-symbols-outlined" aria-hidden="true">check</span>
              Update
            </button>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(dialog);
    
    const input = dialog.querySelector(`#${baseClass}-url-input-field`) as HTMLInputElement;
    const okBtn = dialog.querySelector(`#${baseClass}-url-input-ok`) as HTMLElement;
    const cancelBtn = dialog.querySelector(`#${baseClass}-url-input-cancel`) as HTMLElement;
    
    if (input) {
      input.focus();
      input.select();
    }
    
    const cleanup = () => {
      dialog.remove();
      document.removeEventListener('keydown', handleKeyDown);
    };
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        resolve(null);
        cleanup();
      } else if (e.key === 'Enter' && e.target === input) {
        e.preventDefault();
        resolve(input.value.trim() || null);
        cleanup();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    
    okBtn?.addEventListener('click', () => {
      resolve(input?.value.trim() || null);
      cleanup();
    });
    
    cancelBtn?.addEventListener('click', () => {
      resolve(null);
      cleanup();
    });
    
    // Close on overlay click
    const overlay = dialog.querySelector(`.${overlayClass}`);
    overlay?.addEventListener('click', () => {
      resolve(null);
      cleanup();
    });
  });
}

