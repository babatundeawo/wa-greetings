// Applies the saved theme before first paint, so there is no flash of the wrong one.
// Runs as a tiny blocking script in <head>. Kept as a file because the CSP forbids inline scripts.
(function () {
  try {
    var saved = localStorage.getItem('dg-theme');
    if (saved === 'light' || saved === 'dark') document.documentElement.setAttribute('data-theme', saved);
  } catch (e) { /* storage unavailable: fall back to system preference */ }
})();
