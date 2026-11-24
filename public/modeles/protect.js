/* Protection des modèles de démonstration Motion Eleven — © Motion Eleven, reproduction interdite. */
(function () {
  var block = function (e) { e.preventDefault(); e.stopPropagation(); return false; };
  document.addEventListener("contextmenu", block, true);
  document.addEventListener("dragstart", function (e) { if (e.target && e.target.tagName === "IMG") block(e); }, true);
  document.addEventListener("keydown", function (e) {
    var k = (e.key || "").toLowerCase();
    var mod = e.ctrlKey || e.metaKey;
    if (k === "f12" || (mod && (k === "s" || k === "u")) || (mod && e.shiftKey && (k === "i" || k === "j" || k === "c")) || (e.metaKey && e.altKey && (k === "i" || k === "j" || k === "c" || k === "u"))) block(e);
  }, true);
  document.addEventListener("copy", function (e) {
    if (e.clipboardData) { e.clipboardData.setData("text/plain", "Contenu protégé — modèle de site Motion Eleven : https://motion-eleven.fr/modeles/"); block(e); }
  }, true);
  var style = document.createElement("style");
  style.textContent = "img{-webkit-user-drag:none;user-select:none;-webkit-touch-callout:none}" +
    ".me-badge{position:fixed;left:12px;bottom:12px;z-index:2147483647;display:flex;align-items:center;gap:8px;padding:8px 12px;border-radius:999px;background:#0c1530;color:#fff;font:600 12px/1.2 system-ui,-apple-system,sans-serif;text-decoration:none;box-shadow:0 10px 24px -10px rgba(0,0,0,.6);opacity:.92}" +
    ".me-badge:hover{opacity:1;color:#fff}.me-badge i{display:inline-block;width:6px;height:14px;border-radius:3px;background:#fff;box-shadow:8px -3px 0 #5b6dff;margin-right:8px}" +
    "@media print{body{display:none!important}}";
  document.head.appendChild(style);
  function badge() {
    if (document.querySelector(".me-badge")) return;
    var a = document.createElement("a");
    a.className = "me-badge";
    a.href = "https://motion-eleven.fr/modeles/";
    a.target = "_top";
    a.innerHTML = "<i></i>Modèle Motion Eleven";
    document.body.appendChild(a);
  }
  if (document.body) badge(); else document.addEventListener("DOMContentLoaded", badge);
  setInterval(badge, 3000);
})();
