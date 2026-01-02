/**
 * Table of Contents Module
 * Handles mobile dropdown toggle for TOC widget in sidebar
 * Builds TOC dynamically from all headers in the DOM (including shortcodes)
 * Also fixes shortcode placeholders in TOC links by matching with actual headings
 */

/**
 * Generate a Hugo-style ID from text (matches Hugo's ID generation algorithm)
 */
const generateHeadingId = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    // Replace spaces and multiple spaces with hyphens
    .replace(/\s+/g, "-")
    // Remove special characters except hyphens
    .replace(/[^\w\-]/g, "")
    // Remove multiple consecutive hyphens
    .replace(/-+/g, "-")
    // Remove leading/trailing hyphens
    .replace(/^-+|-+$/g, "");
};

/**
 * Build TOC from all headings in the page content (including shortcodes)
 * Only includes headings within the .prose container
 */
const buildTOCFromDOM = (): void => {
  const tocContent = document.querySelector<HTMLElement>(".sidebar-widget__toc-content");
  if (!tocContent) return;

  // Find the prose content area - this is where the main page content lives
  const proseContent = document.querySelector<HTMLElement>(".prose");

  if (!proseContent) {
    // Hide TOC if no prose area found
    const tocWidget = tocContent.closest(".sidebar-widget--toc") as HTMLElement | null;
    if (tocWidget) {
      tocWidget.style.display = "none";
    }
    return;
  }

  // Get all headings from h2 to h4 in the prose content only (matching Hugo's TOC config)
  const headings = Array.from(proseContent.querySelectorAll<HTMLElement>("h2, h3, h4"));

  if (headings.length === 0) {
    // Hide TOC if no headings found
    const tocWidget = tocContent.closest(".sidebar-widget--toc") as HTMLElement | null;
    if (tocWidget) {
      tocWidget.style.display = "none";
    }
    return;
  }

  // Ensure headings have IDs
  headings.forEach((heading) => {
    if (!heading.id) {
      const text = heading.textContent?.trim() || heading.innerText?.trim() || "";
      if (text) {
        heading.id = generateHeadingId(text);
      }
    } else {
      // Fix IDs that contain shortcode placeholders
      if (heading.id.includes("hahahugoshortcode") || heading.id.includes("hbhb")) {
        const text = heading.textContent?.trim() || heading.innerText?.trim() || "";
        if (text) {
          heading.id = generateHeadingId(text);
        }
      }
    }
  });

  // Build TOC structure
  const nav = tocContent.querySelector<HTMLElement>("#TableOfContents");
  if (!nav) return;

  const ul = nav.querySelector("ul");
  if (!ul) return;

  // Clear existing content
  ul.innerHTML = "";

  // Track the current nesting level and ul stack
  // ulStack[0] is always the root ul
  const ulStack: HTMLUListElement[] = [ul];
  const startLevel = 2; // Hugo TOC starts at h2

  headings.forEach((heading) => {
    const level = parseInt(heading.tagName.substring(1), 10); // h2 -> 2, h3 -> 3, h4 -> 4
    const id = heading.id;
    const text = heading.textContent?.trim() || heading.innerText?.trim() || "";

    if (!id || !text) return;

    const relativeLevel = level - startLevel; // 0 for h2, 1 for h3, 2 for h4
    const targetDepth = relativeLevel + 1; // Depth in ul stack (1-based)

    // Pop stack until we're at the right depth
    while (ulStack.length > targetDepth) {
      ulStack.pop();
    }

    // Push new nested lists if we need to go deeper
    while (ulStack.length < targetDepth) {
      const newUl = document.createElement("ul");
      const currentUl = ulStack[ulStack.length - 1];
      const lastLi = currentUl.lastElementChild as HTMLLIElement;
      
      if (lastLi) {
        // Append nested ul to last li
        lastLi.appendChild(newUl);
      } else {
        // If no li exists, create one with empty content (shouldn't happen, but handle it)
        const li = document.createElement("li");
        li.appendChild(newUl);
        currentUl.appendChild(li);
      }
      
      ulStack.push(newUl);
    }

    // Get current ul (should be at targetDepth)
    const currentUl = ulStack[ulStack.length - 1];

    // Create list item
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.href = `#${id}`;
    a.textContent = text;
    li.appendChild(a);
    currentUl.appendChild(li);
  });

  // Show TOC widget if it was hidden
  const tocWidget = tocContent.closest(".sidebar-widget--toc") as HTMLElement | null;
  if (tocWidget) {
    tocWidget.style.display = "";
  }
};

