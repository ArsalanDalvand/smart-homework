(function () {
  var FA_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
  function toFa(n) {
    return String(n).replace(/\d/g, function (d) {
      return FA_DIGITS[Number(d)];
    });
  }

  var TIER_ORDER = {
    none: 0,
    bronze: 1,
    silver: 2,
    gold: 3,
    diamond: 4,
    secret: 5,
  };

  var TIER_FA = {
    bronze: 'برنزی',
    silver: 'نقره‌ای',
    gold: 'طلایی',
    diamond: 'الماسی',
    secret: 'مخفی',
  };

  function getToastStack() {
    var stack = document.getElementById('sh-toast-stack');
    if (stack) return stack;
    stack = document.createElement('div');
    stack.id = 'sh-toast-stack';
    stack.className = 'sh-toast-stack';
    stack.setAttribute('aria-live', 'polite');
    stack.setAttribute('aria-atomic', 'true');
    document.body.appendChild(stack);
    return stack;
  }

  function showToast(opts) {
    var stack = getToastStack();
    var toast = document.createElement('div');
    toast.className = 'sh-toast ' + (opts.variantClass || '');
    toast.setAttribute('role', 'status');

    var iconWrap = document.createElement('span');
    iconWrap.className = 'sh-toast-icon';
    var icon = document.createElement('i');
    icon.className = opts.iconClass || 'bi bi-check-circle-fill';
    icon.setAttribute('aria-hidden', 'true');
    iconWrap.appendChild(icon);

    var body = document.createElement('div');
    body.className = 'sh-toast-body';

    var titleEl = document.createElement('div');
    titleEl.className = 'sh-toast-title';
    titleEl.textContent = opts.title;
    body.appendChild(titleEl);

    if (opts.subtitle) {
      var subEl = document.createElement('div');
      subEl.className = 'sh-toast-sub';
      subEl.textContent = opts.subtitle;
      body.appendChild(subEl);
    }

    if (opts.badges && opts.badges.length) {
      var badgeRow = document.createElement('div');
      badgeRow.className = 'd-flex flex-wrap gap-1 mt-1';
      opts.badges.forEach(function (b) {
        var chip = document.createElement('span');
        chip.className = 'sh-toast-chip sh-en-term';
        chip.textContent = b;
        badgeRow.appendChild(chip);
      });
      body.appendChild(badgeRow);
    }

    if (opts.ctaHref && opts.ctaLabel) {
      var actions = document.createElement('div');
      actions.className = 'mt-2';
      var link = document.createElement('a');
      link.href = opts.ctaHref;
      link.className = 'btn btn-primary btn-sm';
      link.textContent = opts.ctaLabel;
      actions.appendChild(link);
      body.appendChild(actions);
    }

    var closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'sh-toast-close';
    closeBtn.setAttribute('aria-label', 'بستن اعلان');
    closeBtn.innerHTML = '<i class="bi bi-x-lg" aria-hidden="true"></i>';
    closeBtn.addEventListener('click', function () {
      toast.remove();
    });

    toast.appendChild(iconWrap);
    toast.appendChild(body);
    toast.appendChild(closeBtn);
    stack.appendChild(toast);

    setTimeout(function () {
      toast.classList.add('is-leaving');
      setTimeout(function () {
        if (toast.parentNode) toast.remove();
      }, 240);
    }, opts.durationMs || 6800);
  }

  function launchConfetti(theme) {
    if (
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }
    if (document.getElementById('sh-confetti-canvas')) {
      return;
    }

    var canvas = document.createElement('canvas');
    canvas.id = 'sh-confetti-canvas';
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    document.body.appendChild(canvas);

    var ctx = canvas.getContext('2d');
    if (!ctx) {
      canvas.remove();
      return;
    }

    var colors =
      theme === 'gold'
        ? ['#f59e0b', '#fbbf24', '#2563eb', '#60a5fa', '#fcd34d']
        : ['#15803d', '#4ade80', '#d97706', '#2563eb', '#0f4c81'];
    var count = theme === 'gold' ? 56 : 42;
    var particles = [];
    var originX = canvas.width * 0.5;
    var originY = canvas.height * 0.35;

    for (var i = 0; i < count; i += 1) {
      var angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.3;
      var speed = 4 + Math.random() * 6.5;
      particles.push({
        x: originX,
        y: originY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 3.6,
        size: 5 + Math.random() * 4.5,
        rot: Math.random() * Math.PI,
        vrot: (Math.random() - 0.5) * 0.25,
        color: colors[i % colors.length],
        alpha: 1,
      });
    }

    var start = performance.now();
    function tick(now) {
      var elapsed = now - start;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach(function (p) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.22;
        p.vx *= 0.985;
        p.rot += p.vrot;
        p.alpha = Math.max(0, 1 - elapsed / 1500);

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();
      });

      if (elapsed < 1500) {
        requestAnimationFrame(tick);
      } else {
        canvas.remove();
      }
    }

    requestAnimationFrame(tick);
  }

  function detectDelightMilestones(cfg) {
    if (!cfg || !cfg.courseInstanceId) return;
    var v2Key = 'sh-delight-state-v2-' + cfg.courseInstanceId;
    var legacyKey = 'sh-seen-ach-' + cfg.courseInstanceId;
    var unlocked = Array.isArray(cfg.unlockedAchievements) ? cfg.unlockedAchievements : [];

    var currentTiers = {};
    unlocked.forEach(function (a) {
      currentTiers[a.id] = a.tier || 'secret';
    });

    try {
      var rawV2 = window.localStorage.getItem(v2Key);
      var prevState = null;

      if (rawV2) {
        prevState = JSON.parse(rawV2);
      } else {
        var rawLegacy = window.localStorage.getItem(legacyKey);
        if (rawLegacy) {
          var legacySet = new Set(JSON.parse(rawLegacy));
          var migratedTiers = {};
          unlocked.forEach(function (a) {
            if (legacySet.has(a.id)) {
              migratedTiers[a.id] = a.tier || 'secret';
            }
          });
          prevState = {
            level: cfg.level || 1,
            tiers: migratedTiers,
            completedAssessments:
              cfg.assessmentCompleted && cfg.assessmentId ? [cfg.assessmentId] : [],
          };
        }
      }

      if (!prevState) {
        window.localStorage.setItem(
          v2Key,
          JSON.stringify({
            level: cfg.level || 1,
            tiers: currentTiers,
            completedAssessments:
              cfg.assessmentCompleted && cfg.assessmentId ? [cfg.assessmentId] : [],
          }),
        );
        return;
      }

      var prevTiers = prevState.tiers || {};
      var prevCompleted = Array.isArray(prevState.completedAssessments)
        ? prevState.completedAssessments
        : [];
      var toastQueue = [];

      unlocked.forEach(function (ach) {
        var curTier = ach.tier || 'secret';
        var prevTier = prevTiers[ach.id] || 'none';
        if (prevTier === 'none' && (TIER_ORDER[curTier] || 0) > 0) {
          toastQueue.push({
            variantClass: 'is-achievement',
            iconClass: 'bi bi-trophy-fill',
            title: 'دستاورد جدید باز شد: ' + ach.title,
            subtitle: ach.description,
            durationMs: 7500,
          });
        } else if (
          prevTier !== 'none' &&
          (TIER_ORDER[curTier] || 0) > (TIER_ORDER[prevTier] || 0)
        ) {
          var tierFa = TIER_FA[curTier] || curTier;
          toastQueue.push({
            variantClass: 'is-achievement',
            iconClass: 'bi bi-award-fill',
            title: 'ارتقای مدال! ' + ach.title + ' به سطح ' + tierFa + ' رسید',
            subtitle: ach.description,
            confettiTheme: 'gold',
            durationMs: 8000,
          });
        }
      });

      if (cfg.level && prevState.level && cfg.level > prevState.level) {
        toastQueue.push({
          variantClass: 'is-levelup',
          iconClass: 'bi bi-rocket-takeoff-fill',
          title:
            'تبریک! به Level ' +
            toFa(cfg.level) +
            (cfg.levelTitle ? ' (' + cfg.levelTitle + ')' : '') +
            ' صعود کردی!',
          subtitle: 'سطح تسلط و تجربه شما در این درس ارتقا یافت.',
          confettiTheme: 'gold',
          durationMs: 8500,
        });
      }

      var updatedCompleted = prevCompleted.slice();
      if (
        cfg.assessmentCompleted &&
        cfg.assessmentId &&
        prevCompleted.indexOf(cfg.assessmentId) === -1
      ) {
        updatedCompleted.push(cfg.assessmentId);
        toastQueue.push({
          variantClass: 'is-series-complete',
          iconClass: 'bi bi-patch-check-fill',
          title:
            'کل سری ' +
            (cfg.assessmentLabel ? cfg.assessmentLabel + ' ' : '') +
            'با موفقیت ۱۰۰٪ تکمیل شد!',
          subtitle: 'همه سوالات این سری تمرین را کامل حل کرده‌اید.',
          confettiTheme: 'gold',
          durationMs: 9000,
        });
      }

      var mergedTiers = Object.assign({}, prevTiers, currentTiers);
      window.localStorage.setItem(
        v2Key,
        JSON.stringify({
          level: Math.max(prevState.level || 1, cfg.level || 1),
          tiers: mergedTiers,
          completedAssessments: updatedCompleted,
        }),
      );

      if (toastQueue.length > 0) {
        toastQueue.slice(0, 3).forEach(function (item, idx) {
          setTimeout(
            function () {
              if (item.confettiTheme) {
                launchConfetti(item.confettiTheme);
              }
              showToast(item);
            },
            500 + idx * 450,
          );
        });
      }
    } catch (_err) {
      // Ignore storage access errors
    }
  }

  function extractLatestSubmissionScore(subEl) {
    if (!subEl) return null;
    var scoreAttr = subEl.getAttribute('data-submission-score');
    if (scoreAttr !== null && scoreAttr !== '') {
      var parsedAttr = Number(scoreAttr);
      if (!Number.isNaN(parsedAttr)) return parsedAttr;
    }
    var badges = subEl.querySelectorAll('.badge');
    for (var i = 0; i < badges.length; i += 1) {
      var txt = (badges[i].textContent || '').trim();
      var match = txt.match(/(\d+(?:\.\d+)?)\s*%/);
      if (match) return Number(match[1]);
      if (txt.indexOf('صحیح') !== -1 && txt.indexOf('ناصحیح') === -1) return 100;
    }
    return null;
  }

  function celebrateSubmission(cfg, subId, score) {
    if (!subId || score === null) return;
    var dedupKey = 'sh-celebrated-' + (cfg.instanceQuestionId || 'q');
    try {
      if (window.sessionStorage.getItem(dedupKey) === String(subId)) return;
      window.sessionStorage.setItem(dedupKey, String(subId));
    } catch (_err) {
      // Continue cleanly without storage
    }

    if (score >= 99.99) {
      launchConfetti('default');
      var badges = [];
      if (cfg.estimatedXp > 0) badges.push('+' + toFa(cfg.estimatedXp) + ' XP');
      if (cfg.isOneShot) badges.push('One-Shot');
      if (typeof cfg.beatsClassPerc === 'number' && cfg.beatsClassPerc > 0) {
        badges.push('سریع‌تر از ' + toFa(cfg.beatsClassPerc) + '٪ کلاس');
      }

      showToast({
        variantClass: 'is-success',
        iconClass: 'bi bi-check-circle-fill',
        title: 'پاسخ کامل پذیرفته شد!',
        subtitle: cfg.nextQuestionUrl
          ? 'عالی بود — می‌توانی مستقیم سراغ سوال بعدی بروی.'
          : 'همه تست‌های این سوال با موفقیت پاس شدند.',
        badges: badges,
        ctaHref: cfg.nextQuestionUrl || null,
        ctaLabel: cfg.nextQuestionUrl ? 'سوال بعدی ←' : null,
        durationMs: 7000,
      });
    } else if (score >= 60) {
      showToast({
        variantClass: 'is-partial',
        iconClass: 'bi bi-lightbulb-fill',
        title: 'خیلی نزدیک شدی (' + toFa(Math.round(score)) + '٪)!',
        subtitle: 'بیشتر تست‌ها پاس شد؛ حالت‌های مرزی (Edge Cases) یا فرمت خروجی را بررسی کن.',
        durationMs: 6000,
      });
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    var configNode = document.getElementById('sh-delight-config');
    if (!configNode) return;
    var cfg;
    try {
      cfg = JSON.parse(configNode.textContent || '{}');
    } catch (_err) {
      return;
    }

    detectDelightMilestones(cfg);

    // Check latest graded submission immediately after POST redirect
    var latestSub = document.querySelector('[data-testid="submission-with-feedback"]');
    if (latestSub && latestSub.getAttribute('data-grading-job-status') === 'graded') {
      var latestId = latestSub.id || cfg.submissionId;
      var score =
        typeof cfg.scorePerc === 'number' &&
        cfg.submissionId &&
        latestSub.id === 'submission-' + cfg.submissionId
          ? cfg.scorePerc
          : extractLatestSubmissionScore(latestSub);
      if (score !== null && score >= 60) {
        celebrateSubmission(cfg, latestId, score);
      }
    }

    // Watch live external grading Socket.IO updates via MutationObserver
    var qContainer = document.querySelector('.question-container');
    if (qContainer && typeof MutationObserver === 'function') {
      var observer = new MutationObserver(function () {
        var topSub = document.querySelector('[data-testid="submission-with-feedback"]');
        if (!topSub) return;
        if (topSub.getAttribute('data-grading-job-status') !== 'graded') return;
        var parsedScore = extractLatestSubmissionScore(topSub);
        if (parsedScore !== null && parsedScore >= 60) {
          celebrateSubmission(cfg, topSub.id || Date.now(), parsedScore);
        }
      });
      observer.observe(qContainer, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['data-grading-job-status'],
      });
    }
  });
})();
