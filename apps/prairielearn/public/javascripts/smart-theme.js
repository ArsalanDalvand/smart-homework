(function () {
  var STORAGE_KEY = 'sh-theme';
  var root = document.documentElement;
  if (!root || root.getAttribute('data-surface') !== 'student') return;

  var mediaQuery =
    typeof window.matchMedia === 'function'
      ? window.matchMedia('(prefers-color-scheme: dark)')
      : null;

  function readStoredTheme() {
    try {
      var val = window.localStorage.getItem(STORAGE_KEY);
      return val === 'light' || val === 'dark' ? val : null;
    } catch (_err) {
      return null;
    }
  }

  function resolveEffectiveTheme() {
    var stored = readStoredTheme();
    if (stored) return stored;
    return mediaQuery && mediaQuery.matches ? 'dark' : 'light';
  }

  function syncToggleButtons(theme) {
    var isDark = theme === 'dark';
    var nextLabel = isDark ? 'تغییر به حالت روشن' : 'تغییر به حالت تاریک';
    var buttons = document.querySelectorAll('[data-sh-theme-toggle]');
    buttons.forEach(function (btn) {
      btn.setAttribute('aria-pressed', isDark ? 'true' : 'false');
      btn.setAttribute('aria-label', nextLabel);
      btn.setAttribute('title', nextLabel);
    });
  }

  function applyTheme(theme) {
    root.setAttribute('data-bs-theme', theme);
    syncToggleButtons(theme);
  }

  function onToggleClick() {
    var current = root.getAttribute('data-bs-theme') === 'dark' ? 'dark' : 'light';
    var next = current === 'dark' ? 'light' : 'dark';
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch (_err) {
      // Ignore storage errors in restricted contexts
    }
    applyTheme(next);
  }

  function init() {
    applyTheme(resolveEffectiveTheme());
    document.querySelectorAll('[data-sh-theme-toggle]').forEach(function (btn) {
      btn.addEventListener('click', onToggleClick);
    });

    if (mediaQuery) {
      var onMediaChange = function (event) {
        if (!readStoredTheme()) {
          applyTheme(event.matches ? 'dark' : 'light');
        }
      };
      if (typeof mediaQuery.addEventListener === 'function') {
        mediaQuery.addEventListener('change', onMediaChange);
      } else if (typeof mediaQuery.addListener === 'function') {
        mediaQuery.addListener(onMediaChange);
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
