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

// Debug Helpers elements
const debugHelpersEls = {
  enabled: q("debugHelpersEnabled"),
  autoHighlight: q("autoHighlight"),
  showRESTButton: q("showRESTButton"),
  panelPosition: q("debugPanelPosition"),
  highlightParams: q("highlightParams"),
  customParams: q("customParams"),
  settings: q("debugHelpersSettings"),
};

// Admin Shortcuts elements
const adminShortcutsEls = {
  enabled: q("adminShortcutsEnabled"),
  panelPosition: q("adminPanelPosition"),
  shortcutsList: q("adminShortcutsList"),
  settings: q("adminShortcutsSettings"),
  builder: q("adminShortcutsBuilder"),
  shortcutsContainer: q("shortcutsList"),
  addBtn: q("addShortcutBtn"),
  toggleRawBtn: q("toggleRawEditor"),
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

// Debug Helpers functions
async function loadDebugHelpers() {
  const { debugHelpers = {} } = await chrome.storage.sync.get("debugHelpers");
  debugHelpersEls.enabled.checked = !!debugHelpers.enabled;
  debugHelpersEls.autoHighlight.checked = debugHelpers.autoHighlight ?? true;
  debugHelpersEls.showRESTButton.checked = debugHelpers.showRESTButton ?? true;
  debugHelpersEls.panelPosition.value =
    debugHelpers.panelPosition || "top-right";
  debugHelpersEls.highlightParams.value = (
    debugHelpers.highlightParams || [
      "elementor-preview",
      "fl_builder",
      "et_fb",
      "vc_editable",
      "gutenberg",
      "nocache",
      "debug",
      "preview",
      "preview_id",
      "preview_nonce",
      "customize_changeset_uuid",
      "customize_theme",
      "customize_messenger_channel",
      "wp_customize",
      "elementor_library",
      "elementor_action",
      "et_pb_preview",
      "vc_action",
      "wp_theme_preview",
      "wp_theme_switch",
      "wp_theme_switch_nonce",
    ]
  ).join("\n");
  debugHelpersEls.customParams.value = (debugHelpers.customParams || []).join(
    "\n"
  );

  // Show/hide settings based on enabled state
  setSettingsVisible(debugHelpersEls, debugHelpersEls.enabled.checked);
}

function getDebugHelpersPayload() {
  const highlightParams = (debugHelpersEls.highlightParams.value || "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  const customParams = (debugHelpersEls.customParams.value || "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  return {
    enabled: debugHelpersEls.enabled.checked,
    autoHighlight: debugHelpersEls.autoHighlight.checked,
    showRESTButton: debugHelpersEls.showRESTButton.checked,
    panelPosition: debugHelpersEls.panelPosition.value,
    highlightParams,
    customParams,
  };
}

// Admin Shortcuts functions
let currentShortcuts = [];

async function loadAdminShortcuts() {
  const { adminShortcuts = {} } = await chrome.storage.sync.get(
    "adminShortcuts"
  );
  adminShortcutsEls.enabled.checked = !!adminShortcuts.enabled;
  adminShortcutsEls.panelPosition.value =
    adminShortcuts.panelPosition || "top-left";

  // Load shortcuts
  currentShortcuts = adminShortcuts.shortcuts || [
    { name: "Dashboard", url: "/wp-admin/", icon: "🏠" },
    { name: "Pages", url: "/wp-admin/edit.php?post_type=page", icon: "📄" },
    { name: "Posts", url: "/wp-admin/edit.php", icon: "📝" },
    { name: "Plugins", url: "/wp-admin/plugins.php", icon: "🔌" },
    { name: "Themes", url: "/wp-admin/themes.php", icon: "🎨" },
    { name: "Users", url: "/wp-admin/users.php", icon: "👥" },
    { name: "Settings", url: "/wp-admin/options-general.php", icon: "⚙️" },
    {
      name: "Debug Log",
      url: "/wp-admin/tools.php?page=debug-log",
      icon: "🐛",
    },
  ];

  // Update visual builder
  renderShortcutsList();

  // Update raw textarea
  updateRawTextarea();

  // Show/hide settings based on enabled state
  setSettingsVisible(adminShortcutsEls, adminShortcutsEls.enabled.checked);
}

function renderShortcutsList() {
  const container = adminShortcutsEls.shortcutsContainer;
  container.innerHTML = "";

  if (currentShortcuts.length === 0) {
    const emptyState = document.createElement("div");
    emptyState.className = "empty-state";
    emptyState.textContent =
      "No shortcuts added yet. Click 'Add Shortcut' to get started.";
    container.appendChild(emptyState);
    return;
  }

  currentShortcuts.forEach((shortcut, index) => {
    const item = document.createElement("div");
    item.className = "shortcut-item";
    item.innerHTML = `
      <div class="shortcut-icon">${shortcut.icon}</div>
      <div class="shortcut-details">
        <div class="shortcut-name">${shortcut.name}</div>
        <div class="shortcut-url">${shortcut.url}</div>
      </div>
      <div class="shortcut-actions">
        <button class="edit-btn" data-index="${index}">Edit</button>
        <button class="delete-btn" data-index="${index}">Delete</button>
      </div>
    `;
    container.appendChild(item);
  });

  // Add event listeners
  container.querySelectorAll(".edit-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const index = parseInt(e.target.dataset.index);
      showShortcutForm(currentShortcuts[index], index);
    });
  });

  container.querySelectorAll(".delete-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const index = parseInt(e.target.dataset.index);
      if (confirm(`Delete "${currentShortcuts[index].name}"?`)) {
        currentShortcuts.splice(index, 1);
        renderShortcutsList();
        updateRawTextarea();
      }
    });
  });
}

