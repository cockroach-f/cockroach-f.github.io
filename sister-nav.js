/* 姊妹站点导航：顶栏「全部课程」下拉菜单。
 * 单一数据源：与本脚本同目录下的 sites.json。
 * 各课程站只需在 mkdocs.yml 里引用本文件与 sister-nav.css，之后加课只改 sites.json。 */
(function () {
  "use strict";
  if (window.__sisterNavInit) return;
  window.__sisterNavInit = true;

  var FALLBACK_BASE = "https://cockroach-f.github.io/";

  function scriptBase() {
    var src = "";
    try {
      if (document.currentScript && document.currentScript.src) src = document.currentScript.src;
    } catch (e) { /* ignore */ }
    if (!src) {
      var scripts = document.getElementsByTagName("script");
      for (var i = 0; i < scripts.length; i++) {
        if (scripts[i].src && scripts[i].src.indexOf("sister-nav.js") !== -1) { src = scripts[i].src; break; }
      }
    }
    if (!src) return FALLBACK_BASE;
    return src.replace(/sister-nav\.js(\?.*)?$/, "");
  }

  var BASE = scriptBase();
  if (BASE.charAt(BASE.length - 1) !== "/") BASE += "/";

  /* 当前站点 id：取 URL 第一段路径，如 /em-fields-waves/ch1.html -> em-fields-waves */
  function currentId() {
    var parts = window.location.pathname.split("/").filter(Boolean);
    return parts.length ? parts[0] : "";
  }

  /* 深色底用白字、浅色底用深字，保证 glyph 在任何配色下都清晰 */
  function glyphTextColor(hex) {
    var m = /^#?([0-9a-f]{6})$/i.exec(hex || "");
    if (!m) return "#fff";
    var n = parseInt(m[1], 16);
    var r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    var lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return lum > 0.65 ? "rgba(0,0,0,.78)" : "#fff";
  }

  function iconGrid() {
    return '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M4 4h7v7H4V4zm9 0h7v7h-7V4zM4 13h7v7H4v-7zm9 0h7v7h-7v-7z"/></svg>';
  }
  function iconChevron() {
    return '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M7.41 8.59 12 13.17l4.59-4.58L18 10l-6 6-6-6z"/></svg>';
  }

  function build(sites) {
    var old = document.querySelector("[data-sister-nav]");
    if (old) old.remove();

    var here = currentId();
    var nav = document.createElement("div");
    nav.className = "sister-nav";
    nav.setAttribute("data-sister-nav", "");

    var button = document.createElement("button");
    button.type = "button";
    button.className = "sister-nav__button";
    button.setAttribute("aria-haspopup", "true");
    button.setAttribute("aria-expanded", "false");
    button.title = "全部课程";
    button.innerHTML = iconGrid() + '<span class="sister-nav__label">全部课程</span>' + iconChevron();

    var panel = document.createElement("div");
    panel.className = "sister-nav__panel";
    panel.setAttribute("role", "menu");
    panel.hidden = true;

    sites.forEach(function (site) {
      var a = document.createElement("a");
      a.className = "sister-nav__item";
      a.href = site.url;
      a.setAttribute("role", "menuitem");
      var isCurrent = site.id === here;
      if (isCurrent) a.classList.add("sister-nav__item--current");
      var chip = '<span class="sister-nav__glyph" style="background:' + site.color +
        ";color:" + glyphTextColor(site.color) + '">' + site.glyph + "</span>";
      var badge = isCurrent ? '<span class="sister-nav__badge">当前</span>' : "";
      a.innerHTML = chip +
        '<span class="sister-nav__text"><span class="sister-nav__name"></span>' +
        '<span class="sister-nav__desc"></span></span>' + badge;
      a.querySelector(".sister-nav__name").textContent = site.name;
      a.querySelector(".sister-nav__desc").textContent = site.desc || "";
      panel.appendChild(a);
    });

    var hub = document.createElement("a");
    hub.className = "sister-nav__item sister-nav__item--hub";
    hub.href = BASE;
    hub.setAttribute("role", "menuitem");
    hub.textContent = "全部课程总览 →";
    panel.appendChild(hub);

    function close() {
      panel.hidden = true;
      button.setAttribute("aria-expanded", "false");
      document.removeEventListener("click", onDocClick);
    }
    function onDocClick(e) {
      if (!nav.contains(e.target)) close();
    }
    button.addEventListener("click", function (e) {
      e.stopPropagation();
      var open = panel.hidden;
      panel.hidden = !open;
      button.setAttribute("aria-expanded", open ? "true" : "false");
      if (open) {
        document.addEventListener("click", onDocClick);
      } else {
        document.removeEventListener("click", onDocClick);
      }
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !panel.hidden) { close(); button.focus(); }
    });

    nav.appendChild(button);
    nav.appendChild(panel);

    /* 插到 Material 顶栏标题之后；非 Material 页面则右上角悬浮 */
    var headerInner = document.querySelector(".md-header__inner");
    if (headerInner) {
      var title = headerInner.querySelector(".md-header__title");
      if (title && title.nextSibling) headerInner.insertBefore(nav, title.nextSibling);
      else headerInner.appendChild(nav);
    } else {
      nav.classList.add("sister-nav--fallback");
      document.body.appendChild(nav);
    }
  }

  var cached = null;
  function init() {
    if (cached) { build(cached); return; }
    var url = BASE + "sites.json";
    var tries = 0;
    (function attempt() {
      tries++;
      var ctrl = ("AbortController" in window) ? new AbortController() : null;
      var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, 4000) : null;
      fetch(url, ctrl ? { signal: ctrl.signal } : {})
        .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
        .then(function (data) {
          if (timer) clearTimeout(timer);
          if (data && data.sites && data.sites.length) { cached = data.sites; build(cached); }
        })
        .catch(function () {
          if (timer) clearTimeout(timer);
          if (tries < 2) attempt();
          /* 两次都失败则静默不渲染：导航缺失好过挂一个坏菜单 */
        });
    })();
  }

  function ready(fn) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn);
    else fn();
  }
  ready(init);

  /* Material instant navigation（若开启）切页后重新挂载 */
  try {
    if (window.document$ && typeof window.document$.subscribe === "function") {
      window.document$.subscribe(function () {
        if (!document.querySelector("[data-sister-nav]")) init();
      });
    }
  } catch (e) { /* ignore */ }
})();
