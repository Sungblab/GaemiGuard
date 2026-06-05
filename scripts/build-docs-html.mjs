import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const outputPath = path.join(repoRoot, "docs", "gaemiguard-all-docs.html");

const categoryOrder = [
  "Overview",
  "Waterfall",
  "Stage Gates",
  "Research And Reviews",
  "Architecture",
  "Product Context",
  "Open Source And Setup",
  "External API And Sidecars",
  "Design",
  "Implementation Plans",
  "Vendor",
  "Raw Appendices",
];

const explicitMarkdownDocs = [
  "README.md",
  "AGENTS.md",
  "CHANGELOG.md",
  "CODE_OF_CONDUCT.md",
  "CONTRIBUTING.md",
  "gaemiguard-design-spec.md",
  "SECURITY.md",
  "THIRD_PARTY_NOTICES.md",
];

const rawAppendices = [
  "LICENSE",
  "NOTICE",
  "vendor/tossinvest/openapi-1.0.3.json",
  "docs/design/design-survey.html",
  "prototypes/index.html",
];

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === "dist") continue;
      files.push(...walk(fullPath));
    } else {
      files.push(fullPath);
    }
  }
  return files;
}

function normalizePath(filePath) {
  return filePath.split(path.sep).join("/");
}

function relativePath(filePath) {
  return normalizePath(path.relative(repoRoot, filePath));
}

function categoryFor(docPath) {
  if (
    docPath === "README.md" ||
    docPath === "gaemiguard-design-spec.md" ||
    docPath === "docs/development-status.md" ||
    docPath === "docs/roadmap.md"
  ) {
    return "Overview";
  }
  if (docPath.startsWith("docs/waterfall/")) return "Waterfall";
  if (docPath.startsWith("docs/stages/")) return "Stage Gates";
  if (docPath.startsWith("docs/research/") || docPath.startsWith("docs/reviews/")) return "Research And Reviews";
  if (docPath.startsWith("docs/architecture/")) return "Architecture";
  if (docPath === "docs/gaemiguard-product-context.md") return "Product Context";
  if (
    docPath === "AGENTS.md" ||
    docPath === "CHANGELOG.md" ||
    docPath === "CODE_OF_CONDUCT.md" ||
    docPath === "CONTRIBUTING.md" ||
    docPath === "SECURITY.md" ||
    docPath === "THIRD_PARTY_NOTICES.md" ||
    docPath.startsWith("docs/setup/")
  ) {
    return "Open Source And Setup";
  }
  if (docPath === "docs/toss-invest-openapi.md" || docPath === "docs/mirofish-sidecar-porting.md") {
    return "External API And Sidecars";
  }
  if (docPath.startsWith("docs/design/")) return "Design";
  if (docPath.startsWith("docs/superpowers/")) return "Implementation Plans";
  if (docPath.startsWith("vendor/")) return "Vendor";
  return "Product Context";
}

