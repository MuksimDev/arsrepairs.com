/**
 * Dev Score Bubble Module
 * Shows SEO and AI scores for the current page in a floating bubble (dev-only)
 * Circular minimized state, expands on hover, locks open on click
 */

import { isLocalhost, onDOMReady } from "../utils/dom";
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
  renderKeywordResearchModal,
  attachSeedKeywordSearch,
  attachCompetitorKeywordRemoval,
  attachExportHandlers
} from "./keyword-research";

interface PageData {
  relPermalink: string;
  seoScore: number;
  aiCrawlabilityScore: number;
  title: string;
  hasMetaTitle: boolean;
  hasMetaDescription: boolean;
  titleOverLimit: boolean;
  titleOverPixels: boolean;
  descriptionOverLimit: boolean;
  descriptionOverPixels: boolean;
  brokenLinks: number;
  hasBrokenLinks: boolean;
  imagesWithoutAlt: number;
  hasImagesWithoutAlt: boolean;
  h1Count: number;
  hasMultipleH1: boolean;
  hasH2s: boolean;
  hasSchemaMarkup?: boolean;
  hasSummary?: boolean;
  summaryTooShort?: boolean;
  summaryTooLong?: boolean;
  isStale?: boolean;
  hasLangAttribute?: boolean;
  hasCanonical?: boolean;
  wordCount?: number;
  wordCountPoor?: boolean;
  longSentences?: string[];
  brokenLinkUrls?: string[];
  genericAnchorCount?: number;
  hasGenericAnchors?: boolean;
  imagesWithGenericAlt?: number;
  hasGenericAltText?: boolean;
  imagesNotNextGen?: number;
  imagesWithoutLazyLoading?: number;
  // Additional SEO/AI factors
  internalLinksGood?: boolean;
  internalLinksTooFew?: boolean;
  internalLinksTooMany?: boolean;
  firstParaGood?: boolean;
  firstParaLength?: number;
  urlLengthGood?: boolean;
  urlLengthOver?: boolean;
  urlLength?: number;
  outboundLinksGood?: boolean;
  outboundLinksTooFew?: boolean;
  paragraphLengthGood?: boolean;
  paragraphLengthIssues?: number;
  subheadingDistributionGood?: boolean;
  mediaUsageGood?: boolean;
  mediaUsageTooFew?: boolean;
  hasDateInfo?: boolean;
  hasDatePublished?: boolean;
  hasDateUpdated?: boolean;
  hasMobileViewport?: boolean;
  socialMetaGood?: boolean;
  hasOpenGraph?: boolean;
  hasTwitterCard?: boolean;
  hasMixedContent?: boolean;
  mixedContentIssues?: number;
  hasLists?: boolean;
  hasBoldText?: boolean;
  hasCitations?: boolean;
  citationsGood?: boolean;
  citationCount?: number;
  hasAuthor?: boolean;
  authorName?: string | null;
  hasVideos?: boolean;
  videoCount?: number;
  hasTranscript?: boolean;
  readabilityGood?: boolean;
  avgSentenceLength?: number;
  // Accessibility fields
  contrastRatioIssues?: number;
  hasContrastRatioIssues?: boolean;
  hasFocusIndicators?: boolean;
  missingAriaLabels?: number;
  hasMissingAriaLabels?: boolean;
  keyboardNavigationIssues?: number;
  hasKeyboardNavigationIssues?: boolean;
  accessibilityScore?: number;
}

interface PageListData {
  pages: PageData[];
}

/**
 * Get score class based on score value (matches page-list.ts)
 */
function getScoreClass(score: number): string {
  if (score >= 80) return "score-excellent";
  if (score >= 60) return "score-good";
  if (score >= 40) return "score-fair";
  return "score-poor";
}

/**
 * Calculate average score
 */
function getAverageScore(seoScore: number, aiScore: number): number {
  return Math.round((seoScore + aiScore) / 2);
}

/**
 * Collect page issues - comprehensive check of all factors affecting SEO and AI scores
 */
function getPageIssues(page: PageData): Array<{ text: string; severity: "error" | "warning" }> {
  const issues: Array<{ text: string; severity: "error" | "warning" }> = [];

  // ============================================================================
  // Critical SEO Issues (Errors)
  // ============================================================================
  if (!page.hasMetaTitle) {
    issues.push({ text: "Missing meta title", severity: "error" });
  } else if (page.titleOverPixels) {
    issues.push({ text: "Title too wide (over pixel limit)", severity: "error" });
  } else if (page.titleOverLimit) {
    issues.push({ text: "Title too long", severity: "error" });
  }

  if (!page.hasMetaDescription) {
    issues.push({ text: "Missing meta description", severity: "error" });
  } else if (page.descriptionOverPixels) {
    issues.push({ text: "Description too wide (over pixel limit)", severity: "error" });
  } else if (page.descriptionOverLimit) {
    issues.push({ text: "Description too long", severity: "error" });
  }

  if (page.hasBrokenLinks && page.brokenLinks > 0) {
    issues.push({ 
      text: `${page.brokenLinks} broken link${page.brokenLinks > 1 ? "s" : ""}`, 
      severity: "error" 
    });
  }

  if (page.h1Count === 0) {
    issues.push({ text: "No H1 heading", severity: "error" });
  } else if (page.hasMultipleH1) {
    issues.push({ text: `${page.h1Count} H1 headings (should be 1)`, severity: "error" });
  }

  if (page.hasLangAttribute !== undefined && !page.hasLangAttribute) {
    issues.push({ text: "Missing lang attribute", severity: "error" });
  }

  if (page.hasCanonical !== undefined && !page.hasCanonical) {
    issues.push({ text: "Missing canonical URL", severity: "error" });
  }

  if (page.hasMixedContent && page.mixedContentIssues && page.mixedContentIssues > 0) {
    issues.push({ 
      text: `${page.mixedContentIssues} mixed content issue${page.mixedContentIssues > 1 ? "s" : ""} (HTTP on HTTPS)`, 
      severity: "error" 
    });
  }

  // ============================================================================
  // SEO Warning Issues
  // ============================================================================
  if (page.hasImagesWithoutAlt && page.imagesWithoutAlt > 0) {
    issues.push({ 
      text: `${page.imagesWithoutAlt} image${page.imagesWithoutAlt > 1 ? "s" : ""} without alt text`, 
      severity: "warning" 
    });
  }

  if (!page.hasH2s) {
    issues.push({ text: "No H2 headings", severity: "warning" });
  }

  if (page.hasSchemaMarkup !== undefined && !page.hasSchemaMarkup) {
    issues.push({ text: "Missing schema markup", severity: "warning" });
  }

  if (page.hasGenericAnchors && page.genericAnchorCount && page.genericAnchorCount > 0) {
    issues.push({ 
      text: `${page.genericAnchorCount} generic anchor link${page.genericAnchorCount > 1 ? "s" : ""} (e.g., "click here")`, 
      severity: "warning" 
    });
  }

  if (page.hasGenericAltText && page.imagesWithGenericAlt && page.imagesWithGenericAlt > 0) {
    issues.push({ 
      text: `${page.imagesWithGenericAlt} image${page.imagesWithGenericAlt > 1 ? "s" : ""} with generic alt text`, 
      severity: "warning" 
    });
  }

  if (page.internalLinksGood !== undefined && !page.internalLinksGood) {
    if (page.internalLinksTooFew) {
      issues.push({ text: "Too few internal links", severity: "warning" });
    } else if (page.internalLinksTooMany) {
      issues.push({ text: "Too many internal links", severity: "warning" });
    }
  }

  if (page.firstParaGood !== undefined && !page.firstParaGood) {
    issues.push({ text: "First paragraph too short or missing", severity: "warning" });
  }

  if (page.urlLengthGood !== undefined && !page.urlLengthGood) {
    if (page.urlLengthOver && page.urlLength) {
      issues.push({ text: `URL too long (${page.urlLength} chars)`, severity: "warning" });
    }
  }

  if (page.outboundLinksGood !== undefined && !page.outboundLinksGood) {
    if (page.outboundLinksTooFew) {
      issues.push({ text: "Too few outbound links", severity: "warning" });
    }
  }

  if (page.paragraphLengthGood !== undefined && !page.paragraphLengthGood) {
    if (page.paragraphLengthIssues && page.paragraphLengthIssues > 0) {
      issues.push({ 
        text: `${page.paragraphLengthIssues} long paragraph${page.paragraphLengthIssues > 1 ? "s" : ""}`, 
        severity: "warning" 
      });
    }
  }

  if (page.subheadingDistributionGood !== undefined && !page.subheadingDistributionGood) {
    issues.push({ text: "Poor subheading distribution", severity: "warning" });
  }

  if (page.mediaUsageGood !== undefined && !page.mediaUsageGood) {
    if (page.mediaUsageTooFew) {
      issues.push({ text: "Too few images/media", severity: "warning" });
    }
  }

  if (page.hasDateInfo !== undefined && !page.hasDateInfo) {
    issues.push({ text: "Missing date information (published/updated)", severity: "warning" });
  }

  if (page.hasMobileViewport !== undefined && !page.hasMobileViewport) {
    issues.push({ text: "Missing mobile viewport meta tag", severity: "warning" });
  }

  if (page.socialMetaGood !== undefined && !page.socialMetaGood) {
    // Provide specific details about what's missing
    const missingParts: string[] = [];
    if (page.hasOpenGraph !== undefined && !page.hasOpenGraph) {
      missingParts.push("Open Graph (og:title, og:description, og:image)");
    }
    if (page.hasTwitterCard !== undefined && !page.hasTwitterCard) {
      missingParts.push("Twitter Card (twitter:card)");
    }
    
    if (missingParts.length > 0) {
      issues.push({ 
        text: `Missing social media tags: ${missingParts.join(", ")}`, 
        severity: "warning" 
      });
    } else {
      // Fallback if individual flags aren't available
      issues.push({ text: "Incomplete social media meta tags (Open Graph/Twitter)", severity: "warning" });
    }
  }

  if (page.imagesNotNextGen && page.imagesNotNextGen > 0) {
    issues.push({ 
      text: `${page.imagesNotNextGen} image${page.imagesNotNextGen > 1 ? "s" : ""} not using next-gen format (WebP/AVIF)`, 
      severity: "warning" 
    });
  }

  if (page.imagesWithoutLazyLoading && page.imagesWithoutLazyLoading > 0) {
    issues.push({ 
      text: `${page.imagesWithoutLazyLoading} image${page.imagesWithoutLazyLoading > 1 ? "s" : ""} without lazy loading`, 
      severity: "warning" 
    });
  }

  // ============================================================================
  // AI Crawlability Issues
  // ============================================================================
  if (page.hasSummary !== undefined) {
    if (!page.hasSummary) {
      issues.push({ text: "Missing page summary/excerpt (critical for AI)", severity: "error" });
    } else if (page.summaryTooShort) {
      issues.push({ text: "Summary too short (<50 chars) - AI needs more context", severity: "warning" });
    } else if (page.summaryTooLong) {
      issues.push({ text: "Summary too long (>300 chars) - may be truncated", severity: "warning" });
    }
  }

  if (!page.hasH2s) {
    issues.push({ text: "No H2 headings - poor content structure for AI", severity: "warning" });
  }

  if (page.wordCountPoor) {
    issues.push({ text: "Low word count - insufficient content for AI", severity: "warning" });
  }

  if (page.readabilityGood !== undefined && !page.readabilityGood) {
    if (page.avgSentenceLength && page.avgSentenceLength > 20) {
      issues.push({ 
        text: `Average sentence length too long (${Math.round(page.avgSentenceLength)} words) - affects readability`, 
        severity: "warning" 
      });
    } else if (page.longSentences && page.longSentences.length > 0) {
      issues.push({ 
        text: `${page.longSentences.length} long sentence${page.longSentences.length > 1 ? "s" : ""} (>20 words)`, 
        severity: "warning" 
      });
    }
  }

  if (page.hasLists !== undefined && !page.hasLists) {
    issues.push({ text: "No lists (bulleted/numbered) - structure helps AI parsing", severity: "warning" });
  }

  if (page.hasBoldText !== undefined && !page.hasBoldText) {
    issues.push({ text: "No bold text - emphasis helps AI identify key points", severity: "warning" });
  }

  if (page.hasCitations !== undefined && !page.hasCitations) {
    issues.push({ text: "No citations/references - reduces E-E-A-T score", severity: "warning" });
  } else if (page.citationsGood !== undefined && !page.citationsGood && page.citationCount !== undefined) {
    issues.push({ text: `Only ${page.citationCount} citation${page.citationCount !== 1 ? "s" : ""} - more would improve E-E-A-T`, severity: "warning" });
  }

  if (page.hasAuthor !== undefined && !page.hasAuthor) {
    issues.push({ text: "Missing author information - reduces E-E-A-T score", severity: "warning" });
  }

  if (page.hasVideos !== undefined && page.hasVideos && page.videoCount && page.videoCount > 0) {
    if (page.hasTranscript !== undefined && !page.hasTranscript) {
      issues.push({ text: "Video(s) without transcript - AI can't access video content", severity: "warning" });
    }
  }

  if (page.isStale) {
    issues.push({ text: "Stale content (needs update) - freshness affects AI ranking", severity: "warning" });
  }

  // ============================================================================
  // Accessibility Issues
  // ============================================================================
  if (page.hasContrastRatioIssues && page.contrastRatioIssues && page.contrastRatioIssues > 0) {
    issues.push({ 
      text: `${page.contrastRatioIssues} contrast ratio issue${page.contrastRatioIssues > 1 ? "s" : ""}`, 
      severity: "error" 
    });
  }

  if (page.hasMissingAriaLabels && page.missingAriaLabels && page.missingAriaLabels > 0) {
    issues.push({ 
      text: `${page.missingAriaLabels} missing ARIA label${page.missingAriaLabels > 1 ? "s" : ""}`, 
      severity: "warning" 
    });
  }

  if (page.hasKeyboardNavigationIssues && page.keyboardNavigationIssues && page.keyboardNavigationIssues > 0) {
    issues.push({ 
      text: `${page.keyboardNavigationIssues} keyboard navigation issue${page.keyboardNavigationIssues > 1 ? "s" : ""}`, 
      severity: "error" 
    });
  }

  if (page.hasFocusIndicators !== undefined && page.hasFocusIndicators === false) {
    issues.push({ text: "Missing focus indicators", severity: "error" });
  }

  return issues;
}

