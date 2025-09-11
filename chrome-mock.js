// Chrome API mock for browser testing
if (typeof chrome === 'undefined' || !chrome.storage) {
  window.chrome = {
    storage: {
      sync: {
        get: function(keys) {
          return new Promise((resolve) => {
            const result = {};
            if (typeof keys === 'string') {
              const value = localStorage.getItem(keys);
              result[keys] = value ? JSON.parse(value) : undefined;
            } else if (Array.isArray(keys)) {
              keys.forEach(key => {
                const value = localStorage.getItem(key);
                result[key] = value ? JSON.parse(value) : undefined;
              });
            } else if (keys === null || keys === undefined) {
              // Get all items
              for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                const value = localStorage.getItem(key);
                result[key] = JSON.parse(value);
              }
            }
            resolve(result);
          });
        },
        
        set: function(items) {
          return new Promise((resolve) => {
            Object.keys(items).forEach(key => {
              localStorage.setItem(key, JSON.stringify(items[key]));
            });
            resolve();
          });
        },
        
        remove: function(keys) {
          return new Promise((resolve) => {
            if (typeof keys === 'string') {
              localStorage.removeItem(keys);
            } else if (Array.isArray(keys)) {
              keys.forEach(key => localStorage.removeItem(key));
            }
            resolve();
          });
        },
        
        clear: function() {
          return new Promise((resolve) => {
            localStorage.clear();
            resolve();
          });
        }
      }
    }
  };
}