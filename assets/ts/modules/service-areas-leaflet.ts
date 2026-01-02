/**
 * Service Areas Leaflet Map Module
 * 
 * Interactive map using Leaflet.js and OpenStreetMap
 * Displays service area locations with city boundary polygons
 */

// Map style options
type MapStyle = 'default' | 'carto-positron' | 'carto-dark' | 'carto-voyager' | 'stamen-toner' | 'stamen-terrain' | 'osm-fr';

interface MapStyleConfig {
  url: string;
  attribution: string;
  maxZoom?: number;
}

// Type definitions for Leaflet (will be loaded from CDN)
declare const L: any;

interface ServiceAreaPage {
  title: string;
  url: string;
  lat?: number;
  lng?: number;
  group: string;
}

interface CityCoordinates {
  [key: string]: { lat: number; lng: number };
}

/**
 * Default coordinates for major cities in South Florida
 * Used as fallback when lat/lng not provided in frontmatter
 */
const CITY_COORDINATES: CityCoordinates = {
  'Miami': { lat: 25.7617, lng: -80.1918 },
  'Fort Lauderdale': { lat: 26.1224, lng: -80.1373 },
  'West Palm Beach': { lat: 26.7153, lng: -80.0534 },
  'Boca Raton': { lat: 26.3683, lng: -80.1289 },
  'Coral Gables': { lat: 25.7214, lng: -80.2684 },
  'Hialeah': { lat: 25.8576, lng: -80.2781 },
  'Hollywood': { lat: 26.0112, lng: -80.1495 },
  'Aventura': { lat: 25.9565, lng: -80.1392 },
  'Miami Beach': { lat: 25.7907, lng: -80.1300 },
  'Doral': { lat: 25.8195, lng: -80.3553 },
  'Kendall': { lat: 25.6792, lng: -80.3173 },
  'Homestead': { lat: 25.4687, lng: -80.4776 },
  'Key Biscayne': { lat: 25.6931, lng: -80.1620 },
  'Pompano Beach': { lat: 26.2379, lng: -80.1248 },
  'Deerfield Beach': { lat: 26.3184, lng: -80.0998 },
  'Delray Beach': { lat: 26.4615, lng: -80.0728 },
  'Jupiter': { lat: 26.9342, lng: -80.0942 },
  'Palm Beach Gardens': { lat: 26.8234, lng: -80.1387 },
  'Sunrise': { lat: 26.1665, lng: -80.2892 },
  'North Miami': { lat: 25.8901, lng: -80.1867 },
};

/**
 * Group centroids for fallback when no coordinates available
 */
const GROUP_CENTROIDS: CityCoordinates = {
  'Miami-Dade County': { lat: 25.7617, lng: -80.1918 },
  'Broward County': { lat: 26.1224, lng: -80.1373 },
  'Palm Beach County': { lat: 26.7153, lng: -80.0534 },
};

/**
 * Validates that a coordinate value is within valid latitude/longitude ranges
 * @param value - The coordinate value to validate
 * @param isLatitude - True if validating latitude, false for longitude
 * @returns True if the value is valid, false otherwise
 */
const isValidCoordinate = (value: number, isLatitude: boolean): boolean => {
  if (typeof value !== 'number' || isNaN(value) || !isFinite(value)) {
    return false;
  }
  
  if (isLatitude) {
    return value >= -90 && value <= 90;
  } else {
    return value >= -180 && value <= 180;
  }
};

/**
 * Bulletproof coordinate retrieval function
 * Strictly parses and validates coordinates with range checks
 * Returns null if no valid coordinates can be found - NEVER returns NaN
 * 
 * @param page - The service area page object
 * @returns Valid coordinates object or null if none found
 */
