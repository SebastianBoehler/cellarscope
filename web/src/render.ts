import type { ExplorerState, ViewMode } from "./types";
import { escapeHtml, formatCell, layoutNodes, shorten, unique } from "./utils";

export function renderExplorer(state: ExplorerState) {
  return `
    <section class="topbar">
      <div>
        <p class="eyebrow">CellarScope</p>
        <h1>${escapeHtml(state.purpose)}</h1>
      </div>
      <div class="stats">
        <span>${state.rowCount} rows</span>
        <span>${state.nodes.length} nodes</span>
        <span>${state.edges.length} edges</span>
      </div>
    </section>
    ${state.error ? `<p class="error">${escapeHtml(state.error)}</p>` : ""}
    <section class="query-panel">
      <details>
        <summary>SPARQL</summary>
        <textarea id="sparql" spellcheck="false">${escapeHtml(state.query)}</textarea>
        <div class="query-actions">
          <button data-action="run">Run</button>
          <button data-action="fullscreen">Fullscreen</button>
        </div>
      </details>
    </section>
    <nav class="tabs" aria-label="Views">
      ${tab(state, "table", "Table")}
      ${tab(state, "cards", "Cards")}
      ${tab(state, "timeline", "Timeline")}
      ${tab(state, "network", "Network")}
    </nav>
    <section class="workspace">
      <div class="main-pane">${renderMain(state)}</div>
      <aside class="inspector">${renderInspector(state)}</aside>
    </section>`;
}

function tab(state: ExplorerState, view: ViewMode, label: string) {
  const selected = state.view === view ? "true" : "false";
  return `<button data-view="${view}" aria-selected="${selected}">${label}</button>`;
}

function renderMain(state: ExplorerState) {
  if (state.view === "cards") return renderCards(state);
  if (state.view === "timeline") return renderTimeline(state);
  if (state.view === "network") return renderNetwork(state);
  return renderTable(state);
}

function renderTable(state: ExplorerState) {
  const vars = state.variables.length ? state.variables : Object.keys(state.rows[0] ?? {});
  if (!state.rows.length) return `<div class="empty">No rows yet.</div>`;
  return `<div class="table-wrap"><table><thead><tr>${vars
    .map((key) => `<th>${escapeHtml(key)}</th>`)
    .join("")}</tr></thead><tbody>${state.rows
    .map((row) => `<tr>${vars.map((key) => `<td>${formatCell(row[key])}</td>`).join("")}</tr>`)
    .join("")}</tbody></table></div>`;
}

function renderCards(state: ExplorerState) {
  if (!state.rows.length) return `<div class="empty">No records yet.</div>`;
  return `<div class="cards">${state.rows
    .slice(0, 30)
    .map((row) => {
      const title = row.title ?? row.celex ?? row.work ?? row.uri ?? "Cellar record";
      const date = row.date ?? row.workdatedoc ?? "";
      const href = row.work ?? row.uri ?? row.item ?? "";
      return `<article class="card">
        <h2>${escapeHtml(title)}</h2>
        <p>${escapeHtml([row.celex, date].filter(Boolean).join(" | "))}</p>
        ${href ? `<button data-open="${escapeHtml(href)}">Open source</button>` : ""}
      </article>`;
    })
    .join("")}</div>`;
}

function renderTimeline(state: ExplorerState) {
  const dated = state.rows
    .filter((row) => row.date || row.workdatedoc)
    .sort((a, b) => String(a.date ?? a.workdatedoc).localeCompare(String(b.date ?? b.workdatedoc)));
  if (!dated.length) return `<div class="empty">No date fields in this result.</div>`;
  return `<ol class="timeline">${dated
    .map((row) => `<li><time>${escapeHtml(row.date ?? row.workdatedoc)}</time><span>${escapeHtml(row.title ?? row.celex ?? row.work ?? "Cellar record")}</span></li>`)
    .join("")}</ol>`;
}

function renderNetwork(state: ExplorerState) {
  if (!state.nodes.length) return `<div class="empty">No source/target-style bindings found.</div>`;
  const width = 760;
  const height = 460;
  const positions = layoutNodes(state.nodes, width, height);
  return `<svg class="network" viewBox="0 0 ${width} ${height}" role="img">
    ${state.edges
      .map((edge) => {
        const a = positions.get(edge.source);
        const b = positions.get(edge.target);
        if (!a || !b) return "";
        return `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}"><title>${escapeHtml(edge.label)}</title></line>`;
      })
      .join("")}
    ${state.nodes
      .map((node) => {
        const point = positions.get(node.id);
        if (!point) return "";
        return `<g class="node" data-open="${escapeHtml(node.url ?? "")}">
          <circle cx="${point.x}" cy="${point.y}" r="9"></circle>
          <text x="${point.x + 12}" y="${point.y + 4}">${escapeHtml(node.label)}</text>
        </g>`;
      })
      .join("")}
  </svg>`;
}

function renderInspector(state: ExplorerState) {
  const vars = state.variables.length ? state.variables : Object.keys(state.rows[0] ?? {});
  return `<h2>Inspector</h2>
    <dl>
      <dt>View</dt><dd>${escapeHtml(state.view)}</dd>
      <dt>Variables</dt><dd>${escapeHtml(vars.join(", ") || "none")}</dd>
      <dt>Relations</dt><dd>${escapeHtml(unique(state.edges.map((edge) => edge.label)).join(", ") || "none")}</dd>
    </dl>
    <div class="links">${renderLinks(state)}</div>`;
}

function renderLinks(state: ExplorerState) {
  const urls = unique(state.rows.flatMap((row) => Object.values(row).filter((value) => /^https?:\/\//.test(value)))).slice(0, 10);
  if (!urls.length) return "";
  return `<h3>Sources</h3>${urls.map((url) => `<button data-open="${escapeHtml(url)}">${escapeHtml(shorten(url, 72))}</button>`).join("")}`;
}
