var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// ns-hugo-imp:C:\Users\maxim\Documents\Dev\arsrepairs.com\themes\arsrepairs-theme\assets\ts\utils\dom.ts
var isMobile, isLocalhost, onDOMReady;
var init_dom = __esm({
  "ns-hugo-imp:C:\\Users\\maxim\\Documents\\Dev\\arsrepairs.com\\themes\\arsrepairs-theme\\assets\\ts\\utils\\dom.ts"() {
    "use strict";
    isMobile = () => window.innerWidth <= 1280;
    isLocalhost = () => {
      return window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
    };
    onDOMReady = (callback) => {
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", callback);
      } else {
        callback();
      }
    };
  }
});

// ns-hugo-imp:C:\Users\maxim\Documents\Dev\arsrepairs.com\themes\arsrepairs-theme\assets\ts\utils\dev-ui.ts
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
function showToast(message, type = "info", duration = 5e3, prefix = "dev") {
  const toast = document.createElement("div");
  toast.className = `${prefix}-toast ${prefix}-toast--${type}`;
  toast.setAttribute("role", "alert");
  toast.setAttribute("aria-live", "polite");
  const iconMap = {
    success: "check_circle",
    error: "error",
    info: "info"
  };
  const baseClass = prefix === "page-list" ? "page-list" : "dev-score-bubble";
  toast.innerHTML = `
    <span class="${baseClass}-toast__icon material-symbols-outlined" aria-hidden="true">${iconMap[type]}</span>
    <span class="${baseClass}-toast__message">${escapeHtml(message)}</span>
    <button class="${baseClass}-toast__close" aria-label="Close notification" type="button">
      <span class="material-symbols-outlined" aria-hidden="true">close</span>
    </button>
  `;
  document.body.appendChild(toast);
  requestAnimationFrame(() => {
    toast.classList.add(`${prefix}-toast--show`);
  });
  const closeBtn = toast.querySelector(`.${baseClass}-toast__close`);
  const closeToast = () => {
    toast.classList.remove(`${prefix}-toast--show`);
    setTimeout(() => toast.remove(), 300);
  };
  if (closeBtn) {
    closeBtn.addEventListener("click", closeToast);
  }
  if (duration > 0) {
    setTimeout(closeToast, duration);
  }
}
function createConfirmationDialog(title, message, confirmText = "Continue", cancelText, prefix = "dev") {
  return new Promise((resolve) => {
    const isSingleButton = !cancelText;
    const baseClass = prefix === "page-list" ? "page-list" : "dev-score-bubble";
    const dialog = document.createElement("div");
    dialog.className = `${baseClass}-modal`;
    dialog.setAttribute("role", "dialog");
    dialog.setAttribute("aria-labelledby", `${baseClass}-confirm-title`);
    dialog.setAttribute("aria-modal", "true");
    const modalContentClass = prefix === "page-list" ? `${baseClass}-modal__content ${baseClass}-modal__content--small` : `${baseClass}-modal-content ${baseClass}-modal-content--small`;
    const headerClass = prefix === "page-list" ? `${baseClass}-modal__header` : `${baseClass}-modal-header`;
    const headerIconClass = prefix === "page-list" ? `${baseClass}-modal__header-icon ${baseClass}-modal__header-icon--${isSingleButton ? "info" : "warning"}` : `${baseClass}-modal-header-icon ${baseClass}-modal-header-icon--${isSingleButton ? "info" : "warning"}`;
    const titleClass = prefix === "page-list" ? `${baseClass}-modal__title` : `${baseClass}-modal-title`;
    const bodyClass = prefix === "page-list" ? `${baseClass}-modal__body` : `${baseClass}-modal-body`;
    const messageClass = prefix === "page-list" ? `${baseClass}-confirm-message` : `${baseClass}-confirm-message`;
    const actionsClass = prefix === "page-list" ? `${baseClass}-modal__actions` : `${baseClass}-modal-actions`;
    const buttonClass = prefix === "page-list" ? `${baseClass}-modal__button` : `${baseClass}-modal-button`;
    const overlayClass = prefix === "page-list" ? `${baseClass}-modal__overlay` : `${baseClass}-modal-overlay`;
    dialog.innerHTML = `
      <div class="${overlayClass}" aria-hidden="true"></div>
      <div class="${modalContentClass}">
        <div class="${headerClass}">
          <div class="${headerIconClass}">
            <span class="material-symbols-outlined" aria-hidden="true">${isSingleButton ? "info" : "warning"}</span>
          </div>
          <h2 class="${titleClass}" id="${baseClass}-confirm-title">${escapeHtml(title)}</h2>
        </div>
        <div class="${bodyClass}">
          <div class="${messageClass}">${escapeHtml(message).replace(/\n/g, "<br>")}</div>
          <div class="${actionsClass}">
            ${!isSingleButton ? `
            <button 
              class="${buttonClass} ${buttonClass}--secondary" 
              id="${baseClass}-confirm-cancel"
              type="button"
            >
              ${escapeHtml(cancelText || "Cancel")}
            </button>
            ` : ""}
            <button 
              class="${buttonClass} ${buttonClass}--primary" 
              id="${baseClass}-confirm-ok"
              type="button"
              autofocus
            >
              ${!isSingleButton ? '<span class="material-symbols-outlined" aria-hidden="true">check</span>' : ""}
              ${escapeHtml(confirmText)}
            </button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(dialog);
    const okBtn = dialog.querySelector(`#${baseClass}-confirm-ok`);
    const cancelBtn = dialog.querySelector(`#${baseClass}-confirm-cancel`);
    if (okBtn) {
      okBtn.focus();
    }
    const cleanup2 = () => {
      dialog.remove();
      document.removeEventListener("keydown", handleEscape);
    };
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        resolve(isSingleButton ? true : false);
        cleanup2();
      }
    };
    document.addEventListener("keydown", handleEscape);
    okBtn?.addEventListener("click", () => {
      resolve(true);
      cleanup2();
    });
    if (cancelBtn) {
      cancelBtn.addEventListener("click", () => {
        resolve(false);
        cleanup2();
      });
    }
    if (!isSingleButton) {
      const overlay = dialog.querySelector(`.${overlayClass}`);
      overlay?.addEventListener("click", () => {
        resolve(false);
        cleanup2();
      });
    }
  });
}
function createUrlInputDialog(label, defaultValue = "", prefix = "dev") {
  return new Promise((resolve) => {
    const baseClass = prefix === "page-list" ? "page-list" : "dev-score-bubble";
    const dialog = document.createElement("div");
    dialog.className = `${baseClass}-modal`;
    dialog.setAttribute("role", "dialog");
    dialog.setAttribute("aria-labelledby", `${baseClass}-url-input-title`);
    dialog.setAttribute("aria-modal", "true");
    const modalContentClass = prefix === "page-list" ? `${baseClass}-modal__content ${baseClass}-modal__content--small` : `${baseClass}-modal-content ${baseClass}-modal-content--small`;
    const headerClass = prefix === "page-list" ? `${baseClass}-modal__header` : `${baseClass}-modal-header`;
    const titleClass = prefix === "page-list" ? `${baseClass}-modal__title` : `${baseClass}-modal-title`;
    const bodyClass = prefix === "page-list" ? `${baseClass}-modal__body` : `${baseClass}-modal-body`;
    const actionsClass = prefix === "page-list" ? `${baseClass}-modal__actions` : `${baseClass}-modal-actions`;
    const buttonClass = prefix === "page-list" ? `${baseClass}-modal__button` : `${baseClass}-modal-button`;
    const overlayClass = prefix === "page-list" ? `${baseClass}-modal__overlay` : `${baseClass}-modal-overlay`;
    dialog.innerHTML = `
      <div class="${overlayClass}" aria-hidden="true"></div>
      <div class="${modalContentClass}">
        <div class="${headerClass}">
          <h2 class="${titleClass}" id="${baseClass}-url-input-title">${escapeHtml(label)}</h2>
        </div>
        <div class="${bodyClass}">
          <label class="${baseClass}-input-label" for="${baseClass}-url-input-field">
            Enter new URL:
          </label>
          <input
            type="text"
            id="${baseClass}-url-input-field"
            class="${baseClass}-input-field"
            value="${escapeHtml(defaultValue)}"
            placeholder="/path/to/page"
            autofocus
          />
          <div class="${actionsClass}">
            <button 
              class="${buttonClass} ${buttonClass}--secondary" 
              id="${baseClass}-url-input-cancel"
              type="button"
            >
              Cancel
            </button>
            <button 
              class="${buttonClass} ${buttonClass}--primary" 
              id="${baseClass}-url-input-ok"
              type="button"
            >
              <span class="material-symbols-outlined" aria-hidden="true">check</span>
              Update
            </button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(dialog);
    const input = dialog.querySelector(`#${baseClass}-url-input-field`);
    const okBtn = dialog.querySelector(`#${baseClass}-url-input-ok`);
    const cancelBtn = dialog.querySelector(`#${baseClass}-url-input-cancel`);
    if (input) {
      input.focus();
      input.select();
    }
    const cleanup2 = () => {
      dialog.remove();
      document.removeEventListener("keydown", handleKeyDown);
    };
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        resolve(null);
        cleanup2();
      } else if (e.key === "Enter" && e.target === input) {
        e.preventDefault();
        resolve(input.value.trim() || null);
        cleanup2();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    okBtn?.addEventListener("click", () => {
      resolve(input?.value.trim() || null);
      cleanup2();
    });
    cancelBtn?.addEventListener("click", () => {
      resolve(null);
      cleanup2();
    });
    const overlay = dialog.querySelector(`.${overlayClass}`);
    overlay?.addEventListener("click", () => {
      resolve(null);
      cleanup2();
    });
  });
}
var init_dev_ui = __esm({
  "ns-hugo-imp:C:\\Users\\maxim\\Documents\\Dev\\arsrepairs.com\\themes\\arsrepairs-theme\\assets\\ts\\utils\\dev-ui.ts"() {
    "use strict";
  }
});

// ns-hugo-imp:C:\Users\maxim\Documents\Dev\arsrepairs.com\themes\arsrepairs-theme\assets\ts\modules\keyword-research.ts
var keyword_research_exports = {};
__export(keyword_research_exports, {
  analyzeKeywordGaps: () => analyzeKeywordGaps,
  analyzeKeywords: () => analyzeKeywords,
  analyzePageKeywords: () => analyzePageKeywords,
  attachCompetitorKeywordRemoval: () => attachCompetitorKeywordRemoval,
  attachExportHandlers: () => attachExportHandlers,
  attachSeedKeywordSearch: () => attachSeedKeywordSearch,
  exportAllSiteKeywords: () => exportAllSiteKeywords,
  exportKeywordsToCSV: () => exportKeywordsToCSV,
  exportKeywordsToJSON: () => exportKeywordsToJSON,
  extractKeywords: () => extractKeywords,
  generateRelatedKeywords: () => generateRelatedKeywords,
  initKeywordResearch: () => initKeywordResearch,
  loadExternalKeywords: () => loadExternalKeywords,
  renderKeywordResearchModal: () => renderKeywordResearchModal,
  searchKeywords: () => searchKeywords
});
async function loadExternalKeywords() {
  if (externalKeywordsLoaded || externalKeywordsLoading) {
    return;
  }
  externalKeywordsLoading = true;
  try {
    let response = await fetch("/data/keywords-canada.json");
    if (!response.ok) {
      response = await fetch("/data/keywords-canada.json.gz");
    }
    if (!response.ok) {
      console.warn("External keyword dataset not found. Continuing without external data.");
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
      throw new Error("Invalid keyword dataset format");
    }
    externalKeywordsLoaded = true;
    console.log(`Loaded ${externalKeywords.length} external keywords from Canadian dataset`);
  } catch (error) {
    console.error("Error loading external keywords:", error);
    showToast("Could not load external keyword dataset. Some features may be limited.", "info", 5e3, "dev");
    externalKeywords = [];
  } finally {
    externalKeywordsLoading = false;
  }
}
function searchKeywords(seed, options) {
  const {
    minVolume = 0,
    maxCompetition = 1,
    limit = 50
  } = options ?? {};
  const seedLower = seed.toLowerCase().trim();
  if (!seedLower) {
    return [];
  }
  const matches = externalKeywords.filter((kw) => {
    const keywordLower = kw.keyword.toLowerCase();
    return keywordLower.includes(seedLower) && kw.volume >= minVolume && kw.competition <= maxCompetition;
  });
  matches.sort((a, b) => b.volume - a.volume);
  return matches.slice(0, limit);
}
function generateAlphabetSoup(seed) {
  const variants = [];
  const seedLower = seed.toLowerCase().trim();
  const words = seedLower.split(/\s+/);
  const alphabet = "abcdefghijklmnopqrstuvwxyz";
  for (let i = 0; i < Math.min(5, alphabet.length); i++) {
    variants.push(`${alphabet[i]} ${seedLower}`);
    variants.push(`${seedLower} ${alphabet[i]}`);
  }
  const commonLetters = ["a", "b", "c", "x", "z"];
  commonLetters.forEach((letter) => {
    variants.push(`${letter}${seedLower}`);
    variants.push(`${seedLower}${letter}`);
  });
  return variants;
}
function generateLongTailVariants(seed) {
  const variants = /* @__PURE__ */ new Set();
  const seedLower = seed.toLowerCase().trim();
  PREFIXES.forEach((prefix) => {
    variants.add(`${prefix} ${seedLower}`);
    variants.add(`${seedLower} ${prefix}`);
  });
  SUFFIXES.forEach((suffix) => {
    variants.add(`${seedLower} ${suffix}`);
    variants.add(`${suffix} ${seedLower}`);
  });
  PREFIXES.slice(0, 5).forEach((prefix) => {
    SUFFIXES.slice(0, 5).forEach((suffix) => {
      variants.add(`${prefix} ${seedLower} ${suffix}`);
    });
  });
  const words = seedLower.split(/\s+/);
  if (words.length >= 2) {
    const swapped = [words[1], words[0], ...words.slice(2)].join(" ");
    variants.add(swapped);
    if (words.length === 2) {
      variants.add(words.reverse().join(" "));
    }
  }
  return Array.from(variants);
}
function extractKeywords(text, minLength = 3, stopWords = /* @__PURE__ */ new Set()) {
  const defaultStopWords = /* @__PURE__ */ new Set([
    "a",
    "an",
    "and",
    "are",
    "as",
    "at",
    "be",
    "by",
    "for",
    "from",
    "has",
    "he",
    "in",
    "is",
    "it",
    "its",
    "of",
    "on",
    "that",
    "the",
    "to",
    "was",
    "will",
    "with",
    "the",
    "this",
    "but",
    "they",
    "have",
    "had",
    "what",
    "said",
    "each",
    "which",
    "their",
    "time",
    "if",
    "up",
    "out",
    "many",
    "then",
    "them",
    "these",
    "so",
    "some",
    "her",
    "would",
    "make",
    "like",
    "into",
    "him",
    "has",
    "two",
    "more",
    "very",
    "after",
    "words",
    "long",
    "than",
    "first",
    "been",
    "call",
    "who",
    "oil",
    "sit",
    "now",
    "find",
    "down",
    "day",
    "did",
    "get",
    "come",
    "made",
    "may",
    "part",
    // Canadian spelling variants
    "colour",
    "colours",
    "favourite",
    "favourites",
    "centre",
    "centres",
    "organise",
    "organised",
    "organising",
    "realise",
    "realised",
    "realising"
  ]);
  const allStopWords = /* @__PURE__ */ new Set([...defaultStopWords, ...stopWords]);
  const normalized = text.toLowerCase().replace(/[^\w\s]/g, " ").replace(/\s+/g, " ").trim();
  const words = normalized.split(/\s+/);
  const keywordMap = /* @__PURE__ */ new Map();
  words.forEach((word, index) => {
    if (word.length < minLength || allStopWords.has(word)) {
      return;
    }
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
    const start = Math.max(0, index - 3);
    const end = Math.min(words.length, index + 4);
    const contextWords = words.slice(start, end);
    keywordData.context.push(contextWords.join(" "));
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
        phraseData.context.push(contextWords.join(" "));
      }
    }
    if (index < words.length - 2) {
      const nextWord = words[index + 1];
      const nextNextWord = words[index + 2];
      if (nextWord.length >= minLength && nextNextWord.length >= minLength && !allStopWords.has(nextWord) && !allStopWords.has(nextNextWord)) {
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
        phraseData.context.push(contextWords.join(" "));
      }
    }
  });
  const totalWords = words.length;
  keywordMap.forEach((data) => {
    data.density = data.frequency / totalWords * 100;
  });
  return keywordMap;
}
function enrichKeywordsWithExternalData(keywordMap) {
  if (externalKeywords.length === 0) {
    return;
  }
  keywordMap.forEach((data) => {
    const match = externalKeywords.find(
      (ek) => ek.keyword.toLowerCase() === data.keyword.toLowerCase()
    );
    if (match) {
      data.volume = match.volume;
      data.cpc = match.cpc;
      data.competition = match.competition;
      data.intent = match.intent;
    }
  });
}
function analyzeKeywords(content, title, description) {
  const fullText = `${title} ${description} ${content}`.toLowerCase();
  const keywordMap = extractKeywords(fullText);
  enrichKeywordsWithExternalData(keywordMap);
  const sortedKeywords = Array.from(keywordMap.values()).sort((a, b) => b.frequency - a.frequency);
  const primaryKeywords = sortedKeywords.filter((k) => k.frequency >= 3 && k.density >= 0.5).slice(0, 20);
  const secondaryKeywords = sortedKeywords.filter((k) => k.frequency >= 2 && k.density >= 0.2 && !primaryKeywords.includes(k)).slice(0, 30);
  const longTailKeywords = sortedKeywords.filter((k) => k.keyword.split(" ").length >= 3).map((k) => k.keyword).slice(0, 15);
  const totalWords = fullText.split(/\s+/).length;
  const uniqueKeywords = keywordMap.size;
  const keywordRichness = uniqueKeywords / totalWords * 100;
  const avgDensity = primaryKeywords.length > 0 ? primaryKeywords.reduce((sum, k) => sum + k.density, 0) / primaryKeywords.length : 0;
  const recommendations = [];
  if (primaryKeywords.length === 0) {
    recommendations.push({
      text: "No primary keywords found. Consider adding more relevant keywords to your content.",
      type: "error"
    });
  }
  const primary = primaryKeywords[0];
  if (primary) {
    if (primary.density < 0.8) {
      recommendations.push({
        text: `Top primary keyword "${primary.keyword}" density too low (${primary.density.toFixed(2)}%). Aim for 1.1\u20131.9%.`,
        type: "warning"
      });
    } else if (primary.density > 2.2) {
      recommendations.push({
        text: `Top primary keyword "${primary.keyword}" density too high (${primary.density.toFixed(2)}%). Reduce naturally to avoid penalties.`,
        type: "error"
      });
    } else if (primary.density >= 1.1 && primary.density <= 1.9) {
      recommendations.push({
        text: `Top primary keyword "${primary.keyword}" density is optimal (${primary.density.toFixed(2)}%)`,
        type: "success"
      });
    }
  }
  if (keywordRichness < 6.5) {
    recommendations.push({
      text: `Keyword richness low (${keywordRichness.toFixed(1)}%). Add synonyms, LSI terms, and related phrases to reach 9\u201312%.`,
      type: "warning"
    });
  } else if (keywordRichness >= 9) {
    recommendations.push({
      text: `Excellent keyword richness (${keywordRichness.toFixed(1)}%) \u2013 strong topical authority signal!`,
      type: "success"
    });
  } else if (keywordRichness >= 6.5 && keywordRichness < 9) {
    recommendations.push({
      text: `Keyword richness is good (${keywordRichness.toFixed(1)}%). Consider adding more related terms to reach 9\u201312% for optimal topical authority.`,
      type: "info"
    });
  }
  if (avgDensity > 3) {
    recommendations.push({
      text: "Overall keyword density may be too high. Aim for 1-2% for primary keywords to avoid over-optimization.",
      type: "warning"
    });
  }
  if (longTailKeywords.length < 5) {
    recommendations.push({
      text: "Consider adding more long-tail keywords (3+ word phrases) for better targeting.",
      type: "info"
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
function generateRelatedKeywords(seedKeyword, allPages) {
  const related = /* @__PURE__ */ new Set();
  const seedLower = seedKeyword.toLowerCase().trim();
  allPages.forEach((page) => {
    const pageText = `${page.title ?? ""} ${page.metaDescription ?? ""} ${page.summary ?? ""}`.toLowerCase();
    const keywords = extractKeywords(pageText);
    keywords.forEach((data, keyword) => {
      if (keyword.includes(seedLower) || seedLower.includes(keyword) || keyword.split(" ").some((word) => seedLower.includes(word))) {
        related.add(keyword);
      }
    });
  });
  const alphabetSoup = generateAlphabetSoup(seedKeyword);
  alphabetSoup.forEach((variant) => related.add(variant));
  const longTailVariants = generateLongTailVariants(seedKeyword);
  longTailVariants.forEach((variant) => related.add(variant));
  const words = seedLower.split(/\s+/);
  if (words.length >= 2) {
    for (let i = 0; i < words.length; i++) {
      for (let j = i + 1; j < words.length; j++) {
        const swapped = [...words];
        [swapped[i], swapped[j]] = [swapped[j], swapped[i]];
        related.add(swapped.join(" "));
      }
    }
  }
  if (externalKeywords.length > 0) {
    const externalMatches = searchKeywords(seedKeyword, { limit: 10 });
    externalMatches.forEach((match) => related.add(match.keyword));
  }
  return Array.from(related).slice(0, 30);
}
function analyzePageKeywords(page) {
  const pageText = `${page.title} ${page.metaDescription ?? ""} ${page.summary ?? ""}`.toLowerCase();
  const keywordMap = extractKeywords(pageText);
  enrichKeywordsWithExternalData(keywordMap);
  const sortedKeywords = Array.from(keywordMap.values()).sort((a, b) => b.frequency - a.frequency);
  const primaryKeywords = sortedKeywords.filter((k) => k.frequency >= 2).slice(0, 30);
  return {
    pageUrl: page.relPermalink,
    pageTitle: page.title,
    keywords: primaryKeywords,
    topKeywords: primaryKeywords.map((k) => k.keyword)
  };
}
function analyzeKeywordGaps(currentPage, allPages) {
  const currentKeywords = new Set(currentPage.topKeywords.map((k) => k.toLowerCase()));
  const allKeywords = /* @__PURE__ */ new Map();
  allPages.forEach((page) => {
    if (page.pageUrl !== currentPage.pageUrl && page.topKeywords.length > 0) {
      page.topKeywords.forEach((keyword) => {
        const key = keyword.toLowerCase();
        let data = allKeywords.get(key);
        if (!data) {
          data = { count: 0, pages: [] };
          allKeywords.set(key, data);
        }
        data.count++;
        data.pages.push(page.pageTitle);
        const keywordData = page.keywords.find((k) => k.keyword.toLowerCase() === key);
        if (keywordData) {
          if (keywordData.volume !== void 0) {
            const currentAvg = data.avgVolume ?? 0;
            data.avgVolume = (currentAvg * (data.count - 1) + keywordData.volume) / data.count;
          }
          if (keywordData.competition !== void 0) {
            const currentAvg = data.avgCompetition ?? 0;
            data.avgCompetition = (currentAvg * (data.count - 1) + keywordData.competition) / data.count;
          }
        }
      });
    }
  });
  const missingKeywords = [];
  const opportunities = [];
  allKeywords.forEach((data, keyword) => {
    if (!currentKeywords.has(keyword) && data.count >= 2) {
      missingKeywords.push(keyword);
      let opportunityScore = data.count;
      if (externalKeywords.length > 0) {
        const externalMatch = externalKeywords.find(
          (ek) => ek.keyword.toLowerCase() === keyword.toLowerCase()
        );
        if (externalMatch) {
          const volumeWeight = Math.log10(externalMatch.volume + 1) / 10;
          opportunityScore = data.count * volumeWeight * (1 - externalMatch.competition);
        } else if (data.avgVolume !== void 0 && data.avgCompetition !== void 0) {
          const volumeWeight = Math.log10(data.avgVolume + 1) / 10;
          opportunityScore = data.count * volumeWeight * (1 - data.avgCompetition);
        }
      } else if (data.avgVolume !== void 0 && data.avgCompetition !== void 0) {
        const volumeWeight = Math.log10(data.avgVolume + 1) / 10;
        opportunityScore = data.count * volumeWeight * (1 - data.avgCompetition);
      }
      let volume;
      let competition;
      if (externalKeywords.length > 0) {
        const externalMatch = externalKeywords.find(
          (ek) => ek.keyword.toLowerCase() === keyword.toLowerCase()
        );
        if (externalMatch) {
          volume = externalMatch.volume;
          competition = externalMatch.competition;
        }
      }
      if (volume === void 0 && data.avgVolume !== void 0) {
        volume = Math.round(data.avgVolume);
      }
      if (competition === void 0 && data.avgCompetition !== void 0) {
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
function getDensityClass(density) {
  if (density < 0.8) {
    return "dev-keyword-research-keyword-density--low";
  } else if (density >= 1.1 && density <= 1.9) {
    return "dev-keyword-research-keyword-density--optimal";
  } else if (density > 2.2) {
    return "dev-keyword-research-keyword-density--high";
  } else {
    return "dev-keyword-research-keyword-density--ok";
  }
}
function renderKeywordResearchModal(analysis, pageTitle, pageUrl, gapAnalysis, competitorKeywords) {
  const prefix = "dev";
  return `
    <div class="dev-score-bubble-modal" id="dev-keyword-research-modal" role="dialog" aria-labelledby="dev-keyword-research-title" aria-modal="true">
      <div class="dev-score-bubble-modal-overlay" aria-hidden="true"></div>
      <div class="dev-score-bubble-modal-content dev-score-bubble-modal-content--large">
        <div class="dev-score-bubble-modal-header">
          <div class="dev-score-bubble-modal-header-icon dev-score-bubble-modal-header-icon--info">
            <span class="material-symbols-outlined" aria-hidden="true">search</span>
          </div>
          <h2 class="dev-score-bubble-modal-title" id="dev-keyword-research-title">Keyword Research</h2>
          <button class="dev-score-bubble-modal-close" aria-label="Close dialog" type="button">\xD7</button>
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
                placeholder="Enter seed keyword\u2026" 
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
                ${analysis.recommendations.map((rec) => `
                  <li class="dev-keyword-research-recommendation dev-keyword-research-recommendation--${rec.type}">
                    ${escapeHtml(rec.text)}
                  </li>
                `).join("")}
              </ul>
            </div>
            ` : ""}
          </div>
          
          ${analysis.primaryKeywords.length > 0 ? `
          <div class="dev-keyword-research-section">
            <h3 class="dev-keyword-research-section-title">
              <span class="material-symbols-outlined" aria-hidden="true">star</span>
              Primary Keywords
            </h3>
            <div class="dev-keyword-research-keywords">
              ${analysis.primaryKeywords.map((k) => `
                <div class="dev-keyword-research-keyword">
                  <span class="dev-keyword-research-keyword-text">${escapeHtml(k.keyword)}</span>
                  <div class="dev-keyword-research-keyword-stats">
                    <span class="dev-keyword-research-keyword-frequency">${k.frequency}x</span>
                    <span class="dev-keyword-research-keyword-density ${getDensityClass(k.density)}">${k.density.toFixed(2)}%</span>
                    ${k.volume !== void 0 ? `<span class="dev-keyword-research-keyword-volume" title="Search volume">${k.volume.toLocaleString()}</span>` : ""}
                    ${k.competition !== void 0 ? `<span class="dev-keyword-research-keyword-competition" title="Competition">${(k.competition * 100).toFixed(0)}%</span>` : ""}
                  </div>
                </div>
              `).join("")}
            </div>
          </div>
          ` : ""}
          
          ${analysis.secondaryKeywords.length > 0 ? `
          <div class="dev-keyword-research-section">
            <h3 class="dev-keyword-research-section-title">
              <span class="material-symbols-outlined" aria-hidden="true">label</span>
              Secondary Keywords
            </h3>
            <div class="dev-keyword-research-keywords">
              ${analysis.secondaryKeywords.map((k) => `
                <div class="dev-keyword-research-keyword">
                  <span class="dev-keyword-research-keyword-text">${escapeHtml(k.keyword)}</span>
                  <div class="dev-keyword-research-keyword-stats">
                    <span class="dev-keyword-research-keyword-frequency">${k.frequency}x</span>
                    <span class="dev-keyword-research-keyword-density ${getDensityClass(k.density)}">${k.density.toFixed(2)}%</span>
                    ${k.volume !== void 0 ? `<span class="dev-keyword-research-keyword-volume" title="Search volume">${k.volume.toLocaleString()}</span>` : ""}
                    ${k.competition !== void 0 ? `<span class="dev-keyword-research-keyword-competition" title="Competition">${(k.competition * 100).toFixed(0)}%</span>` : ""}
                  </div>
                </div>
              `).join("")}
            </div>
          </div>
          ` : ""}
          
          ${analysis.longTailKeywords.length > 0 ? `
          <div class="dev-keyword-research-section">
            <h3 class="dev-keyword-research-section-title">
              <span class="material-symbols-outlined" aria-hidden="true">auto_awesome</span>
              Long-Tail Keywords
            </h3>
            <div class="dev-keyword-research-keywords">
              ${analysis.longTailKeywords.map((keyword) => `
                <div class="dev-keyword-research-keyword">
                  <span class="dev-keyword-research-keyword-text">${escapeHtml(keyword)}</span>
                </div>
              `).join("")}
            </div>
          </div>
          ` : ""}
          
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
              ${gapAnalysis.opportunities.slice(0, 10).map((opp) => `
                <div class="dev-keyword-research-keyword dev-keyword-research-keyword--opportunity">
                  <span class="dev-keyword-research-keyword-text">${escapeHtml(opp.keyword)}</span>
                  <div class="dev-keyword-research-keyword-stats">
                    <span class="dev-keyword-research-keyword-frequency">Used by ${opp.usedBy} page${opp.usedBy !== 1 ? "s" : ""}</span>
                    ${opp.volume !== void 0 ? `<span class="dev-keyword-research-keyword-volume" title="Search volume">${opp.volume.toLocaleString()}</span>` : ""}
                    ${opp.competition !== void 0 ? `<span class="dev-keyword-research-keyword-competition" title="Competition">${(opp.competition * 100).toFixed(0)}%</span>` : ""}
                    ${opp.opportunityScore !== void 0 ? `<span class="dev-keyword-research-keyword-opportunity-score" title="Opportunity score">Score: ${opp.opportunityScore.toFixed(1)}</span>` : ""}
                  </div>
                </div>
              `).join("")}
            </div>
          </div>
          ` : ""}
          
          ${competitorKeywords && competitorKeywords.length > 0 ? `
          <div class="dev-keyword-research-section">
            <h3 class="dev-keyword-research-section-title">
              <span class="material-symbols-outlined" aria-hidden="true">business</span>
              Competitor Keywords
            </h3>
            <p class="dev-keyword-research-section-description">
              Keywords found on competitor pages:
            </p>
            ${competitorKeywords.map((comp) => {
    const primaryKeywords = comp.keywords?.primaryKeywords || [];
    const secondaryKeywords = comp.keywords?.secondaryKeywords || [];
    const allKeywords = [...primaryKeywords, ...secondaryKeywords].slice(0, 20);
    if (allKeywords.length === 0) return "";
    return `
                <div class="dev-keyword-research-competitor">
                  <h4 class="dev-keyword-research-competitor-url">${escapeHtml(comp.url)}</h4>
                  <div class="dev-keyword-research-keywords">
                    ${allKeywords.map((k) => {
      const keywordId = `${comp.url}:${k.keyword}`.replace(/[^a-zA-Z0-9:]/g, "_");
      return `
                      <div class="dev-keyword-research-keyword" data-competitor-keyword-id="${keywordId}">
                        <span class="dev-keyword-research-keyword-text">${escapeHtml(k.keyword)}</span>
                        <div class="dev-keyword-research-keyword-stats">
                          <span class="dev-keyword-research-keyword-frequency">${k.frequency}x</span>
                          <span class="dev-keyword-research-keyword-density ${getDensityClass(k.density)}">${k.density.toFixed(2)}%</span>
                          ${k.volume !== void 0 ? `<span class="dev-keyword-research-keyword-volume" title="Search volume">${k.volume.toLocaleString()}</span>` : ""}
                          ${k.competition !== void 0 ? `<span class="dev-keyword-research-keyword-competition" title="Competition">${(k.competition * 100).toFixed(0)}%</span>` : ""}
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
    }).join("")}
                  </div>
                </div>
              `;
  }).join("")}
          </div>
          ` : ""}
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
function attachCompetitorKeywordRemoval(modal) {
  if (!modal) return;
  const STORAGE_KEY2 = "page-list-competitors";
  const removeButtons = modal.querySelectorAll(".dev-keyword-research-remove-btn");
  removeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const keywordId = button.getAttribute("data-competitor-keyword-id");
      if (!keywordId) return;
      const keywordElement = modal.querySelector(`[data-competitor-keyword-id="${keywordId}"]`);
      if (!keywordElement) return;
      const keywordTextEl = keywordElement.querySelector(".dev-keyword-research-keyword-text");
      const keywordText = keywordTextEl?.textContent?.trim();
      const competitorSection = keywordElement.closest(".dev-keyword-research-competitor");
      const competitorUrlEl = competitorSection?.querySelector(".dev-keyword-research-competitor-url");
      const competitorUrl = competitorUrlEl?.textContent?.trim();
      if (!keywordText || !competitorUrl) {
        showToast("Could not identify keyword to remove", "error", 3e3, "dev");
        return;
      }
      try {
        const stored = localStorage.getItem(STORAGE_KEY2);
        if (stored) {
          const competitors = JSON.parse(stored);
          const competitorIndex = competitors.findIndex((c) => c.url === competitorUrl);
          if (competitorIndex !== -1 && competitors[competitorIndex].keywords) {
            const competitor = competitors[competitorIndex];
            if (competitor.keywords.primaryKeywords) {
              competitor.keywords.primaryKeywords = competitor.keywords.primaryKeywords.filter(
                (k) => k.keyword !== keywordText
              );
            }
            if (competitor.keywords.secondaryKeywords) {
              competitor.keywords.secondaryKeywords = competitor.keywords.secondaryKeywords.filter(
                (k) => k.keyword !== keywordText
              );
            }
            localStorage.setItem(STORAGE_KEY2, JSON.stringify(competitors));
          }
        }
      } catch (error) {
        console.error("Error updating stored competitor keywords:", error);
      }
      keywordElement.style.transition = "opacity 0.3s ease, transform 0.3s ease";
      keywordElement.style.opacity = "0";
      keywordElement.style.transform = "scale(0.9)";
      setTimeout(() => {
        keywordElement.remove();
        if (competitorSection) {
          const remainingKeywords = competitorSection.querySelectorAll(".dev-keyword-research-keyword");
          if (remainingKeywords.length === 0) {
            competitorSection.style.transition = "opacity 0.3s ease";
            competitorSection.style.opacity = "0";
            setTimeout(() => {
              competitorSection.remove();
              const allSections = modal.querySelectorAll(".dev-keyword-research-section");
              allSections.forEach((section) => {
                const sectionTitle = section.querySelector(".dev-keyword-research-section-title");
                if (sectionTitle && sectionTitle.textContent?.includes("Competitor Keywords")) {
                  const allCompetitors = section.querySelectorAll(".dev-keyword-research-competitor");
                  if (allCompetitors.length === 0) {
                    section.remove();
                  }
                }
              });
            }, 300);
          }
        }
        showToast("Keyword removed", "success", 2e3, "dev");
      }, 300);
    });
  });
}
function exportKeywordsToCSV(data, filename) {
  if (data.length === 0) {
    showToast("No keywords to export", "info", 3e3, "dev");
    return;
  }
  const headers = ["Keyword", "Frequency", "Density (%)", "Search Volume", "CPC ($)", "Competition (%)", "Intent", "Positions Count"];
  const rows = [headers.join(",")];
  data.forEach((kw) => {
    const row = [
      `"${kw.keyword.replace(/"/g, '""')}"`,
      // Escape quotes in keyword
      kw.frequency.toString(),
      kw.density.toFixed(2),
      kw.volume?.toLocaleString() || "",
      kw.cpc?.toFixed(2) || "",
      kw.competition !== void 0 ? (kw.competition * 100).toFixed(0) : "",
      kw.intent || "",
      kw.positions.length.toString()
    ];
    rows.push(row.join(","));
  });
  const csvContent = rows.join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  showToast(`Exported ${data.length} keywords to ${filename}`, "success", 3e3, "dev");
}
function exportKeywordsToJSON(data, filename) {
  if (data.length === 0) {
    showToast("No keywords to export", "info", 3e3, "dev");
    return;
  }
  const jsonData = data.map((kw) => ({
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
  const jsonContent = JSON.stringify(jsonData, null, 2);
  const blob = new Blob([jsonContent], { type: "application/json;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  showToast(`Exported ${data.length} keywords to ${filename}`, "success", 3e3, "dev");
}
function exportAllSiteKeywords(allPageKeywords, format) {
  if (allPageKeywords.length === 0) {
    showToast("No page keywords to export", "info", 3e3, "dev");
    return;
  }
  const timestamp = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-").slice(0, -5);
  const filename = `all-site-keywords-${timestamp}.${format}`;
  if (format === "csv") {
    const headers = ["Page URL", "Page Title", "Keyword", "Frequency", "Density (%)", "Search Volume", "CPC ($)", "Competition (%)", "Intent"];
    const rows = [headers.join(",")];
    allPageKeywords.forEach((page) => {
      page.keywords.forEach((kw) => {
        const row = [
          `"${page.pageUrl.replace(/"/g, '""')}"`,
          `"${page.pageTitle.replace(/"/g, '""')}"`,
          `"${kw.keyword.replace(/"/g, '""')}"`,
          kw.frequency.toString(),
          kw.density.toFixed(2),
          kw.volume?.toLocaleString() || "",
          kw.cpc?.toFixed(2) || "",
          kw.competition !== void 0 ? (kw.competition * 100).toFixed(0) : "",
          kw.intent || ""
        ];
        rows.push(row.join(","));
      });
    });
    const csvContent = rows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    const totalKeywords = allPageKeywords.reduce((sum, page) => sum + page.keywords.length, 0);
    showToast(`Exported ${totalKeywords} keywords from ${allPageKeywords.length} pages to ${filename}`, "success", 3e3, "dev");
  } else {
    const jsonData = allPageKeywords.map((page) => ({
      pageUrl: page.pageUrl,
      pageTitle: page.pageTitle,
      keywords: page.keywords.map((kw) => ({
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
    const blob = new Blob([jsonContent], { type: "application/json;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    const totalKeywords = allPageKeywords.reduce((sum, page) => sum + page.keywords.length, 0);
    showToast(`Exported ${totalKeywords} keywords from ${allPageKeywords.length} pages to ${filename}`, "success", 3e3, "dev");
  }
}
function attachExportHandlers(modal, analysis, allPageKeywords) {
  if (!modal) return;
  const exportPageCsvBtn = modal.querySelector("#dev-keyword-research-export-page-csv");
  if (exportPageCsvBtn) {
    exportPageCsvBtn.addEventListener("click", () => {
      const allKeywords = [...analysis.primaryKeywords, ...analysis.secondaryKeywords];
      const timestamp = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-").slice(0, -5);
      const pageTitle = modal.querySelector(".dev-keyword-research-page-info h3")?.textContent || "page";
      const safeTitle = pageTitle.replace(/[^a-z0-9]/gi, "-").toLowerCase();
      exportKeywordsToCSV(allKeywords, `keywords-${safeTitle}-${timestamp}.csv`);
    });
  }
  const exportPageJsonBtn = modal.querySelector("#dev-keyword-research-export-page-json");
  if (exportPageJsonBtn) {
    exportPageJsonBtn.addEventListener("click", () => {
      const allKeywords = [...analysis.primaryKeywords, ...analysis.secondaryKeywords];
      const timestamp = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-").slice(0, -5);
      const pageTitle = modal.querySelector(".dev-keyword-research-page-info h3")?.textContent || "page";
      const safeTitle = pageTitle.replace(/[^a-z0-9]/gi, "-").toLowerCase();
      exportKeywordsToJSON(allKeywords, `keywords-${safeTitle}-${timestamp}.json`);
    });
  }
  const exportSiteCsvBtn = modal.querySelector("#dev-keyword-research-export-site-csv");
  if (exportSiteCsvBtn && allPageKeywords && allPageKeywords.length > 0) {
    exportSiteCsvBtn.style.display = "inline-flex";
    exportSiteCsvBtn.addEventListener("click", () => {
      exportAllSiteKeywords(allPageKeywords, "csv");
    });
  }
  const exportSiteJsonBtn = modal.querySelector("#dev-keyword-research-export-site-json");
  if (exportSiteJsonBtn && allPageKeywords && allPageKeywords.length > 0) {
    exportSiteJsonBtn.style.display = "inline-flex";
    exportSiteJsonBtn.addEventListener("click", () => {
      exportAllSiteKeywords(allPageKeywords, "json");
    });
  }
}
function attachSeedKeywordSearch(modal) {
  if (!modal) return;
  const seedInput = modal.querySelector("#dev-seed-input");
  const searchButton = modal.querySelector("#dev-seed-search");
  const resultsContainer = modal.querySelector("#dev-seed-results");
  if (!seedInput || !searchButton || !resultsContainer) return;
  let debounceTimeout = null;
  const performSearch = () => {
    const seed = seedInput.value.trim();
    if (!seed) {
      resultsContainer.innerHTML = '<p class="dev-keyword-research-empty-message">Enter a keyword to search</p>';
      return;
    }
    const externalResults = searchKeywords(seed, { limit: 20 });
    const alphabetSoup = generateAlphabetSoup(seed);
    const longTailVariants = generateLongTailVariants(seed);
    const allVariants = /* @__PURE__ */ new Set([...alphabetSoup, ...longTailVariants]);
    const variantResults = [];
    allVariants.forEach((variant) => {
      const matches = searchKeywords(variant, { limit: 5 });
      variantResults.push(...matches);
    });
    const allResults = [...externalResults, ...variantResults];
    const uniqueResults = /* @__PURE__ */ new Map();
    allResults.forEach((kw) => {
      const key = kw.keyword.toLowerCase();
      if (!uniqueResults.has(key) || (uniqueResults.get(key)?.volume ?? 0) < kw.volume) {
        uniqueResults.set(key, kw);
      }
    });
    const sortedResults = Array.from(uniqueResults.values()).sort((a, b) => b.volume - a.volume).slice(0, 30);
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
          ${sortedResults.map((kw) => `
            <tr>
              <td class="dev-keyword-research-keyword-cell">${escapeHtml(kw.keyword)}</td>
              <td class="dev-keyword-research-numeric-cell">${kw.volume.toLocaleString()}</td>
              <td class="dev-keyword-research-numeric-cell">$${kw.cpc.toFixed(2)}</td>
              <td class="dev-keyword-research-numeric-cell">${(kw.competition * 100).toFixed(0)}%</td>
              <td class="dev-keyword-research-center-cell">${kw.intent ? escapeHtml(kw.intent) : "-"}</td>
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
          `).join("")}
        </tbody>
      </table>
    `;
    resultsContainer.innerHTML = tableHtml;
    const copyButtons = resultsContainer.querySelectorAll(".dev-keyword-research-copy-btn");
    copyButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const keyword = btn.getAttribute("data-keyword");
        if (keyword) {
          navigator.clipboard.writeText(keyword).then(() => {
            showToast(`Copied: ${keyword}`, "success", 2e3, "dev");
            btn.textContent = "Copied!";
            setTimeout(() => {
              btn.textContent = "Copy";
            }, 1e3);
          }).catch(() => {
            showToast("Failed to copy keyword", "error", 2e3, "dev");
          });
        }
      });
    });
  };
  seedInput.addEventListener("input", () => {
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }
    debounceTimeout = setTimeout(performSearch, 250);
  });
  searchButton.addEventListener("click", () => {
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }
    performSearch();
  });
  seedInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }
      performSearch();
    }
  });
}
function initKeywordResearch() {
  if (!isLocalhost()) {
    return;
  }
  loadExternalKeywords().catch((error) => {
    console.error("Failed to load external keywords:", error);
  });
  const scoreBubble = document.querySelector(".dev-score-bubble");
  if (scoreBubble) {
    console.log("Keyword research module loaded (integrate with dev-score-bubble)");
  }
  const pageListContainer = document.querySelector(".page-list-container");
  if (pageListContainer) {
    console.log("Keyword research module loaded (integrate with page-list)");
  }
}
var externalKeywords, externalKeywordsLoaded, externalKeywordsLoading, PREFIXES, SUFFIXES;
var init_keyword_research = __esm({
  "ns-hugo-imp:C:\\Users\\maxim\\Documents\\Dev\\arsrepairs.com\\themes\\arsrepairs-theme\\assets\\ts\\modules\\keyword-research.ts"() {
    "use strict";
    init_dom();
    init_dev_ui();
    externalKeywords = [];
    externalKeywordsLoaded = false;
    externalKeywordsLoading = false;
    PREFIXES = [
      "best",
      "top 10",
      "top",
      "cheap",
      "affordable",
      "budget",
      "how to",
      "guide to",
      "review",
      "canada",
      "canadian",
      "toronto",
      "ontario",
      "2025",
      "2024",
      "near me",
      "vs",
      "versus",
      "compare",
      "difference between",
      "what is",
      "why",
      "when",
      "where",
      "free",
      "discount",
      "sale",
      "deals",
      "professional",
      "expert",
      "certified"
    ];
    SUFFIXES = [
      "canada",
      "canadian",
      "toronto",
      "ontario",
      "near me",
      "2025",
      "2024",
      "review",
      "guide",
      "tips",
      "tricks",
      "hacks",
      "cost",
      "price",
      "service",
      "repair",
      "installation",
      "maintenance",
      "replacement",
      "vs",
      "comparison",
      "alternatives"
    ];
  }
});

// ns-hugo-imp:C:\Users\maxim\Documents\Dev\arsrepairs.com\themes\arsrepairs-theme\assets\ts\constants.ts
var PHONE_DATA_ATTR = "phone";
var MOBILE_BREAKPOINT = 1280;
var SCROLL_SHADOW_THRESHOLD = 8;
var RESIZE_DEBOUNCE_DELAY = 250;

// <stdin>
init_dom();

// ns-hugo-imp:C:\Users\maxim\Documents\Dev\arsrepairs.com\themes\arsrepairs-theme\assets\ts\modules\navigation.ts
init_dom();
var flattenNavGroups = () => {
  if (!isMobile()) return;
  const dropdownMenus = document.querySelectorAll(".dropdown-menu");
  dropdownMenus.forEach((menu) => {
    const dropdownLinks = menu.querySelector(".dropdown-links");
    if (!dropdownLinks) return;
    const groups = dropdownLinks.querySelectorAll(".dropdown-group");
    if (groups.length === 0) return;
    groups.forEach((group) => {
      const links = group.querySelectorAll(".dropdown-link");
      links.forEach((link) => {
        dropdownLinks.appendChild(link);
      });
      group.remove();
    });
  });
};
var initNav = () => {
  const nav = document.querySelector("[data-site-nav]");
  const toggleBtn = document.querySelector("[data-nav-toggle]");
  if (!nav || !toggleBtn) return;
  flattenNavGroups();
  const toggle = () => {
    const isOpen = toggleBtn.getAttribute("aria-expanded") === "true";
    toggleBtn.setAttribute("aria-expanded", (!isOpen).toString());
    nav.classList.toggle("is-open", !isOpen);
  };
  toggleBtn.addEventListener("click", (event) => {
    event.preventDefault();
    toggle();
  });
  const dropdownItems = nav.querySelectorAll(".nav-item--dropdown");
  const setDropdownHeight = (dropdownMenu) => {
    if (!isMobile()) return;
    const siteNav = nav;
    if (siteNav) {
      dropdownMenu.style.position = "fixed";
      dropdownMenu.style.left = "0";
      dropdownMenu.style.right = "0";
      dropdownMenu.style.width = "100%";
    }
  };
  const closeDropdown = (dropdownMenu, dropdownArrow) => {
    dropdownMenu.classList.remove("is-open");
    if (isMobile()) {
      dropdownMenu.style.position = "";
      dropdownMenu.style.top = "";
      dropdownMenu.style.height = "";
      dropdownMenu.style.left = "";
      dropdownMenu.style.right = "";
      dropdownMenu.style.width = "";
    }
    if (dropdownArrow) {
      dropdownArrow.style.transform = "rotate(0deg)";
    }
  };
  dropdownItems.forEach((item) => {
    const dropdownLink = item.querySelector(".nav-link");
    const dropdownMenu = item.querySelector(".dropdown-menu");
    const dropdownArrow = item.querySelector(".dropdown-arrow");
    const dropdownClose = dropdownMenu?.querySelector("[data-dropdown-close]");
    if (!dropdownLink || !dropdownMenu) return;
    if (dropdownClose) {
      dropdownClose.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        closeDropdown(dropdownMenu, dropdownArrow);
      });
    }
    const handleDropdownToggle = (event) => {
      if (isMobile()) {
        event.preventDefault();
        event.stopPropagation();
        const isOpen = dropdownMenu.classList.contains("is-open");
        dropdownMenu.classList.toggle("is-open");
        if (!isOpen) {
          setDropdownHeight(dropdownMenu);
        } else {
          dropdownMenu.style.position = "";
          dropdownMenu.style.top = "";
          dropdownMenu.style.height = "";
          dropdownMenu.style.left = "";
          dropdownMenu.style.right = "";
          dropdownMenu.style.width = "";
        }
        if (dropdownArrow) {
          dropdownArrow.style.transform = isOpen ? "rotate(0deg)" : "rotate(180deg)";
        }
      }
    };
    dropdownLink.addEventListener("click", handleDropdownToggle);
    dropdownMenu.querySelectorAll("a").forEach((childLink) => {
      childLink.addEventListener("click", () => {
        toggleBtn.setAttribute("aria-expanded", "false");
        nav.classList.remove("is-open");
        closeDropdown(dropdownMenu, dropdownArrow);
      });
    });
  });
  nav.querySelectorAll("a").forEach((link) => {
    if (link.closest(".nav-item--dropdown")?.querySelector(".nav-link") === link) return;
    if (link.closest(".dropdown-menu")) return;
    link.addEventListener("click", () => {
      toggleBtn.setAttribute("aria-expanded", "false");
      nav.classList.remove("is-open");
    });
  });
};
var initDropdownHover = () => {
  if (window.innerWidth <= 1280) return;
  const dropdownItems = document.querySelectorAll(".nav-item--dropdown");
  const centerGroupedDropdown = (dropdownItem, dropdownMenu) => {
    const hasGroups = dropdownMenu.querySelector(".dropdown-links > .dropdown-group");
    if (!hasGroups) return;
    const updatePosition = () => {
      if (window.innerWidth <= 1400) {
        dropdownMenu.style.left = "";
        return;
      }
      const rect = dropdownItem.getBoundingClientRect();
      const viewportCenter = window.innerWidth / 2;
      const parentCenter = rect.left + rect.width / 2;
      const offset = viewportCenter - parentCenter;
      dropdownMenu.style.left = `calc(50% + ${offset}px)`;
    };
    const handleShow = () => {
      updatePosition();
      window.addEventListener("scroll", updatePosition, { passive: true });
      window.addEventListener("resize", updatePosition, { passive: true });
    };
    const handleHide = () => {
      window.removeEventListener("scroll", updatePosition);
      window.removeEventListener("resize", updatePosition);
    };
    dropdownItem.addEventListener("mouseenter", handleShow);
    dropdownItem.addEventListener("focusin", handleShow);
    dropdownItem.addEventListener("mouseleave", handleHide);
    dropdownItem.addEventListener("focusout", (e) => {
      if (!dropdownItem.contains(e.relatedTarget)) handleHide();
    });
  };
  dropdownItems.forEach((dropdownItem) => {
    const dropdownMenu = dropdownItem.querySelector(".dropdown-menu");
    const dropdownLinks = dropdownItem.querySelectorAll(".dropdown-link");
    const featureImage = dropdownItem.querySelector(".dropdown-feature-image");
    const featureTitle = dropdownItem.querySelector(".dropdown-feature-title");
    const featureText = dropdownItem.querySelector(".dropdown-feature-text");
    const featureLink = dropdownItem.querySelector(".dropdown-feature-body .btn");
    if (!dropdownMenu) return;
    centerGroupedDropdown(dropdownItem, dropdownMenu);
    if (!featureImage) return;
    const defaultImage = featureImage.getAttribute("data-default-image") || featureImage.src;
    const defaultTitle = featureTitle?.getAttribute("data-default-title") || featureTitle?.textContent || "";
    const defaultText = featureText?.getAttribute("data-default-text") || featureText?.textContent || "";
    const defaultLink = featureLink?.getAttribute("data-default-link") || featureLink?.href || "";
    const defaultButtonDisplay = featureLink ? window.getComputedStyle(featureLink).display : "";
    let resetTimeoutId = null;
    const resetFeature = () => {
      if (featureImage && defaultImage) {
        featureImage.style.opacity = "0";
        setTimeout(() => {
          featureImage.src = defaultImage;
          featureImage.onload = () => featureImage.style.opacity = "1";
          setTimeout(() => featureImage.style.opacity = "1", 100);
        }, 150);
      }
      if (featureTitle) featureTitle.textContent = defaultTitle;
      if (featureText) featureText.textContent = defaultText;
      if (featureLink && defaultLink) {
        featureLink.href = defaultLink;
        if (defaultButtonDisplay) featureLink.style.display = defaultButtonDisplay;
      }
    };
    const scheduleReset = () => {
      if (resetTimeoutId) {
        clearTimeout(resetTimeoutId);
        resetTimeoutId = null;
      }
      resetTimeoutId = setTimeout(() => {
        resetFeature();
        resetTimeoutId = null;
      }, 3e3);
    };
    const cancelReset = () => {
      if (resetTimeoutId) {
        clearTimeout(resetTimeoutId);
        resetTimeoutId = null;
      }
    };
    dropdownLinks.forEach((link) => {
      const ogImage = link.getAttribute("data-og-image");
      const featureTitleText = link.getAttribute("data-feature-title");
      const featureTextContent = link.getAttribute("data-feature-text");
      if (!ogImage) return;
      const updateFeature = () => {
        cancelReset();
        if (featureImage && ogImage) {
          featureImage.style.opacity = "0";
          setTimeout(() => {
            featureImage.src = ogImage;
            featureImage.onload = () => featureImage.style.opacity = "1";
            setTimeout(() => featureImage.style.opacity = "1", 100);
          }, 150);
        }
        if (featureTitle && featureTitleText) featureTitle.textContent = featureTitleText;
        if (featureText && featureTextContent) featureText.textContent = featureTextContent;
        if (featureLink) {
          featureLink.href = link.href;
          featureLink.style.display = "none";
        }
      };
      link.addEventListener("mouseenter", updateFeature);
      link.addEventListener("focus", updateFeature);
      link.addEventListener("mouseleave", scheduleReset);
      link.addEventListener("blur", () => {
        if (!dropdownItem.contains(document.activeElement)) scheduleReset();
      });
    });
    dropdownMenu.addEventListener("mouseenter", cancelReset);
    dropdownMenu.addEventListener("mouseleave", scheduleReset);
    dropdownMenu.addEventListener("focusout", (e) => {
      if (!dropdownMenu.contains(e.relatedTarget)) scheduleReset();
    });
  });
};
var resetDropdowns = () => {
  document.querySelectorAll(".nav-item--dropdown").forEach((item) => {
    const menu = item.querySelector(".dropdown-menu");
    const arrow = item.querySelector(".dropdown-arrow");
    if (menu) {
      menu.classList.remove("is-open");
      menu.style.position = "";
      menu.style.top = "";
      menu.style.height = "";
      menu.style.left = "";
      menu.style.right = "";
      menu.style.width = "";
    }
    if (arrow) arrow.style.transform = "";
  });
};

// ns-hugo-imp:C:\Users\maxim\Documents\Dev\arsrepairs.com\themes\arsrepairs-theme\assets\ts\modules\header.ts
init_dom();

// ns-hugo-imp:C:\Users\maxim\Documents\Dev\arsrepairs.com\themes\arsrepairs-theme\assets\ts\utils\logger.ts
function isDevelopment() {
  if (typeof window === "undefined") return false;
  const hostname = window.location.hostname;
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]" || hostname.startsWith("192.168.") || hostname.startsWith("10.") || hostname.endsWith(".local");
}
var logger = {
  /**
   * Log message (development only)
   * Use for debugging and development information
   */
  log: (...args) => {
    if (isDevelopment()) {
      console.log(...args);
    }
  },
  /**
   * Log error (always logged)
   * Errors should always be visible for debugging production issues
   */
  error: (...args) => {
    console.error(...args);
  },
  /**
   * Log warning (development only)
   * Use for non-critical warnings during development
   */
  warn: (...args) => {
    if (isDevelopment()) {
      console.warn(...args);
    }
  },
  /**
   * Log info (development only)
   * Use for informational messages
   */
  info: (...args) => {
    if (isDevelopment()) {
      console.info(...args);
    }
  },
  /**
   * Log debug (development only)
   * Use for detailed debugging information
   */
  debug: (...args) => {
    if (isDevelopment()) {
      console.debug(...args);
    }
  },
  /**
   * Check if logging is enabled
   * Useful for conditional logging logic
   */
  isEnabled: () => isDevelopment()
};

// ns-hugo-imp:C:\Users\maxim\Documents\Dev\arsrepairs.com\themes\arsrepairs-theme\assets\ts\utils\geolocation.ts
var getAccurateCity = async () => {
  try {
    const pageHeader = document.querySelector(".page-header");
    const rawData = pageHeader?.getAttribute("data-geolocation");
    if (!rawData || rawData.trim() === "" || rawData === "{}") {
      logger.warn("Geolocation: No data from server-side proxy");
      return null;
    }
    const data = JSON.parse(rawData);
    let detectedCity = data.city?.trim();
    if (!detectedCity || data.confidence?.city === 0) {
      const adminLevels = data.localityInfo?.administrative;
      if (adminLevels && adminLevels.length > 0) {
        detectedCity = adminLevels.find((l) => l.order === 1)?.name || adminLevels.find((l) => l.order === 0)?.name || adminLevels[0]?.name;
      }
    }
    return detectedCity || null;
  } catch (err) {
    logger.warn("Geolocation parsing failed:", err);
    return null;
  }
};
var parseCitiesFromData = (dataAttr) => {
  if (!dataAttr) return [];
  try {
    const parsed = JSON.parse(dataAttr);
    if (Array.isArray(parsed)) {
      return parsed.filter((c) => typeof c === "string" && c.trim() !== "");
    }
  } catch {
  }
  return [];
};
var normalizeCity = (city) => {
  return city?.trim().toLowerCase().replace(/\s+/g, " ") || "";
};
var isKnownCity = (city, knownCities) => {
  if (!city) return false;
  const norm = normalizeCity(city);
  return knownCities.some((known) => normalizeCity(known) === norm);
};
var getCityName = (city, knownCities) => {
  if (!city) return null;
  const norm = normalizeCity(city);
  return knownCities.find((known) => normalizeCity(known) === norm) || null;
};
var getProvinceState = async () => {
  try {
    const pageHeader = document.querySelector(".page-header");
    const rawData = pageHeader?.getAttribute("data-geolocation");
    if (!rawData || rawData.trim() === "" || rawData === "{}") {
      return null;
    }
    const data = JSON.parse(rawData);
    const region = data.region?.name?.trim();
    return region || null;
  } catch (err) {
    logger.warn("Province/State parsing failed:", err);
    return null;
  }
};

// ns-hugo-imp:C:\Users\maxim\Documents\Dev\arsrepairs.com\themes\arsrepairs-theme\assets\ts\modules\header.ts
var initHeaderShadow = () => {
  const header = document.querySelector(".site-header");
  if (!header) return;
  const apply = () => header.classList.toggle("has-shadow", window.scrollY > SCROLL_SHADOW_THRESHOLD);
  apply();
  document.addEventListener("scroll", apply, { passive: true });
};

// ns-hugo-imp:C:\Users\maxim\Documents\Dev\arsrepairs.com\themes\arsrepairs-theme\assets\ts\modules\phone-links.ts
var initPhoneLinks = () => {
  const phone = document.body.dataset[PHONE_DATA_ATTR];
  if (!phone) return;
  const telHref = `tel:${phone.replace(/[^0-9+]/g, "")}`;
  document.querySelectorAll("[data-phone-link]").forEach((link) => {
    if (!link.textContent?.trim()) link.textContent = phone;
    link.href = telHref;
  });
};

// ns-hugo-imp:C:\Users\maxim\Documents\Dev\arsrepairs.com\themes\arsrepairs-theme\assets\ts\modules\year-stamp.ts
var initYearStamp = () => {
  const el = document.querySelector("[data-current-year]");
  if (el) el.textContent = (/* @__PURE__ */ new Date()).getFullYear().toString();
};

// ns-hugo-imp:C:\Users\maxim\Documents\Dev\arsrepairs.com\themes\arsrepairs-theme\assets\ts\utils\city-personalization.ts
var FALLBACK_CITY = "Miami";
var initGeolocationShortcodes = () => {
  const pageHeader = document.querySelector(".page-header");
  if (!pageHeader) return;
  const isDev = location.hostname === "localhost" || location.hostname === "127.0.0.1";
  const citiesDataAttr = pageHeader.getAttribute("data-cities");
  const knownCities = parseCitiesFromData(citiesDataAttr);
  const updateShortcodes = (detectedCity) => {
    const shortcodes = document.querySelectorAll(".geolocation-shortcode");
    shortcodes.forEach((shortcode) => {
      const cityEl = shortcode.querySelector(".geolocation-shortcode__city");
      if (!cityEl) return;
      const requestedCity = shortcode.getAttribute("data-geo-detected") || "";
      const fallbackText = shortcode.getAttribute("data-geo-fallback") || FALLBACK_CITY;
      let finalCity = fallbackText;
      if (requestedCity) {
        if (detectedCity) {
          const normalizedDetected = normalizeCity(detectedCity);
          const normalizedRequested = normalizeCity(requestedCity);
          if (normalizedDetected === normalizedRequested) {
            finalCity = getCityName(detectedCity, knownCities) || requestedCity;
          } else if (isKnownCity(detectedCity, knownCities)) {
            finalCity = getCityName(detectedCity, knownCities) || fallbackText;
          }
        }
      } else {
        if (detectedCity && isKnownCity(detectedCity, knownCities)) {
          finalCity = getCityName(detectedCity, knownCities) || fallbackText;
        }
      }
      cityEl.textContent = finalCity;
    });
    if (isDev && shortcodes.length > 0) {
      console.log("Geolocation Shortcodes \u2192", { detected: detectedCity, updated: shortcodes.length });
    }
  };
  const updateProvinceShortcodes = (detectedProvince) => {
    const shortcodes = document.querySelectorAll(".geostate-province-shortcode");
    shortcodes.forEach((shortcode) => {
      const provinceEl = shortcode.querySelector(".geostate-province-shortcode__province");
      if (!provinceEl) return;
      const fallbackText = shortcode.getAttribute("data-geo-fallback") || "Florida";
      const finalProvince = detectedProvince || fallbackText;
      provinceEl.textContent = finalProvince;
    });
    if (isDev && shortcodes.length > 0) {
      console.log("Province/State Shortcodes \u2192", { detected: detectedProvince, updated: shortcodes.length });
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
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", detectAndUpdate);
  } else {
    detectAndUpdate();
  }
};
var initPageHeaderCityPersonalization = () => {
  const pageHeader = document.querySelector(".page-header");
  if (!pageHeader) return;
  const isDev = location.hostname === "localhost" || location.hostname === "127.0.0.1";
  const citiesDataAttr = pageHeader.getAttribute("data-cities");
  const knownCities = parseCitiesFromData(citiesDataAttr);
  const updateHeader = (detectedCity) => {
    const titleEl = document.querySelector(".page-header__title[data-base-title]");
    const taglineEl = document.querySelector(".page-header__tagline[data-base-tagline]");
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
      console.log("City Personalization \u2192", { detected: detectedCity, final: finalCity });
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
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", detectAndUpdate);
  } else {
    detectAndUpdate();
  }
};

// ns-hugo-imp:C:\Users\maxim\Documents\Dev\arsrepairs.com\themes\arsrepairs-theme\assets\ts\modules\services-auto-scroll.ts
var SCROLL_SPEED = 0.5;
var animationFrameId = null;
var isPaused = false;
var isUserScrolling = false;
var isProgrammaticScroll = false;
var userScrollTimeout = null;
var servicesGrid = null;
var isInitialized = false;
var originalContentWidth = 0;
var isDesktopLayout = false;
var resizeTimeout = null;
var isResizeListenerAttached = false;
var isDesktop = () => window.innerWidth > MOBILE_BREAKPOINT;
var resetScrollPosition = () => {
  if (!servicesGrid || originalContentWidth === 0) return;
  if (servicesGrid.scrollLeft >= originalContentWidth) {
    isProgrammaticScroll = true;
    servicesGrid.scrollLeft = servicesGrid.scrollLeft - originalContentWidth;
    requestAnimationFrame(() => {
      isProgrammaticScroll = false;
    });
  }
};
var scrollFrame = () => {
  if (!servicesGrid || isPaused || isUserScrolling) {
    animationFrameId = null;
    return;
  }
  const scrollWidth = servicesGrid.scrollWidth;
  const clientWidth = servicesGrid.clientWidth;
  const maxScroll = scrollWidth - clientWidth;
  if (maxScroll <= 0) {
    animationFrameId = null;
    return;
  }
  isProgrammaticScroll = true;
  servicesGrid.scrollLeft += SCROLL_SPEED;
  resetScrollPosition();
  requestAnimationFrame(() => {
    isProgrammaticScroll = false;
  });
  animationFrameId = requestAnimationFrame(scrollFrame);
};
var startAutoScroll = () => {
  if (animationFrameId !== null) return;
  isPaused = false;
  animationFrameId = requestAnimationFrame(scrollFrame);
};
var stopAutoScroll = () => {
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
};
var handleMouseEnter = () => {
  isPaused = true;
  stopAutoScroll();
};
var handleMouseLeave = () => {
  if (!isUserScrolling) {
    isPaused = false;
    startAutoScroll();
  }
};
var handleTouchStart = () => {
  isPaused = true;
  stopAutoScroll();
};
var handleTouchEnd = () => {
  setTimeout(() => {
    if (!isUserScrolling) {
      isPaused = false;
      startAutoScroll();
    }
  }, 100);
};
var handleUserScroll = () => {
  if (isProgrammaticScroll) {
    resetScrollPosition();
    return;
  }
  isUserScrolling = true;
  stopAutoScroll();
  resetScrollPosition();
  if (userScrollTimeout) {
    clearTimeout(userScrollTimeout);
  }
  userScrollTimeout = setTimeout(() => {
    isUserScrolling = false;
    if (!isPaused) {
      startAutoScroll();
    }
  }, 2e3);
};
var duplicateContent = () => {
  if (!servicesGrid) return;
  const serviceItems = servicesGrid.querySelectorAll(".service-item");
  if (serviceItems.length === 0) return;
  originalContentWidth = servicesGrid.scrollWidth;
  const clientWidth = servicesGrid.clientWidth;
  if (originalContentWidth <= clientWidth) {
    originalContentWidth = 0;
    return;
  }
  serviceItems.forEach((item) => {
    const clone = item.cloneNode(true);
    servicesGrid.appendChild(clone);
  });
};
var cleanup = () => {
  stopAutoScroll();
  if (userScrollTimeout) {
    clearTimeout(userScrollTimeout);
    userScrollTimeout = null;
  }
  if (servicesGrid && isInitialized) {
    servicesGrid.removeEventListener("mouseenter", handleMouseEnter);
    servicesGrid.removeEventListener("mouseleave", handleMouseLeave);
    servicesGrid.removeEventListener("touchstart", handleTouchStart);
    servicesGrid.removeEventListener("touchend", handleTouchEnd);
    servicesGrid.removeEventListener("scroll", handleUserScroll);
    const serviceItems = servicesGrid.querySelectorAll(".service-item");
    const originalCount = serviceItems.length / 2;
    if (originalCount > 0) {
      for (let i = serviceItems.length - 1; i >= originalCount; i--) {
        serviceItems[i].remove();
      }
    }
  }
  isInitialized = false;
  isPaused = false;
  isUserScrolling = false;
  originalContentWidth = 0;
  servicesGrid = null;
};
var handleResize = () => {
  if (resizeTimeout) {
    clearTimeout(resizeTimeout);
  }
  resizeTimeout = setTimeout(() => {
    const nowDesktop = isDesktop();
    if (nowDesktop !== isDesktopLayout) {
      cleanup();
      if (nowDesktop) {
        initServicesAutoScroll();
      }
    }
    isDesktopLayout = nowDesktop;
  }, 150);
};
var initServicesAutoScroll = () => {
  if (isInitialized) {
    cleanup();
  }
  if (!isDesktop()) {
    isDesktopLayout = false;
    return;
  }
  isDesktopLayout = true;
  servicesGrid = document.querySelector(".services-grid");
  if (!servicesGrid) return;
  duplicateContent();
  servicesGrid.addEventListener("mouseenter", handleMouseEnter);
  servicesGrid.addEventListener("mouseleave", handleMouseLeave);
  servicesGrid.addEventListener("touchstart", handleTouchStart, { passive: true });
  servicesGrid.addEventListener("touchend", handleTouchEnd, { passive: true });
  servicesGrid.addEventListener("scroll", handleUserScroll, { passive: true });
  isInitialized = true;
  startAutoScroll();
  if (!isResizeListenerAttached) {
    window.addEventListener("resize", handleResize, { passive: true });
    isResizeListenerAttached = true;
  }
};

// ns-hugo-imp:C:\Users\maxim\Documents\Dev\arsrepairs.com\themes\arsrepairs-theme\assets\ts\modules\page-list.ts
init_dom();

// ns-hugo-imp:C:\Users\maxim\Documents\Dev\arsrepairs.com\themes\arsrepairs-theme\assets\ts\utils\file-system.ts
var siteRootDirectoryHandle = null;
async function requestSiteRootAccess(onSuccess, onError) {
  if (!("showDirectoryPicker" in window)) {
    const msg = "File System Access API not supported. Falling back to backend API.";
    console.warn(msg);
    onError?.(msg);
    return null;
  }
  try {
    console.log("Requesting directory access...");
    const handle = await window.showDirectoryPicker({
      startIn: "documents",
      mode: "readwrite"
    });
    console.log("Directory selected, verifying content folder...");
    try {
      await handle.getDirectoryHandle("content", { create: false });
      console.log("\u2705 Content directory found!");
      siteRootDirectoryHandle = handle;
      const msg = "Directory access granted! You can now update source files.";
      onSuccess?.(msg);
      return handle;
    } catch (contentError) {
      console.error('\u274C Selected directory does not contain a "content" folder');
      const msg = 'Selected directory does not contain a "content" folder. Please select your Hugo site root directory.';
      onError?.(msg);
      return null;
    }
  } catch (error) {
    if (error.name === "AbortError") {
      console.log("User cancelled directory selection");
      onError?.("Directory selection cancelled.");
    } else {
      console.error("Error accessing directory:", error);
      const msg = `Error accessing directory: ${error instanceof Error ? error.message : "Unknown error"}`;
      onError?.(msg);
    }
    return null;
  }
}
function getSiteRootDirectoryHandle() {
  return siteRootDirectoryHandle;
}
function setSiteRootDirectoryHandle(handle) {
  siteRootDirectoryHandle = handle;
}
async function readFileContent(filePath, verbose = false) {
  try {
    if (siteRootDirectoryHandle) {
      try {
        const pathParts = filePath.replace(/^content\//, "").split("/");
        let currentHandle = siteRootDirectoryHandle;
        if (verbose) {
          console.log(`Attempting to read via File System Access API: ${filePath}`);
          console.log(`Path parts:`, pathParts);
        }
        try {
          currentHandle = await currentHandle.getDirectoryHandle("content");
          if (verbose) console.log("\u2705 Found content directory");
        } catch (contentError) {
          if (verbose) {
            console.error("\u274C Could not access content directory:", contentError);
            console.error('   Make sure you selected the correct site root folder (the one containing the "content" folder)');
          }
          throw contentError;
        }
        for (let i = 0; i < pathParts.length - 1; i++) {
          if (pathParts[i]) {
            try {
              currentHandle = await currentHandle.getDirectoryHandle(pathParts[i]);
              if (verbose) console.log(`\u2705 Navigated to: ${pathParts[i]}`);
            } catch (dirError) {
              if (verbose) {
                console.error(`\u274C Could not access directory: ${pathParts[i]}`, dirError);
                console.error(`   Path so far: content/${pathParts.slice(0, i).join("/")}`);
                console.error(`   The directory "${pathParts[i]}" may not exist or you may not have access to it.`);
              }
              throw dirError;
            }
          }
        }
        const fileName = pathParts[pathParts.length - 1];
        if (fileName) {
          try {
            const fileHandle = await currentHandle.getFileHandle(fileName);
            const file = await fileHandle.getFile();
            const content = await file.text();
            if (verbose) console.log(`\u2705 Successfully read file via File System Access API: ${filePath}`);
            return { content, lineNumber: 0, actualPath: filePath };
          } catch (fileError) {
            if (verbose) {
              console.error(`\u274C Could not access file: ${fileName}`, fileError);
              const fullPath = `content/${pathParts.join("/")}`;
              console.error(`   Full path attempted: ${fullPath}`);
              console.error(`   The file may not exist, or there may be a case sensitivity issue.`);
            }
            throw fileError;
          }
        }
      } catch (fsError) {
        if (verbose) console.debug(`File System Access API not available for ${filePath}, trying fallback methods`);
      }
    } else {
      if (verbose) console.debug(`File System Access API not available (siteRootDirectoryHandle is null)`);
    }
    if (!filePath.startsWith("content/")) {
      try {
        if (verbose) console.debug(`Trying HTTP fetch for: ${filePath}`);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1e3);
        const response = await fetch(`/${filePath}`, {
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        if (response.ok) {
          const content = await response.text();
          if (verbose) console.log(`\u2705 Read file via HTTP fetch: ${filePath}`);
          return { content, lineNumber: 0, actualPath: filePath };
        }
      } catch (fetchError) {
        if (verbose && fetchError.name !== "AbortError" && fetchError.name !== "TypeError" && !fetchError.message?.includes("fetch")) {
          console.debug(`Could not fetch ${filePath} from server:`, fetchError);
        }
      }
    }
    if (verbose) {
      console.debug(`Could not read file ${filePath} using any method (this is expected when trying multiple paths)`);
    }
    return null;
  } catch (error) {
    if (verbose) {
      console.error(`Unexpected error reading file ${filePath}:`, error);
    }
    return null;
  }
}
async function writeFileContent(filePath, content) {
  try {
    if (siteRootDirectoryHandle) {
      const pathParts = filePath.replace(/^content\//, "").split("/");
      let currentHandle = siteRootDirectoryHandle;
      currentHandle = await currentHandle.getDirectoryHandle("content");
      for (let i = 0; i < pathParts.length - 1; i++) {
        try {
          currentHandle = await currentHandle.getDirectoryHandle(pathParts[i]);
        } catch {
          currentHandle = await currentHandle.getDirectoryHandle(pathParts[i], { create: true });
        }
      }
      const fileName = pathParts[pathParts.length - 1];
      const fileHandle = await currentHandle.getFileHandle(fileName, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(content);
      await writable.close();
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Error writing file ${filePath}:`, error);
    return false;
  }
}
async function findActualFilePath(possiblePaths, verbose = false) {
  const hasDirectoryAccess = getSiteRootDirectoryHandle() !== null;
  if (verbose && !hasDirectoryAccess) {
    console.warn("\u26A0\uFE0F File System Access API not available. Cannot read files without directory access.");
    console.info("\u{1F4A1} Tip: Grant directory access when prompted to enable file operations.");
  }
  for (let i = 0; i < possiblePaths.length; i++) {
    const path = possiblePaths[i];
    if (verbose) {
      console.log(`[${i + 1}/${possiblePaths.length}] Trying to find file at: ${path}`);
    }
    const fileData = await readFileContent(path, verbose && i === 0);
    if (fileData) {
      if (verbose) {
        console.log(`\u2705 Found file at: ${fileData.actualPath} (attempt ${i + 1}/${possiblePaths.length})`);
      }
      return fileData.actualPath;
    } else {
      if (verbose && (i === 0 || i === possiblePaths.length - 1)) {
        console.debug(`File not found at: ${path}${i < possiblePaths.length - 1 ? ", trying next path..." : ""}`);
      }
    }
  }
  if (verbose) {
    if (!hasDirectoryAccess) {
      console.warn(`\u274C Could not find file in any of the ${possiblePaths.length} possible paths.`);
      console.warn(`   File System Access API is not available. Please grant directory access to enable file operations.`);
      console.info(`   Tried paths:`, possiblePaths);
    } else {
      console.warn(`\u274C Could not find file in any of the ${possiblePaths.length} possible paths:`, possiblePaths);
      console.info(`   The file may not exist at these locations, or the directory structure may be different.`);
    }
  }
  return null;
}
function createBackupFilename(originalPath) {
  const now = /* @__PURE__ */ new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, "-").replace("T", "-").slice(0, -5);
  return `${originalPath}.backup-${timestamp}`;
}
function relPermalinkToContentFile(relPermalink) {
  let path = relPermalink.replace(/^\/|\/$/g, "");
  if (!path) {
    return ["content/_index.md"];
  }
  const possiblePaths = [];
  possiblePaths.push(`content/${path}.md`);
  possiblePaths.push(`content/${path}/_index.md`);
  possiblePaths.push(`content/${path}/index.md`);
  const parts = path.split("/");
  if (parts.length > 1) {
    const section = parts[0];
    const name = parts.slice(1).join("/");
    possiblePaths.push(`content/${section}/${name}.md`);
    possiblePaths.push(`content/${section}/${name}/_index.md`);
  }
  return [...new Set(possiblePaths)];
}
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function removeLinkFromContent(content, url) {
  let modifiedContent = content;
  const changes = [];
  const urlNoFragment = url.split("#")[0];
  const urlNoSlash = urlNoFragment.replace(/\/$/, "");
  const urlWithSlash = urlNoSlash + "/";
  const urlVariations = [
    url,
    // Original
    urlNoFragment,
    // Without fragment
    urlNoSlash,
    // Without trailing slash
    urlWithSlash
    // With trailing slash
  ];
  const escapedUrl = escapeRegex(url);
  const markdownPattern = new RegExp(`\\[([^\\]]+)\\]\\(${escapedUrl}[^)]*\\)`, "g");
  const markdownMatches = [];
  let match;
  while ((match = markdownPattern.exec(content)) !== null) {
    markdownMatches.push({
      index: match.index,
      match: match[0],
      text: match[1]
    });
  }
  for (let i = markdownMatches.length - 1; i >= 0; i--) {
    const m = markdownMatches[i];
    const beforeMatch = modifiedContent.substring(0, m.index);
    const lineNumber = beforeMatch.split("\n").length;
    modifiedContent = beforeMatch + m.text + modifiedContent.substring(m.index + m.match.length);
    changes.push({ oldUrl: url, newUrl: "(removed)", lineNumber, text: m.text });
  }
  const htmlPattern = new RegExp(`<a[^>]+href=["']${escapedUrl}["'][^>]*>([^<]+)</a>`, "gi");
  const htmlMatches = [];
  while ((match = htmlPattern.exec(modifiedContent)) !== null) {
    htmlMatches.push({
      index: match.index,
      match: match[0],
      text: match[1]
    });
  }
  for (let i = htmlMatches.length - 1; i >= 0; i--) {
    const m = htmlMatches[i];
    const beforeMatch = modifiedContent.substring(0, m.index);
    const lineNumber = beforeMatch.split("\n").length;
    modifiedContent = beforeMatch + m.text + modifiedContent.substring(m.index + m.match.length);
    changes.push({ oldUrl: url, newUrl: "(removed)", lineNumber, text: m.text });
  }
  return { content: modifiedContent, changes };
}

// ns-hugo-imp:C:\Users\maxim\Documents\Dev\arsrepairs.com\themes\arsrepairs-theme\assets\ts\modules\page-list.ts
init_dev_ui();
init_keyword_research();

// ns-hugo-imp:C:\Users\maxim\Documents\Dev\arsrepairs.com\themes\arsrepairs-theme\assets\ts\modules\link-map.ts
init_dev_ui();
function getParentPath(url) {
  if (url === "/") return "/";
  const parts = url.split("/").filter((p) => p);
  if (parts.length === 0) return "/";
  return "/" + parts[0] + "/";
}
var colorCache = /* @__PURE__ */ new Map();
function getColorForSection(section, parentPath, index) {
  const colors = [
    "#4A90E2",
    // Blue
    "#50C878",
    // Green
    "#FF6B6B",
    // Red
    "#FFA500",
    // Orange
    "#9B59B6",
    // Purple
    "#1ABC9C",
    // Teal
    "#E74C3C",
    // Dark Red
    "#3498DB",
    // Light Blue
    "#2ECC71",
    // Light Green
    "#F39C12",
    // Dark Orange
    "#E67E22",
    // Brown
    "#16A085",
    // Dark Teal
    "#8E44AD",
    // Dark Purple
    "#34495E",
    // Dark Blue-Gray
    "#95A5A6",
    // Gray
    "#D35400"
    // Dark Orange
  ];
  const key = section || parentPath || "/";
  if (colorCache.has(key)) {
    return colorCache.get(key);
  }
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = key.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colorIndex = Math.abs(hash) % colors.length;
  const color = colors[colorIndex];
  colorCache.set(key, color);
  return color;
}
function buildTopicsGraphData(pages, links) {
  const nodes = [];
  const linkList = [];
  const nodeMap = /* @__PURE__ */ new Map();
  const colorMap = /* @__PURE__ */ new Map();
  const topicPages = /* @__PURE__ */ new Map();
  pages.forEach((page) => {
    const topics = page.topics || [];
    if (topics.length === 0) {
      const untaggedKey = "untagged";
      if (!topicPages.has(untaggedKey)) {
        topicPages.set(untaggedKey, []);
      }
      topicPages.get(untaggedKey).push(page);
    } else {
      topics.forEach((topic) => {
        if (!topicPages.has(topic)) {
          topicPages.set(topic, []);
        }
        topicPages.get(topic).push(page);
      });
    }
  });
  let colorIndex = 0;
  topicPages.forEach((_, topicKey) => {
    if (!colorMap.has(topicKey)) {
      colorMap.set(topicKey, getColorForSection(topicKey, "", colorIndex++));
    }
  });
  topicPages.forEach((pagesInTopic, topicKey) => {
    const topicNode = {
      id: `topic:${topicKey}`,
      title: topicKey === "untagged" ? "Untagged" : topicKey,
      url: `#topic:${topicKey}`,
      section: topicKey,
      parentPath: topicKey,
      inboundLinks: 0,
      outboundLinks: 0
    };
    nodes.push(topicNode);
    nodeMap.set(`topic:${topicKey}`, topicNode);
  });
  const topicLinks = /* @__PURE__ */ new Map();
  links.forEach((targetUrls, sourceUrl) => {
    const sourcePage = pages.find((p) => p.relPermalink === sourceUrl);
    if (!sourcePage) return;
    const sourceTopics = sourcePage.topics || [];
    const sourceTopicKeys = sourceTopics.length > 0 ? sourceTopics : ["untagged"];
    targetUrls.forEach((targetUrl) => {
      const targetPath = targetUrl.split("#")[0];
      const targetPage = pages.find((p) => p.relPermalink === targetPath);
      if (!targetPage) return;
      const targetTopics = targetPage.topics || [];
      const targetTopicKeys = targetTopics.length > 0 ? targetTopics : ["untagged"];
      sourceTopicKeys.forEach((sourceTopic) => {
        targetTopicKeys.forEach((targetTopic) => {
          if (sourceTopic !== targetTopic) {
            const sourceKey = `topic:${sourceTopic}`;
            const targetKey = `topic:${targetTopic}`;
            if (!topicLinks.has(sourceKey)) {
              topicLinks.set(sourceKey, /* @__PURE__ */ new Set());
            }
            topicLinks.get(sourceKey).add(targetKey);
          }
        });
      });
    });
  });
  topicLinks.forEach((targetTopics, sourceTopic) => {
    const sourceNode = nodeMap.get(sourceTopic);
    if (!sourceNode) return;
    sourceNode.outboundLinks = targetTopics.size;
    targetTopics.forEach((targetTopic) => {
      const targetNode = nodeMap.get(targetTopic);
      if (targetNode) {
        targetNode.inboundLinks++;
        linkList.push({
          source: sourceNode,
          target: targetNode
        });
      }
    });
  });
  return { nodes, links: linkList, colorMap };
}
function buildSectionGraphData(pages, links) {
  const nodes = [];
  const linkList = [];
  const nodeMap = /* @__PURE__ */ new Map();
  const colorMap = /* @__PURE__ */ new Map();
  const sectionPages = /* @__PURE__ */ new Map();
  pages.forEach((page) => {
    const section = page.section || "";
    const parentPath = getParentPath(page.relPermalink);
    const sectionKey = section || parentPath;
    if (!sectionPages.has(sectionKey)) {
      sectionPages.set(sectionKey, []);
    }
    sectionPages.get(sectionKey).push(page);
  });
  let colorIndex = 0;
  sectionPages.forEach((_, sectionKey) => {
    if (!colorMap.has(sectionKey)) {
      const parentPath = sectionKey.startsWith("/") ? sectionKey : getParentPath("/" + sectionKey + "/");
      colorMap.set(sectionKey, getColorForSection(sectionKey, parentPath, colorIndex++));
    }
  });
  sectionPages.forEach((pagesInSection, sectionKey) => {
    const sectionNode = {
      id: sectionKey,
      title: sectionKey === "/" ? "Home" : sectionKey || "Other",
      url: sectionKey,
      section: sectionKey,
      parentPath: sectionKey,
      inboundLinks: 0,
      outboundLinks: 0
    };
    nodes.push(sectionNode);
    nodeMap.set(sectionKey, sectionNode);
  });
  const sectionLinks = /* @__PURE__ */ new Map();
  links.forEach((targetUrls, sourceUrl) => {
    const sourcePage = pages.find((p) => p.relPermalink === sourceUrl);
    if (!sourcePage) return;
    const sourceSection = sourcePage.section || getParentPath(sourcePage.relPermalink);
    targetUrls.forEach((targetUrl) => {
      const targetPath = targetUrl.split("#")[0];
      const targetPage = pages.find((p) => p.relPermalink === targetPath);
      if (!targetPage) return;
      const targetSection = targetPage.section || getParentPath(targetPage.relPermalink);
      if (sourceSection !== targetSection) {
        if (!sectionLinks.has(sourceSection)) {
          sectionLinks.set(sourceSection, /* @__PURE__ */ new Set());
        }
        sectionLinks.get(sourceSection).add(targetSection);
      }
    });
  });
  sectionLinks.forEach((targetSections, sourceSection) => {
    const sourceNode = nodeMap.get(sourceSection);
    if (!sourceNode) return;
    sourceNode.outboundLinks = targetSections.size;
    targetSections.forEach((targetSection) => {
      const targetNode = nodeMap.get(targetSection);
      if (targetNode) {
        targetNode.inboundLinks++;
        linkList.push({
          source: sourceNode,
          target: targetNode
        });
      }
    });
  });
  return { nodes, links: linkList, colorMap };
}
function buildGraphData(pages, links) {
  const nodes = [];
  const linkList = [];
  const nodeMap = /* @__PURE__ */ new Map();
  const externalNodeMap = /* @__PURE__ */ new Map();
  const colorMap = /* @__PURE__ */ new Map();
  const sections = /* @__PURE__ */ new Set();
  pages.forEach((page) => {
    const section = page.section || "";
    const parentPath = getParentPath(page.relPermalink);
    sections.add(section || parentPath);
  });
  let colorIndex = 0;
  sections.forEach((section) => {
    if (!colorMap.has(section)) {
      const parentPath = section.startsWith("/") ? section : getParentPath("/" + section + "/");
      colorMap.set(section, getColorForSection(section, parentPath, colorIndex++));
    }
  });
  pages.forEach((page) => {
    const section = page.section || "";
    const parentPath = getParentPath(page.relPermalink);
    const sectionKey = section || parentPath;
    const node = {
      id: page.relPermalink,
      title: page.title,
      url: page.relPermalink,
      section,
      parentPath,
      inboundLinks: 0,
      outboundLinks: 0,
      isExternal: false
    };
    nodes.push(node);
    nodeMap.set(page.relPermalink, node);
    if (!colorMap.has(sectionKey)) {
      colorMap.set(sectionKey, getColorForSection(section, parentPath, colorIndex++));
    }
  });
  const externalLinksMap = extractExternalLinksFromPages(pages);
  externalLinksMap.forEach((externalUrls, sourceUrl) => {
    const sourceNode = nodeMap.get(sourceUrl);
    if (!sourceNode) return;
    externalUrls.forEach((externalUrl) => {
      let externalNode = externalNodeMap.get(externalUrl);
      if (!externalNode) {
        try {
          const urlObj = new URL(externalUrl);
          const domain = urlObj.hostname.replace("www.", "");
          externalNode = {
            id: `external:${externalUrl}`,
            title: domain,
            url: externalUrl,
            section: "external",
            parentPath: "external",
            inboundLinks: 0,
            outboundLinks: 0,
            isExternal: true
          };
          nodes.push(externalNode);
          externalNodeMap.set(externalUrl, externalNode);
        } catch (e) {
          return;
        }
      }
      externalNode.inboundLinks++;
      sourceNode.outboundLinks++;
      linkList.push({
        source: sourceNode,
        target: externalNode
      });
    });
  });
  links.forEach((targetUrls, sourceUrl) => {
    const sourceNode = nodeMap.get(sourceUrl);
    if (!sourceNode) return;
    const internalTargetUrls = targetUrls.filter((url) => {
      const path = url.split("#")[0];
      return nodeMap.has(path);
    });
    sourceNode.outboundLinks += internalTargetUrls.length;
    targetUrls.forEach((targetUrl) => {
      const targetPath = targetUrl.split("#")[0];
      const targetNode = nodeMap.get(targetPath);
      if (targetNode) {
        targetNode.inboundLinks++;
        linkList.push({
          source: sourceNode,
          target: targetNode
        });
      }
    });
  });
  return { nodes, links: linkList, colorMap };
}
function renderLinkMap(container, pages) {
  if (typeof window.d3 === "undefined") {
    const script = document.createElement("script");
    script.src = "https://d3js.org/d3.v7.min.js";
    script.onload = () => {
      initializeLinkMap(container, pages);
    };
    script.onerror = () => {
      container.innerHTML = `
        <div class="page-list-link-map__error">
          <p>Failed to load D3.js library. Please check your internet connection.</p>
        </div>
      `;
    };
    document.head.appendChild(script);
  } else {
    initializeLinkMap(container, pages);
  }
}
function initializeLinkMap(container, pages) {
  const d3 = window.d3;
  if (!pages || pages.length === 0) {
    container.innerHTML = `
      <div class="page-list-link-map__empty">
        <p>No pages yet\u2014add some!</p>
      </div>
    `;
    return;
  }
  const links = extractInternalLinksFromPages(pages);
  const pagesGraphData = buildGraphData(pages, links);
  const sectionsGraphData = buildSectionGraphData(pages, links);
  const topicsGraphData = buildTopicsGraphData(pages, links);
  let currentViewMode = "pages";
  let currentGraphData = pagesGraphData;
  let linkDirectionMode = "outbound";
  const totalLinks = pagesGraphData.links.length;
  const avgLinks = pages.length > 0 ? Math.round(totalLinks / pages.length * 10) / 10 : 0;
  const totalLinksEl = document.getElementById("page-list-link-map-total-links");
  const avgLinksEl = document.getElementById("page-list-link-map-avg-links");
  if (totalLinksEl) totalLinksEl.textContent = totalLinks.toString();
  if (avgLinksEl) avgLinksEl.textContent = avgLinks.toString();
  const buildLegendData = (viewMode) => {
    const legendData2 = [];
    if (viewMode === "topics") {
      const topicCounts = /* @__PURE__ */ new Map();
      pages.forEach((page) => {
        const topics = page.topics || [];
        if (topics.length === 0) {
          topicCounts.set("untagged", (topicCounts.get("untagged") || 0) + 1);
        } else {
          topics.forEach((topic) => {
            topicCounts.set(topic, (topicCounts.get(topic) || 0) + 1);
          });
        }
      });
      topicCounts.forEach((count, topic) => {
        const topicKey = `topic:${topic}`;
        const color = topicsGraphData.colorMap.get(topic) || "#f0f0f0";
        const label2 = topic === "untagged" ? "Untagged" : topic;
        legendData2.push({ label: label2, color, count, sectionKey: topicKey });
      });
    } else {
      const sectionCounts = /* @__PURE__ */ new Map();
      pagesGraphData.nodes.forEach((node2) => {
        const sectionKey = node2.section || node2.parentPath;
        sectionCounts.set(sectionKey, (sectionCounts.get(sectionKey) || 0) + 1);
      });
      sectionCounts.forEach((count, sectionKey) => {
        const color = pagesGraphData.colorMap.get(sectionKey) || "#f0f0f0";
        const label2 = sectionKey === "/" ? "Home" : sectionKey || "Other";
        legendData2.push({ label: label2, color, count, sectionKey });
      });
    }
    legendData2.sort((a, b) => b.count - a.count);
    return legendData2;
  };
  let legendData = buildLegendData(currentViewMode);
  container.innerHTML = `
    <div class="page-list-link-map">
      <div class="page-list-link-map__controls">
        <button class="page-list-link-map__control-btn" id="link-map-reset" aria-label="Reset zoom and pan">
          <span class="material-symbols-outlined">refresh</span>
          Reset View
        </button>
        <button class="page-list-link-map__control-btn" id="link-map-center" aria-label="Center graph">
          <span class="material-symbols-outlined">center_focus_strong</span>
          Center
        </button>
        <button class="page-list-link-map__control-btn" id="link-map-fit" aria-label="Fit to screen">
          <span class="material-symbols-outlined">fit_screen</span>
          Fit to Screen
        </button>
        <button class="page-list-link-map__control-btn" id="link-map-heatmap-toggle" aria-label="Toggle heatmap overlay">
          <span class="material-symbols-outlined">layers</span>
          Heatmap
        </button>
        <button class="page-list-link-map__control-btn" id="link-map-clear-focus" aria-label="Clear focus" style="display: none;">
          <span class="material-symbols-outlined">close</span>
          Clear Focus
        </button>
        <div class="page-list-link-map__link-direction-group">
          <button class="page-list-link-map__control-btn page-list-link-map__control-btn--active" id="link-map-link-direction-outbound" aria-label="Show outbound links only">
            <span class="material-symbols-outlined">arrow_forward</span>
            Outbound
          </button>
          <button class="page-list-link-map__control-btn" id="link-map-link-direction-inbound" aria-label="Show inbound links only">
            <span class="material-symbols-outlined">arrow_back</span>
            Inbound
          </button>
        </div>
        <div class="page-list-link-map__view-group">
          <button class="page-list-link-map__control-btn page-list-link-map__control-btn--active" id="link-map-view-pages" aria-label="View pages">
            <span class="material-symbols-outlined">article</span>
            Pages
          </button>
          <button class="page-list-link-map__control-btn" id="link-map-view-sections" aria-label="View sections">
            <span class="material-symbols-outlined">account_tree</span>
            Sections
          </button>
          <button class="page-list-link-map__control-btn" id="link-map-view-topics" aria-label="View topics">
            <span class="material-symbols-outlined">label</span>
            Topics
          </button>
        </div>
        <div class="page-list-link-map__search">
          <input 
            type="text" 
            class="page-list-link-map__search-input" 
            id="link-map-search" 
            placeholder="Search pages..."
            aria-label="Search pages in link map"
          />
        </div>
      </div>
      <div class="page-list-link-map__canvas-wrapper">
        <svg class="page-list-link-map__svg" id="link-map-svg"></svg>
        <div class="page-list-link-map__tooltip" id="link-map-tooltip"></div>
        <div class="page-list-link-map__heatmap-legend" id="link-map-heatmap-legend" style="display: none;">
          <div class="page-list-link-map__heatmap-legend-title">Connectivity</div>
          <div class="page-list-link-map__heatmap-legend-scale">
            <div class="page-list-link-map__heatmap-legend-gradient"></div>
            <div class="page-list-link-map__heatmap-legend-labels">
              <span>Low</span>
              <span>High</span>
            </div>
          </div>
        </div>
        <div class="page-list-link-map__focused-panel" id="link-map-focused-panel" style="display: none;">
          <div class="page-list-link-map__focused-panel-header">
            <h4 class="page-list-link-map__focused-panel-title" id="link-map-focused-title"></h4>
            <button class="page-list-link-map__focused-panel-close" id="link-map-focused-close" aria-label="Close panel">
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>
          <div class="page-list-link-map__focused-panel-content" id="link-map-focused-content"></div>
        </div>
      </div>
      <div class="page-list-link-map__legend">
        <h4 class="page-list-link-map__legend-title" id="link-map-legend-title">Sections (click to toggle)</h4>
        <div class="page-list-link-map__legend-items" id="link-map-legend-items">
          ${legendData.map((item) => `
            <label class="page-list-link-map__legend-item" data-section-key="${escapeHtml(item.sectionKey)}">
              <input type="checkbox" class="page-list-link-map__legend-checkbox" checked aria-label="Toggle ${escapeHtml(item.label)}">
              <span class="page-list-link-map__legend-color" style="background-color: ${item.color};"></span>
              <span class="page-list-link-map__legend-label">${escapeHtml(item.label)}</span>
              <span class="page-list-link-map__legend-count">(${item.count})</span>
            </label>
          `).join("")}
        </div>
      </div>
      <div class="page-list-link-map__stats">
        <div class="page-list-link-map__stat">
          <span class="page-list-link-map__stat-label" id="link-map-nodes-label">Pages:</span>
          <span class="page-list-link-map__stat-value" id="link-map-nodes-count">${currentGraphData.nodes.length}</span>
        </div>
        <div class="page-list-link-map__stat">
          <span class="page-list-link-map__stat-label">Links:</span>
          <span class="page-list-link-map__stat-value" id="link-map-links-count">${currentGraphData.links.length}</span>
        </div>
      </div>
    </div>
  `;
  const svg = d3.select("#link-map-svg");
  const tooltip = d3.select("#link-map-tooltip");
  const width = container.offsetWidth || 1200;
  const height = Math.max(600, window.innerHeight - 300);
  svg.attr("width", width).attr("height", height);
  const zoom = d3.zoom().scaleExtent([0.1, 4]).on("zoom", (event) => {
    g.attr("transform", event.transform);
  });
  svg.call(zoom);
  const g = svg.append("g");
  g.append("defs").append("marker").attr("id", "arrowhead").attr("viewBox", "0 -5 10 10").attr("refX", 30).attr("refY", 0).attr("markerWidth", 6).attr("markerHeight", 6).attr("orient", "auto").append("path").attr("d", "M0,-5L10,0L0,5").attr("fill", "#999");
  let simulation = d3.forceSimulation(currentGraphData.nodes).force("link", d3.forceLink(currentGraphData.links).id((d) => d.id).distance(25)).force("charge", d3.forceManyBody().strength(-60)).force("center", d3.forceCenter(width / 2, height / 2)).force("collision", d3.forceCollide().radius(35)).alphaDecay(0.0228).velocityDecay(0.4);
  let lastAlpha = 1;
  let stableTicks = 0;
  const getNodeColor = (node2) => {
    if (node2.isExternal) {
      return "#FF6B6B";
    }
    if (currentViewMode === "topics") {
      return currentGraphData.colorMap.get(node2.section) || "#f0f0f0";
    } else {
      const sectionKey = node2.section || node2.parentPath;
      return currentGraphData.colorMap.get(sectionKey) || "#f0f0f0";
    }
  };
  let focusedNode = null;
  const connectedNodeIds = /* @__PURE__ */ new Set();
  const rebuildConnectionMap = () => {
    const connectionMap2 = /* @__PURE__ */ new Map();
    const outboundMap2 = /* @__PURE__ */ new Map();
    const inboundMap2 = /* @__PURE__ */ new Map();
    currentGraphData.nodes.forEach((node2) => {
      connectionMap2.set(node2.id, /* @__PURE__ */ new Set());
      outboundMap2.set(node2.id, /* @__PURE__ */ new Set());
      inboundMap2.set(node2.id, /* @__PURE__ */ new Set());
    });
    currentGraphData.links.forEach((link2) => {
      const sourceId = typeof link2.source === "string" ? link2.source : link2.source.id;
      const targetId = typeof link2.target === "string" ? link2.target : link2.target.id;
      connectionMap2.get(sourceId)?.add(targetId);
      connectionMap2.get(targetId)?.add(sourceId);
      outboundMap2.get(sourceId)?.add(targetId);
      inboundMap2.get(targetId)?.add(sourceId);
    });
    return { connectionMap: connectionMap2, outboundMap: outboundMap2, inboundMap: inboundMap2 };
  };
  let { connectionMap, outboundMap, inboundMap } = rebuildConnectionMap();
  const findPageData = (nodeId) => {
    return pages.find((p) => p.relPermalink === nodeId) || null;
  };
  const updateFocusedPanel = (node2) => {
    const panel = document.getElementById("link-map-focused-panel");
    const titleEl = document.getElementById("link-map-focused-title");
    const contentEl = document.getElementById("link-map-focused-content");
    const heatmapLegend = document.getElementById("link-map-heatmap-legend");
    if (!panel || !titleEl || !contentEl) return;
    const pageData = findPageData(node2.id);
    titleEl.textContent = node2.title;
    let content = "";
    content += `
      <div class="page-list-link-map__focused-detail">
        <span class="page-list-link-map__focused-detail-label">URL:</span>
        <a href="${escapeHtml(node2.url)}" target="_blank" rel="noopener noreferrer" class="page-list-link-map__focused-detail-value">
          ${escapeHtml(node2.url)}
        </a>
      </div>
    `;
    if (node2.isExternal) {
      content += `
        <div class="page-list-link-map__focused-detail">
          <span class="page-list-link-map__focused-detail-label">Type:</span>
          <span class="page-list-link-map__focused-detail-value" style="color: #FF6B6B; font-weight: 600;">External Link</span>
        </div>
      `;
    }
    if (!node2.isExternal && node2.section) {
      content += `
        <div class="page-list-link-map__focused-detail">
          <span class="page-list-link-map__focused-detail-label">Section:</span>
          <span class="page-list-link-map__focused-detail-value">${escapeHtml(node2.section)}</span>
        </div>
      `;
    }
    if (!node2.isExternal && pageData && pageData.topics && pageData.topics.length > 0) {
      content += `
        <div class="page-list-link-map__focused-detail">
          <span class="page-list-link-map__focused-detail-label">Topics:</span>
          <span class="page-list-link-map__focused-detail-value">
            ${pageData.topics.map((t) => `<span class="page-list-link-map__focused-topic">${escapeHtml(t)}</span>`).join("")}
          </span>
        </div>
      `;
    }
    if (!node2.isExternal) {
      content += `
        <div class="page-list-link-map__focused-detail">
          <span class="page-list-link-map__focused-detail-label">Internal Links (Graph):</span>
          <span class="page-list-link-map__focused-detail-value">
            ${node2.inboundLinks} inbound, ${node2.outboundLinks} outbound
          </span>
        </div>
      `;
      const totalOutboundLinks = pageData?.outboundLinks || 0;
      const totalInternalLinks = pageData?.totalInternalLinks || pageData?.internalLinkCount || node2.outboundLinks;
      const externalLinks = Math.max(0, totalOutboundLinks - totalInternalLinks);
      if (totalOutboundLinks > 0) {
        const dofollowExternal = pageData?.dofollowOutboundLinks || 0;
        content += `
          <div class="page-list-link-map__focused-detail">
            <span class="page-list-link-map__focused-detail-label">External Links:</span>
            <span class="page-list-link-map__focused-detail-value">
              ${externalLinks}${dofollowExternal > 0 ? ` (${dofollowExternal} dofollow)` : ""}
            </span>
          </div>
        `;
      }
      if (totalOutboundLinks > 0) {
        content += `
          <div class="page-list-link-map__focused-detail">
            <span class="page-list-link-map__focused-detail-label">Total Outbound Links:</span>
            <span class="page-list-link-map__focused-detail-value">
              ${totalOutboundLinks} (${totalInternalLinks} internal, ${externalLinks} external)
            </span>
          </div>
        `;
      }
      const totalConnections = node2.inboundLinks + node2.outboundLinks;
      content += `
        <div class="page-list-link-map__focused-detail">
          <span class="page-list-link-map__focused-detail-label">Total Internal Connections:</span>
          <span class="page-list-link-map__focused-detail-value">${totalConnections}</span>
        </div>
      `;
      content += `
        <div class="page-list-link-map__focused-detail">
          <span class="page-list-link-map__focused-detail-label">Connected Nodes:</span>
          <span class="page-list-link-map__focused-detail-value">${connectedNodeIds.size}</span>
        </div>
      `;
      const linkDirectionLabel = linkDirectionMode === "outbound" ? "Outbound links only" : "Inbound links only";
      content += `
        <div class="page-list-link-map__focused-detail">
          <span class="page-list-link-map__focused-detail-label">View Mode:</span>
          <span class="page-list-link-map__focused-detail-value">${escapeHtml(linkDirectionLabel)}</span>
        </div>
      `;
    } else {
      content += `
        <div class="page-list-link-map__focused-detail">
          <span class="page-list-link-map__focused-detail-label">Linked From:</span>
          <span class="page-list-link-map__focused-detail-value">${node2.inboundLinks} page(s)</span>
        </div>
      `;
    }
    contentEl.innerHTML = content;
    panel.style.display = "block";
    requestAnimationFrame(() => {
      if (heatmapLegend && heatmapEnabled) {
        const panelHeight = panel.offsetHeight || 200;
        heatmapLegend.style.top = `${panelHeight + 1.5}rem`;
      }
    });
  };
  const focusNode = (targetNode) => {
    if (focusedNode) {
      clearFocus();
    }
    focusedNode = targetNode;
    connectedNodeIds.clear();
    let connections;
    if (linkDirectionMode === "outbound") {
      connections = outboundMap.get(targetNode.id);
    } else {
      connections = inboundMap.get(targetNode.id);
    }
    if (connections) {
      connections.forEach((id) => connectedNodeIds.add(id));
    }
    const clearFocusBtn2 = document.getElementById("link-map-clear-focus");
    if (clearFocusBtn2) {
      clearFocusBtn2.style.display = "flex";
    }
    updateFocusedPanel(targetNode);
    const connectedNodes = [];
    connectedNodeIds.forEach((id) => {
      const node2 = currentGraphData.nodes.find((n) => n.id === id);
      if (node2) connectedNodes.push(node2);
    });
    const targetNodeData = targetNode;
    const currentX = targetNodeData.x !== void 0 && targetNodeData.x !== null ? targetNodeData.x : width / 2;
    const currentY = targetNodeData.y !== void 0 && targetNodeData.y !== null ? targetNodeData.y : height / 2;
    targetNodeData.fx = currentX;
    targetNodeData.fy = currentY;
    if (connectedNodes.length > 0) {
      const nodeRadius = 30;
      const minSpacing = 80;
      const ringSpacing = 100;
      const calculateNodesPerRing = (ringRadius) => {
        const circumference = 2 * Math.PI * ringRadius;
        return Math.max(1, Math.floor(circumference / minSpacing));
      };
      let nodeIndex = 0;
      let ringNumber = 0;
      while (nodeIndex < connectedNodes.length) {
        const ringRadius = ringSpacing * (ringNumber + 1);
        const nodesInRing = calculateNodesPerRing(ringRadius);
        const nodesToPlace = Math.min(nodesInRing, connectedNodes.length - nodeIndex);
        if (nodesToPlace === 0) break;
        const angleStep = 2 * Math.PI / nodesToPlace;
        for (let i = 0; i < nodesToPlace && nodeIndex < connectedNodes.length; i++) {
          const angle = i * angleStep;
          const connectedNode = connectedNodes[nodeIndex];
          const connectedNodeData = connectedNode;
          connectedNodeData.fx = currentX + Math.cos(angle) * ringRadius;
          connectedNodeData.fy = currentY + Math.sin(angle) * ringRadius;
          nodeIndex++;
        }
        ringNumber++;
      }
    }
    currentGraphData.nodes.forEach((node2) => {
      const nodeData = node2;
      if (node2.id !== targetNode.id && !connectedNodeIds.has(node2.id)) {
        if (nodeData.x !== void 0 && nodeData.x !== null && nodeData.y !== void 0 && nodeData.y !== null) {
          nodeData.fx = nodeData.x;
          nodeData.fy = nodeData.y;
        }
      }
    });
    simulation.alpha(1).restart();
    setTimeout(() => {
      fitEntireGraphToViewport([targetNode, ...connectedNodes]);
    }, 100);
    updateFocusStyles();
  };
  const clearFocus = () => {
    if (focusedNode) {
      const focusedNodeData = focusedNode;
      focusedNodeData.fx = null;
      focusedNodeData.fy = null;
    }
    connectedNodeIds.forEach((id) => {
      const node2 = currentGraphData.nodes.find((n) => n.id === id);
      if (node2) {
        const nodeData = node2;
        nodeData.fx = null;
        nodeData.fy = null;
      }
    });
    currentGraphData.nodes.forEach((node2) => {
      const nodeData = node2;
      if (nodeData.fx !== null && nodeData.fx !== void 0) {
        if (focusedNode && node2.id !== focusedNode.id && !connectedNodeIds.has(node2.id)) {
          nodeData.fx = null;
          nodeData.fy = null;
        }
      }
    });
    focusedNode = null;
    connectedNodeIds.clear();
    const clearFocusBtn2 = document.getElementById("link-map-clear-focus");
    if (clearFocusBtn2) {
      clearFocusBtn2.style.display = "none";
    }
    const focusedPanel = document.getElementById("link-map-focused-panel");
    if (focusedPanel) {
      focusedPanel.style.display = "none";
    }
    const heatmapLegend = document.getElementById("link-map-heatmap-legend");
    if (heatmapLegend && heatmapEnabled) {
      heatmapLegend.style.top = "1rem";
    }
    simulation.alpha(1).restart();
    updateFocusStyles();
  };
  const nodeColorCache = /* @__PURE__ */ new Map();
  const getCachedNodeColor = (node2) => {
    if (!nodeColorCache.has(node2.id)) {
      nodeColorCache.set(node2.id, getNodeColor(node2));
    }
    return nodeColorCache.get(node2.id);
  };
  const brighterColorCache = /* @__PURE__ */ new Map();
  const getBrighterColor = (baseColor, amount) => {
    const cacheKey = `${baseColor}-${amount}`;
    if (!brighterColorCache.has(cacheKey)) {
      brighterColorCache.set(cacheKey, d3.rgb(baseColor).brighter(amount).toString());
    }
    return brighterColorCache.get(cacheKey);
  };
  const updateFocusStyles = () => {
    const focusedId = focusedNode?.id;
    const hasFocus = !!focusedNode;
    node.each(function(d) {
      const isFocused = hasFocus && d.id === focusedId;
      const isConnected = hasFocus && connectedNodeIds.has(d.id);
      const el = d3.select(this);
      const isExternal = d.isExternal || false;
      if (isFocused) {
        if (isExternal) {
          el.attr("width", 100).attr("height", 100).attr("x", -50).attr("y", -50);
        } else {
          el.attr("r", 50);
        }
        el.attr("fill", getBrighterColor(getCachedNodeColor(d), 0.5)).attr("stroke-width", 4).attr("opacity", 1).classed("page-list-link-map__node--focused", true).classed("page-list-link-map__node--connected", false).classed("page-list-link-map__node--unconnected", false);
      } else if (isConnected) {
        if (isExternal) {
          el.attr("width", 60).attr("height", 60).attr("x", -30).attr("y", -30);
        } else {
          el.attr("r", 30);
        }
        el.attr("fill", getBrighterColor(getCachedNodeColor(d), 0.3)).attr("stroke-width", 3).attr("opacity", 1).classed("page-list-link-map__node--focused", false).classed("page-list-link-map__node--connected", true).classed("page-list-link-map__node--unconnected", false);
      } else {
        if (isExternal) {
          el.attr("width", 50).attr("height", 50).attr("x", -25).attr("y", -25);
        } else {
          el.attr("r", 25);
        }
        el.attr("fill", getCachedNodeColor(d)).attr("stroke-width", 2).attr("opacity", hasFocus ? 0.2 : 1).classed("page-list-link-map__node--focused", false).classed("page-list-link-map__node--connected", false).classed("page-list-link-map__node--unconnected", hasFocus);
      }
    });
    link.each(function(d) {
      const sourceId = typeof d.source === "string" ? d.source : d.source.id;
      const targetId = typeof d.target === "string" ? d.target : d.target.id;
      const el = d3.select(this);
      const outboundColor = "#4A90E2";
      const inboundColor = "#FF6B6B";
      const neutralColor = "#999";
      if (hasFocus && focusedId) {
        let isConnected = false;
        let isOutbound = false;
        let isInbound = false;
        if (linkDirectionMode === "outbound") {
          isConnected = sourceId === focusedId && connectedNodeIds.has(targetId);
          isOutbound = isConnected;
        } else {
          isConnected = targetId === focusedId && connectedNodeIds.has(sourceId);
          isInbound = isConnected;
        }
        if (isConnected) {
          const linkColor = isOutbound ? outboundColor : inboundColor;
          el.attr("stroke", linkColor).attr("stroke-width", 2).attr("opacity", 1);
        } else {
          el.attr("stroke", "#ccc").attr("stroke-width", 0.5).attr("opacity", 0);
        }
      } else {
        const outboundColorLight = "#7BB3F0";
        const inboundColorLight = "#FF9999";
        el.attr("stroke", outboundColorLight).attr("stroke-width", 1).attr("opacity", 1);
      }
    });
    label.each(function(d) {
      const isFocused = hasFocus && d.id === focusedId;
      const isConnected = hasFocus && connectedNodeIds.has(d.id);
      const el = d3.select(this);
      if (isFocused) {
        el.attr("font-size", "14px").attr("font-weight", "bold").attr("opacity", 1);
      } else if (isConnected) {
        el.attr("font-size", "13px").attr("font-weight", "600").attr("opacity", 1);
      } else {
        el.attr("font-size", "12px").attr("font-weight", "bold").attr("opacity", hasFocus ? 0 : 1);
      }
    });
  };
  let link = g.append("g").attr("class", "page-list-link-map__links").selectAll("line").data(currentGraphData.links).enter().append("line").attr("class", "page-list-link-map__link").attr("stroke", "#7BB3F0").attr("stroke-width", 1).attr("marker-end", "url(#arrowhead)");
  const nodeGroup = g.append("g").attr("class", "page-list-link-map__nodes");
  const internalNodes = nodeGroup.selectAll("circle.page-list-link-map__node--internal").data(currentGraphData.nodes.filter((d) => !d.isExternal)).enter().append("circle").attr("class", "page-list-link-map__node page-list-link-map__node--internal").attr("r", 25).attr("fill", (d) => getNodeColor(d)).attr("stroke", "#333").attr("stroke-width", 2);
  const externalNodes = nodeGroup.selectAll("rect.page-list-link-map__node--external").data(currentGraphData.nodes.filter((d) => d.isExternal)).enter().append("rect").attr("class", "page-list-link-map__node page-list-link-map__node--external").attr("width", 50).attr("height", 50).attr("x", -25).attr("y", -25).attr("fill", (d) => getNodeColor(d)).attr("stroke", "#333").attr("stroke-width", 2);
  let node = internalNodes.merge(externalNodes).attr("tabindex", 0).attr("role", "button").attr("aria-label", (d) => `Page: ${d.title}. Click to focus.`).call(drag(simulation, d3)).on("mouseover", function(event, d) {
    const isFocused = focusedNode && d.id === focusedNode.id;
    const isConnected = focusedNode && connectedNodeIds.has(d.id);
    const el = d3.select(this);
    const isExternal = d.isExternal || false;
    if (!focusedNode) {
      const baseColor = getNodeColor(d);
      if (isExternal) {
        el.attr("width", 70).attr("height", 70).attr("x", -35).attr("y", -35);
      } else {
        el.attr("r", 35);
      }
      el.attr("fill", d3.rgb(baseColor).brighter(0.5).toString());
    } else if (!isFocused && !isConnected) {
      if (isExternal) {
        el.attr("width", 56).attr("height", 56).attr("x", -28).attr("y", -28);
      } else {
        el.attr("r", 28);
      }
      el.attr("opacity", 0.6);
    }
    let tooltipContent = `
        <div class="page-list-link-map__tooltip-content">
          <strong>${escapeHtml(d.title)}</strong>${d.isExternal ? ' <span style="color: #FF6B6B;">(External)</span>' : ""}<br/>
      `;
    if (d.isExternal) {
      tooltipContent += `
          <span class="page-list-link-map__tooltip-url">${escapeHtml(d.url)}</span><br/>
          <span class="page-list-link-map__tooltip-stats">
            External Link
          </span>
        `;
    } else if (currentViewMode === "topics") {
      const topicKey = d.section;
      const pageCount = pages.filter((p) => {
        const pageTopics = p.topics || [];
        return topicKey === "untagged" ? pageTopics.length === 0 : pageTopics.includes(topicKey);
      }).length;
      tooltipContent += `
          <span class="page-list-link-map__tooltip-url">Topic: ${escapeHtml(d.section === "untagged" ? "Untagged" : d.section)}</span><br/>
          <span class="page-list-link-map__tooltip-stats">
            Pages: ${pageCount} | Inbound: ${d.inboundLinks} | Outbound: ${d.outboundLinks}
          </span>
        `;
    } else {
      tooltipContent += `
          <span class="page-list-link-map__tooltip-url">${escapeHtml(d.url)}</span><br/>
          <span class="page-list-link-map__tooltip-stats">
            Inbound: ${d.inboundLinks} | Outbound: ${d.outboundLinks}
          </span>
        `;
    }
    tooltipContent += `
            ${isFocused ? '<br/><span style="color: #4A90E2; font-weight: 600;">Focused - Click again to clear</span>' : ""}
            ${isConnected ? '<br/><span style="color: #7BB3F0;">Connected to focused node</span>' : ""}
          </div>
        `;
    tooltip.style("opacity", 1).html(tooltipContent).style("left", event.pageX + 10 + "px").style("top", event.pageY - 10 + "px");
  }).on("mouseout", function(event, d) {
    updateFocusStyles();
    tooltip.style("opacity", 0);
  }).on("click", (event, d) => {
    event.stopPropagation();
    if (event.ctrlKey || event.metaKey) {
      if (selectedNodesForPath.length === 0 || selectedNodesForPath.length === 1) {
        if (selectedNodesForPath.length === 0 || selectedNodesForPath[0].id !== d.id) {
          selectedNodesForPath.push(d);
          if (selectedNodesForPath.length === 2) {
            const path = findShortestPath(selectedNodesForPath[0].id, selectedNodesForPath[1].id);
            highlightPath(path);
            selectedNodesForPath = [];
          }
        }
      }
      return;
    }
    clearPathHighlight();
    if (focusedNode && d.id === focusedNode.id) {
      clearFocus();
      svg.transition().duration(750).call(zoom.transform, d3.zoomIdentity);
    } else {
      focusNode(d);
    }
  }).on("keydown", (event, d) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (focusedNode && d.id === focusedNode.id) {
        clearFocus();
      } else {
        focusNode(d);
      }
    }
  });
  const clearFocusBtn = document.getElementById("link-map-clear-focus");
  if (clearFocusBtn) {
    clearFocusBtn.addEventListener("click", () => {
      clearFocus();
      svg.transition().duration(750).call(zoom.transform, d3.zoomIdentity);
    });
  }
  const focusedPanelCloseBtn = document.getElementById("link-map-focused-close");
  if (focusedPanelCloseBtn) {
    focusedPanelCloseBtn.addEventListener("click", () => {
      clearFocus();
      svg.transition().duration(750).call(zoom.transform, d3.zoomIdentity);
    });
  }
  svg.on("click", function(event) {
    if (event.target.tagName === "svg" || event.target.classList.contains("page-list-link-map__svg")) {
      clearFocus();
      svg.transition().duration(750).call(zoom.transform, d3.zoomIdentity);
    }
  });
  let label = g.append("g").attr("class", "page-list-link-map__labels").selectAll("text").data(currentGraphData.nodes).enter().append("text").attr("class", "page-list-link-map__label").attr("text-anchor", "middle").attr("dy", 40).attr("font-size", "12px").attr("font-weight", "bold").attr("fill", "#333").text((d) => {
    const text = d.title.length > 20 ? d.title.substring(0, 20) + "..." : d.title;
    return text;
  });
  const switchView = (targetMode) => {
    if (currentViewMode === targetMode) {
      return;
    }
    if (focusedNode) {
      clearFocus();
    }
    currentViewMode = targetMode;
    if (currentViewMode === "pages") {
      currentGraphData = pagesGraphData;
    } else if (currentViewMode === "sections") {
      currentGraphData = sectionsGraphData;
    } else {
      currentGraphData = topicsGraphData;
    }
    const pagesBtn2 = document.getElementById("link-map-view-pages");
    const sectionsBtn2 = document.getElementById("link-map-view-sections");
    const topicsBtn2 = document.getElementById("link-map-view-topics");
    if (pagesBtn2) {
      pagesBtn2.classList.toggle("page-list-link-map__control-btn--active", currentViewMode === "pages");
    }
    if (sectionsBtn2) {
      sectionsBtn2.classList.toggle("page-list-link-map__control-btn--active", currentViewMode === "sections");
    }
    if (topicsBtn2) {
      topicsBtn2.classList.toggle("page-list-link-map__control-btn--active", currentViewMode === "topics");
    }
    const nodesLabelEl = document.getElementById("link-map-nodes-label");
    const nodesCountEl = document.getElementById("link-map-nodes-count");
    const linksCountEl = document.getElementById("link-map-links-count");
    if (nodesLabelEl) {
      if (currentViewMode === "pages") {
        nodesLabelEl.textContent = "Pages:";
      } else if (currentViewMode === "sections") {
        nodesLabelEl.textContent = "Sections:";
      } else {
        nodesLabelEl.textContent = "Topics:";
      }
    }
    if (nodesCountEl) nodesCountEl.textContent = currentGraphData.nodes.length.toString();
    if (linksCountEl) linksCountEl.textContent = currentGraphData.links.length.toString();
    legendData = buildLegendData(currentViewMode);
    const legendTitleEl = document.getElementById("link-map-legend-title");
    const legendItemsEl = document.getElementById("link-map-legend-items");
    if (legendTitleEl) {
      if (currentViewMode === "topics") {
        legendTitleEl.textContent = "Topics (click to toggle)";
      } else {
        legendTitleEl.textContent = "Sections (click to toggle)";
      }
    }
    if (legendItemsEl) {
      legendItemsEl.innerHTML = legendData.map((item) => `
        <label class="page-list-link-map__legend-item" data-section-key="${escapeHtml(item.sectionKey)}">
          <input type="checkbox" class="page-list-link-map__legend-checkbox" checked aria-label="Toggle ${escapeHtml(item.label)}">
          <span class="page-list-link-map__legend-color" style="background-color: ${item.color};"></span>
          <span class="page-list-link-map__legend-label">${escapeHtml(item.label)}</span>
          <span class="page-list-link-map__legend-count">(${item.count})</span>
        </label>
      `).join("");
    }
    selectedSections.clear();
    legendData.forEach((item) => {
      selectedSections.add(item.sectionKey);
    });
    const newLegendItems = container.querySelectorAll(".page-list-link-map__legend-item");
    newLegendItems.forEach((item) => {
      const checkbox = item.querySelector(".page-list-link-map__legend-checkbox");
      const sectionKey = item.getAttribute("data-section-key");
      if (checkbox && sectionKey) {
        checkbox.addEventListener("change", () => {
          if (checkbox.checked) {
            selectedSections.add(sectionKey);
          } else {
            selectedSections.delete(sectionKey);
          }
          updateSectionVisibility();
        });
      }
    });
    nodeSearchData = buildSearchData();
    const searchInputEl = document.getElementById("link-map-search");
    if (searchInputEl) {
      if (currentViewMode === "topics") {
        searchInputEl.placeholder = "Search topics...";
      } else if (currentViewMode === "sections") {
        searchInputEl.placeholder = "Search sections...";
      } else {
        searchInputEl.placeholder = "Search pages...";
      }
      searchInputEl.value = "";
      updateFocusStyles();
    }
    clearPathHighlight();
    if (heatmapEnabled) {
      updateHeatmap();
    }
    simulation.stop();
    link.remove();
    node.remove();
    label.remove();
    const connectionMaps = rebuildConnectionMap();
    connectionMap = connectionMaps.connectionMap;
    outboundMap = connectionMaps.outboundMap;
    inboundMap = connectionMaps.inboundMap;
    link = g.append("g").attr("class", "page-list-link-map__links").selectAll("line").data(currentGraphData.links).enter().append("line").attr("class", "page-list-link-map__link").attr("stroke", "#7BB3F0").attr("stroke-width", 1).attr("marker-end", "url(#arrowhead)");
    const newNodeGroup = g.append("g").attr("class", "page-list-link-map__nodes");
    const newInternalNodes = newNodeGroup.selectAll("circle.page-list-link-map__node--internal").data(currentGraphData.nodes.filter((d) => !d.isExternal)).enter().append("circle").attr("class", "page-list-link-map__node page-list-link-map__node--internal").attr("r", 25).attr("fill", (d) => getNodeColor(d)).attr("stroke", "#333").attr("stroke-width", 2);
    const newExternalNodes = newNodeGroup.selectAll("rect.page-list-link-map__node--external").data(currentGraphData.nodes.filter((d) => d.isExternal)).enter().append("rect").attr("class", "page-list-link-map__node page-list-link-map__node--external").attr("width", 50).attr("height", 50).attr("x", -25).attr("y", -25).attr("fill", (d) => getNodeColor(d)).attr("stroke", "#333").attr("stroke-width", 2);
    node = newInternalNodes.merge(newExternalNodes).attr("tabindex", 0).attr("role", "button").attr("aria-label", (d) => {
      if (currentViewMode === "topics") {
        return `Topic: ${d.title}. Click to focus.`;
      } else if (currentViewMode === "sections") {
        return `Section: ${d.title}. Click to focus.`;
      } else {
        return `Page: ${d.title}. Click to focus.`;
      }
    }).call(drag(simulation, d3)).on("mouseover", function(event, d) {
      const isFocused = focusedNode && d.id === focusedNode.id;
      const isConnected = focusedNode && connectedNodeIds.has(d.id);
      const el = d3.select(this);
      const isExternal = d.isExternal || false;
      if (!focusedNode) {
        const baseColor = getNodeColor(d);
        if (isExternal) {
          el.attr("width", 70).attr("height", 70).attr("x", -35).attr("y", -35);
        } else {
          el.attr("r", 35);
        }
        el.attr("fill", d3.rgb(baseColor).brighter(0.5).toString());
      } else if (!isFocused && !isConnected) {
        if (isExternal) {
          el.attr("width", 56).attr("height", 56).attr("x", -28).attr("y", -28);
        } else {
          el.attr("r", 28);
        }
        el.attr("opacity", 0.6);
      }
      let tooltipContent = `
          <div class="page-list-link-map__tooltip-content">
            <strong>${escapeHtml(d.title)}</strong><br/>
        `;
      if (currentViewMode === "topics") {
        const topicKey = d.section;
        const pageCount = pages.filter((p) => {
          const pageTopics = p.topics || [];
          return topicKey === "untagged" ? pageTopics.length === 0 : pageTopics.includes(topicKey);
        }).length;
        tooltipContent += `
            <span class="page-list-link-map__tooltip-url">Topic: ${escapeHtml(d.section === "untagged" ? "Untagged" : d.section)}</span><br/>
            <span class="page-list-link-map__tooltip-stats">
              Pages: ${pageCount} | Inbound: ${d.inboundLinks} | Outbound: ${d.outboundLinks}
            </span>
          `;
      } else {
        tooltipContent += `
            <span class="page-list-link-map__tooltip-url">${escapeHtml(d.url)}</span><br/>
            <span class="page-list-link-map__tooltip-stats">
              Inbound: ${d.inboundLinks} | Outbound: ${d.outboundLinks}
            </span>
          `;
      }
      tooltipContent += `
          </div>
        `;
      tooltip.style("opacity", 1).html(tooltipContent).style("left", event.pageX + 10 + "px").style("top", event.pageY - 10 + "px");
    }).on("mouseout", function(event, d) {
      updateFocusStyles();
      tooltip.style("opacity", 0);
    }).on("click", (event, d) => {
      event.stopPropagation();
      if (event.ctrlKey || event.metaKey) {
        if (selectedNodesForPath.length === 0 || selectedNodesForPath.length === 1) {
          if (selectedNodesForPath.length === 0 || selectedNodesForPath[0].id !== d.id) {
            selectedNodesForPath.push(d);
            if (selectedNodesForPath.length === 2) {
              const path = findShortestPath(selectedNodesForPath[0].id, selectedNodesForPath[1].id);
              highlightPath(path);
              selectedNodesForPath = [];
            }
          }
        }
        return;
      }
      clearPathHighlight();
      if (focusedNode && d.id === focusedNode.id) {
        clearFocus();
        svg.transition().duration(750).call(zoom.transform, d3.zoomIdentity);
      } else {
        focusNode(d);
      }
    }).on("keydown", (event, d) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        if (focusedNode && d.id === focusedNode.id) {
          clearFocus();
        } else {
          focusNode(d);
        }
      }
    });
    label = g.append("g").attr("class", "page-list-link-map__labels").selectAll("text").data(currentGraphData.nodes).enter().append("text").attr("class", "page-list-link-map__label").attr("text-anchor", "middle").attr("dy", 40).attr("font-size", "12px").attr("font-weight", "bold").attr("fill", "#333").text((d) => {
      const text = d.title.length > 20 ? d.title.substring(0, 20) + "..." : d.title;
      return text;
    });
    simulation = d3.forceSimulation(currentGraphData.nodes).force("link", d3.forceLink(currentGraphData.links).id((d) => d.id).distance(25)).force("charge", d3.forceManyBody().strength(-60)).force("center", d3.forceCenter(width / 2, height / 2)).force("collision", d3.forceCollide().radius(35)).alphaDecay(0.0228).velocityDecay(0.4);
    simulation.on("tick", () => {
      const currentAlpha = simulation.alpha();
      if (currentAlpha < 0.01 && Math.abs(currentAlpha - lastAlpha) < 1e-3) {
        stableTicks++;
        if (!initialFitDone && stableTicks > 5) {
          initialFitDone = true;
          fitEntireGraphToViewport();
        }
        if (stableTicks > 10) {
          simulation.stop();
          return;
        }
      } else {
        stableTicks = 0;
      }
      lastAlpha = currentAlpha;
      scheduleUpdate();
    });
    initialFitDone = false;
    setTimeout(() => {
      fitEntireGraphToViewport();
    }, 200);
    updateSectionVisibility();
    simulation.alpha(1).restart();
  };
  const selectedSections = /* @__PURE__ */ new Set();
  legendData.forEach((item) => {
    selectedSections.add(item.sectionKey);
  });
  const getNodeSectionKey = (node2) => {
    if (currentViewMode === "topics") {
      return node2.id.startsWith("topic:") ? node2.id : `topic:${node2.section}`;
    } else {
      return node2.section || node2.parentPath;
    }
  };
  const updateSectionVisibility = () => {
    if (focusedNode) {
      const focusedSectionKey = getNodeSectionKey(focusedNode);
      if (!selectedSections.has(focusedSectionKey)) {
        clearFocus();
      }
    }
    node.each(function(d) {
      if (d.isExternal) {
        d3.select(this).style("display", "block");
      } else {
        const sectionKey = getNodeSectionKey(d);
        const isVisible = selectedSections.has(sectionKey);
        d3.select(this).style("display", isVisible ? "block" : "none");
      }
    });
    label.each(function(d) {
      const sectionKey = getNodeSectionKey(d);
      const isVisible = selectedSections.has(sectionKey);
      d3.select(this).style("display", isVisible ? "block" : "none");
    });
    link.each(function(d) {
      const sourceId = typeof d.source === "string" ? d.source : d.source.id;
      const targetId = typeof d.target === "string" ? d.target : d.target.id;
      const sourceNode = currentGraphData.nodes.find((n) => n.id === sourceId);
      const targetNode = currentGraphData.nodes.find((n) => n.id === targetId);
      const sourceVisible = sourceNode && selectedSections.has(getNodeSectionKey(sourceNode));
      const targetVisible = targetNode && selectedSections.has(getNodeSectionKey(targetNode));
      const isVisible = sourceVisible && targetVisible;
      d3.select(this).style("display", isVisible ? "block" : "none");
    });
    if (focusedNode) {
      updateFocusStyles();
    }
    simulation.alpha(0.3).restart();
  };
  const legendItems = container.querySelectorAll(".page-list-link-map__legend-item");
  legendItems.forEach((item) => {
    const checkbox = item.querySelector(".page-list-link-map__legend-checkbox");
    const sectionKey = item.getAttribute("data-section-key");
    if (checkbox && sectionKey) {
      checkbox.addEventListener("change", () => {
        if (checkbox.checked) {
          selectedSections.add(sectionKey);
        } else {
          selectedSections.delete(sectionKey);
        }
        updateSectionVisibility();
      });
    }
  });
  let rafId = null;
  let needsUpdate = false;
  const scheduleUpdate = () => {
    if (!needsUpdate) {
      needsUpdate = true;
      rafId = requestAnimationFrame(() => {
        needsUpdate = false;
        link.attr("x1", (d) => d.source.x).attr("y1", (d) => d.source.y).attr("x2", (d) => d.target.x).attr("y2", (d) => d.target.y);
        node.each(function(d) {
          const el = d3.select(this);
          const isExternal = d.isExternal || false;
          if (isExternal) {
            el.attr("x", d.x).attr("y", d.y);
          } else {
            el.attr("cx", d.x).attr("cy", d.y);
          }
        });
        label.attr("x", (d) => d.x).attr("y", (d) => d.y);
      });
    }
  };
  let initialFitDone = false;
  const fitEntireGraphToViewport = (targetNodes) => {
    requestAnimationFrame(() => {
      const nodesToFit = targetNodes || currentGraphData.nodes;
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      let hasValidNodes = false;
      nodesToFit.forEach((node2) => {
        const nodeData = node2;
        const x = nodeData.fx !== null && nodeData.fx !== void 0 ? nodeData.fx : nodeData.x;
        const y = nodeData.fy !== null && nodeData.fy !== void 0 ? nodeData.fy : nodeData.y;
        if (x !== void 0 && y !== void 0 && isFinite(x) && isFinite(y)) {
          hasValidNodes = true;
          let radius = 25;
          if (focusedNode && node2.id === focusedNode.id) {
            radius = 50;
          } else if (focusedNode && connectedNodeIds.has(node2.id)) {
            radius = 30;
          }
          minX = Math.min(minX, x - radius);
          minY = Math.min(minY, y - radius);
          maxX = Math.max(maxX, x + radius);
          maxY = Math.max(maxY, y + radius);
        }
      });
      if (hasValidNodes && isFinite(minX) && isFinite(minY) && isFinite(maxX) && isFinite(maxY)) {
        const padding = 60;
        minX -= padding;
        minY -= padding;
        maxX += padding;
        maxY += padding;
        const boundsWidth = maxX - minX;
        const boundsHeight = maxY - minY;
        const boundsCenterX = (minX + maxX) / 2;
        const boundsCenterY = (minY + maxY) / 2;
        const margin = 0.85;
        const scaleX = width * margin / boundsWidth;
        const scaleY = height * margin / boundsHeight;
        const scale = Math.min(scaleX, scaleY, 3);
        const translateX = width / 2 - boundsCenterX * scale;
        const translateY = height / 2 - boundsCenterY * scale;
        svg.transition().duration(750).call(zoom.transform, d3.zoomIdentity.translate(translateX, translateY).scale(scale));
      }
    });
  };
  const centerGraph = (targetNodes) => {
    requestAnimationFrame(() => {
      const nodesToCenter = targetNodes || currentGraphData.nodes;
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      let hasValidNodes = false;
      nodesToCenter.forEach((node2) => {
        const nodeData = node2;
        const x = nodeData.fx !== null && nodeData.fx !== void 0 ? nodeData.fx : nodeData.x;
        const y = nodeData.fy !== null && nodeData.fy !== void 0 ? nodeData.fy : nodeData.y;
        if (x !== void 0 && y !== void 0 && isFinite(x) && isFinite(y)) {
          hasValidNodes = true;
          let radius = 25;
          if (focusedNode && node2.id === focusedNode.id) {
            radius = 50;
          } else if (focusedNode && connectedNodeIds.has(node2.id)) {
            radius = 30;
          }
          minX = Math.min(minX, x - radius);
          minY = Math.min(minY, y - radius);
          maxX = Math.max(maxX, x + radius);
          maxY = Math.max(maxY, y + radius);
        }
      });
      if (hasValidNodes && isFinite(minX) && isFinite(minY) && isFinite(maxX) && isFinite(maxY)) {
        const boundsCenterX = (minX + maxX) / 2;
        const boundsCenterY = (minY + maxY) / 2;
        const currentTransform = d3.zoomTransform(svg.node());
        const currentScale = currentTransform.k;
        const translateX = width / 2 - boundsCenterX * currentScale;
        const translateY = height / 2 - boundsCenterY * currentScale;
        svg.transition().duration(750).call(zoom.transform, d3.zoomIdentity.translate(translateX, translateY).scale(currentScale));
      }
    });
  };
  simulation.on("tick", () => {
    const currentAlpha = simulation.alpha();
    if (currentAlpha < 0.01 && Math.abs(currentAlpha - lastAlpha) < 1e-3) {
      stableTicks++;
      if (!initialFitDone && stableTicks > 5) {
        initialFitDone = true;
        fitEntireGraphToViewport();
      }
      if (stableTicks > 10) {
        simulation.stop();
        return;
      }
    } else {
      stableTicks = 0;
    }
    lastAlpha = currentAlpha;
    scheduleUpdate();
  });
  const resetBtn = document.getElementById("link-map-reset");
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      clearFocus();
      svg.transition().duration(750).call(zoom.transform, d3.zoomIdentity);
    });
  }
  const pagesBtn = document.getElementById("link-map-view-pages");
  if (pagesBtn) {
    pagesBtn.addEventListener("click", () => {
      switchView("pages");
    });
  }
  const sectionsBtn = document.getElementById("link-map-view-sections");
  if (sectionsBtn) {
    sectionsBtn.addEventListener("click", () => {
      switchView("sections");
    });
  }
  const topicsBtn = document.getElementById("link-map-view-topics");
  if (topicsBtn) {
    topicsBtn.addEventListener("click", () => {
      switchView("topics");
    });
  }
  const outboundBtn = document.getElementById("link-map-link-direction-outbound");
  const inboundBtn = document.getElementById("link-map-link-direction-inbound");
  const switchLinkDirection = (mode) => {
    if (linkDirectionMode === mode) return;
    linkDirectionMode = mode;
    if (outboundBtn) {
      outboundBtn.classList.toggle("page-list-link-map__control-btn--active", mode === "outbound");
    }
    if (inboundBtn) {
      inboundBtn.classList.toggle("page-list-link-map__control-btn--active", mode === "inbound");
    }
    if (focusedNode) {
      const nodeToRefocus = focusedNode;
      clearFocus();
      setTimeout(() => {
        focusNode(nodeToRefocus);
      }, 0);
    } else {
      updateFocusStyles();
    }
  };
  if (outboundBtn) {
    outboundBtn.addEventListener("click", () => switchLinkDirection("outbound"));
  }
  if (inboundBtn) {
    inboundBtn.addEventListener("click", () => switchLinkDirection("inbound"));
  }
  const centerBtn = document.getElementById("link-map-center");
  if (centerBtn) {
    centerBtn.addEventListener("click", () => {
      if (focusedNode) {
        const connectedNodes = [];
        connectedNodeIds.forEach((id) => {
          const node2 = currentGraphData.nodes.find((n) => n.id === id);
          if (node2) connectedNodes.push(node2);
        });
        centerGraph([focusedNode, ...connectedNodes]);
      } else {
        centerGraph();
      }
    });
  }
  const fitBtn = document.getElementById("link-map-fit");
  if (fitBtn) {
    fitBtn.addEventListener("click", () => {
      if (focusedNode) {
        const connectedNodes = [];
        connectedNodeIds.forEach((id) => {
          const node2 = currentGraphData.nodes.find((n) => n.id === id);
          if (node2) connectedNodes.push(node2);
        });
        fitEntireGraphToViewport([focusedNode, ...connectedNodes]);
      } else {
        fitEntireGraphToViewport();
      }
    });
  }
  const buildSearchData = () => {
    return currentGraphData.nodes.map((node2) => ({
      node: node2,
      titleLower: node2.title.toLowerCase(),
      urlLower: node2.url.toLowerCase(),
      sectionLower: node2.section ? node2.section.toLowerCase() : ""
    }));
  };
  let nodeSearchData = buildSearchData();
  const searchInput = document.getElementById("link-map-search");
  if (searchInput) {
    let searchTimeout = null;
    const searchDebounceDelay = 150;
    const updateSearchPlaceholder = () => {
      if (searchInput) {
        if (currentViewMode === "topics") {
          searchInput.placeholder = "Search topics...";
        } else if (currentViewMode === "sections") {
          searchInput.placeholder = "Search sections...";
        } else {
          searchInput.placeholder = "Search pages...";
        }
      }
    };
    updateSearchPlaceholder();
    const performSearch = (searchTerm) => {
      const term = searchTerm.toLowerCase();
      if (term === "") {
        updateFocusStyles();
        return;
      }
      const focusedId = focusedNode?.id;
      const hasFocus = !!focusedNode;
      node.each(function(d) {
        const data = nodeSearchData.find((nd) => nd.node.id === d.id);
        const matches = data && (data.titleLower.includes(term) || data.urlLower.includes(term) || currentViewMode === "topics" && data.sectionLower.includes(term));
        const isFocused = hasFocus && d.id === focusedId;
        const isConnected = hasFocus && connectedNodeIds.has(d.id);
        if (hasFocus && !isFocused && !isConnected) {
          d3.select(this).style("opacity", 0);
        } else {
          d3.select(this).style("opacity", matches ? 1 : 0.2);
        }
      });
      label.each(function(d) {
        const data = nodeSearchData.find((nd) => nd.node.id === d.id);
        const matches = data && (data.titleLower.includes(term) || data.urlLower.includes(term) || currentViewMode === "topics" && data.sectionLower.includes(term));
        const isFocused = hasFocus && d.id === focusedId;
        const isConnected = hasFocus && connectedNodeIds.has(d.id);
        if (hasFocus && !isFocused && !isConnected) {
          d3.select(this).style("opacity", 0);
        } else {
          d3.select(this).style("opacity", matches ? 1 : 0.2);
        }
      });
    };
    searchInput.addEventListener("input", (e) => {
      const searchTerm = e.target.value;
      if (searchTimeout !== null) {
        clearTimeout(searchTimeout);
      }
      searchTimeout = window.setTimeout(() => {
        performSearch(searchTerm);
        searchTimeout = null;
      }, searchDebounceDelay);
    });
  }
  let heatmapEnabled = false;
  const heatmapToggleBtn = document.getElementById("link-map-heatmap-toggle");
  if (heatmapToggleBtn) {
    heatmapToggleBtn.addEventListener("click", () => {
      heatmapEnabled = !heatmapEnabled;
      heatmapToggleBtn.classList.toggle("page-list-link-map__control-btn--active", heatmapEnabled);
      updateHeatmap();
    });
  }
  const updateHeatmap = () => {
    const heatmapLegend = document.getElementById("link-map-heatmap-legend");
    const focusedPanel = document.getElementById("link-map-focused-panel");
    if (heatmapLegend) {
      heatmapLegend.style.display = heatmapEnabled ? "block" : "none";
      if (heatmapEnabled && focusedPanel && focusedPanel.style.display !== "none") {
        const panelHeight = focusedPanel.offsetHeight || 200;
        heatmapLegend.style.top = `${panelHeight + 1.5}rem`;
      } else if (heatmapEnabled) {
        heatmapLegend.style.top = "1rem";
      }
    }
    if (!heatmapEnabled) {
      node.each(function(d) {
        const isFocused = focusedNode && d.id === focusedNode.id;
        const isConnected = focusedNode && connectedNodeIds.has(d.id);
        if (!isFocused && !isConnected) {
          d3.select(this).attr("fill", getNodeColor(d));
        }
      });
      return;
    }
    let maxDegree = 0;
    let minDegree = Infinity;
    currentGraphData.nodes.forEach((node2) => {
      const degree = node2.inboundLinks + node2.outboundLinks;
      maxDegree = Math.max(maxDegree, degree);
      minDegree = Math.min(minDegree, degree);
    });
    const vibrantColorScale = (t) => {
      const contrastCurve = Math.pow(t, 0.6);
      if (contrastCurve < 0.2) {
        const localT = contrastCurve / 0.2;
        const r = Math.floor(0 + 0 * localT);
        const g2 = Math.floor(50 + 200 * localT);
        const b = Math.floor(150 + 105 * localT);
        return d3.rgb(r, g2, b).toString();
      } else if (contrastCurve < 0.4) {
        const localT = (contrastCurve - 0.2) / 0.2;
        const r = Math.floor(0 + 200 * localT);
        const g2 = 255;
        const b = Math.floor(255 - 255 * localT);
        return d3.rgb(r, g2, b).toString();
      } else if (contrastCurve < 0.6) {
        const localT = (contrastCurve - 0.4) / 0.2;
        const r = 255;
        const g2 = Math.floor(255 - 100 * localT);
        const b = 0;
        return d3.rgb(r, g2, b).toString();
      } else if (contrastCurve < 0.8) {
        const localT = (contrastCurve - 0.6) / 0.2;
        const r = 255;
        const g2 = Math.floor(155 - 100 * localT);
        const b = 0;
        return d3.rgb(r, g2, b).toString();
      } else {
        const localT = (contrastCurve - 0.8) / 0.2;
        const r = 255;
        const g2 = Math.floor(55 - 55 * localT);
        const b = 0;
        return d3.rgb(r, g2, b).toString();
      }
    };
    node.each(function(d) {
      const isFocused = focusedNode && d.id === focusedNode.id;
      const isConnected = focusedNode && connectedNodeIds.has(d.id);
      if (isFocused || isConnected || d.isExternal) {
        return;
      }
      const degree = d.inboundLinks + d.outboundLinks;
      const normalizedT = maxDegree > minDegree ? (degree - minDegree) / (maxDegree - minDegree) : 0;
      const heatColor = vibrantColorScale(normalizedT);
      d3.select(this).attr("fill", heatColor);
    });
  };
  let selectedNodesForPath = [];
  let highlightedPath = [];
  const findShortestPath = (startId, endId) => {
    const queue = [{ id: startId, path: [startId] }];
    const visited = /* @__PURE__ */ new Set([startId]);
    while (queue.length > 0) {
      const current = queue.shift();
      if (current.id === endId) {
        return current.path;
      }
      const connections = connectionMap.get(current.id);
      if (connections) {
        connections.forEach((neighborId) => {
          if (!visited.has(neighborId)) {
            visited.add(neighborId);
            queue.push({ id: neighborId, path: [...current.path, neighborId] });
          }
        });
      }
    }
    return [];
  };
  const highlightPath = (path) => {
    highlightedPath = path;
    node.each(function(d) {
      const inPath = path.includes(d.id);
      d3.select(this).attr("stroke", inPath ? "#FF6B6B" : "#333").attr("stroke-width", inPath ? 4 : 2);
    });
    link.each(function(d) {
      const sourceId = typeof d.source === "string" ? d.source : d.source.id;
      const targetId = typeof d.target === "string" ? d.target : d.target.id;
      const inPath = path.includes(sourceId) && path.includes(targetId) && Math.abs(path.indexOf(sourceId) - path.indexOf(targetId)) === 1;
      d3.select(this).attr("stroke", inPath ? "#FF6B6B" : "#999").attr("stroke-width", inPath ? 3 : 1).attr("opacity", inPath ? 1 : focusedNode ? 0.3 : 1);
    });
  };
  const clearPathHighlight = () => {
    highlightedPath = [];
    selectedNodesForPath = [];
    node.each(function(d) {
      const isFocused = focusedNode && d.id === focusedNode.id;
      const isConnected = focusedNode && connectedNodeIds.has(d.id);
      if (!isFocused && !isConnected) {
        d3.select(this).attr("stroke", "#333").attr("stroke-width", 2);
      }
    });
    updateFocusStyles();
  };
  let isEditMode = false;
  let dragSource = null;
  let tempLink = null;
  node.on("contextmenu", (event, d) => {
    if (currentViewMode !== "topics") return;
    event.preventDefault();
  });
}
function drag(simulation, d3) {
  function dragstarted(event) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    event.subject.fx = event.subject.x;
    event.subject.fy = event.subject.y;
  }
  function dragged(event) {
    event.subject.fx = event.x;
    event.subject.fy = event.y;
  }
  function dragended(event) {
    if (!event.active) simulation.alphaTarget(0);
    event.subject.fx = null;
    event.subject.fy = null;
  }
  return d3.drag().on("start", dragstarted).on("drag", dragged).on("end", dragended);
}
function extractExternalLinksFromPages(pages) {
  const externalLinksMap = /* @__PURE__ */ new Map();
  const pageUrls = new Set(pages.map((p) => p.relPermalink));
  pages.forEach((page) => {
    const externalLinks = [];
    if (page.externalLinks && Array.isArray(page.externalLinks)) {
      page.externalLinks.forEach((url) => {
        try {
          const absoluteUrl = url.startsWith("http") ? url : `https://${url}`;
          const urlObj = new URL(absoluteUrl);
          const currentHost = window.location.hostname.replace("www.", "");
          const linkHost = urlObj.hostname.replace("www.", "");
          if (linkHost !== currentHost && !linkHost.includes(currentHost) && !currentHost.includes(linkHost)) {
            externalLinks.push(absoluteUrl);
          }
        } catch (e) {
        }
      });
    }
    externalLinksMap.set(page.relPermalink, externalLinks);
  });
  return externalLinksMap;
}
function extractInternalLinksFromPages(pages) {
  const linkMap = /* @__PURE__ */ new Map();
  const pageUrls = new Set(pages.map((p) => p.relPermalink));
  const pagesBySection = /* @__PURE__ */ new Map();
  const pagesByPathPrefix = /* @__PURE__ */ new Map();
  const mainSections = /* @__PURE__ */ new Set();
  pages.forEach((page) => {
    linkMap.set(page.relPermalink, []);
    if (page.section) {
      if (!pagesBySection.has(page.section)) {
        pagesBySection.set(page.section, []);
      }
      pagesBySection.get(page.section).push(page);
    }
    const pathParts = page.relPermalink.split("/").filter((p) => p);
    if (pathParts.length > 0) {
      const prefix = "/" + pathParts[0] + "/";
      if (!pagesByPathPrefix.has(prefix)) {
        pagesByPathPrefix.set(prefix, []);
      }
      pagesByPathPrefix.get(prefix).push(page);
      if (page.relPermalink !== "/" && page.section) {
        const sectionPath = "/" + page.section.split("/")[0] + "/";
        if (pageUrls.has(sectionPath)) {
          mainSections.add(sectionPath);
        }
      }
    }
  });
  pages.forEach((page) => {
    const links = /* @__PURE__ */ new Set();
    if (page.brokenLinkUrls && Array.isArray(page.brokenLinkUrls)) {
      for (const url of page.brokenLinkUrls) {
        const path = url.split("#")[0];
        if (pageUrls.has(path) && path !== page.relPermalink) {
          links.add(path);
        }
      }
    }
    if (page.relPermalink === "/") {
      mainSections.forEach((link) => links.add(link));
    }
    if (page.section && pagesBySection.has(page.section)) {
      const sectionPages = pagesBySection.get(page.section);
      for (const otherPage of sectionPages) {
        if (otherPage.relPermalink !== page.relPermalink && links.size < 10) {
          links.add(otherPage.relPermalink);
        }
      }
    }
    if (page.totalInternalLinks > 0 && links.size < page.totalInternalLinks) {
      const pagePathParts = page.relPermalink.split("/").filter((p) => p);
      if (pagePathParts.length > 0) {
        const prefix = "/" + pagePathParts[0] + "/";
        const prefixPages = pagesByPathPrefix.get(prefix);
        if (prefixPages) {
          for (const otherPage of prefixPages) {
            if (otherPage.relPermalink === page.relPermalink || links.size >= page.totalInternalLinks) {
              break;
            }
            const otherPathParts = otherPage.relPermalink.split("/").filter((p) => p);
            if (otherPathParts.length > 0) {
              if (pagePathParts[0] === otherPathParts[0] || page.relPermalink.startsWith(otherPage.relPermalink + "/") || otherPage.relPermalink.startsWith(page.relPermalink + "/")) {
                links.add(otherPage.relPermalink);
              }
            }
          }
        }
      }
    }
    if (links.size > 0) {
      linkMap.set(page.relPermalink, Array.from(links));
    }
  });
  return linkMap;
}

// ns-hugo-imp:C:\Users\maxim\Documents\Dev\arsrepairs.com\themes\arsrepairs-theme\assets\ts\modules\page-list.ts
var TITLE_PIXEL_LIMIT_DESKTOP = 920;
var DESC_PIXEL_LIMIT_DESKTOP = 1970;
var TITLE_LIMIT = 60;
var DESC_LIMIT = 160;
var DEV_LOG = isLocalhost();
function devLog(...args) {
  if (DEV_LOG) {
    console.log(...args);
  }
}
function devError(...args) {
  if (DEV_LOG) {
    console.error(...args);
  }
}
function devWarn(...args) {
  if (DEV_LOG) {
    console.warn(...args);
  }
}
function showLoading() {
  const container = document.querySelector(".page-list-container");
  if (!container) return;
  const initialContent = container.querySelector(".page-list-initial-content");
  const loading = container.querySelector(".page-list-loading");
  if (initialContent) {
    initialContent.style.display = "none";
  }
  if (loading) {
    loading.classList.remove("page-list-loading--hidden");
  } else {
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
function hideLoading() {
  const loading = document.querySelector(".page-list-loading");
  if (loading) {
    loading.remove();
  }
}
function calculateStats(pages) {
  let withIssues = 0;
  let titleOverLimit = 0;
  let descOverLimit = 0;
  let titleOverPixels = 0;
  let descOverPixels = 0;
  let missingTitle = 0;
  let missingDesc = 0;
  let totalSeoScore = 0;
  let totalAiScore = 0;
  let hasTitle = 0;
  let titleOptimal = 0;
  let hasDescription = 0;
  let descOptimal = 0;
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
  let brokenLinks = 0;
  let brokenImages = 0;
  let imagesWithoutAlt = 0;
  let headingStructureIssues = 0;
  let pagesWithoutAnalytics = 0;
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
  let contrastRatioIssues = 0;
  let missingAriaLabels = 0;
  let keyboardNavigationIssues = 0;
  let noFocusIndicators = 0;
  pages.forEach((page) => {
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
    if (page.hasFocusIndicators !== void 0 && page.hasFocusIndicators === false) {
      noFocusIndicators++;
      hasIssue = true;
    }
    if (hasIssue) {
      withIssues++;
    }
    if (page.summary && page.summary.trim() !== "") {
      hasSummary++;
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
    if (page.htmlRatioGood) {
      htmlRatioGood++;
    }
    if (page.hasHeadings) {
      hasHeadings++;
      if (page.headingsGood) {
        headingsOptimal++;
      }
    }
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
function getScoreClass(score) {
  if (score >= 80) return "score-excellent";
  if (score >= 60) return "score-good";
  if (score >= 40) return "score-fair";
  return "score-poor";
}
function getOverviewStatClass(value, total, isIssue = true, isScore = false) {
  if (isScore) {
    return getScoreClass(value);
  }
  if (isIssue) {
    if (value === 0) return "overview-stat--success";
    if (value <= 5) return "overview-stat--warning";
    return "overview-stat--error";
  } else {
    const percentage = total > 0 ? value / total * 100 : 0;
    if (percentage >= 80) return "overview-stat--success";
    if (percentage >= 60) return "overview-stat--warning";
    if (percentage >= 40) return "overview-stat--warning";
    return "overview-stat--error";
  }
}
function renderPageOverview(section, stats, siteTechnicalSEO, siteAICrawlability, activeFilter) {
  const buildOverviewStat = (value, label, filter, extraClass = "", extraAttributes = "") => {
    const isActive = activeFilter && filter === activeFilter;
    const classes = [
      "page-list-overview-stat",
      extraClass,
      filter ? "page-list-overview-stat--clickable" : "",
      isActive ? "page-list-overview-stat--active" : ""
    ].filter(Boolean).join(" ");
    const filterAttributes = filter ? `data-filter="${filter}" role="button" tabindex="0"${isActive ? ' aria-pressed="true"' : ' aria-pressed="false"'}` : "";
    const attributes = [filterAttributes, extraAttributes].filter(Boolean).join(" ");
    return `
      <div class="${classes}"${attributes ? ` ${attributes}` : ""}>
        <div class="page-list-overview-stat__value">${value}</div>
        <div class="page-list-overview-stat__label">${label}</div>
      </div>
    `;
  };
  const overviews = {
    "overview": `
      <div class="page-list-overview-grid">
        ${buildOverviewStat(stats.total, "Total Pages", "all")}
        ${buildOverviewStat(stats.withIssues, "Pages with Issues", "with-issues", getOverviewStatClass(stats.withIssues, stats.total, true))}
        ${buildOverviewStat(stats.total - stats.withIssues, "Good Pages", "good", getOverviewStatClass(stats.total - stats.withIssues, stats.total, false))}
      </div>
    `,
    "seo-analysis": `
      <div class="page-list-overview-grid">
        ${buildOverviewStat(stats.missingTitle + stats.missingDesc, "Missing Meta Tags", "missing-meta", getOverviewStatClass(stats.missingTitle + stats.missingDesc, stats.total, true))}
        ${buildOverviewStat(stats.titleOverLimit + stats.titleOverPixels + stats.descOverLimit + stats.descOverPixels, "Meta Tag Issues", "meta-issues", getOverviewStatClass(stats.titleOverLimit + stats.titleOverPixels + stats.descOverLimit + stats.descOverPixels, stats.total, true))}
        ${buildOverviewStat(stats.onPageSEO.noSchemaMarkup, "Missing Schema", "no-schema", getOverviewStatClass(stats.onPageSEO.noSchemaMarkup, stats.total, true))}
        ${buildOverviewStat(Math.round(stats.siteSeoScore), "Average SEO Score", void 0, getOverviewStatClass(Math.round(stats.siteSeoScore), 100, false, true))}
      </div>
    `,
    "content-quality": `
      <div class="page-list-overview-grid">
        ${buildOverviewStat(stats.contentQuality.wordCountIssues, "Low Word Count", "low-word-count", getOverviewStatClass(stats.contentQuality.wordCountIssues, stats.total, true))}
        ${buildOverviewStat(stats.contentQuality.noCitations, "No Citations", "no-citations", getOverviewStatClass(stats.contentQuality.noCitations, stats.total, true))}
        ${buildOverviewStat(stats.contentQuality.noAuthor, "No Author", "no-author", getOverviewStatClass(stats.contentQuality.noAuthor, stats.total, true))}
        ${buildOverviewStat(stats.contentQuality.staleContent, "Stale Content", "stale-content", getOverviewStatClass(stats.contentQuality.staleContent, stats.total, true))}
        ${buildOverviewStat(stats.contentQuality.excerptTooShort, "Excerpt Too Short", "excerpt-too-short", getOverviewStatClass(stats.contentQuality.excerptTooShort, stats.total, true))}
        ${buildOverviewStat(stats.contentQuality.excerptTooLong, "Excerpt Too Long", "excerpt-too-long", getOverviewStatClass(stats.contentQuality.excerptTooLong, stats.total, true))}
      </div>
    `,
    "technical-issues": `
      <div class="page-list-overview-grid">
        ${buildOverviewStat(stats.technicalSEO.brokenLinks, "Broken Links", "broken-links", getOverviewStatClass(stats.technicalSEO.brokenLinks, stats.total, true))}
        ${buildOverviewStat(stats.technicalSEO.brokenImages, "Broken Images", "broken-images", getOverviewStatClass(stats.technicalSEO.brokenImages, stats.total, true))}
        ${buildOverviewStat(stats.technicalSEO.imagesWithoutAlt, "Images w/o Alt", "images-no-alt", getOverviewStatClass(stats.technicalSEO.imagesWithoutAlt, stats.total, true))}
        ${buildOverviewStat(stats.technicalSEO.headingStructureIssues, "Heading Issues", "heading-structure", getOverviewStatClass(stats.technicalSEO.headingStructureIssues, stats.total, true))}
      </div>
    `,
    "keyword-research": `
      <div class="page-list-overview-grid">
        ${buildOverviewStat("-", "Total Keywords", void 0, "", 'id="page-list-keyword-stat-total"')}
        ${buildOverviewStat("-", "Unique Keywords", void 0, "", 'id="page-list-keyword-stat-unique"')}
        ${buildOverviewStat(0, "Competitors", void 0, "", 'id="page-list-keyword-stat-competitors"')}
        ${buildOverviewStat("-", "Opportunities", void 0, "", 'id="page-list-keyword-stat-opportunities"')}
      </div>
    `,
    "link-map": `
      <div class="page-list-overview-grid">
        ${buildOverviewStat(stats.total, "Total Pages")}
        ${buildOverviewStat("-", "Total Links", void 0, "", 'id="page-list-link-map-total-links"')}
        ${buildOverviewStat(stats.technicalSEO.brokenLinks, "Broken Links", "broken-links", getOverviewStatClass(stats.technicalSEO.brokenLinks, stats.total, true))}
        ${buildOverviewStat("-", "Avg Links/Page", void 0, "", 'id="page-list-link-map-avg-links"')}
      </div>
    `
  };
  return overviews[section] || overviews["overview"];
}
function renderStats(stats, activeFilter = "all", siteTechnicalSEO, siteAICrawlability, showFilters = true, section = "overview", heroOnly = false) {
  const seoClass = getScoreClass(stats.siteSeoScore);
  const aiClass = getScoreClass(stats.siteAiScore);
  const siteAIClass = siteAICrawlability ? getScoreClass(siteAICrawlability.score) : "";
  const circumference = 2 * Math.PI * 54;
  const technicalSEOHtml = section === "overview" && siteTechnicalSEO ? `
    <div class="page-list-summary__technical-seo">
      <div class="page-list-summary__technical-seo-columns">
        <div class="page-list-summary__technical-seo-column">
          <h3 class="page-list-summary__technical-seo-title">Site-Wide Technical SEO</h3>
          <div class="page-list-summary__technical-seo-grid">
            <div class="page-list-summary__technical-seo-item ${siteTechnicalSEO.isHTTPS ? "page-list-summary__technical-seo-item--success" : "page-list-summary__technical-seo-item--error"}">
              <span class="page-list-summary__technical-seo-icon">${siteTechnicalSEO.isHTTPS ? "\u{1F512}" : "\u26A0\uFE0F"}</span>
              <span class="page-list-summary__technical-seo-label">HTTPS</span>
              <span class="page-list-summary__technical-seo-status">${siteTechnicalSEO.isHTTPS ? "Enabled" : "Not Enabled"}</span>
            </div>
            <div class="page-list-summary__technical-seo-item ${siteTechnicalSEO.hasSitemap ? "page-list-summary__technical-seo-item--success" : "page-list-summary__technical-seo-item--warning"}">
              <span class="page-list-summary__technical-seo-icon">${siteTechnicalSEO.hasSitemap ? "\u2713" : "\u26A0\uFE0F"}</span>
              <span class="page-list-summary__technical-seo-label">XML Sitemap</span>
              <span class="page-list-summary__technical-seo-status">${siteTechnicalSEO.hasSitemap ? "Found" : "Missing"}</span>
            </div>
            <div class="page-list-summary__technical-seo-item ${siteTechnicalSEO.hasRobotsTxt ? "page-list-summary__technical-seo-item--success" : "page-list-summary__technical-seo-item--warning"}">
              <span class="page-list-summary__technical-seo-icon">${siteTechnicalSEO.hasRobotsTxt ? "\u2713" : "\u26A0\uFE0F"}</span>
              <span class="page-list-summary__technical-seo-label">Robots.txt</span>
              <span class="page-list-summary__technical-seo-status">${siteTechnicalSEO.hasRobotsTxt ? "Found" : "Missing"}</span>
            </div>
          </div>
        </div>
        <div class="page-list-summary__technical-seo-column">
          <h3 class="page-list-summary__technical-seo-title">Site-Wide Analytics</h3>
          <div class="page-list-summary__technical-seo-grid">
            <div class="page-list-summary__technical-seo-item ${siteTechnicalSEO.hasAnalytics ? "page-list-summary__technical-seo-item--success" : "page-list-summary__technical-seo-item--warning"}">
              <span class="page-list-summary__technical-seo-icon">${siteTechnicalSEO.hasAnalytics ? "\u{1F4CA}" : "\u26A0\uFE0F"}</span>
              <span class="page-list-summary__technical-seo-label">Analytics</span>
              <span class="page-list-summary__technical-seo-status">${siteTechnicalSEO.hasAnalytics ? "Configured" : "Not Configured"}</span>
            </div>
            ${siteTechnicalSEO.hasAnalytics ? `
            <div class="page-list-summary__technical-seo-item page-list-summary__technical-seo-item--info">
              <span class="page-list-summary__technical-seo-icon">\u{1F4C8}</span>
              <span class="page-list-summary__technical-seo-label">Analytics Types</span>
              <span class="page-list-summary__technical-seo-status">
                ${siteTechnicalSEO.hasGoogleAnalytics ? "GA4 " : ""}
                ${siteTechnicalSEO.hasGoogleTagManager ? "GTM " : ""}
                ${siteTechnicalSEO.hasFacebookPixel ? "FB " : ""}
                ${siteTechnicalSEO.hasMicrosoftClarity ? "Clarity" : ""}
              </span>
            </div>
            ` : ""}
          </div>
        </div>
      </div>
    </div>
  ` : "";
  const analyticsHtml = "";
  const halfCircumference = circumference / 2;
  const seoArcLength = stats.siteSeoScore / 100 * halfCircumference;
  const aiScoreValue = siteAICrawlability ? siteAICrawlability.score : stats.siteAiScore;
  const aiArcLength = aiScoreValue / 100 * halfCircumference;
  const averageScore = Math.round((stats.siteSeoScore + aiScoreValue) / 2);
  const seoArcDash = `${seoArcLength} ${halfCircumference}`;
  const aiArcDash = `${aiArcLength} ${halfCircumference}`;
  const aiArcOffset = halfCircumference;
  const pageInfo = {
    "overview": {
      title: "Site Overview",
      description: "Comprehensive dashboard showing overall site health, SEO scores, and key metrics across all pages."
    },
    "seo-analysis": {
      title: "SEO Analysis",
      description: "Analyze meta tags, schema markup, and on-page SEO factors to identify optimization opportunities."
    },
    "content-quality": {
      title: "Content Quality",
      description: "Evaluate content quality metrics including word count, readability, citations, and content structure."
    },
    "technical-issues": {
      title: "Technical Issues",
      description: "Identify and fix technical problems including broken links, images, accessibility issues, and more."
    },
    "keyword-research": {
      title: "Keyword Research",
      description: "Research keywords and analyze competitor content to discover SEO opportunities and content gaps."
    }
  };
  const pageData = pageInfo[section] || pageInfo["overview"];
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
        ${section === "keyword-research" ? `
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
        ` : ""}
        ${section === "link-map" ? `
          <div id="page-list-link-map-container"></div>
        ` : ""}
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
                  <div class="page-list-summary-score__metric-fill" style="width: ${Math.round(stats.seoBreakdown.titleOptimal / stats.total * 100)}%"></div>
                </div>
                <div class="page-list-summary-score__metric-details">
                  <span class="page-list-summary-score__metric-optimal ${stats.seoBreakdown.titleOptimal === stats.total ? "metric-optimal--complete" : ""}">
                    ${stats.seoBreakdown.titleOptimal} optimal (30-${TITLE_LIMIT} chars, &lt;920px)
                  </span>
                  ${stats.seoBreakdown.titleOptimal < stats.total ? `<span class="page-list-summary-score__metric-issues">${stats.total - stats.seoBreakdown.titleOptimal} need optimization</span>` : ""}
                </div>
              </div>
              <div class="page-list-summary-score__metric">
                <div class="page-list-summary-score__metric-header">
                  <span class="page-list-summary-score__metric-label">Meta Descriptions</span>
                  <span class="page-list-summary-score__metric-value">${stats.seoBreakdown.descOptimal}/${stats.total}</span>
                </div>
                <div class="page-list-summary-score__metric-bar">
                  <div class="page-list-summary-score__metric-fill" style="width: ${Math.round(stats.seoBreakdown.descOptimal / stats.total * 100)}%"></div>
                </div>
                <div class="page-list-summary-score__metric-details">
                  <span class="page-list-summary-score__metric-optimal ${stats.seoBreakdown.descOptimal === stats.total ? "metric-optimal--complete" : ""}">
                    ${stats.seoBreakdown.descOptimal} optimal (120-${DESC_LIMIT} chars, &lt;1970px)
                  </span>
                  ${stats.seoBreakdown.descOptimal < stats.total ? `<span class="page-list-summary-score__metric-issues">${stats.total - stats.seoBreakdown.descOptimal} need optimization</span>` : ""}
                </div>
              </div>
              <div class="page-list-summary-score__metric">
                <div class="page-list-summary-score__metric-header">
                  <span class="page-list-summary-score__metric-label">HTML/Content Ratio</span>
                  <span class="page-list-summary-score__metric-value">${stats.aiBreakdown.htmlRatioGood}/${stats.total}</span>
                </div>
                <div class="page-list-summary-score__metric-bar">
                  <div class="page-list-summary-score__metric-fill" style="width: ${Math.round(stats.aiBreakdown.htmlRatioGood / stats.total * 100)}%"></div>
                </div>
                <div class="page-list-summary-score__metric-details">
                  <span class="page-list-summary-score__metric-optimal ${stats.aiBreakdown.htmlRatioGood === stats.total ? "metric-optimal--complete" : ""}">
                    ${stats.aiBreakdown.htmlRatioGood} with good ratio (25%+)
                  </span>
                  ${stats.aiBreakdown.htmlRatioGood < stats.total ? `<span class="page-list-summary-score__metric-issues">${stats.total - stats.aiBreakdown.htmlRatioGood} need optimization</span>` : ""}
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
                  <span class="page-list-summary-score__metric-value">${siteAICrawlability.aiBotsAllowed ? "\u2713" : "\u2717"}</span>
                </div>
                <div class="page-list-summary-score__metric-details">
                  <span class="page-list-summary-score__metric-note">
                    GPTBot: ${siteAICrawlability.gptBotAllowed ? "\u2713" : "\u2717"} | 
                    ClaudeBot: ${siteAICrawlability.claudeBotAllowed ? "\u2713" : "\u2717"} | 
                    PerplexityBot: ${siteAICrawlability.perplexityBotAllowed ? "\u2713" : "\u2717"} | 
                    Grok: ${siteAICrawlability.grokBotAllowed ? "\u2713" : "\u2717"} | 
                    Google-Extended: ${siteAICrawlability.googleExtendedAllowed ? "\u2713" : "\u2717"} | 
                    CCBot: ${siteAICrawlability.ccBotAllowed ? "\u2713" : "\u2717"} | 
                    Applebot-Extended: ${siteAICrawlability.applebotExtendedAllowed ? "\u2713" : "\u2717"} | 
                    Bingbot: ${siteAICrawlability.bingbotAllowed ? "\u2713" : "\u2717"}
                  </span>
                </div>
              </div>
              <div class="page-list-summary-score__metric">
                <div class="page-list-summary-score__metric-header">
                  <span class="page-list-summary-score__metric-label">LLMs.txt File</span>
                  <span class="page-list-summary-score__metric-value">${siteAICrawlability.hasLlmTxt ? "\u2713" : "\u2717"}</span>
                </div>
                <div class="page-list-summary-score__metric-details">
                  <span class="page-list-summary-score__metric-note">
                    ${siteAICrawlability.hasLlmTxt ? "LLMs.txt file found (provides structured information to AI crawlers)" : "LLMs.txt file missing (recommended for AI crawlability)"}
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
                    ${siteAICrawlability.importantPagesWithNoindex > 0 ? `| ${siteAICrawlability.importantPagesWithNoindex} important pages blocked` : ""}
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
              ` : ""}
              <div class="page-list-summary-score__metric">
                <div class="page-list-summary-score__metric-header">
                  <span class="page-list-summary-score__metric-label">Page Excerpts</span>
                  <span class="page-list-summary-score__metric-value">${stats.aiBreakdown.summaryOptimal}/${stats.total}</span>
                </div>
                <div class="page-list-summary-score__metric-bar">
                  <div class="page-list-summary-score__metric-fill" style="width: ${Math.round(stats.aiBreakdown.summaryOptimal / stats.total * 100)}%"></div>
                </div>
                <div class="page-list-summary-score__metric-details">
                  <span class="page-list-summary-score__metric-optimal ${stats.aiBreakdown.summaryOptimal === stats.total ? "metric-optimal--complete" : ""}">
                    ${stats.aiBreakdown.summaryOptimal} with optimal length (100-300 chars)
                  </span>
                  ${stats.aiBreakdown.summaryMissing > 0 ? `<span class="page-list-summary-score__metric-issues">${stats.aiBreakdown.summaryMissing} missing</span>` : ""}
                  ${stats.aiBreakdown.summaryTooShort > 0 ? `<span class="page-list-summary-score__metric-issues">${stats.aiBreakdown.summaryTooShort} too short</span>` : ""}
                  ${stats.aiBreakdown.summaryTooLong > 0 ? `<span class="page-list-summary-score__metric-issues">${stats.aiBreakdown.summaryTooLong} too long</span>` : ""}
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
      ${section === "keyword-research" ? `
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
            <button class="page-list-summary__stat page-list-summary__stat--clickable ${activeFilter === "all" ? "page-list-summary__stat--active" : ""}" data-filter="all">
              <div class="page-list-summary__value">${stats.total}</div>
              <div class="page-list-summary__label">Total Pages</div>
            </button>
            <button class="page-list-summary__stat page-list-summary__stat--clickable page-list-summary__stat--warning ${activeFilter === "with-issues" ? "page-list-summary__stat--active" : ""}" data-filter="with-issues" ${stats.withIssues === 0 ? "disabled" : ""}>
              <div class="page-list-summary__value">${stats.withIssues}</div>
              <div class="page-list-summary__label">Pages with Issues</div>
            </button>
            <button class="page-list-summary__stat page-list-summary__stat--clickable page-list-summary__stat--success ${activeFilter === "good" ? "page-list-summary__stat--active" : ""}" data-filter="good" ${stats.total - stats.withIssues === 0 ? "disabled" : ""}>
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
          ` : ""}
          <div class="page-list-summary__grid">
            <button class="page-list-summary__stat page-list-summary__stat--clickable page-list-summary__stat--${stats.missingTitle > 0 ? "error" : "success"} ${activeFilter === "missing-title" ? "page-list-summary__stat--active" : ""}" data-filter="missing-title" ${stats.missingTitle === 0 ? "disabled" : ""}>
              <div class="page-list-summary__value">${formatIssueCount(stats.missingTitle)}</div>
              <div class="page-list-summary__label">Missing Titles</div>
            </button>
            <button class="page-list-summary__stat page-list-summary__stat--clickable page-list-summary__stat--${stats.missingDesc > 0 ? "error" : "success"} ${activeFilter === "missing-description" ? "page-list-summary__stat--active" : ""}" data-filter="missing-description" ${stats.missingDesc === 0 ? "disabled" : ""}>
              <div class="page-list-summary__value">${formatIssueCount(stats.missingDesc)}</div>
              <div class="page-list-summary__label">Missing Descriptions</div>
            </button>
            <button class="page-list-summary__stat page-list-summary__stat--clickable page-list-summary__stat--${stats.titleOverLimit + stats.titleOverPixels > 0 ? "error" : "success"} ${activeFilter === "title-over-limit" ? "page-list-summary__stat--active" : ""}" data-filter="title-over-limit" ${stats.titleOverLimit + stats.titleOverPixels === 0 ? "disabled" : ""}>
              <div class="page-list-summary__value">${formatIssueCount(stats.titleOverLimit + stats.titleOverPixels)}</div>
              <div class="page-list-summary__label">Title Issues</div>
            </button>
            <button class="page-list-summary__stat page-list-summary__stat--clickable page-list-summary__stat--${stats.descOverLimit + stats.descOverPixels > 0 ? "error" : "success"} ${activeFilter === "description-over-limit" ? "page-list-summary__stat--active" : ""}" data-filter="description-over-limit" ${stats.descOverLimit + stats.descOverPixels === 0 ? "disabled" : ""}>
              <div class="page-list-summary__value">${formatIssueCount(stats.descOverLimit + stats.descOverPixels)}</div>
              <div class="page-list-summary__label">Description Issues</div>
            </button>
            <button class="page-list-summary__stat page-list-summary__stat--clickable page-list-summary__stat--${stats.titleOverPixels > 0 || stats.descOverPixels > 0 ? "error" : "success"} ${activeFilter === "pixel-issues" ? "page-list-summary__stat--active" : ""}" data-filter="pixel-issues" ${stats.titleOverPixels + stats.descOverPixels === 0 ? "disabled" : ""}>
              <div class="page-list-summary__value">${formatIssueCount(stats.titleOverPixels + stats.descOverPixels)}</div>
              <div class="page-list-summary__label">
                Pixel Issues
                ${createTooltip("Titles and descriptions can be cut off in search results if they exceed pixel width limits (920px desktop, 1300px mobile). Even if character count is acceptable, long words or wide characters can cause truncation.")}
              </div>
            </button>
          </div>
        </div>
        <div class="page-list-filter-tab-content" data-tab-content="technical">
          <div class="page-list-summary__grid">
            <button class="page-list-summary__stat page-list-summary__stat--clickable page-list-summary__stat--${stats.technicalSEO.brokenLinks > 0 ? "error" : "success"} ${activeFilter === "broken-links" ? "page-list-summary__stat--active" : ""}" data-filter="broken-links" ${stats.technicalSEO.brokenLinks === 0 ? "disabled" : ""}>
              <div class="page-list-summary__value">${formatIssueCount(stats.technicalSEO.brokenLinks)}</div>
              <div class="page-list-summary__label">Broken Links</div>
            </button>
            <button class="page-list-summary__stat page-list-summary__stat--clickable page-list-summary__stat--${stats.technicalSEO.brokenImages > 0 ? "error" : "success"} ${activeFilter === "broken-images" ? "page-list-summary__stat--active" : ""}" data-filter="broken-images" ${stats.technicalSEO.brokenImages === 0 ? "disabled" : ""}>
              <div class="page-list-summary__value">${formatIssueCount(stats.technicalSEO.brokenImages)}</div>
              <div class="page-list-summary__label">Broken Images</div>
            </button>
            <button class="page-list-summary__stat page-list-summary__stat--clickable page-list-summary__stat--${stats.technicalSEO.imagesWithoutAlt > 0 ? "error" : "success"} ${activeFilter === "images-no-alt" ? "page-list-summary__stat--active" : ""}" data-filter="images-no-alt" ${stats.technicalSEO.imagesWithoutAlt === 0 ? "disabled" : ""}>
              <div class="page-list-summary__value">${formatIssueCount(stats.technicalSEO.imagesWithoutAlt)}</div>
              <div class="page-list-summary__label">Images w/o Alt</div>
            </button>
            <button class="page-list-summary__stat page-list-summary__stat--clickable page-list-summary__stat--${stats.technicalSEO.headingStructureIssues > 0 ? "error" : "success"} ${activeFilter === "heading-structure" ? "page-list-summary__stat--active" : ""}" data-filter="heading-structure" ${stats.technicalSEO.headingStructureIssues === 0 ? "disabled" : ""}>
              <div class="page-list-summary__value">${formatIssueCount(stats.technicalSEO.headingStructureIssues)}</div>
              <div class="page-list-summary__label">
                Heading Structure
                ${createTooltip("Headings should follow a logical hierarchy (H1 \u2192 H2 \u2192 H3). Skipping levels (e.g., H1 to H3) confuses search engines and screen readers. Maintain proper nesting for better SEO and accessibility.")}
              </div>
            </button>
            <button class="page-list-summary__stat page-list-summary__stat--clickable page-list-summary__stat--${stats.onPageSEO.imagesNotNextGen > 0 ? "warning" : "success"} ${activeFilter === "images-not-nextgen" ? "page-list-summary__stat--active" : ""}" data-filter="images-not-nextgen" ${stats.onPageSEO.imagesNotNextGen === 0 ? "disabled" : ""}>
              <div class="page-list-summary__value">${formatIssueCount(stats.onPageSEO.imagesNotNextGen)}</div>
              <div class="page-list-summary__label">
                Images Not Next-Gen
                ${createTooltip("Next-generation image formats (WebP, AVIF) provide better compression and faster loading than JPEG/PNG. Converting images to WebP or AVIF can reduce file sizes by 25-50% while maintaining quality, improving page load times and Core Web Vitals.")}
              </div>
            </button>
            <button class="page-list-summary__stat page-list-summary__stat--clickable page-list-summary__stat--${stats.onPageSEO.imagesWithoutLazyLoading > 0 ? "warning" : "success"} ${activeFilter === "images-no-lazy" ? "page-list-summary__stat--active" : ""}" data-filter="images-no-lazy" ${stats.onPageSEO.imagesWithoutLazyLoading === 0 ? "disabled" : ""}>
              <div class="page-list-summary__value">${formatIssueCount(stats.onPageSEO.imagesWithoutLazyLoading)}</div>
              <div class="page-list-summary__label">
                Images w/o Lazy Load
                ${createTooltip(`Lazy loading defers loading images until they're needed (when scrolling into view). This reduces initial page load time, saves bandwidth, and improves Core Web Vitals (LCP, FCP). Add loading="lazy" to offscreen images.`)}
              </div>
            </button>
            <button class="page-list-summary__stat page-list-summary__stat--clickable page-list-summary__stat--${stats.onPageSEO.noLangAttribute > 0 ? "warning" : "success"} ${activeFilter === "no-lang" ? "page-list-summary__stat--active" : ""}" data-filter="no-lang" ${stats.onPageSEO.noLangAttribute === 0 ? "disabled" : ""}>
              <div class="page-list-summary__value">${formatIssueCount(stats.onPageSEO.noLangAttribute)}</div>
              <div class="page-list-summary__label">
                No Lang Attribute
                ${createTooltip("The HTML lang attribute helps screen readers pronounce content correctly and helps search engines understand the page language. Essential for accessibility and SEO. Should be set on the <html> tag.")}
              </div>
            </button>
            <button class="page-list-summary__stat page-list-summary__stat--clickable page-list-summary__stat--${stats.onPageSEO.noCanonical > 0 ? "warning" : "success"} ${activeFilter === "no-canonical" ? "page-list-summary__stat--active" : ""}" data-filter="no-canonical" ${stats.onPageSEO.noCanonical === 0 ? "disabled" : ""}>
              <div class="page-list-summary__value">${formatIssueCount(stats.onPageSEO.noCanonical)}</div>
              <div class="page-list-summary__label">
                No Canonical Link
                ${createTooltip("Canonical links tell search engines which version of a page is the preferred one, preventing duplicate content issues. Essential for SEO when you have multiple URLs pointing to the same content.")}
              </div>
            </button>
            <button class="page-list-summary__stat page-list-summary__stat--clickable page-list-summary__stat--${stats.onPageSEO.mixedContent > 0 ? "error" : "success"} ${activeFilter === "mixed-content" ? "page-list-summary__stat--active" : ""}" data-filter="mixed-content" ${stats.onPageSEO.mixedContent === 0 ? "disabled" : ""}>
              <div class="page-list-summary__value">${formatIssueCount(stats.onPageSEO.mixedContent)}</div>
              <div class="page-list-summary__label">
                Mixed Content
                ${createTooltip("Mixed content occurs when an HTTPS page loads resources (images, scripts, stylesheets) over HTTP. This creates security vulnerabilities, triggers browser warnings, and can break functionality. All resources should use HTTPS.")}
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
          ` : ""}
          <div class="page-list-summary__grid">
            <button class="page-list-summary__stat page-list-summary__stat--clickable page-list-summary__stat--${stats.technicalSEO.pagesWithoutAnalytics > 0 ? "warning" : "success"} ${activeFilter === "no-analytics" ? "page-list-summary__stat--active" : ""}" data-filter="no-analytics" ${stats.technicalSEO.pagesWithoutAnalytics === 0 ? "disabled" : ""}>
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
              ` : ""}
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
              ` : ""}
            </div>
          ` : ""}
          <div class="page-list-summary__grid">
            <button class="page-list-summary__stat page-list-summary__stat--clickable page-list-summary__stat--${stats.onPageSEO.multipleH1Issues > 0 ? "error" : "success"} ${activeFilter === "multiple-h1" ? "page-list-summary__stat--active" : ""}" data-filter="multiple-h1" ${stats.onPageSEO.multipleH1Issues === 0 ? "disabled" : ""}>
              <div class="page-list-summary__value">${formatIssueCount(stats.onPageSEO.multipleH1Issues)}</div>
              <div class="page-list-summary__label">Multiple H1</div>
            </button>
            <button class="page-list-summary__stat page-list-summary__stat--clickable page-list-summary__stat--${stats.onPageSEO.noH1Issues > 0 ? "error" : "success"} ${activeFilter === "no-h1" ? "page-list-summary__stat--active" : ""}" data-filter="no-h1" ${stats.onPageSEO.noH1Issues === 0 ? "disabled" : ""}>
              <div class="page-list-summary__value">${formatIssueCount(stats.onPageSEO.noH1Issues)}</div>
              <div class="page-list-summary__label">No H1</div>
            </button>
            <button class="page-list-summary__stat page-list-summary__stat--clickable page-list-summary__stat--${stats.onPageSEO.noH2Issues > 0 ? "warning" : "success"} ${activeFilter === "no-h2" ? "page-list-summary__stat--active" : ""}" data-filter="no-h2" ${stats.onPageSEO.noH2Issues === 0 ? "disabled" : ""}>
              <div class="page-list-summary__value">${formatIssueCount(stats.onPageSEO.noH2Issues)}</div>
              <div class="page-list-summary__label">No H2</div>
            </button>
            <button class="page-list-summary__stat page-list-summary__stat--clickable page-list-summary__stat--${stats.onPageSEO.internalLinkIssues > 0 ? "warning" : "success"} ${activeFilter === "internal-links" ? "page-list-summary__stat--active" : ""}" data-filter="internal-links" ${stats.onPageSEO.internalLinkIssues === 0 ? "disabled" : ""}>
              <div class="page-list-summary__value">${formatIssueCount(stats.onPageSEO.internalLinkIssues)}</div>
              <div class="page-list-summary__label">
                Link Count Issues
                ${createTooltip("Pages should have 3-5 internal links. Too few (0-2) limits discoverability and site structure understanding. Too many (6+) can look spammy and dilute link value. Aim for quality, relevant internal links.")}
              </div>
            </button>
            <button class="page-list-summary__stat page-list-summary__stat--clickable page-list-summary__stat--${stats.onPageSEO.genericAnchorIssues > 0 ? "warning" : "success"} ${activeFilter === "generic-anchors" ? "page-list-summary__stat--active" : ""}" data-filter="generic-anchors" ${stats.onPageSEO.genericAnchorIssues === 0 ? "disabled" : ""}>
              <div class="page-list-summary__value">${formatIssueCount(stats.onPageSEO.genericAnchorIssues)}</div>
              <div class="page-list-summary__label">
                Generic Anchors
                ${createTooltip(`Generic anchor text like "click here", "read more", or "here" doesn't help search engines understand the link destination. Use descriptive anchor text that explains what users will find when they click.`)}
              </div>
            </button>
            <button class="page-list-summary__stat page-list-summary__stat--clickable page-list-summary__stat--${stats.onPageSEO.noSchemaMarkup > 0 ? "warning" : "success"} ${activeFilter === "no-schema" ? "page-list-summary__stat--active" : ""}" data-filter="no-schema" ${stats.onPageSEO.noSchemaMarkup === 0 ? "disabled" : ""}>
              <div class="page-list-summary__value">${formatIssueCount(stats.onPageSEO.noSchemaMarkup)}</div>
              <div class="page-list-summary__label">
                No Schema
                ${createTooltip("Schema markup (JSON-LD) helps search engines understand your content structure. It can enable rich snippets in search results, improving click-through rates. All pages should have at least LocalBusiness schema.")}
              </div>
            </button>
            <button class="page-list-summary__stat page-list-summary__stat--clickable page-list-summary__stat--${stats.onPageSEO.urlLengthIssues > 0 ? "warning" : "success"} ${activeFilter === "url-length" ? "page-list-summary__stat--active" : ""}" data-filter="url-length" ${stats.onPageSEO.urlLengthIssues === 0 ? "disabled" : ""}>
              <div class="page-list-summary__value">${formatIssueCount(stats.onPageSEO.urlLengthIssues)}</div>
              <div class="page-list-summary__label">
                URL Too Long
                ${createTooltip("URLs should be under 75 characters ideally, and under 100 characters maximum. Shorter URLs are easier to read, share, and remember. Long URLs can be cut off in search results and look unprofessional.")}
              </div>
            </button>
            <button class="page-list-summary__stat page-list-summary__stat--clickable page-list-summary__stat--${stats.onPageSEO.outboundLinksTooFew > 0 ? "warning" : "success"} ${activeFilter === "outbound-links" ? "page-list-summary__stat--active" : ""}" data-filter="outbound-links" ${stats.onPageSEO.outboundLinksTooFew === 0 ? "disabled" : ""}>
              <div class="page-list-summary__value">${formatIssueCount(stats.onPageSEO.outboundLinksTooFew)}</div>
              <div class="page-list-summary__label">
                No Outbound Links
                ${createTooltip("Outbound links (external, dofollow links) to authoritative sources show you've researched your content and provide value to readers. Aim for at least 1-2 relevant external links per page to support E-E-A-T signals.")}
              </div>
            </button>
            <button class="page-list-summary__stat page-list-summary__stat--clickable page-list-summary__stat--${stats.onPageSEO.paragraphLengthIssues > 0 ? "warning" : "success"} ${activeFilter === "paragraph-length" ? "page-list-summary__stat--active" : ""}" data-filter="paragraph-length" ${stats.onPageSEO.paragraphLengthIssues === 0 ? "disabled" : ""}>
              <div class="page-list-summary__value">${formatIssueCount(stats.onPageSEO.paragraphLengthIssues)}</div>
              <div class="page-list-summary__label">
                Long Paragraphs
                ${createTooltip("Paragraphs should be under 150 words ideally, and under 200 words maximum. Long paragraphs are hard to read, especially on mobile devices. Break up long paragraphs into shorter, digestible chunks for better readability.")}
              </div>
            </button>
            <button class="page-list-summary__stat page-list-summary__stat--clickable page-list-summary__stat--${stats.onPageSEO.subheadingDistributionIssues > 0 ? "warning" : "success"} ${activeFilter === "subheading-distribution" ? "page-list-summary__stat--active" : ""}" data-filter="subheading-distribution" ${stats.onPageSEO.subheadingDistributionIssues === 0 ? "disabled" : ""}>
              <div class="page-list-summary__value">${formatIssueCount(stats.onPageSEO.subheadingDistributionIssues)}</div>
              <div class="page-list-summary__label">
                Subheading Spacing
                ${createTooltip("Subheadings (H2, H3) should appear roughly every 300 words to break up long content blocks. This improves readability, helps users scan content, and signals content structure to search engines.")}
              </div>
            </button>
            <button class="page-list-summary__stat page-list-summary__stat--clickable page-list-summary__stat--${stats.onPageSEO.mediaUsageTooFew > 0 ? "warning" : "success"} ${activeFilter === "media-usage" ? "page-list-summary__stat--active" : ""}" data-filter="media-usage" ${stats.onPageSEO.mediaUsageTooFew === 0 ? "disabled" : ""}>
              <div class="page-list-summary__value">${formatIssueCount(stats.onPageSEO.mediaUsageTooFew)}</div>
              <div class="page-list-summary__label">
                Low Media Usage
                ${createTooltip("Pages should have at least 3-4 images or videos to enhance engagement and break up text. Visual content improves user experience, increases time on page, and can help with rankings.")}
              </div>
            </button>
            <button class="page-list-summary__stat page-list-summary__stat--clickable page-list-summary__stat--${stats.onPageSEO.noDateInfo > 0 ? "warning" : "success"} ${activeFilter === "no-date-info" ? "page-list-summary__stat--active" : ""}" data-filter="no-date-info" ${stats.onPageSEO.noDateInfo === 0 ? "disabled" : ""}>
              <div class="page-list-summary__value">${formatIssueCount(stats.onPageSEO.noDateInfo)}</div>
              <div class="page-list-summary__label">
                No Date Info
                ${createTooltip("Pages should have a published date and/or last modified date. This helps establish content freshness, builds trust with users, and is an important E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness) signal for search engines.")}
              </div>
            </button>
            <button class="page-list-summary__stat page-list-summary__stat--clickable page-list-summary__stat--${stats.onPageSEO.noMobileViewport > 0 ? "warning" : "success"} ${activeFilter === "no-mobile-viewport" ? "page-list-summary__stat--active" : ""}" data-filter="no-mobile-viewport" ${stats.onPageSEO.noMobileViewport === 0 ? "disabled" : ""}>
              <div class="page-list-summary__value">${formatIssueCount(stats.onPageSEO.noMobileViewport)}</div>
              <div class="page-list-summary__label">
                No Mobile Viewport
                ${createTooltip("The viewport meta tag tells mobile browsers how to display your page. Without it, mobile devices may render pages at desktop width, creating a poor user experience. Essential for mobile-first indexing.")}
              </div>
            </button>
            <button class="page-list-summary__stat page-list-summary__stat--clickable page-list-summary__stat--${stats.onPageSEO.socialMetaIncomplete > 0 ? "warning" : "success"} ${activeFilter === "social-meta" ? "page-list-summary__stat--active" : ""}" data-filter="social-meta" ${stats.onPageSEO.socialMetaIncomplete === 0 ? "disabled" : ""}>
              <div class="page-list-summary__value">${formatIssueCount(stats.onPageSEO.socialMetaIncomplete)}</div>
              <div class="page-list-summary__label">
                Incomplete Social Meta
                ${createTooltip("Open Graph (Facebook) and Twitter Card meta tags control how your content appears when shared on social media. Complete social meta tags (title, description, image) improve click-through rates and brand presentation.")}
              </div>
            </button>
          </div>
        </div>
        <div class="page-list-filter-tab-content" data-tab-content="content">
          <div class="page-list-summary__grid">
            <button class="page-list-summary__stat page-list-summary__stat--clickable page-list-summary__stat--${stats.contentQuality.wordCountIssues > 0 ? "warning" : "success"} ${activeFilter === "low-word-count" ? "page-list-summary__stat--active" : ""}" data-filter="low-word-count" ${stats.contentQuality.wordCountIssues === 0 ? "disabled" : ""}>
              <div class="page-list-summary__value">${formatIssueCount(stats.contentQuality.wordCountIssues)}</div>
              <div class="page-list-summary__label">Low Word Count</div>
            </button>
            <button class="page-list-summary__stat page-list-summary__stat--clickable page-list-summary__stat--${stats.contentQuality.staleContent > 0 ? "warning" : "success"} ${activeFilter === "stale-content" ? "page-list-summary__stat--active" : ""}" data-filter="stale-content" ${stats.contentQuality.staleContent === 0 ? "disabled" : ""}>
              <div class="page-list-summary__value">${formatIssueCount(stats.contentQuality.staleContent)}</div>
              <div class="page-list-summary__label">Stale Content</div>
            </button>
            <button class="page-list-summary__stat page-list-summary__stat--clickable page-list-summary__stat--${stats.contentQuality.noCitations > 0 ? "warning" : "success"} ${activeFilter === "no-citations" ? "page-list-summary__stat--active" : ""}" data-filter="no-citations" ${stats.contentQuality.noCitations === 0 ? "disabled" : ""}>
              <div class="page-list-summary__value">${formatIssueCount(stats.contentQuality.noCitations)}</div>
              <div class="page-list-summary__label">No Citations</div>
            </button>
            <button class="page-list-summary__stat page-list-summary__stat--clickable page-list-summary__stat--${stats.contentQuality.noAuthor > 0 ? "warning" : "success"} ${activeFilter === "no-author" ? "page-list-summary__stat--active" : ""}" data-filter="no-author" ${stats.contentQuality.noAuthor === 0 ? "disabled" : ""}>
              <div class="page-list-summary__value">${formatIssueCount(stats.contentQuality.noAuthor)}</div>
              <div class="page-list-summary__label">No Author</div>
            </button>
            <button class="page-list-summary__stat page-list-summary__stat--clickable page-list-summary__stat--${stats.contentQuality.videosWithoutTranscript > 0 ? "warning" : "success"} ${activeFilter === "videos-no-transcript" ? "page-list-summary__stat--active" : ""}" data-filter="videos-no-transcript" ${stats.contentQuality.videosWithoutTranscript === 0 ? "disabled" : ""}>
              <div class="page-list-summary__value">${formatIssueCount(stats.contentQuality.videosWithoutTranscript)}</div>
              <div class="page-list-summary__label">Videos w/o Transcript</div>
            </button>
            <button class="page-list-summary__stat page-list-summary__stat--clickable page-list-summary__stat--${stats.contentQuality.noExcerpt > 0 ? "error" : "success"} ${activeFilter === "no-excerpt" ? "page-list-summary__stat--active" : ""}" data-filter="no-excerpt" ${stats.contentQuality.noExcerpt === 0 ? "disabled" : ""}>
              <div class="page-list-summary__value">${formatIssueCount(stats.contentQuality.noExcerpt)}</div>
              <div class="page-list-summary__label">
                No Excerpt
                ${createTooltip("Page excerpts (summaries) help AI crawlers and search engines understand page content quickly. They appear in search results, social shares, and help with content discovery. Every page should have a meaningful excerpt (100-300 characters optimal).")}
              </div>
            </button>
            <button class="page-list-summary__stat page-list-summary__stat--clickable page-list-summary__stat--${stats.contentQuality.excerptTooShort > 0 ? "warning" : "success"} ${activeFilter === "excerpt-too-short" ? "page-list-summary__stat--active" : ""}" data-filter="excerpt-too-short" ${stats.contentQuality.excerptTooShort === 0 ? "disabled" : ""}>
              <div class="page-list-summary__value">${formatIssueCount(stats.contentQuality.excerptTooShort)}</div>
              <div class="page-list-summary__label">
                Excerpt Too Short
                ${createTooltip("Excerpts under 50 characters provide insufficient context. Optimal excerpts are 100-300 characters, providing enough detail for AI crawlers and search engines to understand the page content without being too long.")}
              </div>
            </button>
            <button class="page-list-summary__stat page-list-summary__stat--clickable page-list-summary__stat--${stats.contentQuality.excerptTooLong > 0 ? "warning" : "success"} ${activeFilter === "excerpt-too-long" ? "page-list-summary__stat--active" : ""}" data-filter="excerpt-too-long" ${stats.contentQuality.excerptTooLong === 0 ? "disabled" : ""}>
              <div class="page-list-summary__value">${formatIssueCount(stats.contentQuality.excerptTooLong)}</div>
              <div class="page-list-summary__label">
                Excerpt Too Long
                ${createTooltip("Excerpts over 300 characters may be truncated in search results and social shares, losing important information. Keep excerpts concise (100-300 characters) to ensure the full message is displayed.")}
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
              ` : ""}
            </div>
          ` : ""}
          <div class="page-list-summary__grid">
            <button class="page-list-summary__stat page-list-summary__stat--clickable page-list-summary__stat--${stats.accessibility.contrastRatioIssues > 0 ? "error" : "success"} ${activeFilter === "contrast-ratio" ? "page-list-summary__stat--active" : ""}" data-filter="contrast-ratio" ${stats.accessibility.contrastRatioIssues === 0 ? "disabled" : ""}>
              <div class="page-list-summary__value">${formatIssueCount(stats.accessibility.contrastRatioIssues)}</div>
              <div class="page-list-summary__label">
                Contrast Ratio Issues
                ${createTooltip("WCAG AA requires 4.5:1 contrast ratio for normal text (3:1 for large text). Low contrast makes content hard to read, especially for users with visual impairments. Check text/background color combinations.")}
              </div>
            </button>
            <button class="page-list-summary__stat page-list-summary__stat--clickable page-list-summary__stat--${stats.accessibility.missingAriaLabels > 0 ? "warning" : "success"} ${activeFilter === "missing-aria" ? "page-list-summary__stat--active" : ""}" data-filter="missing-aria" ${stats.accessibility.missingAriaLabels === 0 ? "disabled" : ""}>
              <div class="page-list-summary__value">${formatIssueCount(stats.accessibility.missingAriaLabels)}</div>
              <div class="page-list-summary__label">
                Missing ARIA Labels
                ${createTooltip("ARIA labels provide accessible names for interactive elements. Missing labels make it difficult for screen readers to identify buttons, links, and form controls. Add aria-label or aria-labelledby attributes.")}
              </div>
            </button>
            <button class="page-list-summary__stat page-list-summary__stat--clickable page-list-summary__stat--${stats.accessibility.keyboardNavigationIssues > 0 ? "error" : "success"} ${activeFilter === "keyboard-nav" ? "page-list-summary__stat--active" : ""}" data-filter="keyboard-nav" ${stats.accessibility.keyboardNavigationIssues === 0 ? "disabled" : ""}>
              <div class="page-list-summary__value">${formatIssueCount(stats.accessibility.keyboardNavigationIssues)}</div>
              <div class="page-list-summary__label">
                Keyboard Navigation Issues
                ${createTooltip("All interactive elements must be keyboard accessible. Users should be able to navigate and activate all controls using only the keyboard (Tab, Enter, Space, Arrow keys). Check for elements that can't be reached or activated via keyboard.")}
              </div>
            </button>
            <button class="page-list-summary__stat page-list-summary__stat--clickable page-list-summary__stat--${stats.accessibility.noFocusIndicators > 0 ? "error" : "success"} ${activeFilter === "no-focus-indicators" ? "page-list-summary__stat--active" : ""}" data-filter="no-focus-indicators" ${stats.accessibility.noFocusIndicators === 0 ? "disabled" : ""}>
              <div class="page-list-summary__value">${formatIssueCount(stats.accessibility.noFocusIndicators)}</div>
              <div class="page-list-summary__label">
                No Focus Indicators
                ${createTooltip("Focus indicators (outlines) show which element is currently focused when navigating with keyboard. Without visible focus indicators, keyboard users can't tell where they are on the page. Ensure focus styles are visible and meet contrast requirements.")}
              </div>
            </button>
            <button class="page-list-summary__stat page-list-summary__stat--clickable page-list-summary__stat--${stats.technicalSEO.imagesWithoutAlt > 0 ? "error" : "success"} ${activeFilter === "images-no-alt" ? "page-list-summary__stat--active" : ""}" data-filter="images-no-alt" ${stats.technicalSEO.imagesWithoutAlt === 0 ? "disabled" : ""}>
              <div class="page-list-summary__value">${formatIssueCount(stats.technicalSEO.imagesWithoutAlt)}</div>
              <div class="page-list-summary__label">
                Images w/o Alt Text
                ${createTooltip('Alt text describes images for screen reader users. All images should have descriptive alt attributes. Decorative images should have empty alt="" attributes. Missing alt text prevents visually impaired users from understanding image content.')}
              </div>
            </button>
          </div>
        </div>
      </div>
      ` : ""}
      ${analyticsHtml}
    </div>
  `;
}
function getStatusBadges(page) {
  const badges = [];
  if (!page.hasMetaTitle) {
    badges.push({ text: "Missing Title", class: "badge-error" });
  } else if (page.titleOverPixels) {
    badges.push({ text: "Title Over Pixels", class: "badge-error" });
  } else if (page.titleOverLimit) {
    badges.push({ text: "Title Too Long", class: "badge-error" });
  }
  if (!page.hasMetaDescription) {
    badges.push({ text: "Missing Desc", class: "badge-error" });
  } else if (page.descriptionOverPixels) {
    badges.push({ text: "Desc Over Pixels", class: "badge-error" });
  } else if (page.descriptionOverLimit) {
    badges.push({ text: "Desc Too Long", class: "badge-error" });
  }
  if (page.hasBrokenLinks) {
    badges.push({ text: `${page.brokenLinks} Broken Link${page.brokenLinks > 1 ? "s" : ""}`, class: "badge-error" });
  }
  if (page.hasBrokenImages) {
    badges.push({ text: `${page.brokenImages || 0} Broken Image${(page.brokenImages || 0) > 1 ? "s" : ""}`, class: "badge-error" });
  }
  if (page.hasImagesWithoutAlt) {
    badges.push({ text: `${page.imagesWithoutAlt} Image${page.imagesWithoutAlt > 1 ? "s" : ""} w/o Alt`, class: "badge-warning" });
  }
  if (!page.headingStructureGood) {
    badges.push({ text: "Heading Structure", class: "badge-warning" });
  }
  if (page.hasMultipleH1) {
    badges.push({ text: `${page.h1Count} H1${page.h1Count > 1 ? "s" : ""}`, class: "badge-error" });
  }
  if (page.h1Count === 0) {
    badges.push({ text: "No H1", class: "badge-error" });
  }
  if (!page.hasH2s) {
    badges.push({ text: "No H2", class: "badge-warning" });
  }
  if (page.internalLinksTooFew) {
    badges.push({ text: `Only ${page.internalLinkCount} Link${page.internalLinkCount !== 1 ? "s" : ""}`, class: "badge-warning" });
  }
  if (page.internalLinksTooMany) {
    badges.push({ text: `${page.internalLinkCount} Links`, class: "badge-warning" });
  }
  if (page.hasGenericAnchors) {
    badges.push({ text: `${page.genericAnchorCount} Generic Anchor${page.genericAnchorCount > 1 ? "s" : ""}`, class: "badge-warning" });
  }
  if (page.hasGenericAltText) {
    badges.push({ text: `${page.imagesWithGenericAlt} Generic Alt`, class: "badge-warning" });
  }
  if (!page.hasSchemaMarkup) {
    badges.push({ text: "No Schema", class: "badge-warning" });
  }
  if (!page.firstParaGood) {
    badges.push({ text: "Short First Para", class: "badge-warning" });
  }
  if (page.wordCountPoor) {
    badges.push({ text: `${page.wordCount} Words`, class: "badge-warning" });
  }
  if (page.isStale) {
    const months = Math.floor(page.daysSinceUpdate / 30);
    badges.push({ text: `${months}M Old`, class: "badge-warning" });
  }
  if (!page.hasCitations) {
    badges.push({ text: "No Citations", class: "badge-warning" });
  }
  if (!page.hasAuthor) {
    badges.push({ text: "No Author", class: "badge-warning" });
  }
  if (page.hasVideos && !page.hasTranscript) {
    badges.push({ text: "No Transcript", class: "badge-warning" });
  }
  if (!page.readabilityGood && page.avgSentenceLength > 0) {
    badges.push({ text: `Avg ${Math.round(page.avgSentenceLength)}w/sent`, class: "badge-warning" });
  }
  if (!page.hasAnalytics) {
    badges.push({ text: "No Analytics", class: "badge-warning" });
  }
  if (page.hasContrastRatioIssues && page.contrastRatioIssues) {
    badges.push({ text: `${page.contrastRatioIssues} Contrast Issue${page.contrastRatioIssues > 1 ? "s" : ""}`, class: "badge-error" });
  }
  if (page.hasMissingAriaLabels && page.missingAriaLabels) {
    badges.push({ text: `${page.missingAriaLabels} Missing ARIA`, class: "badge-warning" });
  }
  if (page.hasKeyboardNavigationIssues && page.keyboardNavigationIssues) {
    badges.push({ text: "Keyboard Nav Issues", class: "badge-error" });
  }
  if (page.hasFocusIndicators === false) {
    badges.push({ text: "No Focus Indicators", class: "badge-error" });
  }
  return badges;
}
function renderScore(score, label) {
  if (score === null || score === void 0 || typeof score !== "number" || isNaN(score)) {
    return "";
  }
  const scoreClass = getScoreClass(score);
  const CIRCLE_RADIUS = 54;
  const CIRCUMFERENCE2 = 2 * Math.PI * CIRCLE_RADIUS;
  const dashArray = score / 100 * CIRCUMFERENCE2;
  const normalizedLabel = label.toUpperCase();
  return `
    <div class="page-list-score ${scoreClass} page-list-score--circular">
      <div class="page-list-score__circle">
        <svg class="page-list-score__circle-svg" viewBox="0 0 120 120">
          <circle class="page-list-score__circle-bg" cx="60" cy="60" r="${CIRCLE_RADIUS}"></circle>
          <circle class="page-list-score__circle-fill ${scoreClass}" cx="60" cy="60" r="${CIRCLE_RADIUS}" 
            style="stroke-dasharray: ${dashArray} ${CIRCUMFERENCE2};"></circle>
        </svg>
        <div class="page-list-score__circle-value">
          <span class="page-list-score__circle-number">${score}</span>
          <span class="page-list-score__circle-label">${normalizedLabel}</span>
        </div>
      </div>
    </div>
  `;
}
function renderPageDetailModal(page) {
  const badges = getStatusBadges(page);
  const badgesHtml = badges.length > 0 ? `<div class="page-list-detail-badges">${badges.map((b) => `<span class="page-list-badge ${b.class}">${b.text}</span>`).join("")}</div>` : '<div class="page-list-detail-badges"><span class="page-list-badge badge-success">All Good \u2713</span></div>';
  return `
    <div class="page-list-modal" id="page-list-modal">
      <div class="page-list-modal__overlay"></div>
      <div class="page-list-modal__content">
        <button class="page-list-modal__close" id="page-list-modal-close">\xD7</button>
        <div class="page-list-modal__header">
          <h2 class="page-list-modal__title">${escapeHtml(page.title)}</h2>
          <a href="${page.relPermalink}" target="_blank" rel="noopener noreferrer" class="page-list-modal__link">
            ${page.relPermalink} \u2197
          </a>
        </div>
        <div class="page-list-modal__body">
          <div class="page-list-modal__scores">
            ${renderScore(page.seoScore, "SEO")}
            ${renderScore(page.aiCrawlabilityScore, "AI")}
            ${page.accessibilityScore !== void 0 && page.accessibilityScore !== null ? renderScore(page.accessibilityScore, "A11y") : ""}
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
            ` : ""}
          </div>
          <div class="page-list-modal__sections">
            <div class="page-list-modal__section page-list-modal__section--active" id="page-list-tab-meta" role="tabpanel" aria-labelledby="page-list-tab-btn-meta" data-section="meta">
              <h3 class="page-list-modal__section-title">Meta Tags</h3>
              <div class="page-list-modal__section-content">
                <div class="page-list-modal__field">
                  <label>
                    Meta Title
                    ${createTooltip("Meta titles should be 30-60 characters and under 920px wide on desktop. They appear in search results and browser tabs. Keep them concise and descriptive.")}
                  </label>
                  <div class="page-list-modal__value ${!page.hasMetaTitle ? "page-list-modal__value--missing" : ""}">
                    ${page.hasMetaTitle ? escapeHtml(page.metaTitle) : "<em>Missing</em>"}
                  </div>
                  ${page.hasMetaTitle ? `
                    <div class="page-list-modal__metrics">
                      <span>${page.metaTitleLength} chars / ${TITLE_LIMIT}</span>
                      <span>${Math.round(page.titlePixels)}px / ${TITLE_PIXEL_LIMIT_DESKTOP}</span>
                    </div>
                  ` : ""}
                </div>
                <div class="page-list-modal__field">
                  <label>
                    Meta Description
                    ${createTooltip("Meta descriptions should be 120-160 characters and under 1970px wide on desktop. They appear in search results below the title. Write compelling summaries that encourage clicks.")}
                  </label>
                  <div class="page-list-modal__value ${!page.hasMetaDescription ? "page-list-modal__value--missing" : ""}">
                    ${page.hasMetaDescription ? escapeHtml(page.metaDescription) : "<em>Missing</em>"}
                  </div>
                  ${page.hasMetaDescription ? `
                    <div class="page-list-modal__metrics">
                      <span>${page.metaDescriptionLength} chars / ${DESC_LIMIT}</span>
                      <span>${Math.round(page.descriptionPixels)}px / ${DESC_PIXEL_LIMIT_DESKTOP}</span>
                    </div>
                  ` : ""}
                </div>
              </div>
            </div>
            <div class="page-list-modal__section" id="page-list-tab-technical" role="tabpanel" aria-labelledby="page-list-tab-btn-technical" data-section="technical">
              <h3 class="page-list-modal__section-title">Technical SEO</h3>
              <div class="page-list-modal__section-content">
                <div class="page-list-modal__field">
                  <label>
                    Broken Links
                    ${createTooltip("Broken links point to pages that don't exist on your site. They create poor user experience and can negatively impact SEO. Fix or remove broken links to improve site quality.")}
                  </label>
                  <div class="page-list-modal__value ${page.hasBrokenLinks ? "page-list-modal__value--bad" : "page-list-modal__value--good"}">
                    ${page.brokenLinks} / ${page.totalInternalLinks} ${page.hasBrokenLinks ? "\u2717" : "\u2713"}
                  </div>
                  ${page.hasBrokenLinks && page.brokenLinkUrls && Array.isArray(page.brokenLinkUrls) && page.brokenLinkUrls.length > 0 ? `
                  <div class="page-list-modal__broken-links">
                    <div class="page-list-modal__broken-links-title">Broken Link URLs:</div>
                    <ul class="page-list-modal__broken-links-list">
                      ${page.brokenLinkUrls.map((url) => `
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
                          ` : ""}
                        </li>
                      `).join("")}
                    </ul>
                  </div>
                  ` : page.hasBrokenLinks ? `
                  <div class="page-list-modal__broken-links">
                    <div class="page-list-modal__broken-links-note">Broken link URLs not available. Please regenerate the page list.</div>
                  </div>
                  ` : ""}
                </div>
                <div class="page-list-modal__field">
                  <label>
                    Broken Images
                    ${createTooltip("Broken images have src attributes pointing to files that don't exist. This creates broken image icons on your pages and hurts user experience. Fix image paths or remove broken image references.")}
                  </label>
                  <div class="page-list-modal__value ${page.hasBrokenImages ? "page-list-modal__value--bad" : "page-list-modal__value--good"}">
                    ${page.brokenImages || 0} / ${page.totalImages || 0} ${page.hasBrokenImages ? "\u2717" : "\u2713"}
                  </div>
                  ${page.hasBrokenImages && page.brokenImageUrls && Array.isArray(page.brokenImageUrls) && page.brokenImageUrls.length > 0 ? `
                  <div class="page-list-modal__broken-links">
                    <div class="page-list-modal__broken-links-title">Broken Image URLs:</div>
                    <ul class="page-list-modal__broken-links-list">
                      ${page.brokenImageUrls.map((url) => `
                        <li class="page-list-modal__broken-link-item" data-broken-image-url="${escapeHtml(url)}" data-source-page="${escapeHtml(page.relPermalink)}">
                          <code class="page-list-modal__broken-link-url">${escapeHtml(url)}</code>
                        </li>
                      `).join("")}
                    </ul>
                  </div>
                  ` : page.hasBrokenImages ? `
                  <div class="page-list-modal__broken-links">
                    <div class="page-list-modal__broken-links-note">Broken image URLs not available. Please regenerate the page list.</div>
                  </div>
                  ` : ""}
                </div>
                <div class="page-list-modal__field">
                  <label>Images Without Alt</label>
                  <div class="page-list-modal__value">${page.imagesWithoutAlt} / ${page.totalImages}</div>
                </div>
                <div class="page-list-modal__field">
                  <label>
                    Heading Structure
                    ${createTooltip("Headings should follow a logical hierarchy (H1 \u2192 H2 \u2192 H3). Skipping levels (e.g., H1 to H3) confuses search engines and screen readers. Maintain proper nesting for better SEO and accessibility.")}
                  </label>
                  <div class="page-list-modal__value ${page.headingStructureGood ? "page-list-modal__value--good" : "page-list-modal__value--bad"}">
                    ${page.headingStructureGood ? "\u2713 Good" : "\u2717 Issues Found"}
                  </div>
                </div>
                <div class="page-list-modal__field">
                  <label>H1 Count</label>
                  <div class="page-list-modal__value ${page.hasOneH1 ? "page-list-modal__value--good" : "page-list-modal__value--bad"}">
                    ${page.h1Count} ${page.hasOneH1 ? "\u2713" : "\u2717"}
                  </div>
                </div>
                <div class="page-list-modal__field">
                  <label>H2 Count</label>
                  <div class="page-list-modal__value ${page.hasH2s ? "page-list-modal__value--good" : "page-list-modal__value--bad"}">
                    ${page.h2Count} ${page.hasH2s ? "\u2713" : "\u2717"}
                  </div>
                </div>
                <div class="page-list-modal__field">
                  <label>
                    Analytics Tracking
                    ${createTooltip("Analytics tracking (Google Analytics, GTM, etc.) helps you understand visitor behaviour, track conversions, and measure content performance. All pages should have analytics configured for comprehensive site insights.")}
                  </label>
                  <div class="page-list-modal__value ${page.hasAnalytics ? "page-list-modal__value--good" : "page-list-modal__value--bad"}">
                    ${page.hasAnalytics ? "\u2713 Configured" : "\u2717 Not Configured"}
                  </div>
                  ${page.hasAnalytics && page.analyticsTypes && page.analyticsTypes.length > 0 ? `
                  <div class="page-list-modal__value page-list-modal__value--info" style="margin-top: 0.5rem; font-size: 0.875rem;">
                    Types: ${page.analyticsTypes.join(", ")}
                  </div>
                  ` : ""}
                </div>
                <div class="page-list-modal__field">
                  <label>
                    Image Formats
                    ${createTooltip("Next-generation image formats (WebP, AVIF) provide better compression and faster loading than JPEG/PNG. Converting images to WebP or AVIF can reduce file sizes by 25-50% while maintaining quality, improving page load times and Core Web Vitals.")}
                  </label>
                  <div class="page-list-modal__value ${!page.hasImagesNotNextGen ? "page-list-modal__value--good" : "page-list-modal__value--warning"}">
                    ${!page.hasImagesNotNextGen ? "\u2713 All Next-Gen" : `\u26A0 ${page.imagesNotNextGen} Not Next-Gen`}
                  </div>
                </div>
                <div class="page-list-modal__field">
                  <label>
                    Lazy Loading
                    ${createTooltip(`Lazy loading defers loading images until they're needed (when scrolling into view). This reduces initial page load time, saves bandwidth, and improves Core Web Vitals (LCP, FCP). Add loading="lazy" to offscreen images.`)}
                  </label>
                  <div class="page-list-modal__value ${!page.hasImagesWithoutLazyLoading ? "page-list-modal__value--good" : "page-list-modal__value--warning"}">
                    ${!page.hasImagesWithoutLazyLoading ? "\u2713 All Lazy Loaded" : `\u26A0 ${page.imagesWithoutLazyLoading} Not Lazy Loaded`}
                  </div>
                </div>
                <div class="page-list-modal__field">
                  <label>
                    HTML Lang Attribute
                    ${createTooltip("The HTML lang attribute helps screen readers pronounce content correctly and helps search engines understand the page language. Essential for accessibility and SEO. Should be set on the <html> tag.")}
                  </label>
                  <div class="page-list-modal__value ${page.hasLangAttribute ? "page-list-modal__value--good" : "page-list-modal__value--bad"}">
                    ${page.hasLangAttribute ? "\u2713 Present" : "\u2717 Missing"}
                  </div>
                </div>
                <div class="page-list-modal__field">
                  <label>
                    Canonical Link
                    ${createTooltip("Canonical links tell search engines which version of a page is the preferred one, preventing duplicate content issues. Essential for SEO when you have multiple URLs pointing to the same content.")}
                  </label>
                  <div class="page-list-modal__value ${page.hasCanonical ? "page-list-modal__value--good" : "page-list-modal__value--bad"}">
                    ${page.hasCanonical ? "\u2713 Present" : "\u2717 Missing"}
                  </div>
                </div>
                <div class="page-list-modal__field">
                  <label>
                    Mixed Content
                    ${createTooltip("Mixed content occurs when an HTTPS page loads resources (images, scripts, stylesheets) over HTTP. This creates security vulnerabilities, triggers browser warnings, and can break functionality. All resources should use HTTPS.")}
                  </label>
                  <div class="page-list-modal__value ${!page.hasMixedContent ? "page-list-modal__value--good" : "page-list-modal__value--error"}">
                    ${!page.hasMixedContent ? "\u2713 No Issues" : `\u2717 ${page.mixedContentIssues} Issue(s) Found`}
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
                    ${createTooltip("Internal links help users navigate and help search engines understand your site structure. Aim for 3-5 relevant internal links per page. Too few limits discoverability; too many can look spammy.")}
                  </label>
                  <div class="page-list-modal__value ${page.internalLinksGood ? "page-list-modal__value--good" : "page-list-modal__value--bad"}">
                    ${page.internalLinkCount} ${page.internalLinksGood ? "\u2713 (3-5 recommended)" : "\u2717"}
                  </div>
                </div>
                <div class="page-list-modal__field">
                  <label>Generic Anchors</label>
                  <div class="page-list-modal__value ${!page.hasGenericAnchors ? "page-list-modal__value--good" : "page-list-modal__value--bad"}">
                    ${page.genericAnchorCount} ${!page.hasGenericAnchors ? "\u2713" : "\u2717"}
                  </div>
                </div>
                <div class="page-list-modal__field">
                  <label>
                    Schema Markup
                    ${createTooltip("Schema markup (JSON-LD) helps search engines understand your content structure. It can enable rich snippets in search results, improving click-through rates. All pages should have at least LocalBusiness schema.")}
                  </label>
                  <div class="page-list-modal__value ${page.hasSchemaMarkup ? "page-list-modal__value--good" : "page-list-modal__value--bad"}">
                    ${page.hasSchemaMarkup ? "\u2713 Present" : "\u2717 Missing"}
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
                    ${createTooltip("WCAG AA requires 4.5:1 contrast ratio for normal text (3:1 for large text 18pt+ or 14pt+ bold). Low contrast makes content hard to read, especially for users with visual impairments. Check all text/background color combinations.")}
                  </label>
                  <div class="page-list-modal__value ${!page.hasContrastRatioIssues ? "page-list-modal__value--good" : "page-list-modal__value--error"}">
                    ${!page.hasContrastRatioIssues ? "\u2713 Meets WCAG AA (4.5:1)" : `\u2717 ${page.contrastRatioIssues || 0} Issue(s) Found`}
                  </div>
                  ${page.hasContrastRatioIssues ? `
                  <div class="page-list-modal__value page-list-modal__value--info" style="margin-top: 0.5rem; font-size: 0.875rem;">
                    ${(page.contrastRatioBelow45 || 0) > 0 ? `${page.contrastRatioBelow45} below 4.5:1 (normal text)` : ""}
                    ${(page.contrastRatioBelow45 || 0) > 0 && (page.contrastRatioBelow3 || 0) > 0 ? " | " : ""}
                    ${(page.contrastRatioBelow3 || 0) > 0 ? `${page.contrastRatioBelow3} below 3:1 (large text)` : ""}
                  </div>
                  ` : ""}
                </div>
                <div class="page-list-modal__field">
                  <label>
                    ARIA Labels
                    ${createTooltip("ARIA labels provide accessible names for interactive elements. Missing labels make it difficult for screen readers to identify buttons, links, and form controls. Add aria-label or aria-labelledby attributes to interactive elements without visible text.")}
                  </label>
                  <div class="page-list-modal__value ${!page.hasMissingAriaLabels ? "page-list-modal__value--good" : "page-list-modal__value--warning"}">
                    ${!page.hasMissingAriaLabels ? "\u2713 All Interactive Elements Labeled" : `\u26A0 ${page.missingAriaLabels || 0} Missing`}
                  </div>
                </div>
                <div class="page-list-modal__field">
                  <label>
                    Keyboard Navigation
                    ${createTooltip("All interactive elements must be keyboard accessible. Users should be able to navigate and activate all controls using only the keyboard (Tab, Enter, Space, Arrow keys). Check for elements that can't be reached or activated via keyboard.")}
                  </label>
                  <div class="page-list-modal__value ${!page.hasKeyboardNavigationIssues ? "page-list-modal__value--good" : "page-list-modal__value--error"}">
                    ${!page.hasKeyboardNavigationIssues ? "\u2713 Fully Keyboard Accessible" : `\u2717 ${page.keyboardNavigationIssues || 0} Issue(s) Found`}
                  </div>
                </div>
                <div class="page-list-modal__field">
                  <label>
                    Focus Indicators
                    ${createTooltip("Focus indicators (outlines) show which element is currently focused when navigating with keyboard. Without visible focus indicators, keyboard users can't tell where they are on the page. Ensure focus styles are visible and meet contrast requirements (3:1 minimum).")}
                  </label>
                  <div class="page-list-modal__value ${page.hasFocusIndicators !== false ? "page-list-modal__value--good" : "page-list-modal__value--error"}">
                    ${page.hasFocusIndicators !== false ? "\u2713 Present" : "\u2717 Missing"}
                  </div>
                </div>
                <div class="page-list-modal__field">
                  <label>
                    Image Alt Text
                    ${createTooltip('Alt text describes images for screen reader users. All images should have descriptive alt attributes. Decorative images should have empty alt="" attributes. Missing alt text prevents visually impaired users from understanding image content.')}
                  </label>
                  <div class="page-list-modal__value ${!page.hasImagesWithoutAlt ? "page-list-modal__value--good" : "page-list-modal__value--error"}">
                    ${page.imagesWithoutAlt} / ${page.totalImages} ${!page.hasImagesWithoutAlt ? "\u2713" : "\u2717"}
                  </div>
                </div>
                ${page.accessibilityScore !== void 0 && page.accessibilityScore !== null ? `
                <div class="page-list-modal__field">
                  <label>Accessibility Score</label>
                  <div class="page-list-modal__value ${page.accessibilityScore >= 80 ? "page-list-modal__value--good" : page.accessibilityScore >= 60 ? "page-list-modal__value--warning" : "page-list-modal__value--error"}">
                    ${page.accessibilityScore}/100 ${page.accessibilityScore >= 80 ? "\u2713" : page.accessibilityScore >= 60 ? "\u26A0" : "\u2717"}
                  </div>
                </div>
                ` : ""}
              </div>
            </div>
            <div class="page-list-modal__section" id="page-list-tab-content" role="tabpanel" aria-labelledby="page-list-tab-btn-content" data-section="content">
              <h3 class="page-list-modal__section-title">Content Quality</h3>
              <div class="page-list-modal__section-content">
                <div class="page-list-modal__field">
                  <label>
                    Word Count
                    ${createTooltip("Longer content typically ranks better. Pages with 1400+ words are considered optimal for SEO. 800-1399 words is acceptable. Under 800 words may not provide enough depth for search engines to understand the topic comprehensively.")}
                  </label>
                  <div class="page-list-modal__value ${page.wordCountGood ? "page-list-modal__value--good" : page.wordCountFair ? "page-list-modal__value--good" : "page-list-modal__value--bad"}">
                    ${page.wordCount} ${page.wordCountGood ? "\u2713 (1400+ optimal)" : page.wordCountFair ? "\u2713 (800-1399 acceptable)" : "\u2717 (<800)"}
                  </div>
                </div>
                <div class="page-list-modal__field">
                  <label>Content Freshness</label>
                  <div class="page-list-modal__value ${!page.isStale ? "page-list-modal__value--good" : "page-list-modal__value--bad"}">
                    ${page.isStale ? `${Math.floor(page.daysSinceUpdate / 30)} months old \u2717` : "\u2713 Recent"}
                  </div>
                </div>
                <div class="page-list-modal__field">
                  <label>
                    Citations
                    ${createTooltip("Citations (external links to authoritative sources) support E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness). They show you've researched your content and provide sources for readers. Aim for 2+ citations per page.")}
                  </label>
                  <div class="page-list-modal__value ${page.citationsGood ? "page-list-modal__value--good" : page.hasCitations ? "page-list-modal__value--warning" : "page-list-modal__value--bad"}">
                    ${page.citationCount} ${page.citationsGood ? "\u2713 (2+ recommended)" : page.hasCitations ? "\u26A0 (1)" : "\u2717 (0)"}
                  </div>
                </div>
                <div class="page-list-modal__field">
                  <label>Author</label>
                  <div class="page-list-modal__value ${page.hasAuthor ? "page-list-modal__value--good" : "page-list-modal__value--bad"}">
                    ${page.hasAuthor && page.authorName ? escapeHtml(page.authorName) : page.hasAuthor ? "\u2713 Present" : "\u2717 Missing"}
                  </div>
                </div>
                <div class="page-list-modal__field">
                  <label>
                    Readability
                    ${createTooltip("Average sentence length affects readability. 10-25 words per sentence is ideal (8th grade reading level). Shorter sentences are easier to understand. Longer sentences (30+ words) can be hard to follow and may reduce engagement. Break up long sentences for better readability.")}
                  </label>
                  <div class="page-list-modal__value ${page.readabilityGood ? "page-list-modal__value--good" : "page-list-modal__value--bad"}">
                    ${page.avgSentenceLength > 0 ? `Avg ${Math.round(page.avgSentenceLength)} words/sentence` : "N/A"} ${page.readabilityGood ? "\u2713" : "\u2717"}
                  </div>
                  ${page.longSentences && Array.isArray(page.longSentences) && page.longSentences.length > 0 ? `
                  <div class="page-list-modal__long-sentences">
                    <div class="page-list-modal__long-sentences-title">Long Sentences (over 25 words):</div>
                    <div class="page-list-modal__long-sentences-list">
                      ${page.longSentences.map((sentence, index) => {
    const wordCount = sentence.trim().split(/\s+/).filter((w) => w.length > 0).length;
    return `
                        <div class="page-list-modal__long-sentence-item">
                          <div class="page-list-modal__long-sentence-header">
                            <span class="page-list-modal__long-sentence-number">Sentence ${index + 1}</span>
                            <span class="page-list-modal__long-sentence-count">${wordCount} words</span>
                          </div>
                          <div class="page-list-modal__long-sentence-text">${escapeHtml(sentence.trim())}</div>
                        </div>
                        `;
  }).join("")}
                    </div>
                  </div>
                  ` : ""}
                </div>
                ${page.hasVideos ? `
                <div class="page-list-modal__field">
                  <label>Video Transcript</label>
                  <div class="page-list-modal__value ${page.hasTranscript ? "page-list-modal__value--good" : "page-list-modal__value--bad"}">
                    ${page.videoCount} video(s) ${page.hasTranscript ? "\u2713" : "\u2717 Missing transcript"}
                  </div>
                </div>
                ` : ""}
                <div class="page-list-modal__field">
                  <label>
                    Page Excerpt
                    ${createTooltip("Page excerpts (summaries) help AI crawlers and search engines understand page content quickly. They appear in search results, social shares, and help with content discovery. Optimal length is 100-300 characters. Too short (<50) provides insufficient context. Too long (>300) may be truncated.")}
                  </label>
                  <div class="page-list-modal__value ${page.summaryOptimal ? "page-list-modal__value--good" : page.summaryFair ? "page-list-modal__value--warning" : page.hasSummary ? "page-list-modal__value--warning" : "page-list-modal__value--bad"}">
                    ${page.hasSummary ? `${page.summaryLength} chars ${page.summaryOptimal ? "\u2713 (100-300 optimal)" : page.summaryTooShort ? "\u2717 (too short, <50)" : page.summaryTooLong ? "\u2717 (too long, >300)" : "\u26A0 (50-99 acceptable)"}` : "\u2717 Missing"}
                  </div>
                  ${page.hasSummary ? `
                  <div class="page-list-modal__value page-list-modal__value--info" style="margin-top: 0.5rem; font-size: 0.875rem; font-style: italic;">
                    ${escapeHtml(page.summary.substring(0, 150))}${page.summary.length > 150 ? "..." : ""}
                  </div>
                  ` : ""}
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
            ` : ""}
          </div>
        </div>
      </div>
    </div>
  `;
}
function renderPageRow(page, compact = false, filterType = "all") {
  const badges = getStatusBadges(page);
  const hasIssues = badges.length > 0;
  const statusClass = hasIssues ? "page-list-status--warning" : "page-list-status--good";
  const badgesHtml = badges.length > 0 ? `<div class="page-list-badges">${badges.map((b) => `<span class="page-list-badge ${b.class}">${b.text}</span>`).join("")}</div>` : "";
  if (filterType === "broken-links" && page.hasBrokenLinks && page.brokenLinkUrls && page.brokenLinkUrls.length > 0) {
    const brokenLinksHtml = compact ? page.brokenLinkUrls.slice(0, 2).map(
      (url) => `<div class="page-list-broken-item">
            <code class="page-list-broken-item__url">${escapeHtml(truncate(url, 40))}</code>
          </div>`
    ).join("") : page.brokenLinkUrls.map(
      (url) => `<div class="page-list-broken-item">
            <code class="page-list-broken-item__url">${escapeHtml(url)}</code>
          </div>`
    ).join("");
    const moreCount = compact && page.brokenLinkUrls.length > 2 ? `+${page.brokenLinkUrls.length - 2} more` : "";
    const countHtml = !compact ? `<div class="page-list-broken-count">${page.brokenLinks} broken link${page.brokenLinks !== 1 ? "s" : ""}</div>` : moreCount ? `<div class="page-list-broken-count">${moreCount}</div>` : "";
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
          ${!compact ? "<span>Fix Links</span>" : ""}
        </button>
      </div>
    ` : '<div class="page-list-actions"><span class="text-muted">View details to fix</span></div>';
    const scoresHtml2 = `
      <div class="page-list-row-scores">
        ${renderScore(page.seoScore, "SEO")}
        ${renderScore(page.aiCrawlabilityScore, "AI")}
        ${!compact && page.accessibilityScore !== void 0 && page.accessibilityScore !== null ? renderScore(page.accessibilityScore, "A11y") : ""}
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
          ${scoresHtml2}
        </td>
        <td data-label="${compact ? "Link" : "Page Link"}">
          <a href="${page.relPermalink}" target="_blank" rel="noopener noreferrer">
            ${compact ? "View \u2192" : page.relPermalink}
          </a>
        </td>
      </tr>
    `;
  }
  if (filterType === "broken-images" && page.hasBrokenImages && page.brokenImageUrls && page.brokenImageUrls.length > 0) {
    const brokenImagesHtml = compact ? page.brokenImageUrls.slice(0, 2).map(
      (url) => `<div class="page-list-broken-item">
            <code class="page-list-broken-item__url">${escapeHtml(truncate(url, 40))}</code>
          </div>`
    ).join("") : page.brokenImageUrls.map(
      (url) => `<div class="page-list-broken-item">
            <code class="page-list-broken-item__url">${escapeHtml(url)}</code>
          </div>`
    ).join("");
    const moreCount = compact && page.brokenImageUrls.length > 2 ? `+${page.brokenImageUrls.length - 2} more` : "";
    const countHtml = !compact ? `<div class="page-list-broken-count">${page.brokenImages} broken image${page.brokenImages !== 1 ? "s" : ""}</div>` : moreCount ? `<div class="page-list-broken-count">${moreCount}</div>` : "";
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
          ${!compact ? "<span>Fix Images</span>" : ""}
        </button>
      </div>
    ` : '<div class="page-list-actions"><span class="text-muted">View details to fix</span></div>';
    const scoresHtml2 = `
      <div class="page-list-row-scores">
        ${renderScore(page.seoScore, "SEO")}
        ${renderScore(page.aiCrawlabilityScore, "AI")}
        ${!compact && page.accessibilityScore !== void 0 && page.accessibilityScore !== null ? renderScore(page.accessibilityScore, "A11y") : ""}
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
          ${scoresHtml2}
        </td>
        <td data-label="${compact ? "Link" : "Page Link"}">
          <a href="${page.relPermalink}" target="_blank" rel="noopener noreferrer">
            ${compact ? "View \u2192" : page.relPermalink}
          </a>
        </td>
      </tr>
    `;
  }
  if (compact) {
    const scoresHtml2 = `
      <div class="page-list-row-scores">
        ${renderScore(page.seoScore, "SEO")}
        ${renderScore(page.aiCrawlabilityScore, "AI")}
        ${page.accessibilityScore !== void 0 && page.accessibilityScore !== null ? renderScore(page.accessibilityScore, "A11y") : ""}
      </div>
    `;
    const metaDescHtml2 = page.hasMetaDescription ? `<span class="${page.descriptionOverLimit || page.descriptionOverPixels ? "text-warning" : ""}">${escapeHtml(truncate(page.metaDescription, 80))}</span>` : '<span class="text-error">Missing</span>';
    return `
      <tr class="${statusClass} page-list-row" data-page-url="${page.relPermalink}">
        <td>
          <div class="page-list-title-cell">
            <strong>${escapeHtml(page.title)}</strong>
            ${badgesHtml}
          </div>
        </td>
        <td data-label="Meta Title">
          ${page.hasMetaTitle ? `<span class="${page.titleOverLimit || page.titleOverPixels ? "text-warning" : ""}">${escapeHtml(truncate(page.metaTitle, 50))}</span>` : '<span class="text-error">Missing</span>'}
        </td>
        <td data-label="Meta Description">
          ${metaDescHtml2}
        </td>
        <td data-label="Scores">
          ${scoresHtml2}
        </td>
        <td data-label="Link">
          <a href="${page.relPermalink}" target="_blank" rel="noopener noreferrer" class="page-list-link-compact">
            View \u2192
          </a>
        </td>
      </tr>
    `;
  }
  const metaTitleHtml = page.hasMetaTitle ? `<div class="page-list-meta-content-wrapper">
         <div class="page-list-meta-content">${escapeHtml(page.metaTitle)}</div>
         <div class="page-list-meta-metrics">
           <div class="page-list-meta-metric ${page.titleOverLimit || page.titleOverPixels ? "metric--warning" : "metric--good"}">
             <span class="page-list-meta-metric__icon">${page.titleOverLimit || page.titleOverPixels ? "\u26A0\uFE0F" : "\u2713"}</span>
             <div class="page-list-meta-metric__info">
               <span class="page-list-meta-metric__label">Characters</span>
               <span class="page-list-meta-metric__value ${page.titleOverLimit ? "value--over" : ""}">${page.metaTitleLength}/${TITLE_LIMIT}</span>
             </div>
           </div>
           <div class="page-list-meta-metric ${page.titleOverPixels ? "metric--warning" : "metric--good"}">
             <span class="page-list-meta-metric__icon">${page.titleOverPixels ? "\u26A0\uFE0F" : "\u2713"}</span>
             <div class="page-list-meta-metric__info">
               <span class="page-list-meta-metric__label">Pixels</span>
               <span class="page-list-meta-metric__value ${page.titleOverPixels ? "value--over" : ""}">${Math.round(page.titlePixels)}/${TITLE_PIXEL_LIMIT_DESKTOP}</span>
             </div>
           </div>
         </div>
       </div>` : `<div class="page-list-meta-missing">
         <span class="page-list-meta-missing__icon">\u2717</span>
         <span class="page-list-meta-missing__text">Missing Meta Title</span>
       </div>`;
  const metaDescHtml = page.hasMetaDescription ? `<div class="page-list-meta-content-wrapper">
         <div class="page-list-meta-content">${escapeHtml(truncate(page.metaDescription, 150))}</div>
         <div class="page-list-meta-metrics">
           <div class="page-list-meta-metric ${page.descriptionOverLimit || page.descriptionOverPixels ? "metric--warning" : "metric--good"}">
             <span class="page-list-meta-metric__icon">${page.descriptionOverLimit || page.descriptionOverPixels ? "\u26A0\uFE0F" : "\u2713"}</span>
             <div class="page-list-meta-metric__info">
               <span class="page-list-meta-metric__label">Characters</span>
               <span class="page-list-meta-metric__value ${page.descriptionOverLimit ? "value--over" : ""}">${page.metaDescriptionLength}/${DESC_LIMIT}</span>
             </div>
           </div>
           <div class="page-list-meta-metric ${page.descriptionOverPixels ? "metric--warning" : "metric--good"}">
             <span class="page-list-meta-metric__icon">${page.descriptionOverPixels ? "\u26A0\uFE0F" : "\u2713"}</span>
             <div class="page-list-meta-metric__info">
               <span class="page-list-meta-metric__label">Pixels</span>
               <span class="page-list-meta-metric__value ${page.descriptionOverPixels ? "value--over" : ""}">${Math.round(page.descriptionPixels)}/${DESC_PIXEL_LIMIT_DESKTOP}</span>
             </div>
           </div>
         </div>
       </div>` : `<div class="page-list-meta-missing">
         <span class="page-list-meta-missing__icon">\u2717</span>
         <span class="page-list-meta-missing__text">Missing Meta Description</span>
       </div>`;
  const summaryHtml = page.summary ? escapeHtml(truncate(page.summary, 200)) : "<em>No summary available</em>";
  const scoresHtml = `
    <div class="page-list-row-scores">
      ${renderScore(page.seoScore, "SEO")}
      ${renderScore(page.aiCrawlabilityScore, "AI")}
      ${page.accessibilityScore !== void 0 && page.accessibilityScore !== null ? renderScore(page.accessibilityScore, "A11y") : ""}
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
        <div class="page-list-meta-field ${page.titleOverLimit ? "page-list-meta-field--over-limit" : ""}">
          ${metaTitleHtml}
        </div>
      </td>
      <td data-label="Meta Description">
        <div class="page-list-meta-field ${page.descriptionOverLimit ? "page-list-meta-field--over-limit" : ""}">
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
function sortPages(pages, sortType, sortDirection) {
  const sorted = [...pages];
  switch (sortType) {
    case "seo":
      sorted.sort((a, b) => {
        const diff = a.seoScore - b.seoScore;
        return sortDirection === "asc" ? diff : -diff;
      });
      break;
    case "ai":
      sorted.sort((a, b) => {
        const diff = a.aiCrawlabilityScore - b.aiCrawlabilityScore;
        return sortDirection === "asc" ? diff : -diff;
      });
      break;
    case "title":
      sorted.sort((a, b) => {
        const diff = a.title.localeCompare(b.title);
        return sortDirection === "asc" ? diff : -diff;
      });
      break;
    case "accessibility":
      sorted.sort((a, b) => {
        const scoreA = a.accessibilityScore ?? 0;
        const scoreB = b.accessibilityScore ?? 0;
        const diff = scoreA - scoreB;
        return sortDirection === "asc" ? diff : -diff;
      });
      break;
    default:
      sorted.sort((a, b) => a.title.localeCompare(b.title));
  }
  return sorted;
}
function groupPagesBySection(pages, sortType = "title", sortDirection = "asc") {
  const groups = /* @__PURE__ */ new Map();
  pages.forEach((page) => {
    const section = page.section || "root";
    if (!groups.has(section)) {
      groups.set(section, []);
    }
    groups.get(section).push(page);
  });
  groups.forEach((groupPages) => {
    const sorted = sortPages(groupPages, sortType, sortDirection);
    groupPages.length = 0;
    groupPages.push(...sorted);
  });
  return groups;
}
function getTableHeaders(filterType, compact = false) {
  const getHeaderLabel = (defaultLabel, filterType2) => {
    const filterLabels = {
      "missing-title": { "Meta Title": "Missing Title" },
      "missing-description": { "Meta Description": "Missing Description" },
      "missing-meta": { "Meta Title": "Missing Title", "Meta Description": "Missing Description" },
      "title-over-limit": { "Meta Title": "Title Issues" },
      "description-over-limit": { "Meta Description": "Description Issues" },
      "meta-issues": { "Meta Title": "Title Issues", "Meta Description": "Description Issues" },
      "pixel-issues": { "Meta Title": "Pixel Issues", "Meta Description": "Pixel Issues" },
      "broken-links": { "Page Title": "Pages with Broken Links" },
      "broken-images": { "Page Title": "Pages with Broken Images" },
      "images-no-alt": { "Page Title": "Pages w/o Alt Text" },
      "heading-structure": { "Page Title": "Heading Issues" },
      "no-schema": { "Page Title": "Missing Schema" },
      "low-word-count": { "Summary": "Low Word Count" },
      "no-citations": { "Page Title": "No Citations" },
      "no-author": { "Page Title": "No Author" },
      "stale-content": { "Page Title": "Stale Content" },
      "excerpt-too-short": { "Summary": "Excerpt Too Short" },
      "excerpt-too-long": { "Summary": "Excerpt Too Long" },
      "with-issues": { "Page Title": "Pages with Issues" },
      "good": { "Page Title": "Good Pages" }
    };
    return filterLabels[filterType2]?.[defaultLabel] || defaultLabel;
  };
  if (filterType === "broken-links") {
    if (compact) {
      return `<tr><th>Page Title</th><th>Broken Links</th><th>Actions</th><th>Scores</th><th>Link</th></tr>`;
    } else {
      return `<tr><th>Page Title</th><th>Broken Links</th><th>Actions</th><th>Scores</th><th>Page Link</th></tr>`;
    }
  }
  if (filterType === "broken-images") {
    if (compact) {
      return `<tr><th>Page Title</th><th>Broken Images</th><th>Actions</th><th>Scores</th><th>Link</th></tr>`;
    } else {
      return `<tr><th>Page Title</th><th>Broken Images</th><th>Actions</th><th>Scores</th><th>Page Link</th></tr>`;
    }
  }
  if (compact) {
    const title = getHeaderLabel("Page Title", filterType);
    const metaTitle = getHeaderLabel("Meta Title", filterType);
    const metaDesc = getHeaderLabel("Meta Description", filterType);
    return `<tr><th>${title}</th><th>${metaTitle}</th><th>${metaDesc}</th><th>Scores</th><th>Link</th></tr>`;
  } else {
    const title = getHeaderLabel("Page Title", filterType);
    const metaTitle = getHeaderLabel("Meta Title", filterType);
    const metaDesc = getHeaderLabel("Meta Description", filterType);
    const summary = getHeaderLabel("Summary", filterType);
    return `<tr><th>${title}</th><th>${metaTitle}</th><th>${metaDesc}</th><th>${summary}</th><th>Scores</th><th>Page Link</th></tr>`;
  }
}
function renderUngroupedPages(pages, compact = false, sortType = "title", sortDirection = "asc", filterType = "all") {
  const tableHeaders = getTableHeaders(filterType, compact);
  const sortedPages = sortPages(pages, sortType, sortDirection);
  return `
    <div class="page-list-group">
      <table class="page-list-table">
        <thead>
          ${tableHeaders}
        </thead>
        <tbody>
          ${sortedPages.map((p) => renderPageRow(p, compact, filterType)).join("")}
        </tbody>
      </table>
    </div>
  `;
}
var SCHEMA_TYPE_DEFINITIONS = {
  "Thing": {
    type: "Thing",
    required: [],
    recommended: ["name", "description", "url", "image"],
    properties: {},
    isGeneric: true,
    alternatives: []
  },
  "LocalBusiness": {
    type: "LocalBusiness",
    parent: "Organization",
    required: ["name"],
    recommended: ["address", "telephone", "priceRange", "image", "openingHours", "geo"],
    properties: {
      "name": { name: "name", required: true, recommended: true, dataType: "Text" },
      "address": { name: "address", required: false, recommended: true, dataType: "PostalAddress" },
      "telephone": { name: "telephone", required: false, recommended: true, dataType: "Text" },
      "priceRange": { name: "priceRange", required: false, recommended: true, dataType: "Text" },
      "image": { name: "image", required: false, recommended: true, dataType: "URL" },
      "openingHours": { name: "openingHours", required: false, recommended: true, dataType: "Text" }
    },
    isGeneric: false,
    alternatives: ["Organization", "Place"]
  },
  "Organization": {
    type: "Organization",
    parent: "Thing",
    required: ["name"],
    recommended: ["url", "logo", "sameAs", "contactPoint"],
    properties: {
      "name": { name: "name", required: true, recommended: true, dataType: "Text" },
      "url": { name: "url", required: false, recommended: true, dataType: "URL" },
      "logo": { name: "logo", required: false, recommended: true, dataType: "ImageObject" },
      "sameAs": { name: "sameAs", required: false, recommended: true, dataType: "URL" }
    },
    isGeneric: false,
    alternatives: ["LocalBusiness", "Corporation"]
  },
  "Article": {
    type: "Article",
    parent: "CreativeWork",
    required: ["headline"],
    recommended: ["datePublished", "dateModified", "author", "publisher", "image", "description"],
    properties: {
      "headline": { name: "headline", required: true, recommended: true, dataType: "Text" },
      "datePublished": { name: "datePublished", required: false, recommended: true, dataType: "Date" },
      "dateModified": { name: "dateModified", required: false, recommended: true, dataType: "Date" },
      "author": { name: "author", required: false, recommended: true, dataType: "Person" },
      "publisher": { name: "publisher", required: false, recommended: true, dataType: "Organization" },
      "image": { name: "image", required: false, recommended: true, dataType: "ImageObject" }
    },
    isGeneric: false,
    alternatives: ["NewsArticle", "BlogPosting", "ScholarlyArticle"]
  },
  "WebPage": {
    type: "WebPage",
    parent: "CreativeWork",
    required: ["name"],
    recommended: ["description", "url", "breadcrumb", "mainEntity"],
    properties: {
      "name": { name: "name", required: true, recommended: true, dataType: "Text" },
      "description": { name: "description", required: false, recommended: true, dataType: "Text" },
      "url": { name: "url", required: false, recommended: true, dataType: "URL" }
    },
    isGeneric: false,
    alternatives: ["AboutPage", "ContactPage", "FAQPage"]
  },
  "Product": {
    type: "Product",
    parent: "Thing",
    required: ["name"],
    recommended: ["image", "description", "brand", "offers", "aggregateRating"],
    properties: {
      "name": { name: "name", required: true, recommended: true, dataType: "Text" },
      "image": { name: "image", required: false, recommended: true, dataType: "ImageObject" },
      "description": { name: "description", required: false, recommended: true, dataType: "Text" },
      "brand": { name: "brand", required: false, recommended: true, dataType: "Brand" },
      "offers": { name: "offers", required: false, recommended: true, dataType: "Offer" }
    },
    isGeneric: false,
    alternatives: []
  },
  "Service": {
    type: "Service",
    parent: "Thing",
    required: ["name", "serviceType"],
    recommended: ["description", "provider", "areaServed", "offers"],
    properties: {
      "name": { name: "name", required: true, recommended: true, dataType: "Text" },
      "serviceType": { name: "serviceType", required: true, recommended: true, dataType: "Text" },
      "description": { name: "description", required: false, recommended: true, dataType: "Text" },
      "provider": { name: "provider", required: false, recommended: true, dataType: "Organization" }
    },
    isGeneric: false,
    alternatives: []
  },
  "Person": {
    type: "Person",
    parent: "Thing",
    required: ["name"],
    recommended: ["email", "jobTitle", "image", "sameAs"],
    properties: {
      "name": { name: "name", required: true, recommended: true, dataType: "Text" },
      "email": { name: "email", required: false, recommended: true, dataType: "Text" },
      "jobTitle": { name: "jobTitle", required: false, recommended: true, dataType: "Text" }
    },
    isGeneric: false,
    alternatives: []
  },
  "Event": {
    type: "Event",
    parent: "Thing",
    required: ["name", "startDate"],
    recommended: ["endDate", "location", "description", "image"],
    properties: {
      "name": { name: "name", required: true, recommended: true, dataType: "Text" },
      "startDate": { name: "startDate", required: true, recommended: true, dataType: "DateTime" },
      "endDate": { name: "endDate", required: false, recommended: true, dataType: "DateTime" },
      "location": { name: "location", required: false, recommended: true, dataType: "Place" }
    },
    isGeneric: false,
    alternatives: ["BusinessEvent", "SportsEvent"]
  },
  "FAQPage": {
    type: "FAQPage",
    parent: "WebPage",
    required: [],
    recommended: ["mainEntity"],
    properties: {
      "mainEntity": { name: "mainEntity", required: false, recommended: true, dataType: "Question" }
    },
    isGeneric: false,
    alternatives: []
  },
  "Recipe": {
    type: "Recipe",
    parent: "CreativeWork",
    required: ["name"],
    recommended: ["image", "recipeIngredient", "recipeInstructions", "prepTime", "cookTime", "totalTime"],
    properties: {
      "name": { name: "name", required: true, recommended: true, dataType: "Text" },
      "image": { name: "image", required: false, recommended: true, dataType: "ImageObject" },
      "recipeIngredient": { name: "recipeIngredient", required: false, recommended: true, dataType: "Text" },
      "recipeInstructions": { name: "recipeInstructions", required: false, recommended: true, dataType: "HowToStep" }
    },
    isGeneric: false,
    alternatives: []
  },
  "VideoObject": {
    type: "VideoObject",
    parent: "MediaObject",
    required: ["name"],
    recommended: ["thumbnailUrl", "uploadDate", "duration", "description", "contentUrl"],
    properties: {
      "name": { name: "name", required: true, recommended: true, dataType: "Text" },
      "thumbnailUrl": { name: "thumbnailUrl", required: false, recommended: true, dataType: "URL" },
      "uploadDate": { name: "uploadDate", required: false, recommended: true, dataType: "Date" },
      "duration": { name: "duration", required: false, recommended: true, dataType: "Duration" }
    },
    isGeneric: false,
    alternatives: []
  }
};
function extractAllSchemasFromHTML(html) {
  const schemas = [];
  let index = 0;
  const jsonLdSchemas = extractJSONLDSchemas(html);
  jsonLdSchemas.forEach((schema) => {
    schemas.push({ ...schema, format: "json-ld", index: index++ });
  });
  const microdataSchemas = extractMicrodataSchemas(html);
  microdataSchemas.forEach((schema) => {
    schemas.push({ ...schema, format: "microdata", index: index++ });
  });
  const rdfaSchemas = extractRDFaSchemas(html);
  rdfaSchemas.forEach((schema) => {
    schemas.push({ ...schema, format: "rdfa", index: index++ });
  });
  return schemas;
}
function extractJSONLDSchemas(html) {
  const schemas = [];
  const jsonLdRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>(.*?)<\/script>/gis;
  let match;
  while ((match = jsonLdRegex.exec(html)) !== null) {
    try {
      const jsonContent = match[1].trim();
      const parsed = JSON.parse(jsonContent);
      const items = Array.isArray(parsed) ? parsed : [parsed];
      items.forEach((item) => {
        if (item && typeof item === "object") {
          if (item["@type"]) {
            schemas.push({
              type: item["@type"],
              data: item,
              raw: jsonContent
            });
          } else if (item["@context"]) {
            if (item["@graph"] && Array.isArray(item["@graph"])) {
              item["@graph"].forEach((graphItem) => {
                if (graphItem["@type"]) {
                  schemas.push({
                    type: graphItem["@type"],
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
      devWarn("Failed to parse JSON-LD schema:", error);
    }
  }
  return schemas;
}
function extractMicrodataSchemas(html) {
  const schemas = [];
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const itemScopeElements = doc.querySelectorAll("[itemscope]");
    itemScopeElements.forEach((element) => {
      const itemType = element.getAttribute("itemtype");
      if (!itemType) return;
      const typeMatch = itemType.match(/schema\.org\/([^\/\#]+)/i);
      if (!typeMatch) return;
      const schemaType = typeMatch[1];
      const schemaData = {
        "@type": schemaType
      };
      const itemProps = element.querySelectorAll("[itemprop]");
      itemProps.forEach((propElement) => {
        const propName = propElement.getAttribute("itemprop");
        if (!propName) return;
        let propValue = null;
        if (propElement.hasAttribute("content")) {
          propValue = propElement.getAttribute("content");
        } else if (propElement.hasAttribute("href")) {
          propValue = propElement.getAttribute("href");
        } else if (propElement.hasAttribute("src")) {
          propValue = propElement.getAttribute("src");
        } else if (propElement.hasAttribute("datetime")) {
          propValue = propElement.getAttribute("datetime");
        } else {
          propValue = propElement.textContent?.trim() || null;
        }
        if (propValue !== null) {
          const nestedScope = propElement.querySelector("[itemscope]");
          if (nestedScope) {
            schemaData[propName] = { "@type": nestedScope.getAttribute("itemtype")?.match(/schema\.org\/([^\/\#]+)/i)?.[1] || "Thing" };
          } else {
            schemaData[propName] = propValue;
          }
        }
      });
      schemas.push({
        type: schemaType,
        data: schemaData,
        raw: element.outerHTML.substring(0, 500)
        // Store first 500 chars as raw
      });
    });
  } catch (error) {
    devWarn("Failed to parse Microdata:", error);
  }
  return schemas;
}
function extractRDFaSchemas(html) {
  const schemas = [];
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const typeofElements = doc.querySelectorAll("[typeof]");
    typeofElements.forEach((element) => {
      const typeofValue = element.getAttribute("typeof");
      if (!typeofValue) return;
      const typeMatch = typeofValue.match(/schema:([^\s]+)/i) || typeofValue.match(/schema\.org\/([^\/\#\s]+)/i);
      if (!typeMatch) return;
      const schemaType = typeMatch[1];
      const schemaData = {
        "@type": schemaType
      };
      const properties = element.querySelectorAll("[property]");
      properties.forEach((propElement) => {
        const propName = propElement.getAttribute("property");
        if (!propName) return;
        const cleanPropName = propName.replace(/^schema:/i, "").replace(/^http:\/\/schema\.org\//i, "");
        let propValue = null;
        if (propElement.hasAttribute("content")) {
          propValue = propElement.getAttribute("content");
        } else if (propElement.hasAttribute("href")) {
          propValue = propElement.getAttribute("href");
        } else if (propElement.hasAttribute("src")) {
          propValue = propElement.getAttribute("src");
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
        raw: element.outerHTML.substring(0, 500)
        // Store first 500 chars as raw
      });
    });
  } catch (error) {
    devWarn("Failed to parse RDFa:", error);
  }
  return schemas;
}
function getSchemaTypeInfo(type) {
  return SCHEMA_TYPE_DEFINITIONS[type] || null;
}
function isGenericType(type) {
  const typeInfo = getSchemaTypeInfo(type);
  return typeInfo?.isGeneric || type === "Thing";
}
function validateDataType(value, expectedType, propertyName) {
  if (value === null || value === void 0) return null;
  switch (expectedType.toLowerCase()) {
    case "url":
    case "urlorlink":
      if (typeof value === "string") {
        try {
          const url = typeof value === "object" && value["@id"] ? value["@id"] : value;
          new URL(url);
          if (!url.startsWith("http://") && !url.startsWith("https://") && !url.startsWith("/")) {
            return {
              type: "warning",
              severity: "medium",
              message: `Relative URL in "${propertyName}" - prefer absolute URLs for better compatibility`,
              property: propertyName,
              actual: url,
              expected: "Absolute URL (https://...)"
            };
          }
        } catch {
          return {
            type: "error",
            severity: "high",
            message: `Invalid URL in property "${propertyName}": ${value}`,
            property: propertyName,
            actual: String(value),
            expected: "Valid URL"
          };
        }
      }
      break;
    case "date":
    case "datetime":
    case "datepublished":
    case "datemodified":
    case "datecreated":
    case "startdate":
    case "enddate":
    case "dateposted":
      if (typeof value === "string") {
        const date = new Date(value);
        if (isNaN(date.getTime())) {
          return {
            type: "error",
            severity: "high",
            message: `Invalid date format in property "${propertyName}": ${value}`,
            property: propertyName,
            actual: value,
            expected: "ISO 8601 date format (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ssZ)",
            suggestion: 'Use ISO 8601 format, e.g., "2024-01-15" or "2024-01-15T10:30:00Z"'
          };
        }
        if ((propertyName.includes("Published") || propertyName.includes("Posted")) && date > /* @__PURE__ */ new Date()) {
          return {
            type: "warning",
            severity: "medium",
            message: `Future date in "${propertyName}" - ensure this is intentional`,
            property: propertyName,
            actual: value
          };
        }
      }
      break;
    case "number":
    case "integer":
    case "float":
      if (typeof value !== "number" && (typeof value === "string" && isNaN(Number(value)))) {
        return {
          type: "error",
          severity: "high",
          message: `Invalid number in property "${propertyName}": ${value}`,
          property: propertyName,
          actual: String(value),
          expected: "Number"
        };
      }
      break;
    case "boolean":
      if (typeof value !== "boolean" && value !== "true" && value !== "false") {
        return {
          type: "warning",
          severity: "low",
          message: `Boolean property "${propertyName}" should be true/false, not: ${value}`,
          property: propertyName,
          actual: String(value),
          expected: "true or false"
        };
      }
      break;
  }
  return null;
}
function validateSchemaComprehensive(schema, schemaType, format, schemaIndex) {
  const errors = [];
  const warnings = [];
  const recommendations = [];
  if (!schema["@type"] && !schemaType) {
    errors.push({
      type: "error",
      severity: "critical",
      message: "Missing required property: @type",
      property: "@type",
      code: "MISSING_TYPE"
    });
    return {
      schemaType: "Unknown",
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
  const finalType = schema["@type"] || schemaType;
  const typeInfo = getSchemaTypeInfo(finalType);
  if (isGenericType(finalType)) {
    warnings.push({
      type: "warning",
      severity: "medium",
      message: `Using generic type "${finalType}" - consider using a more specific type`,
      property: "@type",
      actual: finalType,
      suggestion: typeInfo?.alternatives?.length ? `Consider: ${typeInfo.alternatives.join(", ")}` : "Use a more specific Schema.org type"
    });
  }
  if (format === "json-ld") {
    if (!schema["@context"]) {
      warnings.push({
        type: "warning",
        severity: "low",
        message: "Missing @context property (recommended for Schema.org)",
        property: "@context",
        expected: "https://schema.org",
        suggestion: 'Add "@context": "https://schema.org" to your JSON-LD'
      });
    } else if (schema["@context"] !== "https://schema.org" && schema["@context"] !== "http://schema.org") {
      warnings.push({
        type: "warning",
        severity: "medium",
        message: `Unexpected @context value: ${schema["@context"]}`,
        property: "@context",
        actual: schema["@context"],
        expected: "https://schema.org",
        suggestion: 'Use "https://schema.org" for the @context'
      });
    }
  }
  if (typeInfo) {
    typeInfo.required.forEach((propName) => {
      const propValue = schema[propName];
      if (!propValue || typeof propValue === "string" && propValue.trim() === "") {
        errors.push({
          type: "error",
          severity: "high",
          message: `Missing required property: ${propName}`,
          property: propName,
          expected: "non-empty value",
          code: "MISSING_REQUIRED_PROPERTY",
          suggestion: `Add "${propName}" property to your schema`
        });
      } else {
        if (typeof propValue === "string" && propValue.trim() === "") {
          errors.push({
            type: "error",
            severity: "high",
            message: `Required property "${propName}" is empty`,
            property: propName,
            expected: "non-empty value"
          });
        }
      }
    });
    typeInfo.recommended.forEach((propName) => {
      if (!schema[propName]) {
        recommendations.push({
          type: "info",
          severity: "low",
          message: `Recommended property "${propName}" is missing`,
          property: propName,
          suggestion: `Consider adding "${propName}" to improve schema completeness`
        });
      }
    });
  }
  const urlProperties = ["url", "image", "logo", "sameAs", "thumbnailUrl", "contentUrl"];
  urlProperties.forEach((prop) => {
    if (schema[prop]) {
      const url = typeof schema[prop] === "string" ? schema[prop] : schema[prop]["@id"] || schema[prop]["url"] || schema[prop];
      const urlError = validateDataType(url, "url", prop);
      if (urlError) {
        if (urlError.type === "error") errors.push(urlError);
        else warnings.push(urlError);
      }
    }
  });
  const dateProperties = ["datePublished", "dateModified", "dateCreated", "startDate", "endDate", "datePosted", "uploadDate"];
  dateProperties.forEach((prop) => {
    if (schema[prop]) {
      const dateError = validateDataType(schema[prop], "date", prop);
      if (dateError) {
        if (dateError.type === "error") errors.push(dateError);
        else warnings.push(dateError);
      }
    }
  });
  if (schema["name"] && typeof schema["name"] === "string" && schema["name"].trim().length === 0) {
    warnings.push({
      type: "warning",
      severity: "medium",
      message: 'Property "name" is empty',
      property: "name",
      suggestion: "Provide a meaningful name"
    });
  }
  if (schema["description"] && typeof schema["description"] === "string" && schema["description"].trim().length === 0) {
    warnings.push({
      type: "warning",
      severity: "low",
      message: 'Property "description" is empty',
      property: "description",
      suggestion: "Provide a description to improve SEO"
    });
  }
  if (format !== "json-ld") {
    recommendations.push({
      type: "info",
      severity: "low",
      message: `Using ${format} format - JSON-LD is preferred for maintainability`,
      suggestion: "Consider migrating to JSON-LD format"
    });
  }
  if (!schema["@id"] && (schema["url"] || schema["name"])) {
    recommendations.push({
      type: "info",
      severity: "low",
      message: "Missing @id property - consider adding for uniqueness",
      property: "@id",
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
    schemaString: typeof schema === "string" ? schema : JSON.stringify(schema, null, 2)
  };
}
function crossCheckContentWithSchema(html, schema) {
  const matches = [];
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const bodyText = doc.body?.textContent?.toLowerCase() || "";
    if (schema["name"] || schema["headline"]) {
      const schemaName = (schema["name"] || schema["headline"]).toLowerCase().trim();
      const h1Text = doc.querySelector("h1")?.textContent?.toLowerCase().trim() || "";
      const titleMatch = h1Text.includes(schemaName) || schemaName.includes(h1Text);
      matches.push({
        property: schema["name"] ? "name" : "headline",
        schemaValue: schema["name"] || schema["headline"],
        pageValue: h1Text || void 0,
        matches: titleMatch,
        confidence: titleMatch ? 0.9 : 0.1,
        location: "h1"
      });
    }
    if (schema["description"]) {
      const schemaDesc = schema["description"].toLowerCase().trim();
      const metaDesc = doc.querySelector('meta[name="description"]')?.getAttribute("content")?.toLowerCase() || "";
      const firstPara = doc.querySelector("p")?.textContent?.toLowerCase().trim() || "";
      const descMatch = metaDesc.includes(schemaDesc) || schemaDesc.includes(metaDesc) || firstPara.includes(schemaDesc.substring(0, 100));
      matches.push({
        property: "description",
        schemaValue: schema["description"],
        pageValue: metaDesc || firstPara.substring(0, 100) || void 0,
        matches: descMatch,
        confidence: descMatch ? 0.8 : 0.2,
        location: metaDesc ? "meta description" : "first paragraph"
      });
    }
    if (schema["offers"] && schema["offers"]["price"]) {
      const schemaPrice = String(schema["offers"]["price"]).replace(/[^0-9.]/g, "");
      const priceElements = doc.querySelectorAll('[class*="price"], [id*="price"], .price, #price');
      let priceMatch = false;
      let pagePrice = "";
      priceElements.forEach((el) => {
        const elText = el.textContent?.replace(/[^0-9.]/g, "") || "";
        if (elText.includes(schemaPrice) || schemaPrice.includes(elText)) {
          priceMatch = true;
          pagePrice = el.textContent || "";
        }
      });
      matches.push({
        property: "price",
        schemaValue: String(schema["offers"]["price"]),
        pageValue: pagePrice || void 0,
        matches: priceMatch,
        confidence: priceMatch ? 0.85 : 0.1,
        location: "price element"
      });
    }
  } catch (error) {
    devWarn("Content cross-checking error:", error);
  }
  return matches;
}
function checkForHiddenContent(html, schemaFormat) {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    if (schemaFormat === "microdata" || schemaFormat === "rdfa") {
      const schemaElements = schemaFormat === "microdata" ? doc.querySelectorAll("[itemscope], [itemprop]") : doc.querySelectorAll("[typeof], [property]");
      for (const el of Array.from(schemaElements)) {
        const style = window.getComputedStyle(el);
        if (style.display === "none" || style.visibility === "hidden" || el.hidden || el.getAttribute("aria-hidden") === "true") {
          return true;
        }
      }
    }
  } catch (error) {
    devWarn("Hidden content check error:", error);
  }
  return false;
}
function calculateSchemaScore(schemas, contentMatches, hasHiddenContent, hasMixedFormats, hasDuplicateTypes) {
  let syntaxScore = 100;
  let completenessScore = 100;
  let accuracyScore = 100;
  let bestPracticesScore = 100;
  schemas.forEach((schema) => {
    syntaxScore -= schema.errors.filter((e) => e.severity === "critical").length * 20;
    syntaxScore -= schema.errors.filter((e) => e.severity === "high").length * 15;
    syntaxScore -= schema.errors.filter((e) => e.severity === "medium").length * 10;
    syntaxScore -= schema.errors.filter((e) => e.severity === "low").length * 5;
  });
  schemas.forEach((schema) => {
    completenessScore -= schema.errors.filter((e) => e.code === "MISSING_REQUIRED_PROPERTY").length * 15;
    completenessScore -= schema.recommendations.length * 2;
  });
  const mismatches = contentMatches.filter((m) => !m.matches);
  accuracyScore -= mismatches.length * 10;
  if (hasHiddenContent) accuracyScore -= 15;
  if (hasMixedFormats) bestPracticesScore -= 10;
  if (hasDuplicateTypes) bestPracticesScore -= 5;
  schemas.forEach((schema) => {
    if (schema.format !== "json-ld") bestPracticesScore -= 5;
    bestPracticesScore -= schema.warnings.filter((w) => w.severity === "medium").length * 3;
    bestPracticesScore -= schema.warnings.filter((w) => w.severity === "low").length * 1;
  });
  syntaxScore = Math.max(0, Math.min(100, syntaxScore));
  completenessScore = Math.max(0, Math.min(100, completenessScore));
  accuracyScore = Math.max(0, Math.min(100, accuracyScore));
  bestPracticesScore = Math.max(0, Math.min(100, bestPracticesScore));
  const overallScore = Math.round(
    syntaxScore * 0.3 + completenessScore * 0.3 + accuracyScore * 0.25 + bestPracticesScore * 0.15
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
async function validatePageSchema(page) {
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
    const formatCounts = {
      jsonld: extractedSchemas.filter((s) => s.format === "json-ld").length,
      microdata: extractedSchemas.filter((s) => s.format === "microdata").length,
      rdfa: extractedSchemas.filter((s) => s.format === "rdfa").length
    };
    const hasMixedFormats = (formatCounts.jsonld > 0 ? 1 : 0) + (formatCounts.microdata > 0 ? 1 : 0) + (formatCounts.rdfa > 0 ? 1 : 0) > 1;
    const validatedSchemas = extractedSchemas.map((extracted) => {
      const validated = validateSchemaComprehensive(extracted.data, extracted.type, extracted.format, extracted.index);
      validated.schemaString = extracted.raw || JSON.stringify(extracted.data, null, 2);
      return validated;
    });
    const typeCounts = {};
    validatedSchemas.forEach((s) => {
      typeCounts[s.schemaType] = (typeCounts[s.schemaType] || 0) + 1;
    });
    const hasDuplicateTypes = Object.values(typeCounts).some((count) => count > 1);
    const allContentMatches = [];
    validatedSchemas.forEach((schema, index) => {
      const extractedSchema = extractedSchemas[index];
      if (extractedSchema) {
        const matches = crossCheckContentWithSchema(html, extractedSchema.data);
        allContentMatches.push(...matches);
      }
    });
    const hasContentMismatches = allContentMatches.some((m) => !m.matches);
    const hasHiddenContent = validatedSchemas.some(
      (s) => (s.format === "microdata" || s.format === "rdfa") && checkForHiddenContent(html, s.format)
    );
    const totalErrors = validatedSchemas.reduce((sum, s) => sum + s.errors.length, 0);
    const totalWarnings = validatedSchemas.reduce((sum, s) => sum + s.warnings.length, 0);
    const totalRecommendations = validatedSchemas.reduce((sum, s) => sum + s.recommendations.length, 0);
    const overallValid = validatedSchemas.every((s) => s.isValid);
    const scoreResult = calculateSchemaScore(
      validatedSchemas,
      allContentMatches,
      hasHiddenContent,
      hasMixedFormats,
      hasDuplicateTypes
    );
    const schemaTypes = validatedSchemas.map((s) => s.schemaType);
    const missingRequiredProperties = [];
    validatedSchemas.forEach((schema) => {
      schema.errors.forEach((error) => {
        if (error.property && error.code === "MISSING_REQUIRED_PROPERTY" && !missingRequiredProperties.includes(error.property)) {
          missingRequiredProperties.push(error.property);
        }
      });
    });
    const suggestions = [];
    if (totalErrors > 0) {
      suggestions.push(`Fix ${totalErrors} error${totalErrors !== 1 ? "s" : ""} in schema markup`);
    }
    if (hasMixedFormats) {
      suggestions.push("Consider using a single format (preferably JSON-LD) for consistency");
    }
    if (hasContentMismatches) {
      suggestions.push("Ensure schema values match visible page content");
    }
    if (hasHiddenContent) {
      suggestions.push("Remove schema markup from hidden content");
    }
    if (totalRecommendations > 0) {
      suggestions.push(`Consider adding ${totalRecommendations} recommended propert${totalRecommendations !== 1 ? "ies" : "y"}`);
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
function shouldExcludeFromSchemaValidation(page) {
  const relPermalink = page.relPermalink.toLowerCase();
  const excludePatterns = [
    /\.txt$/i,
    // Text files (llms.txt, robots.txt, etc.)
    /\.xml$/i,
    // XML files (sitemap.xml, etc.)
    /\.json$/i,
    // JSON files
    /\.csv$/i,
    // CSV files
    /\.pdf$/i,
    // PDF files
    /\/llms\.txt$/i,
    // LLMs.txt file
    /\/robots\.txt$/i,
    // Robots.txt file
    /\/sitemap/i,
    // Sitemap files
    /\/feed/i,
    // RSS/Atom feeds
    /\/search/i,
    // Search pages (usually dynamic)
    /\/404/i,
    // 404 pages
    /^\/page-list\//i
    // Page list tool pages themselves
  ];
  return excludePatterns.some((pattern) => pattern.test(relPermalink));
}
async function validateAllPageSchemas(pages, progressCallback) {
  const pagesToValidate = pages.filter((page) => !shouldExcludeFromSchemaValidation(page));
  const results = [];
  const total = pagesToValidate.length;
  for (let i = 0; i < pagesToValidate.length; i++) {
    const page = pagesToValidate[i];
    if (progressCallback) {
      progressCallback(i + 1, total);
    }
    const result = await validatePageSchema(page);
    results.push(result);
    if (i < pagesToValidate.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
  return results;
}
function renderSchemaSection(pages) {
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
function renderSchemaResults(results) {
  if (results.length === 0) {
    return `
      <div class="page-list-schema-empty">
        <div class="page-list-schema-empty__icon">\u{1F4CB}</div>
        <h3 class="page-list-schema-empty__title">No validation results</h3>
        <p class="page-list-schema-empty__text">Click "Validate All Pages" to start validation.</p>
      </div>
    `;
  }
  const totalPages = results.length;
  const pagesWithSchema = results.filter((r) => r.hasSchema).length;
  const pagesWithoutSchema = totalPages - pagesWithSchema;
  const validPages = results.filter((r) => r.overallValid && r.hasSchema).length;
  const invalidPages = results.filter((r) => !r.overallValid && r.hasSchema).length;
  const totalErrors = results.reduce((sum, r) => sum + r.errorCount, 0);
  const totalWarnings = results.reduce((sum, r) => sum + r.warningCount, 0);
  const totalRecommendations = results.reduce((sum, r) => sum + r.recommendationCount, 0);
  const pagesWithContentMismatches = results.filter((r) => r.hasContentMismatches).length;
  const pagesWithMixedFormats = results.filter((r) => r.hasMixedFormats).length;
  const averageScore = results.length > 0 ? Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length) : 0;
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
          <div class="page-list-schema-summary__stat-value ${pagesWithSchema > 0 ? "page-list-schema-summary__stat-value--good" : "page-list-schema-summary__stat-value--bad"}">${pagesWithSchema}</div>
          <div class="page-list-schema-summary__stat-label">With Schema</div>
        </div>
        <div class="page-list-schema-summary__stat">
          <div class="page-list-schema-summary__stat-value ${validPages === pagesWithSchema ? "page-list-schema-summary__stat-value--good" : "page-list-schema-summary__stat-value--warning"}">${validPages}</div>
          <div class="page-list-schema-summary__stat-label">Valid</div>
        </div>
        <div class="page-list-schema-summary__stat">
          <div class="page-list-schema-summary__stat-value ${totalErrors === 0 ? "page-list-schema-summary__stat-value--good" : "page-list-schema-summary__stat-value--bad"}">${totalErrors}</div>
          <div class="page-list-schema-summary__stat-label">Errors</div>
        </div>
        <div class="page-list-schema-summary__stat">
          <div class="page-list-schema-summary__stat-value ${totalWarnings === 0 ? "page-list-schema-summary__stat-value--good" : "page-list-schema-summary__stat-value--warning"}">${totalWarnings}</div>
          <div class="page-list-schema-summary__stat-label">Warnings</div>
        </div>
        <div class="page-list-schema-summary__stat">
          <div class="page-list-schema-summary__stat-value ${totalRecommendations === 0 ? "page-list-schema-summary__stat-value--good" : "page-list-schema-summary__stat-value--warning"}">${totalRecommendations}</div>
          <div class="page-list-schema-summary__stat-label">Recommendations</div>
        </div>
        <div class="page-list-schema-summary__stat">
          <div class="page-list-schema-summary__stat-value ${averageScore >= 80 ? "page-list-schema-summary__stat-value--good" : averageScore >= 60 ? "page-list-schema-summary__stat-value--warning" : "page-list-schema-summary__stat-value--bad"}">${averageScore}%</div>
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
  sortedResults.forEach((result) => {
    const statusClass = !result.hasSchema ? "page-list-schema-row__status--none" : result.overallValid ? "page-list-schema-row__status--valid" : "page-list-schema-row__status--invalid";
    const statusText = !result.hasSchema ? "No Schema" : result.overallValid ? "Valid" : "Invalid";
    const scoreClass = result.score >= 80 ? "page-list-schema-row__score--good" : result.score >= 60 ? "page-list-schema-row__score--warning" : "page-list-schema-row__score--bad";
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
          ${result.schemaTypes.length > 0 ? (() => {
      const typeCounts = /* @__PURE__ */ new Map();
      result.schemaTypes.forEach((type) => {
        typeCounts.set(type, (typeCounts.get(type) || 0) + 1);
      });
      return Array.from(typeCounts.entries()).map(
        ([type, count]) => count > 1 ? `<span class="page-list-schema-row__type-badge" title="${escapeHtml(type)}">${escapeHtml(type)} (${count})</span>` : `<span class="page-list-schema-row__type-badge">${escapeHtml(type)}</span>`
      ).join("");
    })() : '<span class="page-list-schema-row__type-badge page-list-schema-row__type-badge--none">None</span>'}
        </td>
        <td class="page-list-schema-row__format">
          ${result.hasSchema ? `
            <div class="page-list-schema-row__format-badges">
              ${result.formatCounts.jsonld > 0 ? `<span class="page-list-schema-row__format-badge" title="JSON-LD">JSON-LD (${result.formatCounts.jsonld})</span>` : ""}
              ${result.formatCounts.microdata > 0 ? `<span class="page-list-schema-row__format-badge" title="Microdata">Microdata (${result.formatCounts.microdata})</span>` : ""}
              ${result.formatCounts.rdfa > 0 ? `<span class="page-list-schema-row__format-badge" title="RDFa">RDFa (${result.formatCounts.rdfa})</span>` : ""}
            </div>
            ${result.hasMixedFormats ? '<span class="page-list-schema-row__mixed-formats-warning" title="Mixed formats detected">\u26A0 Mixed</span>' : ""}
          ` : '<span class="page-list-schema-row__format-badge page-list-schema-row__format-badge--none">-</span>'}
        </td>
        <td class="page-list-schema-row__errors">
          ${result.errorCount > 0 ? `<span class="page-list-schema-row__count page-list-schema-row__count--error">${result.errorCount}</span>` : '<span class="page-list-schema-row__count page-list-schema-row__count--good">0</span>'}
        </td>
        <td class="page-list-schema-row__warnings">
          ${result.warningCount > 0 ? `<span class="page-list-schema-row__count page-list-schema-row__count--warning">${result.warningCount}</span>` : '<span class="page-list-schema-row__count page-list-schema-row__count--good">0</span>'}
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
function renderSchemaDetailsModal(result) {
  const navItems = [];
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
            ${navItems.join("")}
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
                  ${result.formatCounts.jsonld > 0 ? `JSON-LD (${result.formatCounts.jsonld}) ` : ""}
                  ${result.formatCounts.microdata > 0 ? `Microdata (${result.formatCounts.microdata}) ` : ""}
                  ${result.formatCounts.rdfa > 0 ? `RDFa (${result.formatCounts.rdfa})` : ""}
                  ${result.hasMixedFormats ? " \u26A0 Mixed formats" : ""}
                </div>
                <div class="page-list-schema-modal__info-item">
                  <strong>Overall Status:</strong>
                  <span class="${result.overallValid ? "page-list-schema-modal__status--valid" : "page-list-schema-modal__status--invalid"}">
                    ${result.overallValid ? "Valid" : "Invalid"}
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
                    ${result.suggestions.map((suggestion) => `
                      <li>${escapeHtml(suggestion)}</li>
                    `).join("")}
                  </ul>
                </div>
              </section>
            ` : ""}
            
            ${result.contentMatches.length > 0 ? `
              <section id="schema-content-check" class="page-list-schema-modal__section">
                <div class="page-list-schema-modal__content-matches">
                  <h3 class="page-list-schema-modal__section-title">Content Cross-Check</h3>
                  <div class="page-list-schema-modal__content-matches-list">
                    ${result.contentMatches.map((match) => `
                      <div class="page-list-schema-modal__content-match ${match.matches ? "page-list-schema-modal__content-match--match" : "page-list-schema-modal__content-match--mismatch"}">
                        <strong>${escapeHtml(match.property)}:</strong>
                        <div class="page-list-schema-modal__content-match-values">
                          <div>Schema: ${escapeHtml(match.schemaValue)}</div>
                          ${match.pageValue ? `<div>Page: ${escapeHtml(match.pageValue)}</div>` : "<div>Page: Not found</div>"}
                          <div class="page-list-schema-modal__content-match-status">
                            ${match.matches ? "\u2713 Match" : "\u2717 Mismatch"} (confidence: ${Math.round(match.confidence * 100)}%)
                          </div>
                        </div>
                      </div>
                    `).join("")}
                  </div>
                </div>
              </section>
            ` : ""}
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
                  <span class="${schema.isValid ? "page-list-schema-modal__schema-status--valid" : "page-list-schema-modal__schema-status--invalid"}">
                    ${schema.isValid ? "\u2713 Valid" : "\u2717 Invalid"}
                  </span>
                </h3>
                
                ${schema.errors.length > 0 ? `
                  <div class="page-list-schema-modal__errors">
                    <h4 class="page-list-schema-modal__errors-title">Errors (${schema.errors.length})</h4>
                    <ul class="page-list-schema-modal__errors-list">
                      ${schema.errors.map((error) => `
                        <li class="page-list-schema-modal__error-item">
                          <div class="page-list-schema-modal__error-header">
                            <strong>${error.property || "General"}:</strong>
                            <span class="page-list-schema-modal__error-severity severity-${error.severity}">${error.severity}</span>
                          </div>
                          <div class="page-list-schema-modal__error-message">${escapeHtml(error.message)}</div>
                          ${error.expected ? `<div class="page-list-schema-modal__error-detail"><small>Expected: ${escapeHtml(error.expected)}</small></div>` : ""}
                          ${error.actual ? `<div class="page-list-schema-modal__error-detail"><small>Actual: ${escapeHtml(error.actual)}</small></div>` : ""}
                          ${error.suggestion ? `<div class="page-list-schema-modal__error-suggestion"><small>\u{1F4A1} ${escapeHtml(error.suggestion)}</small></div>` : ""}
                          ${error.code ? `<div class="page-list-schema-modal__error-code"><small>Code: ${escapeHtml(error.code)}</small></div>` : ""}
                        </li>
                      `).join("")}
                    </ul>
                  </div>
                ` : ""}
                
                ${schema.warnings.length > 0 ? `
                  <div class="page-list-schema-modal__warnings">
                    <h4 class="page-list-schema-modal__warnings-title">Warnings (${schema.warnings.length})</h4>
                    <ul class="page-list-schema-modal__warnings-list">
                      ${schema.warnings.map((warning) => `
                        <li class="page-list-schema-modal__warning-item">
                          <div class="page-list-schema-modal__warning-header">
                            <strong>${warning.property || "General"}:</strong>
                            <span class="page-list-schema-modal__warning-severity severity-${warning.severity}">${warning.severity}</span>
                          </div>
                          <div class="page-list-schema-modal__warning-message">${escapeHtml(warning.message)}</div>
                          ${warning.expected ? `<div class="page-list-schema-modal__warning-detail"><small>Expected: ${escapeHtml(warning.expected)}</small></div>` : ""}
                          ${warning.actual ? `<div class="page-list-schema-modal__warning-detail"><small>Actual: ${escapeHtml(warning.actual)}</small></div>` : ""}
                          ${warning.suggestion ? `<div class="page-list-schema-modal__warning-suggestion"><small>\u{1F4A1} ${escapeHtml(warning.suggestion)}</small></div>` : ""}
                        </li>
                      `).join("")}
                    </ul>
                  </div>
                ` : ""}
                
                ${schema.recommendations.length > 0 ? `
                  <div class="page-list-schema-modal__recommendations">
                    <h4 class="page-list-schema-modal__recommendations-title">Recommendations (${schema.recommendations.length})</h4>
                    <ul class="page-list-schema-modal__recommendations-list">
                      ${schema.recommendations.map((rec) => `
                        <li class="page-list-schema-modal__recommendation-item">
                          <div class="page-list-schema-modal__recommendation-header">
                            <strong>${rec.property || "General"}:</strong>
                            <span class="page-list-schema-modal__recommendation-severity severity-${rec.severity}">${rec.severity}</span>
                          </div>
                          <div class="page-list-schema-modal__recommendation-message">${escapeHtml(rec.message)}</div>
                          ${rec.suggestion ? `<div class="page-list-schema-modal__recommendation-suggestion"><small>\u{1F4A1} ${escapeHtml(rec.suggestion)}</small></div>` : ""}
                        </li>
                      `).join("")}
                    </ul>
                  </div>
                ` : ""}
                
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
function attachSchemaValidationHandlers(pages) {
  const validateBtn = document.getElementById("page-list-schema-validate-btn");
  const statusDiv = document.getElementById("page-list-schema-status");
  const resultsDiv = document.getElementById("page-list-schema-results");
  if (!validateBtn || !statusDiv || !resultsDiv) return;
  let validationResults = [];
  validateBtn.addEventListener("click", async () => {
    validateBtn.setAttribute("disabled", "disabled");
    validateBtn.innerHTML = '<span class="material-symbols-outlined">hourglass_empty</span> Validating...';
    const pagesToValidate = pages.filter((page) => !shouldExcludeFromSchemaValidation(page));
    statusDiv.innerHTML = `
      <div class="page-list-schema-status__progress">
        <p class="page-list-schema-status__text">Validating ${pagesToValidate.length} pages...</p>
        <div class="page-list-schema-status__progress-bar">
          <div class="page-list-schema-status__progress-fill" id="page-list-schema-progress-fill"></div>
        </div>
        <p class="page-list-schema-status__progress-text" id="page-list-schema-progress-text">0 / ${pagesToValidate.length}</p>
      </div>
    `;
    const progressFill = document.getElementById("page-list-schema-progress-fill");
    const progressText = document.getElementById("page-list-schema-progress-text");
    try {
      validationResults = await validateAllPageSchemas(pages, (current, total) => {
        const percent = Math.round(current / total * 100);
        if (progressFill) {
          progressFill.style.width = `${percent}%`;
        }
        if (progressText) {
          progressText.textContent = `${current} / ${total}`;
        }
      });
      statusDiv.innerHTML = `
        <p class="page-list-schema-status__text page-list-schema-status__text--success">
          Validation complete! Found ${validationResults.filter((r) => !r.overallValid).length} page(s) with issues.
        </p>
      `;
      resultsDiv.innerHTML = renderSchemaResults(validationResults);
      const detailsButtons = resultsDiv.querySelectorAll(".page-list-schema-row__details-btn");
      detailsButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
          const pageUrl = btn.getAttribute("data-page-url");
          if (!pageUrl) return;
          const result = validationResults.find((r) => r.relPermalink === pageUrl);
          if (!result) return;
          const modalHtml = renderSchemaDetailsModal(result);
          document.body.insertAdjacentHTML("beforeend", modalHtml);
          const modal = document.getElementById("page-list-schema-modal-overlay");
          const closeBtn = modal?.querySelector("[data-schema-modal-close]");
          const modalContent = modal?.querySelector(".page-list-schema-modal__content");
          const closeModal2 = () => {
            modal?.remove();
            document.removeEventListener("keydown", handleEscape);
          };
          const handleEscape = (e) => {
            if (e.key === "Escape") {
              closeModal2();
            }
          };
          const navLinks = modal?.querySelectorAll(".page-list-schema-modal__nav-link");
          navLinks?.forEach((link) => {
            link.addEventListener("click", (e) => {
              e.preventDefault();
              const targetId = link.getAttribute("href")?.substring(1);
              if (targetId) {
                const targetSection = modal?.querySelector(`#${targetId}`);
                if (targetSection && modalContent) {
                  targetSection.scrollIntoView({ behavior: "smooth", block: "start" });
                  navLinks.forEach((l) => l.classList.remove("page-list-schema-modal__nav-link--active"));
                  link.classList.add("page-list-schema-modal__nav-link--active");
                }
              }
            });
          });
          const rawToggles = modal?.querySelectorAll("[data-raw-toggle]");
          rawToggles?.forEach((toggle) => {
            toggle.addEventListener("click", () => {
              const schemaId = toggle.getAttribute("data-raw-toggle");
              if (schemaId) {
                const content = modal?.querySelector(`#raw-${schemaId}`);
                const icon = toggle.querySelector(".page-list-schema-modal__raw-toggle-icon");
                if (content) {
                  const isHidden = content.style.display === "none";
                  content.style.display = isHidden ? "block" : "none";
                  if (icon) {
                    icon.textContent = isHidden ? "expand_less" : "expand_more";
                  }
                }
              }
            });
          });
          if (navLinks && navLinks.length > 0) {
            navLinks[0].classList.add("page-list-schema-modal__nav-link--active");
          }
          closeBtn?.addEventListener("click", closeModal2);
          modal?.addEventListener("click", (e) => {
            if (e.target === modal) {
              closeModal2();
            }
          });
          document.addEventListener("keydown", handleEscape);
        });
      });
    } catch (error) {
      devError("Schema validation error:", error);
      statusDiv.innerHTML = `
        <p class="page-list-schema-status__text page-list-schema-status__text--error">
          Error during validation: ${error instanceof Error ? error.message : "Unknown error"}
        </p>
      `;
    } finally {
      validateBtn.removeAttribute("disabled");
      validateBtn.innerHTML = '<span class="material-symbols-outlined">check_circle</span> Validate All Pages';
    }
  });
}
function parseLLMSTxt(content) {
  const lines = content.split("\n");
  let h1Title = null;
  let blockquote = null;
  let freeText = "";
  const sections = [];
  let currentSection = null;
  let inBlockquote = false;
  let blockquoteLines = [];
  let freeTextLines = [];
  let foundH1 = false;
  let foundFreeText = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (trimmed.startsWith("# ") && !foundH1) {
      h1Title = trimmed.substring(2).trim();
      foundH1 = true;
      inBlockquote = false;
      continue;
    }
    if (foundH1 && !foundFreeText && trimmed.startsWith(">")) {
      inBlockquote = true;
      blockquoteLines.push(trimmed.substring(1).trim());
      continue;
    }
    if (inBlockquote && !foundFreeText) {
      if (trimmed.startsWith(">")) {
        blockquoteLines.push(trimmed.substring(1).trim());
        continue;
      } else if (trimmed.length === 0) {
        continue;
      } else {
        if (blockquoteLines.length > 0 && !blockquote) {
          const blockquoteContent = blockquoteLines.join(" ").trim();
          if (blockquoteContent.length > 0) {
            blockquote = blockquoteContent;
          }
        }
        inBlockquote = false;
      }
    }
    if (trimmed.startsWith("## ")) {
      if (currentSection) {
        sections.push(currentSection);
      }
      const sectionTitle = trimmed.substring(3).trim();
      currentSection = {
        title: sectionTitle,
        isOptional: sectionTitle.toLowerCase() === "optional",
        links: [],
        lineNumber: i + 1
      };
      inBlockquote = false;
      foundFreeText = true;
      if (blockquoteLines.length > 0 && !blockquote) {
        const blockquoteContent = blockquoteLines.join(" ").trim();
        if (blockquoteContent.length > 0) {
          blockquote = blockquoteContent;
        }
      }
      continue;
    }
    if (foundH1 && !currentSection && !inBlockquote) {
      if (trimmed.length > 0) {
        freeTextLines.push(line);
      }
      foundFreeText = true;
      continue;
    }
    if (currentSection && trimmed.startsWith("- ")) {
      const linkContent = trimmed.substring(2).trim();
      let url = linkContent;
      let name;
      let notes;
      const linkMatch = linkContent.match(/\[([^\]]+)\]\(([^)]+)\)/);
      if (linkMatch) {
        name = linkMatch[1];
        const fullLink = linkMatch[0];
        const urlPart = linkMatch[2];
        url = urlPart;
        const afterLink = linkContent.substring(linkMatch.index + fullLink.length).trim();
        if (afterLink.startsWith(":")) {
          notes = afterLink.substring(1).trim();
        }
      } else {
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
        accessible: false
        // Will be checked later
      });
    }
  }
  if (currentSection) {
    sections.push(currentSection);
  }
  if (blockquoteLines.length > 0 && !blockquote) {
    const blockquoteContent = blockquoteLines.join(" ").trim();
    if (blockquoteContent.length > 0) {
      blockquote = blockquoteContent;
    }
  }
  return {
    h1Title,
    blockquote: blockquote || null,
    freeText: freeTextLines.join("\n").trim(),
    sections,
    rawContent: content
  };
}
function validateLLMSTxtStructure(structure) {
  const errors = [];
  if (!structure.h1Title) {
    errors.push({
      type: "error",
      severity: "critical",
      message: "Missing H1 header. The file must start with a single # header containing the project/site name.",
      code: "MISSING_H1",
      suggestion: "Add an H1 header at the top: # Your Site Name"
    });
  }
  const freeTextLines = structure.freeText.split("\n");
  for (let i = 0; i < freeTextLines.length; i++) {
    const line = freeTextLines[i].trim();
    if (line.startsWith("###")) {
      errors.push({
        type: "error",
        severity: "high",
        message: `Invalid heading level in free text area: "${line.substring(0, 50)}". Only H1 and H2 headings are allowed per llms.txt spec.`,
        line: i + 1,
        code: "INVALID_HEADING_LEVEL",
        suggestion: "Remove H3+ headings from the free text area. Use H2 sections for organization."
      });
    }
  }
  const h1Count = (structure.rawContent.match(/^# [^#]/gm) || []).length;
  if (h1Count > 1) {
    errors.push({
      type: "error",
      severity: "critical",
      message: `Multiple H1 headers found (${h1Count}). Only one H1 is allowed per llms.txt spec.`,
      code: "MULTIPLE_H1",
      suggestion: "Remove extra H1 headers. The file should start with a single H1 containing the site/project name."
    });
  }
  const lines = structure.rawContent.split("\n");
  let foundH1 = false;
  let foundBlockquote = false;
  let foundFreeText = false;
  let foundH2 = false;
  let orderViolations = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith("# ") && !line.startsWith("##")) {
      foundH1 = true;
      if (foundBlockquote || foundFreeText || foundH2) {
        orderViolations.push(i + 1);
      }
    } else if (line.startsWith(">") && foundH1 && !foundFreeText && !foundH2) {
      foundBlockquote = true;
    } else if (foundH1 && !line.startsWith("#") && !line.startsWith(">") && line.length > 0 && !foundH2) {
      foundFreeText = true;
    } else if (line.startsWith("## ")) {
      foundH2 = true;
    }
  }
  if (orderViolations.length > 0) {
    errors.push({
      type: "error",
      severity: "high",
      message: `Structure order violation: H1 must come first, followed by optional blockquote, free text, then H2 sections.`,
      code: "STRUCTURE_ORDER_VIOLATION",
      suggestion: "Reorganize the file to follow the required order: H1 > blockquote (optional) > free text > H2 sections."
    });
  }
  if (!structure.blockquote || structure.blockquote.trim().length === 0) {
    errors.push({
      type: "warning",
      severity: "low",
      message: "Missing blockquote summary. A blockquote after H1 is recommended for a concise site description.",
      code: "MISSING_BLOCKQUOTE",
      suggestion: "Add a blockquote summary after the H1 header to help LLMs understand your site quickly."
    });
  }
  if (structure.sections.length === 0) {
    errors.push({
      type: "error",
      severity: "critical",
      message: "No H2 sections found. The file must contain at least one section with file links.",
      code: "NO_SECTIONS",
      suggestion: "Add H2 sections (## Section Name) with lists of links to important content."
    });
  }
  structure.sections.forEach((section, sectionIndex) => {
    section.links.forEach((link, linkIndex) => {
      if (link.url.includes("{{") || link.url.includes("}}")) {
        return;
      }
      try {
        new URL(link.url);
      } catch {
        if (!link.url.startsWith("/") && !link.url.startsWith("./") && !link.url.startsWith("../")) {
          errors.push({
            type: "error",
            severity: "high",
            message: `Invalid URL format in section "${section.title}": "${link.url}". URLs must be absolute or valid relative paths.`,
            line: section.lineNumber + linkIndex + 1,
            code: "INVALID_URL_FORMAT",
            suggestion: "Use absolute URLs (https://...) or relative paths starting with /"
          });
        }
      }
      if (link.url && !link.url.match(/\.(md|markdown)$/i) && !link.url.includes("#") && !link.url.match(/\/$/)) {
        errors.push({
          type: "warning",
          severity: "medium",
          message: `Link "${link.url}" does not point to a .md file. Consider using .md versions for better LLM compatibility.`,
          line: section.lineNumber + linkIndex + 1,
          code: "NON_MARKDOWN_LINK",
          suggestion: "Use .md versions of pages when available, or append .md to HTML URLs if your site supports it."
        });
      }
    });
    if (!section.isOptional && section.links.length > 10) {
      errors.push({
        type: "warning",
        severity: "medium",
        message: `Section "${section.title}" has ${section.links.length} links. Best practice is to limit to 5-10 high-value links.`,
        code: "TOO_MANY_LINKS",
        suggestion: "Consider curating links to focus on the most important, evergreen content for LLMs."
      });
    }
  });
  return errors;
}
function validateMarkdownSyntax(content) {
  const errors = [];
  const lines = content.split("\n");
  let inList = false;
  let listDepth = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (trimmed.match(/^[-*+]\s/)) {
      if (!inList) inList = true;
    } else if (inList && trimmed.length === 0) {
      continue;
    } else if (inList && !trimmed.match(/^[-*+]\s/) && trimmed.length > 0) {
      if (!trimmed.startsWith("#") && !trimmed.startsWith(">")) {
      }
    }
    const linkMatches = line.matchAll(/\[([^\]]*)\]\(([^)]*)\)/g);
    for (const match of linkMatches) {
      if (!match[1] || !match[2]) {
        errors.push({
          type: "error",
          severity: "high",
          message: `Malformed Markdown link: "${match[0]}"`,
          line: i + 1,
          code: "MALFORMED_LINK",
          suggestion: "Links must be in format [text](url) with both text and URL."
        });
      }
    }
    const codeBlockCount = (line.match(/```/g) || []).length;
    if (codeBlockCount % 2 !== 0) {
      errors.push({
        type: "warning",
        severity: "low",
        message: "Possible unclosed code block",
        line: i + 1,
        code: "UNCLOSED_CODE_BLOCK"
      });
    }
  }
  try {
    const encoder = new TextEncoder();
    encoder.encode(content);
  } catch (e) {
    errors.push({
      type: "error",
      severity: "critical",
      message: "File contains invalid characters. Must be UTF-8 encoded.",
      code: "INVALID_ENCODING",
      suggestion: "Ensure the file is saved as UTF-8 encoding."
    });
  }
  return errors;
}
function estimateTokenCount(text) {
  return Math.ceil(text.length / 4);
}
function convertToLocalhostUrl(url, baseUrl) {
  const isLocalhost2 = baseUrl.includes("localhost") || baseUrl.includes("127.0.0.1") || baseUrl.includes("0.0.0.0");
  if (!isLocalhost2 || !url.startsWith("http://") && !url.startsWith("https://")) {
    return url;
  }
  try {
    const urlObj = new URL(url);
    const productionDomains = ["appliancesrepairservice.ca", "www.appliancesrepairservice.ca"];
    const isProductionUrl = productionDomains.some((domain) => urlObj.hostname === domain || urlObj.hostname.endsWith("." + domain));
    if (isProductionUrl) {
      return baseUrl + urlObj.pathname + urlObj.search + urlObj.hash;
    }
  } catch {
  }
  return url;
}
async function checkLinkAccessibility(url, baseUrl = window.location.origin) {
  try {
    let absoluteUrl = url;
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      if (url.startsWith("/")) {
        absoluteUrl = baseUrl + url;
      } else {
        absoluteUrl = baseUrl + "/" + url;
      }
    } else {
      absoluteUrl = convertToLocalhostUrl(url, baseUrl);
    }
    const response = await fetch(absoluteUrl, { method: "HEAD", redirect: "follow" });
    return {
      accessible: response.ok,
      statusCode: response.status
    };
  } catch (error) {
    return {
      accessible: false,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}
async function checkMarkdownVersion(url, baseUrl = window.location.origin) {
  if (url.match(/\.(md|markdown)$/i)) {
    return { exists: true, mdUrl: url };
  }
  let pathname = url;
  if (url.startsWith("http://") || url.startsWith("https://")) {
    try {
      const urlObj = new URL(url);
      pathname = urlObj.pathname;
    } catch {
      const match = url.match(/https?:\/\/[^\/]+(\/.*)/);
      if (match) {
        pathname = match[1];
      }
    }
  }
  const mdPatterns = [
    pathname.replace(/\.html?$/, ".md"),
    pathname + ".md",
    pathname.replace(/\/$/, ".md"),
    pathname + "/index.md"
  ];
  for (const mdPath of mdPatterns) {
    try {
      const absoluteUrl = mdPath.startsWith("/") ? baseUrl + mdPath : baseUrl + "/" + mdPath;
      const response = await fetch(absoluteUrl, { method: "HEAD", redirect: "follow" });
      if (response.ok) {
        return { exists: true, mdUrl: mdPath };
      }
    } catch {
    }
  }
  return { exists: false };
}
async function validateLLMSTxtLinks(structure, baseUrl = window.location.origin) {
  const errors = [];
  const allLinks = [];
  const seenUrls = /* @__PURE__ */ new Set();
  for (const section of structure.sections) {
    for (let i = 0; i < section.links.length; i++) {
      const link = section.links[i];
      const normalizedUrl = link.url.toLowerCase().split("#")[0];
      if (seenUrls.has(normalizedUrl)) {
        errors.push({
          type: "warning",
          severity: "medium",
          message: `Duplicate link found: "${link.url}"`,
          code: "DUPLICATE_LINK",
          suggestion: "Remove duplicate links to keep the file concise."
        });
      } else {
        seenUrls.add(normalizedUrl);
      }
      const mdCheck = await checkMarkdownVersion(link.url, baseUrl);
      if (!mdCheck.exists && !link.url.match(/\.(md|markdown)$/i)) {
        errors.push({
          type: "warning",
          severity: "low",
          message: `Link "${link.url}" does not point to a .md file and no .md version found.`,
          code: "NON_MARKDOWN_LINK",
          suggestion: "Consider using .md versions of pages for better LLM compatibility, or ensure HTML pages have .md equivalents."
        });
      }
      const checkResult = await checkLinkAccessibility(link.url, baseUrl);
      const validatedLink = {
        ...link,
        accessible: checkResult.accessible,
        statusCode: checkResult.statusCode,
        error: checkResult.error
      };
      allLinks.push(validatedLink);
      if (!checkResult.accessible) {
        errors.push({
          type: "error",
          severity: checkResult.statusCode === 404 ? "high" : "medium",
          message: `Link "${link.url}" is not accessible${checkResult.statusCode ? ` (HTTP ${checkResult.statusCode})` : ""}`,
          code: "INACCESSIBLE_LINK",
          suggestion: checkResult.statusCode === 404 ? "Check if the URL is correct or if the page exists." : "Verify the URL is correct and the server is accessible."
        });
      }
    }
  }
  return { links: allLinks, errors };
}
function calculateLLMSTxtScore(structure, structureErrors, syntaxErrors, linkErrors, allLinks, estimatedTokens) {
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
  const criticalStructureErrors = structureErrors.filter((e) => e.severity === "critical").length;
  const highStructureErrors = structureErrors.filter((e) => e.severity === "high").length;
  structureScore -= criticalStructureErrors * 30;
  structureScore -= highStructureErrors * 15;
  structureScore = Math.max(0, structureScore);
  const criticalSyntaxErrors = syntaxErrors.filter((e) => e.severity === "critical").length;
  const highSyntaxErrors = syntaxErrors.filter((e) => e.severity === "high").length;
  syntaxScore -= criticalSyntaxErrors * 25;
  syntaxScore -= highSyntaxErrors * 10;
  syntaxScore = Math.max(0, syntaxScore);
  const accessibleLinks = allLinks.filter((l) => l.accessible).length;
  const totalLinks = allLinks.length;
  if (totalLinks > 0) {
    linksScore = Math.round(accessibleLinks / totalLinks * 100);
  }
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
  const totalLinksCount = allLinks.length;
  if (totalLinksCount > 15) {
    bestPracticesScore -= 15;
  }
  if (estimatedTokens > 8e3) {
    bestPracticesScore -= 10;
  }
  const optionalSections = structure.sections.filter((s) => s.isOptional).length;
  if (optionalSections === 0 && totalLinksCount > 10) {
    bestPracticesScore -= 5;
  }
  bestPracticesScore = Math.max(0, bestPracticesScore);
  const overallScore = Math.round(
    structureScore * 0.3 + syntaxScore * 0.2 + linksScore * 0.25 + contentScore * 0.15 + bestPracticesScore * 0.1
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
async function validateLLMSTxt() {
  try {
    const response = await fetch("/llms.txt");
    if (!response.ok) {
      return {
        fileExists: false,
        fileAccessible: false,
        structure: null,
        errors: [{
          type: "error",
          severity: "critical",
          message: `llms.txt file not found at /llms.txt (HTTP ${response.status})`,
          code: "FILE_NOT_FOUND",
          suggestion: "Create an llms.txt file at the root of your site (e.g., /public/llms.txt in Hugo)"
        }],
        warnings: [],
        recommendations: [],
        score: 0,
        scoreBreakdown: { structure: 0, syntax: 0, links: 0, content: 0, bestPractices: 0 },
        estimatedTokens: 0,
        suggestions: ["Create an llms.txt file following the standard at https://llmstxt.org/"]
      };
    }
    const content = await response.text();
    const structure = parseLLMSTxt(content);
    const structureErrors = validateLLMSTxtStructure(structure);
    const syntaxErrors = validateMarkdownSyntax(content);
    const { links: validatedLinks, errors: linkErrors } = await validateLLMSTxtLinks(structure);
    let linkIndex = 0;
    structure.sections.forEach((section) => {
      section.links = validatedLinks.slice(linkIndex, linkIndex + section.links.length);
      linkIndex += section.links.length;
    });
    const allErrors = [...structureErrors, ...syntaxErrors, ...linkErrors];
    const errors = allErrors.filter((e) => e.type === "error");
    const warnings = allErrors.filter((e) => e.type === "warning");
    const recommendations = [];
    if (!structure.blockquote) {
      recommendations.push({
        type: "info",
        severity: "low",
        message: "Add a blockquote summary after H1 to help LLMs understand your site quickly.",
        code: "RECOMMEND_BLOCKQUOTE"
      });
    }
    const estimatedTokens = estimateTokenCount(content);
    if (estimatedTokens > 8e3) {
      recommendations.push({
        type: "info",
        severity: "medium",
        message: `File is approximately ${estimatedTokens} tokens. Consider keeping under 8000 tokens for better context window efficiency.`,
        code: "TOO_LONG"
      });
    }
    const totalLinks = validatedLinks.length;
    if (totalLinks > 15) {
      recommendations.push({
        type: "info",
        severity: "medium",
        message: `File contains ${totalLinks} links. Consider using an "Optional" section for less critical links.`,
        code: "TOO_MANY_LINKS"
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
    const suggestions = [];
    if (errors.length > 0) {
      suggestions.push("Fix critical errors to improve llms.txt quality");
    }
    if (warnings.length > 0) {
      suggestions.push("Address warnings to enhance compliance with best practices");
    }
    if (score < 80) {
      suggestions.push("Consider reviewing the llms.txt standard at https://llmstxt.org/ for guidance");
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
        type: "error",
        severity: "critical",
        message: `Error fetching llms.txt: ${error instanceof Error ? error.message : "Unknown error"}`,
        code: "FETCH_ERROR",
        suggestion: "Ensure llms.txt is accessible at /llms.txt"
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
function renderLLMSSection() {
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
function generateLLMSTxtTemplate(siteName = "Your Site Name") {
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
function renderLLMSResults(result) {
  if (!result.fileExists) {
    return `
      <div class="page-list-llms-empty">
        <div class="page-list-llms-empty__icon">\u{1F4C4}</div>
        <h3 class="page-list-llms-empty__title">llms.txt file not found</h3>
        <p class="page-list-llms-empty__text">The llms.txt file was not found at /llms.txt</p>
        <div class="page-list-llms-empty__suggestion">
          <p>Create an llms.txt file at the root of your site following the <a href="https://llmstxt.org/" target="_blank" rel="noopener noreferrer">llms.txt standard</a>.</p>
          <p>Click "Generate Template" above to create a basic template, or visit <a href="https://llmstxt.org/" target="_blank" rel="noopener noreferrer">llmstxt.org</a> for the full specification.</p>
        </div>
      </div>
    `;
  }
  const scoreClass = result.score >= 80 ? "page-list-llms-score--good" : result.score >= 60 ? "page-list-llms-score--warning" : "page-list-llms-score--bad";
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
            <div class="page-list-llms-summary__stat-value ${result.errors.length === 0 ? "page-list-llms-summary__stat-value--good" : "page-list-llms-summary__stat-value--bad"}">${result.errors.length}</div>
            <div class="page-list-llms-summary__stat-label">Errors</div>
          </div>
          <div class="page-list-llms-summary__stat">
            <div class="page-list-llms-summary__stat-value ${result.warnings.length === 0 ? "page-list-llms-summary__stat-value--good" : "page-list-llms-summary__stat-value--warning"}">${result.warnings.length}</div>
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
            ${result.errors.map((error) => `
              <li class="page-list-llms-error-item">
                <div class="page-list-llms-error-item__header">
                  <span class="page-list-llms-error-item__severity severity-${error.severity}">${error.severity}</span>
                  ${error.line ? `<span class="page-list-llms-error-item__line">Line ${error.line}</span>` : ""}
                  ${error.code ? `<span class="page-list-llms-error-item__code">${error.code}</span>` : ""}
                </div>
                <div class="page-list-llms-error-item__message">${escapeHtml(error.message)}</div>
                ${error.suggestion ? `<div class="page-list-llms-error-item__suggestion">\u{1F4A1} ${escapeHtml(error.suggestion)}</div>` : ""}
              </li>
            `).join("")}
          </ul>
        </div>
      ` : ""}
      
      ${result.warnings.length > 0 ? `
        <div class="page-list-llms-warnings">
          <h3 class="page-list-llms-warnings__title">
            <span class="material-symbols-outlined">warning</span>
            Warnings (${result.warnings.length})
          </h3>
          <ul class="page-list-llms-warnings__list">
            ${result.warnings.map((warning) => `
              <li class="page-list-llms-warning-item">
                <div class="page-list-llms-warning-item__header">
                  <span class="page-list-llms-warning-item__severity severity-${warning.severity}">${warning.severity}</span>
                  ${warning.line ? `<span class="page-list-llms-warning-item__line">Line ${warning.line}</span>` : ""}
                  ${warning.code ? `<span class="page-list-llms-warning-item__code">${warning.code}</span>` : ""}
                </div>
                <div class="page-list-llms-warning-item__message">${escapeHtml(warning.message)}</div>
                ${warning.suggestion ? `<div class="page-list-llms-warning-item__suggestion">\u{1F4A1} ${escapeHtml(warning.suggestion)}</div>` : ""}
              </li>
            `).join("")}
          </ul>
        </div>
      ` : ""}
      
      ${result.recommendations.length > 0 ? `
        <div class="page-list-llms-recommendations">
          <h3 class="page-list-llms-recommendations__title">
            <span class="material-symbols-outlined">lightbulb</span>
            Recommendations (${result.recommendations.length})
          </h3>
          <ul class="page-list-llms-recommendations__list">
            ${result.recommendations.map((rec) => `
              <li class="page-list-llms-recommendation-item">
                <div class="page-list-llms-recommendation-item__header">
                  <span class="page-list-llms-recommendation-item__severity severity-${rec.severity}">${rec.severity}</span>
                  ${rec.code ? `<span class="page-list-llms-recommendation-item__code">${rec.code}</span>` : ""}
                </div>
                <div class="page-list-llms-recommendation-item__message">${escapeHtml(rec.message)}</div>
              </li>
            `).join("")}
          </ul>
        </div>
      ` : ""}
      
      ${result.structure ? `
        <div class="page-list-llms-structure">
          <h3 class="page-list-llms-structure__title">
            <span class="material-symbols-outlined">article</span>
            File Structure
          </h3>
          <div class="page-list-llms-structure__content">
            <div class="page-list-llms-structure-item">
              <strong>H1 Title:</strong> ${result.structure.h1Title ? escapeHtml(result.structure.h1Title) : "<em>Missing</em>"}
            </div>
            <div class="page-list-llms-structure-item">
              <strong>Blockquote:</strong> ${result.structure.blockquote ? escapeHtml(result.structure.blockquote.substring(0, 100)) + (result.structure.blockquote.length > 100 ? "..." : "") : "<em>Missing</em>"}
            </div>
            <div class="page-list-llms-structure-item">
              <strong>Free Text:</strong> ${result.structure.freeText.length > 0 ? `${result.structure.freeText.split("\n").length} lines` : "<em>Empty</em>"}
            </div>
            <div class="page-list-llms-structure-item">
              <strong>Sections:</strong> ${result.structure.sections.length}
              ${result.structure.sections.map((section) => `
                <div class="page-list-llms-structure-section">
                  <strong>${escapeHtml(section.title)}</strong> ${section.isOptional ? "(Optional)" : ""} - ${section.links.length} link${section.links.length !== 1 ? "s" : ""}
                  <ul class="page-list-llms-structure-section-links">
                    ${section.links.map((link) => `
                      <li class="page-list-llms-structure-link ${link.accessible ? "page-list-llms-structure-link--accessible" : "page-list-llms-structure-link--inaccessible"}">
                        <a href="${escapeHtml(link.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(link.name || link.url)}</a>
                        ${link.notes ? `<span class="page-list-llms-structure-link-notes">: ${escapeHtml(link.notes)}</span>` : ""}
                        ${link.accessible ? `<span class="page-list-llms-structure-link-status">\u2713</span>` : `<span class="page-list-llms-structure-link-status">\u2717</span>`}
                      </li>
                    `).join("")}
                  </ul>
                </div>
              `).join("")}
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
      ` : ""}
    </div>
  `;
  return html;
}
function renderMarkdownPreview(content) {
  let html = content;
  html = html.replace(/^# (.+)$/gm, "<h1>$1</h1>");
  html = html.replace(/^## (.+)$/gm, "<h2>$1</h2>");
  html = html.replace(/^### (.+)$/gm, "<h3>$1</h3>");
  html = html.replace(/^> (.+)$/gm, "<blockquote>$1</blockquote>");
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  html = html.replace(/^- (.+)$/gm, "<li>$1</li>");
  html = html.replace(/(<li>.*<\/li>\n?)+/g, "<ul>$&</ul>");
  const lines = html.split("\n");
  const processedLines = [];
  let currentParagraph = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (currentParagraph.length > 0) {
        processedLines.push(`<p>${currentParagraph.join(" ")}</p>`);
        currentParagraph = [];
      }
      processedLines.push("");
    } else if (trimmed.match(/^<[hul]/) || trimmed.match(/^<\/[hul]/) || trimmed.match(/^<blockquote>/) || trimmed.match(/^<\/blockquote>/)) {
      if (currentParagraph.length > 0) {
        processedLines.push(`<p>${currentParagraph.join(" ")}</p>`);
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
    processedLines.push(`<p>${currentParagraph.join(" ")}</p>`);
  }
  return processedLines.join("\n");
}
function attachLLMSHandlers() {
  const resultsDiv = document.getElementById("page-list-llms-results");
  if (!resultsDiv) return;
  const generateButton = document.getElementById("page-list-llms-generate-template");
  if (generateButton) {
    generateButton.addEventListener("click", () => {
      const siteName = document.querySelector("h1")?.textContent?.trim() || "Your Site Name";
      const template = generateLLMSTxtTemplate(siteName);
      const blob = new Blob([template], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "llms.txt";
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast("llms.txt template downloaded. Place it in your site root (e.g., /public/llms.txt)", "success", 5e3, "page-list");
    });
  }
  (async () => {
    try {
      const result = await validateLLMSTxt();
      resultsDiv.innerHTML = renderLLMSResults(result);
      const toggleButtons = document.querySelectorAll(".page-list-llms-preview__toggle-button");
      const renderedView = document.querySelector('[data-preview-view="rendered"]');
      const rawView = document.querySelector('[data-preview-view="raw"]');
      toggleButtons.forEach((button) => {
        button.addEventListener("click", () => {
          const view = button.getAttribute("data-view");
          toggleButtons.forEach((btn) => {
            btn.classList.toggle("page-list-llms-preview__toggle-button--active", btn === button);
          });
          if (view === "rendered") {
            renderedView?.classList.remove("page-list-llms-preview__raw--hidden");
            rawView?.classList.add("page-list-llms-preview__raw--hidden");
          } else {
            renderedView?.classList.add("page-list-llms-preview__raw--hidden");
            rawView?.classList.remove("page-list-llms-preview__raw--hidden");
          }
        });
      });
    } catch (error) {
      devError("LLMS.txt validation error:", error);
      resultsDiv.innerHTML = `
        <div class="page-list-llms-empty">
          <div class="page-list-llms-empty__icon">\u26A0\uFE0F</div>
          <h3 class="page-list-llms-empty__title">Validation Error</h3>
          <p class="page-list-llms-empty__text">Error during validation: ${error instanceof Error ? error.message : "Unknown error"}</p>
        </div>
      `;
    }
  })();
}
function renderDraftPages(pages) {
  if (pages.length === 0) {
    return `
      <div class="page-list-empty">
        <div class="page-list-empty__icon">\u{1F4DD}</div>
        <h3 class="page-list-empty__title">No draft pages found</h3>
        <p class="page-list-empty__text">
          No draft pages were found. Make sure you're running the dev server with <code>npm run dev</code> (which includes drafts).
        </p>
      </div>
    `;
  }
  const sortedPages = [...pages].sort((a, b) => {
    return a.title.localeCompare(b.title);
  });
  let html = `
    <div class="page-list-drafts">
      <div class="page-list-drafts__header">
        <div class="page-list-drafts__info">
          <h2 class="page-list-drafts__title">Draft Pages</h2>
          <p class="page-list-drafts__count">${pages.length} ${pages.length === 1 ? "draft" : "drafts"}</p>
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
  sortedPages.forEach((page) => {
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
          ${escapeHtml(page.section || "Home")}
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
function renderGroupedPages(pages, compact = false, sortType = "title", sortDirection = "asc", filterType = "all") {
  const groups = groupPagesBySection(pages, sortType, sortDirection);
  const sections = Array.from(groups.keys()).sort();
  let html = "";
  const homePage = pages.find((p) => p.section === "" || p.relPermalink === "/");
  if (homePage) {
    const tableHeaders = getTableHeaders(filterType, compact);
    html += `
      <div class="page-list-group" data-group-id="home">
        <button class="page-list-group-header" data-group-toggle="home">
          <h2 class="page-list-group-title">Home</h2>
          <span class="page-list-group-toggle-icon">\u25BC</span>
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
  sections.forEach((section) => {
    if (section === "" || section === "root") return;
    const sectionPages = groups.get(section) || [];
    if (sectionPages.length === 0) return;
    const sectionTitle = section.charAt(0).toUpperCase() + section.slice(1).replace(/-/g, " ");
    const tableHeaders = getTableHeaders(filterType, compact);
    html += `
      <div class="page-list-group" data-group-id="${escapeHtml(section)}">
        <button class="page-list-group-header" data-group-toggle="${escapeHtml(section)}">
          <h2 class="page-list-group-title">${escapeHtml(sectionTitle)}</h2>
          <span class="page-list-group-toggle-icon">\u25BC</span>
        </button>
        <div class="page-list-group-content" data-group-content="${escapeHtml(section)}">
          <table class="page-list-table">
            <thead>
              ${tableHeaders}
            </thead>
            <tbody>
              ${sectionPages.map((p) => renderPageRow(p, compact, filterType)).join("")}
            </tbody>
          </table>
        </div>
      </div>
    `;
  });
  return html;
}
function truncate(text, maxLength) {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
}
function formatIssueCount(count) {
  return count === 0 ? "\u2713" : count.toString();
}
function createTooltip(text) {
  return `
    <span class="page-list-tooltip-trigger">
      <span class="page-list-tooltip-icon material-symbols-outlined">info</span>
      <span class="page-list-tooltip">
        <span class="page-list-tooltip-content">${escapeHtml(text)}</span>
      </span>
    </span>
  `;
}
function filterPages(pages, filterType) {
  switch (filterType) {
    case "all":
      return pages;
    case "with-issues":
      return pages.filter((page) => {
        return !page.hasMetaTitle || !page.hasMetaDescription || page.titleOverLimit || page.descriptionOverLimit || page.titleOverPixels || page.descriptionOverPixels;
      });
    case "missing-title":
      return pages.filter((page) => !page.hasMetaTitle);
    case "missing-description":
      return pages.filter((page) => !page.hasMetaDescription);
    case "missing-meta":
      return pages.filter((page) => !page.hasMetaTitle || !page.hasMetaDescription);
    case "title-over-limit":
      return pages.filter((page) => page.titleOverLimit || page.titleOverPixels);
    case "description-over-limit":
      return pages.filter((page) => page.descriptionOverLimit || page.descriptionOverPixels);
    case "pixel-issues":
      return pages.filter((page) => page.titleOverPixels || page.descriptionOverPixels);
    case "meta-issues":
      return pages.filter((page) => page.titleOverLimit || page.titleOverPixels || page.descriptionOverLimit || page.descriptionOverPixels);
    case "good":
      return pages.filter((page) => {
        return page.hasMetaTitle && page.hasMetaDescription && !page.titleOverLimit && !page.descriptionOverLimit && !page.titleOverPixels && !page.descriptionOverPixels && !page.hasBrokenLinks && !page.hasBrokenImages && !page.hasImagesWithoutAlt && page.headingStructureGood && page.hasOneH1 && page.hasH2s && page.internalLinksGood && !page.hasGenericAnchors && !page.hasGenericAltText && page.hasSchemaMarkup && page.firstParaGood && !page.wordCountPoor && !page.isStale && page.hasCitations && page.hasAuthor && (!page.hasVideos || page.hasTranscript) && page.readabilityGood && page.hasAnalytics && !page.hasContrastRatioIssues && !page.hasMissingAriaLabels && !page.hasKeyboardNavigationIssues && page.hasFocusIndicators !== false;
      });
    case "broken-links":
      return pages.filter((page) => page.hasBrokenLinks);
    case "broken-images":
      return pages.filter((page) => page.hasBrokenImages);
    case "images-no-alt":
      return pages.filter((page) => page.hasImagesWithoutAlt);
    case "heading-structure":
      return pages.filter((page) => !page.headingStructureGood);
    case "multiple-h1":
      return pages.filter((page) => page.hasMultipleH1);
    case "no-h1":
      return pages.filter((page) => page.h1Count === 0);
    case "no-h2":
      return pages.filter((page) => !page.hasH2s);
    case "internal-links":
      return pages.filter((page) => page.internalLinksTooFew || page.internalLinksTooMany);
    case "generic-anchors":
      return pages.filter((page) => page.hasGenericAnchors);
    case "no-schema":
      return pages.filter((page) => !page.hasSchemaMarkup);
    case "low-word-count":
      return pages.filter((page) => page.wordCountPoor);
    case "stale-content":
      return pages.filter((page) => page.isStale);
    case "no-citations":
      return pages.filter((page) => !page.hasCitations);
    case "no-author":
      return pages.filter((page) => !page.hasAuthor);
    case "videos-no-transcript":
      return pages.filter((page) => page.hasVideos && !page.hasTranscript);
    case "no-analytics":
      return pages.filter((page) => !page.hasAnalytics);
    case "images-not-nextgen":
      return pages.filter((page) => page.hasImagesNotNextGen);
    case "images-no-lazy":
      return pages.filter((page) => page.hasImagesWithoutLazyLoading);
    case "no-lang":
      return pages.filter((page) => !page.hasLangAttribute);
    case "no-canonical":
      return pages.filter((page) => !page.hasCanonical);
    case "mixed-content":
      return pages.filter((page) => page.hasMixedContent);
    case "url-length":
      return pages.filter((page) => page.urlLengthOver);
    case "outbound-links":
      return pages.filter((page) => page.outboundLinksTooFew);
    case "paragraph-length":
      return pages.filter((page) => !page.paragraphLengthGood);
    case "subheading-distribution":
      return pages.filter((page) => !page.subheadingDistributionGood);
    case "media-usage":
      return pages.filter((page) => page.mediaUsageTooFew);
    case "no-date-info":
      return pages.filter((page) => !page.hasDateInfo);
    case "no-mobile-viewport":
      return pages.filter((page) => !page.hasMobileViewport);
    case "social-meta":
      return pages.filter((page) => !page.socialMetaGood);
    case "no-excerpt":
      return pages.filter((page) => !page.hasSummary);
    case "excerpt-too-short":
      return pages.filter((page) => page.summaryTooShort);
    case "excerpt-too-long":
      return pages.filter((page) => page.summaryTooLong);
    case "contrast-ratio":
      return pages.filter((page) => page.hasContrastRatioIssues === true);
    case "missing-aria":
      return pages.filter((page) => page.hasMissingAriaLabels === true);
    case "keyboard-nav":
      return pages.filter((page) => page.hasKeyboardNavigationIssues === true);
    case "no-focus-indicators":
      return pages.filter((page) => page.hasFocusIndicators === false);
    case "drafts":
      return pages.filter((page) => page.isDraft === true);
    default:
      return pages;
  }
}
function levenshteinDistance(str1, str2) {
  const matrix = [];
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
var TYPO_FIXES = {
  "recieve": "receive",
  "optmize": "optimize",
  "seperate": "separate",
  "occured": "occurred",
  "accomodate": "accommodate",
  "definately": "definitely",
  "maintainance": "maintenance",
  "seige": "siege",
  "neccessary": "necessary",
  "existance": "existence"
};
function findCloseMatches(brokenUrl, allPagePaths, allPages, maxResults = 3) {
  const suggestions = [];
  const brokenPath = brokenUrl.split("#")[0];
  const brokenLower = brokenPath.toLowerCase();
  const brokenNoSlash = brokenPath.replace(/\/$/, "");
  const pathToPage = /* @__PURE__ */ new Map();
  if (allPages) {
    allPages.forEach((page) => {
      pathToPage.set(page.relPermalink, page);
    });
  }
  const scoredPaths = [];
  for (const path of allPagePaths) {
    const pathLower = path.toLowerCase();
    const pathNoSlash = path.replace(/\/$/, "");
    let score = 0;
    let reason = "";
    if (pathLower.includes(brokenLower) || brokenLower.includes(pathLower)) {
      const matchLength = Math.min(pathLower.length, brokenLower.length);
      score = 50 + matchLength / Math.max(pathLower.length, brokenLower.length) * 30;
      reason = "Similar path structure";
    }
    const brokenSegments = brokenNoSlash.split("/").filter((s) => s);
    const pathSegments = pathNoSlash.split("/").filter((s) => s);
    const commonSegments = brokenSegments.filter((s) => pathSegments.includes(s));
    if (commonSegments.length > 0) {
      const segmentScore = commonSegments.length / Math.max(brokenSegments.length, pathSegments.length) * 40;
      score = Math.max(score, segmentScore);
      if (!reason) reason = `${commonSegments.length} common segment${commonSegments.length !== 1 ? "s" : ""}`;
    }
    const distance = levenshteinDistance(brokenPath, path);
    const maxLen = Math.max(brokenPath.length, path.length);
    const similarity = maxLen > 0 ? (1 - distance / maxLen) * 100 : 0;
    const finalScore = score + similarity;
    if (finalScore > 20) {
      scoredPaths.push({
        path,
        score: finalScore,
        reason: reason || `Similarity: ${Math.round(similarity)}%`
      });
    }
  }
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
function findUrlMatch(brokenUrl, allPagePaths, allPages) {
  const brokenPath = brokenUrl.split("#")[0];
  const brokenLower = brokenPath.toLowerCase();
  const brokenNoSlash = brokenPath.replace(/\/$/, "");
  const brokenNoHtml = brokenPath.replace(/\.html$/, "");
  for (const path of allPagePaths) {
    if (path.toLowerCase() === brokenLower) {
      return { match: path, reason: "Exact match (case-insensitive)" };
    }
  }
  const sections = /* @__PURE__ */ new Set();
  if (allPages) {
    allPages.forEach((page) => {
      if (page.section) {
        sections.add(page.section);
      }
    });
  }
  const commonSections = ["blog", "our-services", "service-areas", "about-us", "brands-we-serve"];
  commonSections.forEach((s) => sections.add(s));
  for (const section of sections) {
    const pathWithSection = `/${section}${brokenPath}`;
    const pathWithSectionNoSlash = `/${section}${brokenNoSlash}`;
    for (const path of allPagePaths) {
      if (path === pathWithSection || path === pathWithSectionNoSlash) {
        return { match: path, reason: `Missing section prefix: added /${section}/` };
      }
    }
  }
  for (const path of allPagePaths) {
    const pathNoSlash = path.replace(/\/$/, "");
    if (pathNoSlash === brokenNoSlash || path === brokenNoSlash || pathNoSlash === brokenPath) {
      return { match: path, reason: "Exact match (trailing slash difference)" };
    }
  }
  for (const path of allPagePaths) {
    const pathNoHtml = path.replace(/\.html$/, "");
    if (pathNoHtml === brokenNoHtml || path === brokenNoHtml || pathNoHtml === brokenPath) {
      return { match: path, reason: "Exact match (.html extension difference)" };
    }
  }
  for (const path of allPagePaths) {
    const pathNormalized = path.replace(/[-_]/g, "");
    const brokenNormalized = brokenPath.replace(/[-_]/g, "");
    if (pathNormalized === brokenNormalized && pathNormalized.length > 0) {
      return { match: path, reason: "Hyphen/underscore difference" };
    }
  }
  for (const path of allPagePaths) {
    if (brokenPath.endsWith("/") && path === brokenPath.slice(0, -1)) {
      return { match: path, reason: "Hugo pattern: trailing slash" };
    }
    if (brokenPath.includes("-us") && path === brokenPath.replace("-us", "")) {
      return { match: path, reason: "Hugo pattern: -us suffix" };
    }
    if (brokenPath.startsWith("/tags/") && path === brokenPath.replace("/tags/", "/tag/")) {
      return { match: path, reason: "Hugo pattern: tags \u2192 tag" };
    }
  }
  const brokenLen = brokenPath.length;
  let bestMatch = null;
  for (const path of allPagePaths) {
    const distance = levenshteinDistance(brokenPath, path);
    const maxDistance = Math.min(2, Math.floor(brokenLen / 10));
    if (distance <= maxDistance && distance > 0) {
      if (!bestMatch || distance < bestMatch.distance) {
        bestMatch = { path, distance };
      }
    }
  }
  if (bestMatch) {
    return { match: bestMatch.path, reason: `Levenshtein distance ${bestMatch.distance}` };
  }
  for (const [typo, correct] of Object.entries(TYPO_FIXES)) {
    if (brokenPath.toLowerCase().includes(typo)) {
      const corrected = brokenPath.toLowerCase().replace(typo, correct);
      for (const path of allPagePaths) {
        if (path.toLowerCase() === corrected || path.toLowerCase().includes(corrected)) {
          return { match: path, reason: `Typo fix: ${typo} \u2192 ${correct}` };
        }
      }
    }
  }
  return null;
}
async function fixBrokenLinksInFile(filePath, brokenLinks) {
  try {
    devLog(`\u{1F4C4} Reading file: ${filePath}`);
    const fileData = await readFileContent(filePath, true);
    if (!fileData) {
      devError(`\u274C Could not read file: ${filePath}`);
      return { success: false, error: "Could not read file", changes: [] };
    }
    devLog(`\u2705 File read successfully (${fileData.content.length} characters)`);
    const originalContent = fileData.content;
    let content = originalContent;
    let modified = false;
    const changes = [];
    for (const { url, fixedUrl, action } of brokenLinks) {
      devLog(`   Processing: ${url} \u2192 ${action === "remove" ? "(remove)" : fixedUrl}`);
      if (action === "remove") {
        const removalResult = removeLinkFromContent(content, url);
        if (removalResult.changes.length > 0) {
          content = removalResult.content;
          changes.push(...removalResult.changes);
          modified = true;
          devLog(`   \u2705 Removed ${removalResult.changes.length} occurrence(s) of link`);
        } else {
          devLog(`   \u26A0\uFE0F  Link not found in content (may have already been removed or format differs)`);
        }
      } else if (fixedUrl) {
        const urlNoFragment = url.split("#")[0];
        const urlNoSlash = urlNoFragment.replace(/\/$/, "");
        const urlWithSlash = urlNoSlash + "/";
        const urlVariations = [
          url,
          // Original
          urlNoFragment,
          // Without fragment
          urlNoSlash,
          // Without trailing slash
          urlWithSlash
          // With trailing slash
        ];
        let foundAny = false;
        const escapedUrl = escapeRegex(url);
        const escapedUrlNoFragment = escapeRegex(urlNoFragment);
        const escapedUrlNoSlash = escapeRegex(urlNoSlash);
        const escapedUrlWithSlash = escapeRegex(urlWithSlash);
        const markdownPatterns = [
          new RegExp(`(\\[[^\\]]+\\]\\()${escapedUrl}([^)]*\\))`, "g"),
          new RegExp(`(\\[[^\\]]+\\]\\()${escapedUrlNoFragment}([^)]*\\))`, "g"),
          new RegExp(`(\\[[^\\]]+\\]\\()${escapedUrlNoSlash}([^)]*\\))`, "g"),
          new RegExp(`(\\[[^\\]]+\\]\\()${escapedUrlWithSlash}([^)]*\\))`, "g")
        ];
        const markdownMatches = [];
        for (const pattern of markdownPatterns) {
          let match;
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
        for (let i = markdownMatches.length - 1; i >= 0; i--) {
          const m = markdownMatches[i];
          const beforeMatch = content.substring(0, m.index);
          const lineNumber = beforeMatch.split("\n").length;
          content = beforeMatch + m.replacement + content.substring(m.index + m.match.length);
          changes.push({ oldUrl: url, newUrl: fixedUrl, lineNumber });
          modified = true;
        }
        const htmlPatterns = [
          new RegExp(`(href=["'])${escapedUrl}(["'])`, "gi"),
          new RegExp(`(href=["'])${escapedUrlNoFragment}(["'])`, "gi"),
          new RegExp(`(href=["'])${escapedUrlNoSlash}(["'])`, "gi"),
          new RegExp(`(href=["'])${escapedUrlWithSlash}(["'])`, "gi")
        ];
        const htmlMatches = [];
        for (const pattern of htmlPatterns) {
          let htmlMatch;
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
        for (let i = htmlMatches.length - 1; i >= 0; i--) {
          const m = htmlMatches[i];
          const beforeMatch = content.substring(0, m.index);
          const lineNumber = beforeMatch.split("\n").length;
          content = beforeMatch + m.replacement + content.substring(m.index + m.match.length);
          changes.push({ oldUrl: url, newUrl: fixedUrl, lineNumber });
          modified = true;
        }
        if (!foundAny) {
          devLog(`   \u26A0\uFE0F  Link not found in content (may have already been fixed or format differs)`);
        } else {
          devLog(`   \u2705 Found and fixed link`);
        }
      }
    }
    if (!modified) {
      devWarn(`\u26A0\uFE0F  No matches found in file for any of the ${brokenLinks.length} link(s)`);
      return { success: false, error: "No matches found in file", changes: [] };
    }
    devLog(`\u{1F4DD} File modified: ${changes.length} change(s) made`);
    const backupPath = createBackupFilename(filePath);
    devLog(`\u{1F4BE} Creating backup: ${backupPath}`);
    const backupCreated = await writeFileContent(backupPath, originalContent);
    if (!backupCreated) {
      devWarn(`\u26A0\uFE0F  Could not create backup: ${backupPath}`);
    } else {
      devLog(`\u2705 Backup created: ${backupPath}`);
    }
    devLog(`\u{1F4BE} Writing modified content to: ${filePath}`);
    const writeSuccess = await writeFileContent(filePath, content);
    if (!writeSuccess) {
      devError(`\u274C Could not write file: ${filePath}`);
      return { success: false, error: "Could not write file", changes };
    }
    devLog(`\u2705 Successfully fixed ${changes.length} link(s) in ${filePath}`);
    return { success: true, backupPath: backupCreated ? backupPath : void 0, changes };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error", changes: [] };
  }
}
function collectBrokenLinks(pages) {
  const brokenLinks = [];
  for (const page of pages) {
    if (page.hasBrokenLinks && page.brokenLinkUrls && Array.isArray(page.brokenLinkUrls)) {
      for (const brokenUrl of page.brokenLinkUrls) {
        if (brokenUrl.startsWith("/") && !brokenUrl.startsWith("//") && !brokenUrl.startsWith("http")) {
          brokenLinks.push({
            brokenUrl,
            sourcePage: page.relPermalink
          });
        }
      }
    }
  }
  return brokenLinks;
}
async function fixObviousBrokenLinks(pages) {
  const result = {
    attempted: 0,
    fixed: 0,
    skipped: 0,
    fixes: [],
    skippedLinks: [],
    modifiedFiles: [],
    backups: []
  };
  if (!isLocalhost()) {
    devError("Fix broken links feature is only available in development mode");
    return result;
  }
  devLog("\u{1F50D} Starting broken link fix process...");
  const hasDirectoryAccess = getSiteRootDirectoryHandle() !== null;
  if (!hasDirectoryAccess) {
    devError("\u274C File System Access API not available. Cannot fix links without directory access.");
    devError("\u{1F4A1} Please grant directory access when prompted to enable file operations.");
    return result;
  }
  const brokenLinks = collectBrokenLinks(pages);
  devLog(`Found ${brokenLinks.length} broken internal links`);
  if (brokenLinks.length === 0) {
    devLog("No broken links to fix.");
    return result;
  }
  const allPagePaths = pages.map((p) => p.relPermalink);
  devLog(`Checking against ${allPagePaths.length} valid page paths`);
  const linksByFile = /* @__PURE__ */ new Map();
  for (const brokenLink of brokenLinks) {
    result.attempted++;
    devLog(`
\u{1F517} Processing broken link: ${brokenLink.brokenUrl} (from ${brokenLink.sourcePage})`);
    const match = findUrlMatch(brokenLink.brokenUrl, allPagePaths, pages);
    if (!match) {
      devLog(`\u23ED\uFE0F  Skipped: ${brokenLink.brokenUrl} (no obvious match found)`);
      result.skipped++;
      const suggestions = findCloseMatches(brokenLink.brokenUrl, allPagePaths, pages, 3);
      if (suggestions.length > 0) {
        devLog(`   \u{1F4A1} Found ${suggestions.length} suggestion(s): ${suggestions.map((s) => s.url).join(", ")}`);
      }
      const possiblePaths2 = relPermalinkToContentFile(brokenLink.sourcePage);
      devLog(`   Trying to find source file for skipped link...`);
      const sourceFile2 = await findActualFilePath(possiblePaths2, true);
      if (sourceFile2) {
        result.skippedLinks.push({
          brokenUrl: brokenLink.brokenUrl,
          sourceFile: sourceFile2,
          sourcePage: brokenLink.sourcePage,
          suggestions: suggestions.length > 0 ? suggestions : void 0
        });
        devLog(`   \u2705 Source file found: ${sourceFile2}`);
      } else {
        devLog(`   \u26A0\uFE0F  Could not find source file. Tried: ${possiblePaths2.join(", ")}`);
        result.skippedLinks.push({
          brokenUrl: brokenLink.brokenUrl,
          sourceFile: possiblePaths2[0] || "unknown",
          sourcePage: brokenLink.sourcePage,
          suggestions: suggestions.length > 0 ? suggestions : void 0
        });
      }
      continue;
    }
    devLog(`   \u2705 Found match: ${brokenLink.brokenUrl} \u2192 ${match.match} (${match.reason})`);
    const possiblePaths = relPermalinkToContentFile(brokenLink.sourcePage);
    devLog(`   Looking for source file: ${brokenLink.sourcePage}`);
    const sourceFile = await findActualFilePath(possiblePaths, true);
    if (!sourceFile) {
      devError(`\u23ED\uFE0F  Skipped: ${brokenLink.brokenUrl} (could not find source file)`);
      devError(`   Tried paths: ${possiblePaths.join(", ")}`);
      devError(`   Make sure File System Access API has access to the site root directory.`);
      result.skipped++;
      continue;
    }
    devLog(`   \u2705 Source file found: ${sourceFile}`);
    if (!linksByFile.has(sourceFile)) {
      linksByFile.set(sourceFile, []);
    }
    linksByFile.get(sourceFile).push({
      url: brokenLink.brokenUrl,
      fixedUrl: match.match,
      reason: match.reason,
      action: "fix"
    });
    result.fixes.push({
      brokenUrl: brokenLink.brokenUrl,
      fixedUrl: match.match,
      sourceFile,
      lineNumber: 0,
      // Will be determined when reading file
      matchReason: match.reason,
      action: "fix"
    });
  }
  for (const [filePath, fixes] of linksByFile.entries()) {
    devLog(`\u{1F4DD} Fixing ${fixes.length} link(s) in ${filePath}...`);
    const fixResult = await fixBrokenLinksInFile(filePath, fixes.map((f) => ({
      url: f.url,
      fixedUrl: f.fixedUrl,
      action: f.action || "fix"
    })));
    if (fixResult.success) {
      result.modifiedFiles.push(filePath);
      if (fixResult.backupPath) {
        result.backups.push(fixResult.backupPath);
      }
      for (const change of fixResult.changes) {
        const existingFix = result.fixes.find((f) => f.brokenUrl === change.oldUrl && f.sourceFile === filePath);
        if (existingFix) {
          existingFix.lineNumber = change.lineNumber;
        }
      }
      result.fixed += fixResult.changes.length;
      devLog(`\u2705 Fixed ${fixResult.changes.length} link(s) in ${filePath}`);
    } else {
      devError(`\u274C Failed to fix links in ${filePath}:`, fixResult.error);
      result.skipped += fixes.length;
    }
  }
  devLog(`\u2728 Fix process complete: ${result.fixed} fixed, ${result.skipped} skipped`);
  return result;
}
function closeLoadingModal() {
  const loadingModal = document.getElementById("page-list-fix-loading-modal");
  if (loadingModal) {
    loadingModal.style.display = "none";
    loadingModal.remove();
  }
}
function showLoadingModal(message, progress) {
  closeLoadingModal();
  const loadingModalHtml = renderLoadingModal(message, progress);
  document.body.insertAdjacentHTML("beforeend", loadingModalHtml);
}
function renderLoadingModal(message, progress) {
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
            ${progress !== void 0 ? `
              <div class="page-list-fix-loading__progress">
                <div class="page-list-fix-loading__progress-bar" style="width: ${progress}%"></div>
              </div>
              <div class="page-list-fix-loading__progress-text">${progress}% complete</div>
            ` : ""}
            <p class="page-list-fix-loading__subtitle">Please wait while we process your request...</p>
          </div>
        </div>
      </div>
    </div>
  `;
}
function renderFixResultsModal(result) {
  const fixesHtml = result.fixes.length > 0 ? result.fixes.map((fix, index) => `
      <div class="page-list-fix-result-item" role="listitem">
        <div class="page-list-fix-result-item__header">
          <div class="page-list-fix-result-item__file">
            <span class="page-list-fix-result-item__file-icon material-symbols-outlined" aria-hidden="true">description</span>
            <code class="page-list-fix-result-item__file-path">${escapeHtml(fix.sourceFile)}</code>
            ${fix.lineNumber > 0 ? `<span class="page-list-fix-result-item__line" aria-label="Line number">L${fix.lineNumber}</span>` : ""}
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
            <code class="page-list-fix-result-item__change-url">${escapeHtml(fix.fixedUrl || "(removed)")}</code>
          </div>
        </div>
        <div class="page-list-fix-result-item__reason">
          <span class="page-list-fix-result-item__reason-icon material-symbols-outlined" aria-hidden="true">lightbulb</span>
          <span class="page-list-fix-result-item__reason-text">${escapeHtml(fix.matchReason)}</span>
        </div>
      </div>
    `).join("") : '<div class="page-list-fix-result-empty" role="status"><span class="material-symbols-outlined" aria-hidden="true">info</span><p>No fixes were applied.</p></div>';
  const modifiedFilesHtml = result.modifiedFiles.length > 0 ? `<ul class="page-list-fix-result-files" role="list">
        ${result.modifiedFiles.map((file, index) => `
          <li class="page-list-fix-result-files__item" role="listitem">
            <span class="material-symbols-outlined" aria-hidden="true">edit</span>
            <code>${escapeHtml(file)}</code>
          </li>
        `).join("")}
      </ul>` : '<div class="page-list-fix-result-empty" role="status"><span class="material-symbols-outlined" aria-hidden="true">info</span><p>No files were modified.</p></div>';
  const backupsHtml = result.backups.length > 0 ? `<ul class="page-list-fix-result-files" role="list">
        ${result.backups.map((backup, index) => `
          <li class="page-list-fix-result-files__item" role="listitem">
            <span class="material-symbols-outlined" aria-hidden="true">backup</span>
            <code>${escapeHtml(backup)}</code>
          </li>
        `).join("")}
      </ul>` : "";
  const successRate = result.attempted > 0 ? Math.round(result.fixed / result.attempted * 100) : 0;
  const skippedLinksHtml = result.skippedLinks.length > 0 ? result.skippedLinks.map((skipped, index) => {
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
                  ${suggestion.title ? `<span class="page-list-fix-result-item__suggestion-title">${escapeHtml(suggestion.title)}</span>` : ""}
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
            `).join("")}
          </div>
        </div>
        ` : ""}
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
  }).join("") : "";
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
            <span class="material-symbols-outlined" aria-hidden="true">${result.fixed > 0 ? "check_circle" : "info"}</span>
          </div>
          <h2 class="page-list-modal__title" id="page-list-fix-results-title">Broken Link Fix Results</h2>
          <p class="page-list-modal__subtitle">${result.fixed > 0 ? `${result.fixed} link${result.fixed !== 1 ? "s" : ""} fixed successfully` : "No fixes were applied"}</p>
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
              ${successRate > 0 ? `<div class="page-list-fix-result-summary__rate">${successRate}%</div>` : ""}
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
          ` : ""}

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
          ` : ""}

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
          ` : ""}

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
            ` : ""}
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
function attachTooltipHandlers(container) {
  if (!container) return;
  const tooltipTriggers = container.querySelectorAll(".page-list-tooltip-trigger");
  tooltipTriggers.forEach((trigger) => {
    const tooltip = trigger.querySelector(".page-list-tooltip");
    if (!tooltip) return;
    trigger.addEventListener("mouseenter", (e) => {
      const mouseEvent = e;
      tooltip.style.display = "block";
      updateTooltipPosition(tooltip, mouseEvent);
    });
    trigger.addEventListener("mousemove", (e) => {
      const mouseEvent = e;
      updateTooltipPosition(tooltip, mouseEvent);
    });
    trigger.addEventListener("mouseleave", () => {
      tooltip.style.display = "none";
    });
  });
}
function updateTooltipPosition(tooltip, e) {
  const offset = 10;
  const tooltipRect = tooltip.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  let left = e.clientX;
  let top = e.clientY - tooltipRect.height - offset;
  if (left + tooltipRect.width > viewportWidth) {
    left = viewportWidth - tooltipRect.width - offset;
  }
  if (left < 0) {
    left = offset;
  }
  if (top < 0) {
    top = e.clientY + offset;
  }
  tooltip.style.left = `${left}px`;
  tooltip.style.top = `${top}px`;
}
function attachFixButtonHandler(pages) {
  const fixButton = document.getElementById("page-list-fix-broken-links");
  if (!fixButton) return;
  fixButton.addEventListener("click", async () => {
    if (!isLocalhost()) {
      showToast("This feature is only available in development mode.", "error", 5e3, "page-list");
      return;
    }
    if ("showDirectoryPicker" in window && !getSiteRootDirectoryHandle()) {
      const accessGranted = await createConfirmationDialog(
        "Directory Access Required",
        'To fix broken links, we need access to your site files.\n\nPlease select the ROOT directory of your Hugo site (the folder containing the "content" folder).\n\nThis permission is only requested once per browser session.',
        "Select Site Root",
        "Cancel",
        "page-list"
      );
      if (accessGranted) {
        const dirHandle = await requestSiteRootAccess(
          (msg) => showToast(msg, "success", 5e3, "page-list"),
          (msg) => showToast(msg, "error", 5e3, "page-list")
        );
        if (!dirHandle) {
          showToast("Directory access is required to fix broken links. Please grant access to continue.", "error", 6e3, "page-list");
          return;
        }
      } else {
        showToast("Directory access is required to fix broken links.", "info", 5e3, "page-list");
        return;
      }
    } else if (!("showDirectoryPicker" in window)) {
      showToast("File System Access API is not supported in this browser. Cannot fix broken links.", "error", 6e3, "page-list");
      return;
    } else if (!getSiteRootDirectoryHandle()) {
      showToast("Directory access is required. Please grant access when prompted.", "error", 6e3, "page-list");
      return;
    }
    const brokenLinks = collectBrokenLinks(pages);
    if (brokenLinks.length === 0) {
      showToast("No broken links found to fix.", "info", 5e3, "page-list");
      return;
    }
    const confirmed = await createConfirmationDialog(
      "Fix Broken Links",
      `This will attempt to fix ${brokenLinks.length} broken internal link${brokenLinks.length !== 1 ? "s" : ""}.

\u2022 Only internal links will be modified
\u2022 Backups will be created for all modified files
\u2022 Only obvious matches will be fixed
\u2022 Links without clear matches will be skipped

Do you want to continue?`,
      "Fix Links",
      "Cancel",
      "page-list"
    );
    if (!confirmed) {
      return;
    }
    fixButton.setAttribute("disabled", "true");
    fixButton.setAttribute("aria-busy", "true");
    fixButton.classList.add("page-list-fix-button--loading");
    const originalContent = fixButton.innerHTML;
    fixButton.innerHTML = `
      <span class="page-list-fix-button__icon material-symbols-outlined page-list-fix-button__icon--spinning" aria-hidden="true">hourglass_empty</span>
      <span class="page-list-fix-button__text">Processing...</span>
    `;
    showLoadingModal("Analyzing broken links...", 0);
    const updateProgress = (progress, message) => {
      const modal = document.getElementById("page-list-fix-loading-modal");
      if (modal) {
        const title = modal.querySelector(".page-list-fix-loading__title");
        const progressBar = modal.querySelector(".page-list-fix-loading__progress-bar");
        const progressText = modal.querySelector(".page-list-fix-loading__progress-text");
        if (title) title.textContent = message;
        if (progressBar) progressBar.style.width = `${progress}%`;
        if (progressText) progressText.textContent = `${progress}% complete`;
      }
    };
    try {
      updateProgress(10, "Collecting broken links...");
      await new Promise((resolve) => setTimeout(resolve, 300));
      updateProgress(30, "Finding potential matches...");
      await new Promise((resolve) => setTimeout(resolve, 300));
      updateProgress(60, "Applying fixes...");
      await new Promise((resolve) => setTimeout(resolve, 300));
      const result = await fixObviousBrokenLinks(pages);
      updateProgress(100, "Complete!");
      await new Promise((resolve) => setTimeout(resolve, 300));
      closeLoadingModal();
      if (result.fixed > 0) {
        showToast(`Successfully fixed ${result.fixed} broken link${result.fixed !== 1 ? "s" : ""}!`, "success", 4e3, "page-list");
      } else {
        showToast("No links could be automatically fixed.", "info", 4e3, "page-list");
      }
      const modalHtml = renderFixResultsModal(result);
      document.body.insertAdjacentHTML("beforeend", modalHtml);
      const modal = document.getElementById("page-list-fix-results-modal");
      const closeBtn = document.getElementById("page-list-fix-results-close");
      const closeBtn2 = document.getElementById("page-list-fix-close");
      const undoBtn = document.getElementById("page-list-fix-undo");
      const overlay = modal?.querySelector(".page-list-modal__overlay");
      if (modal) {
        const firstFocusable = modal.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (firstFocusable) {
          firstFocusable.focus();
        }
      }
      const closeModal2 = () => {
        if (modal) {
          modal.classList.add("page-list-modal--closing");
          setTimeout(() => {
            modal.remove();
            fixButton.focus();
          }, 300);
        }
      };
      if (closeBtn) closeBtn.addEventListener("click", closeModal2);
      if (closeBtn2) closeBtn2.addEventListener("click", closeModal2);
      if (overlay) overlay.addEventListener("click", closeModal2);
      if (undoBtn) {
        undoBtn.addEventListener("click", async () => {
          const undoConfirmed = await createConfirmationDialog(
            "Undo All Fixes",
            `This will restore ${result.modifiedFiles.length} file${result.modifiedFiles.length !== 1 ? "s" : ""} from backups.

All fixes will be reverted. Continue?`,
            "Undo",
            "Cancel",
            "page-list"
          );
          if (undoConfirmed) {
            devLog("Undo functionality would restore from:", result.backups);
            showToast("Undo functionality requires backend API implementation.", "info", 5e3, "page-list");
            closeModal2();
          }
        });
      }
      const fixLinkInFile = async (brokenUrl, fixedUrl, filePath, button, originalText) => {
        try {
          const fileData = await readFileContent(filePath, true);
          if (!fileData) {
            showToast(`Could not read file: ${filePath}`, "error", 5e3, "page-list");
            return false;
          }
          const escapedUrl = escapeRegex(brokenUrl);
          let modifiedContent = fileData.content;
          let modified = false;
          const markdownPattern = new RegExp(`(\\[[^\\]]+\\]\\()${escapedUrl}([^)]*\\))`, "g");
          modifiedContent = modifiedContent.replace(markdownPattern, (match, prefix, suffix) => {
            modified = true;
            return `${prefix}${fixedUrl}${suffix}`;
          });
          const htmlPattern = new RegExp(`(href=["'])${escapedUrl}(["'])`, "gi");
          modifiedContent = modifiedContent.replace(htmlPattern, (match, prefix, suffix) => {
            modified = true;
            return `${prefix}${fixedUrl}${suffix}`;
          });
          if (!modified) {
            showToast("Link not found in file content.", "info", 5e3, "page-list");
            return false;
          }
          const backupPath = createBackupFilename(filePath);
          const backupCreated = await writeFileContent(backupPath, fileData.content);
          if (!backupCreated) {
            devWarn(`Could not create backup: ${backupPath}`);
          }
          const writeSuccess = await writeFileContent(filePath, modifiedContent);
          if (!writeSuccess) {
            showToast(`Could not write file: ${filePath}`, "error", 5e3, "page-list");
            return false;
          }
          showToast(`Link fixed: ${brokenUrl} \u2192 ${fixedUrl}`, "success", 5e3, "page-list");
          const item = button.closest(".page-list-fix-result-item");
          if (item) {
            item.classList.remove("page-list-fix-result-item--skipped");
            item.classList.add("page-list-fix-result-item--fixed");
            const badge = item.querySelector(".page-list-fix-result-item__badge");
            if (badge) {
              badge.className = "page-list-fix-result-item__badge page-list-fix-result-item__badge--success";
              badge.innerHTML = '<span class="material-symbols-outlined" aria-hidden="true">check</span> Fixed';
            }
            const changeOld = item.querySelector(".page-list-fix-result-item__change-old .page-list-fix-result-item__change-url");
            const changeNew = item.querySelector(".page-list-fix-result-item__change-new");
            if (changeOld && changeNew) {
              const arrow = item.querySelector(".page-list-fix-result-item__arrow");
              if (!arrow) {
                const changeContainer = item.querySelector(".page-list-fix-result-item__change");
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
                const newUrlElement = changeNew.querySelector(".page-list-fix-result-item__change-url");
                if (newUrlElement) {
                  newUrlElement.textContent = fixedUrl;
                }
              }
            }
            const suggestions = item.querySelector(".page-list-fix-result-item__suggestions");
            if (suggestions) suggestions.remove();
            const actions = item.querySelector(".page-list-fix-result-item__actions");
            if (actions) actions.remove();
          }
          devLog(`\u2705 Fixed link "${brokenUrl}" \u2192 "${fixedUrl}" in ${filePath}`);
          return true;
        } catch (error) {
          devError("Error fixing link:", error);
          showToast(`Error fixing link: ${error instanceof Error ? error.message : "Unknown error"}`, "error", 5e3, "page-list");
          return false;
        }
      };
      const suggestionButtons = modal?.querySelectorAll(".page-list-fix-result-item__suggestion-btn");
      suggestionButtons?.forEach((btn) => {
        btn.addEventListener("click", async () => {
          const button = btn;
          const brokenUrl = button.getAttribute("data-edit-broken-url");
          const fixedUrl = button.getAttribute("data-edit-fixed-url");
          const filePath = button.getAttribute("data-edit-file");
          if (!brokenUrl || !fixedUrl || !filePath) return;
          const confirmed2 = await createConfirmationDialog(
            "Fix Broken Link",
            `This will fix the broken link "${brokenUrl}" to "${fixedUrl}" in "${filePath}".

A backup will be created before making changes. Continue?`,
            "Fix Link",
            "Cancel",
            "page-list"
          );
          if (!confirmed2) return;
          button.setAttribute("disabled", "true");
          button.classList.add("page-list-fix-button--loading");
          const originalText = button.innerHTML;
          button.innerHTML = '<span class="material-symbols-outlined" aria-hidden="true">hourglass_empty</span> Fixing...';
          const success = await fixLinkInFile(brokenUrl, fixedUrl, filePath, button, originalText);
          if (!success) {
            button.removeAttribute("disabled");
            button.classList.remove("page-list-fix-button--loading");
            button.innerHTML = originalText;
          }
        });
      });
      const editButtons = modal?.querySelectorAll(".page-list-fix-result-item__edit-btn");
      editButtons?.forEach((btn) => {
        btn.addEventListener("click", async () => {
          const button = btn;
          const brokenUrl = button.getAttribute("data-edit-broken-url");
          const filePath = button.getAttribute("data-edit-file");
          if (!brokenUrl || !filePath) return;
          const newUrl = await createUrlInputDialog("Enter new URL:", brokenUrl, "page-list");
          if (!newUrl || newUrl === brokenUrl) {
            return;
          }
          const confirmed2 = await createConfirmationDialog(
            "Fix Broken Link",
            `This will fix the broken link "${brokenUrl}" to "${newUrl}" in "${filePath}".

A backup will be created before making changes. Continue?`,
            "Fix Link",
            "Cancel",
            "page-list"
          );
          if (!confirmed2) return;
          button.setAttribute("disabled", "true");
          button.classList.add("page-list-fix-button--loading");
          const originalText = button.innerHTML;
          button.innerHTML = '<span class="material-symbols-outlined" aria-hidden="true">hourglass_empty</span> Fixing...';
          const success = await fixLinkInFile(brokenUrl, newUrl, filePath, button, originalText);
          if (!success) {
            button.removeAttribute("disabled");
            button.classList.remove("page-list-fix-button--loading");
            button.innerHTML = originalText;
          }
        });
      });
      const removeButtons = modal?.querySelectorAll(".page-list-fix-result-item__remove-btn");
      removeButtons?.forEach((btn) => {
        btn.addEventListener("click", async () => {
          const button = btn;
          const url = button.getAttribute("data-remove-url");
          const filePath = button.getAttribute("data-remove-file");
          if (!url || !filePath) return;
          const confirmed2 = await createConfirmationDialog(
            "Remove Broken Link",
            `This will remove the broken link "${url}" from "${filePath}" and keep only the text.

A backup will be created before making changes. Continue?`,
            "Remove Link",
            "Cancel",
            "page-list"
          );
          if (!confirmed2) return;
          button.setAttribute("disabled", "true");
          button.classList.add("page-list-fix-button--loading");
          const originalText = button.innerHTML;
          button.innerHTML = '<span class="material-symbols-outlined" aria-hidden="true">hourglass_empty</span> Removing...';
          try {
            const fileData = await readFileContent(filePath);
            if (!fileData) {
              showToast(`Could not read file: ${filePath}`, "error", 5e3, "page-list");
              button.removeAttribute("disabled");
              button.classList.remove("page-list-fix-button--loading");
              button.innerHTML = originalText;
              return;
            }
            const removalResult = removeLinkFromContent(fileData.content, url);
            if (removalResult.changes.length === 0) {
              showToast("Link not found in file content.", "info", 5e3, "page-list");
              button.removeAttribute("disabled");
              button.classList.remove("page-list-fix-button--loading");
              button.innerHTML = originalText;
              return;
            }
            const backupPath = createBackupFilename(filePath);
            const backupCreated = await writeFileContent(backupPath, fileData.content);
            if (!backupCreated) {
              devWarn(`Could not create backup: ${backupPath}`);
            }
            const writeSuccess = await writeFileContent(filePath, removalResult.content);
            if (!writeSuccess) {
              showToast(`Could not write file: ${filePath}`, "error", 5e3, "page-list");
              button.removeAttribute("disabled");
              button.classList.remove("page-list-fix-button--loading");
              button.innerHTML = originalText;
              return;
            }
            showToast(`Link removed successfully from ${filePath}`, "success", 5e3, "page-list");
            const item = button.closest(".page-list-fix-result-item");
            if (item) {
              item.classList.add("page-list-fix-result-item--removed");
              const badge = item.querySelector(".page-list-fix-result-item__badge");
              if (badge) {
                badge.className = "page-list-fix-result-item__badge page-list-fix-result-item__badge--success";
                badge.innerHTML = '<span class="material-symbols-outlined" aria-hidden="true">check</span> Removed';
              }
              button.remove();
            }
            devLog(`\u2705 Removed link "${url}" from ${filePath}`);
          } catch (error) {
            devError("Error removing link:", error);
            showToast(`Error removing link: ${error instanceof Error ? error.message : "Unknown error"}`, "error", 5e3, "page-list");
            button.removeAttribute("disabled");
            button.classList.remove("dev-score-bubble__broken-link-menu-action--loading");
            button.innerHTML = originalText;
          }
        });
      });
      const handleEscape = (e) => {
        if (e.key === "Escape" && modal && document.body.contains(modal)) {
          closeModal2();
          document.removeEventListener("keydown", handleEscape);
        }
      };
      document.addEventListener("keydown", handleEscape);
      const trapFocus = (e) => {
        if (e.key !== "Tab" || !modal) return;
        const focusableElements = modal.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      };
      modal?.addEventListener("keydown", trapFocus);
    } catch (error) {
      devError("Error fixing broken links:", error);
      closeLoadingModal();
      showToast(
        `Error fixing broken links: ${error instanceof Error ? error.message : "Unknown error"}`,
        "error",
        6e3,
        "page-list"
      );
    } finally {
      closeLoadingModal();
      fixButton.removeAttribute("disabled");
      fixButton.removeAttribute("aria-busy");
      fixButton.classList.remove("page-list-fix-button--loading");
      fixButton.innerHTML = originalContent;
    }
  });
}
function exportPagesToCSV(pages, filename) {
  if (pages.length === 0) {
    showToast("No pages to export", "info", 3e3, "page-list");
    return;
  }
  const headers = [
    "Page Title",
    "Page Title (Character Count)",
    "Meta Title",
    "Meta Title (Character Count)",
    "Meta Description",
    "Meta Description (Character Count)",
    "Link (URL)",
    "URL (Character Count)"
  ];
  const rows = [headers.join(",")];
  pages.forEach((page) => {
    const pageTitle = page.title || "";
    const metaTitle = page.metaTitle || "";
    const metaDescription = page.metaDescription || "";
    const url2 = page.relPermalink || "";
    const row = [
      `"${pageTitle.replace(/"/g, '""')}"`,
      // Escape quotes
      pageTitle.length.toString(),
      `"${metaTitle.replace(/"/g, '""')}"`,
      (page.metaTitleLength || metaTitle.length).toString(),
      `"${metaDescription.replace(/"/g, '""')}"`,
      (page.metaDescriptionLength || metaDescription.length).toString(),
      `"${url2.replace(/"/g, '""')}"`,
      url2.length.toString()
    ];
    rows.push(row.join(","));
  });
  const csvContent = rows.join("\n");
  const BOM = "\uFEFF";
  const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  showToast(`Exported ${pages.length} pages to ${filename}`, "success", 3e3, "page-list");
}
function exportPagesToExcel(pages, filename) {
  if (pages.length === 0) {
    showToast("No pages to export", "info", 3e3, "page-list");
    return;
  }
  let xml = '<?xml version="1.0"?>\n';
  xml += '<?mso-application progid="Excel.Sheet"?>\n';
  xml += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"\n';
  xml += ' xmlns:o="urn:schemas-microsoft-com:office:office"\n';
  xml += ' xmlns:x="urn:schemas-microsoft-com:office:excel"\n';
  xml += ' xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"\n';
  xml += ' xmlns:html="http://www.w3.org/TR/REC-html40">\n';
  xml += '<Worksheet ss:Name="SEO Analysis">\n';
  xml += "<Table>\n";
  xml += "<Row>\n";
  const headers = [
    "Page Title",
    "Page Title (Character Count)",
    "Meta Title",
    "Meta Title (Character Count)",
    "Meta Description",
    "Meta Description (Character Count)",
    "Link (URL)",
    "URL (Character Count)"
  ];
  headers.forEach((header) => {
    xml += `<Cell><Data ss:Type="String">${escapeHtml(header)}</Data></Cell>
`;
  });
  xml += "</Row>\n";
  pages.forEach((page) => {
    const pageTitle = page.title || "";
    const metaTitle = page.metaTitle || "";
    const metaDescription = page.metaDescription || "";
    const url2 = page.relPermalink || "";
    xml += "<Row>\n";
    xml += `<Cell><Data ss:Type="String">${escapeHtml(pageTitle)}</Data></Cell>
`;
    xml += `<Cell><Data ss:Type="Number">${pageTitle.length}</Data></Cell>
`;
    xml += `<Cell><Data ss:Type="String">${escapeHtml(metaTitle)}</Data></Cell>
`;
    xml += `<Cell><Data ss:Type="Number">${page.metaTitleLength || metaTitle.length}</Data></Cell>
`;
    xml += `<Cell><Data ss:Type="String">${escapeHtml(metaDescription)}</Data></Cell>
`;
    xml += `<Cell><Data ss:Type="Number">${page.metaDescriptionLength || metaDescription.length}</Data></Cell>
`;
    xml += `<Cell><Data ss:Type="String">${escapeHtml(url2)}</Data></Cell>
`;
    xml += `<Cell><Data ss:Type="Number">${url2.length}</Data></Cell>
`;
    xml += "</Row>\n";
  });
  xml += "</Table>\n";
  xml += "</Worksheet>\n";
  xml += "</Workbook>";
  const blob = new Blob([xml], { type: "application/vnd.ms-excel" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  showToast(`Exported ${pages.length} pages to ${filename}`, "success", 3e3, "page-list");
}
var exportToggleHandlers = {};
function attachExportToggle() {
  const toggle = document.getElementById("page-list-export-toggle");
  const menu = document.getElementById("page-list-export-menu");
  if (!toggle || !menu) {
    devWarn("Export toggle or menu not found");
    return;
  }
  if (exportToggleHandlers.toggleHandler) {
    toggle.removeEventListener("click", exportToggleHandlers.toggleHandler);
  }
  if (exportToggleHandlers.outsideClickHandler) {
    document.removeEventListener("click", exportToggleHandlers.outsideClickHandler);
  }
  if (exportToggleHandlers.escapeHandler) {
    document.removeEventListener("keydown", exportToggleHandlers.escapeHandler);
  }
  const toggleHandler = (e) => {
    e.stopPropagation();
    const isOpen = menu.classList.contains("page-list-export-menu--open");
    document.querySelectorAll(".page-list-export-menu--open").forEach((openMenu) => {
      if (openMenu !== menu) {
        openMenu.classList.remove("page-list-export-menu--open");
        const otherToggle = document.getElementById("page-list-export-toggle");
        if (otherToggle) {
          otherToggle.classList.remove("page-list-export-toggle--open");
        }
      }
    });
    menu.classList.toggle("page-list-export-menu--open", !isOpen);
    toggle.classList.toggle("page-list-export-toggle--open", !isOpen);
  };
  const outsideClickHandler = (e) => {
    const target = e.target;
    if (!menu.contains(target) && !toggle.contains(target)) {
      menu.classList.remove("page-list-export-menu--open");
      toggle.classList.remove("page-list-export-toggle--open");
    }
  };
  const escapeHandler = (e) => {
    if (e.key === "Escape") {
      menu.classList.remove("page-list-export-menu--open");
      toggle.classList.remove("page-list-export-toggle--open");
    }
  };
  exportToggleHandlers = {
    toggleHandler,
    outsideClickHandler,
    escapeHandler
  };
  toggle.addEventListener("click", toggleHandler);
  document.addEventListener("click", outsideClickHandler);
  document.addEventListener("keydown", escapeHandler);
}
var currentFilteredPagesForExport = [];
var allPagesForExport = [];
function updateFilteredPagesForExport(pages) {
  currentFilteredPagesForExport = pages;
}
function updateAllPagesForExport(pages) {
  allPagesForExport = pages;
}
var exportButtonHandlers = {};
function attachPageListExportHandlers() {
  const exportCsvBtn = document.getElementById("page-list-export-csv");
  const exportExcelBtn = document.getElementById("page-list-export-excel");
  const exportCsvAllBtn = document.getElementById("page-list-export-csv-all");
  const exportExcelAllBtn = document.getElementById("page-list-export-excel-all");
  if (exportButtonHandlers.csvHandler && exportCsvBtn) {
    exportCsvBtn.removeEventListener("click", exportButtonHandlers.csvHandler);
  }
  if (exportButtonHandlers.excelHandler && exportExcelBtn) {
    exportExcelBtn.removeEventListener("click", exportButtonHandlers.excelHandler);
  }
  if (exportButtonHandlers.csvAllHandler && exportCsvAllBtn) {
    exportCsvAllBtn.removeEventListener("click", exportButtonHandlers.csvAllHandler);
  }
  if (exportButtonHandlers.excelAllHandler && exportExcelAllBtn) {
    exportExcelAllBtn.removeEventListener("click", exportButtonHandlers.excelAllHandler);
  }
  const closeMenu = () => {
    const menu = document.getElementById("page-list-export-menu");
    const toggle = document.getElementById("page-list-export-toggle");
    if (menu) {
      menu.classList.remove("page-list-export-menu--open");
    }
    if (toggle) {
      toggle.classList.remove("page-list-export-toggle--open");
    }
  };
  const csvHandler = () => {
    if (currentFilteredPagesForExport.length === 0) {
      showToast("No pages to export", "info", 3e3, "page-list");
      return;
    }
    const timestamp = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-").slice(0, -5);
    exportPagesToCSV(currentFilteredPagesForExport, `seo-analysis-${timestamp}.csv`);
    closeMenu();
  };
  const excelHandler = () => {
    if (currentFilteredPagesForExport.length === 0) {
      showToast("No pages to export", "info", 3e3, "page-list");
      return;
    }
    const timestamp = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-").slice(0, -5);
    exportPagesToExcel(currentFilteredPagesForExport, `seo-analysis-${timestamp}.xls`);
    closeMenu();
  };
  const csvAllHandler = () => {
    if (allPagesForExport.length === 0) {
      showToast("No pages to export", "info", 3e3, "page-list");
      return;
    }
    const timestamp = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-").slice(0, -5);
    exportPagesToCSV(allPagesForExport, `seo-analysis-all-${timestamp}.csv`);
    closeMenu();
  };
  const excelAllHandler = () => {
    if (allPagesForExport.length === 0) {
      showToast("No pages to export", "info", 3e3, "page-list");
      return;
    }
    const timestamp = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-").slice(0, -5);
    exportPagesToExcel(allPagesForExport, `seo-analysis-all-${timestamp}.xls`);
    closeMenu();
  };
  exportButtonHandlers = {
    csvHandler,
    excelHandler,
    csvAllHandler,
    excelAllHandler
  };
  if (exportCsvBtn) {
    exportCsvBtn.addEventListener("click", csvHandler);
  }
  if (exportExcelBtn) {
    exportExcelBtn.addEventListener("click", excelHandler);
  }
  if (exportCsvAllBtn) {
    exportCsvAllBtn.addEventListener("click", csvAllHandler);
  }
  if (exportExcelAllBtn) {
    exportExcelAllBtn.addEventListener("click", excelAllHandler);
  }
}
function attachRescanHandler() {
  const rescanButton = document.getElementById("page-list-rescan-button");
  if (!rescanButton) {
    return;
  }
  rescanButton.addEventListener("click", async () => {
    const button = rescanButton;
    const originalText = button.innerHTML;
    button.disabled = true;
    button.innerHTML = `
      <span class="page-list-rescan-button__icon material-symbols-outlined page-list-rescan-button__icon--spinning" aria-hidden="true">refresh</span>
      <span class="page-list-rescan-button__text">Rescanning...</span>
    `;
    try {
      showLoading();
      const timestamp = (/* @__PURE__ */ new Date()).getTime();
      const response = await fetch(`/page-list/index.json?t=${timestamp}`, {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
          "Pragma": "no-cache"
        }
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      if (!response.headers.get("content-type")?.includes("application/json")) {
        throw new Error("Invalid content type: expected JSON");
      }
      const data = await response.json();
      hideLoading();
      if (!data || !Array.isArray(data.pages)) {
        throw new Error("Invalid data format: expected pages array");
      }
      window.location.reload();
    } catch (error) {
      hideLoading();
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      devError("Error rescanning site:", error);
      showToast(`Failed to rescan site: ${errorMessage}`, "error", 5e3, "page-list");
      button.disabled = false;
      button.innerHTML = originalText;
    }
  });
}
function attachBulkGenerateExcerptsHandler(pages) {
  const bulkExcerptBtn = document.getElementById("page-list-bulk-generate-excerpts");
  if (!bulkExcerptBtn) return;
  const needsExcerpts = pages.filter((page) => !page.hasSummary || page.summaryTooShort || page.summaryTooLong);
  const handleBulkGenerate = () => {
    if (needsExcerpts.length === 0) {
      showToast("No pages need excerpt generation.", "info", 4e3, "page-list");
      return;
    }
    showToast(`Found ${needsExcerpts.length} page${needsExcerpts.length !== 1 ? "s" : ""} needing excerpts. Implement generation pipeline to proceed.`, "info", 5e3, "page-list");
    devLog("Bulk excerpt generation requested for pages:", needsExcerpts.map((p) => p.title));
  };
  bulkExcerptBtn.addEventListener("click", handleBulkGenerate);
}
function attachTabHandlers(modal) {
  if (!modal) return;
  const tabs = modal.querySelectorAll(".page-list-modal__tab");
  const sections = modal.querySelectorAll(".page-list-modal__section[data-section]");
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const tabName = tab.getAttribute("data-tab");
      if (!tabName) return;
      tabs.forEach((t) => {
        t.classList.remove("page-list-modal__tab--active");
        t.setAttribute("aria-selected", "false");
      });
      tab.classList.add("page-list-modal__tab--active");
      tab.setAttribute("aria-selected", "true");
      sections.forEach((section) => {
        const sectionName = section.getAttribute("data-section");
        if (sectionName === tabName) {
          section.classList.add("page-list-modal__section--active");
        } else {
          section.classList.remove("page-list-modal__section--active");
        }
      });
    });
    tab.addEventListener("keydown", (e) => {
      const keyEvent = e;
      if (keyEvent.key === "Enter" || keyEvent.key === " ") {
        keyEvent.preventDefault();
        tab.click();
      } else if (keyEvent.key === "ArrowRight" || keyEvent.key === "ArrowLeft") {
        keyEvent.preventDefault();
        const currentIndex = Array.from(tabs).indexOf(tab);
        const direction = keyEvent.key === "ArrowRight" ? 1 : -1;
        const nextIndex = (currentIndex + direction + tabs.length) % tabs.length;
        tabs[nextIndex].focus();
        tabs[nextIndex].click();
      }
    });
  });
}
function attachKeywordResearchHandler(modal, page, allPages) {
  if (!modal || !isLocalhost()) return;
  const keywordBtn = modal.querySelector("#page-list-keyword-research-btn");
  if (!keywordBtn) return;
  keywordBtn.addEventListener("click", async () => {
    showLoadingModal("Analyzing keywords...", 0);
    const updateProgress = (progress, message) => {
      const modal2 = document.getElementById("page-list-fix-loading-modal");
      if (modal2) {
        const title = modal2.querySelector(".page-list-fix-loading__title");
        const progressBar = modal2.querySelector(".page-list-fix-loading__progress-bar");
        const progressText = modal2.querySelector(".page-list-fix-loading__progress-text");
        if (title) title.textContent = message;
        if (progressBar) progressBar.style.width = `${progress}%`;
        if (progressText) progressText.textContent = `${progress}% complete`;
      }
    };
    try {
      updateProgress(10, "Fetching current page content...");
      const response = await fetch(page.relPermalink);
      if (!response.ok) {
        closeLoadingModal();
        showToast("Could not fetch page content for keyword analysis", "error", 5e3, "page-list");
        return;
      }
      updateProgress(20, "Parsing page content...");
      const html = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      const title = doc.querySelector("title")?.textContent || page.title;
      const metaDescription = doc.querySelector('meta[name="description"]')?.getAttribute("content") || page.metaDescription || "";
      const bodyText = doc.body?.textContent || "";
      const scripts = doc.querySelectorAll("script, style, nav, header, footer");
      scripts.forEach((el) => el.remove());
      const cleanText = doc.body?.textContent || bodyText;
      updateProgress(30, "Analyzing current page keywords...");
      const analysis = analyzeKeywords(cleanText, title, metaDescription);
      const currentPageKeywords = {
        pageUrl: page.relPermalink,
        pageTitle: page.title,
        keywords: analysis.primaryKeywords,
        topKeywords: analysis.primaryKeywords.map((k) => k.keyword)
      };
      updateProgress(40, `Fetching content from ${allPages.length - 1} other pages...`);
      const otherPages = allPages.filter((p) => p.relPermalink !== page.relPermalink);
      const totalPages = otherPages.length;
      let processedPages = 0;
      const allPageKeywordsPromises = otherPages.map(async (p) => {
        try {
          const pageResponse = await fetch(p.relPermalink);
          if (!pageResponse.ok) {
            const pageText = `${p.title} ${p.metaDescription ?? ""} ${p.summary ?? ""}`;
            const pageAnalysis2 = analyzeKeywords(pageText, p.title, p.metaDescription ?? "");
            return {
              pageUrl: p.relPermalink,
              pageTitle: p.title,
              keywords: pageAnalysis2.primaryKeywords,
              topKeywords: pageAnalysis2.primaryKeywords.map((k) => k.keyword)
            };
          }
          const pageHtml = await pageResponse.text();
          const pageParser = new DOMParser();
          const pageDoc = pageParser.parseFromString(pageHtml, "text/html");
          const pageTitle = pageDoc.querySelector("title")?.textContent || p.title;
          const pageMetaDesc = pageDoc.querySelector('meta[name="description"]')?.getAttribute("content") || p.metaDescription || "";
          const pageBodyText = pageDoc.body?.textContent || "";
          const pageScripts = pageDoc.querySelectorAll("script, style, nav, header, footer");
          pageScripts.forEach((el) => el.remove());
          const pageCleanText = pageDoc.body?.textContent || pageBodyText;
          const pageAnalysis = analyzeKeywords(pageCleanText, pageTitle, pageMetaDesc);
          processedPages++;
          const progress = 40 + Math.round(processedPages / totalPages * 50);
          updateProgress(progress, `Analyzing page ${processedPages} of ${totalPages}...`);
          return {
            pageUrl: p.relPermalink,
            pageTitle: p.title,
            keywords: pageAnalysis.primaryKeywords,
            topKeywords: pageAnalysis.primaryKeywords.map((k) => k.keyword)
          };
        } catch (error) {
          devWarn(`Failed to fetch rendered content for ${p.relPermalink}, using metadata:`, error);
          const pageText = `${p.title} ${p.metaDescription ?? ""} ${p.summary ?? ""}`;
          const pageAnalysis = analyzeKeywords(pageText, p.title, p.metaDescription ?? "");
          return {
            pageUrl: p.relPermalink,
            pageTitle: p.title,
            keywords: pageAnalysis.primaryKeywords,
            topKeywords: pageAnalysis.primaryKeywords.map((k) => k.keyword)
          };
        }
      });
      const allPageKeywords = await Promise.all(allPageKeywordsPromises);
      const gapAnalysis = analyzeKeywordGaps(currentPageKeywords, allPageKeywords);
      updateProgress(95, "Preparing results...");
      const modalHtml = renderKeywordResearchModal(analysis, page.title, page.relPermalink, gapAnalysis);
      document.body.insertAdjacentHTML("beforeend", modalHtml);
      closeLoadingModal();
      const keywordModal = document.getElementById("dev-keyword-research-modal");
      if (!keywordModal) {
        return;
      }
      const closeBtn = keywordModal.querySelector("#dev-keyword-research-close");
      const overlay = keywordModal.querySelector(".dev-score-bubble-modal-overlay");
      const modalClose = keywordModal.querySelector(".dev-score-bubble-modal-close");
      const closeModal2 = () => {
        keywordModal.remove();
      };
      if (closeBtn) closeBtn.addEventListener("click", closeModal2);
      if (overlay) overlay.addEventListener("click", closeModal2);
      if (modalClose) modalClose.addEventListener("click", closeModal2);
      const handleEscape = (e) => {
        if (e.key === "Escape" && keywordModal) {
          closeModal2();
          document.removeEventListener("keydown", handleEscape);
        }
      };
      document.addEventListener("keydown", handleEscape);
      attachSeedKeywordSearch(keywordModal);
      attachCompetitorKeywordRemoval(keywordModal);
      const allPageKeywordsForExport = [currentPageKeywords, ...allPageKeywords];
      attachExportHandlers(keywordModal, analysis, allPageKeywordsForExport);
    } catch (error) {
      devError("Error analyzing keywords:", error);
      closeLoadingModal();
      showToast("Error analyzing keywords. Please try again.", "error", 5e3, "page-list");
    }
  });
}
function selectFileWithInput() {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".md,text/markdown";
    input.style.display = "none";
    const cleanup2 = () => {
      if (input.parentNode) {
        input.parentNode.removeChild(input);
      }
    };
    const changeHandler = (e) => {
      const target = e.target;
      const file = target.files?.[0] || null;
      cleanup2();
      resolve(file);
    };
    const cancelHandler = () => {
      cleanup2();
      resolve(null);
    };
    input.addEventListener("change", changeHandler, { once: true });
    input.addEventListener("cancel", cancelHandler, { once: true });
    const observer = new MutationObserver(() => {
      if (!document.body.contains(input)) {
        cleanup2();
        observer.disconnect();
        resolve(null);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    document.body.appendChild(input);
    input.click();
    setTimeout(() => {
      if (document.body.contains(input)) {
        cleanup2();
        observer.disconnect();
        resolve(null);
      }
    }, 6e4);
  });
}
function attachBrokenLinkHandlers(modal, page, allPages) {
  if (!modal || !isLocalhost()) return;
  const actionButtons = modal.querySelectorAll('[data-action="fix"], [data-action="edit"], [data-action="remove"]');
  actionButtons.forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const button = btn;
      const action = button.getAttribute("data-action");
      const brokenUrl = button.getAttribute("data-broken-url");
      const sourcePage = button.getAttribute("data-source-page");
      if (!action || !brokenUrl || !sourcePage) return;
      if ("showDirectoryPicker" in window && !getSiteRootDirectoryHandle()) {
        const accessGranted = await createConfirmationDialog(
          "Select Site Root Folder",
          'To update source files, you need to select your Hugo site root folder.\n\nClick "Select Folder" below, then navigate to and select the folder that contains your "content" folder.\n\nExample: If your site is at /Users/you/my-site/, select that folder.\n\nThis permission is only requested once per browser session.',
          "Select Folder",
          "Skip (Use Manual File Selection)",
          "page-list"
        );
        if (accessGranted) {
          const dirHandle = await requestSiteRootAccess(
            (msg) => showToast(msg, "success", 5e3, "page-list"),
            (msg) => showToast(msg, "error", 5e3, "page-list")
          );
          if (!dirHandle) {
            showToast("You can still manually select the file when prompted.", "info", 5e3, "page-list");
          }
        }
      }
      button.setAttribute("disabled", "true");
      button.classList.add("dev-score-bubble__broken-link-menu-action--loading");
      const originalText = button.innerHTML;
      try {
        const hasDirectoryAccess = getSiteRootDirectoryHandle() !== null;
        const possiblePaths = relPermalinkToContentFile(sourcePage);
        let filePath = null;
        let manualFileHandle = null;
        if (hasDirectoryAccess) {
          filePath = await findActualFilePath(possiblePaths, true);
        }
        if (!filePath) {
          const message = hasDirectoryAccess ? `Could not automatically find the source file.

Expected paths:
${possiblePaths.map((p) => `  \u2022 ${p}`).join("\n")}

The file may not exist at these locations, or the directory structure may be different.

Please manually select the markdown file to continue.` : `To update source files, please select the markdown file manually.

Expected file location:
${possiblePaths.map((p) => `  \u2022 ${p}`).join("\n")}

This works on both Windows and macOS.`;
          const tryManual = await createConfirmationDialog(
            "Select Source File",
            message,
            "Select File",
            "Cancel",
            "page-list"
          );
          if (tryManual) {
            if ("showOpenFilePicker" in window) {
              try {
                const fileHandles = await window.showOpenFilePicker({
                  types: [{
                    description: "Markdown files",
                    accept: { "text/markdown": [".md"] }
                  }],
                  excludeAcceptAllOption: false,
                  multiple: false
                });
                if (fileHandles && fileHandles.length > 0) {
                  const handle = fileHandles[0];
                  if (handle) {
                    manualFileHandle = handle;
                    const file = await handle.getFile();
                    filePath = file.name;
                  }
                }
              } catch (pickerError) {
                if (pickerError.name !== "AbortError") {
                  devError("File picker error:", pickerError);
                } else {
                  button.removeAttribute("disabled");
                  button.classList.remove("dev-score-bubble__broken-link-menu-action--loading");
                  button.innerHTML = originalText;
                  return;
                }
              }
            }
            if (!manualFileHandle && !filePath) {
              try {
                const file = await selectFileWithInput();
                if (file) {
                  manualFileHandle = {
                    getFile: async () => file,
                    kind: "file",
                    __isFallback: true,
                    // Mark as fallback for detection
                    createWritable: async () => {
                      let writtenContent = "";
                      return {
                        write: async (content) => {
                          writtenContent = content;
                        },
                        close: async () => {
                          const blob = new Blob([writtenContent], { type: "text/markdown" });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = file.name;
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                          URL.revokeObjectURL(url);
                        }
                      };
                    }
                  };
                  filePath = file.name;
                }
              } catch (inputError) {
                devError("File input error:", inputError);
                showToast("Error selecting file. Please try again.", "error", 5e3, "page-list");
              }
            }
          }
          if (!filePath && !manualFileHandle) {
            showToast("File selection cancelled or failed. Please try again.", "info", 5e3, "page-list");
            button.removeAttribute("disabled");
            button.classList.remove("dev-score-bubble__broken-link-menu-action--loading");
            button.innerHTML = originalText;
            return;
          }
        }
        const handleFileOperation = async (operation, successMessage) => {
          let content;
          let fileName;
          if (manualFileHandle) {
            const file = await manualFileHandle.getFile();
            content = await file.text();
            fileName = file.name;
          } else if (filePath) {
            const fileData = await readFileContent(filePath, true);
            if (!fileData) {
              showToast("Could not read file", "error", 5e3, "page-list");
              return false;
            }
            content = fileData.content;
            fileName = filePath;
          } else {
            showToast("No file available", "error", 5e3, "page-list");
            return false;
          }
          const result = operation(content);
          if (!result.modified) {
            showToast("Link not found in file content", "info", 5e3, "page-list");
            return false;
          }
          if (manualFileHandle) {
            devLog("Note: Backup not created for manually selected file. Consider using version control.");
          } else if (filePath && hasDirectoryAccess) {
            const backupPath = createBackupFilename(filePath);
            const backupCreated = await writeFileContent(backupPath, content);
            if (backupCreated) {
              devLog(`\u2705 Backup created: ${backupPath}`);
            } else {
              devWarn("Could not create backup. Continuing anyway...");
            }
          } else if (filePath) {
            devLog("Note: Backup not created (File System Access API not available). Consider using version control.");
          }
          if (manualFileHandle) {
            try {
              const writable = await manualFileHandle.createWritable();
              await writable.write(result.content);
              await writable.close();
              const isFallback = manualFileHandle.__isFallback === true;
              if (isFallback) {
                showToast(
                  `${successMessage} Modified file downloaded. Please replace the original file with the downloaded file.`,
                  "success",
                  1e4,
                  "page-list"
                );
              } else {
                showToast(successMessage, "success", 5e3, "page-list");
              }
              return true;
            } catch (writeError) {
              devError("Error writing to file:", writeError);
              showToast(`Error writing file: ${writeError instanceof Error ? writeError.message : "Unknown error"}`, "error", 5e3, "page-list");
              return false;
            }
          } else if (filePath) {
            const writeSuccess = await writeFileContent(filePath, result.content);
            if (writeSuccess) {
              showToast(successMessage, "success", 5e3, "page-list");
              return true;
            } else {
              showToast("Error writing file", "error", 5e3, "page-list");
              return false;
            }
          }
          return false;
        };
        if (action === "fix") {
          button.innerHTML = '<span class="material-symbols-outlined" aria-hidden="true">hourglass_empty</span> Fixing...';
          const allPagePaths = allPages.map((p) => p.relPermalink);
          const match = findUrlMatch(brokenUrl, allPagePaths, allPages);
          if (!match) {
            showToast(`No match found for: ${brokenUrl}`, "error", 5e3, "page-list");
            button.removeAttribute("disabled");
            button.classList.remove("dev-score-bubble__broken-link-menu-action--loading");
            button.innerHTML = originalText;
            return;
          }
          const fixedUrl = match.match;
          const success = await handleFileOperation((content) => {
            const escapedUrl = escapeRegex(brokenUrl);
            let modifiedContent = content;
            let modified = false;
            const markdownPattern = new RegExp(`(\\[[^\\]]+\\]\\()${escapedUrl}([^)]*\\))`, "g");
            modifiedContent = modifiedContent.replace(markdownPattern, (match2, prefix, suffix) => {
              modified = true;
              return `${prefix}${fixedUrl}${suffix}`;
            });
            const htmlPattern = new RegExp(`(href=["'])${escapedUrl}(["'])`, "gi");
            modifiedContent = modifiedContent.replace(htmlPattern, (match2, prefix, suffix) => {
              modified = true;
              return `${prefix}${fixedUrl}${suffix}`;
            });
            return { content: modifiedContent, modified };
          }, `Link fixed: ${brokenUrl} \u2192 ${fixedUrl}`);
          if (success) {
            const item = button.closest(".page-list-modal__broken-link-item");
            if (item) {
              item.classList.add("page-list-modal__broken-link-item--fixed");
              const urlCode = item.querySelector(".page-list-modal__broken-link-url");
              if (urlCode) {
                urlCode.textContent = fixedUrl;
                urlCode.setAttribute("title", `Fixed: ${fixedUrl}`);
              }
              button.remove();
            }
          } else {
            button.removeAttribute("disabled");
            button.classList.remove("dev-score-bubble__broken-link-menu-action--loading");
            button.innerHTML = originalText;
          }
        } else if (action === "edit") {
          button.innerHTML = '<span class="material-symbols-outlined" aria-hidden="true">hourglass_empty</span> Editing...';
          const newUrl = await createUrlInputDialog("Enter new URL:", brokenUrl, "page-list");
          if (!newUrl || newUrl === brokenUrl) {
            button.removeAttribute("disabled");
            button.classList.remove("dev-score-bubble__broken-link-menu-action--loading");
            button.innerHTML = originalText;
            return;
          }
          const success = await handleFileOperation((content) => {
            const escapedUrl = escapeRegex(brokenUrl);
            let modifiedContent = content;
            let modified = false;
            const markdownPattern = new RegExp(`(\\[[^\\]]+\\]\\()${escapedUrl}([^)]*\\))`, "g");
            modifiedContent = modifiedContent.replace(markdownPattern, (match, prefix, suffix) => {
              modified = true;
              return `${prefix}${newUrl}${suffix}`;
            });
            const htmlPattern = new RegExp(`(href=["'])${escapedUrl}(["'])`, "gi");
            modifiedContent = modifiedContent.replace(htmlPattern, (match, prefix, suffix) => {
              modified = true;
              return `${prefix}${newUrl}${suffix}`;
            });
            return { content: modifiedContent, modified };
          }, `Link updated: ${brokenUrl} \u2192 ${newUrl}`);
          if (success) {
            const item = button.closest(".page-list-modal__broken-link-item");
            if (item) {
              item.classList.remove("page-list-modal__broken-link-item--broken");
              item.classList.add("page-list-modal__broken-link-item--fixed");
              const urlCode = item.querySelector(".page-list-modal__broken-link-url");
              if (urlCode) {
                urlCode.textContent = newUrl;
                urlCode.setAttribute("title", `Updated: ${newUrl}`);
              }
              const actions = item.querySelector(".page-list-modal__broken-link-actions");
              if (actions) actions.remove();
            }
          } else {
            button.removeAttribute("disabled");
            button.classList.remove("dev-score-bubble__broken-link-menu-action--loading");
            button.innerHTML = originalText;
          }
        } else if (action === "remove") {
          button.innerHTML = '<span class="material-symbols-outlined" aria-hidden="true">hourglass_empty</span> Removing...';
          const fileName = manualFileHandle ? (await manualFileHandle.getFile()).name : filePath || "file";
          const confirmed = await createConfirmationDialog(
            "Remove Broken Link",
            `This will remove the broken link "${brokenUrl}" from "${fileName}" and keep only the text.

A backup will be created before making changes. Continue?`,
            "Remove Link",
            "Cancel",
            "page-list"
          );
          if (!confirmed) {
            button.removeAttribute("disabled");
            button.classList.remove("dev-score-bubble__broken-link-menu-action--loading");
            button.innerHTML = originalText;
            return;
          }
          const success = await handleFileOperation((content) => {
            const removalResult = removeLinkFromContent(content, brokenUrl);
            return {
              content: removalResult.content,
              modified: removalResult.changes.length > 0
            };
          }, `Link removed successfully`);
          if (success) {
            const item = button.closest(".page-list-modal__broken-link-item");
            if (item) {
              item.classList.add("page-list-modal__broken-link-item--removed");
              const urlCode = item.querySelector(".page-list-modal__broken-link-url");
              if (urlCode && urlCode instanceof HTMLElement) {
                urlCode.style.textDecoration = "line-through";
                urlCode.style.opacity = "0.6";
              }
              const actions = item.querySelector(".page-list-modal__broken-link-actions");
              if (actions) actions.remove();
            }
          } else {
            button.removeAttribute("disabled");
            button.classList.remove("dev-score-bubble__broken-link-menu-action--loading");
            button.innerHTML = originalText;
          }
        }
      } catch (error) {
        devError("Error handling broken link action:", error);
        showToast(`Error: ${error instanceof Error ? error.message : "Unknown error"}`, "error", 5e3, "page-list");
        button.removeAttribute("disabled");
        button.classList.remove("page-list-fix-button--loading");
        button.innerHTML = originalText;
      }
    });
  });
}
function attachDraftHandlers(draftPages) {
  const exportButton = document.getElementById("page-list-drafts-export-csv");
  if (exportButton) {
    const handler = () => {
      exportDraftPagesToCSV(draftPages);
    };
    exportButton.addEventListener("click", handler);
  }
  const copyButtons = document.querySelectorAll("[data-copy-url]");
  copyButtons.forEach((button) => {
    const handler = async (e) => {
      e.stopPropagation();
      const url = button.getAttribute("data-copy-url");
      if (!url) return;
      try {
        await navigator.clipboard.writeText(url);
        const icon = button.querySelector(".material-symbols-outlined");
        if (icon) {
          const originalText = icon.textContent;
          icon.textContent = "check";
          setTimeout(() => {
            if (icon.textContent === "check") {
              icon.textContent = originalText || "content_copy";
            }
          }, 2e3);
        }
        showToast("URL copied to clipboard", "success", 2e3, "page-list");
      } catch (err) {
        devError("Failed to copy URL:", err);
        showToast("Failed to copy URL", "error", 3e3, "page-list");
      }
    };
    button.addEventListener("click", handler);
  });
}
function exportDraftPagesToCSV(pages) {
  if (pages.length === 0) {
    showToast("No draft pages to export", "info", 3e3, "page-list");
    return;
  }
  const headers = ["Title", "URL", "Section"];
  const rows = [headers.join(",")];
  pages.forEach((page) => {
    const title = page.title || "";
    const url2 = page.relPermalink || "";
    const section = page.section || "Home";
    const row = [
      `"${title.replace(/"/g, '""')}"`,
      // Escape quotes
      `"${url2.replace(/"/g, '""')}"`,
      `"${section.replace(/"/g, '""')}"`
    ];
    rows.push(row.join(","));
  });
  const csvContent = rows.join("\n");
  const BOM = "\uFEFF";
  const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "draft-pages.csv";
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  showToast(`Exported ${pages.length} draft ${pages.length === 1 ? "page" : "pages"} to CSV`, "success", 3e3, "page-list");
}
function createTableFixButtonHandlers(allPages, cleanupFunctions) {
  if (!isLocalhost()) {
    return () => {
    };
  }
  const fixButtons = document.querySelectorAll('[data-action="fix-links"], [data-action="fix-images"]');
  const listeners = [];
  fixButtons.forEach((button) => {
    const handler = (e) => {
      e.stopPropagation();
      const pageUrl = button.getAttribute("data-page-url");
      if (!pageUrl) {
        devWarn("Fix button missing data-page-url attribute");
        return;
      }
      const row = button.closest(".page-list-row");
      if (row) {
        const rowPageUrl = row.getAttribute("data-page-url");
        if (rowPageUrl && rowPageUrl === pageUrl) {
          const clickEvent = new MouseEvent("click", { bubbles: true, cancelable: true });
          row.dispatchEvent(clickEvent);
        } else {
          devWarn("Page URL mismatch between button and row");
        }
      } else {
        devWarn("Could not find page list row for fix button");
      }
    };
    button.addEventListener("click", handler);
    listeners.push({ element: button, type: "click", handler });
  });
  return () => {
    listeners.forEach(({ element, type, handler }) => {
      element.removeEventListener(type, handler);
    });
  };
}
function initPageList() {
  if (!isLocalhost()) {
    return;
  }
  const container = document.querySelector(".page-list-container");
  if (!container) {
    devWarn("Page list container not found");
    return;
  }
  const currentSection = container.getAttribute("data-page-list-section") || "overview";
  try {
    showLoading();
    fetch("/page-list/index.json").then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const contentType = response.headers.get("content-type");
      if (!contentType?.includes("application/json")) {
        throw new Error(`Invalid content type: expected JSON, got ${contentType}`);
      }
      return response.json();
    }).then((data) => {
      if (!data || typeof data !== "object") {
        throw new Error("Invalid data format: expected object");
      }
      const pageListData = data;
      if (!Array.isArray(pageListData.pages)) {
        throw new Error("Invalid data format: expected pages array");
      }
      return pageListData;
    }).then((data) => {
      hideLoading();
      let initialFilter = "all";
      switch (currentSection) {
        case "seo-analysis":
          initialFilter = "with-issues";
          break;
        case "schema":
          initialFilter = "all";
          break;
        case "content-quality":
          initialFilter = "low-word-count";
          break;
        case "technical-issues":
          initialFilter = "broken-links";
          break;
        case "keyword-research":
          initialFilter = "all";
          break;
        case "link-map":
          initialFilter = "all";
          break;
        case "drafts":
          initialFilter = "drafts";
          break;
        case "llms":
          initialFilter = "all";
          break;
        case "overview":
        default:
          initialFilter = "all";
          break;
      }
      let currentFilter = initialFilter;
      let currentLayout = "compact";
      let currentGrouping = "ungrouped";
      let currentSort = "title";
      let currentSortDirection = "asc";
      let allPages = data.pages || [];
      updateAllPagesForExport(allPages);
      const cleanupFunctions = [];
      const cleanupEventListeners = () => {
        cleanupFunctions.forEach((cleanup2) => cleanup2());
        cleanupFunctions.length = 0;
      };
      const setActiveFilterState = (filterId) => {
        const filterableElements = container.querySelectorAll("[data-filter]");
        filterableElements.forEach((el) => {
          const elementFilter = el.getAttribute("data-filter");
          const isActive = elementFilter === filterId;
          if (el.classList.contains("page-list-summary__stat")) {
            el.classList.toggle("page-list-summary__stat--active", isActive);
          }
          if (el.classList.contains("page-list-overview-stat")) {
            el.classList.toggle("page-list-overview-stat--active", isActive);
          }
          if (el instanceof HTMLElement) {
            if (isActive) {
              el.classList.add("is-active-filter");
            } else {
              el.classList.remove("is-active-filter");
            }
            el.setAttribute("aria-pressed", isActive ? "true" : "false");
          }
        });
      };
      const updateView = (filterType, layout = currentLayout, grouping = currentGrouping, sortType = currentSort, sortDirection = currentSortDirection) => {
        cleanupEventListeners();
        if (currentSection === "drafts") {
          const draftPages = filterPages(allPages, "drafts");
          updateFilteredPagesForExport(draftPages);
          const draftsHtml = renderDraftPages(draftPages);
          container.innerHTML = draftsHtml;
          attachDraftHandlers(draftPages);
          return;
        }
        if (currentSection === "schema") {
          const schemaHtml = renderSchemaSection(allPages);
          container.innerHTML = schemaHtml;
          attachSchemaValidationHandlers(allPages);
          return;
        }
        const filteredPages2 = filterPages(allPages, filterType);
        updateFilteredPagesForExport(filteredPages2);
        const allStats = calculateStats(allPages);
        const statsHtml = renderStats(allStats, filterType, data.siteTechnicalSEO, data.siteAICrawlability, true, currentSection);
        const pagesHtml2 = filteredPages2.length > 0 ? grouping === "grouped" ? renderGroupedPages(filteredPages2, layout === "compact", sortType, sortDirection, filterType) : renderUngroupedPages(filteredPages2, layout === "compact", sortType, sortDirection, filterType) : `
          <div class="page-list-empty">
            <div class="page-list-empty__icon">\u{1F50D}</div>
            <h3 class="page-list-empty__title">No pages match this filter</h3>
            <p class="page-list-empty__text">Try selecting a different filter option.</p>
          </div>
        `;
        const summarySection = container.querySelector(".page-list-summary");
        const pagesContainer = document.getElementById("page-list-pages");
        if (summarySection) {
          const tempDiv = document.createElement("div");
          tempDiv.innerHTML = statsHtml;
          const newGrid = tempDiv.querySelector(".page-list-summary__grid");
          const oldGrid = summarySection.querySelector(".page-list-summary__grid");
          if (newGrid && oldGrid && oldGrid.parentNode) {
            oldGrid.parentNode.replaceChild(newGrid, oldGrid);
          }
          const newOverview = tempDiv.querySelector(".page-list-summary__hero-overview");
          const oldOverview = summarySection.querySelector(".page-list-summary__hero-overview");
          if (newOverview && oldOverview && oldOverview.parentNode) {
            oldOverview.parentNode.replaceChild(newOverview, oldOverview);
          }
        }
        if (pagesContainer) {
          pagesContainer.innerHTML = pagesHtml2;
          if (layout === "compact") {
            pagesContainer.classList.add("page-list-pages--compact");
          } else {
            pagesContainer.classList.remove("page-list-pages--compact");
          }
        }
        setActiveFilterState(filterType);
        updateFilteredPagesForExport(filteredPages2);
        attachFilterListeners();
        attachRowClickListeners();
        attachGroupToggleListeners();
        attachTooltipHandlers(container);
        const fixButtonCleanup = createTableFixButtonHandlers(allPages, cleanupFunctions);
        cleanupFunctions.push(fixButtonCleanup);
        if (showControls) {
          attachPageListExportHandlers();
          attachExportToggle();
        }
        if (isLocalhost() && currentSection === "keyword-research") {
          attachCompetitorAnalysisHandlers(allPages);
          extractAndDisplaySiteKeywords(allPages);
        }
      };
      const attachFilterListeners = () => {
        const statButtons = container.querySelectorAll(".page-list-summary__stat--clickable, .page-list-overview-stat--clickable");
        const listeners = [];
        const activateFilter = (button) => {
          const filterId = button.getAttribute("data-filter");
          if (!filterId || filterId === currentFilter || button.hasAttribute("disabled")) return;
          currentFilter = filterId;
          updateView(filterId, currentLayout, currentGrouping, currentSort, currentSortDirection);
          const pagesContainer = document.getElementById("page-list-pages");
          if (pagesContainer) {
            pagesContainer.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        };
        statButtons.forEach((button) => {
          const clickHandler = () => activateFilter(button);
          const keyHandler = (event) => {
            const keyboardEvent = event;
            if (keyboardEvent.key === "Enter" || keyboardEvent.key === " ") {
              keyboardEvent.preventDefault();
              activateFilter(button);
            }
          };
          button.addEventListener("click", clickHandler);
          button.addEventListener("keydown", keyHandler);
          listeners.push({ element: button, type: "click", handler: clickHandler });
          listeners.push({ element: button, type: "keydown", handler: keyHandler });
        });
        const tabButtons = container.querySelectorAll(".page-list-filter-tab");
        tabButtons.forEach((tab) => {
          const handler = () => {
            const tabId = tab.getAttribute("data-tab");
            if (!tabId) return;
            tabButtons.forEach((t) => t.classList.remove("page-list-filter-tab--active"));
            const allTabContents = container.querySelectorAll(".page-list-filter-tab-content");
            allTabContents.forEach((content) => content.classList.remove("page-list-filter-tab-content--active"));
            tab.classList.add("page-list-filter-tab--active");
            const tabContent = container.querySelector(`[data-tab-content="${tabId}"]`);
            if (tabContent) {
              tabContent.classList.add("page-list-filter-tab-content--active");
            }
          };
          tab.addEventListener("click", handler);
          listeners.push({ element: tab, type: "click", handler });
        });
        cleanupFunctions.push(() => {
          listeners.forEach(({ element, type, handler }) => {
            element.removeEventListener(type, handler);
          });
        });
      };
      const openPageModal = (pageUrl) => {
        const page = allPages.find((p) => p.relPermalink === pageUrl);
        if (!page) return;
        const existingModal = document.getElementById("page-list-modal");
        if (existingModal) {
          existingModal.remove();
        }
        const modalHtml = renderPageDetailModal(page);
        document.body.insertAdjacentHTML("beforeend", modalHtml);
        const modal = document.getElementById("page-list-modal");
        const closeBtn = document.getElementById("page-list-modal-close");
        const overlay = modal?.querySelector(".page-list-modal__overlay");
        const closeModal2 = () => {
          if (modal) modal.remove();
          const row = container.querySelector(`[data-page-url="${pageUrl}"]`);
          if (row instanceof HTMLElement) {
            row.focus();
          }
        };
        if (closeBtn) closeBtn.addEventListener("click", closeModal2);
        if (overlay) overlay.addEventListener("click", closeModal2);
        const handleEscape = (e) => {
          if (e.key === "Escape") {
            closeModal2();
            document.removeEventListener("keydown", handleEscape);
          }
        };
        document.addEventListener("keydown", handleEscape);
        const firstFocusable = modal?.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (firstFocusable) {
          setTimeout(() => firstFocusable.focus(), 100);
        }
        attachTooltipHandlers(modal);
        attachBrokenLinkHandlers(modal, page, allPages);
        attachKeywordResearchHandler(modal, page, allPages);
        attachTabHandlers(modal);
      };
      const attachRowClickListeners = () => {
        const rows = container.querySelectorAll(".page-list-row");
        const clickHandlers = [];
        const keyHandlers = [];
        rows.forEach((row) => {
          if (row instanceof HTMLElement) {
            row.setAttribute("tabindex", "0");
            row.setAttribute("role", "button");
            row.setAttribute("aria-label", `View details for ${row.querySelector("strong")?.textContent || "page"}`);
          }
          const clickHandler = (e) => {
            if (e.target.closest("a, button[data-action]")) return;
            const pageUrl = row.getAttribute("data-page-url");
            if (!pageUrl) return;
            openPageModal(pageUrl);
          };
          const keyHandler = (e) => {
            const keyEvent = e;
            if (keyEvent.key === "Enter" || keyEvent.key === " ") {
              keyEvent.preventDefault();
              const pageUrl = row.getAttribute("data-page-url");
              if (!pageUrl) return;
              openPageModal(pageUrl);
            }
          };
          row.addEventListener("click", clickHandler);
          row.addEventListener("keydown", keyHandler);
          clickHandlers.push({ element: row, handler: clickHandler });
          keyHandlers.push({ element: row, handler: keyHandler });
        });
        cleanupFunctions.push(() => {
          clickHandlers.forEach(({ element, handler }) => {
            element.removeEventListener("click", handler);
          });
          keyHandlers.forEach(({ element, handler }) => {
            element.removeEventListener("keydown", handler);
          });
        });
      };
      const attachLayoutToggle = () => {
        const toggle = document.getElementById("page-list-layout-toggle");
        if (toggle) {
          const handler = () => {
            currentLayout = currentLayout === "normal" ? "compact" : "normal";
            const icon = toggle.querySelector(".page-list-layout-toggle__icon");
            const label = toggle.querySelector(".page-list-layout-toggle__label");
            if (icon && label) {
              icon.textContent = currentLayout === "compact" ? "view_compact" : "view_list";
              label.textContent = currentLayout === "compact" ? "Compact" : "Normal";
            }
            toggle.setAttribute("data-layout", currentLayout);
            updateView(currentFilter, currentLayout, currentGrouping, currentSort, currentSortDirection);
          };
          toggle.addEventListener("click", handler);
          cleanupFunctions.push(() => toggle.removeEventListener("click", handler));
        }
      };
      const attachGroupingToggle = () => {
        const toggle = document.getElementById("page-list-grouping-toggle");
        if (toggle) {
          const handler = () => {
            currentGrouping = currentGrouping === "grouped" ? "ungrouped" : "grouped";
            const icon = toggle.querySelector(".page-list-grouping-toggle__icon");
            const label = toggle.querySelector(".page-list-grouping-toggle__label");
            if (icon && label) {
              icon.textContent = currentGrouping === "ungrouped" ? "list" : "folder";
              label.textContent = currentGrouping === "ungrouped" ? "Ungrouped" : "Grouped";
            }
            toggle.setAttribute("data-grouping", currentGrouping);
            updateView(currentFilter, currentLayout, currentGrouping, currentSort, currentSortDirection);
          };
          toggle.addEventListener("click", handler);
          cleanupFunctions.push(() => toggle.removeEventListener("click", handler));
        }
      };
      const attachSortToggle = () => {
        const toggle = document.getElementById("page-list-sort-toggle");
        const menu = document.getElementById("page-list-sort-menu");
        if (toggle && menu) {
          const toggleHandler = (e) => {
            e.stopPropagation();
            menu.classList.toggle("page-list-sort-menu--open");
          };
          toggle.addEventListener("click", toggleHandler);
          const outsideClickHandler = (e) => {
            const target = e.target;
            if (!toggle.contains(target) && !menu.contains(target)) {
              menu.classList.remove("page-list-sort-menu--open");
            }
          };
          document.addEventListener("click", outsideClickHandler);
          const sortItems = menu.querySelectorAll(".page-list-sort-menu__item");
          const itemClickHandlers = [];
          sortItems.forEach((item) => {
            const handler = () => {
              const sortType = item.getAttribute("data-sort");
              const direction = item.getAttribute("data-direction");
              if (sortType && direction) {
                currentSort = sortType;
                currentSortDirection = direction;
                const icon = toggle.querySelector(".page-list-sort-toggle__icon");
                const label = toggle.querySelector(".page-list-sort-toggle__label");
                const directionIcon = toggle.querySelector(".page-list-sort-toggle__direction");
                if (icon) icon.textContent = getSortIcon(currentSort, currentSortDirection);
                if (label) label.textContent = getSortLabel(currentSort, currentSortDirection);
                if (directionIcon) directionIcon.textContent = currentSortDirection === "asc" ? "arrow_upward" : "arrow_downward";
                toggle.setAttribute("data-sort", currentSort);
                toggle.setAttribute("data-direction", currentSortDirection);
                sortItems.forEach((i) => i.classList.remove("page-list-sort-menu__item--active"));
                item.classList.add("page-list-sort-menu__item--active");
                menu.classList.remove("page-list-sort-menu--open");
                updateView(currentFilter, currentLayout, currentGrouping, currentSort, currentSortDirection);
              }
            };
            item.addEventListener("click", handler);
            itemClickHandlers.push({ element: item, handler });
          });
          cleanupFunctions.push(() => {
            toggle.removeEventListener("click", toggleHandler);
            document.removeEventListener("click", outsideClickHandler);
            itemClickHandlers.forEach(({ element, handler }) => {
              element.removeEventListener("click", handler);
            });
          });
        }
      };
      const attachGroupToggleListeners = () => {
        const groupHeaders = container.querySelectorAll(".page-list-group-header");
        const clickHandlers = [];
        groupHeaders.forEach((header) => {
          const handler = () => {
            const groupId = header.getAttribute("data-group-toggle");
            if (!groupId) return;
            const group = container.querySelector(`[data-group-id="${groupId}"]`);
            const content = container.querySelector(`[data-group-content="${groupId}"]`);
            const icon = header.querySelector(".page-list-group-toggle-icon");
            if (content && icon) {
              const isCollapsed = content.classList.contains("page-list-group-content--collapsed");
              if (isCollapsed) {
                content.classList.remove("page-list-group-content--collapsed");
                icon.textContent = "\u25BC";
              } else {
                content.classList.add("page-list-group-content--collapsed");
                icon.textContent = "\u25B6";
              }
            }
          };
          header.addEventListener("click", handler);
          clickHandlers.push({ element: header, handler });
        });
        cleanupFunctions.push(() => {
          clickHandlers.forEach(({ element, handler }) => {
            element.removeEventListener("click", handler);
          });
        });
      };
      const getSortLabel = (sortType, direction) => {
        const labels = {
          "seo": "SEO Score",
          "ai": "AI Score",
          "title": "Title",
          "accessibility": "Accessibility"
        };
        return labels[sortType] || "Title";
      };
      const getSortIcon = (sortType, direction) => {
        const icons = {
          "seo": "trending_up",
          "ai": "psychology",
          "title": "title",
          "accessibility": "accessibility_new"
        };
        return icons[sortType] || "title";
      };
      const isSortActive = (sortType, direction) => {
        return currentSort === sortType && currentSortDirection === direction;
      };
      const stats = calculateStats(allPages);
      const showStats = currentSection === "overview";
      const showControls = currentSection !== "overview" && currentSection !== "keyword-research" && currentSection !== "link-map" && currentSection !== "drafts" && currentSection !== "schema" && currentSection !== "llms";
      const showPages = currentSection !== "overview" && currentSection !== "keyword-research" && currentSection !== "link-map" && currentSection !== "drafts" && currentSection !== "schema" && currentSection !== "llms";
      const showFilters = currentSection !== "overview" && currentSection !== "keyword-research" && currentSection !== "link-map" && currentSection !== "drafts" && currentSection !== "schema" && currentSection !== "llms";
      const summaryHtml = renderStats(stats, currentFilter, data.siteTechnicalSEO, data.siteAICrawlability, showFilters, currentSection, !showStats);
      const controlsHtml = showControls ? `
        <div class="page-list-controls">
          ${isLocalhost() && currentSection === "technical-issues" && stats.technicalSEO.brokenLinks > 0 ? `
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
          ` : ""}
          ${isLocalhost() && currentSection === "content-quality" && (stats.contentQuality.noExcerpt > 0 || stats.contentQuality.excerptTooShort > 0 || stats.contentQuality.excerptTooLong > 0) ? `
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
          ` : ""}
          <div class="page-list-controls__sort">
            <div class="page-list-sort">
              <button class="page-list-sort-toggle" id="page-list-sort-toggle" data-sort="${currentSort}" data-direction="${currentSortDirection}">
                <span class="page-list-sort-toggle__icon material-symbols-outlined">${getSortIcon(currentSort, currentSortDirection)}</span>
                <span class="page-list-sort-toggle__label">${getSortLabel(currentSort, currentSortDirection)}</span>
                <span class="page-list-sort-toggle__direction material-symbols-outlined">${currentSortDirection === "asc" ? "arrow_upward" : "arrow_downward"}</span>
              </button>
              <div class="page-list-sort-menu" id="page-list-sort-menu">
                <button class="page-list-sort-menu__item ${isSortActive("seo", "asc") ? "page-list-sort-menu__item--active" : ""}" data-sort="seo" data-direction="asc">
                  <span class="material-symbols-outlined">trending_up</span>
                  <span>SEO Score (Low to High)</span>
                  <span class="material-symbols-outlined">arrow_upward</span>
                </button>
                <button class="page-list-sort-menu__item ${isSortActive("seo", "desc") ? "page-list-sort-menu__item--active" : ""}" data-sort="seo" data-direction="desc">
                  <span class="material-symbols-outlined">trending_up</span>
                  <span>SEO Score (High to Low)</span>
                  <span class="material-symbols-outlined">arrow_downward</span>
                </button>
                <button class="page-list-sort-menu__item ${isSortActive("ai", "asc") ? "page-list-sort-menu__item--active" : ""}" data-sort="ai" data-direction="asc">
                  <span class="material-symbols-outlined">psychology</span>
                  <span>AI Score (Low to High)</span>
                  <span class="material-symbols-outlined">arrow_upward</span>
                </button>
                <button class="page-list-sort-menu__item ${isSortActive("ai", "desc") ? "page-list-sort-menu__item--active" : ""}" data-sort="ai" data-direction="desc">
                  <span class="material-symbols-outlined">psychology</span>
                  <span>AI Score (High to Low)</span>
                  <span class="material-symbols-outlined">arrow_downward</span>
                </button>
                <button class="page-list-sort-menu__item ${isSortActive("title", "asc") ? "page-list-sort-menu__item--active" : ""}" data-sort="title" data-direction="asc">
                  <span class="material-symbols-outlined">title</span>
                  <span>Title (A-Z)</span>
                  <span class="material-symbols-outlined">arrow_upward</span>
                </button>
                <button class="page-list-sort-menu__item ${isSortActive("title", "desc") ? "page-list-sort-menu__item--active" : ""}" data-sort="title" data-direction="desc">
                  <span class="material-symbols-outlined">title</span>
                  <span>Title (Z-A)</span>
                  <span class="material-symbols-outlined">arrow_downward</span>
                </button>
              </div>
            </div>
          </div>
          <div class="page-list-controls__layout">
            <button class="page-list-layout-toggle" id="page-list-layout-toggle" data-layout="${currentLayout}">
              <span class="page-list-layout-toggle__icon material-symbols-outlined">${currentLayout === "compact" ? "view_compact" : "view_list"}</span>
              <span class="page-list-layout-toggle__label">${currentLayout === "compact" ? "Compact" : "Normal"}</span>
            </button>
          </div>
          <div class="page-list-controls__grouping">
            <button class="page-list-grouping-toggle" id="page-list-grouping-toggle" data-grouping="${currentGrouping}">
              <span class="page-list-grouping-toggle__icon material-symbols-outlined">${currentGrouping === "ungrouped" ? "list" : "folder"}</span>
              <span class="page-list-grouping-toggle__label">${currentGrouping === "ungrouped" ? "Ungrouped" : "Grouped"}</span>
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
      ` : "";
      if (currentSection === "drafts") {
        const draftPages = filterPages(allPages, "drafts");
        const draftsHtml = renderDraftPages(draftPages);
        container.innerHTML = draftsHtml;
        attachDraftHandlers(draftPages);
        return;
      }
      if (currentSection === "schema") {
        const schemaHtml = renderSchemaSection(allPages);
        container.innerHTML = schemaHtml;
        attachSchemaValidationHandlers(allPages);
        return;
      }
      if (currentSection === "llms") {
        const llmsHtml = renderLLMSSection();
        container.innerHTML = llmsHtml;
        attachLLMSHandlers();
        return;
      }
      const filteredPages = filterPages(allPages, currentFilter);
      const pagesHtml = showPages ? currentGrouping === "grouped" ? renderGroupedPages(filteredPages, currentLayout === "compact", currentSort, currentSortDirection, currentFilter) : renderUngroupedPages(filteredPages, currentLayout === "compact", currentSort, currentSortDirection, currentFilter) : "";
      container.innerHTML = `
        ${summaryHtml}
        ${controlsHtml}
        ${showPages ? `<div class="page-list-pages ${currentLayout === "compact" ? "page-list-pages--compact" : ""}" id="page-list-pages">
          ${pagesHtml}
        </div>` : ""}
      `;
      setActiveFilterState(currentFilter);
      attachFilterListeners();
      attachRescanHandler();
      if (showControls) {
        attachLayoutToggle();
        attachGroupingToggle();
        attachSortToggle();
        updateFilteredPagesForExport(filteredPages);
        attachPageListExportHandlers();
        attachExportToggle();
      }
      if (showPages) {
        attachRowClickListeners();
        attachGroupToggleListeners();
        attachTooltipHandlers(container);
        if (currentSection === "technical-issues") {
          attachFixButtonHandler(allPages);
        }
        if (currentSection === "content-quality") {
          attachBulkGenerateExcerptsHandler(allPages);
        }
      }
      if (isLocalhost() && currentSection === "keyword-research") {
        attachCompetitorAnalysisHandlers(allPages);
        extractAndDisplaySiteKeywords(allPages);
      }
      if (isLocalhost() && currentSection === "link-map") {
        const linkMapContainer = document.getElementById("page-list-link-map-container");
        if (linkMapContainer) {
          renderLinkMap(linkMapContainer, allPages);
        }
      }
    }).catch((error) => {
      hideLoading();
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
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
      devError("Error loading page list:", error);
    });
  } catch (error) {
    devError("Error initializing page list:", error);
  }
}
async function extractSiteKeywords(pages) {
  const keywordMap = /* @__PURE__ */ new Map();
  const primaryKeywords = /* @__PURE__ */ new Set();
  const secondaryKeywords = /* @__PURE__ */ new Set();
  const longTailKeywords = /* @__PURE__ */ new Set();
  let totalDensity = 0;
  let totalRichness = 0;
  let totalPrimary = 0;
  let totalSecondary = 0;
  let totalLongTail = 0;
  const allRecommendations = [];
  let pagesAnalyzed = 0;
  try {
    const { analyzeKeywords: analyzeKeywords2 } = await Promise.resolve().then(() => (init_keyword_research(), keyword_research_exports));
    for (const page of pages) {
      const pageText = `${page.title} ${page.metaDescription ?? ""} ${page.summary ?? ""}`;
      const analysis = analyzeKeywords2(pageText, page.title, page.metaDescription ?? "");
      analysis.primaryKeywords.forEach((kw) => {
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
            type: "primary"
          });
        }
        const entry = keywordMap.get(key);
        entry.frequency += kw.frequency;
        if (!entry.pages.includes(page.relPermalink)) {
          entry.pages.push(page.relPermalink);
        }
        if (entry.density !== void 0 && kw.density !== void 0) {
          entry.density = (entry.density + kw.density) / 2;
        }
      });
      analysis.secondaryKeywords.forEach((kw) => {
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
              type: "secondary"
            });
          }
          const entry = keywordMap.get(key);
          entry.frequency += kw.frequency;
          if (!entry.pages.includes(page.relPermalink)) {
            entry.pages.push(page.relPermalink);
          }
        }
      });
      analysis.longTailKeywords.forEach((keyword) => {
        const key = keyword.toLowerCase();
        longTailKeywords.add(key);
        if (!keywordMap.has(key)) {
          keywordMap.set(key, {
            keyword,
            frequency: 0,
            pages: [],
            type: "long-tail"
          });
        }
        const entry = keywordMap.get(key);
        if (!entry.pages.includes(page.relPermalink)) {
          entry.pages.push(page.relPermalink);
        }
        if (entry.type === "other" || !primaryKeywords.has(key) && !secondaryKeywords.has(key)) {
          entry.type = "long-tail";
        }
      });
      totalDensity += analysis.keywordDensity;
      totalRichness += analysis.keywordRichness;
      totalPrimary += analysis.primaryKeywords.length;
      totalSecondary += analysis.secondaryKeywords.length;
      totalLongTail += analysis.longTailKeywords.length;
      analysis.recommendations.forEach((rec) => {
        allRecommendations.push({ text: rec.text, type: rec.type });
      });
      pagesAnalyzed++;
    }
    keywordMap.forEach((entry, key) => {
      if (entry.type === "primary" || entry.type === "secondary" || entry.type === "long-tail") {
        return;
      }
      const wordCount = entry.keyword.split(/\s+/).length;
      if (wordCount >= 3) {
        entry.type = "long-tail";
      } else {
        entry.type = "other";
      }
    });
  } catch (error) {
    devError("Error extracting site keywords:", error);
  }
  return {
    keywords: Array.from(keywordMap.values()),
    siteAnalysis: {
      totalKeywordDensity: pagesAnalyzed > 0 ? totalDensity / pagesAnalyzed : 0,
      totalKeywordRichness: pagesAnalyzed > 0 ? totalRichness / pagesAnalyzed : 0,
      totalPrimaryKeywords: totalPrimary,
      totalSecondaryKeywords: totalSecondary,
      totalLongTailKeywords: totalLongTail,
      recommendations: allRecommendations.slice(0, 10)
      // Top 10 recommendations
    }
  };
}
async function extractAndDisplaySiteKeywords(pages) {
  const keywordsList = document.getElementById("page-list-site-keywords-list");
  const totalStat = document.getElementById("page-list-keyword-stat-total");
  const uniqueStat = document.getElementById("page-list-keyword-stat-unique");
  if (!keywordsList) return;
  try {
    const result = await extractSiteKeywords(pages);
    const allKeywords = result.keywords;
    const siteAnalysis = result.siteAnalysis;
    const totalKeywords = allKeywords.reduce((sum, entry) => sum + entry.frequency, 0);
    const uniqueKeywords = allKeywords.length;
    if (totalStat) {
      totalStat.textContent = totalKeywords.toLocaleString();
    }
    if (uniqueStat) {
      uniqueStat.textContent = uniqueKeywords.toLocaleString();
    }
    if (allKeywords.length === 0) {
      keywordsList.innerHTML = '<p class="page-list-keyword-research__empty">No keywords found.</p>';
      return;
    }
    const getDensityClass2 = (density) => {
      if (!density) return "";
      if (density < 0.8) return "page-list-keyword-research__keyword-density--low";
      if (density >= 1.1 && density <= 1.9) return "page-list-keyword-research__keyword-density--optimal";
      if (density > 2.2) return "page-list-keyword-research__keyword-density--high";
      return "page-list-keyword-research__keyword-density--ok";
    };
    const keywordsByType = {
      primary: allKeywords.filter((k) => k.type === "primary"),
      secondary: allKeywords.filter((k) => k.type === "secondary"),
      "long-tail": allKeywords.filter((k) => k.type === "long-tail"),
      other: allKeywords.filter((k) => k.type === "other")
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
          ${siteAnalysis.recommendations.map((rec) => `
            <li class="page-list-keyword-research__recommendation page-list-keyword-research__recommendation--${rec.type}">
              ${escapeHtml(rec.text)}
            </li>
          `).join("")}
        </ul>
      </div>
      ` : ""}
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
      if (keywords.length === 0) return "";
      const typeLabel = type === "long-tail" ? "Long-Tail" : type.charAt(0).toUpperCase() + type.slice(1);
      return `
            <div class="page-list-keyword-research__keyword-column" data-keyword-type="${type}">
              <h4 class="page-list-keyword-research__keyword-column-title">
                <span class="material-symbols-outlined">${type === "primary" ? "star" : type === "secondary" ? "label" : type === "long-tail" ? "auto_awesome" : "tag"}</span>
                ${typeLabel} (${keywords.length})
              </h4>
              <ul class="page-list-keyword-research__keywords-list">
                ${keywords.map((kw) => `
                  <li class="page-list-keyword-research__keyword-item">
                    <span class="page-list-keyword-research__keyword-text">${escapeHtml(kw.keyword)}</span>
                    <div class="page-list-keyword-research__keyword-meta">
                      <span class="page-list-keyword-research__keyword-frequency">${kw.frequency}x</span>
                      ${kw.pages.length > 0 ? `<span class="page-list-keyword-research__keyword-pages">${kw.pages.length}p</span>` : ""}
                    </div>
                  </li>
                `).join("")}
              </ul>
            </div>
          `;
    }).join("")}
      </div>
    `;
    attachKeywordListHandlers(allKeywords);
  } catch (error) {
    devError("Error displaying site keywords:", error);
    keywordsList.innerHTML = '<p class="page-list-keyword-research__empty">Error loading keywords. Please refresh the page.</p>';
  }
}
function attachKeywordListHandlers(allKeywords) {
  const filterSelect = document.getElementById("page-list-keyword-filter");
  const sortSelect = document.getElementById("page-list-keyword-sort");
  const container = document.getElementById("page-list-keywords-list-container");
  if (!filterSelect || !sortSelect || !container) return;
  const renderKeywords = (filterType, sortType) => {
    let filtered = allKeywords;
    if (filterType !== "all") {
      filtered = allKeywords.filter((k) => k.type === filterType);
    }
    const [sortField, sortDirection] = sortType.split("-");
    filtered = [...filtered].sort((a, b) => {
      let aVal = 0;
      let bVal = 0;
      switch (sortField) {
        case "frequency":
          aVal = a.frequency;
          bVal = b.frequency;
          break;
        case "density":
          aVal = a.density ?? 0;
          bVal = b.density ?? 0;
          break;
        case "volume":
          aVal = a.volume ?? 0;
          bVal = b.volume ?? 0;
          break;
        case "pages":
          aVal = a.pages.length;
          bVal = b.pages.length;
          break;
        case "alphabetical":
          aVal = a.keyword.toLowerCase();
          bVal = b.keyword.toLowerCase();
          break;
        default:
          return 0;
      }
      if (sortField === "alphabetical") {
        return sortDirection === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortDirection === "desc" ? bVal - aVal : aVal - bVal;
    });
    const keywordsByType = {
      primary: filtered.filter((k) => k.type === "primary"),
      secondary: filtered.filter((k) => k.type === "secondary"),
      "long-tail": filtered.filter((k) => k.type === "long-tail"),
      other: filtered.filter((k) => k.type === "other")
    };
    const getDensityClass2 = (density) => {
      if (!density) return "";
      if (density < 0.8) return "page-list-keyword-research__keyword-density--low";
      if (density >= 1.1 && density <= 1.9) return "page-list-keyword-research__keyword-density--optimal";
      if (density > 2.2) return "page-list-keyword-research__keyword-density--high";
      return "page-list-keyword-research__keyword-density--ok";
    };
    container.innerHTML = Object.entries(keywordsByType).map(([type, keywords]) => {
      if (keywords.length === 0) return "";
      const typeLabel = type === "long-tail" ? "Long-Tail" : type.charAt(0).toUpperCase() + type.slice(1);
      return `
        <div class="page-list-keyword-research__keyword-column" data-keyword-type="${type}">
          <h4 class="page-list-keyword-research__keyword-column-title">
            <span class="material-symbols-outlined">${type === "primary" ? "star" : type === "secondary" ? "label" : type === "long-tail" ? "auto_awesome" : "tag"}</span>
            ${typeLabel} (${keywords.length})
          </h4>
          <ul class="page-list-keyword-research__keywords-list">
            ${keywords.map((kw) => `
              <li class="page-list-keyword-research__keyword-item">
                <span class="page-list-keyword-research__keyword-text">${escapeHtml(kw.keyword)}</span>
                <div class="page-list-keyword-research__keyword-meta">
                  <span class="page-list-keyword-research__keyword-frequency">${kw.frequency}x</span>
                  ${kw.pages.length > 0 ? `<span class="page-list-keyword-research__keyword-pages">${kw.pages.length}p</span>` : ""}
                </div>
              </li>
            `).join("")}
          </ul>
        </div>
      `;
    }).filter((html) => html !== "").join("");
  };
  renderKeywords(filterSelect.value, sortSelect.value);
  filterSelect.addEventListener("change", () => {
    renderKeywords(filterSelect.value, sortSelect.value);
  });
  sortSelect.addEventListener("change", () => {
    renderKeywords(filterSelect.value, sortSelect.value);
  });
}
function attachCompetitorAnalysisHandlers(pages) {
  const urlInput = document.getElementById("page-list-competitor-url-input");
  const addBtn = document.getElementById("page-list-add-competitor-btn");
  const competitorList = document.getElementById("page-list-competitor-list");
  const resultsSection = document.getElementById("page-list-keyword-research-results");
  const comparisonDiv = document.getElementById("page-list-keyword-comparison");
  if (!urlInput || !addBtn || !competitorList || !resultsSection || !comparisonDiv) return;
  const STORAGE_KEY2 = "page-list-competitors";
  const REMOVED_KEYWORDS_KEY = "page-list-removed-opportunity-keywords";
  const loadRemovedKeywords = () => {
    try {
      const stored = localStorage.getItem(REMOVED_KEYWORDS_KEY);
      if (stored) {
        return new Set(JSON.parse(stored));
      }
    } catch (error) {
      devError("Error loading removed keywords from storage:", error);
    }
    return /* @__PURE__ */ new Set();
  };
  const saveRemovedKeywords = (removedKeywords2) => {
    try {
      localStorage.setItem(REMOVED_KEYWORDS_KEY, JSON.stringify(Array.from(removedKeywords2)));
    } catch (error) {
      devError("Error saving removed keywords to storage:", error);
    }
  };
  const removedKeywords = loadRemovedKeywords();
  const loadCompetitors = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY2);
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.map((comp) => ({
          url: comp.url,
          keywords: comp.keywords,
          loading: false
        }));
      }
    } catch (error) {
      devError("Error loading competitors from storage:", error);
    }
    return [];
  };
  const saveCompetitors = () => {
    try {
      const toSave = competitors.filter((c) => !c.loading && c.keywords).map((c) => ({
        url: c.url,
        keywords: c.keywords
      }));
      localStorage.setItem(STORAGE_KEY2, JSON.stringify(toSave));
    } catch (error) {
      devError("Error saving competitors to storage:", error);
    }
  };
  const competitors = loadCompetitors();
  const renderCompetitorList = () => {
    if (competitors.length === 0) {
      competitorList.innerHTML = '<p class="page-list-keyword-research__empty">No competitors added yet.</p>';
      return;
    }
    competitorList.innerHTML = competitors.map((comp, index) => `
      <div class="page-list-keyword-research__competitor-item ${comp.loading ? "page-list-keyword-research__competitor-item--loading" : ""}">
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
    `).join("");
    competitorList.querySelectorAll(".page-list-keyword-research__competitor-remove").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const index = parseInt(e.currentTarget.getAttribute("data-index") || "0");
        competitors.splice(index, 1);
        saveCompetitors();
        renderCompetitorList();
        updateComparison(pages);
      });
    });
  };
  const analyzeCompetitor = async (url) => {
    try {
      let html;
      let lastError = null;
      try {
        const response = await fetch(url, {
          mode: "cors",
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
          }
        });
        if (response.ok) {
          html = await response.text();
          if (html && html.length > 0) {
            return await parseAndAnalyze(html);
          }
        } else {
          throw new Error(`HTTP ${response.status}`);
        }
      } catch (fetchError) {
        lastError = fetchError instanceof Error ? fetchError : new Error(String(fetchError));
      }
      const proxyServices = [
        `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
        `https://corsproxy.io/?${encodeURIComponent(url)}`,
        `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`
      ];
      for (const proxyUrl of proxyServices) {
        try {
          const proxyResponse = await fetch(proxyUrl, {
            method: "GET",
            headers: {
              "Accept": "application/json"
            }
          });
          if (!proxyResponse.ok) {
            continue;
          }
          const contentType = proxyResponse.headers.get("content-type") || "";
          if (contentType.includes("application/json")) {
            const proxyData = await proxyResponse.json();
            if (proxyData.contents) {
              html = proxyData.contents;
            } else if (proxyData.data) {
              html = proxyData.data;
            } else if (typeof proxyData === "string") {
              html = proxyData;
            } else {
              continue;
            }
          } else {
            html = await proxyResponse.text();
          }
          if (html && html.length > 100) {
            return await parseAndAnalyze(html);
          }
        } catch (proxyError) {
          continue;
        }
      }
      throw new Error(
        `Failed to fetch competitor page. CORS restrictions prevent direct access. All proxy services failed. To fix: Set up a local proxy server or use a browser extension that disables CORS. Original error: ${lastError?.message || "Unknown error"}`
      );
    } catch (error) {
      devError("Error analyzing competitor:", error);
      throw error;
    }
  };
  const parseAndAnalyze = async (html) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const title = doc.querySelector("title")?.textContent || "";
    const metaDescription = doc.querySelector('meta[name="description"]')?.getAttribute("content") || "";
    const bodyClone = doc.body.cloneNode(true);
    if (!bodyClone) {
      throw new Error("No body content found in HTML");
    }
    bodyClone.querySelectorAll("script, style, nav, header, footer, aside").forEach((el) => el.remove());
    const bodyText = bodyClone.textContent || "";
    if (!bodyText || bodyText.trim().length < 50) {
      throw new Error("Insufficient content extracted from page (less than 50 characters)");
    }
    const { analyzeKeywords: analyzeKeywords2 } = await Promise.resolve().then(() => (init_keyword_research(), keyword_research_exports));
    return analyzeKeywords2(bodyText, title, metaDescription);
  };
  const updateComparison = (sitePages) => {
    const analyzedCompetitors = competitors.filter((c) => c.keywords && !c.loading);
    const competitorStat = document.getElementById("page-list-keyword-stat-competitors");
    if (competitorStat) {
      competitorStat.textContent = analyzedCompetitors.length.toString();
    }
    if (analyzedCompetitors.length === 0) {
      resultsSection.style.display = "none";
      const opportunitiesStat2 = document.getElementById("page-list-keyword-stat-opportunities");
      if (opportunitiesStat2) {
        opportunitiesStat2.textContent = "-";
      }
      return;
    }
    resultsSection.style.display = "block";
    const competitorKeywords = /* @__PURE__ */ new Map();
    analyzedCompetitors.forEach((comp) => {
      if (!comp.keywords) {
        return;
      }
      const allKeywords = [
        ...comp.keywords.primaryKeywords || [],
        ...comp.keywords.secondaryKeywords || []
      ];
      allKeywords.forEach((kw) => {
        if (!kw || typeof kw !== "object" || !("keyword" in kw) || !("frequency" in kw)) {
          return;
        }
        const keyword = kw;
        const key = keyword.keyword.toLowerCase();
        if (!competitorKeywords.has(key)) {
          competitorKeywords.set(key, { count: 0, competitors: [] });
        }
        const entry = competitorKeywords.get(key);
        entry.count += keyword.frequency;
        if (!entry.competitors.includes(comp.url)) {
          entry.competitors.push(comp.url);
        }
      });
    });
    const siteKeywords = /* @__PURE__ */ new Map();
    sitePages.forEach((page) => {
      const pageKeywords = [
        ...page.title ? page.title.toLowerCase().split(/\s+/) : [],
        ...page.metaDescription ? page.metaDescription.toLowerCase().split(/\s+/) : []
      ];
      pageKeywords.forEach((kw) => {
        if (kw.length >= 3) {
          siteKeywords.set(kw, (siteKeywords.get(kw) || 0) + 1);
        }
      });
    });
    const opportunities = [];
    competitorKeywords.forEach((data, keyword) => {
      if (!siteKeywords.has(keyword) && keyword.length >= 3 && !removedKeywords.has(keyword.toLowerCase())) {
        opportunities.push({
          keyword,
          competitorCount: data.count,
          competitors: data.competitors
        });
      }
    });
    opportunities.sort((a, b) => b.competitorCount - a.competitorCount);
    const opportunitiesStat = document.getElementById("page-list-keyword-stat-opportunities");
    if (opportunitiesStat) {
      opportunitiesStat.textContent = opportunities.length.toString();
    }
    comparisonDiv.innerHTML = `
      <div class="page-list-keyword-research__opportunities">
        <h5 class="page-list-keyword-research__opportunities-title">
          Keywords Used by Competitors (Not on Your Site)
        </h5>
        <p class="page-list-keyword-research__opportunities-count">
          Found ${opportunities.length} potential keyword opportunity${opportunities.length !== 1 ? "ies" : ""}
          ${removedKeywords.size > 0 ? ` (${removedKeywords.size} removed)` : ""}
        </p>
        <div class="page-list-keyword-research__opportunities-list">
          ${opportunities.slice(0, 50).map((opp) => {
      const keywordId = opp.keyword.toLowerCase().replace(/[^a-zA-Z0-9]/g, "_");
      return `
            <div class="page-list-keyword-research__opportunity-item" data-opportunity-keyword-id="${keywordId}">
              <span class="page-list-keyword-research__opportunity-keyword">${escapeHtml(opp.keyword)}</span>
              <span class="page-list-keyword-research__opportunity-count">Used ${opp.competitorCount}x by ${opp.competitors.length} competitor${opp.competitors.length !== 1 ? "s" : ""}</span>
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
    }).join("")}
        </div>
      </div>
    `;
    const removeButtons = comparisonDiv.querySelectorAll(".page-list-keyword-research__opportunity-remove");
    removeButtons.forEach((button) => {
      button.addEventListener("click", (e) => {
        const keyword = e.currentTarget.getAttribute("data-opportunity-keyword");
        if (!keyword) return;
        const keywordLower = keyword.toLowerCase();
        const keywordId = keywordLower.replace(/[^a-zA-Z0-9]/g, "_");
        const opportunityItem = comparisonDiv.querySelector(`[data-opportunity-keyword-id="${keywordId}"]`);
        if (opportunityItem) {
          opportunityItem.style.transition = "opacity 0.3s ease, transform 0.3s ease";
          opportunityItem.style.opacity = "0";
          opportunityItem.style.transform = "scale(0.9)";
          setTimeout(() => {
            removedKeywords.add(keywordLower);
            saveRemovedKeywords(removedKeywords);
            updateComparison(sitePages);
            showToast(`Removed "${keyword}"`, "success", 2e3, "page-list");
          }, 300);
        }
      });
    });
  };
  addBtn.addEventListener("click", async () => {
    const url = urlInput.value.trim();
    if (!url) {
      showToast("Please enter a valid URL", "error", 3e3, "page-list");
      return;
    }
    try {
      new URL(url);
    } catch {
      showToast("Invalid URL format", "error", 3e3, "page-list");
      return;
    }
    if (competitors.some((c) => c.url === url)) {
      showToast("This competitor URL is already added", "info", 3e3, "page-list");
      return;
    }
    const competitor = { url, keywords: null, loading: true };
    competitors.push(competitor);
    urlInput.value = "";
    renderCompetitorList();
    try {
      showToast(`Analyzing ${url}...`, "info", 2e3, "page-list");
      competitor.keywords = await analyzeCompetitor(url);
      competitor.loading = false;
      saveCompetitors();
      renderCompetitorList();
      updateComparison(pages);
      showToast("Competitor analysis complete", "success", 3e3, "page-list");
    } catch (error) {
      competitor.loading = false;
      const index = competitors.indexOf(competitor);
      if (index > -1) {
        competitors.splice(index, 1);
      }
      saveCompetitors();
      renderCompetitorList();
      showToast(`Failed to analyze competitor: ${error instanceof Error ? error.message : "Unknown error"}`, "error", 5e3, "page-list");
    }
  });
  urlInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      addBtn.click();
    }
  });
  renderCompetitorList();
  if (competitors.length > 0) {
    updateComparison(pages);
  }
}

// ns-hugo-imp:C:\Users\maxim\Documents\Dev\arsrepairs.com\themes\arsrepairs-theme\assets\ts\modules\page-list-sidebar.ts
init_dom();
function initPageListSidebar() {
  if (!isLocalhost()) {
    return;
  }
  const sidebar = document.querySelector(".page-list-sidebar");
  const sidebarWrapper = document.querySelector(".page-list-sidebar-wrapper");
  const toggle = document.querySelector("[data-sidebar-toggle]");
  if (!sidebar || !toggle) {
    return;
  }
  const savedState = localStorage.getItem("page-list-sidebar-collapsed");
  const isCollapsed = savedState === "true";
  const isMobile2 = window.matchMedia("(max-width: 768px)").matches;
  if (isMobile2) {
    if (isCollapsed) {
      sidebar.classList.remove("page-list-sidebar--expanded");
      toggle.setAttribute("aria-expanded", "false");
      if (sidebarWrapper) sidebarWrapper.classList.add("page-list-sidebar-wrapper--collapsed");
    } else {
      sidebar.classList.add("page-list-sidebar--expanded");
      toggle.setAttribute("aria-expanded", "true");
      if (sidebarWrapper) sidebarWrapper.classList.remove("page-list-sidebar-wrapper--collapsed");
    }
  } else {
    if (isCollapsed) {
      if (sidebarWrapper) sidebarWrapper.classList.add("page-list-sidebar-wrapper--collapsed");
      sidebar.classList.add("page-list-sidebar--collapsed");
      toggle.setAttribute("aria-expanded", "false");
    } else {
      if (sidebarWrapper) sidebarWrapper.classList.remove("page-list-sidebar-wrapper--collapsed");
      sidebar.classList.remove("page-list-sidebar--collapsed");
      toggle.setAttribute("aria-expanded", "true");
    }
  }
  const icon = toggle.querySelector("[data-toggle-icon]");
  if (icon) {
    const isCurrentlyCollapsed = sidebarWrapper?.classList.contains("page-list-sidebar-wrapper--collapsed") || false;
    icon.textContent = isCurrentlyCollapsed ? "chevron_right" : "chevron_left";
  }
  toggle.addEventListener("click", () => {
    const isCurrentlyCollapsed = sidebarWrapper?.classList.contains("page-list-sidebar-wrapper--collapsed") || false;
    if (isMobile2) {
      const isExpanded = sidebar.classList.contains("page-list-sidebar--expanded");
      if (isExpanded) {
        sidebar.classList.remove("page-list-sidebar--expanded");
        toggle.setAttribute("aria-expanded", "false");
        if (icon) icon.textContent = "chevron_right";
        localStorage.setItem("page-list-sidebar-collapsed", "true");
      } else {
        sidebar.classList.add("page-list-sidebar--expanded");
        toggle.setAttribute("aria-expanded", "true");
        if (icon) icon.textContent = "chevron_left";
        localStorage.setItem("page-list-sidebar-collapsed", "false");
      }
    } else {
      if (isCurrentlyCollapsed) {
        sidebarWrapper?.classList.remove("page-list-sidebar-wrapper--collapsed");
        sidebar.classList.remove("page-list-sidebar--collapsed");
        toggle.setAttribute("aria-expanded", "true");
        if (icon) icon.textContent = "chevron_left";
        localStorage.setItem("page-list-sidebar-collapsed", "false");
      } else {
        sidebarWrapper?.classList.add("page-list-sidebar-wrapper--collapsed");
        sidebar.classList.add("page-list-sidebar--collapsed");
        toggle.setAttribute("aria-expanded", "false");
        if (icon) icon.textContent = "chevron_right";
        localStorage.setItem("page-list-sidebar-collapsed", "true");
      }
    }
  });
  let resizeTimer;
  const resizeHandler = () => {
    if (resizeTimer !== void 0) {
      clearTimeout(resizeTimer);
    }
    resizeTimer = window.setTimeout(() => {
      const isMobileNow = window.matchMedia("(max-width: 768px)").matches;
      if (!isMobileNow) {
        const saved = localStorage.getItem("page-list-sidebar-collapsed") === "true";
        if (saved) {
          sidebarWrapper?.classList.add("page-list-sidebar-wrapper--collapsed");
          sidebar.classList.add("page-list-sidebar--collapsed");
          toggle.setAttribute("aria-expanded", "false");
          if (icon) icon.textContent = "chevron_right";
        } else {
          sidebarWrapper?.classList.remove("page-list-sidebar-wrapper--collapsed");
          sidebar.classList.remove("page-list-sidebar--collapsed");
          toggle.setAttribute("aria-expanded", "true");
          if (icon) icon.textContent = "chevron_left";
        }
      }
    }, 250);
  };
  window.addEventListener("resize", resizeHandler, { passive: true });
}

// ns-hugo-imp:C:\Users\maxim\Documents\Dev\arsrepairs.com\themes\arsrepairs-theme\assets\ts\modules\toc.ts
var generateHeadingId = (text) => {
  return text.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^\w\-]/g, "").replace(/-+/g, "-").replace(/^-+|-+$/g, "");
};
var buildTOCFromDOM = () => {
  const tocContent = document.querySelector(".sidebar-widget__toc-content");
  if (!tocContent) return;
  const proseContent = document.querySelector(".prose");
  if (!proseContent) {
    const tocWidget2 = tocContent.closest(".sidebar-widget--toc");
    if (tocWidget2) {
      tocWidget2.style.display = "none";
    }
    return;
  }
  const headings = Array.from(proseContent.querySelectorAll("h2, h3, h4"));
  if (headings.length === 0) {
    const tocWidget2 = tocContent.closest(".sidebar-widget--toc");
    if (tocWidget2) {
      tocWidget2.style.display = "none";
    }
    return;
  }
  headings.forEach((heading) => {
    if (!heading.id) {
      const text = heading.textContent?.trim() || heading.innerText?.trim() || "";
      if (text) {
        heading.id = generateHeadingId(text);
      }
    } else {
      if (heading.id.includes("hahahugoshortcode") || heading.id.includes("hbhb")) {
        const text = heading.textContent?.trim() || heading.innerText?.trim() || "";
        if (text) {
          heading.id = generateHeadingId(text);
        }
      }
    }
  });
  const nav = tocContent.querySelector("#TableOfContents");
  if (!nav) return;
  const ul = nav.querySelector("ul");
  if (!ul) return;
  ul.innerHTML = "";
  const ulStack = [ul];
  const startLevel = 2;
  headings.forEach((heading) => {
    const level = parseInt(heading.tagName.substring(1), 10);
    const id = heading.id;
    const text = heading.textContent?.trim() || heading.innerText?.trim() || "";
    if (!id || !text) return;
    const relativeLevel = level - startLevel;
    const targetDepth = relativeLevel + 1;
    while (ulStack.length > targetDepth) {
      ulStack.pop();
    }
    while (ulStack.length < targetDepth) {
      const newUl = document.createElement("ul");
      const currentUl2 = ulStack[ulStack.length - 1];
      const lastLi = currentUl2.lastElementChild;
      if (lastLi) {
        lastLi.appendChild(newUl);
      } else {
        const li2 = document.createElement("li");
        li2.appendChild(newUl);
        currentUl2.appendChild(li2);
      }
      ulStack.push(newUl);
    }
    const currentUl = ulStack[ulStack.length - 1];
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.href = `#${id}`;
    a.textContent = text;
    li.appendChild(a);
    currentUl.appendChild(li);
  });
  const tocWidget = tocContent.closest(".sidebar-widget--toc");
  if (tocWidget) {
    tocWidget.style.display = "";
  }
};
var fixHeaderIds = () => {
  const headings = document.querySelectorAll("h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]");
  const idMap = /* @__PURE__ */ new Map();
  headings.forEach((heading) => {
    const oldId = heading.id;
    if (!oldId) return;
    if (oldId.includes("hahahugoshortcode") || oldId.includes("hbhb")) {
      const text = heading.textContent?.trim() || heading.innerText?.trim() || "";
      if (text) {
        const newId = generateHeadingId(text);
        if (newId && newId !== oldId) {
          idMap.set(oldId, newId);
          heading.id = newId;
        }
      }
    }
  });
  if (idMap.size > 0) {
    const tocLinks = document.querySelectorAll(".sidebar-widget__toc-content a[href^='#']");
    tocLinks.forEach((link) => {
      const href = link.getAttribute("href");
      if (!href) return;
      const targetId = href.substring(1);
      const newId = idMap.get(targetId);
      if (newId) {
        link.setAttribute("href", `#${newId}`);
      }
    });
    const allLinks = document.querySelectorAll("a[href^='#']");
    allLinks.forEach((link) => {
      const href = link.getAttribute("href");
      if (!href) return;
      const targetId = href.substring(1);
      const newId = idMap.get(targetId);
      if (newId) {
        link.setAttribute("href", `#${newId}`);
      }
    });
  }
};
var initTOC = () => {
  const tocWidgets = document.querySelectorAll(".sidebar-widget--toc");
  tocWidgets.forEach((widget) => {
    const toggle = widget.querySelector(".sidebar-widget__toc-toggle");
    const content = widget.querySelector(".sidebar-widget__toc-content");
    if (!toggle || !content) return;
    const handleToggle = () => {
      const isOpen = toggle.getAttribute("aria-expanded") === "true";
      const newState = !isOpen;
      toggle.setAttribute("aria-expanded", newState.toString());
      if (newState) {
        content.classList.add("is-open");
      } else {
        content.classList.remove("is-open");
      }
    };
    const setInitialState = () => {
      toggle.setAttribute("aria-expanded", "false");
      content.classList.remove("is-open");
    };
    setInitialState();
    const buildAndFix = () => {
      buildTOCFromDOM();
      fixHeaderIds();
    };
    setTimeout(() => {
      buildAndFix();
    }, 100);
    setTimeout(() => {
      buildAndFix();
    }, 1e3);
    if (document.readyState === "complete") {
      buildAndFix();
    } else {
      window.addEventListener("load", () => {
        setTimeout(buildAndFix, 500);
      });
    }
    let lastInteractionType = null;
    let interactionTimeout = null;
    let hasHandledInteraction = false;
    const handleInteraction = (e, interactionType) => {
      if (interactionTimeout) {
        clearTimeout(interactionTimeout);
      }
      if (interactionType === "click" && (lastInteractionType === "touch" || lastInteractionType === "pointer")) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      if (hasHandledInteraction && interactionType === lastInteractionType) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      lastInteractionType = interactionType;
      hasHandledInteraction = true;
      handleToggle();
      interactionTimeout = setTimeout(() => {
        lastInteractionType = null;
        hasHandledInteraction = false;
      }, 400);
    };
    if (window.PointerEvent) {
      toggle.addEventListener("pointerdown", (e) => {
        if (e.pointerType === "touch" || e.pointerType === "pen") {
          lastInteractionType = "pointer";
        }
      }, { passive: true });
      toggle.addEventListener("pointerup", (e) => {
        if (e.pointerType === "touch" || e.pointerType === "pen") {
          handleInteraction(e, "pointer");
        }
      });
    }
    let touchStartTime = 0;
    let touchStartTarget = null;
    toggle.addEventListener("touchstart", (e) => {
      lastInteractionType = "touch";
      touchStartTime = Date.now();
      touchStartTarget = e.target;
    }, { passive: true });
    toggle.addEventListener("touchend", (e) => {
      if (e.target !== touchStartTarget && e.target !== toggle) {
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      const touchDuration = Date.now() - touchStartTime;
      if (touchDuration < 500) {
        handleInteraction(e, "touch");
      }
      touchStartTime = 0;
      touchStartTarget = null;
    }, { passive: false });
    toggle.addEventListener("click", (e) => {
      handleInteraction(e, "click");
    });
    toggle.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleToggle();
      }
    });
  });
};

// ns-hugo-imp:C:\Users\maxim\Documents\Dev\arsrepairs.com\themes\arsrepairs-theme\assets\ts\modules\dev-score-bubble.ts
init_dom();
init_dev_ui();
init_keyword_research();
function getScoreClass2(score) {
  if (score >= 80) return "score-excellent";
  if (score >= 60) return "score-good";
  if (score >= 40) return "score-fair";
  return "score-poor";
}
function getAverageScore(seoScore, aiScore) {
  return Math.round((seoScore + aiScore) / 2);
}
function getPageIssues(page) {
  const issues = [];
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
  if (page.hasLangAttribute !== void 0 && !page.hasLangAttribute) {
    issues.push({ text: "Missing lang attribute", severity: "error" });
  }
  if (page.hasCanonical !== void 0 && !page.hasCanonical) {
    issues.push({ text: "Missing canonical URL", severity: "error" });
  }
  if (page.hasMixedContent && page.mixedContentIssues && page.mixedContentIssues > 0) {
    issues.push({
      text: `${page.mixedContentIssues} mixed content issue${page.mixedContentIssues > 1 ? "s" : ""} (HTTP on HTTPS)`,
      severity: "error"
    });
  }
  if (page.hasImagesWithoutAlt && page.imagesWithoutAlt > 0) {
    issues.push({
      text: `${page.imagesWithoutAlt} image${page.imagesWithoutAlt > 1 ? "s" : ""} without alt text`,
      severity: "warning"
    });
  }
  if (!page.hasH2s) {
    issues.push({ text: "No H2 headings", severity: "warning" });
  }
  if (page.hasSchemaMarkup !== void 0 && !page.hasSchemaMarkup) {
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
  if (page.internalLinksGood !== void 0 && !page.internalLinksGood) {
    if (page.internalLinksTooFew) {
      issues.push({ text: "Too few internal links", severity: "warning" });
    } else if (page.internalLinksTooMany) {
      issues.push({ text: "Too many internal links", severity: "warning" });
    }
  }
  if (page.firstParaGood !== void 0 && !page.firstParaGood) {
    issues.push({ text: "First paragraph too short or missing", severity: "warning" });
  }
  if (page.urlLengthGood !== void 0 && !page.urlLengthGood) {
    if (page.urlLengthOver && page.urlLength) {
      issues.push({ text: `URL too long (${page.urlLength} chars)`, severity: "warning" });
    }
  }
  if (page.outboundLinksGood !== void 0 && !page.outboundLinksGood) {
    if (page.outboundLinksTooFew) {
      issues.push({ text: "Too few outbound links", severity: "warning" });
    }
  }
  if (page.paragraphLengthGood !== void 0 && !page.paragraphLengthGood) {
    if (page.paragraphLengthIssues && page.paragraphLengthIssues > 0) {
      issues.push({
        text: `${page.paragraphLengthIssues} long paragraph${page.paragraphLengthIssues > 1 ? "s" : ""}`,
        severity: "warning"
      });
    }
  }
  if (page.subheadingDistributionGood !== void 0 && !page.subheadingDistributionGood) {
    issues.push({ text: "Poor subheading distribution", severity: "warning" });
  }
  if (page.mediaUsageGood !== void 0 && !page.mediaUsageGood) {
    if (page.mediaUsageTooFew) {
      issues.push({ text: "Too few images/media", severity: "warning" });
    }
  }
  if (page.hasDateInfo !== void 0 && !page.hasDateInfo) {
    issues.push({ text: "Missing date information (published/updated)", severity: "warning" });
  }
  if (page.hasMobileViewport !== void 0 && !page.hasMobileViewport) {
    issues.push({ text: "Missing mobile viewport meta tag", severity: "warning" });
  }
  if (page.socialMetaGood !== void 0 && !page.socialMetaGood) {
    const missingParts = [];
    if (page.hasOpenGraph !== void 0 && !page.hasOpenGraph) {
      missingParts.push("Open Graph (og:title, og:description, og:image)");
    }
    if (page.hasTwitterCard !== void 0 && !page.hasTwitterCard) {
      missingParts.push("Twitter Card (twitter:card)");
    }
    if (missingParts.length > 0) {
      issues.push({
        text: `Missing social media tags: ${missingParts.join(", ")}`,
        severity: "warning"
      });
    } else {
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
  if (page.hasSummary !== void 0) {
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
  if (page.readabilityGood !== void 0 && !page.readabilityGood) {
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
  if (page.hasLists !== void 0 && !page.hasLists) {
    issues.push({ text: "No lists (bulleted/numbered) - structure helps AI parsing", severity: "warning" });
  }
  if (page.hasBoldText !== void 0 && !page.hasBoldText) {
    issues.push({ text: "No bold text - emphasis helps AI identify key points", severity: "warning" });
  }
  if (page.hasCitations !== void 0 && !page.hasCitations) {
    issues.push({ text: "No citations/references - reduces E-E-A-T score", severity: "warning" });
  } else if (page.citationsGood !== void 0 && !page.citationsGood && page.citationCount !== void 0) {
    issues.push({ text: `Only ${page.citationCount} citation${page.citationCount !== 1 ? "s" : ""} - more would improve E-E-A-T`, severity: "warning" });
  }
  if (page.hasAuthor !== void 0 && !page.hasAuthor) {
    issues.push({ text: "Missing author information - reduces E-E-A-T score", severity: "warning" });
  }
  if (page.hasVideos !== void 0 && page.hasVideos && page.videoCount && page.videoCount > 0) {
    if (page.hasTranscript !== void 0 && !page.hasTranscript) {
      issues.push({ text: "Video(s) without transcript - AI can't access video content", severity: "warning" });
    }
  }
  if (page.isStale) {
    issues.push({ text: "Stale content (needs update) - freshness affects AI ranking", severity: "warning" });
  }
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
  if (page.hasFocusIndicators !== void 0 && page.hasFocusIndicators === false) {
    issues.push({ text: "Missing focus indicators", severity: "error" });
  }
  return issues;
}
function renderIssues(issues) {
  if (issues.length === 0) {
    return `
      <div class="dev-score-bubble__issues">
        <div class="dev-score-bubble__issues-header">
          <span class="dev-score-bubble__issues-title">Issues</span>
          <span class="dev-score-bubble__issues-count issues-count--success">0</span>
        </div>
        <div class="dev-score-bubble__issues-list">
          <div class="dev-score-bubble__issue-item issue-item--success">
            <span class="dev-score-bubble__issue-icon">\u2713</span>
            <span class="dev-score-bubble__issue-text">All good! Perfect scores possible.</span>
          </div>
        </div>
      </div>
    `;
  }
  const sortedIssues = [...issues].sort((a, b) => {
    if (a.severity === "error" && b.severity === "warning") return -1;
    if (a.severity === "warning" && b.severity === "error") return 1;
    return 0;
  });
  const errorIssues = sortedIssues.filter((i) => i.severity === "error");
  const warningIssues = sortedIssues.filter((i) => i.severity === "warning");
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
        ${displayedIssues.map((issue) => `
          <div class="dev-score-bubble__issue-item issue-item--${issue.severity}">
            <span class="dev-score-bubble__issue-icon">${issue.severity === "error" ? "\u2717" : "\u26A0"}</span>
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
function renderHighlightTools(page) {
  const tools = [];
  if (page.longSentences && page.longSentences.length > 0) {
    tools.push({
      id: "long-sentences",
      label: "Long Sentences",
      count: page.longSentences.length
    });
  }
  if (page.hasImagesWithoutAlt && page.imagesWithoutAlt > 0) {
    tools.push({
      id: "images-no-alt",
      label: "Images Without Alt Text",
      count: page.imagesWithoutAlt
    });
  }
  if (page.hasGenericAnchors && page.genericAnchorCount && page.genericAnchorCount > 0) {
    tools.push({
      id: "generic-anchors",
      label: "Generic Anchor Links",
      count: page.genericAnchorCount
    });
  }
  if (page.hasBrokenLinks && page.brokenLinks > 0) {
    tools.push({
      id: "broken-links",
      label: "Broken Links",
      count: page.brokenLinks
    });
  }
  if (page.hasGenericAltText && page.imagesWithGenericAlt && page.imagesWithGenericAlt > 0) {
    tools.push({
      id: "generic-alt-text",
      label: "Generic Alt Text",
      count: page.imagesWithGenericAlt
    });
  }
  if (page.hasMultipleH1 && page.h1Count > 1) {
    tools.push({
      id: "multiple-h1",
      label: "Multiple H1 Headings",
      count: page.h1Count
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
var CIRCUMFERENCE = 2 * Math.PI * 54;
function createCircularProgress(score, size = 120) {
  if (score === null || score === void 0 || typeof score !== "number" || isNaN(score)) {
    return `
      <svg class="dev-score-bubble__circle-svg" viewBox="0 0 120 120" width="${size}" height="${size}">
        <circle class="dev-score-bubble__circle-bg" cx="60" cy="60" r="54"></circle>
      </svg>
    `;
  }
  const scoreClass = getScoreClass2(score);
  const dashArray = score / 100 * CIRCUMFERENCE;
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
function createBubble(pageData) {
  const existingBubble = document.querySelector(".dev-score-bubble");
  if (existingBubble) {
    existingBubble.remove();
  }
  if (!pageData) {
    return;
  }
  const averageScore = getAverageScore(pageData.seoScore, pageData.aiCrawlabilityScore);
  const averageScoreClass = getScoreClass2(averageScore);
  const seoColorClass = getScoreClass2(pageData.seoScore);
  const aiColorClass = getScoreClass2(pageData.aiCrawlabilityScore);
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
          <button class="dev-score-bubble__minimize" aria-label="Minimize score bubble" title="Minimize">\u2212</button>
          <button class="dev-score-bubble__close" aria-label="Close score bubble" title="Close">\xD7</button>
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
        ${pageData.accessibilityScore !== void 0 && pageData.accessibilityScore !== null ? `
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
        ` : ""}
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
function highlightLongSentences(sentences) {
  if (!sentences || sentences.length === 0) return;
  removeLongSentenceHighlights();
  const mainContentElement = document.querySelector(".prose, main, .page-content") || document.body;
  const mainContent = mainContentElement instanceof HTMLElement ? mainContentElement : document.body;
  sentences.forEach((sentence, index) => {
    const normalizedSentence = sentence.trim().replace(/\s+/g, " ");
    highlightTextInElement(mainContent, normalizedSentence, index);
  });
}
function highlightTextInElement(element, searchText, index) {
  if (document.querySelector(`.dev-score-bubble__highlight[data-sentence-index="${index}"]`)) {
    return true;
  }
  if (element.tagName === "SCRIPT" || element.tagName === "STYLE" || element.classList.contains("dev-score-bubble") || element.closest(".dev-score-bubble")) {
    return false;
  }
  const children = Array.from(element.childNodes);
  let found = false;
  for (const node of children) {
    if (found) break;
    if (node.nodeType === Node.TEXT_NODE) {
      const textNode = node;
      const text = textNode.textContent || "";
      if (text.includes(searchText) && !found) {
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
            found = true;
          }
        });
        if (found) {
          parent.replaceChild(fragment, textNode);
          return true;
        }
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      if (highlightTextInElement(node, searchText, index)) {
        found = true;
        break;
      }
    }
  }
  return found;
}
function removeLongSentenceHighlights() {
  const highlights = document.querySelectorAll(".dev-score-bubble__highlight[data-highlight-type='long-sentences']");
  highlights.forEach((highlight) => {
    const parent = highlight.parentElement;
    if (parent && highlight.textContent) {
      const textNode = document.createTextNode(highlight.textContent);
      parent.replaceChild(textNode, highlight);
      parent.normalize();
    }
  });
}
function attachBubbleHandlers(bubble, pageData) {
  const closeButton = bubble.querySelector(".dev-score-bubble__close");
  const minimizeButton = bubble.querySelector(".dev-score-bubble__minimize");
  const minimized = bubble.querySelector(".dev-score-bubble__minimized");
  if (closeButton) {
    closeButton.addEventListener("click", (e) => {
      e.stopPropagation();
      bubble.remove();
      sessionStorage.setItem("dev-score-bubble-hidden", "true");
    });
  }
  if (minimizeButton) {
    minimizeButton.addEventListener("click", (e) => {
      e.stopPropagation();
      bubble.setAttribute("data-state", "minimized");
      sessionStorage.setItem("dev-score-bubble-expanded", "false");
    });
  }
  if (minimized) {
    minimized.addEventListener("click", (e) => {
      e.stopPropagation();
      bubble.setAttribute("data-state", "expanded-locked");
      sessionStorage.setItem("dev-score-bubble-expanded", "true");
    });
  }
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
  const expanded = sessionStorage.getItem("dev-score-bubble-expanded");
  if (expanded === "true") {
    bubble.setAttribute("data-state", "expanded-locked");
  }
  setupHighlightToggles(bubble, pageData);
  setupKeywordResearch(bubble, pageData);
  const observer = new MutationObserver(() => {
    if (!document.body.contains(bubble)) {
      removeAllHighlights();
      observer.disconnect();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
}
function setupHighlightToggles(bubble, pageData) {
  const toggles = bubble.querySelectorAll("[data-toggle]");
  toggles.forEach((toggle) => {
    const toggleType = toggle.getAttribute("data-toggle");
    if (!toggleType) return;
    const storageKey = `dev-score-bubble-highlight-${toggleType}`;
    const wasEnabled = sessionStorage.getItem(storageKey) === "true";
    if (wasEnabled) {
      toggle.checked = true;
      applyHighlight(toggleType, pageData, true);
    }
    toggle.addEventListener("change", (e) => {
      const target = e.target;
      applyHighlight(toggleType, pageData, target.checked);
      sessionStorage.setItem(storageKey, target.checked ? "true" : "false");
    });
  });
}
function applyHighlight(type, pageData, enabled) {
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
async function setupKeywordResearch(bubble, pageData) {
  const keywordBtn = bubble.querySelector("#dev-score-bubble-keyword-research");
  if (!keywordBtn) return;
  keywordBtn.addEventListener("click", async (e) => {
    e.stopPropagation();
    const originalContent = keywordBtn.innerHTML;
    keywordBtn.setAttribute("disabled", "true");
    keywordBtn.innerHTML = `
      <span class="material-symbols-outlined" style="animation: spin 1s linear infinite;" aria-hidden="true">hourglass_empty</span>
      <span>Analyzing...</span>
    `;
    try {
      await new Promise((resolve) => setTimeout(resolve, 100));
      const title = document.querySelector("title")?.textContent || pageData.title;
      const metaDescription = document.querySelector('meta[name="description"]')?.getAttribute("content") || "";
      const bodyText = document.body?.textContent || "";
      const bodyClone = document.body.cloneNode(true);
      let cleanText;
      if (bodyClone) {
        bodyClone.querySelectorAll("script, style, nav, header, footer, .dev-score-bubble, aside").forEach((el) => el.remove());
        cleanText = bodyClone.textContent || bodyText;
      } else {
        cleanText = bodyText;
      }
      const analysis = analyzeKeywords(cleanText, title, metaDescription);
      const gapAnalysis = void 0;
      const STORAGE_KEY2 = "page-list-competitors";
      let competitorKeywords = [];
      try {
        const stored = localStorage.getItem(STORAGE_KEY2);
        if (stored) {
          const parsed = JSON.parse(stored);
          competitorKeywords = parsed.filter((c) => c.keywords && !c.loading);
        }
      } catch (error) {
        console.warn("Could not load competitor keywords:", error);
      }
      keywordBtn.removeAttribute("disabled");
      keywordBtn.innerHTML = originalContent;
      const modalHtml = renderKeywordResearchModal(analysis, pageData.title, pageData.relPermalink, gapAnalysis, competitorKeywords);
      document.body.insertAdjacentHTML("beforeend", modalHtml);
      const keywordModal = document.getElementById("dev-keyword-research-modal");
      if (!keywordModal) return;
      const closeBtn = keywordModal.querySelector("#dev-keyword-research-close");
      const overlay = keywordModal.querySelector(".dev-score-bubble-modal-overlay");
      const modalClose = keywordModal.querySelector(".dev-score-bubble-modal-close");
      const closeModal2 = () => {
        keywordModal.remove();
      };
      if (closeBtn) closeBtn.addEventListener("click", closeModal2);
      if (overlay) overlay.addEventListener("click", closeModal2);
      if (modalClose) modalClose.addEventListener("click", closeModal2);
      const handleEscape = (e2) => {
        if (e2.key === "Escape" && keywordModal) {
          closeModal2();
          document.removeEventListener("keydown", handleEscape);
        }
      };
      document.addEventListener("keydown", handleEscape);
      attachSeedKeywordSearch(keywordModal);
      attachCompetitorKeywordRemoval(keywordModal);
      attachExportHandlers(keywordModal, analysis);
    } catch (error) {
      console.error("Error analyzing keywords:", error);
      keywordBtn.removeAttribute("disabled");
      keywordBtn.innerHTML = originalContent;
      showToast("Error analyzing keywords. Please try again.", "error", 5e3, "dev");
    }
  });
}
function removeHighlight(type) {
  if (type === "long-sentences") {
    removeLongSentenceHighlights();
    return;
  }
  const selector = `.dev-score-bubble__highlight[data-highlight-type="${type}"]`;
  const highlights = document.querySelectorAll(selector);
  highlights.forEach((highlight) => {
    if (highlight instanceof HTMLElement) {
      highlight.classList.remove("dev-score-bubble__highlight");
      highlight.classList.remove(`dev-score-bubble__highlight--${type.replace(/-/g, "-")}`);
      highlight.removeAttribute("data-highlight-type");
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
function removeAllHighlights() {
  const types = ["long-sentences", "images-no-alt", "generic-anchors", "broken-links", "generic-alt-text", "multiple-h1"];
  types.forEach((type) => removeHighlight(type));
}
function highlightImagesWithoutAlt() {
  const mainContent = document.querySelector(".prose, main, .page-content") || document.body;
  const images = mainContent.querySelectorAll("img:not([alt]), img[alt='']");
  images.forEach((img) => {
    if (img.classList.contains("dev-score-bubble__highlight")) return;
    const imgElement = img;
    imgElement.classList.add("dev-score-bubble__highlight", "dev-score-bubble__highlight--image-no-alt");
    imgElement.setAttribute("data-highlight-type", "images-no-alt");
    imgElement.style.cssText += `
      outline: 3px solid #ef4444 !important;
      outline-offset: 2px !important;
      box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.2) !important;
    `;
  });
}
function highlightGenericAnchors() {
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
function highlightBrokenLinks(brokenUrls) {
  const mainContent = document.querySelector(".prose, main, .page-content") || document.body;
  const links = mainContent.querySelectorAll("a[href]");
  links.forEach((link) => {
    const href = link.getAttribute("href") || "";
    const normalizedHref = href.split("#")[0];
    if (brokenUrls.some((brokenUrl) => {
      const normalizedBroken = brokenUrl.split("#")[0];
      return normalizedHref === normalizedBroken || normalizedHref.endsWith(normalizedBroken);
    })) {
      const linkElement = link;
      linkElement.classList.add("dev-score-bubble__highlight", "dev-score-bubble__highlight--broken-link");
      linkElement.setAttribute("data-highlight-type", "broken-links");
      linkElement.setAttribute("data-broken-url", href);
      linkElement.style.cssText += `
        background-color: #fee2e2 !important;
        border-bottom: 2px dashed #dc2626 !important;
        padding: 1px 2px !important;
        text-decoration: line-through !important;
      `;
      attachBrokenLinkHandler(linkElement, href);
    }
  });
}
function highlightGenericAltText() {
  const genericAlts = ["image", "img", "photo", "picture", "graphic", ""];
  const mainContent = document.querySelector(".prose, main, .page-content") || document.body;
  const images = mainContent.querySelectorAll("img[alt]");
  images.forEach((img) => {
    const alt = (img.getAttribute("alt") || "").trim().toLowerCase();
    if (genericAlts.includes(alt)) {
      const imgElement = img;
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
function highlightMultipleH1() {
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
function attachBrokenLinkHandler(link, brokenUrl) {
  const originalHref = link.href;
  link.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    showBrokenLinkContextMenu(link, brokenUrl, e);
  });
  link.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    e.stopPropagation();
    showBrokenLinkContextMenu(link, brokenUrl, e);
  });
  link.setAttribute("title", `Broken link: ${brokenUrl}
Click to fix, edit, or remove`);
}
function showBrokenLinkContextMenu(link, brokenUrl, event) {
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
      <button class="dev-score-bubble__broken-link-menu-close" aria-label="Close menu" type="button">\xD7</button>
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
  const linkRect = link.getBoundingClientRect();
  const menuRect = menu.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  let left = linkRect.left + linkRect.width / 2 - menuRect.width / 2;
  let top = linkRect.bottom + 8;
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
  const closeBtn = menu.querySelector(".dev-score-bubble__broken-link-menu-close");
  const fixBtn = menu.querySelector('[data-action="fix"]');
  const editBtn = menu.querySelector('[data-action="edit"]');
  const removeBtn = menu.querySelector('[data-action="remove"]');
  let clickHandlerRef = null;
  const closeMenu = () => {
    menu.remove();
    if (clickHandlerRef) {
      document.removeEventListener("click", clickHandlerRef);
      clickHandlerRef = null;
    }
    document.removeEventListener("keydown", handleEscape);
  };
  const handleOutsideClick = (e) => {
    const target = e.target;
    const isModal = target?.closest(".dev-score-bubble-modal, .dev-score-bubble-modal-overlay");
    if (!menu.contains(target) && !link.contains(target) && !isModal) {
      closeMenu();
    }
  };
  const handleEscape = (e) => {
    if (e.key === "Escape") {
      closeMenu();
    }
  };
  closeBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    closeMenu();
  });
  clickHandlerRef = (e) => {
    handleOutsideClick(e);
  };
  setTimeout(() => {
    if (clickHandlerRef) {
      document.addEventListener("click", clickHandlerRef);
    }
  }, 100);
  document.addEventListener("keydown", handleEscape);
  fixBtn?.addEventListener("click", async (e) => {
    e.stopPropagation();
    closeMenu();
    const confirmed = await createConfirmationDialog(
      "Auto-Fix Broken Link",
      `Attempt to automatically fix the broken link "${brokenUrl}"?

This will search for a matching URL and update the link if found.`,
      "Fix Link",
      "Cancel",
      "dev"
    );
    if (confirmed) {
      await handleFixBrokenLink(link, brokenUrl);
    }
  });
  editBtn?.addEventListener("click", async (e) => {
    e.stopPropagation();
    closeMenu();
    const confirmed = await createConfirmationDialog(
      "Edit Broken Link",
      `Edit the URL for the broken link "${brokenUrl}"?

You will be prompted to enter a new URL.`,
      "Edit Link",
      "Cancel",
      "dev"
    );
    if (confirmed) {
      await handleEditBrokenLink(link, brokenUrl);
    }
  });
  removeBtn?.addEventListener("click", async (e) => {
    e.stopPropagation();
    closeMenu();
    const confirmed = await createConfirmationDialog(
      "Remove Broken Link",
      `Remove the link "${brokenUrl}" and keep only the text?

Text: "${link.textContent?.trim() || ""}"

A backup will be created before making changes.`,
      "Remove Link",
      "Cancel",
      "dev"
    );
    if (confirmed) {
      await handleRemoveBrokenLink(link, brokenUrl);
    }
  });
}
async function handleFixBrokenLink(link, brokenUrl) {
  if (!isLocalhost()) {
    await createConfirmationDialog(
      "Development Mode Only",
      "This feature is only available in development mode.",
      "OK",
      void 0,
      // No cancel button for info messages
      "dev"
    );
    return;
  }
  if ("showDirectoryPicker" in window && !getSiteRootDirectoryHandle()) {
    const accessGranted = await createConfirmationDialog(
      "Select Site Root Folder",
      'To fix broken links, you need to select your Hugo site root folder.\n\nClick "Select Folder" below, then navigate to and select the folder that contains your "content" folder.\n\nExample: If your site is at /Users/you/my-site/, select that folder.\n\nThis permission is only requested once per browser session.',
      "Select Folder",
      "Skip (Use Manual File Selection)",
      "dev"
    );
    if (accessGranted) {
      const dirHandle = await requestSiteRootAccess();
      if (!dirHandle) {
        showToast("You can still manually select the file when prompted.", "info", 5e3, "dev");
      } else {
        showToast("Directory access granted!", "success", 5e3, "dev");
      }
    } else {
      showToast("You can manually select the file when prompted.", "info", 5e3, "dev");
    }
  } else if (!("showDirectoryPicker" in window)) {
    showToast("File System Access API not supported. You can manually select the file when prompted.", "info", 5e3, "dev");
  }
  try {
    const response = await fetch("/page-list/index.json");
    if (!response.ok) {
      throw new Error("Could not fetch page data");
    }
    const data = await response.json();
    const allPagePaths = data.pages.map((p) => p.relPermalink);
    const match = findUrlMatch2(brokenUrl, allPagePaths, data.pages);
    if (match) {
      if (link.tagName === "A") {
        link.href = match.match;
        link.classList.remove("dev-score-bubble__highlight--broken-link");
        link.removeAttribute("data-broken-url");
        link.style.textDecoration = "";
        link.style.backgroundColor = "";
        link.style.borderBottom = "";
        showToast(`Link fixed: ${brokenUrl} \u2192 ${match.match}`, "success", 5e3, "dev");
        await updateLinkInSourceFile(brokenUrl, match.match);
      }
    } else {
      showToast(`No match found for: ${brokenUrl}`, "error", 5e3, "dev");
    }
  } catch (error) {
    console.error("Error fixing broken link:", error);
    showToast(`Error fixing link: ${error instanceof Error ? error.message : "Unknown error"}`, "error", 5e3, "dev");
  }
}
async function handleEditBrokenLink(link, brokenUrl) {
  if (!isLocalhost()) {
    await createConfirmationDialog(
      "Development Mode Only",
      "This feature is only available in development mode.",
      "OK",
      void 0,
      // No cancel button for info messages
      "dev"
    );
    return;
  }
  if ("showDirectoryPicker" in window && !getSiteRootDirectoryHandle()) {
    const accessGranted = await createConfirmationDialog(
      "Select Site Root Folder",
      'To edit broken links, you need to select your Hugo site root folder.\n\nClick "Select Folder" below, then navigate to and select the folder that contains your "content" folder.\n\nExample: If your site is at /Users/you/my-site/, select that folder.\n\nThis permission is only requested once per browser session.',
      "Select Folder",
      "Skip (Use Manual File Selection)"
    );
    if (accessGranted) {
      const dirHandle = await requestSiteRootAccess();
      if (!dirHandle) {
        showToast("You can still manually select the file when prompted.", "info", 5e3, "dev");
      } else {
        showToast("Directory access granted!", "success", 5e3, "dev");
      }
    } else {
      showToast("You can manually select the file when prompted.", "info", 5e3, "dev");
    }
  } else if (!("showDirectoryPicker" in window)) {
    showToast("File System Access API not supported. You can manually select the file when prompted.", "info", 5e3, "dev");
  }
  const newUrl = await createUrlInputDialog("Enter new URL:", brokenUrl, "dev");
  if (newUrl && newUrl !== brokenUrl && link.tagName === "A") {
    const sourceUpdated = await updateLinkInSourceFile(brokenUrl, newUrl);
    if (sourceUpdated) {
      link.href = newUrl;
      link.classList.remove("dev-score-bubble__highlight--broken-link");
      link.removeAttribute("data-broken-url");
      link.style.textDecoration = "";
      link.style.backgroundColor = "";
      link.style.borderBottom = "";
      showToast(`Link updated in source file: ${brokenUrl} \u2192 ${newUrl}`, "success");
    } else {
      link.href = newUrl;
      link.classList.remove("dev-score-bubble__highlight--broken-link");
      link.removeAttribute("data-broken-url");
      link.style.textDecoration = "";
      link.style.backgroundColor = "";
      link.style.borderBottom = "";
      showToast(`Link updated on page (source file not updated): ${brokenUrl} \u2192 ${newUrl}`, "info");
    }
  }
}
async function handleRemoveBrokenLink(link, brokenUrl) {
  if (!isLocalhost()) {
    await createConfirmationDialog(
      "Development Mode Only",
      "This feature is only available in development mode.",
      "OK",
      void 0,
      // No cancel button for info messages
      "dev"
    );
    return;
  }
  if ("showDirectoryPicker" in window && !getSiteRootDirectoryHandle()) {
    const accessGranted = await createConfirmationDialog(
      "Select Site Root Folder",
      'To update source files, you need to select your Hugo site root folder.\n\nClick "Select Folder" below, then navigate to and select the folder that contains your "content" folder.\n\nExample: If your site is at /Users/you/my-site/, select that folder.\n\nThis permission is only requested once per browser session.',
      "Select Folder",
      "Skip (Use Manual File Selection)",
      "dev"
    );
    if (accessGranted) {
      const dirHandle = await requestSiteRootAccess(
        (msg) => showToast(msg, "success", 5e3, "dev"),
        (msg) => showToast(msg, "error", 5e3, "dev")
      );
      if (!dirHandle) {
        showToast("You can still manually select the file when prompted.", "info", 5e3, "dev");
      }
    } else {
      showToast("You can manually select the file when prompted.", "info", 5e3, "dev");
    }
  } else if (!("showDirectoryPicker" in window)) {
    showToast("File System Access API not supported. You can manually select the file when prompted.", "info", 5e3, "dev");
  }
  try {
    const text = link.textContent || "";
    const sourceUpdated = await removeLinkFromSourceFile(brokenUrl);
    if (sourceUpdated) {
      const parent = link.parentElement;
      if (parent) {
        const textNode = document.createTextNode(text);
        parent.replaceChild(textNode, link);
        const highlights = document.querySelectorAll(`.dev-score-bubble__highlight--broken-link[data-broken-url="${brokenUrl}"]`);
        highlights.forEach((h) => {
          h.classList.remove("dev-score-bubble__highlight--broken-link");
          h.removeAttribute("data-broken-url");
          h.style.textDecoration = "";
          h.style.backgroundColor = "";
          h.style.borderBottom = "";
        });
      }
      showToast(`Link removed from source file, text kept: "${text}"`, "success");
    } else {
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
function findUrlMatch2(brokenUrl, allPagePaths, allPages) {
  const brokenPath = brokenUrl.split("#")[0];
  const brokenLower = brokenPath.toLowerCase();
  const brokenNoSlash = brokenPath.replace(/\/$/, "");
  const brokenNoHtml = brokenPath.replace(/\.html$/, "");
  for (const path of allPagePaths) {
    if (path.toLowerCase() === brokenLower) {
      return { match: path, reason: "Exact match (case-insensitive)" };
    }
  }
  for (const path of allPagePaths) {
    const pathNoSlash = path.replace(/\/$/, "");
    if (pathNoSlash === brokenNoSlash || path === brokenNoSlash || pathNoSlash === brokenPath) {
      return { match: path, reason: "Exact match (trailing slash difference)" };
    }
  }
  for (const path of allPagePaths) {
    const pathNoHtml = path.replace(/\.html$/, "");
    if (pathNoHtml === brokenNoHtml || path === brokenNoHtml || pathNoHtml === brokenPath) {
      return { match: path, reason: "Exact match (.html extension difference)" };
    }
  }
  const sections = /* @__PURE__ */ new Set();
  if (allPages) {
    allPages.forEach((page) => {
      if (page.relPermalink.includes("/") && page.relPermalink !== "/") {
        const section = page.relPermalink.split("/")[1];
        if (section) {
          sections.add(section);
        }
      }
    });
  }
  const commonSections = ["blog", "our-services", "service-areas", "about-us", "brands-we-serve"];
  commonSections.forEach((s) => sections.add(s));
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
function getCurrentPageContentFile() {
  let currentPath = window.location.pathname;
  if (currentPath !== "/" && currentPath.endsWith("/")) {
    currentPath = currentPath.slice(0, -1);
  }
  console.log("Current page path:", currentPath);
  const possiblePaths = relPermalinkToContentFile(currentPath);
  console.log("Possible file paths:", possiblePaths);
  return possiblePaths;
}
async function updateLinkInSourceFile(oldUrl, newUrl) {
  try {
    const possiblePaths = getCurrentPageContentFile();
    let filePath = await findActualFilePath(possiblePaths, true);
    if (!filePath) {
      console.warn("Could not find source file for current page. Tried:", possiblePaths);
      if ("showOpenFilePicker" in window) {
        const tryManual = await createConfirmationDialog(
          "Select Source File",
          `Could not automatically find the source file.

Expected paths:
${possiblePaths.map((p) => `  \u2022 ${p}`).join("\n")}

Would you like to manually select the markdown file?`,
          "Select File",
          "Cancel",
          "dev"
        );
        if (tryManual) {
          try {
            const fileHandles = await window.showOpenFilePicker({
              types: [{
                description: "Markdown files",
                accept: { "text/markdown": [".md"] }
              }],
              excludeAcceptAllOption: false,
              multiple: false
            });
            if (fileHandles && fileHandles.length > 0) {
              const fileHandle = fileHandles[0];
              const file = await fileHandle.getFile();
              const content = await file.text();
              console.log("User manually selected file:", file.name);
              const escapedOldUrl2 = escapeRegex(oldUrl);
              let modifiedContent2 = content;
              let modified2 = false;
              const markdownPattern2 = new RegExp(`(\\[[^\\]]+\\]\\()${escapedOldUrl2}([^)]*\\))`, "g");
              modifiedContent2 = modifiedContent2.replace(markdownPattern2, (match, prefix, suffix) => {
                modified2 = true;
                return `${prefix}${newUrl}${suffix}`;
              });
              const htmlPattern2 = new RegExp(`(href=["'])${escapedOldUrl2}(["'])`, "gi");
              modifiedContent2 = modifiedContent2.replace(htmlPattern2, (match, prefix, suffix) => {
                modified2 = true;
                return `${prefix}${newUrl}${suffix}`;
              });
              if (!modified2) {
                showToast("Link not found in selected file content", "info", 5e3, "dev");
                return false;
              }
              try {
                const backupFile = await fileHandle.getFile();
                const backupContent = await backupFile.text();
                const backupPath2 = createBackupFilename(file.name);
                console.log("Would create backup at:", backupPath2);
              } catch (backupError) {
                console.warn("Could not create backup file:", backupError);
              }
              try {
                const writable = await fileHandle.createWritable();
                await writable.write(modifiedContent2);
                await writable.close();
                showToast(`Link updated in ${file.name}`, "success", 5e3, "dev");
                return true;
              } catch (writeError) {
                console.error("Error writing to manually selected file:", writeError);
                showToast(`Error writing file: ${writeError instanceof Error ? writeError.message : "Unknown error"}`, "error", 5e3, "dev");
                return false;
              }
            }
          } catch (pickerError) {
            if (pickerError.name !== "AbortError") {
              console.error("File picker error:", pickerError);
              showToast(`File picker error: ${pickerError instanceof Error ? pickerError.message : "Unknown error"}`, "error", 5e3, "dev");
            }
          }
        }
      }
      await createConfirmationDialog(
        "Could Not Find Source File",
        `Could not automatically find the source file.

Tried:
${possiblePaths.map((p) => `  \u2022 ${p}`).join("\n")}

To fix this:
1. Grant File System Access when prompted (select your site root directory)
2. Use the manual file selection option when offered`,
        "OK",
        void 0,
        // Single button for info
        "dev"
      );
      return false;
    }
    const fileData = await readFileContent(filePath, true);
    if (!fileData) {
      console.warn(`Could not read file: ${filePath}`);
      showToast(`Could not read file: ${filePath}`, "error", 5e3, "dev");
      return false;
    }
    const escapedOldUrl = escapeRegex(oldUrl);
    let modifiedContent = fileData.content;
    let modified = false;
    const markdownPattern = new RegExp(`(\\[[^\\]]+\\]\\()${escapedOldUrl}([^)]*\\))`, "g");
    modifiedContent = modifiedContent.replace(markdownPattern, (match, prefix, suffix) => {
      modified = true;
      return `${prefix}${newUrl}${suffix}`;
    });
    const htmlPattern = new RegExp(`(href=["'])${escapedOldUrl}(["'])`, "gi");
    modifiedContent = modifiedContent.replace(htmlPattern, (match, prefix, suffix) => {
      modified = true;
      return `${prefix}${newUrl}${suffix}`;
    });
    if (!modified) {
      console.warn("No matches found in file");
      return false;
    }
    const backupPath = createBackupFilename(filePath);
    const backupCreated = await writeFileContent(backupPath, fileData.content);
    if (!backupCreated) {
      console.warn(`Could not create backup: ${backupPath}`);
    }
    const writeSuccess = await writeFileContent(filePath, modifiedContent);
    if (writeSuccess) {
      console.log(`\u2705 Updated link in ${filePath}${backupCreated ? ` (backup: ${backupPath})` : ""}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error("Error updating link in source file:", error);
    return false;
  }
}
async function removeLinkFromSourceFile(url) {
  try {
    const siteRootHandle = getSiteRootDirectoryHandle();
    if (!siteRootHandle) {
      console.log("No directory access available, will offer manual file selection");
    }
    let filePath = null;
    if (siteRootHandle) {
      try {
        await siteRootHandle.getDirectoryHandle("content", { create: false });
        console.log("\u2705 Directory access verified - content folder is accessible");
        const possiblePaths = getCurrentPageContentFile();
        console.log("Looking for file in paths:", possiblePaths);
        filePath = await findActualFilePath(possiblePaths, true);
        if (filePath) {
          console.log("\u2705 File found automatically:", filePath);
        } else {
          console.warn("Could not find source file automatically. Tried:", possiblePaths);
        }
      } catch (verifyError) {
        console.error("\u274C Directory access verification failed:", verifyError);
        showToast("Directory access was lost. Please grant access again.", "error", 5e3, "dev");
        setSiteRootDirectoryHandle(null);
      }
    } else {
      console.log("No directory access available - will offer manual file selection");
    }
    if (!filePath) {
      const possiblePaths = getCurrentPageContentFile();
      if ("showOpenFilePicker" in window) {
        const tryManual = await createConfirmationDialog(
          "Select Source File",
          `Could not automatically find the source file.

Expected paths:
${possiblePaths.map((p) => `  \u2022 ${p}`).join("\n")}

Would you like to manually select the markdown file?`,
          "Select File",
          "Cancel",
          "dev"
        );
        if (tryManual) {
          try {
            const fileHandles = await window.showOpenFilePicker({
              types: [{
                description: "Markdown files",
                accept: { "text/markdown": [".md"] }
              }],
              excludeAcceptAllOption: false,
              multiple: false
            });
            if (fileHandles && fileHandles.length > 0) {
              const fileHandle = fileHandles[0];
              const file = await fileHandle.getFile();
              const content = await file.text();
              console.log("User manually selected file:", file.name);
              const removalResult2 = removeLinkFromContent(content, url);
              if (removalResult2.changes.length === 0) {
                showToast("Link not found in selected file content", "info");
                return false;
              }
              const backupContent = content;
              try {
                const writable = await fileHandle.createWritable();
                await writable.write(removalResult2.content);
                await writable.close();
                try {
                  const backupFileName = `${file.name}.backup-${(/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-").slice(0, -5)}`;
                  console.log(`\u2705 Modified file: ${file.name} (backup would be: ${backupFileName})`);
                } catch (backupError) {
                  console.warn("Could not create backup file:", backupError);
                }
                showToast(`Link removed from ${file.name}`, "success");
                return true;
              } catch (writeError) {
                console.error("Error writing to manually selected file:", writeError);
                showToast(`Error writing file: ${writeError instanceof Error ? writeError.message : "Unknown error"}`, "error");
                return false;
              }
            }
          } catch (pickerError) {
            if (pickerError.name !== "AbortError") {
              console.error("File picker error:", pickerError);
              showToast(`File picker error: ${pickerError instanceof Error ? pickerError.message : "Unknown error"}`, "error");
            }
          }
        }
      }
      await createConfirmationDialog(
        "Could Not Find Source File",
        `Could not automatically find the source file.

Tried:
${possiblePaths.map((p) => `  \u2022 ${p}`).join("\n")}

To fix this:
1. Grant File System Access when prompted (select your site root directory)
2. Use the manual file selection option when offered`,
        "OK",
        void 0,
        // Single button for info
        "dev"
      );
      return false;
    }
    console.log("Found source file:", filePath);
    const fileData = await readFileContent(filePath, true);
    if (!fileData) {
      console.warn(`Could not read file: ${filePath}`);
      showToast(`Could not read file: ${filePath}`, "error", 5e3, "dev");
      return false;
    }
    const normalizedUrl = url.split("#")[0].replace(/\/$/, "");
    const urlVariations = [
      url,
      // Original
      normalizedUrl,
      // Without trailing slash
      url + "/",
      // With trailing slash
      normalizedUrl + "/"
      // Normalized with trailing slash
    ];
    let removalResult = null;
    let matchedUrl = null;
    for (const urlVar of urlVariations) {
      removalResult = removeLinkFromContent(fileData.content, urlVar);
      if (removalResult.changes.length > 0) {
        matchedUrl = urlVar;
        console.log(`Found link with URL variation: ${urlVar}`);
        break;
      }
    }
    if (!removalResult || removalResult.changes.length === 0) {
      console.warn("Link not found in file content. Tried URL variations:", urlVariations);
      console.log("File content preview:", fileData.content.substring(0, 500));
      showToast(`Link not found in file content. URL: ${url}`, "info");
      return false;
    }
    console.log(`Removing link: ${matchedUrl} (${removalResult.changes.length} occurrence(s))`);
    const backupPath = createBackupFilename(filePath);
    console.log("Creating backup:", backupPath);
    const backupCreated = await writeFileContent(backupPath, fileData.content);
    if (!backupCreated) {
      console.warn(`Could not create backup: ${backupPath}`);
      showToast(`Warning: Could not create backup file`, "error");
    } else {
      console.log("\u2705 Backup created:", backupPath);
    }
    console.log("Writing modified content to:", filePath);
    const writeSuccess = await writeFileContent(filePath, removalResult.content);
    if (writeSuccess) {
      console.log(`\u2705 Removed link from ${filePath}${backupCreated ? ` (backup: ${backupPath})` : ""}`);
      if (backupCreated) {
        showToast(`Link removed. Backup: ${backupPath.split("/").pop()}`, "success");
      } else {
        showToast("Link removed from source file", "success");
      }
      return true;
    }
    console.error(`Failed to write file: ${filePath}`);
    showToast(`Could not write file: ${filePath}`, "error");
    return false;
  } catch (error) {
    console.error("Error removing link from source file:", error);
    showToast(`Error: ${error instanceof Error ? error.message : "Unknown error"}`, "error");
    return false;
  }
}
async function fetchPageData() {
  try {
    const response = await fetch("/page-list/index.json");
    if (!response.ok) {
      console.warn("Dev Score Bubble: Could not fetch page data", response.status, response.statusText);
      return null;
    }
    const data = await response.json();
    const currentPath = window.location.pathname;
    if (isLocalhost()) {
      console.log("Dev Score Bubble: Current path:", currentPath);
      console.log("Dev Score Bubble: Total pages in JSON:", data.pages.length);
    }
    const currentPage = data.pages.find((page) => {
      if (currentPath === "/" && (page.relPermalink === "/" || page.relPermalink === "")) {
        return true;
      }
      const normalizePath = (path) => {
        if (path === "/" || path === "") return "/";
        return path.endsWith("/") ? path.slice(0, -1) : path;
      };
      const pagePath = normalizePath(page.relPermalink);
      const currentPathNormalized = normalizePath(currentPath);
      if (pagePath === currentPathNormalized) {
        if (isLocalhost()) {
          console.log("Dev Score Bubble: Found exact match:", page.relPermalink, "for path:", currentPath);
        }
        return true;
      }
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
      const similarPages = data.pages.filter((page) => {
        const pagePath = page.relPermalink.endsWith("/") && page.relPermalink !== "/" ? page.relPermalink.slice(0, -1) : page.relPermalink;
        const currentPathNormalized = currentPath.endsWith("/") && currentPath !== "/" ? currentPath.slice(0, -1) : currentPath;
        return pagePath.includes(currentPathNormalized) || currentPathNormalized.includes(pagePath);
      });
      if (similarPages.length > 0) {
        console.warn("Dev Score Bubble: No exact match found. Similar pages:", similarPages.map((p) => p.relPermalink));
      } else {
        console.warn("Dev Score Bubble: No matching page found for:", currentPath);
        console.warn("Dev Score Bubble: Available pages (first 10):", data.pages.slice(0, 10).map((p) => p.relPermalink));
      }
    }
    return currentPage || null;
  } catch (error) {
    console.warn("Dev Score Bubble: Error fetching page data", error);
    return null;
  }
}
function initDevScoreBubble() {
  if (!isLocalhost()) {
    return;
  }
  const currentPath = window.location.pathname;
  if (currentPath.startsWith("/page-list/")) {
    return;
  }
  if (sessionStorage.getItem("dev-score-bubble-hidden") === "true") {
    return;
  }
  onDOMReady(async () => {
    setTimeout(async () => {
      const pageData = await fetchPageData();
      if (pageData) {
        createBubble(pageData);
      }
    }, 500);
  });
}

// ns-hugo-imp:C:\Users\maxim\Documents\Dev\arsrepairs.com\themes\arsrepairs-theme\assets\ts\modules\blog.ts
function debounce(func, wait) {
  let timeout = null;
  return function executedFunction(...args) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}
var handleCategoryFilterClicks = () => {
  document.addEventListener("click", (e) => {
    const target = e.target;
    const filterButton = target.closest("[data-blog-filter]");
    if (!filterButton) return;
    const container = document.querySelector("[data-blog-controls]");
    const isInControls = container && container.contains(filterButton);
    if (!isInControls) {
      e.preventDefault();
      const filter = filterButton.getAttribute("data-blog-filter");
      if (!filter) return;
      if (!container) {
        const blogListUrl = new URL("/blog/", window.location.origin);
        if (filter !== "all") {
          blogListUrl.searchParams.set("filter", filter);
        }
        window.location.href = blogListUrl.toString();
        return;
      }
      const controlButton = container.querySelector(
        `[data-blog-filter="${filter}"]`
      );
      if (controlButton) {
        controlButton.click();
      }
    }
  });
};
if (typeof document !== "undefined") {
  handleCategoryFilterClicks();
}
var initBlog = () => {
  const container = document.querySelector("[data-blog-controls]");
  if (!container) return;
  const searchInput = container.querySelector("[data-blog-search]");
  const searchClear = container.querySelector("[data-blog-search-clear]");
  const filterButtons = container.querySelectorAll("[data-blog-filter]");
  const sortSelect = container.querySelector("[data-blog-sort]");
  const perPageSelect = container.querySelector("[data-blog-per-page]");
  const grid = document.querySelector("[data-blog-grid]");
  const noResults = document.querySelector("[data-blog-no-results]");
  const resultsCount = container.querySelector("[data-blog-results-count]");
  const resultsTotal = container.querySelector("[data-blog-results-total]");
  const resultsText = container.querySelector("[data-blog-results]");
  const pagination = document.querySelector("[data-blog-pagination]");
  const paginationPrev = document.querySelector("[data-blog-pagination-prev]");
  const paginationNext = document.querySelector("[data-blog-pagination-next]");
  const paginationPages = document.querySelector("[data-blog-pagination-pages]");
  if (!grid) {
    console.warn("Blog grid not found");
    return;
  }
  const posts = Array.from(
    grid.querySelectorAll("[data-blog-post]")
  ).map((element) => {
    const title = element.getAttribute("data-post-title") || "";
    const tagsStr = element.getAttribute("data-post-tags") || "";
    const categoriesStr = element.getAttribute("data-post-categories") || "";
    const date = element.getAttribute("data-post-date") || "";
    return {
      element,
      title: title.toLowerCase(),
      tags: tagsStr ? tagsStr.split(" ").filter(Boolean) : [],
      categories: categoriesStr ? categoriesStr.split(" ").filter(Boolean) : [],
      date
    };
  });
  let currentSearch = "";
  let currentFilter = "all";
  let currentSort = "date-desc";
  let currentPage = 1;
  let postsPerPage = 20;
  const urlParams = new URLSearchParams(window.location.search);
  const filterParam = urlParams.get("filter");
  const sortParam = urlParams.get("sort");
  const pageParam = urlParams.get("page");
  const perPageParam = urlParams.get("perPage");
  if (filterParam) {
    currentFilter = filterParam;
    filterButtons.forEach((btn) => {
      if (btn.getAttribute("data-blog-filter") === filterParam) {
        btn.classList.add("blog-container__filter--active");
      } else {
        btn.classList.remove("blog-container__filter--active");
      }
    });
  }
  if (sortParam && sortSelect) {
    const validSorts = ["date-desc", "date-asc", "title-asc", "title-desc"];
    if (validSorts.includes(sortParam)) {
      currentSort = sortParam;
      sortSelect.value = sortParam;
    }
  }
  if (perPageParam && perPageSelect) {
    const validPerPage = ["10", "20", "30"];
    if (validPerPage.includes(perPageParam)) {
      postsPerPage = parseInt(perPageParam, 10);
      perPageSelect.value = perPageParam;
    }
  }
  if (pageParam) {
    const page = parseInt(pageParam, 10);
    if (page > 0) {
      currentPage = page;
    }
  }
  const updateView = () => {
    let filtered = posts.filter((post) => {
      if (currentSearch) {
        const searchLower = currentSearch.toLowerCase();
        const titleMatch = post.title.includes(searchLower);
        const contentMatch = post.element.textContent?.toLowerCase().includes(searchLower);
        if (!titleMatch && !contentMatch) return false;
      }
      if (currentFilter !== "all") {
        if (currentFilter.startsWith("tag-")) {
          if (!post.tags.includes(currentFilter)) return false;
        } else if (currentFilter.startsWith("category-")) {
          if (!post.categories.includes(currentFilter)) return false;
        }
      }
      return true;
    });
    filtered.sort((a, b) => {
      switch (currentSort) {
        case "date-desc":
          return b.date.localeCompare(a.date);
        case "date-asc":
          return a.date.localeCompare(b.date);
        case "title-asc":
          return a.title.localeCompare(b.title);
        case "title-desc":
          return b.title.localeCompare(a.title);
        default:
          return 0;
      }
    });
    const totalPosts = filtered.length;
    const totalPages = Math.ceil(totalPosts / postsPerPage);
    if (currentPage > totalPages && totalPages > 0) {
      currentPage = 1;
    }
    const startIndex = (currentPage - 1) * postsPerPage;
    const endIndex = startIndex + postsPerPage;
    const paginatedPosts = filtered.slice(startIndex, endIndex);
    posts.forEach((post) => {
      const isInFiltered = filtered.includes(post);
      const isInCurrentPage = paginatedPosts.includes(post);
      if (isInFiltered && isInCurrentPage) {
        post.element.style.display = "";
        post.element.setAttribute("aria-hidden", "false");
      } else {
        post.element.style.display = "none";
        post.element.setAttribute("aria-hidden", "true");
      }
    });
    if (filtered.length === 0) {
      if (grid) grid.style.display = "none";
      if (noResults) {
        noResults.style.display = "block";
      }
      if (pagination) pagination.style.display = "none";
    } else {
      if (grid) grid.style.display = "grid";
      if (noResults) {
        noResults.style.display = "none";
      }
      if (pagination) {
        if (totalPages > 1) {
          pagination.style.display = "flex";
          updatePagination(totalPages, currentPage);
        } else {
          pagination.style.display = "none";
        }
      }
    }
    if (resultsCount) {
      resultsCount.textContent = paginatedPosts.length.toString();
    }
    if (resultsTotal) {
      resultsTotal.textContent = totalPosts.toString();
    }
    if (resultsText) {
      const showing = paginatedPosts.length;
      const total = totalPosts;
      const text = total === 1 ? "post" : "posts";
      resultsText.innerHTML = `Showing <span class="blog-container__results-count">${showing}</span> of <span class="blog-container__results-total">${total}</span> ${text}`;
    }
  };
  const updatePagination = (totalPages, currentPage2) => {
    if (!paginationPages || !paginationPrev || !paginationNext) return;
    paginationPrev.disabled = currentPage2 === 1;
    paginationNext.disabled = currentPage2 === totalPages;
    paginationPages.innerHTML = "";
    const maxVisiblePages = 7;
    let startPage = Math.max(1, currentPage2 - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    if (startPage > 1) {
      const firstBtn = document.createElement("button");
      firstBtn.type = "button";
      firstBtn.className = "blog-container__pagination-page";
      firstBtn.textContent = "1";
      firstBtn.setAttribute("data-blog-page", "1");
      firstBtn.addEventListener("click", () => goToPage(1));
      paginationPages.appendChild(firstBtn);
      if (startPage > 2) {
        const ellipsis = document.createElement("span");
        ellipsis.className = "blog-container__pagination-ellipsis";
        ellipsis.textContent = "...";
        paginationPages.appendChild(ellipsis);
      }
    }
    for (let i = startPage; i <= endPage; i++) {
      const pageBtn = document.createElement("button");
      pageBtn.type = "button";
      pageBtn.className = "blog-container__pagination-page";
      if (i === currentPage2) {
        pageBtn.classList.add("blog-container__pagination-page--active");
      }
      pageBtn.textContent = i.toString();
      pageBtn.setAttribute("data-blog-page", i.toString());
      pageBtn.addEventListener("click", () => goToPage(i));
      paginationPages.appendChild(pageBtn);
    }
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        const ellipsis = document.createElement("span");
        ellipsis.className = "blog-container__pagination-ellipsis";
        ellipsis.textContent = "...";
        paginationPages.appendChild(ellipsis);
      }
      const lastBtn = document.createElement("button");
      lastBtn.type = "button";
      lastBtn.className = "blog-container__pagination-page";
      lastBtn.textContent = totalPages.toString();
      lastBtn.setAttribute("data-blog-page", totalPages.toString());
      lastBtn.addEventListener("click", () => goToPage(totalPages));
      paginationPages.appendChild(lastBtn);
    }
  };
  const goToPage = (page) => {
    currentPage = page;
    const url = new URL(window.location.href);
    if (page === 1) {
      url.searchParams.delete("page");
    } else {
      url.searchParams.set("page", page.toString());
    }
    window.history.pushState({}, "", url);
    if (grid) {
      grid.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    updateView();
  };
  const debouncedUpdateView = debounce(() => {
    updateView();
  }, 300);
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      const target = e.target;
      const newSearch = target.value;
      if (newSearch !== currentSearch) {
        currentPage = 1;
      }
      currentSearch = newSearch;
      if (searchClear) {
        if (currentSearch) {
          searchClear.classList.add("blog-container__search-clear--visible");
        } else {
          searchClear.classList.remove("blog-container__search-clear--visible");
        }
      }
      debouncedUpdateView();
    });
    if (searchClear) {
      searchClear.addEventListener("click", (e) => {
        e.preventDefault();
        if (searchInput) {
          searchInput.value = "";
          currentSearch = "";
          currentPage = 1;
          const url = new URL(window.location.href);
          url.searchParams.delete("search");
          url.searchParams.delete("page");
          window.history.pushState({}, "", url);
          updateView();
          searchClear.classList.remove("blog-container__search-clear--visible");
          searchInput.focus();
        }
      });
    }
  }
  const handleFilterClick = (button, e) => {
    e.preventDefault();
    const filter = button.getAttribute("data-blog-filter");
    if (!filter || filter === currentFilter) return;
    currentFilter = filter;
    currentPage = 1;
    filterButtons.forEach((btn) => {
      btn.classList.remove("blog-container__filter--active");
    });
    if (button.hasAttribute("data-blog-filter")) {
      const matchingControlButton = Array.from(filterButtons).find(
        (btn) => btn.getAttribute("data-blog-filter") === filter
      );
      if (matchingControlButton) {
        matchingControlButton.classList.add("blog-container__filter--active");
      }
    }
    const url = new URL(window.location.href);
    if (filter === "all") {
      url.searchParams.delete("filter");
    } else {
      url.searchParams.set("filter", filter);
    }
    url.searchParams.delete("page");
    window.history.pushState({}, "", url);
    updateView();
  };
  filterButtons.forEach((button) => {
    button.addEventListener("click", (e) => handleFilterClick(button, e));
  });
  if (sortSelect) {
    sortSelect.addEventListener("change", (e) => {
      const target = e.target;
      currentSort = target.value;
      currentPage = 1;
      const url = new URL(window.location.href);
      url.searchParams.set("sort", currentSort);
      url.searchParams.delete("page");
      window.history.pushState({}, "", url);
      updateView();
    });
  }
  if (perPageSelect) {
    perPageSelect.addEventListener("change", (e) => {
      const target = e.target;
      postsPerPage = parseInt(target.value, 10);
      currentPage = 1;
      const url = new URL(window.location.href);
      url.searchParams.set("perPage", target.value);
      url.searchParams.delete("page");
      window.history.pushState({}, "", url);
      updateView();
    });
  }
  if (paginationPrev) {
    paginationPrev.addEventListener("click", () => {
      if (currentPage > 1) {
        goToPage(currentPage - 1);
      }
    });
  }
  if (paginationNext) {
    paginationNext.addEventListener("click", () => {
      const totalPosts = posts.filter((post) => {
        if (currentSearch) {
          const searchLower = currentSearch.toLowerCase();
          const titleMatch = post.title.includes(searchLower);
          const contentMatch = post.element.textContent?.toLowerCase().includes(searchLower);
          if (!titleMatch && !contentMatch) return false;
        }
        if (currentFilter !== "all") {
          if (currentFilter.startsWith("tag-")) {
            if (!post.tags.includes(currentFilter)) return false;
          } else if (currentFilter.startsWith("category-")) {
            if (!post.categories.includes(currentFilter)) return false;
          }
        }
        return true;
      }).length;
      const totalPages = Math.ceil(totalPosts / postsPerPage);
      if (currentPage < totalPages) {
        goToPage(currentPage + 1);
      }
    });
  }
  updateView();
};

// ns-hugo-imp:C:\Users\maxim\Documents\Dev\arsrepairs.com\themes\arsrepairs-theme\assets\ts\modules\sitemap.ts
var initSitemap = () => {
  const container = document.querySelector(".section-sitemap");
  if (!container) return;
  const searchInput = container.querySelector("[data-sitemap-search]");
  const searchClear = container.querySelector("[data-sitemap-search-clear]");
  const grid = container.querySelector("[data-sitemap-grid]");
  const noResults = container.querySelector("[data-sitemap-no-results]");
  const allItems = container.querySelectorAll("[data-sitemap-item]");
  const allGroups = container.querySelectorAll("[data-sitemap-group]");
  if (!grid || !searchInput) return;
  let currentSearch = "";
  const urlParams = new URLSearchParams(window.location.search);
  const searchParam = urlParams.get("search");
  if (searchParam) {
    currentSearch = searchParam;
    searchInput.value = currentSearch;
    if (searchClear && currentSearch) {
      searchClear.classList.add("sitemap__search-clear--visible");
    }
  }
  const updateView = () => {
    const searchTerm = currentSearch.toLowerCase().trim();
    let visibleCount = 0;
    let hasVisibleGroups = false;
    if (!searchTerm) {
      allItems.forEach((item) => {
        item.style.display = "";
      });
      allGroups.forEach((group) => {
        group.style.display = "";
      });
      if (grid) grid.style.display = "";
      if (noResults) noResults.style.display = "none";
      return;
    }
    allGroups.forEach((group) => {
      const groupItems = group.querySelectorAll("[data-sitemap-item]");
      let groupVisibleCount = 0;
      groupItems.forEach((item) => {
        const title = item.getAttribute("data-sitemap-title") || "";
        const linkText = item.textContent?.toLowerCase() || "";
        const matches = title.includes(searchTerm) || linkText.includes(searchTerm);
        if (matches) {
          item.style.display = "";
          groupVisibleCount++;
          visibleCount++;
        } else {
          item.style.display = "none";
        }
      });
      if (groupVisibleCount > 0) {
        group.style.display = "";
        hasVisibleGroups = true;
      } else {
        group.style.display = "none";
      }
    });
    if (hasVisibleGroups && visibleCount > 0) {
      if (grid) grid.style.display = "";
      if (noResults) noResults.style.display = "none";
    } else {
      if (grid) grid.style.display = "none";
      if (noResults) noResults.style.display = "block";
    }
  };
  let searchTimeout = null;
  const debouncedUpdateView = () => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    searchTimeout = window.setTimeout(() => {
      updateView();
    }, 300);
  };
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      const target = e.target;
      const newSearch = target.value;
      currentSearch = newSearch;
      if (searchClear) {
        if (currentSearch) {
          searchClear.classList.add("sitemap__search-clear--visible");
        } else {
          searchClear.classList.remove("sitemap__search-clear--visible");
        }
      }
      const url = new URL(window.location.href);
      if (currentSearch) {
        url.searchParams.set("search", currentSearch);
      } else {
        url.searchParams.delete("search");
      }
      window.history.pushState({}, "", url);
      debouncedUpdateView();
    });
    if (searchClear) {
      searchClear.addEventListener("click", (e) => {
        e.preventDefault();
        if (searchInput) {
          searchInput.value = "";
          currentSearch = "";
          const url = new URL(window.location.href);
          url.searchParams.delete("search");
          window.history.pushState({}, "", url);
          updateView();
          searchClear.classList.remove("sitemap__search-clear--visible");
          searchInput.focus();
        }
      });
    }
  }
  updateView();
};

// ns-hugo-imp:C:\Users\maxim\Documents\Dev\arsrepairs.com\themes\arsrepairs-theme\assets\ts\modules\smooth-scroll.ts
var getScrollOffset = () => {
  const header = document.querySelector(".site-header");
  if (header) {
    const headerHeight = header.offsetHeight;
    return headerHeight + 20;
  }
  return 100;
};
var scrollToElement = (element, offset) => {
  const elementPosition = element.getBoundingClientRect().top;
  const offsetPosition = elementPosition + window.pageYOffset - offset;
  window.scrollTo({
    top: offsetPosition,
    behavior: "smooth"
  });
};
var handleAnchorClick = (e) => {
  const link = e.target.closest('a[href^="#"]');
  if (!link) return;
  const href = link.getAttribute("href");
  if (!href || !href.startsWith("#")) {
    return;
  }
  if (href === "#") {
    return;
  }
  const targetId = href.substring(1);
  const targetElement = document.getElementById(targetId);
  if (targetElement) {
    e.preventDefault();
    const offset = getScrollOffset();
    scrollToElement(targetElement, offset);
    if (history.pushState) {
      history.pushState(null, "", href);
    } else {
      window.location.hash = href;
    }
  }
};
var handleInitialHash = () => {
  if (window.location.hash) {
    const hash = window.location.hash.substring(1);
    const targetElement = document.getElementById(hash);
    if (targetElement) {
      setTimeout(() => {
        const offset = getScrollOffset();
        scrollToElement(targetElement, offset);
      }, 100);
    }
  }
};
var initSmoothScroll = () => {
  document.addEventListener("click", handleAnchorClick);
  handleInitialHash();
  window.addEventListener("hashchange", () => {
    if (window.location.hash) {
      const hash = window.location.hash.substring(1);
      const targetElement = document.getElementById(hash);
      if (targetElement) {
        const offset = getScrollOffset();
        scrollToElement(targetElement, offset);
      }
    }
  });
};

// ns-hugo-imp:C:\Users\maxim\Documents\Dev\arsrepairs.com\themes\arsrepairs-theme\assets\ts\modules\faq.ts
var closeItem = (item, button, content) => {
  button.setAttribute("aria-expanded", "false");
  item.classList.remove("faq-item--open");
  const handleTransitionEnd = () => {
    content.setAttribute("hidden", "");
    content.removeEventListener("transitionend", handleTransitionEnd);
  };
  content.addEventListener("transitionend", handleTransitionEnd, { once: true });
  setTimeout(() => {
    if (button.getAttribute("aria-expanded") === "false") {
      content.setAttribute("hidden", "");
    }
  }, 350);
};
var openItem = (item, button, content) => {
  content.removeAttribute("hidden");
  requestAnimationFrame(() => {
    button.setAttribute("aria-expanded", "true");
    item.classList.add("faq-item--open");
  });
};
var closeOtherItems = (currentItem) => {
  const faqList = currentItem.closest(".faq__list");
  if (!faqList) return;
  const allItems = faqList.querySelectorAll("[data-faq-item]");
  allItems.forEach((item) => {
    if (item === currentItem) return;
    const button = item.querySelector(".faq-item__button");
    const content = item.querySelector(".faq-item__content");
    if (!button || !content) return;
    if (button.getAttribute("aria-expanded") === "true") {
      closeItem(item, button, content);
    }
  });
};
var initFAQ = () => {
  const faqItems = document.querySelectorAll("[data-faq-item]");
  faqItems.forEach((item) => {
    const button = item.querySelector(".faq-item__button");
    const content = item.querySelector(".faq-item__content");
    if (!button || !content) return;
    const toggle = () => {
      const isExpanded = button.getAttribute("aria-expanded") === "true";
      const newState = !isExpanded;
      if (newState) {
        closeOtherItems(item);
      }
      if (newState) {
        openItem(item, button, content);
      } else {
        closeItem(item, button, content);
      }
    };
    button.addEventListener("click", (event) => {
      event.preventDefault();
      toggle();
    });
  });
};

// ns-hugo-imp:C:\Users\maxim\Documents\Dev\arsrepairs.com\themes\arsrepairs-theme\assets\ts\modules\feedback.ts
init_dom();
function getElements() {
  const form = document.querySelector('form[name="feedback"]');
  if (!form) return null;
  const progressRoot = document.getElementById("feedback-progress");
  const progressBar = document.getElementById("feedback-progress-bar");
  const progressStepText = document.getElementById("feedback-progress-step-text");
  const progressSteps = progressRoot?.querySelectorAll("[data-progress-step]") ?? null;
  const stepFieldsets = form.querySelectorAll("fieldset[data-step]");
  const totalSteps = stepFieldsets.length || 4;
  return {
    form,
    submitButton: document.getElementById("feedback-submit"),
    liveRegion: document.getElementById("feedback-live-region"),
    errorContainer: document.getElementById("feedback-error"),
    lowRatingMessage: document.getElementById("feedback-low-rating-message"),
    recommendationReasonWrapper: document.getElementById("recommendation-reason-wrapper"),
    serviceDetailsSection: document.getElementById("service-details-section"),
    serviceDetailsHelp: document.getElementById("service-details-help"),
    serviceDetailsSimplified: document.getElementById("service-details-simplified"),
    contactDetailsWrapper: document.getElementById("contact-details-wrapper"),
    contactDetailsIntro: document.getElementById("contact-details-intro"),
    progressRoot,
    progressBar,
    progressStepText,
    progressSteps,
    stepFieldsets,
    totalSteps
  };
}
function showError(fieldId, message) {
  const errorEl = document.getElementById(fieldId + "-error");
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.style.display = "block";
  }
  const form = document.querySelector('form[name="feedback"]');
  if (!form) return;
  const controls = [];
  const named = form.elements.namedItem(fieldId);
  if (named instanceof RadioNodeList) {
    Array.prototype.forEach.call(named, (el) => {
      if (el instanceof HTMLElement) controls.push(el);
    });
  } else if (named instanceof HTMLElement) {
    controls.push(named);
  } else {
    const byId = document.getElementById(fieldId);
    if (byId instanceof HTMLElement) {
      controls.push(byId);
    }
  }
  controls.forEach((control) => {
    control.setAttribute("aria-invalid", "true");
    const errorId = fieldId + "-error";
    const existingDescribedBy = control.getAttribute("aria-describedby") || "";
    const tokens = existingDescribedBy.split(" ").filter(Boolean);
    if (!tokens.includes(errorId)) {
      tokens.push(errorId);
      control.setAttribute("aria-describedby", tokens.join(" "));
    }
  });
}
function clearError(fieldId) {
  const errorEl = document.getElementById(fieldId + "-error");
  if (errorEl) {
    errorEl.textContent = "";
    errorEl.style.display = "none";
  }
  const form = document.querySelector('form[name="feedback"]');
  if (!form) return;
  const controls = [];
  const named = form.elements.namedItem(fieldId);
  if (named instanceof RadioNodeList) {
    Array.prototype.forEach.call(named, (el) => {
      if (el instanceof HTMLElement) controls.push(el);
    });
  } else if (named instanceof HTMLElement) {
    controls.push(named);
  } else {
    const byId = document.getElementById(fieldId);
    if (byId instanceof HTMLElement) {
      controls.push(byId);
    }
  }
  controls.forEach((control) => {
    control.removeAttribute("aria-invalid");
    const errorId = fieldId + "-error";
    const existingDescribedBy = control.getAttribute("aria-describedby") || "";
    const tokens = existingDescribedBy.split(" ").filter((token) => token && token !== errorId);
    if (tokens.length > 0) {
      control.setAttribute("aria-describedby", tokens.join(" "));
    } else {
      control.removeAttribute("aria-describedby");
    }
  });
}
function hasChecked(form, name) {
  const inputs = form.querySelectorAll('input[name="' + name + '"]');
  return Array.prototype.some.call(inputs, (input) => input.checked);
}
function getCheckedValue(form, name) {
  const inputs = form.querySelectorAll('input[name="' + name + '"]');
  const checked = Array.prototype.find.call(
    inputs,
    (input) => input.checked
  );
  return checked ? checked.value : "";
}
function setSectionVisibility(el, visible) {
  if (!el) return;
  el.style.display = visible ? "" : "none";
  el.setAttribute("aria-hidden", visible ? "false" : "true");
}
function getStepFromFieldset(fieldset) {
  if (!fieldset) return 0;
  const v = parseInt(fieldset.getAttribute("data-step") || "0", 10);
  return Number.isNaN(v) ? 0 : v;
}
function getStepFromElement(el) {
  if (!el) return 0;
  const fieldset = el.closest("fieldset[data-step]");
  return getStepFromFieldset(fieldset);
}
function getQuestionProgress(els) {
  const { form } = els;
  let answered = 0;
  const total = 9;
  if (hasChecked(form, "overall_experience")) answered++;
  if (hasChecked(form, "recommendation")) answered++;
  const visitType = document.getElementById("visit_type")?.value || "";
  if (visitType) answered++;
  if (hasChecked(form, "tech_knowledge")) answered++;
  if (hasChecked(form, "timeliness")) answered++;
  const wentWell = document.getElementById("went_well")?.value || "";
  if (wentWell.trim().length > 0) answered++;
  if (hasChecked(form, "share_permission")) answered++;
  if (hasChecked(form, "follow_up")) answered++;
  const emailVal = document.getElementById("email")?.value?.trim() || "";
  const phoneVal = document.getElementById("phone")?.value?.trim() || "";
  if (emailVal || phoneVal) answered++;
  const clampedAnswered = Math.max(0, Math.min(total, answered));
  return { answered: clampedAnswered, total };
}
function getStepCompletion(step, els) {
  const { form } = els;
  let answered = 0;
  let total = 0;
  switch (step) {
    case 1: {
      total = 3;
      if (hasChecked(form, "overall_experience")) answered++;
      if (hasChecked(form, "recommendation")) answered++;
      const visitType = document.getElementById("visit_type")?.value || "";
      if (visitType) answered++;
      break;
    }
    case 2: {
      let requiredAnswered = 0;
      const requiredTotal = 2;
      if (hasChecked(form, "tech_knowledge")) requiredAnswered++;
      if (hasChecked(form, "timeliness")) requiredAnswered++;
      let anyOptionalAnswered = false;
      const applianceType = document.getElementById("appliance_type")?.value || "";
      if (applianceType) anyOptionalAnswered = true;
      const serviceDate = document.getElementById("service_date")?.value || "";
      if (serviceDate) anyOptionalAnswered = true;
      const techName = document.getElementById("technician_name")?.value?.trim() || "";
      if (techName) anyOptionalAnswered = true;
      if (requiredAnswered === 0 && !anyOptionalAnswered) {
        return "none";
      }
      if (requiredAnswered === requiredTotal) {
        return "complete";
      }
      return "partial";
    }
    case 3: {
      const wentWell = document.getElementById("went_well")?.value || "";
      const wentWellTrimmedLen = wentWell.trim().length;
      const couldImprove = document.getElementById("could_improve")?.value || "";
      const couldImproveLen = couldImprove.trim().length;
      if (wentWellTrimmedLen === 0 && couldImproveLen === 0) {
        return "none";
      }
      if (wentWellTrimmedLen > 0 && wentWell.length >= 10) {
        return "complete";
      }
      return "partial";
    }
    case 4: {
      total = 2;
      if (hasChecked(form, "share_permission")) answered++;
      const followUp = getCheckedValue(form, "follow_up");
      if (followUp) answered++;
      if (followUp && followUp !== "No follow-up needed") {
        total = 3;
        const emailVal = document.getElementById("email")?.value?.trim() || "";
        const phoneVal = document.getElementById("phone")?.value?.trim() || "";
        if (emailVal || phoneVal) answered++;
      }
      break;
    }
    default:
      return "none";
  }
  if (answered <= 0) return "none";
  if (answered < total) return "partial";
  return "complete";
}
function setProgress(step, els) {
  const { progressRoot, progressBar, progressStepText, progressSteps, totalSteps } = els;
  if (!progressRoot || !progressBar || !progressSteps) return;
  const clampedStep = Math.max(0, Math.min(totalSteps, step));
  const { answered, total } = getQuestionProgress(els);
  const percent = total > 0 ? answered / total * 100 : 0;
  progressBar.style.width = percent + "%";
  const label = answered === 0 ? "Feedback progress: Not started" : "Feedback progress: " + answered + " of " + total + " questions answered";
  progressRoot.setAttribute("aria-label", label);
  if (progressStepText) {
    progressStepText.textContent = clampedStep === 0 ? "Not started" : "Step " + clampedStep + " of " + totalSteps;
  }
  Array.prototype.forEach.call(progressSteps, (stepEl) => {
    const stepNum = parseInt(stepEl.getAttribute("data-progress-step") || "0", 10);
    stepEl.classList.remove("is-active", "is-complete", "is-partial");
    const completion = getStepCompletion(stepNum, els);
    if (clampedStep === 0 && completion === "none") {
      return;
    }
    if (stepNum === clampedStep) {
      stepEl.classList.add("is-active");
    }
    if (completion === "complete") {
      stepEl.classList.add("is-complete");
    } else if (completion === "partial") {
      stepEl.classList.add("is-partial");
    }
  });
}
function initBranching(els) {
  const {
    form,
    recommendationReasonWrapper,
    contactDetailsIntro,
    contactDetailsWrapper,
    serviceDetailsHelp,
    serviceDetailsSimplified
  } = els;
  function updateRecommendationBranching() {
    const value = getCheckedValue(form, "recommendation");
    const shouldShow = value === "No" || value === "Maybe / not sure";
    setSectionVisibility(recommendationReasonWrapper, shouldShow);
  }
  function updateFollowUpBranching() {
    const value = getCheckedValue(form, "follow_up");
    const wantsFollowUp = !!value && value !== "No follow-up needed";
    setSectionVisibility(contactDetailsIntro, wantsFollowUp);
    setSectionVisibility(contactDetailsWrapper, wantsFollowUp);
  }
  function updateServiceDetailsBranching() {
    const value = getCheckedValue(form, "overall_experience");
    if (!value) {
      if (serviceDetailsHelp) {
        serviceDetailsHelp.style.display = "";
      }
      if (serviceDetailsSimplified) {
        serviceDetailsSimplified.style.display = "none";
      }
      return;
    }
    const isPoor = value.startsWith("1 -") || value.startsWith("2 -");
    if (isPoor) {
      if (serviceDetailsHelp) {
        serviceDetailsHelp.style.display = "none";
      }
      if (serviceDetailsSimplified) {
        serviceDetailsSimplified.style.display = "";
      }
    } else {
      if (serviceDetailsHelp) {
        serviceDetailsHelp.style.display = "";
      }
      if (serviceDetailsSimplified) {
        serviceDetailsSimplified.style.display = "none";
      }
    }
  }
  Array.prototype.forEach.call(
    form.querySelectorAll('input[name="recommendation"]'),
    (input) => {
      input.addEventListener("change", updateRecommendationBranching);
    }
  );
  Array.prototype.forEach.call(
    form.querySelectorAll('input[name="follow_up"]'),
    (input) => {
      input.addEventListener("change", updateFollowUpBranching);
    }
  );
  Array.prototype.forEach.call(
    form.querySelectorAll('input[name="overall_experience"]'),
    (input) => {
      input.addEventListener("change", updateServiceDetailsBranching);
    }
  );
  updateRecommendationBranching();
  updateFollowUpBranching();
  updateServiceDetailsBranching();
}
function initValidation(els) {
  const { form, errorContainer, liveRegion, submitButton } = els;
  const validators = {
    overall_experience: () => {
      if (!hasChecked(form, "overall_experience"))
        return "Please select your overall experience.";
      return null;
    },
    recommendation: () => {
      if (!hasChecked(form, "recommendation"))
        return "Please let us know if you would recommend us.";
      return null;
    },
    visit_type: () => {
      const value = document.getElementById("visit_type")?.value || "";
      if (!value) return "Please select the type of visit.";
      return null;
    },
    tech_knowledge: () => {
      if (!hasChecked(form, "tech_knowledge"))
        return "Please rate the technician's knowledge and explanation.";
      return null;
    },
    timeliness: () => {
      if (!hasChecked(form, "timeliness")) return "Please rate our timeliness.";
      return null;
    },
    went_well: () => {
      const value = document.getElementById("went_well")?.value || "";
      if (!value.trim()) return "Please tell us at least one thing that went well.";
      if (value.length < 10)
        return "Please add a bit more detail so we can understand your experience.";
      return null;
    },
    share_permission: () => {
      if (!hasChecked(form, "share_permission"))
        return "Please choose how we may use your feedback.";
      return null;
    },
    follow_up: () => {
      if (!hasChecked(form, "follow_up"))
        return "Please let us know if you would like a follow-up.";
      return null;
    },
    email: () => {
      const emailField = document.getElementById("email");
      const phoneField = document.getElementById("phone");
      const followUp = getCheckedValue(form, "follow_up");
      const emailVal = emailField?.value?.trim() || "";
      const phoneVal = phoneField?.value?.trim() || "";
      if (followUp && followUp !== "No follow-up needed" && !emailVal && !phoneVal) {
        return "Please provide at least an email or phone number so we can follow up.";
      }
      if (emailVal) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailVal)) return "Please enter a valid email address.";
      }
      return null;
    },
    phone: () => {
      const field = document.getElementById("phone");
      if (!field || !field.value) return null;
      const digitsOnly = field.value.replace(/\D/g, "");
      if (digitsOnly.length > 0 && digitsOnly.length < 10) {
        return "Please enter a valid phone number.";
      }
      return null;
    }
  };
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (errorContainer) errorContainer.style.display = "none";
    Object.keys(validators).forEach((fieldId) => {
      clearError(fieldId);
    });
    let isValid = true;
    Object.keys(validators).forEach((fieldId) => {
      const error = validators[fieldId]();
      if (error) {
        showError(fieldId, error);
        isValid = false;
      }
    });
    if (!isValid) {
      if (errorContainer) {
        errorContainer.textContent = "Please review the highlighted questions and complete any missing answers.";
        errorContainer.style.display = "block";
      }
      if (liveRegion) {
        liveRegion.textContent = "Form has errors. Please review the highlighted questions.";
      }
      const firstError = form.querySelector(
        '.contact-form__error[style*="block"]'
      );
      if (firstError) {
        let target = firstError.previousElementSibling ?? form;
        if (target && typeof target.focus === "function") {
          target.focus();
        }
      }
      return;
    }
    if (submitButton) {
      submitButton.classList.add("contact-form__submit--loading");
      submitButton.disabled = true;
      const btnText = submitButton.querySelector(".btn__text");
      if (btnText) btnText.textContent = "Sending...";
    }
    if (liveRegion) {
      liveRegion.textContent = "Sending your feedback...";
    }
    const formData = new FormData(form);
    fetch("https://api.web3forms.com/submit", {
      method: "POST",
      body: formData
    }).then((response) => response.json()).then((data) => {
      if (data.success) {
        if (liveRegion) {
          liveRegion.textContent = "Feedback sent successfully! Redirecting...";
        }
        const redirectInput = form.querySelector(
          'input[name="redirect"]'
        );
        const redirectUrl = redirectInput?.value || "/give-feedback/thank-you/";
        window.location.replace(redirectUrl);
      } else {
        throw new Error(data.message || "Failed to send feedback");
      }
    }).catch((error) => {
      const errorMessage = error instanceof Error ? error.message : "An error occurred. Please try again later.";
      if (errorContainer) {
        errorContainer.textContent = errorMessage;
        errorContainer.style.display = "block";
      }
      if (liveRegion) {
        liveRegion.textContent = "Error sending feedback. Please try again.";
      }
      if (submitButton) {
        submitButton.classList.remove("contact-form__submit--loading");
        submitButton.disabled = false;
        const btnText = submitButton.querySelector(".btn__text");
        if (btnText) btnText.textContent = "Submit Feedback";
      }
    });
  });
}
function checkAndShowLowRatingMessage(els) {
  if (!els.lowRatingMessage) return;
  try {
    const stored = sessionStorage.getItem("ars_reviews_stage1");
    if (!stored) return;
    const data = JSON.parse(stored);
    const now = Date.now();
    if (data && data.expiresAt && data.expiresAt > now && data.mode === "review_stage1" && typeof data.rating === "number" && data.rating <= 2) {
      els.lowRatingMessage.classList.remove("contact-form__status--hidden");
      els.lowRatingMessage.style.display = "";
      if (els.liveRegion) {
        els.liveRegion.textContent = "We noticed you weren't fully satisfied. Please share your feedback so we can improve.";
      }
    }
  } catch (error) {
    console.warn("Could not check review stage1 data:", error);
  }
}
function initFeedback() {
  onDOMReady(() => {
    const els = getElements();
    if (!els) return;
    checkAndShowLowRatingMessage(els);
    const { form, stepFieldsets } = els;
    form.addEventListener("focusin", (event) => {
      const step = getStepFromElement(event.target);
      setProgress(step, els);
    });
    const syncProgressForEvent = (event) => {
      const step = getStepFromElement(event.target);
      setProgress(step, els);
    };
    form.addEventListener("input", syncProgressForEvent);
    form.addEventListener("change", syncProgressForEvent);
    let scrollRafId = null;
    const handleScroll = () => {
      if (!stepFieldsets.length) return;
      let bestStep = 0;
      let bestTop = Infinity;
      stepFieldsets.forEach((fs) => {
        const rect = fs.getBoundingClientRect();
        if (rect.top >= 0 && rect.top < bestTop) {
          bestTop = rect.top;
          bestStep = getStepFromFieldset(fs);
        }
      });
      setProgress(bestStep, els);
    };
    window.addEventListener(
      "scroll",
      () => {
        if (scrollRafId !== null) return;
        scrollRafId = window.requestAnimationFrame(() => {
          scrollRafId = null;
          handleScroll();
        });
      },
      { passive: true }
    );
    setProgress(0, els);
    initBranching(els);
    initValidation(els);
  });
}

// ns-hugo-imp:C:\Users\maxim\Documents\Dev\arsrepairs.com\themes\arsrepairs-theme\assets\ts\modules\service-areas-leaflet.ts
var CITY_COORDINATES = {
  "Miami": { lat: 25.7617, lng: -80.1918 },
  "Fort Lauderdale": { lat: 26.1224, lng: -80.1373 },
  "West Palm Beach": { lat: 26.7153, lng: -80.0534 },
  "Boca Raton": { lat: 26.3683, lng: -80.1289 },
  "Coral Gables": { lat: 25.7214, lng: -80.2684 },
  "Hialeah": { lat: 25.8576, lng: -80.2781 },
  "Hollywood": { lat: 26.0112, lng: -80.1495 },
  "Aventura": { lat: 25.9565, lng: -80.1392 },
  "Miami Beach": { lat: 25.7907, lng: -80.13 },
  "Doral": { lat: 25.8195, lng: -80.3553 },
  "Kendall": { lat: 25.6792, lng: -80.3173 },
  "Homestead": { lat: 25.4687, lng: -80.4776 },
  "Key Biscayne": { lat: 25.6931, lng: -80.162 },
  "Pompano Beach": { lat: 26.2379, lng: -80.1248 },
  "Deerfield Beach": { lat: 26.3184, lng: -80.0998 },
  "Delray Beach": { lat: 26.4615, lng: -80.0728 },
  "Jupiter": { lat: 26.9342, lng: -80.0942 },
  "Palm Beach Gardens": { lat: 26.8234, lng: -80.1387 },
  "Sunrise": { lat: 26.1665, lng: -80.2892 },
  "North Miami": { lat: 25.8901, lng: -80.1867 }
};
var GROUP_CENTROIDS = {
  "Miami-Dade County": { lat: 25.7617, lng: -80.1918 },
  "Broward County": { lat: 26.1224, lng: -80.1373 },
  "Palm Beach County": { lat: 26.7153, lng: -80.0534 }
};
var isValidCoordinate = (value, isLatitude) => {
  if (typeof value !== "number" || isNaN(value) || !isFinite(value)) {
    return false;
  }
  if (isLatitude) {
    return value >= -90 && value <= 90;
  } else {
    return value >= -180 && value <= 180;
  }
};
var getCoordinates = (page) => {
  if (page.lat !== void 0 && page.lng !== void 0) {
    let lat;
    let lng;
    if (typeof page.lat === "number") {
      lat = page.lat;
    } else if (typeof page.lat === "string") {
      lat = parseFloat(page.lat);
    } else {
      lat = NaN;
    }
    if (typeof page.lng === "number") {
      lng = page.lng;
    } else if (typeof page.lng === "string") {
      lng = parseFloat(page.lng);
    } else {
      lng = NaN;
    }
    if (isValidCoordinate(lat, true) && isValidCoordinate(lng, false)) {
      return { lat, lng };
    }
  }
  const cityName = page.title.replace(/Appliance Repair in |Appliance Repair |/gi, "").trim();
  if (CITY_COORDINATES[cityName]) {
    const coords = CITY_COORDINATES[cityName];
    if (coords && isValidCoordinate(coords.lat, true) && isValidCoordinate(coords.lng, false)) {
      return coords;
    }
  }
  if (GROUP_CENTROIDS[page.group]) {
    const coords = GROUP_CENTROIDS[page.group];
    if (coords && isValidCoordinate(coords.lat, true) && isValidCoordinate(coords.lng, false)) {
      return coords;
    }
  }
  return null;
};
var leafletInitAttempted = false;
var leafletCheckInterval = null;
var MAX_WAIT_TIME = 5e3;
var CHECK_INTERVAL = 100;
var startTime = 0;
var initServiceAreasLeaflet = () => {
  const mapContainer = document.getElementById("service-areas-leaflet-map");
  if (!mapContainer) {
    return;
  }
  if (typeof L === "undefined") {
    const leafletScript = document.querySelector('script[src*="leaflet"]');
    if (leafletScript) {
      if (!leafletInitAttempted) {
        leafletInitAttempted = true;
        startTime = Date.now();
        leafletCheckInterval = setInterval(() => {
          if (typeof L !== "undefined") {
            if (leafletCheckInterval) {
              clearInterval(leafletCheckInterval);
              leafletCheckInterval = null;
            }
            leafletInitAttempted = false;
            initServiceAreasLeaflet();
          } else if (Date.now() - startTime > MAX_WAIT_TIME) {
            if (leafletCheckInterval) {
              clearInterval(leafletCheckInterval);
              leafletCheckInterval = null;
            }
            console.warn("Leaflet.js failed to load after 5 seconds. Service areas map will not be initialized. Check network tab for script loading errors.");
            leafletInitAttempted = false;
          }
        }, CHECK_INTERVAL);
      } else {
        return;
      }
    } else {
      if (!leafletInitAttempted) {
        leafletInitAttempted = true;
        startTime = Date.now();
        const checkForScript = setInterval(() => {
          const script = document.querySelector('script[src*="leaflet"]');
          if (script) {
            clearInterval(checkForScript);
            leafletInitAttempted = false;
            initServiceAreasLeaflet();
          } else if (Date.now() - startTime > 1e3) {
            clearInterval(checkForScript);
            console.warn("Leaflet.js script tag not found in DOM. Service areas map will not be initialized.");
            leafletInitAttempted = false;
          }
        }, 100);
      }
    }
    return;
  }
  if (leafletCheckInterval) {
    clearInterval(leafletCheckInterval);
    leafletCheckInterval = null;
  }
  leafletInitAttempted = false;
  const ensureContainerSize = () => {
    return new Promise((resolve) => {
      const checkSize = () => {
        const rect = mapContainer.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          resolve();
        } else {
          setTimeout(checkSize, 50);
        }
      };
      checkSize();
    });
  };
  ensureContainerSize().then(() => {
    requestAnimationFrame(() => {
      void mapContainer.offsetHeight;
      setTimeout(() => {
        const map = L.map("service-areas-leaflet-map", {
          zoomControl: true,
          scrollWheelZoom: true,
          doubleClickZoom: true,
          boxZoom: true,
          keyboard: true,
          dragging: true,
          touchZoom: true
        });
        map.invalidateSize();
        map.setView([44, -79], 7);
        initializeMapContent(map);
      }, 150);
    });
  });
};
var initializeMapContent = (map) => {
  let currentLayers = [];
  let activeGroup = null;
  let currentTileLayer = null;
  const mapStyles = {
    "default": {
      url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      attribution: '\xA9 <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19
    },
    "carto-positron": {
      url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
      attribution: '\xA9 <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors \xA9 <a href="https://carto.com/attributions">CARTO</a>',
      maxZoom: 19
    },
    "carto-dark": {
      url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      attribution: '\xA9 <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors \xA9 <a href="https://carto.com/attributions">CARTO</a>',
      maxZoom: 19
    },
    "carto-voyager": {
      url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
      attribution: '\xA9 <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors \xA9 <a href="https://carto.com/attributions">CARTO</a>',
      maxZoom: 19
    },
    "stamen-toner": {
      url: "https://stamen-tiles-{s}.a.ssl.fastly.net/toner-lite/{z}/{x}/{y}{r}.png",
      attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 20
    },
    "stamen-terrain": {
      url: "https://stamen-tiles-{s}.a.ssl.fastly.net/terrain/{z}/{x}/{y}{r}.png",
      attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 18
    },
    "osm-fr": {
      url: "https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png",
      attribution: '\xA9 <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Tiles style by <a href="https://www.hot.openstreetmap.org/" target="_blank">Humanitarian OpenStreetMap Team</a>',
      maxZoom: 19
    }
  };
  const setMapStyle = (style = "carto-positron") => {
    if (currentTileLayer) {
      map.removeLayer(currentTileLayer);
    }
    const styleConfig = mapStyles[style];
    currentTileLayer = L.tileLayer(styleConfig.url, {
      attribution: styleConfig.attribution,
      maxZoom: styleConfig.maxZoom || 19,
      subdomains: "abc"
    }).addTo(map);
    map.invalidateSize();
    setTimeout(() => {
      map.invalidateSize();
    }, 50);
  };
  setMapStyle("default");
  if (currentTileLayer) {
    currentTileLayer.on("load", () => {
      map.invalidateSize();
      setTimeout(() => {
        map.invalidateSize();
      }, 100);
    });
    currentTileLayer.on("tileerror", () => {
      map.invalidateSize();
    });
  }
  setTimeout(() => {
    map.invalidateSize();
  }, 200);
  const groupDataElements = document.querySelectorAll(".service-areas-group-data");
  const pages = [];
  groupDataElements.forEach((groupData) => {
    const groupContainer = groupData.closest(".service-areas-sidebar-group");
    const groupName = groupContainer?.getAttribute("data-group") || "";
    const pageElements = groupData.querySelectorAll("span[data-page-title]");
    pageElements.forEach((pageEl) => {
      const title = pageEl.getAttribute("data-page-title") || "";
      const url = pageEl.getAttribute("data-page-url") || "";
      const latStr = pageEl.getAttribute("data-lat");
      const lngStr = pageEl.getAttribute("data-lng");
      let lat;
      let lng;
      if (latStr && latStr.trim() !== "") {
        const parsedLat = parseFloat(latStr);
        lat = isValidCoordinate(parsedLat, true) ? parsedLat : void 0;
      }
      if (lngStr && lngStr.trim() !== "") {
        const parsedLng = parseFloat(lngStr);
        lng = isValidCoordinate(parsedLng, false) ? parsedLng : void 0;
      }
      pages.push({
        title,
        url,
        group: groupName,
        lat,
        lng
      });
    });
  });
  const clearLayers = () => {
    currentLayers.forEach((layer) => {
      map.removeLayer(layer);
    });
    currentLayers = [];
  };
  const createCityPolygon = (coords, cityName) => {
    const citySizes = {
      "Miami": 0.12,
      "Fort Lauderdale": 0.1,
      "West Palm Beach": 0.08,
      "Boca Raton": 0.07,
      "Coral Gables": 0.06,
      "Hialeah": 0.06,
      "Hollywood": 0.06,
      "Aventura": 0.05,
      "Miami Beach": 0.05,
      "Doral": 0.05,
      "Kendall": 0.05,
      "Homestead": 0.05,
      "Key Biscayne": 0.04,
      "Pompano Beach": 0.05,
      "Deerfield Beach": 0.05,
      "Delray Beach": 0.05,
      "Jupiter": 0.05,
      "Palm Beach Gardens": 0.05,
      "Sunrise": 0.05,
      "North Miami": 0.05,
      "Burlington": 0.06,
      "Oshawa": 0.06,
      "St. Catharines": 0.06,
      "Cambridge": 0.05,
      "Guelph": 0.05,
      "Barrie": 0.05,
      "Kingston": 0.05,
      "Peterborough": 0.05
    };
    const radius = citySizes[cityName] || 0.04;
    const points = [];
    const numPoints = 64;
    for (let i = 0; i < numPoints; i++) {
      const angle = i / numPoints * 2 * Math.PI;
      const latOffset = radius * Math.cos(angle);
      const lngOffset = radius * Math.sin(angle) / Math.cos(coords.lat * Math.PI / 180);
      points.push([coords.lat + latOffset, coords.lng + lngOffset]);
    }
    return L.polygon(points, {
      color: "#D91A24",
      fillColor: "#D91A24",
      fillOpacity: 0.2,
      weight: 2,
      opacity: 0.8
    });
  };
  const createPolygonsAndCollectCoords = (pagesToProcess) => {
    const validCoords = [];
    pagesToProcess.forEach((page) => {
      const coords = getCoordinates(page);
      if (!coords) {
        console.warn(`[Service Areas Map] No valid coordinates found for "${page.title}". Please add lat/lng to frontmatter.`);
        return;
      }
      if (!isValidCoordinate(coords.lat, true) || !isValidCoordinate(coords.lng, false)) {
        console.warn(`[Service Areas Map] Invalid coordinates for "${page.title}":`, coords);
        return;
      }
      const polygon = createCityPolygon(coords, page.title);
      polygon.bindPopup(`
        <div class="service-areas-popup">
          <h6 class="service-areas-popup-title">${page.title}</h6>
          <a href="${page.url}" class="btn btn--sm btn--primary">View Details</a>
        </div>
      `);
      polygon.on("mouseover", function() {
        this.setStyle({
          fillOpacity: 0.3,
          weight: 3
        });
      });
      polygon.on("mouseout", function() {
        this.setStyle({
          fillOpacity: 0.2,
          weight: 2
        });
      });
      polygon.addTo(map);
      currentLayers.push(polygon);
      validCoords.push([coords.lat, coords.lng]);
    });
    return validCoords;
  };
  const fitMapToBounds = (validCoords) => {
    if (validCoords.length === 0) {
      map.setView([44, -79], 7);
      return;
    }
    if (validCoords.length === 1) {
      map.setView(validCoords[0], 11);
      return;
    }
    const boundsObj = L.latLngBounds(validCoords);
    const sidebarPadding = window.innerWidth > 768 ? 340 : 50;
    map.fitBounds(boundsObj, {
      paddingTopLeft: [sidebarPadding, 50],
      paddingBottomRight: [50, 50],
      maxZoom: 13
    });
  };
  const showGroupMarkers = (groupName) => {
    clearLayers();
    activeGroup = groupName;
    const groupPages = pages.filter((page) => page.group === groupName);
    if (groupPages.length === 0) {
      return;
    }
    const validCoords = createPolygonsAndCollectCoords(groupPages);
    fitMapToBounds(validCoords);
    const groupTitles2 = document.querySelectorAll(".service-areas-sidebar-group-title");
    groupTitles2.forEach((title) => {
      const itemGroup = title.getAttribute("data-group") || "";
      if (itemGroup === groupName) {
        title.classList.add("is-active");
      } else {
        title.classList.remove("is-active");
      }
    });
  };
  const showAllMarkers = () => {
    clearLayers();
    activeGroup = null;
    const validCoords = createPolygonsAndCollectCoords(pages);
    fitMapToBounds(validCoords);
    const groupTitles2 = document.querySelectorAll(".service-areas-sidebar-group-title");
    groupTitles2.forEach((title) => {
      title.classList.remove("is-active");
    });
  };
  const groupTitles = document.querySelectorAll(".service-areas-sidebar-group-title");
  groupTitles.forEach((title) => {
    title.addEventListener("click", () => {
      const groupName = title.getAttribute("data-group") || "";
      if (groupName) {
        showGroupMarkers(groupName);
      }
    });
  });
  const initSidebarToggle = () => {
    const sidebar = document.getElementById("service-areas-sidebar");
    const toggle = document.querySelector(".service-areas-sidebar-toggle");
    const sidebarContent = document.getElementById("service-areas-sidebar-content");
    if (!sidebar || !toggle || !sidebarContent) {
      return;
    }
    const isMobile2 = () => {
      return window.matchMedia("(max-width: 768px)").matches;
    };
    const updateSidebarState = () => {
      if (isMobile2()) {
        const isExpanded = sidebar.getAttribute("data-expanded") === "true";
        if (!isExpanded) {
          sidebarContent.style.display = "none";
        }
      } else {
        sidebarContent.style.display = "block";
        sidebar.removeAttribute("data-expanded");
      }
    };
    toggle.addEventListener("click", () => {
      const isExpanded = sidebar.getAttribute("data-expanded") === "true";
      if (isExpanded) {
        sidebar.setAttribute("data-expanded", "false");
        toggle.setAttribute("aria-expanded", "false");
        sidebarContent.style.display = "none";
      } else {
        sidebar.setAttribute("data-expanded", "true");
        toggle.setAttribute("aria-expanded", "true");
        sidebarContent.style.display = "block";
      }
      setTimeout(() => {
        map.invalidateSize();
      }, 150);
    });
    updateSidebarState();
  };
  initSidebarToggle();
  const initMap = () => {
    requestAnimationFrame(() => {
      if (pages.length > 0) {
        showAllMarkers();
      }
      map.invalidateSize();
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
  setTimeout(initMap, 200);
  let resizeTimeout3;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimeout3);
    resizeTimeout3 = setTimeout(() => {
      map.invalidateSize();
      const sidebar = document.getElementById("service-areas-sidebar");
      const sidebarContent = document.getElementById("service-areas-sidebar-content");
      if (sidebar && sidebarContent) {
        const isMobile2 = window.matchMedia("(max-width: 768px)").matches;
        if (!isMobile2) {
          sidebarContent.style.display = "block";
          sidebar.removeAttribute("data-expanded");
        }
      }
    }, 250);
  });
};

// ns-hugo-imp:C:\Users\maxim\Documents\Dev\arsrepairs.com\themes\arsrepairs-theme\assets\ts\modules\reviews-form.ts
var STORAGE_KEY = "ars_reviews_stage1";
var STORAGE_TTL_MS = 15 * 60 * 1e3;
var RATING_LABELS = {
  1: "Not great",
  2: "Could be better",
  3: "Okay",
  4: "Great",
  5: "Amazing"
};
function getDatasetNumber(value, fallback) {
  if (!value) return fallback;
  const parsed = parseInt(value, 10);
  if (Number.isNaN(parsed)) return fallback;
  return parsed;
}
function getConfig(root) {
  const redirectLowTo = root.getAttribute("data-redirect-low-to") || "/give-feedback/";
  const thresholdAttr = root.getAttribute("data-threshold");
  const threshold = getDatasetNumber(thresholdAttr, 2);
  const googleReviewUrl = root.getAttribute("data-google-review-url");
  const endpointUrl = root.getAttribute("data-endpoint-url");
  return {
    redirectLowTo,
    threshold,
    googleReviewUrl: googleReviewUrl && googleReviewUrl.trim() !== "" ? googleReviewUrl : null,
    endpointUrl: endpointUrl && endpointUrl.trim() !== "" ? endpointUrl : null
  };
}
function getElements2(root) {
  const form = root.querySelector("form");
  if (!form) return null;
  const ratingInput = form.querySelector("#reviews-rating");
  const ratingValue = form.querySelector("[data-reviews-rating-value]");
  const ratingLabel = form.querySelector("[data-reviews-rating-label]");
  return {
    root,
    form,
    liveRegion: form.querySelector("[data-reviews-live-region]"),
    statusError: form.querySelector("[data-reviews-status-error]"),
    statusSuccess: form.querySelector("[data-reviews-status-success]"),
    honeypot: form.querySelector("[data-reviews-honeypot]"),
    continueButton: form.querySelector("[data-reviews-continue]"),
    submitButton: form.querySelector("[data-reviews-submit]"),
    stageTwo: form.querySelector("[data-reviews-stage-two]"),
    ratingInput,
    ratingValue,
    ratingLabel,
    nameInput: form.querySelector("#reviews-name"),
    emailInput: form.querySelector("#reviews-email"),
    phoneInput: form.querySelector("#reviews-phone"),
    applianceSelect: form.querySelector("#reviews-appliance"),
    messageInput: form.querySelector("#reviews-message"),
    consentCheckbox: form.querySelector("#reviews-consent")
  };
}
function setFieldError(els, fieldKey, message) {
  const errorSpan = els.form.querySelector(`[data-reviews-error="${fieldKey}"]`);
  let field = null;
  switch (fieldKey) {
    case "rating":
      field = els.ratingInput;
      break;
    case "name":
      field = els.nameInput;
      break;
    case "email":
      field = els.emailInput;
      break;
    case "phone":
      field = els.phoneInput;
      break;
    default:
      break;
  }
  if (errorSpan) {
    errorSpan.textContent = message || "";
    errorSpan.style.display = message ? "block" : "none";
  }
  if (field) {
    if (message) {
      field.setAttribute("aria-invalid", "true");
      field.classList.add("contact-form__input--error");
    } else {
      field.removeAttribute("aria-invalid");
      field.classList.remove("contact-form__input--error");
    }
  }
}
function clearAllErrors(els) {
  setFieldError(els, "rating", null);
  setFieldError(els, "name", null);
  setFieldError(els, "email", null);
  setFieldError(els, "phone", null);
  if (els.statusError) {
    els.statusError.textContent = "";
    els.statusError.classList.add("contact-form__status--hidden");
  }
}
function showStatus(els, type, message) {
  const target = type === "error" ? els.statusError : els.statusSuccess;
  const other = type === "error" ? els.statusSuccess : els.statusError;
  if (other) {
    other.textContent = "";
    other.classList.add("contact-form__status--hidden");
  }
  if (target) {
    target.textContent = message;
    target.classList.remove("contact-form__status--hidden");
  }
  if (els.liveRegion) {
    els.liveRegion.textContent = message;
  }
}
function validateStageOne(els) {
  let isValid = true;
  const ratingRaw = els.ratingInput?.value;
  const rating = ratingRaw ? parseInt(ratingRaw, 10) : NaN;
  if (!ratingRaw || Number.isNaN(rating)) {
    setFieldError(els, "rating", "Please select how satisfied you are.");
    isValid = false;
  } else {
    setFieldError(els, "rating", null);
  }
  const nameVal = els.nameInput?.value?.trim() || "";
  if (!nameVal) {
    setFieldError(els, "name", "Please enter your name.");
    isValid = false;
  } else if (nameVal.length < 2) {
    setFieldError(els, "name", "Name should be at least 2 characters.");
    isValid = false;
  } else {
    setFieldError(els, "name", null);
  }
  const emailVal = els.emailInput?.value?.trim() || "";
  if (!emailVal) {
    setFieldError(els, "email", "Please enter your email.");
    isValid = false;
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailVal)) {
      setFieldError(els, "email", "Please enter a valid email address.");
      isValid = false;
    } else {
      setFieldError(els, "email", null);
    }
  }
  const phoneVal = els.phoneInput?.value?.trim() || "";
  if (phoneVal) {
    const digitsOnly = phoneVal.replace(/\D/g, "");
    if (digitsOnly.length > 0 && digitsOnly.length < 10) {
      setFieldError(els, "phone", "Please enter a valid phone number.");
      isValid = false;
    } else {
      setFieldError(els, "phone", null);
    }
  } else {
    setFieldError(els, "phone", null);
  }
  if (!isValid) {
    showStatus(
      els,
      "error",
      "Please fix the highlighted fields before continuing."
    );
    const firstErrorField = els.form.querySelector(
      '[aria-invalid="true"]'
    );
    if (firstErrorField && typeof firstErrorField.focus === "function") {
      firstErrorField.focus();
    }
  }
  return isValid;
}
function saveStageOneToSession(rating, name, email, phone) {
  try {
    const now = Date.now();
    const payload = {
      mode: "review_stage1",
      rating,
      name,
      email,
      phone,
      pageUrl: window.location.href,
      createdAt: now,
      expiresAt: now + STORAGE_TTL_MS
    };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (error) {
    logger.warn("Unable to persist review stage1 data to sessionStorage:", error);
  }
}
function showStageTwo(els) {
  if (!els.stageTwo) return;
  els.stageTwo.style.display = "";
  els.stageTwo.setAttribute("aria-hidden", "false");
  if (els.continueButton) {
    els.continueButton.disabled = true;
  }
  const firstInput = els.applianceSelect || els.messageInput || els.consentCheckbox || null;
  if (firstInput && typeof firstInput.focus === "function") {
    firstInput.focus();
  }
}
function setSubmitLoading(els, isLoading) {
  const btn = els.submitButton;
  if (!btn) return;
  const textSpan = btn.querySelector(".btn__text");
  if (isLoading) {
    btn.classList.add("contact-form__submit--loading");
    btn.disabled = true;
    if (textSpan) textSpan.textContent = "Sending...";
  } else {
    btn.classList.remove("contact-form__submit--loading");
    btn.disabled = false;
    if (textSpan) textSpan.textContent = "Submit review";
  }
}
function buildPayload(els, config) {
  const rating = els.ratingInput?.value ? parseInt(els.ratingInput.value, 10) : null;
  const name = els.nameInput?.value?.trim() || "";
  const email = els.emailInput?.value?.trim() || "";
  const phone = els.phoneInput?.value?.trim() || "";
  const appliance = els.applianceSelect?.value?.trim() || "";
  const message = els.messageInput?.value?.trim() || "";
  const consent = !!els.consentCheckbox?.checked;
  const url = new URL(window.location.href);
  const params = url.searchParams;
  const utm = {};
  ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"].forEach(
    (key) => {
      const value = params.get(key);
      if (value) utm[key] = value;
    }
  );
  return {
    mode: "review_submit",
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    rating,
    name,
    email,
    phone,
    appliance: appliance || null,
    message: message || null,
    consent,
    pageUrl: window.location.href,
    referrer: document.referrer || null,
    utm,
    config: {
      threshold: config.threshold,
      redirectLowTo: config.redirectLowTo
    }
  };
}
async function handleSubmit(els, config) {
  if (!config.endpointUrl) {
    showStatus(
      els,
      "error",
      "Review endpoint is not configured yet. Please try again later or use the Google review link."
    );
    return;
  }
  if (els.honeypot && els.honeypot.value.trim() !== "") {
    logger.warn("Blocking review submission due to honeypot being filled.");
    return;
  }
  const isValid = validateStageOne(els);
  if (!isValid) return;
  const payload = buildPayload(els, config);
  try {
    setSubmitLoading(els, true);
    showStatus(els, "success", "Sending your review...");
    const response = await fetch(config.endpointUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload),
      credentials: "same-origin"
    });
    if (!response.ok) {
      logger.error("Review submission failed with status:", response.status);
      showStatus(
        els,
        "error",
        "We couldn't send your review right now. Please try again in a moment."
      );
      return;
    }
    showStatus(
      els,
      "success",
      "Thank you for sharing your experience! Your review has been submitted."
    );
  } catch (error) {
    logger.error("Review submission error:", error);
    showStatus(
      els,
      "error",
      "Something went wrong while sending your review. Please try again shortly."
    );
  } finally {
    setSubmitLoading(els, false);
  }
}
function initSlider(els) {
  if (!els.ratingInput) return;
  const update = () => {
    const raw = els.ratingInput?.value;
    const rating = raw ? parseInt(raw, 10) : 5;
    const clamped = Math.min(5, Math.max(1, rating));
    if (els.ratingValue) {
      els.ratingValue.textContent = String(clamped);
    }
    if (els.ratingLabel) {
      els.ratingLabel.textContent = RATING_LABELS[clamped] || "";
    }
    els.ratingInput?.setAttribute("aria-valuenow", String(clamped));
    const container = els.root.querySelector(".reviews-form__rating");
    if (container) {
      container.classList.remove("reviews-form__rating--low", "reviews-form__rating--mid", "reviews-form__rating--high");
      if (clamped <= 2) {
        container.classList.add("reviews-form__rating--low");
      } else if (clamped === 3) {
        container.classList.add("reviews-form__rating--mid");
      } else {
        container.classList.add("reviews-form__rating--high");
      }
    }
    const faces2 = els.root.querySelectorAll(".reviews-form__face");
    faces2.forEach((face) => {
      const valueAttr = face.getAttribute("data-value");
      const faceValue = valueAttr ? parseInt(valueAttr, 10) : null;
      if (faceValue === clamped) {
        face.classList.add("is-active");
      } else {
        face.classList.remove("is-active");
      }
    });
  };
  els.ratingInput.addEventListener("input", update);
  els.ratingInput.addEventListener("change", update);
  const faces = els.root.querySelectorAll(".reviews-form__face");
  faces.forEach((face) => {
    const valueAttr = face.getAttribute("data-value");
    const faceValue = valueAttr ? parseInt(valueAttr, 10) : null;
    if (!faceValue || !els.ratingInput) return;
    face.setAttribute("role", "button");
    face.setAttribute("tabindex", "0");
    const setFromFace = () => {
      if (!els.ratingInput) return;
      els.ratingInput.value = String(faceValue);
      els.ratingInput.dispatchEvent(new Event("input", { bubbles: true }));
      els.ratingInput.dispatchEvent(new Event("change", { bubbles: true }));
      els.ratingInput.focus();
    };
    face.addEventListener("click", setFromFace);
    face.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        setFromFace();
      }
    });
  });
  update();
}
function attachEvents(els, config) {
  initSlider(els);
  if (els.continueButton) {
    els.continueButton.addEventListener("click", () => {
      clearAllErrors(els);
      const ok = validateStageOne(els);
      if (!ok) return;
      const ratingVal = els.ratingInput?.value ? parseInt(els.ratingInput.value, 10) : NaN;
      const rating = Number.isNaN(ratingVal) ? config.threshold : ratingVal;
      const name = els.nameInput?.value?.trim() || "";
      const email = els.emailInput?.value?.trim() || "";
      const phone = els.phoneInput?.value?.trim() || "";
      if (rating <= config.threshold) {
        saveStageOneToSession(rating, name, email, phone);
        window.location.href = config.redirectLowTo;
        return;
      }
      if (rating === 3 || rating === 4) {
        window.location.href = "/reviews/thank-you/";
        return;
      }
      if (rating === 5) {
        showStageTwo(els);
        showStatus(
          els,
          "success",
          "Thanks! You can optionally add a few details below before submitting your review."
        );
        return;
      }
    });
  }
  els.form.addEventListener("submit", (event) => {
    if (config.endpointUrl) {
      event.preventDefault();
      void handleSubmit(els, config);
      return;
    }
    event.preventDefault();
    const isValid = validateStageOne(els);
    if (!isValid) return;
    const formData = new FormData(els.form);
    setSubmitLoading(els, true);
    showStatus(els, "success", "Sending your review...");
    fetch("https://api.web3forms.com/submit", {
      method: "POST",
      body: formData
    }).then((response) => response.json()).then((data) => {
      if (data.success) {
        const redirectInput = els.form.querySelector(
          'input[name="redirect"]'
        );
        const redirectUrl = redirectInput?.value || "/reviews/thank-you/";
        window.location.replace(redirectUrl);
      } else {
        throw new Error(data.message || "Failed to send review");
      }
    }).catch((error) => {
      logger.error("Review submission error:", error);
      const errorMessage = error instanceof Error ? error.message : "Something went wrong while sending your review. Please try again shortly.";
      showStatus(els, "error", errorMessage);
      setSubmitLoading(els, false);
    });
  });
}
function initReviewsForm() {
  const roots = document.querySelectorAll('[data-reviews-form="true"]');
  if (!roots.length) return;
  roots.forEach((root) => {
    const config = getConfig(root);
    const els = getElements2(root);
    if (!els) return;
    attachEvents(els, config);
  });
}

// ns-hugo-imp:C:\Users\maxim\Documents\Dev\arsrepairs.com\themes\arsrepairs-theme\assets\ts\modules\reviews.ts
var carouselCleanups = /* @__PURE__ */ new Map();
function getTransitionDuration(element) {
  const style = window.getComputedStyle(element);
  const duration = style.transitionDuration || "0.6s";
  const match = duration.match(/([\d.]+)(s|ms)/);
  if (match) {
    const value = parseFloat(match[1]);
    return match[2] === "s" ? value * 1e3 : value;
  }
  return 600;
}
function capitalize(str) {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}
function initReviewsCarousel() {
  const carousel = document.querySelector("[data-reviews-carousel]");
  if (!carousel) return;
  const existingCleanup = carouselCleanups.get(carousel);
  if (existingCleanup) {
    existingCleanup.forEach((fn) => fn());
    carouselCleanups.delete(carousel);
  }
  const wrapper = carousel.querySelector(".reviews__carousel-wrapper");
  const cards = Array.from(carousel.querySelectorAll(".review-card--carousel"));
  const prevButton = carousel.querySelector("[data-carousel-prev]");
  const nextButton = carousel.querySelector("[data-carousel-next]");
  const dots = Array.from(carousel.querySelectorAll("[data-carousel-dot]"));
  if (!wrapper || cards.length === 0) return;
  if (cards.length < 2) {
    if (prevButton) prevButton.style.display = "none";
    if (nextButton) nextButton.style.display = "none";
    if (dots.length > 0) {
      dots.forEach((dot) => dot.style.display = "none");
    }
    if (cards.length === 1) {
      cards[0].setAttribute("data-carousel-active", "true");
    }
    return;
  }
  const elements = {
    carousel,
    wrapper,
    cards,
    prevButton,
    nextButton,
    dots
  };
  const state = {
    currentIndex: 0,
    totalItems: cards.length,
    isTransitioning: false,
    touchStartX: 0,
    touchEndX: 0,
    mouseStartX: 0,
    isMouseDown: false,
    autoplayInterval: null,
    isAutoplayPaused: false
  };
  const transitionDuration = getTransitionDuration(wrapper);
  const cleanupFunctions = [];
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function getWrappedDiff(index, currentIndex, total) {
    let diff = index - currentIndex;
    if (Math.abs(diff) > total / 2) {
      if (diff > 0) {
        diff = diff - total;
      } else {
        diff = diff + total;
      }
    }
    return diff;
  }
  function updateCarousel() {
    cards.forEach((card, index) => {
      const diff = getWrappedDiff(index, state.currentIndex, state.totalItems);
      const absDiff = Math.abs(diff);
      let newActive = null;
      let newPosition = null;
      if (diff === 0) {
        newActive = "true";
      } else if (diff === -1 || diff === state.totalItems - 1) {
        newPosition = "left";
      } else if (diff === 1 || diff === -(state.totalItems - 1)) {
        newPosition = "right";
      } else {
        newPosition = "hidden";
      }
      const currentActive = card.getAttribute("data-carousel-active");
      const currentPosition = card.getAttribute("data-carousel-position");
      if (newActive !== currentActive) {
        if (newActive) {
          card.setAttribute("data-carousel-active", newActive);
        } else {
          card.removeAttribute("data-carousel-active");
        }
      }
      if (newPosition !== currentPosition) {
        if (newPosition) {
          card.setAttribute("data-carousel-position", newPosition);
        } else {
          card.removeAttribute("data-carousel-position");
        }
      }
    });
    if (dots.length === state.totalItems) {
      dots.forEach((dot, index) => {
        const isActive = index === state.currentIndex;
        const currentlyActive = dot.classList.contains("reviews__carousel-dot--active");
        if (isActive !== currentlyActive) {
          if (isActive) {
            dot.classList.add("reviews__carousel-dot--active");
            dot.setAttribute("aria-current", "true");
          } else {
            dot.classList.remove("reviews__carousel-dot--active");
            dot.removeAttribute("aria-current");
          }
        }
      });
    }
    if (prevButton) {
      prevButton.disabled = false;
    }
    if (nextButton) {
      nextButton.disabled = false;
    }
  }
  function normalizeIndex(index) {
    if (index < 0) {
      return state.totalItems + index % state.totalItems;
    }
    return index % state.totalItems;
  }
  function goToIndex(index) {
    if (state.isTransitioning) {
      return;
    }
    const normalizedIndex = normalizeIndex(index);
    if (normalizedIndex === state.currentIndex) {
      return;
    }
    state.isTransitioning = true;
    state.currentIndex = normalizedIndex;
    updateCarousel();
    setTimeout(() => {
      state.isTransitioning = false;
    }, transitionDuration);
  }
  function goToNext() {
    goToIndex(state.currentIndex + 1);
  }
  function goToPrev() {
    goToIndex(state.currentIndex - 1);
  }
  function startAutoplay() {
    if (prefersReducedMotion) {
      return;
    }
    stopAutoplay();
    state.autoplayInterval = setInterval(() => {
      if (!state.isAutoplayPaused && !state.isTransitioning) {
        goToNext();
      }
    }, 5e3);
  }
  function stopAutoplay() {
    if (state.autoplayInterval) {
      clearInterval(state.autoplayInterval);
      state.autoplayInterval = null;
    }
  }
  function pauseAutoplay() {
    state.isAutoplayPaused = true;
  }
  function resumeAutoplay() {
    state.isAutoplayPaused = false;
  }
  function handleTouchStart2(e) {
    if (e.touches.length > 0) {
      state.touchStartX = e.touches[0].clientX;
    }
  }
  function handleTouchMove(e) {
    if (!state.touchStartX || e.touches.length === 0) return;
    const currentX = e.touches[0].clientX;
    const deltaX = Math.abs(currentX - state.touchStartX);
    const deltaY = Math.abs(e.touches[0].clientY - (e.touches[0].clientY || 0));
    if (deltaX > deltaY && deltaX > 10) {
      e.preventDefault();
    }
  }
  function handleTouchEnd2(e) {
    if (!state.touchStartX) return;
    if (e.changedTouches && e.changedTouches.length > 0) {
      state.touchEndX = e.changedTouches[0].clientX;
      const diff = state.touchStartX - state.touchEndX;
      const minSwipeDistance = 50;
      if (Math.abs(diff) > minSwipeDistance) {
        if (diff > 0) {
          goToNext();
        } else {
          goToPrev();
        }
      }
    }
    state.touchStartX = 0;
    state.touchEndX = 0;
  }
  function handleMouseDown(e) {
    state.isMouseDown = true;
    state.mouseStartX = e.clientX;
    e.preventDefault();
  }
  function handleMouseMove(e) {
    if (!state.isMouseDown) return;
    e.preventDefault();
  }
  function handleMouseUp(e) {
    if (!state.isMouseDown) return;
    const diff = state.mouseStartX - e.clientX;
    const minDragDistance = 50;
    if (Math.abs(diff) > minDragDistance) {
      if (diff > 0) {
        goToNext();
      } else {
        goToPrev();
      }
    }
    state.isMouseDown = false;
    state.mouseStartX = 0;
  }
  function handleMouseLeave2() {
    state.isMouseDown = false;
    state.mouseStartX = 0;
  }
  carousel.setAttribute("role", "region");
  carousel.setAttribute("aria-label", "Customer reviews carousel");
  wrapper.setAttribute("role", "group");
  wrapper.setAttribute("aria-roledescription", "carousel");
  wrapper.setAttribute("aria-live", "polite");
  wrapper.setAttribute("tabindex", "0");
  if (prevButton && !prevButton.getAttribute("aria-label")) {
    prevButton.setAttribute("aria-label", "Previous review");
  }
  if (nextButton && !nextButton.getAttribute("aria-label")) {
    nextButton.setAttribute("aria-label", "Next review");
  }
  if (prevButton) {
    const prevHandler = () => {
      pauseAutoplay();
      goToPrev();
      setTimeout(() => resumeAutoplay(), 1e4);
    };
    prevButton.addEventListener("click", prevHandler);
    cleanupFunctions.push(() => prevButton?.removeEventListener("click", prevHandler));
  }
  if (nextButton) {
    const nextHandler = () => {
      pauseAutoplay();
      goToNext();
      setTimeout(() => resumeAutoplay(), 1e4);
    };
    nextButton.addEventListener("click", nextHandler);
    cleanupFunctions.push(() => nextButton?.removeEventListener("click", nextHandler));
  }
  if (dots.length === state.totalItems) {
    dots.forEach((dot) => {
      const dotIndexAttr = dot.getAttribute("data-carousel-dot");
      const dotIndex = dotIndexAttr !== null ? parseInt(dotIndexAttr, 10) : null;
      if (dotIndex === null || isNaN(dotIndex) || dotIndex < 0 || dotIndex >= state.totalItems) {
        console.warn("Invalid carousel dot index:", dotIndexAttr);
        return;
      }
      const handler = () => {
        pauseAutoplay();
        goToIndex(dotIndex);
        setTimeout(() => resumeAutoplay(), 1e4);
      };
      dot.addEventListener("click", handler);
      cleanupFunctions.push(() => dot.removeEventListener("click", handler));
      const keyHandler2 = (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          pauseAutoplay();
          goToIndex(dotIndex);
          setTimeout(() => resumeAutoplay(), 1e4);
        }
      };
      dot.addEventListener("keydown", keyHandler2);
      cleanupFunctions.push(() => dot.removeEventListener("keydown", keyHandler2));
    });
  }
  const touchStartHandler = (e) => {
    pauseAutoplay();
    handleTouchStart2(e);
  };
  wrapper.addEventListener("touchstart", touchStartHandler, { passive: true });
  cleanupFunctions.push(() => wrapper.removeEventListener("touchstart", touchStartHandler));
  wrapper.addEventListener("touchmove", handleTouchMove, { passive: false });
  cleanupFunctions.push(() => wrapper.removeEventListener("touchmove", handleTouchMove));
  const touchEndHandler = (e) => {
    handleTouchEnd2(e);
    setTimeout(() => resumeAutoplay(), 1e4);
  };
  wrapper.addEventListener("touchend", touchEndHandler, { passive: true });
  cleanupFunctions.push(() => wrapper.removeEventListener("touchend", touchEndHandler));
  const mouseDownHandler = (e) => {
    pauseAutoplay();
    handleMouseDown(e);
  };
  wrapper.addEventListener("mousedown", mouseDownHandler);
  cleanupFunctions.push(() => wrapper.removeEventListener("mousedown", mouseDownHandler));
  document.addEventListener("mousemove", handleMouseMove);
  cleanupFunctions.push(() => document.removeEventListener("mousemove", handleMouseMove));
  const mouseUpHandler = (e) => {
    handleMouseUp(e);
    setTimeout(() => resumeAutoplay(), 1e4);
  };
  document.addEventListener("mouseup", mouseUpHandler);
  cleanupFunctions.push(() => document.removeEventListener("mouseup", mouseUpHandler));
  wrapper.addEventListener("mouseleave", handleMouseLeave2);
  cleanupFunctions.push(() => wrapper.removeEventListener("mouseleave", handleMouseLeave2));
  const mouseEnterHandler = () => pauseAutoplay();
  const mouseLeaveHandler = () => resumeAutoplay();
  carousel.addEventListener("mouseenter", mouseEnterHandler);
  carousel.addEventListener("mouseleave", mouseLeaveHandler);
  cleanupFunctions.push(() => {
    carousel.removeEventListener("mouseenter", mouseEnterHandler);
    carousel.removeEventListener("mouseleave", mouseLeaveHandler);
  });
  const focusHandler = () => pauseAutoplay();
  const blurHandler = () => resumeAutoplay();
  wrapper.addEventListener("focusin", focusHandler);
  wrapper.addEventListener("focusout", blurHandler);
  cleanupFunctions.push(() => {
    wrapper.removeEventListener("focusin", focusHandler);
    wrapper.removeEventListener("focusout", blurHandler);
  });
  const keyHandler = (e) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      pauseAutoplay();
      goToPrev();
      setTimeout(() => resumeAutoplay(), 1e4);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      pauseAutoplay();
      goToNext();
      setTimeout(() => resumeAutoplay(), 1e4);
    }
  };
  wrapper.addEventListener("keydown", keyHandler);
  cleanupFunctions.push(() => wrapper.removeEventListener("keydown", keyHandler));
  cleanupFunctions.push(() => stopAutoplay());
  carouselCleanups.set(carousel, cleanupFunctions);
  updateCarousel();
  startAutoplay();
}
function enforceCarouselGridVisibility() {
  const reviewsSection = document.querySelector(".reviews--carousel");
  if (!reviewsSection) return;
  const carousel = reviewsSection.querySelector(".reviews__carousel");
  const mobileFallbackGrid = reviewsSection.querySelector(".reviews__grid--mobile-fallback");
  if (!carousel || !mobileFallbackGrid) return;
  const isTabletOrMobile = window.matchMedia("(max-width: 768px)").matches;
  if (isTabletOrMobile) {
    carousel.style.display = "none";
    mobileFallbackGrid.style.display = "grid";
  } else {
    carousel.style.display = "block";
    mobileFallbackGrid.style.display = "none";
  }
}
function initReviewsFilter() {
  const serviceFilterSelect = document.getElementById("reviews-service-filter");
  const locationFilterSelect = document.getElementById("reviews-location-filter");
  const brandFilterSelect = document.getElementById("reviews-brand-filter");
  const reviewsSection = document.querySelector(".reviews");
  if (!reviewsSection) {
    return;
  }
  const isCarouselMode = reviewsSection.classList.contains("reviews--carousel");
  const mobileFallbackGrid = reviewsSection.querySelector(".reviews__grid--mobile-fallback");
  const isTabletOrMobile = window.matchMedia("(max-width: 768px)").matches;
  let reviewCards = [];
  if (isCarouselMode) {
    if (isTabletOrMobile && mobileFallbackGrid) {
      reviewCards = Array.from(mobileFallbackGrid.querySelectorAll(".review-card"));
    } else {
      const carousel = reviewsSection.querySelector(".reviews__carousel");
      if (carousel) {
        reviewCards = Array.from(carousel.querySelectorAll(".review-card--carousel"));
      }
    }
  } else {
    const grid = reviewsSection.querySelector(".reviews__grid");
    if (grid) {
      reviewCards = Array.from(grid.querySelectorAll(".review-card"));
    }
  }
  if (reviewCards.length === 0) {
    return;
  }
  const originalDisplay = /* @__PURE__ */ new Map();
  reviewCards.forEach((card) => {
    const computedStyle = window.getComputedStyle(card);
    if (computedStyle.display !== "none") {
      originalDisplay.set(card, computedStyle.display);
    }
  });
  function filterReviews() {
    const serviceType = serviceFilterSelect?.value || "";
    const location2 = locationFilterSelect?.value || "";
    const brand = brandFilterSelect?.value || "";
    let visibleCount = 0;
    reviewCards.forEach((card) => {
      const cardServiceType = card.getAttribute("data-service-type")?.toLowerCase() || "";
      const cardLocation = card.getAttribute("data-location") || "";
      const cardBrand = card.getAttribute("data-brand") || "";
      const serviceMatch = !serviceType || cardServiceType === serviceType.toLowerCase();
      const locationMatch = !location2 || cardLocation === location2;
      const brandMatch = !brand || cardBrand === brand;
      if (serviceMatch && locationMatch && brandMatch) {
        const original = originalDisplay.get(card);
        if (original) {
          card.style.display = original;
        } else {
          card.style.removeProperty("display");
        }
        visibleCount++;
      } else {
        card.style.display = "none";
      }
    });
    if (isCarouselMode) {
      enforceCarouselGridVisibility();
    }
    if (!reviewsSection) return;
    let noResultsMsg = reviewsSection.querySelector(".reviews__no-results");
    const grid = reviewsSection.querySelector(".reviews__grid");
    const carousel = reviewsSection.querySelector(".reviews__carousel");
    if (visibleCount === 0) {
      if (!noResultsMsg) {
        noResultsMsg = document.createElement("p");
        noResultsMsg.className = "reviews__no-results";
        const filters = [];
        if (serviceType) filters.push(capitalize(serviceType));
        if (location2) filters.push(location2);
        if (brand) filters.push(brand);
        const filterText = filters.length > 0 ? filters.join(", ") : "selected filters";
        noResultsMsg.textContent = `No reviews found for ${filterText}.`;
        if (grid) {
          grid.appendChild(noResultsMsg);
        } else if (carousel) {
          carousel.appendChild(noResultsMsg);
        }
      }
    } else {
      noResultsMsg?.remove();
    }
  }
  if (serviceFilterSelect) {
    serviceFilterSelect.addEventListener("change", filterReviews);
  }
  if (locationFilterSelect) {
    locationFilterSelect.addEventListener("change", filterReviews);
  }
  if (brandFilterSelect) {
    brandFilterSelect.addEventListener("change", filterReviews);
  }
  filterReviews();
}
function initReviews() {
  if (document.querySelector("[data-reviews-carousel]")) {
    initReviewsCarousel();
    enforceCarouselGridVisibility();
    let resizeTimeout3 = null;
    window.addEventListener("resize", () => {
      if (resizeTimeout3) clearTimeout(resizeTimeout3);
      resizeTimeout3 = setTimeout(() => {
        enforceCarouselGridVisibility();
      }, 100);
    });
  }
  if (document.getElementById("reviews-service-filter") || document.getElementById("reviews-location-filter") || document.getElementById("reviews-brand-filter")) {
    initReviewsFilter();
  }
}

// ns-hugo-imp:C:\Users\maxim\Documents\Dev\arsrepairs.com\themes\arsrepairs-theme\assets\ts\modules\confetti.ts
var DEFAULT_OPTIONS = {
  particleCount: 100,
  spread: 360,
  originX: 0.5,
  // 0-1, where 0.5 is center (not used for rain effect)
  originY: 0.5
  // 0-1, where 0.5 is center (not used for rain effect)
};
function createConfetti(options = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  let container = document.querySelector(".confetti-container");
  if (!container) {
    container = document.createElement("div");
    container.className = "confetti-container";
    document.body.appendChild(container);
  }
  container.innerHTML = "";
  for (let i = 0; i < opts.particleCount; i++) {
    const particle = document.createElement("div");
    particle.className = "confetti-particle";
    const startX = Math.random() * viewportWidth;
    const startY = -20 - Math.random() * 20;
    const horizontalDrift = (Math.random() - 0.5) * 100;
    const fallDistance = viewportHeight + 40;
    const rotation = Math.random() * 720 - 360;
    const delay = Math.random() * 0.5;
    particle.style.left = `${startX}px`;
    particle.style.top = `${startY}px`;
    particle.style.setProperty("--confetti-x", `${horizontalDrift}px`);
    particle.style.setProperty("--confetti-y", `${fallDistance}px`);
    particle.style.setProperty("--confetti-rotate", `${rotation}deg`);
    particle.style.setProperty("--confetti-delay", `${delay}s`);
    container.appendChild(particle);
  }
  setTimeout(() => {
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
  }, 2500);
}

// ns-hugo-imp:C:\Users\maxim\Documents\Dev\arsrepairs.com\themes\arsrepairs-theme\assets\ts\modules\vip-modal.ts
var SELECTORS = {
  modal: "#vip-membership-modal",
  openTriggers: "[data-vip-modal-open]",
  closeTriggers: "[data-vip-modal-close]",
  successMessage: "#success-message"
};
var lastFocusedElement = null;
function getFocusableElements(container) {
  const focusableSelectors = [
    "a[href]",
    "button:not([disabled])",
    'input:not([disabled]):not([type="hidden"])',
    "select:not([disabled])",
    "textarea:not([disabled])",
    '[tabindex]:not([tabindex="-1"])'
  ].join(", ");
  return Array.from(container.querySelectorAll(focusableSelectors)).filter(
    (el) => !el.hasAttribute("aria-hidden") && !el.closest("[aria-hidden='true']")
  );
}
function openModal(modal) {
  if (modal.getAttribute("aria-hidden") === "false") return;
  lastFocusedElement = document.activeElement || null;
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  confettiTriggered = false;
  const focusable = getFocusableElements(modal);
  const firstFocusable = focusable[0];
  if (firstFocusable) {
    firstFocusable.focus();
  }
  modal.addEventListener("keydown", handleKeydown);
  setTimeout(watchForSuccess, 100);
}
function closeModal(modal) {
  if (modal.getAttribute("aria-hidden") === "true") return;
  modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
  modal.removeEventListener("keydown", handleKeydown);
  if (lastFocusedElement && document.contains(lastFocusedElement)) {
    lastFocusedElement.focus();
  }
}
function handleKeydown(event) {
  const modal = document.querySelector(SELECTORS.modal);
  if (!modal || modal.getAttribute("aria-hidden") === "true") return;
  if (event.key === "Escape") {
    event.preventDefault();
    closeModal(modal);
    return;
  }
  if (event.key === "Tab") {
    const focusable = getFocusableElements(modal);
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const current = document.activeElement;
    if (event.shiftKey) {
      if (current === first || !modal.contains(current)) {
        event.preventDefault();
        last.focus();
      }
    } else {
      if (current === last || !modal.contains(current)) {
        event.preventDefault();
        first.focus();
      }
    }
  }
}
var confettiTriggered = false;
function triggerConfettiIfSuccess() {
  if (confettiTriggered) return true;
  const successMessage = document.querySelector(SELECTORS.successMessage);
  const modal = document.querySelector(SELECTORS.modal);
  if (!successMessage || !modal || modal.getAttribute("aria-hidden") === "true") {
    return false;
  }
  const isVisible = successMessage.offsetParent !== null && window.getComputedStyle(successMessage).display !== "none" && successMessage.textContent?.trim();
  if (isVisible) {
    confettiTriggered = true;
    createConfetti({
      particleCount: 120
    });
    return true;
  }
  return false;
}
function watchForSuccess() {
  const successMessage = document.querySelector(SELECTORS.successMessage);
  if (!successMessage) return;
  const observer = new MutationObserver(() => {
    if (triggerConfettiIfSuccess()) {
      observer.disconnect();
      clearInterval(checkInterval);
    }
  });
  observer.observe(successMessage, {
    attributes: true,
    attributeFilter: ["style", "class"],
    childList: true,
    subtree: true
  });
  let checkCount = 0;
  const maxChecks = 20;
  const checkInterval = setInterval(() => {
    checkCount++;
    if (triggerConfettiIfSuccess()) {
      observer.disconnect();
      clearInterval(checkInterval);
      return;
    }
    if (checkCount >= maxChecks) {
      clearInterval(checkInterval);
      observer.disconnect();
    }
  }, 500);
}
function initVIPModal() {
  const modal = document.querySelector(SELECTORS.modal);
  const openButtons = document.querySelectorAll(SELECTORS.openTriggers);
  const closeButtons = document.querySelectorAll(SELECTORS.closeTriggers);
  if (!modal || openButtons.length === 0) {
    return;
  }
  openButtons.forEach((btn) => {
    btn.addEventListener("click", (event) => {
      event.preventDefault();
      openModal(modal);
    });
  });
  closeButtons.forEach((btn) => {
    btn.addEventListener("click", (event) => {
      event.preventDefault();
      closeModal(modal);
    });
  });
  const backdrop = modal.querySelector(".modal__backdrop");
  if (backdrop) {
    backdrop.addEventListener("click", (event) => {
      event.preventDefault();
      closeModal(modal);
    });
  }
}

// ns-hugo-imp:C:\Users\maxim\Documents\Dev\arsrepairs.com\themes\arsrepairs-theme\assets\ts\modules\booking-iframe.ts
init_dom();
var DEV_LOG2 = isLocalhost();
var BOOKING_IFRAME_ORIGIN = "https://booking.rossware.com";
var THANK_YOU_PAGE_URL = "/schedule-service/thank-you/";
function devLog2(...args) {
  if (DEV_LOG2) {
    console.log("[Booking Iframe]", ...args);
  }
}
function devError2(...args) {
  if (DEV_LOG2) {
    console.error("[Booking Iframe]", ...args);
  }
}
function trackConversionGA(data) {
  if (typeof window === "undefined" || !window.gtag) {
    devLog2("Google Analytics (gtag) not available");
    return;
  }
  try {
    window.gtag("event", "booking_submission", {
      event_category: "Booking",
      event_label: "Online Booking",
      value: 1
    });
    devLog2("Conversion tracked in Google Analytics", data);
  } catch (error) {
    devError2("Error tracking conversion in Google Analytics:", error);
  }
}
function trackConversionFB(data) {
  if (typeof window === "undefined" || !window.fbq) {
    devLog2("Facebook Pixel not available");
    return;
  }
  try {
    window.fbq("track", "Lead", {
      content_name: "Online Booking",
      content_category: "Appointment Booking"
    });
    window.fbq("trackCustom", "BookingSubmission", {
      source: "booking_iframe"
    });
    devLog2("Conversion tracked in Facebook Pixel", data);
  } catch (error) {
    devError2("Error tracking conversion in Facebook Pixel:", error);
  }
}
function trackConversionDataLayer(data) {
  if (typeof window === "undefined" || !window.dataLayer) {
    devLog2("dataLayer not available");
    return;
  }
  try {
    window.dataLayer.push({
      event: "booking_submission",
      event_category: "Booking",
      event_label: "Online Booking",
      value: 1,
      booking_data: data
    });
    devLog2("Conversion tracked in dataLayer", data);
  } catch (error) {
    devError2("Error tracking conversion in dataLayer:", error);
  }
}
function trackConversion(bookingData) {
  devLog2("Tracking conversion for booking submission");
  trackConversionGA(bookingData);
  trackConversionFB(bookingData);
  trackConversionDataLayer(bookingData);
}
function isBookingSubmission(data) {
  if (!data || typeof data !== "object") {
    return false;
  }
  const message = data;
  if (message.type === "booking_success" || message.event === "booking_success" || message.status === "success" || message.action === "booking_complete" || message.booking_status === "completed" || message.submitted === true || message.success === true) {
    return true;
  }
  if (typeof message.type === "string") {
    const type = message.type.toLowerCase();
    if (type.includes("success") || type.includes("complete") || type.includes("submit")) {
      return true;
    }
  }
  if (typeof message.event === "string") {
    const event = message.event.toLowerCase();
    if (event.includes("success") || event.includes("complete") || event.includes("submit")) {
      return true;
    }
  }
  return false;
}
function handleBookingSuccess(event, bookingData) {
  devLog2("Booking submission detected", event.data);
  try {
    sessionStorage.setItem("ars_booking_submitted", "true");
    sessionStorage.setItem("ars_booking_timestamp", Date.now().toString());
    if (bookingData) {
      try {
        sessionStorage.setItem("ars_booking_data", JSON.stringify(bookingData));
      } catch (e) {
        devLog2("Could not store booking data in sessionStorage");
      }
    }
  } catch (e) {
    devLog2("Could not write to sessionStorage:", e);
  }
  trackConversion(bookingData || event.data);
  devLog2("Redirecting to thank-you page:", THANK_YOU_PAGE_URL);
  window.location.replace(THANK_YOU_PAGE_URL);
}
function checkForBookingSubmission() {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const successParams = ["success", "booking", "submitted", "confirmed", "complete", "thankyou"];
    let hasSuccessParam = false;
    for (const param of successParams) {
      const value = urlParams.get(param);
      if (value && (value === "1" || value === "true" || value.toLowerCase().includes("success"))) {
        hasSuccessParam = true;
        devLog2(`\u2713 Success parameter detected in URL: ${param}=${value}`);
        break;
      }
    }
    if (hasSuccessParam) {
      const newUrl = window.location.pathname;
      window.history.replaceState({}, "", newUrl);
      trackConversion();
      devLog2("Redirecting to thank-you page based on URL parameter");
      window.location.replace(THANK_YOU_PAGE_URL);
      return;
    }
    const bookingSubmitted = sessionStorage.getItem("ars_booking_submitted");
    const bookingTimestamp = sessionStorage.getItem("ars_booking_timestamp");
    if (bookingSubmitted === "true" && bookingTimestamp) {
      const timestamp = parseInt(bookingTimestamp, 10);
      const now = Date.now();
      const timeDiff = now - timestamp;
      if (timeDiff < 1e4) {
        devLog2("\u2713 Booking submission detected from sessionStorage (postMessage)");
        devLog2(`Time since submission: ${timeDiff}ms`);
        let bookingData = null;
        try {
          const dataStr = sessionStorage.getItem("ars_booking_data");
          if (dataStr) {
            bookingData = JSON.parse(dataStr);
          }
        } catch (e) {
        }
        sessionStorage.removeItem("ars_booking_submitted");
        sessionStorage.removeItem("ars_booking_timestamp");
        sessionStorage.removeItem("ars_booking_data");
        sessionStorage.removeItem("ars_booking_saw_confirmation");
        sessionStorage.removeItem("ars_booking_confirmation_timestamp");
        sessionStorage.removeItem("ars_booking_potential_submission");
        sessionStorage.removeItem("ars_booking_potential_timestamp");
        trackConversion(bookingData);
        devLog2("Redirecting to thank-you page:", THANK_YOU_PAGE_URL);
        window.location.replace(THANK_YOU_PAGE_URL);
        return;
      } else {
        devLog2("Clearing stale booking submission data");
        sessionStorage.removeItem("ars_booking_submitted");
        sessionStorage.removeItem("ars_booking_timestamp");
        sessionStorage.removeItem("ars_booking_data");
      }
    }
    const sawConfirmation = sessionStorage.getItem("ars_booking_saw_confirmation");
    const confirmationTimestamp = sessionStorage.getItem("ars_booking_confirmation_timestamp");
    const potentialSubmission = sessionStorage.getItem("ars_booking_potential_submission");
    const potentialTimestamp = sessionStorage.getItem("ars_booking_potential_timestamp");
    if (sawConfirmation === "true" && potentialSubmission === "true" && confirmationTimestamp && potentialTimestamp) {
      const confTime = parseInt(confirmationTimestamp, 10);
      const potTime = parseInt(potentialTimestamp, 10);
      const now = Date.now();
      if (now - confTime < 15e3 && now - potTime < 15e3) {
        devLog2("\u2713 Potential booking submission detected (confirmation + refresh pattern)");
        devLog2("Redirecting to thank-you page based on iframe confirmation pattern");
        sessionStorage.removeItem("ars_booking_saw_confirmation");
        sessionStorage.removeItem("ars_booking_confirmation_timestamp");
        sessionStorage.removeItem("ars_booking_potential_submission");
        sessionStorage.removeItem("ars_booking_potential_timestamp");
        trackConversion();
        window.location.replace(THANK_YOU_PAGE_URL);
        return;
      } else {
        sessionStorage.removeItem("ars_booking_saw_confirmation");
        sessionStorage.removeItem("ars_booking_confirmation_timestamp");
        sessionStorage.removeItem("ars_booking_potential_submission");
        sessionStorage.removeItem("ars_booking_potential_timestamp");
      }
    }
  } catch (e) {
    devLog2("Error checking for booking submission:", e);
  }
}
function initBookingIframeListener() {
  const iframe = document.querySelector(".booking-iframe");
  if (!iframe) {
    devLog2("Booking iframe not found on page");
    return;
  }
  devLog2("Initializing booking iframe listener");
  devLog2("Waiting for booking submission events from iframe...");
  devLog2("NOTE: Initialization data (id, ClientName) on page load is NOT a submission");
  devLog2("NOTE: Cannot monitor network requests from cross-origin iframes (browser security)");
  let messageCount = 0;
  let initialHeight = iframe.offsetHeight;
  let loadCount = 0;
  let redirectIntercepted = false;
  const currentUrl = window.location.href;
  window.addEventListener("message", (event) => {
    if (event.origin !== BOOKING_IFRAME_ORIGIN) {
      devLog2("Ignoring message from unauthorized origin:", event.origin);
      return;
    }
    messageCount++;
    devLog2(`Message #${messageCount} received from booking iframe:`, {
      data: event.data,
      origin: event.origin,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
    try {
      devLog2("Full message structure:", JSON.stringify(event.data, null, 2));
    } catch (e) {
      devLog2("Could not stringify message data");
    }
    if (isBookingSubmission(event.data)) {
      devLog2("\u2713 Booking submission detected via postMessage!");
      redirectIntercepted = true;
      handleBookingSuccess(event, event.data);
    } else {
      devLog2("Message does not match submission criteria (this is normal for initialization/data messages)");
    }
  }, false);
  let lastIframeLoadTime = Date.now();
  let iframeLoadEvents = 0;
  window.addEventListener("beforeunload", () => {
    try {
      const timeSinceLastLoad = Date.now() - lastIframeLoadTime;
      if (iframeLoadEvents > 1 && timeSinceLastLoad < 5e3) {
        devLog2("Multiple iframe loads detected before page unload - might be booking submission");
        sessionStorage.setItem("ars_booking_potential_submission", "true");
        sessionStorage.setItem("ars_booking_potential_timestamp", Date.now().toString());
      }
    } catch (e) {
    }
  });
  iframe.addEventListener("load", () => {
    loadCount++;
    iframeLoadEvents++;
    lastIframeLoadTime = Date.now();
    devLog2(`Iframe load event #${loadCount} detected`);
    devLog2("NOTE: Cannot read iframe URL due to cross-origin restrictions");
    const currentHeight = iframe.offsetHeight;
    const heightDiff = Math.abs(currentHeight - initialHeight);
    if (loadCount > 1) {
      devLog2(`Iframe loaded ${loadCount} times. Height: ${currentHeight}px (initial: ${initialHeight}px, diff: ${heightDiff}px)`);
      if (heightDiff > 100) {
        devLog2(`Significant height change detected (${heightDiff}px). This might indicate a success/confirmation page.`);
        setTimeout(() => {
          try {
            if (document.querySelector(".booking-iframe")) {
              devLog2("Page still loaded after iframe height change - monitoring for page refresh");
              sessionStorage.setItem("ars_booking_saw_confirmation", "true");
              sessionStorage.setItem("ars_booking_confirmation_timestamp", Date.now().toString());
            }
          } catch (e) {
          }
        }, 1e3);
      }
    }
  });
  devLog2("Booking iframe listener initialized and ready");
  devLog2(`Initial iframe height: ${initialHeight}px`);
  devLog2("Monitoring for: postMessage events, parent page redirects, and iframe navigation");
}
var initBookingIframe = () => {
  onDOMReady(() => {
    checkForBookingSubmission();
    initBookingIframeListener();
  });
};

// <stdin>
var init = () => {
  try {
    initNav();
    initHeaderShadow();
    initPhoneLinks();
    initYearStamp();
    initDropdownHover();
    initPageHeaderCityPersonalization();
    initGeolocationShortcodes();
    initServicesAutoScroll();
    initTOC();
    initSmoothScroll();
    initFAQ();
    initVIPModal();
    if (document.querySelector('form[name="feedback"]')) {
      initFeedback();
    }
    if (document.querySelector('[data-reviews-form="true"]')) {
      initReviewsForm();
    }
    if (document.querySelector(".reviews")) {
      initReviews();
    }
    if (document.getElementById("service-areas-leaflet-map")) {
      initServiceAreasLeaflet();
    }
    if (document.querySelector(".booking-iframe")) {
      initBookingIframe();
    }
    const isDev = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
    if (isDev) {
      document.documentElement.setAttribute("data-dev-mode", "true");
      if (document.querySelector(".page-list-container")) {
        initPageList();
        initPageListSidebar();
      }
      initDevScoreBubble();
    }
    if (document.querySelector("[data-blog-controls]")) {
      initBlog();
    }
    if (document.querySelector(".section-sitemap")) {
      initSitemap();
    }
  } catch (error) {
    console.error("Error initializing application:", error);
  }
};
onDOMReady(init);
var resizeTimeout2;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimeout2);
  resizeTimeout2 = setTimeout(() => {
    if (window.innerWidth > MOBILE_BREAKPOINT) {
      resetDropdowns();
    }
    initDropdownHover();
    initServicesAutoScroll();
    initTOC();
  }, RESIZE_DEBOUNCE_DELAY);
});