/**
 * Render issues HTML - sorted by severity (errors first, then warnings)
 */
function renderIssues(issues: Array<{ text: string; severity: "error" | "warning" }>): string {
  if (issues.length === 0) {
    return `
      <div class="dev-score-bubble__issues">
        <div class="dev-score-bubble__issues-header">
          <span class="dev-score-bubble__issues-title">Issues</span>
          <span class="dev-score-bubble__issues-count issues-count--success">0</span>
        </div>
        <div class="dev-score-bubble__issues-list">
          <div class="dev-score-bubble__issue-item issue-item--success">
            <span class="dev-score-bubble__issue-icon">✓</span>
            <span class="dev-score-bubble__issue-text">All good! Perfect scores possible.</span>
          </div>
        </div>
      </div>
    `;
  }

  // Sort issues: errors first, then warnings
  const sortedIssues = [...issues].sort((a, b) => {
    if (a.severity === "error" && b.severity === "warning") return -1;
    if (a.severity === "warning" && b.severity === "error") return 1;
    return 0;
  });

  const errorIssues = sortedIssues.filter(i => i.severity === "error");
  const warningIssues = sortedIssues.filter(i => i.severity === "warning");

  // Show more issues (up to 8) since we now have comprehensive checks
  const maxIssues = 8;
  const displayedIssues = sortedIssues.slice(0, maxIssues);
  const remainingCount = sortedIssues.length - maxIssues;

  return `
    <div class="dev-score-bubble__issues">
      <div class="dev-score-bubble__issues-header">
        <span class="dev-score-bubble__issues-title">Issues Affecting Scores</span>
        <span class="dev-score-bubble__issues-count ${errorIssues.length > 0 ? "issues-count--error" : "issues-count--warning"}">
          ${issues.length}
        </span>
      </div>
      <div class="dev-score-bubble__issues-list">
        ${displayedIssues.map(issue => `
          <div class="dev-score-bubble__issue-item issue-item--${issue.severity}">
            <span class="dev-score-bubble__issue-icon">${issue.severity === "error" ? "✗" : "⚠"}</span>
            <span class="dev-score-bubble__issue-text">${issue.text}</span>
          </div>
        `).join("")}
        ${remainingCount > 0 ? `
          <div class="dev-score-bubble__issue-more">
            +${remainingCount} more issue${remainingCount > 1 ? "s" : ""}
          </div>
        ` : ""}
      </div>
    </div>
  `;
}

/**
 * Render highlight tools section
 */
function renderHighlightTools(page: PageData): string {
  const tools: Array<{ id: string; label: string; count: number }> = [];

  if (page.longSentences && page.longSentences.length > 0) {
    tools.push({
      id: "long-sentences",
      label: "Long Sentences",
      count: page.longSentences.length,
    });
  }

  if (page.hasImagesWithoutAlt && page.imagesWithoutAlt > 0) {
    tools.push({
      id: "images-no-alt",
      label: "Images Without Alt Text",
      count: page.imagesWithoutAlt,
    });
  }

  if (page.hasGenericAnchors && page.genericAnchorCount && page.genericAnchorCount > 0) {
    tools.push({
      id: "generic-anchors",
      label: "Generic Anchor Links",
      count: page.genericAnchorCount,
    });
  }

  if (page.hasBrokenLinks && page.brokenLinks > 0) {
    tools.push({
      id: "broken-links",
      label: "Broken Links",
      count: page.brokenLinks,
    });
  }

  if (page.hasGenericAltText && page.imagesWithGenericAlt && page.imagesWithGenericAlt > 0) {
    tools.push({
      id: "generic-alt-text",
      label: "Generic Alt Text",
      count: page.imagesWithGenericAlt,
    });
  }

  if (page.hasMultipleH1 && page.h1Count > 1) {
    tools.push({
      id: "multiple-h1",
      label: "Multiple H1 Headings",
      count: page.h1Count,
    });
  }

  if (tools.length === 0) {
    return "";
  }

  return `
    <div class="dev-score-bubble__tools">
      <div class="dev-score-bubble__tools-title">Highlight on Page</div>
      ${tools.map(
        (tool) => `
        <div class="dev-score-bubble__tool-item">
          <label class="dev-score-bubble__tool-toggle">
            <input type="checkbox" class="dev-score-bubble__tool-checkbox" data-toggle="${tool.id}">
            <span class="dev-score-bubble__tool-label">${tool.label}</span>
            <span class="dev-score-bubble__tool-count">(${tool.count})</span>
          </label>
        </div>
      `
      ).join("")}
    </div>
    <div class="dev-score-bubble__actions-section">
      <button class="dev-score-bubble__action-button" id="dev-score-bubble-keyword-research" type="button" aria-label="Analyze keywords">
        <span class="material-symbols-outlined" aria-hidden="true">search</span>
        <span>Keyword Research</span>
      </button>
    </div>
  `;
}

