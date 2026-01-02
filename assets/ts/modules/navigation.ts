/**
* Navigation module
* Handles mobile navigation toggle, dropdown menus, and hover interactions
*/

import { isMobile } from "../utils/dom";

/**
 * Flattens navGroups on mobile by removing group headers and ungrouping items
 */
const flattenNavGroups = (): void => {
  if (!isMobile()) return;

  const dropdownMenus = document.querySelectorAll<HTMLElement>(".dropdown-menu");
  
  dropdownMenus.forEach((menu) => {
    const dropdownLinks = menu.querySelector<HTMLElement>(".dropdown-links");
    if (!dropdownLinks) return;

    const groups = dropdownLinks.querySelectorAll<HTMLElement>(".dropdown-group");
    if (groups.length === 0) return;

    // Flatten groups by moving all links out and removing group containers
    groups.forEach((group) => {
      const links = group.querySelectorAll<HTMLAnchorElement>(".dropdown-link");
      links.forEach((link) => {
        // Move link out of group to dropdownLinks container
        dropdownLinks.appendChild(link);
      });
      // Remove the group (including header)
      group.remove();
    });
  });
};

/**
* Initializes the main navigation functionality
*/
export const initNav = (): void => {
const nav = document.querySelector<HTMLElement>("[data-site-nav]");
const toggleBtn = document.querySelector<HTMLButtonElement>("[data-nav-toggle]");

if (!nav || !toggleBtn) return;

  // Flatten navGroups on mobile
  flattenNavGroups();

const toggle = () => {
const isOpen = toggleBtn.getAttribute("aria-expanded") === "true";
toggleBtn.setAttribute("aria-expanded", (!isOpen).toString());
nav.classList.toggle("is-open", !isOpen);
};

toggleBtn.addEventListener("click", (event) => {
event.preventDefault();
toggle();
});

// Handle dropdown menu toggles on mobile
const dropdownItems = nav.querySelectorAll<HTMLElement>(".nav-item--dropdown");

const setDropdownHeight = (dropdownMenu: HTMLElement) => {
if (!isMobile()) return;

const siteNav = nav;
if (siteNav) {
dropdownMenu.style.position = "fixed";
dropdownMenu.style.left = "0";
dropdownMenu.style.right = "0";
dropdownMenu.style.width = "100%";
}
};

const closeDropdown = (dropdownMenu: HTMLElement, dropdownArrow: HTMLElement | null) => {
dropdownMenu.classList.remove("is-open");
if (isMobile()) {
dropdownMenu.style.position = "";
dropdownMenu.style.top = "";
dropdownMenu.style.height = "";
dropdownMenu.style.left = "";
dropdownMenu.style.right = "";
dropdownMenu.style.width = "";
}
if (dropdownArrow) {
dropdownArrow.style.transform = "rotate(0deg)";
}
};

dropdownItems.forEach((item) => {
const dropdownLink = item.querySelector<HTMLAnchorElement>(".nav-link");
const dropdownMenu = item.querySelector<HTMLElement>(".dropdown-menu");
const dropdownArrow = item.querySelector<HTMLElement>(".dropdown-arrow");
const dropdownClose = dropdownMenu?.querySelector<HTMLButtonElement>("[data-dropdown-close]");

if (!dropdownLink || !dropdownMenu) return;

if (dropdownClose) {
dropdownClose.addEventListener("click", (e) => {
e.preventDefault();
e.stopPropagation();
closeDropdown(dropdownMenu, dropdownArrow);
});
}

const handleDropdownToggle = (event: Event) => {
if (isMobile()) {
event.preventDefault();
event.stopPropagation();
const isOpen = dropdownMenu.classList.contains("is-open");
dropdownMenu.classList.toggle("is-open");

if (!isOpen) {
setDropdownHeight(dropdownMenu);
} else {
dropdownMenu.style.position = "";
dropdownMenu.style.top = "";
dropdownMenu.style.height = "";
dropdownMenu.style.left = "";
dropdownMenu.style.right = "";
dropdownMenu.style.width = "";
}

if (dropdownArrow) {
dropdownArrow.style.transform = isOpen ? "rotate(0deg)" : "rotate(180deg)";
}
}
};

dropdownLink.addEventListener("click", handleDropdownToggle);

dropdownMenu.querySelectorAll("a").forEach((childLink) => {
childLink.addEventListener("click", () => {
toggleBtn.setAttribute("aria-expanded", "false");
nav.classList.remove("is-open");
closeDropdown(dropdownMenu, dropdownArrow);
});
});
});

nav.querySelectorAll("a").forEach((link) => {
if (link.closest(".nav-item--dropdown")?.querySelector(".nav-link") === link) return;
if (link.closest(".dropdown-menu")) return;

link.addEventListener("click", () => {
toggleBtn.setAttribute("aria-expanded", "false");
nav.classList.remove("is-open");
});
});
};

