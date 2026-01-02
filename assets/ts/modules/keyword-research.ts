/**
 * Keyword Research Module (DEV-ONLY)
 * ============================================================================
 * Provides keyword research and analysis tools for content optimization.
 * Features:
 * - Keyword extraction from content
 * - Keyword density analysis
 * - Related keyword suggestions
 * - Long-tail keyword generation
 * - Keyword gap analysis
 * - Content optimization suggestions
 * - External Canadian keyword dataset integration
 * - Live seed keyword search
 * ============================================================================
 */

import { isLocalhost } from "../utils/dom";
import { showToast, escapeHtml } from "../utils/dev-ui";

/**
 * External keyword data from Canadian keyword dataset
 */
interface ExternalKeyword {
  keyword: string;
  volume: number;
  cpc: number;
  competition: number;
  intent?: 'informational' | 'navigational' | 'commercial' | 'transactional';
}

/**
 * Enhanced keyword data with external metrics
 */
interface KeywordData {
  keyword: string;
  frequency: number;
  density: number; // Percentage
  positions: number[]; // Line numbers where keyword appears
  context: string[]; // Surrounding text snippets
  volume?: number; // Search volume from external dataset
  cpc?: number; // Cost per click
  competition?: number; // Competition level (0-1)
  intent?: string; // Search intent
}

/**
 * Keyword analysis results
 */
interface KeywordRecommendation {
  text: string;
  type: 'error' | 'warning' | 'info' | 'success';
}

interface KeywordAnalysis {
  primaryKeywords: KeywordData[];
  secondaryKeywords: KeywordData[];
  longTailKeywords: string[];
  keywordDensity: number;
  keywordRichness: number; // Unique keywords / total words
  recommendations: KeywordRecommendation[];
}

/**
 * Page keyword data for gap analysis
 */
interface PageKeywordData {
  pageUrl: string;
  pageTitle: string;
  keywords: KeywordData[];
  topKeywords: string[];
}

/**
 * Gap analysis results with opportunity scores
 */
interface GapAnalysisResult {
  missingKeywords: string[];
  opportunities: Array<{
    keyword: string;
    usedBy: number;
    pages: string[];
    opportunityScore?: number;
    volume?: number;
    competition?: number;
  }>;
}

// Global external keywords dataset (loaded once, cached)
let externalKeywords: ExternalKeyword[] = [];
let externalKeywordsLoaded = false;
let externalKeywordsLoading = false;

/**
 * Canadian keyword modifiers for generating variants
 */
const PREFIXES = [
  'best', 'top 10', 'top', 'cheap', 'affordable', 'budget', 'how to', 'guide to',
  'review', 'canada', 'canadian', 'toronto', 'ontario', '2025', '2024', 'near me',
  'vs', 'versus', 'compare', 'difference between', 'what is', 'why', 'when', 'where',
  'free', 'discount', 'sale', 'deals', 'professional', 'expert', 'certified'
];

const SUFFIXES = [
  'canada', 'canadian', 'toronto', 'ontario', 'near me', '2025', '2024', 'review',
  'guide', 'tips', 'tricks', 'hacks', 'cost', 'price', 'service', 'repair',
  'installation', 'maintenance', 'replacement', 'vs', 'comparison', 'alternatives'
];

/**
 * Load external Canadian keyword dataset from static JSON file
 * @returns Promise that resolves when keywords are loaded
 */
async function loadExternalKeywords(): Promise<void> {
  if (externalKeywordsLoaded || externalKeywordsLoading) {
    return;
  }

  externalKeywordsLoading = true;

  try {
    // Try .json first, then .json.gz
    let response = await fetch('/data/keywords-canada.json');
    
    if (!response.ok) {
      // Try compressed version
      response = await fetch('/data/keywords-canada.json.gz');
    }

    if (!response.ok) {
      console.warn('External keyword dataset not found. Continuing without external data.');
      externalKeywordsLoaded = true;
      externalKeywordsLoading = false;
      return;
    }

    const data = await response.json();
    
    if (Array.isArray(data)) {
      externalKeywords = data;
    } else if (data.keywords && Array.isArray(data.keywords)) {
      externalKeywords = data.keywords;
    } else {
      throw new Error('Invalid keyword dataset format');
    }

    externalKeywordsLoaded = true;
    console.log(`Loaded ${externalKeywords.length} external keywords from Canadian dataset`);
  } catch (error) {
    console.error('Error loading external keywords:', error);
    showToast('Could not load external keyword dataset. Some features may be limited.', 'info', 5000, 'dev');
    externalKeywords = [];
  } finally {
    externalKeywordsLoading = false;
  }
}

/**
 * Search external keywords by seed keyword
 * @param seed - Seed keyword to search for
 * @param options - Search options (minVolume, maxCompetition, limit)
 * @returns Array of matching external keywords sorted by volume
 */
function searchKeywords(
  seed: string,
  options?: { minVolume?: number; maxCompetition?: number; limit?: number }
): ExternalKeyword[] {
  const {
    minVolume = 0,
    maxCompetition = 1,
    limit = 50
  } = options ?? {};

  const seedLower = seed.toLowerCase().trim();
  if (!seedLower) {
    return [];
  }

  const matches = externalKeywords.filter(kw => {
    const keywordLower = kw.keyword.toLowerCase();
    return (
      keywordLower.includes(seedLower) &&
      kw.volume >= minVolume &&
      kw.competition <= maxCompetition
    );
  });

  // Sort by volume descending
  matches.sort((a, b) => b.volume - a.volume);

  return matches.slice(0, limit);
}

/**
 * Generate alphabet soup variants (a-z combinations)
 * @param seed - Seed keyword
 * @returns Array of alphabet soup variants
 */
function generateAlphabetSoup(seed: string): string[] {
  const variants: string[] = [];
  const seedLower = seed.toLowerCase().trim();
  const words = seedLower.split(/\s+/);

  // Generate variants with alphabet prefixes/suffixes
  const alphabet = 'abcdefghijklmnopqrstuvwxyz';
  
  // Single letter prefixes
  for (let i = 0; i < Math.min(5, alphabet.length); i++) {
    variants.push(`${alphabet[i]} ${seedLower}`);
    variants.push(`${seedLower} ${alphabet[i]}`);
  }

  // Common letter combinations
  const commonLetters = ['a', 'b', 'c', 'x', 'z'];
  commonLetters.forEach(letter => {
    variants.push(`${letter}${seedLower}`);
    variants.push(`${seedLower}${letter}`);
  });

  return variants;
}

/**
 * Generate long-tail keyword variants using prefixes and suffixes
 * @param seed - Seed keyword
 * @returns Array of long-tail variants
 */
