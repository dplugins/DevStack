const q = (id) => document.getElementById(id);

// URL Swapper elements
const urlSwapperEls = {
  enabled: q("urlSwapperEnabled"),
  source: q("source"),
  dest: q("dest"),
  originOnly: q("originOnly"),
  swapImages: q("swapImages"),
  swapCSS: q("swapCSS"),
  swapJS: q("swapJS"),
  swapMedia: q("swapMedia"),
  swapIframes: q("swapIframes"),
  swapInlineCSS: q("swapInlineCSS"),
  menuSelectors: q("menuSelectors"),
  settings: q("urlSwapperSettings"),
};

// Cache Buster elements
const cacheBusterEls = {
  enabled: q("cacheBusterEnabled"),
  addTimestampCSS: q("addTimestampCSS"),
  addTimestampJS: q("addTimestampJS"),
  disableCache: q("disableCache"),
  cssFileNames: q("cssFileNames"),
  jsFileNames: q("jsFileNames"),
  cssFileFilter: q("cssFileFilter"),
  jsFileFilter: q("jsFileFilter"),
  targetDomains: q("targetDomains"),
  settings: q("cacheBusterSettings"),
};

// Common elements
const els = {
  status: q("status"),
  save: q("save"),
};

// Tab functionality
function initTabs() {
  const tabButtons = document.querySelectorAll(".tab-button");
  const tabContents = document.querySelectorAll(".tab-content");

  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const targetTab = button.getAttribute("data-tab");

      // Remove active class from all buttons and contents
      tabButtons.forEach((btn) => btn.classList.remove("active"));
      tabContents.forEach((content) => content.classList.remove("active"));

      // Add active class to clicked button and corresponding content
      button.classList.add("active");
      document.getElementById(`${targetTab}-tab`).classList.add("active");
    });
  });
}

function setSettingsVisible(els, on) {
  els.settings.classList.toggle("hidden", !on);
}

// URL Swapper functions
async function loadUrlSwapper() {
  const { urlSwapper = {} } = await chrome.storage.sync.get("urlSwapper");
  urlSwapperEls.enabled.checked = !!urlSwapper.enabled;
  urlSwapperEls.source.value = urlSwapper.source || "";
  urlSwapperEls.dest.value = urlSwapper.dest || "";
  urlSwapperEls.originOnly.checked = !!urlSwapper.originOnly;

  // defaults: images/css/js on; others off
  const s = urlSwapper.switches || {};
  urlSwapperEls.swapImages.checked = s.swapImages ?? true;
  urlSwapperEls.swapCSS.checked = s.swapCSS ?? true;
  urlSwapperEls.swapJS.checked = s.swapJS ?? true;
  urlSwapperEls.swapMedia.checked = s.swapMedia ?? false;
  urlSwapperEls.swapIframes.checked = s.swapIframes ?? false;
  urlSwapperEls.swapInlineCSS.checked = s.swapInlineCSS ?? false;

  urlSwapperEls.menuSelectors.value = (urlSwapper.menuSelectors || []).join(
    ", "
  );

  // Show/hide settings based on enabled state
  setSettingsVisible(urlSwapperEls, urlSwapperEls.enabled.checked);
}

