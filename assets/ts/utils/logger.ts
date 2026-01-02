/**
 * Logger Utility
 * Gates console statements based on environment
 * Production builds should strip console.log/warn statements
 */

/**
 * Check if we're in development mode
 */
function isDevelopment(): boolean {
  if (typeof window === 'undefined') return false;
  const hostname = window.location.hostname;
  return hostname === 'localhost' || 
         hostname === '127.0.0.1' || 
         hostname === '[::1]' ||
         hostname.startsWith('192.168.') ||
         hostname.startsWith('10.') ||
         hostname.endsWith('.local');
}

/**
 * Logger utility that gates console statements based on environment
 */
export const logger = {
  /**
   * Log message (development only)
   * Use for debugging and development information
   */
  log: (...args: any[]): void => {
    if (isDevelopment()) {
      console.log(...args);
    }
  },

  /**
   * Log error (always logged)
   * Errors should always be visible for debugging production issues
   */
  error: (...args: any[]): void => {
    console.error(...args);
  },

  /**
   * Log warning (development only)
   * Use for non-critical warnings during development
   */
  warn: (...args: any[]): void => {
    if (isDevelopment()) {
      console.warn(...args);
    }
  },

  /**
   * Log info (development only)
   * Use for informational messages
   */
  info: (...args: any[]): void => {
    if (isDevelopment()) {
      console.info(...args);
    }
  },

  /**
   * Log debug (development only)
   * Use for detailed debugging information
   */
  debug: (...args: any[]): void => {
    if (isDevelopment()) {
      console.debug(...args);
    }
  },

  /**
   * Check if logging is enabled
   * Useful for conditional logging logic
   */
  isEnabled: (): boolean => isDevelopment(),
};

/**
 * Legacy support: Export as default for easier migration
 */
export default logger;