/**
 * Fix header IDs that contain shortcode placeholders
 */
const fixHeaderIds = (): void => {
  // Get all headings from the page content
  const headings = document.querySelectorAll<HTMLElement>("h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]");
  
  // Map of old IDs to new IDs
  const idMap = new Map<string, string>();
  
  headings.forEach((heading) => {
    const oldId = heading.id;
    if (!oldId) return;
    
    // Check if ID contains shortcode placeholder
    if (oldId.includes("hahahugoshortcode") || oldId.includes("hbhb")) {
      // Get the actual rendered text content
      const text = heading.textContent?.trim() || heading.innerText?.trim() || "";
      if (text) {
        // Generate new ID from the actual text
        const newId = generateHeadingId(text);
        
        if (newId && newId !== oldId) {
          idMap.set(oldId, newId);
          heading.id = newId;
        }
      }
    }
  });
  
  // Update all links that point to the old IDs
  if (idMap.size > 0) {
    // Update TOC links
    const tocLinks = document.querySelectorAll<HTMLAnchorElement>(".sidebar-widget__toc-content a[href^='#']");
    tocLinks.forEach((link) => {
      const href = link.getAttribute("href");
      if (!href) return;
      const targetId = href.substring(1);
      const newId = idMap.get(targetId);
      if (newId) {
        link.setAttribute("href", `#${newId}`);
      }
    });
    
    // Update any other anchor links on the page
    const allLinks = document.querySelectorAll<HTMLAnchorElement>("a[href^='#']");
    allLinks.forEach((link) => {
      const href = link.getAttribute("href");
      if (!href) return;
      const targetId = href.substring(1);
      const newId = idMap.get(targetId);
      if (newId) {
        link.setAttribute("href", `#${newId}`);
      }
    });
  }
};

/**
 * Fix TOC link text by replacing shortcode placeholders with actual heading text
 */
const fixTOCShortcodes = (): void => {
  const tocContent = document.querySelector<HTMLElement>(".sidebar-widget__toc-content");
  if (!tocContent) return;

  // Get all headings from the page content (these have shortcodes already processed)
  const headings = document.querySelectorAll<HTMLElement>("h1[id], h2[id], h3[id], h4[id]");
  
  // Create a map of heading IDs to their text content
  const headingMap = new Map<string, string>();
  headings.forEach((heading) => {
    const id = heading.id;
    if (id) {
      // Get text content, preserving HTML structure for shortcodes
      const text = heading.textContent?.trim() || heading.innerText?.trim() || "";
      if (text) {
        headingMap.set(id, text);
      }
    }
  });

  // Find all TOC links and update their text
  const tocLinks = tocContent.querySelectorAll<HTMLAnchorElement>("a[href^='#']");
  tocLinks.forEach((link) => {
    const href = link.getAttribute("href");
    if (!href) return;

    // Extract ID from href (e.g., "#heading-id" -> "heading-id")
    const targetId = href.substring(1);
    const actualText = headingMap.get(targetId);

    // If we found the actual heading text and the link text contains placeholder, replace it
    if (actualText && (link.textContent?.includes("HAHAHUGOSHORTCODE") || link.textContent !== actualText)) {
      link.textContent = actualText;
    }
  });
};

/**
 * Initialize TOC dropdown functionality
 */