/**
 * Calculate circumference for circular progress (radius = 54)
 */
const CIRCUMFERENCE = 2 * Math.PI * 54;

/**
 * Create circular progress SVG
 */
function createCircularProgress(score: number | null | undefined, size: number = 120): string {
  // Defensive check: don't render if score is null, undefined, or not a number
  if (score === null || score === undefined || typeof score !== 'number' || isNaN(score)) {
    return `
      <svg class="dev-score-bubble__circle-svg" viewBox="0 0 120 120" width="${size}" height="${size}">
        <circle class="dev-score-bubble__circle-bg" cx="60" cy="60" r="54"></circle>
      </svg>
    `;
  }
  
  const scoreClass = getScoreClass(score);
  const dashArray = (score / 100) * CIRCUMFERENCE;
  
  return `
    <svg class="dev-score-bubble__circle-svg" viewBox="0 0 120 120" width="${size}" height="${size}">
      <circle class="dev-score-bubble__circle-bg" cx="60" cy="60" r="54"></circle>
      <circle 
        class="dev-score-bubble__circle-fill ${scoreClass}" 
        cx="60" 
        cy="60" 
        r="54"
        style="stroke-dasharray: ${dashArray} ${CIRCUMFERENCE};"
      ></circle>
    </svg>
  `;
}

/**
 * Create and render the score bubble
 */
function createBubble(pageData: PageData | null): void {
  // Remove existing bubble if present
  const existingBubble = document.querySelector(".dev-score-bubble");
  if (existingBubble) {
    existingBubble.remove();
  }

  // Don't create bubble if no page data
  if (!pageData) {
    return;
  }

  const averageScore = getAverageScore(pageData.seoScore, pageData.aiCrawlabilityScore);
  const averageScoreClass = getScoreClass(averageScore);
  const seoColorClass = getScoreClass(pageData.seoScore);
  const aiColorClass = getScoreClass(pageData.aiCrawlabilityScore);

  const bubble = document.createElement("div");
  bubble.className = "dev-score-bubble";
  bubble.setAttribute("data-dev-only", "true");
  bubble.setAttribute("data-state", "minimized");

  bubble.innerHTML = `
    <!-- Minimized circular state -->
    <div class="dev-score-bubble__minimized">
      <div class="dev-score-bubble__circle">
        ${createCircularProgress(averageScore, 80)}
        <div class="dev-score-bubble__circle-value">
          <span class="dev-score-bubble__circle-number">${averageScore}</span>
          <span class="dev-score-bubble__circle-label">Avg</span>
        </div>
      </div>
    </div>

    <!-- Expanded state (shown on hover/click) -->
    <div class="dev-score-bubble__expanded">
      <div class="dev-score-bubble__header">
        <div class="dev-score-bubble__header-content">
          <span class="dev-score-bubble__title">Page Scores</span>
          <a href="/page-list/" class="dev-score-bubble__header-link" aria-label="View full page list tool" title="View Page List">
            <span class="material-symbols-outlined" aria-hidden="true">list</span>
          </a>
        </div>
        <div class="dev-score-bubble__actions">
          <button class="dev-score-bubble__minimize" aria-label="Minimize score bubble" title="Minimize">−</button>
          <button class="dev-score-bubble__close" aria-label="Close score bubble" title="Close">×</button>
        </div>
      </div>
      <div class="dev-score-bubble__content">
        <div class="dev-score-bubble__score-item">
          <div class="dev-score-bubble__score-circle">
            ${createCircularProgress(pageData.seoScore, 70)}
            <div class="dev-score-bubble__circle-value">
              <span class="dev-score-bubble__circle-number">${pageData.seoScore}</span>
              <span class="dev-score-bubble__circle-label">SEO</span>
            </div>
          </div>
          <div class="dev-score-bubble__score-details">
            <div class="dev-score-bubble__score-name">SEO Score</div>
            <div class="dev-score-bubble__score-description">Search engine optimization quality</div>
          </div>
        </div>
        <div class="dev-score-bubble__score-item">
          <div class="dev-score-bubble__score-circle">
            ${createCircularProgress(pageData.aiCrawlabilityScore, 70)}
            <div class="dev-score-bubble__circle-value">
              <span class="dev-score-bubble__circle-number">${pageData.aiCrawlabilityScore}</span>
              <span class="dev-score-bubble__circle-label">AI</span>
            </div>
          </div>
          <div class="dev-score-bubble__score-details">
            <div class="dev-score-bubble__score-name">AI Crawlability</div>
            <div class="dev-score-bubble__score-description">AI bot accessibility score</div>
          </div>
        </div>
        ${pageData.accessibilityScore !== undefined && pageData.accessibilityScore !== null ? `
        <div class="dev-score-bubble__score-item">
          <div class="dev-score-bubble__score-circle">
            ${createCircularProgress(pageData.accessibilityScore, 70)}
            <div class="dev-score-bubble__circle-value">
              <span class="dev-score-bubble__circle-number">${pageData.accessibilityScore}</span>
              <span class="dev-score-bubble__circle-label">A11Y</span>
            </div>
          </div>
          <div class="dev-score-bubble__score-details">
            <div class="dev-score-bubble__score-name">Accessibility</div>
            <div class="dev-score-bubble__score-description">WCAG compliance score</div>
          </div>
        </div>
        ` : ''}
        ${renderIssues(getPageIssues(pageData))}
        ${renderHighlightTools(pageData)}
      </div>
      <div class="dev-score-bubble__footer">
        <span class="dev-score-bubble__page">${pageData.title}</span>
      </div>
    </div>
  `;

  document.body.appendChild(bubble);
  attachBubbleHandlers(bubble, pageData);
}

/**
 * Highlight long sentences on the page
 */
function highlightLongSentences(sentences: string[]): void {
  if (!sentences || sentences.length === 0) return;

  // Remove existing highlights first
  removeLongSentenceHighlights();

  const mainContentElement = document.querySelector(".prose, main, .page-content") || document.body;
  const mainContent = mainContentElement instanceof HTMLElement ? mainContentElement : document.body;
  
  sentences.forEach((sentence, index) => {
    // Normalize the sentence text for searching (remove extra whitespace)
    const normalizedSentence = sentence.trim().replace(/\s+/g, " ");
    
    // Simple text-based search and highlight
    highlightTextInElement(mainContent, normalizedSentence, index);
  });
}

/**
 * Highlight text within an element using a simple replace approach
 */