function titleForMarkdown(content, docPath) {
  const firstHeading = content.match(/^#\s+(.+)$/m);
  if (firstHeading) return stripInline(firstHeading[1].trim());
  return docPath.replace(/[-_]/g, " ").replace(/\.md$/, "");
}

function stripInline(text) {
  return text.replace(/[`*_~]/g, "").replace(/\[(.+?)\]\(.+?\)/g, "$1");
}

function sortDocs(a, b) {
  const categoryDelta = categoryOrder.indexOf(a.category) - categoryOrder.indexOf(b.category);
  if (categoryDelta !== 0) return categoryDelta;
  return a.path.localeCompare(b.path, "en");
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function inlineMarkdown(text) {
  const placeholders = [];
  const withCode = text.replace(/`([^`]+)`/g, (_, code) => {
    const token = `@@CODE_${placeholders.length}@@`;
    placeholders.push(`<code>${escapeHtml(code)}</code>`);
    return token;
  });

  let html = escapeHtml(withCode)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\[(.+?)\]\((.+?)\)/g, (_, label, href) => {
      const safeHref = escapeHtml(href);
      return `<a href="${safeHref}">${label}</a>`;
    });

  placeholders.forEach((replacement, index) => {
    html = html.replace(`@@CODE_${index}@@`, replacement);
  });

  return html;
}

function isTableSeparator(line) {
  return /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line);
}

function splitTableRow(line) {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

function slugFor(text, fallback) {
  const base = stripInline(text)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
  return base || fallback;
}

function markdownToHtml(markdown, docIndex) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const output = [];
  let inCode = false;
  let codeLang = "";
  let codeLines = [];
  let inUl = false;
  let inOl = false;
  let paragraph = [];

  const flushParagraph = () => {
    if (!paragraph.length) return;
    output.push(`<p>${inlineMarkdown(paragraph.join(" "))}</p>`);
    paragraph = [];
  };

  const closeLists = () => {
    if (inUl) {
      output.push("</ul>");
      inUl = false;
    }
    if (inOl) {
      output.push("</ol>");
      inOl = false;
    }
  };

  const flushCode = () => {
    const langClass = codeLang ? ` class="language-${escapeHtml(codeLang)}"` : "";
    const codeClass = codeLang === "mermaid" ? " mermaid-code" : "";
    output.push(`<pre class="code-block${codeClass}"><code${langClass}>${escapeHtml(codeLines.join("\n"))}</code></pre>`);
    codeLines = [];
    codeLang = "";
  };

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const fence = line.match(/^```(\S*)\s*$/);

    if (fence) {
      flushParagraph();
      closeLists();
      if (inCode) {
        flushCode();
        inCode = false;
      } else {
        inCode = true;
        codeLang = fence[1] || "";
        codeLines = [];
      }
      continue;
    }

    if (inCode) {
      codeLines.push(line);
      continue;
    }

    if (!line.trim()) {
      flushParagraph();
      closeLists();
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      flushParagraph();
      closeLists();
      const level = heading[1].length;
      const text = heading[2].trim();
      const id = `doc-${docIndex}-${slugFor(text, `heading-${index}`)}`;
      output.push(`<h${level} id="${id}">${inlineMarkdown(text)}</h${level}>`);
      continue;
    }

    if (line.includes("|") && lines[index + 1] && isTableSeparator(lines[index + 1])) {
      flushParagraph();
      closeLists();
      const headers = splitTableRow(line);
      index += 2;
      const rows = [];
      while (index < lines.length && lines[index].includes("|") && lines[index].trim()) {
        rows.push(splitTableRow(lines[index]));
        index += 1;
      }
      index -= 1;
      output.push("<div class=\"table-wrap\"><table><thead><tr>");
      output.push(headers.map((header) => `<th>${inlineMarkdown(header)}</th>`).join(""));
      output.push("</tr></thead><tbody>");
      for (const row of rows) {
        output.push("<tr>");
        output.push(row.map((cell) => `<td>${inlineMarkdown(cell)}</td>`).join(""));
        output.push("</tr>");
      }
      output.push("</tbody></table></div>");
      continue;
    }

    const unordered = line.match(/^\s*[-*]\s+(.+)$/);
    if (unordered) {
      flushParagraph();
      if (inOl) {
        output.push("</ol>");
        inOl = false;
      }
      if (!inUl) {
        output.push("<ul>");
        inUl = true;
      }
      output.push(`<li>${inlineMarkdown(unordered[1])}</li>`);
      continue;
    }

    const ordered = line.match(/^\s*\d+[.)]\s+(.+)$/);
    if (ordered) {
      flushParagraph();
      if (inUl) {
        output.push("</ul>");
        inUl = false;
      }
      if (!inOl) {
        output.push("<ol>");
        inOl = true;
      }
      output.push(`<li>${inlineMarkdown(ordered[1])}</li>`);
      continue;
    }

    const quote = line.match(/^>\s+(.+)$/);
    if (quote) {
      flushParagraph();
      closeLists();
      output.push(`<blockquote>${inlineMarkdown(quote[1])}</blockquote>`);
      continue;
    }

    paragraph.push(line.trim());
  }

  if (inCode) flushCode();
  flushParagraph();
  closeLists();
  return output.join("\n");
}

function bytesToKb(bytes) {
  return `${Math.round(bytes / 1024).toLocaleString("ko-KR")}KB`;
}

const markdownFiles = [
  ...explicitMarkdownDocs.map((docPath) => path.join(repoRoot, docPath)),
  ...walk(path.join(repoRoot, "docs")).filter((filePath) => filePath.endsWith(".md")),
  ...walk(path.join(repoRoot, "vendor")).filter((filePath) => filePath.endsWith(".md")),
];

const seen = new Set();
const docs = markdownFiles
  .filter((filePath) => {
    const docPath = relativePath(filePath);
    if (seen.has(docPath)) return false;
    seen.add(docPath);
    return true;
  })
  .map((filePath) => {
    const docPath = relativePath(filePath);
    const content = fs.readFileSync(filePath, "utf8");
    return {
      path: docPath,
      title: titleForMarkdown(content, docPath),
      category: categoryFor(docPath),
      content,
      bytes: Buffer.byteLength(content),
    };
  })
  .sort(sortDocs);

const appendices = rawAppendices
  .map((docPath) => path.join(repoRoot, docPath))
  .filter((filePath) => fs.existsSync(filePath))
  .map((filePath) => {
    const docPath = relativePath(filePath);
    const content = fs.readFileSync(filePath, "utf8");
    return {
      path: docPath,
      title: docPath,
      category: "Raw Appendices",
      content,
      bytes: Buffer.byteLength(content),
    };
  });

const generatedAt = new Date().toISOString();
const groupCounts = new Map();
for (const doc of [...docs, ...appendices]) {
  groupCounts.set(doc.category, (groupCounts.get(doc.category) || 0) + 1);
}

const nav = categoryOrder
  .filter((category) => groupCounts.has(category))
  .map((category) => {
    const items = [...docs, ...appendices]
      .map((doc, index) => ({ ...doc, index }))
      .filter((doc) => doc.category === category)
      .map((doc) => `<a href="#doc-${doc.index}"><span>${escapeHtml(doc.title)}</span><small>${escapeHtml(doc.path)}</small></a>`)
      .join("\n");
    return `<div class="nav-group"><button class="group-filter" data-filter="${escapeHtml(category)}">${escapeHtml(category)} <span>${groupCounts.get(category)}</span></button>${items}</div>`;
  })
  .join("\n");

const articles = docs
  .map((doc, index) => {
    const html = markdownToHtml(doc.content, index);
    return `<article class="doc-card" id="doc-${index}" data-category="${escapeHtml(doc.category)}" data-path="${escapeHtml(doc.path)}">
  <div class="doc-kicker">${escapeHtml(doc.category)} · ${escapeHtml(doc.path)} · ${bytesToKb(doc.bytes)}</div>
  <h2>${escapeHtml(doc.title)}</h2>
  ${html}
</article>`;
  })
  .join("\n");

const appendixStart = docs.length;
const appendixArticles = appendices
  .map((doc, appendixIndex) => {
    const index = appendixStart + appendixIndex;
    return `<article class="doc-card raw-card" id="doc-${index}" data-category="${escapeHtml(doc.category)}" data-path="${escapeHtml(doc.path)}">
  <div class="doc-kicker">${escapeHtml(doc.category)} · ${escapeHtml(doc.path)} · ${bytesToKb(doc.bytes)}</div>
  <h2>${escapeHtml(doc.title)}</h2>
  <p>원본 HTML/JSON 문서는 읽기 부담을 줄이기 위해 접힌 상태로 넣었습니다.</p>
  <details>
    <summary>원본 보기</summary>
    <pre class="code-block"><code>${escapeHtml(doc.content)}</code></pre>
  </details>
</article>`;
  })
  .join("\n");

const html = `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>GaemiGuard All Docs</title>
  <style>
    :root {
      color-scheme: light;
      --bg: #f7f8fa;
      --panel: #ffffff;
      --ink: #17202a;
      --muted: #687385;
      --line: #e5e8ee;
      --line-strong: #cfd6e3;
      --blue: #2878ff;
      --green: #00a86b;
      --red: #e84b5f;
      --amber: #b7791f;
      --shadow: 0 14px 34px rgba(15, 23, 42, 0.08);
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }

    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: var(--bg);
      color: var(--ink);
      letter-spacing: 0;
    }

    a { color: var(--blue); text-decoration: none; }
    a:hover { text-decoration: underline; }

    .app {
      display: grid;
      grid-template-columns: 320px minmax(0, 1fr);
      min-height: 100vh;
    }

    .sidebar {
      position: sticky;
      top: 0;
      height: 100vh;
      overflow: auto;
      background: #fbfcfe;
      border-right: 1px solid var(--line);
      padding: 20px 18px 28px;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 18px;
    }

    .mark {
      width: 28px;
      height: 28px;
      border-radius: 8px;
      background: linear-gradient(135deg, #111827, #2878ff);
      box-shadow: inset 0 0 0 1px rgba(255,255,255,.16);
    }

    .brand h1 {
      font-size: 18px;
      line-height: 1.2;
      margin: 0;
    }

    .brand p {
      margin: 2px 0 0;
      color: var(--muted);
      font-size: 12px;
    }

    .search {
      width: 100%;
      border: 1px solid var(--line-strong);
      border-radius: 8px;
      padding: 11px 12px;
      font-size: 14px;
      background: #fff;
      color: var(--ink);
    }

    .toolbar {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      margin: 10px 0 16px;
    }

    .toolbar button,
    .group-filter {
      border: 1px solid var(--line);
      background: #fff;
      color: var(--ink);
      border-radius: 8px;
      padding: 8px 10px;
      cursor: pointer;
      font-size: 12px;
      text-align: left;
    }

    .toolbar button:hover,
    .group-filter:hover {
      border-color: var(--blue);
    }

    .nav-group {
      margin: 0 0 14px;
    }

    .group-filter {
      width: 100%;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-weight: 700;
      margin-bottom: 6px;
    }

    .nav-group a {
      display: block;
      padding: 7px 8px;
      border-radius: 6px;
      color: var(--ink);
      text-decoration: none;
    }

    .nav-group a:hover {
      background: #eef5ff;
    }

    .nav-group span {
      display: block;
      font-size: 13px;
      line-height: 1.25;
    }

    .nav-group small {
      display: block;
      color: var(--muted);
      font-size: 11px;
      line-height: 1.25;
      margin-top: 2px;
      word-break: break-all;
    }

    .main {
      min-width: 0;
      padding: 26px 32px 56px;
    }

    .hero {
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 24px;
      box-shadow: var(--shadow);
      margin-bottom: 18px;
    }

    .hero h2 {
      margin: 0 0 8px;
      font-size: 30px;
      line-height: 1.15;
    }

    .hero p {
      color: var(--muted);
      margin: 0;
      max-width: 860px;
      line-height: 1.65;
    }

    .stats {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 16px;
    }

    .chip {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      border: 1px solid var(--line);
      border-radius: 999px;
      padding: 7px 10px;
      background: #fff;
      font-size: 12px;
      color: var(--muted);
    }

    .chip strong { color: var(--ink); }

    .doc-card {
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 24px;
      margin: 16px 0;
      box-shadow: 0 8px 22px rgba(15, 23, 42, 0.045);
      overflow: hidden;
    }

    .doc-card.hidden { display: none; }

    .doc-kicker {
      color: var(--muted);
      font-size: 12px;
      margin-bottom: 8px;
    }

    .doc-card h1 { font-size: 27px; margin-top: 12px; }
    .doc-card h2 { font-size: 23px; margin: 6px 0 16px; }
    .doc-card h3 { font-size: 18px; margin-top: 26px; }
    .doc-card h4 { font-size: 16px; margin-top: 22px; }
    .doc-card h5, .doc-card h6 { font-size: 14px; margin-top: 18px; }

    .doc-card p,
    .doc-card li {
      line-height: 1.72;
      color: #243142;
    }

    .doc-card ul,
    .doc-card ol {
      padding-left: 22px;
    }

    blockquote {
      margin: 14px 0;
      padding: 12px 14px;
      border-left: 4px solid var(--blue);
      background: #f4f8ff;
      color: #263b59;
    }

    .table-wrap {
      overflow: auto;
      border: 1px solid var(--line);
      border-radius: 8px;
      margin: 14px 0;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }

    th,
    td {
      border-bottom: 1px solid var(--line);
      padding: 10px 12px;
      vertical-align: top;
      text-align: left;
    }

    th {
      background: #f5f7fb;
      font-weight: 700;
    }

    tr:last-child td { border-bottom: 0; }

    code {
      background: #f1f4f8;
      border: 1px solid #e0e6ef;
      border-radius: 5px;
      padding: 1px 5px;
      font-family: "Cascadia Code", "SFMono-Regular", Consolas, monospace;
      font-size: .92em;
    }

    .code-block {
      overflow: auto;
      background: #101725;
      color: #d8e2f2;
      border-radius: 8px;
      padding: 14px;
      line-height: 1.55;
      font-size: 12px;
    }

    .code-block code {
      border: 0;
      background: transparent;
      color: inherit;
      padding: 0;
    }

    details {
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 12px;
      background: #fbfcfe;
    }

    summary {
      cursor: pointer;
      font-weight: 700;
    }

    .no-results {
      display: none;
      border: 1px dashed var(--line-strong);
      background: #fff;
      border-radius: 8px;
      padding: 18px;
      color: var(--muted);
    }

    .no-results.visible { display: block; }

    @media (max-width: 980px) {
      .app {
        grid-template-columns: 1fr;
      }

      .sidebar {
        position: static;
        height: auto;
        border-right: 0;
        border-bottom: 1px solid var(--line);
      }

      .main {
        padding: 18px 14px 36px;
      }
    }
  </style>
</head>
<body>
  <div class="app">
    <aside class="sidebar">
      <div class="brand">
        <div class="mark" aria-hidden="true"></div>
        <div>
          <h1>GaemiGuard Docs</h1>
          <p>single-file planning hub</p>
        </div>
      </div>
      <input id="search" class="search" type="search" placeholder="문서 제목, 경로, 내용 검색">
      <div class="toolbar">
        <button id="showAll" type="button">전체 보기</button>
        <button id="collapseRaw" type="button">원본 접기</button>
      </div>
      <nav>${nav}</nav>
    </aside>
    <main class="main">
      <section class="hero">
        <h2>GaemiGuard 전체 문서 모음</h2>
        <p>레포의 Markdown 기획 문서와 핵심 원본 부록을 한 파일에 모았습니다. 왼쪽 목차와 검색으로 워터폴 계획, Stage 게이트, 리서치, 아키텍처, 제품 문서를 바로 훑어볼 수 있습니다.</p>
        <div class="stats">
          <span class="chip"><strong>${docs.length}</strong> Markdown docs</span>
          <span class="chip"><strong>${appendices.length}</strong> raw appendices</span>
          <span class="chip">Generated <strong>${escapeHtml(generatedAt)}</strong></span>
          <span class="chip">Source <strong>GaemiGuard</strong></span>
        </div>
      </section>
      <div id="noResults" class="no-results">검색 결과가 없습니다.</div>
      ${articles}
      ${appendixArticles}
    </main>
  </div>
  <script>
    const search = document.getElementById("search");
    const cards = Array.from(document.querySelectorAll(".doc-card"));
    const noResults = document.getElementById("noResults");
    const showAll = document.getElementById("showAll");
    const collapseRaw = document.getElementById("collapseRaw");
    let activeCategory = "";

    function applyFilters() {
      const query = search.value.trim().toLowerCase();
      let visible = 0;
      for (const card of cards) {
        const matchesCategory = !activeCategory || card.dataset.category === activeCategory;
        const haystack = (card.textContent + " " + card.dataset.path + " " + card.dataset.category).toLowerCase();
        const matchesQuery = !query || haystack.includes(query);
        const shouldShow = matchesCategory && matchesQuery;
        card.classList.toggle("hidden", !shouldShow);
        if (shouldShow) visible += 1;
      }
      noResults.classList.toggle("visible", visible === 0);
    }

    search.addEventListener("input", applyFilters);

    document.querySelectorAll(".group-filter").forEach((button) => {
      button.addEventListener("click", () => {
        activeCategory = button.dataset.filter;
        applyFilters();
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    });

    showAll.addEventListener("click", () => {
      activeCategory = "";
      search.value = "";
      applyFilters();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    collapseRaw.addEventListener("click", () => {
      document.querySelectorAll(".raw-card details").forEach((details) => {
        details.open = false;
      });
    });
  </script>
</body>
</html>`;

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, html, "utf8");

console.log(`Wrote ${relativePath(outputPath)}`);
console.log(`Included ${docs.length} markdown docs and ${appendices.length} raw appendices.`);
