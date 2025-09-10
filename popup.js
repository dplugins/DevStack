const q = (id) => document.getElementById(id);
const els = {
  enabled: q("enabled"),
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
  status: q("status"),
  save: q("save"),
  settings: q("settings"),
};

function setSettingsVisible(on) {
  els.settings.classList.toggle("hidden", !on);
}

async function load() {
  const { urlSwapper = {} } = await chrome.storage.sync.get("urlSwapper");
  els.enabled.checked = !!urlSwapper.enabled;
  setSettingsVisible(els.enabled.checked);
  els.source.value = urlSwapper.source || "";
  els.dest.value = urlSwapper.dest || "";
  els.originOnly.checked = !!urlSwapper.originOnly;

  // defaults: images/css/js on; others off
  const s = urlSwapper.switches || {};
  els.swapImages.checked = s.swapImages ?? true;
  els.swapCSS.checked = s.swapCSS ?? true;
  els.swapJS.checked = s.swapJS ?? true;
  els.swapMedia.checked = s.swapMedia ?? false;
  els.swapIframes.checked = s.swapIframes ?? false;
  els.swapInlineCSS.checked = s.swapInlineCSS ?? false;

  els.menuSelectors.value = (urlSwapper.menuSelectors || []).join(", ");
}
load();

function getPayload() {
  const switches = {
    swapImages: els.swapImages.checked,
    swapCSS: els.swapCSS.checked,
    swapJS: els.swapJS.checked,
    swapMedia: els.swapMedia.checked,
    swapIframes: els.swapIframes.checked,
    swapInlineCSS: els.swapInlineCSS.checked,
  };
  const menuSelectors = (els.menuSelectors.value || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  return {
    enabled: els.enabled.checked,
    source: (els.source.value || "").trim(),
    dest: (els.dest.value || "").trim(),
    originOnly: els.originOnly.checked,
    switches,
    menuSelectors,
  };
}

els.save.addEventListener("click", async () => {
  await chrome.storage.sync.set({ urlSwapper: getPayload() });
  els.status.textContent = "Saved!";
  els.status.className = "small ok";
  setTimeout(() => (els.status.textContent = ""), 1500);
});

// toggle updates immediately
els.enabled.addEventListener("change", async () => {
  const { urlSwapper = {} } = await chrome.storage.sync.get("urlSwapper");
  const enabled = els.enabled.checked;
  await chrome.storage.sync.set({
    urlSwapper: { ...urlSwapper, enabled: els.enabled.checked },
  });
  setSettingsVisible(enabled);
});
