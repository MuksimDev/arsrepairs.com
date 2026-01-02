/**
 * Header module
 * Handles header shadow on scroll and city personalization
 */

import { SCROLL_SHADOW_THRESHOLD } from "../constants";
import { isLocalhost, onDOMReady } from "../utils/dom";
import { normalizeCity, isKnownCity, getCityName, parseCitiesFromData } from "../utils/geolocation";

/**
 * Initializes the header shadow effect on scroll
 */
export const initHeaderShadow = (): void => {
  const header = document.querySelector<HTMLElement>(".site-header");
  if (!header) return;

  const apply = () => header.classList.toggle("has-shadow", window.scrollY > SCROLL_SHADOW_THRESHOLD);
  apply();
  document.addEventListener("scroll", apply, { passive: true });
};

/**
 * Updates the page header with city-specific content
 */
const updateHeaderWithCity = (
  cityName: string | null,
  knownCities: string[],
  region: string | null = null
): void => {
  const titleEl = document.querySelector<HTMLElement>(".page-header__title[data-base-title]");
  const taglineEl = document.querySelector<HTMLElement>(".page-header__tagline[data-base-tagline]");

  if (!titleEl) return;

  const baseTitle = titleEl.getAttribute("data-base-title") || "";
  const fallbackCity = titleEl.getAttribute("data-city-placeholder") || "Miami";
  let cityToUse = fallbackCity;

  if (cityName && isKnownCity(cityName, knownCities)) {
    const canonicalName = getCityName(cityName, knownCities);
    if (canonicalName) cityToUse = canonicalName;
  }

  const newTitle = `${baseTitle} in ${cityToUse}`;
  titleEl.textContent = newTitle;

  if (taglineEl && taglineEl.hasAttribute("data-base-tagline")) {
    const baseTagline = taglineEl.getAttribute("data-base-tagline") || "";
    const newTagline = baseTagline.replace(/\bMiami\b/i, cityToUse);
    taglineEl.textContent = newTagline;
  }

  if (isLocalhost()) {
    console.log("City Personalization →", {
      detected: cityName,
      region,
      used: cityToUse,
      fallback: fallbackCity,
    });
  }
};

/**
 * Detects user's city via geolocation API and updates header
 */
const detectCity = (knownCities: string[]): void => {
  const pageHeader = document.querySelector<HTMLElement>(".page-header");
  if (!pageHeader) return;

  if (isLocalhost()) {
    console.log("Skipping geolocation on localhost → using fallback (Miami)");
    updateHeaderWithCity(null, knownCities);
    return;
  }

  // Get API key from data attribute (set by Hugo from site.Params.geolocationApiKey)
  const apiKey = pageHeader.getAttribute("data-geo-api-key") || "";
  const apiUrl = apiKey
    ? `https://ipgeolocation.bigdatacloud.net/?ip&key=${encodeURIComponent(apiKey)}`
    : "https://ipgeolocation.bigdatacloud.net/?ip";

  // Using BigDataCloud IP Geolocation API
  fetch(apiUrl, {
    headers: { Accept: "application/json" },
  })
    .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
    .then((data: any) => {
      if (isLocalhost()) console.log("Geolocation raw response:", data);

      const city = data.city || null;
      const region = data.countryName || null; // Or use data.localityInfo.administrative for suburbs

      updateHeaderWithCity(city, knownCities, region);
    })
    .catch(() => {
      if (isLocalhost()) console.warn("Geolocation failed, using fallback");
      updateHeaderWithCity(null, knownCities);
    });
};

/**
 * Initializes page header city personalization
 */
export const initPageHeaderCityPersonalization = (): void => {
  const pageHeader = document.querySelector<HTMLElement>(".page-header");
  if (!pageHeader) return;

  // Get cities from Hugo data file (data/cities.yaml)
  const citiesDataAttr = pageHeader.getAttribute("data-cities");
  const knownCities = parseCitiesFromData(citiesDataAttr);

  // Minimal fallback: only use if data file failed to load
  // Cities should come from data/cities.yaml, not hardcoded
  const citiesToUse = knownCities.length > 0 ? knownCities : ["Miami"];

  if (isLocalhost() && knownCities.length === 0) {
    console.warn("No cities loaded from data/cities.yaml, using minimal fallback (Miami only)");
  }

  onDOMReady(() => detectCity(citiesToUse));
};

