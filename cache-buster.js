// cache-buster.js — Add timestamp parameters to CSS/JS and disable browser cache

(async function main() {
  // Since we run at document_end, DOM should already be ready
  // But let's add a small delay to ensure everything is loaded
  await new Promise((resolve) => setTimeout(resolve, 100));

  const { cacheBuster } = await chrome.storage.sync.get("cacheBuster");
  if (!cacheBuster) return;

  const {
    enabled,
    addTimestampCSS = false,
    addTimestampJS = false,
    disableCache = false,
    cssFileNames = [],
    jsFileNames = [],
    targetDomains = [],
  } = cacheBuster;

  if (!enabled) return;

  // Check if current domain should be processed
  const currentDomain = window.location.hostname;
  const shouldProcessDomain =
    targetDomains.length === 0 ||
    targetDomains.some((domain) => {
      // Support both exact matches and subdomain matches
      const cleanDomain = domain.trim();
      return (
        currentDomain === cleanDomain ||
        currentDomain.endsWith("." + cleanDomain)
      );
    });

  if (!shouldProcessDomain) return;

  // Generate timestamp for cache busting
  const timestamp = Date.now();

  // Function to add timestamp to URL
  function addTimestampToUrl(url) {
    if (!url || typeof url !== "string") return url;

    try {
      const urlObj = new URL(url, window.location.origin);
      // Always replace existing 'ver' parameter with our timestamp
      urlObj.searchParams.set("ver", timestamp);
      return urlObj.toString();
    } catch (e) {
      // If URL parsing fails, handle manually
      const separator = url.includes("?") ? "&" : "?";

      // Check if 'ver' parameter already exists
      if (url.includes("ver=")) {
        // Replace existing ver parameter
        return url.replace(
          /[?&]ver=[^&]*/,
          `${url.includes("?") ? "&" : "?"}ver=${timestamp}`
        );
      } else {
        // Add new ver parameter
        return `${url}${separator}ver=${timestamp}`;
      }
    }
  }

  // Function to check if URL matches file name patterns
  function matchesFilePatterns(url, patterns) {
    if (!patterns || patterns.length === 0) return true; // No patterns = match all

    const fileName = url.split("/").pop().split("?")[0]; // Get filename without query params

    return patterns.some((pattern) => {
      // Convert glob pattern to regex
      const regexPattern = pattern
        .replace(/[.*+?^${}()|[\]\\]/g, "\\$&") // Escape special regex chars
        .replace(/\*/g, ".*"); // Convert * to .*
      const regex = new RegExp(regexPattern, "i");
      return regex.test(fileName);
    });
  }

  // Function to check if URL is CSS or JS
  function isAssetUrl(url, type) {
    if (!url) return false;
    const lowerUrl = url.toLowerCase();

    if (type === "css") {
      const isCss =
        lowerUrl.includes(".css") ||
        lowerUrl.endsWith(".css") ||
        lowerUrl.includes("stylesheet");
      return isCss && matchesFilePatterns(url, cssFileNames);
    }

    if (type === "js") {
      const isJs =
        lowerUrl.includes(".js") ||
        lowerUrl.endsWith(".js") ||
        lowerUrl.includes("script");
      return isJs && matchesFilePatterns(url, jsFileNames);
    }

    // Fallback for backward compatibility
    return (
      lowerUrl.includes(".css") ||
      lowerUrl.includes(".js") ||
      lowerUrl.includes("stylesheet") ||
      lowerUrl.includes("script") ||
      lowerUrl.endsWith(".css") ||
      lowerUrl.endsWith(".js")
    );
  }

  // Function to check if element was already processed
  function isAlreadyProcessed(element) {
    return element.hasAttribute("data-cache-buster-processed");
  }

  // Function to mark element as processed
  function markAsProcessed(element) {
    element.setAttribute("data-cache-buster-processed", "true");
  }

  // Function to process element attributes
  function processElement(element) {
    if (!element || !element.tagName) return;

    // Skip if already processed
    if (isAlreadyProcessed(element)) return;

    // Process CSS links
    if (
      element.tagName === "LINK" &&
      element.getAttribute("rel") === "stylesheet" &&
      addTimestampCSS
    ) {
      const href = element.getAttribute("href");
      if (href && isAssetUrl(href, "css")) {
        const newHref = addTimestampToUrl(href);
        element.setAttribute("href", newHref);
        markAsProcessed(element);
      }
    }

    // Process JS scripts
    if (
      element.tagName === "SCRIPT" &&
      element.hasAttribute("src") &&
      addTimestampJS
    ) {
      const src = element.getAttribute("src");
      if (src && isAssetUrl(src, "js")) {
        const newSrc = addTimestampToUrl(src);
        element.setAttribute("src", newSrc);
        markAsProcessed(element);
      }
    }

    // Process preload links for CSS/JS
    if (
      element.tagName === "LINK" &&
      element.getAttribute("rel") === "preload"
    ) {
      const as = element.getAttribute("as");
      const href = element.getAttribute("href");

      if (
        as === "style" &&
        addTimestampCSS &&
        href &&
        isAssetUrl(href, "css")
      ) {
        const newHref = addTimestampToUrl(href);
        element.setAttribute("href", newHref);
        markAsProcessed(element);
      }

      if (as === "script" && addTimestampJS && href && isAssetUrl(href, "js")) {
        const newHref = addTimestampToUrl(href);
        element.setAttribute("href", newHref);
        markAsProcessed(element);
      }
    }
  }

  // Function to disable browser cache by adding headers
  function disableCacheForRequests() {
    if (!disableCache) return;

    // Override fetch to add cache-busting headers
    const originalFetch = window.fetch;
    window.fetch = function (...args) {
      const [url, options = {}] = args;

      // Add cache-busting headers
      const newOptions = {
        ...options,
        headers: {
          ...options.headers,
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      };

      return originalFetch(url, newOptions);
    };

    // Override XMLHttpRequest to add cache-busting headers
    const originalXHROpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function (method, url, ...args) {
      this._cacheBusterUrl = url;
      return originalXHROpen.call(this, method, url, ...args);
    };

    const originalXHRSend = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.send = function (data) {
      if (this._cacheBusterUrl) {
        this.setRequestHeader(
          "Cache-Control",
          "no-cache, no-store, must-revalidate"
        );
        this.setRequestHeader("Pragma", "no-cache");
        this.setRequestHeader("Expires", "0");
      }
      return originalXHRSend.call(this, data);
    };
  }

  // Process existing elements
  function processExistingElements() {
    if (!addTimestampCSS && !addTimestampJS) return;

    const allElements = [];

    // Get CSS elements if CSS processing is enabled
    if (addTimestampCSS) {
      const cssElements = document.querySelectorAll('link[rel="stylesheet"]');
      allElements.push(...cssElements);
    }

    // Get JS elements if JS processing is enabled
    if (addTimestampJS) {
      const jsElements = document.querySelectorAll("script[src]");
      allElements.push(...jsElements);
    }

    // Get preload elements if either CSS or JS processing is enabled
    if (addTimestampCSS || addTimestampJS) {
      const preloadElements = document.querySelectorAll('link[rel="preload"]');
      allElements.push(...preloadElements);
    }

    allElements.forEach(processElement);
  }

  // Initialize cache busting
  if (addTimestampCSS || addTimestampJS) {
    processExistingElements();
  }

  if (disableCache) {
    disableCacheForRequests();
  }

  // Set up mutation observer for dynamically added elements
  if (addTimestampCSS || addTimestampJS) {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === "childList") {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              // Only process if it's a CSS/JS element and not already processed
              if (
                (node.tagName === "LINK" &&
                  (node.getAttribute("rel") === "stylesheet" ||
                    node.getAttribute("rel") === "preload")) ||
                (node.tagName === "SCRIPT" && node.hasAttribute("src"))
              ) {
                processElement(node);
              }

              // Process child elements
              const childElements = node.querySelectorAll(
                'link[rel="stylesheet"]:not([data-cache-buster-processed]), script[src]:not([data-cache-buster-processed]), link[rel="preload"]:not([data-cache-buster-processed])'
              );
              childElements.forEach(processElement);
            }
          });
        }
      });
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
  }

  // Listen for storage changes to update settings
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === "sync" && changes.cacheBuster) {
      const newSettings = changes.cacheBuster.newValue;
      if (newSettings) {
        // Reload the page to apply new settings
        window.location.reload();
      }
    }
  });
})().catch((error) => {
  console.error("Cache Buster: Error in main function:", error);
});
