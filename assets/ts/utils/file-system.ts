/**
 * File System Utilities (DEV-ONLY)
 * ============================================================================
 * Shared file system operations for dev tools (page-list, dev-score-bubble).
 * Uses File System Access API with fallbacks to HTTP fetch and backend API.
 * ============================================================================
 */

// Shared directory handle (shared across all dev modules)
let siteRootDirectoryHandle: FileSystemDirectoryHandle | null = null;

/**
 * Request access to site root directory (contains content folder)
 */
export async function requestSiteRootAccess(
  onSuccess?: (message: string) => void,
  onError?: (message: string) => void
): Promise<FileSystemDirectoryHandle | null> {
  if (!('showDirectoryPicker' in window)) {
    const msg = 'File System Access API not supported. Falling back to backend API.';
    console.warn(msg);
    onError?.(msg);
    return null;
  }

  try {
    console.log('Requesting directory access...');
    const handle = await (window as any).showDirectoryPicker({
      startIn: 'documents',
      mode: 'readwrite'
    });
    
    console.log('Directory selected, verifying content folder...');
    try {
      await handle.getDirectoryHandle('content', { create: false });
      console.log('✅ Content directory found!');
      siteRootDirectoryHandle = handle;
      const msg = 'Directory access granted! You can now update source files.';
      onSuccess?.(msg);
      return handle;
    } catch (contentError) {
      console.error('❌ Selected directory does not contain a "content" folder');
      const msg = 'Selected directory does not contain a "content" folder. Please select your Hugo site root directory.';
      onError?.(msg);
      return null;
    }
  } catch (error) {
    if ((error as Error).name === 'AbortError') {
      console.log('User cancelled directory selection');
      onError?.('Directory selection cancelled.');
    } else {
      console.error('Error accessing directory:', error);
      const msg = `Error accessing directory: ${error instanceof Error ? error.message : 'Unknown error'}`;
      onError?.(msg);
    }
    return null;
  }
}

/**
 * Get the current site root directory handle
 */
export function getSiteRootDirectoryHandle(): FileSystemDirectoryHandle | null {
  return siteRootDirectoryHandle;
}

/**
 * Set the site root directory handle (for testing or manual setup)
 */
export function setSiteRootDirectoryHandle(handle: FileSystemDirectoryHandle | null): void {
  siteRootDirectoryHandle = handle;
}

/**
 * Read file content using File System Access API or fetch
 */