function generateLongTailVariants(seed: string): string[] {
  const variants: Set<string> = new Set();
  const seedLower = seed.toLowerCase().trim();

  // Add prefix combinations
  PREFIXES.forEach(prefix => {
    variants.add(`${prefix} ${seedLower}`);
    variants.add(`${seedLower} ${prefix}`);
  });

  // Add suffix combinations
  SUFFIXES.forEach(suffix => {
    variants.add(`${seedLower} ${suffix}`);
    variants.add(`${suffix} ${seedLower}`);
  });

  // Add prefix + suffix combinations
  PREFIXES.slice(0, 5).forEach(prefix => {
    SUFFIXES.slice(0, 5).forEach(suffix => {
      variants.add(`${prefix} ${seedLower} ${suffix}`);
    });
  });

  // Word order swaps (for 2+ word keywords)
  const words = seedLower.split(/\s+/);
  if (words.length >= 2) {
    // Swap first two words
    const swapped = [words[1], words[0], ...words.slice(2)].join(' ');
    variants.add(swapped);
    
    // Reverse all words
    if (words.length === 2) {
      variants.add(words.reverse().join(' '));
    }
  }

  return Array.from(variants);
}

/**
 * Extract keywords from text content
 * @param text - Text content to analyze
 * @param minLength - Minimum keyword length
 * @param stopWords - Additional stop words to exclude
 * @returns Map of keywords to their data
 */
function extractKeywords(text: string, minLength: number = 3, stopWords: Set<string> = new Set()): Map<string, KeywordData> {
  // Common English stop words with Canadian variants
  const defaultStopWords = new Set([
    'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from',
    'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the',
    'to', 'was', 'will', 'with', 'the', 'this', 'but', 'they', 'have',
    'had', 'what', 'said', 'each', 'which', 'their', 'time', 'if', 'up',
    'out', 'many', 'then', 'them', 'these', 'so', 'some', 'her', 'would',
    'make', 'like', 'into', 'him', 'has', 'two', 'more', 'very', 'after',
    'words', 'long', 'than', 'first', 'been', 'call', 'who', 'oil', 'sit',
    'now', 'find', 'down', 'day', 'did', 'get', 'come', 'made', 'may', 'part',
    // Canadian spelling variants
    'colour', 'colours', 'favourite', 'favourites', 'centre', 'centres',
    'organise', 'organised', 'organising', 'realise', 'realised', 'realising'
  ]);
  
  const allStopWords = new Set([...defaultStopWords, ...stopWords]);
  
  // Normalize text: lowercase, remove punctuation, split into words
  // Note: If external dataset uses US spelling, map Canadian to US here
  // For now, we keep both variants
  const normalized = text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  const words = normalized.split(/\s+/);
  const keywordMap = new Map<string, KeywordData>();
  
  words.forEach((word, index) => {
    // Skip stop words and short words
    if (word.length < minLength || allStopWords.has(word)) {
      return;
    }
    
    // Count single words
    let keywordData = keywordMap.get(word);
    if (!keywordData) {
      keywordData = {
        keyword: word,
        frequency: 0,
        density: 0,
        positions: [],
        context: []
      };
      keywordMap.set(word, keywordData);
    }
    keywordData.frequency++;
    keywordData.positions.push(index);
    
    // Extract context (surrounding words)
    const start = Math.max(0, index - 3);
    const end = Math.min(words.length, index + 4);
    const contextWords = words.slice(start, end);
    keywordData.context.push(contextWords.join(' '));
    
    // Count 2-word phrases
    if (index < words.length - 1) {
      const nextWord = words[index + 1];
      if (nextWord.length >= minLength && !allStopWords.has(nextWord)) {
        const phrase = `${word} ${nextWord}`;
        let phraseData = keywordMap.get(phrase);
        if (!phraseData) {
          phraseData = {
            keyword: phrase,
            frequency: 0,
            density: 0,
            positions: [],
            context: []
          };
          keywordMap.set(phrase, phraseData);
        }
        phraseData.frequency++;
        phraseData.positions.push(index);
        phraseData.context.push(contextWords.join(' '));
      }
    }
    
    // Count 3-word phrases (long-tail)
    if (index < words.length - 2) {
      const nextWord = words[index + 1];
      const nextNextWord = words[index + 2];
      if (nextWord.length >= minLength && nextNextWord.length >= minLength &&
          !allStopWords.has(nextWord) && !allStopWords.has(nextNextWord)) {
        const phrase = `${word} ${nextWord} ${nextNextWord}`;
        let phraseData = keywordMap.get(phrase);
        if (!phraseData) {
          phraseData = {
            keyword: phrase,
            frequency: 0,
            density: 0,
            positions: [],
            context: []
          };
          keywordMap.set(phrase, phraseData);
        }
        phraseData.frequency++;
        phraseData.positions.push(index);
        phraseData.context.push(contextWords.join(' '));
      }
    }
  });
  
  // Calculate density
  const totalWords = words.length;
  keywordMap.forEach((data) => {
    data.density = (data.frequency / totalWords) * 100;
  });
  
  return keywordMap;
}

/**
 * Enrich keyword data with external dataset metrics
 * @param keywordMap - Map of keywords to enrich
 */
/**
 * Enrich keyword data with external dataset metrics
 * @param keywordMap - Map of keywords to enrich
 */
function enrichKeywordsWithExternalData(keywordMap: Map<string, KeywordData>): void {
  if (externalKeywords.length === 0) {
    return;
  }

  keywordMap.forEach((data) => {
    // Find case-insensitive match (both exact and case-insensitive are the same check)
    const match = externalKeywords.find(
      ek => ek.keyword.toLowerCase() === data.keyword.toLowerCase()
    );

    if (match) {
      data.volume = match.volume;
      data.cpc = match.cpc;
      data.competition = match.competition;
      data.intent = match.intent;
    }
  });
}

/**
 * Analyze keywords from page content
 * @param content - Page content text
 * @param title - Page title
 * @param description - Meta description
 * @returns Keyword analysis results
 */
