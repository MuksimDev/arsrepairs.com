/**
 * Blog Module
 * Handles search, filter, and sorting functionality for blog posts
 */

interface BlogPost {
  element: HTMLElement;
  title: string;
  tags: string[];
  categories: string[];
  date: string;
}

/**
 * Debounce function to limit function calls
 */
function debounce<T extends (...args: unknown[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return function executedFunction(...args: Parameters<T>) {
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

/**
 * Handle category filter clicks from blog cards and single posts
 * This works on all pages, not just the blog list page
 */
const handleCategoryFilterClicks = (): void => {
  document.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;
    const filterButton = target.closest<HTMLElement>("[data-blog-filter]");
    
    if (!filterButton) return;
    
    // Check if this is a category button from a blog card or single post
    // (not from the blog controls)
    const container = document.querySelector<HTMLElement>("[data-blog-controls]");
    const isInControls = container && container.contains(filterButton);
    
    if (!isInControls) {
      e.preventDefault();
      const filter = filterButton.getAttribute("data-blog-filter");
      if (!filter) return;
      
      // If we're on a single post page, navigate to blog list with filter
      if (!container) {
        const blogListUrl = new URL("/blog/", window.location.origin);
        if (filter !== "all") {
          blogListUrl.searchParams.set("filter", filter);
        }
        window.location.href = blogListUrl.toString();
        return;
      }
      
      // If we're on the blog list page, trigger the filter via the control button
      const controlButton = container.querySelector<HTMLElement>(
        `[data-blog-filter="${filter}"]`
      );
      if (controlButton) {
        controlButton.click();
      }
    }
  });
};

// Initialize category filter clicks on page load
if (typeof document !== "undefined") {
  handleCategoryFilterClicks();
}

/**
 * Initialize blog functionality
 */
export const initBlog = (): void => {
  const container = document.querySelector<HTMLElement>("[data-blog-controls]");
  if (!container) return;

  const searchInput = container.querySelector<HTMLInputElement>("[data-blog-search]");
  const searchClear = container.querySelector<HTMLButtonElement>("[data-blog-search-clear]");
  const filterButtons = container.querySelectorAll<HTMLButtonElement>("[data-blog-filter]");
  const sortSelect = container.querySelector<HTMLSelectElement>("[data-blog-sort]");
  const perPageSelect = container.querySelector<HTMLSelectElement>("[data-blog-per-page]");
  const grid = document.querySelector<HTMLElement>("[data-blog-grid]");
  const noResults = document.querySelector<HTMLElement>("[data-blog-no-results]");
  const resultsCount = container.querySelector<HTMLElement>("[data-blog-results-count]");
  const resultsTotal = container.querySelector<HTMLElement>("[data-blog-results-total]");
  const resultsText = container.querySelector<HTMLElement>("[data-blog-results]");
  const pagination = document.querySelector<HTMLElement>("[data-blog-pagination]");
  const paginationPrev = document.querySelector<HTMLButtonElement>("[data-blog-pagination-prev]");
  const paginationNext = document.querySelector<HTMLButtonElement>("[data-blog-pagination-next]");
  const paginationPages = document.querySelector<HTMLElement>("[data-blog-pagination-pages]");

  if (!grid) {
    console.warn("Blog grid not found");
    return;
  }

  // Get all blog posts
  const posts: BlogPost[] = Array.from(
    grid.querySelectorAll<HTMLElement>("[data-blog-post]")
  ).map((element) => {
    const title = element.getAttribute("data-post-title") || "";
    const tagsStr = element.getAttribute("data-post-tags") || "";
    const categoriesStr = element.getAttribute("data-post-categories") || "";
    const date = element.getAttribute("data-post-date") || "";

    return {
      element,
      title: title.toLowerCase(),
      tags: tagsStr ? tagsStr.split(" ").filter(Boolean) : [],
      categories: categoriesStr ? categoriesStr.split(" ").filter(Boolean) : [],
      date,
    };
  });

  let currentSearch = "";
  let currentFilter = "all";
  let currentSort = "date-desc";
  let currentPage = 1;
  let postsPerPage = 20;

  // Check URL parameters on load
  const urlParams = new URLSearchParams(window.location.search);
  const filterParam = urlParams.get("filter");
  const sortParam = urlParams.get("sort");
  const pageParam = urlParams.get("page");
  const perPageParam = urlParams.get("perPage");
  
  if (filterParam) {
    currentFilter = filterParam;
    // Activate the corresponding filter button
    filterButtons.forEach((btn) => {
      if (btn.getAttribute("data-blog-filter") === filterParam) {
        btn.classList.add("blog-container__filter--active");
      } else {
        btn.classList.remove("blog-container__filter--active");
      }
    });
  }
  
  if (sortParam && sortSelect) {
    const validSorts = ["date-desc", "date-asc", "title-asc", "title-desc"];
    if (validSorts.includes(sortParam)) {
      currentSort = sortParam;
      sortSelect.value = sortParam;
    }
  }

  if (perPageParam && perPageSelect) {
    const validPerPage = ["10", "20", "30"];
    if (validPerPage.includes(perPageParam)) {
      postsPerPage = parseInt(perPageParam, 10);
      perPageSelect.value = perPageParam;
    }
  }

  if (pageParam) {
    const page = parseInt(pageParam, 10);
    if (page > 0) {
      currentPage = page;
    }
  }

  /**
   * Filter posts based on search, filter, and sort
   */
  const updateView = (): void => {
    let filtered = posts.filter((post) => {
      // Search filter
      if (currentSearch) {
        const searchLower = currentSearch.toLowerCase();
        const titleMatch = post.title.includes(searchLower);
        const contentMatch = post.element.textContent?.toLowerCase().includes(searchLower);
        if (!titleMatch && !contentMatch) return false;
      }

      // Tag/Category filter
      if (currentFilter !== "all") {
        if (currentFilter.startsWith("tag-")) {
          if (!post.tags.includes(currentFilter)) return false;
        } else if (currentFilter.startsWith("category-")) {
          if (!post.categories.includes(currentFilter)) return false;
        }
      }

      return true;
    });

    // Sort posts
    filtered.sort((a, b) => {
      switch (currentSort) {
        case "date-desc":
          return b.date.localeCompare(a.date);
        case "date-asc":
          return a.date.localeCompare(b.date);
        case "title-asc":
          return a.title.localeCompare(b.title);
        case "title-desc":
          return b.title.localeCompare(a.title);
        default:
          return 0;
      }
    });

    // Calculate pagination
    const totalPosts = filtered.length;
    const totalPages = Math.ceil(totalPosts / postsPerPage);
    
    // Reset to page 1 if current page is out of bounds
    if (currentPage > totalPages && totalPages > 0) {
      currentPage = 1;
    }

    // Calculate pagination range
    const startIndex = (currentPage - 1) * postsPerPage;
    const endIndex = startIndex + postsPerPage;
    const paginatedPosts = filtered.slice(startIndex, endIndex);

    // Update DOM - show/hide posts based on pagination
    posts.forEach((post) => {
      const isInFiltered = filtered.includes(post);
      const isInCurrentPage = paginatedPosts.includes(post);
      
      if (isInFiltered && isInCurrentPage) {
        post.element.style.display = "";
        post.element.setAttribute("aria-hidden", "false");
      } else {
        post.element.style.display = "none";
        post.element.setAttribute("aria-hidden", "true");
      }
    });

    // Show/hide no results message
    if (filtered.length === 0) {
      if (grid) grid.style.display = "none";
      if (noResults) {
        noResults.style.display = "block";
      }
      if (pagination) pagination.style.display = "none";
    } else {
      if (grid) grid.style.display = "grid";
      if (noResults) {
        noResults.style.display = "none";
      }
      
      // Show/hide pagination
      if (pagination) {
        if (totalPages > 1) {
          pagination.style.display = "flex";
          updatePagination(totalPages, currentPage);
        } else {
          pagination.style.display = "none";
        }
      }
    }

    // Update results count
    if (resultsCount) {
      resultsCount.textContent = paginatedPosts.length.toString();
    }
    if (resultsTotal) {
      resultsTotal.textContent = totalPosts.toString();
    }
    if (resultsText) {
      const showing = paginatedPosts.length;
      const total = totalPosts;
      const text = total === 1 ? "post" : "posts";
      resultsText.innerHTML = `Showing <span class="blog-container__results-count">${showing}</span> of <span class="blog-container__results-total">${total}</span> ${text}`;
    }
  };

  /**
   * Update pagination controls
   */
  const updatePagination = (totalPages: number, currentPage: number): void => {
    if (!paginationPages || !paginationPrev || !paginationNext) return;

    // Update prev/next buttons
    paginationPrev.disabled = currentPage === 1;
    paginationNext.disabled = currentPage === totalPages;

    // Clear existing page numbers
    paginationPages.innerHTML = "";

    // Calculate which page numbers to show
    const maxVisiblePages = 7;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    // Adjust if we're near the end
    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // Add first page and ellipsis if needed
    if (startPage > 1) {
      const firstBtn = document.createElement("button");
      firstBtn.type = "button";
      firstBtn.className = "blog-container__pagination-page";
      firstBtn.textContent = "1";
      firstBtn.setAttribute("data-blog-page", "1");
      firstBtn.addEventListener("click", () => goToPage(1));
      paginationPages.appendChild(firstBtn);

      if (startPage > 2) {
        const ellipsis = document.createElement("span");
        ellipsis.className = "blog-container__pagination-ellipsis";
        ellipsis.textContent = "...";
        paginationPages.appendChild(ellipsis);
      }
    }

    // Add page numbers
    for (let i = startPage; i <= endPage; i++) {
      const pageBtn = document.createElement("button");
      pageBtn.type = "button";
      pageBtn.className = "blog-container__pagination-page";
      if (i === currentPage) {
        pageBtn.classList.add("blog-container__pagination-page--active");
      }
      pageBtn.textContent = i.toString();
      pageBtn.setAttribute("data-blog-page", i.toString());
      pageBtn.addEventListener("click", () => goToPage(i));
      paginationPages.appendChild(pageBtn);
    }

    // Add last page and ellipsis if needed
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        const ellipsis = document.createElement("span");
        ellipsis.className = "blog-container__pagination-ellipsis";
        ellipsis.textContent = "...";
        paginationPages.appendChild(ellipsis);
      }

      const lastBtn = document.createElement("button");
      lastBtn.type = "button";
      lastBtn.className = "blog-container__pagination-page";
      lastBtn.textContent = totalPages.toString();
      lastBtn.setAttribute("data-blog-page", totalPages.toString());
      lastBtn.addEventListener("click", () => goToPage(totalPages));
      paginationPages.appendChild(lastBtn);
    }
  };

  /**
   * Navigate to a specific page
   */
  const goToPage = (page: number): void => {
    currentPage = page;
    
    // Update URL without reload
    const url = new URL(window.location.href);
    if (page === 1) {
      url.searchParams.delete("page");
    } else {
      url.searchParams.set("page", page.toString());
    }
    window.history.pushState({}, "", url);
    
    // Scroll to top of blog section
    if (grid) {
      grid.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    
    updateView();
  };

  // Debounced search handler
  const debouncedUpdateView = debounce(() => {
    updateView();
  }, 300);

  // Search input handler with debouncing
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      const target = e.target as HTMLInputElement;
      const newSearch = target.value;
      
      // Reset to page 1 if search changed
      if (newSearch !== currentSearch) {
        currentPage = 1;
      }
      
      currentSearch = newSearch;

      // Show/hide clear button immediately
      if (searchClear) {
        if (currentSearch) {
          searchClear.classList.add("blog-container__search-clear--visible");
        } else {
          searchClear.classList.remove("blog-container__search-clear--visible");
        }
      }

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
          currentPage = 1; // Reset to first page when clearing search
          
          // Clear search from URL if present
          const url = new URL(window.location.href);
          url.searchParams.delete("search");
          url.searchParams.delete("page"); // Reset to page 1
          window.history.pushState({}, "", url);
          
          updateView();
          searchClear.classList.remove("blog-container__search-clear--visible");
          searchInput.focus();
        }
      });
    }
  }

  /**
   * Handle filter button click
   */
  const handleFilterClick = (button: HTMLElement, e: Event): void => {
    e.preventDefault();
    const filter = button.getAttribute("data-blog-filter");
    if (!filter || filter === currentFilter) return;

    currentFilter = filter;
    currentPage = 1; // Reset to first page when filter changes

    // Update active state for filter buttons in controls
    filterButtons.forEach((btn) => {
      btn.classList.remove("blog-container__filter--active");
    });
    // Also update the clicked button if it's in the controls
    if (button.hasAttribute("data-blog-filter")) {
      const matchingControlButton = Array.from(filterButtons).find(
        (btn) => btn.getAttribute("data-blog-filter") === filter
      );
      if (matchingControlButton) {
        matchingControlButton.classList.add("blog-container__filter--active");
      }
    }

    // Update URL without reload (but don't create crawlable URLs - this is client-side only)
    const url = new URL(window.location.href);
    if (filter === "all") {
      url.searchParams.delete("filter");
    } else {
      url.searchParams.set("filter", filter);
    }
    url.searchParams.delete("page"); // Reset to page 1
    window.history.pushState({}, "", url);

    updateView();
  };

  // Filter button handlers in controls
  filterButtons.forEach((button) => {
    button.addEventListener("click", (e) => handleFilterClick(button, e));
  });


  // Sort select handler
  if (sortSelect) {
    sortSelect.addEventListener("change", (e) => {
      const target = e.target as HTMLSelectElement;
      currentSort = target.value;
      currentPage = 1; // Reset to first page when sorting changes
      
      // Update URL without reload
      const url = new URL(window.location.href);
      url.searchParams.set("sort", currentSort);
      url.searchParams.delete("page"); // Reset to page 1
      window.history.pushState({}, "", url);
      
      updateView();
    });
  }

  // Per-page select handler
  if (perPageSelect) {
    perPageSelect.addEventListener("change", (e) => {
      const target = e.target as HTMLSelectElement;
      postsPerPage = parseInt(target.value, 10);
      currentPage = 1; // Reset to first page when per-page changes
      
      // Update URL without reload
      const url = new URL(window.location.href);
      url.searchParams.set("perPage", target.value);
      url.searchParams.delete("page"); // Reset to page 1
      window.history.pushState({}, "", url);
      
      updateView();
    });
  }

  // Pagination button handlers
  if (paginationPrev) {
    paginationPrev.addEventListener("click", () => {
      if (currentPage > 1) {
        goToPage(currentPage - 1);
      }
    });
  }

  if (paginationNext) {
    paginationNext.addEventListener("click", () => {
      const totalPosts = posts.filter((post) => {
        if (currentSearch) {
          const searchLower = currentSearch.toLowerCase();
          const titleMatch = post.title.includes(searchLower);
          const contentMatch = post.element.textContent?.toLowerCase().includes(searchLower);
          if (!titleMatch && !contentMatch) return false;
        }
        if (currentFilter !== "all") {
          if (currentFilter.startsWith("tag-")) {
            if (!post.tags.includes(currentFilter)) return false;
          } else if (currentFilter.startsWith("category-")) {
            if (!post.categories.includes(currentFilter)) return false;
          }
        }
        return true;
      }).length;
      const totalPages = Math.ceil(totalPosts / postsPerPage);
      
      if (currentPage < totalPages) {
        goToPage(currentPage + 1);
      }
    });
  }

  // Initial update
  updateView();
};

