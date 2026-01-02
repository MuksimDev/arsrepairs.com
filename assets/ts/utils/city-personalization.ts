import { parseCitiesFromData, normalizeCity, isKnownCity, getCityName } from "./geolocation";
import { getAccurateCity, getProvinceState } from "./geolocation";

const FALLBACK_CITY = "Miami";

/**
 * Updates all geolocation shortcode elements on the page
 */
export const initGeolocationShortcodes = () => {
  const pageHeader = document.querySelector<HTMLElement>(".page-header");
  if (!pageHeader) return;

  const isDev = location.hostname === "localhost" || location.hostname === "127.0.0.1";

  // Load cities from Hugo (your cities.yaml)
  const citiesDataAttr = pageHeader.getAttribute("data-cities");
  const knownCities = parseCitiesFromData(citiesDataAttr);

  const updateShortcodes = (detectedCity: string | null) => {
    const shortcodes = document.querySelectorAll<HTMLElement>(".geolocation-shortcode");
    
    shortcodes.forEach((shortcode) => {
      const cityEl = shortcode.querySelector<HTMLElement>(".geolocation-shortcode__city");
      if (!cityEl) return;

      const requestedCity = shortcode.getAttribute("data-geo-detected") || "";
      const fallbackText = shortcode.getAttribute("data-geo-fallback") || FALLBACK_CITY;
      
      let finalCity = fallbackText;

      // If a specific city was requested in the shortcode
      if (requestedCity) {
        if (detectedCity) {
          const normalizedDetected = normalizeCity(detectedCity);
          const normalizedRequested = normalizeCity(requestedCity);
          
          // If detected city matches the requested city, use the canonical name
          if (normalizedDetected === normalizedRequested) {
            finalCity = getCityName(detectedCity, knownCities) || requestedCity;
          } else if (isKnownCity(detectedCity, knownCities)) {
            // Detected city doesn't match requested, but is known - use detected city
            finalCity = getCityName(detectedCity, knownCities) || fallbackText;
          }
          // Otherwise use fallback
        }
        // If no detected city, use fallback
      } else {
        // No specific city requested - use detected city if known, otherwise fallback
        if (detectedCity && isKnownCity(detectedCity, knownCities)) {
          finalCity = getCityName(detectedCity, knownCities) || fallbackText;
        }
        // Otherwise use fallback (already set)
      }

      cityEl.textContent = finalCity;
    });

    if (isDev && shortcodes.length > 0) {
      console.log("Geolocation Shortcodes →", { detected: detectedCity, updated: shortcodes.length });
    }
  };

  const updateProvinceShortcodes = (detectedProvince: string | null) => {
    const shortcodes = document.querySelectorAll<HTMLElement>(".geostate-province-shortcode");
    
    shortcodes.forEach((shortcode) => {
      const provinceEl = shortcode.querySelector<HTMLElement>(".geostate-province-shortcode__province");
      if (!provinceEl) return;

      const fallbackText = shortcode.getAttribute("data-geo-fallback") || "Florida";
      const finalProvince = detectedProvince || fallbackText;

      provinceEl.textContent = finalProvince;
    });

    if (isDev && shortcodes.length > 0) {
      console.log("Province/State Shortcodes →", { detected: detectedProvince, updated: shortcodes.length });
    }
  };

  const detectAndUpdate = async () => {
    if (isDev) {
      updateShortcodes(null);
      updateProvinceShortcodes(null);
      return;
    }

    const city = await getAccurateCity();
    const province = await getProvinceState();
    updateShortcodes(city);
    updateProvinceShortcodes(province);
  };

  // Run immediately or on DOM ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", detectAndUpdate);
  } else {
    detectAndUpdate();
  }
};

export const initPageHeaderCityPersonalization = () => {
  const pageHeader = document.querySelector<HTMLElement>(".page-header");
  if (!pageHeader) return;

  const isDev = location.hostname === "localhost" || location.hostname === "127.0.0.1";

  // Load cities from Hugo (your cities.yaml)
  const citiesDataAttr = pageHeader.getAttribute("data-cities");
  const knownCities = parseCitiesFromData(citiesDataAttr);

  const updateHeader = (detectedCity: string | null) => {
    const titleEl = document.querySelector<HTMLElement>(".page-header__title[data-base-title]");
    const taglineEl = document.querySelector<HTMLElement>(".page-header__tagline[data-base-tagline]");
    if (!titleEl) return;

    const baseTitle = titleEl.getAttribute("data-base-title") || "";
    let finalCity = titleEl.getAttribute("data-city-placeholder") || FALLBACK_CITY;

    if (detectedCity && isKnownCity(detectedCity, knownCities)) {
      finalCity = getCityName(detectedCity, knownCities) || finalCity;
    }

    titleEl.textContent = `${baseTitle} in ${finalCity}`;

    if (taglineEl?.hasAttribute("data-base-tagline")) {
      const base = taglineEl.getAttribute("data-base-tagline") || "";
      taglineEl.textContent = base.replace(/\bMiami\b/i, finalCity);
    }

    if (isDev) {
      console.log("City Personalization →", { detected: detectedCity, final: finalCity });
    }
  };

  const detectAndUpdate = async () => {
    if (isDev) {
      updateHeader(null);
      return;
    }

    const city = await getAccurateCity();
    updateHeader(city);
  };

  // Run immediately or on DOM ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", detectAndUpdate);
  } else {
    detectAndUpdate();
  }
};