function analyzeKeywords(content: string, title: string, description: string): KeywordAnalysis {
  // Combine all text sources
  const fullText = `${title} ${description} ${content}`.toLowerCase();
  
  // Extract keywords
  const keywordMap = extractKeywords(fullText);
  
  // Enrich with external data
  enrichKeywordsWithExternalData(keywordMap);
  
  // Sort by frequency
  const sortedKeywords = Array.from(keywordMap.values())
    .sort((a, b) => b.frequency - a.frequency);
  
  // Separate primary (high frequency) and secondary keywords
  const primaryKeywords = sortedKeywords
    .filter(k => k.frequency >= 3 && k.density >= 0.5)
    .slice(0, 20);
  
  const secondaryKeywords = sortedKeywords
    .filter(k => k.frequency >= 2 && k.density >= 0.2 && !primaryKeywords.includes(k))
    .slice(0, 30);
  
  // Generate long-tail keywords (3+ word phrases)
  const longTailKeywords = sortedKeywords
    .filter(k => k.keyword.split(' ').length >= 3)
    .map(k => k.keyword)
    .slice(0, 15);
  
  // Calculate overall metrics
  const totalWords = fullText.split(/\s+/).length;
  const uniqueKeywords = keywordMap.size;
  const keywordRichness = (uniqueKeywords / totalWords) * 100;
  const avgDensity = primaryKeywords.length > 0
    ? primaryKeywords.reduce((sum, k) => sum + k.density, 0) / primaryKeywords.length
    : 0;
  
  // Generate recommendations with color coding
  const recommendations: KeywordRecommendation[] = [];
  
  if (primaryKeywords.length === 0) {
    recommendations.push({
      text: 'No primary keywords found. Consider adding more relevant keywords to your content.',
      type: 'error'
    });
  }
  
  // Primary keyword density recommendations
  const primary = primaryKeywords[0];
  if (primary) {
    if (primary.density < 0.8) {
      recommendations.push({
        text: `Top primary keyword "${primary.keyword}" density too low (${primary.density.toFixed(2)}%). Aim for 1.1–1.9%.`,
        type: 'warning'
      });
    } else if (primary.density > 2.2) {
      recommendations.push({
        text: `Top primary keyword "${primary.keyword}" density too high (${primary.density.toFixed(2)}%). Reduce naturally to avoid penalties.`,
        type: 'error'
      });
    } else if (primary.density >= 1.1 && primary.density <= 1.9) {
      recommendations.push({
        text: `Top primary keyword "${primary.keyword}" density is optimal (${primary.density.toFixed(2)}%)`,
        type: 'success'
      });
    }
  }
  
  // Keyword richness recommendations
  if (keywordRichness < 6.5) {
    recommendations.push({
      text: `Keyword richness low (${keywordRichness.toFixed(1)}%). Add synonyms, LSI terms, and related phrases to reach 9–12%.`,
      type: 'warning'
    });
  } else if (keywordRichness >= 9) {
    recommendations.push({
      text: `Excellent keyword richness (${keywordRichness.toFixed(1)}%) – strong topical authority signal!`,
      type: 'success'
    });
  } else if (keywordRichness >= 6.5 && keywordRichness < 9) {
    recommendations.push({
      text: `Keyword richness is good (${keywordRichness.toFixed(1)}%). Consider adding more related terms to reach 9–12% for optimal topical authority.`,
      type: 'info'
    });
  }
  
  if (avgDensity > 3) {
    recommendations.push({
      text: 'Overall keyword density may be too high. Aim for 1-2% for primary keywords to avoid over-optimization.',
      type: 'warning'
    });
  }
  
  if (longTailKeywords.length < 5) {
    recommendations.push({
      text: 'Consider adding more long-tail keywords (3+ word phrases) for better targeting.',
      type: 'info'
    });
  }
  
  return {
    primaryKeywords,
    secondaryKeywords,
    longTailKeywords,
    keywordDensity: avgDensity,
    keywordRichness,
    recommendations
  };
}

/**
 * Generate related keyword suggestions using multiple strategies
 * @param seedKeyword - Seed keyword to generate variants for
 * @param allPages - Array of all page data
 * @returns Array of related keywords (max 30)
 */
function generateRelatedKeywords(seedKeyword: string, allPages: any[]): string[] {
  const related: Set<string> = new Set();
  const seedLower = seedKeyword.toLowerCase().trim();
  
  // Strategy 1: Find pages with similar keywords
  allPages.forEach(page => {
    const pageText = `${page.title ?? ''} ${page.metaDescription ?? ''} ${page.summary ?? ''}`.toLowerCase();
    
    // Extract keywords from similar pages
    const keywords = extractKeywords(pageText);
    keywords.forEach((data, keyword) => {
      // Check if keyword is related (contains seed or seed contains keyword)
      if (keyword.includes(seedLower) || seedLower.includes(keyword) || 
          keyword.split(' ').some(word => seedLower.includes(word))) {
        related.add(keyword);
      }
    });
  });
  
  // Strategy 2: Alphabet soup variants
  const alphabetSoup = generateAlphabetSoup(seedKeyword);
  alphabetSoup.forEach(variant => related.add(variant));
  
  // Strategy 3: Long-tail variants with prefixes/suffixes
  const longTailVariants = generateLongTailVariants(seedKeyword);
  longTailVariants.forEach(variant => related.add(variant));
  
  // Strategy 4: Word order swaps
  const words = seedLower.split(/\s+/);
  if (words.length >= 2) {
    // Try different word orders
    for (let i = 0; i < words.length; i++) {
      for (let j = i + 1; j < words.length; j++) {
        const swapped = [...words];
        [swapped[i], swapped[j]] = [swapped[j], swapped[i]];
        related.add(swapped.join(' '));
      }
    }
  }
  
  // Strategy 5: External keyword matches
  if (externalKeywords.length > 0) {
    const externalMatches = searchKeywords(seedKeyword, { limit: 10 });
    externalMatches.forEach(match => related.add(match.keyword));
  }
  
  return Array.from(related).slice(0, 30);
}

/**
 * Analyze keywords from page metadata (title, description, summary)
 * @param page - Page data with title, metaDescription, summary
 * @returns PageKeywordData with extracted keywords
 */
function analyzePageKeywords(page: { title: string; metaDescription?: string; summary?: string; relPermalink: string }): PageKeywordData {
  const pageText = `${page.title} ${page.metaDescription ?? ''} ${page.summary ?? ''}`.toLowerCase();
  const keywordMap = extractKeywords(pageText);
  
  // Enrich with external data
  enrichKeywordsWithExternalData(keywordMap);
  
  // Get top keywords sorted by frequency
  const sortedKeywords = Array.from(keywordMap.values())
    .sort((a, b) => b.frequency - a.frequency);
  
  const primaryKeywords = sortedKeywords
    .filter(k => k.frequency >= 2)
    .slice(0, 30);
  
  return {
    pageUrl: page.relPermalink,
    pageTitle: page.title,
    keywords: primaryKeywords,
    topKeywords: primaryKeywords.map(k => k.keyword)
  };
}

/**
 * Compare keywords across pages (gap analysis) with opportunity scoring
 * @param currentPage - Current page keyword data
 * @param allPages - All pages keyword data (will be analyzed if not already)
 * @returns Gap analysis with opportunity scores
 */
