// content.js — granular asset/menu swapping based on user options

(async function main() {
  const { urlSwapper } = await chrome.storage.sync.get("urlSwapper");
  if (!urlSwapper) return;

  const {
    enabled,
    source: rawSource = "",
    dest: rawDest = "",
    originOnly = false,
    switches = {},
    menuSelectors = [],
  } = urlSwapper;

  if (!enabled) return;
  let source = rawSource.trim();
  let dest = rawDest.trim();
  if (!source || !dest) return;

  const normalize = (u) => {
    try {
      const url = new URL(u);
      return url.origin; // for originOnly compare
    } catch {
      return u.replace(/\/+$/, "");
    }
  };

  const sourceOrigin = normalize(source);
  const destOrigin = normalize(dest);

  // Determine if we are on source site
  const onSourceSite = (() => {
    if (originOnly) {
      try {
        return new URL(location.href).origin === sourceOrigin;
      } catch {
        return location.href.includes(sourceOrigin);
      }
    }
    // fallback: substring
    return location.href.includes(source);
  })();
  if (!onSourceSite) return;

  // Build match & replace functions
  const replaceVal = (val) => {
    if (!val || typeof val !== "string") return val;

    if (originOnly) {
      // Replace only when URL starts with source origin
      if (val.startsWith(sourceOrigin)) {
        return destOrigin + val.slice(sourceOrigin.length);
      }
      return val;
    }

    // Non-origin mode: prefer prefix, fallback to global replace
    if (val.startsWith(source)) return dest + val.slice(source.length);
    if (val.includes(source)) return val.split(source).join(dest);
    return val;
  };

  // Which kinds to swap
  const {
    swapImages = true,
    swapCSS = true,
    swapJS = true,
    swapMedia = false,
    swapIframes = false,
    swapInlineCSS = false,
  } = switches;

  // Attribute allowlists per tag, built from switches
  const tagMap = new Map();

  if (swapImages) {
    tagMap.set("IMG", new Set(["src", "srcset", "style"]));
    tagMap.set("SOURCE", new Set(["src", "srcset"]));
    // lazy attrs are handled globally below
  }

  if (swapCSS) {
    // only stylesheets or preload as style/script
    tagMap.set("LINK", new Set(["href", "rel", "as"]));
  }

  if (swapJS) {
    tagMap.set("SCRIPT", new Set(["src"]));
  }

  if (swapMedia) {
    tagMap.set("VIDEO", new Set(["src", "poster", "style"]));
    tagMap.set("AUDIO", new Set(["src"]));
  }

  if (swapIframes) {
    tagMap.set("IFRAME", new Set(["src"]));
  }

  // Always process STYLE tag text only if swapInlineCSS is on
  const processStyleTag = swapInlineCSS;

  // Common lazy-load attributes
  const LAZY_ATTRS = [
    "data-src",
    "data-srcset",
    "data-original",
    "data-lazy",
    "data-thumb",
  ];

  const isStylesheetLike = (el) => {
    if (el.tagName !== "LINK") return false;
    const rel = (el.getAttribute("rel") || "").toLowerCase();
    const as = (el.getAttribute("as") || "").toLowerCase();
    return (
      rel === "stylesheet" ||
      (rel === "preload" && (as === "style" || as === "script"))
    );
  };

  function shouldProcess(el) {
    const set = tagMap.get(el.tagName);
    if (!set) return false;
    if (el.tagName === "LINK") return isStylesheetLike(el);
    return true;
  }

  function rewriteAttributes(el) {
    if (!shouldProcess(el)) return;

    const attrs = tagMap.get(el.tagName);
    // Primary attrs
    attrs.forEach((a) => {
      if (!el.hasAttribute(a)) return;
      // Skip rel/as value rewrites except we read them (no replacement for rel/as)
      if (el.tagName === "LINK" && (a === "rel" || a === "as")) return;

      const v = el.getAttribute(a);
      const nv = replaceVal(v);
      if (nv !== v) el.setAttribute(a, nv);
    });

    // Lazy attrs
    LAZY_ATTRS.forEach((a) => {
      if (!el.hasAttribute(a)) return;
      const v = el.getAttribute(a);
      const nv = replaceVal(v);
      if (nv !== v) el.setAttribute(a, nv);
    });

    // srcset is a string; simple replace works
    if (el.hasAttribute("srcset")) {
      const v = el.getAttribute("srcset");
      const nv = replaceVal(v);
      if (nv !== v) el.setAttribute("srcset", nv);
    }

    // Inline style attribute
    if (swapInlineCSS && el.hasAttribute("style")) {
      const v = el.getAttribute("style");
      const nv = replaceVal(v);
      if (nv !== v) el.setAttribute("style", nv);
    }
  }

  function rewriteStyleTag(styleEl) {
    if (!processStyleTag) return;
    const v = styleEl.textContent || "";
    const nv = replaceVal(v);
    if (nv !== v) styleEl.textContent = nv;
  }

  function rewriteAnchorsInMenus(root = document) {
    if (!menuSelectors.length) return;
    // Only rewrite href on anchors matching the provided selectors
    const anchors = menuSelectors.flatMap((sel) =>
      Array.from(root.querySelectorAll(sel))
    );
    anchors.forEach((a) => {
      if (!(a instanceof HTMLAnchorElement)) return;
      if (!a.hasAttribute("href")) return;
      const v = a.getAttribute("href");
      const nv = replaceVal(v);
      if (nv !== v) a.setAttribute("href", nv);
    });
  }

  function fullScan(root = document.documentElement) {
    const walker = document.createTreeWalker(
      root,
      NodeFilter.SHOW_ELEMENT,
      null
    );
    let node;
    while ((node = walker.nextNode())) {
      rewriteAttributes(node);
      if (node.tagName === "STYLE") rewriteStyleTag(node);
    }
    rewriteAnchorsInMenus(document);
  }

  // Initial passes
  fullScan();
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => fullScan(), {
      once: true,
    });
  } else {
    fullScan();
  }

  // Observe mutations
  const mo = new MutationObserver((muts) => {
    for (const m of muts) {
      if (m.type === "attributes") {
        // If the changed attr is relevant to asset swapping, process the element
        rewriteAttributes(m.target);
      } else if (m.type === "childList") {
        m.addedNodes.forEach((n) => {
          if (n.nodeType !== 1) return;
          rewriteAttributes(n);
          if (n.tagName === "STYLE") rewriteStyleTag(n);
          // Subtree
          const sub = document.createTreeWalker(
            n,
            NodeFilter.SHOW_ELEMENT,
            null
          );
          let e;
          while ((e = sub.nextNode())) {
            rewriteAttributes(e);
            if (e.tagName === "STYLE") rewriteStyleTag(e);
          }
          // Menu links potentially added dynamically
          rewriteAnchorsInMenus(n);
        });
      }
    }
  });

  mo.observe(document.documentElement, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: [
      "src",
      "srcset",
      "href",
      "poster",
      "style",
      "data-src",
      "data-srcset",
      "data-original",
      "data-lazy",
      "data-thumb",
      "rel",
      "as",
    ],
  });
})();