function highlightTextInElement(element: HTMLElement, searchText: string, index: number): boolean {
  // Skip if already highlighted anywhere
  if (document.querySelector(`.dev-score-bubble__highlight[data-sentence-index="${index}"]`)) {
    return true; // Already highlighted
  }

  // Skip script, style, and other non-content elements
  if (
    element.tagName === "SCRIPT" ||
    element.tagName === "STYLE" ||
    element.classList.contains("dev-score-bubble") ||
    element.closest(".dev-score-bubble")
  ) {
    return false;
  }

  // Process child nodes recursively
  const children = Array.from(element.childNodes);
  let found = false;
  
  for (const node of children) {
    if (found) break; // Stop after first match
    
    if (node.nodeType === Node.TEXT_NODE) {
      const textNode = node as Text;
      const text = textNode.textContent || "";
      
      // Check if this exact sentence is in the text
      if (text.includes(searchText) && !found) {
        // Found the text - highlight it
        const parent = textNode.parentElement;
        if (!parent) continue;

        const parts = text.split(searchText);
        const fragment = document.createDocumentFragment();

        parts.forEach((part, i) => {
          if (part) {
            fragment.appendChild(document.createTextNode(part));
          }
          if (i < parts.length - 1) {
            const highlight = document.createElement("mark");
            highlight.className = "dev-score-bubble__highlight dev-score-bubble__highlight--long-sentence";
            highlight.setAttribute("data-sentence-index", index.toString());
            highlight.setAttribute("data-highlight-type", "long-sentences");
            highlight.textContent = searchText;
            fragment.appendChild(highlight);
            found = true; // Mark as found to stop further processing
          }
        });

        if (found) {
          parent.replaceChild(fragment, textNode);
          return true; // Found and highlighted, stop searching
        }
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      if (highlightTextInElement(node as HTMLElement, searchText, index)) {
        found = true;
        break; // Found, stop processing
      }
    }
  }

  return found;
}

/**
 * Remove all long sentence highlights
 */
function removeLongSentenceHighlights(): void {
  const highlights = document.querySelectorAll(".dev-score-bubble__highlight[data-highlight-type='long-sentences']");
  highlights.forEach((highlight) => {
    const parent = highlight.parentElement;
    if (parent && highlight.textContent) {
      // Replace the highlight with its text content
      const textNode = document.createTextNode(highlight.textContent);
      parent.replaceChild(textNode, highlight);
      // Normalize to merge adjacent text nodes
      parent.normalize();
    }
  });
}

/**
 * Attach event handlers to the bubble
 */
function attachBubbleHandlers(bubble: HTMLElement, pageData: PageData): void {
  const closeButton = bubble.querySelector(".dev-score-bubble__close") as HTMLElement;
  const minimizeButton = bubble.querySelector(".dev-score-bubble__minimize") as HTMLElement;
  const minimized = bubble.querySelector(".dev-score-bubble__minimized") as HTMLElement;

  // Close button handler
  if (closeButton) {
    closeButton.addEventListener("click", (e) => {
      e.stopPropagation();
      bubble.remove();
      sessionStorage.setItem("dev-score-bubble-hidden", "true");
    });
  }

  // Minimize button handler
  if (minimizeButton) {
    minimizeButton.addEventListener("click", (e) => {
      e.stopPropagation();
      bubble.setAttribute("data-state", "minimized");
      sessionStorage.setItem("dev-score-bubble-expanded", "false");
    });
  }

  // Click on minimized to expand and lock
  if (minimized) {
    minimized.addEventListener("click", (e) => {
      e.stopPropagation();
      bubble.setAttribute("data-state", "expanded-locked");
      sessionStorage.setItem("dev-score-bubble-expanded", "true");
    });
  }

  // Hover to expand (only if not locked)
  bubble.addEventListener("mouseenter", () => {
    const state = bubble.getAttribute("data-state");
    if (state === "minimized") {
      bubble.setAttribute("data-state", "expanded-hover");
    }
  });

  bubble.addEventListener("mouseleave", () => {
    const state = bubble.getAttribute("data-state");
    if (state === "expanded-hover") {
      bubble.setAttribute("data-state", "minimized");
    }
  });

  // Restore expanded state if previously locked
  const expanded = sessionStorage.getItem("dev-score-bubble-expanded");
  if (expanded === "true") {
    bubble.setAttribute("data-state", "expanded-locked");
  }

  // Setup all highlight toggles
  setupHighlightToggles(bubble, pageData);

  // Setup keyword research button
  setupKeywordResearch(bubble, pageData);

  // Clean up highlights when bubble is removed
  const observer = new MutationObserver(() => {
    if (!document.body.contains(bubble)) {
      removeAllHighlights();
      observer.disconnect();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

/**
 * Setup all highlight toggle handlers
 */
function setupHighlightToggles(bubble: HTMLElement, pageData: PageData): void {
  const toggles = bubble.querySelectorAll('[data-toggle]') as NodeListOf<HTMLInputElement>;
  
  toggles.forEach((toggle) => {
    const toggleType = toggle.getAttribute("data-toggle");
    if (!toggleType) return;

    // Restore state
    const storageKey = `dev-score-bubble-highlight-${toggleType}`;
    const wasEnabled = sessionStorage.getItem(storageKey) === "true";
    if (wasEnabled) {
      toggle.checked = true;
      applyHighlight(toggleType, pageData, true);
    }

    // Add change handler
    toggle.addEventListener("change", (e) => {
      const target = e.target as HTMLInputElement;
      applyHighlight(toggleType, pageData, target.checked);
      sessionStorage.setItem(storageKey, target.checked ? "true" : "false");
    });
  });
}

/**
 * Apply or remove highlight based on type
 */
function applyHighlight(type: string, pageData: PageData, enabled: boolean): void {
  if (enabled) {
    switch (type) {
      case "long-sentences":
        if (pageData.longSentences) {
          highlightLongSentences(pageData.longSentences);
        }
        break;
      case "images-no-alt":
        highlightImagesWithoutAlt();
        break;
      case "generic-anchors":
        highlightGenericAnchors();
        break;
      case "broken-links":
        if (pageData.brokenLinkUrls) {
          highlightBrokenLinks(pageData.brokenLinkUrls);
        }
        break;
      case "generic-alt-text":
        highlightGenericAltText();
        break;
      case "multiple-h1":
        highlightMultipleH1();
        break;
    }
  } else {
    removeHighlight(type);
  }
}

/**
 * Setup keyword research button handler
 */
async function setupKeywordResearch(bubble: HTMLElement, pageData: PageData): Promise<void> {
  const keywordBtn = bubble.querySelector('#dev-score-bubble-keyword-research') as HTMLElement;
  if (!keywordBtn) return;

  keywordBtn.addEventListener('click', async (e) => {
    e.stopPropagation();
    
    // Show loading indicator on button
    const originalContent = keywordBtn.innerHTML;
    keywordBtn.setAttribute('disabled', 'true');
    keywordBtn.innerHTML = `
      <span class="material-symbols-outlined" style="animation: spin 1s linear infinite;" aria-hidden="true">hourglass_empty</span>
      <span>Analyzing...</span>
    `;
    
    try {
      // Small delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Get current page content
      const title = document.querySelector('title')?.textContent || pageData.title;
      const metaDescription = document.querySelector('meta[name="description"]')?.getAttribute('content') || '';
      
      // Get body text content
      const bodyText = document.body?.textContent || '';
      
      // Remove script and style content from rendered DOM
      const bodyClone = document.body.cloneNode(true) as HTMLElement;
      let cleanText: string;
      if (bodyClone) {
        // Remove non-content elements
        bodyClone.querySelectorAll('script, style, nav, header, footer, .dev-score-bubble, aside').forEach(el => el.remove());
        cleanText = bodyClone.textContent || bodyText;
      } else {
        // Fallback if clone fails
        cleanText = bodyText;
      }
      
      // Analyze keywords
      const analysis = analyzeKeywords(cleanText, title, metaDescription);
      
      // For gap analysis, we'd need all pages data - skip for now or fetch it
      // For simplicity, we'll skip gap analysis in dev-score-bubble
      const gapAnalysis = undefined;
      
      // Load competitor keywords from localStorage
      const STORAGE_KEY = 'page-list-competitors';
      let competitorKeywords: Array<{ url: string; keywords: any }> = [];
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          competitorKeywords = parsed.filter((c: any) => c.keywords && !c.loading);
        }
      } catch (error) {
        console.warn('Could not load competitor keywords:', error);
      }
      
      // Restore button state
      keywordBtn.removeAttribute('disabled');
      keywordBtn.innerHTML = originalContent;
      
      // Render and show keyword research modal
      const modalHtml = renderKeywordResearchModal(analysis, pageData.title, pageData.relPermalink, gapAnalysis, competitorKeywords);
      document.body.insertAdjacentHTML('beforeend', modalHtml);
      
      const keywordModal = document.getElementById('dev-keyword-research-modal');
      if (!keywordModal) return;
      
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
      
      // Attach export handlers (no allPageKeywords in dev-score-bubble context)
      attachExportHandlers(keywordModal, analysis);
      
    } catch (error) {
      console.error('Error analyzing keywords:', error);
      // Restore button state on error
      keywordBtn.removeAttribute('disabled');
      keywordBtn.innerHTML = originalContent;
      showToast('Error analyzing keywords. Please try again.', 'error', 5000, 'dev');
    }
  });
}

/**
 * Remove specific highlight type
 */
function removeHighlight(type: string): void {
  if (type === "long-sentences") {
    removeLongSentenceHighlights();
    return;
  }

  const selector = `.dev-score-bubble__highlight[data-highlight-type="${type}"]`;
  const highlights = document.querySelectorAll(selector);
  
  highlights.forEach((highlight) => {
    if (highlight instanceof HTMLElement) {
      // Remove highlight classes and inline styles
      highlight.classList.remove("dev-score-bubble__highlight");
      highlight.classList.remove(`dev-score-bubble__highlight--${type.replace(/-/g, "-")}`);
      highlight.removeAttribute("data-highlight-type");
      
      // Remove inline styles added for highlighting
      highlight.style.outline = "";
      highlight.style.outlineOffset = "";
      highlight.style.boxShadow = "";
      highlight.style.backgroundColor = "";
      highlight.style.borderBottom = "";
      highlight.style.borderLeft = "";
      highlight.style.padding = "";
      highlight.style.paddingLeft = "";
      highlight.style.marginLeft = "";
      highlight.style.textDecoration = "";
      highlight.style.borderRadius = "";
    }
  });
}

/**
 * Remove all highlights
 */
function removeAllHighlights(): void {
  const types = ["long-sentences", "images-no-alt", "generic-anchors", "broken-links", "generic-alt-text", "multiple-h1"];
  types.forEach((type) => removeHighlight(type));
}

/**
 * Highlight images without alt text
 */
function highlightImagesWithoutAlt(): void {
  const mainContent = document.querySelector(".prose, main, .page-content") || document.body;
  const images = mainContent.querySelectorAll("img:not([alt]), img[alt='']");
  
  images.forEach((img) => {
    if (img.classList.contains("dev-score-bubble__highlight")) return;
    
    const imgElement = img as HTMLElement;
    imgElement.classList.add("dev-score-bubble__highlight", "dev-score-bubble__highlight--image-no-alt");
    imgElement.setAttribute("data-highlight-type", "images-no-alt");
    imgElement.style.cssText += `
      outline: 3px solid #ef4444 !important;
      outline-offset: 2px !important;
      box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.2) !important;
    `;
  });
}

/**
 * Highlight generic anchor links
 */
function highlightGenericAnchors(): void {
  const genericTexts = ["click here", "read more", "here", "link", "more", "see more", "learn more", "click", "link"];
  const mainContent = document.querySelector(".prose, main, .page-content") || document.body;
  const links = mainContent.querySelectorAll("a");
  
  links.forEach((link) => {
    const text = (link.textContent || "").trim().toLowerCase();
    if (genericTexts.includes(text)) {
      link.classList.add("dev-score-bubble__highlight", "dev-score-bubble__highlight--generic-anchor");
      link.setAttribute("data-highlight-type", "generic-anchors");
      link.style.cssText += `
        background-color: #fee2e2 !important;
        border-bottom: 2px solid #dc2626 !important;
        padding: 1px 2px !important;
        border-radius: 2px !important;
      `;
    }
  });
}

/**
 * Highlight broken links
 */
function highlightBrokenLinks(brokenUrls: string[]): void {
  const mainContent = document.querySelector(".prose, main, .page-content") || document.body;
  const links = mainContent.querySelectorAll("a[href]");
  
  links.forEach((link) => {
    const href = link.getAttribute("href") || "";
    // Normalize URL for comparison
    const normalizedHref = href.split("#")[0]; // Remove fragment
    
    if (brokenUrls.some((brokenUrl) => {
      const normalizedBroken = brokenUrl.split("#")[0];
      return normalizedHref === normalizedBroken || normalizedHref.endsWith(normalizedBroken);
    })) {
      const linkElement = link as HTMLElement;
      linkElement.classList.add("dev-score-bubble__highlight", "dev-score-bubble__highlight--broken-link");
      linkElement.setAttribute("data-highlight-type", "broken-links");
      linkElement.setAttribute("data-broken-url", href);
      linkElement.style.cssText += `
        background-color: #fee2e2 !important;
        border-bottom: 2px dashed #dc2626 !important;
        padding: 1px 2px !important;
        text-decoration: line-through !important;
      `;
      
      // Add click handler for broken link actions
      attachBrokenLinkHandler(linkElement, href);
    }
  });
}

/**
 * Highlight images with generic alt text
 */
function highlightGenericAltText(): void {
  const genericAlts = ["image", "img", "photo", "picture", "graphic", ""];
  const mainContent = document.querySelector(".prose, main, .page-content") || document.body;
  const images = mainContent.querySelectorAll("img[alt]");
  
  images.forEach((img) => {
    const alt = (img.getAttribute("alt") || "").trim().toLowerCase();
    if (genericAlts.includes(alt)) {
      const imgElement = img as HTMLElement;
      imgElement.classList.add("dev-score-bubble__highlight", "dev-score-bubble__highlight--generic-alt");
      imgElement.setAttribute("data-highlight-type", "generic-alt-text");
      imgElement.style.cssText += `
        outline: 3px solid #f59e0b !important;
        outline-offset: 2px !important;
        box-shadow: 0 0 0 4px rgba(245, 158, 11, 0.2) !important;
      `;
    }
  });
}

/**
 * Highlight multiple H1 headings
 */
function highlightMultipleH1(): void {
  const mainContent = document.querySelector(".prose, main, .page-content") || document.body;
  const h1s = mainContent.querySelectorAll("h1");
  
  if (h1s.length > 1) {
    h1s.forEach((h1) => {
      h1.classList.add("dev-score-bubble__highlight", "dev-score-bubble__highlight--multiple-h1");
      h1.setAttribute("data-highlight-type", "multiple-h1");
      h1.style.cssText += `
        background-color: #fef3c7 !important;
        border-left: 4px solid #f59e0b !important;
        padding-left: 8px !important;
        margin-left: -4px !important;
      `;
    });
  }
}

/**
 * Attach click handler to broken link for context menu
 */
function attachBrokenLinkHandler(link: HTMLElement, brokenUrl: string): void {
  // Store original href to restore if needed
  const originalHref = (link as HTMLAnchorElement).href;
  
  // Prevent default navigation for broken links, but allow normal clicks to show menu
  link.addEventListener("click", (e) => {
    // Show menu on any click (since link is broken anyway)
    e.preventDefault();
    e.stopPropagation();
    showBrokenLinkContextMenu(link, brokenUrl, e);
  });
  
  // Also handle right-click context menu
  link.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    e.stopPropagation();
    showBrokenLinkContextMenu(link, brokenUrl, e);
  });
  
  // Add visual indicator that link is interactive
  link.setAttribute("title", `Broken link: ${brokenUrl}\nClick to fix, edit, or remove`);
}

// createConfirmationDialog and createUrlInputDialog are now imported from utils/dev-ui.ts

/**
 * Show context menu for broken link actions
 */
function showBrokenLinkContextMenu(link: HTMLElement, brokenUrl: string, event: MouseEvent): void {
  // Remove existing menu if any
  const existingMenu = document.querySelector(".dev-score-bubble__broken-link-menu");
  if (existingMenu) {
    existingMenu.remove();
  }
  
  const menu = document.createElement("div");
  menu.className = "dev-score-bubble__broken-link-menu";
  menu.setAttribute("role", "menu");
  menu.setAttribute("aria-label", "Broken link actions");
  
  menu.innerHTML = `
    <div class="dev-score-bubble__broken-link-menu-header">
      <span class="dev-score-bubble__broken-link-menu-title">Broken Link</span>
      <button class="dev-score-bubble__broken-link-menu-close" aria-label="Close menu" type="button">×</button>
    </div>
    <div class="dev-score-bubble__broken-link-menu-url">
      <code>${escapeHtml(brokenUrl)}</code>
    </div>
    <div class="dev-score-bubble__broken-link-menu-actions" role="group">
      <button 
        class="dev-score-bubble__broken-link-menu-action" 
        data-action="fix"
        type="button"
        aria-label="Auto-fix broken link"
      >
        <span class="material-symbols-outlined" aria-hidden="true">auto_fix_high</span>
        <span>Auto-Fix</span>
      </button>
      <button 
        class="dev-score-bubble__broken-link-menu-action" 
        data-action="edit"
        type="button"
        aria-label="Edit link URL"
      >
        <span class="material-symbols-outlined" aria-hidden="true">edit</span>
        <span>Edit URL</span>
      </button>
      <button 
        class="dev-score-bubble__broken-link-menu-action" 
        data-action="remove"
        type="button"
        aria-label="Remove link and keep text"
      >
        <span class="material-symbols-outlined" aria-hidden="true">link_off</span>
        <span>Remove Link</span>
      </button>
    </div>
  `;
  
  document.body.appendChild(menu);
  
  // Position menu near the link
  const linkRect = link.getBoundingClientRect();
  const menuRect = menu.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  
  let left = linkRect.left + (linkRect.width / 2) - (menuRect.width / 2);
  let top = linkRect.bottom + 8;
  
  // Adjust if menu would go off screen
  if (left + menuRect.width > viewportWidth) {
    left = viewportWidth - menuRect.width - 10;
  }
  if (left < 10) {
    left = 10;
  }
  if (top + menuRect.height > viewportHeight) {
    top = linkRect.top - menuRect.height - 8;
  }
  if (top < 10) {
    top = 10;
  }
  
  menu.style.left = `${left}px`;
  menu.style.top = `${top}px`;
  
  // Attach handlers
  const closeBtn = menu.querySelector(".dev-score-bubble__broken-link-menu-close");
  const fixBtn = menu.querySelector('[data-action="fix"]');
  const editBtn = menu.querySelector('[data-action="edit"]');
  const removeBtn = menu.querySelector('[data-action="remove"]');
  
  let clickHandlerRef: ((e: MouseEvent) => void) | null = null;
  
  const closeMenu = () => {
    menu.remove();
    if (clickHandlerRef) {
      document.removeEventListener("click", clickHandlerRef);
      clickHandlerRef = null;
    }
    document.removeEventListener("keydown", handleEscape);
  };
  
  const handleOutsideClick = (e: MouseEvent) => {
    const target = e.target as Node;
    // Don't close if clicking on a modal or dialog
    const isModal = (target as Element)?.closest('.dev-score-bubble-modal, .dev-score-bubble-modal-overlay');
    if (!menu.contains(target) && !link.contains(target) && !isModal) {
      closeMenu();
    }
  };
  
  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      closeMenu();
    }
  };
  
  closeBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    closeMenu();
  });
  
  // Use a more persistent click handler that checks for modals
  clickHandlerRef = (e: MouseEvent) => {
    handleOutsideClick(e);
  };
  
  // Delay adding the outside click handler slightly to avoid immediate closure
  setTimeout(() => {
    if (clickHandlerRef) {
      document.addEventListener("click", clickHandlerRef);
    }
  }, 100);
  
  document.addEventListener("keydown", handleEscape);
  
  fixBtn?.addEventListener("click", async (e) => {
    e.stopPropagation();
    closeMenu();
    
    // Show confirmation modal before fixing
    const confirmed = await createConfirmationDialog(
      'Auto-Fix Broken Link',
      `Attempt to automatically fix the broken link "${brokenUrl}"?\n\n` +
      'This will search for a matching URL and update the link if found.',
      'Fix Link',
      'Cancel',
      'dev'
    );
    
    if (confirmed) {
      await handleFixBrokenLink(link, brokenUrl);
    }
  });
  
  editBtn?.addEventListener("click", async (e) => {
    e.stopPropagation();
    closeMenu();
    
    // Show confirmation modal before editing
    const confirmed = await createConfirmationDialog(
      'Edit Broken Link',
      `Edit the URL for the broken link "${brokenUrl}"?\n\n` +
      'You will be prompted to enter a new URL.',
      'Edit Link',
      'Cancel',
      'dev'
    );
    
    if (confirmed) {
      await handleEditBrokenLink(link, brokenUrl);
    }
  });
  
  removeBtn?.addEventListener("click", async (e) => {
    e.stopPropagation();
    closeMenu();
    
    // Show confirmation modal before removing
    const confirmed = await createConfirmationDialog(
      'Remove Broken Link',
      `Remove the link "${brokenUrl}" and keep only the text?\n\nText: "${link.textContent?.trim() || ""}"\n\n` +
      'A backup will be created before making changes.',
      'Remove Link',
      'Cancel',
      'dev'
    );
    
    if (confirmed) {
      await handleRemoveBrokenLink(link, brokenUrl);
    }
  });
}

