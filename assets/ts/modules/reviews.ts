/**
 * Reviews Module
 * Handles reviews filtering and carousel functionality
 */

// ============================================================================
// Carousel Functionality
// ============================================================================

interface CarouselState {
  currentIndex: number;
  totalItems: number;
  isTransitioning: boolean;
  touchStartX: number;
  touchEndX: number;
  mouseStartX: number;
  isMouseDown: boolean;
  autoplayInterval: ReturnType<typeof setInterval> | null;
  isAutoplayPaused: boolean;
}

interface CarouselElements {
  carousel: HTMLElement;
  wrapper: HTMLElement;
  cards: HTMLElement[];
  prevButton: HTMLButtonElement | null;
  nextButton: HTMLButtonElement | null;
  dots: HTMLButtonElement[];
}

// Store cleanup functions for event listeners
const carouselCleanups = new Map<HTMLElement, (() => void)[]>();

/**
 * Get transition duration from CSS in milliseconds
 */
function getTransitionDuration(element: HTMLElement): number {
  const style = window.getComputedStyle(element);
  const duration = style.transitionDuration || '0.6s';
  // Parse "0.6s" or "600ms" to milliseconds
  const match = duration.match(/([\d.]+)(s|ms)/);
  if (match) {
    const value = parseFloat(match[1]);
    return match[2] === 's' ? value * 1000 : value;
  }
  return 600; // Default fallback
}

/**
 * Capitalize first letter of a string
 */