export async function readFileContent(
  filePath: string,
  verbose: boolean = false
): Promise<{ content: string; lineNumber: number; actualPath: string } | null> {
  try {
    // Method 1: File System Access API
    if (siteRootDirectoryHandle) {
      try {
        const pathParts = filePath.replace(/^content\//, '').split('/');
        let currentHandle: FileSystemDirectoryHandle | FileSystemFileHandle = siteRootDirectoryHandle;
        
        if (verbose) {
          console.log(`Attempting to read via File System Access API: ${filePath}`);
          console.log(`Path parts:`, pathParts);
        }
        
        // Navigate to content directory
        try {
          currentHandle = await (currentHandle as FileSystemDirectoryHandle).getDirectoryHandle('content');
          if (verbose) console.log('✅ Found content directory');
        } catch (contentError) {
          if (verbose) {
            console.error('❌ Could not access content directory:', contentError);
            console.error('   Make sure you selected the correct site root folder (the one containing the "content" folder)');
          }
          throw contentError;
        }
        
        // Navigate through subdirectories
        for (let i = 0; i < pathParts.length - 1; i++) {
          if (pathParts[i]) {
            try {
              currentHandle = await (currentHandle as FileSystemDirectoryHandle).getDirectoryHandle(pathParts[i]);
              if (verbose) console.log(`✅ Navigated to: ${pathParts[i]}`);
            } catch (dirError) {
              if (verbose) {
                console.error(`❌ Could not access directory: ${pathParts[i]}`, dirError);
                console.error(`   Path so far: content/${pathParts.slice(0, i).join('/')}`);
                console.error(`   The directory "${pathParts[i]}" may not exist or you may not have access to it.`);
              }
              throw dirError;
            }
          }
        }
        
        // Get the file
        const fileName = pathParts[pathParts.length - 1];
        if (fileName) {
          try {
            const fileHandle = await (currentHandle as FileSystemDirectoryHandle).getFileHandle(fileName);
            const file = await fileHandle.getFile();
            const content = await file.text();
            if (verbose) console.log(`✅ Successfully read file via File System Access API: ${filePath}`);
            return { content, lineNumber: 0, actualPath: filePath };
          } catch (fileError) {
            if (verbose) {
              console.error(`❌ Could not access file: ${fileName}`, fileError);
              const fullPath = `content/${pathParts.join('/')}`;
              console.error(`   Full path attempted: ${fullPath}`);
              console.error(`   The file may not exist, or there may be a case sensitivity issue.`);
            }
            throw fileError;
          }
        }
      } catch (fsError) {
        // Only log if verbose, and only as a debug message, not an error
        if (verbose) console.debug(`File System Access API not available for ${filePath}, trying fallback methods`);
        // Continue to fallback methods
      }
    } else {
      if (verbose) console.debug(`File System Access API not available (siteRootDirectoryHandle is null)`);
    }
    
    // Method 2: Skip HTTP fetch for content files - Hugo doesn't serve them directly
    // Only try HTTP fetch for files that might be served (e.g., static assets)
    if (!filePath.startsWith('content/')) {
      try {
        if (verbose) console.debug(`Trying HTTP fetch for: ${filePath}`);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1000); // 1 second timeout
        
        const response = await fetch(`/${filePath}`, {
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const content = await response.text();
          if (verbose) console.log(`✅ Read file via HTTP fetch: ${filePath}`);
          return { content, lineNumber: 0, actualPath: filePath };
        }
      } catch (fetchError) {
        // Silently ignore fetch errors for non-content files
        if (verbose && 
            (fetchError as Error).name !== 'AbortError' && 
            (fetchError as Error).name !== 'TypeError' &&
            !(fetchError as Error).message?.includes('fetch')) {
          console.debug(`Could not fetch ${filePath} from server:`, fetchError);
        }
      }
    }
    
    // Method 3: Skip backend API - it doesn't exist in this setup
    // The backend API endpoint /api/read-file is not implemented, so we skip it
    // to avoid 404 errors in the console. File System Access API is the primary method.
    
    // Only log error if verbose and we've exhausted all methods
    if (verbose) {
      console.debug(`Could not read file ${filePath} using any method (this is expected when trying multiple paths)`);
    }
    return null;
  } catch (error) {
    // Only log unexpected errors
    if (verbose) {
      console.error(`Unexpected error reading file ${filePath}:`, error);
    }
    return null;
  }
}

/**
 * Write file content using File System Access API or backend API
 */
export async function writeFileContent(filePath: string, content: string): Promise<boolean> {
  try {
    if (siteRootDirectoryHandle) {
      const pathParts = filePath.replace(/^content\//, '').split('/');
      let currentHandle: FileSystemDirectoryHandle | FileSystemFileHandle = siteRootDirectoryHandle;
      
      currentHandle = await (currentHandle as FileSystemDirectoryHandle).getDirectoryHandle('content');
      
      for (let i = 0; i < pathParts.length - 1; i++) {
        try {
          currentHandle = await (currentHandle as FileSystemDirectoryHandle).getDirectoryHandle(pathParts[i]);
        } catch {
          currentHandle = await (currentHandle as FileSystemDirectoryHandle).getDirectoryHandle(pathParts[i], { create: true });
        }
      }
      
      const fileName = pathParts[pathParts.length - 1];
      const fileHandle = await (currentHandle as FileSystemDirectoryHandle).getFileHandle(fileName, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(content);
      await writable.close();
      
      return true;
    }
    
    // File System Access API not available
    // Note: For file writing, use manual file selection via File Picker API instead
    // This function is only called when we have a file path, which requires directory access
    return false;
  } catch (error) {
    console.error(`Error writing file ${filePath}:`, error);
    return false;
  }
}

/**
 * Find the actual file path by trying multiple possibilities
 */
export async function findActualFilePath(possiblePaths: string[], verbose: boolean = false): Promise<string | null> {
  // Check if File System Access API is available
  const hasDirectoryAccess = getSiteRootDirectoryHandle() !== null;
  
  if (verbose && !hasDirectoryAccess) {
    console.warn('⚠️ File System Access API not available. Cannot read files without directory access.');
    console.info('💡 Tip: Grant directory access when prompted to enable file operations.');
  }
  
  for (let i = 0; i < possiblePaths.length; i++) {
    const path = possiblePaths[i];
    if (verbose) {
      console.log(`[${i + 1}/${possiblePaths.length}] Trying to find file at: ${path}`);
    }
    // Use verbose logging only for the first path attempt to reduce console noise
    // Subsequent paths will only log if they succeed
    const fileData = await readFileContent(path, verbose && i === 0);
    if (fileData) {
      if (verbose) {
        console.log(`✅ Found file at: ${fileData.actualPath} (attempt ${i + 1}/${possiblePaths.length})`);
      }
      return fileData.actualPath;
    } else {
      // Only log if verbose and it's the first attempt, or if we're on the last attempt
      if (verbose && (i === 0 || i === possiblePaths.length - 1)) {
        console.debug(`File not found at: ${path}${i < possiblePaths.length - 1 ? ', trying next path...' : ''}`);
      }
    }
  }
  // Only log warning if we couldn't find the file in any path
  if (verbose) {
    if (!hasDirectoryAccess) {
      console.warn(`❌ Could not find file in any of the ${possiblePaths.length} possible paths.`);
      console.warn(`   File System Access API is not available. Please grant directory access to enable file operations.`);
      console.info(`   Tried paths:`, possiblePaths);
    } else {
      console.warn(`❌ Could not find file in any of the ${possiblePaths.length} possible paths:`, possiblePaths);
      console.info(`   The file may not exist at these locations, or the directory structure may be different.`);
    }
  }
  return null;
}

/**
 * Create timestamped backup filename
 */
export function createBackupFilename(originalPath: string): string {
  const now = new Date();
  const timestamp = now.toISOString()
    .replace(/[:.]/g, '-')
    .replace('T', '-')
    .slice(0, -5);
  return `${originalPath}.backup-${timestamp}`;
}

/**
 * Map relPermalink to content file path
 */
export function relPermalinkToContentFile(relPermalink: string): string[] {
  let path = relPermalink.replace(/^\/|\/$/g, '');
  
  if (!path) {
    return ['content/_index.md'];
  }

  const possiblePaths: string[] = [];
  
  // Direct file: /blog/post-name -> content/blog/post-name.md
  possiblePaths.push(`content/${path}.md`);
  
  // Section index: /blog -> content/blog/_index.md
  possiblePaths.push(`content/${path}/_index.md`);
  
  // Regular index: /blog/post-name -> content/blog/post-name/index.md
  possiblePaths.push(`content/${path}/index.md`);

  // Handle nested paths
  const parts = path.split('/');
  if (parts.length > 1) {
    const section = parts[0];
    const name = parts.slice(1).join('/');
    
    // Section/name.md (most common for blog posts)
    possiblePaths.push(`content/${section}/${name}.md`);
    
    // Section/name/_index.md
    possiblePaths.push(`content/${section}/${name}/_index.md`);
  }

  // Remove duplicates and return
  return [...new Set(possiblePaths)];
}

/**
 * Escape special regex characters
 */
export function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Remove link and keep only text
 * Handles: [text](url) -> text and <a href="url">text</a> -> text
 */
export function removeLinkFromContent(
  content: string,
  url: string
): { content: string; changes: Array<{ oldUrl: string; newUrl: string; lineNumber: number; text: string }> } {
  let modifiedContent = content;
  const changes: Array<{ oldUrl: string; newUrl: string; lineNumber: number; text: string }> = [];
  
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
  
  const escapedUrl = escapeRegex(url);
  
  // Markdown links: [text](url) -> text
  const markdownPattern = new RegExp(`\\[([^\\]]+)\\]\\(${escapedUrl}[^)]*\\)`, 'g');
  const markdownMatches: Array<{ index: number; match: string; text: string }> = [];
  
  let match;
  while ((match = markdownPattern.exec(content)) !== null) {
    markdownMatches.push({
      index: match.index,
      match: match[0],
      text: match[1]
    });
  }
  
  // Apply removals in reverse order
  for (let i = markdownMatches.length - 1; i >= 0; i--) {
    const m = markdownMatches[i];
    const beforeMatch = modifiedContent.substring(0, m.index);
    const lineNumber = beforeMatch.split('\n').length;
    
    modifiedContent = beforeMatch + m.text + modifiedContent.substring(m.index + m.match.length);
    changes.push({ oldUrl: url, newUrl: '(removed)', lineNumber, text: m.text });
  }
  
  // HTML links: <a href="url">text</a> -> text
  const htmlPattern = new RegExp(`<a[^>]+href=["']${escapedUrl}["'][^>]*>([^<]+)</a>`, 'gi');
  const htmlMatches: Array<{ index: number; match: string; text: string }> = [];
  
  while ((match = htmlPattern.exec(modifiedContent)) !== null) {
    htmlMatches.push({
      index: match.index,
      match: match[0],
      text: match[1]
    });
  }
  
  // Apply HTML removals in reverse order
  for (let i = htmlMatches.length - 1; i >= 0; i--) {
    const m = htmlMatches[i];
    const beforeMatch = modifiedContent.substring(0, m.index);
    const lineNumber = beforeMatch.split('\n').length;
    
    modifiedContent = beforeMatch + m.text + modifiedContent.substring(m.index + m.match.length);
    changes.push({ oldUrl: url, newUrl: '(removed)', lineNumber, text: m.text });
  }
  
  return { content: modifiedContent, changes };
}