/**
 * Escape HTML to prevent XSS
 */
// escapeHtml is now imported from utils/dev-ui.ts

/**
 * Handle auto-fix broken link
 */
async function handleFixBrokenLink(link: HTMLElement, brokenUrl: string): Promise<void> {
  if (!isLocalhost()) {
    await createConfirmationDialog(
      'Development Mode Only',
      'This feature is only available in development mode.',
      'OK',
      undefined, // No cancel button for info messages
      'dev'
    );
    return;
  }
  
  // ALWAYS request directory access first if not already granted
  if ('showDirectoryPicker' in window && !getSiteRootDirectoryHandle()) {
    const accessGranted = await createConfirmationDialog(
      'Select Site Root Folder',
      'To fix broken links, you need to select your Hugo site root folder.\n\n' +
      'Click "Select Folder" below, then navigate to and select the folder that contains your "content" folder.\n\n' +
      'Example: If your site is at /Users/you/my-site/, select that folder.\n\n' +
      'This permission is only requested once per browser session.',
      'Select Folder',
      'Skip (Use Manual File Selection)',
      'dev'
    );
    
    if (accessGranted) {
      const dirHandle = await requestSiteRootAccess();
      if (!dirHandle) {
        showToast('You can still manually select the file when prompted.', 'info', 5000, 'dev');
      } else {
        showToast('Directory access granted!', 'success', 5000, 'dev');
      }
    } else {
      showToast('You can manually select the file when prompted.', 'info', 5000, 'dev');
    }
  } else if (!('showDirectoryPicker' in window)) {
    showToast('File System Access API not supported. You can manually select the file when prompted.', 'info', 5000, 'dev');
  }
  
  try {
    // Fetch all page paths to find a match
    const response = await fetch("/page-list/index.json");
    if (!response.ok) {
      throw new Error("Could not fetch page data");
    }
    
    const data = await response.json();
    const allPagePaths = data.pages.map((p: PageData) => p.relPermalink);
    
    // Find potential match using similar logic to page-list.ts
    const match = findUrlMatch(brokenUrl, allPagePaths, data.pages);
    
    if (match) {
      // Update the link
      if (link.tagName === "A") {
        (link as HTMLAnchorElement).href = match.match;
        link.classList.remove("dev-score-bubble__highlight--broken-link");
        link.removeAttribute("data-broken-url");
        link.style.textDecoration = "";
        link.style.backgroundColor = "";
        link.style.borderBottom = "";
        
        // Show success message
        showToast(`Link fixed: ${brokenUrl} → ${match.match}`, "success", 5000, 'dev');
        
        // Try to update the source file
        await updateLinkInSourceFile(brokenUrl, match.match);
      }
    } else {
      showToast(`No match found for: ${brokenUrl}`, "error", 5000, 'dev');
    }
  } catch (error) {
    console.error("Error fixing broken link:", error);
    showToast(`Error fixing link: ${error instanceof Error ? error.message : "Unknown error"}`, "error", 5000, 'dev');
  }
}

