(function () {
  var FA_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
  function toFa(n) {
    return String(n).replace(/\d/g, function (d) {
      return FA_DIGITS[Number(d)];
    });
  }

  function formatRemaining(ms) {
    if (ms <= 0) return 'مهلت این بازه به پایان رسید';
    var totalSec = Math.floor(ms / 1000);
    var days = Math.floor(totalSec / 86400);
    var hours = Math.floor((totalSec % 86400) / 3600);
    var mins = Math.floor((totalSec % 3600) / 60);
    var secs = totalSec % 60;

    var parts = [];
    if (days > 0) parts.push(toFa(days) + ' روز');
    if (hours > 0 || days > 0) parts.push(toFa(hours) + ' ساعت');
    if (days === 0 && (mins > 0 || hours > 0)) parts.push(toFa(mins) + ' دقیقه');
    if (days === 0 && hours === 0) parts.push(toFa(secs) + ' ثانیه');
    if (days > 0 && mins > 0) parts.push(toFa(mins) + ' دقیقه');
    return parts.slice(0, 3).join(' و ') + ' باقی‌مانده';
  }

  function updateCountdowns() {
    var nodes = document.querySelectorAll('[data-deadline-iso]');
    if (!nodes.length) return;
    var now = Date.now();
    nodes.forEach(function (el) {
      var iso = el.getAttribute('data-deadline-iso');
      if (!iso) return;
      var target = Date.parse(iso);
      if (Number.isNaN(target)) return;
      el.textContent = formatRemaining(target - now);

      var card = el.closest('.se-deadline-radar');
      if (card) {
        var diffH = (target - now) / 3600000;
        card.classList.remove('is-urgent', 'is-warning');
        if (diffH > 0 && diffH <= 6) card.classList.add('is-urgent');
        else if (diffH > 6 && diffH <= 48) card.classList.add('is-warning');
      }
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    updateCountdowns();
    setInterval(updateCountdowns, 1000);
  });
})();
