// ============================================================================
// Sitemap Search Functionality
// ============================================================================

/**
 * Initialize sitemap search functionality
 */
export const initSitemap = (): void => {
  const container = document.querySelector<HTMLElement>(".section-sitemap");
  if (!container) return;

  const searchInput = container.querySelector<HTMLInputElement>("[data-sitemap-search]");
  const searchClear = container.querySelector<HTMLButtonElement>("[data-sitemap-search-clear]");
  const grid = container.querySelector<HTMLElement>("[data-sitemap-grid]");
  const noResults = container.querySelector<HTMLElement>("[data-sitemap-no-results]");
  const allItems = container.querySelectorAll<HTMLElement>("[data-sitemap-item]");
  const allGroups = container.querySelectorAll<HTMLElement>("[data-sitemap-group]");

  if (!grid || !searchInput) return;

  let currentSearch = "";

  // Get search term from URL if present
  const urlParams = new URLSearchParams(window.location.search);
  const searchParam = urlParams.get("search");
  if (searchParam) {
    currentSearch = searchParam;
    searchInput.value = currentSearch;
    if (searchClear && currentSearch) {
      searchClear.classList.add("sitemap__search-clear--visible");
    }
  }

  /**
   * Update the view based on current search
   */
  const updateView = (): void => {
    const searchTerm = currentSearch.toLowerCase().trim();
    let visibleCount = 0;
    let hasVisibleGroups = false;

    // If no search term, show everything
    if (!searchTerm) {
      allItems.forEach((item) => {
        item.style.display = "";
      });
      allGroups.forEach((group) => {
        group.style.display = "";
      });
      if (grid) grid.style.display = "";
      if (noResults) noResults.style.display = "none";
      return;
    }

    // Filter items and groups
    allGroups.forEach((group) => {
      const groupItems = group.querySelectorAll<HTMLElement>("[data-sitemap-item]");
      let groupVisibleCount = 0;

      groupItems.forEach((item) => {
        const title = item.getAttribute("data-sitemap-title") || "";
        const linkText = item.textContent?.toLowerCase() || "";
        const matches = title.includes(searchTerm) || linkText.includes(searchTerm);

        if (matches) {
          item.style.display = "";
          groupVisibleCount++;
          visibleCount++;
        } else {
          item.style.display = "none";
        }
      });

      // Show/hide group based on visible items
      if (groupVisibleCount > 0) {
        group.style.display = "";
        hasVisibleGroups = true;
      } else {
        group.style.display = "none";
      }
    });

    // Show/hide grid and no results message
    if (hasVisibleGroups && visibleCount > 0) {
      if (grid) grid.style.display = "";
      if (noResults) noResults.style.display = "none";
    } else {
      if (grid) grid.style.display = "none";
      if (noResults) noResults.style.display = "block";
    }
  };

  // Debounce function for search
  let searchTimeout: number | null = null;
  const debouncedUpdateView = (): void => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    searchTimeout = window.setTimeout(() => {
      updateView();
    }, 300);
  };

  // Search input handler with debouncing
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      const target = e.target as HTMLInputElement;
      const newSearch = target.value;
      currentSearch = newSearch;

      // Show/hide clear button immediately
      if (searchClear) {
        if (currentSearch) {
          searchClear.classList.add("sitemap__search-clear--visible");
        } else {
          searchClear.classList.remove("sitemap__search-clear--visible");
        }
      }

      // Update URL without page reload
      const url = new URL(window.location.href);
      if (currentSearch) {
        url.searchParams.set("search", currentSearch);
      } else {
        url.searchParams.delete("search");
      }
      window.history.pushState({}, "", url);

      // Debounce the actual filtering
      debouncedUpdateView();
    });

    // Clear search handler
    if (searchClear) {
      searchClear.addEventListener("click", (e) => {
        e.preventDefault();
        if (searchInput) {
          searchInput.value = "";
          currentSearch = "";

          // Clear search from URL
          const url = new URL(window.location.href);
          url.searchParams.delete("search");
          window.history.pushState({}, "", url);

          updateView();
          searchClear.classList.remove("sitemap__search-clear--visible");
          searchInput.focus();
        }
      });
    }
  }

  // Initial view update
  updateView();
};