/**
 * Handle edit broken link URL
 */
async function handleEditBrokenLink(link: HTMLElement, brokenUrl: string): Promise<void> {
  if (!isLocalhost()) {
    await createConfirmationDialog(
      'Development Mode Only',
      'This feature is only available in development mode.',
      'OK',
      undefined, // No cancel button for info messages
      'dev'
    );
    return;
  }
  
  // ALWAYS request directory access first if not already granted
  if ('showDirectoryPicker' in window && !getSiteRootDirectoryHandle()) {
    const accessGranted = await createConfirmationDialog(
      'Select Site Root Folder',
      'To edit broken links, you need to select your Hugo site root folder.\n\n' +
      'Click "Select Folder" below, then navigate to and select the folder that contains your "content" folder.\n\n' +
      'Example: If your site is at /Users/you/my-site/, select that folder.\n\n' +
      'This permission is only requested once per browser session.',
      'Select Folder',
      'Skip (Use Manual File Selection)'
    );
    
    if (accessGranted) {
      const dirHandle = await requestSiteRootAccess();
      if (!dirHandle) {
        showToast('You can still manually select the file when prompted.', 'info', 5000, 'dev');
      } else {
        showToast('Directory access granted!', 'success', 5000, 'dev');
      }
    } else {
      showToast('You can manually select the file when prompted.', 'info', 5000, 'dev');
    }
  } else if (!('showDirectoryPicker' in window)) {
    showToast('File System Access API not supported. You can manually select the file when prompted.', 'info', 5000, 'dev');
  }
  
  // Use a modal for URL input instead of native prompt
  const newUrl = await createUrlInputDialog("Enter new URL:", brokenUrl, 'dev');
  
  if (newUrl && newUrl !== brokenUrl && link.tagName === "A") {
    // Try to update the source file first
    const sourceUpdated = await updateLinkInSourceFile(brokenUrl, newUrl);
    
    if (sourceUpdated) {
      // Update DOM
      (link as HTMLAnchorElement).href = newUrl;
      link.classList.remove("dev-score-bubble__highlight--broken-link");
      link.removeAttribute("data-broken-url");
      link.style.textDecoration = "";
      link.style.backgroundColor = "";
      link.style.borderBottom = "";
      
      showToast(`Link updated in source file: ${brokenUrl} → ${newUrl}`, "success");
    } else {
      // Fallback: just update DOM if file update failed
      (link as HTMLAnchorElement).href = newUrl;
      link.classList.remove("dev-score-bubble__highlight--broken-link");
      link.removeAttribute("data-broken-url");
      link.style.textDecoration = "";
      link.style.backgroundColor = "";
      link.style.borderBottom = "";
      
      showToast(`Link updated on page (source file not updated): ${brokenUrl} → ${newUrl}`, "info");
    }
  }
}

/**
 * Handle remove broken link (keep text)
 */
async function handleRemoveBrokenLink(link: HTMLElement, brokenUrl: string): Promise<void> {
  if (!isLocalhost()) {
    await createConfirmationDialog(
      'Development Mode Only',
      'This feature is only available in development mode.',
      'OK',
      undefined, // No cancel button for info messages
      'dev'
    );
    return;
  }
  
  // ALWAYS request directory access first if not already granted
  // This ensures the user sees the folder picker dialog
  if ('showDirectoryPicker' in window && !getSiteRootDirectoryHandle()) {
    const accessGranted = await createConfirmationDialog(
      'Select Site Root Folder',
      'To update source files, you need to select your Hugo site root folder.\n\n' +
      'Click "Select Folder" below, then navigate to and select the folder that contains your "content" folder.\n\n' +
      'Example: If your site is at /Users/you/my-site/, select that folder.\n\n' +
      'This permission is only requested once per browser session.',
      'Select Folder',
      'Skip (Use Manual File Selection)',
      'dev'
    );
    
    if (accessGranted) {
      const dirHandle = await requestSiteRootAccess(
        (msg) => showToast(msg, 'success', 5000, 'dev'),
        (msg) => showToast(msg, 'error', 5000, 'dev')
      );
      if (!dirHandle) {
        // User cancelled or failed - they can still use manual file selection
        showToast('You can still manually select the file when prompted.', 'info', 5000, 'dev');
      }
    } else {
      // User chose to skip - they'll use manual file selection
      showToast('You can manually select the file when prompted.', 'info', 5000, 'dev');
    }
  } else if (!('showDirectoryPicker' in window)) {
    // File System Access API not supported
    showToast('File System Access API not supported. You can manually select the file when prompted.', 'info', 5000, 'dev');
  }
  
  // Note: Confirmation dialog is now shown in the menu button handler, before this function is called
  
  try {
    const text = link.textContent || "";
    
    // First, try to update the source file
    const sourceUpdated = await removeLinkFromSourceFile(brokenUrl);
    
    if (sourceUpdated) {
      // If source file was updated, update DOM
      const parent = link.parentElement;
      if (parent) {
        // Replace link with text node
        const textNode = document.createTextNode(text);
        parent.replaceChild(textNode, link);
        
        // Remove highlight if it's still there
        const highlights = document.querySelectorAll(`.dev-score-bubble__highlight--broken-link[data-broken-url="${brokenUrl}"]`);
        highlights.forEach(h => {
          h.classList.remove("dev-score-bubble__highlight--broken-link");
          h.removeAttribute("data-broken-url");
          (h as HTMLElement).style.textDecoration = "";
          (h as HTMLElement).style.backgroundColor = "";
          (h as HTMLElement).style.borderBottom = "";
        });
      }
      
      showToast(`Link removed from source file, text kept: "${text}"`, "success");
    } else {
      // Fallback: just update DOM if file update failed
      const parent = link.parentElement;
      if (parent) {
        const textNode = document.createTextNode(text);
        parent.replaceChild(textNode, link);
        showToast(`Link removed from page (source file not updated): "${text}"`, "info");
      }
    }
  } catch (error) {
    console.error("Error removing broken link:", error);
    showToast(`Error removing link: ${error instanceof Error ? error.message : "Unknown error"}`, "error");
  }
}

