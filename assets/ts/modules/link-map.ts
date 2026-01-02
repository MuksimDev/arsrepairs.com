/**
 * Link Map Visualization Module
 * 
 * Creates an interactive force-directed graph visualization of internal page links
 * using D3.js for graph layout and rendering.
 */

import { escapeHtml } from "../utils/dev-ui";

interface LinkMapNode {
  id: string;
  title: string;
  url: string;
  section: string;
  parentPath: string;
  inboundLinks: number;
  outboundLinks: number;
  isExternal?: boolean;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

interface LinkMapLink {
  source: string | LinkMapNode;
  target: string | LinkMapNode;
}

interface PageData {
  title: string;
  relPermalink: string;
  section: string;
  topics?: string[];
  brokenLinkUrls?: string[];
  totalInternalLinks: number;
  [key: string]: any;
}

/**
 * Extract internal links from page content
 * This parses the page data to find internal links
 */
function extractInternalLinks(pages: PageData[]): Map<string, string[]> {
  const linkMap = new Map<string, string[]>();
  
  // Initialize all pages
  pages.forEach(page => {
    linkMap.set(page.relPermalink, []);
  });
  
  // Extract links from brokenLinkUrls and other sources
  // For now, we'll need to parse the actual content or use a different approach
  // Since we don't have direct access to the HTML content, we'll use a placeholder
  // In a real implementation, you'd fetch the page content and parse it
  
  return linkMap;
}

/**
 * Get parent path from URL
 */
function getParentPath(url: string): string {
  if (url === '/') return '/';
  const parts = url.split('/').filter(p => p);
  if (parts.length === 0) return '/';
  return '/' + parts[0] + '/';
}

// Color cache to avoid recalculating colors
const colorCache = new Map<string, string>();

/**
 * Generate color for section/parent path
 * Memoized for performance
 */
function getColorForSection(section: string, parentPath: string, index: number): string {
  // Use a color palette that's visually distinct
  const colors = [
    '#4A90E2', // Blue
    '#50C878', // Green
    '#FF6B6B', // Red
    '#FFA500', // Orange
    '#9B59B6', // Purple
    '#1ABC9C', // Teal
    '#E74C3C', // Dark Red
    '#3498DB', // Light Blue
    '#2ECC71', // Light Green
    '#F39C12', // Dark Orange
    '#E67E22', // Brown
    '#16A085', // Dark Teal
    '#8E44AD', // Dark Purple
    '#34495E', // Dark Blue-Gray
    '#95A5A6', // Gray
    '#D35400', // Dark Orange
  ];
  
  // Try to use section first, then parent path
  const key = section || parentPath || '/';
  
  // Check cache first
  if (colorCache.has(key)) {
    return colorCache.get(key)!;
  }
  
  // Create a simple hash from the key
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = key.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Use absolute value and modulo to get color index
  const colorIndex = Math.abs(hash) % colors.length;
  const color = colors[colorIndex];
  
  // Cache the result
  colorCache.set(key, color);
  return color;
}

/**
 * Build topics-based graph data structure
 */
function buildTopicsGraphData(pages: PageData[], links: Map<string, string[]>): { nodes: LinkMapNode[]; links: LinkMapLink[]; colorMap: Map<string, string> } {
  const nodes: LinkMapNode[] = [];
  const linkList: LinkMapLink[] = [];
  const nodeMap = new Map<string, LinkMapNode>();
  const colorMap = new Map<string, string>();
  const topicPages = new Map<string, PageData[]>();
  
  // Group pages by topic
  pages.forEach(page => {
    const topics = page.topics || [];
    if (topics.length === 0) {
      // Pages without topics go to "Untagged" topic
      const untaggedKey = 'untagged';
      if (!topicPages.has(untaggedKey)) {
        topicPages.set(untaggedKey, []);
      }
      topicPages.get(untaggedKey)!.push(page);
    } else {
      topics.forEach(topic => {
        if (!topicPages.has(topic)) {
          topicPages.set(topic, []);
        }
        topicPages.get(topic)!.push(page);
      });
    }
  });
  
  // Assign colors to topics
  let colorIndex = 0;
  topicPages.forEach((_, topicKey) => {
    if (!colorMap.has(topicKey)) {
      colorMap.set(topicKey, getColorForSection(topicKey, '', colorIndex++));
    }
  });
  
  // Create topic nodes
  topicPages.forEach((pagesInTopic, topicKey) => {
    const topicNode: LinkMapNode = {
      id: `topic:${topicKey}`,
      title: topicKey === 'untagged' ? 'Untagged' : topicKey,
      url: `#topic:${topicKey}`,
      section: topicKey,
      parentPath: topicKey,
      inboundLinks: 0,
      outboundLinks: 0
    };
    nodes.push(topicNode);
    nodeMap.set(`topic:${topicKey}`, topicNode);
  });
  
  // Build topic-to-topic links based on page links
  const topicLinks = new Map<string, Set<string>>();
  
  links.forEach((targetUrls, sourceUrl) => {
    const sourcePage = pages.find(p => p.relPermalink === sourceUrl);
    if (!sourcePage) return;
    
    const sourceTopics = sourcePage.topics || [];
    const sourceTopicKeys = sourceTopics.length > 0 ? sourceTopics : ['untagged'];
    
    targetUrls.forEach(targetUrl => {
      const targetPath = targetUrl.split('#')[0];
      const targetPage = pages.find(p => p.relPermalink === targetPath);
      if (!targetPage) return;
      
      const targetTopics = targetPage.topics || [];
      const targetTopicKeys = targetTopics.length > 0 ? targetTopics : ['untagged'];
      
      // Create links between all source topics and all target topics
      sourceTopicKeys.forEach(sourceTopic => {
        targetTopicKeys.forEach(targetTopic => {
          // Only create link if topics are different
          if (sourceTopic !== targetTopic) {
            const sourceKey = `topic:${sourceTopic}`;
            const targetKey = `topic:${targetTopic}`;
            
            if (!topicLinks.has(sourceKey)) {
              topicLinks.set(sourceKey, new Set());
            }
            topicLinks.get(sourceKey)!.add(targetKey);
          }
        });
      });
    });
  });
  
  // Create link objects and count links
  topicLinks.forEach((targetTopics, sourceTopic) => {
    const sourceNode = nodeMap.get(sourceTopic);
    if (!sourceNode) return;
    
    sourceNode.outboundLinks = targetTopics.size;
    
    targetTopics.forEach(targetTopic => {
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

/**
 * Build section-based graph data structure
 */
function buildSectionGraphData(pages: PageData[], links: Map<string, string[]>): { nodes: LinkMapNode[]; links: LinkMapLink[]; colorMap: Map<string, string> } {
  const nodes: LinkMapNode[] = [];
  const linkList: LinkMapLink[] = [];
  const nodeMap = new Map<string, LinkMapNode>();
  const colorMap = new Map<string, string>();
  const sectionPages = new Map<string, PageData[]>();
  
  // Group pages by section
  pages.forEach(page => {
    const section = page.section || '';
    const parentPath = getParentPath(page.relPermalink);
    const sectionKey = section || parentPath;
    
    if (!sectionPages.has(sectionKey)) {
      sectionPages.set(sectionKey, []);
    }
    sectionPages.get(sectionKey)!.push(page);
  });
  
  // Assign colors to sections
  let colorIndex = 0;
  sectionPages.forEach((_, sectionKey) => {
    if (!colorMap.has(sectionKey)) {
      const parentPath = sectionKey.startsWith('/') ? sectionKey : getParentPath('/' + sectionKey + '/');
      colorMap.set(sectionKey, getColorForSection(sectionKey, parentPath, colorIndex++));
    }
  });
  
  // Create section nodes
  sectionPages.forEach((pagesInSection, sectionKey) => {
    const sectionNode: LinkMapNode = {
      id: sectionKey,
      title: sectionKey === '/' ? 'Home' : (sectionKey || 'Other'),
      url: sectionKey,
      section: sectionKey,
      parentPath: sectionKey,
      inboundLinks: 0,
      outboundLinks: 0
    };
    nodes.push(sectionNode);
    nodeMap.set(sectionKey, sectionNode);
  });
  
  // Build section-to-section links
  const sectionLinks = new Map<string, Set<string>>();
  
  links.forEach((targetUrls, sourceUrl) => {
    const sourcePage = pages.find(p => p.relPermalink === sourceUrl);
    if (!sourcePage) return;
    
    const sourceSection = sourcePage.section || getParentPath(sourcePage.relPermalink);
    
    targetUrls.forEach(targetUrl => {
      const targetPath = targetUrl.split('#')[0];
      const targetPage = pages.find(p => p.relPermalink === targetPath);
      if (!targetPage) return;
      
      const targetSection = targetPage.section || getParentPath(targetPage.relPermalink);
      
      // Only create link if sections are different
      if (sourceSection !== targetSection) {
        if (!sectionLinks.has(sourceSection)) {
          sectionLinks.set(sourceSection, new Set());
        }
        sectionLinks.get(sourceSection)!.add(targetSection);
      }
    });
  });
  
  // Create link objects and count links
  sectionLinks.forEach((targetSections, sourceSection) => {
    const sourceNode = nodeMap.get(sourceSection);
    if (!sourceNode) return;
    
    sourceNode.outboundLinks = targetSections.size;
    
    targetSections.forEach(targetSection => {
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

/**
 * Extract external links from pages
 * This function attempts to extract external link URLs from page data
 */
function extractExternalLinks(pages: PageData[]): Map<string, string[]> {
  const externalLinksMap = new Map<string, string[]>();
  const pageUrls = new Set(pages.map(p => p.relPermalink));
  
  pages.forEach(page => {
    const externalLinks: string[] = [];
    
    // Try to get external links from page data if available
    // This would need to be populated from page content parsing
    // For now, we'll create a placeholder that can be enhanced
    
    // If page has external link data, use it
    // Otherwise, we'll need to parse content or use a different approach
    
    externalLinksMap.set(page.relPermalink, externalLinks);
  });
  
  return externalLinksMap;
}

/**
 * Build graph data structure from pages and links
 */
function buildGraphData(pages: PageData[], links: Map<string, string[]>): { nodes: LinkMapNode[]; links: LinkMapLink[]; colorMap: Map<string, string> } {
  const nodes: LinkMapNode[] = [];
  const linkList: LinkMapLink[] = [];
  const nodeMap = new Map<string, LinkMapNode>();
  const externalNodeMap = new Map<string, LinkMapNode>();
  const colorMap = new Map<string, string>();
  
  // First pass: collect all unique sections/parent paths
  const sections = new Set<string>();
  pages.forEach(page => {
    const section = page.section || '';
    const parentPath = getParentPath(page.relPermalink);
    sections.add(section || parentPath);
  });
  
  // Assign colors to sections
  let colorIndex = 0;
  sections.forEach(section => {
    if (!colorMap.has(section)) {
      const parentPath = section.startsWith('/') ? section : getParentPath('/' + section + '/');
      colorMap.set(section, getColorForSection(section, parentPath, colorIndex++));
    }
  });
  
  // Create internal page nodes
  pages.forEach(page => {
    const section = page.section || '';
    const parentPath = getParentPath(page.relPermalink);
    const sectionKey = section || parentPath;
    
    const node: LinkMapNode = {
      id: page.relPermalink,
      title: page.title,
      url: page.relPermalink,
      section: section,
      parentPath: parentPath,
      inboundLinks: 0,
      outboundLinks: 0,
      isExternal: false
    };
    nodes.push(node);
    nodeMap.set(page.relPermalink, node);
    
    // Ensure color is assigned
    if (!colorMap.has(sectionKey)) {
      colorMap.set(sectionKey, getColorForSection(section, parentPath, colorIndex++));
    }
  });
  
  // Extract and create external link nodes
  const externalLinksMap = extractExternalLinksFromPages(pages);
  externalLinksMap.forEach((externalUrls, sourceUrl) => {
    const sourceNode = nodeMap.get(sourceUrl);
    if (!sourceNode) return;
    
    externalUrls.forEach(externalUrl => {
      // Create or get external node
      let externalNode = externalNodeMap.get(externalUrl);
      if (!externalNode) {
        // Extract domain name for title
        try {
          const urlObj = new URL(externalUrl);
          const domain = urlObj.hostname.replace('www.', '');
          externalNode = {
            id: `external:${externalUrl}`,
            title: domain,
            url: externalUrl,
            section: 'external',
            parentPath: 'external',
            inboundLinks: 0,
            outboundLinks: 0,
            isExternal: true
          };
          nodes.push(externalNode);
          externalNodeMap.set(externalUrl, externalNode);
        } catch (e) {
          // Invalid URL, skip
          return;
        }
      }
      
      // Create link from source to external node
      externalNode.inboundLinks++;
      sourceNode.outboundLinks++;
      linkList.push({
        source: sourceNode,
        target: externalNode
      });
    });
  });
  
  // Count internal outbound links and create link objects
  links.forEach((targetUrls, sourceUrl) => {
    const sourceNode = nodeMap.get(sourceUrl);
    if (!sourceNode) return;
    
    // Count only internal links (external links already counted above)
    const internalTargetUrls = targetUrls.filter(url => {
      const path = url.split('#')[0];
      return nodeMap.has(path);
    });
    
    sourceNode.outboundLinks += internalTargetUrls.length;
    
    targetUrls.forEach(targetUrl => {
      // Remove anchor fragments for matching
      const targetPath = targetUrl.split('#')[0];
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

/**
 * Render the link map visualization
 */
export function renderLinkMap(container: HTMLElement, pages: PageData[]): void {
  // Check if D3.js is available
  if (typeof (window as any).d3 === 'undefined') {
    // Load D3.js from CDN
    const script = document.createElement('script');
    script.src = 'https://d3js.org/d3.v7.min.js';
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

/**
 * Initialize the link map visualization
 */
function initializeLinkMap(container: HTMLElement, pages: PageData[]): void {
  const d3 = (window as any).d3;
  
  if (!pages || pages.length === 0) {
    container.innerHTML = `
      <div class="page-list-link-map__empty">
        <p>No pages yet—add some!</p>
      </div>
    `;
    return;
  }
  
  // Extract internal links from pages
  // For now, we'll create a basic structure
  // In production, you'd parse the actual HTML content
  const links = extractInternalLinksFromPages(pages);
  
  // Build all three graph data structures
  const pagesGraphData = buildGraphData(pages, links);
  const sectionsGraphData = buildSectionGraphData(pages, links);
  const topicsGraphData = buildTopicsGraphData(pages, links);
  
  // Track current view mode
  type ViewMode = 'pages' | 'sections' | 'topics';
  let currentViewMode: ViewMode = 'pages';
  let currentGraphData = pagesGraphData;
  
  // Track link direction mode
  type LinkDirectionMode = 'outbound' | 'inbound';
  let linkDirectionMode: LinkDirectionMode = 'outbound';
  
  // Update overview stats (always use pages data for stats)
  const totalLinks = pagesGraphData.links.length;
  const avgLinks = pages.length > 0 ? Math.round((totalLinks / pages.length) * 10) / 10 : 0;
  const totalLinksEl = document.getElementById('page-list-link-map-total-links');
  const avgLinksEl = document.getElementById('page-list-link-map-avg-links');
  if (totalLinksEl) totalLinksEl.textContent = totalLinks.toString();
  if (avgLinksEl) avgLinksEl.textContent = avgLinks.toString();
  
  // Function to build legend data based on current view mode
  const buildLegendData = (viewMode: ViewMode): Array<{ label: string; color: string; count: number; sectionKey: string }> => {
    const legendData: Array<{ label: string; color: string; count: number; sectionKey: string }> = [];
    
    if (viewMode === 'topics') {
      // For topics view, count pages per topic
      const topicCounts = new Map<string, number>();
      pages.forEach(page => {
        const topics = page.topics || [];
        if (topics.length === 0) {
          topicCounts.set('untagged', (topicCounts.get('untagged') || 0) + 1);
        } else {
          topics.forEach(topic => {
            topicCounts.set(topic, (topicCounts.get(topic) || 0) + 1);
          });
        }
      });
      
      topicCounts.forEach((count, topic) => {
        const topicKey = `topic:${topic}`;
        const color = topicsGraphData.colorMap.get(topic) || '#f0f0f0';
        const label = topic === 'untagged' ? 'Untagged' : topic;
        legendData.push({ label, color, count, sectionKey: topicKey });
      });
    } else {
      // For pages and sections view, use section-based legend
      const sectionCounts = new Map<string, number>();
      pagesGraphData.nodes.forEach(node => {
        const sectionKey = node.section || node.parentPath;
        sectionCounts.set(sectionKey, (sectionCounts.get(sectionKey) || 0) + 1);
      });
      
      sectionCounts.forEach((count, sectionKey) => {
        const color = pagesGraphData.colorMap.get(sectionKey) || '#f0f0f0';
        const label = sectionKey === '/' ? 'Home' : (sectionKey || 'Other');
        legendData.push({ label, color, count, sectionKey });
      });
    }
    
    // Sort legend by count (descending)
    legendData.sort((a, b) => b.count - a.count);
    return legendData;
  };
  
  // Build initial legend data
  let legendData = buildLegendData(currentViewMode);
  
  // Clear container
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
          ${legendData.map(item => `
            <label class="page-list-link-map__legend-item" data-section-key="${escapeHtml(item.sectionKey)}">
              <input type="checkbox" class="page-list-link-map__legend-checkbox" checked aria-label="Toggle ${escapeHtml(item.label)}">
              <span class="page-list-link-map__legend-color" style="background-color: ${item.color};"></span>
              <span class="page-list-link-map__legend-label">${escapeHtml(item.label)}</span>
              <span class="page-list-link-map__legend-count">(${item.count})</span>
            </label>
          `).join('')}
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
  
  const svg = d3.select('#link-map-svg');
  const tooltip = d3.select('#link-map-tooltip');
  const width = container.offsetWidth || 1200;
  const height = Math.max(600, window.innerHeight - 300);
  
  svg.attr('width', width).attr('height', height);
  
  // Set up zoom behavior
  const zoom = d3.zoom()
    .scaleExtent([0.1, 4])
    .on('zoom', (event: any) => {
      g.attr('transform', event.transform);
    });
  
  svg.call(zoom as any);
  
  // Create main group for zoom/pan
  const g = svg.append('g');
  
  // Create arrow marker for links
  g.append('defs').append('marker')
    .attr('id', 'arrowhead')
    .attr('viewBox', '0 -5 10 10')
    .attr('refX', 30)
    .attr('refY', 0)
    .attr('markerWidth', 6)
    .attr('markerHeight', 6)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M0,-5L10,0L0,5')
    .attr('fill', '#999');
  
  // Create force simulation with optimized settings
  // Note: Collision radius will be updated dynamically when nodes are focused
  let simulation = d3.forceSimulation(currentGraphData.nodes as any)
    .force('link', d3.forceLink(currentGraphData.links).id((d: any) => d.id).distance(25)) // Reduced to 25 to bring clusters closer together
    .force('charge', d3.forceManyBody().strength(-60)) // Reduced to -60 to bring nodes closer together
    .force('center', d3.forceCenter(width / 2, height / 2))
    .force('collision', d3.forceCollide().radius(35))
    .alphaDecay(0.0228) // Slower decay for smoother animation
    .velocityDecay(0.4); // Add friction to reduce jitter
  
  // Track simulation state to stop when stable
  let lastAlpha = 1;
  let stableTicks = 0;
  
  // Helper function to get node color
  const getNodeColor = (node: LinkMapNode): string => {
    // External nodes get a distinct color
    if (node.isExternal) {
      return '#FF6B6B'; // Red color for external links
    }
    
    if (currentViewMode === 'topics') {
      // For topics view, use the topic as the key
      return currentGraphData.colorMap.get(node.section) || '#f0f0f0';
    } else {
      const sectionKey = node.section || node.parentPath;
      return currentGraphData.colorMap.get(sectionKey) || '#f0f0f0';
    }
  };
  
  // Track focused node
  let focusedNode: LinkMapNode | null = null;
  const connectedNodeIds = new Set<string>();
  
  // Function to rebuild connection maps (bidirectional, outbound, and inbound)
  const rebuildConnectionMap = () => {
    const connectionMap = new Map<string, Set<string>>();
    const outboundMap = new Map<string, Set<string>>();
    const inboundMap = new Map<string, Set<string>>();
    
    currentGraphData.nodes.forEach(node => {
      connectionMap.set(node.id, new Set());
      outboundMap.set(node.id, new Set());
      inboundMap.set(node.id, new Set());
    });
    
    currentGraphData.links.forEach((link: any) => {
      const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
      const targetId = typeof link.target === 'string' ? link.target : link.target.id;
      
      // Bidirectional map (for path finding)
      connectionMap.get(sourceId)?.add(targetId);
      connectionMap.get(targetId)?.add(sourceId);
      
      // Outbound map (source -> target)
      outboundMap.get(sourceId)?.add(targetId);
      
      // Inbound map (target -> source, i.e., who links to this node)
      inboundMap.get(targetId)?.add(sourceId);
    });
    
    return { connectionMap, outboundMap, inboundMap };
  };
  
  // Pre-build connection maps for faster lookups
  let { connectionMap, outboundMap, inboundMap } = rebuildConnectionMap();
  
  // Function to find original page data from node
  const findPageData = (nodeId: string): PageData | null => {
    return pages.find(p => p.relPermalink === nodeId) || null;
  };

  // Function to update focused panel with page details
  const updateFocusedPanel = (node: LinkMapNode) => {
    const panel = document.getElementById('link-map-focused-panel');
    const titleEl = document.getElementById('link-map-focused-title');
    const contentEl = document.getElementById('link-map-focused-content');
    const heatmapLegend = document.getElementById('link-map-heatmap-legend');
    
    if (!panel || !titleEl || !contentEl) return;
    
    const pageData = findPageData(node.id);
    
    // Set title
    titleEl.textContent = node.title;
    
    // Build content
    let content = '';
    
    // URL
    content += `
      <div class="page-list-link-map__focused-detail">
        <span class="page-list-link-map__focused-detail-label">URL:</span>
        <a href="${escapeHtml(node.url)}" target="_blank" rel="noopener noreferrer" class="page-list-link-map__focused-detail-value">
          ${escapeHtml(node.url)}
        </a>
      </div>
    `;
    
    // External link indicator
    if (node.isExternal) {
      content += `
        <div class="page-list-link-map__focused-detail">
          <span class="page-list-link-map__focused-detail-label">Type:</span>
          <span class="page-list-link-map__focused-detail-value" style="color: #FF6B6B; font-weight: 600;">External Link</span>
        </div>
      `;
    }
    
    // Section (only for internal pages)
    if (!node.isExternal && node.section) {
      content += `
        <div class="page-list-link-map__focused-detail">
          <span class="page-list-link-map__focused-detail-label">Section:</span>
          <span class="page-list-link-map__focused-detail-value">${escapeHtml(node.section)}</span>
        </div>
      `;
    }
    
    // Topics (if available, only for internal pages)
    if (!node.isExternal && pageData && pageData.topics && pageData.topics.length > 0) {
      content += `
        <div class="page-list-link-map__focused-detail">
          <span class="page-list-link-map__focused-detail-label">Topics:</span>
          <span class="page-list-link-map__focused-detail-value">
            ${pageData.topics.map(t => `<span class="page-list-link-map__focused-topic">${escapeHtml(t)}</span>`).join('')}
          </span>
        </div>
      `;
    }
    
    // Link information (only for internal pages)
    if (!node.isExternal) {
      // Internal link counts (from graph)
      content += `
        <div class="page-list-link-map__focused-detail">
          <span class="page-list-link-map__focused-detail-label">Internal Links (Graph):</span>
          <span class="page-list-link-map__focused-detail-value">
            ${node.inboundLinks} inbound, ${node.outboundLinks} outbound
          </span>
        </div>
      `;
      
      // External links (from page data)
      const totalOutboundLinks = pageData?.outboundLinks || 0;
      const totalInternalLinks = pageData?.totalInternalLinks || pageData?.internalLinkCount || node.outboundLinks;
      const externalLinks = Math.max(0, totalOutboundLinks - totalInternalLinks);
      
      if (totalOutboundLinks > 0) {
        const dofollowExternal = pageData?.dofollowOutboundLinks || 0;
        content += `
          <div class="page-list-link-map__focused-detail">
            <span class="page-list-link-map__focused-detail-label">External Links:</span>
            <span class="page-list-link-map__focused-detail-value">
              ${externalLinks}${dofollowExternal > 0 ? ` (${dofollowExternal} dofollow)` : ''}
            </span>
          </div>
        `;
      }
      
      // Total outbound links summary
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
      
      // Total connections (internal)
      const totalConnections = node.inboundLinks + node.outboundLinks;
      content += `
        <div class="page-list-link-map__focused-detail">
          <span class="page-list-link-map__focused-detail-label">Total Internal Connections:</span>
          <span class="page-list-link-map__focused-detail-value">${totalConnections}</span>
        </div>
      `;
      
      // Connected nodes count
      content += `
        <div class="page-list-link-map__focused-detail">
          <span class="page-list-link-map__focused-detail-label">Connected Nodes:</span>
          <span class="page-list-link-map__focused-detail-value">${connectedNodeIds.size}</span>
        </div>
      `;
      
      // Link direction mode indicator
      const linkDirectionLabel = linkDirectionMode === 'outbound' 
        ? 'Outbound links only' 
        : 'Inbound links only';
      content += `
        <div class="page-list-link-map__focused-detail">
          <span class="page-list-link-map__focused-detail-label">View Mode:</span>
          <span class="page-list-link-map__focused-detail-value">${escapeHtml(linkDirectionLabel)}</span>
        </div>
      `;
    } else {
      // For external nodes, show how many pages link to it
      content += `
        <div class="page-list-link-map__focused-detail">
          <span class="page-list-link-map__focused-detail-label">Linked From:</span>
          <span class="page-list-link-map__focused-detail-value">${node.inboundLinks} page(s)</span>
        </div>
      `;
    }
    
    contentEl.innerHTML = content;
    panel.style.display = 'block';
    
    // Adjust heatmap legend position after panel is rendered
    requestAnimationFrame(() => {
      if (heatmapLegend && heatmapEnabled) {
        const panelHeight = panel.offsetHeight || 200;
        heatmapLegend.style.top = `${panelHeight + 1.5}rem`;
      }
    });
  };

  // Function to focus on a node
  const focusNode = (targetNode: LinkMapNode) => {
    // Clear previous focus
    if (focusedNode) {
      clearFocus();
    }
    
    focusedNode = targetNode;
    connectedNodeIds.clear();
    
    // Find connected nodes based on link direction mode
    let connections: Set<string> | undefined;
    if (linkDirectionMode === 'outbound') {
      connections = outboundMap.get(targetNode.id);
    } else {
      // 'inbound' mode
      connections = inboundMap.get(targetNode.id);
    }
    
    if (connections) {
      connections.forEach(id => connectedNodeIds.add(id));
    }
    
    // Show clear focus button
    const clearFocusBtn = document.getElementById('link-map-clear-focus');
    if (clearFocusBtn) {
      clearFocusBtn.style.display = 'flex';
    }
    
    // Update focused panel
    updateFocusedPanel(targetNode);
    
    // Get connected node objects
    const connectedNodes: LinkMapNode[] = [];
    connectedNodeIds.forEach(id => {
      const node = currentGraphData.nodes.find(n => n.id === id);
      if (node) connectedNodes.push(node);
    });
    
    // Get current position of the focused node (or use a default if not positioned yet)
    const targetNodeData = targetNode as any;
    const currentX = targetNodeData.x !== undefined && targetNodeData.x !== null 
      ? targetNodeData.x 
      : (width / 2);
    const currentY = targetNodeData.y !== undefined && targetNodeData.y !== null 
      ? targetNodeData.y 
      : (height / 2);
    
    // Fix the focused node at its current position
    targetNodeData.fx = currentX;
    targetNodeData.fy = currentY;
    
    // Arrange connected nodes in concentric rings around the focused node
    // This prevents overlapping when there are many connected nodes
    if (connectedNodes.length > 0) {
      const nodeRadius = 30; // Radius of connected nodes
      const minSpacing = 80; // Minimum distance between nodes (center to center)
      const ringSpacing = 100; // Distance between rings
      
      // Calculate how many nodes can fit in each ring
      // Circumference = 2 * π * radius, nodes needed = circumference / minSpacing
      const calculateNodesPerRing = (ringRadius: number): number => {
        const circumference = 2 * Math.PI * ringRadius;
        return Math.max(1, Math.floor(circumference / minSpacing));
      };
      
      // Arrange nodes in rings
      let nodeIndex = 0;
      let ringNumber = 0;
      
      while (nodeIndex < connectedNodes.length) {
        const ringRadius = ringSpacing * (ringNumber + 1); // First ring at ringSpacing, second at 2*ringSpacing, etc.
        const nodesInRing = calculateNodesPerRing(ringRadius);
        const nodesToPlace = Math.min(nodesInRing, connectedNodes.length - nodeIndex);
        
        if (nodesToPlace === 0) break;
        
        const angleStep = (2 * Math.PI) / nodesToPlace;
        
        for (let i = 0; i < nodesToPlace && nodeIndex < connectedNodes.length; i++) {
          const angle = i * angleStep;
          const connectedNode = connectedNodes[nodeIndex];
          const connectedNodeData = connectedNode as any;
          connectedNodeData.fx = currentX + Math.cos(angle) * ringRadius;
          connectedNodeData.fy = currentY + Math.sin(angle) * ringRadius;
          nodeIndex++;
        }
        
        ringNumber++;
      }
    }
    
    // Freeze all background nodes (nodes that are not focused and not connected)
    currentGraphData.nodes.forEach(node => {
      const nodeData = node as any;
      // Only freeze if it's not the focused node and not a connected node
      if (node.id !== targetNode.id && !connectedNodeIds.has(node.id)) {
        // Fix at current position if it has one, otherwise leave it
        if (nodeData.x !== undefined && nodeData.x !== null && 
            nodeData.y !== undefined && nodeData.y !== null) {
          nodeData.fx = nodeData.x;
          nodeData.fy = nodeData.y;
        }
      }
    });
    
    // Restart simulation to apply fixed positions
    simulation.alpha(1).restart();
    
    // Wait for simulation to position nodes, then fit to viewport
    setTimeout(() => {
      fitEntireGraphToViewport([targetNode, ...connectedNodes]);
    }, 100);
    
    // Update node and link styles
    updateFocusStyles();
  };
  
  // Function to clear focus
  const clearFocus = () => {
    // Unfix all node positions (focused, connected, and background)
    if (focusedNode) {
      const focusedNodeData = focusedNode as any;
      focusedNodeData.fx = null;
      focusedNodeData.fy = null;
    }
    
    connectedNodeIds.forEach(id => {
      const node = currentGraphData.nodes.find(n => n.id === id);
      if (node) {
        const nodeData = node as any;
        nodeData.fx = null;
        nodeData.fy = null;
      }
    });
    
    // Unfreeze all background nodes
    currentGraphData.nodes.forEach(node => {
      const nodeData = node as any;
      if (nodeData.fx !== null && nodeData.fx !== undefined) {
        // Only unfix if it was a background node (not focused, not connected)
        if (focusedNode && node.id !== focusedNode.id && !connectedNodeIds.has(node.id)) {
          nodeData.fx = null;
          nodeData.fy = null;
        }
      }
    });
    
    focusedNode = null;
    connectedNodeIds.clear();
    
    // Hide clear focus button
    const clearFocusBtn = document.getElementById('link-map-clear-focus');
    if (clearFocusBtn) {
      clearFocusBtn.style.display = 'none';
    }
    
    // Hide focused panel
    const focusedPanel = document.getElementById('link-map-focused-panel');
    if (focusedPanel) {
      focusedPanel.style.display = 'none';
    }
    
    // Reset heatmap legend position
    const heatmapLegend = document.getElementById('link-map-heatmap-legend');
    if (heatmapLegend && heatmapEnabled) {
      heatmapLegend.style.top = '1rem';
    }
    
    // Restart simulation to let nodes move freely again
    simulation.alpha(1).restart();
    
    updateFocusStyles();
  };
  
  // Cache for computed colors to avoid repeated calculations
  const nodeColorCache = new Map<string, string>();
  const getCachedNodeColor = (node: LinkMapNode): string => {
    if (!nodeColorCache.has(node.id)) {
      nodeColorCache.set(node.id, getNodeColor(node));
    }
    return nodeColorCache.get(node.id)!;
  };
  
  // Cache for brighter colors
  const brighterColorCache = new Map<string, string>();
  const getBrighterColor = (baseColor: string, amount: number): string => {
    const cacheKey = `${baseColor}-${amount}`;
    if (!brighterColorCache.has(cacheKey)) {
      brighterColorCache.set(cacheKey, d3.rgb(baseColor).brighter(amount).toString());
    }
    return brighterColorCache.get(cacheKey)!;
  };
  
  // Function to update styles based on focus
  // Optimized to batch DOM updates and use cached values
  const updateFocusStyles = () => {
    const focusedId = focusedNode?.id;
    const hasFocus = !!focusedNode;
    
    // Batch node updates - handle both circles and rectangles
    node.each(function(this: SVGCircleElement | SVGRectElement, d: LinkMapNode) {
      const isFocused = hasFocus && d.id === focusedId;
      const isConnected = hasFocus && connectedNodeIds.has(d.id);
      const el = d3.select(this);
      const isExternal = d.isExternal || false;
      
      if (isFocused) {
        // Focused node: bigger and fully opaque
        if (isExternal) {
          el.attr('width', 100)
            .attr('height', 100)
            .attr('x', -50)
            .attr('y', -50);
        } else {
          el.attr('r', 50);
        }
        el.attr('fill', getBrighterColor(getCachedNodeColor(d), 0.5))
          .attr('stroke-width', 4)
          .attr('opacity', 1)
          .classed('page-list-link-map__node--focused', true)
          .classed('page-list-link-map__node--connected', false)
          .classed('page-list-link-map__node--unconnected', false);
      } else if (isConnected) {
        // Connected nodes: more opaque
        if (isExternal) {
          el.attr('width', 60)
            .attr('height', 60)
            .attr('x', -30)
            .attr('y', -30);
        } else {
          el.attr('r', 30);
        }
        el.attr('fill', getBrighterColor(getCachedNodeColor(d), 0.3))
          .attr('stroke-width', 3)
          .attr('opacity', 1)
          .classed('page-list-link-map__node--focused', false)
          .classed('page-list-link-map__node--connected', true)
          .classed('page-list-link-map__node--unconnected', false);
      } else {
        // Background nodes: dimmed and frozen
        if (isExternal) {
          el.attr('width', 50)
            .attr('height', 50)
            .attr('x', -25)
            .attr('y', -25);
        } else {
          el.attr('r', 25);
        }
        el.attr('fill', getCachedNodeColor(d))
          .attr('stroke-width', 2)
          .attr('opacity', hasFocus ? 0.2 : 1)
          .classed('page-list-link-map__node--focused', false)
          .classed('page-list-link-map__node--connected', false)
          .classed('page-list-link-map__node--unconnected', hasFocus);
      }
    });
    
    // Batch link updates with different colors for outbound vs inbound
    link.each(function(this: SVGLineElement, d: any) {
      const sourceId = typeof d.source === 'string' ? d.source : d.source.id;
      const targetId = typeof d.target === 'string' ? d.target : d.target.id;
      const el = d3.select(this);
      
      // Define colors for outbound and inbound links
      const outboundColor = '#4A90E2'; // Blue for outbound (forward)
      const inboundColor = '#FF6B6B';  // Red/Orange for inbound (backward)
      const neutralColor = '#999';     // Gray for neutral/unfocused links
      
      if (hasFocus && focusedId) {
        // Determine if this link should be shown based on link direction mode
        let isConnected = false;
        let isOutbound = false;
        let isInbound = false;
        
        if (linkDirectionMode === 'outbound') {
          // Only show links where focused node is the source
          isConnected = sourceId === focusedId && connectedNodeIds.has(targetId);
          isOutbound = isConnected;
        } else {
          // 'inbound' mode - only show links where focused node is the target
          isConnected = targetId === focusedId && connectedNodeIds.has(sourceId);
          isInbound = isConnected;
        }
        
        if (isConnected) {
          // Use different colors for outbound vs inbound
          const linkColor = isOutbound ? outboundColor : inboundColor;
          el.attr('stroke', linkColor)
            .attr('stroke-width', 2)
            .attr('opacity', 1);
        } else {
          el.attr('stroke', '#ccc')
            .attr('stroke-width', 0.5)
            .attr('opacity', 0); // Hide unconnected links when focused
        }
      } else {
        // No focus - show all links with direction-based colors
        // Use lighter versions of outbound/inbound colors for general view
        const outboundColorLight = '#7BB3F0'; // Lighter blue for outbound
        const inboundColorLight = '#FF9999';  // Lighter red for inbound
        
        // For general view, we can show direction by using different colors
        // Since we don't have a reference node, we'll use a subtle color difference
        // or we can use the neutral color for all
        // Actually, let's use a subtle gradient: lighter blue for all links
        // Or better: use the outbound color (blue) as default since arrows show direction
        el.attr('stroke', outboundColorLight)
          .attr('stroke-width', 1)
          .attr('opacity', 1);
      }
    });
    
    // Batch label updates
    label.each(function(this: SVGTextElement, d: LinkMapNode) {
      const isFocused = hasFocus && d.id === focusedId;
      const isConnected = hasFocus && connectedNodeIds.has(d.id);
      const el = d3.select(this);
      
      if (isFocused) {
        el.attr('font-size', '14px')
          .attr('font-weight', 'bold')
          .attr('opacity', 1);
      } else if (isConnected) {
        el.attr('font-size', '13px')
          .attr('font-weight', '600')
          .attr('opacity', 1);
      } else {
        el.attr('font-size', '12px')
          .attr('font-weight', 'bold')
          .attr('opacity', hasFocus ? 0 : 1); // Hide unconnected labels when focused
      }
    });
  };
  
  // Draw links
  let link = g.append('g')
    .attr('class', 'page-list-link-map__links')
    .selectAll('line')
    .data(currentGraphData.links)
    .enter()
    .append('line')
    .attr('class', 'page-list-link-map__link')
    .attr('stroke', '#7BB3F0') // Lighter blue for outbound links (default)
    .attr('stroke-width', 1)
    .attr('marker-end', 'url(#arrowhead)');
  
  // Draw nodes - use circles for internal, squares for external
  const nodeGroup = g.append('g').attr('class', 'page-list-link-map__nodes');
  
  // Create circles for internal nodes
  const internalNodes = nodeGroup
    .selectAll('circle.page-list-link-map__node--internal')
    .data(currentGraphData.nodes.filter(d => !d.isExternal))
    .enter()
    .append('circle')
    .attr('class', 'page-list-link-map__node page-list-link-map__node--internal')
    .attr('r', 25)
    .attr('fill', (d: LinkMapNode) => getNodeColor(d))
    .attr('stroke', '#333')
    .attr('stroke-width', 2);
  
  // Create squares for external nodes
  const externalNodes = nodeGroup
    .selectAll('rect.page-list-link-map__node--external')
    .data(currentGraphData.nodes.filter(d => d.isExternal))
    .enter()
    .append('rect')
    .attr('class', 'page-list-link-map__node page-list-link-map__node--external')
    .attr('width', 50)
    .attr('height', 50)
    .attr('x', -25)
    .attr('y', -25)
    .attr('fill', (d: LinkMapNode) => getNodeColor(d))
    .attr('stroke', '#333')
    .attr('stroke-width', 2);
  
  // Combine both selections for event handlers
  let node = internalNodes.merge(externalNodes)
    .attr('tabindex', 0)
    .attr('role', 'button')
    .attr('aria-label', (d: LinkMapNode) => `Page: ${d.title}. Click to focus.`)
    .call(drag(simulation, d3) as any)
    .on('mouseover', function(this: SVGCircleElement | SVGRectElement, event: MouseEvent, d: LinkMapNode) {
      // Show hover effect only if not focused or if hovering over unconnected node
      const isFocused = focusedNode && d.id === focusedNode.id;
      const isConnected = focusedNode && connectedNodeIds.has(d.id);
      const el = d3.select(this);
      const isExternal = d.isExternal || false;
      
      if (!focusedNode) {
        // No focus - normal hover (brighten section color)
        const baseColor = getNodeColor(d);
        if (isExternal) {
          el.attr('width', 70)
            .attr('height', 70)
            .attr('x', -35)
            .attr('y', -35);
        } else {
          el.attr('r', 35);
        }
        el.attr('fill', d3.rgb(baseColor).brighter(0.5).toString());
      } else if (!isFocused && !isConnected) {
        // Hovering over unconnected node - show it slightly
        if (isExternal) {
          el.attr('width', 56)
            .attr('height', 56)
            .attr('x', -28)
            .attr('y', -28);
        } else {
          el.attr('r', 28);
        }
        el.attr('opacity', 0.6);
      }
      
      // Build tooltip content based on view mode
      let tooltipContent = `
        <div class="page-list-link-map__tooltip-content">
          <strong>${escapeHtml(d.title)}</strong>${d.isExternal ? ' <span style="color: #FF6B6B;">(External)</span>' : ''}<br/>
      `;
      
      if (d.isExternal) {
        tooltipContent += `
          <span class="page-list-link-map__tooltip-url">${escapeHtml(d.url)}</span><br/>
          <span class="page-list-link-map__tooltip-stats">
            External Link
          </span>
        `;
      } else if (currentViewMode === 'topics') {
        // For topics view, show page count
        const topicKey = d.section;
        const pageCount = pages.filter(p => {
          const pageTopics = p.topics || [];
          return topicKey === 'untagged' 
            ? pageTopics.length === 0 
            : pageTopics.includes(topicKey);
        }).length;
        tooltipContent += `
          <span class="page-list-link-map__tooltip-url">Topic: ${escapeHtml(d.section === 'untagged' ? 'Untagged' : d.section)}</span><br/>
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
            ${isFocused ? '<br/><span style="color: #4A90E2; font-weight: 600;">Focused - Click again to clear</span>' : ''}
            ${isConnected ? '<br/><span style="color: #7BB3F0;">Connected to focused node</span>' : ''}
          </div>
        `;
      
      tooltip
        .style('opacity', 1)
        .html(tooltipContent)
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 10) + 'px');
    })
    .on('mouseout', function(event: MouseEvent, d: LinkMapNode) {
      // Reset hover effect - updateFocusStyles will restore correct state
      updateFocusStyles();
      tooltip.style('opacity', 0);
    })
    .on('click', (event: MouseEvent, d: LinkMapNode) => {
      event.stopPropagation();
      
      // Path finding mode (Ctrl/Cmd + click)
      if (event.ctrlKey || event.metaKey) {
        if (selectedNodesForPath.length === 0 || selectedNodesForPath.length === 1) {
          if (selectedNodesForPath.length === 0 || selectedNodesForPath[0].id !== d.id) {
            selectedNodesForPath.push(d);
            // Check length after push (use type assertion to avoid type narrowing issue)
            if ((selectedNodesForPath.length as number) === 2) {
              // Find shortest path
              const path = findShortestPath(selectedNodesForPath[0].id, selectedNodesForPath[1].id);
              highlightPath(path);
              selectedNodesForPath = []; // Reset after showing path
            }
          }
        }
        return;
      }
      
      // Normal focus behavior
      clearPathHighlight();
      if (focusedNode && d.id === focusedNode.id) {
        // Double-click to clear focus
        clearFocus();
        // Reset zoom
        svg.transition()
          .duration(750)
          .call(zoom.transform as any, d3.zoomIdentity);
      } else {
        focusNode(d);
      }
    })
    .on('keydown', (event: KeyboardEvent, d: LinkMapNode) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        if (focusedNode && d.id === focusedNode.id) {
          clearFocus();
        } else {
          focusNode(d);
        }
      }
    });
  
  // Clear focus button
  const clearFocusBtn = document.getElementById('link-map-clear-focus');
  if (clearFocusBtn) {
    clearFocusBtn.addEventListener('click', () => {
      clearFocus();
      svg.transition()
        .duration(750)
        .call(zoom.transform as any, d3.zoomIdentity);
    });
  }
  
  // Focused panel close button
  const focusedPanelCloseBtn = document.getElementById('link-map-focused-close');
  if (focusedPanelCloseBtn) {
    focusedPanelCloseBtn.addEventListener('click', () => {
      clearFocus();
      svg.transition()
        .duration(750)
        .call(zoom.transform as any, d3.zoomIdentity);
    });
  }
  
  // Clear focus when clicking on background
  svg.on('click', function(event: MouseEvent) {
    if ((event.target as any).tagName === 'svg' || (event.target as any).classList.contains('page-list-link-map__svg')) {
      clearFocus();
      svg.transition()
        .duration(750)
        .call(zoom.transform as any, d3.zoomIdentity);
    }
  });
  
  // Add labels
  let label = g.append('g')
    .attr('class', 'page-list-link-map__labels')
    .selectAll('text')
    .data(currentGraphData.nodes)
    .enter()
    .append('text')
    .attr('class', 'page-list-link-map__label')
    .attr('text-anchor', 'middle')
    .attr('dy', 40)
    .attr('font-size', '12px')
    .attr('font-weight', 'bold')
    .attr('fill', '#333')
    .text((d: LinkMapNode) => {
      const text = d.title.length > 20 ? d.title.substring(0, 20) + '...' : d.title;
      return text;
    });
  
  // Function to switch between pages, sections, and topics view
  const switchView = (targetMode: ViewMode) => {
    // Don't switch if already in target mode
    if (currentViewMode === targetMode) {
      return;
    }
    
    // Clear focus
    if (focusedNode) {
      clearFocus();
    }
    
    // Set view mode and graph data
    currentViewMode = targetMode;
    if (currentViewMode === 'pages') {
      currentGraphData = pagesGraphData;
    } else if (currentViewMode === 'sections') {
      currentGraphData = sectionsGraphData;
    } else {
      currentGraphData = topicsGraphData;
    }
    
    // Update button active states
    const pagesBtn = document.getElementById('link-map-view-pages');
    const sectionsBtn = document.getElementById('link-map-view-sections');
    const topicsBtn = document.getElementById('link-map-view-topics');
    
    if (pagesBtn) {
      pagesBtn.classList.toggle('page-list-link-map__control-btn--active', currentViewMode === 'pages');
    }
    if (sectionsBtn) {
      sectionsBtn.classList.toggle('page-list-link-map__control-btn--active', currentViewMode === 'sections');
    }
    if (topicsBtn) {
      topicsBtn.classList.toggle('page-list-link-map__control-btn--active', currentViewMode === 'topics');
    }
    
    // Update stats
    const nodesLabelEl = document.getElementById('link-map-nodes-label');
    const nodesCountEl = document.getElementById('link-map-nodes-count');
    const linksCountEl = document.getElementById('link-map-links-count');
    if (nodesLabelEl) {
      if (currentViewMode === 'pages') {
        nodesLabelEl.textContent = 'Pages:';
      } else if (currentViewMode === 'sections') {
        nodesLabelEl.textContent = 'Sections:';
      } else {
        nodesLabelEl.textContent = 'Topics:';
      }
    }
    if (nodesCountEl) nodesCountEl.textContent = currentGraphData.nodes.length.toString();
    if (linksCountEl) linksCountEl.textContent = currentGraphData.links.length.toString();
    
    // Update legend
    legendData = buildLegendData(currentViewMode);
    const legendTitleEl = document.getElementById('link-map-legend-title');
    const legendItemsEl = document.getElementById('link-map-legend-items');
    if (legendTitleEl) {
      if (currentViewMode === 'topics') {
        legendTitleEl.textContent = 'Topics (click to toggle)';
      } else {
        legendTitleEl.textContent = 'Sections (click to toggle)';
      }
    }
    if (legendItemsEl) {
      legendItemsEl.innerHTML = legendData.map(item => `
        <label class="page-list-link-map__legend-item" data-section-key="${escapeHtml(item.sectionKey)}">
          <input type="checkbox" class="page-list-link-map__legend-checkbox" checked aria-label="Toggle ${escapeHtml(item.label)}">
          <span class="page-list-link-map__legend-color" style="background-color: ${item.color};"></span>
          <span class="page-list-link-map__legend-label">${escapeHtml(item.label)}</span>
          <span class="page-list-link-map__legend-count">(${item.count})</span>
        </label>
      `).join('');
    }
    
    // Update selected sections set
    selectedSections.clear();
    legendData.forEach(item => {
      selectedSections.add(item.sectionKey);
    });
    
    // Re-attach event listeners to new legend items
    const newLegendItems = container.querySelectorAll('.page-list-link-map__legend-item');
    newLegendItems.forEach(item => {
      const checkbox = item.querySelector('.page-list-link-map__legend-checkbox') as HTMLInputElement;
      const sectionKey = item.getAttribute('data-section-key');
      
      if (checkbox && sectionKey) {
        checkbox.addEventListener('change', () => {
          if (checkbox.checked) {
            selectedSections.add(sectionKey);
          } else {
            selectedSections.delete(sectionKey);
          }
          updateSectionVisibility();
        });
      }
    });
    
    // Update search data and placeholder
    nodeSearchData = buildSearchData();
    const searchInputEl = document.getElementById('link-map-search') as HTMLInputElement;
    if (searchInputEl) {
      if (currentViewMode === 'topics') {
        searchInputEl.placeholder = 'Search topics...';
      } else if (currentViewMode === 'sections') {
        searchInputEl.placeholder = 'Search sections...';
      } else {
        searchInputEl.placeholder = 'Search pages...';
      }
      // Clear search input when switching views
      searchInputEl.value = '';
      updateFocusStyles();
    }
    
    // Clear path highlighting when switching views
    clearPathHighlight();
    
    // Update heatmap if enabled
    if (heatmapEnabled) {
      updateHeatmap();
    }
    
    // Stop current simulation
    simulation.stop();
    
    // Remove existing elements
    link.remove();
    node.remove();
    label.remove();
    
    // Rebuild connection maps
    const connectionMaps = rebuildConnectionMap();
    connectionMap = connectionMaps.connectionMap;
    outboundMap = connectionMaps.outboundMap;
    inboundMap = connectionMaps.inboundMap;
    
    // Recreate links
    link = g.append('g')
      .attr('class', 'page-list-link-map__links')
      .selectAll('line')
      .data(currentGraphData.links)
      .enter()
      .append('line')
      .attr('class', 'page-list-link-map__link')
      .attr('stroke', '#7BB3F0') // Lighter blue for outbound links (default)
      .attr('stroke-width', 1)
      .attr('marker-end', 'url(#arrowhead)');
    
    // Recreate nodes - use circles for internal, squares for external
    const newNodeGroup = g.append('g').attr('class', 'page-list-link-map__nodes');
    
    // Create circles for internal nodes
    const newInternalNodes = newNodeGroup
      .selectAll('circle.page-list-link-map__node--internal')
      .data(currentGraphData.nodes.filter(d => !d.isExternal))
      .enter()
      .append('circle')
      .attr('class', 'page-list-link-map__node page-list-link-map__node--internal')
      .attr('r', 25)
      .attr('fill', (d: LinkMapNode) => getNodeColor(d))
      .attr('stroke', '#333')
      .attr('stroke-width', 2);
    
    // Create squares for external nodes
    const newExternalNodes = newNodeGroup
      .selectAll('rect.page-list-link-map__node--external')
      .data(currentGraphData.nodes.filter(d => d.isExternal))
      .enter()
      .append('rect')
      .attr('class', 'page-list-link-map__node page-list-link-map__node--external')
      .attr('width', 50)
      .attr('height', 50)
      .attr('x', -25)
      .attr('y', -25)
      .attr('fill', (d: LinkMapNode) => getNodeColor(d))
      .attr('stroke', '#333')
      .attr('stroke-width', 2);
    
    // Combine both selections for event handlers
    node = newInternalNodes.merge(newExternalNodes)
      .attr('tabindex', 0)
      .attr('role', 'button')
      .attr('aria-label', (d: LinkMapNode) => {
        if (currentViewMode === 'topics') {
          return `Topic: ${d.title}. Click to focus.`;
        } else if (currentViewMode === 'sections') {
          return `Section: ${d.title}. Click to focus.`;
        } else {
          return `Page: ${d.title}. Click to focus.`;
        }
      })
      .call(drag(simulation, d3) as any)
      .on('mouseover', function(this: SVGCircleElement | SVGRectElement, event: MouseEvent, d: LinkMapNode) {
        const isFocused = focusedNode && d.id === focusedNode.id;
        const isConnected = focusedNode && connectedNodeIds.has(d.id);
        const el = d3.select(this);
        const isExternal = d.isExternal || false;
        
        if (!focusedNode) {
          const baseColor = getNodeColor(d);
          if (isExternal) {
            el.attr('width', 70)
              .attr('height', 70)
              .attr('x', -35)
              .attr('y', -35);
          } else {
            el.attr('r', 35);
          }
          el.attr('fill', d3.rgb(baseColor).brighter(0.5).toString());
        } else if (!isFocused && !isConnected) {
          if (isExternal) {
            el.attr('width', 56)
              .attr('height', 56)
              .attr('x', -28)
              .attr('y', -28);
          } else {
            el.attr('r', 28);
          }
          el.attr('opacity', 0.6);
        }
        
        // Build tooltip content based on view mode
        let tooltipContent = `
          <div class="page-list-link-map__tooltip-content">
            <strong>${escapeHtml(d.title)}</strong><br/>
        `;
        
        if (currentViewMode === 'topics') {
          // For topics view, show page count
          const topicKey = d.section;
          const pageCount = pages.filter(p => {
            const pageTopics = p.topics || [];
            return topicKey === 'untagged' 
              ? pageTopics.length === 0 
              : pageTopics.includes(topicKey);
          }).length;
          tooltipContent += `
            <span class="page-list-link-map__tooltip-url">Topic: ${escapeHtml(d.section === 'untagged' ? 'Untagged' : d.section)}</span><br/>
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
        
        tooltip
          .style('opacity', 1)
          .html(tooltipContent)
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 10) + 'px');
      })
      .on('mouseout', function(event: MouseEvent, d: LinkMapNode) {
        updateFocusStyles();
        tooltip.style('opacity', 0);
      })
      .on('click', (event: MouseEvent, d: LinkMapNode) => {
        event.stopPropagation();
        
        // Path finding mode (Ctrl/Cmd + click)
        if (event.ctrlKey || event.metaKey) {
          if (selectedNodesForPath.length === 0 || selectedNodesForPath.length === 1) {
            if (selectedNodesForPath.length === 0 || selectedNodesForPath[0].id !== d.id) {
              selectedNodesForPath.push(d);
              // Check length after push (use type assertion to avoid type narrowing issue)
              if ((selectedNodesForPath.length as number) === 2) {
                // Find shortest path
                const path = findShortestPath(selectedNodesForPath[0].id, selectedNodesForPath[1].id);
                highlightPath(path);
                selectedNodesForPath = []; // Reset after showing path
              }
            }
          }
          return;
        }
        
        // Normal focus behavior
        clearPathHighlight();
        if (focusedNode && d.id === focusedNode.id) {
          clearFocus();
          svg.transition()
            .duration(750)
            .call(zoom.transform as any, d3.zoomIdentity);
        } else {
          focusNode(d);
        }
      })
      .on('keydown', (event: KeyboardEvent, d: LinkMapNode) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          if (focusedNode && d.id === focusedNode.id) {
            clearFocus();
          } else {
            focusNode(d);
          }
        }
      });
    
    // Recreate labels
    label = g.append('g')
      .attr('class', 'page-list-link-map__labels')
      .selectAll('text')
      .data(currentGraphData.nodes)
      .enter()
      .append('text')
      .attr('class', 'page-list-link-map__label')
      .attr('text-anchor', 'middle')
      .attr('dy', 40)
      .attr('font-size', '12px')
      .attr('font-weight', 'bold')
      .attr('fill', '#333')
      .text((d: LinkMapNode) => {
        const text = d.title.length > 20 ? d.title.substring(0, 20) + '...' : d.title;
        return text;
      });
    
    // Create new simulation
    simulation = d3.forceSimulation(currentGraphData.nodes as any)
      .force('link', d3.forceLink(currentGraphData.links).id((d: any) => d.id).distance(25))
      .force('charge', d3.forceManyBody().strength(-60))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(35))
      .alphaDecay(0.0228)
      .velocityDecay(0.4);
    
    // Update positions on simulation tick
    simulation.on('tick', () => {
      const currentAlpha = simulation.alpha();
      
      if (currentAlpha < 0.01 && Math.abs(currentAlpha - lastAlpha) < 0.001) {
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
    
    // Reset zoom and fit to viewport after a delay
    initialFitDone = false;
    setTimeout(() => {
      fitEntireGraphToViewport();
    }, 200);
    
    // Update section visibility
    updateSectionVisibility();
    
    // Restart simulation
    simulation.alpha(1).restart();
  };
  
  // Track selected sections (default: all selected)
  const selectedSections = new Set<string>();
  legendData.forEach(item => {
    selectedSections.add(item.sectionKey);
  });
  
  // Function to get section key for a node (works for sections and topics)
  const getNodeSectionKey = (node: LinkMapNode): string => {
    if (currentViewMode === 'topics') {
      // For topics view, use the topic ID format
      return node.id.startsWith('topic:') ? node.id : `topic:${node.section}`;
    } else {
      return node.section || node.parentPath;
    }
  };
  
  // Function to update visibility based on selected sections
  const updateSectionVisibility = () => {
    // Clear focus if focused node's section is now hidden
    if (focusedNode) {
      const focusedSectionKey = getNodeSectionKey(focusedNode);
      if (!selectedSections.has(focusedSectionKey)) {
        clearFocus();
      }
    }
    
    // External nodes are always visible (they don't have sections)
    node.each(function(this: SVGCircleElement | SVGRectElement, d: LinkMapNode) {
      if (d.isExternal) {
        // External nodes are always visible
        d3.select(this).style('display', 'block');
      } else {
        const sectionKey = getNodeSectionKey(d);
        const isVisible = selectedSections.has(sectionKey);
        d3.select(this).style('display', isVisible ? 'block' : 'none');
      }
    });
    
    label.each(function(this: SVGTextElement, d: LinkMapNode) {
      const sectionKey = getNodeSectionKey(d);
      const isVisible = selectedSections.has(sectionKey);
      d3.select(this).style('display', isVisible ? 'block' : 'none');
    });
    
    // Hide links if either source or target is hidden
    link.each(function(this: SVGLineElement, d: any) {
      const sourceId = typeof d.source === 'string' ? d.source : d.source.id;
      const targetId = typeof d.target === 'string' ? d.target : d.target.id;
      const sourceNode = currentGraphData.nodes.find(n => n.id === sourceId);
      const targetNode = currentGraphData.nodes.find(n => n.id === targetId);
      
      const sourceVisible = sourceNode && selectedSections.has(getNodeSectionKey(sourceNode));
      const targetVisible = targetNode && selectedSections.has(getNodeSectionKey(targetNode));
      const isVisible = sourceVisible && targetVisible;
      
      d3.select(this).style('display', isVisible ? 'block' : 'none');
    });
    
    // If there's a focused node, update focus styles to maintain focus state
    if (focusedNode) {
      updateFocusStyles();
    }
    
    // Restart simulation to adjust layout
    simulation.alpha(0.3).restart();
  };
  
  // Add event listeners to section checkboxes
  const legendItems = container.querySelectorAll('.page-list-link-map__legend-item');
  legendItems.forEach(item => {
    const checkbox = item.querySelector('.page-list-link-map__legend-checkbox') as HTMLInputElement;
    const sectionKey = item.getAttribute('data-section-key');
    
    if (checkbox && sectionKey) {
      checkbox.addEventListener('change', () => {
        if (checkbox.checked) {
          selectedSections.add(sectionKey);
        } else {
          selectedSections.delete(sectionKey);
        }
        updateSectionVisibility();
      });
    }
  });
  
  // Throttle DOM updates using requestAnimationFrame
  let rafId: number | null = null;
  let needsUpdate = false;
  
  const scheduleUpdate = () => {
    if (!needsUpdate) {
      needsUpdate = true;
      rafId = requestAnimationFrame(() => {
        needsUpdate = false;
        // Only update positions, not styles (styles updated separately)
        link
          .attr('x1', (d: any) => d.source.x)
          .attr('y1', (d: any) => d.source.y)
          .attr('x2', (d: any) => d.target.x)
          .attr('y2', (d: any) => d.target.y);
        
        // Update node positions - handle both circles and rectangles
        node.each(function(this: SVGCircleElement | SVGRectElement, d: any) {
          const el = d3.select(this);
          const isExternal = d.isExternal || false;
          if (isExternal) {
            // Rectangles use x/y
            el.attr('x', d.x)
              .attr('y', d.y);
          } else {
            // Circles use cx/cy
            el.attr('cx', d.x)
              .attr('cy', d.y);
          }
        });
        
        label
          .attr('x', (d: any) => d.x)
          .attr('y', (d: any) => d.y);
      });
    }
  };
  
  // Track if initial fit has been done
  let initialFitDone = false;
  
  // Improved function to fit graph to viewport (works with focus, view switching, etc.)
  const fitEntireGraphToViewport = (targetNodes?: LinkMapNode[]) => {
    // Wait for next animation frame to ensure positions are updated
    requestAnimationFrame(() => {
      const nodesToFit = targetNodes || currentGraphData.nodes;
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      let hasValidNodes = false;
      
      nodesToFit.forEach(node => {
        const nodeData = node as any;
        // Use fixed position if available, otherwise use current position
        const x = (nodeData.fx !== null && nodeData.fx !== undefined) ? nodeData.fx : nodeData.x;
        const y = (nodeData.fy !== null && nodeData.fy !== undefined) ? nodeData.fy : nodeData.y;
        
        if (x !== undefined && y !== undefined && isFinite(x) && isFinite(y)) {
          hasValidNodes = true;
          // Determine radius based on node state
          let radius = 25;
          if (focusedNode && node.id === focusedNode.id) {
            radius = 50;
          } else if (focusedNode && connectedNodeIds.has(node.id)) {
            radius = 30;
          }
          
          minX = Math.min(minX, x - radius);
          minY = Math.min(minY, y - radius);
          maxX = Math.max(maxX, x + radius);
          maxY = Math.max(maxY, y + radius);
        }
      });
      
      // If we have valid bounds, fit to viewport
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
        
        // Calculate scale to fit in viewport
        const margin = 0.85;
        const scaleX = (width * margin) / boundsWidth;
        const scaleY = (height * margin) / boundsHeight;
        const scale = Math.min(scaleX, scaleY, 3); // Cap at 3x zoom
        
        // Calculate translation to center the bounds
        const translateX = width / 2 - boundsCenterX * scale;
        const translateY = height / 2 - boundsCenterY * scale;
        
        // Apply transformation
        svg.transition()
          .duration(750)
          .call(zoom.transform as any, d3.zoomIdentity.translate(translateX, translateY).scale(scale));
      }
    });
  };
  
  // Function to center graph (without zooming)
  const centerGraph = (targetNodes?: LinkMapNode[]) => {
    requestAnimationFrame(() => {
      const nodesToCenter = targetNodes || currentGraphData.nodes;
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      let hasValidNodes = false;
      
      nodesToCenter.forEach(node => {
        const nodeData = node as any;
        const x = (nodeData.fx !== null && nodeData.fx !== undefined) ? nodeData.fx : nodeData.x;
        const y = (nodeData.fy !== null && nodeData.fy !== undefined) ? nodeData.fy : nodeData.y;
        
        if (x !== undefined && y !== undefined && isFinite(x) && isFinite(y)) {
          hasValidNodes = true;
          let radius = 25;
          if (focusedNode && node.id === focusedNode.id) {
            radius = 50;
          } else if (focusedNode && connectedNodeIds.has(node.id)) {
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
        
        // Get current transform
        const currentTransform = d3.zoomTransform(svg.node() as any);
        const currentScale = currentTransform.k;
        
        // Calculate translation to center (keeping current scale)
        const translateX = width / 2 - boundsCenterX * currentScale;
        const translateY = height / 2 - boundsCenterY * currentScale;
        
        // Apply transformation
        svg.transition()
          .duration(750)
          .call(zoom.transform as any, d3.zoomIdentity.translate(translateX, translateY).scale(currentScale));
      }
    });
  };
  
  // Update positions on simulation tick (throttled)
  simulation.on('tick', () => {
    const currentAlpha = simulation.alpha();
    
    // Check if simulation is stable (alpha very low and not changing much)
    if (currentAlpha < 0.01 && Math.abs(currentAlpha - lastAlpha) < 0.001) {
      stableTicks++;
      
      // Fit entire graph to viewport on initial load (once)
      if (!initialFitDone && stableTicks > 5) {
        initialFitDone = true;
        fitEntireGraphToViewport();
      }
      
      // Stop simulation after 10 stable ticks to save CPU
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
  
  // Reset view button
  const resetBtn = document.getElementById('link-map-reset');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      clearFocus();
      svg.transition()
        .duration(750)
        .call(zoom.transform as any, d3.zoomIdentity);
    });
  }
  
  // View mode buttons
  const pagesBtn = document.getElementById('link-map-view-pages');
  if (pagesBtn) {
    pagesBtn.addEventListener('click', () => {
      switchView('pages');
    });
  }
  
  const sectionsBtn = document.getElementById('link-map-view-sections');
  if (sectionsBtn) {
    sectionsBtn.addEventListener('click', () => {
      switchView('sections');
    });
  }
  
  const topicsBtn = document.getElementById('link-map-view-topics');
  if (topicsBtn) {
    topicsBtn.addEventListener('click', () => {
      switchView('topics');
    });
  }
  
  // Link direction toggle buttons
  const outboundBtn = document.getElementById('link-map-link-direction-outbound');
  const inboundBtn = document.getElementById('link-map-link-direction-inbound');
  
  const switchLinkDirection = (mode: LinkDirectionMode) => {
    if (linkDirectionMode === mode) return;
    
    linkDirectionMode = mode;
    
    // Update button active states
    if (outboundBtn) {
      outboundBtn.classList.toggle('page-list-link-map__control-btn--active', mode === 'outbound');
    }
    if (inboundBtn) {
      inboundBtn.classList.toggle('page-list-link-map__control-btn--active', mode === 'inbound');
    }
    
    // If there's a focused node, refocus to update connections
    if (focusedNode) {
      const nodeToRefocus = focusedNode;
      clearFocus();
      // Use setTimeout to ensure clearFocus completes
      setTimeout(() => {
        focusNode(nodeToRefocus);
      }, 0);
    } else {
      // Just update styles if no focus
      updateFocusStyles();
    }
  };
  
  if (outboundBtn) {
    outboundBtn.addEventListener('click', () => switchLinkDirection('outbound'));
  }
  if (inboundBtn) {
    inboundBtn.addEventListener('click', () => switchLinkDirection('inbound'));
  }
  
  // Center button - centers without zooming
  const centerBtn = document.getElementById('link-map-center');
  if (centerBtn) {
    centerBtn.addEventListener('click', () => {
      if (focusedNode) {
        const connectedNodes: LinkMapNode[] = [];
        connectedNodeIds.forEach(id => {
          const node = currentGraphData.nodes.find(n => n.id === id);
          if (node) connectedNodes.push(node);
        });
        centerGraph([focusedNode, ...connectedNodes]);
      } else {
        centerGraph();
      }
    });
  }
  
  // Fit to screen button - fits and centers
  const fitBtn = document.getElementById('link-map-fit');
  if (fitBtn) {
    fitBtn.addEventListener('click', () => {
      if (focusedNode) {
        const connectedNodes: LinkMapNode[] = [];
        connectedNodeIds.forEach(id => {
          const node = currentGraphData.nodes.find(n => n.id === id);
          if (node) connectedNodes.push(node);
        });
        fitEntireGraphToViewport([focusedNode, ...connectedNodes]);
      } else {
        fitEntireGraphToViewport();
      }
    });
  }
  
  // Build search data function (accessible from switchView)
  const buildSearchData = () => {
    return currentGraphData.nodes.map(node => ({
      node,
      titleLower: node.title.toLowerCase(),
      urlLower: node.url.toLowerCase(),
      sectionLower: node.section ? node.section.toLowerCase() : ''
    }));
  };
  
  let nodeSearchData = buildSearchData();
  
  // Search functionality with debouncing
  const searchInput = document.getElementById('link-map-search') as HTMLInputElement;
  if (searchInput) {
    let searchTimeout: number | null = null;
    const searchDebounceDelay = 150; // ms
    
    // Update search placeholder based on view mode
    const updateSearchPlaceholder = () => {
      if (searchInput) {
        if (currentViewMode === 'topics') {
          searchInput.placeholder = 'Search topics...';
        } else if (currentViewMode === 'sections') {
          searchInput.placeholder = 'Search sections...';
        } else {
          searchInput.placeholder = 'Search pages...';
        }
      }
    };
    updateSearchPlaceholder();
    
    const performSearch = (searchTerm: string) => {
      const term = searchTerm.toLowerCase();
      if (term === '') {
        // Reset to focus state (which will hide unconnected if focused)
        updateFocusStyles();
        return;
      }
      
      // Batch updates - respect focus state
      const focusedId = focusedNode?.id;
      const hasFocus = !!focusedNode;
      
      node.each(function(this: SVGCircleElement, d: LinkMapNode) {
        const data = nodeSearchData.find(nd => nd.node.id === d.id);
        // Search in title, URL, and section/topic name
        const matches = data && (
          data.titleLower.includes(term) || 
          data.urlLower.includes(term) ||
          (currentViewMode === 'topics' && data.sectionLower.includes(term))
        );
        const isFocused = hasFocus && d.id === focusedId;
        const isConnected = hasFocus && connectedNodeIds.has(d.id);
        
        // If focused, only show focused/connected nodes that match search
        if (hasFocus && !isFocused && !isConnected) {
          d3.select(this).style('opacity', 0); // Hide unconnected even if they match search
        } else {
          d3.select(this).style('opacity', matches ? 1 : 0.2);
        }
      });
      
      label.each(function(this: SVGTextElement, d: LinkMapNode) {
        const data = nodeSearchData.find(nd => nd.node.id === d.id);
        // Search in title, URL, and section/topic name
        const matches = data && (
          data.titleLower.includes(term) || 
          data.urlLower.includes(term) ||
          (currentViewMode === 'topics' && data.sectionLower.includes(term))
        );
        const isFocused = hasFocus && d.id === focusedId;
        const isConnected = hasFocus && connectedNodeIds.has(d.id);
        
        // If focused, only show focused/connected labels that match search
        if (hasFocus && !isFocused && !isConnected) {
          d3.select(this).style('opacity', 0); // Hide unconnected labels even if they match search
        } else {
          d3.select(this).style('opacity', matches ? 1 : 0.2);
        }
      });
    };
    
    searchInput.addEventListener('input', (e) => {
      const searchTerm = (e.target as HTMLInputElement).value;
      
      // Clear existing timeout
      if (searchTimeout !== null) {
        clearTimeout(searchTimeout);
      }
      
      // Debounce the search
      searchTimeout = window.setTimeout(() => {
        performSearch(searchTerm);
        searchTimeout = null;
      }, searchDebounceDelay);
    });
  }
  
  // Heatmap functionality
  let heatmapEnabled = false;
  const heatmapToggleBtn = document.getElementById('link-map-heatmap-toggle');
  if (heatmapToggleBtn) {
    heatmapToggleBtn.addEventListener('click', () => {
      heatmapEnabled = !heatmapEnabled;
      heatmapToggleBtn.classList.toggle('page-list-link-map__control-btn--active', heatmapEnabled);
      updateHeatmap();
    });
  }
  
  const updateHeatmap = () => {
    // Show/hide heatmap legend
    const heatmapLegend = document.getElementById('link-map-heatmap-legend');
    const focusedPanel = document.getElementById('link-map-focused-panel');
    
    if (heatmapLegend) {
      heatmapLegend.style.display = heatmapEnabled ? 'block' : 'none';
      
      // Adjust position based on focused panel visibility
      if (heatmapEnabled && focusedPanel && focusedPanel.style.display !== 'none') {
        const panelHeight = focusedPanel.offsetHeight || 200;
        heatmapLegend.style.top = `${panelHeight + 1.5}rem`;
      } else if (heatmapEnabled) {
        heatmapLegend.style.top = '1rem';
      }
    }
    
    if (!heatmapEnabled) {
      // Reset to normal colors, but respect focus and external nodes
      node.each(function(this: SVGCircleElement | SVGRectElement, d: LinkMapNode) {
        const isFocused = focusedNode && d.id === focusedNode.id;
        const isConnected = focusedNode && connectedNodeIds.has(d.id);
        if (!isFocused && !isConnected) {
          d3.select(this).attr('fill', getNodeColor(d));
        }
      });
      return;
    }
    
    // Calculate max degree for normalization
    let maxDegree = 0;
    let minDegree = Infinity;
    currentGraphData.nodes.forEach(node => {
      const degree = node.inboundLinks + node.outboundLinks;
      maxDegree = Math.max(maxDegree, degree);
      minDegree = Math.min(minDegree, degree);
    });
    
    // Use a vibrant color scale from cool blue to hot red with enhanced contrast
    // Non-linear mapping makes differences more visible across the spectrum
    const vibrantColorScale = (t: number): string => {
      // t is normalized from 0 (min) to 1 (max)
      // Use a power curve to enhance contrast - makes differences more dramatic
      // Lower exponent = more contrast in lower ranges, higher = more in upper ranges
      const contrastCurve = Math.pow(t, 0.6); // Balanced curve for good visibility
      
      // Create a vibrant spectrum: Deep Blue -> Bright Cyan -> Yellow -> Orange -> Bright Red
      if (contrastCurve < 0.2) {
        // Deep Blue to Bright Cyan (very low connectivity)
        const localT = contrastCurve / 0.2;
        const r = Math.floor(0 + (0 * localT));
        const g = Math.floor(50 + (200 * localT));
        const b = Math.floor(150 + (105 * localT));
        return d3.rgb(r, g, b).toString();
      } else if (contrastCurve < 0.4) {
        // Cyan to Green-Yellow (low-medium connectivity)
        const localT = (contrastCurve - 0.2) / 0.2;
        const r = Math.floor(0 + (200 * localT));
        const g = 255;
        const b = Math.floor(255 - (255 * localT));
        return d3.rgb(r, g, b).toString();
      } else if (contrastCurve < 0.6) {
        // Yellow to Orange (medium connectivity)
        const localT = (contrastCurve - 0.4) / 0.2;
        const r = 255;
        const g = Math.floor(255 - (100 * localT));
        const b = 0;
        return d3.rgb(r, g, b).toString();
      } else if (contrastCurve < 0.8) {
        // Orange to Red-Orange (high connectivity)
        const localT = (contrastCurve - 0.6) / 0.2;
        const r = 255;
        const g = Math.floor(155 - (100 * localT));
        const b = 0;
        return d3.rgb(r, g, b).toString();
      } else {
        // Red-Orange to Bright Red (very high connectivity - hubs)
        const localT = (contrastCurve - 0.8) / 0.2;
        const r = 255;
        const g = Math.floor(55 - (55 * localT));
        const b = 0;
        return d3.rgb(r, g, b).toString();
      }
    };
    
    // Apply heatmap colors based on degree, but preserve focus colors and external node colors
    node.each(function(this: SVGCircleElement | SVGRectElement, d: LinkMapNode) {
      const isFocused = focusedNode && d.id === focusedNode.id;
      const isConnected = focusedNode && connectedNodeIds.has(d.id);
      
      // Don't override focus/connected colors or external node colors
      if (isFocused || isConnected || d.isExternal) {
        return;
      }
      
      const degree = d.inboundLinks + d.outboundLinks;
      const normalizedT = maxDegree > minDegree 
        ? (degree - minDegree) / (maxDegree - minDegree)
        : 0;
      
      // Use vibrant color scale with enhanced contrast
      const heatColor = vibrantColorScale(normalizedT);
      
      d3.select(this).attr('fill', heatColor);
    });
  };
  
  // Shortest path highlighting
  let selectedNodesForPath: LinkMapNode[] = [];
  let highlightedPath: string[] = [];
  
  const findShortestPath = (startId: string, endId: string): string[] => {
    // BFS to find shortest path
    const queue: Array<{ id: string; path: string[] }> = [{ id: startId, path: [startId] }];
    const visited = new Set<string>([startId]);
    
    while (queue.length > 0) {
      const current = queue.shift()!;
      
      if (current.id === endId) {
        return current.path;
      }
      
      const connections = connectionMap.get(current.id);
      if (connections) {
        connections.forEach(neighborId => {
          if (!visited.has(neighborId)) {
            visited.add(neighborId);
            queue.push({ id: neighborId, path: [...current.path, neighborId] });
          }
        });
      }
    }
    
    return []; // No path found
  };
  
  const highlightPath = (path: string[]) => {
    highlightedPath = path;
    
    // Highlight nodes in path - handle both circles and rectangles
    node.each(function(this: SVGCircleElement | SVGRectElement, d: LinkMapNode) {
      const inPath = path.includes(d.id);
      d3.select(this)
        .attr('stroke', inPath ? '#FF6B6B' : '#333')
        .attr('stroke-width', inPath ? 4 : 2);
    });
    
    // Highlight links in path
    link.each(function(this: SVGLineElement, d: any) {
      const sourceId = typeof d.source === 'string' ? d.source : d.source.id;
      const targetId = typeof d.target === 'string' ? d.target : d.target.id;
      const inPath = path.includes(sourceId) && path.includes(targetId) &&
                     Math.abs(path.indexOf(sourceId) - path.indexOf(targetId)) === 1;
      
      d3.select(this)
        .attr('stroke', inPath ? '#FF6B6B' : '#999')
        .attr('stroke-width', inPath ? 3 : 1)
        .attr('opacity', inPath ? 1 : (focusedNode ? 0.3 : 1));
    });
  };
  
  const clearPathHighlight = () => {
    highlightedPath = [];
    selectedNodesForPath = [];
    
    // Reset node strokes (but preserve focus styles) - handle both circles and rectangles
    node.each(function(this: SVGCircleElement | SVGRectElement, d: LinkMapNode) {
      const isFocused = focusedNode && d.id === focusedNode.id;
      const isConnected = focusedNode && connectedNodeIds.has(d.id);
      if (!isFocused && !isConnected) {
        d3.select(this).attr('stroke', '#333').attr('stroke-width', 2);
      }
    });
    
    // Reset link colors using updateFocusStyles to restore proper outbound/inbound colors
    updateFocusStyles();
  };
  
  // Graph editing functionality (stretch goal)
  let isEditMode = false;
  let dragSource: LinkMapNode | null = null;
  let tempLink: any = null;
  
  // Right-click context menu for adding/removing topics (only in topics view)
  node.on('contextmenu', (event: MouseEvent, d: LinkMapNode) => {
    if (currentViewMode !== 'topics') return;
    
    event.preventDefault();
    // Note: Full context menu implementation would require additional UI
    // This is a placeholder for the functionality
  });
  
}

/**
 * Drag behavior for nodes
 */
function drag(simulation: any, d3: any) {
  function dragstarted(event: any) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    event.subject.fx = event.subject.x;
    event.subject.fy = event.subject.y;
  }
  
  function dragged(event: any) {
    event.subject.fx = event.x;
    event.subject.fy = event.y;
  }
  
  function dragended(event: any) {
    if (!event.active) simulation.alphaTarget(0);
    event.subject.fx = null;
    event.subject.fy = null;
  }
  
  return d3.drag()
    .on('start', dragstarted)
    .on('drag', dragged)
    .on('end', dragended);
}

/**
 * Extract external links from pages
 * Attempts to extract external link URLs from page content or data
 * Note: This requires external link URLs to be available in page data
 * or page content to be parsed. Currently checks for externalLinks property.
 */
function extractExternalLinksFromPages(pages: PageData[]): Map<string, string[]> {
  const externalLinksMap = new Map<string, string[]>();
  const pageUrls = new Set(pages.map(p => p.relPermalink));
  
  pages.forEach(page => {
    const externalLinks: string[] = [];
    
    // Try to get external links from page data
    // Option 1: If page has externalLinks property (array of URLs)
    if (page.externalLinks && Array.isArray(page.externalLinks)) {
      page.externalLinks.forEach((url: string) => {
        try {
          // Ensure URL is absolute
          const absoluteUrl = url.startsWith('http') ? url : `https://${url}`;
          const urlObj = new URL(absoluteUrl);
          // Only include if it's truly external (not same domain)
          const currentHost = window.location.hostname.replace('www.', '');
          const linkHost = urlObj.hostname.replace('www.', '');
          if (linkHost !== currentHost && !linkHost.includes(currentHost) && !currentHost.includes(linkHost)) {
            externalLinks.push(absoluteUrl);
          }
        } catch (e) {
          // Invalid URL, skip
        }
      });
    }
    
    // Option 2: Calculate from outboundLinks and totalInternalLinks
    // If we know total outbound links and internal links, we can infer external count
    // But we need the actual URLs, so this is limited
    
    // Option 3: Parse from page content (would require fetching content)
    // This could be implemented by fetching page HTML and parsing <a> tags
    
    externalLinksMap.set(page.relPermalink, externalLinks);
  });
  
  return externalLinksMap;
}

/**
 * Extract internal links from pages
 * Uses page data to infer links - in production, you'd parse the actual HTML content
 * Optimized with pre-built indexes to reduce O(n²) complexity
 */
function extractInternalLinksFromPages(pages: PageData[]): Map<string, string[]> {
  const linkMap = new Map<string, string[]>();
  const pageUrls = new Set(pages.map(p => p.relPermalink));
  
  // Pre-build indexes for O(1) lookups instead of O(n) searches
  const pagesBySection = new Map<string, PageData[]>();
  const pagesByPathPrefix = new Map<string, PageData[]>();
  const mainSections = new Set<string>();
  
  // Build indexes in single pass
  pages.forEach(page => {
    linkMap.set(page.relPermalink, []);
    
    // Index by section
    if (page.section) {
      if (!pagesBySection.has(page.section)) {
        pagesBySection.set(page.section, []);
      }
      pagesBySection.get(page.section)!.push(page);
    }
    
    // Index by path prefix (first segment)
    const pathParts = page.relPermalink.split('/').filter(p => p);
    if (pathParts.length > 0) {
      const prefix = '/' + pathParts[0] + '/';
      if (!pagesByPathPrefix.has(prefix)) {
        pagesByPathPrefix.set(prefix, []);
      }
      pagesByPathPrefix.get(prefix)!.push(page);
      
      // Collect main sections for home page
      if (page.relPermalink !== '/' && page.section) {
        const sectionPath = '/' + page.section.split('/')[0] + '/';
        if (pageUrls.has(sectionPath)) {
          mainSections.add(sectionPath);
        }
      }
    }
  });
  
  // Extract links using optimized indexes
  pages.forEach(page => {
    const links = new Set<string>();
    
    // Add links from brokenLinkUrls (these are actual links in the content, even if broken)
    if (page.brokenLinkUrls && Array.isArray(page.brokenLinkUrls)) {
      for (const url of page.brokenLinkUrls) {
        // Remove anchor fragments
        const path = url.split('#')[0];
        // Only include if it's a known page URL
        if (pageUrls.has(path) && path !== page.relPermalink) {
          links.add(path);
        }
      }
    }
    
    // Infer likely links based on section structure
    // Home page links to main sections
    if (page.relPermalink === '/') {
      mainSections.forEach(link => links.add(link));
    }
    
    // Pages in same section link to each other (common pattern)
    if (page.section && pagesBySection.has(page.section)) {
      const sectionPages = pagesBySection.get(page.section)!;
      for (const otherPage of sectionPages) {
        if (otherPage.relPermalink !== page.relPermalink && links.size < 10) {
          links.add(otherPage.relPermalink);
        }
      }
    }
    
    // If page has internal links count, try to infer more connections
    if (page.totalInternalLinks > 0 && links.size < page.totalInternalLinks) {
      const pagePathParts = page.relPermalink.split('/').filter(p => p);
      if (pagePathParts.length > 0) {
        const prefix = '/' + pagePathParts[0] + '/';
        const prefixPages = pagesByPathPrefix.get(prefix);
        
        if (prefixPages) {
          for (const otherPage of prefixPages) {
            if (otherPage.relPermalink === page.relPermalink || links.size >= page.totalInternalLinks) {
              break;
            }
            
            const otherPathParts = otherPage.relPermalink.split('/').filter(p => p);
            // Check if pages share a common path prefix (likely related)
            if (otherPathParts.length > 0) {
              if (pagePathParts[0] === otherPathParts[0] || 
                  page.relPermalink.startsWith(otherPage.relPermalink + '/') ||
                  otherPage.relPermalink.startsWith(page.relPermalink + '/')) {
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