const getCoordinates = (page: ServiceAreaPage): { lat: number; lng: number } | null => {
  // First, try frontmatter params with strict parsing
  if (page.lat !== undefined && page.lng !== undefined) {
    let lat: number;
    let lng: number;
    
    // Parse with strict type checking
    if (typeof page.lat === 'number') {
      lat = page.lat;
    } else if (typeof page.lat === 'string') {
      lat = parseFloat(page.lat);
    } else {
      lat = NaN;
    }
    
    if (typeof page.lng === 'number') {
      lng = page.lng;
    } else if (typeof page.lng === 'string') {
      lng = parseFloat(page.lng);
    } else {
      lng = NaN;
    }
    
    // Validate parsed coordinates with range checks
    if (isValidCoordinate(lat, true) && isValidCoordinate(lng, false)) {
      return { lat, lng };
    }
  }

  // Second, try city lookup
  const cityName = page.title.replace(/Appliance Repair in |Appliance Repair |/gi, '').trim();
  if (CITY_COORDINATES[cityName]) {
    const coords = CITY_COORDINATES[cityName];
    if (coords && isValidCoordinate(coords.lat, true) && isValidCoordinate(coords.lng, false)) {
      return coords;
    }
  }

  // Third, try group centroid
  if (GROUP_CENTROIDS[page.group]) {
    const coords = GROUP_CENTROIDS[page.group];
    if (coords && isValidCoordinate(coords.lat, true) && isValidCoordinate(coords.lng, false)) {
      return coords;
    }
  }

  // Return null if no valid coordinates found (never return default fallback)
  return null;
};

/**
 * Initialize the Leaflet map
 */
let leafletInitAttempted = false;
let leafletCheckInterval: ReturnType<typeof setInterval> | null = null;
const MAX_WAIT_TIME = 5000; // Wait up to 5 seconds for Leaflet to load
const CHECK_INTERVAL = 100; // Check every 100ms
let startTime = 0;

export const initServiceAreasLeaflet = (): void => {
  // First, check if the map container exists (partial may be disabled)
  const mapContainer = document.getElementById('service-areas-leaflet-map');
  if (!mapContainer) {
    // Map container doesn't exist - partial is likely disabled, return silently
    return;
  }

  // Check if Leaflet is loaded
  if (typeof L === 'undefined') {
    // Check if the Leaflet script tag exists in the DOM
    const leafletScript = document.querySelector('script[src*="leaflet"]');
    
    // If script tag exists, wait for it to load
    if (leafletScript) {
      if (!leafletInitAttempted) {
        leafletInitAttempted = true;
        startTime = Date.now();
        
        // Poll for Leaflet to load - this handles slow CDN connections
        leafletCheckInterval = setInterval(() => {
          if (typeof L !== 'undefined') {
            // Leaflet loaded successfully
            if (leafletCheckInterval) {
              clearInterval(leafletCheckInterval);
              leafletCheckInterval = null;
            }
            leafletInitAttempted = false;
            initServiceAreasLeaflet();
          } else if (Date.now() - startTime > MAX_WAIT_TIME) {
            // Max wait time exceeded - script may have failed to load
            if (leafletCheckInterval) {
              clearInterval(leafletCheckInterval);
              leafletCheckInterval = null;
            }
            console.warn('Leaflet.js failed to load after 5 seconds. Service areas map will not be initialized. Check network tab for script loading errors.');
            leafletInitAttempted = false;
          }
        }, CHECK_INTERVAL);
      } else {
        // Already attempting to load, wait for it
        return;
      }
    } else {
      // Script tag not found - might be loading asynchronously or not included
      // Wait a bit to see if it appears, then warn if it doesn't
      if (!leafletInitAttempted) {
        leafletInitAttempted = true;
        startTime = Date.now();
        
        // Check if script appears in DOM
        const checkForScript = setInterval(() => {
          const script = document.querySelector('script[src*="leaflet"]');
          if (script) {
            clearInterval(checkForScript);
            leafletInitAttempted = false;
            // Script appeared, try initializing again
            initServiceAreasLeaflet();
          } else if (Date.now() - startTime > 1000) {
            // After 1 second, if still no script tag, warn and give up
            clearInterval(checkForScript);
            console.warn('Leaflet.js script tag not found in DOM. Service areas map will not be initialized.');
            leafletInitAttempted = false;
          }
        }, 100);
      }
    }
    return;
  }
  
  // Leaflet is loaded - clean up any pending checks
  if (leafletCheckInterval) {
    clearInterval(leafletCheckInterval);
    leafletCheckInterval = null;
  }
  leafletInitAttempted = false;

  // Map container already checked at the start of the function

  // Ensure container has proper dimensions before initializing map
  // This is critical for mobile devices where layout might not be complete
  const ensureContainerSize = (): Promise<void> => {
    return new Promise((resolve) => {
      const checkSize = (): void => {
        const rect = mapContainer.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          resolve();
        } else {
          // Container not sized yet, wait a bit and check again
          setTimeout(checkSize, 50);
        }
      };
      checkSize();
    });
  };

  // Wait for container to be properly sized before initializing
  ensureContainerSize().then(() => {
    // Use requestAnimationFrame to ensure DOM is fully ready
    requestAnimationFrame(() => {
      // Force a reflow to ensure dimensions are calculated
      void mapContainer.offsetHeight;
      
      // Small additional delay to ensure CSS has fully applied
      setTimeout(() => {
        // Initialize map centered on Ontario, Canada
        const map = L.map('service-areas-leaflet-map', {
          zoomControl: true,
          scrollWheelZoom: true,
          doubleClickZoom: true,
          boxZoom: true,
          keyboard: true,
          dragging: true,
          touchZoom: true,
        });

        // CRITICAL: Invalidate size immediately after map creation
        // This ensures Leaflet knows the correct container dimensions
        map.invalidateSize();

        // Set initial view
        map.setView([44.0, -79.0], 7);

        // Continue with map initialization...
        initializeMapContent(map);
      }, 150);
    });
  });
};