/**
 * Find URL match (simplified version of page-list.ts logic)
 */
function findUrlMatch(brokenUrl: string, allPagePaths: string[], allPages?: PageData[]): { match: string; reason: string } | null {
  const brokenPath = brokenUrl.split("#")[0];
  const brokenLower = brokenPath.toLowerCase();
  const brokenNoSlash = brokenPath.replace(/\/$/, "");
  const brokenNoHtml = brokenPath.replace(/\.html$/, "");
  
  // Rule 1: Exact match ignoring case
  for (const path of allPagePaths) {
    if (path.toLowerCase() === brokenLower) {
      return { match: path, reason: "Exact match (case-insensitive)" };
    }
  }
  
  // Rule 2: Exact match ignoring trailing slash
  for (const path of allPagePaths) {
    const pathNoSlash = path.replace(/\/$/, "");
    if (pathNoSlash === brokenNoSlash || path === brokenNoSlash || pathNoSlash === brokenPath) {
      return { match: path, reason: "Exact match (trailing slash difference)" };
    }
  }
  
  // Rule 3: Exact match ignoring .html extension
  for (const path of allPagePaths) {
    const pathNoHtml = path.replace(/\.html$/, "");
    if (pathNoHtml === brokenNoHtml || path === brokenNoHtml || pathNoHtml === brokenPath) {
      return { match: path, reason: "Exact match (.html extension difference)" };
    }
  }
  
  // Rule 4: Missing section prefix (e.g., /why-is-my-maytag-dryer-not-drying/ → /blog/why-is-my-maytag-dryer-not-drying/)
  const sections = new Set<string>();
  if (allPages) {
    allPages.forEach(page => {
      if (page.relPermalink.includes("/") && page.relPermalink !== "/") {
        const section = page.relPermalink.split("/")[1];
        if (section) {
          sections.add(section);
        }
      }
    });
  }
  // Also check common sections as fallback
  const commonSections = ["blog", "our-services", "service-areas", "about-us", "brands-we-serve"];
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
  
  return null;
}

// File System Access API support - using shared utility
// getSiteRootDirectoryHandle() is managed by file-system.ts

/**
 * Map current page URL to content file path
 */
function getCurrentPageContentFile(): string[] {
  let currentPath = window.location.pathname;
  
  // Normalize path - remove trailing slash except for root
  if (currentPath !== '/' && currentPath.endsWith('/')) {
    currentPath = currentPath.slice(0, -1);
  }
  
  console.log('Current page path:', currentPath);
  const possiblePaths = relPermalinkToContentFile(currentPath);
  console.log('Possible file paths:', possiblePaths);
  
  return possiblePaths;
}

// relPermalinkToContentFile is now imported from utils/file-system.ts

// File system functions are now imported from utils/file-system.ts

/**
 * Update link in source file
 */
