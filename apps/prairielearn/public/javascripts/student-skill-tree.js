(function () {
  document.addEventListener('DOMContentLoaded', function () {
    var nodes = document.querySelectorAll('[data-skill-node-btn]');
    var panels = document.querySelectorAll('[data-skill-node-panel]');
    if (!nodes.length || !panels.length) return;

    function selectNode(nodeId) {
      nodes.forEach(function (btn) {
        var active = btn.getAttribute('data-skill-node-btn') === nodeId;
        btn.classList.toggle('is-selected', active);
        btn.setAttribute('aria-selected', active ? 'true' : 'false');
      });

      panels.forEach(function (panel) {
        var match = panel.getAttribute('data-skill-node-panel') === nodeId;
        panel.classList.toggle('d-none', !match);
      });
    }

    nodes.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-skill-node-btn');
        if (id) selectNode(id);
      });
    });
  });
})();
