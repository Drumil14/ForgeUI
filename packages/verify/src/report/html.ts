import type { VerifyReport } from "../types.js";

export interface HtmlReportInput {
  report: VerifyReport;
  /** data: URL of the full-page screenshot, or null when unavailable. */
  screenshotDataUrl: string | null;
  /** Full document dimensions the boxes are measured against. */
  pageWidth: number;
  pageHeight: number;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Render the self-contained visual report. Everything (styles, script, data,
 * and the screenshot) is inlined so the single .html file is portable — open it
 * anywhere, no server required.
 */
export function renderHtml(input: HtmlReportInput): string {
  const { report, screenshotDataUrl, pageWidth, pageHeight } = input;
  const data = {
    report,
    screenshot: screenshotDataUrl,
    pageWidth,
    pageHeight,
  };
  const dataJson = JSON.stringify(data).replace(/</g, "\\u003c");
  const s = report.summary;

  return `<!doctype html>
<html lang="en" data-theme="dark">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>ForgeUI Verify — ${escapeHtml(report.url)}</title>
<style>
  :root {
    --bg: #0a0a0a; --panel: #121212; --panel-2: #171717;
    --border: #262626; --border-strong: #3a3a3a;
    --fg: #f5f5f4; --fg-muted: #a3a3a3; --fg-subtle: #737373;
    --accent: #ff6e46; --accent-fg: #111;
    --error: #f05c5c; --warning: #ebaa3c; --info: #5aa9ff;
    --radius: 10px;
    --font: "Inter", system-ui, -apple-system, "Segoe UI", sans-serif;
    --mono: "JetBrains Mono", ui-monospace, "SF Mono", Menlo, monospace;
  }
  [data-theme="light"] {
    --bg: #fcfcfb; --panel: #fff; --panel-2: #f6f6f4;
    --border: #e5e5e2; --border-strong: #d1d1cd;
    --fg: #111; --fg-muted: #5b5b58; --fg-subtle: #8a8a86;
    --accent: #e84e27; --accent-fg: #fff;
    --error: #c42424; --warning: #b26e10; --info: #2563eb;
  }
  * { box-sizing: border-box; }
  html, body { margin: 0; height: 100%; }
  body {
    background: var(--bg); color: var(--fg);
    font-family: var(--font); font-size: 14px; line-height: 1.5;
    -webkit-font-smoothing: antialiased;
  }
  header {
    display: flex; align-items: center; gap: 16px;
    padding: 14px 20px; border-bottom: 1px solid var(--border);
    background: var(--panel); position: sticky; top: 0; z-index: 20;
  }
  .brand { display: flex; align-items: center; gap: 10px; font-weight: 650; }
  .logo {
    width: 26px; height: 26px; border-radius: 7px; flex: none;
    background: linear-gradient(135deg, var(--accent), #ff9f7a);
    display: grid; place-items: center; color: var(--accent-fg);
    font-weight: 800; font-size: 15px;
  }
  .meta { color: var(--fg-muted); font-size: 12.5px; }
  .meta code { font-family: var(--mono); color: var(--fg); }
  .spacer { flex: 1; }
  .chips { display: flex; gap: 8px; align-items: center; }
  .chip {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 4px 10px; border-radius: 999px; font-size: 12px; font-weight: 600;
    border: 1px solid var(--border-strong);
  }
  .chip .dot { width: 8px; height: 8px; border-radius: 50%; }
  .chip.error .dot { background: var(--error); }
  .chip.warning .dot { background: var(--warning); }
  .chip.info .dot { background: var(--info); }
  .chip.budget-pass { color: var(--info); border-color: var(--info); }
  .chip.budget-fail { color: var(--error); border-color: var(--error); }
  .theme-toggle {
    background: var(--panel-2); border: 1px solid var(--border-strong);
    color: var(--fg); border-radius: 8px; padding: 6px 10px; cursor: pointer;
    font-size: 13px;
  }
  main { display: grid; grid-template-columns: 380px 1fr; height: calc(100% - 57px); }
  @media (max-width: 900px) { main { grid-template-columns: 1fr; height: auto; } }
  .sidebar {
    border-right: 1px solid var(--border); background: var(--panel);
    overflow-y: auto; padding: 16px;
  }
  .filters { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; }
  .filter {
    display: inline-flex; align-items: center; gap: 6px; cursor: pointer;
    padding: 5px 10px; border-radius: 8px; font-size: 12.5px; font-weight: 600;
    border: 1px solid var(--border-strong); background: var(--panel-2);
    user-select: none;
  }
  .filter input { accent-color: var(--accent); }
  .filter.off { opacity: 0.45; }
  .group-title {
    font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em;
    color: var(--fg-subtle); font-family: var(--mono);
    margin: 18px 0 8px; display: flex; align-items: center; gap: 8px;
  }
  .group-title .count {
    background: var(--panel-2); border: 1px solid var(--border);
    border-radius: 999px; padding: 1px 7px; font-size: 10.5px; color: var(--fg-muted);
  }
  .v {
    border: 1px solid var(--border); border-left-width: 3px;
    background: var(--panel-2); border-radius: 8px; padding: 10px 12px;
    margin-bottom: 8px; cursor: pointer; transition: border-color .12s, transform .06s;
  }
  .v:hover { border-color: var(--border-strong); }
  .v.active { border-color: var(--accent); box-shadow: 0 0 0 1px var(--accent); }
  .v.error { border-left-color: var(--error); }
  .v.warning { border-left-color: var(--warning); }
  .v.info { border-left-color: var(--info); }
  .v .row1 { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
  .v .prop { font-family: var(--mono); font-size: 12px; color: var(--fg); font-weight: 600; }
  .v .sev { font-size: 10px; text-transform: uppercase; letter-spacing: .05em; font-weight: 700; }
  .v.error .sev { color: var(--error); }
  .v.warning .sev { color: var(--warning); }
  .v.info .sev { color: var(--info); }
  .v .msg { color: var(--fg-muted); font-size: 12.5px; margin-top: 4px; }
  .v .sel { font-family: var(--mono); font-size: 11px; color: var(--fg-subtle); margin-top: 6px; word-break: break-all; }
  .empty { color: var(--fg-subtle); text-align: center; padding: 40px 10px; }
  .stage-wrap { overflow: auto; background:
     repeating-conic-gradient(var(--panel-2) 0% 25%, transparent 0% 50%) 50% / 20px 20px; padding: 24px; }
  .stage { position: relative; margin: 0 auto; background: var(--panel);
    box-shadow: 0 10px 40px rgba(0,0,0,.4); }
  .stage img { display: block; width: 100%; height: auto; }
  .stage .placeholder {
    display: grid; place-items: center; color: var(--fg-subtle);
    background: linear-gradient(135deg, var(--panel-2), var(--panel));
    text-align: center; font-size: 13px;
  }
  .overlay {
    position: absolute; border: 2px solid transparent; border-radius: 3px;
    cursor: pointer; transition: background .12s;
  }
  .overlay.error { border-color: var(--error); background: rgba(240,92,92,.12); }
  .overlay.warning { border-color: var(--warning); background: rgba(235,170,60,.12); }
  .overlay.info { border-color: var(--info); background: rgba(90,169,255,.12); }
  .overlay.active { background: rgba(255,110,70,.28); border-color: var(--accent); box-shadow: 0 0 0 2px var(--accent); z-index: 5; }
  .overlay .tag {
    position: absolute; top: -18px; left: -2px; font-size: 10px; font-family: var(--mono);
    background: var(--accent); color: var(--accent-fg); padding: 1px 5px; border-radius: 4px;
    white-space: nowrap; opacity: 0; transition: opacity .12s; pointer-events: none;
  }
  .overlay:hover .tag, .overlay.active .tag { opacity: 1; }
</style>
</head>
<body>
<header>
  <div class="brand"><span class="logo">F</span> ForgeUI Verify</div>
  <div class="meta">
    <span>${escapeHtml(report.url)}</span> ·
    file <code>${escapeHtml(report.fileKey)}</code> ·
    ${s.elementsChecked} elements
  </div>
  <div class="spacer"></div>
  <div class="chips">
    <span class="chip error"><span class="dot"></span>${s.errors} errors</span>
    <span class="chip warning"><span class="dot"></span>${s.warnings} warnings</span>
    <span class="chip info"><span class="dot"></span>${s.infos} info</span>
    <span class="chip ${s.overBudget ? "budget-fail" : "budget-pass"}">
      ${s.overBudget ? "✗ over budget" : "✓ within budget"} (${report.config.budget})
    </span>
    <button class="theme-toggle" id="themeToggle">◐ Theme</button>
  </div>
</header>
<main>
  <aside class="sidebar">
    <div class="filters" id="filters">
      <label class="filter" data-sev="error"><input type="checkbox" checked /> Errors</label>
      <label class="filter" data-sev="warning"><input type="checkbox" checked /> Warnings</label>
      <label class="filter" data-sev="info"><input type="checkbox" checked /> Info</label>
    </div>
    <div id="list"></div>
  </aside>
  <section class="stage-wrap">
    <div class="stage" id="stage"></div>
  </section>
</main>
<script id="report-data" type="application/json">${dataJson}</script>
<script>
(function () {
  var payload = JSON.parse(document.getElementById("report-data").textContent);
  var report = payload.report;
  var violations = report.violations;
  var pageW = payload.pageWidth || report.viewport.width;
  var pageH = payload.pageHeight || report.viewport.height;
  var active = new Set(["error", "warning", "info"]);
  var selected = null;

  var TYPE_LABELS = { spacing: "Spacing", radius: "Radius", "font-size": "Type scale", color: "Color", contrast: "Contrast" };

  // ---- Stage + overlays -------------------------------------------------
  var stage = document.getElementById("stage");
  stage.style.width = pageW + "px";
  if (payload.screenshot) {
    var img = document.createElement("img");
    img.src = payload.screenshot;
    stage.appendChild(img);
  } else {
    var ph = document.createElement("div");
    ph.className = "placeholder";
    ph.style.width = pageW + "px";
    ph.style.height = pageH + "px";
    ph.textContent = "Screenshot unavailable — overlays are positioned on the page grid.";
    stage.appendChild(ph);
  }

  var overlays = {};
  violations.forEach(function (v) {
    var o = document.createElement("div");
    o.className = "overlay " + v.severity;
    o.style.left = (v.box.x / pageW * 100) + "%";
    o.style.top = (v.box.y / pageH * 100) + "%";
    o.style.width = Math.max(v.box.width / pageW * 100, 0.4) + "%";
    o.style.height = Math.max(v.box.height / pageH * 100, 0.4) + "%";
    o.title = v.message;
    var tag = document.createElement("span");
    tag.className = "tag";
    tag.textContent = v.property + ": " + v.found;
    o.appendChild(tag);
    o.addEventListener("click", function () { select(v.id, true); });
    stage.appendChild(o);
    overlays[v.id] = o;
  });

  // ---- Sidebar list -----------------------------------------------------
  var list = document.getElementById("list");
  function render() {
    list.innerHTML = "";
    var visible = violations.filter(function (v) { return active.has(v.severity); });
    if (visible.length === 0) {
      var e = document.createElement("div");
      e.className = "empty";
      e.textContent = violations.length === 0
        ? "No violations — this page matches its design tokens. 🎉"
        : "No violations match the active filters.";
      list.appendChild(e);
    }
    var order = ["contrast", "color", "font-size", "spacing", "radius"];
    order.forEach(function (type) {
      var items = visible.filter(function (v) { return v.type === type; });
      if (items.length === 0) return;
      var gt = document.createElement("div");
      gt.className = "group-title";
      gt.innerHTML = TYPE_LABELS[type] + ' <span class="count">' + items.length + "</span>";
      list.appendChild(gt);
      items.forEach(function (v) {
        var el = document.createElement("div");
        el.className = "v " + v.severity + (v.id === selected ? " active" : "");
        el.id = "item-" + v.id;
        el.innerHTML =
          '<div class="row1"><span class="prop">' + esc(v.property) + '</span>' +
          '<span class="sev">' + v.severity + "</span></div>" +
          '<div class="msg">' + esc(v.message) + "</div>" +
          '<div class="sel">' + esc(v.selector) + "</div>";
        el.addEventListener("click", function () { select(v.id, false); });
        list.appendChild(el);
      });
    });
    // Sync overlay visibility with filters.
    violations.forEach(function (v) {
      if (overlays[v.id]) overlays[v.id].style.display = active.has(v.severity) ? "" : "none";
    });
  }

  function select(id, fromStage) {
    selected = id;
    Object.keys(overlays).forEach(function (k) { overlays[k].classList.toggle("active", k === id); });
    render();
    var item = document.getElementById("item-" + id);
    if (item && fromStage) item.scrollIntoView({ behavior: "smooth", block: "center" });
    if (!fromStage && overlays[id]) overlays[id].scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  // ---- Filters + theme --------------------------------------------------
  document.querySelectorAll(".filter").forEach(function (f) {
    var sev = f.getAttribute("data-sev");
    var box = f.querySelector("input");
    box.addEventListener("change", function () {
      if (box.checked) active.add(sev); else active.delete(sev);
      f.classList.toggle("off", !box.checked);
      render();
    });
  });
  document.getElementById("themeToggle").addEventListener("click", function () {
    var html = document.documentElement;
    html.setAttribute("data-theme", html.getAttribute("data-theme") === "dark" ? "light" : "dark");
  });

  render();
})();
</script>
</body>
</html>
`;
}