async function updateLinkInSourceFile(oldUrl: string, newUrl: string): Promise<boolean> {
  try {
    // Get current page file paths
    const possiblePaths = getCurrentPageContentFile();
    let filePath = await findActualFilePath(possiblePaths, true); // Enable verbose logging
    
    if (!filePath) {
      console.warn('Could not find source file for current page. Tried:', possiblePaths);
      
      // Offer manual file selection
      if ('showOpenFilePicker' in window) {
        const tryManual = await createConfirmationDialog(
          'Select Source File',
          `Could not automatically find the source file.\n\n` +
          `Expected paths:\n${possiblePaths.map(p => `  • ${p}`).join('\n')}\n\n` +
          `Would you like to manually select the markdown file?`,
          'Select File',
          'Cancel',
          'dev'
        );
        
        if (tryManual) {
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
              const fileHandle = fileHandles[0];
              const file = await fileHandle.getFile();
              const content = await file.text();
              
              console.log('User manually selected file:', file.name);
              
              // Update the link in the manually selected file
              const escapedOldUrl = escapeRegex(oldUrl);
              let modifiedContent = content;
              let modified = false;
              
              // Replace markdown links
              const markdownPattern = new RegExp(`(\\[[^\\]]+\\]\\()${escapedOldUrl}([^)]*\\))`, 'g');
              modifiedContent = modifiedContent.replace(markdownPattern, (match: string, prefix: string, suffix: string) => {
                modified = true;
                return `${prefix}${newUrl}${suffix}`;
              });
              
              // Replace HTML links
              const htmlPattern = new RegExp(`(href=["'])${escapedOldUrl}(["'])`, 'gi');
              modifiedContent = modifiedContent.replace(htmlPattern, (match: string, prefix: string, suffix: string) => {
                modified = true;
                return `${prefix}${newUrl}${suffix}`;
              });
              
              if (!modified) {
                showToast('Link not found in selected file content', 'info', 5000, 'dev');
                return false;
              }
              
              // Create backup
              try {
                const backupFile = await fileHandle.getFile();
                const backupContent = await backupFile.text();
                const backupPath = createBackupFilename(file.name);
                // Try to create backup in same directory (if we have access)
                // For now, just log it
                console.log('Would create backup at:', backupPath);
              } catch (backupError) {
                console.warn('Could not create backup file:', backupError);
              }
              
              // Write the modified content
              try {
                const writable = await fileHandle.createWritable();
                await writable.write(modifiedContent);
                await writable.close();
                
                showToast(`Link updated in ${file.name}`, 'success', 5000, 'dev');
                return true;
              } catch (writeError) {
                console.error('Error writing to manually selected file:', writeError);
                showToast(`Error writing file: ${writeError instanceof Error ? writeError.message : 'Unknown error'}`, 'error', 5000, 'dev');
                return false;
              }
            }
          } catch (pickerError) {
            if ((pickerError as Error).name !== 'AbortError') {
              console.error('File picker error:', pickerError);
              showToast(`File picker error: ${pickerError instanceof Error ? pickerError.message : 'Unknown error'}`, 'error', 5000, 'dev');
            }
          }
        }
      }
      
      // Show error modal if manual selection wasn't used or available
      await createConfirmationDialog(
        'Could Not Find Source File',
        `Could not automatically find the source file.\n\n` +
        `Tried:\n${possiblePaths.map(p => `  • ${p}`).join('\n')}\n\n` +
        `To fix this:\n` +
        `1. Grant File System Access when prompted (select your site root directory)\n` +
        `2. Use the manual file selection option when offered`,
        'OK',
        undefined, // Single button for info
        'dev'
      );
      return false;
    }
    
    const fileData = await readFileContent(filePath, true); // Enable verbose logging
    if (!fileData) {
      console.warn(`Could not read file: ${filePath}`);
      showToast(`Could not read file: ${filePath}`, 'error', 5000, 'dev');
      return false;
    }
    
    const escapedOldUrl = escapeRegex(oldUrl);
    let modifiedContent = fileData.content;
    let modified = false;
    
    // Replace markdown links
    const markdownPattern = new RegExp(`(\\[[^\\]]+\\]\\()${escapedOldUrl}([^)]*\\))`, 'g');
    modifiedContent = modifiedContent.replace(markdownPattern, (match, prefix, suffix) => {
      modified = true;
      return `${prefix}${newUrl}${suffix}`;
    });
    
    // Replace HTML links
    const htmlPattern = new RegExp(`(href=["'])${escapedOldUrl}(["'])`, 'gi');
    modifiedContent = modifiedContent.replace(htmlPattern, (match, prefix, suffix) => {
      modified = true;
      return `${prefix}${newUrl}${suffix}`;
    });
    
    if (!modified) {
      console.warn('No matches found in file');
      return false;
    }
    
    // Create backup
    const backupPath = createBackupFilename(filePath);
    const backupCreated = await writeFileContent(backupPath, fileData.content);
    
    if (!backupCreated) {
      console.warn(`Could not create backup: ${backupPath}`);
    }
    
    // Write modified content
    const writeSuccess = await writeFileContent(filePath, modifiedContent);
    
    if (writeSuccess) {
      console.log(`✅ Updated link in ${filePath}${backupCreated ? ` (backup: ${backupPath})` : ''}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error updating link in source file:', error);
    return false;
  }
}

/**
 * Remove link from source file
 */
async function removeLinkFromSourceFile(url: string): Promise<boolean> {
  try {
    // Directory access should already be requested in handleRemoveBrokenLink
    // But if we still don't have it, skip automatic file detection and go straight to manual selection
    const siteRootHandle = getSiteRootDirectoryHandle();
    if (!siteRootHandle) {
      console.log('No directory access available, will offer manual file selection');
    }
    
    // If we have directory access, try to find the file automatically
    let filePath: string | null = null;
    
    if (siteRootHandle) {
      // Verify directory access is working
      try {
        // Test that we can actually access the content directory
        await siteRootHandle.getDirectoryHandle('content', { create: false });
        console.log('✅ Directory access verified - content folder is accessible');
        
        // Get current page file paths
        const possiblePaths = getCurrentPageContentFile();
        console.log('Looking for file in paths:', possiblePaths);
        
        filePath = await findActualFilePath(possiblePaths, true); // Enable verbose logging
        
        if (filePath) {
          console.log('✅ File found automatically:', filePath);
        } else {
          console.warn('Could not find source file automatically. Tried:', possiblePaths);
        }
      } catch (verifyError) {
        console.error('❌ Directory access verification failed:', verifyError);
        showToast('Directory access was lost. Please grant access again.', 'error', 5000, 'dev');
        setSiteRootDirectoryHandle(null); // Reset so user can grant access again
      }
    } else {
      console.log('No directory access available - will offer manual file selection');
    }
    
    // If file not found and we don't have directory access, offer manual file selection
    if (!filePath) {
      const possiblePaths = getCurrentPageContentFile();
      
      // Always offer manual file selection if automatic detection failed
      if ('showOpenFilePicker' in window) {
        const tryManual = await createConfirmationDialog(
          'Select Source File',
          `Could not automatically find the source file.\n\n` +
          `Expected paths:\n${possiblePaths.map(p => `  • ${p}`).join('\n')}\n\n` +
          `Would you like to manually select the markdown file?`,
          'Select File',
          'Cancel',
          'dev'
        );
        
        if (tryManual) {
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
              const fileHandle = fileHandles[0];
              const file = await fileHandle.getFile();
              const content = await file.text();
              
              console.log('User manually selected file:', file.name);
              
              // Continue with the removal process using the manually selected file
              const removalResult = removeLinkFromContent(content, url);
              
              if (removalResult.changes.length === 0) {
                showToast('Link not found in selected file content', 'info');
                return false;
              }
              
              // Create backup by reading the original content again
              const backupContent = content;
              
              // For manually selected files, we need to use the file handle to write
              try {
                // Write the modified content
                const writable = await fileHandle.createWritable();
                await writable.write(removalResult.content);
                await writable.close();
                
                // Try to create a backup file in the same directory
                try {
                  const backupFileName = `${file.name}.backup-${new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)}`;
                  // Note: We can't create backup in same directory without directory handle
                  // But we've already modified the file, so at least log it
                  console.log(`✅ Modified file: ${file.name} (backup would be: ${backupFileName})`);
                } catch (backupError) {
                  console.warn('Could not create backup file:', backupError);
                }
                
                showToast(`Link removed from ${file.name}`, 'success');
                return true;
              } catch (writeError) {
                console.error('Error writing to manually selected file:', writeError);
                showToast(`Error writing file: ${writeError instanceof Error ? writeError.message : 'Unknown error'}`, 'error');
                return false;
              }
            }
          } catch (pickerError) {
            if ((pickerError as Error).name !== 'AbortError') {
              console.error('File picker error:', pickerError);
              showToast(`File picker error: ${pickerError instanceof Error ? pickerError.message : 'Unknown error'}`, 'error');
            }
          }
        }
      }
      
      // Show error modal instead of toast for better visibility
      await createConfirmationDialog(
        'Could Not Find Source File',
        `Could not automatically find the source file.\n\n` +
        `Tried:\n${possiblePaths.map(p => `  • ${p}`).join('\n')}\n\n` +
        `To fix this:\n` +
        `1. Grant File System Access when prompted (select your site root directory)\n` +
        `2. Use the manual file selection option when offered`,
        'OK',
        undefined, // Single button for info
        'dev'
      );
      return false;
    }
    
    console.log('Found source file:', filePath);
    
    const fileData = await readFileContent(filePath, true); // Enable verbose logging
    if (!fileData) {
      console.warn(`Could not read file: ${filePath}`);
      showToast(`Could not read file: ${filePath}`, 'error', 5000, 'dev');
      return false;
    }
    
    // Normalize URL for matching (handle trailing slashes, etc.)
    const normalizedUrl = url.split('#')[0].replace(/\/$/, '');
    const urlVariations = [
      url, // Original
      normalizedUrl, // Without trailing slash
      url + '/', // With trailing slash
      normalizedUrl + '/', // Normalized with trailing slash
    ];
    
    // Try removing with each URL variation
    let removalResult: { content: string; changes: Array<{ oldUrl: string; newUrl: string; lineNumber: number; text: string }> } | null = null;
    let matchedUrl: string | null = null;
    
    for (const urlVar of urlVariations) {
      removalResult = removeLinkFromContent(fileData.content, urlVar);
      if (removalResult.changes.length > 0) {
        matchedUrl = urlVar;
        console.log(`Found link with URL variation: ${urlVar}`);
        break;
      }
    }
    
    if (!removalResult || removalResult.changes.length === 0) {
      console.warn('Link not found in file content. Tried URL variations:', urlVariations);
      console.log('File content preview:', fileData.content.substring(0, 500));
      showToast(`Link not found in file content. URL: ${url}`, 'info');
      return false;
    }
    
    console.log(`Removing link: ${matchedUrl} (${removalResult.changes.length} occurrence(s))`);
    
    // Create backup
    const backupPath = createBackupFilename(filePath);
    console.log('Creating backup:', backupPath);
    const backupCreated = await writeFileContent(backupPath, fileData.content);
    
    if (!backupCreated) {
      console.warn(`Could not create backup: ${backupPath}`);
      showToast(`Warning: Could not create backup file`, 'error');
    } else {
      console.log('✅ Backup created:', backupPath);
    }
    
    // Write modified content
    console.log('Writing modified content to:', filePath);
    const writeSuccess = await writeFileContent(filePath, removalResult.content);
    
    if (writeSuccess) {
      console.log(`✅ Removed link from ${filePath}${backupCreated ? ` (backup: ${backupPath})` : ''}`);
      if (backupCreated) {
        showToast(`Link removed. Backup: ${backupPath.split('/').pop()}`, 'success');
      } else {
        showToast('Link removed from source file', 'success');
      }
      return true;
    }
    
    console.error(`Failed to write file: ${filePath}`);
    showToast(`Could not write file: ${filePath}`, 'error');
    return false;
  } catch (error) {
    console.error('Error removing link from source file:', error);
    showToast(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    return false;
  }
}

/**
 * Show toast notification for broken link actions
 */
// showToast is now imported from utils/dev-ui.ts

/**
 * Fetch page data and find current page
 */
async function fetchPageData(): Promise<PageData | null> {
  try {
    const response = await fetch("/page-list/index.json");
    if (!response.ok) {
      console.warn("Dev Score Bubble: Could not fetch page data", response.status, response.statusText);
      return null;
    }

    const data: PageListData = await response.json();
    const currentPath = window.location.pathname;

    // Debug logging in development
    if (isLocalhost()) {
      console.log("Dev Score Bubble: Current path:", currentPath);
      console.log("Dev Score Bubble: Total pages in JSON:", data.pages.length);
    }

    // Find matching page with improved matching logic
    const currentPage = data.pages.find((page) => {
      // Handle home page
      if (currentPath === "/" && (page.relPermalink === "/" || page.relPermalink === "")) {
        return true;
      }
      
      // Normalize paths for comparison - remove trailing slashes (except for root)
      const normalizePath = (path: string): string => {
        if (path === "/" || path === "") return "/";
        return path.endsWith("/") ? path.slice(0, -1) : path;
      };
      
      const pagePath = normalizePath(page.relPermalink);
      const currentPathNormalized = normalizePath(currentPath);
      
      // Exact match
      if (pagePath === currentPathNormalized) {
        if (isLocalhost()) {
          console.log("Dev Score Bubble: Found exact match:", page.relPermalink, "for path:", currentPath);
        }
        return true;
      }
      
      // Also try matching with/without index.html suffix (Hugo sometimes generates these)
      const pagePathWithIndex = pagePath + "/index.html";
      const pagePathWithoutIndex = pagePath.replace(/\/index\.html$/, "");
      
      if (currentPathNormalized === pagePathWithIndex || currentPathNormalized === pagePathWithoutIndex) {
        if (isLocalhost()) {
          console.log("Dev Score Bubble: Found match with index.html variant:", page.relPermalink, "for path:", currentPath);
        }
        return true;
      }
      
      return false;
    });

    if (!currentPage && isLocalhost()) {
      // Log potential matches for debugging
      const similarPages = data.pages.filter((page) => {
        const pagePath = page.relPermalink.endsWith("/") && page.relPermalink !== "/"
          ? page.relPermalink.slice(0, -1)
          : page.relPermalink;
        const currentPathNormalized = currentPath.endsWith("/") && currentPath !== "/"
          ? currentPath.slice(0, -1)
          : currentPath;
        return pagePath.includes(currentPathNormalized) || currentPathNormalized.includes(pagePath);
      });
      
      if (similarPages.length > 0) {
        console.warn("Dev Score Bubble: No exact match found. Similar pages:", similarPages.map(p => p.relPermalink));
      } else {
        console.warn("Dev Score Bubble: No matching page found for:", currentPath);
        console.warn("Dev Score Bubble: Available pages (first 10):", data.pages.slice(0, 10).map(p => p.relPermalink));
      }
    }

    return currentPage || null;
  } catch (error) {
    console.warn("Dev Score Bubble: Error fetching page data", error);
    return null;
  }
}

/**
 * Initialize the dev score bubble (only in dev mode)
 */
export function initDevScoreBubble(): void {
  // Only run in dev/localhost
  if (!isLocalhost()) {
    return;
  }

  // Skip on page-list pages (they're dev tools, not content pages)
  const currentPath = window.location.pathname;
  if (currentPath.startsWith('/page-list/')) {
    return;
  }

  // Check if user has hidden the bubble in this session
  if (sessionStorage.getItem("dev-score-bubble-hidden") === "true") {
    return;
  }

  onDOMReady(async () => {
    // Small delay to ensure page is fully loaded
    setTimeout(async () => {
      const pageData = await fetchPageData();
      if (pageData) {
        createBubble(pageData);
      }
    }, 500);
  });
}