function updateRawTextarea() {
  const shortcutsText = currentShortcuts
    .map((s) => `${s.name}|${s.url}|${s.icon}`)
    .join("\n");
  adminShortcutsEls.shortcutsList.value = shortcutsText;
}

function showShortcutForm(shortcut = null, editIndex = -1) {
  const isEdit = shortcut !== null;

  // Create modal
  const modal = document.createElement("div");
  modal.className = "shortcut-form";
  modal.innerHTML = `
    <div class="form-content">
      <div class="form-header">
        <h3>${isEdit ? "Edit Shortcut" : "Add Shortcut"}</h3>
        <button class="close-btn">&times;</button>
      </div>
      <div class="form-group">
        <label for="shortcutName">Name</label>
        <input type="text" id="shortcutName" value="${
          shortcut?.name || ""
        }" placeholder="e.g., Dashboard">
      </div>
      <div class="form-group">
        <label for="shortcutUrl">URL</label>
        <input type="text" id="shortcutUrl" value="${
          shortcut?.url || ""
        }" placeholder="e.g., /wp-admin/">
      </div>
      <div class="form-group">
        <label for="shortcutIcon">Icon (Emoji)</label>
        <input type="text" id="shortcutIcon" value="${
          shortcut?.icon || ""
        }" placeholder="e.g., 🏠" maxlength="2">
        <div class="icon-preview">
          <span>Preview:</span>
          <div class="preview-icon" id="iconPreview">${
            shortcut?.icon || "🔗"
          }</div>
        </div>
      </div>
      <div class="form-actions">
        <button class="cancel-btn">Cancel</button>
        <button class="save-btn">${isEdit ? "Update" : "Add"} Shortcut</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Get form elements
  const nameInput = modal.querySelector("#shortcutName");
  const urlInput = modal.querySelector("#shortcutUrl");
  const iconInput = modal.querySelector("#shortcutIcon");
  const iconPreview = modal.querySelector("#iconPreview");
  const cancelBtn = modal.querySelector(".cancel-btn");
  const saveBtn = modal.querySelector(".save-btn");
  const closeBtn = modal.querySelector(".close-btn");

  // Update icon preview
  const updateIconPreview = () => {
    iconPreview.textContent = iconInput.value || "🔗";
  };

  iconInput.addEventListener("input", updateIconPreview);

  // Close modal
  const closeModal = () => {
    document.body.removeChild(modal);
  };

  closeBtn.addEventListener("click", closeModal);
  cancelBtn.addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  // Save shortcut
  saveBtn.addEventListener("click", () => {
    const name = nameInput.value.trim();
    const url = urlInput.value.trim();
    const icon = iconInput.value.trim() || "🔗";

    if (!name || !url) {
      alert("Please fill in both name and URL");
      return;
    }

    const newShortcut = { name, url, icon };

    if (isEdit) {
      currentShortcuts[editIndex] = newShortcut;
    } else {
      currentShortcuts.push(newShortcut);
    }

    renderShortcutsList();
    updateRawTextarea();
    closeModal();
  });

  // Focus first input
  nameInput.focus();
}

function getAdminShortcutsPayload() {
  return {
    enabled: adminShortcutsEls.enabled.checked,
    panelPosition: adminShortcutsEls.panelPosition.value,
    shortcuts: currentShortcuts,
  };
}

// Save function
async function saveSettings() {
  const urlSwapper = getUrlSwapperPayload();
  const cacheBuster = getCacheBusterPayload();
  const debugHelpers = getDebugHelpersPayload();
  const adminShortcuts = getAdminShortcutsPayload();

  await chrome.storage.sync.set({
    urlSwapper,
    cacheBuster,
    debugHelpers,
    adminShortcuts,
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
  await loadDebugHelpers();
  await loadAdminShortcuts();

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

  // Debug Helpers toggle updates immediately
  debugHelpersEls.enabled.addEventListener("change", async () => {
    const { debugHelpers = {} } = await chrome.storage.sync.get("debugHelpers");
    const enabled = debugHelpersEls.enabled.checked;
    await chrome.storage.sync.set({
      debugHelpers: { ...debugHelpers, enabled },
    });
    setSettingsVisible(debugHelpersEls, enabled);
  });

  // Admin Shortcuts toggle updates immediately
  adminShortcutsEls.enabled.addEventListener("change", async () => {
    const { adminShortcuts = {} } = await chrome.storage.sync.get(
      "adminShortcuts"
    );
    const enabled = adminShortcutsEls.enabled.checked;
    await chrome.storage.sync.set({
      adminShortcuts: { ...adminShortcuts, enabled },
    });
    setSettingsVisible(adminShortcutsEls, enabled);
  });

  // Admin Shortcuts visual builder events
  adminShortcutsEls.addBtn.addEventListener("click", () => {
    showShortcutForm();
  });

  adminShortcutsEls.toggleRawBtn.addEventListener("click", () => {
    const isRawVisible =
      !adminShortcutsEls.shortcutsList.classList.contains("hidden");

    if (isRawVisible) {
      // Switch to visual builder
      adminShortcutsEls.shortcutsList.classList.add("hidden");
      adminShortcutsEls.builder.classList.remove("hidden");
      adminShortcutsEls.toggleRawBtn.textContent = "Show Raw Editor";
    } else {
      // Switch to raw editor
      adminShortcutsEls.shortcutsList.classList.remove("hidden");
      adminShortcutsEls.builder.classList.add("hidden");
      adminShortcutsEls.toggleRawBtn.textContent = "Show Visual Builder";
    }
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
