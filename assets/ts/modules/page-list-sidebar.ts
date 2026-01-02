/**
 * Page List Sidebar Toggle
 * Handles sidebar collapse/expand functionality for both mobile and desktop
 */

import { isLocalhost } from "../utils/dom";

export function initPageListSidebar(): void {
  // Only run in dev/localhost
  if (!isLocalhost()) {
    return;
  }

  const sidebar = document.querySelector('.page-list-sidebar');
  const sidebarWrapper = document.querySelector('.page-list-sidebar-wrapper');
  const toggle = document.querySelector('[data-sidebar-toggle]') as HTMLButtonElement;

  if (!sidebar || !toggle) {
    return;
  }

  // Check localStorage for saved preference
  const savedState = localStorage.getItem('page-list-sidebar-collapsed');
  const isCollapsed = savedState === 'true';

  // Check if we're on mobile/tablet
  const isMobile = window.matchMedia('(max-width: 768px)').matches;

  // Initialize state
  if (isMobile) {
    // On mobile, use expanded/collapsed for nav visibility
    if (isCollapsed) {
      sidebar.classList.remove('page-list-sidebar--expanded');
      toggle.setAttribute('aria-expanded', 'false');
      if (sidebarWrapper) sidebarWrapper.classList.add('page-list-sidebar-wrapper--collapsed');
    } else {
      sidebar.classList.add('page-list-sidebar--expanded');
      toggle.setAttribute('aria-expanded', 'true');
      if (sidebarWrapper) sidebarWrapper.classList.remove('page-list-sidebar-wrapper--collapsed');
    }
  } else {
    // On desktop, use collapsed class for compact view
    if (isCollapsed) {
      if (sidebarWrapper) sidebarWrapper.classList.add('page-list-sidebar-wrapper--collapsed');
      sidebar.classList.add('page-list-sidebar--collapsed');
      toggle.setAttribute('aria-expanded', 'false');
    } else {
      if (sidebarWrapper) sidebarWrapper.classList.remove('page-list-sidebar-wrapper--collapsed');
      sidebar.classList.remove('page-list-sidebar--collapsed');
      toggle.setAttribute('aria-expanded', 'true');
    }
  }

  // Update icon based on state
  const icon = toggle.querySelector('[data-toggle-icon]') as HTMLElement;
  if (icon) {
    const isCurrentlyCollapsed = sidebarWrapper?.classList.contains('page-list-sidebar-wrapper--collapsed') || false;
    icon.textContent = isCurrentlyCollapsed ? 'chevron_right' : 'chevron_left';
  }

  toggle.addEventListener('click', () => {
    const isCurrentlyCollapsed = sidebarWrapper?.classList.contains('page-list-sidebar-wrapper--collapsed') || false;
    
    if (isMobile) {
      // Mobile: toggle nav visibility
      const isExpanded = sidebar.classList.contains('page-list-sidebar--expanded');
      if (isExpanded) {
        sidebar.classList.remove('page-list-sidebar--expanded');
        toggle.setAttribute('aria-expanded', 'false');
        if (icon) icon.textContent = 'chevron_right';
        localStorage.setItem('page-list-sidebar-collapsed', 'true');
      } else {
        sidebar.classList.add('page-list-sidebar--expanded');
        toggle.setAttribute('aria-expanded', 'true');
        if (icon) icon.textContent = 'chevron_left';
        localStorage.setItem('page-list-sidebar-collapsed', 'false');
      }
    } else {
      // Desktop: toggle compact view
      if (isCurrentlyCollapsed) {
        sidebarWrapper?.classList.remove('page-list-sidebar-wrapper--collapsed');
        sidebar.classList.remove('page-list-sidebar--collapsed');
        toggle.setAttribute('aria-expanded', 'true');
        if (icon) icon.textContent = 'chevron_left';
        localStorage.setItem('page-list-sidebar-collapsed', 'false');
      } else {
        sidebarWrapper?.classList.add('page-list-sidebar-wrapper--collapsed');
        sidebar.classList.add('page-list-sidebar--collapsed');
        toggle.setAttribute('aria-expanded', 'false');
        if (icon) icon.textContent = 'chevron_right';
        localStorage.setItem('page-list-sidebar-collapsed', 'true');
      }
    }
  });

  // Update on window resize with proper cleanup
  let resizeTimer: number | undefined;
  const resizeHandler = () => {
    if (resizeTimer !== undefined) {
      clearTimeout(resizeTimer);
    }
    resizeTimer = window.setTimeout(() => {
      const isMobileNow = window.matchMedia('(max-width: 768px)').matches;
      if (!isMobileNow) {
        // On desktop, restore saved collapsed state
        const saved = localStorage.getItem('page-list-sidebar-collapsed') === 'true';
        if (saved) {
          sidebarWrapper?.classList.add('page-list-sidebar-wrapper--collapsed');
          sidebar.classList.add('page-list-sidebar--collapsed');
          toggle.setAttribute('aria-expanded', 'false');
          if (icon) icon.textContent = 'chevron_right';
        } else {
          sidebarWrapper?.classList.remove('page-list-sidebar-wrapper--collapsed');
          sidebar.classList.remove('page-list-sidebar--collapsed');
          toggle.setAttribute('aria-expanded', 'true');
          if (icon) icon.textContent = 'chevron_left';
        }
      }
    }, 250);
  };
  
  window.addEventListener('resize', resizeHandler, { passive: true });
  
  // Note: Cleanup function not returned to maintain API compatibility
  // Event listener will persist for the page lifetime, which is acceptable
  // for a sidebar toggle that should remain active while the page is open
}

