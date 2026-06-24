import type { ExplorerState, ViewMode } from "./types";
import { escapeHtml, formatCell, layoutNodes, shorten, unique } from "./utils";

export function renderExplorer(state: ExplorerState) {
  return `
    <section class="summary">
      <div class="summary-title">
        <span class="mark" aria-hidden="true">C</span>
        <div>
          <p class="eyebrow">CellarScope</p>
          <h1>${escapeHtml(state.title)}</h1>
        </div>
      </div>
      <div class="stats">
        <span>${state.rowCount} rows</span>
        <span>${state.nodes.length} nodes</span>
        <span>${state.edges.length} edges</span>
      </div>
    </section>
    ${state.error ? `<p class="error">${escapeHtml(state.error)}</p>` : ""}
    <div class="toolbar">
      <nav class="tabs" aria-label="Views">
        ${tab(state, "table", "Table")}
        ${tab(state, "network", "Network")}
      </nav>
      <button class="ghost" data-action="expand">${state.expanded ? "Collapse" : "Expand"}</button>
    </div>
    <section class="query-panel" aria-label="Generated SPARQL">
      <details>
        <summary><span>Generated SPARQL</span><span>${state.query ? "available" : "empty"}</span></summary>
        <textarea id="sparql" spellcheck="false">${escapeHtml(state.query)}</textarea>
        <div class="query-actions">
          <button data-action="run">Run</button>
        </div>
      </details>
    </section>
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
  if (state.view === "network") return renderNetwork(state);
  return renderTable(state);
}

function renderTable(state: ExplorerState) {
  const vars = (state.variables.length ? state.variables : Object.keys(state.rows[0] ?? {})).slice(0, 8);
  if (!state.rows.length) return `<div class="empty">No rows yet.</div>`;
  return `<div class="table-wrap"><table><thead><tr>${vars
    .map((key) => `<th>${escapeHtml(key)}</th>`)
    .join("")}</tr></thead><tbody>${state.rows
    .map((row) => `<tr>${vars.map((key) => `<td>${formatCell(row[key])}</td>`).join("")}</tr>`)
    .join("")}</tbody></table></div>`;
}

function renderNetwork(state: ExplorerState) {
  if (!state.nodes.length) return `<div class="empty">No source/target-style bindings found.</div>`;
  const width = 760;
  const height = 430;
  const positions = layoutNodes(state.nodes, width, height);
  const showEdgeLabels = state.edges.length <= 12;
  const showNodeLabels = state.nodes.length <= 14;
  return `<svg class="network" viewBox="0 0 ${width} ${height}" role="img" aria-label="Cellar relation network">
    <defs>
      <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
        <path d="M 0 0 L 10 5 L 0 10 z"></path>
      </marker>
    </defs>
    ${state.edges
      .map((edge) => {
        const a = positions.get(edge.source);
        const b = positions.get(edge.target);
        if (!a || !b) return "";
        const label = showEdgeLabels
          ? `<text x="${Math.round((a.x + b.x) / 2)}" y="${Math.round((a.y + b.y) / 2)}">${escapeHtml(edge.label)}</text>`
          : "";
        return `<g class="edge">
          <line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}"><title>${escapeHtml(edge.label)}</title></line>
          ${label}
        </g>`;
      })
      .join("")}
    ${state.nodes
      .map((node, index) => {
        const point = positions.get(node.id);
        if (!point) return "";
        const label = showNodeLabels || index === 0
          ? `<text x="${point.x + 12}" y="${point.y + 4}">${escapeHtml(shorten(node.label, 56))}</text>`
          : "";
        return `<g class="node ${escapeHtml(node.kind)} ${index === 0 ? "anchor" : ""}" data-open="${escapeHtml(node.url ?? "")}">
          <circle cx="${point.x}" cy="${point.y}" r="9"></circle>
          <title>${escapeHtml(node.label)}</title>
          ${label}
        </g>`;
      })
      .join("")}
  </svg>`;
}

function renderInspector(state: ExplorerState) {
  const vars = state.variables.length ? state.variables : Object.keys(state.rows[0] ?? {});
  const relations = unique(state.edges.map((edge) => edge.label));
  return `<h2>Context</h2>
    <dl>
      <dt>View</dt><dd>${escapeHtml(state.view)}</dd>
      <dt>Variables</dt><dd>${escapeHtml(vars.join(", ") || "none")}</dd>
      <dt>Relations</dt><dd>${escapeHtml(relations.join(", ") || "none")}</dd>
    </dl>
    <div class="links">${renderLinks(state)}</div>`;
}

function renderLinks(state: ExplorerState) {
  const urls = unique([
    ...state.rows.flatMap((row) => Object.values(row).filter((value) => /^https?:\/\//.test(value))),
    ...state.nodes.flatMap((node) => node.url ?? []),
  ]).slice(0, 8);
  if (!urls.length) return "";
  return `<h3>Sources</h3>${urls.map((url) => `<button data-open="${escapeHtml(url)}">${escapeHtml(shorten(url, 72))}</button>`).join("")}`;
}