function analyzeKeywordGaps(currentPage: PageKeywordData, allPages: PageKeywordData[]): GapAnalysisResult {
  const currentKeywords = new Set(currentPage.topKeywords.map(k => k.toLowerCase()));
  const allKeywords = new Map<string, { count: number; pages: string[]; avgVolume?: number; avgCompetition?: number }>();
  
  // Collect all keywords from other pages
  allPages.forEach(page => {
    if (page.pageUrl !== currentPage.pageUrl && page.topKeywords.length > 0) {
      page.topKeywords.forEach(keyword => {
        const key = keyword.toLowerCase();
        let data = allKeywords.get(key);
        if (!data) {
          data = { count: 0, pages: [] };
          allKeywords.set(key, data);
        }
        data.count++;
        data.pages.push(page.pageTitle);
        
        // Collect volume and competition data if available
        const keywordData = page.keywords.find(k => k.keyword.toLowerCase() === key);
        if (keywordData) {
          if (keywordData.volume !== undefined) {
            const currentAvg = data.avgVolume ?? 0;
            data.avgVolume = (currentAvg * (data.count - 1) + keywordData.volume) / data.count;
          }
          if (keywordData.competition !== undefined) {
            const currentAvg = data.avgCompetition ?? 0;
            data.avgCompetition = (currentAvg * (data.count - 1) + keywordData.competition) / data.count;
          }
        }
      });
    }
  });
  
  // Find keywords used by others but not in current page
  const missingKeywords: string[] = [];
  const opportunities: Array<{ keyword: string; usedBy: number; pages: string[]; opportunityScore?: number; volume?: number; competition?: number }> = [];
  
  allKeywords.forEach((data, keyword) => {
    if (!currentKeywords.has(keyword) && data.count >= 2) {
      missingKeywords.push(keyword);
      
      // Calculate opportunity score
      let opportunityScore = data.count; // Base score = usage count
      
      // Enhance with external data if available
      if (externalKeywords.length > 0) {
        const externalMatch = externalKeywords.find(
          ek => ek.keyword.toLowerCase() === keyword.toLowerCase()
        );
        
        if (externalMatch) {
          // Opportunity score = usedBy × volume × (1 - competition)
          // Higher volume + lower competition = higher opportunity
          const volumeWeight = Math.log10(externalMatch.volume + 1) / 10; // Normalize volume
          opportunityScore = data.count * volumeWeight * (1 - externalMatch.competition);
        } else if (data.avgVolume !== undefined && data.avgCompetition !== undefined) {
          // Use average from pages if external data not available
          const volumeWeight = Math.log10(data.avgVolume + 1) / 10;
          opportunityScore = data.count * volumeWeight * (1 - data.avgCompetition);
        }
      } else if (data.avgVolume !== undefined && data.avgCompetition !== undefined) {
        // Use average from pages if external data not available
        const volumeWeight = Math.log10(data.avgVolume + 1) / 10;
        opportunityScore = data.count * volumeWeight * (1 - data.avgCompetition);
      }
      
      // Get volume and competition from external or page data
      let volume: number | undefined;
      let competition: number | undefined;
      
      if (externalKeywords.length > 0) {
        const externalMatch = externalKeywords.find(
          ek => ek.keyword.toLowerCase() === keyword.toLowerCase()
        );
        if (externalMatch) {
          volume = externalMatch.volume;
          competition = externalMatch.competition;
        }
      }
      
      if (volume === undefined && data.avgVolume !== undefined) {
        volume = Math.round(data.avgVolume);
      }
      if (competition === undefined && data.avgCompetition !== undefined) {
        competition = data.avgCompetition;
      }
      
      opportunities.push({
        keyword,
        usedBy: data.count,
        pages: data.pages.slice(0, 5),
        opportunityScore,
        volume,
        competition
      });
    }
  });
  
  // Sort by opportunity score (or usedBy if no score)
  opportunities.sort((a, b) => {
    const scoreA = a.opportunityScore ?? a.usedBy;
    const scoreB = b.opportunityScore ?? b.usedBy;
    return scoreB - scoreA;
  });
  
  return {
    missingKeywords: missingKeywords.slice(0, 20),
    opportunities: opportunities.slice(0, 15)
  };
}

/**
 * Get CSS class for keyword density based on value
 * @param density - Keyword density percentage
 * @returns CSS class name for density state
 */
function getDensityClass(density: number): string {
  if (density < 0.8) {
    return 'dev-keyword-research-keyword-density--low';
  } else if (density >= 1.1 && density <= 1.9) {
    return 'dev-keyword-research-keyword-density--optimal';
  } else if (density > 2.2) {
    return 'dev-keyword-research-keyword-density--high';
  } else {
    return 'dev-keyword-research-keyword-density--ok';
  }
}

/**
 * Render keyword research modal with seed search panel
 * @param analysis - Keyword analysis results
 * @param pageTitle - Page title
 * @param pageUrl - Page URL
 * @param gapAnalysis - Optional gap analysis results
 * @returns HTML string for modal
 */
