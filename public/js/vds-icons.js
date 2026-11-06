/* Cầu nối icon: <i data-lucide="x"> → <vds-icon name="…"> (bộ icon VDS). vds-components.js dựng thẻ thành SVG. */
(function () {
  var MAP = {
    'chevron-right': 'Chevron__Right__Regular', 'chevron-left': 'Chevron__Left__Regular',
    'chevron-down': 'Chevron__Down__Regular', 'chevron-up': 'Chevron__Up__Regular',
    'trophy': 'Crown__Regular', 'award': 'Premium__Regular', 'bar-chart-2': 'DataBarVertical__Regular',
    'play': 'Play__Filled', 'newspaper': 'News__Regular', 'users': 'People__Regular',
    'shield': 'ShieldCheckmark__Regular', 'check-circle': 'CheckmarkCircle__Regular',
    'calendar': 'Calendar__Regular', 'user': 'Person__Regular', 'search': 'Search__Regular',
    'info': 'Info__Regular', 'flag': 'Flag__Regular', 'arrow-right': 'ArrowRight__Regular',
    'activity': 'DataTrending__Regular', 'star': 'Star__Regular', 'clock': 'Clock__Regular'
  };
  var SIZES = [12, 16, 20, 24, 28, 32, 48];
  function nearest(n) { return SIZES.reduce(function (a, b) { return Math.abs(b - n) < Math.abs(a - n) ? b : a; }); }
  function createIcons() {
    document.querySelectorAll('[data-lucide]').forEach(function (el) {
      var key = el.getAttribute('data-lucide'), base = MAP[key] || 'Info__Regular';
      var st = el.getAttribute('style') || '', m = /width:\s*(\d+)px/.exec(st);
      var px = m ? +m[1] : (el.classList.contains('vne-search-icon') ? 20 : 16);
      var size = nearest(px), name = base + '__' + size;
      if (/__Filled$/.test(base)) name = base + '__' + size;
      var icon = document.createElement('vds-icon');
      icon.setAttribute('name', name); icon.setAttribute('size', String(size));
      el.classList.forEach(function (c) { icon.classList.add(c); });
      var keep = [];
      var mm = /margin[^;]*;?/g.exec(st); if (mm) keep.push(mm[0]);
      var col = /color:\s*(var\([^;]+\))/.exec(st); if (col) keep.push('color:' + col[1]);
      if (keep.length) icon.setAttribute('style', keep.join(';'));
      el.replaceWith(icon);
    });
  }
  window.lucide = { createIcons: createIcons };
  document.addEventListener('DOMContentLoaded', createIcons);
})();
