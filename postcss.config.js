module.exports = {
  plugins: {
    // Autoprefixer with enhanced browser support for production
    autoprefixer: process.env.HUGO_ENVIRONMENT === 'production' || process.env.NODE_ENV === 'production'
      ? {
          // Override default browserslist for production
          overrideBrowserslist: [
            '> 0.5%',
            'last 2 versions',
            'not dead',
            'not op_mini all',
            'Chrome >= 90',
            'Firefox >= 88',
            'Safari >= 14',
            'Edge >= 90',
            'iOS >= 14',
            'Android >= 6',
          ],
          // Add vendor prefixes for better compatibility
          flexbox: 'no-2009', // Add prefixes for flexbox (except IE)
          grid: 'autoplace', // Add prefixes for CSS Grid
          // Cascade layers support
          cascade: true,
          // Add prefixes for logical properties
          add: true,
          // Remove outdated prefixes
          remove: true,
        }
      : {
          // Development: minimal prefixes for faster builds
          flexbox: 'no-2009',
          grid: false,
        },
    ...(process.env.HUGO_ENVIRONMENT === 'production' || process.env.NODE_ENV === 'production'
      ? {
          // PurgeCSS - Remove unused CSS
          '@fullhuman/postcss-purgecss': {
            content: [
              './themes/arsrepairs/layouts/**/*.html',
              './content/**/*.md',
              './themes/arsrepairs/assets/ts/**/*.ts',
              './themes/arsrepairs/assets/js/**/*.js',
            ],
            defaultExtractor: (content) => {
              // Match class names, IDs, and custom attributes
              const broadMatches = content.match(/[^<>"'`\s]*[^<>"'`\s:]/g) || [];
              const innerMatches = content.match(/[^<>"'`\s.()]*[^<>"'`\s.():]/g) || [];
              return broadMatches.concat(innerMatches);
            },
            safelist: {
              // Keep dynamic classes
              standard: [/^nav-/, /^dropdown-/, /^service-/, /^benefit-/, /^section-/, /^page-header/, /^btn-/, /^container/, /^site-/, /^top-bar/, /^img-/, /^shadow-/, /^feature-box/],
              // Keep classes with data attributes
              deep: [/data-/],
              // Keep classes with pseudo-selectors
              greedy: [/::before/, /::after/, /:hover/, /:focus/, /:active/, /:visited/],
            },
          },
          // cssnano - Advanced CSS minification and optimization
          cssnano: {
            preset: ['default', {
              discardComments: {
                removeAll: true,
              },
              normalizeWhitespace: true,
              minifyFontValues: true,
              minifySelectors: true,
              reduceIdents: false, // Keep IDs as-is for JavaScript hooks
              zindex: false, // Don't optimize z-index values
            }],
          },
        }
      : {}),
  },
};

