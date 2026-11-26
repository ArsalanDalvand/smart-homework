(function () {
  var FA_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
  function toFa(n) {
    return String(n).replace(/\d/g, function (d) {
      return FA_DIGITS[Number(d)];
    });
  }

  function makeEl(tag, className, text) {
    var el = document.createElement(tag);
    if (className) el.className = className;
    if (text !== undefined && text !== null) el.textContent = String(text);
    return el;
  }

  var AVATAR_ICON_MAP = {
    terminal: 'bi bi-terminal-fill',
    rocket: 'bi bi-rocket-takeoff-fill',
    lightning: 'bi bi-lightning-charge-fill',
    cpu: 'bi bi-cpu-fill',
    stars: 'bi bi-stars',
    shield: 'bi bi-shield-fill-check',
    compass: 'bi bi-compass-fill',
    gem: 'bi bi-gem',
    code: 'bi bi-code-slash',
    bug: 'bi bi-bug-fill',
    fire: 'bi bi-fire',
    trophy: 'bi bi-trophy-fill',
    braces: 'bi bi-braces',
    robot: 'bi bi-robot',
    mortarboard: 'bi bi-mortarboard-fill',
  };

  var AVATAR_COLOR_SET = {
    cobalt: true,
    emerald: true,
    amber: true,
    violet: true,
    rose: true,
    cyan: true,
    indigo: true,
    slate: true,
  };

  var BANNER_THEME_SET = {
    nova: true,
    aurora: true,
    sunset: true,
    midnight: true,
    cyber: true,
    forest: true,
  };

  var STATUS_LABEL_MAP = {
    coding: '💻 در حال کدنویسی',
    hunting: '⚡ آماده First Blood',
    debugging: '🐛 شکار باگ',
    coffee: '☕ سوخت‌گیری با قهوه',
    focus: '🎯 تمرکز روی تمرین جدید',
    helper: '🤝 پایه کمک به هم‌کلاسی‌ها',
  };

  function getInitials(name) {
    var clean = String(name || '').trim();
    if (!clean) return 'د';
    var parts = clean.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
    }
    return clean.slice(0, 2).toUpperCase();
  }

  function renderPassportContent(body, data) {
    body.innerHTML = '';

    var bannerTheme = BANNER_THEME_SET[data.bannerTheme] ? data.bannerTheme : 'nova';
    var avatarColor = AVATAR_COLOR_SET[data.avatarColor] ? data.avatarColor : 'cobalt';
    var iconClass = AVATAR_ICON_MAP[data.avatarPreset] || '';
    var titleLabel =
      data.featuredTitle && data.featuredTitle !== 'auto'
        ? data.featuredTitle
        : data.level && data.level.title
          ? data.level.title
          : 'Beginner';

    var banner = makeEl('div', 'sh-passport-banner sh-banner-' + bannerTheme + ' mb-3');
    var identityWrap = makeEl(
      'div',
      'd-flex flex-wrap align-items-center justify-content-between gap-3 position-relative',
    );
    var leftGroup = makeEl('div', 'd-flex align-items-center gap-3');

    var avatar = makeEl('div', 'sh-avatar sh-avatar-lg sh-av-color-' + avatarColor);
    var fillAvatarFallback = function () {
      avatar.innerHTML = '';
      if (iconClass) {
        var avIcon = makeEl('i', iconClass, '');
        avIcon.setAttribute('aria-hidden', 'true');
        avatar.appendChild(avIcon);
      } else {
        avatar.appendChild(makeEl('span', '', getInitials(data.displayName)));
      }
    };
    if (data.avatarVersion && data.userId) {
      var avImg = document.createElement('img');
      avImg.src =
        '/pl/user_avatar/' +
        encodeURIComponent(data.userId) +
        '?v=' +
        encodeURIComponent(data.avatarVersion);
      avImg.alt = '';
      avImg.className = 'sh-avatar-img';
      avImg.addEventListener('error', fillAvatarFallback);
      avatar.appendChild(avImg);
    } else {
      fillAvatarFallback();
    }
    leftGroup.appendChild(avatar);

    var titleWrap = makeEl('div', '');
    var nameRow = makeEl('div', 'd-flex flex-wrap align-items-center gap-2');
    nameRow.appendChild(makeEl('h3', 'h6 fw-bold mb-0 text-white', data.displayName));
    var lvPill = makeEl(
      'span',
      'badge bg-white bg-opacity-25 text-white border border-white border-opacity-25 sh-tabular sh-en-term',
      'Lv.' + toFa(data.level.level),
    );
    nameRow.appendChild(lvPill);
    titleWrap.appendChild(nameRow);

    var rankLine = makeEl('div', 'small text-white text-opacity-75 mt-1', '');
    rankLine.appendChild(makeEl('span', 'sh-en-term fw-semibold text-white', titleLabel));
    rankLine.appendChild(document.createTextNode(' · ' + toFa(data.level.totalXp) + ' XP'));
    titleWrap.appendChild(rankLine);
    leftGroup.appendChild(titleWrap);
    identityWrap.appendChild(leftGroup);

    var statusLabel = data.statusEmoji ? STATUS_LABEL_MAP[data.statusEmoji] : '';
    if (statusLabel) {
      identityWrap.appendChild(makeEl('span', 'sh-status-chip', statusLabel));
    }
    banner.appendChild(identityWrap);

    if (data.bio) {
      banner.appendChild(makeEl('p', 'small text-white text-opacity-90 mt-3 mb-0', data.bio));
    }
    body.appendChild(banner);

    if (data.favoriteTopic || data.githubUsername) {
      var metaBar = makeEl('div', 'd-flex flex-wrap align-items-center gap-2 mb-3');
      if (data.favoriteTopic) {
        var topicBadge = makeEl(
          'span',
          'badge bg-body-secondary text-body border fw-normal py-1 px-2',
          '',
        );
        var topicIcon = makeEl('i', 'bi bi-bookmark-star-fill text-primary me-1', '');
        topicIcon.setAttribute('aria-hidden', 'true');
        topicBadge.appendChild(topicIcon);
        topicBadge.appendChild(document.createTextNode('مبحث موردعلاقه: ' + data.favoriteTopic));
        metaBar.appendChild(topicBadge);
      }
      if (data.githubUsername && /^[a-zA-Z0-9-]+$/.test(data.githubUsername)) {
        var ghLink = document.createElement('a');
        ghLink.href = 'https://github.com/' + encodeURIComponent(data.githubUsername);
        ghLink.target = '_blank';
        ghLink.rel = 'noopener noreferrer';
        ghLink.className =
          'badge bg-body-secondary text-body border text-decoration-none fw-normal py-1 px-2 sh-en-term';
        var ghIcon = makeEl('i', 'bi bi-github me-1', '');
        ghIcon.setAttribute('aria-hidden', 'true');
        ghLink.appendChild(ghIcon);
        ghLink.appendChild(document.createTextNode('@' + data.githubUsername));
        metaBar.appendChild(ghLink);
      }
      body.appendChild(metaBar);
    }

    if (data.streak && data.solvedQuestions !== null) {
      var statsRow = makeEl('div', 'row g-2 mb-3');
      var statItems = [
        { label: 'سوالات حل‌شده', val: toFa(data.solvedQuestions) + ' سوال' },
        {
          label: 'نرخ قبولی',
          val: data.acceptanceRate !== null ? toFa(data.acceptanceRate) + '٪' : '—',
        },
        { label: 'بیشترین Streak', val: toFa(data.streak.longest) + ' روز' },
        {
          label: 'تحسین TA / First Blood',
          val: toFa(data.taKudosCount) + ' / ' + toFa(data.firstBloodCount),
        },
      ];
      statItems.forEach(function (st) {
        var col = makeEl('div', 'col-6 col-md-3');
        var box = makeEl('div', 'p-2 rounded border bg-body-tertiary text-center h-100');
        box.appendChild(makeEl('div', 'text-body-secondary small', st.label));
        box.appendChild(makeEl('div', 'fw-bold text-body mt-1 sh-tabular', st.val));
        col.appendChild(box);
        statsRow.appendChild(col);
      });
      body.appendChild(statsRow);
    }

    var medalsHeading = makeEl(
      'h4',
      'small fw-bold text-body mb-2',
      'مدال‌ها و دستاوردهای بازشده (' + toFa(data.earnedAchievements.length) + ')',
    );
    body.appendChild(medalsHeading);
    if (data.earnedAchievements.length === 0) {
      body.appendChild(makeEl('div', 'small text-body-secondary mb-3', 'هنوز مدالی باز نشده است.'));
    } else {
      var medalsGrid = makeEl('div', 'd-flex flex-wrap gap-2 mb-3');
      data.earnedAchievements.slice(0, 12).forEach(function (ach) {
        var chip = makeEl('span', 'sh-honor-chip sh-tier-' + ach.tier, '');
        var icon = makeEl('i', ach.iconClass + ' me-1', '');
        icon.setAttribute('aria-hidden', 'true');
        chip.appendChild(icon);
        chip.appendChild(makeEl('span', 'sh-en-term', ach.title));
        chip.title = ach.description;
        medalsGrid.appendChild(chip);
      });
      body.appendChild(medalsGrid);
    }

    if (Array.isArray(data.topicMastery) && data.topicMastery.length > 0) {
      body.appendChild(
        makeEl('h4', 'small fw-bold text-body mb-2', 'مسیر تسلط مباحث (Skill Tree)'),
      );
      var topicList = makeEl('div', 'd-flex flex-column gap-2');
      data.topicMastery.forEach(function (node) {
        var row = makeEl('div', '');
        var top = makeEl('div', 'd-flex justify-content-between small mb-1');
        top.appendChild(makeEl('span', 'text-body fw-medium', node.title));
        top.appendChild(
          makeEl(
            'span',
            'text-body-secondary sh-tabular',
            toFa(node.solvedQuestions) +
              ' / ' +
              toFa(node.totalQuestions) +
              ' (' +
              toFa(node.masteryPerc) +
              '٪)',
          ),
        );
        var prog = makeEl('div', 'progress', '');
        prog.style.height = '6px';
        var bar = makeEl(
          'div',
          'progress-bar ' + (node.masteryPerc >= 100 ? 'sh-progress-success' : 'sh-progress-brand'),
          '',
        );
        bar.style.width = node.masteryPerc + '%';
        prog.appendChild(bar);
        row.appendChild(top);
        row.appendChild(prog);
        topicList.appendChild(row);
      });
      body.appendChild(topicList);
    }
  }

  function initPassportModal() {
    var modalEl = document.getElementById('sh-coding-passport-modal');
    if (!modalEl) return;
    var bodyEl = document.getElementById('sh-coding-passport-body');
    var urlPrefix = modalEl.getAttribute('data-url-prefix') || '';
    if (!bodyEl) return;

    document.addEventListener('click', function (ev) {
      var btn =
        ev.target && ev.target.closest ? ev.target.closest('[data-sh-passport-user]') : null;
      if (!btn) return;
      var userId = btn.getAttribute('data-sh-passport-user');
      if (!userId) return;

      bodyEl.innerHTML = '';
      var loadingWrap = makeEl(
        'div',
        'p-4 text-center text-body-secondary small',
        'در حال دریافت شناسنامه برنامه‌نویسی...',
      );
      bodyEl.appendChild(loadingWrap);

      if (window.bootstrap && window.bootstrap.Modal) {
        window.bootstrap.Modal.getOrCreateInstance(modalEl).show();
      }

      fetch(urlPrefix + '/leaderboard/passport/' + encodeURIComponent(userId), {
        headers: { Accept: 'application/json' },
      })
        .then(function (resp) {
          if (!resp.ok) throw new Error('HTTP ' + resp.status);
          return resp.json();
        })
        .then(function (data) {
          renderPassportContent(bodyEl, data);
        })
        .catch(function () {
          bodyEl.innerHTML = '';
          bodyEl.appendChild(
            makeEl(
              'div',
              'alert alert-warning mb-0 small',
              'امکان بارگذاری پروفایل این دانشجو وجود نداشت.',
            ),
          );
        });
    });
  }

  function initWhatIfSimulator() {
    var dataNode = document.getElementById('sh-whatif-data');
    if (!dataNode) return;
    var cfg;
    try {
      cfg = JSON.parse(dataNode.getAttribute('data-config') || dataNode.textContent || '{}');
    } catch (_err) {
      return;
    }

    var slider = document.getElementById('sh-whatif-slider');
    var remainingSelect = document.getElementById('sh-whatif-remaining');
    var sliderLabel = document.getElementById('sh-whatif-slider-label');
    var resultEl = document.getElementById('sh-whatif-result-perc');
    var adviceEl = document.getElementById('sh-whatif-advice');
    var barEl = document.getElementById('sh-whatif-progress-bar');
    if (!slider || !sliderLabel || !resultEl || !barEl) return;

    function update() {
      var targetPerc = Number(slider.value || 85);
      var futureCount = remainingSelect
        ? Number(remainingSelect.value || 0)
        : cfg.defaultRemainingCount || 0;
      var completedCount = Number(cfg.completedCount || 0);
      var currentAvg = Number(cfg.currentAvgPerc || 0);
      var totalCount = completedCount + futureCount;

      var projected =
        totalCount > 0
          ? Math.round(
              ((currentAvg * completedCount + targetPerc * futureCount) / totalCount) * 10,
            ) / 10
          : targetPerc;

      sliderLabel.textContent = toFa(targetPerc) + '٪';
      resultEl.textContent = toFa(projected) + '٪';
      barEl.style.width = Math.max(0, Math.min(100, projected)) + '%';

      if (adviceEl) {
        if (futureCount <= 0) {
          adviceEl.textContent =
            'بر اساس مجموع سری‌های فعلی، میانگین تمرین‌های شما ' + toFa(projected) + '٪ است.';
        } else if (projected >= 90) {
          adviceEl.textContent =
            'عالی! با میانگین ' +
            toFa(targetPerc) +
            '٪ در ' +
            toFa(futureCount) +
            ' سری آینده به سطح ممتاز می‌رسی.';
        } else if (projected >= 75) {
          adviceEl.textContent =
            'برنامه کاملاً منطقی و دست‌یافتنی: میانگین پایان ترم حدود ' +
            toFa(projected) +
            '٪ خواهد بود.';
        } else {
          adviceEl.textContent =
            'با افزایش تمرکز روی ' +
            toFa(futureCount) +
            ' سری بعدی می‌توانی میانگین نهایی را به بالای ۷۵٪ برسانی.';
        }
      }
    }

    slider.addEventListener('input', update);
    if (remainingSelect) remainingSelect.addEventListener('change', update);
    document.querySelectorAll('[data-sh-whatif-preset]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var val = btn.getAttribute('data-sh-whatif-preset');
        if (val !== null) {
          slider.value = val;
          update();
        }
      });
    });

    update();
  }

  function drawRoundedRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(x, y, w, h, r);
    } else {
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r);
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
    }
    ctx.closePath();
  }

  function initWrapUpExporter() {
    var dataNode = document.getElementById('sh-wrapup-data');
    var downloadBtn = document.getElementById('sh-wrapup-download-png');
    var printBtn = document.getElementById('sh-wrapup-print-btn');
    if (printBtn) {
      printBtn.addEventListener('click', function () {
        window.print();
      });
    }
    if (!dataNode || !downloadBtn) return;

    var cfg;
    try {
      cfg = JSON.parse(dataNode.getAttribute('data-config') || dataNode.textContent || '{}');
    } catch (_err) {
      return;
    }

    downloadBtn.addEventListener('click', function () {
      var canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 1350;
      var ctx = canvas.getContext('2d');
      if (!ctx) return;

      var grad = ctx.createLinearGradient(0, 0, 1080, 1350);
      grad.addColorStop(0, '#0f172a');
      grad.addColorStop(0.55, '#1e293b');
      grad.addColorStop(1, '#1d4ed8');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1080, 1350);

      // Subtle glow circle
      ctx.fillStyle = 'rgba(59, 130, 246, 0.14)';
      ctx.beginPath();
      ctx.arc(880, 190, 260, 0, Math.PI * 2);
      ctx.fill();

      // Header text
      ctx.fillStyle = '#93c5fd';
      ctx.font = 'bold 28px Vazirmatn, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('SMART HOMEWORK · TERM WRAP-UP', 990, 110);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 54px Vazirmatn, sans-serif';
      ctx.fillText(cfg.studentName || 'دانشجو', 990, 190);

      ctx.fillStyle = '#cbd5e1';
      ctx.font = '28px Vazirmatn, sans-serif';
      ctx.fillText((cfg.courseName || '') + '  ·  ' + (cfg.termName || ''), 990, 242);

      // Level card
      drawRoundedRect(ctx, 84, 300, 912, 165, 24);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(147, 197, 253, 0.35)';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 48px Vazirmatn, sans-serif';
      ctx.fillText('Lv.' + toFa(cfg.level || 1) + ' — ' + (cfg.levelTitle || ''), 950, 375);
      ctx.fillStyle = '#e2e8f0';
      ctx.font = '30px Vazirmatn, sans-serif';
      ctx.fillText(toFa(cfg.totalXp || 0) + ' XP  ·  ' + (cfg.levelSubtitleFa || ''), 950, 428);

      // 4 Stat cards (2x2 grid)
      var stats = [
        { title: 'سوالات حل‌شده کامل', value: toFa(cfg.solvedQuestions || 0) + ' سوال' },
        { title: 'معدل نمرات تمرین', value: toFa(cfg.overallScorePerc || 0) + '٪' },
        { title: 'رکورد Streak روزانه', value: toFa(cfg.longestStreak || 0) + ' روز' },
        { title: 'مدال‌های بازشده', value: toFa(cfg.unlockedCount || 0) + ' دستاورد' },
      ];

      stats.forEach(function (st, idx) {
        var col = idx % 2;
        var row = Math.floor(idx / 2);
        var bx = col === 0 ? 558 : 84;
        var by = 505 + row * 190;
        drawRoundedRect(ctx, bx, by, 438, 160, 20);
        ctx.fillStyle = 'rgba(15, 23, 42, 0.55)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
        ctx.stroke();

        ctx.fillStyle = '#94a3b8';
        ctx.font = '26px Vazirmatn, sans-serif';
        ctx.fillText(st.title, bx + 404, by + 58);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 46px Vazirmatn, sans-serif';
        ctx.fillText(st.value, bx + 404, by + 122);
      });

      // Top medals section
      drawRoundedRect(ctx, 84, 905, 912, 290, 24);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.stroke();

      ctx.fillStyle = '#fde68a';
      ctx.font = 'bold 30px Vazirmatn, sans-serif';
      ctx.fillText('افتخارات شاخص ترم', 950, 962);

      var badges = Array.isArray(cfg.topBadges) ? cfg.topBadges.slice(0, 4) : [];
      if (badges.length === 0) {
        ctx.fillStyle = '#cbd5e1';
        ctx.font = '28px Vazirmatn, sans-serif';
        ctx.fillText('اولین تمرین‌ها را حل کن تا مدال‌هایت اینجا بدرخشند!', 950, 1045);
      } else {
        badges.forEach(function (b, idx) {
          ctx.fillStyle = '#f8fafc';
          ctx.font = 'bold 30px Vazirmatn, sans-serif';
          ctx.fillText('★  ' + b, 950, 1025 + idx * 44);
        });
      }

      ctx.fillStyle = '#94a3b8';
      ctx.font = '24px Vazirmatn, sans-serif';
      ctx.fillText(
        'سامانه تمرین و ارزیابی هوشمند برنامه‌نویسی · دانشگاه علم و صنعت ایران',
        990,
        1280,
      );

      var link = document.createElement('a');
      link.download = 'smart-homework-wrapup.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    });
  }

  function initSpotlightCopy() {
    document.addEventListener('click', function (ev) {
      var btn =
        ev.target && ev.target.closest ? ev.target.closest('[data-sh-copy-spotlight]') : null;
      if (!btn) return;
      var card = btn.closest('.sh-spotlight-item');
      var codeEl = card ? card.querySelector('pre code') : null;
      if (!codeEl || !navigator.clipboard) return;

      var orig = btn.textContent;
      navigator.clipboard.writeText(codeEl.textContent || '').then(function () {
        btn.textContent = 'کپی شد ✓';
        setTimeout(function () {
          btn.textContent = orig;
        }, 1600);
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initPassportModal();
    initWhatIfSimulator();
    initWrapUpExporter();
    initSpotlightCopy();
  });
})();
