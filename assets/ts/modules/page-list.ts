/**
 * Page List Module
 * Fetches page metadata and renders the page list table client-side
 */

import { isLocalhost } from "../utils/dom";
import {
  requestSiteRootAccess,
  getSiteRootDirectoryHandle,
  setSiteRootDirectoryHandle,
  readFileContent,
  writeFileContent,
  findActualFilePath,
  createBackupFilename,
  relPermalinkToContentFile,
  removeLinkFromContent,
  escapeRegex
} from "../utils/file-system";
import {
  showToast,
  createConfirmationDialog,
  createUrlInputDialog,
  escapeHtml
} from "../utils/dev-ui";
import {
  analyzeKeywords,
  generateRelatedKeywords,
  analyzeKeywordGaps,
  renderKeywordResearchModal,
  attachSeedKeywordSearch,
  attachCompetitorKeywordRemoval,
  attachExportHandlers,
  type KeywordAnalysis,
  type PageKeywordData
} from "./keyword-research";
import { renderLinkMap } from "./link-map";

interface BrokenLinkInfo {
  brokenUrl: string;
  sourcePage: string; // relPermalink of page containing the broken link
  sourceFile?: string; // Will be determined from sourcePage
  lineNumber?: number; // Will be determined when reading file
}

interface LinkFix {
  brokenUrl: string;
  fixedUrl: string | null; // null means link should be removed
  sourceFile: string;
  lineNumber: number;
  matchReason: string;
  action: 'fix' | 'remove'; // Whether to fix the URL or remove the link entirely
}

interface LinkSuggestion {
  url: string;
  title?: string;
  similarity: number;
  reason: string;
}

interface FixResult {
  attempted: number;
  fixed: number;
  skipped: number;
  fixes: LinkFix[];
  skippedLinks: Array<{ brokenUrl: string; sourceFile: string; sourcePage: string; suggestions?: LinkSuggestion[] }>; // Links that couldn't be fixed
  modifiedFiles: string[];
  backups: string[];
}

interface PageData {
  title: string;
  relPermalink: string;
  section: string;
  metaTitle: string;
  metaDescription: string;
  summary: string;
  hasMetaTitle: boolean;
  hasMetaDescription: boolean;
  metaTitleLength: number;
  metaDescriptionLength: number;
  titleOverLimit: boolean;
  descriptionOverLimit: boolean;
  titlePixels: number;
  descriptionPixels: number;
  titleOverPixels: boolean;
  descriptionOverPixels: boolean;
  seoScore: number;
  aiCrawlabilityScore: number;
  hasSummary: boolean;
  summaryGood: boolean;
  summaryLength: number;
  summaryOptimal: boolean;
  summaryFair: boolean;
  summaryTooShort: boolean;
  summaryTooLong: boolean;
  hasHeadings: boolean;
  headingsGood: boolean;
  hasContent: boolean;
  contentGood: boolean;
  htmlToContentRatio: number;
  htmlRatioGood: boolean;
  brokenLinks: number;
  brokenLinkUrls?: string[];
  totalInternalLinks: number;
  hasBrokenLinks: boolean;
  brokenImages: number;
  brokenImageUrls?: string[];
  hasBrokenImages: boolean;
  imagesWithoutAlt: number;
  totalImages: number;
  hasImagesWithoutAlt: boolean;
  headingStructureGood: boolean;
  h1Count: number;
  hasOneH1: boolean;
  hasMultipleH1: boolean;
  h2Count: number;
  hasH2s: boolean;
  internalLinkCount: number;
  internalLinksGood: boolean;
  internalLinksTooFew: boolean;
  internalLinksTooMany: boolean;
  genericAnchorCount: number;
  hasGenericAnchors: boolean;
  imagesWithGenericAlt: number;
  hasGenericAltText: boolean;
  hasSchemaMarkup: boolean;
  hasCommonSchema: boolean;
  firstParaLength: number;
  firstParaGood: boolean;
  wordCount: number;
  wordCountGood: boolean;
  wordCountFair: boolean;
  wordCountPoor: boolean;
  hasLists: boolean;
  hasBoldText: boolean;
  isStale: boolean;
  daysSinceUpdate: number;
  citationCount: number;
  hasCitations: boolean;
  citationsGood: boolean;
  hasAuthor: boolean;
  authorName?: string | null;
  hasVideos: boolean;
  videoCount: number;
  hasTranscript: boolean;
  avgSentenceLength: number;
  longSentences?: string[];
  readabilityGood: boolean;
  hasAnalytics: boolean;
  hasGoogleAnalytics: boolean;
  hasGoogleTagManager: boolean;
  hasFacebookPixel: boolean;
  hasMicrosoftClarity: boolean;
  hasCustomTracking: boolean;
  analyticsTypes: string[];
  urlLength: number;
  urlLengthGood: boolean;
  urlLengthOver: boolean;
  outboundLinks: number;
  dofollowOutboundLinks: number;
  outboundLinksGood: boolean;
  outboundLinksTooFew: boolean;
  longParagraphs: number;
  paragraphLengthIssues: number;
  paragraphLengthGood: boolean;
  subheadingDistributionGood: boolean;
  hasPowerWord: boolean;
  hasNumberInTitle: boolean;
  totalMedia: number;
  mediaUsageGood: boolean;
  mediaUsageTooFew: boolean;
  contentTier600: boolean;
  contentTier1000: boolean;
  contentTier2000: boolean;
  contentTier2500: boolean;
  hasDatePublished: boolean;
  hasDateUpdated: boolean;
  hasDateInfo: boolean;
  hasMobileViewport: boolean;
  hasOpenGraph: boolean;
  hasTwitterCard: boolean;
  socialMetaGood: boolean;
  imagesNotNextGen: number;
  hasImagesNotNextGen: boolean;
  imagesWithoutLazyLoading: number;
  hasImagesWithoutLazyLoading: boolean;
  hasLangAttribute: boolean;
  hasCanonical: boolean;
  mixedContentIssues: number;
  hasMixedContent: boolean;
  // Accessibility fields
  contrastRatioIssues?: number;
  hasContrastRatioIssues?: boolean;
  contrastRatioBelow45?: number;
  contrastRatioBelow3?: number;
  hasFocusIndicators?: boolean;
  missingAriaLabels?: number;
  hasMissingAriaLabels?: boolean;
  keyboardNavigationIssues?: number;
  hasKeyboardNavigationIssues?: boolean;
  accessibilityScore?: number;
  isDraft?: boolean;
}

interface SiteTechnicalSEO {
  isHTTPS: boolean;
  hasSitemap: boolean;
  hasRobotsTxt: boolean;
  hasAnalytics: boolean;
  hasGoogleAnalytics: boolean;
  hasGoogleTagManager: boolean;
  hasFacebookPixel: boolean;
  hasMicrosoftClarity: boolean;
}

interface SiteAICrawlability {
  score: number;
  aiBotsAllowed: boolean;
  gptBotAllowed: boolean;
  claudeBotAllowed: boolean;
  perplexityBotAllowed: boolean;
  grokBotAllowed: boolean;
  googleExtendedAllowed: boolean;
  ccBotAllowed: boolean;
  applebotExtendedAllowed: boolean;
  bingbotAllowed: boolean;
  pagesWithNoindex: number;
  importantPagesWithNoindex: number;
  duplicateTitles: number;
  duplicateDescriptions: number;
  pagesWithSchema: number;
  totalPages: number;
  schemaCoverage: number;
  noindexRatio: number;
  hasLlmTxt: boolean;
}

const TITLE_PIXEL_LIMIT_DESKTOP = 920;
const TITLE_PIXEL_LIMIT_MOBILE = 1300;
const DESC_PIXEL_LIMIT_DESKTOP = 1970;
const DESC_PIXEL_LIMIT_MOBILE = 1300;

interface PageListData {
  siteTechnicalSEO?: SiteTechnicalSEO;
  siteAICrawlability?: SiteAICrawlability;
  pages: PageData[];
}

interface SchemaValidationError {
  type: 'error' | 'warning' | 'info';
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  property?: string;
  expected?: string;
  actual?: string;
  suggestion?: string;
  code?: string;
}

interface SchemaValidationIssue {
  schemaType: string;
  format: 'json-ld' | 'microdata' | 'rdfa';
  schemaIndex: number;
  errors: SchemaValidationError[];
  warnings: SchemaValidationError[];
  recommendations: SchemaValidationError[];
  isValid: boolean;
  rawSchema: any;
  schemaString: string;
  location?: {
    line?: number;
    column?: number;
  };
}

interface SchemaProperty {
  name: string;
  value?: any;
  required: boolean;
  recommended: boolean;
  dataType: string;
  description?: string;
}

interface SchemaTypeInfo {
  type: string;
  parent?: string;
  required: string[];
  recommended: string[];
  properties: Record<string, SchemaProperty>;
  isGeneric: boolean;
  alternatives?: string[];
}

interface ContentMatch {
  property: string;
  schemaValue: string;
  pageValue?: string;
  matches: boolean;
  confidence: number;
  location?: string;
}

interface PageSchemaData {
  pageUrl: string;
  pageTitle: string;
  relPermalink: string;
  hasSchema: boolean;
  schemaCount: number;
  formatCounts: {
    jsonld: number;
    microdata: number;
    rdfa: number;
  };
  schemas: SchemaValidationIssue[];
  overallValid: boolean;
  errorCount: number;
  warningCount: number;
  recommendationCount: number;
  schemaTypes: string[];
  missingRequiredProperties: string[];
  contentMatches: ContentMatch[];
  hasContentMismatches: boolean;
  hasHiddenContent: boolean;
  hasDuplicateTypes: boolean;
  hasMixedFormats: boolean;
  score: number; // 0-100
  scoreBreakdown: {
    syntax: number;
    completeness: number;
    accuracy: number;
    bestPractices: number;
  };
  suggestions: string[];
}

const TITLE_LIMIT = 60;
const DESC_LIMIT = 160;

// Development logging flag - can be toggled for debugging
const DEV_LOG = isLocalhost();

/**
 * Development logging helper
 */
function devLog(...args: unknown[]): void {
  if (DEV_LOG) {
    console.log(...args);
  }
}

/**
 * Development error logging helper
 */
function devError(...args: unknown[]): void {
  if (DEV_LOG) {
    console.error(...args);
  }
}

/**
 * Development warning logging helper
 */
function devWarn(...args: unknown[]): void {
  if (DEV_LOG) {
    console.warn(...args);
  }
}

/**
 * Show loading indicator
 */
function showLoading(): void {
  const container = document.querySelector('.page-list-container');
  if (!container) return;

  // Hide initial content and show loading
  const initialContent = container.querySelector('.page-list-initial-content');
  const loading = container.querySelector('.page-list-loading');
  
  if (initialContent) {
    (initialContent as HTMLElement).style.display = 'none';
  }
  if (loading) {
    loading.classList.remove('page-list-loading--hidden');
  } else {
    // Fallback if structure is different
    container.innerHTML = `
      <div class="page-list-loading">
        <div class="page-list-loading-bar">
          <div class="page-list-loading-progress"></div>
        </div>
        <p class="page-list-loading-text">Loading page metadata...</p>
      </div>
    `;
  }
}

/**
 * Hide loading indicator
 */
function hideLoading(): void {
  const loading = document.querySelector('.page-list-loading');
  if (loading) {
    loading.remove();
  }
}

/**
 * Calculate statistics from pages
 */
function calculateStats(pages: PageData[]): {
  total: number;
  withIssues: number;
  titleOverLimit: number;
  descOverLimit: number;
  titleOverPixels: number;
  descOverPixels: number;
  missingTitle: number;
  missingDesc: number;
  siteSeoScore: number;
  siteAiScore: number;
  seoBreakdown: {
    hasTitle: number;
    titleOptimal: number;
    hasDescription: number;
    descOptimal: number;
  };
  aiBreakdown: {
    hasSummary: number;
    summaryOptimal: number;
    summaryTooShort: number;
    summaryTooLong: number;
    summaryMissing: number;
    hasHeadings: number;
    headingsOptimal: number;
    hasContent: number;
    contentOptimal: number;
    htmlRatioGood: number;
  };
  technicalSEO: {
    brokenLinks: number;
    brokenImages: number;
    imagesWithoutAlt: number;
    headingStructureIssues: number;
    pagesWithoutAnalytics: number;
  };
  onPageSEO: {
    multipleH1Issues: number;
    noH1Issues: number;
    noH2Issues: number;
    internalLinkIssues: number;
    genericAnchorIssues: number;
    genericAltTextIssues: number;
    noSchemaMarkup: number;
    firstParaIssues: number;
    urlLengthIssues: number;
    outboundLinksTooFew: number;
    paragraphLengthIssues: number;
    subheadingDistributionIssues: number;
    mediaUsageTooFew: number;
    noDateInfo: number;
    noMobileViewport: number;
    socialMetaIncomplete: number;
    imagesNotNextGen: number;
    imagesWithoutLazyLoading: number;
    noLangAttribute: number;
    noCanonical: number;
    mixedContent: number;
  };
  contentQuality: {
    wordCountIssues: number;
    noLists: number;
    noBoldText: number;
    staleContent: number;
    noCitations: number;
    noAuthor: number;
    videosWithoutTranscript: number;
    readabilityIssues: number;
    noExcerpt: number;
    excerptTooShort: number;
    excerptTooLong: number;
  };
  accessibility: {
    contrastRatioIssues: number;
    missingAriaLabels: number;
    keyboardNavigationIssues: number;
    noFocusIndicators: number;
    totalAccessibilityIssues: number;
  };
} {
  let withIssues = 0;
  let titleOverLimit = 0;
  let descOverLimit = 0;
  let titleOverPixels = 0;
  let descOverPixels = 0;
  let missingTitle = 0;
  let missingDesc = 0;
  let totalSeoScore = 0;
  let totalAiScore = 0;
  
  // SEO breakdown
  let hasTitle = 0;
  let titleOptimal = 0;
  let hasDescription = 0;
  let descOptimal = 0;
  
  // AI breakdown
  let hasSummary = 0;
  let summaryOptimal = 0;
  let summaryTooShort = 0;
  let summaryTooLong = 0;
  let summaryMissing = 0;
  let hasHeadings = 0;
  let headingsOptimal = 0;
  let hasContent = 0;
  let contentOptimal = 0;
  let htmlRatioGood = 0;
  
  // Technical SEO breakdown
  let brokenLinks = 0;
  let brokenImages = 0;
  let imagesWithoutAlt = 0;
  let headingStructureIssues = 0;
  let pagesWithoutAnalytics = 0;
  
  // On-page SEO breakdown
  let multipleH1Issues = 0;
  let noH1Issues = 0;
  let noH2Issues = 0;
  let internalLinkIssues = 0;
  let genericAnchorIssues = 0;
  let genericAltTextIssues = 0;
  let noSchemaMarkup = 0;
  let firstParaIssues = 0;
  let urlLengthIssues = 0;
  let outboundLinksTooFew = 0;
  let paragraphLengthIssues = 0;
  let subheadingDistributionIssues = 0;
  let mediaUsageTooFew = 0;
  let noDateInfo = 0;
  let noMobileViewport = 0;
  let socialMetaIncomplete = 0;
  let imagesNotNextGen = 0;
  let imagesWithoutLazyLoading = 0;
  let noLangAttribute = 0;
  let noCanonical = 0;
  let mixedContent = 0;
  
  // Content Quality breakdown
  let wordCountIssues = 0;
  let noLists = 0;
  let noBoldText = 0;
  let staleContent = 0;
  let noCitations = 0;
  let noAuthor = 0;
  let videosWithoutTranscript = 0;
  let readabilityIssues = 0;
  let noExcerpt = 0;
  let excerptTooShort = 0;
  let excerptTooLong = 0;
  
  // Accessibility breakdown
  let contrastRatioIssues = 0;
  let missingAriaLabels = 0;
  let keyboardNavigationIssues = 0;
  let noFocusIndicators = 0;

  pages.forEach(page => {
    let hasIssue = false;

    if (!page.hasMetaTitle) {
      missingTitle++;
      hasIssue = true;
    } else {
      hasTitle++;
      if (page.metaTitleLength >= 30 && page.metaTitleLength <= TITLE_LIMIT && !page.titleOverLimit && !page.titleOverPixels) {
        titleOptimal++;
      }
      if (page.titleOverLimit) {
        titleOverLimit++;
        hasIssue = true;
      }
      if (page.titleOverPixels) {
        titleOverPixels++;
        hasIssue = true;
      }
    }

    if (!page.hasMetaDescription) {
      missingDesc++;
      hasIssue = true;
    } else {
      hasDescription++;
      if (page.metaDescriptionLength >= 120 && page.metaDescriptionLength <= DESC_LIMIT && !page.descriptionOverLimit && !page.descriptionOverPixels) {
        descOptimal++;
      }
      if (page.descriptionOverLimit) {
        descOverLimit++;
        hasIssue = true;
      }
      if (page.descriptionOverPixels) {
        descOverPixels++;
        hasIssue = true;
      }
    }

    // Technical SEO checks
    if (page.hasBrokenLinks) {
      brokenLinks += page.brokenLinks;
      hasIssue = true;
    }
    if (page.hasBrokenImages) {
      brokenImages += page.brokenImages || 0;
      hasIssue = true;
    }
    if (page.hasImagesWithoutAlt) {
      imagesWithoutAlt += page.imagesWithoutAlt;
      hasIssue = true;
    }
    if (!page.headingStructureGood) {
      headingStructureIssues++;
      hasIssue = true;
    }
    if (!page.hasAnalytics) {
      pagesWithoutAnalytics++;
      hasIssue = true;
    }
    
    // On-page SEO checks
    if (page.hasMultipleH1) {
      multipleH1Issues++;
      hasIssue = true;
    }
    if (page.h1Count === 0) {
      noH1Issues++;
      hasIssue = true;
    }
    if (!page.hasH2s) {
      noH2Issues++;
      hasIssue = true;
    }
    if (page.internalLinksTooFew || page.internalLinksTooMany) {
      internalLinkIssues++;
      hasIssue = true;
    }
    if (page.hasGenericAnchors) {
      genericAnchorIssues++;
      hasIssue = true;
    }
    if (page.hasGenericAltText) {
      genericAltTextIssues++;
      hasIssue = true;
    }
    if (!page.hasSchemaMarkup) {
      noSchemaMarkup++;
      hasIssue = true;
    }
    if (!page.firstParaGood) {
      firstParaIssues++;
      hasIssue = true;
    }
    if (page.urlLengthOver) {
      urlLengthIssues++;
      hasIssue = true;
    }
    if (page.outboundLinksTooFew) {
      outboundLinksTooFew++;
      hasIssue = true;
    }
    if (!page.paragraphLengthGood) {
      paragraphLengthIssues++;
      hasIssue = true;
    }
    if (!page.subheadingDistributionGood) {
      subheadingDistributionIssues++;
      hasIssue = true;
    }
    if (page.mediaUsageTooFew) {
      mediaUsageTooFew++;
      hasIssue = true;
    }
    if (!page.hasDateInfo) {
      noDateInfo++;
      hasIssue = true;
    }
    if (!page.hasMobileViewport) {
      noMobileViewport++;
      hasIssue = true;
    }
    if (!page.socialMetaGood) {
      socialMetaIncomplete++;
      hasIssue = true;
    }
    if (page.hasImagesNotNextGen) {
      imagesNotNextGen++;
      hasIssue = true;
    }
    if (page.hasImagesWithoutLazyLoading) {
      imagesWithoutLazyLoading++;
      hasIssue = true;
    }
    if (!page.hasLangAttribute) {
      noLangAttribute++;
      hasIssue = true;
    }
    if (!page.hasCanonical) {
      noCanonical++;
      hasIssue = true;
    }
    if (page.hasMixedContent) {
      mixedContent++;
      hasIssue = true;
    }
    
    // Content Quality checks
    if (page.wordCountPoor) {
      wordCountIssues++;
      hasIssue = true;
    }
    if (!page.hasLists) {
      noLists++;
      hasIssue = true;
    }
    if (!page.hasBoldText) {
      noBoldText++;
      hasIssue = true;
    }
    if (page.isStale) {
      staleContent++;
      hasIssue = true;
    }
    if (!page.hasCitations) {
      noCitations++;
      hasIssue = true;
    }
    if (!page.hasAuthor) {
      noAuthor++;
      hasIssue = true;
    }
    if (page.hasVideos && !page.hasTranscript) {
      videosWithoutTranscript++;
      hasIssue = true;
    }
    if (!page.readabilityGood && page.avgSentenceLength > 0) {
      readabilityIssues++;
      hasIssue = true;
    }
    if (!page.hasSummary) {
      noExcerpt++;
      hasIssue = true;
    }
    if (page.summaryTooShort) {
      excerptTooShort++;
      hasIssue = true;
    }
    if (page.summaryTooLong) {
      excerptTooLong++;
      hasIssue = true;
    }
    
    // Accessibility checks (only if fields are defined - they may be null/undefined if not calculated)
    if (page.hasContrastRatioIssues && page.contrastRatioIssues) {
      contrastRatioIssues += page.contrastRatioIssues;
      hasIssue = true;
    }
    if (page.hasMissingAriaLabels && page.missingAriaLabels) {
      missingAriaLabels += page.missingAriaLabels;
      hasIssue = true;
    }
    if (page.hasKeyboardNavigationIssues && page.keyboardNavigationIssues) {
      keyboardNavigationIssues += page.keyboardNavigationIssues;
      hasIssue = true;
    }
    if (page.hasFocusIndicators !== undefined && page.hasFocusIndicators === false) {
      noFocusIndicators++;
      hasIssue = true;
    }

    if (hasIssue) {
      withIssues++;
    }

    // AI breakdown - check summary/excerpt
    if (page.summary && page.summary.trim() !== '') {
      hasSummary++;
      // Use the new summaryOptimal field which checks for 100-300 range
      if (page.summaryOptimal) {
        summaryOptimal++;
      } else if (page.summaryTooShort) {
        summaryTooShort++;
      } else if (page.summaryTooLong) {
        summaryTooLong++;
      }
    } else {
      summaryMissing++;
    }

    // Check HTML to content ratio
    if (page.htmlRatioGood) {
      htmlRatioGood++;
    }

    // AI breakdown - headings
    if (page.hasHeadings) {
      hasHeadings++;
      if (page.headingsGood) {
        headingsOptimal++;
      }
    }

    // AI breakdown - content
    if (page.hasContent) {
      hasContent++;
      if (page.contentGood) {
        contentOptimal++;
      }
    }

    totalSeoScore += page.seoScore;
    totalAiScore += page.aiCrawlabilityScore;
  });

  return {
    total: pages.length,
    withIssues,
    titleOverLimit,
    descOverLimit,
    titleOverPixels,
    descOverPixels,
    missingTitle,
    missingDesc,
    siteSeoScore: pages.length > 0 ? Math.round(totalSeoScore / pages.length) : 0,
    siteAiScore: pages.length > 0 ? Math.round(totalAiScore / pages.length) : 0,
    seoBreakdown: {
      hasTitle,
      titleOptimal,
      hasDescription,
      descOptimal
    },
    aiBreakdown: {
      hasSummary,
      summaryOptimal,
      summaryTooShort,
      summaryTooLong,
      summaryMissing,
      hasHeadings,
      headingsOptimal,
      hasContent,
      contentOptimal,
      htmlRatioGood
    },
    technicalSEO: {
      brokenLinks,
      brokenImages,
      imagesWithoutAlt,
      headingStructureIssues,
      pagesWithoutAnalytics
    },
    onPageSEO: {
      multipleH1Issues,
      noH1Issues,
      noH2Issues,
      internalLinkIssues,
      genericAnchorIssues,
      genericAltTextIssues,
      noSchemaMarkup,
      firstParaIssues,
      urlLengthIssues,
      outboundLinksTooFew,
      paragraphLengthIssues,
      subheadingDistributionIssues,
      mediaUsageTooFew,
      noDateInfo,
      noMobileViewport,
      socialMetaIncomplete,
      imagesNotNextGen,
      imagesWithoutLazyLoading,
      noLangAttribute,
      noCanonical,
      mixedContent
    },
    contentQuality: {
      wordCountIssues,
      noLists,
      noBoldText,
      staleContent,
      noCitations,
      noAuthor,
      videosWithoutTranscript,
      readabilityIssues,
      noExcerpt,
      excerptTooShort,
      excerptTooLong
    },
    accessibility: {
      contrastRatioIssues,
      missingAriaLabels,
      keyboardNavigationIssues,
      noFocusIndicators,
      totalAccessibilityIssues: contrastRatioIssues + missingAriaLabels + keyboardNavigationIssues + noFocusIndicators
    }
  };
}

/**
 * Get score color class based on score value
 */
function getScoreClass(score: number): string {
  if (score >= 80) return 'score-excellent';
  if (score >= 60) return 'score-good';
  if (score >= 40) return 'score-fair';
  return 'score-poor';
}

/**
 * Get color class for overview stat based on value and context
 */
function getOverviewStatClass(value: number, total: number, isIssue: boolean = true, isScore: boolean = false): string {
  if (isScore) {
    return getScoreClass(value);
  }
  
  if (isIssue) {
    // For issue counts, lower is better
    if (value === 0) return 'overview-stat--success';
    if (value <= 5) return 'overview-stat--warning';
    return 'overview-stat--error';
  } else {
    // For positive metrics (like "Good Pages"), higher percentage is better
    const percentage = total > 0 ? (value / total) * 100 : 0;
    if (percentage >= 80) return 'overview-stat--success';
    if (percentage >= 60) return 'overview-stat--warning';
    if (percentage >= 40) return 'overview-stat--warning';
    return 'overview-stat--error';
  }
}

/**
 * Render page-specific overview section
 */
function renderPageOverview(section: string, stats: ReturnType<typeof calculateStats>, siteTechnicalSEO?: SiteTechnicalSEO, siteAICrawlability?: SiteAICrawlability, activeFilter?: string): string {
  const buildOverviewStat = (value: number | string, label: string, filter?: string, extraClass = '', extraAttributes = ''): string => {
    const isActive = activeFilter && filter === activeFilter;
    const classes = [
      'page-list-overview-stat', 
      extraClass, 
      filter ? 'page-list-overview-stat--clickable' : '',
      isActive ? 'page-list-overview-stat--active' : ''
    ].filter(Boolean).join(' ');
    const filterAttributes = filter ? `data-filter="${filter}" role="button" tabindex="0"${isActive ? ' aria-pressed="true"' : ' aria-pressed="false"'}` : '';
    const attributes = [filterAttributes, extraAttributes].filter(Boolean).join(' ');
    return `
      <div class="${classes}"${attributes ? ` ${attributes}` : ''}>
        <div class="page-list-overview-stat__value">${value}</div>
        <div class="page-list-overview-stat__label">${label}</div>
      </div>
    `;
  };

  const overviews: Record<string, string> = {
    'overview': `
      <div class="page-list-overview-grid">
        ${buildOverviewStat(stats.total, 'Total Pages', 'all')}
        ${buildOverviewStat(stats.withIssues, 'Pages with Issues', 'with-issues', getOverviewStatClass(stats.withIssues, stats.total, true))}
        ${buildOverviewStat(stats.total - stats.withIssues, 'Good Pages', 'good', getOverviewStatClass(stats.total - stats.withIssues, stats.total, false))}
      </div>
    `,
    'seo-analysis': `
      <div class="page-list-overview-grid">
        ${buildOverviewStat(stats.missingTitle + stats.missingDesc, 'Missing Meta Tags', 'missing-meta', getOverviewStatClass(stats.missingTitle + stats.missingDesc, stats.total, true))}
        ${buildOverviewStat(stats.titleOverLimit + stats.titleOverPixels + stats.descOverLimit + stats.descOverPixels, 'Meta Tag Issues', 'meta-issues', getOverviewStatClass(stats.titleOverLimit + stats.titleOverPixels + stats.descOverLimit + stats.descOverPixels, stats.total, true))}
        ${buildOverviewStat(stats.onPageSEO.noSchemaMarkup, 'Missing Schema', 'no-schema', getOverviewStatClass(stats.onPageSEO.noSchemaMarkup, stats.total, true))}
        ${buildOverviewStat(Math.round(stats.siteSeoScore), 'Average SEO Score', undefined, getOverviewStatClass(Math.round(stats.siteSeoScore), 100, false, true))}
      </div>
    `,
    'content-quality': `
      <div class="page-list-overview-grid">
        ${buildOverviewStat(stats.contentQuality.wordCountIssues, 'Low Word Count', 'low-word-count', getOverviewStatClass(stats.contentQuality.wordCountIssues, stats.total, true))}
        ${buildOverviewStat(stats.contentQuality.noCitations, 'No Citations', 'no-citations', getOverviewStatClass(stats.contentQuality.noCitations, stats.total, true))}
        ${buildOverviewStat(stats.contentQuality.noAuthor, 'No Author', 'no-author', getOverviewStatClass(stats.contentQuality.noAuthor, stats.total, true))}
        ${buildOverviewStat(stats.contentQuality.staleContent, 'Stale Content', 'stale-content', getOverviewStatClass(stats.contentQuality.staleContent, stats.total, true))}
        ${buildOverviewStat(stats.contentQuality.excerptTooShort, 'Excerpt Too Short', 'excerpt-too-short', getOverviewStatClass(stats.contentQuality.excerptTooShort, stats.total, true))}
        ${buildOverviewStat(stats.contentQuality.excerptTooLong, 'Excerpt Too Long', 'excerpt-too-long', getOverviewStatClass(stats.contentQuality.excerptTooLong, stats.total, true))}
      </div>
    `,
    'technical-issues': `
      <div class="page-list-overview-grid">
        ${buildOverviewStat(stats.technicalSEO.brokenLinks, 'Broken Links', 'broken-links', getOverviewStatClass(stats.technicalSEO.brokenLinks, stats.total, true))}
        ${buildOverviewStat(stats.technicalSEO.brokenImages, 'Broken Images', 'broken-images', getOverviewStatClass(stats.technicalSEO.brokenImages, stats.total, true))}
        ${buildOverviewStat(stats.technicalSEO.imagesWithoutAlt, 'Images w/o Alt', 'images-no-alt', getOverviewStatClass(stats.technicalSEO.imagesWithoutAlt, stats.total, true))}
        ${buildOverviewStat(stats.technicalSEO.headingStructureIssues, 'Heading Issues', 'heading-structure', getOverviewStatClass(stats.technicalSEO.headingStructureIssues, stats.total, true))}
      </div>
    `,
    'keyword-research': `
      <div class="page-list-overview-grid">
        ${buildOverviewStat('-', 'Total Keywords', undefined, '', 'id="page-list-keyword-stat-total"')}
        ${buildOverviewStat('-', 'Unique Keywords', undefined, '', 'id="page-list-keyword-stat-unique"')}
        ${buildOverviewStat(0, 'Competitors', undefined, '', 'id="page-list-keyword-stat-competitors"')}
        ${buildOverviewStat('-', 'Opportunities', undefined, '', 'id="page-list-keyword-stat-opportunities"')}
      </div>
    `,
    'link-map': `
      <div class="page-list-overview-grid">
        ${buildOverviewStat(stats.total, 'Total Pages')}
        ${buildOverviewStat('-', 'Total Links', undefined, '', 'id="page-list-link-map-total-links"')}
        ${buildOverviewStat(stats.technicalSEO.brokenLinks, 'Broken Links', 'broken-links', getOverviewStatClass(stats.technicalSEO.brokenLinks, stats.total, true))}
        ${buildOverviewStat('-', 'Avg Links/Page', undefined, '', 'id="page-list-link-map-avg-links"')}
      </div>
    `
  };

  return overviews[section] || overviews['overview'];
}

/**
 * Render statistics summary
 */
function renderStats(stats: ReturnType<typeof calculateStats>, activeFilter: string = 'all', siteTechnicalSEO?: SiteTechnicalSEO, siteAICrawlability?: SiteAICrawlability, showFilters: boolean = true, section: string = 'overview', heroOnly: boolean = false): string {
  const seoClass = getScoreClass(stats.siteSeoScore);
  const aiClass = getScoreClass(stats.siteAiScore);
  const siteAIClass = siteAICrawlability ? getScoreClass(siteAICrawlability.score) : '';
  const circumference = 2 * Math.PI * 54; // radius 54

  // Render combined site-wide technical SEO and Analytics section (only on overview page)
  const technicalSEOHtml = (section === 'overview' && siteTechnicalSEO) ? `
    <div class="page-list-summary__technical-seo">
      <div class="page-list-summary__technical-seo-columns">
        <div class="page-list-summary__technical-seo-column">
          <h3 class="page-list-summary__technical-seo-title">Site-Wide Technical SEO</h3>
          <div class="page-list-summary__technical-seo-grid">
            <div class="page-list-summary__technical-seo-item ${siteTechnicalSEO.isHTTPS ? 'page-list-summary__technical-seo-item--success' : 'page-list-summary__technical-seo-item--error'}">
              <span class="page-list-summary__technical-seo-icon">${siteTechnicalSEO.isHTTPS ? '🔒' : '⚠️'}</span>
              <span class="page-list-summary__technical-seo-label">HTTPS</span>
              <span class="page-list-summary__technical-seo-status">${siteTechnicalSEO.isHTTPS ? 'Enabled' : 'Not Enabled'}</span>
            </div>
            <div class="page-list-summary__technical-seo-item ${siteTechnicalSEO.hasSitemap ? 'page-list-summary__technical-seo-item--success' : 'page-list-summary__technical-seo-item--warning'}">
              <span class="page-list-summary__technical-seo-icon">${siteTechnicalSEO.hasSitemap ? '✓' : '⚠️'}</span>
              <span class="page-list-summary__technical-seo-label">XML Sitemap</span>
              <span class="page-list-summary__technical-seo-status">${siteTechnicalSEO.hasSitemap ? 'Found' : 'Missing'}</span>
            </div>
            <div class="page-list-summary__technical-seo-item ${siteTechnicalSEO.hasRobotsTxt ? 'page-list-summary__technical-seo-item--success' : 'page-list-summary__technical-seo-item--warning'}">
              <span class="page-list-summary__technical-seo-icon">${siteTechnicalSEO.hasRobotsTxt ? '✓' : '⚠️'}</span>
              <span class="page-list-summary__technical-seo-label">Robots.txt</span>
              <span class="page-list-summary__technical-seo-status">${siteTechnicalSEO.hasRobotsTxt ? 'Found' : 'Missing'}</span>
            </div>
          </div>
        </div>
        <div class="page-list-summary__technical-seo-column">
          <h3 class="page-list-summary__technical-seo-title">Site-Wide Analytics</h3>
          <div class="page-list-summary__technical-seo-grid">
            <div class="page-list-summary__technical-seo-item ${siteTechnicalSEO.hasAnalytics ? 'page-list-summary__technical-seo-item--success' : 'page-list-summary__technical-seo-item--warning'}">
              <span class="page-list-summary__technical-seo-icon">${siteTechnicalSEO.hasAnalytics ? '📊' : '⚠️'}</span>
              <span class="page-list-summary__technical-seo-label">Analytics</span>
              <span class="page-list-summary__technical-seo-status">${siteTechnicalSEO.hasAnalytics ? 'Configured' : 'Not Configured'}</span>
            </div>
            ${siteTechnicalSEO.hasAnalytics ? `
            <div class="page-list-summary__technical-seo-item page-list-summary__technical-seo-item--info">
              <span class="page-list-summary__technical-seo-icon">📈</span>
              <span class="page-list-summary__technical-seo-label">Analytics Types</span>
              <span class="page-list-summary__technical-seo-status">
                ${siteTechnicalSEO.hasGoogleAnalytics ? 'GA4 ' : ''}
                ${siteTechnicalSEO.hasGoogleTagManager ? 'GTM ' : ''}
                ${siteTechnicalSEO.hasFacebookPixel ? 'FB ' : ''}
                ${siteTechnicalSEO.hasMicrosoftClarity ? 'Clarity' : ''}
              </span>
            </div>
            ` : ''}
          </div>
        </div>
      </div>
    </div>
  ` : '';

  // Analytics section is now combined above
  const analyticsHtml = '';

  // Calculate arc paths for half circles
  const halfCircumference = circumference / 2;
  const seoArcLength = (stats.siteSeoScore / 100) * halfCircumference;
  const aiScoreValue = siteAICrawlability ? siteAICrawlability.score : stats.siteAiScore;
  const aiArcLength = (aiScoreValue / 100) * halfCircumference;
  
  // Calculate average score
  const averageScore = Math.round((stats.siteSeoScore + aiScoreValue) / 2);
  
  // SEO arc (top half) - starts at top (after -90deg rotation, that's at 3 o'clock), goes clockwise
  // Since SVG is rotated -90deg, top is at 3 o'clock, so we start at offset 0
  const seoArcDash = `${seoArcLength} ${halfCircumference}`;
  // AI arc (bottom half) - starts at bottom (after -90deg rotation, that's at 9 o'clock)
  // We need to offset by half the circumference to start at the bottom
  const aiArcDash = `${aiArcLength} ${halfCircumference}`;
  const aiArcOffset = halfCircumference; // Start from bottom (9 o'clock after rotation)

  // Page-specific titles and descriptions
  const pageInfo: Record<string, { title: string; description: string }> = {
    'overview': {
      title: 'Site Overview',
      description: 'Comprehensive dashboard showing overall site health, SEO scores, and key metrics across all pages.'
    },
    'seo-analysis': {
      title: 'SEO Analysis',
      description: 'Analyze meta tags, schema markup, and on-page SEO factors to identify optimization opportunities.'
    },
    'content-quality': {
      title: 'Content Quality',
      description: 'Evaluate content quality metrics including word count, readability, citations, and content structure.'
    },
    'technical-issues': {
      title: 'Technical Issues',
      description: 'Identify and fix technical problems including broken links, images, accessibility issues, and more.'
    },
    'keyword-research': {
      title: 'Keyword Research',
      description: 'Research keywords and analyze competitor content to discover SEO opportunities and content gaps.'
    }
  };

  const pageData = pageInfo[section] || pageInfo['overview'];

  // If heroOnly is true, return just the hero section with overview
  // For keyword-research, also include the competitor input section
  if (heroOnly) {
    return `
      <div class="page-list-summary">
        <div class="page-list-summary__hero page-list-summary__hero--expanded">
          <div class="page-list-summary__hero-header">
            <div class="page-list-summary__hero-header-content">
              <h2 class="page-list-summary__hero-title">${pageData.title}</h2>
              <p class="page-list-summary__hero-description">${pageData.description}</p>
            </div>
            <div class="page-list-summary__hero-actions">
              <button 
                class="page-list-rescan-button" 
                id="page-list-rescan-button" 
                type="button"
                aria-label="Rescan site to refresh page data"
                title="Rescan site"
                data-tooltip="Reload page data from the site. This will refresh all page information."
              >
                <span class="page-list-rescan-button__icon material-symbols-outlined" aria-hidden="true">refresh</span>
                <span class="page-list-rescan-button__text">Rescan Site</span>
              </button>
            </div>
          </div>
          <div class="page-list-summary__hero-overview">
            ${renderPageOverview(section, stats, siteTechnicalSEO, siteAICrawlability, activeFilter)}
          </div>
        </div>
        ${section === 'keyword-research' ? `
          <div class="page-list-keyword-research">
            <div class="page-list-keyword-research__site-keywords">
              <div class="page-list-keyword-research__site-keywords-list" id="page-list-site-keywords-list">
                <div class="page-list-keyword-research__loading">
                  <span class="material-symbols-outlined" aria-hidden="true">hourglass_empty</span>
                  Extracting keywords from all pages...
                </div>
              </div>
            </div>
            <div class="page-list-keyword-research__competitor-section">
              <div class="page-list-keyword-research__header">
                <h3 class="page-list-keyword-research__title">Competitor Keyword Analysis</h3>
                <p class="page-list-keyword-research__description">Add competitor URLs to analyze their keywords and compare against your site.</p>
              </div>
              <div class="page-list-keyword-research__competitors">
                <div class="page-list-keyword-research__add-competitor">
                  <input 
                    type="url" 
                    class="page-list-keyword-research__url-input" 
                    id="page-list-competitor-url-input"
                    placeholder="https://competitor.com/page"
                    aria-label="Competitor URL"
                  />
                  <button 
                    class="page-list-keyword-research__add-btn" 
                    id="page-list-add-competitor-btn"
                    type="button"
                    aria-label="Add competitor URL"
                  >
                    <span class="material-symbols-outlined" aria-hidden="true">add</span>
                    Add Competitor
                  </button>
                </div>
                <div class="page-list-keyword-research__competitor-list" id="page-list-competitor-list"></div>
              </div>
              <div class="page-list-keyword-research__results" id="page-list-keyword-research-results" style="display: none;">
                <h4 class="page-list-keyword-research__results-title">Keyword Comparison</h4>
                <div class="page-list-keyword-research__comparison" id="page-list-keyword-comparison"></div>
              </div>
            </div>
          </div>
        ` : ''}
        ${section === 'link-map' ? `
          <div id="page-list-link-map-container"></div>
        ` : ''}
      </div>
      ${technicalSEOHtml}
    `;
  }

  return `
    <div class="page-list-summary">
      <div class="page-list-summary__hero page-list-summary__hero--expanded">
        <div class="page-list-summary__hero-header">
          <div class="page-list-summary__hero-header-content">
            <h2 class="page-list-summary__hero-title">${pageData.title}</h2>
            <p class="page-list-summary__hero-description">${pageData.description}</p>
          </div>
          <div class="page-list-summary__hero-actions">
            <button 
              class="page-list-rescan-button" 
              id="page-list-rescan-button" 
              type="button"
              aria-label="Rescan site to refresh page data"
              title="Rescan site"
              data-tooltip="Reload page data from the site. This will refresh all page information."
            >
              <span class="page-list-rescan-button__icon material-symbols-outlined" aria-hidden="true">refresh</span>
              <span class="page-list-rescan-button__text">Rescan Site</span>
            </button>
          </div>
          <div class="page-list-summary__hero-score">
            <div class="page-list-summary-score__circle">
              <svg class="page-list-summary-score__circle-svg" viewBox="0 0 120 120">
                <!-- Background circle -->
                <circle class="page-list-summary-score__circle-bg" cx="60" cy="60" r="54"></circle>
                <!-- SEO arc (top half) -->
                <circle class="page-list-summary-score__circle-fill page-list-summary-score__circle-fill--seo ${seoClass}" 
                  cx="60" cy="60" r="54" 
                  style="stroke-dasharray: ${seoArcDash}; stroke-dashoffset: 0;"></circle>
                <!-- AI arc (bottom half) -->
                <circle class="page-list-summary-score__circle-fill page-list-summary-score__circle-fill--ai ${siteAICrawlability ? siteAIClass : aiClass}" 
                  cx="60" cy="60" r="54" 
                  style="stroke-dasharray: ${aiArcDash}; stroke-dashoffset: ${aiArcOffset};"></circle>
              </svg>
              <div class="page-list-summary-score__circle-value">
                <span class="page-list-summary-score__circle-number">${averageScore}</span>
                <span class="page-list-summary-score__circle-label">Average</span>
              </div>
            </div>
          </div>
        </div>
        <div class="page-list-summary__hero-overview">
          ${renderPageOverview(section, stats, siteTechnicalSEO, siteAICrawlability, activeFilter)}
        </div>
        <div class="page-list-summary__hero-content">
        <div class="page-list-summary-score page-list-summary-score--combined">
          <div class="page-list-summary-score__content">
            <div class="page-list-summary-score__content-section">
            <h3 class="page-list-summary-score__title">Site SEO Score</h3>
            <div class="page-list-summary-score__breakdown">
              <div class="page-list-summary-score__metric">
                <div class="page-list-summary-score__metric-header">
                  <span class="page-list-summary-score__metric-label">Meta Titles</span>
                  <span class="page-list-summary-score__metric-value">${stats.seoBreakdown.titleOptimal}/${stats.total}</span>
                </div>
                <div class="page-list-summary-score__metric-bar">
                  <div class="page-list-summary-score__metric-fill" style="width: ${Math.round((stats.seoBreakdown.titleOptimal / stats.total) * 100)}%"></div>
                </div>
                <div class="page-list-summary-score__metric-details">
                  <span class="page-list-summary-score__metric-optimal ${stats.seoBreakdown.titleOptimal === stats.total ? 'metric-optimal--complete' : ''}">
                    ${stats.seoBreakdown.titleOptimal} optimal (30-${TITLE_LIMIT} chars, &lt;920px)
                  </span>
                  ${stats.seoBreakdown.titleOptimal < stats.total ? `<span class="page-list-summary-score__metric-issues">${stats.total - stats.seoBreakdown.titleOptimal} need optimization</span>` : ''}
                </div>
              </div>
              <div class="page-list-summary-score__metric">
                <div class="page-list-summary-score__metric-header">
                  <span class="page-list-summary-score__metric-label">Meta Descriptions</span>
                  <span class="page-list-summary-score__metric-value">${stats.seoBreakdown.descOptimal}/${stats.total}</span>
                </div>
                <div class="page-list-summary-score__metric-bar">
                  <div class="page-list-summary-score__metric-fill" style="width: ${Math.round((stats.seoBreakdown.descOptimal / stats.total) * 100)}%"></div>
                </div>
                <div class="page-list-summary-score__metric-details">
                  <span class="page-list-summary-score__metric-optimal ${stats.seoBreakdown.descOptimal === stats.total ? 'metric-optimal--complete' : ''}">
                    ${stats.seoBreakdown.descOptimal} optimal (120-${DESC_LIMIT} chars, &lt;1970px)
                  </span>
                  ${stats.seoBreakdown.descOptimal < stats.total ? `<span class="page-list-summary-score__metric-issues">${stats.total - stats.seoBreakdown.descOptimal} need optimization</span>` : ''}
                </div>
              </div>
              <div class="page-list-summary-score__metric">
                <div class="page-list-summary-score__metric-header">
                  <span class="page-list-summary-score__metric-label">HTML/Content Ratio</span>
                  <span class="page-list-summary-score__metric-value">${stats.aiBreakdown.htmlRatioGood}/${stats.total}</span>
                </div>
                <div class="page-list-summary-score__metric-bar">
                  <div class="page-list-summary-score__metric-fill" style="width: ${Math.round((stats.aiBreakdown.htmlRatioGood / stats.total) * 100)}%"></div>
                </div>
                <div class="page-list-summary-score__metric-details">
                  <span class="page-list-summary-score__metric-optimal ${stats.aiBreakdown.htmlRatioGood === stats.total ? 'metric-optimal--complete' : ''}">
                    ${stats.aiBreakdown.htmlRatioGood} with good ratio (25%+)
                  </span>
                  ${stats.aiBreakdown.htmlRatioGood < stats.total ? `<span class="page-list-summary-score__metric-issues">${stats.total - stats.aiBreakdown.htmlRatioGood} need optimization</span>` : ''}
                </div>
              </div>
            </div>
          </div>
            <div class="page-list-summary-score__content-section">
            <h3 class="page-list-summary-score__title">Site AI Crawlability</h3>
            <div class="page-list-summary-score__breakdown">
              ${siteAICrawlability ? `
              <div class="page-list-summary-score__metric">
                <div class="page-list-summary-score__metric-header">
                  <span class="page-list-summary-score__metric-label">AI Bots Allowed</span>
                  <span class="page-list-summary-score__metric-value">${siteAICrawlability.aiBotsAllowed ? '✓' : '✗'}</span>
                </div>
                <div class="page-list-summary-score__metric-details">
                  <span class="page-list-summary-score__metric-note">
                    GPTBot: ${siteAICrawlability.gptBotAllowed ? '✓' : '✗'} | 
                    ClaudeBot: ${siteAICrawlability.claudeBotAllowed ? '✓' : '✗'} | 
                    PerplexityBot: ${siteAICrawlability.perplexityBotAllowed ? '✓' : '✗'} | 
                    Grok: ${siteAICrawlability.grokBotAllowed ? '✓' : '✗'} | 
                    Google-Extended: ${siteAICrawlability.googleExtendedAllowed ? '✓' : '✗'} | 
                    CCBot: ${siteAICrawlability.ccBotAllowed ? '✓' : '✗'} | 
                    Applebot-Extended: ${siteAICrawlability.applebotExtendedAllowed ? '✓' : '✗'} | 
                    Bingbot: ${siteAICrawlability.bingbotAllowed ? '✓' : '✗'}
                  </span>
                </div>
              </div>
              <div class="page-list-summary-score__metric">
                <div class="page-list-summary-score__metric-header">
                  <span class="page-list-summary-score__metric-label">LLMs.txt File</span>
                  <span class="page-list-summary-score__metric-value">${siteAICrawlability.hasLlmTxt ? '✓' : '✗'}</span>
                </div>
                <div class="page-list-summary-score__metric-details">
                  <span class="page-list-summary-score__metric-note">
                    ${siteAICrawlability.hasLlmTxt ? 'LLMs.txt file found (provides structured information to AI crawlers)' : 'LLMs.txt file missing (recommended for AI crawlability)'}
                  </span>
                </div>
              </div>
              <div class="page-list-summary-score__metric">
                <div class="page-list-summary-score__metric-header">
                  <span class="page-list-summary-score__metric-label">Schema Coverage</span>
                  <span class="page-list-summary-score__metric-value">${Math.round(siteAICrawlability.schemaCoverage)}%</span>
                </div>
                <div class="page-list-summary-score__metric-bar">
                  <div class="page-list-summary-score__metric-fill" style="width: ${siteAICrawlability.schemaCoverage}%"></div>
                </div>
                <div class="page-list-summary-score__metric-details">
                  <span class="page-list-summary-score__metric-optimal">
                    ${siteAICrawlability.pagesWithSchema}/${siteAICrawlability.totalPages} pages with schema
                  </span>
                </div>
              </div>
              <div class="page-list-summary-score__metric">
                <div class="page-list-summary-score__metric-header">
                  <span class="page-list-summary-score__metric-label">Indexability</span>
                  <span class="page-list-summary-score__metric-value">${Math.round(siteAICrawlability.noindexRatio)}% noindex</span>
                </div>
                <div class="page-list-summary-score__metric-details">
                  <span class="page-list-summary-score__metric-note">
                    ${siteAICrawlability.pagesWithNoindex} pages with noindex
                    ${siteAICrawlability.importantPagesWithNoindex > 0 ? `| ${siteAICrawlability.importantPagesWithNoindex} important pages blocked` : ''}
                  </span>
                </div>
              </div>
              <div class="page-list-summary-score__metric">
                <div class="page-list-summary-score__metric-header">
                  <span class="page-list-summary-score__metric-label">Duplicate Content</span>
                  <span class="page-list-summary-score__metric-value">${siteAICrawlability.duplicateTitles + siteAICrawlability.duplicateDescriptions}</span>
                </div>
                <div class="page-list-summary-score__metric-details">
                  <span class="page-list-summary-score__metric-note">
                    ${siteAICrawlability.duplicateTitles} duplicate titles | ${siteAICrawlability.duplicateDescriptions} duplicate descriptions
                  </span>
                </div>
              </div>
              ` : ''}
              <div class="page-list-summary-score__metric">
                <div class="page-list-summary-score__metric-header">
                  <span class="page-list-summary-score__metric-label">Page Excerpts</span>
                  <span class="page-list-summary-score__metric-value">${stats.aiBreakdown.summaryOptimal}/${stats.total}</span>
                </div>
                <div class="page-list-summary-score__metric-bar">
                  <div class="page-list-summary-score__metric-fill" style="width: ${Math.round((stats.aiBreakdown.summaryOptimal / stats.total) * 100)}%"></div>
                </div>
                <div class="page-list-summary-score__metric-details">
                  <span class="page-list-summary-score__metric-optimal ${stats.aiBreakdown.summaryOptimal === stats.total ? 'metric-optimal--complete' : ''}">
                    ${stats.aiBreakdown.summaryOptimal} with optimal length (100-300 chars)
                  </span>
                  ${stats.aiBreakdown.summaryMissing > 0 ? `<span class="page-list-summary-score__metric-issues">${stats.aiBreakdown.summaryMissing} missing</span>` : ''}
                  ${stats.aiBreakdown.summaryTooShort > 0 ? `<span class="page-list-summary-score__metric-issues">${stats.aiBreakdown.summaryTooShort} too short</span>` : ''}
                  ${stats.aiBreakdown.summaryTooLong > 0 ? `<span class="page-list-summary-score__metric-issues">${stats.aiBreakdown.summaryTooLong} too long</span>` : ''}
                </div>
              </div>
              <div class="page-list-summary-score__metric">
                <div class="page-list-summary-score__metric-header">
                  <span class="page-list-summary-score__metric-label">Content Structure</span>
                  <span class="page-list-summary-score__metric-value">Per page</span>
                </div>
                <div class="page-list-summary-score__metric-details">
                  <span class="page-list-summary-score__metric-note">Headings (H2/H3) and content length (500+ chars) calculated per page</span>
                </div>
                </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      ${technicalSEOHtml}
      ${section === 'keyword-research' ? `
        <div class="page-list-keyword-research">
          <div class="page-list-keyword-research__header">
            <h3 class="page-list-keyword-research__title">Competitor Keyword Analysis</h3>
            <p class="page-list-keyword-research__description">Add competitor URLs to analyze their keywords and compare against your site.</p>
          </div>
          <div class="page-list-keyword-research__competitors">
            <div class="page-list-keyword-research__add-competitor">
              <input 
                type="url" 
                class="page-list-keyword-research__url-input" 
                id="page-list-competitor-url-input"
                placeholder="https://competitor.com/page"
                aria-label="Competitor URL"
              />
              <button 
                class="page-list-keyword-research__add-btn" 
                id="page-list-add-competitor-btn"
                type="button"
                aria-label="Add competitor URL"
              >
                <span class="material-symbols-outlined" aria-hidden="true">add</span>
                Add Competitor
              </button>
            </div>
            <div class="page-list-keyword-research__competitor-list" id="page-list-competitor-list"></div>
          </div>
          <div class="page-list-keyword-research__results" id="page-list-keyword-research-results" style="display: none;">
            <h4 class="page-list-keyword-research__results-title">Keyword Comparison</h4>
            <div class="page-list-keyword-research__comparison" id="page-list-keyword-comparison"></div>
          </div>
        </div>
      ` : showFilters ? `
      <div class="page-list-filters-grouped">
        <div class="page-list-filter-tabs">
          <button class="page-list-filter-tab page-list-filter-tab--active" data-tab="overview">Overview</button>
          <button class="page-list-filter-tab" data-tab="meta">Meta Tags</button>
          <button class="page-list-filter-tab" data-tab="technical">Technical SEO</button>
          <button class="page-list-filter-tab" data-tab="analytics">Analytics</button>
          <button class="page-list-filter-tab" data-tab="onpage">On-Page SEO</button>
          <button class="page-list-filter-tab" data-tab="content">Content Quality</button>
          <button class="page-list-filter-tab" data-tab="accessibility">Accessibility</button>
        </div>
        <div class="page-list-filter-tab-content page-list-filter-tab-content--active" data-tab-content="overview">
          <div class="page-list-summary__grid">
            <button class="page-list-summary__stat page-list-summary__stat--clickable ${activeFilter === 'all' ? 'page-list-summary__stat--active' : ''}" data-filter="all">
              <div class="page-list-summary__value">${stats.total}</div>
              <div class="page-list-summary__label">Total Pages</div>
            </button>
            <button class="page-list-summary__stat page-list-summary__stat--clickable page-list-summary__stat--warning ${activeFilter === 'with-issues' ? 'page-list-summary__stat--active' : ''}" data-filter="with-issues" ${stats.withIssues === 0 ? 'disabled' : ''}>
              <div class="page-list-summary__value">${stats.withIssues}</div>
              <div class="page-list-summary__label">Pages with Issues</div>
            </button>
            <button class="page-list-summary__stat page-list-summary__stat--clickable page-list-summary__stat--success ${activeFilter === 'good' ? 'page-list-summary__stat--active' : ''}" data-filter="good" ${(stats.total - stats.withIssues) === 0 ? 'disabled' : ''}>
              <div class="page-list-summary__value">${stats.total - stats.withIssues}</div>
              <div class="page-list-summary__label">Good Pages</div>
            </button>
          </div>
        </div>
        <div class="page-list-filter-tab-content" data-tab-content="meta">
          ${isLocalhost() && (stats.missingTitle > 0 || stats.missingDesc > 0) ? `
            <div class="page-list-tab-actions">
              <button 
                class="page-list-fix-button" 
                id="page-list-bulk-add-meta" 
                type="button"
                aria-label="Bulk add missing meta tags (development mode only)"
                title="Bulk add missing meta tags (dev-only)"
                data-tooltip="Automatically generate and add missing meta titles and descriptions. Only available in development mode."
              >
                <span class="page-list-fix-button__icon material-symbols-outlined" aria-hidden="true">auto_fix_high</span>
                <span class="page-list-fix-button__text">Bulk Add Meta Tags</span>
              </button>
            </div>
          ` : ''}
          <div class="page-list-summary__grid">
            <button class="page-list-summary__stat page-list-summary__stat--clickable page-list-summary__stat--${stats.missingTitle > 0 ? 'error' : 'success'} ${activeFilter === 'missing-title' ? 'page-list-summary__stat--active' : ''}" data-filter="missing-title" ${stats.missingTitle === 0 ? 'disabled' : ''}>
              <div class="page-list-summary__value">${formatIssueCount(stats.missingTitle)}</div>
              <div class="page-list-summary__label">Missing Titles</div>
            </button>
            <button class="page-list-summary__stat page-list-summary__stat--clickable page-list-summary__stat--${stats.missingDesc > 0 ? 'error' : 'success'} ${activeFilter === 'missing-description' ? 'page-list-summary__stat--active' : ''}" data-filter="missing-description" ${stats.missingDesc === 0 ? 'disabled' : ''}>
              <div class="page-list-summary__value">${formatIssueCount(stats.missingDesc)}</div>
              <div class="page-list-summary__label">Missing Descriptions</div>
            </button>
            <button class="page-list-summary__stat page-list-summary__stat--clickable page-list-summary__stat--${(stats.titleOverLimit + stats.titleOverPixels) > 0 ? 'error' : 'success'} ${activeFilter === 'title-over-limit' ? 'page-list-summary__stat--active' : ''}" data-filter="title-over-limit" ${(stats.titleOverLimit + stats.titleOverPixels) === 0 ? 'disabled' : ''}>
              <div class="page-list-summary__value">${formatIssueCount(stats.titleOverLimit + stats.titleOverPixels)}</div>
              <div class="page-list-summary__label">Title Issues</div>
            </button>
            <button class="page-list-summary__stat page-list-summary__stat--clickable page-list-summary__stat--${(stats.descOverLimit + stats.descOverPixels) > 0 ? 'error' : 'success'} ${activeFilter === 'description-over-limit' ? 'page-list-summary__stat--active' : ''}" data-filter="description-over-limit" ${(stats.descOverLimit + stats.descOverPixels) === 0 ? 'disabled' : ''}>
              <div class="page-list-summary__value">${formatIssueCount(stats.descOverLimit + stats.descOverPixels)}</div>
              <div class="page-list-summary__label">Description Issues</div>
            </button>
            <button class="page-list-summary__stat page-list-summary__stat--clickable page-list-summary__stat--${stats.titleOverPixels > 0 || stats.descOverPixels > 0 ? 'error' : 'success'} ${activeFilter === 'pixel-issues' ? 'page-list-summary__stat--active' : ''}" data-filter="pixel-issues" ${(stats.titleOverPixels + stats.descOverPixels) === 0 ? 'disabled' : ''}>
              <div class="page-list-summary__value">${formatIssueCount(stats.titleOverPixels + stats.descOverPixels)}</div>
              <div class="page-list-summary__label">
                Pixel Issues
                ${createTooltip('Titles and descriptions can be cut off in search results if they exceed pixel width limits (920px desktop, 1300px mobile). Even if character count is acceptable, long words or wide characters can cause truncation.')}
              </div>
            </button>
          </div>
        </div>
        <div class="page-list-filter-tab-content" data-tab-content="technical">
          <div class="page-list-summary__grid">
            <button class="page-list-summary__stat page-list-summary__stat--clickable page-list-summary__stat--${stats.technicalSEO.brokenLinks > 0 ? 'error' : 'success'} ${activeFilter === 'broken-links' ? 'page-list-summary__stat--active' : ''}" data-filter="broken-links" ${stats.technicalSEO.brokenLinks === 0 ? 'disabled' : ''}>
              <div class="page-list-summary__value">${formatIssueCount(stats.technicalSEO.brokenLinks)}</div>
              <div class="page-list-summary__label">Broken Links</div>
            </button>
            <button class="page-list-summary__stat page-list-summary__stat--clickable page-list-summary__stat--${stats.technicalSEO.brokenImages > 0 ? 'error' : 'success'} ${activeFilter === 'broken-images' ? 'page-list-summary__stat--active' : ''}" data-filter="broken-images" ${stats.technicalSEO.brokenImages === 0 ? 'disabled' : ''}>
              <div class="page-list-summary__value">${formatIssueCount(stats.technicalSEO.brokenImages)}</div>
              <div class="page-list-summary__label">Broken Images</div>
            </button>
            <button class="page-list-summary__stat page-list-summary__stat--clickable page-list-summary__stat--${stats.technicalSEO.imagesWithoutAlt > 0 ? 'error' : 'success'} ${activeFilter === 'images-no-alt' ? 'page-list-summary__stat--active' : ''}" data-filter="images-no-alt" ${stats.technicalSEO.imagesWithoutAlt === 0 ? 'disabled' : ''}>
              <div class="page-list-summary__value">${formatIssueCount(stats.technicalSEO.imagesWithoutAlt)}</div>
              <div class="page-list-summary__label">Images w/o Alt</div>
            </button>
            <button class="page-list-summary__stat page-list-summary__stat--clickable page-list-summary__stat--${stats.technicalSEO.headingStructureIssues > 0 ? 'error' : 'success'} ${activeFilter === 'heading-structure' ? 'page-list-summary__stat--active' : ''}" data-filter="heading-structure" ${stats.technicalSEO.headingStructureIssues === 0 ? 'disabled' : ''}>
              <div class="page-list-summary__value">${formatIssueCount(stats.technicalSEO.headingStructureIssues)}</div>
              <div class="page-list-summary__label">
                Heading Structure
                ${createTooltip('Headings should follow a logical hierarchy (H1 → H2 → H3). Skipping levels (e.g., H1 to H3) confuses search engines and screen readers. Maintain proper nesting for better SEO and accessibility.')}
              </div>
            </button>
            <button class="page-list-summary__stat page-list-summary__stat--clickable page-list-summary__stat--${stats.onPageSEO.imagesNotNextGen > 0 ? 'warning' : 'success'} ${activeFilter === 'images-not-nextgen' ? 'page-list-summary__stat--active' : ''}" data-filter="images-not-nextgen" ${stats.onPageSEO.imagesNotNextGen === 0 ? 'disabled' : ''}>
              <div class="page-list-summary__value">${formatIssueCount(stats.onPageSEO.imagesNotNextGen)}</div>
              <div class="page-list-summary__label">
                Images Not Next-Gen
                ${createTooltip('Next-generation image formats (WebP, AVIF) provide better compression and faster loading than JPEG/PNG. Converting images to WebP or AVIF can reduce file sizes by 25-50% while maintaining quality, improving page load times and Core Web Vitals.')}
              </div>
            </button>
            <button class="page-list-summary__stat page-list-summary__stat--clickable page-list-summary__stat--${stats.onPageSEO.imagesWithoutLazyLoading > 0 ? 'warning' : 'success'} ${activeFilter === 'images-no-lazy' ? 'page-list-summary__stat--active' : ''}" data-filter="images-no-lazy" ${stats.onPageSEO.imagesWithoutLazyLoading === 0 ? 'disabled' : ''}>
              <div class="page-list-summary__value">${formatIssueCount(stats.onPageSEO.imagesWithoutLazyLoading)}</div>
              <div class="page-list-summary__label">
                Images w/o Lazy Load
                ${createTooltip('Lazy loading defers loading images until they\'re needed (when scrolling into view). This reduces initial page load time, saves bandwidth, and improves Core Web Vitals (LCP, FCP). Add loading="lazy" to offscreen images.')}
              </div>
            </button>
            <button class="page-list-summary__stat page-list-summary__stat--clickable page-list-summary__stat--${stats.onPageSEO.noLangAttribute > 0 ? 'warning' : 'success'} ${activeFilter === 'no-lang' ? 'page-list-summary__stat--active' : ''}" data-filter="no-lang" ${stats.onPageSEO.noLangAttribute === 0 ? 'disabled' : ''}>
              <div class="page-list-summary__value">${formatIssueCount(stats.onPageSEO.noLangAttribute)}</div>
              <div class="page-list-summary__label">
                No Lang Attribute
                ${createTooltip('The HTML lang attribute helps screen readers pronounce content correctly and helps search engines understand the page language. Essential for accessibility and SEO. Should be set on the <html> tag.')}
              </div>
            </button>
            <button class="page-list-summary__stat page-list-summary__stat--clickable page-list-summary__stat--${stats.onPageSEO.noCanonical > 0 ? 'warning' : 'success'} ${activeFilter === 'no-canonical' ? 'page-list-summary__stat--active' : ''}" data-filter="no-canonical" ${stats.onPageSEO.noCanonical === 0 ? 'disabled' : ''}>
              <div class="page-list-summary__value">${formatIssueCount(stats.onPageSEO.noCanonical)}</div>
              <div class="page-list-summary__label">
                No Canonical Link
                ${createTooltip('Canonical links tell search engines which version of a page is the preferred one, preventing duplicate content issues. Essential for SEO when you have multiple URLs pointing to the same content.')}
              </div>
            </button>
            <button class="page-list-summary__stat page-list-summary__stat--clickable page-list-summary__stat--${stats.onPageSEO.mixedContent > 0 ? 'error' : 'success'} ${activeFilter === 'mixed-content' ? 'page-list-summary__stat--active' : ''}" data-filter="mixed-content" ${stats.onPageSEO.mixedContent === 0 ? 'disabled' : ''}>
              <div class="page-list-summary__value">${formatIssueCount(stats.onPageSEO.mixedContent)}</div>
              <div class="page-list-summary__label">
                Mixed Content
                ${createTooltip('Mixed content occurs when an HTTPS page loads resources (images, scripts, stylesheets) over HTTP. This creates security vulnerabilities, triggers browser warnings, and can break functionality. All resources should use HTTPS.')}
              </div>
            </button>
          </div>
        </div>
        <div class="page-list-filter-tab-content" data-tab-content="analytics">
          ${isLocalhost() && stats.technicalSEO.pagesWithoutAnalytics > 0 ? `
            <div class="page-list-tab-actions">
              <button 
                class="page-list-fix-button" 
                id="page-list-bulk-add-analytics" 
                type="button"
                aria-label="Bulk add analytics tracking (development mode only)"
                title="Add analytics (dev-only)"
                data-tooltip="Automatically add analytics tracking code to pages missing it. Only available in development mode."
              >
                <span class="page-list-fix-button__icon material-symbols-outlined" aria-hidden="true">analytics</span>
                <span class="page-list-fix-button__text">Add Analytics</span>
              </button>
            </div>
          ` : ''}
          <div class="page-list-summary__grid">
            <button class="page-list-summary__stat page-list-summary__stat--clickable page-list-summary__stat--${stats.technicalSEO.pagesWithoutAnalytics > 0 ? 'warning' : 'success'} ${activeFilter === 'no-analytics' ? 'page-list-summary__stat--active' : ''}" data-filter="no-analytics" ${stats.technicalSEO.pagesWithoutAnalytics === 0 ? 'disabled' : ''}>
              <div class="page-list-summary__value">${formatIssueCount(stats.technicalSEO.pagesWithoutAnalytics)}</div>
              <div class="page-list-summary__label">No Analytics</div>
            </button>
          </div>
        </div>
        <div class="page-list-filter-tab-content" data-tab-content="onpage">
          ${isLocalhost() && (stats.onPageSEO.noSchemaMarkup > 0 || stats.onPageSEO.genericAnchorIssues > 0) ? `
            <div class="page-list-tab-actions">
              ${stats.onPageSEO.noSchemaMarkup > 0 ? `
                <button 
                  class="page-list-fix-button" 
                  id="page-list-bulk-add-schema" 
                  type="button"
                  aria-label="Bulk add schema markup (development mode only)"
                  title="Bulk add schema (dev-only)"
                  data-tooltip="Automatically generate and add basic schema markup to pages. Only available in development mode."
                >
                  <span class="page-list-fix-button__icon material-symbols-outlined" aria-hidden="true">schema</span>
                  <span class="page-list-fix-button__text">Add Schema Markup</span>
                </button>
              ` : ''}
              ${stats.onPageSEO.genericAnchorIssues > 0 ? `
                <button 
                  class="page-list-fix-button" 
                  id="page-list-fix-generic-anchors" 
                  type="button"
                  aria-label="Fix generic anchor text (development mode only)"
                  title="Fix generic anchors (dev-only)"
                  data-tooltip="Automatically improve generic anchor text with more descriptive alternatives. Only available in development mode."
                >
                  <span class="page-list-fix-button__icon material-symbols-outlined" aria-hidden="true">edit</span>
                  <span class="page-list-fix-button__text">Fix Generic Anchors</span>
                </button>
              ` : ''}
            </div>
          ` : ''}
          <div class="page-list-summary__grid">
            <button class="page-list-summary__stat page-list-summary__stat--clickable page-list-summary__stat--${stats.onPageSEO.multipleH1Issues > 0 ? 'error' : 'success'} ${activeFilter === 'multiple-h1' ? 'page-list-summary__stat--active' : ''}" data-filter="multiple-h1" ${stats.onPageSEO.multipleH1Issues === 0 ? 'disabled' : ''}>
              <div class="page-list-summary__value">${formatIssueCount(stats.onPageSEO.multipleH1Issues)}</div>
              <div class="page-list-summary__label">Multiple H1</div>
            </button>
            <button class="page-list-summary__stat page-list-summary__stat--clickable page-list-summary__stat--${stats.onPageSEO.noH1Issues > 0 ? 'error' : 'success'} ${activeFilter === 'no-h1' ? 'page-list-summary__stat--active' : ''}" data-filter="no-h1" ${stats.onPageSEO.noH1Issues === 0 ? 'disabled' : ''}>
              <div class="page-list-summary__value">${formatIssueCount(stats.onPageSEO.noH1Issues)}</div>
              <div class="page-list-summary__label">No H1</div>
            </button>
            <button class="page-list-summary__stat page-list-summary__stat--clickable page-list-summary__stat--${stats.onPageSEO.noH2Issues > 0 ? 'warning' : 'success'} ${activeFilter === 'no-h2' ? 'page-list-summary__stat--active' : ''}" data-filter="no-h2" ${stats.onPageSEO.noH2Issues === 0 ? 'disabled' : ''}>
              <div class="page-list-summary__value">${formatIssueCount(stats.onPageSEO.noH2Issues)}</div>
              <div class="page-list-summary__label">No H2</div>
            </button>
            <button class="page-list-summary__stat page-list-summary__stat--clickable page-list-summary__stat--${stats.onPageSEO.internalLinkIssues > 0 ? 'warning' : 'success'} ${activeFilter === 'internal-links' ? 'page-list-summary__stat--active' : ''}" data-filter="internal-links" ${stats.onPageSEO.internalLinkIssues === 0 ? 'disabled' : ''}>
              <div class="page-list-summary__value">${formatIssueCount(stats.onPageSEO.internalLinkIssues)}</div>
              <div class="page-list-summary__label">
                Link Count Issues
                ${createTooltip('Pages should have 3-5 internal links. Too few (0-2) limits discoverability and site structure understanding. Too many (6+) can look spammy and dilute link value. Aim for quality, relevant internal links.')}
              </div>
            </button>
            <button class="page-list-summary__stat page-list-summary__stat--clickable page-list-summary__stat--${stats.onPageSEO.genericAnchorIssues > 0 ? 'warning' : 'success'} ${activeFilter === 'generic-anchors' ? 'page-list-summary__stat--active' : ''}" data-filter="generic-anchors" ${stats.onPageSEO.genericAnchorIssues === 0 ? 'disabled' : ''}>
              <div class="page-list-summary__value">${formatIssueCount(stats.onPageSEO.genericAnchorIssues)}</div>
              <div class="page-list-summary__label">
                Generic Anchors
                ${createTooltip('Generic anchor text like "click here", "read more", or "here" doesn\'t help search engines understand the link destination. Use descriptive anchor text that explains what users will find when they click.')}
              </div>
            </button>
            <button class="page-list-summary__stat page-list-summary__stat--clickable page-list-summary__stat--${stats.onPageSEO.noSchemaMarkup > 0 ? 'warning' : 'success'} ${activeFilter === 'no-schema' ? 'page-list-summary__stat--active' : ''}" data-filter="no-schema" ${stats.onPageSEO.noSchemaMarkup === 0 ? 'disabled' : ''}>
              <div class="page-list-summary__value">${formatIssueCount(stats.onPageSEO.noSchemaMarkup)}</div>
              <div class="page-list-summary__label">
                No Schema
                ${createTooltip('Schema markup (JSON-LD) helps search engines understand your content structure. It can enable rich snippets in search results, improving click-through rates. All pages should have at least LocalBusiness schema.')}
              </div>
            </button>
            <button class="page-list-summary__stat page-list-summary__stat--clickable page-list-summary__stat--${stats.onPageSEO.urlLengthIssues > 0 ? 'warning' : 'success'} ${activeFilter === 'url-length' ? 'page-list-summary__stat--active' : ''}" data-filter="url-length" ${stats.onPageSEO.urlLengthIssues === 0 ? 'disabled' : ''}>
              <div class="page-list-summary__value">${formatIssueCount(stats.onPageSEO.urlLengthIssues)}</div>
              <div class="page-list-summary__label">
                URL Too Long
                ${createTooltip('URLs should be under 75 characters ideally, and under 100 characters maximum. Shorter URLs are easier to read, share, and remember. Long URLs can be cut off in search results and look unprofessional.')}
              </div>
            </button>
            <button class="page-list-summary__stat page-list-summary__stat--clickable page-list-summary__stat--${stats.onPageSEO.outboundLinksTooFew > 0 ? 'warning' : 'success'} ${activeFilter === 'outbound-links' ? 'page-list-summary__stat--active' : ''}" data-filter="outbound-links" ${stats.onPageSEO.outboundLinksTooFew === 0 ? 'disabled' : ''}>
              <div class="page-list-summary__value">${formatIssueCount(stats.onPageSEO.outboundLinksTooFew)}</div>
              <div class="page-list-summary__label">
                No Outbound Links
                ${createTooltip('Outbound links (external, dofollow links) to authoritative sources show you\'ve researched your content and provide value to readers. Aim for at least 1-2 relevant external links per page to support E-E-A-T signals.')}
              </div>
            </button>
            <button class="page-list-summary__stat page-list-summary__stat--clickable page-list-summary__stat--${stats.onPageSEO.paragraphLengthIssues > 0 ? 'warning' : 'success'} ${activeFilter === 'paragraph-length' ? 'page-list-summary__stat--active' : ''}" data-filter="paragraph-length" ${stats.onPageSEO.paragraphLengthIssues === 0 ? 'disabled' : ''}>
              <div class="page-list-summary__value">${formatIssueCount(stats.onPageSEO.paragraphLengthIssues)}</div>
              <div class="page-list-summary__label">
                Long Paragraphs
                ${createTooltip('Paragraphs should be under 150 words ideally, and under 200 words maximum. Long paragraphs are hard to read, especially on mobile devices. Break up long paragraphs into shorter, digestible chunks for better readability.')}
              </div>
            </button>
            <button class="page-list-summary__stat page-list-summary__stat--clickable page-list-summary__stat--${stats.onPageSEO.subheadingDistributionIssues > 0 ? 'warning' : 'success'} ${activeFilter === 'subheading-distribution' ? 'page-list-summary__stat--active' : ''}" data-filter="subheading-distribution" ${stats.onPageSEO.subheadingDistributionIssues === 0 ? 'disabled' : ''}>
              <div class="page-list-summary__value">${formatIssueCount(stats.onPageSEO.subheadingDistributionIssues)}</div>
              <div class="page-list-summary__label">
                Subheading Spacing
                ${createTooltip('Subheadings (H2, H3) should appear roughly every 300 words to break up long content blocks. This improves readability, helps users scan content, and signals content structure to search engines.')}
              </div>
            </button>
            <button class="page-list-summary__stat page-list-summary__stat--clickable page-list-summary__stat--${stats.onPageSEO.mediaUsageTooFew > 0 ? 'warning' : 'success'} ${activeFilter === 'media-usage' ? 'page-list-summary__stat--active' : ''}" data-filter="media-usage" ${stats.onPageSEO.mediaUsageTooFew === 0 ? 'disabled' : ''}>
              <div class="page-list-summary__value">${formatIssueCount(stats.onPageSEO.mediaUsageTooFew)}</div>
              <div class="page-list-summary__label">
                Low Media Usage
                ${createTooltip('Pages should have at least 3-4 images or videos to enhance engagement and break up text. Visual content improves user experience, increases time on page, and can help with rankings.')}
              </div>
            </button>
            <button class="page-list-summary__stat page-list-summary__stat--clickable page-list-summary__stat--${stats.onPageSEO.noDateInfo > 0 ? 'warning' : 'success'} ${activeFilter === 'no-date-info' ? 'page-list-summary__stat--active' : ''}" data-filter="no-date-info" ${stats.onPageSEO.noDateInfo === 0 ? 'disabled' : ''}>
              <div class="page-list-summary__value">${formatIssueCount(stats.onPageSEO.noDateInfo)}</div>
              <div class="page-list-summary__label">
                No Date Info
                ${createTooltip('Pages should have a published date and/or last modified date. This helps establish content freshness, builds trust with users, and is an important E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness) signal for search engines.')}
              </div>
            </button>
            <button class="page-list-summary__stat page-list-summary__stat--clickable page-list-summary__stat--${stats.onPageSEO.noMobileViewport > 0 ? 'warning' : 'success'} ${activeFilter === 'no-mobile-viewport' ? 'page-list-summary__stat--active' : ''}" data-filter="no-mobile-viewport" ${stats.onPageSEO.noMobileViewport === 0 ? 'disabled' : ''}>
              <div class="page-list-summary__value">${formatIssueCount(stats.onPageSEO.noMobileViewport)}</div>
              <div class="page-list-summary__label">
                No Mobile Viewport
                ${createTooltip('The viewport meta tag tells mobile browsers how to display your page. Without it, mobile devices may render pages at desktop width, creating a poor user experience. Essential for mobile-first indexing.')}
              </div>
            </button>
            <button class="page-list-summary__stat page-list-summary__stat--clickable page-list-summary__stat--${stats.onPageSEO.socialMetaIncomplete > 0 ? 'warning' : 'success'} ${activeFilter === 'social-meta' ? 'page-list-summary__stat--active' : ''}" data-filter="social-meta" ${stats.onPageSEO.socialMetaIncomplete === 0 ? 'disabled' : ''}>
              <div class="page-list-summary__value">${formatIssueCount(stats.onPageSEO.socialMetaIncomplete)}</div>
              <div class="page-list-summary__label">
                Incomplete Social Meta
                ${createTooltip('Open Graph (Facebook) and Twitter Card meta tags control how your content appears when shared on social media. Complete social meta tags (title, description, image) improve click-through rates and brand presentation.')}
              </div>
            </button>
          </div>
        </div>
        <div class="page-list-filter-tab-content" data-tab-content="content">
          <div class="page-list-summary__grid">
            <button class="page-list-summary__stat page-list-summary__stat--clickable page-list-summary__stat--${stats.contentQuality.wordCountIssues > 0 ? 'warning' : 'success'} ${activeFilter === 'low-word-count' ? 'page-list-summary__stat--active' : ''}" data-filter="low-word-count" ${stats.contentQuality.wordCountIssues === 0 ? 'disabled' : ''}>
              <div class="page-list-summary__value">${formatIssueCount(stats.contentQuality.wordCountIssues)}</div>
              <div class="page-list-summary__label">Low Word Count</div>
            </button>
            <button class="page-list-summary__stat page-list-summary__stat--clickable page-list-summary__stat--${stats.contentQuality.staleContent > 0 ? 'warning' : 'success'} ${activeFilter === 'stale-content' ? 'page-list-summary__stat--active' : ''}" data-filter="stale-content" ${stats.contentQuality.staleContent === 0 ? 'disabled' : ''}>
              <div class="page-list-summary__value">${formatIssueCount(stats.contentQuality.staleContent)}</div>
              <div class="page-list-summary__label">Stale Content</div>
            </button>
            <button class="page-list-summary__stat page-list-summary__stat--clickable page-list-summary__stat--${stats.contentQuality.noCitations > 0 ? 'warning' : 'success'} ${activeFilter === 'no-citations' ? 'page-list-summary__stat--active' : ''}" data-filter="no-citations" ${stats.contentQuality.noCitations === 0 ? 'disabled' : ''}>
              <div class="page-list-summary__value">${formatIssueCount(stats.contentQuality.noCitations)}</div>
              <div class="page-list-summary__label">No Citations</div>
            </button>
            <button class="page-list-summary__stat page-list-summary__stat--clickable page-list-summary__stat--${stats.contentQuality.noAuthor > 0 ? 'warning' : 'success'} ${activeFilter === 'no-author' ? 'page-list-summary__stat--active' : ''}" data-filter="no-author" ${stats.contentQuality.noAuthor === 0 ? 'disabled' : ''}>
              <div class="page-list-summary__value">${formatIssueCount(stats.contentQuality.noAuthor)}</div>
              <div class="page-list-summary__label">No Author</div>
            </button>
            <button class="page-list-summary__stat page-list-summary__stat--clickable page-list-summary__stat--${stats.contentQuality.videosWithoutTranscript > 0 ? 'warning' : 'success'} ${activeFilter === 'videos-no-transcript' ? 'page-list-summary__stat--active' : ''}" data-filter="videos-no-transcript" ${stats.contentQuality.videosWithoutTranscript === 0 ? 'disabled' : ''}>
              <div class="page-list-summary__value">${formatIssueCount(stats.contentQuality.videosWithoutTranscript)}</div>
              <div class="page-list-summary__label">Videos w/o Transcript</div>
            </button>
            <button class="page-list-summary__stat page-list-summary__stat--clickable page-list-summary__stat--${stats.contentQuality.noExcerpt > 0 ? 'error' : 'success'} ${activeFilter === 'no-excerpt' ? 'page-list-summary__stat--active' : ''}" data-filter="no-excerpt" ${stats.contentQuality.noExcerpt === 0 ? 'disabled' : ''}>
              <div class="page-list-summary__value">${formatIssueCount(stats.contentQuality.noExcerpt)}</div>
              <div class="page-list-summary__label">
                No Excerpt
                ${createTooltip('Page excerpts (summaries) help AI crawlers and search engines understand page content quickly. They appear in search results, social shares, and help with content discovery. Every page should have a meaningful excerpt (100-300 characters optimal).')}
              </div>
            </button>
            <button class="page-list-summary__stat page-list-summary__stat--clickable page-list-summary__stat--${stats.contentQuality.excerptTooShort > 0 ? 'warning' : 'success'} ${activeFilter === 'excerpt-too-short' ? 'page-list-summary__stat--active' : ''}" data-filter="excerpt-too-short" ${stats.contentQuality.excerptTooShort === 0 ? 'disabled' : ''}>
              <div class="page-list-summary__value">${formatIssueCount(stats.contentQuality.excerptTooShort)}</div>
              <div class="page-list-summary__label">
                Excerpt Too Short
                ${createTooltip('Excerpts under 50 characters provide insufficient context. Optimal excerpts are 100-300 characters, providing enough detail for AI crawlers and search engines to understand the page content without being too long.')}
              </div>
            </button>
            <button class="page-list-summary__stat page-list-summary__stat--clickable page-list-summary__stat--${stats.contentQuality.excerptTooLong > 0 ? 'warning' : 'success'} ${activeFilter === 'excerpt-too-long' ? 'page-list-summary__stat--active' : ''}" data-filter="excerpt-too-long" ${stats.contentQuality.excerptTooLong === 0 ? 'disabled' : ''}>
              <div class="page-list-summary__value">${formatIssueCount(stats.contentQuality.excerptTooLong)}</div>
              <div class="page-list-summary__label">
                Excerpt Too Long
                ${createTooltip('Excerpts over 300 characters may be truncated in search results and social shares, losing important information. Keep excerpts concise (100-300 characters) to ensure the full message is displayed.')}
              </div>
            </button>
          </div>
        </div>
        <div class="page-list-filter-tab-content" data-tab-content="accessibility">
          ${isLocalhost() && (stats.accessibility.missingAriaLabels > 0 || stats.accessibility.noFocusIndicators > 0) ? `
            <div class="page-list-tab-actions">
              ${stats.accessibility.missingAriaLabels > 0 ? `
                <button 
                  class="page-list-fix-button" 
                  id="page-list-bulk-add-aria" 
                  type="button"
                  aria-label="Bulk add ARIA labels (development mode only)"
                  title="Add ARIA labels (dev-only)"
                  data-tooltip="Automatically add ARIA labels to interactive elements missing them. Only available in development mode."
                >
                  <span class="page-list-fix-button__icon material-symbols-outlined" aria-hidden="true">accessibility_new</span>
                  <span class="page-list-fix-button__text">Add ARIA Labels</span>
                </button>
              ` : ''}
            </div>
          ` : ''}
          <div class="page-list-summary__grid">
            <button class="page-list-summary__stat page-list-summary__stat--clickable page-list-summary__stat--${stats.accessibility.contrastRatioIssues > 0 ? 'error' : 'success'} ${activeFilter === 'contrast-ratio' ? 'page-list-summary__stat--active' : ''}" data-filter="contrast-ratio" ${stats.accessibility.contrastRatioIssues === 0 ? 'disabled' : ''}>
              <div class="page-list-summary__value">${formatIssueCount(stats.accessibility.contrastRatioIssues)}</div>
              <div class="page-list-summary__label">
                Contrast Ratio Issues
                ${createTooltip('WCAG AA requires 4.5:1 contrast ratio for normal text (3:1 for large text). Low contrast makes content hard to read, especially for users with visual impairments. Check text/background color combinations.')}
              </div>
            </button>
            <button class="page-list-summary__stat page-list-summary__stat--clickable page-list-summary__stat--${stats.accessibility.missingAriaLabels > 0 ? 'warning' : 'success'} ${activeFilter === 'missing-aria' ? 'page-list-summary__stat--active' : ''}" data-filter="missing-aria" ${stats.accessibility.missingAriaLabels === 0 ? 'disabled' : ''}>
              <div class="page-list-summary__value">${formatIssueCount(stats.accessibility.missingAriaLabels)}</div>
              <div class="page-list-summary__label">
                Missing ARIA Labels
                ${createTooltip('ARIA labels provide accessible names for interactive elements. Missing labels make it difficult for screen readers to identify buttons, links, and form controls. Add aria-label or aria-labelledby attributes.')}
              </div>
            </button>
            <button class="page-list-summary__stat page-list-summary__stat--clickable page-list-summary__stat--${stats.accessibility.keyboardNavigationIssues > 0 ? 'error' : 'success'} ${activeFilter === 'keyboard-nav' ? 'page-list-summary__stat--active' : ''}" data-filter="keyboard-nav" ${stats.accessibility.keyboardNavigationIssues === 0 ? 'disabled' : ''}>
              <div class="page-list-summary__value">${formatIssueCount(stats.accessibility.keyboardNavigationIssues)}</div>
              <div class="page-list-summary__label">
                Keyboard Navigation Issues
                ${createTooltip('All interactive elements must be keyboard accessible. Users should be able to navigate and activate all controls using only the keyboard (Tab, Enter, Space, Arrow keys). Check for elements that can\'t be reached or activated via keyboard.')}
              </div>
            </button>
            <button class="page-list-summary__stat page-list-summary__stat--clickable page-list-summary__stat--${stats.accessibility.noFocusIndicators > 0 ? 'error' : 'success'} ${activeFilter === 'no-focus-indicators' ? 'page-list-summary__stat--active' : ''}" data-filter="no-focus-indicators" ${stats.accessibility.noFocusIndicators === 0 ? 'disabled' : ''}>
              <div class="page-list-summary__value">${formatIssueCount(stats.accessibility.noFocusIndicators)}</div>
              <div class="page-list-summary__label">
                No Focus Indicators
                ${createTooltip('Focus indicators (outlines) show which element is currently focused when navigating with keyboard. Without visible focus indicators, keyboard users can\'t tell where they are on the page. Ensure focus styles are visible and meet contrast requirements.')}
              </div>
            </button>
            <button class="page-list-summary__stat page-list-summary__stat--clickable page-list-summary__stat--${stats.technicalSEO.imagesWithoutAlt > 0 ? 'error' : 'success'} ${activeFilter === 'images-no-alt' ? 'page-list-summary__stat--active' : ''}" data-filter="images-no-alt" ${stats.technicalSEO.imagesWithoutAlt === 0 ? 'disabled' : ''}>
              <div class="page-list-summary__value">${formatIssueCount(stats.technicalSEO.imagesWithoutAlt)}</div>
              <div class="page-list-summary__label">
                Images w/o Alt Text
                ${createTooltip('Alt text describes images for screen reader users. All images should have descriptive alt attributes. Decorative images should have empty alt="" attributes. Missing alt text prevents visually impaired users from understanding image content.')}
              </div>
            </button>
          </div>
        </div>
      </div>
      ` : ''}
      ${analyticsHtml}
    </div>
  `;
}
/**
 * Get status badges for a page
 */
function getStatusBadges(page: PageData): Array<{ text: string; class: string }> {
  const badges: Array<{ text: string; class: string }> = [];

  if (!page.hasMetaTitle) {
    badges.push({ text: 'Missing Title', class: 'badge-error' });
  } else if (page.titleOverPixels) {
    badges.push({ text: 'Title Over Pixels', class: 'badge-error' });
  } else if (page.titleOverLimit) {
    badges.push({ text: 'Title Too Long', class: 'badge-error' });
  }

  if (!page.hasMetaDescription) {
    badges.push({ text: 'Missing Desc', class: 'badge-error' });
  } else if (page.descriptionOverPixels) {
    badges.push({ text: 'Desc Over Pixels', class: 'badge-error' });
  } else if (page.descriptionOverLimit) {
    badges.push({ text: 'Desc Too Long', class: 'badge-error' });
  }

  // Technical SEO badges
  if (page.hasBrokenLinks) {
    badges.push({ text: `${page.brokenLinks} Broken Link${page.brokenLinks > 1 ? 's' : ''}`, class: 'badge-error' });
  }
  if (page.hasBrokenImages) {
    badges.push({ text: `${page.brokenImages || 0} Broken Image${(page.brokenImages || 0) > 1 ? 's' : ''}`, class: 'badge-error' });
  }
  if (page.hasImagesWithoutAlt) {
    badges.push({ text: `${page.imagesWithoutAlt} Image${page.imagesWithoutAlt > 1 ? 's' : ''} w/o Alt`, class: 'badge-warning' });
  }
  if (!page.headingStructureGood) {
    badges.push({ text: 'Heading Structure', class: 'badge-warning' });
  }
  
  // On-page SEO badges
  if (page.hasMultipleH1) {
    badges.push({ text: `${page.h1Count} H1${page.h1Count > 1 ? 's' : ''}`, class: 'badge-error' });
  }
  if (page.h1Count === 0) {
    badges.push({ text: 'No H1', class: 'badge-error' });
  }
  if (!page.hasH2s) {
    badges.push({ text: 'No H2', class: 'badge-warning' });
  }
  if (page.internalLinksTooFew) {
    badges.push({ text: `Only ${page.internalLinkCount} Link${page.internalLinkCount !== 1 ? 's' : ''}`, class: 'badge-warning' });
  }
  if (page.internalLinksTooMany) {
    badges.push({ text: `${page.internalLinkCount} Links`, class: 'badge-warning' });
  }
  if (page.hasGenericAnchors) {
    badges.push({ text: `${page.genericAnchorCount} Generic Anchor${page.genericAnchorCount > 1 ? 's' : ''}`, class: 'badge-warning' });
  }
  if (page.hasGenericAltText) {
    badges.push({ text: `${page.imagesWithGenericAlt} Generic Alt`, class: 'badge-warning' });
  }
  if (!page.hasSchemaMarkup) {
    badges.push({ text: 'No Schema', class: 'badge-warning' });
  }
  if (!page.firstParaGood) {
    badges.push({ text: 'Short First Para', class: 'badge-warning' });
  }
  
  // Content Quality badges
  if (page.wordCountPoor) {
    badges.push({ text: `${page.wordCount} Words`, class: 'badge-warning' });
  }
  if (page.isStale) {
    const months = Math.floor(page.daysSinceUpdate / 30);
    badges.push({ text: `${months}M Old`, class: 'badge-warning' });
  }
  if (!page.hasCitations) {
    badges.push({ text: 'No Citations', class: 'badge-warning' });
  }
  if (!page.hasAuthor) {
    badges.push({ text: 'No Author', class: 'badge-warning' });
  }
  if (page.hasVideos && !page.hasTranscript) {
    badges.push({ text: 'No Transcript', class: 'badge-warning' });
  }
  if (!page.readabilityGood && page.avgSentenceLength > 0) {
    badges.push({ text: `Avg ${Math.round(page.avgSentenceLength)}w/sent`, class: 'badge-warning' });
  }
  
  // Analytics badges
  if (!page.hasAnalytics) {
    badges.push({ text: 'No Analytics', class: 'badge-warning' });
  }
  
  // Accessibility badges
  if (page.hasContrastRatioIssues && page.contrastRatioIssues) {
    badges.push({ text: `${page.contrastRatioIssues} Contrast Issue${page.contrastRatioIssues > 1 ? 's' : ''}`, class: 'badge-error' });
  }
  if (page.hasMissingAriaLabels && page.missingAriaLabels) {
    badges.push({ text: `${page.missingAriaLabels} Missing ARIA`, class: 'badge-warning' });
  }
  if (page.hasKeyboardNavigationIssues && page.keyboardNavigationIssues) {
    badges.push({ text: 'Keyboard Nav Issues', class: 'badge-error' });
  }
  if (page.hasFocusIndicators === false) {
    badges.push({ text: 'No Focus Indicators', class: 'badge-error' });
  }

  return badges;
}

/**
 * Render a score badge
 * Shows circular progress bar for all scores
 */
function renderScore(score: number, label: string): string {
  // Defensive check: don't render if score is null, undefined, or not a number
  if (score === null || score === undefined || typeof score !== 'number' || isNaN(score)) {
    return '';
  }
  
  const scoreClass = getScoreClass(score);
  const CIRCLE_RADIUS = 54;
  const CIRCUMFERENCE = 2 * Math.PI * CIRCLE_RADIUS;
  const dashArray = (score / 100) * CIRCUMFERENCE;
  
  // Normalize label to ensure consistency (SEO, AI, A11y)
  const normalizedLabel = label.toUpperCase();
  
  return `
    <div class="page-list-score ${scoreClass} page-list-score--circular">
      <div class="page-list-score__circle">
        <svg class="page-list-score__circle-svg" viewBox="0 0 120 120">
          <circle class="page-list-score__circle-bg" cx="60" cy="60" r="${CIRCLE_RADIUS}"></circle>
          <circle class="page-list-score__circle-fill ${scoreClass}" cx="60" cy="60" r="${CIRCLE_RADIUS}" 
            style="stroke-dasharray: ${dashArray} ${CIRCUMFERENCE};"></circle>
        </svg>
        <div class="page-list-score__circle-value">
          <span class="page-list-score__circle-number">${score}</span>
          <span class="page-list-score__circle-label">${normalizedLabel}</span>
        </div>
      </div>
    </div>
  `;
}

/**
 * Render page detail modal
 */
function renderPageDetailModal(page: PageData): string {
  const badges = getStatusBadges(page);
  const badgesHtml = badges.length > 0
    ? `<div class="page-list-detail-badges">${badges.map(b => `<span class="page-list-badge ${b.class}">${b.text}</span>`).join('')}</div>`
    : '<div class="page-list-detail-badges"><span class="page-list-badge badge-success">All Good ✓</span></div>';

  return `
    <div class="page-list-modal" id="page-list-modal">
      <div class="page-list-modal__overlay"></div>
      <div class="page-list-modal__content">
        <button class="page-list-modal__close" id="page-list-modal-close">×</button>
        <div class="page-list-modal__header">
          <h2 class="page-list-modal__title">${escapeHtml(page.title)}</h2>
          <a href="${page.relPermalink}" target="_blank" rel="noopener noreferrer" class="page-list-modal__link">
            ${page.relPermalink} ↗
          </a>
        </div>
        <div class="page-list-modal__body">
          <div class="page-list-modal__scores">
            ${renderScore(page.seoScore, 'SEO')}
            ${renderScore(page.aiCrawlabilityScore, 'AI')}
            ${page.accessibilityScore !== undefined && page.accessibilityScore !== null ? renderScore(page.accessibilityScore, 'A11y') : ''}
          </div>
          ${badgesHtml}
          <div class="page-list-modal__tabs" role="tablist" aria-label="Page details sections">
            <button class="page-list-modal__tab page-list-modal__tab--active" role="tab" aria-selected="true" aria-controls="page-list-tab-meta" id="page-list-tab-btn-meta" data-tab="meta">
              Meta Tags
            </button>
            <button class="page-list-modal__tab" role="tab" aria-selected="false" aria-controls="page-list-tab-technical" id="page-list-tab-btn-technical" data-tab="technical">
              Technical SEO
            </button>
            <button class="page-list-modal__tab" role="tab" aria-selected="false" aria-controls="page-list-tab-onpage" id="page-list-tab-btn-onpage" data-tab="onpage">
              On-Page SEO
            </button>
            <button class="page-list-modal__tab" role="tab" aria-selected="false" aria-controls="page-list-tab-accessibility" id="page-list-tab-btn-accessibility" data-tab="accessibility">
              Accessibility
            </button>
            <button class="page-list-modal__tab" role="tab" aria-selected="false" aria-controls="page-list-tab-content" id="page-list-tab-btn-content" data-tab="content">
              Content Quality
            </button>
            ${isLocalhost() ? `
            <button class="page-list-modal__tab" role="tab" aria-selected="false" aria-controls="page-list-tab-keywords" id="page-list-tab-btn-keywords" data-tab="keywords">
              Keyword Research
            </button>
            ` : ''}
          </div>
          <div class="page-list-modal__sections">
            <div class="page-list-modal__section page-list-modal__section--active" id="page-list-tab-meta" role="tabpanel" aria-labelledby="page-list-tab-btn-meta" data-section="meta">
              <h3 class="page-list-modal__section-title">Meta Tags</h3>
              <div class="page-list-modal__section-content">
                <div class="page-list-modal__field">
                  <label>
                    Meta Title
                    ${createTooltip('Meta titles should be 30-60 characters and under 920px wide on desktop. They appear in search results and browser tabs. Keep them concise and descriptive.')}
                  </label>
                  <div class="page-list-modal__value ${!page.hasMetaTitle ? 'page-list-modal__value--missing' : ''}">
                    ${page.hasMetaTitle ? escapeHtml(page.metaTitle) : '<em>Missing</em>'}
                  </div>
                  ${page.hasMetaTitle ? `
                    <div class="page-list-modal__metrics">
                      <span>${page.metaTitleLength} chars / ${TITLE_LIMIT}</span>
                      <span>${Math.round(page.titlePixels)}px / ${TITLE_PIXEL_LIMIT_DESKTOP}</span>
                    </div>
                  ` : ''}
                </div>
                <div class="page-list-modal__field">
                  <label>
                    Meta Description
                    ${createTooltip('Meta descriptions should be 120-160 characters and under 1970px wide on desktop. They appear in search results below the title. Write compelling summaries that encourage clicks.')}
                  </label>
                  <div class="page-list-modal__value ${!page.hasMetaDescription ? 'page-list-modal__value--missing' : ''}">
                    ${page.hasMetaDescription ? escapeHtml(page.metaDescription) : '<em>Missing</em>'}
                  </div>
                  ${page.hasMetaDescription ? `
                    <div class="page-list-modal__metrics">
                      <span>${page.metaDescriptionLength} chars / ${DESC_LIMIT}</span>
                      <span>${Math.round(page.descriptionPixels)}px / ${DESC_PIXEL_LIMIT_DESKTOP}</span>
                    </div>
                  ` : ''}
                </div>
              </div>
            </div>
            <div class="page-list-modal__section" id="page-list-tab-technical" role="tabpanel" aria-labelledby="page-list-tab-btn-technical" data-section="technical">
              <h3 class="page-list-modal__section-title">Technical SEO</h3>
              <div class="page-list-modal__section-content">
                <div class="page-list-modal__field">
                  <label>
                    Broken Links
                    ${createTooltip('Broken links point to pages that don\'t exist on your site. They create poor user experience and can negatively impact SEO. Fix or remove broken links to improve site quality.')}
                  </label>
                  <div class="page-list-modal__value ${page.hasBrokenLinks ? 'page-list-modal__value--bad' : 'page-list-modal__value--good'}">
                    ${page.brokenLinks} / ${page.totalInternalLinks} ${page.hasBrokenLinks ? '✗' : '✓'}
                  </div>
                  ${page.hasBrokenLinks && page.brokenLinkUrls && Array.isArray(page.brokenLinkUrls) && page.brokenLinkUrls.length > 0 ? `
                  <div class="page-list-modal__broken-links">
                    <div class="page-list-modal__broken-links-title">Broken Link URLs:</div>
                    <ul class="page-list-modal__broken-links-list">
                      ${page.brokenLinkUrls.map(url => `
                        <li class="page-list-modal__broken-link-item" data-broken-url="${escapeHtml(url)}" data-source-page="${escapeHtml(page.relPermalink)}">
                          <code class="page-list-modal__broken-link-url">${escapeHtml(url)}</code>
                          ${isLocalhost() ? `
                          <div class="page-list-modal__broken-link-actions">
                            <button 
                              class="dev-score-bubble__broken-link-menu-action" 
                              data-action="fix"
                              data-broken-url="${escapeHtml(url)}"
                              data-source-page="${escapeHtml(page.relPermalink)}"
                              type="button"
                              aria-label="Auto-fix broken link"
                              title="Auto-fix broken link"
                            >
                              <span class="material-symbols-outlined" aria-hidden="true">auto_fix_high</span>
                              <span>Fix</span>
                            </button>
                            <button 
                              class="dev-score-bubble__broken-link-menu-action" 
                              data-action="edit"
                              data-broken-url="${escapeHtml(url)}"
                              data-source-page="${escapeHtml(page.relPermalink)}"
                              type="button"
                              aria-label="Edit broken link URL"
                              title="Edit broken link URL"
                            >
                              <span class="material-symbols-outlined" aria-hidden="true">edit</span>
                              <span>Edit</span>
                            </button>
                            <button 
                              class="dev-score-bubble__broken-link-menu-action" 
                              data-action="remove"
                              data-broken-url="${escapeHtml(url)}"
                              data-source-page="${escapeHtml(page.relPermalink)}"
                              type="button"
                              aria-label="Remove broken link"
                              title="Remove broken link"
                            >
                              <span class="material-symbols-outlined" aria-hidden="true">link_off</span>
                              <span>Remove</span>
                            </button>
                          </div>
                          ` : ''}
                        </li>
                      `).join('')}
                    </ul>
                  </div>
                  ` : page.hasBrokenLinks ? `
                  <div class="page-list-modal__broken-links">
                    <div class="page-list-modal__broken-links-note">Broken link URLs not available. Please regenerate the page list.</div>
                  </div>
                  ` : ''}
                </div>
                <div class="page-list-modal__field">
                  <label>
                    Broken Images
                    ${createTooltip('Broken images have src attributes pointing to files that don\'t exist. This creates broken image icons on your pages and hurts user experience. Fix image paths or remove broken image references.')}
                  </label>
                  <div class="page-list-modal__value ${page.hasBrokenImages ? 'page-list-modal__value--bad' : 'page-list-modal__value--good'}">
                    ${page.brokenImages || 0} / ${page.totalImages || 0} ${page.hasBrokenImages ? '✗' : '✓'}
                  </div>
                  ${page.hasBrokenImages && page.brokenImageUrls && Array.isArray(page.brokenImageUrls) && page.brokenImageUrls.length > 0 ? `
                  <div class="page-list-modal__broken-links">
                    <div class="page-list-modal__broken-links-title">Broken Image URLs:</div>
                    <ul class="page-list-modal__broken-links-list">
                      ${page.brokenImageUrls.map(url => `
                        <li class="page-list-modal__broken-link-item" data-broken-image-url="${escapeHtml(url)}" data-source-page="${escapeHtml(page.relPermalink)}">
                          <code class="page-list-modal__broken-link-url">${escapeHtml(url)}</code>
                        </li>
                      `).join('')}
                    </ul>
                  </div>
                  ` : page.hasBrokenImages ? `
                  <div class="page-list-modal__broken-links">
                    <div class="page-list-modal__broken-links-note">Broken image URLs not available. Please regenerate the page list.</div>
                  </div>
                  ` : ''}
                </div>
                <div class="page-list-modal__field">
                  <label>Images Without Alt</label>
                  <div class="page-list-modal__value">${page.imagesWithoutAlt} / ${page.totalImages}</div>
                </div>
                <div class="page-list-modal__field">
                  <label>
                    Heading Structure
                    ${createTooltip('Headings should follow a logical hierarchy (H1 → H2 → H3). Skipping levels (e.g., H1 to H3) confuses search engines and screen readers. Maintain proper nesting for better SEO and accessibility.')}
                  </label>
                  <div class="page-list-modal__value ${page.headingStructureGood ? 'page-list-modal__value--good' : 'page-list-modal__value--bad'}">
                    ${page.headingStructureGood ? '✓ Good' : '✗ Issues Found'}
                  </div>
                </div>
                <div class="page-list-modal__field">
                  <label>H1 Count</label>
                  <div class="page-list-modal__value ${page.hasOneH1 ? 'page-list-modal__value--good' : 'page-list-modal__value--bad'}">
                    ${page.h1Count} ${page.hasOneH1 ? '✓' : '✗'}
                  </div>
                </div>
                <div class="page-list-modal__field">
                  <label>H2 Count</label>
                  <div class="page-list-modal__value ${page.hasH2s ? 'page-list-modal__value--good' : 'page-list-modal__value--bad'}">
                    ${page.h2Count} ${page.hasH2s ? '✓' : '✗'}
                  </div>
                </div>
                <div class="page-list-modal__field">
                  <label>
                    Analytics Tracking
                    ${createTooltip('Analytics tracking (Google Analytics, GTM, etc.) helps you understand visitor behaviour, track conversions, and measure content performance. All pages should have analytics configured for comprehensive site insights.')}
                  </label>
                  <div class="page-list-modal__value ${page.hasAnalytics ? 'page-list-modal__value--good' : 'page-list-modal__value--bad'}">
                    ${page.hasAnalytics ? '✓ Configured' : '✗ Not Configured'}
                  </div>
                  ${page.hasAnalytics && page.analyticsTypes && page.analyticsTypes.length > 0 ? `
                  <div class="page-list-modal__value page-list-modal__value--info" style="margin-top: 0.5rem; font-size: 0.875rem;">
                    Types: ${page.analyticsTypes.join(', ')}
                  </div>
                  ` : ''}
                </div>
                <div class="page-list-modal__field">
                  <label>
                    Image Formats
                    ${createTooltip('Next-generation image formats (WebP, AVIF) provide better compression and faster loading than JPEG/PNG. Converting images to WebP or AVIF can reduce file sizes by 25-50% while maintaining quality, improving page load times and Core Web Vitals.')}
                  </label>
                  <div class="page-list-modal__value ${!page.hasImagesNotNextGen ? 'page-list-modal__value--good' : 'page-list-modal__value--warning'}">
                    ${!page.hasImagesNotNextGen ? '✓ All Next-Gen' : `⚠ ${page.imagesNotNextGen} Not Next-Gen`}
                  </div>
                </div>
                <div class="page-list-modal__field">
                  <label>
                    Lazy Loading
                    ${createTooltip('Lazy loading defers loading images until they\'re needed (when scrolling into view). This reduces initial page load time, saves bandwidth, and improves Core Web Vitals (LCP, FCP). Add loading="lazy" to offscreen images.')}
                  </label>
                  <div class="page-list-modal__value ${!page.hasImagesWithoutLazyLoading ? 'page-list-modal__value--good' : 'page-list-modal__value--warning'}">
                    ${!page.hasImagesWithoutLazyLoading ? '✓ All Lazy Loaded' : `⚠ ${page.imagesWithoutLazyLoading} Not Lazy Loaded`}
                  </div>
                </div>
                <div class="page-list-modal__field">
                  <label>
                    HTML Lang Attribute
                    ${createTooltip('The HTML lang attribute helps screen readers pronounce content correctly and helps search engines understand the page language. Essential for accessibility and SEO. Should be set on the <html> tag.')}
                  </label>
                  <div class="page-list-modal__value ${page.hasLangAttribute ? 'page-list-modal__value--good' : 'page-list-modal__value--bad'}">
                    ${page.hasLangAttribute ? '✓ Present' : '✗ Missing'}
                  </div>
                </div>
                <div class="page-list-modal__field">
                  <label>
                    Canonical Link
                    ${createTooltip('Canonical links tell search engines which version of a page is the preferred one, preventing duplicate content issues. Essential for SEO when you have multiple URLs pointing to the same content.')}
                  </label>
                  <div class="page-list-modal__value ${page.hasCanonical ? 'page-list-modal__value--good' : 'page-list-modal__value--bad'}">
                    ${page.hasCanonical ? '✓ Present' : '✗ Missing'}
                  </div>
                </div>
                <div class="page-list-modal__field">
                  <label>
                    Mixed Content
                    ${createTooltip('Mixed content occurs when an HTTPS page loads resources (images, scripts, stylesheets) over HTTP. This creates security vulnerabilities, triggers browser warnings, and can break functionality. All resources should use HTTPS.')}
                  </label>
                  <div class="page-list-modal__value ${!page.hasMixedContent ? 'page-list-modal__value--good' : 'page-list-modal__value--error'}">
                    ${!page.hasMixedContent ? '✓ No Issues' : `✗ ${page.mixedContentIssues} Issue(s) Found`}
                  </div>
                </div>
              </div>
            </div>
            <div class="page-list-modal__section" id="page-list-tab-onpage" role="tabpanel" aria-labelledby="page-list-tab-btn-onpage" data-section="onpage">
              <h3 class="page-list-modal__section-title">On-Page SEO</h3>
              <div class="page-list-modal__section-content">
                <div class="page-list-modal__field">
                  <label>
                    Internal Links
                    ${createTooltip('Internal links help users navigate and help search engines understand your site structure. Aim for 3-5 relevant internal links per page. Too few limits discoverability; too many can look spammy.')}
                  </label>
                  <div class="page-list-modal__value ${page.internalLinksGood ? 'page-list-modal__value--good' : 'page-list-modal__value--bad'}">
                    ${page.internalLinkCount} ${page.internalLinksGood ? '✓ (3-5 recommended)' : '✗'}
                  </div>
                </div>
                <div class="page-list-modal__field">
                  <label>Generic Anchors</label>
                  <div class="page-list-modal__value ${!page.hasGenericAnchors ? 'page-list-modal__value--good' : 'page-list-modal__value--bad'}">
                    ${page.genericAnchorCount} ${!page.hasGenericAnchors ? '✓' : '✗'}
                  </div>
                </div>
                <div class="page-list-modal__field">
                  <label>
                    Schema Markup
                    ${createTooltip('Schema markup (JSON-LD) helps search engines understand your content structure. It can enable rich snippets in search results, improving click-through rates. All pages should have at least LocalBusiness schema.')}
                  </label>
                  <div class="page-list-modal__value ${page.hasSchemaMarkup ? 'page-list-modal__value--good' : 'page-list-modal__value--bad'}">
                    ${page.hasSchemaMarkup ? '✓ Present' : '✗ Missing'}
                  </div>
                </div>
              </div>
            </div>
            <div class="page-list-modal__section" id="page-list-tab-accessibility" role="tabpanel" aria-labelledby="page-list-tab-btn-accessibility" data-section="accessibility">
              <h3 class="page-list-modal__section-title">Accessibility</h3>
              <div class="page-list-modal__section-content">
                <div class="page-list-modal__field">
                  <label>
                    Contrast Ratio
                    ${createTooltip('WCAG AA requires 4.5:1 contrast ratio for normal text (3:1 for large text 18pt+ or 14pt+ bold). Low contrast makes content hard to read, especially for users with visual impairments. Check all text/background color combinations.')}
                  </label>
                  <div class="page-list-modal__value ${!page.hasContrastRatioIssues ? 'page-list-modal__value--good' : 'page-list-modal__value--error'}">
                    ${!page.hasContrastRatioIssues ? '✓ Meets WCAG AA (4.5:1)' : `✗ ${page.contrastRatioIssues || 0} Issue(s) Found`}
                  </div>
                  ${page.hasContrastRatioIssues ? `
                  <div class="page-list-modal__value page-list-modal__value--info" style="margin-top: 0.5rem; font-size: 0.875rem;">
                    ${(page.contrastRatioBelow45 || 0) > 0 ? `${page.contrastRatioBelow45} below 4.5:1 (normal text)` : ''}
                    ${(page.contrastRatioBelow45 || 0) > 0 && (page.contrastRatioBelow3 || 0) > 0 ? ' | ' : ''}
                    ${(page.contrastRatioBelow3 || 0) > 0 ? `${page.contrastRatioBelow3} below 3:1 (large text)` : ''}
                  </div>
                  ` : ''}
                </div>
                <div class="page-list-modal__field">
                  <label>
                    ARIA Labels
                    ${createTooltip('ARIA labels provide accessible names for interactive elements. Missing labels make it difficult for screen readers to identify buttons, links, and form controls. Add aria-label or aria-labelledby attributes to interactive elements without visible text.')}
                  </label>
                  <div class="page-list-modal__value ${!page.hasMissingAriaLabels ? 'page-list-modal__value--good' : 'page-list-modal__value--warning'}">
                    ${!page.hasMissingAriaLabels ? '✓ All Interactive Elements Labeled' : `⚠ ${page.missingAriaLabels || 0} Missing`}
                  </div>
                </div>
                <div class="page-list-modal__field">
                  <label>
                    Keyboard Navigation
                    ${createTooltip('All interactive elements must be keyboard accessible. Users should be able to navigate and activate all controls using only the keyboard (Tab, Enter, Space, Arrow keys). Check for elements that can\'t be reached or activated via keyboard.')}
                  </label>
                  <div class="page-list-modal__value ${!page.hasKeyboardNavigationIssues ? 'page-list-modal__value--good' : 'page-list-modal__value--error'}">
                    ${!page.hasKeyboardNavigationIssues ? '✓ Fully Keyboard Accessible' : `✗ ${page.keyboardNavigationIssues || 0} Issue(s) Found`}
                  </div>
                </div>
                <div class="page-list-modal__field">
                  <label>
                    Focus Indicators
                    ${createTooltip('Focus indicators (outlines) show which element is currently focused when navigating with keyboard. Without visible focus indicators, keyboard users can\'t tell where they are on the page. Ensure focus styles are visible and meet contrast requirements (3:1 minimum).')}
                  </label>
                  <div class="page-list-modal__value ${page.hasFocusIndicators !== false ? 'page-list-modal__value--good' : 'page-list-modal__value--error'}">
                    ${page.hasFocusIndicators !== false ? '✓ Present' : '✗ Missing'}
                  </div>
                </div>
                <div class="page-list-modal__field">
                  <label>
                    Image Alt Text
                    ${createTooltip('Alt text describes images for screen reader users. All images should have descriptive alt attributes. Decorative images should have empty alt="" attributes. Missing alt text prevents visually impaired users from understanding image content.')}
                  </label>
                  <div class="page-list-modal__value ${!page.hasImagesWithoutAlt ? 'page-list-modal__value--good' : 'page-list-modal__value--error'}">
                    ${page.imagesWithoutAlt} / ${page.totalImages} ${!page.hasImagesWithoutAlt ? '✓' : '✗'}
                  </div>
                </div>
                ${page.accessibilityScore !== undefined && page.accessibilityScore !== null ? `
                <div class="page-list-modal__field">
                  <label>Accessibility Score</label>
                  <div class="page-list-modal__value ${page.accessibilityScore >= 80 ? 'page-list-modal__value--good' : page.accessibilityScore >= 60 ? 'page-list-modal__value--warning' : 'page-list-modal__value--error'}">
                    ${page.accessibilityScore}/100 ${page.accessibilityScore >= 80 ? '✓' : page.accessibilityScore >= 60 ? '⚠' : '✗'}
                  </div>
                </div>
                ` : ''}
              </div>
            </div>
            <div class="page-list-modal__section" id="page-list-tab-content" role="tabpanel" aria-labelledby="page-list-tab-btn-content" data-section="content">
              <h3 class="page-list-modal__section-title">Content Quality</h3>
              <div class="page-list-modal__section-content">
                <div class="page-list-modal__field">
                  <label>
                    Word Count
                    ${createTooltip('Longer content typically ranks better. Pages with 1400+ words are considered optimal for SEO. 800-1399 words is acceptable. Under 800 words may not provide enough depth for search engines to understand the topic comprehensively.')}
                  </label>
                  <div class="page-list-modal__value ${page.wordCountGood ? 'page-list-modal__value--good' : page.wordCountFair ? 'page-list-modal__value--good' : 'page-list-modal__value--bad'}">
                    ${page.wordCount} ${page.wordCountGood ? '✓ (1400+ optimal)' : page.wordCountFair ? '✓ (800-1399 acceptable)' : '✗ (<800)'}
                  </div>
                </div>
                <div class="page-list-modal__field">
                  <label>Content Freshness</label>
                  <div class="page-list-modal__value ${!page.isStale ? 'page-list-modal__value--good' : 'page-list-modal__value--bad'}">
                    ${page.isStale ? `${Math.floor(page.daysSinceUpdate / 30)} months old ✗` : '✓ Recent'}
                  </div>
                </div>
                <div class="page-list-modal__field">
                  <label>
                    Citations
                    ${createTooltip('Citations (external links to authoritative sources) support E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness). They show you\'ve researched your content and provide sources for readers. Aim for 2+ citations per page.')}
                  </label>
                  <div class="page-list-modal__value ${page.citationsGood ? 'page-list-modal__value--good' : page.hasCitations ? 'page-list-modal__value--warning' : 'page-list-modal__value--bad'}">
                    ${page.citationCount} ${page.citationsGood ? '✓ (2+ recommended)' : page.hasCitations ? '⚠ (1)' : '✗ (0)'}
                  </div>
                </div>
                <div class="page-list-modal__field">
                  <label>Author</label>
                  <div class="page-list-modal__value ${page.hasAuthor ? 'page-list-modal__value--good' : 'page-list-modal__value--bad'}">
                    ${page.hasAuthor && page.authorName ? escapeHtml(page.authorName) : (page.hasAuthor ? '✓ Present' : '✗ Missing')}
                  </div>
                </div>
                <div class="page-list-modal__field">
                  <label>
                    Readability
                    ${createTooltip('Average sentence length affects readability. 10-25 words per sentence is ideal (8th grade reading level). Shorter sentences are easier to understand. Longer sentences (30+ words) can be hard to follow and may reduce engagement. Break up long sentences for better readability.')}
                  </label>
                  <div class="page-list-modal__value ${page.readabilityGood ? 'page-list-modal__value--good' : 'page-list-modal__value--bad'}">
                    ${page.avgSentenceLength > 0 ? `Avg ${Math.round(page.avgSentenceLength)} words/sentence` : 'N/A'} ${page.readabilityGood ? '✓' : '✗'}
                  </div>
                  ${page.longSentences && Array.isArray(page.longSentences) && page.longSentences.length > 0 ? `
                  <div class="page-list-modal__long-sentences">
                    <div class="page-list-modal__long-sentences-title">Long Sentences (over 25 words):</div>
                    <div class="page-list-modal__long-sentences-list">
                      ${page.longSentences.map((sentence, index) => {
                        const wordCount = sentence.trim().split(/\s+/).filter(w => w.length > 0).length;
                        return `
                        <div class="page-list-modal__long-sentence-item">
                          <div class="page-list-modal__long-sentence-header">
                            <span class="page-list-modal__long-sentence-number">Sentence ${index + 1}</span>
                            <span class="page-list-modal__long-sentence-count">${wordCount} words</span>
                          </div>
                          <div class="page-list-modal__long-sentence-text">${escapeHtml(sentence.trim())}</div>
                        </div>
                        `;
                      }).join('')}
                    </div>
                  </div>
                  ` : ''}
                </div>
                ${page.hasVideos ? `
                <div class="page-list-modal__field">
                  <label>Video Transcript</label>
                  <div class="page-list-modal__value ${page.hasTranscript ? 'page-list-modal__value--good' : 'page-list-modal__value--bad'}">
                    ${page.videoCount} video(s) ${page.hasTranscript ? '✓' : '✗ Missing transcript'}
                  </div>
                </div>
                ` : ''}
                <div class="page-list-modal__field">
                  <label>
                    Page Excerpt
                    ${createTooltip('Page excerpts (summaries) help AI crawlers and search engines understand page content quickly. They appear in search results, social shares, and help with content discovery. Optimal length is 100-300 characters. Too short (<50) provides insufficient context. Too long (>300) may be truncated.')}
                  </label>
                  <div class="page-list-modal__value ${page.summaryOptimal ? 'page-list-modal__value--good' : page.summaryFair ? 'page-list-modal__value--warning' : page.hasSummary ? 'page-list-modal__value--warning' : 'page-list-modal__value--bad'}">
                    ${page.hasSummary ? `${page.summaryLength} chars ${page.summaryOptimal ? '✓ (100-300 optimal)' : page.summaryTooShort ? '✗ (too short, <50)' : page.summaryTooLong ? '✗ (too long, >300)' : '⚠ (50-99 acceptable)'}` : '✗ Missing'}
                  </div>
                  ${page.hasSummary ? `
                  <div class="page-list-modal__value page-list-modal__value--info" style="margin-top: 0.5rem; font-size: 0.875rem; font-style: italic;">
                    ${escapeHtml(page.summary.substring(0, 150))}${page.summary.length > 150 ? '...' : ''}
                  </div>
                  ` : ''}
                </div>
              </div>
            </div>
            ${isLocalhost() ? `
            <div class="page-list-modal__section" id="page-list-tab-keywords" role="tabpanel" aria-labelledby="page-list-tab-btn-keywords" data-section="keywords">
              <h3 class="page-list-modal__section-title">Keyword Research</h3>
              <div class="page-list-modal__section-content">
                <div class="page-list-modal__field">
                  <label>Analyze Keywords</label>
                  <div class="page-list-modal__value">
                    <button 
                      class="page-list-modal__button page-list-modal__button--primary" 
                      id="page-list-keyword-research-btn"
                      data-page-url="${escapeHtml(page.relPermalink)}"
                      data-page-title="${escapeHtml(page.title)}"
                      type="button"
                      aria-label="Analyze keywords for this page"
                    >
                      <span class="material-symbols-outlined" aria-hidden="true">search</span>
                      Analyze Keywords
                    </button>
                  </div>
                </div>
              </div>
            </div>
            ` : ''}
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Render a single page row
 */
function renderPageRow(page: PageData, compact: boolean = false, filterType: string = 'all'): string {
  const badges = getStatusBadges(page);
  const hasIssues = badges.length > 0;
  const statusClass = hasIssues ? 'page-list-status--warning' : 'page-list-status--good';

  const badgesHtml = badges.length > 0
    ? `<div class="page-list-badges">${badges.map(b => `<span class="page-list-badge ${b.class}">${b.text}</span>`).join('')}</div>`
    : '';

  // Special rendering for broken links filter
  if (filterType === 'broken-links' && page.hasBrokenLinks && page.brokenLinkUrls && page.brokenLinkUrls.length > 0) {
    const brokenLinksHtml = compact 
      ? page.brokenLinkUrls.slice(0, 2).map(url => 
          `<div class="page-list-broken-item">
            <code class="page-list-broken-item__url">${escapeHtml(truncate(url, 40))}</code>
          </div>`
        ).join('')
      : page.brokenLinkUrls.map(url => 
          `<div class="page-list-broken-item">
            <code class="page-list-broken-item__url">${escapeHtml(url)}</code>
          </div>`
        ).join('');
    
    const moreCount = compact && page.brokenLinkUrls.length > 2 ? `+${page.brokenLinkUrls.length - 2} more` : '';
    const countHtml = !compact ? `<div class="page-list-broken-count">${page.brokenLinks} broken link${page.brokenLinks !== 1 ? 's' : ''}</div>` : (moreCount ? `<div class="page-list-broken-count">${moreCount}</div>` : '');
    
    const actionsHtml = isLocalhost() ? `
      <div class="page-list-actions">
        <button 
          class="page-list-action-button page-list-action-button--fix" 
          data-action="fix-links"
          data-page-url="${escapeHtml(page.relPermalink)}"
          data-broken-links='${escapeHtml(JSON.stringify(page.brokenLinkUrls))}'
          aria-label="Fix broken links on this page"
          title="Fix broken links"
          type="button"
        >
          <span class="material-symbols-outlined" aria-hidden="true">auto_fix_high</span>
          ${!compact ? '<span>Fix Links</span>' : ''}
        </button>
      </div>
    ` : '<div class="page-list-actions"><span class="text-muted">View details to fix</span></div>';
    
    const scoresHtml = `
      <div class="page-list-row-scores">
        ${renderScore(page.seoScore, 'SEO')}
        ${renderScore(page.aiCrawlabilityScore, 'AI')}
        ${!compact && page.accessibilityScore !== undefined && page.accessibilityScore !== null ? renderScore(page.accessibilityScore, 'A11y') : ''}
      </div>
    `;

    return `
      <tr class="${statusClass} page-list-row" data-page-url="${page.relPermalink}">
        <td>
          <div class="page-list-title-cell">
            <strong>${escapeHtml(page.title)}</strong>
            ${badgesHtml}
          </div>
        </td>
        <td data-label="Broken Links">
          <div class="page-list-broken-items">
            ${brokenLinksHtml}
            ${countHtml}
          </div>
        </td>
        <td data-label="Actions">
          ${actionsHtml}
        </td>
        <td data-label="Scores">
          ${scoresHtml}
        </td>
        <td data-label="${compact ? 'Link' : 'Page Link'}">
          <a href="${page.relPermalink}" target="_blank" rel="noopener noreferrer">
            ${compact ? 'View →' : page.relPermalink}
          </a>
        </td>
      </tr>
    `;
  }

  // Special rendering for broken images filter
  if (filterType === 'broken-images' && page.hasBrokenImages && page.brokenImageUrls && page.brokenImageUrls.length > 0) {
    const brokenImagesHtml = compact 
      ? page.brokenImageUrls.slice(0, 2).map(url => 
          `<div class="page-list-broken-item">
            <code class="page-list-broken-item__url">${escapeHtml(truncate(url, 40))}</code>
          </div>`
        ).join('')
      : page.brokenImageUrls.map(url => 
          `<div class="page-list-broken-item">
            <code class="page-list-broken-item__url">${escapeHtml(url)}</code>
          </div>`
        ).join('');
    
    const moreCount = compact && page.brokenImageUrls.length > 2 ? `+${page.brokenImageUrls.length - 2} more` : '';
    const countHtml = !compact ? `<div class="page-list-broken-count">${page.brokenImages} broken image${page.brokenImages !== 1 ? 's' : ''}</div>` : (moreCount ? `<div class="page-list-broken-count">${moreCount}</div>` : '');
    
    const actionsHtml = isLocalhost() ? `
      <div class="page-list-actions">
        <button 
          class="page-list-action-button page-list-action-button--fix" 
          data-action="fix-images"
          data-page-url="${escapeHtml(page.relPermalink)}"
          data-broken-images='${escapeHtml(JSON.stringify(page.brokenImageUrls))}'
          aria-label="Fix broken images on this page"
          title="Fix broken images"
          type="button"
        >
          <span class="material-symbols-outlined" aria-hidden="true">auto_fix_high</span>
          ${!compact ? '<span>Fix Images</span>' : ''}
        </button>
      </div>
    ` : '<div class="page-list-actions"><span class="text-muted">View details to fix</span></div>';
    
    const scoresHtml = `
      <div class="page-list-row-scores">
        ${renderScore(page.seoScore, 'SEO')}
        ${renderScore(page.aiCrawlabilityScore, 'AI')}
        ${!compact && page.accessibilityScore !== undefined && page.accessibilityScore !== null ? renderScore(page.accessibilityScore, 'A11y') : ''}
      </div>
    `;

    return `
      <tr class="${statusClass} page-list-row" data-page-url="${page.relPermalink}">
        <td>
          <div class="page-list-title-cell">
            <strong>${escapeHtml(page.title)}</strong>
            ${badgesHtml}
          </div>
        </td>
        <td data-label="Broken Images">
          <div class="page-list-broken-items">
            ${brokenImagesHtml}
            ${countHtml}
          </div>
        </td>
        <td data-label="Actions">
          ${actionsHtml}
        </td>
        <td data-label="Scores">
          ${scoresHtml}
        </td>
        <td data-label="${compact ? 'Link' : 'Page Link'}">
          <a href="${page.relPermalink}" target="_blank" rel="noopener noreferrer">
            ${compact ? 'View →' : page.relPermalink}
          </a>
        </td>
      </tr>
    `;
  }

  if (compact) {
    // Compact layout: simplified view
    const scoresHtml = `
      <div class="page-list-row-scores">
        ${renderScore(page.seoScore, 'SEO')}
        ${renderScore(page.aiCrawlabilityScore, 'AI')}
        ${page.accessibilityScore !== undefined && page.accessibilityScore !== null ? renderScore(page.accessibilityScore, 'A11y') : ''}
      </div>
    `;

    const metaDescHtml = page.hasMetaDescription
      ? `<span class="${page.descriptionOverLimit || page.descriptionOverPixels ? 'text-warning' : ''}">${escapeHtml(truncate(page.metaDescription, 80))}</span>`
      : '<span class="text-error">Missing</span>';

    return `
      <tr class="${statusClass} page-list-row" data-page-url="${page.relPermalink}">
        <td>
          <div class="page-list-title-cell">
            <strong>${escapeHtml(page.title)}</strong>
            ${badgesHtml}
          </div>
        </td>
        <td data-label="Meta Title">
          ${page.hasMetaTitle ? `<span class="${page.titleOverLimit || page.titleOverPixels ? 'text-warning' : ''}">${escapeHtml(truncate(page.metaTitle, 50))}</span>` : '<span class="text-error">Missing</span>'}
        </td>
        <td data-label="Meta Description">
          ${metaDescHtml}
        </td>
        <td data-label="Scores">
          ${scoresHtml}
        </td>
        <td data-label="Link">
          <a href="${page.relPermalink}" target="_blank" rel="noopener noreferrer" class="page-list-link-compact">
            View →
          </a>
        </td>
      </tr>
    `;
  }

  // Normal layout: full details
  const metaTitleHtml = page.hasMetaTitle
    ? `<div class="page-list-meta-content-wrapper">
         <div class="page-list-meta-content">${escapeHtml(page.metaTitle)}</div>
         <div class="page-list-meta-metrics">
           <div class="page-list-meta-metric ${page.titleOverLimit || page.titleOverPixels ? 'metric--warning' : 'metric--good'}">
             <span class="page-list-meta-metric__icon">${page.titleOverLimit || page.titleOverPixels ? '⚠️' : '✓'}</span>
             <div class="page-list-meta-metric__info">
               <span class="page-list-meta-metric__label">Characters</span>
               <span class="page-list-meta-metric__value ${page.titleOverLimit ? 'value--over' : ''}">${page.metaTitleLength}/${TITLE_LIMIT}</span>
             </div>
           </div>
           <div class="page-list-meta-metric ${page.titleOverPixels ? 'metric--warning' : 'metric--good'}">
             <span class="page-list-meta-metric__icon">${page.titleOverPixels ? '⚠️' : '✓'}</span>
             <div class="page-list-meta-metric__info">
               <span class="page-list-meta-metric__label">Pixels</span>
               <span class="page-list-meta-metric__value ${page.titleOverPixels ? 'value--over' : ''}">${Math.round(page.titlePixels)}/${TITLE_PIXEL_LIMIT_DESKTOP}</span>
             </div>
           </div>
         </div>
       </div>`
    : `<div class="page-list-meta-missing">
         <span class="page-list-meta-missing__icon">✗</span>
         <span class="page-list-meta-missing__text">Missing Meta Title</span>
       </div>`;

  const metaDescHtml = page.hasMetaDescription
    ? `<div class="page-list-meta-content-wrapper">
         <div class="page-list-meta-content">${escapeHtml(truncate(page.metaDescription, 150))}</div>
         <div class="page-list-meta-metrics">
           <div class="page-list-meta-metric ${page.descriptionOverLimit || page.descriptionOverPixels ? 'metric--warning' : 'metric--good'}">
             <span class="page-list-meta-metric__icon">${page.descriptionOverLimit || page.descriptionOverPixels ? '⚠️' : '✓'}</span>
             <div class="page-list-meta-metric__info">
               <span class="page-list-meta-metric__label">Characters</span>
               <span class="page-list-meta-metric__value ${page.descriptionOverLimit ? 'value--over' : ''}">${page.metaDescriptionLength}/${DESC_LIMIT}</span>
             </div>
           </div>
           <div class="page-list-meta-metric ${page.descriptionOverPixels ? 'metric--warning' : 'metric--good'}">
             <span class="page-list-meta-metric__icon">${page.descriptionOverPixels ? '⚠️' : '✓'}</span>
             <div class="page-list-meta-metric__info">
               <span class="page-list-meta-metric__label">Pixels</span>
               <span class="page-list-meta-metric__value ${page.descriptionOverPixels ? 'value--over' : ''}">${Math.round(page.descriptionPixels)}/${DESC_PIXEL_LIMIT_DESKTOP}</span>
             </div>
           </div>
         </div>
       </div>`
    : `<div class="page-list-meta-missing">
         <span class="page-list-meta-missing__icon">✗</span>
         <span class="page-list-meta-missing__text">Missing Meta Description</span>
       </div>`;

  const summaryHtml = page.summary
    ? escapeHtml(truncate(page.summary, 200))
    : '<em>No summary available</em>';

  const scoresHtml = `
    <div class="page-list-row-scores">
      ${renderScore(page.seoScore, 'SEO')}
      ${renderScore(page.aiCrawlabilityScore, 'AI')}
      ${page.accessibilityScore !== undefined && page.accessibilityScore !== null ? renderScore(page.accessibilityScore, 'A11y') : ''}
    </div>
  `;

  return `
    <tr class="${statusClass} page-list-row" data-page-url="${page.relPermalink}">
      <td>
        <div class="page-list-title-cell">
          <strong>${escapeHtml(page.title)}</strong>
          ${badgesHtml}
        </div>
      </td>
      <td data-label="Meta Title">
        <div class="page-list-meta-field ${page.titleOverLimit ? 'page-list-meta-field--over-limit' : ''}">
          ${metaTitleHtml}
        </div>
      </td>
      <td data-label="Meta Description">
        <div class="page-list-meta-field ${page.descriptionOverLimit ? 'page-list-meta-field--over-limit' : ''}">
          ${metaDescHtml}
        </div>
      </td>
      <td data-label="Summary">
        <div class="page-list-summary-content">
          ${summaryHtml}
        </div>
      </td>
      <td data-label="Scores">
        ${scoresHtml}
      </td>
      <td data-label="Page Link">
        <a href="${page.relPermalink}" target="_blank" rel="noopener noreferrer">
          ${page.relPermalink}
        </a>
      </td>
    </tr>
  `;
}

/**
 * Sort pages based on sort type and direction
 */
function sortPages(pages: PageData[], sortType: string, sortDirection: 'asc' | 'desc'): PageData[] {
  const sorted = [...pages];
  
  switch (sortType) {
    case 'seo':
      sorted.sort((a, b) => {
        const diff = a.seoScore - b.seoScore;
        return sortDirection === 'asc' ? diff : -diff;
      });
      break;
    case 'ai':
      sorted.sort((a, b) => {
        const diff = a.aiCrawlabilityScore - b.aiCrawlabilityScore;
        return sortDirection === 'asc' ? diff : -diff;
      });
      break;
    case 'title':
      sorted.sort((a, b) => {
        const diff = a.title.localeCompare(b.title);
        return sortDirection === 'asc' ? diff : -diff;
      });
      break;
    case 'accessibility':
      sorted.sort((a, b) => {
        const scoreA = a.accessibilityScore ?? 0;
        const scoreB = b.accessibilityScore ?? 0;
        const diff = scoreA - scoreB;
        return sortDirection === 'asc' ? diff : -diff;
      });
      break;
    default:
      // Default: sort by title ascending
      sorted.sort((a, b) => a.title.localeCompare(b.title));
  }
  
  return sorted;
}

/**
 * Group pages by section
 */
function groupPagesBySection(pages: PageData[], sortType: string = 'title', sortDirection: 'asc' | 'desc' = 'asc'): Map<string, PageData[]> {
  const groups = new Map<string, PageData[]>();

  pages.forEach(page => {
    const section = page.section || 'root';
    if (!groups.has(section)) {
      groups.set(section, []);
    }
    groups.get(section)!.push(page);
  });

  // Sort pages within each group
  groups.forEach((groupPages) => {
    const sorted = sortPages(groupPages, sortType, sortDirection);
    groupPages.length = 0;
    groupPages.push(...sorted);
  });

  return groups;
}

/**
 * Get column headers based on active filter
 */
function getTableHeaders(filterType: string, compact: boolean = false): string {
  const getHeaderLabel = (defaultLabel: string, filterType: string): string => {
    const filterLabels: Record<string, Record<string, string>> = {
      'missing-title': { 'Meta Title': 'Missing Title' },
      'missing-description': { 'Meta Description': 'Missing Description' },
      'missing-meta': { 'Meta Title': 'Missing Title', 'Meta Description': 'Missing Description' },
      'title-over-limit': { 'Meta Title': 'Title Issues' },
      'description-over-limit': { 'Meta Description': 'Description Issues' },
      'meta-issues': { 'Meta Title': 'Title Issues', 'Meta Description': 'Description Issues' },
      'pixel-issues': { 'Meta Title': 'Pixel Issues', 'Meta Description': 'Pixel Issues' },
      'broken-links': { 'Page Title': 'Pages with Broken Links' },
      'broken-images': { 'Page Title': 'Pages with Broken Images' },
      'images-no-alt': { 'Page Title': 'Pages w/o Alt Text' },
      'heading-structure': { 'Page Title': 'Heading Issues' },
      'no-schema': { 'Page Title': 'Missing Schema' },
      'low-word-count': { 'Summary': 'Low Word Count' },
      'no-citations': { 'Page Title': 'No Citations' },
      'no-author': { 'Page Title': 'No Author' },
      'stale-content': { 'Page Title': 'Stale Content' },
      'excerpt-too-short': { 'Summary': 'Excerpt Too Short' },
      'excerpt-too-long': { 'Summary': 'Excerpt Too Long' },
      'with-issues': { 'Page Title': 'Pages with Issues' },
      'good': { 'Page Title': 'Good Pages' }
    };
    
    return filterLabels[filterType]?.[defaultLabel] || defaultLabel;
  };

  // Special handling for broken links and images - show relevant columns
  if (filterType === 'broken-links') {
    if (compact) {
      return `<tr><th>Page Title</th><th>Broken Links</th><th>Actions</th><th>Scores</th><th>Link</th></tr>`;
    } else {
      return `<tr><th>Page Title</th><th>Broken Links</th><th>Actions</th><th>Scores</th><th>Page Link</th></tr>`;
    }
  }
  
  if (filterType === 'broken-images') {
    if (compact) {
      return `<tr><th>Page Title</th><th>Broken Images</th><th>Actions</th><th>Scores</th><th>Link</th></tr>`;
    } else {
      return `<tr><th>Page Title</th><th>Broken Images</th><th>Actions</th><th>Scores</th><th>Page Link</th></tr>`;
    }
  }

  if (compact) {
    const title = getHeaderLabel('Page Title', filterType);
    const metaTitle = getHeaderLabel('Meta Title', filterType);
    const metaDesc = getHeaderLabel('Meta Description', filterType);
    return `<tr><th>${title}</th><th>${metaTitle}</th><th>${metaDesc}</th><th>Scores</th><th>Link</th></tr>`;
  } else {
    const title = getHeaderLabel('Page Title', filterType);
    const metaTitle = getHeaderLabel('Meta Title', filterType);
    const metaDesc = getHeaderLabel('Meta Description', filterType);
    const summary = getHeaderLabel('Summary', filterType);
    return `<tr><th>${title}</th><th>${metaTitle}</th><th>${metaDesc}</th><th>${summary}</th><th>Scores</th><th>Page Link</th></tr>`;
  }
}

/**
 * Render ungrouped pages (all in one list)
 */
function renderUngroupedPages(pages: PageData[], compact: boolean = false, sortType: string = 'title', sortDirection: 'asc' | 'desc' = 'asc', filterType: string = 'all'): string {
  const tableHeaders = getTableHeaders(filterType, compact);

  // Sort pages based on sort type and direction
  const sortedPages = sortPages(pages, sortType, sortDirection);

  return `
    <div class="page-list-group">
      <table class="page-list-table">
        <thead>
          ${tableHeaders}
        </thead>
        <tbody>
          ${sortedPages.map(p => renderPageRow(p, compact, filterType)).join('')}
        </tbody>
      </table>
    </div>
  `;
}

/**
 * ============================================================================
 * COMPREHENSIVE SCHEMA.ORG VALIDATION SYSTEM
 * ============================================================================
 * 
 * Architecture Overview:
 * 
 * 1. PARSING LAYER
 *    - extractAllSchemasFromHTML(): Main entry point, extracts all formats
 *    - extractJSONLDSchemas(): Parses JSON-LD script tags
 *    - extractMicrodataSchemas(): Parses Microdata attributes
 *    - extractRDFaSchemas(): Parses RDFa attributes
 * 
 * 2. VALIDATION LAYER
 *    - validateAllSchemas(): Orchestrates validation for all schemas
 *    - validateSchema(): Core validation logic
 *    - validateSyntax(): JSON/HTML syntax validation
 *    - validateStructure(): Structure and format validation
 *    - validateTypes(): Type hierarchy and appropriateness
 *    - validateProperties(): Required/recommended property checks
 *    - validateDataTypes(): Data type validation (URLs, dates, numbers)
 *    - validateContentAccuracy(): Cross-check with visible page content
 *    - validateBestPractices(): Best practices and optimization checks
 * 
 * 3. SCORING LAYER
 *    - calculateSchemaScore(): Comprehensive scoring with breakdown
 * 
 * 4. RECOMMENDATION LAYER
 *    - generateRecommendations(): Actionable improvement suggestions
 * 
 * ============================================================================
 */

/**
 * Schema.org Type Hierarchy and Property Definitions
 */
const SCHEMA_TYPE_DEFINITIONS: Record<string, SchemaTypeInfo> = {
  'Thing': {
    type: 'Thing',
    required: [],
    recommended: ['name', 'description', 'url', 'image'],
    properties: {},
    isGeneric: true,
    alternatives: []
  },
  'LocalBusiness': {
    type: 'LocalBusiness',
    parent: 'Organization',
    required: ['name'],
    recommended: ['address', 'telephone', 'priceRange', 'image', 'openingHours', 'geo'],
    properties: {
      'name': { name: 'name', required: true, recommended: true, dataType: 'Text' },
      'address': { name: 'address', required: false, recommended: true, dataType: 'PostalAddress' },
      'telephone': { name: 'telephone', required: false, recommended: true, dataType: 'Text' },
      'priceRange': { name: 'priceRange', required: false, recommended: true, dataType: 'Text' },
      'image': { name: 'image', required: false, recommended: true, dataType: 'URL' },
      'openingHours': { name: 'openingHours', required: false, recommended: true, dataType: 'Text' }
    },
    isGeneric: false,
    alternatives: ['Organization', 'Place']
  },
  'Organization': {
    type: 'Organization',
    parent: 'Thing',
    required: ['name'],
    recommended: ['url', 'logo', 'sameAs', 'contactPoint'],
    properties: {
      'name': { name: 'name', required: true, recommended: true, dataType: 'Text' },
      'url': { name: 'url', required: false, recommended: true, dataType: 'URL' },
      'logo': { name: 'logo', required: false, recommended: true, dataType: 'ImageObject' },
      'sameAs': { name: 'sameAs', required: false, recommended: true, dataType: 'URL' }
    },
    isGeneric: false,
    alternatives: ['LocalBusiness', 'Corporation']
  },
  'Article': {
    type: 'Article',
    parent: 'CreativeWork',
    required: ['headline'],
    recommended: ['datePublished', 'dateModified', 'author', 'publisher', 'image', 'description'],
    properties: {
      'headline': { name: 'headline', required: true, recommended: true, dataType: 'Text' },
      'datePublished': { name: 'datePublished', required: false, recommended: true, dataType: 'Date' },
      'dateModified': { name: 'dateModified', required: false, recommended: true, dataType: 'Date' },
      'author': { name: 'author', required: false, recommended: true, dataType: 'Person' },
      'publisher': { name: 'publisher', required: false, recommended: true, dataType: 'Organization' },
      'image': { name: 'image', required: false, recommended: true, dataType: 'ImageObject' }
    },
    isGeneric: false,
    alternatives: ['NewsArticle', 'BlogPosting', 'ScholarlyArticle']
  },
  'WebPage': {
    type: 'WebPage',
    parent: 'CreativeWork',
    required: ['name'],
    recommended: ['description', 'url', 'breadcrumb', 'mainEntity'],
    properties: {
      'name': { name: 'name', required: true, recommended: true, dataType: 'Text' },
      'description': { name: 'description', required: false, recommended: true, dataType: 'Text' },
      'url': { name: 'url', required: false, recommended: true, dataType: 'URL' }
    },
    isGeneric: false,
    alternatives: ['AboutPage', 'ContactPage', 'FAQPage']
  },
  'Product': {
    type: 'Product',
    parent: 'Thing',
    required: ['name'],
    recommended: ['image', 'description', 'brand', 'offers', 'aggregateRating'],
    properties: {
      'name': { name: 'name', required: true, recommended: true, dataType: 'Text' },
      'image': { name: 'image', required: false, recommended: true, dataType: 'ImageObject' },
      'description': { name: 'description', required: false, recommended: true, dataType: 'Text' },
      'brand': { name: 'brand', required: false, recommended: true, dataType: 'Brand' },
      'offers': { name: 'offers', required: false, recommended: true, dataType: 'Offer' }
    },
    isGeneric: false,
    alternatives: []
  },
  'Service': {
    type: 'Service',
    parent: 'Thing',
    required: ['name', 'serviceType'],
    recommended: ['description', 'provider', 'areaServed', 'offers'],
    properties: {
      'name': { name: 'name', required: true, recommended: true, dataType: 'Text' },
      'serviceType': { name: 'serviceType', required: true, recommended: true, dataType: 'Text' },
      'description': { name: 'description', required: false, recommended: true, dataType: 'Text' },
      'provider': { name: 'provider', required: false, recommended: true, dataType: 'Organization' }
    },
    isGeneric: false,
    alternatives: []
  },
  'Person': {
    type: 'Person',
    parent: 'Thing',
    required: ['name'],
    recommended: ['email', 'jobTitle', 'image', 'sameAs'],
    properties: {
      'name': { name: 'name', required: true, recommended: true, dataType: 'Text' },
      'email': { name: 'email', required: false, recommended: true, dataType: 'Text' },
      'jobTitle': { name: 'jobTitle', required: false, recommended: true, dataType: 'Text' }
    },
    isGeneric: false,
    alternatives: []
  },
  'Event': {
    type: 'Event',
    parent: 'Thing',
    required: ['name', 'startDate'],
    recommended: ['endDate', 'location', 'description', 'image'],
    properties: {
      'name': { name: 'name', required: true, recommended: true, dataType: 'Text' },
      'startDate': { name: 'startDate', required: true, recommended: true, dataType: 'DateTime' },
      'endDate': { name: 'endDate', required: false, recommended: true, dataType: 'DateTime' },
      'location': { name: 'location', required: false, recommended: true, dataType: 'Place' }
    },
    isGeneric: false,
    alternatives: ['BusinessEvent', 'SportsEvent']
  },
  'FAQPage': {
    type: 'FAQPage',
    parent: 'WebPage',
    required: [],
    recommended: ['mainEntity'],
    properties: {
      'mainEntity': { name: 'mainEntity', required: false, recommended: true, dataType: 'Question' }
    },
    isGeneric: false,
    alternatives: []
  },
  'Recipe': {
    type: 'Recipe',
    parent: 'CreativeWork',
    required: ['name'],
    recommended: ['image', 'recipeIngredient', 'recipeInstructions', 'prepTime', 'cookTime', 'totalTime'],
    properties: {
      'name': { name: 'name', required: true, recommended: true, dataType: 'Text' },
      'image': { name: 'image', required: false, recommended: true, dataType: 'ImageObject' },
      'recipeIngredient': { name: 'recipeIngredient', required: false, recommended: true, dataType: 'Text' },
      'recipeInstructions': { name: 'recipeInstructions', required: false, recommended: true, dataType: 'HowToStep' }
    },
    isGeneric: false,
    alternatives: []
  },
  'VideoObject': {
    type: 'VideoObject',
    parent: 'MediaObject',
    required: ['name'],
    recommended: ['thumbnailUrl', 'uploadDate', 'duration', 'description', 'contentUrl'],
    properties: {
      'name': { name: 'name', required: true, recommended: true, dataType: 'Text' },
      'thumbnailUrl': { name: 'thumbnailUrl', required: false, recommended: true, dataType: 'URL' },
      'uploadDate': { name: 'uploadDate', required: false, recommended: true, dataType: 'Date' },
      'duration': { name: 'duration', required: false, recommended: true, dataType: 'Duration' }
    },
    isGeneric: false,
    alternatives: []
  }
};

/**
 * Extract all schemas from HTML (JSON-LD, Microdata, RDFa)
 */
function extractAllSchemasFromHTML(html: string): Array<{ 
  type: string; 
  format: 'json-ld' | 'microdata' | 'rdfa';
  data: any; 
  raw: string;
  index: number;
}> {
  const schemas: Array<{ type: string; format: 'json-ld' | 'microdata' | 'rdfa'; data: any; raw: string; index: number }> = [];
  let index = 0;
  
  // Extract JSON-LD
  const jsonLdSchemas = extractJSONLDSchemas(html);
  jsonLdSchemas.forEach(schema => {
    schemas.push({ ...schema, format: 'json-ld', index: index++ });
  });
  
  // Extract Microdata
  const microdataSchemas = extractMicrodataSchemas(html);
  microdataSchemas.forEach(schema => {
    schemas.push({ ...schema, format: 'microdata', index: index++ });
  });
  
  // Extract RDFa
  const rdfaSchemas = extractRDFaSchemas(html);
  rdfaSchemas.forEach(schema => {
    schemas.push({ ...schema, format: 'rdfa', index: index++ });
  });
  
  return schemas;
}

/**
 * Extract JSON-LD schema from HTML content
 */
function extractJSONLDSchemas(html: string): Array<{ type: string; data: any; raw: string }> {
  const schemas: Array<{ type: string; data: any; raw: string }> = [];
  
  // Match all JSON-LD script tags
  const jsonLdRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>(.*?)<\/script>/gis;
  let match;
  
  while ((match = jsonLdRegex.exec(html)) !== null) {
    try {
      const jsonContent = match[1].trim();
      const parsed = JSON.parse(jsonContent);
      
      // Handle both single objects and arrays
      const items = Array.isArray(parsed) ? parsed : [parsed];
      
      items.forEach((item: any) => {
        if (item && typeof item === 'object') {
          if (item['@type']) {
            schemas.push({
              type: item['@type'],
              data: item,
              raw: jsonContent
            });
          } else if (item['@context']) {
            // Handle top-level objects with @context (Graph format)
            if (item['@graph'] && Array.isArray(item['@graph'])) {
              item['@graph'].forEach((graphItem: any) => {
                if (graphItem['@type']) {
                  schemas.push({
                    type: graphItem['@type'],
                    data: graphItem,
                    raw: jsonContent
                  });
                }
              });
            }
          }
        }
      });
    } catch (error) {
      devWarn('Failed to parse JSON-LD schema:', error);
    }
  }
  
  return schemas;
}

/**
 * Extract Microdata schema from HTML content
 */
function extractMicrodataSchemas(html: string): Array<{ type: string; data: any; raw: string }> {
  const schemas: Array<{ type: string; data: any; raw: string }> = [];
  
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Find all elements with itemscope
    const itemScopeElements = doc.querySelectorAll('[itemscope]');
    
    itemScopeElements.forEach((element) => {
      const itemType = element.getAttribute('itemtype');
      if (!itemType) return;
      
      // Extract Schema.org type from URL (e.g., http://schema.org/Product -> Product)
      const typeMatch = itemType.match(/schema\.org\/([^\/\#]+)/i);
      if (!typeMatch) return;
      
      const schemaType = typeMatch[1];
      const schemaData: any = {
        '@type': schemaType
      };
      
      // Extract all itemprop attributes within this itemscope
      const itemProps = element.querySelectorAll('[itemprop]');
      itemProps.forEach((propElement) => {
        const propName = propElement.getAttribute('itemprop');
        if (!propName) return;
        
        // Get the value
        let propValue: string | null = null;
        if (propElement.hasAttribute('content')) {
          propValue = propElement.getAttribute('content');
        } else if (propElement.hasAttribute('href')) {
          propValue = propElement.getAttribute('href');
        } else if (propElement.hasAttribute('src')) {
          propValue = propElement.getAttribute('src');
        } else if (propElement.hasAttribute('datetime')) {
          propValue = propElement.getAttribute('datetime');
        } else {
          propValue = propElement.textContent?.trim() || null;
        }
        
        if (propValue !== null) {
          // Handle nested itemscope
          const nestedScope = propElement.querySelector('[itemscope]');
          if (nestedScope) {
            // Recursively extract nested schema (simplified)
            schemaData[propName] = { '@type': nestedScope.getAttribute('itemtype')?.match(/schema\.org\/([^\/\#]+)/i)?.[1] || 'Thing' };
          } else {
            schemaData[propName] = propValue;
          }
        }
      });
      
      schemas.push({
        type: schemaType,
        data: schemaData,
        raw: element.outerHTML.substring(0, 500) // Store first 500 chars as raw
      });
    });
  } catch (error) {
    devWarn('Failed to parse Microdata:', error);
  }
  
  return schemas;
}

/**
 * Extract RDFa schema from HTML content
 */
function extractRDFaSchemas(html: string): Array<{ type: string; data: any; raw: string }> {
  const schemas: Array<{ type: string; data: any; raw: string }> = [];
  
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Find all elements with typeof
    const typeofElements = doc.querySelectorAll('[typeof]');
    
    typeofElements.forEach((element) => {
      const typeofValue = element.getAttribute('typeof');
      if (!typeofValue) return;
      
      // Extract Schema.org type (e.g., schema:Product -> Product)
      const typeMatch = typeofValue.match(/schema:([^\s]+)/i) || typeofValue.match(/schema\.org\/([^\/\#\s]+)/i);
      if (!typeMatch) return;
      
      const schemaType = typeMatch[1];
      const schemaData: any = {
        '@type': schemaType
      };
      
      // Extract all property attributes
      const properties = element.querySelectorAll('[property]');
      properties.forEach((propElement) => {
        const propName = propElement.getAttribute('property');
        if (!propName) return;
        
        // Clean property name (remove schema: prefix)
        const cleanPropName = propName.replace(/^schema:/i, '').replace(/^http:\/\/schema\.org\//i, '');
        
        // Get the value
        let propValue: string | null = null;
        if (propElement.hasAttribute('content')) {
          propValue = propElement.getAttribute('content');
        } else if (propElement.hasAttribute('href')) {
          propValue = propElement.getAttribute('href');
        } else if (propElement.hasAttribute('src')) {
          propValue = propElement.getAttribute('src');
        } else {
          propValue = propElement.textContent?.trim() || null;
        }
        
        if (propValue !== null) {
          schemaData[cleanPropName] = propValue;
        }
      });
      
      schemas.push({
        type: schemaType,
        data: schemaData,
        raw: element.outerHTML.substring(0, 500) // Store first 500 chars as raw
      });
    });
  } catch (error) {
    devWarn('Failed to parse RDFa:', error);
  }
  
  return schemas;
}

/**
 * Get Schema.org type definition
 */
function getSchemaTypeInfo(type: string): SchemaTypeInfo | null {
  return SCHEMA_TYPE_DEFINITIONS[type] || null;
}

/**
 * Check if a type is generic (like "Thing")
 */
function isGenericType(type: string): boolean {
  const typeInfo = getSchemaTypeInfo(type);
  return typeInfo?.isGeneric || type === 'Thing';
}

/**
 * Validate JSON syntax
 */
function validateJSONSyntax(jsonString: string): { valid: boolean; error?: SchemaValidationError } {
  try {
    JSON.parse(jsonString);
    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: {
        type: 'error',
        severity: 'critical',
        message: `Invalid JSON syntax: ${error instanceof Error ? error.message : 'Unknown error'}`,
        code: 'INVALID_JSON'
      }
    };
  }
}

/**
 * Validate data types (URLs, dates, numbers, booleans, enumerations)
 */
function validateDataType(value: any, expectedType: string, propertyName: string): SchemaValidationError | null {
  if (value === null || value === undefined) return null;
  
  switch (expectedType.toLowerCase()) {
    case 'url':
    case 'urlorlink':
      if (typeof value === 'string') {
        try {
          const url = typeof value === 'object' && value['@id'] ? value['@id'] : value;
          new URL(url);
          // Check if it's absolute
          if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('/')) {
            return {
              type: 'warning',
              severity: 'medium',
              message: `Relative URL in "${propertyName}" - prefer absolute URLs for better compatibility`,
              property: propertyName,
              actual: url,
              expected: 'Absolute URL (https://...)'
            };
          }
        } catch {
          return {
            type: 'error',
            severity: 'high',
            message: `Invalid URL in property "${propertyName}": ${value}`,
            property: propertyName,
            actual: String(value),
            expected: 'Valid URL'
          };
        }
      }
      break;
      
    case 'date':
    case 'datetime':
    case 'datepublished':
    case 'datemodified':
    case 'datecreated':
    case 'startdate':
    case 'enddate':
    case 'dateposted':
      if (typeof value === 'string') {
        const date = new Date(value);
        if (isNaN(date.getTime())) {
          return {
            type: 'error',
            severity: 'high',
            message: `Invalid date format in property "${propertyName}": ${value}`,
            property: propertyName,
            actual: value,
            expected: 'ISO 8601 date format (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ssZ)',
            suggestion: 'Use ISO 8601 format, e.g., "2024-01-15" or "2024-01-15T10:30:00Z"'
          };
        }
        // Check if date is in the future (for published dates, might be suspicious)
        if ((propertyName.includes('Published') || propertyName.includes('Posted')) && date > new Date()) {
          return {
            type: 'warning',
            severity: 'medium',
            message: `Future date in "${propertyName}" - ensure this is intentional`,
            property: propertyName,
            actual: value
          };
        }
      }
      break;
      
    case 'number':
    case 'integer':
    case 'float':
      if (typeof value !== 'number' && (typeof value === 'string' && isNaN(Number(value)))) {
        return {
          type: 'error',
          severity: 'high',
          message: `Invalid number in property "${propertyName}": ${value}`,
          property: propertyName,
          actual: String(value),
          expected: 'Number'
        };
      }
      break;
      
    case 'boolean':
      if (typeof value !== 'boolean' && value !== 'true' && value !== 'false') {
        return {
          type: 'warning',
          severity: 'low',
          message: `Boolean property "${propertyName}" should be true/false, not: ${value}`,
          property: propertyName,
          actual: String(value),
          expected: 'true or false'
        };
      }
      break;
  }
  
  return null;
}

/**
 * Comprehensive schema validation function
 */
function validateSchemaComprehensive(
  schema: any, 
  schemaType: string, 
  format: 'json-ld' | 'microdata' | 'rdfa',
  schemaIndex: number
): SchemaValidationIssue {
  const errors: SchemaValidationError[] = [];
  const warnings: SchemaValidationError[] = [];
  const recommendations: SchemaValidationError[] = [];
  
  // 1. Syntax Validation (JSON-LD only)
  // Note: schema is the data object, not the extracted object with raw property
  // JSON syntax validation happens during extraction, so we skip it here
  
  // 2. Type Validation
  if (!schema['@type'] && !schemaType) {
    errors.push({
      type: 'error',
      severity: 'critical',
      message: 'Missing required property: @type',
      property: '@type',
      code: 'MISSING_TYPE'
    });
    return {
      schemaType: 'Unknown',
      format,
      schemaIndex,
      errors,
      warnings,
      recommendations,
      isValid: false,
      rawSchema: schema,
      schemaString: JSON.stringify(schema, null, 2)
    };
  }
  
  const finalType = schema['@type'] || schemaType;
  const typeInfo = getSchemaTypeInfo(finalType);
  
  // Check for generic types
  if (isGenericType(finalType)) {
    warnings.push({
      type: 'warning',
      severity: 'medium',
      message: `Using generic type "${finalType}" - consider using a more specific type`,
      property: '@type',
      actual: finalType,
      suggestion: typeInfo?.alternatives?.length ? `Consider: ${typeInfo.alternatives.join(', ')}` : 'Use a more specific Schema.org type'
    });
  }
  
  // 3. Structure Validation (JSON-LD specific)
  if (format === 'json-ld') {
    if (!schema['@context']) {
      warnings.push({
        type: 'warning',
        severity: 'low',
        message: 'Missing @context property (recommended for Schema.org)',
        property: '@context',
        expected: 'https://schema.org',
        suggestion: 'Add "@context": "https://schema.org" to your JSON-LD'
      });
    } else if (schema['@context'] !== 'https://schema.org' && schema['@context'] !== 'http://schema.org') {
      warnings.push({
        type: 'warning',
        severity: 'medium',
        message: `Unexpected @context value: ${schema['@context']}`,
        property: '@context',
        actual: schema['@context'],
        expected: 'https://schema.org',
        suggestion: 'Use "https://schema.org" for the @context'
      });
    }
  }
  
  // 4. Property Completeness Validation
  if (typeInfo) {
    // Check required properties
    typeInfo.required.forEach(propName => {
      const propValue = schema[propName];
      if (!propValue || (typeof propValue === 'string' && propValue.trim() === '')) {
        errors.push({
          type: 'error',
          severity: 'high',
          message: `Missing required property: ${propName}`,
          property: propName,
          expected: 'non-empty value',
          code: 'MISSING_REQUIRED_PROPERTY',
          suggestion: `Add "${propName}" property to your schema`
        });
      } else {
        // Validate empty strings
        if (typeof propValue === 'string' && propValue.trim() === '') {
          errors.push({
            type: 'error',
            severity: 'high',
            message: `Required property "${propName}" is empty`,
            property: propName,
            expected: 'non-empty value'
          });
        }
      }
    });
    
    // Check recommended properties
    typeInfo.recommended.forEach(propName => {
      if (!schema[propName]) {
        recommendations.push({
          type: 'info',
          severity: 'low',
          message: `Recommended property "${propName}" is missing`,
          property: propName,
          suggestion: `Consider adding "${propName}" to improve schema completeness`
        });
      }
    });
  }
  
  // 5. Data Type Validation
  const urlProperties = ['url', 'image', 'logo', 'sameAs', 'thumbnailUrl', 'contentUrl'];
  urlProperties.forEach(prop => {
    if (schema[prop]) {
      const url = typeof schema[prop] === 'string' ? schema[prop] : 
                  (schema[prop]['@id'] || schema[prop]['url'] || schema[prop]);
      const urlError = validateDataType(url, 'url', prop);
      if (urlError) {
        if (urlError.type === 'error') errors.push(urlError);
        else warnings.push(urlError);
      }
    }
  });
  
  const dateProperties = ['datePublished', 'dateModified', 'dateCreated', 'startDate', 'endDate', 'datePosted', 'uploadDate'];
  dateProperties.forEach(prop => {
    if (schema[prop]) {
      const dateError = validateDataType(schema[prop], 'date', prop);
      if (dateError) {
        if (dateError.type === 'error') errors.push(dateError);
        else warnings.push(dateError);
      }
    }
  });
  
  // 6. Common Property Validation
  if (schema['name'] && typeof schema['name'] === 'string' && schema['name'].trim().length === 0) {
    warnings.push({
      type: 'warning',
      severity: 'medium',
      message: 'Property "name" is empty',
      property: 'name',
      suggestion: 'Provide a meaningful name'
    });
  }
  
  if (schema['description'] && typeof schema['description'] === 'string' && schema['description'].trim().length === 0) {
    warnings.push({
      type: 'warning',
      severity: 'low',
      message: 'Property "description" is empty',
      property: 'description',
      suggestion: 'Provide a description to improve SEO'
    });
  }
  
  // 7. Best Practices
  if (format !== 'json-ld') {
    recommendations.push({
      type: 'info',
      severity: 'low',
      message: `Using ${format} format - JSON-LD is preferred for maintainability`,
      suggestion: 'Consider migrating to JSON-LD format'
    });
  }
  
  if (!schema['@id'] && (schema['url'] || schema['name'])) {
    recommendations.push({
      type: 'info',
      severity: 'low',
      message: 'Missing @id property - consider adding for uniqueness',
      property: '@id',
      suggestion: 'Add "@id" with a canonical URL for better referencing'
    });
  }
  
  return {
    schemaType: finalType,
    format,
    schemaIndex,
    errors,
    warnings,
    recommendations,
    isValid: errors.length === 0,
    rawSchema: schema,
    schemaString: typeof schema === 'string' ? schema : JSON.stringify(schema, null, 2)
  };
}

/**
 * Cross-check schema values with visible page content
 */
function crossCheckContentWithSchema(html: string, schema: any): ContentMatch[] {
  const matches: ContentMatch[] = [];
  
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const bodyText = doc.body?.textContent?.toLowerCase() || '';
    
    // Check name/title
    if (schema['name'] || schema['headline']) {
      const schemaName = (schema['name'] || schema['headline']).toLowerCase().trim();
      const h1Text = doc.querySelector('h1')?.textContent?.toLowerCase().trim() || '';
      const titleMatch = h1Text.includes(schemaName) || schemaName.includes(h1Text);
      
      matches.push({
        property: schema['name'] ? 'name' : 'headline',
        schemaValue: schema['name'] || schema['headline'],
        pageValue: h1Text || undefined,
        matches: titleMatch,
        confidence: titleMatch ? 0.9 : 0.1,
        location: 'h1'
      });
    }
    
    // Check description
    if (schema['description']) {
      const schemaDesc = schema['description'].toLowerCase().trim();
      const metaDesc = doc.querySelector('meta[name="description"]')?.getAttribute('content')?.toLowerCase() || '';
      const firstPara = doc.querySelector('p')?.textContent?.toLowerCase().trim() || '';
      const descMatch = metaDesc.includes(schemaDesc) || schemaDesc.includes(metaDesc) || 
                       firstPara.includes(schemaDesc.substring(0, 100));
      
      matches.push({
        property: 'description',
        schemaValue: schema['description'],
        pageValue: metaDesc || firstPara.substring(0, 100) || undefined,
        matches: descMatch,
        confidence: descMatch ? 0.8 : 0.2,
        location: metaDesc ? 'meta description' : 'first paragraph'
      });
    }
    
    // Check price (for Product)
    if (schema['offers'] && schema['offers']['price']) {
      const schemaPrice = String(schema['offers']['price']).replace(/[^0-9.]/g, '');
      const priceElements = doc.querySelectorAll('[class*="price"], [id*="price"], .price, #price');
      let priceMatch = false;
      let pagePrice = '';
      
      priceElements.forEach(el => {
        const elText = el.textContent?.replace(/[^0-9.]/g, '') || '';
        if (elText.includes(schemaPrice) || schemaPrice.includes(elText)) {
          priceMatch = true;
          pagePrice = el.textContent || '';
        }
      });
      
      matches.push({
        property: 'price',
        schemaValue: String(schema['offers']['price']),
        pageValue: pagePrice || undefined,
        matches: priceMatch,
        confidence: priceMatch ? 0.85 : 0.1,
        location: 'price element'
      });
    }
  } catch (error) {
    devWarn('Content cross-checking error:', error);
  }
  
  return matches;
}

/**
 * Check for hidden content in schema
 */
function checkForHiddenContent(html: string, schemaFormat: 'json-ld' | 'microdata' | 'rdfa'): boolean {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    if (schemaFormat === 'microdata' || schemaFormat === 'rdfa') {
      const schemaElements = schemaFormat === 'microdata' 
        ? doc.querySelectorAll('[itemscope], [itemprop]')
        : doc.querySelectorAll('[typeof], [property]');
      
      for (const el of Array.from(schemaElements)) {
        const style = window.getComputedStyle(el as Element);
        if (style.display === 'none' || style.visibility === 'hidden' || 
            (el as HTMLElement).hidden || (el as HTMLElement).getAttribute('aria-hidden') === 'true') {
          return true;
        }
      }
    }
  } catch (error) {
    devWarn('Hidden content check error:', error);
  }
  
  return false;
}

/**
 * Calculate comprehensive schema score with breakdown
 */
function calculateSchemaScore(
  schemas: SchemaValidationIssue[],
  contentMatches: ContentMatch[],
  hasHiddenContent: boolean,
  hasMixedFormats: boolean,
  hasDuplicateTypes: boolean
): { score: number; breakdown: PageSchemaData['scoreBreakdown'] } {
  let syntaxScore = 100;
  let completenessScore = 100;
  let accuracyScore = 100;
  let bestPracticesScore = 100;
  
  // Syntax scoring (errors are critical)
  schemas.forEach(schema => {
    syntaxScore -= schema.errors.filter(e => e.severity === 'critical').length * 20;
    syntaxScore -= schema.errors.filter(e => e.severity === 'high').length * 15;
    syntaxScore -= schema.errors.filter(e => e.severity === 'medium').length * 10;
    syntaxScore -= schema.errors.filter(e => e.severity === 'low').length * 5;
  });
  
  // Completeness scoring (missing required properties)
  schemas.forEach(schema => {
    completenessScore -= schema.errors.filter(e => e.code === 'MISSING_REQUIRED_PROPERTY').length * 15;
    completenessScore -= schema.recommendations.length * 2;
  });
  
  // Accuracy scoring (content mismatches)
  const mismatches = contentMatches.filter(m => !m.matches);
  accuracyScore -= mismatches.length * 10;
  if (hasHiddenContent) accuracyScore -= 15;
  
  // Best practices scoring
  if (hasMixedFormats) bestPracticesScore -= 10;
  if (hasDuplicateTypes) bestPracticesScore -= 5;
  schemas.forEach(schema => {
    if (schema.format !== 'json-ld') bestPracticesScore -= 5;
    bestPracticesScore -= schema.warnings.filter(w => w.severity === 'medium').length * 3;
    bestPracticesScore -= schema.warnings.filter(w => w.severity === 'low').length * 1;
  });
  
  // Normalize scores to 0-100
  syntaxScore = Math.max(0, Math.min(100, syntaxScore));
  completenessScore = Math.max(0, Math.min(100, completenessScore));
  accuracyScore = Math.max(0, Math.min(100, accuracyScore));
  bestPracticesScore = Math.max(0, Math.min(100, bestPracticesScore));
  
  // Weighted overall score
  const overallScore = Math.round(
    syntaxScore * 0.3 +
    completenessScore * 0.3 +
    accuracyScore * 0.25 +
    bestPracticesScore * 0.15
  );
  
  return {
    score: overallScore,
    breakdown: {
      syntax: syntaxScore,
      completeness: completenessScore,
      accuracy: accuracyScore,
      bestPractices: bestPracticesScore
    }
  };
}

/**
 * Fetch and validate schema for a single page (comprehensive)
 */
async function validatePageSchema(page: PageData): Promise<PageSchemaData> {
  const pageUrl = `${window.location.origin}${page.relPermalink}`;
  
  try {
    const response = await fetch(pageUrl);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const html = await response.text();
    const extractedSchemas = extractAllSchemasFromHTML(html);
    
    if (extractedSchemas.length === 0) {
      return {
        pageUrl,
        pageTitle: page.title,
        relPermalink: page.relPermalink,
        hasSchema: false,
        schemaCount: 0,
        formatCounts: { jsonld: 0, microdata: 0, rdfa: 0 },
        schemas: [],
        overallValid: false,
        errorCount: 0,
        warningCount: 0,
        recommendationCount: 0,
        schemaTypes: [],
        missingRequiredProperties: [],
        contentMatches: [],
        hasContentMismatches: false,
        hasHiddenContent: false,
        hasDuplicateTypes: false,
        hasMixedFormats: false,
        score: 0,
        scoreBreakdown: { syntax: 0, completeness: 0, accuracy: 0, bestPractices: 0 },
        suggestions: []
      };
    }
    
    // Count formats
    const formatCounts = {
      jsonld: extractedSchemas.filter(s => s.format === 'json-ld').length,
      microdata: extractedSchemas.filter(s => s.format === 'microdata').length,
      rdfa: extractedSchemas.filter(s => s.format === 'rdfa').length
    };
    const hasMixedFormats = (formatCounts.jsonld > 0 ? 1 : 0) + 
                           (formatCounts.microdata > 0 ? 1 : 0) + 
                           (formatCounts.rdfa > 0 ? 1 : 0) > 1;
    
    // Validate each schema
    const validatedSchemas: SchemaValidationIssue[] = extractedSchemas.map(extracted => {
      const validated = validateSchemaComprehensive(extracted.data, extracted.type, extracted.format, extracted.index);
      // Preserve the raw string for display
      validated.schemaString = extracted.raw || JSON.stringify(extracted.data, null, 2);
      return validated;
    });
    
    // Check for duplicate types
    const typeCounts: Record<string, number> = {};
    validatedSchemas.forEach(s => {
      typeCounts[s.schemaType] = (typeCounts[s.schemaType] || 0) + 1;
    });
    const hasDuplicateTypes = Object.values(typeCounts).some(count => count > 1);
    
    // Cross-check content
    const allContentMatches: ContentMatch[] = [];
    validatedSchemas.forEach((schema, index) => {
      const extractedSchema = extractedSchemas[index];
      if (extractedSchema) {
        const matches = crossCheckContentWithSchema(html, extractedSchema.data);
        allContentMatches.push(...matches);
      }
    });
    const hasContentMismatches = allContentMatches.some(m => !m.matches);
    
    // Check for hidden content (only for inline formats)
    const hasHiddenContent = validatedSchemas.some(s => 
      (s.format === 'microdata' || s.format === 'rdfa') && checkForHiddenContent(html, s.format)
    );
    
    // Calculate scores
    const totalErrors = validatedSchemas.reduce((sum, s) => sum + s.errors.length, 0);
    const totalWarnings = validatedSchemas.reduce((sum, s) => sum + s.warnings.length, 0);
    const totalRecommendations = validatedSchemas.reduce((sum, s) => sum + s.recommendations.length, 0);
    const overallValid = validatedSchemas.every(s => s.isValid);
    
    const scoreResult = calculateSchemaScore(
      validatedSchemas,
      allContentMatches,
      hasHiddenContent,
      hasMixedFormats,
      hasDuplicateTypes
    );
    
    const schemaTypes = validatedSchemas.map(s => s.schemaType);
    const missingRequiredProperties: string[] = [];
    validatedSchemas.forEach(schema => {
      schema.errors.forEach(error => {
        if (error.property && error.code === 'MISSING_REQUIRED_PROPERTY' && 
            !missingRequiredProperties.includes(error.property)) {
          missingRequiredProperties.push(error.property);
        }
      });
    });
    
    // Generate suggestions
    const suggestions: string[] = [];
    if (totalErrors > 0) {
      suggestions.push(`Fix ${totalErrors} error${totalErrors !== 1 ? 's' : ''} in schema markup`);
    }
    if (hasMixedFormats) {
      suggestions.push('Consider using a single format (preferably JSON-LD) for consistency');
    }
    if (hasContentMismatches) {
      suggestions.push('Ensure schema values match visible page content');
    }
    if (hasHiddenContent) {
      suggestions.push('Remove schema markup from hidden content');
    }
    if (totalRecommendations > 0) {
      suggestions.push(`Consider adding ${totalRecommendations} recommended propert${totalRecommendations !== 1 ? 'ies' : 'y'}`);
    }
    
    return {
      pageUrl,
      pageTitle: page.title,
      relPermalink: page.relPermalink,
      hasSchema: true,
      schemaCount: validatedSchemas.length,
      formatCounts,
      schemas: validatedSchemas,
      overallValid,
      errorCount: totalErrors,
      warningCount: totalWarnings,
      recommendationCount: totalRecommendations,
      schemaTypes,
      missingRequiredProperties,
      contentMatches: allContentMatches,
      hasContentMismatches,
      hasHiddenContent,
      hasDuplicateTypes,
      hasMixedFormats,
      score: scoreResult.score,
      scoreBreakdown: scoreResult.breakdown,
      suggestions
    };
  } catch (error) {
    devError(`Failed to validate schema for ${pageUrl}:`, error);
    return {
      pageUrl,
      pageTitle: page.title,
      relPermalink: page.relPermalink,
      hasSchema: false,
      schemaCount: 0,
      formatCounts: { jsonld: 0, microdata: 0, rdfa: 0 },
      schemas: [],
      overallValid: false,
      errorCount: 0,
      warningCount: 0,
      recommendationCount: 0,
      schemaTypes: [],
      missingRequiredProperties: [],
      contentMatches: [],
      hasContentMismatches: false,
      hasHiddenContent: false,
      hasDuplicateTypes: false,
      hasMixedFormats: false,
      score: 0,
      scoreBreakdown: { syntax: 0, completeness: 0, accuracy: 0, bestPractices: 0 },
      suggestions: []
    };
  }
}

/**
 * Check if a page should be excluded from schema validation
 */
function shouldExcludeFromSchemaValidation(page: PageData): boolean {
  const relPermalink = page.relPermalink.toLowerCase();
  
  // Exclude system files and non-HTML pages
  const excludePatterns = [
    /\.txt$/i,           // Text files (llms.txt, robots.txt, etc.)
    /\.xml$/i,           // XML files (sitemap.xml, etc.)
    /\.json$/i,          // JSON files
    /\.csv$/i,           // CSV files
    /\.pdf$/i,           // PDF files
    /\/llms\.txt$/i,     // LLMs.txt file
    /\/robots\.txt$/i,   // Robots.txt file
    /\/sitemap/i,        // Sitemap files
    /\/feed/i,           // RSS/Atom feeds
    /\/search/i,         // Search pages (usually dynamic)
    /\/404/i,            // 404 pages
    /^\/page-list\//i    // Page list tool pages themselves
  ];
  
  return excludePatterns.some(pattern => pattern.test(relPermalink));
}

/**
 * Validate schema for all pages (excluding system files)
 */
async function validateAllPageSchemas(pages: PageData[], progressCallback?: (current: number, total: number) => void): Promise<PageSchemaData[]> {
  // Filter out pages that shouldn't have schema validation
  const pagesToValidate = pages.filter(page => !shouldExcludeFromSchemaValidation(page));
  const results: PageSchemaData[] = [];
  const total = pagesToValidate.length;
  
  for (let i = 0; i < pagesToValidate.length; i++) {
    const page = pagesToValidate[i];
    if (progressCallback) {
      progressCallback(i + 1, total);
    }
    
    const result = await validatePageSchema(page);
    results.push(result);
    
    // Small delay to avoid overwhelming the server
    if (i < pagesToValidate.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  return results;
}

/**
 * Render schema validation section
 */
function renderSchemaSection(pages: PageData[]): string {
  return `
    <div class="page-list-schema">
      <div class="page-list-schema__header">
        <div class="page-list-schema__info">
          <h2 class="page-list-schema__title">Schema Validation</h2>
          <p class="page-list-schema__description">Validate schema markup quality and health across all pages</p>
        </div>
        <div class="page-list-schema__actions">
          <button 
            type="button" 
            class="page-list-schema__validate-button"
            id="page-list-schema-validate-btn"
            aria-label="Validate all pages"
          >
            <span class="material-symbols-outlined">check_circle</span>
            Validate All Pages
          </button>
        </div>
      </div>
      <div class="page-list-schema__status" id="page-list-schema-status">
        <p class="page-list-schema__status-text">Click "Validate All Pages" to begin schema validation.</p>
      </div>
      <div class="page-list-schema__results" id="page-list-schema-results">
        <!-- Results will be populated here -->
      </div>
    </div>
  `;
}

/**
 * Render schema validation results
 */
function renderSchemaResults(results: PageSchemaData[]): string {
  if (results.length === 0) {
    return `
      <div class="page-list-schema-empty">
        <div class="page-list-schema-empty__icon">📋</div>
        <h3 class="page-list-schema-empty__title">No validation results</h3>
        <p class="page-list-schema-empty__text">Click "Validate All Pages" to start validation.</p>
      </div>
    `;
  }
  
  // Calculate summary statistics
  const totalPages = results.length;
  const pagesWithSchema = results.filter(r => r.hasSchema).length;
  const pagesWithoutSchema = totalPages - pagesWithSchema;
  const validPages = results.filter(r => r.overallValid && r.hasSchema).length;
  const invalidPages = results.filter(r => !r.overallValid && r.hasSchema).length;
  const totalErrors = results.reduce((sum, r) => sum + r.errorCount, 0);
  const totalWarnings = results.reduce((sum, r) => sum + r.warningCount, 0);
  const totalRecommendations = results.reduce((sum, r) => sum + r.recommendationCount, 0);
  const pagesWithContentMismatches = results.filter(r => r.hasContentMismatches).length;
  const pagesWithMixedFormats = results.filter(r => r.hasMixedFormats).length;
  const averageScore = results.length > 0 
    ? Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length)
    : 0;
  
  // Sort results: invalid first, then by score ascending
  const sortedResults = [...results].sort((a, b) => {
    if (a.overallValid !== b.overallValid) {
      return a.overallValid ? 1 : -1;
    }
    return a.score - b.score;
  });
  
  let html = `
    <div class="page-list-schema-summary">
      <div class="page-list-schema-summary__stats">
        <div class="page-list-schema-summary__stat">
          <div class="page-list-schema-summary__stat-value">${totalPages}</div>
          <div class="page-list-schema-summary__stat-label">Total Pages</div>
        </div>
        <div class="page-list-schema-summary__stat">
          <div class="page-list-schema-summary__stat-value ${pagesWithSchema > 0 ? 'page-list-schema-summary__stat-value--good' : 'page-list-schema-summary__stat-value--bad'}">${pagesWithSchema}</div>
          <div class="page-list-schema-summary__stat-label">With Schema</div>
        </div>
        <div class="page-list-schema-summary__stat">
          <div class="page-list-schema-summary__stat-value ${validPages === pagesWithSchema ? 'page-list-schema-summary__stat-value--good' : 'page-list-schema-summary__stat-value--warning'}">${validPages}</div>
          <div class="page-list-schema-summary__stat-label">Valid</div>
        </div>
        <div class="page-list-schema-summary__stat">
          <div class="page-list-schema-summary__stat-value ${totalErrors === 0 ? 'page-list-schema-summary__stat-value--good' : 'page-list-schema-summary__stat-value--bad'}">${totalErrors}</div>
          <div class="page-list-schema-summary__stat-label">Errors</div>
        </div>
        <div class="page-list-schema-summary__stat">
          <div class="page-list-schema-summary__stat-value ${totalWarnings === 0 ? 'page-list-schema-summary__stat-value--good' : 'page-list-schema-summary__stat-value--warning'}">${totalWarnings}</div>
          <div class="page-list-schema-summary__stat-label">Warnings</div>
        </div>
        <div class="page-list-schema-summary__stat">
          <div class="page-list-schema-summary__stat-value ${totalRecommendations === 0 ? 'page-list-schema-summary__stat-value--good' : 'page-list-schema-summary__stat-value--warning'}">${totalRecommendations}</div>
          <div class="page-list-schema-summary__stat-label">Recommendations</div>
        </div>
        <div class="page-list-schema-summary__stat">
          <div class="page-list-schema-summary__stat-value ${averageScore >= 80 ? 'page-list-schema-summary__stat-value--good' : averageScore >= 60 ? 'page-list-schema-summary__stat-value--warning' : 'page-list-schema-summary__stat-value--bad'}">${averageScore}%</div>
          <div class="page-list-schema-summary__stat-label">Avg Score</div>
        </div>
      </div>
    </div>
    
    <div class="page-list-schema-table-wrapper">
      <table class="page-list-schema-table">
        <thead>
          <tr>
            <th>Page</th>
            <th>Status</th>
            <th>Schema Types</th>
            <th>Format</th>
            <th>Errors</th>
            <th>Warnings</th>
            <th>Score</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
  `;
  
  sortedResults.forEach(result => {
    const statusClass = !result.hasSchema 
      ? 'page-list-schema-row__status--none'
      : result.overallValid 
        ? 'page-list-schema-row__status--valid' 
        : 'page-list-schema-row__status--invalid';
    
    const statusText = !result.hasSchema 
      ? 'No Schema'
      : result.overallValid 
        ? 'Valid' 
        : 'Invalid';
    
    const scoreClass = result.score >= 80 
      ? 'page-list-schema-row__score--good'
      : result.score >= 60 
        ? 'page-list-schema-row__score--warning'
        : 'page-list-schema-row__score--bad';
    
    html += `
      <tr class="page-list-schema-row" data-page-url="${escapeHtml(result.relPermalink)}">
        <td class="page-list-schema-row__page">
          <a href="${escapeHtml(result.relPermalink)}" target="_blank" rel="noopener noreferrer" class="page-list-schema-row__link">
            ${escapeHtml(result.pageTitle)}
          </a>
          <div class="page-list-schema-row__url">${escapeHtml(result.relPermalink)}</div>
        </td>
        <td class="page-list-schema-row__status">
          <span class="page-list-schema-row__status-badge ${statusClass}">${statusText}</span>
        </td>
        <td class="page-list-schema-row__types">
          ${result.schemaTypes.length > 0 
            ? (() => {
                // Count occurrences of each schema type
                const typeCounts = new Map<string, number>();
                result.schemaTypes.forEach(type => {
                  typeCounts.set(type, (typeCounts.get(type) || 0) + 1);
                });
                // Render unique types with counts
                return Array.from(typeCounts.entries())
                  .map(([type, count]) => 
                    count > 1 
                      ? `<span class="page-list-schema-row__type-badge" title="${escapeHtml(type)}">${escapeHtml(type)} (${count})</span>`
                      : `<span class="page-list-schema-row__type-badge">${escapeHtml(type)}</span>`
                  )
                  .join('');
              })()
            : '<span class="page-list-schema-row__type-badge page-list-schema-row__type-badge--none">None</span>'
          }
        </td>
        <td class="page-list-schema-row__format">
          ${result.hasSchema ? `
            <div class="page-list-schema-row__format-badges">
              ${result.formatCounts.jsonld > 0 ? `<span class="page-list-schema-row__format-badge" title="JSON-LD">JSON-LD (${result.formatCounts.jsonld})</span>` : ''}
              ${result.formatCounts.microdata > 0 ? `<span class="page-list-schema-row__format-badge" title="Microdata">Microdata (${result.formatCounts.microdata})</span>` : ''}
              ${result.formatCounts.rdfa > 0 ? `<span class="page-list-schema-row__format-badge" title="RDFa">RDFa (${result.formatCounts.rdfa})</span>` : ''}
            </div>
            ${result.hasMixedFormats ? '<span class="page-list-schema-row__mixed-formats-warning" title="Mixed formats detected">⚠ Mixed</span>' : ''}
          ` : '<span class="page-list-schema-row__format-badge page-list-schema-row__format-badge--none">-</span>'}
        </td>
        <td class="page-list-schema-row__errors">
          ${result.errorCount > 0 
            ? `<span class="page-list-schema-row__count page-list-schema-row__count--error">${result.errorCount}</span>`
            : '<span class="page-list-schema-row__count page-list-schema-row__count--good">0</span>'
          }
        </td>
        <td class="page-list-schema-row__warnings">
          ${result.warningCount > 0 
            ? `<span class="page-list-schema-row__count page-list-schema-row__count--warning">${result.warningCount}</span>`
            : '<span class="page-list-schema-row__count page-list-schema-row__count--good">0</span>'
          }
        </td>
        <td class="page-list-schema-row__score">
          <span class="page-list-schema-row__score-badge ${scoreClass}">${result.score}%</span>
        </td>
        <td class="page-list-schema-row__actions">
          <button 
            type="button"
            class="page-list-schema-row__details-btn"
            data-page-url="${escapeHtml(result.relPermalink)}"
            aria-label="View schema details for ${escapeHtml(result.pageTitle)}"
          >
            <span class="material-symbols-outlined">info</span>
            Details
          </button>
        </td>
      </tr>
    `;
  });
  
  html += `
        </tbody>
      </table>
    </div>
  `;
  
  return html;
}

/**
 * Render schema details modal with sidebar navigation
 */
function renderSchemaDetailsModal(result: PageSchemaData): string {
  // Build navigation items
  const navItems: string[] = [];
  navItems.push(`<a href="#schema-overview" class="page-list-schema-modal__nav-link">Overview</a>`);
  
  if (result.suggestions.length > 0) {
    navItems.push(`<a href="#schema-suggestions" class="page-list-schema-modal__nav-link">Suggestions (${result.suggestions.length})</a>`);
  }
  
  if (result.contentMatches.length > 0) {
    navItems.push(`<a href="#schema-content-check" class="page-list-schema-modal__nav-link">Content Cross-Check</a>`);
  }
  
  result.schemas.forEach((schema, index) => {
    navItems.push(`<a href="#schema-${index + 1}" class="page-list-schema-modal__nav-link">Schema ${index + 1}: ${escapeHtml(schema.schemaType)}</a>`);
  });
  
  let html = `
    <div class="page-list-modal-overlay" id="page-list-schema-modal-overlay">
      <div class="page-list-modal page-list-schema-modal" role="dialog" aria-labelledby="page-list-schema-modal-title" aria-modal="true">
        <div class="page-list-modal__header">
          <h2 class="page-list-modal__title" id="page-list-schema-modal-title">Schema Details: ${escapeHtml(result.pageTitle)}</h2>
          <button class="page-list-modal__close" aria-label="Close modal" data-schema-modal-close>
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
        <div class="page-list-schema-modal__body">
          <nav class="page-list-schema-modal__sidebar">
            ${navItems.join('')}
          </nav>
          <div class="page-list-schema-modal__content">
            <section id="schema-overview" class="page-list-schema-modal__section">
              <div class="page-list-schema-modal__info">
                <div class="page-list-schema-modal__info-item">
                  <strong>Page URL:</strong>
                  <a href="${escapeHtml(result.pageUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(result.pageUrl)}</a>
                </div>
                <div class="page-list-schema-modal__info-item">
                  <strong>Schema Count:</strong> ${result.schemaCount}
                </div>
                <div class="page-list-schema-modal__info-item">
                  <strong>Formats:</strong> 
                  ${result.formatCounts.jsonld > 0 ? `JSON-LD (${result.formatCounts.jsonld}) ` : ''}
                  ${result.formatCounts.microdata > 0 ? `Microdata (${result.formatCounts.microdata}) ` : ''}
                  ${result.formatCounts.rdfa > 0 ? `RDFa (${result.formatCounts.rdfa})` : ''}
                  ${result.hasMixedFormats ? ' ⚠ Mixed formats' : ''}
                </div>
                <div class="page-list-schema-modal__info-item">
                  <strong>Overall Status:</strong>
                  <span class="${result.overallValid ? 'page-list-schema-modal__status--valid' : 'page-list-schema-modal__status--invalid'}">
                    ${result.overallValid ? 'Valid' : 'Invalid'}
                  </span>
                </div>
                <div class="page-list-schema-modal__info-item">
                  <strong>Overall Score:</strong> ${result.score}%
                </div>
                <div class="page-list-schema-modal__info-item">
                  <strong>Score Breakdown:</strong>
                  <div class="page-list-schema-modal__score-breakdown">
                    <span>Syntax: ${result.scoreBreakdown.syntax}%</span>
                    <span>Completeness: ${result.scoreBreakdown.completeness}%</span>
                    <span>Accuracy: ${result.scoreBreakdown.accuracy}%</span>
                    <span>Best Practices: ${result.scoreBreakdown.bestPractices}%</span>
                  </div>
                </div>
              </div>
            </section>
          
            ${result.suggestions.length > 0 ? `
              <section id="schema-suggestions" class="page-list-schema-modal__section">
                <div class="page-list-schema-modal__suggestions">
                  <h3 class="page-list-schema-modal__section-title">Suggestions</h3>
                  <ul class="page-list-schema-modal__suggestions-list">
                    ${result.suggestions.map(suggestion => `
                      <li>${escapeHtml(suggestion)}</li>
                    `).join('')}
                  </ul>
                </div>
              </section>
            ` : ''}
            
            ${result.contentMatches.length > 0 ? `
              <section id="schema-content-check" class="page-list-schema-modal__section">
                <div class="page-list-schema-modal__content-matches">
                  <h3 class="page-list-schema-modal__section-title">Content Cross-Check</h3>
                  <div class="page-list-schema-modal__content-matches-list">
                    ${result.contentMatches.map(match => `
                      <div class="page-list-schema-modal__content-match ${match.matches ? 'page-list-schema-modal__content-match--match' : 'page-list-schema-modal__content-match--mismatch'}">
                        <strong>${escapeHtml(match.property)}:</strong>
                        <div class="page-list-schema-modal__content-match-values">
                          <div>Schema: ${escapeHtml(match.schemaValue)}</div>
                          ${match.pageValue ? `<div>Page: ${escapeHtml(match.pageValue)}</div>` : '<div>Page: Not found</div>'}
                          <div class="page-list-schema-modal__content-match-status">
                            ${match.matches ? '✓ Match' : '✗ Mismatch'} (confidence: ${Math.round(match.confidence * 100)}%)
                          </div>
                        </div>
                      </div>
                    `).join('')}
                  </div>
                </div>
              </section>
            ` : ''}
  `;
  
  if (result.schemas.length === 0) {
    html += `
            <section class="page-list-schema-modal__section">
              <div class="page-list-schema-modal__no-schema">
                <p>No schema markup found on this page.</p>
                <p>Consider adding JSON-LD schema markup to improve SEO and enable rich results in search engines.</p>
              </div>
            </section>
    `;
  } else {
    result.schemas.forEach((schema, index) => {
      const schemaId = `schema-${index + 1}`;
      html += `
            <section id="${schemaId}" class="page-list-schema-modal__section">
              <div class="page-list-schema-modal__schema-item">
                <h3 class="page-list-schema-modal__schema-title">
                  Schema ${index + 1}: ${escapeHtml(schema.schemaType)}
                  <span class="page-list-schema-modal__schema-format">(${schema.format})</span>
                  <span class="${schema.isValid ? 'page-list-schema-modal__schema-status--valid' : 'page-list-schema-modal__schema-status--invalid'}">
                    ${schema.isValid ? '✓ Valid' : '✗ Invalid'}
                  </span>
                </h3>
                
                ${schema.errors.length > 0 ? `
                  <div class="page-list-schema-modal__errors">
                    <h4 class="page-list-schema-modal__errors-title">Errors (${schema.errors.length})</h4>
                    <ul class="page-list-schema-modal__errors-list">
                      ${schema.errors.map(error => `
                        <li class="page-list-schema-modal__error-item">
                          <div class="page-list-schema-modal__error-header">
                            <strong>${error.property || 'General'}:</strong>
                            <span class="page-list-schema-modal__error-severity severity-${error.severity}">${error.severity}</span>
                          </div>
                          <div class="page-list-schema-modal__error-message">${escapeHtml(error.message)}</div>
                          ${error.expected ? `<div class="page-list-schema-modal__error-detail"><small>Expected: ${escapeHtml(error.expected)}</small></div>` : ''}
                          ${error.actual ? `<div class="page-list-schema-modal__error-detail"><small>Actual: ${escapeHtml(error.actual)}</small></div>` : ''}
                          ${error.suggestion ? `<div class="page-list-schema-modal__error-suggestion"><small>💡 ${escapeHtml(error.suggestion)}</small></div>` : ''}
                          ${error.code ? `<div class="page-list-schema-modal__error-code"><small>Code: ${escapeHtml(error.code)}</small></div>` : ''}
                        </li>
                      `).join('')}
                    </ul>
                  </div>
                ` : ''}
                
                ${schema.warnings.length > 0 ? `
                  <div class="page-list-schema-modal__warnings">
                    <h4 class="page-list-schema-modal__warnings-title">Warnings (${schema.warnings.length})</h4>
                    <ul class="page-list-schema-modal__warnings-list">
                      ${schema.warnings.map(warning => `
                        <li class="page-list-schema-modal__warning-item">
                          <div class="page-list-schema-modal__warning-header">
                            <strong>${warning.property || 'General'}:</strong>
                            <span class="page-list-schema-modal__warning-severity severity-${warning.severity}">${warning.severity}</span>
                          </div>
                          <div class="page-list-schema-modal__warning-message">${escapeHtml(warning.message)}</div>
                          ${warning.expected ? `<div class="page-list-schema-modal__warning-detail"><small>Expected: ${escapeHtml(warning.expected)}</small></div>` : ''}
                          ${warning.actual ? `<div class="page-list-schema-modal__warning-detail"><small>Actual: ${escapeHtml(warning.actual)}</small></div>` : ''}
                          ${warning.suggestion ? `<div class="page-list-schema-modal__warning-suggestion"><small>💡 ${escapeHtml(warning.suggestion)}</small></div>` : ''}
                        </li>
                      `).join('')}
                    </ul>
                  </div>
                ` : ''}
                
                ${schema.recommendations.length > 0 ? `
                  <div class="page-list-schema-modal__recommendations">
                    <h4 class="page-list-schema-modal__recommendations-title">Recommendations (${schema.recommendations.length})</h4>
                    <ul class="page-list-schema-modal__recommendations-list">
                      ${schema.recommendations.map(rec => `
                        <li class="page-list-schema-modal__recommendation-item">
                          <div class="page-list-schema-modal__recommendation-header">
                            <strong>${rec.property || 'General'}:</strong>
                            <span class="page-list-schema-modal__recommendation-severity severity-${rec.severity}">${rec.severity}</span>
                          </div>
                          <div class="page-list-schema-modal__recommendation-message">${escapeHtml(rec.message)}</div>
                          ${rec.suggestion ? `<div class="page-list-schema-modal__recommendation-suggestion"><small>💡 ${escapeHtml(rec.suggestion)}</small></div>` : ''}
                        </li>
                      `).join('')}
                    </ul>
                  </div>
                ` : ''}
                
                <div class="page-list-schema-modal__raw-schema">
                  <button class="page-list-schema-modal__raw-toggle" type="button" data-raw-toggle="${schemaId}">
                    <span class="material-symbols-outlined">code</span>
                    <span>Raw Schema JSON</span>
                    <span class="material-symbols-outlined page-list-schema-modal__raw-toggle-icon">expand_more</span>
                  </button>
                  <div class="page-list-schema-modal__raw-content" id="raw-${schemaId}" style="display: none;">
                    <pre class="page-list-schema-modal__raw-code"><code>${escapeHtml(schema.schemaString)}</code></pre>
                  </div>
                </div>
              </div>
            </section>
      `;
    });
  }
  
  html += `
          </div>
        </div>
      </div>
    </div>
  `;
  
  return html;
}

/**
 * Attach schema validation handlers
 */
function attachSchemaValidationHandlers(pages: PageData[]): void {
  const validateBtn = document.getElementById('page-list-schema-validate-btn');
  const statusDiv = document.getElementById('page-list-schema-status');
  const resultsDiv = document.getElementById('page-list-schema-results');
  
  if (!validateBtn || !statusDiv || !resultsDiv) return;
  
  let validationResults: PageSchemaData[] = [];
  
  // Validate button handler
  validateBtn.addEventListener('click', async () => {
    validateBtn.setAttribute('disabled', 'disabled');
    validateBtn.innerHTML = '<span class="material-symbols-outlined">hourglass_empty</span> Validating...';
    
    // Filter pages before showing progress (to get accurate count)
    const pagesToValidate = pages.filter(page => !shouldExcludeFromSchemaValidation(page));
    
    statusDiv.innerHTML = `
      <div class="page-list-schema-status__progress">
        <p class="page-list-schema-status__text">Validating ${pagesToValidate.length} pages...</p>
        <div class="page-list-schema-status__progress-bar">
          <div class="page-list-schema-status__progress-fill" id="page-list-schema-progress-fill"></div>
        </div>
        <p class="page-list-schema-status__progress-text" id="page-list-schema-progress-text">0 / ${pagesToValidate.length}</p>
      </div>
    `;
    
    const progressFill = document.getElementById('page-list-schema-progress-fill');
    const progressText = document.getElementById('page-list-schema-progress-text');
    
    try {
      validationResults = await validateAllPageSchemas(pages, (current, total) => {
        const percent = Math.round((current / total) * 100);
        if (progressFill) {
          progressFill.style.width = `${percent}%`;
        }
        if (progressText) {
          progressText.textContent = `${current} / ${total}`;
        }
      });
      
      statusDiv.innerHTML = `
        <p class="page-list-schema-status__text page-list-schema-status__text--success">
          Validation complete! Found ${validationResults.filter(r => !r.overallValid).length} page(s) with issues.
        </p>
      `;
      
      resultsDiv.innerHTML = renderSchemaResults(validationResults);
      
      // Attach details button handlers
      const detailsButtons = resultsDiv.querySelectorAll('.page-list-schema-row__details-btn');
      detailsButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          const pageUrl = btn.getAttribute('data-page-url');
          if (!pageUrl) return;
          
          const result = validationResults.find(r => r.relPermalink === pageUrl);
          if (!result) return;
          
          const modalHtml = renderSchemaDetailsModal(result);
          document.body.insertAdjacentHTML('beforeend', modalHtml);
          
          const modal = document.getElementById('page-list-schema-modal-overlay');
          const closeBtn = modal?.querySelector('[data-schema-modal-close]');
          const modalContent = modal?.querySelector('.page-list-schema-modal__content');
          
          const closeModal = () => {
            modal?.remove();
            document.removeEventListener('keydown', handleEscape);
          };
          
          const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
              closeModal();
            }
          };
          
          // Handle sidebar navigation
          const navLinks = modal?.querySelectorAll('.page-list-schema-modal__nav-link');
          navLinks?.forEach(link => {
            link.addEventListener('click', (e) => {
              e.preventDefault();
              const targetId = link.getAttribute('href')?.substring(1);
              if (targetId) {
                const targetSection = modal?.querySelector(`#${targetId}`);
                if (targetSection && modalContent) {
                  targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  // Update active nav link
                  navLinks.forEach(l => l.classList.remove('page-list-schema-modal__nav-link--active'));
                  link.classList.add('page-list-schema-modal__nav-link--active');
                }
              }
            });
          });
          
          // Handle collapsible raw JSON sections
          const rawToggles = modal?.querySelectorAll('[data-raw-toggle]');
          rawToggles?.forEach(toggle => {
            toggle.addEventListener('click', () => {
              const schemaId = toggle.getAttribute('data-raw-toggle');
              if (schemaId) {
                const content = modal?.querySelector(`#raw-${schemaId}`) as HTMLElement | null;
                const icon = toggle.querySelector('.page-list-schema-modal__raw-toggle-icon');
                if (content) {
                  const isHidden = content.style.display === 'none';
                  content.style.display = isHidden ? 'block' : 'none';
                  if (icon) {
                    icon.textContent = isHidden ? 'expand_less' : 'expand_more';
                  }
                }
              }
            });
          });
          
          // Set first nav link as active
          if (navLinks && navLinks.length > 0) {
            (navLinks[0] as HTMLElement).classList.add('page-list-schema-modal__nav-link--active');
          }
          
          closeBtn?.addEventListener('click', closeModal);
          modal?.addEventListener('click', (e) => {
            if (e.target === modal) {
              closeModal();
            }
          });
          document.addEventListener('keydown', handleEscape);
        });
      });
      
    } catch (error) {
      devError('Schema validation error:', error);
      statusDiv.innerHTML = `
        <p class="page-list-schema-status__text page-list-schema-status__text--error">
          Error during validation: ${error instanceof Error ? error.message : 'Unknown error'}
        </p>
      `;
    } finally {
      validateBtn.removeAttribute('disabled');
      validateBtn.innerHTML = '<span class="material-symbols-outlined">check_circle</span> Validate All Pages';
    }
  });
}

/**
 * ============================================================================
 * LLMS.TXT VALIDATION SYSTEM
 * ============================================================================
 * 
 * Validates llms.txt file according to the llms.txt standard
 * Reference: https://llmstxt.org/
 */

interface LLMSTxtError {
  type: 'error' | 'warning' | 'info';
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  line?: number;
  code?: string;
  suggestion?: string;
}

interface LLMSTxtLink {
  url: string;
  name?: string;
  notes?: string;
  accessible: boolean;
  statusCode?: number;
  error?: string;
}

interface LLMSTxtSection {
  title: string;
  isOptional: boolean;
  links: LLMSTxtLink[];
  lineNumber: number;
}

interface LLMSTxtStructure {
  h1Title: string | null;
  blockquote: string | null;
  freeText: string;
  sections: LLMSTxtSection[];
  rawContent: string;
}

interface LLMSTxtValidationResult {
  fileExists: boolean;
  fileAccessible: boolean;
  structure: LLMSTxtStructure | null;
  errors: LLMSTxtError[];
  warnings: LLMSTxtError[];
  recommendations: LLMSTxtError[];
  score: number;
  scoreBreakdown: {
    structure: number;
    syntax: number;
    links: number;
    content: number;
    bestPractices: number;
  };
  estimatedTokens: number;
  suggestions: string[];
}

/**
 * Parse llms.txt file structure
 */
function parseLLMSTxt(content: string): LLMSTxtStructure {
  const lines = content.split('\n');
  let h1Title: string | null = null;
  let blockquote: string | null = null;
  let freeText: string = '';
  const sections: LLMSTxtSection[] = [];
  
  let currentSection: LLMSTxtSection | null = null;
  let inBlockquote = false;
  let blockquoteLines: string[] = [];
  let freeTextLines: string[] = [];
  let foundH1 = false;
  let foundFreeText = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    
    // Check for H1 (# Title)
    if (trimmed.startsWith('# ') && !foundH1) {
      h1Title = trimmed.substring(2).trim();
      foundH1 = true;
      inBlockquote = false;
      continue;
    }
    
    // Check for blockquote (> text)
    if (foundH1 && !foundFreeText && trimmed.startsWith('>')) {
      inBlockquote = true;
      blockquoteLines.push(trimmed.substring(1).trim());
      continue;
    }
    
    // Continue collecting blockquote content (only lines starting with > or blank lines)
    if (inBlockquote && !foundFreeText) {
      if (trimmed.startsWith('>')) {
        // Continuation of blockquote
        blockquoteLines.push(trimmed.substring(1).trim());
        continue;
      } else if (trimmed.length === 0) {
        // Blank line within blockquote is allowed
        continue;
      } else {
        // Non-blockquote content encountered, finalize blockquote
        if (blockquoteLines.length > 0 && !blockquote) {
          const blockquoteContent = blockquoteLines.join(' ').trim();
          // Only set blockquote if it has actual content (not just whitespace)
          if (blockquoteContent.length > 0) {
            blockquote = blockquoteContent;
          }
        }
        inBlockquote = false;
        // Fall through to process this line as free text or other content
      }
    }
    
    // Check for H2 (## Section)
    if (trimmed.startsWith('## ')) {
      // Save previous section if exists
      if (currentSection) {
        sections.push(currentSection);
      }
      
      const sectionTitle = trimmed.substring(3).trim();
      currentSection = {
        title: sectionTitle,
        isOptional: sectionTitle.toLowerCase() === 'optional',
        links: [],
        lineNumber: i + 1
      };
      inBlockquote = false;
      foundFreeText = true;
      // Finalize blockquote if not already done
      if (blockquoteLines.length > 0 && !blockquote) {
        const blockquoteContent = blockquoteLines.join(' ').trim();
        // Only set blockquote if it has actual content (not just whitespace)
        if (blockquoteContent.length > 0) {
          blockquote = blockquoteContent;
        }
      }
      continue;
    }
    
    // Collect free text (between H1/blockquote and first H2)
    if (foundH1 && !currentSection && !inBlockquote) {
      if (trimmed.length > 0) {
        freeTextLines.push(line);
      }
      foundFreeText = true;
      continue;
    }
    
    // Parse links in sections (Markdown list items)
    if (currentSection && trimmed.startsWith('- ')) {
      const linkContent = trimmed.substring(2).trim();
      // Format: "name" or "name: notes" or URL
      let url = linkContent;
      let name: string | undefined;
      let notes: string | undefined;
      
      // First, check if it's a Markdown link [text](url)
      const linkMatch = linkContent.match(/\[([^\]]+)\]\(([^)]+)\)/);
      if (linkMatch) {
        name = linkMatch[1];
        const fullLink = linkMatch[0];
        const urlPart = linkMatch[2];
        url = urlPart;
        
        // Check if there's a description after the link (format: [text](url): description)
        const afterLink = linkContent.substring(linkMatch.index! + fullLink.length).trim();
        if (afterLink.startsWith(':')) {
          notes = afterLink.substring(1).trim();
        }
      } else {
        // Not a markdown link, check for name: notes format
        const nameNotesMatch = linkContent.match(/^(.+?):\s*(.+)$/);
        if (nameNotesMatch) {
          const namePart = nameNotesMatch[1].trim();
          notes = nameNotesMatch[2].trim();
          url = namePart;
        }
      }
      
      currentSection.links.push({
        url: url.trim(),
        name,
        notes,
        accessible: false // Will be checked later
      });
    }
  }
  
  // Add last section
  if (currentSection) {
    sections.push(currentSection);
  }
  
  // Finalize blockquote if still collecting
  if (blockquoteLines.length > 0 && !blockquote) {
    const blockquoteContent = blockquoteLines.join(' ').trim();
    // Only set blockquote if it has actual content (not just whitespace)
    if (blockquoteContent.length > 0) {
      blockquote = blockquoteContent;
    }
  }
  
  return {
    h1Title,
    blockquote: blockquote || null,
    freeText: freeTextLines.join('\n').trim(),
    sections,
    rawContent: content
  };
}

/**
 * Validate llms.txt structure
 */
function validateLLMSTxtStructure(structure: LLMSTxtStructure): LLMSTxtError[] {
  const errors: LLMSTxtError[] = [];
  
  // Check for H1
  if (!structure.h1Title) {
    errors.push({
      type: 'error',
      severity: 'critical',
      message: 'Missing H1 header. The file must start with a single # header containing the project/site name.',
      code: 'MISSING_H1',
      suggestion: 'Add an H1 header at the top: # Your Site Name'
    });
  }
  
  // Check for headings in free text (only H1 and H2 allowed, no H3+)
  const freeTextLines = structure.freeText.split('\n');
  for (let i = 0; i < freeTextLines.length; i++) {
    const line = freeTextLines[i].trim();
    if (line.startsWith('###')) {
      errors.push({
        type: 'error',
        severity: 'high',
        message: `Invalid heading level in free text area: "${line.substring(0, 50)}". Only H1 and H2 headings are allowed per llms.txt spec.`,
        line: i + 1,
        code: 'INVALID_HEADING_LEVEL',
        suggestion: 'Remove H3+ headings from the free text area. Use H2 sections for organization.'
      });
    }
  }
  
  // Check for multiple H1s
  const h1Count = (structure.rawContent.match(/^# [^#]/gm) || []).length;
  if (h1Count > 1) {
    errors.push({
      type: 'error',
      severity: 'critical',
      message: `Multiple H1 headers found (${h1Count}). Only one H1 is allowed per llms.txt spec.`,
      code: 'MULTIPLE_H1',
      suggestion: 'Remove extra H1 headers. The file should start with a single H1 containing the site/project name.'
    });
  }
  
  // Check structure order: H1 > blockquote (optional) > free text > H2 sections
  const lines = structure.rawContent.split('\n');
  let foundH1 = false;
  let foundBlockquote = false;
  let foundFreeText = false;
  let foundH2 = false;
  let orderViolations: number[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('# ') && !line.startsWith('##')) {
      foundH1 = true;
      if (foundBlockquote || foundFreeText || foundH2) {
        orderViolations.push(i + 1);
      }
    } else if (line.startsWith('>') && foundH1 && !foundFreeText && !foundH2) {
      foundBlockquote = true;
    } else if (foundH1 && !line.startsWith('#') && !line.startsWith('>') && line.length > 0 && !foundH2) {
      foundFreeText = true;
    } else if (line.startsWith('## ')) {
      foundH2 = true;
    }
  }
  
  if (orderViolations.length > 0) {
    errors.push({
      type: 'error',
      severity: 'high',
      message: `Structure order violation: H1 must come first, followed by optional blockquote, free text, then H2 sections.`,
      code: 'STRUCTURE_ORDER_VIOLATION',
      suggestion: 'Reorganize the file to follow the required order: H1 > blockquote (optional) > free text > H2 sections.'
    });
  }
  
  // Check for blockquote (recommended but not required)
  if (!structure.blockquote || structure.blockquote.trim().length === 0) {
    errors.push({
      type: 'warning',
      severity: 'low',
      message: 'Missing blockquote summary. A blockquote after H1 is recommended for a concise site description.',
      code: 'MISSING_BLOCKQUOTE',
      suggestion: 'Add a blockquote summary after the H1 header to help LLMs understand your site quickly.'
    });
  }
  
  // Check section structure
  if (structure.sections.length === 0) {
    errors.push({
      type: 'error',
      severity: 'critical',
      message: 'No H2 sections found. The file must contain at least one section with file links.',
      code: 'NO_SECTIONS',
      suggestion: 'Add H2 sections (## Section Name) with lists of links to important content.'
    });
  }
  
  // Validate link formats
  structure.sections.forEach((section, sectionIndex) => {
    section.links.forEach((link, linkIndex) => {
      // Skip validation for URLs containing template syntax (e.g., Hugo templates with {{ ... }})
      // These will be resolved when the template is rendered
      if (link.url.includes('{{') || link.url.includes('}}')) {
        return; // Skip validation for template variables
      }
      
      // Check for valid URL format
      try {
        new URL(link.url);
      } catch {
        // Not an absolute URL, check if it's a relative path
        if (!link.url.startsWith('/') && !link.url.startsWith('./') && !link.url.startsWith('../')) {
          errors.push({
            type: 'error',
            severity: 'high',
            message: `Invalid URL format in section "${section.title}": "${link.url}". URLs must be absolute or valid relative paths.`,
            line: section.lineNumber + linkIndex + 1,
            code: 'INVALID_URL_FORMAT',
            suggestion: 'Use absolute URLs (https://...) or relative paths starting with /'
          });
        }
      }
      
      // Check for .md extension or markdown-friendly format
      if (link.url && !link.url.match(/\.(md|markdown)$/i) && !link.url.includes('#') && !link.url.match(/\/$/)) {
        errors.push({
          type: 'warning',
          severity: 'medium',
          message: `Link "${link.url}" does not point to a .md file. Consider using .md versions for better LLM compatibility.`,
          line: section.lineNumber + linkIndex + 1,
          code: 'NON_MARKDOWN_LINK',
          suggestion: 'Use .md versions of pages when available, or append .md to HTML URLs if your site supports it.'
        });
      }
    });
    
    // Check for too many links (best practice: 5-10)
    if (!section.isOptional && section.links.length > 10) {
      errors.push({
        type: 'warning',
        severity: 'medium',
        message: `Section "${section.title}" has ${section.links.length} links. Best practice is to limit to 5-10 high-value links.`,
        code: 'TOO_MANY_LINKS',
        suggestion: 'Consider curating links to focus on the most important, evergreen content for LLMs.'
      });
    }
  });
  
  return errors;
}

/**
 * Validate Markdown syntax
 */
function validateMarkdownSyntax(content: string): LLMSTxtError[] {
  const errors: LLMSTxtError[] = [];
  const lines = content.split('\n');
  
  // Check for balanced lists
  let inList = false;
  let listDepth = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    
    if (trimmed.match(/^[-*+]\s/)) {
      if (!inList) inList = true;
    } else if (inList && trimmed.length === 0) {
      // Empty line might end list
      continue;
    } else if (inList && !trimmed.match(/^[-*+]\s/) && trimmed.length > 0) {
      // Non-list item after list - list might be broken
      if (!trimmed.startsWith('#') && !trimmed.startsWith('>')) {
        // Potential issue, but not always an error
      }
    }
    
    // Check for malformed links
    const linkMatches = line.matchAll(/\[([^\]]*)\]\(([^)]*)\)/g);
    for (const match of linkMatches) {
      if (!match[1] || !match[2]) {
        errors.push({
          type: 'error',
          severity: 'high',
          message: `Malformed Markdown link: "${match[0]}"`,
          line: i + 1,
          code: 'MALFORMED_LINK',
          suggestion: 'Links must be in format [text](url) with both text and URL.'
        });
      }
    }
    
    // Check for unclosed code blocks (basic check)
    const codeBlockCount = (line.match(/```/g) || []).length;
    if (codeBlockCount % 2 !== 0) {
      errors.push({
        type: 'warning',
        severity: 'low',
        message: 'Possible unclosed code block',
        line: i + 1,
        code: 'UNCLOSED_CODE_BLOCK'
      });
    }
  }
  
  // Check encoding (basic UTF-8 check)
  try {
    const encoder = new TextEncoder();
    encoder.encode(content);
  } catch (e) {
    errors.push({
      type: 'error',
      severity: 'critical',
      message: 'File contains invalid characters. Must be UTF-8 encoded.',
      code: 'INVALID_ENCODING',
      suggestion: 'Ensure the file is saved as UTF-8 encoding.'
    });
  }
  
  return errors;
}

/**
 * Estimate token count (rough approximation)
 */
function estimateTokenCount(text: string): number {
  // Rough estimate: ~4 characters per token for English text
  return Math.ceil(text.length / 4);
}

/**
 * Convert production URLs to localhost URLs when running in development
 */
function convertToLocalhostUrl(url: string, baseUrl: string): string {
  const isLocalhost = baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1') || baseUrl.includes('0.0.0.0');
  if (!isLocalhost || !url.startsWith('http://') && !url.startsWith('https://')) {
    return url;
  }
  
  try {
    const urlObj = new URL(url);
    // Check if this is a production URL (different domain than localhost)
    const productionDomains = ['appliancesrepairservice.ca', 'www.appliancesrepairservice.ca'];
    const isProductionUrl = productionDomains.some(domain => urlObj.hostname === domain || urlObj.hostname.endsWith('.' + domain));
    
    if (isProductionUrl) {
      // Convert production URL to localhost URL
      return baseUrl + urlObj.pathname + urlObj.search + urlObj.hash;
    }
  } catch {
    // If URL parsing fails, use as-is
  }
  
  return url;
}

/**
 * Check if a URL is accessible
 */
async function checkLinkAccessibility(url: string, baseUrl: string = window.location.origin): Promise<{ accessible: boolean; statusCode?: number; error?: string }> {
  try {
    // Convert relative URLs to absolute
    let absoluteUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      if (url.startsWith('/')) {
        absoluteUrl = baseUrl + url;
      } else {
        absoluteUrl = baseUrl + '/' + url;
      }
    } else {
      // Convert production URLs to localhost URLs in development
      absoluteUrl = convertToLocalhostUrl(url, baseUrl);
    }
    
    const response = await fetch(absoluteUrl, { method: 'HEAD', redirect: 'follow' });
    return {
      accessible: response.ok,
      statusCode: response.status
    };
  } catch (error) {
    return {
      accessible: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Check if a .md version of a URL exists
 */
async function checkMarkdownVersion(url: string, baseUrl: string = window.location.origin): Promise<{ exists: boolean; mdUrl?: string }> {
  // If already .md, return true
  if (url.match(/\.(md|markdown)$/i)) {
    return { exists: true, mdUrl: url };
  }
  
  // Extract pathname from URL (handles both absolute and relative URLs)
  let pathname = url;
  if (url.startsWith('http://') || url.startsWith('https://')) {
    try {
      const urlObj = new URL(url);
      pathname = urlObj.pathname;
    } catch {
      // If URL parsing fails, try to extract pathname manually
      const match = url.match(/https?:\/\/[^\/]+(\/.*)/);
      if (match) {
        pathname = match[1];
      }
    }
  }
  
  // Try common .md patterns
  const mdPatterns = [
    pathname.replace(/\.html?$/, '.md'),
    pathname + '.md',
    pathname.replace(/\/$/, '.md'),
    pathname + '/index.md'
  ];
  
  for (const mdPath of mdPatterns) {
    try {
      // Always use baseUrl (localhost in dev) for checking .md files
      const absoluteUrl = mdPath.startsWith('/') ? baseUrl + mdPath : baseUrl + '/' + mdPath;
      const response = await fetch(absoluteUrl, { method: 'HEAD', redirect: 'follow' });
      if (response.ok) {
        return { exists: true, mdUrl: mdPath };
      }
    } catch {
      // Continue to next pattern
    }
  }
  
  return { exists: false };
}

/**
 * Validate all links in llms.txt structure
 */
async function validateLLMSTxtLinks(structure: LLMSTxtStructure, baseUrl: string = window.location.origin): Promise<{ links: LLMSTxtLink[]; errors: LLMSTxtError[] }> {
  const errors: LLMSTxtError[] = [];
  const allLinks: LLMSTxtLink[] = [];
  const seenUrls = new Set<string>();
  
  for (const section of structure.sections) {
    for (let i = 0; i < section.links.length; i++) {
      const link = section.links[i];
      const normalizedUrl = link.url.toLowerCase().split('#')[0]; // Remove fragments for duplicate check
      
      // Check for duplicates
      if (seenUrls.has(normalizedUrl)) {
        errors.push({
          type: 'warning',
          severity: 'medium',
          message: `Duplicate link found: "${link.url}"`,
          code: 'DUPLICATE_LINK',
          suggestion: 'Remove duplicate links to keep the file concise.'
        });
      } else {
        seenUrls.add(normalizedUrl);
      }
      
      // Check for .md version
      const mdCheck = await checkMarkdownVersion(link.url, baseUrl);
      if (!mdCheck.exists && !link.url.match(/\.(md|markdown)$/i)) {
        errors.push({
          type: 'warning',
          severity: 'low',
          message: `Link "${link.url}" does not point to a .md file and no .md version found.`,
          code: 'NON_MARKDOWN_LINK',
          suggestion: 'Consider using .md versions of pages for better LLM compatibility, or ensure HTML pages have .md equivalents.'
        });
      }
      
      // Check accessibility
      const checkResult = await checkLinkAccessibility(link.url, baseUrl);
      
      const validatedLink: LLMSTxtLink = {
        ...link,
        accessible: checkResult.accessible,
        statusCode: checkResult.statusCode,
        error: checkResult.error
      };
      
      allLinks.push(validatedLink);
      
      if (!checkResult.accessible) {
        errors.push({
          type: 'error',
          severity: checkResult.statusCode === 404 ? 'high' : 'medium',
          message: `Link "${link.url}" is not accessible${checkResult.statusCode ? ` (HTTP ${checkResult.statusCode})` : ''}`,
          code: 'INACCESSIBLE_LINK',
          suggestion: checkResult.statusCode === 404 
            ? 'Check if the URL is correct or if the page exists.'
            : 'Verify the URL is correct and the server is accessible.'
        });
      }
    }
  }
  
  return { links: allLinks, errors };
}

/**
 * Calculate llms.txt quality score
 */
function calculateLLMSTxtScore(
  structure: LLMSTxtStructure | null,
  structureErrors: LLMSTxtError[],
  syntaxErrors: LLMSTxtError[],
  linkErrors: LLMSTxtError[],
  allLinks: LLMSTxtLink[],
  estimatedTokens: number
): { score: number; breakdown: LLMSTxtValidationResult['scoreBreakdown'] } {
  if (!structure) {
    return {
      score: 0,
      breakdown: { structure: 0, syntax: 0, links: 0, content: 0, bestPractices: 0 }
    };
  }
  
  let structureScore = 100;
  let syntaxScore = 100;
  let linksScore = 100;
  let contentScore = 100;
  let bestPracticesScore = 100;
  
  // Structure scoring (30% weight)
  const criticalStructureErrors = structureErrors.filter(e => e.severity === 'critical').length;
  const highStructureErrors = structureErrors.filter(e => e.severity === 'high').length;
  structureScore -= criticalStructureErrors * 30;
  structureScore -= highStructureErrors * 15;
  structureScore = Math.max(0, structureScore);
  
  // Syntax scoring (20% weight)
  const criticalSyntaxErrors = syntaxErrors.filter(e => e.severity === 'critical').length;
  const highSyntaxErrors = syntaxErrors.filter(e => e.severity === 'high').length;
  syntaxScore -= criticalSyntaxErrors * 25;
  syntaxScore -= highSyntaxErrors * 10;
  syntaxScore = Math.max(0, syntaxScore);
  
  // Links scoring (25% weight)
  const accessibleLinks = allLinks.filter(l => l.accessible).length;
  const totalLinks = allLinks.length;
  if (totalLinks > 0) {
    linksScore = Math.round((accessibleLinks / totalLinks) * 100);
  }
  
  // Content scoring (15% weight)
  if (!structure.blockquote) {
    contentScore -= 10;
  }
  if (structure.freeText.length < 50) {
    contentScore -= 5;
  }
  if (structure.sections.length === 0) {
    contentScore -= 20;
  }
  contentScore = Math.max(0, contentScore);
  
  // Best practices scoring (10% weight)
  const totalLinksCount = allLinks.length;
  if (totalLinksCount > 15) {
    bestPracticesScore -= 15; // Too many links
  }
  if (estimatedTokens > 8000) {
    bestPracticesScore -= 10; // Too long
  }
  const optionalSections = structure.sections.filter(s => s.isOptional).length;
  if (optionalSections === 0 && totalLinksCount > 10) {
    bestPracticesScore -= 5; // Should use Optional section
  }
  bestPracticesScore = Math.max(0, bestPracticesScore);
  
  // Weighted overall score
  const overallScore = Math.round(
    structureScore * 0.30 +
    syntaxScore * 0.20 +
    linksScore * 0.25 +
    contentScore * 0.15 +
    bestPracticesScore * 0.10
  );
  
  return {
    score: overallScore,
    breakdown: {
      structure: structureScore,
      syntax: syntaxScore,
      links: linksScore,
      content: contentScore,
      bestPractices: bestPracticesScore
    }
  };
}

/**
 * Validate llms.txt file
 */
async function validateLLMSTxt(): Promise<LLMSTxtValidationResult> {
  try {
    // Try to fetch llms.txt
    const response = await fetch('/llms.txt');
    
    if (!response.ok) {
      return {
        fileExists: false,
        fileAccessible: false,
        structure: null,
        errors: [{
          type: 'error',
          severity: 'critical',
          message: `llms.txt file not found at /llms.txt (HTTP ${response.status})`,
          code: 'FILE_NOT_FOUND',
          suggestion: 'Create an llms.txt file at the root of your site (e.g., /public/llms.txt in Hugo)'
        }],
        warnings: [],
        recommendations: [],
        score: 0,
        scoreBreakdown: { structure: 0, syntax: 0, links: 0, content: 0, bestPractices: 0 },
        estimatedTokens: 0,
        suggestions: ['Create an llms.txt file following the standard at https://llmstxt.org/']
      };
    }
    
    const content = await response.text();
    const structure = parseLLMSTxt(content);
    const structureErrors = validateLLMSTxtStructure(structure);
    const syntaxErrors = validateMarkdownSyntax(content);
    
    // Validate links
    const { links: validatedLinks, errors: linkErrors } = await validateLLMSTxtLinks(structure);
    
    // Update structure with validated links
    let linkIndex = 0;
    structure.sections.forEach(section => {
      section.links = validatedLinks.slice(linkIndex, linkIndex + section.links.length);
      linkIndex += section.links.length;
    });
    
    // Separate errors, warnings, and recommendations
    const allErrors = [...structureErrors, ...syntaxErrors, ...linkErrors];
    const errors = allErrors.filter(e => e.type === 'error');
    const warnings = allErrors.filter(e => e.type === 'warning');
    
    // Generate recommendations
    const recommendations: LLMSTxtError[] = [];
    if (!structure.blockquote) {
      recommendations.push({
        type: 'info',
        severity: 'low',
        message: 'Add a blockquote summary after H1 to help LLMs understand your site quickly.',
        code: 'RECOMMEND_BLOCKQUOTE'
      });
    }
    
    const estimatedTokens = estimateTokenCount(content);
    if (estimatedTokens > 8000) {
      recommendations.push({
        type: 'info',
        severity: 'medium',
        message: `File is approximately ${estimatedTokens} tokens. Consider keeping under 8000 tokens for better context window efficiency.`,
        code: 'TOO_LONG'
      });
    }
    
    const totalLinks = validatedLinks.length;
    if (totalLinks > 15) {
      recommendations.push({
        type: 'info',
        severity: 'medium',
        message: `File contains ${totalLinks} links. Consider using an "Optional" section for less critical links.`,
        code: 'TOO_MANY_LINKS'
      });
    }
    
    const { score, breakdown } = calculateLLMSTxtScore(
      structure,
      structureErrors,
      syntaxErrors,
      linkErrors,
      validatedLinks,
      estimatedTokens
    );
    
    // Generate suggestions
    const suggestions: string[] = [];
    if (errors.length > 0) {
      suggestions.push('Fix critical errors to improve llms.txt quality');
    }
    if (warnings.length > 0) {
      suggestions.push('Address warnings to enhance compliance with best practices');
    }
    if (score < 80) {
      suggestions.push('Consider reviewing the llms.txt standard at https://llmstxt.org/ for guidance');
    }
    
    return {
      fileExists: true,
      fileAccessible: true,
      structure,
      errors,
      warnings,
      recommendations,
      score,
      scoreBreakdown: breakdown,
      estimatedTokens,
      suggestions
    };
    
  } catch (error) {
    return {
      fileExists: false,
      fileAccessible: false,
      structure: null,
      errors: [{
        type: 'error',
        severity: 'critical',
        message: `Error fetching llms.txt: ${error instanceof Error ? error.message : 'Unknown error'}`,
        code: 'FETCH_ERROR',
        suggestion: 'Ensure llms.txt is accessible at /llms.txt'
      }],
      warnings: [],
      recommendations: [],
      score: 0,
      scoreBreakdown: { structure: 0, syntax: 0, links: 0, content: 0, bestPractices: 0 },
      estimatedTokens: 0,
      suggestions: []
    };
  }
}

/**
 * Render llms.txt validation section
 */
function renderLLMSSection(): string {
  return `
    <div class="page-list-llms">
      <div class="page-list-llms__header">
        <div class="page-list-llms__info">
          <h2 class="page-list-llms__title">
            <span class="material-symbols-outlined">description</span>
            LLMs.txt Validation
          </h2>
          <p class="page-list-llms__description">Validate llms.txt file quality and compliance with the <a href="https://llmstxt.org/" target="_blank" rel="noopener noreferrer">llms.txt standard</a></p>
        </div>
        <div class="page-list-llms__actions">
          <button 
            type="button" 
            class="page-list-llms__action-button"
            id="page-list-llms-generate-template"
            aria-label="Generate llms.txt template"
          >
            <span class="material-symbols-outlined">add</span>
            Generate Template
          </button>
          <a 
            href="https://llmstxtchecker.net/?url=${encodeURIComponent(window.location.origin)}" 
            target="_blank" 
            rel="noopener noreferrer"
            class="page-list-llms__action-button page-list-llms__action-button--link"
            aria-label="Validate externally on llmstxtchecker.net"
          >
            <span class="material-symbols-outlined">open_in_new</span>
            Validate Externally
          </a>
        </div>
      </div>
      <div class="page-list-llms__results" id="page-list-llms-results">
        <div class="page-list-llms-loading">
          <div class="page-list-llms-loading__spinner"></div>
          <p class="page-list-llms-loading__text">Validating llms.txt...</p>
        </div>
      </div>
    </div>
  `;
}

/**
 * Generate llms.txt template
 */
function generateLLMSTxtTemplate(siteName: string = 'Your Site Name'): string {
  return `# ${siteName}

> Brief description of your site and what it offers. This helps LLMs understand your content quickly.

Additional context about your site, its purpose, and key information that LLMs should know.

## Core Content

- [About Us](/about-us.md): Learn more about our company and mission
- [Services](/services.md): Our main service offerings
- [Contact](/contact.md): How to reach us

## Documentation

- [Getting Started](/docs/getting-started.md): Quick start guide
- [FAQ](/docs/faq.md): Frequently asked questions

## Optional

- [Blog](/blog.md): Latest articles and updates
- [Resources](/resources.md): Additional resources and tools
`;
}

/**
 * Render llms.txt validation results
 */
function renderLLMSResults(result: LLMSTxtValidationResult): string {
  if (!result.fileExists) {
    return `
      <div class="page-list-llms-empty">
        <div class="page-list-llms-empty__icon">📄</div>
        <h3 class="page-list-llms-empty__title">llms.txt file not found</h3>
        <p class="page-list-llms-empty__text">The llms.txt file was not found at /llms.txt</p>
        <div class="page-list-llms-empty__suggestion">
          <p>Create an llms.txt file at the root of your site following the <a href="https://llmstxt.org/" target="_blank" rel="noopener noreferrer">llms.txt standard</a>.</p>
          <p>Click "Generate Template" above to create a basic template, or visit <a href="https://llmstxt.org/" target="_blank" rel="noopener noreferrer">llmstxt.org</a> for the full specification.</p>
        </div>
      </div>
    `;
  }
  
  const scoreClass = result.score >= 80 
    ? 'page-list-llms-score--good'
    : result.score >= 60 
      ? 'page-list-llms-score--warning'
      : 'page-list-llms-score--bad';
  
  let html = `
    <div class="page-list-llms-summary">
      <div class="page-list-llms-summary__overview">
        <div class="page-list-llms-summary__score">
          <div class="page-list-llms-score ${scoreClass}">
            <div class="page-list-llms-score__value">${result.score}</div>
            <div class="page-list-llms-score__label">Quality Score</div>
          </div>
        </div>
        <div class="page-list-llms-summary__stats">
          <div class="page-list-llms-summary__stat">
            <div class="page-list-llms-summary__stat-value ${result.errors.length === 0 ? 'page-list-llms-summary__stat-value--good' : 'page-list-llms-summary__stat-value--bad'}">${result.errors.length}</div>
            <div class="page-list-llms-summary__stat-label">Errors</div>
          </div>
          <div class="page-list-llms-summary__stat">
            <div class="page-list-llms-summary__stat-value ${result.warnings.length === 0 ? 'page-list-llms-summary__stat-value--good' : 'page-list-llms-summary__stat-value--warning'}">${result.warnings.length}</div>
            <div class="page-list-llms-summary__stat-label">Warnings</div>
          </div>
          <div class="page-list-llms-summary__stat">
            <div class="page-list-llms-summary__stat-value">${result.estimatedTokens}</div>
            <div class="page-list-llms-summary__stat-label">Tokens (est.)</div>
          </div>
          <div class="page-list-llms-summary__stat">
            <div class="page-list-llms-summary__stat-value">${result.structure?.sections.length || 0}</div>
            <div class="page-list-llms-summary__stat-label">Sections</div>
          </div>
        </div>
      </div>
      
      <div class="page-list-llms-summary__breakdown">
        <h3 class="page-list-llms-summary__breakdown-title">Score Breakdown</h3>
        <div class="page-list-llms-summary__breakdown-scores">
          <div class="page-list-llms-breakdown-score">
            <span class="page-list-llms-breakdown-score__label">Structure:</span>
            <span class="page-list-llms-breakdown-score__value">${result.scoreBreakdown.structure}%</span>
          </div>
          <div class="page-list-llms-breakdown-score">
            <span class="page-list-llms-breakdown-score__label">Syntax:</span>
            <span class="page-list-llms-breakdown-score__value">${result.scoreBreakdown.syntax}%</span>
          </div>
          <div class="page-list-llms-breakdown-score">
            <span class="page-list-llms-breakdown-score__label">Links:</span>
            <span class="page-list-llms-breakdown-score__value">${result.scoreBreakdown.links}%</span>
          </div>
          <div class="page-list-llms-breakdown-score">
            <span class="page-list-llms-breakdown-score__label">Content:</span>
            <span class="page-list-llms-breakdown-score__value">${result.scoreBreakdown.content}%</span>
          </div>
          <div class="page-list-llms-breakdown-score">
            <span class="page-list-llms-breakdown-score__label">Best Practices:</span>
            <span class="page-list-llms-breakdown-score__value">${result.scoreBreakdown.bestPractices}%</span>
          </div>
        </div>
      </div>
    </div>
    
    <div class="page-list-llms-details">
      ${result.errors.length > 0 ? `
        <div class="page-list-llms-errors">
          <h3 class="page-list-llms-errors__title">
            <span class="material-symbols-outlined">error</span>
            Errors (${result.errors.length})
          </h3>
          <ul class="page-list-llms-errors__list">
            ${result.errors.map(error => `
              <li class="page-list-llms-error-item">
                <div class="page-list-llms-error-item__header">
                  <span class="page-list-llms-error-item__severity severity-${error.severity}">${error.severity}</span>
                  ${error.line ? `<span class="page-list-llms-error-item__line">Line ${error.line}</span>` : ''}
                  ${error.code ? `<span class="page-list-llms-error-item__code">${error.code}</span>` : ''}
                </div>
                <div class="page-list-llms-error-item__message">${escapeHtml(error.message)}</div>
                ${error.suggestion ? `<div class="page-list-llms-error-item__suggestion">💡 ${escapeHtml(error.suggestion)}</div>` : ''}
              </li>
            `).join('')}
          </ul>
        </div>
      ` : ''}
      
      ${result.warnings.length > 0 ? `
        <div class="page-list-llms-warnings">
          <h3 class="page-list-llms-warnings__title">
            <span class="material-symbols-outlined">warning</span>
            Warnings (${result.warnings.length})
          </h3>
          <ul class="page-list-llms-warnings__list">
            ${result.warnings.map(warning => `
              <li class="page-list-llms-warning-item">
                <div class="page-list-llms-warning-item__header">
                  <span class="page-list-llms-warning-item__severity severity-${warning.severity}">${warning.severity}</span>
                  ${warning.line ? `<span class="page-list-llms-warning-item__line">Line ${warning.line}</span>` : ''}
                  ${warning.code ? `<span class="page-list-llms-warning-item__code">${warning.code}</span>` : ''}
                </div>
                <div class="page-list-llms-warning-item__message">${escapeHtml(warning.message)}</div>
                ${warning.suggestion ? `<div class="page-list-llms-warning-item__suggestion">💡 ${escapeHtml(warning.suggestion)}</div>` : ''}
              </li>
            `).join('')}
          </ul>
        </div>
      ` : ''}
      
      ${result.recommendations.length > 0 ? `
        <div class="page-list-llms-recommendations">
          <h3 class="page-list-llms-recommendations__title">
            <span class="material-symbols-outlined">lightbulb</span>
            Recommendations (${result.recommendations.length})
          </h3>
          <ul class="page-list-llms-recommendations__list">
            ${result.recommendations.map(rec => `
              <li class="page-list-llms-recommendation-item">
                <div class="page-list-llms-recommendation-item__header">
                  <span class="page-list-llms-recommendation-item__severity severity-${rec.severity}">${rec.severity}</span>
                  ${rec.code ? `<span class="page-list-llms-recommendation-item__code">${rec.code}</span>` : ''}
                </div>
                <div class="page-list-llms-recommendation-item__message">${escapeHtml(rec.message)}</div>
              </li>
            `).join('')}
          </ul>
        </div>
      ` : ''}
      
      ${result.structure ? `
        <div class="page-list-llms-structure">
          <h3 class="page-list-llms-structure__title">
            <span class="material-symbols-outlined">article</span>
            File Structure
          </h3>
          <div class="page-list-llms-structure__content">
            <div class="page-list-llms-structure-item">
              <strong>H1 Title:</strong> ${result.structure.h1Title ? escapeHtml(result.structure.h1Title) : '<em>Missing</em>'}
            </div>
            <div class="page-list-llms-structure-item">
              <strong>Blockquote:</strong> ${result.structure.blockquote ? escapeHtml(result.structure.blockquote.substring(0, 100)) + (result.structure.blockquote.length > 100 ? '...' : '') : '<em>Missing</em>'}
            </div>
            <div class="page-list-llms-structure-item">
              <strong>Free Text:</strong> ${result.structure.freeText.length > 0 ? `${result.structure.freeText.split('\n').length} lines` : '<em>Empty</em>'}
            </div>
            <div class="page-list-llms-structure-item">
              <strong>Sections:</strong> ${result.structure.sections.length}
              ${result.structure.sections.map(section => `
                <div class="page-list-llms-structure-section">
                  <strong>${escapeHtml(section.title)}</strong> ${section.isOptional ? '(Optional)' : ''} - ${section.links.length} link${section.links.length !== 1 ? 's' : ''}
                  <ul class="page-list-llms-structure-section-links">
                    ${section.links.map(link => `
                      <li class="page-list-llms-structure-link ${link.accessible ? 'page-list-llms-structure-link--accessible' : 'page-list-llms-structure-link--inaccessible'}">
                        <a href="${escapeHtml(link.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(link.name || link.url)}</a>
                        ${link.notes ? `<span class="page-list-llms-structure-link-notes">: ${escapeHtml(link.notes)}</span>` : ''}
                        ${link.accessible ? `<span class="page-list-llms-structure-link-status">✓</span>` : `<span class="page-list-llms-structure-link-status">✗</span>`}
                      </li>
                    `).join('')}
                  </ul>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
        
        <div class="page-list-llms-preview">
          <div class="page-list-llms-preview__header">
            <h3 class="page-list-llms-preview__title">
              <span class="material-symbols-outlined">preview</span>
              File Preview
            </h3>
            <div class="page-list-llms-preview__toggle">
              <button 
                type="button" 
                class="page-list-llms-preview__toggle-button page-list-llms-preview__toggle-button--active"
                data-view="rendered"
                aria-label="Show rendered Markdown"
              >
                <span class="material-symbols-outlined">article</span>
                Rendered
              </button>
              <button 
                type="button" 
                class="page-list-llms-preview__toggle-button"
                data-view="raw"
                aria-label="Show raw Markdown"
              >
                <span class="material-symbols-outlined">code</span>
                Raw
              </button>
            </div>
          </div>
          <div class="page-list-llms-preview__content">
            <div class="page-list-llms-preview__rendered" data-preview-view="rendered">
              <div class="page-list-llms-preview__markdown">${renderMarkdownPreview(result.structure.rawContent)}</div>
            </div>
            <div class="page-list-llms-preview__raw page-list-llms-preview__raw--hidden" data-preview-view="raw">
              <pre class="page-list-llms-preview__code"><code>${escapeHtml(result.structure.rawContent)}</code></pre>
            </div>
          </div>
        </div>
      ` : ''}
    </div>
  `;
  
  return html;
}

/**
 * Render simple Markdown preview (basic conversion without full parser)
 */
function renderMarkdownPreview(content: string): string {
  let html = content;
  
  // Convert headers
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  
  // Convert blockquotes
  html = html.replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>');
  
  // Convert links [text](url)
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  
  // Convert lists
  html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');
  
  // Convert paragraphs (lines not starting with special chars)
  const lines = html.split('\n');
  const processedLines: string[] = [];
  let currentParagraph: string[] = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (currentParagraph.length > 0) {
        processedLines.push(`<p>${currentParagraph.join(' ')}</p>`);
        currentParagraph = [];
      }
      processedLines.push('');
    } else if (trimmed.match(/^<[hul]/) || trimmed.match(/^<\/[hul]/) || trimmed.match(/^<blockquote>/) || trimmed.match(/^<\/blockquote>/)) {
      if (currentParagraph.length > 0) {
        processedLines.push(`<p>${currentParagraph.join(' ')}</p>`);
        currentParagraph = [];
      }
      processedLines.push(trimmed);
    } else if (!trimmed.match(/^<li>/)) {
      currentParagraph.push(trimmed);
    } else {
      processedLines.push(trimmed);
    }
  }
  
  if (currentParagraph.length > 0) {
    processedLines.push(`<p>${currentParagraph.join(' ')}</p>`);
  }
  
  return processedLines.join('\n');
}

/**
 * Attach llms.txt validation handlers and auto-run validation
 */
function attachLLMSHandlers(): void {
  const resultsDiv = document.getElementById('page-list-llms-results');
  
  if (!resultsDiv) return;
  
  // Attach template generator button
  const generateButton = document.getElementById('page-list-llms-generate-template');
  if (generateButton) {
    generateButton.addEventListener('click', () => {
      const siteName = document.querySelector('h1')?.textContent?.trim() || 'Your Site Name';
      const template = generateLLMSTxtTemplate(siteName);
      
      // Create download
      const blob = new Blob([template], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'llms.txt';
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      showToast('llms.txt template downloaded. Place it in your site root (e.g., /public/llms.txt)', 'success', 5000, 'page-list');
    });
  }
  
  // Auto-run validation on page load
  (async () => {
    try {
      const result = await validateLLMSTxt();
      resultsDiv.innerHTML = renderLLMSResults(result);
      
      // Attach preview toggle handlers
      const toggleButtons = document.querySelectorAll('.page-list-llms-preview__toggle-button');
      const renderedView = document.querySelector('[data-preview-view="rendered"]');
      const rawView = document.querySelector('[data-preview-view="raw"]');
      
      toggleButtons.forEach(button => {
        button.addEventListener('click', () => {
          const view = button.getAttribute('data-view');
          
          // Update button states
          toggleButtons.forEach(btn => {
            btn.classList.toggle('page-list-llms-preview__toggle-button--active', btn === button);
          });
          
          // Toggle views
          if (view === 'rendered') {
            renderedView?.classList.remove('page-list-llms-preview__raw--hidden');
            rawView?.classList.add('page-list-llms-preview__raw--hidden');
          } else {
            renderedView?.classList.add('page-list-llms-preview__raw--hidden');
            rawView?.classList.remove('page-list-llms-preview__raw--hidden');
          }
        });
      });
    } catch (error) {
      devError('LLMS.txt validation error:', error);
      resultsDiv.innerHTML = `
        <div class="page-list-llms-empty">
          <div class="page-list-llms-empty__icon">⚠️</div>
          <h3 class="page-list-llms-empty__title">Validation Error</h3>
          <p class="page-list-llms-empty__text">Error during validation: ${error instanceof Error ? error.message : 'Unknown error'}</p>
        </div>
      `;
    }
  })();
}

/**
 * Render draft pages in a simple list format with URLs
 */
function renderDraftPages(pages: PageData[]): string {
  if (pages.length === 0) {
    return `
      <div class="page-list-empty">
        <div class="page-list-empty__icon">📝</div>
        <h3 class="page-list-empty__title">No draft pages found</h3>
        <p class="page-list-empty__text">
          No draft pages were found. Make sure you're running the dev server with <code>npm run dev</code> (which includes drafts).
        </p>
      </div>
    `;
  }

  // Sort by title
  const sortedPages = [...pages].sort((a, b) => {
    return a.title.localeCompare(b.title);
  });

  let html = `
    <div class="page-list-drafts">
      <div class="page-list-drafts__header">
        <div class="page-list-drafts__info">
          <h2 class="page-list-drafts__title">Draft Pages</h2>
          <p class="page-list-drafts__count">${pages.length} ${pages.length === 1 ? 'draft' : 'drafts'}</p>
        </div>
        <div class="page-list-drafts__actions">
          <button 
            type="button" 
            class="page-list-drafts__export-button"
            id="page-list-drafts-export-csv"
            aria-label="Export drafts to CSV"
          >
            <span class="material-symbols-outlined">download</span>
            Export CSV
          </button>
        </div>
      </div>
      <div class="page-list-drafts__list">
        <table class="page-list-drafts-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>URL</th>
              <th>Section</th>
            </tr>
          </thead>
          <tbody>
  `;

  sortedPages.forEach(page => {
    const fullUrl = `${window.location.origin}${page.relPermalink}`;
    html += `
      <tr class="page-list-drafts-row">
        <td class="page-list-drafts-row__title" data-label="Title">
          ${escapeHtml(page.title)}
        </td>
        <td class="page-list-drafts-row__url" data-label="URL">
          <a 
            href="${escapeHtml(page.relPermalink)}" 
            target="_blank" 
            rel="noopener noreferrer"
            class="page-list-drafts-row__link"
          >
            ${escapeHtml(page.relPermalink)}
          </a>
          <button 
            type="button"
            class="page-list-drafts-row__copy-button"
            data-copy-url="${escapeHtml(fullUrl)}"
            aria-label="Copy URL to clipboard"
            title="Copy URL to clipboard"
          >
            <span class="material-symbols-outlined">content_copy</span>
          </button>
        </td>
        <td class="page-list-drafts-row__section" data-label="Section">
          ${escapeHtml(page.section || 'Home')}
        </td>
      </tr>
    `;
  });

  html += `
          </tbody>
        </table>
      </div>
    </div>
  `;

  return html;
}

/**
 * Render grouped pages
 */
function renderGroupedPages(pages: PageData[], compact: boolean = false, sortType: string = 'title', sortDirection: 'asc' | 'desc' = 'asc', filterType: string = 'all'): string {
  const groups = groupPagesBySection(pages, sortType, sortDirection);
  const sections = Array.from(groups.keys()).sort();

  let html = '';

  // Home page (if exists)
  const homePage = pages.find(p => p.section === '' || p.relPermalink === '/');
  if (homePage) {
    const tableHeaders = getTableHeaders(filterType, compact);
    
    html += `
      <div class="page-list-group" data-group-id="home">
        <button class="page-list-group-header" data-group-toggle="home">
          <h2 class="page-list-group-title">Home</h2>
          <span class="page-list-group-toggle-icon">▼</span>
        </button>
        <div class="page-list-group-content" data-group-content="home">
          <table class="page-list-table">
            <thead>
              ${tableHeaders}
            </thead>
            <tbody>
              ${renderPageRow(homePage, compact, filterType)}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  // Other sections
  sections.forEach(section => {
    if (section === '' || section === 'root') return; // Skip home, already handled

    const sectionPages = groups.get(section) || [];
    if (sectionPages.length === 0) return;

    const sectionTitle = section.charAt(0).toUpperCase() + section.slice(1).replace(/-/g, ' ');
    const tableHeaders = getTableHeaders(filterType, compact);

    html += `
      <div class="page-list-group" data-group-id="${escapeHtml(section)}">
        <button class="page-list-group-header" data-group-toggle="${escapeHtml(section)}">
          <h2 class="page-list-group-title">${escapeHtml(sectionTitle)}</h2>
          <span class="page-list-group-toggle-icon">▼</span>
        </button>
        <div class="page-list-group-content" data-group-content="${escapeHtml(section)}">
          <table class="page-list-table">
            <thead>
              ${tableHeaders}
            </thead>
            <tbody>
              ${sectionPages.map(p => renderPageRow(p, compact, filterType)).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  });

  return html;
}

/**
 * Escape HTML to prevent XSS
 */
// escapeHtml is now imported from utils/dev-ui.ts

/**
 * Truncate text to specified length
 */
function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * Format issue count - show checkmark if 0, otherwise show the number
 */
function formatIssueCount(count: number): string {
  return count === 0 ? '✓' : count.toString();
}

/**
 * Create a tooltip element
 */
function createTooltip(text: string): string {
  return `
    <span class="page-list-tooltip-trigger">
      <span class="page-list-tooltip-icon material-symbols-outlined">info</span>
      <span class="page-list-tooltip">
        <span class="page-list-tooltip-content">${escapeHtml(text)}</span>
      </span>
    </span>
  `;
}

/**
 * Filter pages based on filter type
 */
function filterPages(pages: PageData[], filterType: string): PageData[] {
  switch (filterType) {
    case 'all':
      return pages;
    case 'with-issues':
      return pages.filter(page => {
        return !page.hasMetaTitle || 
               !page.hasMetaDescription || 
               page.titleOverLimit || 
               page.descriptionOverLimit ||
               page.titleOverPixels ||
               page.descriptionOverPixels;
      });
    case 'missing-title':
      return pages.filter(page => !page.hasMetaTitle);
    case 'missing-description':
      return pages.filter(page => !page.hasMetaDescription);
    case 'missing-meta':
      return pages.filter(page => !page.hasMetaTitle || !page.hasMetaDescription);
    case 'title-over-limit':
      return pages.filter(page => page.titleOverLimit || page.titleOverPixels);
    case 'description-over-limit':
      return pages.filter(page => page.descriptionOverLimit || page.descriptionOverPixels);
    case 'pixel-issues':
      return pages.filter(page => page.titleOverPixels || page.descriptionOverPixels);
    case 'meta-issues':
      return pages.filter(page => page.titleOverLimit || page.titleOverPixels || page.descriptionOverLimit || page.descriptionOverPixels);
    case 'good':
      return pages.filter(page => {
        return page.hasMetaTitle && 
               page.hasMetaDescription && 
               !page.titleOverLimit && 
               !page.descriptionOverLimit &&
               !page.titleOverPixels &&
               !page.descriptionOverPixels &&
               !page.hasBrokenLinks &&
               !page.hasBrokenImages &&
               !page.hasImagesWithoutAlt &&
               page.headingStructureGood &&
               page.hasOneH1 &&
               page.hasH2s &&
               page.internalLinksGood &&
               !page.hasGenericAnchors &&
               !page.hasGenericAltText &&
               page.hasSchemaMarkup &&
               page.firstParaGood &&
               !page.wordCountPoor &&
               !page.isStale &&
               page.hasCitations &&
               page.hasAuthor &&
               (!page.hasVideos || page.hasTranscript) &&
               page.readabilityGood &&
               page.hasAnalytics &&
               !page.hasContrastRatioIssues &&
               !page.hasMissingAriaLabels &&
               !page.hasKeyboardNavigationIssues &&
               page.hasFocusIndicators !== false;
      });
    case 'broken-links':
      return pages.filter(page => page.hasBrokenLinks);
    case 'broken-images':
      return pages.filter(page => page.hasBrokenImages);
    case 'images-no-alt':
      return pages.filter(page => page.hasImagesWithoutAlt);
    case 'heading-structure':
      return pages.filter(page => !page.headingStructureGood);
    case 'multiple-h1':
      return pages.filter(page => page.hasMultipleH1);
    case 'no-h1':
      return pages.filter(page => page.h1Count === 0);
    case 'no-h2':
      return pages.filter(page => !page.hasH2s);
    case 'internal-links':
      return pages.filter(page => page.internalLinksTooFew || page.internalLinksTooMany);
    case 'generic-anchors':
      return pages.filter(page => page.hasGenericAnchors);
    case 'no-schema':
      return pages.filter(page => !page.hasSchemaMarkup);
    case 'low-word-count':
      return pages.filter(page => page.wordCountPoor);
    case 'stale-content':
      return pages.filter(page => page.isStale);
    case 'no-citations':
      return pages.filter(page => !page.hasCitations);
    case 'no-author':
      return pages.filter(page => !page.hasAuthor);
    case 'videos-no-transcript':
      return pages.filter(page => page.hasVideos && !page.hasTranscript);
    case 'no-analytics':
      return pages.filter(page => !page.hasAnalytics);
    case 'images-not-nextgen':
      return pages.filter(page => page.hasImagesNotNextGen);
    case 'images-no-lazy':
      return pages.filter(page => page.hasImagesWithoutLazyLoading);
    case 'no-lang':
      return pages.filter(page => !page.hasLangAttribute);
    case 'no-canonical':
      return pages.filter(page => !page.hasCanonical);
    case 'mixed-content':
      return pages.filter(page => page.hasMixedContent);
    case 'url-length':
      return pages.filter(page => page.urlLengthOver);
    case 'outbound-links':
      return pages.filter(page => page.outboundLinksTooFew);
    case 'paragraph-length':
      return pages.filter(page => !page.paragraphLengthGood);
    case 'subheading-distribution':
      return pages.filter(page => !page.subheadingDistributionGood);
    case 'media-usage':
      return pages.filter(page => page.mediaUsageTooFew);
    case 'no-date-info':
      return pages.filter(page => !page.hasDateInfo);
    case 'no-mobile-viewport':
      return pages.filter(page => !page.hasMobileViewport);
    case 'social-meta':
      return pages.filter(page => !page.socialMetaGood);
    case 'no-excerpt':
      return pages.filter(page => !page.hasSummary);
    case 'excerpt-too-short':
      return pages.filter(page => page.summaryTooShort);
    case 'excerpt-too-long':
      return pages.filter(page => page.summaryTooLong);
    case 'contrast-ratio':
      return pages.filter(page => page.hasContrastRatioIssues === true);
    case 'missing-aria':
      return pages.filter(page => page.hasMissingAriaLabels === true);
    case 'keyboard-nav':
      return pages.filter(page => page.hasKeyboardNavigationIssues === true);
    case 'no-focus-indicators':
      return pages.filter(page => page.hasFocusIndicators === false);
    case 'drafts':
      return pages.filter(page => page.isDraft === true);
    default:
      return pages;
  }
}


/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];
  const len1 = str1.length;
  const len2 = str2.length;

  for (let i = 0; i <= len2; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= len1; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= len2; i++) {
    for (let j = 1; j <= len1; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[len2][len1];
}

/**
 * Common typo fixes
 */
const TYPO_FIXES: Record<string, string> = {
  'recieve': 'receive',
  'optmize': 'optimize',
  'seperate': 'separate',
  'occured': 'occurred',
  'accomodate': 'accommodate',
  'definately': 'definitely',
  'maintainance': 'maintenance',
  'seige': 'siege',
  'neccessary': 'necessary',
  'existance': 'existence',
};

/**
 * Find close matches for a broken URL (for suggestions)
 */
function findCloseMatches(brokenUrl: string, allPagePaths: string[], allPages?: PageData[], maxResults: number = 3): LinkSuggestion[] {
  const suggestions: LinkSuggestion[] = [];
  const brokenPath = brokenUrl.split('#')[0];
  const brokenLower = brokenPath.toLowerCase();
  const brokenNoSlash = brokenPath.replace(/\/$/, '');
  
  // Create a map of paths to page data for title lookup
  const pathToPage = new Map<string, PageData>();
  if (allPages) {
    allPages.forEach(page => {
      pathToPage.set(page.relPermalink, page);
    });
  }
  
  // Calculate similarity scores for all paths
  const scoredPaths: Array<{ path: string; score: number; reason: string }> = [];
  
  for (const path of allPagePaths) {
    const pathLower = path.toLowerCase();
    const pathNoSlash = path.replace(/\/$/, '');
    
    let score = 0;
    let reason = '';
    
    // Check for substring matches (higher score for longer matches)
    if (pathLower.includes(brokenLower) || brokenLower.includes(pathLower)) {
      const matchLength = Math.min(pathLower.length, brokenLower.length);
      score = 50 + (matchLength / Math.max(pathLower.length, brokenLower.length)) * 30;
      reason = 'Similar path structure';
    }
    
    // Check for common segments
    const brokenSegments = brokenNoSlash.split('/').filter(s => s);
    const pathSegments = pathNoSlash.split('/').filter(s => s);
    const commonSegments = brokenSegments.filter(s => pathSegments.includes(s));
    if (commonSegments.length > 0) {
      const segmentScore = (commonSegments.length / Math.max(brokenSegments.length, pathSegments.length)) * 40;
      score = Math.max(score, segmentScore);
      if (!reason) reason = `${commonSegments.length} common segment${commonSegments.length !== 1 ? 's' : ''}`;
    }
    
    // Calculate Levenshtein distance
    const distance = levenshteinDistance(brokenPath, path);
    const maxLen = Math.max(brokenPath.length, path.length);
    const similarity = maxLen > 0 ? (1 - distance / maxLen) * 100 : 0;
    
    // Combine scores
    const finalScore = score + similarity;
    
    if (finalScore > 20) { // Only include reasonably similar matches
      scoredPaths.push({
        path,
        score: finalScore,
        reason: reason || `Similarity: ${Math.round(similarity)}%`
      });
    }
  }
  
  // Sort by score (highest first) and take top results
  scoredPaths.sort((a, b) => b.score - a.score);
  
  for (let i = 0; i < Math.min(maxResults, scoredPaths.length); i++) {
    const item = scoredPaths[i];
    const page = pathToPage.get(item.path);
    suggestions.push({
      url: item.path,
      title: page?.title,
      similarity: Math.round(item.score),
      reason: item.reason
    });
  }
  
  return suggestions;
}

/**
 * Find potential match for broken URL using priority rules
 */
function findUrlMatch(brokenUrl: string, allPagePaths: string[], allPages?: PageData[]): { match: string; reason: string } | null {
  // Remove anchor fragments for matching
  const brokenPath = brokenUrl.split('#')[0];
  const brokenLower = brokenPath.toLowerCase();
  const brokenNoSlash = brokenPath.replace(/\/$/, '');
  const brokenNoHtml = brokenPath.replace(/\.html$/, '');

  // Rule 1: Exact match ignoring case
  for (const path of allPagePaths) {
    if (path.toLowerCase() === brokenLower) {
      return { match: path, reason: 'Exact match (case-insensitive)' };
    }
  }

  // Rule 2: Missing section prefix (e.g., /why-is-my-maytag-dryer-not-drying/ → /blog/why-is-my-maytag-dryer-not-drying/)
  // Get all unique sections from pages
  const sections = new Set<string>();
  if (allPages) {
    allPages.forEach(page => {
      if (page.section) {
        sections.add(page.section);
      }
    });
  }
  // Also check common sections as fallback
  const commonSections = ['blog', 'our-services', 'service-areas', 'about-us', 'brands-we-serve'];
  commonSections.forEach(s => sections.add(s));
  
  for (const section of sections) {
    const pathWithSection = `/${section}${brokenPath}`;
    const pathWithSectionNoSlash = `/${section}${brokenNoSlash}`;
    
    for (const path of allPagePaths) {
      if (path === pathWithSection || path === pathWithSectionNoSlash) {
        return { match: path, reason: `Missing section prefix: added /${section}/` };
      }
    }
  }

  // Rule 3: Exact match ignoring trailing slash
  for (const path of allPagePaths) {
    const pathNoSlash = path.replace(/\/$/, '');
    if (pathNoSlash === brokenNoSlash || path === brokenNoSlash || pathNoSlash === brokenPath) {
      return { match: path, reason: 'Exact match (trailing slash difference)' };
    }
  }

  // Rule 4: Exact match ignoring .html extension
  for (const path of allPagePaths) {
    const pathNoHtml = path.replace(/\.html$/, '');
    if (pathNoHtml === brokenNoHtml || path === brokenNoHtml || pathNoHtml === brokenPath) {
      return { match: path, reason: 'Exact match (.html extension difference)' };
    }
  }

  // Rule 5: Missing/extra hyphen or underscore
  for (const path of allPagePaths) {
    const pathNormalized = path.replace(/[-_]/g, '');
    const brokenNormalized = brokenPath.replace(/[-_]/g, '');
    if (pathNormalized === brokenNormalized && pathNormalized.length > 0) {
      return { match: path, reason: 'Hyphen/underscore difference' };
    }
  }

  // Rule 6: Common Hugo patterns
  for (const path of allPagePaths) {
    // /blog/post/ → /blog/post
    if (brokenPath.endsWith('/') && path === brokenPath.slice(0, -1)) {
      return { match: path, reason: 'Hugo pattern: trailing slash' };
    }
    // /about-us → /about
    if (brokenPath.includes('-us') && path === brokenPath.replace('-us', '')) {
      return { match: path, reason: 'Hugo pattern: -us suffix' };
    }
    // /tags/tag-name → /tag/tag-name
    if (brokenPath.startsWith('/tags/') && path === brokenPath.replace('/tags/', '/tag/')) {
      return { match: path, reason: 'Hugo pattern: tags → tag' };
    }
  }

  // Rule 7: Levenshtein distance ≤ 2 + length-based threshold
  const brokenLen = brokenPath.length;
  let bestMatch: { path: string; distance: number } | null = null;
  
  for (const path of allPagePaths) {
    const distance = levenshteinDistance(brokenPath, path);
    const maxDistance = Math.min(2, Math.floor(brokenLen / 10)); // Conservative: max 2 or 10% of length
    
    if (distance <= maxDistance && distance > 0) {
      if (!bestMatch || distance < bestMatch.distance) {
        bestMatch = { path, distance };
      }
    }
  }
  
  if (bestMatch) {
    return { match: bestMatch.path, reason: `Levenshtein distance ${bestMatch.distance}` };
  }

  // Rule 8: Known typo fixes
  for (const [typo, correct] of Object.entries(TYPO_FIXES)) {
    if (brokenPath.toLowerCase().includes(typo)) {
      const corrected = brokenPath.toLowerCase().replace(typo, correct);
      for (const path of allPagePaths) {
        if (path.toLowerCase() === corrected || path.toLowerCase().includes(corrected)) {
          return { match: path, reason: `Typo fix: ${typo} → ${correct}` };
        }
      }
    }
  }

  return null;
}

// relPermalinkToContentFile is now imported from utils/file-system.ts
// File System Access API support is now managed by utils/file-system.ts

// File system functions are now imported from utils/file-system.ts

/**
 * Fix broken links in a file
 */
async function fixBrokenLinksInFile(
  filePath: string,
  brokenLinks: Array<{ url: string; fixedUrl: string | null; action: 'fix' | 'remove' }>
): Promise<{ success: boolean; backupPath?: string; error?: string; changes: Array<{ oldUrl: string; newUrl: string; lineNumber: number; text?: string }> }> {
  try {
    devLog(`📄 Reading file: ${filePath}`);
    const fileData = await readFileContent(filePath, true); // Enable verbose logging
    if (!fileData) {
      devError(`❌ Could not read file: ${filePath}`);
      return { success: false, error: 'Could not read file', changes: [] };
    }

    devLog(`✅ File read successfully (${fileData.content.length} characters)`);

    const originalContent = fileData.content;
    let content = originalContent;
    let modified = false;
    const changes: Array<{ oldUrl: string; newUrl: string; lineNumber: number; text?: string }> = [];

    // Process each broken link
    for (const { url, fixedUrl, action } of brokenLinks) {
      devLog(`   Processing: ${url} → ${action === 'remove' ? '(remove)' : fixedUrl}`);
      
      if (action === 'remove') {
        // Remove the link and keep only text
        const removalResult = removeLinkFromContent(content, url);
        if (removalResult.changes.length > 0) {
          content = removalResult.content;
          changes.push(...removalResult.changes);
          modified = true;
          devLog(`   ✅ Removed ${removalResult.changes.length} occurrence(s) of link`);
        } else {
          devLog(`   ⚠️  Link not found in content (may have already been removed or format differs)`);
        }
      } else if (fixedUrl) {
        // Fix the URL
        // Normalize URL for matching - handle trailing slashes and fragments
        const urlNoFragment = url.split('#')[0];
        const urlNoSlash = urlNoFragment.replace(/\/$/, '');
        const urlWithSlash = urlNoSlash + '/';
        
        // Try multiple URL variations
        const urlVariations = [
          url, // Original
          urlNoFragment, // Without fragment
          urlNoSlash, // Without trailing slash
          urlWithSlash, // With trailing slash
        ];
        
        let foundAny = false;
        
        // Escape URL for regex (handle special characters)
        const escapedUrl = escapeRegex(url);
        const escapedUrlNoFragment = escapeRegex(urlNoFragment);
        const escapedUrlNoSlash = escapeRegex(urlNoSlash);
        const escapedUrlWithSlash = escapeRegex(urlWithSlash);
        
        // Markdown links: [text](broken-url) or [text](broken-url "title")
        // Try all URL variations
        const markdownPatterns = [
          new RegExp(`(\\[[^\\]]+\\]\\()${escapedUrl}([^)]*\\))`, 'g'),
          new RegExp(`(\\[[^\\]]+\\]\\()${escapedUrlNoFragment}([^)]*\\))`, 'g'),
          new RegExp(`(\\[[^\\]]+\\]\\()${escapedUrlNoSlash}([^)]*\\))`, 'g'),
          new RegExp(`(\\[[^\\]]+\\]\\()${escapedUrlWithSlash}([^)]*\\))`, 'g'),
        ];
        
        const markdownMatches: Array<{ index: number; match: string; replacement: string }> = [];
        
        for (const pattern of markdownPatterns) {
          let match;
          // Reset regex lastIndex to avoid issues with global regex
          pattern.lastIndex = 0;
          while ((match = pattern.exec(content)) !== null) {
            const replacement = `${match[1]}${fixedUrl}${match[2]}`;
            markdownMatches.push({
              index: match.index,
              match: match[0],
              replacement
            });
            foundAny = true;
          }
        }
        
        // Apply replacements in reverse order to maintain indices
        for (let i = markdownMatches.length - 1; i >= 0; i--) {
          const m = markdownMatches[i];
          const beforeMatch = content.substring(0, m.index);
          const lineNumber = beforeMatch.split('\n').length;
          
          content = beforeMatch + m.replacement + content.substring(m.index + m.match.length);
          changes.push({ oldUrl: url, newUrl: fixedUrl, lineNumber });
          modified = true;
        }

        // HTML href: href="broken-url" or href='broken-url'
        // Try all URL variations
        const htmlPatterns = [
          new RegExp(`(href=["'])${escapedUrl}(["'])`, 'gi'),
          new RegExp(`(href=["'])${escapedUrlNoFragment}(["'])`, 'gi'),
          new RegExp(`(href=["'])${escapedUrlNoSlash}(["'])`, 'gi'),
          new RegExp(`(href=["'])${escapedUrlWithSlash}(["'])`, 'gi'),
        ];
        
        const htmlMatches: Array<{ index: number; match: string; replacement: string }> = [];
        
        for (const pattern of htmlPatterns) {
          let htmlMatch;
          // Reset regex lastIndex to avoid issues with global regex
          pattern.lastIndex = 0;
          while ((htmlMatch = pattern.exec(content)) !== null) {
            const replacement = `${htmlMatch[1]}${fixedUrl}${htmlMatch[2]}`;
            htmlMatches.push({
              index: htmlMatch.index,
              match: htmlMatch[0],
              replacement
            });
            foundAny = true;
          }
        }
        
        // Apply HTML replacements in reverse order
        for (let i = htmlMatches.length - 1; i >= 0; i--) {
          const m = htmlMatches[i];
          const beforeMatch = content.substring(0, m.index);
          const lineNumber = beforeMatch.split('\n').length;
          
          content = beforeMatch + m.replacement + content.substring(m.index + m.match.length);
          changes.push({ oldUrl: url, newUrl: fixedUrl, lineNumber });
          modified = true;
        }
        
        if (!foundAny) {
          devLog(`   ⚠️  Link not found in content (may have already been fixed or format differs)`);
        } else {
          devLog(`   ✅ Found and fixed link`);
        }
      }
    }

    if (!modified) {
      devWarn(`⚠️  No matches found in file for any of the ${brokenLinks.length} link(s)`);
      return { success: false, error: 'No matches found in file', changes: [] };
    }

    devLog(`📝 File modified: ${changes.length} change(s) made`);

    // Create backup
    const backupPath = createBackupFilename(filePath);
    devLog(`💾 Creating backup: ${backupPath}`);
    const backupCreated = await writeFileContent(backupPath, originalContent);
    
    if (!backupCreated) {
      devWarn(`⚠️  Could not create backup: ${backupPath}`);
      // Continue anyway, but warn user
    } else {
      devLog(`✅ Backup created: ${backupPath}`);
    }
    
    // Write modified content
    devLog(`💾 Writing modified content to: ${filePath}`);
    const writeSuccess = await writeFileContent(filePath, content);
    
    if (!writeSuccess) {
      devError(`❌ Could not write file: ${filePath}`);
      return { success: false, error: 'Could not write file', changes };
    }

    devLog(`✅ Successfully fixed ${changes.length} link(s) in ${filePath}`);
    return { success: true, backupPath: backupCreated ? backupPath : undefined, changes };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error', changes: [] };
  }
}

/**
 * Escape special regex characters
 */
// escapeRegex is now imported from utils/file-system.ts

/**
 * Collect all broken links from pages
 */
function collectBrokenLinks(pages: PageData[]): BrokenLinkInfo[] {
  const brokenLinks: BrokenLinkInfo[] = [];

  for (const page of pages) {
    if (page.hasBrokenLinks && page.brokenLinkUrls && Array.isArray(page.brokenLinkUrls)) {
      for (const brokenUrl of page.brokenLinkUrls) {
        // Only process internal links
        if (brokenUrl.startsWith('/') && !brokenUrl.startsWith('//') && !brokenUrl.startsWith('http')) {
          brokenLinks.push({
            brokenUrl,
            sourcePage: page.relPermalink,
          });
        }
      }
    }
  }

  return brokenLinks;
}

/**
 * Fix obvious internal broken links
 */
async function fixObviousBrokenLinks(pages: PageData[]): Promise<FixResult> {
  const result: FixResult = {
    attempted: 0,
    fixed: 0,
    skipped: 0,
    fixes: [],
    skippedLinks: [],
    modifiedFiles: [],
    backups: [],
  };

  // Safety check: only run in dev mode
  if (!isLocalhost()) {
    devError('Fix broken links feature is only available in development mode');
    return result;
  }

  devLog('🔍 Starting broken link fix process...');

  // Check if File System Access API is available
  const hasDirectoryAccess = getSiteRootDirectoryHandle() !== null;
  if (!hasDirectoryAccess) {
    devError('❌ File System Access API not available. Cannot fix links without directory access.');
    devError('💡 Please grant directory access when prompted to enable file operations.');
    return result;
  }

  // Collect all broken links
  const brokenLinks = collectBrokenLinks(pages);
  devLog(`Found ${brokenLinks.length} broken internal links`);

  if (brokenLinks.length === 0) {
    devLog('No broken links to fix.');
    return result;
  }

  // Get all valid page paths for matching
  const allPagePaths = pages.map(p => p.relPermalink);
  devLog(`Checking against ${allPagePaths.length} valid page paths`);

  // Group broken links by source file
  const linksByFile = new Map<string, Array<{ url: string; fixedUrl: string; reason: string; action: 'fix' | 'remove' }>>();

  for (const brokenLink of brokenLinks) {
    result.attempted++;

    devLog(`\n🔗 Processing broken link: ${brokenLink.brokenUrl} (from ${brokenLink.sourcePage})`);

    // Find potential match
    const match = findUrlMatch(brokenLink.brokenUrl, allPagePaths, pages);
    
    if (!match) {
      devLog(`⏭️  Skipped: ${brokenLink.brokenUrl} (no obvious match found)`);
      result.skipped++;
      
      // Find close matches for suggestions
      const suggestions = findCloseMatches(brokenLink.brokenUrl, allPagePaths, pages, 3);
      if (suggestions.length > 0) {
        devLog(`   💡 Found ${suggestions.length} suggestion(s): ${suggestions.map(s => s.url).join(', ')}`);
      }
      
      // Determine source file for skipped links (for removal option)
      const possiblePaths = relPermalinkToContentFile(brokenLink.sourcePage);
      devLog(`   Trying to find source file for skipped link...`);
      const sourceFile = await findActualFilePath(possiblePaths, true); // Enable verbose logging
      
      if (sourceFile) {
        result.skippedLinks.push({
          brokenUrl: brokenLink.brokenUrl,
          sourceFile,
          sourcePage: brokenLink.sourcePage,
          suggestions: suggestions.length > 0 ? suggestions : undefined,
        });
        devLog(`   ✅ Source file found: ${sourceFile}`);
      } else {
        devLog(`   ⚠️  Could not find source file. Tried: ${possiblePaths.join(', ')}`);
        // Still add to skipped links even if source file not found, so user can see the broken link
        result.skippedLinks.push({
          brokenUrl: brokenLink.brokenUrl,
          sourceFile: possiblePaths[0] || 'unknown',
          sourcePage: brokenLink.sourcePage,
          suggestions: suggestions.length > 0 ? suggestions : undefined,
        });
      }
      continue;
    }

    devLog(`   ✅ Found match: ${brokenLink.brokenUrl} → ${match.match} (${match.reason})`);

    // Determine source file (try multiple possible paths)
    const possiblePaths = relPermalinkToContentFile(brokenLink.sourcePage);
    devLog(`   Looking for source file: ${brokenLink.sourcePage}`);
    const sourceFile = await findActualFilePath(possiblePaths, true); // Enable verbose logging
    
    if (!sourceFile) {
      devError(`⏭️  Skipped: ${brokenLink.brokenUrl} (could not find source file)`);
      devError(`   Tried paths: ${possiblePaths.join(', ')}`);
      devError(`   Make sure File System Access API has access to the site root directory.`);
      result.skipped++;
      continue;
    }

    devLog(`   ✅ Source file found: ${sourceFile}`);

    // Add to fixes
    if (!linksByFile.has(sourceFile)) {
      linksByFile.set(sourceFile, []);
    }
    linksByFile.get(sourceFile)!.push({
      url: brokenLink.brokenUrl,
      fixedUrl: match.match,
      reason: match.reason,
      action: 'fix' as const,
    });

    result.fixes.push({
      brokenUrl: brokenLink.brokenUrl,
      fixedUrl: match.match,
      sourceFile,
      lineNumber: 0, // Will be determined when reading file
      matchReason: match.reason,
      action: 'fix',
    });
  }

  // Fix links in each file
  for (const [filePath, fixes] of linksByFile.entries()) {
    devLog(`📝 Fixing ${fixes.length} link(s) in ${filePath}...`);
    
    const fixResult = await fixBrokenLinksInFile(filePath, fixes.map(f => ({
      url: f.url,
      fixedUrl: f.fixedUrl,
      action: f.action || 'fix' as const
    })));
    
    if (fixResult.success) {
      result.modifiedFiles.push(filePath);
      if (fixResult.backupPath) {
        result.backups.push(fixResult.backupPath);
      }
      
      // Update fixes with actual line numbers from changes
      for (const change of fixResult.changes) {
        const existingFix = result.fixes.find(f => f.brokenUrl === change.oldUrl && f.sourceFile === filePath);
        if (existingFix) {
          existingFix.lineNumber = change.lineNumber;
        }
      }
      
      result.fixed += fixResult.changes.length;
      devLog(`✅ Fixed ${fixResult.changes.length} link(s) in ${filePath}`);
    } else {
      devError(`❌ Failed to fix links in ${filePath}:`, fixResult.error);
      result.skipped += fixes.length;
    }
  }

  devLog(`✨ Fix process complete: ${result.fixed} fixed, ${result.skipped} skipped`);
  return result;
}

/**
 * Show toast notification
 */
// showToast is now imported from utils/dev-ui.ts

/**
 * Close loading modal safely
 */
function closeLoadingModal(): void {
  const loadingModal = document.getElementById('page-list-fix-loading-modal');
  if (loadingModal) {
    // Force removal from DOM
    loadingModal.style.display = 'none';
    loadingModal.remove();
  }
}

/**
 * Show loading modal (removes any existing one first)
 */
function showLoadingModal(message: string, progress?: number): void {
  // Remove any existing loading modal first
  closeLoadingModal();
  
  const loadingModalHtml = renderLoadingModal(message, progress);
  document.body.insertAdjacentHTML('beforeend', loadingModalHtml);
}

/**
 * Render loading modal
 */
function renderLoadingModal(message: string, progress?: number): string {
  return `
    <div class="page-list-modal" id="page-list-fix-loading-modal" role="dialog" aria-labelledby="page-list-fix-loading-title" aria-busy="true">
      <div class="page-list-modal__overlay"></div>
      <div class="page-list-modal__content page-list-modal__content--centered">
        <div class="page-list-modal__body">
          <div class="page-list-fix-loading">
            <div class="page-list-fix-loading__spinner" aria-hidden="true">
              <div class="page-list-fix-loading__spinner-circle"></div>
            </div>
            <h3 class="page-list-fix-loading__title" id="page-list-fix-loading-title">${escapeHtml(message)}</h3>
            ${progress !== undefined ? `
              <div class="page-list-fix-loading__progress">
                <div class="page-list-fix-loading__progress-bar" style="width: ${progress}%"></div>
              </div>
              <div class="page-list-fix-loading__progress-text">${progress}% complete</div>
            ` : ''}
            <p class="page-list-fix-loading__subtitle">Please wait while we process your request...</p>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Render fix results modal
 */
function renderFixResultsModal(result: FixResult): string {
  const fixesHtml = result.fixes.length > 0
    ? result.fixes.map((fix, index) => `
      <div class="page-list-fix-result-item" role="listitem">
        <div class="page-list-fix-result-item__header">
          <div class="page-list-fix-result-item__file">
            <span class="page-list-fix-result-item__file-icon material-symbols-outlined" aria-hidden="true">description</span>
            <code class="page-list-fix-result-item__file-path">${escapeHtml(fix.sourceFile)}</code>
            ${fix.lineNumber > 0 ? `<span class="page-list-fix-result-item__line" aria-label="Line number">L${fix.lineNumber}</span>` : ''}
          </div>
          <span class="page-list-fix-result-item__badge page-list-fix-result-item__badge--success" aria-label="Fixed successfully">
            <span class="material-symbols-outlined" aria-hidden="true">check</span>
            Fixed
          </span>
        </div>
        <div class="page-list-fix-result-item__change" aria-label="URL change">
          <div class="page-list-fix-result-item__change-old">
            <span class="page-list-fix-result-item__change-label">From:</span>
            <code class="page-list-fix-result-item__change-url">${escapeHtml(fix.brokenUrl)}</code>
          </div>
          <span class="page-list-fix-result-item__arrow material-symbols-outlined" aria-hidden="true">arrow_forward</span>
          <div class="page-list-fix-result-item__change-new">
            <span class="page-list-fix-result-item__change-label">To:</span>
            <code class="page-list-fix-result-item__change-url">${escapeHtml(fix.fixedUrl || '(removed)')}</code>
          </div>
        </div>
        <div class="page-list-fix-result-item__reason">
          <span class="page-list-fix-result-item__reason-icon material-symbols-outlined" aria-hidden="true">lightbulb</span>
          <span class="page-list-fix-result-item__reason-text">${escapeHtml(fix.matchReason)}</span>
        </div>
      </div>
    `).join('')
    : '<div class="page-list-fix-result-empty" role="status"><span class="material-symbols-outlined" aria-hidden="true">info</span><p>No fixes were applied.</p></div>';

  const modifiedFilesHtml = result.modifiedFiles.length > 0
    ? `<ul class="page-list-fix-result-files" role="list">
        ${result.modifiedFiles.map((file, index) => `
          <li class="page-list-fix-result-files__item" role="listitem">
            <span class="material-symbols-outlined" aria-hidden="true">edit</span>
            <code>${escapeHtml(file)}</code>
          </li>
        `).join('')}
      </ul>`
    : '<div class="page-list-fix-result-empty" role="status"><span class="material-symbols-outlined" aria-hidden="true">info</span><p>No files were modified.</p></div>';

  const backupsHtml = result.backups.length > 0
    ? `<ul class="page-list-fix-result-files" role="list">
        ${result.backups.map((backup, index) => `
          <li class="page-list-fix-result-files__item" role="listitem">
            <span class="material-symbols-outlined" aria-hidden="true">backup</span>
            <code>${escapeHtml(backup)}</code>
          </li>
        `).join('')}
      </ul>`
    : '';

  const successRate = result.attempted > 0 ? Math.round((result.fixed / result.attempted) * 100) : 0;

  // Render skipped links with suggestions and actions
  const skippedLinksHtml = result.skippedLinks.length > 0
    ? result.skippedLinks.map((skipped, index) => {
        const suggestions = skipped.suggestions || [];
        return `
      <div class="page-list-fix-result-item page-list-fix-result-item--skipped" role="listitem" data-skipped-index="${index}">
        <div class="page-list-fix-result-item__header">
          <div class="page-list-fix-result-item__file">
            <span class="page-list-fix-result-item__file-icon material-symbols-outlined" aria-hidden="true">description</span>
            <code class="page-list-fix-result-item__file-path">${escapeHtml(skipped.sourceFile)}</code>
          </div>
          <span class="page-list-fix-result-item__badge page-list-fix-result-item__badge--warning" aria-label="Could not auto-fix">
            <span class="material-symbols-outlined" aria-hidden="true">warning</span>
            No Match Found
          </span>
        </div>
        <div class="page-list-fix-result-item__change" aria-label="Broken URL">
          <div class="page-list-fix-result-item__change-old">
            <span class="page-list-fix-result-item__change-label">Broken Link:</span>
            <code class="page-list-fix-result-item__change-url">${escapeHtml(skipped.brokenUrl)}</code>
          </div>
        </div>
        ${suggestions.length > 0 ? `
        <div class="page-list-fix-result-item__suggestions">
          <div class="page-list-fix-result-item__suggestions-label">
            <span class="material-symbols-outlined" aria-hidden="true">lightbulb</span>
            Suggested matches:
          </div>
          <div class="page-list-fix-result-item__suggestions-list">
            ${suggestions.map((suggestion, sugIndex) => `
              <div class="page-list-fix-result-item__suggestion" data-suggestion-index="${sugIndex}">
                <div class="page-list-fix-result-item__suggestion-content">
                  <code class="page-list-fix-result-item__suggestion-url">${escapeHtml(suggestion.url)}</code>
                  ${suggestion.title ? `<span class="page-list-fix-result-item__suggestion-title">${escapeHtml(suggestion.title)}</span>` : ''}
                  <span class="page-list-fix-result-item__suggestion-reason">${escapeHtml(suggestion.reason)}</span>
                </div>
                <button 
                  class="page-list-fix-result-item__suggestion-btn" 
                  type="button"
                  data-edit-broken-url="${escapeHtml(skipped.brokenUrl)}"
                  data-edit-fixed-url="${escapeHtml(suggestion.url)}"
                  data-edit-file="${escapeHtml(skipped.sourceFile)}"
                  aria-label="Fix broken link to ${escapeHtml(suggestion.url)}"
                >
                  <span class="material-symbols-outlined" aria-hidden="true">check</span>
                  Use This
                </button>
              </div>
            `).join('')}
          </div>
        </div>
        ` : ''}
        <div class="page-list-fix-result-item__actions">
          <button 
            class="page-list-fix-result-item__edit-btn" 
            type="button"
            data-edit-broken-url="${escapeHtml(skipped.brokenUrl)}"
            data-edit-file="${escapeHtml(skipped.sourceFile)}"
            aria-label="Manually edit this broken link"
          >
            <span class="material-symbols-outlined" aria-hidden="true">edit</span>
            Edit Manually
          </button>
          <button 
            class="page-list-fix-result-item__remove-btn" 
            type="button"
            data-remove-url="${escapeHtml(skipped.brokenUrl)}"
            data-remove-file="${escapeHtml(skipped.sourceFile)}"
            aria-label="Remove this broken link and keep only the text"
          >
            <span class="material-symbols-outlined" aria-hidden="true">link_off</span>
            Remove Link
          </button>
        </div>
      </div>
    `;
      }).join('')
    : '';

  return `
    <div class="page-list-modal" id="page-list-fix-results-modal" role="dialog" aria-labelledby="page-list-fix-results-title" aria-modal="true">
      <div class="page-list-modal__overlay" aria-hidden="true"></div>
      <div class="page-list-modal__content page-list-modal__content--large">
        <button 
          class="page-list-modal__close" 
          id="page-list-fix-results-close" 
          type="button"
          aria-label="Close dialog"
        >
          <span class="material-symbols-outlined" aria-hidden="true">close</span>
        </button>
        <div class="page-list-modal__header">
          <div class="page-list-modal__header-icon">
            <span class="material-symbols-outlined" aria-hidden="true">${result.fixed > 0 ? 'check_circle' : 'info'}</span>
          </div>
          <h2 class="page-list-modal__title" id="page-list-fix-results-title">Broken Link Fix Results</h2>
          <p class="page-list-modal__subtitle">${result.fixed > 0 ? `${result.fixed} link${result.fixed !== 1 ? 's' : ''} fixed successfully` : 'No fixes were applied'}</p>
        </div>
        <div class="page-list-modal__body">
          <div class="page-list-fix-result-summary" role="status" aria-live="polite">
            <div class="page-list-fix-result-summary__stat">
              <div class="page-list-fix-result-summary__value" aria-label="${result.attempted} attempted">${result.attempted}</div>
              <div class="page-list-fix-result-summary__label">Attempted</div>
            </div>
            <div class="page-list-fix-result-summary__stat page-list-fix-result-summary__stat--success">
              <div class="page-list-fix-result-summary__value" aria-label="${result.fixed} fixed">${result.fixed}</div>
              <div class="page-list-fix-result-summary__label">Fixed</div>
              ${successRate > 0 ? `<div class="page-list-fix-result-summary__rate">${successRate}%</div>` : ''}
            </div>
            <div class="page-list-fix-result-summary__stat page-list-fix-result-summary__stat--warning">
              <div class="page-list-fix-result-summary__value" aria-label="${result.skipped} skipped">${result.skipped}</div>
              <div class="page-list-fix-result-summary__label">Skipped</div>
            </div>
          </div>
          
          ${result.fixes.length > 0 ? `
          <div class="page-list-modal__section">
            <h3 class="page-list-modal__section-title">
              <span class="material-symbols-outlined" aria-hidden="true">check_circle</span>
              Links Fixed
              <span class="page-list-modal__section-count">${result.fixes.length}</span>
            </h3>
            <div class="page-list-modal__section-content">
              <div class="page-list-fix-result-changes" role="list">
                ${fixesHtml}
              </div>
            </div>
          </div>
          ` : ''}

          ${result.skippedLinks.length > 0 ? `
          <div class="page-list-modal__section">
            <h3 class="page-list-modal__section-title">
              <span class="material-symbols-outlined" aria-hidden="true">link_off</span>
              Links That Couldn't Be Auto-Fixed
              <span class="page-list-modal__section-count">${result.skippedLinks.length}</span>
            </h3>
            <div class="page-list-modal__section-content">
              <p class="page-list-fix-result-note">
                These broken links couldn't be automatically matched. Suggested matches are shown below each link. You can use a suggestion, edit manually, or remove the link to keep only the text.
              </p>
              <div class="page-list-fix-result-changes" role="list">
                ${skippedLinksHtml}
              </div>
            </div>
          </div>
          ` : ''}

          <div class="page-list-modal__section">
            <h3 class="page-list-modal__section-title">
              <span class="material-symbols-outlined" aria-hidden="true">folder</span>
              Modified Files
              <span class="page-list-modal__section-count">${result.modifiedFiles.length}</span>
            </h3>
            <div class="page-list-modal__section-content">
              ${modifiedFilesHtml}
            </div>
          </div>

          ${result.backups.length > 0 ? `
          <div class="page-list-modal__section">
            <h3 class="page-list-modal__section-title">
              <span class="material-symbols-outlined" aria-hidden="true">backup</span>
              Backups Created
              <span class="page-list-modal__section-count">${result.backups.length}</span>
            </h3>
            <div class="page-list-modal__section-content">
              ${backupsHtml}
            </div>
          </div>
          ` : ''}

          <div class="page-list-modal__actions" role="group" aria-label="Modal actions">
            ${result.backups.length > 0 ? `
              <button 
                class="page-list-modal__button page-list-modal__button--secondary" 
                id="page-list-fix-undo"
                type="button"
                aria-label="Undo all fixes and restore from backups"
              >
                <span class="material-symbols-outlined" aria-hidden="true">undo</span>
                Undo All Fixes
              </button>
            ` : ''}
            <button 
              class="page-list-modal__button page-list-modal__button--primary" 
              id="page-list-fix-close"
              type="button"
              aria-label="Close dialog"
            >
              <span class="material-symbols-outlined" aria-hidden="true">check</span>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Attach tooltip hover handlers
 */
function attachTooltipHandlers(container: HTMLElement | null): void {
  if (!container) return;
  
  const tooltipTriggers = container.querySelectorAll('.page-list-tooltip-trigger');
  
  tooltipTriggers.forEach(trigger => {
    const tooltip = trigger.querySelector('.page-list-tooltip') as HTMLElement;
    if (!tooltip) return;
    
    trigger.addEventListener('mouseenter', (e: Event) => {
      const mouseEvent = e as MouseEvent;
      tooltip.style.display = 'block';
      updateTooltipPosition(tooltip, mouseEvent);
    });
    
    trigger.addEventListener('mousemove', (e: Event) => {
      const mouseEvent = e as MouseEvent;
      updateTooltipPosition(tooltip, mouseEvent);
    });
    
    trigger.addEventListener('mouseleave', () => {
      tooltip.style.display = 'none';
    });
  });
}

/**
 * Update tooltip position to follow cursor
 */
function updateTooltipPosition(tooltip: HTMLElement, e: MouseEvent): void {
  const offset = 10;
  const tooltipRect = tooltip.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  
  let left = e.clientX;
  let top = e.clientY - tooltipRect.height - offset;
  
  // Adjust if tooltip would go off screen
  if (left + tooltipRect.width > viewportWidth) {
    left = viewportWidth - tooltipRect.width - offset;
  }
  if (left < 0) {
    left = offset;
  }
  
  // If tooltip would go above viewport, show below cursor instead
  if (top < 0) {
    top = e.clientY + offset;
  }
  
  tooltip.style.left = `${left}px`;
  tooltip.style.top = `${top}px`;
}

// createConfirmationDialog is now imported from utils/dev-ui.ts

/**
 * Attach fix button handler
 */
function attachFixButtonHandler(pages: PageData[]): void {
  const fixButton = document.getElementById('page-list-fix-broken-links');
  if (!fixButton) return;

  fixButton.addEventListener('click', async () => {
    // Safety check
    if (!isLocalhost()) {
      showToast('This feature is only available in development mode.', 'error', 5000, 'page-list');
      return;
    }

    // Request directory access if File System Access API is available
    if ('showDirectoryPicker' in window && !getSiteRootDirectoryHandle()) {
      const accessGranted = await createConfirmationDialog(
        'Directory Access Required',
        'To fix broken links, we need access to your site files.\n\n' +
        'Please select the ROOT directory of your Hugo site (the folder containing the "content" folder).\n\n' +
        'This permission is only requested once per browser session.',
        'Select Site Root',
        'Cancel',
        'page-list'
      );
      
      if (accessGranted) {
        const dirHandle = await requestSiteRootAccess(
          (msg) => showToast(msg, 'success', 5000, 'page-list'),
          (msg) => showToast(msg, 'error', 5000, 'page-list')
        );
        if (!dirHandle) {
          showToast('Directory access is required to fix broken links. Please grant access to continue.', 'error', 6000, 'page-list');
          return;
        }
      } else {
        // User cancelled directory access request
        showToast('Directory access is required to fix broken links.', 'info', 5000, 'page-list');
        return;
      }
    } else if (!('showDirectoryPicker' in window)) {
      // File System Access API not supported
      showToast('File System Access API is not supported in this browser. Cannot fix broken links.', 'error', 6000, 'page-list');
      return;
    } else if (!getSiteRootDirectoryHandle()) {
      // File System Access API is available but directory handle is not set
      showToast('Directory access is required. Please grant access when prompted.', 'error', 6000, 'page-list');
      return;
    }

    // Count broken links
    const brokenLinks = collectBrokenLinks(pages);
    if (brokenLinks.length === 0) {
      showToast('No broken links found to fix.', 'info', 5000, 'page-list');
      return;
    }

    // Show confirmation dialog
    const confirmed = await createConfirmationDialog(
      'Fix Broken Links',
      `This will attempt to fix ${brokenLinks.length} broken internal link${brokenLinks.length !== 1 ? 's' : ''}.\n\n` +
      '• Only internal links will be modified\n' +
      '• Backups will be created for all modified files\n' +
      '• Only obvious matches will be fixed\n' +
      '• Links without clear matches will be skipped\n\n' +
      'Do you want to continue?',
      'Fix Links',
      'Cancel',
      'page-list'
    );

    if (!confirmed) {
      return;
    }

    // Update button state
    fixButton.setAttribute('disabled', 'true');
    fixButton.setAttribute('aria-busy', 'true');
    fixButton.classList.add('page-list-fix-button--loading');
    const originalContent = fixButton.innerHTML;
    fixButton.innerHTML = `
      <span class="page-list-fix-button__icon material-symbols-outlined page-list-fix-button__icon--spinning" aria-hidden="true">hourglass_empty</span>
      <span class="page-list-fix-button__text">Processing...</span>
    `;

    // Show loading modal
    showLoadingModal('Analyzing broken links...', 0);
    
    // Update progress
    const updateProgress = (progress: number, message: string) => {
      const modal = document.getElementById('page-list-fix-loading-modal');
      if (modal) {
        const title = modal.querySelector('.page-list-fix-loading__title');
        const progressBar = modal.querySelector('.page-list-fix-loading__progress-bar') as HTMLElement;
        const progressText = modal.querySelector('.page-list-fix-loading__progress-text');
        if (title) title.textContent = message;
        if (progressBar) progressBar.style.width = `${progress}%`;
        if (progressText) progressText.textContent = `${progress}% complete`;
      }
    };

    try {
      // Simulate progress updates
      updateProgress(10, 'Collecting broken links...');
      await new Promise(resolve => setTimeout(resolve, 300));
      
      updateProgress(30, 'Finding potential matches...');
      await new Promise(resolve => setTimeout(resolve, 300));
      
      updateProgress(60, 'Applying fixes...');
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Run fix process
      const result = await fixObviousBrokenLinks(pages);
      
      updateProgress(100, 'Complete!');
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Remove loading modal
      closeLoadingModal();

      // Show success toast
      if (result.fixed > 0) {
        showToast(`Successfully fixed ${result.fixed} broken link${result.fixed !== 1 ? 's' : ''}!`, 'success', 4000, 'page-list');
      } else {
        showToast('No links could be automatically fixed.', 'info', 4000, 'page-list');
      }

      // Show results modal
      const modalHtml = renderFixResultsModal(result);
      document.body.insertAdjacentHTML('beforeend', modalHtml);

      const modal = document.getElementById('page-list-fix-results-modal');
      const closeBtn = document.getElementById('page-list-fix-results-close');
      const closeBtn2 = document.getElementById('page-list-fix-close');
      const undoBtn = document.getElementById('page-list-fix-undo');
      const overlay = modal?.querySelector('.page-list-modal__overlay');

      // Focus management
      if (modal) {
        const firstFocusable = modal.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])') as HTMLElement;
        if (firstFocusable) {
          firstFocusable.focus();
        }
      }

      const closeModal = () => {
        if (modal) {
          modal.classList.add('page-list-modal--closing');
          setTimeout(() => {
            modal.remove();
            // Return focus to fix button
            fixButton.focus();
          }, 300);
        }
      };

      if (closeBtn) closeBtn.addEventListener('click', closeModal);
      if (closeBtn2) closeBtn2.addEventListener('click', closeModal);
      if (overlay) overlay.addEventListener('click', closeModal);

      // Undo functionality
      if (undoBtn) {
        undoBtn.addEventListener('click', async () => {
          const undoConfirmed = await createConfirmationDialog(
            'Undo All Fixes',
            `This will restore ${result.modifiedFiles.length} file${result.modifiedFiles.length !== 1 ? 's' : ''} from backups.\n\n` +
            'All fixes will be reverted. Continue?',
            'Undo',
            'Cancel',
            'page-list'
          );
          
          if (undoConfirmed) {
            // In real implementation, would restore files from backups
            devLog('Undo functionality would restore from:', result.backups);
            showToast('Undo functionality requires backend API implementation.', 'info', 5000, 'page-list');
            closeModal();
          }
        });
      }

      // Helper function to fix a link in a file
      const fixLinkInFile = async (brokenUrl: string, fixedUrl: string, filePath: string, button: HTMLElement, originalText: string): Promise<boolean> => {
        try {
          // Read file
          const fileData = await readFileContent(filePath, true);
          if (!fileData) {
            showToast(`Could not read file: ${filePath}`, 'error', 5000, 'page-list');
            return false;
          }
          
          // Fix the link
          const escapedUrl = escapeRegex(brokenUrl);
          let modifiedContent = fileData.content;
          let modified = false;
          
          // Replace markdown links
          const markdownPattern = new RegExp(`(\\[[^\\]]+\\]\\()${escapedUrl}([^)]*\\))`, 'g');
          modifiedContent = modifiedContent.replace(markdownPattern, (match, prefix, suffix) => {
            modified = true;
            return `${prefix}${fixedUrl}${suffix}`;
          });
          
          // Replace HTML links
          const htmlPattern = new RegExp(`(href=["'])${escapedUrl}(["'])`, 'gi');
          modifiedContent = modifiedContent.replace(htmlPattern, (match, prefix, suffix) => {
            modified = true;
            return `${prefix}${fixedUrl}${suffix}`;
          });
          
          if (!modified) {
            showToast('Link not found in file content.', 'info', 5000, 'page-list');
            return false;
          }
          
          // Create backup
          const backupPath = createBackupFilename(filePath);
          const backupCreated = await writeFileContent(backupPath, fileData.content);
          
          if (!backupCreated) {
            devWarn(`Could not create backup: ${backupPath}`);
          }
          
          // Write modified content
          const writeSuccess = await writeFileContent(filePath, modifiedContent);
          
          if (!writeSuccess) {
            showToast(`Could not write file: ${filePath}`, 'error', 5000, 'page-list');
            return false;
          }
          
          // Success!
          showToast(`Link fixed: ${brokenUrl} → ${fixedUrl}`, 'success', 5000, 'page-list');
          
          // Update UI - mark as fixed
          const item = button.closest('.page-list-fix-result-item');
          if (item) {
            item.classList.remove('page-list-fix-result-item--skipped');
            item.classList.add('page-list-fix-result-item--fixed');
            const badge = item.querySelector('.page-list-fix-result-item__badge');
            if (badge) {
              badge.className = 'page-list-fix-result-item__badge page-list-fix-result-item__badge--success';
              badge.innerHTML = '<span class="material-symbols-outlined" aria-hidden="true">check</span> Fixed';
            }
            
            // Update the change display
            const changeOld = item.querySelector('.page-list-fix-result-item__change-old .page-list-fix-result-item__change-url');
            const changeNew = item.querySelector('.page-list-fix-result-item__change-new');
            if (changeOld && changeNew) {
              const arrow = item.querySelector('.page-list-fix-result-item__arrow');
              if (!arrow) {
                const changeContainer = item.querySelector('.page-list-fix-result-item__change');
                if (changeContainer) {
                  changeContainer.innerHTML = `
                    <div class="page-list-fix-result-item__change-old">
                      <span class="page-list-fix-result-item__change-label">From:</span>
                      <code class="page-list-fix-result-item__change-url">${escapeHtml(brokenUrl)}</code>
                    </div>
                    <span class="page-list-fix-result-item__arrow material-symbols-outlined" aria-hidden="true">arrow_forward</span>
                    <div class="page-list-fix-result-item__change-new">
                      <span class="page-list-fix-result-item__change-label">To:</span>
                      <code class="page-list-fix-result-item__change-url">${escapeHtml(fixedUrl)}</code>
                    </div>
                  `;
                }
              } else {
                const newUrlElement = changeNew.querySelector('.page-list-fix-result-item__change-url');
                if (newUrlElement) {
                  newUrlElement.textContent = fixedUrl;
                }
              }
            }
            
            // Remove suggestions and action buttons
            const suggestions = item.querySelector('.page-list-fix-result-item__suggestions');
            if (suggestions) suggestions.remove();
            const actions = item.querySelector('.page-list-fix-result-item__actions');
            if (actions) actions.remove();
          }
          
          devLog(`✅ Fixed link "${brokenUrl}" → "${fixedUrl}" in ${filePath}`);
          return true;
        } catch (error) {
          devError('Error fixing link:', error);
          showToast(`Error fixing link: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error', 5000, 'page-list');
          return false;
        }
      };

      // Suggestion button functionality (Use This button)
      const suggestionButtons = modal?.querySelectorAll('.page-list-fix-result-item__suggestion-btn');
      suggestionButtons?.forEach((btn) => {
        btn.addEventListener('click', async () => {
          const button = btn as HTMLElement;
          const brokenUrl = button.getAttribute('data-edit-broken-url');
          const fixedUrl = button.getAttribute('data-edit-fixed-url');
          const filePath = button.getAttribute('data-edit-file');
          
          if (!brokenUrl || !fixedUrl || !filePath) return;
          
          const confirmed = await createConfirmationDialog(
            'Fix Broken Link',
            `This will fix the broken link "${brokenUrl}" to "${fixedUrl}" in "${filePath}".\n\n` +
            'A backup will be created before making changes. Continue?',
            'Fix Link',
            'Cancel',
            'page-list'
          );
          
          if (!confirmed) return;
          
          // Disable button during processing
          button.setAttribute('disabled', 'true');
          button.classList.add('page-list-fix-button--loading');
          const originalText = button.innerHTML;
          button.innerHTML = '<span class="material-symbols-outlined" aria-hidden="true">hourglass_empty</span> Fixing...';
          
          const success = await fixLinkInFile(brokenUrl, fixedUrl, filePath, button, originalText);
          
          if (!success) {
            button.removeAttribute('disabled');
            button.classList.remove('page-list-fix-button--loading');
            button.innerHTML = originalText;
          }
        });
      });

      // Edit button functionality (Edit Manually)
      const editButtons = modal?.querySelectorAll('.page-list-fix-result-item__edit-btn');
      editButtons?.forEach((btn) => {
        btn.addEventListener('click', async () => {
          const button = btn as HTMLElement;
          const brokenUrl = button.getAttribute('data-edit-broken-url');
          const filePath = button.getAttribute('data-edit-file');
          
          if (!brokenUrl || !filePath) return;
          
          // Prompt for new URL
          const newUrl = await createUrlInputDialog('Enter new URL:', brokenUrl, 'page-list');
          
          if (!newUrl || newUrl === brokenUrl) {
            return;
          }
          
          const confirmed = await createConfirmationDialog(
            'Fix Broken Link',
            `This will fix the broken link "${brokenUrl}" to "${newUrl}" in "${filePath}".\n\n` +
            'A backup will be created before making changes. Continue?',
            'Fix Link',
            'Cancel',
            'page-list'
          );
          
          if (!confirmed) return;
          
          // Disable button during processing
          button.setAttribute('disabled', 'true');
          button.classList.add('page-list-fix-button--loading');
          const originalText = button.innerHTML;
          button.innerHTML = '<span class="material-symbols-outlined" aria-hidden="true">hourglass_empty</span> Fixing...';
          
          const success = await fixLinkInFile(brokenUrl, newUrl, filePath, button, originalText);
          
          if (!success) {
            button.removeAttribute('disabled');
            button.classList.remove('page-list-fix-button--loading');
            button.innerHTML = originalText;
          }
        });
      });

      // Remove link functionality
      const removeButtons = modal?.querySelectorAll('.page-list-fix-result-item__remove-btn');
      removeButtons?.forEach((btn) => {
        btn.addEventListener('click', async () => {
          const button = btn as HTMLElement;
          const url = button.getAttribute('data-remove-url');
          const filePath = button.getAttribute('data-remove-file');
          
          if (!url || !filePath) return;
          
          const confirmed = await createConfirmationDialog(
            'Remove Broken Link',
            `This will remove the broken link "${url}" from "${filePath}" and keep only the text.\n\n` +
            'A backup will be created before making changes. Continue?',
            'Remove Link',
            'Cancel',
            'page-list'
          );
          
          if (!confirmed) return;
          
          // Disable button during processing
          button.setAttribute('disabled', 'true');
          button.classList.add('page-list-fix-button--loading');
          const originalText = button.innerHTML;
          button.innerHTML = '<span class="material-symbols-outlined" aria-hidden="true">hourglass_empty</span> Removing...';
          
          try {
            // Read file
            const fileData = await readFileContent(filePath);
            if (!fileData) {
              showToast(`Could not read file: ${filePath}`, 'error', 5000, 'page-list');
              button.removeAttribute('disabled');
              button.classList.remove('page-list-fix-button--loading');
              button.innerHTML = originalText;
              return;
            }
            
            // Remove the link
            const removalResult = removeLinkFromContent(fileData.content, url);
            
            if (removalResult.changes.length === 0) {
              showToast('Link not found in file content.', 'info', 5000, 'page-list');
              button.removeAttribute('disabled');
              button.classList.remove('page-list-fix-button--loading');
              button.innerHTML = originalText;
              return;
            }
            
            // Create backup
            const backupPath = createBackupFilename(filePath);
            const backupCreated = await writeFileContent(backupPath, fileData.content);
            
            if (!backupCreated) {
              devWarn(`Could not create backup: ${backupPath}`);
            }
            
            // Write modified content
            const writeSuccess = await writeFileContent(filePath, removalResult.content);
            
            if (!writeSuccess) {
              showToast(`Could not write file: ${filePath}`, 'error', 5000, 'page-list');
              button.removeAttribute('disabled');
              button.classList.remove('page-list-fix-button--loading');
              button.innerHTML = originalText;
              return;
            }
            
            // Success!
            showToast(`Link removed successfully from ${filePath}`, 'success', 5000, 'page-list');
            
            // Update UI - mark as removed
            const item = button.closest('.page-list-fix-result-item');
            if (item) {
              item.classList.add('page-list-fix-result-item--removed');
              const badge = item.querySelector('.page-list-fix-result-item__badge');
              if (badge) {
                badge.className = 'page-list-fix-result-item__badge page-list-fix-result-item__badge--success';
                badge.innerHTML = '<span class="material-symbols-outlined" aria-hidden="true">check</span> Removed';
              }
              button.remove();
            }
            
            devLog(`✅ Removed link "${url}" from ${filePath}`);
          } catch (error) {
            devError('Error removing link:', error);
            showToast(`Error removing link: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error', 5000, 'page-list');
            button.removeAttribute('disabled');
            button.classList.remove('dev-score-bubble__broken-link-menu-action--loading');
            button.innerHTML = originalText;
          }
        });
      });

      // Close on Escape key
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && modal && document.body.contains(modal)) {
          closeModal();
          document.removeEventListener('keydown', handleEscape);
        }
      };
      document.addEventListener('keydown', handleEscape);

      // Trap focus within modal
      const trapFocus = (e: KeyboardEvent) => {
        if (e.key !== 'Tab' || !modal) return;
        
        const focusableElements = modal.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
        
        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      };
      
      modal?.addEventListener('keydown', trapFocus);

    } catch (error) {
      devError('Error fixing broken links:', error);
      
      // Remove loading modal if still present
      closeLoadingModal();
      
      // Show error toast
      showToast(
        `Error fixing broken links: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'error',
        6000,
        'page-list'
      );
    } finally {
      // Ensure loading modal is closed
      closeLoadingModal();
      
      // Re-enable button
      fixButton.removeAttribute('disabled');
      fixButton.removeAttribute('aria-busy');
      fixButton.classList.remove('page-list-fix-button--loading');
      fixButton.innerHTML = originalContent;
    }
  });
}

/**
 * Export page list data to CSV format
 * @param pages - Array of page data to export
 * @param filename - Name for the downloaded file
 */
function exportPagesToCSV(pages: PageData[], filename: string): void {
  if (pages.length === 0) {
    showToast('No pages to export', 'info', 3000, 'page-list');
    return;
  }

  // CSV header
  const headers = [
    'Page Title',
    'Page Title (Character Count)',
    'Meta Title',
    'Meta Title (Character Count)',
    'Meta Description',
    'Meta Description (Character Count)',
    'Link (URL)',
    'URL (Character Count)'
  ];
  const rows = [headers.join(',')];

  // CSV rows
  pages.forEach(page => {
    const pageTitle = page.title || '';
    const metaTitle = page.metaTitle || '';
    const metaDescription = page.metaDescription || '';
    const url = page.relPermalink || '';
    
    const row = [
      `"${pageTitle.replace(/"/g, '""')}"`, // Escape quotes
      pageTitle.length.toString(),
      `"${metaTitle.replace(/"/g, '""')}"`,
      (page.metaTitleLength || metaTitle.length).toString(),
      `"${metaDescription.replace(/"/g, '""')}"`,
      (page.metaDescriptionLength || metaDescription.length).toString(),
      `"${url.replace(/"/g, '""')}"`,
      url.length.toString()
    ];
    rows.push(row.join(','));
  });

  // Create blob and download
  const csvContent = rows.join('\n');
  // Add BOM for Excel UTF-8 support
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  showToast(`Exported ${pages.length} pages to ${filename}`, 'success', 3000, 'page-list');
}

/**
 * Export page list data to Excel format (Excel 2003 XML format)
 * @param pages - Array of page data to export
 * @param filename - Name for the downloaded file
 */
function exportPagesToExcel(pages: PageData[], filename: string): void {
  if (pages.length === 0) {
    showToast('No pages to export', 'info', 3000, 'page-list');
    return;
  }

  // Excel XML header
  let xml = '<?xml version="1.0"?>\n';
  xml += '<?mso-application progid="Excel.Sheet"?>\n';
  xml += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"\n';
  xml += ' xmlns:o="urn:schemas-microsoft-com:office:office"\n';
  xml += ' xmlns:x="urn:schemas-microsoft-com:office:excel"\n';
  xml += ' xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"\n';
  xml += ' xmlns:html="http://www.w3.org/TR/REC-html40">\n';
  xml += '<Worksheet ss:Name="SEO Analysis">\n';
  xml += '<Table>\n';

  // Header row
  xml += '<Row>\n';
  const headers = [
    'Page Title',
    'Page Title (Character Count)',
    'Meta Title',
    'Meta Title (Character Count)',
    'Meta Description',
    'Meta Description (Character Count)',
    'Link (URL)',
    'URL (Character Count)'
  ];
  headers.forEach(header => {
    xml += `<Cell><Data ss:Type="String">${escapeHtml(header)}</Data></Cell>\n`;
  });
  xml += '</Row>\n';

  // Data rows
  pages.forEach(page => {
    const pageTitle = page.title || '';
    const metaTitle = page.metaTitle || '';
    const metaDescription = page.metaDescription || '';
    const url = page.relPermalink || '';
    
    xml += '<Row>\n';
    xml += `<Cell><Data ss:Type="String">${escapeHtml(pageTitle)}</Data></Cell>\n`;
    xml += `<Cell><Data ss:Type="Number">${pageTitle.length}</Data></Cell>\n`;
    xml += `<Cell><Data ss:Type="String">${escapeHtml(metaTitle)}</Data></Cell>\n`;
    xml += `<Cell><Data ss:Type="Number">${page.metaTitleLength || metaTitle.length}</Data></Cell>\n`;
    xml += `<Cell><Data ss:Type="String">${escapeHtml(metaDescription)}</Data></Cell>\n`;
    xml += `<Cell><Data ss:Type="Number">${page.metaDescriptionLength || metaDescription.length}</Data></Cell>\n`;
    xml += `<Cell><Data ss:Type="String">${escapeHtml(url)}</Data></Cell>\n`;
    xml += `<Cell><Data ss:Type="Number">${url.length}</Data></Cell>\n`;
    xml += '</Row>\n';
  });

  xml += '</Table>\n';
  xml += '</Worksheet>\n';
  xml += '</Workbook>';

  // Create blob and download
  const blob = new Blob([xml], { type: 'application/vnd.ms-excel' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  showToast(`Exported ${pages.length} pages to ${filename}`, 'success', 3000, 'page-list');
}

// Store export toggle handlers to prevent duplicates
let exportToggleHandlers: {
  toggleHandler?: (e: Event) => void;
  outsideClickHandler?: (e: Event) => void;
  escapeHandler?: (e: KeyboardEvent) => void;
} = {};

/**
 * Attach export toggle menu handler
 * Note: This should be called after the DOM elements are created
 */
function attachExportToggle(): void {
  const toggle = document.getElementById('page-list-export-toggle');
  const menu = document.getElementById('page-list-export-menu');
  
  if (!toggle || !menu) {
    devWarn('Export toggle or menu not found');
    return;
  }

  // Remove existing listeners if they exist
  if (exportToggleHandlers.toggleHandler) {
    toggle.removeEventListener('click', exportToggleHandlers.toggleHandler);
  }
  if (exportToggleHandlers.outsideClickHandler) {
    document.removeEventListener('click', exportToggleHandlers.outsideClickHandler);
  }
  if (exportToggleHandlers.escapeHandler) {
    document.removeEventListener('keydown', exportToggleHandlers.escapeHandler);
  }

  const toggleHandler = (e: Event) => {
    e.stopPropagation();
    const isOpen = menu.classList.contains('page-list-export-menu--open');
    
    // Close all other menus first
    document.querySelectorAll('.page-list-export-menu--open').forEach(openMenu => {
      if (openMenu !== menu) {
        openMenu.classList.remove('page-list-export-menu--open');
        const otherToggle = document.getElementById('page-list-export-toggle');
        if (otherToggle) {
          otherToggle.classList.remove('page-list-export-toggle--open');
        }
      }
    });
    
    // Toggle this menu
    menu.classList.toggle('page-list-export-menu--open', !isOpen);
    toggle.classList.toggle('page-list-export-toggle--open', !isOpen);
  };

  const outsideClickHandler = (e: Event) => {
    const target = e.target as Node;
    if (!menu.contains(target) && !toggle.contains(target)) {
      menu.classList.remove('page-list-export-menu--open');
      toggle.classList.remove('page-list-export-toggle--open');
    }
  };

  const escapeHandler = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      menu.classList.remove('page-list-export-menu--open');
      toggle.classList.remove('page-list-export-toggle--open');
    }
  };

  // Store handlers for cleanup
  exportToggleHandlers = {
    toggleHandler,
    outsideClickHandler,
    escapeHandler
  };

  toggle.addEventListener('click', toggleHandler);
  document.addEventListener('click', outsideClickHandler);
  document.addEventListener('keydown', escapeHandler);
}

// Store current filtered pages for export
let currentFilteredPagesForExport: PageData[] = [];
// Store all pages for export
let allPagesForExport: PageData[] = [];

/**
 * Update the current filtered pages for export
 * @param pages - Array of currently filtered page data
 */
function updateFilteredPagesForExport(pages: PageData[]): void {
  currentFilteredPagesForExport = pages;
}

/**
 * Update all pages for export
 * @param pages - Array of all page data
 */
function updateAllPagesForExport(pages: PageData[]): void {
  allPagesForExport = pages;
}

// Store export button handlers to prevent duplicates
let exportButtonHandlers: {
  csvHandler?: () => void;
  excelHandler?: () => void;
  csvAllHandler?: () => void;
  excelAllHandler?: () => void;
} = {};

/**
 * Attach page list export button handlers
 */
function attachPageListExportHandlers(): void {
  const exportCsvBtn = document.getElementById('page-list-export-csv');
  const exportExcelBtn = document.getElementById('page-list-export-excel');
  const exportCsvAllBtn = document.getElementById('page-list-export-csv-all');
  const exportExcelAllBtn = document.getElementById('page-list-export-excel-all');

  // Remove existing handlers if they exist
  if (exportButtonHandlers.csvHandler && exportCsvBtn) {
    exportCsvBtn.removeEventListener('click', exportButtonHandlers.csvHandler);
  }
  if (exportButtonHandlers.excelHandler && exportExcelBtn) {
    exportExcelBtn.removeEventListener('click', exportButtonHandlers.excelHandler);
  }
  if (exportButtonHandlers.csvAllHandler && exportCsvAllBtn) {
    exportCsvAllBtn.removeEventListener('click', exportButtonHandlers.csvAllHandler);
  }
  if (exportButtonHandlers.excelAllHandler && exportExcelAllBtn) {
    exportExcelAllBtn.removeEventListener('click', exportButtonHandlers.excelAllHandler);
  }

  const closeMenu = () => {
    const menu = document.getElementById('page-list-export-menu');
    const toggle = document.getElementById('page-list-export-toggle');
    if (menu) {
      menu.classList.remove('page-list-export-menu--open');
    }
    if (toggle) {
      toggle.classList.remove('page-list-export-toggle--open');
    }
  };

  const csvHandler = () => {
    if (currentFilteredPagesForExport.length === 0) {
      showToast('No pages to export', 'info', 3000, 'page-list');
      return;
    }
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    exportPagesToCSV(currentFilteredPagesForExport, `seo-analysis-${timestamp}.csv`);
    closeMenu();
  };

  const excelHandler = () => {
    if (currentFilteredPagesForExport.length === 0) {
      showToast('No pages to export', 'info', 3000, 'page-list');
      return;
    }
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    exportPagesToExcel(currentFilteredPagesForExport, `seo-analysis-${timestamp}.xls`);
    closeMenu();
  };

  const csvAllHandler = () => {
    if (allPagesForExport.length === 0) {
      showToast('No pages to export', 'info', 3000, 'page-list');
      return;
    }
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    exportPagesToCSV(allPagesForExport, `seo-analysis-all-${timestamp}.csv`);
    closeMenu();
  };

  const excelAllHandler = () => {
    if (allPagesForExport.length === 0) {
      showToast('No pages to export', 'info', 3000, 'page-list');
      return;
    }
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    exportPagesToExcel(allPagesForExport, `seo-analysis-all-${timestamp}.xls`);
    closeMenu();
  };

  // Store handlers for cleanup
  exportButtonHandlers = {
    csvHandler,
    excelHandler,
    csvAllHandler,
    excelAllHandler
  };

  if (exportCsvBtn) {
    exportCsvBtn.addEventListener('click', csvHandler);
  }

  if (exportExcelBtn) {
    exportExcelBtn.addEventListener('click', excelHandler);
  }

  if (exportCsvAllBtn) {
    exportCsvAllBtn.addEventListener('click', csvAllHandler);
  }

  if (exportExcelAllBtn) {
    exportExcelAllBtn.addEventListener('click', excelAllHandler);
  }
}

/**
 * Attach rescan button handler - reloads page data
 */
function attachRescanHandler(): void {
  const rescanButton = document.getElementById('page-list-rescan-button');
  if (!rescanButton) {
    return;
  }

  rescanButton.addEventListener('click', async () => {
    const button = rescanButton as HTMLButtonElement;
    const originalText = button.innerHTML;
    
    // Disable button and show loading state
    button.disabled = true;
    button.innerHTML = `
      <span class="page-list-rescan-button__icon material-symbols-outlined page-list-rescan-button__icon--spinning" aria-hidden="true">refresh</span>
      <span class="page-list-rescan-button__text">Rescanning...</span>
    `;

    try {
      showLoading();
      
      // Fetch with cache-busting parameter
      const timestamp = new Date().getTime();
      const response = await fetch(`/page-list/index.json?t=${timestamp}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      if (!response.headers.get('content-type')?.includes('application/json')) {
        throw new Error('Invalid content type: expected JSON');
      }

      const data: PageListData = await response.json();
      hideLoading();

      // Validate data structure
      if (!data || !Array.isArray(data.pages)) {
        throw new Error('Invalid data format: expected pages array');
      }

      // Reload the page to refresh all data
      window.location.reload();
    } catch (error) {
      hideLoading();
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      devError('Error rescanning site:', error);
      
      // Show error toast
      showToast(`Failed to rescan site: ${errorMessage}`, 'error', 5000, 'page-list');
      
      // Restore button
      button.disabled = false;
      button.innerHTML = originalText;
    }
  });
}

/**
 * Attach bulk excerpt generation handler
 * Currently dev-only helper scoped to the content-quality page
 */
function attachBulkGenerateExcerptsHandler(pages: PageData[]): void {
  const bulkExcerptBtn = document.getElementById('page-list-bulk-generate-excerpts');
  if (!bulkExcerptBtn) return;

  const needsExcerpts = pages.filter(page => !page.hasSummary || page.summaryTooShort || page.summaryTooLong);

  const handleBulkGenerate = () => {
    if (needsExcerpts.length === 0) {
      showToast('No pages need excerpt generation.', 'info', 4000, 'page-list');
      return;
    }

    // Stubbed behavior: real generation requires content pipeline
    showToast(`Found ${needsExcerpts.length} page${needsExcerpts.length !== 1 ? 's' : ''} needing excerpts. Implement generation pipeline to proceed.`, 'info', 5000, 'page-list');
    devLog('Bulk excerpt generation requested for pages:', needsExcerpts.map(p => p.title));
  };

  bulkExcerptBtn.addEventListener('click', handleBulkGenerate);
}

/**
 * Initialize page list (dev-only)
 */
/**
 * Attach tab navigation handlers to page detail modal
 */
function attachTabHandlers(modal: HTMLElement | null): void {
  if (!modal) return;
  
  const tabs = modal.querySelectorAll('.page-list-modal__tab');
  const sections = modal.querySelectorAll('.page-list-modal__section[data-section]');
  
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const tabName = tab.getAttribute('data-tab');
      if (!tabName) return;
      
      // Update tab states
      tabs.forEach(t => {
        t.classList.remove('page-list-modal__tab--active');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('page-list-modal__tab--active');
      tab.setAttribute('aria-selected', 'true');
      
      // Update section visibility
      sections.forEach(section => {
        const sectionName = section.getAttribute('data-section');
        if (sectionName === tabName) {
          section.classList.add('page-list-modal__section--active');
        } else {
          section.classList.remove('page-list-modal__section--active');
        }
      });
    });
    
    // Handle keyboard navigation
    tab.addEventListener('keydown', (e) => {
      const keyEvent = e as KeyboardEvent;
      if (keyEvent.key === 'Enter' || keyEvent.key === ' ') {
        keyEvent.preventDefault();
        (tab as HTMLElement).click();
      } else if (keyEvent.key === 'ArrowRight' || keyEvent.key === 'ArrowLeft') {
        keyEvent.preventDefault();
        const currentIndex = Array.from(tabs).indexOf(tab);
        const direction = keyEvent.key === 'ArrowRight' ? 1 : -1;
        const nextIndex = (currentIndex + direction + tabs.length) % tabs.length;
        (tabs[nextIndex] as HTMLElement).focus();
        (tabs[nextIndex] as HTMLElement).click();
      }
    });
  });
}

/**
 * Attach keyword research handler to page detail modal
 */
function attachKeywordResearchHandler(modal: HTMLElement | null, page: PageData, allPages: PageData[]): void {
  if (!modal || !isLocalhost()) return;
  
  const keywordBtn = modal.querySelector('#page-list-keyword-research-btn') as HTMLElement;
  if (!keywordBtn) return;
  
  keywordBtn.addEventListener('click', async () => {
    // Show loading modal with progress
    showLoadingModal('Analyzing keywords...', 0);
    
    // Update progress function
    const updateProgress = (progress: number, message: string) => {
      const modal = document.getElementById('page-list-fix-loading-modal');
      if (modal) {
        const title = modal.querySelector('.page-list-fix-loading__title');
        const progressBar = modal.querySelector('.page-list-fix-loading__progress-bar') as HTMLElement;
        const progressText = modal.querySelector('.page-list-fix-loading__progress-text');
        if (title) title.textContent = message;
        if (progressBar) progressBar.style.width = `${progress}%`;
        if (progressText) progressText.textContent = `${progress}% complete`;
      }
    };
    
    try {
      updateProgress(10, 'Fetching current page content...');
      
      // Fetch page content
      const response = await fetch(page.relPermalink);
      if (!response.ok) {
        closeLoadingModal();
        showToast('Could not fetch page content for keyword analysis', 'error', 5000, 'page-list');
        return;
      }
      
      updateProgress(20, 'Parsing page content...');
      const html = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      // Extract text content
      const title = doc.querySelector('title')?.textContent || page.title;
      const metaDescription = doc.querySelector('meta[name="description"]')?.getAttribute('content') || page.metaDescription || '';
      const bodyText = doc.body?.textContent || '';
      
      // Remove script and style content
      const scripts = doc.querySelectorAll('script, style, nav, header, footer');
      scripts.forEach(el => el.remove());
      const cleanText = doc.body?.textContent || bodyText;
      
      updateProgress(30, 'Analyzing current page keywords...');
      // Analyze keywords for current page
      const analysis = analyzeKeywords(cleanText, title, metaDescription);
      
      // Create current page keyword data
      const currentPageKeywords: PageKeywordData = {
        pageUrl: page.relPermalink,
        pageTitle: page.title,
        keywords: analysis.primaryKeywords,
        topKeywords: analysis.primaryKeywords.map(k => k.keyword)
      };
      
      updateProgress(40, `Fetching content from ${allPages.length - 1} other pages...`);
      
      // Analyze keywords for all other pages - fetch rendered HTML for each
      const otherPages = allPages.filter(p => p.relPermalink !== page.relPermalink);
      const totalPages = otherPages.length;
      let processedPages = 0;
      
      const allPageKeywordsPromises = otherPages
        .map(async (p): Promise<PageKeywordData> => {
          try {
            // Fetch rendered page HTML
            const pageResponse = await fetch(p.relPermalink);
            if (!pageResponse.ok) {
              // Fallback to metadata if fetch fails
              const pageText = `${p.title} ${p.metaDescription ?? ''} ${p.summary ?? ''}`;
              const pageAnalysis = analyzeKeywords(pageText, p.title, p.metaDescription ?? '');
              return {
                pageUrl: p.relPermalink,
                pageTitle: p.title,
                keywords: pageAnalysis.primaryKeywords,
                topKeywords: pageAnalysis.primaryKeywords.map(k => k.keyword)
              };
            }
            
            const pageHtml = await pageResponse.text();
            const pageParser = new DOMParser();
            const pageDoc = pageParser.parseFromString(pageHtml, 'text/html');
            
            // Extract text content from rendered page
            const pageTitle = pageDoc.querySelector('title')?.textContent || p.title;
            const pageMetaDesc = pageDoc.querySelector('meta[name="description"]')?.getAttribute('content') || p.metaDescription || '';
            const pageBodyText = pageDoc.body?.textContent || '';
            
            // Remove script and style content
            const pageScripts = pageDoc.querySelectorAll('script, style, nav, header, footer');
            pageScripts.forEach(el => el.remove());
            const pageCleanText = pageDoc.body?.textContent || pageBodyText;
            
            // Analyze keywords from rendered content
            const pageAnalysis = analyzeKeywords(pageCleanText, pageTitle, pageMetaDesc);
            
            // Update progress
            processedPages++;
            const progress = 40 + Math.round((processedPages / totalPages) * 50);
            updateProgress(progress, `Analyzing page ${processedPages} of ${totalPages}...`);
            
            return {
              pageUrl: p.relPermalink,
              pageTitle: p.title,
              keywords: pageAnalysis.primaryKeywords,
              topKeywords: pageAnalysis.primaryKeywords.map(k => k.keyword)
            };
          } catch (error) {
            devWarn(`Failed to fetch rendered content for ${p.relPermalink}, using metadata:`, error);
            // Fallback to metadata if fetch fails
            const pageText = `${p.title} ${p.metaDescription ?? ''} ${p.summary ?? ''}`;
            const pageAnalysis = analyzeKeywords(pageText, p.title, p.metaDescription ?? '');
            return {
              pageUrl: p.relPermalink,
              pageTitle: p.title,
              keywords: pageAnalysis.primaryKeywords,
              topKeywords: pageAnalysis.primaryKeywords.map(k => k.keyword)
            };
          }
        });
      
      // Wait for all pages to be analyzed
      const allPageKeywords = await Promise.all(allPageKeywordsPromises);
      
      // Generate comprehensive gap analysis
      const gapAnalysis = analyzeKeywordGaps(currentPageKeywords, allPageKeywords);
      
      // Render and show keyword research modal
      updateProgress(95, 'Preparing results...');
      const modalHtml = renderKeywordResearchModal(analysis, page.title, page.relPermalink, gapAnalysis);
      document.body.insertAdjacentHTML('beforeend', modalHtml);
      
      // Close loading modal immediately
      closeLoadingModal();
      
      const keywordModal = document.getElementById('dev-keyword-research-modal');
      if (!keywordModal) {
        return;
      }
      
      // Attach close handlers
      const closeBtn = keywordModal.querySelector('#dev-keyword-research-close');
      const overlay = keywordModal.querySelector('.dev-score-bubble-modal-overlay');
      const modalClose = keywordModal.querySelector('.dev-score-bubble-modal-close');
      
      const closeModal = () => {
        keywordModal.remove();
      };
      
      if (closeBtn) closeBtn.addEventListener('click', closeModal);
      if (overlay) overlay.addEventListener('click', closeModal);
      if (modalClose) modalClose.addEventListener('click', closeModal);
      
      // Close on Escape key
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && keywordModal) {
          closeModal();
          document.removeEventListener('keydown', handleEscape);
        }
      };
      document.addEventListener('keydown', handleEscape);
      
      // Attach seed keyword search functionality
      attachSeedKeywordSearch(keywordModal);
      
      // Attach competitor keyword removal functionality
      attachCompetitorKeywordRemoval(keywordModal);
      
      // Attach export handlers with all page keywords for site-wide export
      const allPageKeywordsForExport = [currentPageKeywords, ...allPageKeywords];
      attachExportHandlers(keywordModal, analysis, allPageKeywordsForExport);
      
    } catch (error) {
      devError('Error analyzing keywords:', error);
      closeLoadingModal();
      showToast('Error analyzing keywords. Please try again.', 'error', 5000, 'page-list');
    }
  });
}

/**
 * Select file using traditional HTML file input (fallback for browsers without File Picker API)
 */
function selectFileWithInput(): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.md,text/markdown';
    input.style.display = 'none';
    
    const cleanup = () => {
      if (input.parentNode) {
        input.parentNode.removeChild(input);
      }
    };
    
    const changeHandler = (e: Event) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0] || null;
      cleanup();
      resolve(file);
    };
    
    const cancelHandler = () => {
      cleanup();
      resolve(null);
    };
    
    input.addEventListener('change', changeHandler, { once: true });
    input.addEventListener('cancel', cancelHandler, { once: true });
    
    // Cleanup on unmount or if input is removed
    const observer = new MutationObserver(() => {
      if (!document.body.contains(input)) {
        cleanup();
        observer.disconnect();
        resolve(null);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    
    document.body.appendChild(input);
    input.click();
    
    // Timeout fallback to prevent hanging promises
    setTimeout(() => {
      if (document.body.contains(input)) {
        cleanup();
        observer.disconnect();
        resolve(null);
      }
    }, 60000); // 60 second timeout
  });
}

/**
 * Attach handlers for broken link actions (fix, edit, remove) in page detail modal
 */
function attachBrokenLinkHandlers(modal: HTMLElement | null, page: PageData, allPages: PageData[]): void {
  if (!modal || !isLocalhost()) return;
  
  const actionButtons = modal.querySelectorAll('[data-action="fix"], [data-action="edit"], [data-action="remove"]');
  
  actionButtons.forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const button = btn as HTMLElement;
      const action = button.getAttribute('data-action');
      const brokenUrl = button.getAttribute('data-broken-url');
      const sourcePage = button.getAttribute('data-source-page');
      
      if (!action || !brokenUrl || !sourcePage) return;
      
      // Request directory access if needed
      if ('showDirectoryPicker' in window && !getSiteRootDirectoryHandle()) {
        const accessGranted = await createConfirmationDialog(
          'Select Site Root Folder',
          'To update source files, you need to select your Hugo site root folder.\n\n' +
          'Click "Select Folder" below, then navigate to and select the folder that contains your "content" folder.\n\n' +
          'Example: If your site is at /Users/you/my-site/, select that folder.\n\n' +
          'This permission is only requested once per browser session.',
          'Select Folder',
          'Skip (Use Manual File Selection)',
          'page-list'
        );
        
        if (accessGranted) {
          const dirHandle = await requestSiteRootAccess(
            (msg) => showToast(msg, 'success', 5000, 'page-list'),
            (msg) => showToast(msg, 'error', 5000, 'page-list')
          );
          if (!dirHandle) {
            showToast('You can still manually select the file when prompted.', 'info', 5000, 'page-list');
          }
        }
      }
      
      // Disable button during processing
      button.setAttribute('disabled', 'true');
      button.classList.add('dev-score-bubble__broken-link-menu-action--loading');
      const originalText = button.innerHTML;
      
      try {
        // Check if File System Access API is available for automatic file finding
        const hasDirectoryAccess = getSiteRootDirectoryHandle() !== null;
        const possiblePaths = relPermalinkToContentFile(sourcePage);
        let filePath: string | null = null;
        let manualFileHandle: FileSystemFileHandle | null = null;
        
        // Try automatic file finding only if File System Access API is available
        if (hasDirectoryAccess) {
          filePath = await findActualFilePath(possiblePaths, true);
        }
        
        // If automatic finding failed or isn't available, offer manual file selection
        if (!filePath) {
          const message = hasDirectoryAccess
            ? `Could not automatically find the source file.\n\n` +
              `Expected paths:\n${possiblePaths.map(p => `  • ${p}`).join('\n')}\n\n` +
              `The file may not exist at these locations, or the directory structure may be different.\n\n` +
              `Please manually select the markdown file to continue.`
            : `To update source files, please select the markdown file manually.\n\n` +
              `Expected file location:\n${possiblePaths.map(p => `  • ${p}`).join('\n')}\n\n` +
              `This works on both Windows and macOS.`;
          
          const tryManual = await createConfirmationDialog(
            'Select Source File',
            message,
            'Select File',
            'Cancel',
            'page-list'
          );
          
          if (tryManual) {
            // Try modern File Picker API first (works in Chrome, Edge, Brave, Safari)
            if ('showOpenFilePicker' in window) {
              try {
                const fileHandles = await (window as any).showOpenFilePicker({
                  types: [{
                    description: 'Markdown files',
                    accept: { 'text/markdown': ['.md'] }
                  }],
                  excludeAcceptAllOption: false,
                  multiple: false
                });
                
                if (fileHandles && fileHandles.length > 0) {
                  const handle = fileHandles[0];
                  if (handle) {
                    manualFileHandle = handle;
                    const file = await handle.getFile();
                    // Use file name as identifier (we'll work with the handle directly)
                    filePath = file.name;
                  }
                }
              } catch (pickerError) {
                if ((pickerError as Error).name !== 'AbortError') {
                  devError('File picker error:', pickerError);
                  // Fall through to traditional file input
                } else {
                  // User cancelled
                  button.removeAttribute('disabled');
                  button.classList.remove('dev-score-bubble__broken-link-menu-action--loading');
                  button.innerHTML = originalText;
                  return;
                }
              }
            }
            
            // Fallback to traditional file input (works in all browsers including Brave)
            if (!manualFileHandle && !filePath) {
              try {
                const file = await selectFileWithInput();
                if (file) {
                  // Create a file handle-like object that works with traditional file input
                  // We'll download the modified file since we can't write directly
                  manualFileHandle = {
                    getFile: async () => file,
                    kind: 'file' as const,
                    __isFallback: true, // Mark as fallback for detection
                    createWritable: async () => {
                      let writtenContent = '';
                      return {
                        write: async (content: string) => {
                          writtenContent = content;
                        },
                        close: async () => {
                          // Download the modified file
                          const blob = new Blob([writtenContent], { type: 'text/markdown' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = file.name;
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                          URL.revokeObjectURL(url);
                        }
                      };
                    }
                  } as any;
                  filePath = file.name;
                }
              } catch (inputError) {
                devError('File input error:', inputError);
                showToast('Error selecting file. Please try again.', 'error', 5000, 'page-list');
              }
            }
          }
          
          if (!filePath && !manualFileHandle) {
            showToast('File selection cancelled or failed. Please try again.', 'info', 5000, 'page-list');
            button.removeAttribute('disabled');
            button.classList.remove('dev-score-bubble__broken-link-menu-action--loading');
            button.innerHTML = originalText;
            return;
          }
        }
        
        // Helper function to handle file operations (works with both filePath and fileHandle)
        const handleFileOperation = async (
          operation: (content: string) => { content: string; modified: boolean },
          successMessage: string
        ): Promise<boolean> => {
          let content: string;
          let fileName: string;
          
          if (manualFileHandle) {
            // Work with manually selected file handle
            const file = await manualFileHandle.getFile();
            content = await file.text();
            fileName = file.name;
          } else if (filePath) {
            // Work with file path
            const fileData = await readFileContent(filePath, true);
            if (!fileData) {
              showToast('Could not read file', 'error', 5000, 'page-list');
              return false;
            }
            content = fileData.content;
            fileName = filePath;
          } else {
            showToast('No file available', 'error', 5000, 'page-list');
            return false;
          }
          
          const result = operation(content);
          if (!result.modified) {
            showToast('Link not found in file content', 'info', 5000, 'page-list');
            return false;
          }
          
          // Create backup (only if we have directory access)
          if (manualFileHandle) {
            // For manual file handle, we can't easily create backup in same directory
            // The user should have their own backup system (git, etc.)
            devLog('Note: Backup not created for manually selected file. Consider using version control.');
          } else if (filePath && hasDirectoryAccess) {
            // Create backup using file path (only if we have directory access)
            const backupPath = createBackupFilename(filePath);
            const backupCreated = await writeFileContent(backupPath, content);
            if (backupCreated) {
              devLog(`✅ Backup created: ${backupPath}`);
            } else {
              devWarn('Could not create backup. Continuing anyway...');
            }
          } else if (filePath) {
            // No directory access - skip backup
            devLog('Note: Backup not created (File System Access API not available). Consider using version control.');
          }
          
          // Write modified content
          if (manualFileHandle) {
            // Write using file handle (modern API) or download (fallback for traditional file input)
            try {
              const writable = await manualFileHandle.createWritable();
              await writable.write(result.content);
              await writable.close();
              
              // Check if we used the fallback (traditional file input)
              // Real FileSystemFileHandle writes directly, fallback downloads the file
              const isFallback = (manualFileHandle as any).__isFallback === true;
              
              if (isFallback) {
                showToast(
                  `${successMessage} Modified file downloaded. Please replace the original file with the downloaded file.`,
                  'success',
                  10000,
                  'page-list'
                );
              } else {
                showToast(successMessage, 'success', 5000, 'page-list');
              }
              return true;
            } catch (writeError) {
              devError('Error writing to file:', writeError);
              showToast(`Error writing file: ${writeError instanceof Error ? writeError.message : 'Unknown error'}`, 'error', 5000, 'page-list');
              return false;
            }
          } else if (filePath) {
            // Write using file path
            const writeSuccess = await writeFileContent(filePath, result.content);
            if (writeSuccess) {
              showToast(successMessage, 'success', 5000, 'page-list');
              return true;
            } else {
              showToast('Error writing file', 'error', 5000, 'page-list');
              return false;
            }
          }
          
          return false;
        };
        
        if (action === 'fix') {
          button.innerHTML = '<span class="material-symbols-outlined" aria-hidden="true">hourglass_empty</span> Fixing...';
          
          // Get all page paths for matching
          const allPagePaths = allPages.map(p => p.relPermalink);
          const match = findUrlMatch(brokenUrl, allPagePaths, allPages);
          
          if (!match) {
            showToast(`No match found for: ${brokenUrl}`, 'error', 5000, 'page-list');
            button.removeAttribute('disabled');
            button.classList.remove('dev-score-bubble__broken-link-menu-action--loading');
            button.innerHTML = originalText;
            return;
          }
          
          // Fix the link
          const fixedUrl = match.match;
          const success = await handleFileOperation((content) => {
            const escapedUrl = escapeRegex(brokenUrl);
            let modifiedContent = content;
            let modified = false;
            
            // Replace markdown links
            const markdownPattern = new RegExp(`(\\[[^\\]]+\\]\\()${escapedUrl}([^)]*\\))`, 'g');
            modifiedContent = modifiedContent.replace(markdownPattern, (match, prefix, suffix) => {
              modified = true;
              return `${prefix}${fixedUrl}${suffix}`;
            });
            
            // Replace HTML links
            const htmlPattern = new RegExp(`(href=["'])${escapedUrl}(["'])`, 'gi');
            modifiedContent = modifiedContent.replace(htmlPattern, (match, prefix, suffix) => {
              modified = true;
              return `${prefix}${fixedUrl}${suffix}`;
            });
            
            return { content: modifiedContent, modified };
          }, `Link fixed: ${brokenUrl} → ${fixedUrl}`);
          
          if (success) {
            // Update UI - mark as fixed
            const item = button.closest('.page-list-modal__broken-link-item');
            if (item) {
              item.classList.add('page-list-modal__broken-link-item--fixed');
              const urlCode = item.querySelector('.page-list-modal__broken-link-url');
              if (urlCode) {
                urlCode.textContent = fixedUrl;
                urlCode.setAttribute('title', `Fixed: ${fixedUrl}`);
              }
              button.remove();
            }
          } else {
            button.removeAttribute('disabled');
            button.classList.remove('dev-score-bubble__broken-link-menu-action--loading');
            button.innerHTML = originalText;
          }
        } else if (action === 'edit') {
          button.innerHTML = '<span class="material-symbols-outlined" aria-hidden="true">hourglass_empty</span> Editing...';
          
          // Prompt for new URL
          const newUrl = await createUrlInputDialog('Enter new URL:', brokenUrl, 'page-list');
          
          if (!newUrl || newUrl === brokenUrl) {
            button.removeAttribute('disabled');
            button.classList.remove('dev-score-bubble__broken-link-menu-action--loading');
            button.innerHTML = originalText;
            return;
          }
          
          // Update the link
          const success = await handleFileOperation((content) => {
            const escapedUrl = escapeRegex(brokenUrl);
            let modifiedContent = content;
            let modified = false;
            
            // Replace markdown links
            const markdownPattern = new RegExp(`(\\[[^\\]]+\\]\\()${escapedUrl}([^)]*\\))`, 'g');
            modifiedContent = modifiedContent.replace(markdownPattern, (match, prefix, suffix) => {
              modified = true;
              return `${prefix}${newUrl}${suffix}`;
            });
            
            // Replace HTML links
            const htmlPattern = new RegExp(`(href=["'])${escapedUrl}(["'])`, 'gi');
            modifiedContent = modifiedContent.replace(htmlPattern, (match, prefix, suffix) => {
              modified = true;
              return `${prefix}${newUrl}${suffix}`;
            });
            
            return { content: modifiedContent, modified };
          }, `Link updated: ${brokenUrl} → ${newUrl}`);
          
          if (success) {
            // Update UI
            const item = button.closest('.page-list-modal__broken-link-item');
            if (item) {
              item.classList.remove('page-list-modal__broken-link-item--broken');
              item.classList.add('page-list-modal__broken-link-item--fixed');
              const urlCode = item.querySelector('.page-list-modal__broken-link-url');
              if (urlCode) {
                urlCode.textContent = newUrl;
                urlCode.setAttribute('title', `Updated: ${newUrl}`);
              }
              // Remove all action buttons
              const actions = item.querySelector('.page-list-modal__broken-link-actions');
              if (actions) actions.remove();
            }
          } else {
            button.removeAttribute('disabled');
            button.classList.remove('dev-score-bubble__broken-link-menu-action--loading');
            button.innerHTML = originalText;
          }
        } else if (action === 'remove') {
          button.innerHTML = '<span class="material-symbols-outlined" aria-hidden="true">hourglass_empty</span> Removing...';
          
          // Confirm removal
          const fileName = manualFileHandle ? (await manualFileHandle.getFile()).name : filePath || 'file';
          const confirmed = await createConfirmationDialog(
            'Remove Broken Link',
            `This will remove the broken link "${brokenUrl}" from "${fileName}" and keep only the text.\n\n` +
            'A backup will be created before making changes. Continue?',
            'Remove Link',
            'Cancel',
            'page-list'
          );
          
          if (!confirmed) {
            button.removeAttribute('disabled');
            button.classList.remove('dev-score-bubble__broken-link-menu-action--loading');
            button.innerHTML = originalText;
            return;
          }
          
          // Remove the link
          const success = await handleFileOperation((content) => {
            const removalResult = removeLinkFromContent(content, brokenUrl);
            return {
              content: removalResult.content,
              modified: removalResult.changes.length > 0
            };
          }, `Link removed successfully`);
          
          if (success) {
            // Update UI - mark as removed
            const item = button.closest('.page-list-modal__broken-link-item');
            if (item) {
              item.classList.add('page-list-modal__broken-link-item--removed');
              const urlCode = item.querySelector('.page-list-modal__broken-link-url');
              if (urlCode && urlCode instanceof HTMLElement) {
                urlCode.style.textDecoration = 'line-through';
                urlCode.style.opacity = '0.6';
              }
              // Remove all action buttons
              const actions = item.querySelector('.page-list-modal__broken-link-actions');
              if (actions) actions.remove();
            }
          } else {
            button.removeAttribute('disabled');
            button.classList.remove('dev-score-bubble__broken-link-menu-action--loading');
            button.innerHTML = originalText;
          }
        }
      } catch (error) {
        devError('Error handling broken link action:', error);
        showToast(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error', 5000, 'page-list');
        button.removeAttribute('disabled');
        button.classList.remove('page-list-fix-button--loading');
        button.innerHTML = originalText;
      }
    });
  });
}

/**
 * Attach handlers for draft pages view (export CSV and copy URL buttons)
 */
function attachDraftHandlers(draftPages: PageData[]): void {
  // Export CSV button
  const exportButton = document.getElementById('page-list-drafts-export-csv');
  if (exportButton) {
    const handler = () => {
      exportDraftPagesToCSV(draftPages);
    };
    exportButton.addEventListener('click', handler);
  }

  // Copy URL buttons
  const copyButtons = document.querySelectorAll('[data-copy-url]');
  copyButtons.forEach(button => {
    const handler = async (e: Event) => {
      e.stopPropagation();
      const url = button.getAttribute('data-copy-url');
      if (!url) return;

      try {
        await navigator.clipboard.writeText(url);
        // Show visual feedback
        const icon = button.querySelector('.material-symbols-outlined');
        if (icon) {
          const originalText = icon.textContent;
          icon.textContent = 'check';
          setTimeout(() => {
            if (icon.textContent === 'check') {
              icon.textContent = originalText || 'content_copy';
            }
          }, 2000);
        }
        showToast('URL copied to clipboard', 'success', 2000, 'page-list');
      } catch (err) {
        devError('Failed to copy URL:', err);
        showToast('Failed to copy URL', 'error', 3000, 'page-list');
      }
    };
    button.addEventListener('click', handler);
  });
}

/**
 * Export draft pages to CSV
 */
function exportDraftPagesToCSV(pages: PageData[]): void {
  if (pages.length === 0) {
    showToast('No draft pages to export', 'info', 3000, 'page-list');
    return;
  }

  // CSV header
  const headers = ['Title', 'URL', 'Section'];
  const rows = [headers.join(',')];

  // CSV rows
  pages.forEach(page => {
    const title = page.title || '';
    const url = page.relPermalink || '';
    const section = page.section || 'Home';
    
    const row = [
      `"${title.replace(/"/g, '""')}"`, // Escape quotes
      `"${url.replace(/"/g, '""')}"`,
      `"${section.replace(/"/g, '""')}"`
    ];
    rows.push(row.join(','));
  });

  // Create blob and download
  const csvContent = rows.join('\n');
  // Add BOM for Excel UTF-8 support
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'draft-pages.csv';
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  showToast(`Exported ${pages.length} draft ${pages.length === 1 ? 'page' : 'pages'} to CSV`, 'success', 3000, 'page-list');
}

/**
 * Attach handlers for fix buttons in table rows
 * This function should be called within initPageList context where cleanupFunctions is available
 */
function createTableFixButtonHandlers(allPages: PageData[], cleanupFunctions: Array<() => void>): () => void {
  if (!isLocalhost()) {
    return () => {}; // Return empty cleanup function
  }
  
  const fixButtons = document.querySelectorAll('[data-action="fix-links"], [data-action="fix-images"]');
  const listeners: Array<{ element: Element; type: string; handler: (event: Event) => void }> = [];
  
  fixButtons.forEach(button => {
    const handler = (e: Event) => {
      e.stopPropagation(); // Prevent row click
      
      const pageUrl = button.getAttribute('data-page-url');
      if (!pageUrl) {
        devWarn('Fix button missing data-page-url attribute');
        return;
      }
      
      // Open the page modal to show full details and fix options
      // Find the row and trigger its click handler to open modal
      const row = button.closest('.page-list-row') as HTMLElement | null;
      if (row) {
        const rowPageUrl = row.getAttribute('data-page-url');
        if (rowPageUrl && rowPageUrl === pageUrl) {
          // Use click event to trigger the row's click handler
          const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
          row.dispatchEvent(clickEvent);
        } else {
          devWarn('Page URL mismatch between button and row');
        }
      } else {
        devWarn('Could not find page list row for fix button');
      }
    };
    
    button.addEventListener('click', handler);
    listeners.push({ element: button, type: 'click', handler });
  });
  
  // Return cleanup function
  return () => {
    listeners.forEach(({ element, type, handler }) => {
      element.removeEventListener(type, handler);
    });
  };
}

export function initPageList(): void {
  // Only run in dev/localhost
  if (!isLocalhost()) {
    return;
  }

  const container = document.querySelector('.page-list-container');
  if (!container) {
    devWarn('Page list container not found');
    return;
  }

  // Get current section from data attribute
  const currentSection = (container as HTMLElement).getAttribute('data-page-list-section') || 'overview';

  try {
    showLoading();

    fetch('/page-list/index.json')
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const contentType = response.headers.get('content-type');
        if (!contentType?.includes('application/json')) {
          throw new Error(`Invalid content type: expected JSON, got ${contentType}`);
        }
        return response.json();
      })
      .then((data: unknown) => {
        // Validate data structure
        if (!data || typeof data !== 'object') {
          throw new Error('Invalid data format: expected object');
        }
        const pageListData = data as PageListData;
        if (!Array.isArray(pageListData.pages)) {
          throw new Error('Invalid data format: expected pages array');
        }
        return pageListData;
      })
      .then((data: PageListData) => {
        hideLoading();

        // Determine initial filter based on section
      let initialFilter = 'all';
      switch (currentSection) {
        case 'seo-analysis':
          initialFilter = 'with-issues'; // Show pages with SEO issues by default
          break;
        case 'schema':
          initialFilter = 'all'; // Show all pages for schema validation
          break;
        case 'content-quality':
          initialFilter = 'low-word-count'; // Show content quality issues
          break;
        case 'technical-issues':
          initialFilter = 'broken-links'; // Show technical issues
          break;
        case 'keyword-research':
          initialFilter = 'all'; // Show all for keyword research
          break;
        case 'link-map':
          initialFilter = 'all'; // Show all for link map
          break;
        case 'drafts':
          initialFilter = 'drafts'; // Show drafts
          break;
        case 'llms':
          initialFilter = 'all'; // Show all for llms validation
          break;
        case 'overview':
        default:
          initialFilter = 'all';
          break;
      }

      let currentFilter = initialFilter;
      let currentLayout: 'normal' | 'compact' = 'compact';
      let currentGrouping: 'grouped' | 'ungrouped' = 'ungrouped' as 'grouped' | 'ungrouped';
      let currentSort: string = 'title';
      let currentSortDirection: 'asc' | 'desc' = 'asc';
      let allPages = data.pages || [];
      
      // Store all pages for export
      updateAllPagesForExport(allPages);

      // Store event listener cleanup functions to prevent memory leaks
      const cleanupFunctions: Array<() => void> = [];
      
      const cleanupEventListeners = () => {
        cleanupFunctions.forEach(cleanup => cleanup());
        cleanupFunctions.length = 0;
      };

      const setActiveFilterState = (filterId: string) => {
        const filterableElements = container.querySelectorAll('[data-filter]');
        filterableElements.forEach(el => {
          const elementFilter = el.getAttribute('data-filter');
          const isActive = elementFilter === filterId;
          if (el.classList.contains('page-list-summary__stat')) {
            el.classList.toggle('page-list-summary__stat--active', isActive);
          }
          if (el.classList.contains('page-list-overview-stat')) {
            el.classList.toggle('page-list-overview-stat--active', isActive);
          }
          if (el instanceof HTMLElement) {
            if (isActive) {
              el.classList.add('is-active-filter');
            } else {
              el.classList.remove('is-active-filter');
            }
            el.setAttribute('aria-pressed', isActive ? 'true' : 'false');
          }
        });
      };

      const updateView = (filterType: string, layout: 'normal' | 'compact' = currentLayout, grouping: 'grouped' | 'ungrouped' = currentGrouping, sortType: string = currentSort, sortDirection: 'asc' | 'desc' = currentSortDirection) => {
        // Clean up previous event listeners to prevent memory leaks
        cleanupEventListeners();

        // Handle drafts section specially - render draft pages list
        if (currentSection === 'drafts') {
          const draftPages = filterPages(allPages, 'drafts');
          updateFilteredPagesForExport(draftPages);
          const draftsHtml = renderDraftPages(draftPages);
          
          // Replace entire container content for drafts view
          container.innerHTML = draftsHtml;
          
          // Attach draft-specific handlers
          attachDraftHandlers(draftPages);
          return;
        }

        // Handle schema section specially - render schema validation
        if (currentSection === 'schema') {
          const schemaHtml = renderSchemaSection(allPages);
          
          // Replace entire container content for schema view
          container.innerHTML = schemaHtml;
          
          // Attach schema-specific handlers
          attachSchemaValidationHandlers(allPages);
          return;
        }

        const filteredPages = filterPages(allPages, filterType);
        // Update filtered pages for export
        updateFilteredPagesForExport(filteredPages);
        // Always use all pages stats for the summary, but show filtered pages in the list
        const allStats = calculateStats(allPages);
        const statsHtml = renderStats(allStats, filterType, data.siteTechnicalSEO, data.siteAICrawlability, true, currentSection);
        const pagesHtml = filteredPages.length > 0 
          ? (grouping === 'grouped' ? renderGroupedPages(filteredPages, layout === 'compact', sortType, sortDirection, filterType) : renderUngroupedPages(filteredPages, layout === 'compact', sortType, sortDirection, filterType))
          : `
          <div class="page-list-empty">
            <div class="page-list-empty__icon">🔍</div>
            <h3 class="page-list-empty__title">No pages match this filter</h3>
            <p class="page-list-empty__text">Try selecting a different filter option.</p>
          </div>
        `;

        const summarySection = container.querySelector('.page-list-summary');
        const pagesContainer = document.getElementById('page-list-pages');
        
        if (summarySection) {
          // Update the grid section
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = statsHtml;
          const newGrid = tempDiv.querySelector('.page-list-summary__grid');
          const oldGrid = summarySection.querySelector('.page-list-summary__grid');
          if (newGrid && oldGrid && oldGrid.parentNode) {
            oldGrid.parentNode.replaceChild(newGrid, oldGrid);
          }
          
          // Update the overview section to reflect active filter
          const newOverview = tempDiv.querySelector('.page-list-summary__hero-overview');
          const oldOverview = summarySection.querySelector('.page-list-summary__hero-overview');
          if (newOverview && oldOverview && oldOverview.parentNode) {
            oldOverview.parentNode.replaceChild(newOverview, oldOverview);
          }
        }
        
        if (pagesContainer) {
          pagesContainer.innerHTML = pagesHtml;
          if (layout === 'compact') {
            pagesContainer.classList.add('page-list-pages--compact');
          } else {
            pagesContainer.classList.remove('page-list-pages--compact');
          }
        }

        setActiveFilterState(filterType);

        // Update filtered pages for export
        updateFilteredPagesForExport(filteredPages);

        // Re-attach event listeners (cleanup will be handled on next updateView call)
        attachFilterListeners();
        attachRowClickListeners();
        attachGroupToggleListeners();
        attachTooltipHandlers(container as HTMLElement);
        const fixButtonCleanup = createTableFixButtonHandlers(allPages, cleanupFunctions);
        cleanupFunctions.push(fixButtonCleanup);
        // Re-attach export handlers if controls are shown
        if (showControls) {
          attachPageListExportHandlers();
          attachExportToggle();
        }
        if (isLocalhost() && currentSection === 'keyword-research') {
          attachCompetitorAnalysisHandlers(allPages);
          // Extract and display site keywords
          extractAndDisplaySiteKeywords(allPages);
        }
      };

      const attachFilterListeners = () => {
        const statButtons = container.querySelectorAll('.page-list-summary__stat--clickable, .page-list-overview-stat--clickable');
        const listeners: Array<{ element: Element; type: string; handler: (event: Event) => void }> = [];

        const activateFilter = (button: Element) => {
          const filterId = button.getAttribute('data-filter');
          if (!filterId || filterId === currentFilter || button.hasAttribute('disabled')) return;
          currentFilter = filterId;
          updateView(filterId, currentLayout, currentGrouping, currentSort, currentSortDirection);
          const pagesContainer = document.getElementById('page-list-pages');
          if (pagesContainer) {
            pagesContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        };
        
        statButtons.forEach(button => {
          const clickHandler = () => activateFilter(button);
          const keyHandler = (event: Event) => {
            const keyboardEvent = event as KeyboardEvent;
            if (keyboardEvent.key === 'Enter' || keyboardEvent.key === ' ') {
              keyboardEvent.preventDefault();
              activateFilter(button);
            }
          };
          button.addEventListener('click', clickHandler);
          button.addEventListener('keydown', keyHandler);
          listeners.push({ element: button, type: 'click', handler: clickHandler });
          listeners.push({ element: button, type: 'keydown', handler: keyHandler });
        });

        // Tab switching
        const tabButtons = container.querySelectorAll('.page-list-filter-tab');
        tabButtons.forEach(tab => {
          const handler = () => {
            const tabId = tab.getAttribute('data-tab');
            if (!tabId) return;

            // Remove active class from all tabs and content
            tabButtons.forEach(t => t.classList.remove('page-list-filter-tab--active'));
            const allTabContents = container.querySelectorAll('.page-list-filter-tab-content');
            allTabContents.forEach(content => content.classList.remove('page-list-filter-tab-content--active'));

            // Add active class to clicked tab and corresponding content
            tab.classList.add('page-list-filter-tab--active');
            const tabContent = container.querySelector(`[data-tab-content="${tabId}"]`);
            if (tabContent) {
              tabContent.classList.add('page-list-filter-tab-content--active');
            }
          };
          tab.addEventListener('click', handler);
          listeners.push({ element: tab, type: 'click', handler });
        });
        
        // Store cleanup function
        cleanupFunctions.push(() => {
          listeners.forEach(({ element, type, handler }) => {
            element.removeEventListener(type, handler);
          });
        });
      };

      const openPageModal = (pageUrl: string) => {
        const page = allPages.find(p => p.relPermalink === pageUrl);
        if (!page) return;
        
        // Remove existing modal
        const existingModal = document.getElementById('page-list-modal');
        if (existingModal) {
          existingModal.remove();
        }
        
        // Add modal to body
        const modalHtml = renderPageDetailModal(page);
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Attach close listeners
        const modal = document.getElementById('page-list-modal');
        const closeBtn = document.getElementById('page-list-modal-close');
        const overlay = modal?.querySelector('.page-list-modal__overlay');
        
        const closeModal = () => {
          if (modal) modal.remove();
          // Return focus to the row that opened the modal
          const row = container.querySelector(`[data-page-url="${pageUrl}"]`);
          if (row instanceof HTMLElement) {
            row.focus();
          }
        };
        
        if (closeBtn) closeBtn.addEventListener('click', closeModal);
        if (overlay) overlay.addEventListener('click', closeModal);
        
        // Close on Escape key
        const handleEscape = (e: KeyboardEvent) => {
          if (e.key === 'Escape') {
            closeModal();
            document.removeEventListener('keydown', handleEscape);
          }
        };
        document.addEventListener('keydown', handleEscape);
        
        // Focus management - focus first focusable element in modal
        const firstFocusable = modal?.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])') as HTMLElement;
        if (firstFocusable) {
          setTimeout(() => firstFocusable.focus(), 100);
        }
        
        // Attach tooltip handlers
        attachTooltipHandlers(modal);
        
        // Attach broken link action handlers
        attachBrokenLinkHandlers(modal, page, allPages);
        attachKeywordResearchHandler(modal, page, allPages);
        attachTabHandlers(modal);
      };

      const attachRowClickListeners = () => {
        const rows = container.querySelectorAll('.page-list-row');
        const clickHandlers: Array<{ element: Element; handler: (e: Event) => void }> = [];
        const keyHandlers: Array<{ element: Element; handler: (e: Event) => void }> = [];
        
        rows.forEach(row => {
          // Make rows keyboard accessible
          if (row instanceof HTMLElement) {
            row.setAttribute('tabindex', '0');
            row.setAttribute('role', 'button');
            row.setAttribute('aria-label', `View details for ${row.querySelector('strong')?.textContent || 'page'}`);
          }
          
          const clickHandler = (e: Event) => {
            // Don't open modal if clicking on a link or action button
            if ((e.target as HTMLElement).closest('a, button[data-action]')) return;
            
            const pageUrl = row.getAttribute('data-page-url');
            if (!pageUrl) return;
            
            openPageModal(pageUrl);
          };
          
          const keyHandler = (e: Event) => {
            // Support Enter and Space keys for keyboard navigation
            const keyEvent = e as KeyboardEvent;
            if (keyEvent.key === 'Enter' || keyEvent.key === ' ') {
              keyEvent.preventDefault();
              const pageUrl = row.getAttribute('data-page-url');
              if (!pageUrl) return;
              openPageModal(pageUrl);
            }
          };
          
          row.addEventListener('click', clickHandler);
          row.addEventListener('keydown', keyHandler);
          clickHandlers.push({ element: row, handler: clickHandler });
          keyHandlers.push({ element: row, handler: keyHandler });
        });
        
        // Store cleanup function
        cleanupFunctions.push(() => {
          clickHandlers.forEach(({ element, handler }) => {
            element.removeEventListener('click', handler);
          });
          keyHandlers.forEach(({ element, handler }) => {
            element.removeEventListener('keydown', handler);
          });
        });
      };

      const attachLayoutToggle = () => {
        const toggle = document.getElementById('page-list-layout-toggle');
        if (toggle) {
          const handler = () => {
            currentLayout = currentLayout === 'normal' ? 'compact' : 'normal';
            const icon = toggle.querySelector('.page-list-layout-toggle__icon');
            const label = toggle.querySelector('.page-list-layout-toggle__label');
            if (icon && label) {
              icon.textContent = currentLayout === 'compact' ? 'view_compact' : 'view_list';
              label.textContent = currentLayout === 'compact' ? 'Compact' : 'Normal';
            }
            toggle.setAttribute('data-layout', currentLayout);
            updateView(currentFilter, currentLayout, currentGrouping, currentSort, currentSortDirection);
          };
          toggle.addEventListener('click', handler);
          cleanupFunctions.push(() => toggle.removeEventListener('click', handler));
        }
      };

      const attachGroupingToggle = () => {
        const toggle = document.getElementById('page-list-grouping-toggle');
        if (toggle) {
          const handler = () => {
            currentGrouping = currentGrouping === 'grouped' ? 'ungrouped' : 'grouped';
            const icon = toggle.querySelector('.page-list-grouping-toggle__icon');
            const label = toggle.querySelector('.page-list-grouping-toggle__label');
            if (icon && label) {
              icon.textContent = currentGrouping === 'ungrouped' ? 'list' : 'folder';
              label.textContent = currentGrouping === 'ungrouped' ? 'Ungrouped' : 'Grouped';
            }
            toggle.setAttribute('data-grouping', currentGrouping);
            updateView(currentFilter, currentLayout, currentGrouping, currentSort, currentSortDirection);
          };
          toggle.addEventListener('click', handler);
          cleanupFunctions.push(() => toggle.removeEventListener('click', handler));
        }
      };

      const attachSortToggle = () => {
        const toggle = document.getElementById('page-list-sort-toggle');
        const menu = document.getElementById('page-list-sort-menu');
        
        if (toggle && menu) {
          // Toggle menu visibility
          const toggleHandler = (e: Event) => {
            e.stopPropagation();
            menu.classList.toggle('page-list-sort-menu--open');
          };
          toggle.addEventListener('click', toggleHandler);

          // Close menu when clicking outside
          const outsideClickHandler = (e: Event) => {
            const target = e.target as Node;
            if (!toggle.contains(target) && !menu.contains(target)) {
              menu.classList.remove('page-list-sort-menu--open');
            }
          };
          document.addEventListener('click', outsideClickHandler);

          // Handle sort option clicks
          const sortItems = menu.querySelectorAll('.page-list-sort-menu__item');
          const itemClickHandlers: Array<{ element: Element; handler: () => void }> = [];
          
          sortItems.forEach(item => {
            const handler = () => {
              const sortType = item.getAttribute('data-sort');
              const direction = item.getAttribute('data-direction') as 'asc' | 'desc';
              
              if (sortType && direction) {
                currentSort = sortType;
                currentSortDirection = direction;

                const icon = toggle.querySelector('.page-list-sort-toggle__icon');
                const label = toggle.querySelector('.page-list-sort-toggle__label');
                const directionIcon = toggle.querySelector('.page-list-sort-toggle__direction');
                
                if (icon) icon.textContent = getSortIcon(currentSort, currentSortDirection);
                if (label) label.textContent = getSortLabel(currentSort, currentSortDirection);
                if (directionIcon) directionIcon.textContent = currentSortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward';
                
                toggle.setAttribute('data-sort', currentSort);
                toggle.setAttribute('data-direction', currentSortDirection);
                
                // Update active state in menu
                sortItems.forEach(i => i.classList.remove('page-list-sort-menu__item--active'));
                item.classList.add('page-list-sort-menu__item--active');
                
                // Close menu
                menu.classList.remove('page-list-sort-menu--open');
                
                // Update view
                updateView(currentFilter, currentLayout, currentGrouping, currentSort, currentSortDirection);
              }
            };
            item.addEventListener('click', handler);
            itemClickHandlers.push({ element: item, handler });
          });
          
          // Store cleanup functions
          cleanupFunctions.push(() => {
            toggle.removeEventListener('click', toggleHandler);
            document.removeEventListener('click', outsideClickHandler);
            itemClickHandlers.forEach(({ element, handler }) => {
              element.removeEventListener('click', handler);
            });
          });
        }
      };

      const attachGroupToggleListeners = () => {
        const groupHeaders = container.querySelectorAll('.page-list-group-header');
        const clickHandlers: Array<{ element: Element; handler: () => void }> = [];
        
        groupHeaders.forEach(header => {
          const handler = () => {
            const groupId = header.getAttribute('data-group-toggle');
            if (!groupId) return;
            
            const group = container.querySelector(`[data-group-id="${groupId}"]`);
            const content = container.querySelector(`[data-group-content="${groupId}"]`);
            const icon = header.querySelector('.page-list-group-toggle-icon');
            
            if (content && icon) {
              const isCollapsed = content.classList.contains('page-list-group-content--collapsed');
              if (isCollapsed) {
                content.classList.remove('page-list-group-content--collapsed');
                icon.textContent = '▼';
              } else {
                content.classList.add('page-list-group-content--collapsed');
                icon.textContent = '▶';
              }
            }
          };
          header.addEventListener('click', handler);
          clickHandlers.push({ element: header, handler });
        });
        
        // Store cleanup function
        cleanupFunctions.push(() => {
          clickHandlers.forEach(({ element, handler }) => {
            element.removeEventListener('click', handler);
          });
        });
      };

      // Helper functions for sort labels and icons (defined once, reused)
      const getSortLabel = (sortType: string, direction: 'asc' | 'desc'): string => {
        const labels: Record<string, string> = {
          'seo': 'SEO Score',
          'ai': 'AI Score',
          'title': 'Title',
          'accessibility': 'Accessibility'
        };
        return labels[sortType] || 'Title';
      };

      const getSortIcon = (sortType: string, direction: 'asc' | 'desc'): string => {
        const icons: Record<string, string> = {
          'seo': 'trending_up',
          'ai': 'psychology',
          'title': 'title',
          'accessibility': 'accessibility_new'
        };
        return icons[sortType] || 'title';
      };

      const isSortActive = (sortType: string, direction: 'asc' | 'desc'): boolean => {
        return currentSort === sortType && currentSortDirection === direction;
      };

      const stats = calculateStats(allPages);
      
      // Customize display based on section
      const showStats = currentSection === 'overview'; // Only show full stats on overview page
      const showControls = currentSection !== 'overview' && currentSection !== 'keyword-research' && currentSection !== 'link-map' && currentSection !== 'drafts' && currentSection !== 'schema' && currentSection !== 'llms'; // Hide controls on overview, keyword-research, link-map, drafts, schema, and llms
      const showPages = currentSection !== 'overview' && currentSection !== 'keyword-research' && currentSection !== 'link-map' && currentSection !== 'drafts' && currentSection !== 'schema' && currentSection !== 'llms'; // Hide page list on overview, keyword-research, link-map, drafts, schema, and llms
      const showFilters = currentSection !== 'overview' && currentSection !== 'keyword-research' && currentSection !== 'link-map' && currentSection !== 'drafts' && currentSection !== 'schema' && currentSection !== 'llms'; // Hide filters on overview, keyword-research, link-map, drafts, schema, and llms
      
      // Render summary section: hero + stats for overview, hero only for other pages
      const summaryHtml = renderStats(stats, currentFilter, data.siteTechnicalSEO, data.siteAICrawlability, showFilters, currentSection, !showStats);

      const controlsHtml = showControls ? `
        <div class="page-list-controls">
          ${isLocalhost() && currentSection === 'technical-issues' && stats.technicalSEO.brokenLinks > 0 ? `
            <div class="page-list-controls__fix">
              <button 
                class="page-list-fix-button" 
                id="page-list-fix-broken-links" 
                type="button"
                aria-label="Fix obvious internal broken links (development mode only)"
                title="Fix obvious internal broken links (dev-only)"
                data-tooltip="Automatically fix internal broken links with obvious matches. Only available in development mode."
              >
                <span class="page-list-fix-button__icon material-symbols-outlined" aria-hidden="true">auto_fix_high</span>
                <span class="page-list-fix-button__text">Fix Broken Links</span>
              </button>
            </div>
          ` : ''}
          ${isLocalhost() && currentSection === 'content-quality' && (stats.contentQuality.noExcerpt > 0 || stats.contentQuality.excerptTooShort > 0 || stats.contentQuality.excerptTooLong > 0) ? `
            <div class="page-list-controls__fix">
              <button 
                class="page-list-fix-button" 
                id="page-list-bulk-generate-excerpts" 
                type="button"
                aria-label="Bulk generate page excerpts (development mode only)"
                title="Generate excerpts (dev-only)"
                data-tooltip="Automatically generate excerpts for pages missing or with bad length. Only available in development mode."
              >
                <span class="page-list-fix-button__icon material-symbols-outlined" aria-hidden="true">description</span>
                <span class="page-list-fix-button__text">Generate Excerpts</span>
              </button>
            </div>
          ` : ''}
          <div class="page-list-controls__sort">
            <div class="page-list-sort">
              <button class="page-list-sort-toggle" id="page-list-sort-toggle" data-sort="${currentSort}" data-direction="${currentSortDirection}">
                <span class="page-list-sort-toggle__icon material-symbols-outlined">${getSortIcon(currentSort, currentSortDirection)}</span>
                <span class="page-list-sort-toggle__label">${getSortLabel(currentSort, currentSortDirection)}</span>
                <span class="page-list-sort-toggle__direction material-symbols-outlined">${currentSortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward'}</span>
              </button>
              <div class="page-list-sort-menu" id="page-list-sort-menu">
                <button class="page-list-sort-menu__item ${isSortActive('seo', 'asc') ? 'page-list-sort-menu__item--active' : ''}" data-sort="seo" data-direction="asc">
                  <span class="material-symbols-outlined">trending_up</span>
                  <span>SEO Score (Low to High)</span>
                  <span class="material-symbols-outlined">arrow_upward</span>
                </button>
                <button class="page-list-sort-menu__item ${isSortActive('seo', 'desc') ? 'page-list-sort-menu__item--active' : ''}" data-sort="seo" data-direction="desc">
                  <span class="material-symbols-outlined">trending_up</span>
                  <span>SEO Score (High to Low)</span>
                  <span class="material-symbols-outlined">arrow_downward</span>
                </button>
                <button class="page-list-sort-menu__item ${isSortActive('ai', 'asc') ? 'page-list-sort-menu__item--active' : ''}" data-sort="ai" data-direction="asc">
                  <span class="material-symbols-outlined">psychology</span>
                  <span>AI Score (Low to High)</span>
                  <span class="material-symbols-outlined">arrow_upward</span>
                </button>
                <button class="page-list-sort-menu__item ${isSortActive('ai', 'desc') ? 'page-list-sort-menu__item--active' : ''}" data-sort="ai" data-direction="desc">
                  <span class="material-symbols-outlined">psychology</span>
                  <span>AI Score (High to Low)</span>
                  <span class="material-symbols-outlined">arrow_downward</span>
                </button>
                <button class="page-list-sort-menu__item ${isSortActive('title', 'asc') ? 'page-list-sort-menu__item--active' : ''}" data-sort="title" data-direction="asc">
                  <span class="material-symbols-outlined">title</span>
                  <span>Title (A-Z)</span>
                  <span class="material-symbols-outlined">arrow_upward</span>
                </button>
                <button class="page-list-sort-menu__item ${isSortActive('title', 'desc') ? 'page-list-sort-menu__item--active' : ''}" data-sort="title" data-direction="desc">
                  <span class="material-symbols-outlined">title</span>
                  <span>Title (Z-A)</span>
                  <span class="material-symbols-outlined">arrow_downward</span>
                </button>
              </div>
            </div>
          </div>
          <div class="page-list-controls__layout">
            <button class="page-list-layout-toggle" id="page-list-layout-toggle" data-layout="${currentLayout}">
              <span class="page-list-layout-toggle__icon material-symbols-outlined">${currentLayout === 'compact' ? 'view_compact' : 'view_list'}</span>
              <span class="page-list-layout-toggle__label">${currentLayout === 'compact' ? 'Compact' : 'Normal'}</span>
            </button>
          </div>
          <div class="page-list-controls__grouping">
            <button class="page-list-grouping-toggle" id="page-list-grouping-toggle" data-grouping="${currentGrouping}">
              <span class="page-list-grouping-toggle__icon material-symbols-outlined">${currentGrouping === 'ungrouped' ? 'list' : 'folder'}</span>
              <span class="page-list-grouping-toggle__label">${currentGrouping === 'ungrouped' ? 'Ungrouped' : 'Grouped'}</span>
            </button>
          </div>
          <div class="page-list-controls__export">
            <div class="page-list-export">
              <button class="page-list-export-toggle" id="page-list-export-toggle" type="button" aria-label="Export page list">
                <span class="page-list-export-toggle__icon material-symbols-outlined" aria-hidden="true">download</span>
                <span class="page-list-export-toggle__label">Export</span>
                <span class="page-list-export-toggle__arrow material-symbols-outlined" aria-hidden="true">arrow_drop_down</span>
              </button>
              <div class="page-list-export-menu" id="page-list-export-menu">
                <button class="page-list-export-menu__item" id="page-list-export-csv" type="button">
                  <span class="material-symbols-outlined" aria-hidden="true">description</span>
                  <span>Export Filtered as CSV</span>
                </button>
                <button class="page-list-export-menu__item" id="page-list-export-excel" type="button">
                  <span class="material-symbols-outlined" aria-hidden="true">table_chart</span>
                  <span>Export Filtered as Excel</span>
                </button>
                <div class="page-list-export-menu__divider" role="separator"></div>
                <button class="page-list-export-menu__item" id="page-list-export-csv-all" type="button">
                  <span class="material-symbols-outlined" aria-hidden="true">description</span>
                  <span>Export All as CSV</span>
                </button>
                <button class="page-list-export-menu__item" id="page-list-export-excel-all" type="button">
                  <span class="material-symbols-outlined" aria-hidden="true">table_chart</span>
                  <span>Export All as Excel</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ` : '';
      
      // Handle drafts section specially
      if (currentSection === 'drafts') {
        const draftPages = filterPages(allPages, 'drafts');
        const draftsHtml = renderDraftPages(draftPages);
        container.innerHTML = draftsHtml;
        attachDraftHandlers(draftPages);
        return; // Early return for drafts section
      }

      // Handle schema section specially
      if (currentSection === 'schema') {
        const schemaHtml = renderSchemaSection(allPages);
        container.innerHTML = schemaHtml;
        attachSchemaValidationHandlers(allPages);
        return; // Early return for schema section
      }

      // Handle llms section specially
      if (currentSection === 'llms') {
        const llmsHtml = renderLLMSSection();
        container.innerHTML = llmsHtml;
        attachLLMSHandlers();
        return; // Early return for llms section
      }

      const filteredPages = filterPages(allPages, currentFilter);
      const pagesHtml = showPages ? ((currentGrouping === 'grouped')
        ? renderGroupedPages(filteredPages, currentLayout === 'compact', currentSort, currentSortDirection, currentFilter)
        : renderUngroupedPages(filteredPages, currentLayout === 'compact', currentSort, currentSortDirection, currentFilter)) : '';

      container.innerHTML = `
        ${summaryHtml}
        ${controlsHtml}
        ${showPages ? `<div class="page-list-pages ${currentLayout === 'compact' ? 'page-list-pages--compact' : ''}" id="page-list-pages">
          ${pagesHtml}
        </div>` : ''}
      `;

      // Apply initial active state for filters/overview stats
      setActiveFilterState(currentFilter);

      // Attach listeners (filters should work even when stats grid is hidden but hero overview is present)
      attachFilterListeners();
      // Attach rescan handler on all pages
      attachRescanHandler();
      if (showControls) {
        attachLayoutToggle();
        attachGroupingToggle();
        attachSortToggle();
        // Update and attach export handlers
        updateFilteredPagesForExport(filteredPages);
        attachPageListExportHandlers();
        attachExportToggle();
      }
      if (showPages) {
        attachRowClickListeners();
        attachGroupToggleListeners();
        attachTooltipHandlers(container as HTMLElement);
        // Only attach fix button handler on technical-issues page
        if (currentSection === 'technical-issues') {
          attachFixButtonHandler(allPages);
        }
        if (currentSection === 'content-quality') {
          attachBulkGenerateExcerptsHandler(allPages);
        }
      }
      if (isLocalhost() && currentSection === 'keyword-research') {
        attachCompetitorAnalysisHandlers(allPages);
        // Extract and display site keywords
        extractAndDisplaySiteKeywords(allPages);
      }
      if (isLocalhost() && currentSection === 'link-map') {
        // Render link map visualization
        const linkMapContainer = document.getElementById('page-list-link-map-container');
        if (linkMapContainer) {
          renderLinkMap(linkMapContainer, allPages);
        }
      }
    })
    .catch(error => {
      hideLoading();
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      container.innerHTML = `
        <div class="page-list-error">
          <h2>Error Loading Page List</h2>
          <p>${escapeHtml(errorMessage)}</p>
          <p>Please refresh the page to try again.</p>
          <button 
            type="button" 
            class="page-list-modal__button page-list-modal__button--primary"
            onclick="window.location.reload()"
            style="margin-top: 1rem;"
          >
            Refresh Page
          </button>
        </div>
      `;
      devError('Error loading page list:', error);
    });
  } catch (error) {
    devError('Error initializing page list:', error);
    // Don't let page-list errors break the entire page
  }
}

/**
 * Extract and aggregate keywords from all site pages using full KeywordAnalysis
 */
interface KeywordEntry {
  keyword: string;
  frequency: number;
  pages: string[];
  density?: number;
  volume?: number;
  competition?: number;
  type: 'primary' | 'secondary' | 'long-tail' | 'other';
}

async function extractSiteKeywords(pages: PageData[]): Promise<{
  keywords: KeywordEntry[];
  siteAnalysis: {
    totalKeywordDensity: number;
    totalKeywordRichness: number;
    totalPrimaryKeywords: number;
    totalSecondaryKeywords: number;
    totalLongTailKeywords: number;
    recommendations: Array<{ text: string; type: string }>;
  };
}> {
  const keywordMap = new Map<string, KeywordEntry>();
  const primaryKeywords = new Set<string>();
  const secondaryKeywords = new Set<string>();
  const longTailKeywords = new Set<string>();
  let totalDensity = 0;
  let totalRichness = 0;
  let totalPrimary = 0;
  let totalSecondary = 0;
  let totalLongTail = 0;
  const allRecommendations: Array<{ text: string; type: string }> = [];
  let pagesAnalyzed = 0;
  
  try {
    const { analyzeKeywords } = await import('./keyword-research');
    
    for (const page of pages) {
      // Combine page text for analysis
      const pageText = `${page.title} ${page.metaDescription ?? ''} ${page.summary ?? ''}`;
      
      // Use full analyzeKeywords to get KeywordAnalysis with all fields
      const analysis = analyzeKeywords(pageText, page.title, page.metaDescription ?? '');
      
      // Track primary keywords
      analysis.primaryKeywords.forEach(kw => {
        const key = kw.keyword.toLowerCase();
        primaryKeywords.add(key);
        if (!keywordMap.has(key)) {
          keywordMap.set(key, {
            keyword: kw.keyword,
            frequency: 0,
            pages: [],
            density: kw.density,
            volume: kw.volume,
            competition: kw.competition,
            type: 'primary'
          });
        }
        const entry = keywordMap.get(key)!;
        entry.frequency += kw.frequency;
        if (!entry.pages.includes(page.relPermalink)) {
          entry.pages.push(page.relPermalink);
        }
        // Update density to average if multiple pages
        if (entry.density !== undefined && kw.density !== undefined) {
          entry.density = (entry.density + kw.density) / 2;
        }
      });
      
      // Track secondary keywords
      analysis.secondaryKeywords.forEach(kw => {
        const key = kw.keyword.toLowerCase();
        if (!primaryKeywords.has(key)) {
          secondaryKeywords.add(key);
          if (!keywordMap.has(key)) {
            keywordMap.set(key, {
              keyword: kw.keyword,
              frequency: 0,
              pages: [],
              density: kw.density,
              volume: kw.volume,
              competition: kw.competition,
              type: 'secondary'
            });
          }
          const entry = keywordMap.get(key)!;
          entry.frequency += kw.frequency;
          if (!entry.pages.includes(page.relPermalink)) {
            entry.pages.push(page.relPermalink);
          }
        }
      });
      
      // Track long-tail keywords (3+ words)
      analysis.longTailKeywords.forEach(keyword => {
        const key = keyword.toLowerCase();
        longTailKeywords.add(key);
        if (!keywordMap.has(key)) {
          keywordMap.set(key, {
            keyword: keyword,
            frequency: 0,
            pages: [],
            type: 'long-tail'
          });
        }
        const entry = keywordMap.get(key)!;
        if (!entry.pages.includes(page.relPermalink)) {
          entry.pages.push(page.relPermalink);
        }
        // Mark as long-tail if not already primary or secondary
        if (entry.type === 'other' || (!primaryKeywords.has(key) && !secondaryKeywords.has(key))) {
          entry.type = 'long-tail';
        }
      });
      
      // Aggregate metrics
      totalDensity += analysis.keywordDensity;
      totalRichness += analysis.keywordRichness;
      totalPrimary += analysis.primaryKeywords.length;
      totalSecondary += analysis.secondaryKeywords.length;
      totalLongTail += analysis.longTailKeywords.length;
      
      // Collect recommendations
      analysis.recommendations.forEach(rec => {
        allRecommendations.push({ text: rec.text, type: rec.type });
      });
      
      pagesAnalyzed++;
    }
    
    // Mark remaining keywords as 'other'
    keywordMap.forEach((entry, key) => {
      if (entry.type === 'primary' || entry.type === 'secondary' || entry.type === 'long-tail') {
        return; // Already categorized
      }
      // Check if it's long-tail by word count
      const wordCount = entry.keyword.split(/\s+/).length;
      if (wordCount >= 3) {
        entry.type = 'long-tail';
      } else {
        entry.type = 'other';
      }
    });
  } catch (error) {
    devError('Error extracting site keywords:', error);
  }
  
  return {
    keywords: Array.from(keywordMap.values()),
    siteAnalysis: {
      totalKeywordDensity: pagesAnalyzed > 0 ? totalDensity / pagesAnalyzed : 0,
      totalKeywordRichness: pagesAnalyzed > 0 ? totalRichness / pagesAnalyzed : 0,
      totalPrimaryKeywords: totalPrimary,
      totalSecondaryKeywords: totalSecondary,
      totalLongTailKeywords: totalLongTail,
      recommendations: allRecommendations.slice(0, 10) // Top 10 recommendations
    }
  };
}

/**
 * Extract and display site keywords in the keyword-research section
 * Uses full KeywordAnalysis interface with all fields (primaryKeywords, secondaryKeywords, longTailKeywords, keywordDensity, keywordRichness, recommendations)
 */
async function extractAndDisplaySiteKeywords(pages: PageData[]): Promise<void> {
  const keywordsList = document.getElementById('page-list-site-keywords-list');
  const totalStat = document.getElementById('page-list-keyword-stat-total');
  const uniqueStat = document.getElementById('page-list-keyword-stat-unique');
  
  if (!keywordsList) return;
  
  try {
    const result = await extractSiteKeywords(pages);
    const allKeywords = result.keywords;
    const siteAnalysis = result.siteAnalysis;
    
    // Update stats
    const totalKeywords = allKeywords.reduce((sum, entry) => sum + entry.frequency, 0);
    const uniqueKeywords = allKeywords.length;
    
    if (totalStat) {
      totalStat.textContent = totalKeywords.toLocaleString();
    }
    if (uniqueStat) {
      uniqueStat.textContent = uniqueKeywords.toLocaleString();
    }
    
    // Render keywords list with enhanced data from KeywordAnalysis
    if (allKeywords.length === 0) {
      keywordsList.innerHTML = '<p class="page-list-keyword-research__empty">No keywords found.</p>';
      return;
    }
    
    // Get CSS class helper for density
    const getDensityClass = (density?: number): string => {
      if (!density) return '';
      if (density < 0.8) return 'page-list-keyword-research__keyword-density--low';
      if (density >= 1.1 && density <= 1.9) return 'page-list-keyword-research__keyword-density--optimal';
      if (density > 2.2) return 'page-list-keyword-research__keyword-density--high';
      return 'page-list-keyword-research__keyword-density--ok';
    };
    
    // Group keywords by type
    const keywordsByType = {
      primary: allKeywords.filter(k => k.type === 'primary'),
      secondary: allKeywords.filter(k => k.type === 'secondary'),
      'long-tail': allKeywords.filter(k => k.type === 'long-tail'),
      other: allKeywords.filter(k => k.type === 'other')
    };
    
    keywordsList.innerHTML = `
      <div class="page-list-keyword-research__site-metrics">
        <div class="page-list-keyword-research__metric">
          <span class="page-list-keyword-research__metric-label">Avg Keyword Density</span>
          <span class="page-list-keyword-research__metric-value">${siteAnalysis.totalKeywordDensity.toFixed(2)}%</span>
        </div>
        <div class="page-list-keyword-research__metric">
          <span class="page-list-keyword-research__metric-label">Keyword Richness</span>
          <span class="page-list-keyword-research__metric-value">${siteAnalysis.totalKeywordRichness.toFixed(1)}%</span>
        </div>
        <div class="page-list-keyword-research__metric">
          <span class="page-list-keyword-research__metric-label">Primary Keywords</span>
          <span class="page-list-keyword-research__metric-value">${siteAnalysis.totalPrimaryKeywords}</span>
        </div>
        <div class="page-list-keyword-research__metric">
          <span class="page-list-keyword-research__metric-label">Long-Tail Keywords</span>
          <span class="page-list-keyword-research__metric-value">${siteAnalysis.totalLongTailKeywords}</span>
        </div>
      </div>
      ${siteAnalysis.recommendations.length > 0 ? `
      <div class="page-list-keyword-research__recommendations">
        <h4 class="page-list-keyword-research__recommendations-title">Site-Wide Recommendations</h4>
        <ul class="page-list-keyword-research__recommendations-list">
          ${siteAnalysis.recommendations.map(rec => `
            <li class="page-list-keyword-research__recommendation page-list-keyword-research__recommendation--${rec.type}">
              ${escapeHtml(rec.text)}
            </li>
          `).join('')}
        </ul>
      </div>
      ` : ''}
      <div class="page-list-keyword-research__keywords-controls">
        <div class="page-list-keyword-research__filter-group">
          <label class="page-list-keyword-research__filter-label">Filter:</label>
          <select class="page-list-keyword-research__filter-select" id="page-list-keyword-filter">
            <option value="all">All Keywords</option>
            <option value="primary">Primary Keywords</option>
            <option value="secondary">Secondary Keywords</option>
            <option value="long-tail">Long-Tail Keywords</option>
            <option value="other">Other Keywords</option>
          </select>
        </div>
        <div class="page-list-keyword-research__sort-group">
          <label class="page-list-keyword-research__sort-label">Sort:</label>
          <select class="page-list-keyword-research__sort-select" id="page-list-keyword-sort">
            <option value="frequency-desc">Frequency (High to Low)</option>
            <option value="frequency-asc">Frequency (Low to High)</option>
            <option value="density-desc">Density (High to Low)</option>
            <option value="density-asc">Density (Low to High)</option>
            <option value="volume-desc">Volume (High to Low)</option>
            <option value="volume-asc">Volume (Low to High)</option>
            <option value="pages-desc">Pages (High to Low)</option>
            <option value="pages-asc">Pages (Low to High)</option>
            <option value="alphabetical">Alphabetical (A-Z)</option>
          </select>
        </div>
      </div>
      <div class="page-list-keyword-research__keywords-columns" id="page-list-keywords-list-container">
        ${Object.entries(keywordsByType).map(([type, keywords]) => {
          if (keywords.length === 0) return '';
          const typeLabel = type === 'long-tail' ? 'Long-Tail' : type.charAt(0).toUpperCase() + type.slice(1);
          return `
            <div class="page-list-keyword-research__keyword-column" data-keyword-type="${type}">
              <h4 class="page-list-keyword-research__keyword-column-title">
                <span class="material-symbols-outlined">${type === 'primary' ? 'star' : type === 'secondary' ? 'label' : type === 'long-tail' ? 'auto_awesome' : 'tag'}</span>
                ${typeLabel} (${keywords.length})
              </h4>
              <ul class="page-list-keyword-research__keywords-list">
                ${keywords.map(kw => `
                  <li class="page-list-keyword-research__keyword-item">
                    <span class="page-list-keyword-research__keyword-text">${escapeHtml(kw.keyword)}</span>
                    <div class="page-list-keyword-research__keyword-meta">
                      <span class="page-list-keyword-research__keyword-frequency">${kw.frequency}x</span>
                      ${kw.pages.length > 0 ? `<span class="page-list-keyword-research__keyword-pages">${kw.pages.length}p</span>` : ''}
                    </div>
                  </li>
                `).join('')}
              </ul>
            </div>
          `;
        }).join('')}
      </div>
    `;
    
    // Attach filter and sort handlers
    attachKeywordListHandlers(allKeywords);
  } catch (error) {
    devError('Error displaying site keywords:', error);
    keywordsList.innerHTML = '<p class="page-list-keyword-research__empty">Error loading keywords. Please refresh the page.</p>';
  }
}

/**
 * Attach filter and sort handlers for keyword list
 */
function attachKeywordListHandlers(allKeywords: KeywordEntry[]): void {
  const filterSelect = document.getElementById('page-list-keyword-filter') as HTMLSelectElement;
  const sortSelect = document.getElementById('page-list-keyword-sort') as HTMLSelectElement;
  const container = document.getElementById('page-list-keywords-list-container');
  
  if (!filterSelect || !sortSelect || !container) return;
  
  const renderKeywords = (filterType: string, sortType: string) => {
    // Filter keywords
    let filtered = allKeywords;
    if (filterType !== 'all') {
      filtered = allKeywords.filter(k => k.type === filterType);
    }
    
    // Sort keywords
    const [sortField, sortDirection] = sortType.split('-');
    filtered = [...filtered].sort((a, b) => {
      let aVal: number | string = 0;
      let bVal: number | string = 0;
      
      switch (sortField) {
        case 'frequency':
          aVal = a.frequency;
          bVal = b.frequency;
          break;
        case 'density':
          aVal = a.density ?? 0;
          bVal = b.density ?? 0;
          break;
        case 'volume':
          aVal = a.volume ?? 0;
          bVal = b.volume ?? 0;
          break;
        case 'pages':
          aVal = a.pages.length;
          bVal = b.pages.length;
          break;
        case 'alphabetical':
          aVal = a.keyword.toLowerCase();
          bVal = b.keyword.toLowerCase();
          break;
        default:
          return 0;
      }
      
      if (sortField === 'alphabetical') {
        return sortDirection === 'asc' 
          ? (aVal as string).localeCompare(bVal as string)
          : (bVal as string).localeCompare(aVal as string);
      }
      
      return sortDirection === 'desc' 
        ? (bVal as number) - (aVal as number)
        : (aVal as number) - (bVal as number);
    });
    
    // Group filtered keywords by type
    const keywordsByType = {
      primary: filtered.filter(k => k.type === 'primary'),
      secondary: filtered.filter(k => k.type === 'secondary'),
      'long-tail': filtered.filter(k => k.type === 'long-tail'),
      other: filtered.filter(k => k.type === 'other')
    };
    
    // Get CSS class helper for density
    const getDensityClass = (density?: number): string => {
      if (!density) return '';
      if (density < 0.8) return 'page-list-keyword-research__keyword-density--low';
      if (density >= 1.1 && density <= 1.9) return 'page-list-keyword-research__keyword-density--optimal';
      if (density > 2.2) return 'page-list-keyword-research__keyword-density--high';
      return 'page-list-keyword-research__keyword-density--ok';
    };
    
    // Render grouped keywords in columns
    container.innerHTML = Object.entries(keywordsByType).map(([type, keywords]) => {
      if (keywords.length === 0) return '';
      const typeLabel = type === 'long-tail' ? 'Long-Tail' : type.charAt(0).toUpperCase() + type.slice(1);
      return `
        <div class="page-list-keyword-research__keyword-column" data-keyword-type="${type}">
          <h4 class="page-list-keyword-research__keyword-column-title">
            <span class="material-symbols-outlined">${type === 'primary' ? 'star' : type === 'secondary' ? 'label' : type === 'long-tail' ? 'auto_awesome' : 'tag'}</span>
            ${typeLabel} (${keywords.length})
          </h4>
          <ul class="page-list-keyword-research__keywords-list">
            ${keywords.map(kw => `
              <li class="page-list-keyword-research__keyword-item">
                <span class="page-list-keyword-research__keyword-text">${escapeHtml(kw.keyword)}</span>
                <div class="page-list-keyword-research__keyword-meta">
                  <span class="page-list-keyword-research__keyword-frequency">${kw.frequency}x</span>
                  ${kw.pages.length > 0 ? `<span class="page-list-keyword-research__keyword-pages">${kw.pages.length}p</span>` : ''}
                </div>
              </li>
            `).join('')}
          </ul>
        </div>
      `;
    }).filter(html => html !== '').join('');
  };
  
  // Initial render
  renderKeywords(filterSelect.value, sortSelect.value);
  
  // Attach event listeners
  filterSelect.addEventListener('change', () => {
    renderKeywords(filterSelect.value, sortSelect.value);
  });
  
  sortSelect.addEventListener('change', () => {
    renderKeywords(filterSelect.value, sortSelect.value);
  });
}

/**
 * Attach competitor analysis handlers
 */
function attachCompetitorAnalysisHandlers(pages: PageData[]): void {
  const urlInput = document.getElementById('page-list-competitor-url-input') as HTMLInputElement;
  const addBtn = document.getElementById('page-list-add-competitor-btn');
  const competitorList = document.getElementById('page-list-competitor-list');
  const resultsSection = document.getElementById('page-list-keyword-research-results');
  const comparisonDiv = document.getElementById('page-list-keyword-comparison');

  if (!urlInput || !addBtn || !competitorList || !resultsSection || !comparisonDiv) return;

  const STORAGE_KEY = 'page-list-competitors';
  const REMOVED_KEYWORDS_KEY = 'page-list-removed-opportunity-keywords';
  
  // Load removed keywords from localStorage
  const loadRemovedKeywords = (): Set<string> => {
    try {
      const stored = localStorage.getItem(REMOVED_KEYWORDS_KEY);
      if (stored) {
        return new Set(JSON.parse(stored));
      }
    } catch (error) {
      devError('Error loading removed keywords from storage:', error);
    }
    return new Set<string>();
  };
  
  // Save removed keywords to localStorage
  const saveRemovedKeywords = (removedKeywords: Set<string>) => {
    try {
      localStorage.setItem(REMOVED_KEYWORDS_KEY, JSON.stringify(Array.from(removedKeywords)));
    } catch (error) {
      devError('Error saving removed keywords to storage:', error);
    }
  };
  
  // Track removed keywords
  const removedKeywords = loadRemovedKeywords();
  
  // Load competitors from localStorage
  const loadCompetitors = (): Array<{ url: string; keywords: KeywordAnalysis | null; loading: boolean }> => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Array<{ url: string; keywords: KeywordAnalysis }>;
        return parsed.map((comp) => ({
          url: comp.url,
          keywords: comp.keywords,
          loading: false
        }));
      }
    } catch (error) {
      devError('Error loading competitors from storage:', error);
    }
    return [];
  };

  // Save competitors to localStorage
  const saveCompetitors = () => {
    try {
      const toSave = competitors
        .filter(c => !c.loading && c.keywords) // Only save analyzed competitors
        .map(c => ({
          url: c.url,
          keywords: c.keywords
        }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    } catch (error) {
      devError('Error saving competitors to storage:', error);
    }
  };

  const competitors: Array<{ url: string; keywords: KeywordAnalysis | null; loading: boolean }> = loadCompetitors();

  const renderCompetitorList = () => {
    if (competitors.length === 0) {
      competitorList.innerHTML = '<p class="page-list-keyword-research__empty">No competitors added yet.</p>';
      return;
    }

    competitorList.innerHTML = competitors.map((comp, index) => `
      <div class="page-list-keyword-research__competitor-item ${comp.loading ? 'page-list-keyword-research__competitor-item--loading' : ''}">
        <div class="page-list-keyword-research__competitor-url">${escapeHtml(comp.url)}</div>
        ${comp.loading ? `
          <div class="page-list-keyword-research__competitor-status">
            <span class="material-symbols-outlined" aria-hidden="true">hourglass_empty</span>
            Analyzing...
          </div>
        ` : comp.keywords ? `
          <div class="page-list-keyword-research__competitor-status page-list-keyword-research__competitor-status--success">
            <span class="material-symbols-outlined" aria-hidden="true">check_circle</span>
            ${comp.keywords.primaryKeywords?.length || 0} keywords found
          </div>
          <button class="page-list-keyword-research__competitor-remove" data-index="${index}" type="button" aria-label="Remove competitor">
            <span class="material-symbols-outlined" aria-hidden="true">close</span>
          </button>
        ` : `
          <div class="page-list-keyword-research__competitor-status page-list-keyword-research__competitor-status--error">
            <span class="material-symbols-outlined" aria-hidden="true">error</span>
            Failed to analyze
          </div>
          <button class="page-list-keyword-research__competitor-remove" data-index="${index}" type="button" aria-label="Remove competitor">
            <span class="material-symbols-outlined" aria-hidden="true">close</span>
          </button>
        `}
      </div>
    `).join('');

    // Attach remove handlers
    competitorList.querySelectorAll('.page-list-keyword-research__competitor-remove').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = parseInt((e.currentTarget as HTMLElement).getAttribute('data-index') || '0');
        competitors.splice(index, 1);
        saveCompetitors();
        renderCompetitorList();
        updateComparison(pages);
      });
    });
  };

  const analyzeCompetitor = async (url: string): Promise<any> => {
    try {
      // Use CORS proxy to fetch competitor page
      // Since this is localhost-only dev tool, we use a public CORS proxy
      // Alternative: Set up a local Node.js server or Netlify Function for production
      let html: string;
      let lastError: Error | null = null;
      
      // Try direct fetch first (may work for same-origin or CORS-enabled sites)
      try {
        const response = await fetch(url, {
          mode: 'cors',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
        if (response.ok) {
          html = await response.text();
          if (html && html.length > 0) {
            // Success with direct fetch
            return await parseAndAnalyze(html);
          }
        } else {
          throw new Error(`HTTP ${response.status}`);
        }
      } catch (fetchError) {
        lastError = fetchError instanceof Error ? fetchError : new Error(String(fetchError));
        // Continue to proxy fallback
      }
      
      // Fallback to CORS proxy services (try multiple)
      const proxyServices = [
        `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
        `https://corsproxy.io/?${encodeURIComponent(url)}`,
        `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`
      ];
      
      for (const proxyUrl of proxyServices) {
        try {
          const proxyResponse = await fetch(proxyUrl, {
            method: 'GET',
            headers: {
              'Accept': 'application/json'
            }
          });
          
          if (!proxyResponse.ok) {
            continue; // Try next proxy
          }
          
          const contentType = proxyResponse.headers.get('content-type') || '';
          
          if (contentType.includes('application/json')) {
            const proxyData = await proxyResponse.json();
            
            // Handle different proxy response formats
            if (proxyData.contents) {
              // allorigins.win format
              html = proxyData.contents;
            } else if (proxyData.data) {
              // Some proxies use 'data'
              html = proxyData.data;
            } else if (typeof proxyData === 'string') {
              // Direct HTML string in JSON
              html = proxyData;
            } else {
              continue; // Try next proxy
            }
          } else {
            // Direct HTML response (some proxies return HTML directly)
            html = await proxyResponse.text();
          }
          
          if (html && html.length > 100) { // Ensure we have meaningful content
            return await parseAndAnalyze(html);
          }
        } catch (proxyError) {
          // Try next proxy service
          continue;
        }
      }
      
      // All proxies failed
      throw new Error(
        `Failed to fetch competitor page. CORS restrictions prevent direct access. ` +
        `All proxy services failed. ` +
        `To fix: Set up a local proxy server or use a browser extension that disables CORS. ` +
        `Original error: ${lastError?.message || 'Unknown error'}`
      );
    } catch (error) {
      devError('Error analyzing competitor:', error);
      throw error;
    }
  };

  const parseAndAnalyze = async (html: string): Promise<any> => {
    // Parse HTML and extract content
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Extract text content
    const title = doc.querySelector('title')?.textContent || '';
    const metaDescription = doc.querySelector('meta[name="description"]')?.getAttribute('content') || '';
    
    // Get body text (remove scripts, styles, etc.)
    const bodyClone = doc.body.cloneNode(true) as HTMLElement;
    if (!bodyClone) {
      throw new Error('No body content found in HTML');
    }
    
    bodyClone.querySelectorAll('script, style, nav, header, footer, aside').forEach(el => el.remove());
    const bodyText = bodyClone.textContent || '';

    if (!bodyText || bodyText.trim().length < 50) {
      throw new Error('Insufficient content extracted from page (less than 50 characters)');
    }

    // Use keyword research module to analyze
    const { analyzeKeywords } = await import('./keyword-research');
    return analyzeKeywords(bodyText, title, metaDescription);
  };

  const updateComparison = (sitePages: PageData[]) => {
    const analyzedCompetitors = competitors.filter(c => c.keywords && !c.loading);
    
    // Update competitor count in overview
    const competitorStat = document.getElementById('page-list-keyword-stat-competitors');
    if (competitorStat) {
      competitorStat.textContent = analyzedCompetitors.length.toString();
    }
    
    if (analyzedCompetitors.length === 0) {
      resultsSection.style.display = 'none';
      const opportunitiesStat = document.getElementById('page-list-keyword-stat-opportunities');
      if (opportunitiesStat) {
        opportunitiesStat.textContent = '-';
      }
      return;
    }

    resultsSection.style.display = 'block';

    // Collect all competitor keywords
    const competitorKeywords = new Map<string, { count: number; competitors: string[] }>();
    analyzedCompetitors.forEach(comp => {
      if (!comp.keywords) {
        return;
      }
      const allKeywords = [
        ...(comp.keywords.primaryKeywords || []),
        ...(comp.keywords.secondaryKeywords || [])
      ];
      allKeywords.forEach((kw) => {
        if (!kw || typeof kw !== 'object' || !('keyword' in kw) || !('frequency' in kw)) {
          return;
        }
        const keyword = kw as { keyword: string; frequency: number };
        const key = keyword.keyword.toLowerCase();
        if (!competitorKeywords.has(key)) {
          competitorKeywords.set(key, { count: 0, competitors: [] });
        }
        const entry = competitorKeywords.get(key)!;
        entry.count += keyword.frequency;
        if (!entry.competitors.includes(comp.url)) {
          entry.competitors.push(comp.url);
        }
      });
    });

    // Collect site keywords from all pages
    const siteKeywords = new Map<string, number>();
    sitePages.forEach(page => {
      const pageKeywords = [
        ...(page.title ? page.title.toLowerCase().split(/\s+/) : []),
        ...(page.metaDescription ? page.metaDescription.toLowerCase().split(/\s+/) : [])
      ];
      pageKeywords.forEach(kw => {
        if (kw.length >= 3) {
          siteKeywords.set(kw, (siteKeywords.get(kw) || 0) + 1);
        }
      });
    });

    // Find keywords competitors use but site doesn't
    const opportunities: Array<{ keyword: string; competitorCount: number; competitors: string[] }> = [];
    competitorKeywords.forEach((data, keyword) => {
      // Filter out removed keywords
      if (!siteKeywords.has(keyword) && keyword.length >= 3 && !removedKeywords.has(keyword.toLowerCase())) {
        opportunities.push({
          keyword,
          competitorCount: data.count,
          competitors: data.competitors
        });
      }
    });

    // Sort by frequency
    opportunities.sort((a, b) => b.competitorCount - a.competitorCount);
    
    // Update opportunities stat in overview
    const opportunitiesStat = document.getElementById('page-list-keyword-stat-opportunities');
    if (opportunitiesStat) {
      opportunitiesStat.textContent = opportunities.length.toString();
    }

    comparisonDiv.innerHTML = `
      <div class="page-list-keyword-research__opportunities">
        <h5 class="page-list-keyword-research__opportunities-title">
          Keywords Used by Competitors (Not on Your Site)
        </h5>
        <p class="page-list-keyword-research__opportunities-count">
          Found ${opportunities.length} potential keyword opportunity${opportunities.length !== 1 ? 'ies' : ''}
          ${removedKeywords.size > 0 ? ` (${removedKeywords.size} removed)` : ''}
        </p>
        <div class="page-list-keyword-research__opportunities-list">
          ${opportunities.slice(0, 50).map(opp => {
            const keywordId = opp.keyword.toLowerCase().replace(/[^a-zA-Z0-9]/g, '_');
            return `
            <div class="page-list-keyword-research__opportunity-item" data-opportunity-keyword-id="${keywordId}">
              <span class="page-list-keyword-research__opportunity-keyword">${escapeHtml(opp.keyword)}</span>
              <span class="page-list-keyword-research__opportunity-count">Used ${opp.competitorCount}x by ${opp.competitors.length} competitor${opp.competitors.length !== 1 ? 's' : ''}</span>
              <button 
                class="page-list-keyword-research__opportunity-remove" 
                data-opportunity-keyword="${escapeHtml(opp.keyword)}"
                type="button"
                aria-label="Remove keyword"
                title="Remove this keyword"
              >
                <span class="material-symbols-outlined" aria-hidden="true">close</span>
              </button>
            </div>
          `;
          }).join('')}
        </div>
      </div>
    `;
    
    // Attach remove button handlers
    const removeButtons = comparisonDiv.querySelectorAll('.page-list-keyword-research__opportunity-remove');
    removeButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const keyword = (e.currentTarget as HTMLElement).getAttribute('data-opportunity-keyword');
        if (!keyword) return;
        
        const keywordLower = keyword.toLowerCase();
        const keywordId = keywordLower.replace(/[^a-zA-Z0-9]/g, '_');
        
        // Find the opportunity item element
        const opportunityItem = comparisonDiv.querySelector(`[data-opportunity-keyword-id="${keywordId}"]`);
        if (opportunityItem) {
          // Add fade-out animation
          (opportunityItem as HTMLElement).style.transition = 'opacity 0.3s ease, transform 0.3s ease';
          (opportunityItem as HTMLElement).style.opacity = '0';
          (opportunityItem as HTMLElement).style.transform = 'scale(0.9)';
          
          // Remove after animation
          setTimeout(() => {
            // Add to removed keywords set
            removedKeywords.add(keywordLower);
            saveRemovedKeywords(removedKeywords);
            
            // Re-render the comparison to update the list
            updateComparison(sitePages);
            
            showToast(`Removed "${keyword}"`, 'success', 2000, 'page-list');
          }, 300);
        }
      });
    });
  };

  addBtn.addEventListener('click', async () => {
    const url = urlInput.value.trim();
    if (!url) {
      showToast('Please enter a valid URL', 'error', 3000, 'page-list');
      return;
    }

    try {
      new URL(url); // Validate URL
    } catch {
      showToast('Invalid URL format', 'error', 3000, 'page-list');
      return;
    }

    if (competitors.some(c => c.url === url)) {
      showToast('This competitor URL is already added', 'info', 3000, 'page-list');
      return;
    }

    const competitor = { url, keywords: null, loading: true };
    competitors.push(competitor);
    urlInput.value = '';
    renderCompetitorList();

    try {
      showToast(`Analyzing ${url}...`, 'info', 2000, 'page-list');
      competitor.keywords = await analyzeCompetitor(url);
      competitor.loading = false;
      saveCompetitors();
      renderCompetitorList();
      updateComparison(pages);
      showToast('Competitor analysis complete', 'success', 3000, 'page-list');
    } catch (error) {
      competitor.loading = false;
      // Remove failed competitor from array
      const index = competitors.indexOf(competitor);
      if (index > -1) {
        competitors.splice(index, 1);
      }
      saveCompetitors();
      renderCompetitorList();
      showToast(`Failed to analyze competitor: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error', 5000, 'page-list');
    }
  });

  urlInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      addBtn.click();
    }
  });

  // Initial render and comparison update
  renderCompetitorList();
  if (competitors.length > 0) {
    updateComparison(pages);
  }
}