export const initTOC = (): void => {
  const tocWidgets = document.querySelectorAll<HTMLElement>(".sidebar-widget--toc");

  tocWidgets.forEach((widget) => {
    const toggle = widget.querySelector<HTMLButtonElement>(".sidebar-widget__toc-toggle");
    const content = widget.querySelector<HTMLElement>(".sidebar-widget__toc-content");

    if (!toggle || !content) return;

    // Toggle functionality - works on all screen sizes
    const handleToggle = () => {
      const isOpen = toggle.getAttribute("aria-expanded") === "true";
      const newState = !isOpen;

      toggle.setAttribute("aria-expanded", newState.toString());
      if (newState) {
        content.classList.add("is-open");
      } else {
        content.classList.remove("is-open");
      }
    };

    // Set initial state - start collapsed on all screen sizes
    const setInitialState = () => {
      toggle.setAttribute("aria-expanded", "false");
      content.classList.remove("is-open");
    };

    // Set initial state
    setInitialState();

    // Build TOC from DOM (includes headers from shortcodes)
    // Run after delays to ensure DOM is fully rendered and shortcodes (including geolocation) are processed
    const buildAndFix = () => {
      buildTOCFromDOM(); // Build TOC from all headers in DOM
      fixHeaderIds(); // Fix any remaining ID issues
    };

    // Initial build after short delay
    setTimeout(() => {
      buildAndFix();
    }, 100);

    // Build again after longer delay to catch async geolocation updates
    setTimeout(() => {
      buildAndFix();
    }, 1000);

    // Also build on window load in case content loads later
    if (document.readyState === "complete") {
      buildAndFix();
    } else {
      window.addEventListener("load", () => {
        setTimeout(buildAndFix, 500); // Delay after load to ensure geolocation is processed
      });
    }

    // Track interaction type to prevent double-firing
    let lastInteractionType: "pointer" | "touch" | "click" | null = null;
    let interactionTimeout: ReturnType<typeof setTimeout> | null = null;
    let hasHandledInteraction = false;

    // Universal handler that works for all input types
    const handleInteraction = (e: Event, interactionType: "pointer" | "touch" | "click") => {
      // Clear any pending timeout
      if (interactionTimeout) {
        clearTimeout(interactionTimeout);
      }

      // If we just handled a touch/pointer event, ignore the click
      if (interactionType === "click" && (lastInteractionType === "touch" || lastInteractionType === "pointer")) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      // Prevent double-firing within a short time window
      if (hasHandledInteraction && interactionType === lastInteractionType) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      // Handle the interaction
      e.preventDefault();
      e.stopPropagation();
      lastInteractionType = interactionType;
      hasHandledInteraction = true;
      handleToggle();

      // Reset flags after a delay to allow subsequent interactions
      interactionTimeout = setTimeout(() => {
        lastInteractionType = null;
        hasHandledInteraction = false;
      }, 400);
    };

    // Use Pointer Events API (works across all modern browsers including Brave)
    // This is the most reliable cross-browser method
    if (window.PointerEvent) {
      toggle.addEventListener("pointerdown", (e) => {
        // Only handle touch-like pointer events (not mouse)
        if (e.pointerType === "touch" || e.pointerType === "pen") {
          lastInteractionType = "pointer";
        }
      }, { passive: true });

      toggle.addEventListener("pointerup", (e) => {
        if (e.pointerType === "touch" || e.pointerType === "pen") {
          handleInteraction(e, "pointer");
        }
      });
    }

    // Touch events - work in parallel with pointer events for maximum compatibility
    // Some browsers (like Brave) may handle these differently
    let touchStartTime = 0;
    let touchStartTarget: EventTarget | null = null;

    toggle.addEventListener("touchstart", (e) => {
      lastInteractionType = "touch";
      touchStartTime = Date.now();
      touchStartTarget = e.target;
      // Don't prevent default here - let touchend handle it
    }, { passive: true });

    toggle.addEventListener("touchend", (e) => {
      // Ensure this is the same touch that started on this element
      if (e.target !== touchStartTarget && e.target !== toggle) {
        return;
      }

      // Prevent default immediately (Brave requires this to be synchronous)
      e.preventDefault();
      e.stopPropagation();
      
      // Only handle if touch was quick (not a scroll gesture)
      const touchDuration = Date.now() - touchStartTime;
      if (touchDuration < 500) {
        handleInteraction(e, "touch");
      }
      
      // Reset touch tracking
      touchStartTime = 0;
      touchStartTarget = null;
    }, { passive: false }); // Must be non-passive to allow preventDefault

    // Click handler for mouse and as fallback
    // This will also fire after touch events in some browsers, but we filter it out
    toggle.addEventListener("click", (e) => {
      handleInteraction(e, "click");
    });


    // Handle keyboard navigation
    toggle.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleToggle();
      }
    });
  });
};

