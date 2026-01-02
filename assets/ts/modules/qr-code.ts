/**
 * QR Code Module
 * Generates QR codes using the official qrcode library (soldair/node-qrcode) via CDN
 * This library provides QRCode.toDataURL for generating data URLs
 */

import { onDOMReady } from "../utils/dom";

// Official qrcode CDN sources (correct /build/ path for browser bundle)
const QR_CODE_CDNS = [
  "https://cdn.jsdelivr.net/npm/qrcode/build/qrcode.min.js",        // Primary - latest version (reliable & fast)
  "https://unpkg.com/qrcode/build/qrcode.min.js",                    // Backup - latest version
  "https://cdn.jsdelivr.net/npm/qrcode@1.5.4/build/qrcode.min.js"   // Fallback - specific version
] as const;

// Loading state
let qrCodeLoading = false;
let qrCodeLoadPromise: Promise<any> | null = null;

// Type for the QRCode global (official qrcode package)
declare global {
  interface Window {
    QRCode?: {
      toDataURL: (
        text: string,
        options?: {
          width?: number;
          margin?: number;
          color?: {
            dark?: string;
            light?: string;
          };
          errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
        },
        cb?: (error: Error | null, url: string) => void
      ) => void;
    };
  }
}

const getQRCodeLibrary = (): any | undefined => {
  return (window as any).QRCode;
};

const loadQRCodeLibrary = (): Promise<any> => {
  if (qrCodeLoadPromise) {
    return qrCodeLoadPromise;
  }

  const existing = getQRCodeLibrary();
  if (existing && typeof existing.toDataURL === 'function') {
    return Promise.resolve(existing);
  }

  qrCodeLoadPromise = new Promise((resolve, reject) => {
    qrCodeLoading = true;

    const tryLoadCDN = (index: number): void => {
      if (index >= QR_CODE_CDNS.length) {
        qrCodeLoading = false;
        qrCodeLoadPromise = null;
        reject(new Error("All QRCode CDN sources failed to load"));
        return;
      }

      const url = QR_CODE_CDNS[index];
      console.log(`Attempting to load QRCode from ${url}...`);
      const script = document.createElement("script");
      script.src = url;
      script.async = true;

      script.onload = () => {
        console.log(`Script loaded from ${url}, checking for QRCode global...`);
        // Poll for the library to be available (up to 3 seconds)
        let attempts = 0;
        const maxAttempts = 60; // 3s at 50ms intervals
        const check = () => {
          attempts++;
          const lib = getQRCodeLibrary();
          if (lib && typeof lib.toDataURL === "function") {
            console.log(`QRCode library ready from ${url}`);
            qrCodeLoading = false;
            resolve(lib);
          } else if (attempts < maxAttempts) {
            setTimeout(check, 50);
          } else {
            console.warn(`QRCode from ${url} didn't initialize properly after ${maxAttempts} checks, trying next CDN...`);
            script.remove();
            tryLoadCDN(index + 1);
          }
        };
        check();
      };

      script.onerror = (e) => {
        console.warn(`Failed to load QRCode from ${url}:`, e);
        script.remove();
        tryLoadCDN(index + 1);
      };

      document.head.appendChild(script);
    };

    tryLoadCDN(0);
  });

  return qrCodeLoadPromise;
};

const generateQRCode = async (url: string, size: number, container: HTMLElement): Promise<void> => {
  try {
    const QRCode = await loadQRCodeLibrary();

    if (!QRCode || typeof QRCode.toDataURL !== "function") {
      throw new Error("QRCode.toDataURL is not available");
    }

    // Show loading state
    container.innerHTML = '<div style="text-align:center; padding: 20px; color: #666;">Generating QR code...</div>';

    // Options for QR generation
    const options = {
      width: size,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#FFFFFF"
      },
      errorCorrectionLevel: 'M' as const // Medium error correction for balance
    };

    QRCode.toDataURL(url, options, (err: Error | null, dataUrl: string) => {
      if (err || !dataUrl) {
        console.error("QR code generation failed:", err);
        container.innerHTML = `<p style="text-align:center; color:#e74c3c; padding:20px;">
          Unable to generate QR code.<br>
          <a href="${url}" target="_blank" rel="noopener noreferrer">Open link directly</a>
        </p>`;
        return;
      }

      // Create and append the image
      const img = document.createElement("img");
      img.src = dataUrl;
      img.alt = `QR Code for ${url}`;
      img.style.cssText = `
        width: ${size}px;
        height: ${size}px;
        max-width: 100%;
        height: auto;
        display: block;
        margin: 0 auto;
        border: 1px solid #ddd;
        border-radius: 4px;
        image-rendering: -webkit-optimize-contrast;
        image-rendering: crisp-edges;
      `;

      container.innerHTML = "";
      container.appendChild(img);
    });
  } catch (error) {
    console.error("Error loading/generating QR code:", error);
    const safeUrl = url.replace(/"/g, '&quot;'); // Basic escaping
    container.innerHTML = `<p style="text-align:center; color:#e74c3c; padding:20px;">
      Unable to generate QR code.<br>
      <a href="${safeUrl}" target="_blank" rel="noopener noreferrer">Open link directly</a>
    </p>`;
  }
};

const initQRCodes = (): void => {
  const containers = document.querySelectorAll<HTMLElement>(".qr-code[data-qr-url]");

  if (containers.length === 0) {
    console.log("No QR code containers found");
    return;
  }

  console.log(`Initializing ${containers.length} QR code(s)`);
  containers.forEach((container) => {
    const url = container.getAttribute("data-qr-url");
    const sizeAttr = container.getAttribute("data-qr-size");
    const size = sizeAttr ? Math.max(100, Math.min(parseInt(sizeAttr, 10), 500)) : 200; // Clamp size 100-500px

    if (url && url.trim()) {
      generateQRCode(url.trim(), size, container);
    } else {
      console.warn("Invalid URL for QR code container:", container);
    }
  });
};

export const initQRCode = (): void => {
  // Ensure DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      setTimeout(initQRCodes, 150); // Slight delay for other scripts
    });
  } else {
    setTimeout(initQRCodes, 150);
  }
};

// Auto-init if directly imported (optional)
if (typeof (globalThis as any).module === 'undefined' || !(globalThis as any).module?.parent) {
  initQRCode();
}