function capitalize(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function initReviewsCarousel(): void {
  const carousel = document.querySelector('[data-reviews-carousel]') as HTMLElement | null;
  if (!carousel) return;

  // Clean up previous instance if it exists
  const existingCleanup = carouselCleanups.get(carousel);
  if (existingCleanup) {
    existingCleanup.forEach(fn => fn());
    carouselCleanups.delete(carousel);
  }

  const wrapper = carousel.querySelector('.reviews__carousel-wrapper') as HTMLElement | null;
  const cards = Array.from(carousel.querySelectorAll('.review-card--carousel')) as HTMLElement[];
  const prevButton = carousel.querySelector('[data-carousel-prev]') as HTMLButtonElement | null;
  const nextButton = carousel.querySelector('[data-carousel-next]') as HTMLButtonElement | null;
  const dots = Array.from(carousel.querySelectorAll('[data-carousel-dot]')) as HTMLButtonElement[];

  if (!wrapper || cards.length === 0) return;

  // Handle edge case: too few cards for carousel
  if (cards.length < 2) {
    // Hide navigation if only one card
    if (prevButton) prevButton.style.display = 'none';
    if (nextButton) nextButton.style.display = 'none';
    if (dots.length > 0) {
      dots.forEach(dot => dot.style.display = 'none');
    }
    // Still need to set the single card as active so it displays
    if (cards.length === 1) {
      cards[0].setAttribute('data-carousel-active', 'true');
    }
    return;
  }

  const elements: CarouselElements = {
    carousel,
    wrapper,
    cards,
    prevButton,
    nextButton,
    dots,
  };

  const state: CarouselState = {
    currentIndex: 0,
    totalItems: cards.length,
    isTransitioning: false,
    touchStartX: 0,
    touchEndX: 0,
    mouseStartX: 0,
    isMouseDown: false,
    autoplayInterval: null,
    isAutoplayPaused: false,
  };

  // Get transition duration dynamically
  const transitionDuration = getTransitionDuration(wrapper);
  const cleanupFunctions: (() => void)[] = [];
  
  // Check if user prefers reduced motion
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Calculate wrapped difference between two indices (handles infinite loop)
  function getWrappedDiff(index: number, currentIndex: number, total: number): number {
    let diff = index - currentIndex;
    // Handle wrapping - find shortest path
    if (Math.abs(diff) > total / 2) {
      if (diff > 0) {
        diff = diff - total;
      } else {
        diff = diff + total;
      }
    }
    return diff;
  }

  // Update card positions based on current index (optimized to only update changed attributes)
  // Shows only: active card (center), 1 card on left, 1 card on right - hides all others
  function updateCarousel(): void {
    cards.forEach((card, index) => {
      const diff = getWrappedDiff(index, state.currentIndex, state.totalItems);
      const absDiff = Math.abs(diff);

      // Determine new position - only show immediate neighbors
      let newActive: string | null = null;
      let newPosition: string | null = null;

      if (diff === 0) {
        // Active card (center)
        newActive = 'true';
      } else if (diff === -1 || diff === state.totalItems - 1) {
        // Immediate left card (or wrapped from end)
        newPosition = 'left';
      } else if (diff === 1 || diff === -(state.totalItems - 1)) {
        // Immediate right card (or wrapped from start)
        newPosition = 'right';
      } else {
        // Hide all other cards
        newPosition = 'hidden';
      }

      // Only update if changed
      const currentActive = card.getAttribute('data-carousel-active');
      const currentPosition = card.getAttribute('data-carousel-position');

      if (newActive !== currentActive) {
        if (newActive) {
          card.setAttribute('data-carousel-active', newActive);
        } else {
          card.removeAttribute('data-carousel-active');
        }
      }

      if (newPosition !== currentPosition) {
        if (newPosition) {
          card.setAttribute('data-carousel-position', newPosition);
        } else {
          card.removeAttribute('data-carousel-position');
        }
      }
    });

    // Update dots (only if they exist and match count)
    if (dots.length === state.totalItems) {
      dots.forEach((dot, index) => {
        const isActive = index === state.currentIndex;
        const currentlyActive = dot.classList.contains('reviews__carousel-dot--active');

        if (isActive !== currentlyActive) {
          if (isActive) {
            dot.classList.add('reviews__carousel-dot--active');
            dot.setAttribute('aria-current', 'true');
          } else {
            dot.classList.remove('reviews__carousel-dot--active');
            dot.removeAttribute('aria-current');
          }
        }
      });
    }

    // Buttons are never disabled in infinite loop mode
    if (prevButton) {
      prevButton.disabled = false;
    }
    if (nextButton) {
      nextButton.disabled = false;
    }
  }

  // Normalize index to valid range (handles wrapping)
  function normalizeIndex(index: number): number {
    if (index < 0) {
      return state.totalItems + (index % state.totalItems);
    }
    return index % state.totalItems;
  }

  // Navigate to specific index (with infinite loop support)
  function goToIndex(index: number): void {
    if (state.isTransitioning) {
      return;
    }

    // Normalize index to handle wrapping
    const normalizedIndex = normalizeIndex(index);
    
    if (normalizedIndex === state.currentIndex) {
      return;
    }

    state.isTransitioning = true;
    state.currentIndex = normalizedIndex;
    updateCarousel();

    // Reset transition flag after animation (use dynamic duration)
    setTimeout(() => {
      state.isTransitioning = false;
    }, transitionDuration);
  }

  // Navigate to next (infinite loop)
  function goToNext(): void {
    goToIndex(state.currentIndex + 1);
  }

  // Navigate to previous (infinite loop)
  function goToPrev(): void {
    goToIndex(state.currentIndex - 1);
  }

  // Start autoplay
  function startAutoplay(): void {
    // Don't autoplay if user prefers reduced motion
    if (prefersReducedMotion) {
      return;
    }

    // Clear any existing interval
    stopAutoplay();

    // Set up autoplay interval (5 seconds = 5000ms)
    state.autoplayInterval = setInterval(() => {
      if (!state.isAutoplayPaused && !state.isTransitioning) {
        goToNext();
      }
    }, 5000);
  }

  // Stop autoplay
  function stopAutoplay(): void {
    if (state.autoplayInterval) {
      clearInterval(state.autoplayInterval);
      state.autoplayInterval = null;
    }
  }

  // Pause autoplay (temporarily)
  function pauseAutoplay(): void {
    state.isAutoplayPaused = true;
  }

  // Resume autoplay
  function resumeAutoplay(): void {
    state.isAutoplayPaused = false;
  }

  // Touch/swipe handlers
  function handleTouchStart(e: TouchEvent): void {
    if (e.touches.length > 0) {
      state.touchStartX = e.touches[0].clientX;
    }
  }

  function handleTouchMove(e: TouchEvent): void {
    if (!state.touchStartX || e.touches.length === 0) return;
    
    const currentX = e.touches[0].clientX;
    const deltaX = Math.abs(currentX - state.touchStartX);
    const deltaY = Math.abs(e.touches[0].clientY - (e.touches[0].clientY || 0));
    
    // Prevent vertical scrolling if horizontal swipe detected
    if (deltaX > deltaY && deltaX > 10) {
      e.preventDefault();
    }
  }

  function handleTouchEnd(e: TouchEvent): void {
    if (!state.touchStartX) return;

    if (e.changedTouches && e.changedTouches.length > 0) {
      state.touchEndX = e.changedTouches[0].clientX;
      const diff = state.touchStartX - state.touchEndX;
      const minSwipeDistance = 50;

      if (Math.abs(diff) > minSwipeDistance) {
        if (diff > 0) {
          // Swiped left - go to next
          goToNext();
        } else {
          // Swiped right - go to previous
          goToPrev();
        }
      }
    }

    state.touchStartX = 0;
    state.touchEndX = 0;
  }

  // Mouse drag handlers for desktop
  function handleMouseDown(e: MouseEvent): void {
    state.isMouseDown = true;
    state.mouseStartX = e.clientX;
    e.preventDefault();
  }

  function handleMouseMove(e: MouseEvent): void {
    if (!state.isMouseDown) return;
    // Prevent text selection during drag
    e.preventDefault();
  }

  function handleMouseUp(e: MouseEvent): void {
    if (!state.isMouseDown) return;

    const diff = state.mouseStartX - e.clientX;
    const minDragDistance = 50;

    if (Math.abs(diff) > minDragDistance) {
      if (diff > 0) {
        // Dragged left - go to next
        goToNext();
      } else {
        // Dragged right - go to previous
        goToPrev();
      }
    }

    state.isMouseDown = false;
    state.mouseStartX = 0;
  }

  function handleMouseLeave(): void {
    state.isMouseDown = false;
    state.mouseStartX = 0;
  }

  // Set up accessibility attributes
  carousel.setAttribute('role', 'region');
  carousel.setAttribute('aria-label', 'Customer reviews carousel');
  wrapper.setAttribute('role', 'group');
  wrapper.setAttribute('aria-roledescription', 'carousel');
  wrapper.setAttribute('aria-live', 'polite');
  wrapper.setAttribute('tabindex', '0');

  // Add aria-labels to buttons if missing
  if (prevButton && !prevButton.getAttribute('aria-label')) {
    prevButton.setAttribute('aria-label', 'Previous review');
  }
  if (nextButton && !nextButton.getAttribute('aria-label')) {
    nextButton.setAttribute('aria-label', 'Next review');
  }

  // Event listeners with cleanup tracking
  if (prevButton) {
    const prevHandler = () => {
      pauseAutoplay();
      goToPrev();
      // Resume after a delay
      setTimeout(() => resumeAutoplay(), 10000);
    };
    prevButton.addEventListener('click', prevHandler);
    cleanupFunctions.push(() => prevButton?.removeEventListener('click', prevHandler));
  }

  if (nextButton) {
    const nextHandler = () => {
      pauseAutoplay();
      goToNext();
      // Resume after a delay
      setTimeout(() => resumeAutoplay(), 10000);
    };
    nextButton.addEventListener('click', nextHandler);
    cleanupFunctions.push(() => nextButton?.removeEventListener('click', nextHandler));
  }

  if (dots.length === state.totalItems) {
    dots.forEach((dot) => {
      // Read the index from the data attribute to ensure correct mapping
      const dotIndexAttr = dot.getAttribute('data-carousel-dot');
      const dotIndex = dotIndexAttr !== null ? parseInt(dotIndexAttr, 10) : null;
      
      if (dotIndex === null || isNaN(dotIndex) || dotIndex < 0 || dotIndex >= state.totalItems) {
        console.warn('Invalid carousel dot index:', dotIndexAttr);
        return;
      }
      
      const handler = () => {
        pauseAutoplay();
        goToIndex(dotIndex);
        // Resume after a delay
        setTimeout(() => resumeAutoplay(), 10000);
      };
      dot.addEventListener('click', handler);
      cleanupFunctions.push(() => dot.removeEventListener('click', handler));
      
      // Add Enter key support for dots
      const keyHandler = (e: KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          pauseAutoplay();
          goToIndex(dotIndex);
          // Resume after a delay
          setTimeout(() => resumeAutoplay(), 10000);
        }
      };
      dot.addEventListener('keydown', keyHandler);
      cleanupFunctions.push(() => dot.removeEventListener('keydown', keyHandler));
    });
  }

  // Touch events for mobile
  const touchStartHandler = (e: TouchEvent) => {
    pauseAutoplay();
    handleTouchStart(e);
  };
  wrapper.addEventListener('touchstart', touchStartHandler, { passive: true });
  cleanupFunctions.push(() => wrapper.removeEventListener('touchstart', touchStartHandler));
  
  wrapper.addEventListener('touchmove', handleTouchMove, { passive: false });
  cleanupFunctions.push(() => wrapper.removeEventListener('touchmove', handleTouchMove));
  
  const touchEndHandler = (e: TouchEvent) => {
    handleTouchEnd(e);
    // Resume after a delay
    setTimeout(() => resumeAutoplay(), 10000);
  };
  wrapper.addEventListener('touchend', touchEndHandler, { passive: true });
  cleanupFunctions.push(() => wrapper.removeEventListener('touchend', touchEndHandler));

  // Mouse drag events for desktop
  const mouseDownHandler = (e: MouseEvent) => {
    pauseAutoplay();
    handleMouseDown(e);
  };
  wrapper.addEventListener('mousedown', mouseDownHandler);
  cleanupFunctions.push(() => wrapper.removeEventListener('mousedown', mouseDownHandler));
  
  document.addEventListener('mousemove', handleMouseMove);
  cleanupFunctions.push(() => document.removeEventListener('mousemove', handleMouseMove));
  
  const mouseUpHandler = (e: MouseEvent) => {
    handleMouseUp(e);
    // Resume after a delay
    setTimeout(() => resumeAutoplay(), 10000);
  };
  document.addEventListener('mouseup', mouseUpHandler);
  cleanupFunctions.push(() => document.removeEventListener('mouseup', mouseUpHandler));
  
  wrapper.addEventListener('mouseleave', handleMouseLeave);
  cleanupFunctions.push(() => wrapper.removeEventListener('mouseleave', handleMouseLeave));

  // Pause autoplay on hover, resume on leave
  const mouseEnterHandler = () => pauseAutoplay();
  const mouseLeaveHandler = () => resumeAutoplay();
  carousel.addEventListener('mouseenter', mouseEnterHandler);
  carousel.addEventListener('mouseleave', mouseLeaveHandler);
  cleanupFunctions.push(() => {
    carousel.removeEventListener('mouseenter', mouseEnterHandler);
    carousel.removeEventListener('mouseleave', mouseLeaveHandler);
  });

  // Pause autoplay on focus, resume on blur
  const focusHandler = () => pauseAutoplay();
  const blurHandler = () => resumeAutoplay();
  wrapper.addEventListener('focusin', focusHandler);
  wrapper.addEventListener('focusout', blurHandler);
  cleanupFunctions.push(() => {
    wrapper.removeEventListener('focusin', focusHandler);
    wrapper.removeEventListener('focusout', blurHandler);
  });

  // Keyboard navigation (works when wrapper or any child is focused)
  const keyHandler = (e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      pauseAutoplay();
      goToPrev();
      setTimeout(() => resumeAutoplay(), 10000);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      pauseAutoplay();
      goToNext();
      setTimeout(() => resumeAutoplay(), 10000);
    }
  };
  wrapper.addEventListener('keydown', keyHandler);
  cleanupFunctions.push(() => wrapper.removeEventListener('keydown', keyHandler));

  // Store cleanup functions (include autoplay cleanup)
  cleanupFunctions.push(() => stopAutoplay());
  carouselCleanups.set(carousel, cleanupFunctions);

  // Initialize carousel
  updateCarousel();

  // Start autoplay
  startAutoplay();
}