function renderKeywordResearchModal(
  analysis: KeywordAnalysis, 
  pageTitle: string, 
  pageUrl: string,
  gapAnalysis?: GapAnalysisResult,
  competitorKeywords?: Array<{ url: string; keywords: KeywordAnalysis }>
): string {
  const prefix = 'dev';
  
  return `
    <div class="dev-score-bubble-modal" id="dev-keyword-research-modal" role="dialog" aria-labelledby="dev-keyword-research-title" aria-modal="true">
      <div class="dev-score-bubble-modal-overlay" aria-hidden="true"></div>
      <div class="dev-score-bubble-modal-content dev-score-bubble-modal-content--large">
        <div class="dev-score-bubble-modal-header">
          <div class="dev-score-bubble-modal-header-icon dev-score-bubble-modal-header-icon--info">
            <span class="material-symbols-outlined" aria-hidden="true">search</span>
          </div>
          <h2 class="dev-score-bubble-modal-title" id="dev-keyword-research-title">Keyword Research</h2>
          <button class="dev-score-bubble-modal-close" aria-label="Close dialog" type="button">×</button>
        </div>
        <div class="dev-score-bubble-modal-body">
          <div class="dev-keyword-research-page-info">
            <h3>${escapeHtml(pageTitle)}</h3>
            <code>${escapeHtml(pageUrl)}</code>
          </div>
          
          <div class="dev-keyword-research-section">
            <h3 class="dev-keyword-research-section-title">External Keyword Research (Canada)</h3>
            <div class="dev-keyword-research-search-container">
              <input 
                id="dev-seed-input" 
                type="text" 
                placeholder="Enter seed keyword…" 
                class="dev-keyword-research-search-input"
                aria-label="Seed keyword input"
              >
              <button 
                id="dev-seed-search" 
                type="button"
                class="dev-score-bubble-modal-button dev-score-bubble-modal-button--primary dev-keyword-research-search-button"
                aria-label="Search keywords"
              >
                <span class="material-symbols-outlined" aria-hidden="true">search</span>
                Search
              </button>
            </div>
            <div id="dev-seed-results" class="dev-keyword-research-results-container"></div>
          </div>
          
          <div class="dev-keyword-research-metrics">
            <div class="dev-keyword-research-metric">
              <span class="dev-keyword-research-metric-label">Avg Keyword Density</span>
              <span class="dev-keyword-research-metric-value">${analysis.keywordDensity.toFixed(2)}%</span>
            </div>
            <div class="dev-keyword-research-metric">
              <span class="dev-keyword-research-metric-label">Keyword Richness</span>
              <span class="dev-keyword-research-metric-value">${analysis.keywordRichness.toFixed(1)}%</span>
            </div>
            <div class="dev-keyword-research-metric">
              <span class="dev-keyword-research-metric-label">Primary Keywords</span>
              <span class="dev-keyword-research-metric-value">${analysis.primaryKeywords.length}</span>
            </div>
            <div class="dev-keyword-research-metric">
              <span class="dev-keyword-research-metric-label">Long-Tail Keywords</span>
              <span class="dev-keyword-research-metric-value">${analysis.longTailKeywords.length}</span>
            </div>
            ${analysis.recommendations.length > 0 ? `
            <div class="dev-keyword-research-metric dev-keyword-research-metric--recommendations dev-keyword-research-metric--full-width">
              <span class="dev-keyword-research-metric-label">Recommendations</span>
              <ul class="dev-keyword-research-recommendations">
                ${analysis.recommendations.map(rec => `
                  <li class="dev-keyword-research-recommendation dev-keyword-research-recommendation--${rec.type}">
                    ${escapeHtml(rec.text)}
                  </li>
                `).join('')}
              </ul>
            </div>
            ` : ''}
          </div>
          
          ${analysis.primaryKeywords.length > 0 ? `
          <div class="dev-keyword-research-section">
            <h3 class="dev-keyword-research-section-title">
              <span class="material-symbols-outlined" aria-hidden="true">star</span>
              Primary Keywords
            </h3>
            <div class="dev-keyword-research-keywords">
              ${analysis.primaryKeywords.map(k => `
                <div class="dev-keyword-research-keyword">
                  <span class="dev-keyword-research-keyword-text">${escapeHtml(k.keyword)}</span>
                  <div class="dev-keyword-research-keyword-stats">
                    <span class="dev-keyword-research-keyword-frequency">${k.frequency}x</span>
                    <span class="dev-keyword-research-keyword-density ${getDensityClass(k.density)}">${k.density.toFixed(2)}%</span>
                    ${k.volume !== undefined ? `<span class="dev-keyword-research-keyword-volume" title="Search volume">${k.volume.toLocaleString()}</span>` : ''}
                    ${k.competition !== undefined ? `<span class="dev-keyword-research-keyword-competition" title="Competition">${(k.competition * 100).toFixed(0)}%</span>` : ''}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
          ` : ''}
          
          ${analysis.secondaryKeywords.length > 0 ? `
          <div class="dev-keyword-research-section">
            <h3 class="dev-keyword-research-section-title">
              <span class="material-symbols-outlined" aria-hidden="true">label</span>
              Secondary Keywords
            </h3>
            <div class="dev-keyword-research-keywords">
              ${analysis.secondaryKeywords.map(k => `
                <div class="dev-keyword-research-keyword">
                  <span class="dev-keyword-research-keyword-text">${escapeHtml(k.keyword)}</span>
                  <div class="dev-keyword-research-keyword-stats">
                    <span class="dev-keyword-research-keyword-frequency">${k.frequency}x</span>
                    <span class="dev-keyword-research-keyword-density ${getDensityClass(k.density)}">${k.density.toFixed(2)}%</span>
                    ${k.volume !== undefined ? `<span class="dev-keyword-research-keyword-volume" title="Search volume">${k.volume.toLocaleString()}</span>` : ''}
                    ${k.competition !== undefined ? `<span class="dev-keyword-research-keyword-competition" title="Competition">${(k.competition * 100).toFixed(0)}%</span>` : ''}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
          ` : ''}
          
          ${analysis.longTailKeywords.length > 0 ? `
          <div class="dev-keyword-research-section">
            <h3 class="dev-keyword-research-section-title">
              <span class="material-symbols-outlined" aria-hidden="true">auto_awesome</span>
              Long-Tail Keywords
            </h3>
            <div class="dev-keyword-research-keywords">
              ${analysis.longTailKeywords.map(keyword => `
                <div class="dev-keyword-research-keyword">
                  <span class="dev-keyword-research-keyword-text">${escapeHtml(keyword)}</span>
                </div>
              `).join('')}
            </div>
          </div>
          ` : ''}
          
          ${gapAnalysis && gapAnalysis.opportunities.length > 0 ? `
          <div class="dev-keyword-research-section">
            <h3 class="dev-keyword-research-section-title">
              <span class="material-symbols-outlined" aria-hidden="true">trending_up</span>
              Keyword Opportunities
            </h3>
            <p class="dev-keyword-research-section-description">
              Keywords used by other pages that you might want to consider:
            </p>
            <div class="dev-keyword-research-keywords">
              ${gapAnalysis.opportunities.slice(0, 10).map(opp => `
                <div class="dev-keyword-research-keyword dev-keyword-research-keyword--opportunity">
                  <span class="dev-keyword-research-keyword-text">${escapeHtml(opp.keyword)}</span>
                  <div class="dev-keyword-research-keyword-stats">
                    <span class="dev-keyword-research-keyword-frequency">Used by ${opp.usedBy} page${opp.usedBy !== 1 ? 's' : ''}</span>
                    ${opp.volume !== undefined ? `<span class="dev-keyword-research-keyword-volume" title="Search volume">${opp.volume.toLocaleString()}</span>` : ''}
                    ${opp.competition !== undefined ? `<span class="dev-keyword-research-keyword-competition" title="Competition">${(opp.competition * 100).toFixed(0)}%</span>` : ''}
                    ${opp.opportunityScore !== undefined ? `<span class="dev-keyword-research-keyword-opportunity-score" title="Opportunity score">Score: ${opp.opportunityScore.toFixed(1)}</span>` : ''}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
          ` : ''}
          
          ${competitorKeywords && competitorKeywords.length > 0 ? `
          <div class="dev-keyword-research-section">
            <h3 class="dev-keyword-research-section-title">
              <span class="material-symbols-outlined" aria-hidden="true">business</span>
              Competitor Keywords
            </h3>
            <p class="dev-keyword-research-section-description">
              Keywords found on competitor pages:
            </p>
            ${competitorKeywords.map(comp => {
              const primaryKeywords = comp.keywords?.primaryKeywords || [];
              const secondaryKeywords = comp.keywords?.secondaryKeywords || [];
              const allKeywords = [...primaryKeywords, ...secondaryKeywords].slice(0, 20);
              
              if (allKeywords.length === 0) return '';
              
              return `
                <div class="dev-keyword-research-competitor">
                  <h4 class="dev-keyword-research-competitor-url">${escapeHtml(comp.url)}</h4>
                  <div class="dev-keyword-research-keywords">
                    ${allKeywords.map(k => {
                      const keywordId = `${comp.url}:${k.keyword}`.replace(/[^a-zA-Z0-9:]/g, '_');
                      return `
                      <div class="dev-keyword-research-keyword" data-competitor-keyword-id="${keywordId}">
                        <span class="dev-keyword-research-keyword-text">${escapeHtml(k.keyword)}</span>
                        <div class="dev-keyword-research-keyword-stats">
                          <span class="dev-keyword-research-keyword-frequency">${k.frequency}x</span>
                          <span class="dev-keyword-research-keyword-density ${getDensityClass(k.density)}">${k.density.toFixed(2)}%</span>
                          ${k.volume !== undefined ? `<span class="dev-keyword-research-keyword-volume" title="Search volume">${k.volume.toLocaleString()}</span>` : ''}
                          ${k.competition !== undefined ? `<span class="dev-keyword-research-keyword-competition" title="Competition">${(k.competition * 100).toFixed(0)}%</span>` : ''}
                          <button 
                            class="dev-keyword-research-remove-btn" 
                            data-competitor-keyword-id="${keywordId}"
                            type="button"
                            aria-label="Remove keyword"
                            title="Remove this keyword"
                          >
                            <span class="material-symbols-outlined" aria-hidden="true">close</span>
                          </button>
                        </div>
                      </div>
                    `;
                    }).join('')}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
          ` : ''}
        </div>
        <div class="dev-score-bubble-modal-actions">
          <div class="dev-keyword-research-export-buttons">
            <button class="dev-score-bubble-modal-button dev-score-bubble-modal-button--secondary" id="dev-keyword-research-export-page-csv" type="button" title="Export current page keywords as CSV">
              <span class="material-symbols-outlined" aria-hidden="true">download</span>
              Export Page (CSV)
            </button>
            <button class="dev-score-bubble-modal-button dev-score-bubble-modal-button--secondary" id="dev-keyword-research-export-page-json" type="button" title="Export current page keywords as JSON">
              <span class="material-symbols-outlined" aria-hidden="true">download</span>
              Export Page (JSON)
            </button>
            <button class="dev-score-bubble-modal-button dev-score-bubble-modal-button--secondary" id="dev-keyword-research-export-site-csv" type="button" title="Export all site keywords as CSV" style="display: none;">
              <span class="material-symbols-outlined" aria-hidden="true">download</span>
              Export All Site (CSV)
            </button>
            <button class="dev-score-bubble-modal-button dev-score-bubble-modal-button--secondary" id="dev-keyword-research-export-site-json" type="button" title="Export all site keywords as JSON" style="display: none;">
              <span class="material-symbols-outlined" aria-hidden="true">download</span>
              Export All Site (JSON)
            </button>
          </div>
          <button class="dev-score-bubble-modal-button dev-score-bubble-modal-button--primary" id="dev-keyword-research-close" type="button">
            <span class="material-symbols-outlined" aria-hidden="true">check</span>
            Close
          </button>
        </div>
      </div>
    </div>
  `;
}

/**
 * Attach competitor keyword removal functionality to modal
 * @param modal - Modal element
 */
function attachCompetitorKeywordRemoval(modal: HTMLElement | null): void {
  if (!modal) return;

  const STORAGE_KEY = 'page-list-competitors';

  const removeButtons = modal.querySelectorAll('.dev-keyword-research-remove-btn');
  
  removeButtons.forEach(button => {
    button.addEventListener('click', () => {
      const keywordId = button.getAttribute('data-competitor-keyword-id');
      if (!keywordId) return;

      // Find the keyword element to get the actual keyword text and competitor URL
      const keywordElement = modal.querySelector(`[data-competitor-keyword-id="${keywordId}"]`);
      if (!keywordElement) return;

      // Get the keyword text from the element
      const keywordTextEl = keywordElement.querySelector('.dev-keyword-research-keyword-text');
      const keywordText = keywordTextEl?.textContent?.trim();
      
      // Get the competitor URL from the parent competitor section
      const competitorSection = keywordElement.closest('.dev-keyword-research-competitor');
      const competitorUrlEl = competitorSection?.querySelector('.dev-keyword-research-competitor-url');
      const competitorUrl = competitorUrlEl?.textContent?.trim();

      if (!keywordText || !competitorUrl) {
        showToast('Could not identify keyword to remove', 'error', 3000, 'dev');
        return;
      }

      // Update localStorage: remove the keyword from stored competitor data
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const competitors: Array<{ url: string; keywords: any }> = JSON.parse(stored);
          
          // Find the competitor and remove the keyword
          const competitorIndex = competitors.findIndex(c => c.url === competitorUrl);
          if (competitorIndex !== -1 && competitors[competitorIndex].keywords) {
            const competitor = competitors[competitorIndex];
            
            // Remove from primaryKeywords
            if (competitor.keywords.primaryKeywords) {
              competitor.keywords.primaryKeywords = competitor.keywords.primaryKeywords.filter(
                (k: KeywordData) => k.keyword !== keywordText
              );
            }
            
            // Remove from secondaryKeywords
            if (competitor.keywords.secondaryKeywords) {
              competitor.keywords.secondaryKeywords = competitor.keywords.secondaryKeywords.filter(
                (k: KeywordData) => k.keyword !== keywordText
              );
            }
            
            // Save updated data back to localStorage
            localStorage.setItem(STORAGE_KEY, JSON.stringify(competitors));
          }
        }
      } catch (error) {
        console.error('Error updating stored competitor keywords:', error);
        // Continue with UI removal even if storage update fails
      }

      // Add fade-out animation
      (keywordElement as HTMLElement).style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      (keywordElement as HTMLElement).style.opacity = '0';
      (keywordElement as HTMLElement).style.transform = 'scale(0.9)';
      
      // Remove after animation
      setTimeout(() => {
        keywordElement.remove();
        
        // Check if the competitor section is now empty
        if (competitorSection) {
          const remainingKeywords = competitorSection.querySelectorAll('.dev-keyword-research-keyword');
          if (remainingKeywords.length === 0) {
            // Hide the entire competitor section if no keywords remain
            (competitorSection as HTMLElement).style.transition = 'opacity 0.3s ease';
            (competitorSection as HTMLElement).style.opacity = '0';
            setTimeout(() => {
              competitorSection.remove();
              
              // Check if the entire competitor keywords section is now empty
              const allSections = modal.querySelectorAll('.dev-keyword-research-section');
              allSections.forEach(section => {
                const sectionTitle = section.querySelector('.dev-keyword-research-section-title');
                if (sectionTitle && sectionTitle.textContent?.includes('Competitor Keywords')) {
                  const allCompetitors = section.querySelectorAll('.dev-keyword-research-competitor');
                  if (allCompetitors.length === 0) {
                    section.remove();
                  }
                }
              });
            }, 300);
          }
        }
        
        showToast('Keyword removed', 'success', 2000, 'dev');
      }, 300);
    });
  });
}

/**
 * Export keyword data to CSV format
 * @param data - Array of keyword data objects
 * @param filename - Name for the downloaded file
 */
function exportKeywordsToCSV(data: KeywordData[], filename: string): void {
  if (data.length === 0) {
    showToast('No keywords to export', 'info', 3000, 'dev');
    return;
  }

  // CSV header
  const headers = ['Keyword', 'Frequency', 'Density (%)', 'Search Volume', 'CPC ($)', 'Competition (%)', 'Intent', 'Positions Count'];
  const rows = [headers.join(',')];

  // CSV rows
  data.forEach(kw => {
    const row = [
      `"${kw.keyword.replace(/"/g, '""')}"`, // Escape quotes in keyword
      kw.frequency.toString(),
      kw.density.toFixed(2),
      kw.volume?.toLocaleString() || '',
      kw.cpc?.toFixed(2) || '',
      kw.competition !== undefined ? (kw.competition * 100).toFixed(0) : '',
      kw.intent || '',
      kw.positions.length.toString()
    ];
    rows.push(row.join(','));
  });

  // Create blob and download
  const csvContent = rows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  showToast(`Exported ${data.length} keywords to ${filename}`, 'success', 3000, 'dev');
}

/**
 * Export keyword data to JSON format
 * @param data - Array of keyword data objects
 * @param filename - Name for the downloaded file
 */
function exportKeywordsToJSON(data: KeywordData[], filename: string): void {
  if (data.length === 0) {
    showToast('No keywords to export', 'info', 3000, 'dev');
    return;
  }

  // Prepare JSON data (remove context arrays if too large)
  const jsonData = data.map(kw => ({
    keyword: kw.keyword,
    frequency: kw.frequency,
    density: kw.density,
    volume: kw.volume,
    cpc: kw.cpc,
    competition: kw.competition,
    intent: kw.intent,
    positionsCount: kw.positions.length,
    // Include first few positions and contexts for reference
    firstPositions: kw.positions.slice(0, 5),
    sampleContexts: kw.context.slice(0, 3)
  }));

  // Create blob and download
  const jsonContent = JSON.stringify(jsonData, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  showToast(`Exported ${data.length} keywords to ${filename}`, 'success', 3000, 'dev');
}

/**
 * Export all site keywords grouped by page
 * @param allPageKeywords - Array of page keyword data
 * @param format - Export format ('csv' or 'json')
 */
function exportAllSiteKeywords(allPageKeywords: PageKeywordData[], format: 'csv' | 'json'): void {
  if (allPageKeywords.length === 0) {
    showToast('No page keywords to export', 'info', 3000, 'dev');
    return;
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const filename = `all-site-keywords-${timestamp}.${format}`;

  if (format === 'csv') {
    // CSV with page grouping
    const headers = ['Page URL', 'Page Title', 'Keyword', 'Frequency', 'Density (%)', 'Search Volume', 'CPC ($)', 'Competition (%)', 'Intent'];
    const rows = [headers.join(',')];

    allPageKeywords.forEach(page => {
      page.keywords.forEach(kw => {
        const row = [
          `"${page.pageUrl.replace(/"/g, '""')}"`,
          `"${page.pageTitle.replace(/"/g, '""')}"`,
          `"${kw.keyword.replace(/"/g, '""')}"`,
          kw.frequency.toString(),
          kw.density.toFixed(2),
          kw.volume?.toLocaleString() || '',
          kw.cpc?.toFixed(2) || '',
          kw.competition !== undefined ? (kw.competition * 100).toFixed(0) : '',
          kw.intent || ''
        ];
        rows.push(row.join(','));
      });
    });

    const csvContent = rows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    const totalKeywords = allPageKeywords.reduce((sum, page) => sum + page.keywords.length, 0);
    showToast(`Exported ${totalKeywords} keywords from ${allPageKeywords.length} pages to ${filename}`, 'success', 3000, 'dev');
  } else {
    // JSON format with page grouping
    const jsonData = allPageKeywords.map(page => ({
      pageUrl: page.pageUrl,
      pageTitle: page.pageTitle,
      keywords: page.keywords.map(kw => ({
        keyword: kw.keyword,
        frequency: kw.frequency,
        density: kw.density,
        volume: kw.volume,
        cpc: kw.cpc,
        competition: kw.competition,
        intent: kw.intent,
        positionsCount: kw.positions.length
      })),
      totalKeywords: page.keywords.length
    }));

    const jsonContent = JSON.stringify(jsonData, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    const totalKeywords = allPageKeywords.reduce((sum, page) => sum + page.keywords.length, 0);
    showToast(`Exported ${totalKeywords} keywords from ${allPageKeywords.length} pages to ${filename}`, 'success', 3000, 'dev');
  }
}

/**
 * Attach export functionality to modal
 * @param modal - Modal element
 * @param analysis - Keyword analysis results for current page
 * @param allPageKeywords - Optional array of all page keywords for site-wide export
 */
function attachExportHandlers(
  modal: HTMLElement | null,
  analysis: KeywordAnalysis,
  allPageKeywords?: PageKeywordData[]
): void {
  if (!modal) return;

  // Export current page - CSV
  const exportPageCsvBtn = modal.querySelector('#dev-keyword-research-export-page-csv') as HTMLButtonElement;
  if (exportPageCsvBtn) {
    exportPageCsvBtn.addEventListener('click', () => {
      const allKeywords = [...analysis.primaryKeywords, ...analysis.secondaryKeywords];
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const pageTitle = modal.querySelector('.dev-keyword-research-page-info h3')?.textContent || 'page';
      const safeTitle = pageTitle.replace(/[^a-z0-9]/gi, '-').toLowerCase();
      exportKeywordsToCSV(allKeywords, `keywords-${safeTitle}-${timestamp}.csv`);
    });
  }

  // Export current page - JSON
  const exportPageJsonBtn = modal.querySelector('#dev-keyword-research-export-page-json') as HTMLButtonElement;
  if (exportPageJsonBtn) {
    exportPageJsonBtn.addEventListener('click', () => {
      const allKeywords = [...analysis.primaryKeywords, ...analysis.secondaryKeywords];
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const pageTitle = modal.querySelector('.dev-keyword-research-page-info h3')?.textContent || 'page';
      const safeTitle = pageTitle.replace(/[^a-z0-9]/gi, '-').toLowerCase();
      exportKeywordsToJSON(allKeywords, `keywords-${safeTitle}-${timestamp}.json`);
    });
  }

  // Export all site - CSV (only show if allPageKeywords is provided)
  const exportSiteCsvBtn = modal.querySelector('#dev-keyword-research-export-site-csv') as HTMLButtonElement;
  if (exportSiteCsvBtn && allPageKeywords && allPageKeywords.length > 0) {
    exportSiteCsvBtn.style.display = 'inline-flex';
    exportSiteCsvBtn.addEventListener('click', () => {
      exportAllSiteKeywords(allPageKeywords, 'csv');
    });
  }

  // Export all site - JSON (only show if allPageKeywords is provided)
  const exportSiteJsonBtn = modal.querySelector('#dev-keyword-research-export-site-json') as HTMLButtonElement;
  if (exportSiteJsonBtn && allPageKeywords && allPageKeywords.length > 0) {
    exportSiteJsonBtn.style.display = 'inline-flex';
    exportSiteJsonBtn.addEventListener('click', () => {
      exportAllSiteKeywords(allPageKeywords, 'json');
    });
  }
}

/**
 * Attach seed keyword search functionality to modal
 * @param modal - Modal element
 */
function attachSeedKeywordSearch(modal: HTMLElement | null): void {
  if (!modal) return;

  const seedInput = modal.querySelector('#dev-seed-input') as HTMLInputElement;
  const searchButton = modal.querySelector('#dev-seed-search') as HTMLButtonElement;
  const resultsContainer = modal.querySelector('#dev-seed-results') as HTMLElement;

  if (!seedInput || !searchButton || !resultsContainer) return;

  let debounceTimeout: ReturnType<typeof setTimeout> | null = null;

  const performSearch = () => {
    const seed = seedInput.value.trim();
    if (!seed) {
      resultsContainer.innerHTML = '<p class="dev-keyword-research-empty-message">Enter a keyword to search</p>';
      return;
    }

    // Search external keywords
    const externalResults = searchKeywords(seed, { limit: 20 });
    
    // Generate variants
    const alphabetSoup = generateAlphabetSoup(seed);
    const longTailVariants = generateLongTailVariants(seed);
    
    // Combine and deduplicate
    const allVariants = new Set([...alphabetSoup, ...longTailVariants]);
    
    // Search variants in external dataset
    const variantResults: ExternalKeyword[] = [];
    allVariants.forEach(variant => {
      const matches = searchKeywords(variant, { limit: 5 });
      variantResults.push(...matches);
    });
    
    // Combine all results
    const allResults = [...externalResults, ...variantResults];
    
    // Deduplicate by keyword
    const uniqueResults = new Map<string, ExternalKeyword>();
    allResults.forEach(kw => {
      const key = kw.keyword.toLowerCase();
      if (!uniqueResults.has(key) || (uniqueResults.get(key)?.volume ?? 0) < kw.volume) {
        uniqueResults.set(key, kw);
      }
    });
    
    const sortedResults = Array.from(uniqueResults.values())
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 30);

    // Render results table
    if (sortedResults.length === 0) {
      resultsContainer.innerHTML = '<p class="dev-keyword-research-empty-message">No keywords found. Try a different search term.</p>';
      return;
    }

    const tableHtml = `
      <table class="dev-keyword-research-results-table">
        <thead>
          <tr>
            <th>Keyword</th>
            <th class="dev-keyword-research-th-numeric">Volume</th>
            <th class="dev-keyword-research-th-numeric">CPC</th>
            <th class="dev-keyword-research-th-numeric">Competition</th>
            <th class="dev-keyword-research-th-center">Intent</th>
            <th class="dev-keyword-research-th-center">Action</th>
          </tr>
        </thead>
        <tbody>
          ${sortedResults.map(kw => `
            <tr>
              <td class="dev-keyword-research-keyword-cell">${escapeHtml(kw.keyword)}</td>
              <td class="dev-keyword-research-numeric-cell">${kw.volume.toLocaleString()}</td>
              <td class="dev-keyword-research-numeric-cell">$${kw.cpc.toFixed(2)}</td>
              <td class="dev-keyword-research-numeric-cell">${(kw.competition * 100).toFixed(0)}%</td>
              <td class="dev-keyword-research-center-cell">${kw.intent ? escapeHtml(kw.intent) : '-'}</td>
              <td class="dev-keyword-research-center-cell">
                <button 
                  class="dev-keyword-research-copy-btn" 
                  data-keyword="${escapeHtml(kw.keyword)}"
                  type="button"
                  aria-label="Copy keyword"
                >
                  Copy
                </button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    resultsContainer.innerHTML = tableHtml;

    // Attach copy handlers
    const copyButtons = resultsContainer.querySelectorAll('.dev-keyword-research-copy-btn');
    copyButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const keyword = btn.getAttribute('data-keyword');
        if (keyword) {
          navigator.clipboard.writeText(keyword).then(() => {
            showToast(`Copied: ${keyword}`, 'success', 2000, 'dev');
            (btn as HTMLButtonElement).textContent = 'Copied!';
            setTimeout(() => {
              (btn as HTMLButtonElement).textContent = 'Copy';
            }, 1000);
          }).catch(() => {
            showToast('Failed to copy keyword', 'error', 2000, 'dev');
          });
        }
      });
    });
  };

  // Debounced search on input
  seedInput.addEventListener('input', () => {
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }
    debounceTimeout = setTimeout(performSearch, 250);
  });

  // Immediate search on button click
  searchButton.addEventListener('click', () => {
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }
    performSearch();
  });

  // Search on Enter key
  seedInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }
      performSearch();
    }
  });
}