/**
* Initializes dropdown hover interactions for desktop
*/
export const initDropdownHover = (): void => {
if (window.innerWidth <= 1280) return;

const dropdownItems = document.querySelectorAll<HTMLElement>(".nav-item--dropdown");

// Center grouped dropdowns to viewport
const centerGroupedDropdown = (dropdownItem: HTMLElement, dropdownMenu: HTMLElement) => {
const hasGroups = dropdownMenu.querySelector(".dropdown-links > .dropdown-group");
if (!hasGroups) return;

const updatePosition = () => {
// Don't apply inline positioning at 1400px and below - let CSS handle it
if (window.innerWidth <= 1400) {
dropdownMenu.style.left = "";
return;
}

const rect = dropdownItem.getBoundingClientRect();
const viewportCenter = window.innerWidth / 2;
const parentCenter = rect.left + rect.width / 2;
// Calculate offset needed to center dropdown to viewport
const offset = viewportCenter - parentCenter;
dropdownMenu.style.left = `calc(50% + ${offset}px)`;
};

const handleShow = () => {
updatePosition();
window.addEventListener("scroll", updatePosition, { passive: true });
window.addEventListener("resize", updatePosition, { passive: true });
};

const handleHide = () => {
window.removeEventListener("scroll", updatePosition);
window.removeEventListener("resize", updatePosition);
};

    dropdownItem.addEventListener("mouseenter", handleShow);
    dropdownItem.addEventListener("focusin", handleShow);
    dropdownItem.addEventListener("mouseleave", handleHide);
    dropdownItem.addEventListener("focusout", (e) => {
if (!dropdownItem.contains(e.relatedTarget as Node)) handleHide();
});
};

dropdownItems.forEach((dropdownItem) => {
const dropdownMenu = dropdownItem.querySelector<HTMLElement>(".dropdown-menu");
const dropdownLinks = dropdownItem.querySelectorAll<HTMLAnchorElement>(".dropdown-link");
const featureImage = dropdownItem.querySelector<HTMLImageElement>(".dropdown-feature-image");
const featureTitle = dropdownItem.querySelector<HTMLElement>(".dropdown-feature-title");
const featureText = dropdownItem.querySelector<HTMLElement>(".dropdown-feature-text");
const featureLink = dropdownItem.querySelector<HTMLAnchorElement>(".dropdown-feature-body .btn");

if (!dropdownMenu) return;

// Center grouped dropdowns to viewport
centerGroupedDropdown(dropdownItem, dropdownMenu);

if (!featureImage) return;

const defaultImage = featureImage.getAttribute("data-default-image") || featureImage.src;
const defaultTitle = featureTitle?.getAttribute("data-default-title") || featureTitle?.textContent || "";
const defaultText = featureText?.getAttribute("data-default-text") || featureText?.textContent || "";
const defaultLink = featureLink?.getAttribute("data-default-link") || featureLink?.href || "";
const defaultButtonDisplay = featureLink ? window.getComputedStyle(featureLink).display : "";

// Timeout ID for delayed reset
let resetTimeoutId: ReturnType<typeof setTimeout> | null = null;

const resetFeature = () => {
if (featureImage && defaultImage) {
featureImage.style.opacity = "0";
setTimeout(() => {
featureImage.src = defaultImage;
featureImage.onload = () => (featureImage.style.opacity = "1");
setTimeout(() => (featureImage.style.opacity = "1"), 100);
}, 150);
}
if (featureTitle) featureTitle.textContent = defaultTitle;
if (featureText) featureText.textContent = defaultText;
if (featureLink && defaultLink) {
featureLink.href = defaultLink;
if (defaultButtonDisplay) featureLink.style.display = defaultButtonDisplay;
}
};

const scheduleReset = () => {
// Clear any existing timeout
if (resetTimeoutId) {
clearTimeout(resetTimeoutId);
resetTimeoutId = null;
}
// Schedule reset with delay
resetTimeoutId = setTimeout(() => {
resetFeature();
resetTimeoutId = null;
}, 3000);
};

const cancelReset = () => {
if (resetTimeoutId) {
clearTimeout(resetTimeoutId);
resetTimeoutId = null;
}
};

dropdownLinks.forEach((link) => {
const ogImage = link.getAttribute("data-og-image");
const featureTitleText = link.getAttribute("data-feature-title");
const featureTextContent = link.getAttribute("data-feature-text");

if (!ogImage) return;

const updateFeature = () => {
// Cancel any pending reset when hovering over a new link
cancelReset();
if (featureImage && ogImage) {
featureImage.style.opacity = "0";
setTimeout(() => {
featureImage.src = ogImage;
featureImage.onload = () => (featureImage.style.opacity = "1");
setTimeout(() => (featureImage.style.opacity = "1"), 100);
}, 150);
}
if (featureTitle && featureTitleText) featureTitle.textContent = featureTitleText;
if (featureText && featureTextContent) featureText.textContent = featureTextContent;
if (featureLink) {
featureLink.href = link.href;
featureLink.style.display = "none";
}
};

      link.addEventListener("mouseenter", updateFeature);
      link.addEventListener("focus", updateFeature);
      link.addEventListener("mouseleave", scheduleReset);
      link.addEventListener("blur", () => {
if (!dropdownItem.contains(document.activeElement)) scheduleReset();
});
});

    dropdownMenu.addEventListener("mouseenter", cancelReset);
    dropdownMenu.addEventListener("mouseleave", scheduleReset);
    dropdownMenu.addEventListener("focusout", (e) => {
if (!dropdownMenu.contains(e.relatedTarget as Node)) scheduleReset();
});
});
};

/**
* Resets all dropdown menus to closed state
*/
export const resetDropdowns = (): void => {
document.querySelectorAll<HTMLElement>(".nav-item--dropdown").forEach((item) => {
const menu = item.querySelector<HTMLElement>(".dropdown-menu");
const arrow = item.querySelector<HTMLElement>(".dropdown-arrow");
if (menu) {
menu.classList.remove("is-open");
menu.style.position = "";
menu.style.top = "";
menu.style.height = "";
menu.style.left = "";
menu.style.right = "";
menu.style.width = "";
}
if (arrow) arrow.style.transform = "";
});
};