// ============================================================================
// Carousel/Grid Visibility Enforcement
// ============================================================================

/**
 * Ensure proper visibility of carousel vs grid based on screen size
 * This enforces the CSS rules via JavaScript as a backup
 */
function enforceCarouselGridVisibility(): void {
  const reviewsSection = document.querySelector('.reviews--carousel') as HTMLElement | null;
  if (!reviewsSection) return;

  const carousel = reviewsSection.querySelector('.reviews__carousel') as HTMLElement | null;
  const mobileFallbackGrid = reviewsSection.querySelector('.reviews__grid--mobile-fallback') as HTMLElement | null;

  if (!carousel || !mobileFallbackGrid) return;

  // Check if we're on tablet/mobile (max-width: 768px)
  const isTabletOrMobile = window.matchMedia('(max-width: 768px)').matches;

  if (isTabletOrMobile) {
    // On tablet/mobile: show grid, hide carousel
    carousel.style.display = 'none';
    mobileFallbackGrid.style.display = 'grid';
  } else {
    // On desktop: show carousel, hide grid
    carousel.style.display = 'block';
    mobileFallbackGrid.style.display = 'none';
  }
}

// ============================================================================
// Filter Functionality
// ============================================================================

function initReviewsFilter(): void {
  const serviceFilterSelect = document.getElementById('reviews-service-filter') as HTMLSelectElement | null;
  const locationFilterSelect = document.getElementById('reviews-location-filter') as HTMLSelectElement | null;
  const brandFilterSelect = document.getElementById('reviews-brand-filter') as HTMLSelectElement | null;
  const reviewsSection = document.querySelector('.reviews') as HTMLElement | null;
  
  if (!reviewsSection) {
    return;
  }

  // Check if we're in carousel mode
  const isCarouselMode = reviewsSection.classList.contains('reviews--carousel');
  const mobileFallbackGrid = reviewsSection.querySelector('.reviews__grid--mobile-fallback') as HTMLElement | null;
  
  // Get cards from the appropriate container based on screen size
  // On desktop in carousel mode: only filter carousel cards
  // On mobile in carousel mode: only filter grid cards
  // In grid mode: filter all grid cards
  const isTabletOrMobile = window.matchMedia('(max-width: 768px)').matches;
  
  let reviewCards: HTMLElement[] = [];
  if (isCarouselMode) {
    if (isTabletOrMobile && mobileFallbackGrid) {
      // On mobile: filter grid cards
      reviewCards = Array.from(mobileFallbackGrid.querySelectorAll('.review-card')) as HTMLElement[];
    } else {
      // On desktop: filter carousel cards
      const carousel = reviewsSection.querySelector('.reviews__carousel') as HTMLElement | null;
      if (carousel) {
        reviewCards = Array.from(carousel.querySelectorAll('.review-card--carousel')) as HTMLElement[];
      }
    }
  } else {
    // Grid mode: filter all grid cards
    const grid = reviewsSection.querySelector('.reviews__grid') as HTMLElement | null;
    if (grid) {
      reviewCards = Array.from(grid.querySelectorAll('.review-card')) as HTMLElement[];
    }
  }
  
  if (reviewCards.length === 0) {
    return;
  }

  // Store original display state (but don't override CSS visibility rules)
  const originalDisplay: Map<HTMLElement, string> = new Map();
  reviewCards.forEach(card => {
    const computedStyle = window.getComputedStyle(card);
    // Only store if the card is actually visible (not hidden by CSS)
    if (computedStyle.display !== 'none') {
      originalDisplay.set(card, computedStyle.display);
    }
  });

  function filterReviews(): void {
    const serviceType = serviceFilterSelect?.value || '';
    const location = locationFilterSelect?.value || '';
    const brand = brandFilterSelect?.value || '';
    
    let visibleCount = 0;
    
    reviewCards.forEach(card => {
      const cardServiceType = card.getAttribute('data-service-type')?.toLowerCase() || '';
      const cardLocation = card.getAttribute('data-location') || '';
      const cardBrand = card.getAttribute('data-brand') || '';
      
      const serviceMatch = !serviceType || cardServiceType === serviceType.toLowerCase();
      const locationMatch = !location || cardLocation === location;
      const brandMatch = !brand || cardBrand === brand;
      
      if (serviceMatch && locationMatch && brandMatch) {
        // Only set display if we have a stored original value
        // This prevents overriding CSS that hides elements
        const original = originalDisplay.get(card);
        if (original) {
          card.style.display = original;
        } else {
          // Remove inline style to let CSS take over
          card.style.removeProperty('display');
        }
        visibleCount++;
      } else {
        card.style.display = 'none';
      }
    });
    
    // Re-enforce carousel/grid visibility after filtering
    if (isCarouselMode) {
      enforceCarouselGridVisibility();
    }

    // Show message if no reviews match
    if (!reviewsSection) return;
    
    let noResultsMsg = reviewsSection.querySelector('.reviews__no-results') as HTMLElement | null;
    const grid = reviewsSection.querySelector('.reviews__grid') as HTMLElement | null;
    const carousel = reviewsSection.querySelector('.reviews__carousel') as HTMLElement | null;
    
    if (visibleCount === 0) {
      if (!noResultsMsg) {
        noResultsMsg = document.createElement('p');
        noResultsMsg.className = 'reviews__no-results';
        const filters: string[] = [];
        if (serviceType) filters.push(capitalize(serviceType));
        if (location) filters.push(location);
        if (brand) filters.push(brand);
        const filterText = filters.length > 0 ? filters.join(', ') : 'selected filters';
        noResultsMsg.textContent = `No reviews found for ${filterText}.`;
        if (grid) {
          grid.appendChild(noResultsMsg);
        } else if (carousel) {
          carousel.appendChild(noResultsMsg);
        }
      }
    } else {
      noResultsMsg?.remove();
    }
  }

  // Handle filter changes
  if (serviceFilterSelect) {
    serviceFilterSelect.addEventListener('change', filterReviews);
  }
  
  if (locationFilterSelect) {
    locationFilterSelect.addEventListener('change', filterReviews);
  }
  
  if (brandFilterSelect) {
    brandFilterSelect.addEventListener('change', filterReviews);
  }

  // Initialize with current filter values
  filterReviews();
}

export function initReviews(): void {
  // Initialize reviews carousel if present
  if (document.querySelector('[data-reviews-carousel]')) {
    initReviewsCarousel();
    // Enforce visibility rules after carousel init
    enforceCarouselGridVisibility();
    
    // Re-enforce on window resize
    let resizeTimeout: ReturnType<typeof setTimeout> | null = null;
    window.addEventListener('resize', () => {
      if (resizeTimeout) clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        enforceCarouselGridVisibility();
      }, 100);
    });
  }

  // Initialize reviews filter if present (check for any filter)
  if (document.getElementById('reviews-service-filter') || 
      document.getElementById('reviews-location-filter') || 
      document.getElementById('reviews-brand-filter')) {
    initReviewsFilter();
  }
}


