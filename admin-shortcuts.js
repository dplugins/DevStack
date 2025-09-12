// admin-shortcuts.js — WordPress Admin Shortcuts panel

(async function main() {
  const { adminShortcuts } = await chrome.storage.sync.get("adminShortcuts");
  if (!adminShortcuts) return;

  const {
    enabled,
    panelPosition = "top-left",
    shortcuts = [
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
    ],
  } = adminShortcuts;

  if (!enabled) return;

  // Check if current site is WordPress
  function isWordPressSite() {
    const indicators = [
      document.querySelector('meta[name="generator"][content*="WordPress"]'),
      document.querySelector('link[href*="wp-content"]'),
      document.querySelector('script[src*="wp-content"]'),
      window.location.pathname.includes("/wp-"),
      window.location.pathname.includes("/wp-admin"),
      window.location.pathname.includes("/wp-json"),
      document.body && document.body.classList.toString().includes("wp-"),
      document.documentElement &&
        document.documentElement.classList.toString().includes("wp-"),
      document.querySelector("#wpadminbar"),
      document.querySelector(".wp-block"),
      document.querySelector("[data-wp-theme]"),
      typeof window.wp !== "undefined",
      typeof window.wpApiSettings !== "undefined",
    ];

    return indicators.some((indicator) => !!indicator);
  }

  // Create admin shortcuts panel
  function createAdminPanel() {
    // Remove existing panel if it exists
    const existingPanel = document.getElementById("devstack-admin-panel");
    if (existingPanel) {
      existingPanel.remove();
    }

    const panel = document.createElement("div");
    panel.id = "devstack-admin-panel";
    panel.style.cssText = `
      position: fixed;
      top: 20px;
      left: 20px;
      background: #1a1a1a;
      color: #fff;
      padding: 15px;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 13px;
      z-index: 999999;
      min-width: 200px;
      max-width: 300px;
      border: 1px solid #333;
    `;

    // Header
    const header = document.createElement("div");
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 1px solid #333;
    `;

    const title = document.createElement("h3");
    title.textContent = "⚡ Admin Shortcuts";
    title.style.cssText = "margin: 0; font-size: 14px; font-weight: 600;";

    const closeBtn = document.createElement("button");
    closeBtn.textContent = "×";
    closeBtn.style.cssText = `
      background: none;
      border: none;
      color: #fff;
      font-size: 18px;
      cursor: pointer;
      padding: 0;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
    `;
    closeBtn.onclick = () => panel.remove();

    header.appendChild(title);
    header.appendChild(closeBtn);

    // Shortcuts list
    const shortcutsDiv = document.createElement("div");
    shortcutsDiv.style.cssText =
      "display: flex; flex-direction: column; gap: 4px;";

    shortcuts.forEach((shortcut, index) => {
      const shortcutButton = document.createElement("button");
      shortcutButton.innerHTML = `${shortcut.icon} ${shortcut.name}`;
      shortcutButton.style.cssText = `
        background: #2c3e50;
        border: none;
        color: white;
        padding: 8px 12px;
        border-radius: 4px;
        font-size: 12px;
        cursor: pointer;
        font-weight: 500;
        text-align: left;
        display: flex;
        align-items: center;
        gap: 8px;
        transition: all 0.2s;
        width: 100%;
      `;

      shortcutButton.addEventListener("mouseenter", () => {
        shortcutButton.style.background = "#34495e";
        shortcutButton.style.transform = "translateX(4px)";
      });

      shortcutButton.addEventListener("mouseleave", () => {
        shortcutButton.style.background = "#2c3e50";
        shortcutButton.style.transform = "translateX(0)";
      });

      shortcutButton.onclick = () => {
        const adminUrl = new URL(shortcut.url, window.location.origin);
        window.open(adminUrl.toString(), "_blank");
      };

      shortcutsDiv.appendChild(shortcutButton);
    });

    // Assemble panel
    panel.appendChild(header);
    panel.appendChild(shortcutsDiv);

    document.body.appendChild(panel);

    // Click outside to close functionality
    const handleClickOutside = (event) => {
      if (
        panel &&
        panel.parentNode &&
        !panel.contains(event.target) &&
        !document
          .getElementById("devstack-admin-trigger")
          .contains(event.target)
      ) {
        panel.remove();
        document.removeEventListener("click", handleClickOutside);
      }
    };

    // Add click outside listener after a small delay to prevent immediate closing
    setTimeout(() => {
      document.addEventListener("click", handleClickOutside);
    }, 100);

    // Auto-hide after 15 seconds if no interaction
    let hideTimeout = setTimeout(() => {
      if (panel.parentNode) {
        panel.style.opacity = "0.7";
      }
    }, 15000);

    panel.addEventListener("mouseenter", () => {
      clearTimeout(hideTimeout);
      panel.style.opacity = "1";
    });

    panel.addEventListener("mouseleave", () => {
      hideTimeout = setTimeout(() => {
        if (panel.parentNode) {
          panel.style.opacity = "0.7";
        }
      }, 5000);
    });
  }

  // Create floating trigger button
  function createTriggerButton() {
    // Remove existing button if it exists
    const existingButton = document.getElementById("devstack-admin-trigger");
    if (existingButton) {
      existingButton.remove();
    }

    // Get position styles based on panelPosition setting
    const getPositionStyles = (position) => {
      const baseStyles = `
        position: fixed;
        width: 50px;
        height: 50px;
        border-radius: 50%;
        background: #e67e22;
        color: white;
        border: none;
        font-size: 20px;
        cursor: pointer;
        z-index: 999998;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
      `;

      switch (position) {
        case "top-left":
          return baseStyles + "top: 20px; left: 20px;";
        case "top-right":
          return baseStyles + "top: 20px; right: 20px;";
        case "bottom-left":
          return baseStyles + "bottom: 20px; left: 20px;";
        case "bottom-right":
          return baseStyles + "bottom: 20px; right: 20px;";
        default:
          return baseStyles + "top: 20px; left: 20px;";
      }
    };

    const triggerButton = document.createElement("button");
    triggerButton.id = "devstack-admin-trigger";
    triggerButton.innerHTML = "⚡";
    triggerButton.title = "DevStack Admin Shortcuts (Ctrl+Shift+A)";
    triggerButton.style.cssText = getPositionStyles(panelPosition);

    triggerButton.addEventListener("mouseenter", () => {
      triggerButton.style.transform = "scale(1.1)";
      triggerButton.style.background = "#d35400";
    });

    triggerButton.addEventListener("mouseleave", () => {
      triggerButton.style.transform = "scale(1)";
      triggerButton.style.background = "#e67e22";
    });

    triggerButton.onclick = () => {
      const existingPanel = document.getElementById("devstack-admin-panel");
      if (existingPanel) {
        existingPanel.remove();
      } else {
        createAdminPanel();
      }
    };

    document.body.appendChild(triggerButton);
  }

  // Keyboard shortcut handler
  function handleKeyboardShortcut(e) {
    // Ctrl+Shift+A to toggle admin panel
    if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "a") {
      e.preventDefault();
      e.stopPropagation();
      const existingPanel = document.getElementById("devstack-admin-panel");
      if (existingPanel) {
        existingPanel.remove();
      } else {
        createAdminPanel();
      }
    }
  }

  // Initialize
  function init() {
    console.log("⚡ DevStack Admin Shortcuts initialized");

    // Only show on WordPress sites
    if (!isWordPressSite()) {
      console.log("⚡ Not a WordPress site, admin shortcuts disabled");
      return;
    }

    // Create floating trigger button
    createTriggerButton();

    // Add keyboard shortcut
    document.addEventListener("keydown", handleKeyboardShortcut);

    // Listen for storage changes
    chrome.storage.onChanged.addListener((changes, namespace) => {
      if (namespace === "sync" && changes.adminShortcuts) {
        const newSettings = changes.adminShortcuts.newValue;
        if (newSettings && newSettings.enabled) {
          // Reload to apply new settings
          window.location.reload();
        }
      }
    });
  }

  // Only run on page load, not on every navigation
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})().catch((error) => {
  console.error("Admin Shortcuts: Error in main function:", error);
});
