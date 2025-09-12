// debug-helpers.js — WordPress and generic debugging tools

(async function main() {
  const { debugHelpers } = await chrome.storage.sync.get("debugHelpers");
  if (!debugHelpers) return;

  const {
    enabled,
    autoHighlight = true,
    showRESTButton = true,
    panelPosition = "top-right",
    customParams = [],
    highlightParams = [
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
    ],
  } = debugHelpers;

  if (!enabled) return;

  // Create debug panel
  function createDebugPanel() {
    // Remove existing panel if it exists
    const existingPanel = document.getElementById("devstack-debug-panel");
    if (existingPanel) {
      existingPanel.remove();
    }

    const panel = document.createElement("div");
    panel.id = "devstack-debug-panel";
    panel.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #1a1a1a;
      color: #fff;
      padding: 15px;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 13px;
      z-index: 999999;
      min-width: 280px;
      max-width: 400px;
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
    title.textContent = "🔧 Debug Helpers";
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

    // Quick actions
    const actionsDiv = document.createElement("div");
    actionsDiv.style.cssText = "margin-bottom: 12px;";

    const actionsTitle = document.createElement("div");
    actionsTitle.textContent = "Quick Actions:";
    actionsTitle.style.cssText =
      "font-weight: 600; margin-bottom: 8px; color: #ccc;";

    const buttonContainer = document.createElement("div");
    buttonContainer.style.cssText = "display: flex; flex-wrap: wrap; gap: 6px;";

    // Quick debug buttons - only essential ones
    const debugButtons = [
      { text: "No Cache", param: "nocache=1", color: "#ff6b6b" },
      { text: "Debug", param: "debug=1", color: "#4ecdc4" },
    ];

    // Add custom buttons from settings
    if (customParams && customParams.length > 0) {
      customParams.forEach((param, index) => {
        const [key, value] = param.split("=");
        const buttonText = key || `Custom ${index + 1}`;
        debugButtons.push({
          text: buttonText,
          param: param,
          color: `hsl(${(index * 137.5) % 360}, 70%, 50%)`, // Generate different colors
        });
      });
    }

    debugButtons.forEach((btn) => {
      const button = document.createElement("button");
      button.textContent = btn.text;
      button.style.cssText = `
        background: ${btn.color};
        border: none;
        color: white;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 11px;
        cursor: pointer;
        font-weight: 500;
        margin: 2px;
      `;
      button.onclick = () => addDebugParam(btn.param);
      buttonContainer.appendChild(button);
    });

    actionsDiv.appendChild(actionsTitle);
    actionsDiv.appendChild(buttonContainer);

    // Current URL info
    const urlDiv = document.createElement("div");
    urlDiv.style.cssText = "margin-bottom: 12px;";

    const urlTitle = document.createElement("div");
    urlTitle.textContent = "Current URL:";
    urlTitle.style.cssText =
      "font-weight: 600; margin-bottom: 4px; color: #ccc;";

    const urlText = document.createElement("div");
    urlText.textContent = window.location.href;
    urlText.style.cssText = `
      background: #2a2a2a;
      padding: 6px 8px;
      border-radius: 4px;
      font-family: monospace;
      font-size: 11px;
      word-break: break-all;
      color: #a8a8a8;
    `;

    urlDiv.appendChild(urlTitle);
    urlDiv.appendChild(urlText);

    // REST API section
    const restDiv = document.createElement("div");
    restDiv.style.cssText = "margin-bottom: 12px;";

    const restTitle = document.createElement("div");
    restTitle.textContent = "WordPress Tools:";
    restTitle.style.cssText =
      "font-weight: 600; margin-bottom: 8px; color: #ccc;";

    const restButtonContainer = document.createElement("div");
    restButtonContainer.style.cssText =
      "display: flex; flex-wrap: wrap; gap: 6px;";

    // Always show REST API button if WordPress is detected
    if (isWordPressSite()) {
      const restButton = document.createElement("button");
      restButton.textContent = "🔗 REST API";
      restButton.style.cssText = `
        background: #6c5ce7;
        border: none;
        color: white;
        padding: 6px 10px;
        border-radius: 4px;
        font-size: 11px;
        cursor: pointer;
        font-weight: 500;
      `;
      restButton.onclick = () => {
        const restUrl = new URL("/wp-json/", window.location.origin);
        window.open(restUrl.toString(), "_blank");
      };
      restButtonContainer.appendChild(restButton);

      // Add admin button
      const adminButton = document.createElement("button");
      adminButton.textContent = "⚙️ Admin";
      adminButton.style.cssText = `
        background: #e67e22;
        border: none;
        color: white;
        padding: 6px 10px;
        border-radius: 4px;
        font-size: 11px;
        cursor: pointer;
        font-weight: 500;
      `;
      adminButton.onclick = () => {
        const adminUrl = new URL("/wp-admin/", window.location.origin);
        window.open(adminUrl.toString(), "_blank");
      };
      restButtonContainer.appendChild(adminButton);
    } else {
      const noWpText = document.createElement("div");
      noWpText.textContent = "WordPress not detected";
      noWpText.style.cssText =
        "color: #666; font-style: italic; font-size: 11px;";
      restButtonContainer.appendChild(noWpText);
    }

    restDiv.appendChild(restTitle);
    restDiv.appendChild(restButtonContainer);
    panel.appendChild(restDiv);

    // Debug params detection
    const paramsDiv = document.createElement("div");
    paramsDiv.style.cssText = "margin-bottom: 12px;";

    const paramsTitle = document.createElement("div");
    paramsTitle.textContent = "Debug Parameters:";
    paramsTitle.style.cssText =
      "font-weight: 600; margin-bottom: 8px; color: #ccc;";

    const paramsList = document.createElement("div");
    paramsList.id = "debug-params-list";
    paramsList.style.cssText = "font-size: 11px;";

    updateDebugParamsList(paramsList);

    paramsDiv.appendChild(paramsTitle);
    paramsDiv.appendChild(paramsList);

    // Custom params input
    const customDiv = document.createElement("div");
    customDiv.style.cssText = "margin-bottom: 12px;";

    const customTitle = document.createElement("div");
    customTitle.textContent = "Add Custom Param:";
    customTitle.style.cssText =
      "font-weight: 600; margin-bottom: 4px; color: #ccc;";

    const customInput = document.createElement("input");
    customInput.type = "text";
    customInput.placeholder = "e.g., custom_debug=1";
    customInput.style.cssText = `
      width: 100%;
      padding: 6px 8px;
      border: 1px solid #444;
      border-radius: 4px;
      background: #2a2a2a;
      color: #fff;
      font-size: 11px;
      margin-bottom: 6px;
    `;

    const customButton = document.createElement("button");
    customButton.textContent = "Add";
    customButton.style.cssText = `
      background: #00b894;
      border: none;
      color: white;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 11px;
      cursor: pointer;
    `;
    customButton.onclick = () => {
      const param = customInput.value.trim();
      if (param) {
        addDebugParam(param);
        customInput.value = "";
      }
    };

    customDiv.appendChild(customTitle);
    customDiv.appendChild(customInput);
    customDiv.appendChild(customButton);

    // Assemble panel
    panel.appendChild(header);
    panel.appendChild(actionsDiv);
    panel.appendChild(urlDiv);
    panel.appendChild(restDiv);
    panel.appendChild(paramsDiv);
    panel.appendChild(customDiv);

    document.body.appendChild(panel);

    // Click outside to close functionality
    const handleClickOutside = (event) => {
      if (
        panel &&
        panel.parentNode &&
        !panel.contains(event.target) &&
        !document
          .getElementById("devstack-debug-trigger")
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

    // Auto-hide after 10 seconds if no interaction
    let hideTimeout = setTimeout(() => {
      if (panel.parentNode) {
        panel.style.opacity = "0.7";
      }
    }, 10000);

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

  // Check if current site is WordPress
  function isWordPressSite() {
    // Check multiple indicators
    const indicators = [
      // Meta generator tag
      document.querySelector('meta[name="generator"][content*="WordPress"]'),
      // Links to wp-content
      document.querySelector('link[href*="wp-content"]'),
      document.querySelector('script[src*="wp-content"]'),
      // URL patterns
      window.location.pathname.includes("/wp-"),
      window.location.pathname.includes("/wp-admin"),
      window.location.pathname.includes("/wp-json"),
      // Body classes
      document.body && document.body.classList.toString().includes("wp-"),
      document.documentElement &&
        document.documentElement.classList.toString().includes("wp-"),
      // WordPress-specific elements
      document.querySelector("#wpadminbar"),
      document.querySelector(".wp-block"),
      document.querySelector("[data-wp-theme]"),
      // Check for WordPress globals
      typeof window.wp !== "undefined",
      typeof window.wpApiSettings !== "undefined",
    ];

    return indicators.some((indicator) => !!indicator);
  }

  // Add debug parameter to current URL
  function addDebugParam(param) {
    const url = new URL(window.location.href);
    const [key, value] = param.split("=");
    url.searchParams.set(key, value || "1");
    window.location.href = url.toString();
  }

  // Update debug parameters list
  function updateDebugParamsList(container) {
    const url = new URL(window.location.href);
    const params = Array.from(url.searchParams.entries());

    if (params.length === 0) {
      container.innerHTML =
        '<div style="color: #666; font-style: italic;">No debug parameters found</div>';
      return;
    }

    container.innerHTML = "";
    params.forEach(([key, value]) => {
      const isDebugParam = highlightParams.some((debugParam) =>
        key.toLowerCase().includes(debugParam.toLowerCase())
      );

      const paramDiv = document.createElement("div");
      paramDiv.style.cssText = `
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 4px 6px;
        margin: 2px 0;
        border-radius: 3px;
        background: ${isDebugParam ? "#2d4a3e" : "#2a2a2a"};
        border-left: 3px solid ${isDebugParam ? "#00b894" : "#444"};
      `;

      const paramText = document.createElement("span");
      paramText.textContent = `${key}=${value}`;
      paramText.style.cssText = "font-family: monospace; font-size: 10px;";

      const removeBtn = document.createElement("button");
      removeBtn.textContent = "×";
      removeBtn.style.cssText = `
        background: #e74c3c;
        border: none;
        color: white;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        font-size: 10px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
      `;
      removeBtn.onclick = () => removeDebugParam(key);

      paramDiv.appendChild(paramText);
      paramDiv.appendChild(removeBtn);
      container.appendChild(paramDiv);
    });
  }

  // Remove debug parameter
  function removeDebugParam(key) {
    const url = new URL(window.location.href);
    url.searchParams.delete(key);
    window.location.href = url.toString();
  }

  // Highlight debug parameters in URL bar
  function highlightDebugParams() {
    if (!autoHighlight) return;

    // This would require access to browser UI which content scripts can't modify
    // Instead, we'll show a notification
    const notification = document.createElement("div");
    notification.style.cssText = `
      position: fixed;
      top: 10px;
      left: 50%;
      transform: translateX(-50%);
      background: #f39c12;
      color: #000;
      padding: 8px 16px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 600;
      z-index: 999998;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    `;

    const url = new URL(window.location.href);
    const debugParams = Array.from(url.searchParams.entries()).filter(([key]) =>
      highlightParams.some((debugParam) =>
        key.toLowerCase().includes(debugParam.toLowerCase())
      )
    );

    if (debugParams.length > 0) {
      notification.textContent = `🔍 Debug params detected: ${debugParams
        .map(([k]) => k)
        .join(", ")}`;
      document.body.appendChild(notification);

      setTimeout(() => {
        if (notification.parentNode) {
          notification.remove();
        }
      }, 3000);
    }
  }

  // Keyboard shortcut handler
  function handleKeyboardShortcut(e) {
    // Ctrl+Shift+D to toggle debug panel
    if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "d") {
      e.preventDefault();
      e.stopPropagation();
      const existingPanel = document.getElementById("devstack-debug-panel");
      if (existingPanel) {
        existingPanel.remove();
      } else {
        createDebugPanel();
      }
    }
  }

  // Create floating trigger button
  function createTriggerButton() {
    // Remove existing button if it exists
    const existingButton = document.getElementById("devstack-debug-trigger");
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
        background: #0d6cfc;
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
          return baseStyles + "top: 20px; right: 20px;";
      }
    };

    const triggerButton = document.createElement("button");
    triggerButton.id = "devstack-debug-trigger";
    triggerButton.innerHTML = "🔧";
    triggerButton.title = "DevStack Debug Panel (Ctrl+Shift+D)";
    triggerButton.style.cssText = getPositionStyles(panelPosition);

    triggerButton.addEventListener("mouseenter", () => {
      triggerButton.style.transform = "scale(1.1)";
      triggerButton.style.background = "#0b5ed7";
    });

    triggerButton.addEventListener("mouseleave", () => {
      triggerButton.style.transform = "scale(1)";
      triggerButton.style.background = "#0d6cfc";
    });

    triggerButton.onclick = () => {
      const existingPanel = document.getElementById("devstack-debug-panel");
      if (existingPanel) {
        existingPanel.remove();
      } else {
        createDebugPanel();
      }
    };

    document.body.appendChild(triggerButton);
  }

  // Initialize
  function init() {
    console.log("🔧 DevStack Debug Helpers initialized");

    // Show debug params notification
    highlightDebugParams();

    // Create floating trigger button
    createTriggerButton();

    // Add keyboard shortcut
    document.addEventListener("keydown", handleKeyboardShortcut);

    // Listen for storage changes
    chrome.storage.onChanged.addListener((changes, namespace) => {
      if (namespace === "sync" && changes.debugHelpers) {
        const newSettings = changes.debugHelpers.newValue;
        if (newSettings) {
          // Update settings without reloading
          if (newSettings.enabled) {
            // Recreate trigger button with new position if needed
            createTriggerButton();
          } else {
            // Remove trigger button and panel if disabled
            const existingButton = document.getElementById(
              "devstack-debug-trigger"
            );
            const existingPanel = document.getElementById(
              "devstack-debug-panel"
            );
            if (existingButton) existingButton.remove();
            if (existingPanel) existingPanel.remove();
          }
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
  console.error("Debug Helpers: Error in main function:", error);
});
