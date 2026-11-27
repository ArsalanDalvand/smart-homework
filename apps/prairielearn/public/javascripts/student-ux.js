(function () {
  function initAssessmentFilters() {
    var filterButtons = document.querySelectorAll('[data-sh-assessment-filter]');
    if (!filterButtons.length) return;

    var rows = document.querySelectorAll('tr[data-assessment-state]');
    var groups = document.querySelectorAll('tbody[data-assessment-group]');
    var emptyNotice = document.getElementById('sh-assessments-filter-empty');

    function applyFilter(filterKey) {
      filterButtons.forEach(function (btn) {
        var active = btn.getAttribute('data-sh-assessment-filter') === filterKey;
        btn.classList.toggle('is-active', active);
        btn.setAttribute('aria-pressed', active ? 'true' : 'false');
      });

      var visibleCount = 0;
      rows.forEach(function (row) {
        var state = row.getAttribute('data-assessment-state') || 'active';
        var show =
          filterKey === 'all' ||
          (filterKey === 'active' && state === 'active') ||
          (filterKey === 'completed' && state === 'completed') ||
          (filterKey === 'upcoming' && state === 'upcoming');
        row.classList.toggle('d-none', !show);
        if (show) visibleCount += 1;
      });

      groups.forEach(function (tbody) {
        var groupRows = tbody.querySelectorAll('tr[data-assessment-state]');
        var anyVisible = Array.prototype.some.call(groupRows, function (r) {
          return !r.classList.contains('d-none');
        });
        tbody.classList.toggle('d-none', !anyVisible);
      });

      if (emptyNotice) {
        emptyNotice.classList.toggle('d-none', visibleCount > 0);
      }
    }

    filterButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        applyFilter(btn.getAttribute('data-sh-assessment-filter') || 'all');
      });
    });
  }

  function initGradebookTabs() {
    var tabList = document.getElementById('sh-gradebook-tabs');
    if (!tabList || !window.bootstrap || !window.bootstrap.Tab) return;

    function showTabFromHash() {
      var hash = window.location.hash;
      if (!hash) return;
      var targetBtn = tabList.querySelector('[data-bs-target="' + hash + '"]');
      if (targetBtn) {
        window.bootstrap.Tab.getOrCreateInstance(targetBtn).show();
      }
    }

    showTabFromHash();
    window.addEventListener('hashchange', showTabFromHash);

    tabList.querySelectorAll('[data-bs-toggle="tab"]').forEach(function (btn) {
      btn.addEventListener('shown.bs.tab', function (ev) {
        var target = ev.target && ev.target.getAttribute('data-bs-target');
        if (target && window.history && window.history.replaceState) {
          window.history.replaceState(null, '', target);
        }
      });
    });
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (resolve, reject) {
      try {
        var area = document.createElement('textarea');
        area.value = text;
        area.style.position = 'fixed';
        area.style.opacity = '0';
        document.body.appendChild(area);
        area.select();
        document.execCommand('copy');
        document.body.removeChild(area);
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  }

  function initCodeCopyButtons() {
    var blocks = document.querySelectorAll('.question-body pre');
    if (!blocks.length) return;

    blocks.forEach(function (pre) {
      if (
        pre.closest(
          '.ace_editor, .sh-pre-wrap, .pl-order-blocks-container, .pl-order-blocks-answer-container, .pl-order-block',
        )
      ) {
        return;
      }
      var text = (pre.textContent || '').trim();
      if (!text) return;

      var inTableCell = Boolean(pre.closest('td, th'));
      var wrapper = document.createElement('div');
      wrapper.className = inTableCell ? 'sh-pre-wrap sh-pre-inline' : 'sh-pre-wrap';
      pre.parentNode.insertBefore(wrapper, pre);
      wrapper.appendChild(pre);

      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = inTableCell ? 'sh-copy-btn sh-copy-btn-inline' : 'sh-copy-btn';
      btn.setAttribute('aria-label', 'کپی محتوای بلوک');
      btn.setAttribute('title', 'کپی');

      function setButtonState(copied) {
        if (inTableCell) {
          btn.innerHTML = copied
            ? '<i class="bi bi-check2" aria-hidden="true"></i>'
            : '<i class="bi bi-clipboard" aria-hidden="true"></i>';
        } else {
          btn.innerHTML = copied
            ? '<i class="bi bi-check2" aria-hidden="true"></i> <span>کپی شد</span>'
            : '<i class="bi bi-clipboard" aria-hidden="true"></i> <span>کپی</span>';
        }
      }

      setButtonState(false);

      btn.addEventListener('click', function () {
        copyText(pre.textContent || '').then(function () {
          setButtonState(true);
          btn.classList.add('is-copied');
          setTimeout(function () {
            setButtonState(false);
            btn.classList.remove('is-copied');
          }, 1600);
        });
      });

      wrapper.appendChild(btn);
    });
  }

  function initQuestionKeyboardShortcuts() {
    var nextEl = document.getElementById('question-nav-next');
    var prevEl = document.getElementById('question-nav-prev');
    if (!nextEl && !prevEl) return;

    document.addEventListener('keydown', function (ev) {
      if (!ev.altKey || ev.ctrlKey || ev.metaKey || ev.shiftKey) return;
      var target = ev.target;
      if (target && target.closest) {
        if (target.closest('input, textarea, select, [contenteditable], .ace_editor')) {
          return;
        }
      }
      if (ev.key === 'ArrowLeft' && nextEl && nextEl.tagName === 'A' && nextEl.href) {
        ev.preventDefault();
        window.location.href = nextEl.href;
      } else if (ev.key === 'ArrowRight' && prevEl && prevEl.tagName === 'A' && prevEl.href) {
        ev.preventDefault();
        window.location.href = prevEl.href;
      }
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initAssessmentFilters();
    initGradebookTabs();
    initCodeCopyButtons();
    initQuestionKeyboardShortcuts();
  });
})();