/**
 * Initialize keyword research feature
 * Loads external keyword dataset and sets up event handlers
 */
export function initKeywordResearch(): void {
  if (!isLocalhost()) {
    return;
  }
  
  // Load external keywords automatically
  loadExternalKeywords().catch(error => {
    console.error('Failed to load external keywords:', error);
  });
  
  // Add keyword research button to dev-score-bubble if it exists
  const scoreBubble = document.querySelector('.dev-score-bubble');
  if (scoreBubble) {
    // This will be integrated into dev-score-bubble
    console.log('Keyword research module loaded (integrate with dev-score-bubble)');
  }
  
  // Add keyword research to page-list if available
  const pageListContainer = document.querySelector('.page-list-container');
  if (pageListContainer) {
    // This will be integrated into page-list
    console.log('Keyword research module loaded (integrate with page-list)');
  }
}

// Export types and functions for use in other modules
export type { KeywordData, KeywordAnalysis, PageKeywordData, ExternalKeyword, GapAnalysisResult };
export { 
  extractKeywords, 
  analyzeKeywords, 
  analyzePageKeywords,
  generateRelatedKeywords, 
  analyzeKeywordGaps, 
  renderKeywordResearchModal,
  attachSeedKeywordSearch,
  attachCompetitorKeywordRemoval,
  attachExportHandlers,
  exportKeywordsToCSV,
  exportKeywordsToJSON,
  exportAllSiteKeywords,
  searchKeywords,
  loadExternalKeywords
};