/**
 * Initialize map content after map instance is created
 */
const initializeMapContent = (map: any): void => {

  // Store polygons and layers for cleanup
  let currentLayers: any[] = [];
  let activeGroup: string | null = null;
  let currentTileLayer: any = null;

  /**
   * Map style configurations
   */
  const mapStyles: Record<MapStyle, MapStyleConfig> = {
    'default': {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    },
    'carto-positron': {
      url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/attributions">CARTO</a>',
      maxZoom: 19,
    },
    'carto-dark': {
      url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/attributions">CARTO</a>',
      maxZoom: 19,
    },
    'carto-voyager': {
      url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/attributions">CARTO</a>',
      maxZoom: 19,
    },
    'stamen-toner': {
      url: 'https://stamen-tiles-{s}.a.ssl.fastly.net/toner-lite/{z}/{x}/{y}{r}.png',
      attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 20,
    },
    'stamen-terrain': {
      url: 'https://stamen-tiles-{s}.a.ssl.fastly.net/terrain/{z}/{x}/{y}{r}.png',
      attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 18,
    },
    'osm-fr': {
      url: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Tiles style by <a href="https://www.hot.openstreetmap.org/" target="_blank">Humanitarian OpenStreetMap Team</a>',
      maxZoom: 19,
    },
  };

  /**
   * Set map style
   * @param style - The map style to apply
   */
  const setMapStyle = (style: MapStyle = 'carto-positron'): void => {
    if (currentTileLayer) {
      map.removeLayer(currentTileLayer);
    }

    const styleConfig = mapStyles[style];
    currentTileLayer = L.tileLayer(styleConfig.url, {
      attribution: styleConfig.attribution,
      maxZoom: styleConfig.maxZoom || 19,
      subdomains: 'abc',
    }).addTo(map);
    
    // CRITICAL: Invalidate size immediately after adding tile layer
    // This fixes tile spacing issues, especially on mobile
    map.invalidateSize();
    
    // Additional invalidation after a short delay to ensure proper rendering
    setTimeout(() => {
      map.invalidateSize();
    }, 50);
  };

  // Initialize with default style
  setMapStyle('default');
  
  // Force another size invalidation after tile layer is fully loaded
  if (currentTileLayer) {
    currentTileLayer.on('load', () => {
      map.invalidateSize();
      // Additional invalidation after tiles load
      setTimeout(() => {
        map.invalidateSize();
      }, 100);
    });
    
    // Also invalidate if tiles fail to load (edge case)
    currentTileLayer.on('tileerror', () => {
      map.invalidateSize();
    });
  }
  
  // One more invalidation after a short delay to catch any remaining issues
  setTimeout(() => {
    map.invalidateSize();
  }, 200);

  // Collect all service area pages from hidden group data elements
  const groupDataElements = document.querySelectorAll<HTMLElement>('.service-areas-group-data');
  const pages: ServiceAreaPage[] = [];

  groupDataElements.forEach((groupData) => {
    const groupContainer = groupData.closest('.service-areas-sidebar-group');
    const groupName = groupContainer?.getAttribute('data-group') || '';
    const pageElements = groupData.querySelectorAll<HTMLElement>('span[data-page-title]');

    pageElements.forEach((pageEl) => {
      const title = pageEl.getAttribute('data-page-title') || '';
      const url = pageEl.getAttribute('data-page-url') || '';
      const latStr = pageEl.getAttribute('data-lat');
      const lngStr = pageEl.getAttribute('data-lng');

      // Parse coordinates with strict validation
      let lat: number | undefined;
      let lng: number | undefined;
      
      if (latStr && latStr.trim() !== '') {
        const parsedLat = parseFloat(latStr);
        lat = isValidCoordinate(parsedLat, true) ? parsedLat : undefined;
      }
      
      if (lngStr && lngStr.trim() !== '') {
        const parsedLng = parseFloat(lngStr);
        lng = isValidCoordinate(parsedLng, false) ? parsedLng : undefined;
      }

      pages.push({
        title,
        url,
        group: groupName,
        lat,
        lng,
      });
    });
  });

  /**
   * Clear all polygons/layers from the map
   */
  const clearLayers = (): void => {
    currentLayers.forEach((layer) => {
      map.removeLayer(layer);
    });
    currentLayers = [];
  };

  /**
   * Create a city boundary polygon (circular approximation)
   * @param coords - Valid coordinate object
   * @param cityName - Name of the city for size lookup
   * @returns Leaflet polygon object
   */
  const createCityPolygon = (coords: { lat: number; lng: number }, cityName: string): any => {
    // Approximate city radius based on city size (in degrees)
    const citySizes: Record<string, number> = {
      'Miami': 0.12,
      'Fort Lauderdale': 0.10,
      'West Palm Beach': 0.08,
      'Boca Raton': 0.07,
      'Coral Gables': 0.06,
      'Hialeah': 0.06,
      'Hollywood': 0.06,
      'Aventura': 0.05,
      'Miami Beach': 0.05,
      'Doral': 0.05,
      'Kendall': 0.05,
      'Homestead': 0.05,
      'Key Biscayne': 0.04,
      'Pompano Beach': 0.05,
      'Deerfield Beach': 0.05,
      'Delray Beach': 0.05,
      'Jupiter': 0.05,
      'Palm Beach Gardens': 0.05,
      'Sunrise': 0.05,
      'North Miami': 0.05,
      'Burlington': 0.06,
      'Oshawa': 0.06,
      'St. Catharines': 0.06,
      'Cambridge': 0.05,
      'Guelph': 0.05,
      'Barrie': 0.05,
      'Kingston': 0.05,
      'Peterborough': 0.05,
    };

    const radius = citySizes[cityName] || 0.04;

    // Create a circular polygon
    const points: [number, number][] = [];
    const numPoints = 64;

    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * 2 * Math.PI;
      const latOffset = radius * Math.cos(angle);
      const lngOffset = radius * Math.sin(angle) / Math.cos(coords.lat * Math.PI / 180);
      points.push([coords.lat + latOffset, coords.lng + lngOffset]);
    }

    return L.polygon(points, {
      color: '#D91A24',
      fillColor: '#D91A24',
      fillOpacity: 0.2,
      weight: 2,
      opacity: 0.8,
    });
  };

  /**
   * Shared logic for creating polygons and collecting valid coordinates
   * @param pagesToProcess - Array of pages to process
   * @returns Array of valid coordinates [lat, lng] tuples
   */
  const createPolygonsAndCollectCoords = (pagesToProcess: ServiceAreaPage[]): [number, number][] => {
    const validCoords: [number, number][] = [];

    pagesToProcess.forEach((page) => {
      const coords = getCoordinates(page);
      
      if (!coords) {
        console.warn(`[Service Areas Map] No valid coordinates found for "${page.title}". Please add lat/lng to frontmatter.`);
        return;
      }

      // Double-check coordinates are valid (should never fail due to getCoordinates, but be extra safe)
      if (!isValidCoordinate(coords.lat, true) || !isValidCoordinate(coords.lng, false)) {
        console.warn(`[Service Areas Map] Invalid coordinates for "${page.title}":`, coords);
        return;
      }

      // Create city boundary polygon
      const polygon = createCityPolygon(coords, page.title);
      
      // Add popup to polygon
      polygon.bindPopup(`
        <div class="service-areas-popup">
          <h6 class="service-areas-popup-title">${page.title}</h6>
          <a href="${page.url}" class="btn btn--sm btn--primary">View Details</a>
        </div>
      `);

      // Add hover effects
      polygon.on('mouseover', function(this: any) {
        this.setStyle({
          fillOpacity: 0.3,
          weight: 3,
        });
      });

      polygon.on('mouseout', function(this: any) {
        this.setStyle({
          fillOpacity: 0.2,
          weight: 2,
        });
      });

      polygon.addTo(map);
      currentLayers.push(polygon);

      // Add to valid coordinates array
      validCoords.push([coords.lat, coords.lng]);
    });

    return validCoords;
  };

  /**
   * Fit map bounds with proper sidebar padding using Leaflet's native paddingTopLeft
   * @param validCoords - Array of valid coordinate tuples
   */
  const fitMapToBounds = (validCoords: [number, number][]): void => {
    if (validCoords.length === 0) {
      // Graceful fallback to Ontario center
      map.setView([44.0, -79.0], 7);
      return;
    }

    if (validCoords.length === 1) {
      // Single location - center on it
      map.setView(validCoords[0], 11);
      return;
    }

    // Multiple locations - fit bounds with sidebar padding
    const boundsObj = L.latLngBounds(validCoords);
    const sidebarPadding = window.innerWidth > 768 ? 340 : 50; // 300px sidebar + 20px margins + 20px padding
    
    map.fitBounds(boundsObj, {
      paddingTopLeft: [sidebarPadding, 50],
      paddingBottomRight: [50, 50],
      maxZoom: 13,
    });
  };

  /**
   * Add city boundary polygons for a specific group
   * @param groupName - Name of the group to display
   */
  const showGroupMarkers = (groupName: string): void => {
    clearLayers();
    activeGroup = groupName;

    const groupPages = pages.filter((page) => page.group === groupName);

    if (groupPages.length === 0) {
      return;
    }

    // Create polygons and collect valid coordinates
    const validCoords = createPolygonsAndCollectCoords(groupPages);

    // Fit map to bounds
    fitMapToBounds(validCoords);

    // Update active state in sidebar
    const groupTitles = document.querySelectorAll<HTMLButtonElement>('.service-areas-sidebar-group-title');
    groupTitles.forEach((title) => {
      const itemGroup = title.getAttribute('data-group') || '';
      if (itemGroup === groupName) {
        title.classList.add('is-active');
      } else {
        title.classList.remove('is-active');
      }
    });
  };

  /**
   * Show all city boundary polygons
   */
  const showAllMarkers = (): void => {
    clearLayers();
    activeGroup = null;

    // Create polygons and collect valid coordinates
    const validCoords = createPolygonsAndCollectCoords(pages);

    // Fit map to bounds
    fitMapToBounds(validCoords);

    // Remove active state from all group titles
    const groupTitles = document.querySelectorAll<HTMLButtonElement>('.service-areas-sidebar-group-title');
    groupTitles.forEach((title) => {
      title.classList.remove('is-active');
    });
  };

  // Handle group title clicks
  const groupTitles = document.querySelectorAll<HTMLButtonElement>('.service-areas-sidebar-group-title');
  groupTitles.forEach((title) => {
    title.addEventListener('click', () => {
      const groupName = title.getAttribute('data-group') || '';
      if (groupName) {
        showGroupMarkers(groupName);
      }
    });
  });

  /**
   * Initialize sidebar toggle functionality for mobile
   */
  const initSidebarToggle = (): void => {
    const sidebar = document.getElementById('service-areas-sidebar');
    const toggle = document.querySelector<HTMLButtonElement>('.service-areas-sidebar-toggle');
    const sidebarContent = document.getElementById('service-areas-sidebar-content');
    
    if (!sidebar || !toggle || !sidebarContent) {
      return;
    }

    // Check if we're on mobile/tablet
    const isMobile = (): boolean => {
      return window.matchMedia('(max-width: 768px)').matches;
    };

    // Set initial state based on screen size
    const updateSidebarState = (): void => {
      if (isMobile()) {
        // On mobile, start collapsed
        const isExpanded = sidebar.getAttribute('data-expanded') === 'true';
        if (!isExpanded) {
          sidebarContent.style.display = 'none';
        }
      } else {
        // On desktop, always show
        sidebarContent.style.display = 'block';
        sidebar.removeAttribute('data-expanded');
      }
    };

    // Handle toggle click
    toggle.addEventListener('click', () => {
      const isExpanded = sidebar.getAttribute('data-expanded') === 'true';
      
      if (isExpanded) {
        sidebar.setAttribute('data-expanded', 'false');
        toggle.setAttribute('aria-expanded', 'false');
        sidebarContent.style.display = 'none';
      } else {
        sidebar.setAttribute('data-expanded', 'true');
        toggle.setAttribute('aria-expanded', 'true');
        sidebarContent.style.display = 'block';
      }
      
      // Invalidate map size after sidebar toggle to fix tile rendering
      setTimeout(() => {
        map.invalidateSize();
      }, 150);
    });

    // Initialize state
    updateSidebarState();
  };

  // Initialize sidebar toggle
  initSidebarToggle();

  // Initialize: show all markers on load
  // Use requestAnimationFrame to ensure DOM is fully ready
  const initMap = (): void => {
    requestAnimationFrame(() => {
      if (pages.length > 0) {
        showAllMarkers();
      }
      // Invalidate size after initial render to fix mobile tile issues
      map.invalidateSize();
      
      // Additional invalidations to ensure proper rendering on all devices
      setTimeout(() => {
        map.invalidateSize();
      }, 100);
      setTimeout(() => {
        map.invalidateSize();
      }, 300);
      setTimeout(() => {
        map.invalidateSize();
      }, 500);
    });
  };

  // Initialize markers after a short delay to ensure everything is ready
  setTimeout(initMap, 200);

  // Handle window resize to invalidate map size and update sidebar state
  let resizeTimeout: ReturnType<typeof setTimeout>;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      map.invalidateSize();
      // Update sidebar state on resize
      const sidebar = document.getElementById('service-areas-sidebar');
      const sidebarContent = document.getElementById('service-areas-sidebar-content');
      if (sidebar && sidebarContent) {
        const isMobile = window.matchMedia('(max-width: 768px)').matches;
        if (!isMobile) {
          sidebarContent.style.display = 'block';
          sidebar.removeAttribute('data-expanded');
        }
      }
    }, 250);
  });
};
