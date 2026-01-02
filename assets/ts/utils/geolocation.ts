// src/utils/geolocation.ts

import { logger } from './logger';

export interface BigDataCloudResponse {
  city?: string;
  localityInfo?: {
    administrative?: Array<{
      name?: string;
      order?: number;
    }>;
  };
  confidence?: {
    city?: number;
  };
  region?: {
    name?: string;
  };
  country?: {
    name?: string;
  };
}

/**
 * Secure & accurate city detection (2025)
 * Uses Hugo server-side proxy → API key NEVER exposed in frontend
 * Optimized for South Florida region detection
 */
export const getAccurateCity = async (): Promise<string | null> => {
  try {
    const pageHeader = document.querySelector<HTMLElement>(".page-header");
    const rawData = pageHeader?.getAttribute("data-geolocation");

    // No data = fallback to Miami later
    if (!rawData || rawData.trim() === "" || rawData === "{}") {
      logger.warn("Geolocation: No data from server-side proxy");
      return null;
    }

    const data: BigDataCloudResponse = JSON.parse(rawData);

    // Primary: use detected city
    let detectedCity = data.city?.trim();

    // Fallback 1: Use administrative locality (more accurate in South Florida)
    if (!detectedCity || data.confidence?.city === 0) {
      const adminLevels = data.localityInfo?.administrative;
      if (adminLevels && adminLevels.length > 0) {
        // Level 1 = municipality (e.g., Coral Gables), Level 0 = broader (e.g., Miami-Dade County)
        detectedCity = adminLevels.find(l => l.order === 1)?.name
                    || adminLevels.find(l => l.order === 0)?.name
                    || adminLevels[0]?.name;
      }
    }

    return detectedCity || null;

  } catch (err) {
    logger.warn("Geolocation parsing failed:", err);
    return null;
  }
};

/**
 * Parses cities from Hugo data-cities attribute (JSON array from cities.yaml)
 */
export const parseCitiesFromData = (dataAttr: string | null): string[] => {
  if (!dataAttr) return [];

  try {
    const parsed = JSON.parse(dataAttr);
    if (Array.isArray(parsed)) {
      return parsed.filter((c): c is string => typeof c === "string" && c.trim() !== "");
    }
  } catch {
    // Ignore JSON errors
  }

  return [];
};

/**
 * Normalize city name for comparison
 */
export const normalizeCity = (city: string | null | undefined): string => {
  return city?.trim().toLowerCase().replace(/\s+/g, " ") || "";
};

/**
 * Check if detected city is in known cities list
 */
export const isKnownCity = (city: string | null | undefined, knownCities: string[]): boolean => {
  if (!city) return false;
  const norm = normalizeCity(city);
  return knownCities.some(known => normalizeCity(known) === norm);
};

/**
 * Get canonical (properly capitalized) city name from known list
 */
export const getCityName = (city: string | null | undefined, knownCities: string[]): string | null => {
  if (!city) return null;
  const norm = normalizeCity(city);
  return knownCities.find(known => normalizeCity(known) === norm) || null;
};

/**
 * Gets province/state from geolocation data
 * Uses the same geolocation system as city detection
 */
export const getProvinceState = async (): Promise<string | null> => {
  try {
    const pageHeader = document.querySelector<HTMLElement>(".page-header");
    const rawData = pageHeader?.getAttribute("data-geolocation");

    // No data = fallback later
    if (!rawData || rawData.trim() === "" || rawData === "{}") {
      return null;
    }

    const data: BigDataCloudResponse = JSON.parse(rawData);
    const region = data.region?.name?.trim();

    return region || null;

  } catch (err) {
    logger.warn("Province/State parsing failed:", err);
    return null;
  }
};