function getUrlSwapperPayload() {
  const switches = {
    swapImages: urlSwapperEls.swapImages.checked,
    swapCSS: urlSwapperEls.swapCSS.checked,
    swapJS: urlSwapperEls.swapJS.checked,
    swapMedia: urlSwapperEls.swapMedia.checked,
    swapIframes: urlSwapperEls.swapIframes.checked,
    swapInlineCSS: urlSwapperEls.swapInlineCSS.checked,
  };
  const menuSelectors = (urlSwapperEls.menuSelectors.value || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  return {
    enabled: urlSwapperEls.enabled.checked,
    source: (urlSwapperEls.source.value || "").trim(),
    dest: (urlSwapperEls.dest.value || "").trim(),
    originOnly: urlSwapperEls.originOnly.checked,
    switches,
    menuSelectors,
  };
}

// Cache Buster functions
async function loadCacheBuster() {
  const { cacheBuster = {} } = await chrome.storage.sync.get("cacheBuster");
  cacheBusterEls.enabled.checked = !!cacheBuster.enabled;
  cacheBusterEls.addTimestampCSS.checked = !!cacheBuster.addTimestampCSS;
  cacheBusterEls.addTimestampJS.checked = !!cacheBuster.addTimestampJS;
  cacheBusterEls.disableCache.checked = !!cacheBuster.disableCache;
  cacheBusterEls.cssFileNames.value = (cacheBuster.cssFileNames || []).join(
    "\n"
  );
  cacheBusterEls.jsFileNames.value = (cacheBuster.jsFileNames || []).join("\n");
  cacheBusterEls.targetDomains.value = (cacheBuster.targetDomains || []).join(
    "\n"
  );

  // Show/hide settings based on enabled state
  setSettingsVisible(cacheBusterEls, cacheBusterEls.enabled.checked);

  // Show/hide file filters based on individual toggles
  updateFileFiltersVisibility();
}

function updateFileFiltersVisibility() {
  // Show/hide CSS file filter based on CSS toggle
  cacheBusterEls.cssFileFilter.classList.toggle(
    "hidden",
    !cacheBusterEls.addTimestampCSS.checked
  );

  // Show/hide JS file filter based on JS toggle
  cacheBusterEls.jsFileFilter.classList.toggle(
    "hidden",
    !cacheBusterEls.addTimestampJS.checked
  );
}

function getCacheBusterPayload() {
  const targetDomains = (cacheBusterEls.targetDomains.value || "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  const cssFileNames = (cacheBusterEls.cssFileNames.value || "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  const jsFileNames = (cacheBusterEls.jsFileNames.value || "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  return {
    enabled: cacheBusterEls.enabled.checked,
    addTimestampCSS: cacheBusterEls.addTimestampCSS.checked,
    addTimestampJS: cacheBusterEls.addTimestampJS.checked,
    disableCache: cacheBusterEls.disableCache.checked,
    cssFileNames,
    jsFileNames,
    targetDomains,
  };
}

// Save function
async function saveSettings() {
  const urlSwapper = getUrlSwapperPayload();
  const cacheBuster = getCacheBusterPayload();

  await chrome.storage.sync.set({
    urlSwapper,
    cacheBuster,
  });

  els.status.textContent = "Saved!";
  els.status.className = "small ok";
  setTimeout(() => (els.status.textContent = ""), 1500);
}

// Initialize everything
async function init() {
  initTabs();
  await loadUrlSwapper();
  await loadCacheBuster();

  // Event listeners
  els.save.addEventListener("click", saveSettings);

  // URL Swapper toggle updates immediately
  urlSwapperEls.enabled.addEventListener("change", async () => {
    const { urlSwapper = {} } = await chrome.storage.sync.get("urlSwapper");
    const enabled = urlSwapperEls.enabled.checked;
    await chrome.storage.sync.set({
      urlSwapper: { ...urlSwapper, enabled },
    });
    setSettingsVisible(urlSwapperEls, enabled);
  });

  // Cache Buster toggle updates immediately
  cacheBusterEls.enabled.addEventListener("change", async () => {
    const { cacheBuster = {} } = await chrome.storage.sync.get("cacheBuster");
    const enabled = cacheBusterEls.enabled.checked;
    await chrome.storage.sync.set({
      cacheBuster: { ...cacheBuster, enabled },
    });
    setSettingsVisible(cacheBusterEls, enabled);
  });

  // CSS toggle updates file filter visibility
  cacheBusterEls.addTimestampCSS.addEventListener(
    "change",
    updateFileFiltersVisibility
  );

  // JS toggle updates file filter visibility
  cacheBusterEls.addTimestampJS.addEventListener(
    "change",
    updateFileFiltersVisibility
  );
}

init();
