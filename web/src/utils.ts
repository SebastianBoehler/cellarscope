import type { ExplorerState, GraphNode } from "./types";

export function normalizeState(input?: Partial<ExplorerState>): ExplorerState {
  return {
    view: input?.view ?? "table",
    title: input?.title ?? "Cellar query result",
    query: input?.query ?? sampleQuery(),
    rows: input?.rows ?? [],
    variables: input?.variables ?? Object.keys(input?.rows?.[0] ?? {}),
    rowCount: input?.rowCount ?? input?.rows?.length ?? 0,
    nodes: input?.nodes ?? [],
    edges: input?.edges ?? [],
    expanded: input?.expanded ?? false,
    error: input?.error,
  };
}

function sampleQuery() {
  return `SELECT DISTINCT ?work ?celex ?title ?date
WHERE {
  ?work cdm:resource_legal_id_celex ?celex .
  ?expr cdm:expression_belongs_to_work ?work ;
        cdm:expression_uses_language <http://publications.europa.eu/resource/authority/language/ENG> ;
        cdm:expression_title ?title .
  OPTIONAL { ?work cdm:work_date_document ?date . }
  FILTER(CONTAINS(LCASE(STR(?title)), "artificial intelligence"))
}
ORDER BY DESC(?date)
LIMIT 25`;
}

export function layoutNodes(nodes: GraphNode[], width: number, height: number) {
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) * 0.36;
  const map = new Map<string, { x: number; y: number }>();
  const [anchor, ...rest] = nodes;

  if (anchor) map.set(anchor.id, { x: centerX, y: centerY });

  rest.forEach((node, index) => {
    const angle = (Math.PI * 2 * index) / Math.max(rest.length, 1);
    map.set(node.id, {
      x: Math.round(centerX + Math.cos(angle) * radius),
      y: Math.round(centerY + Math.sin(angle) * radius),
    });
  });

  return map;
}

export function formatCell(value = "") {
  if (/^https?:\/\//.test(value)) {
    return `<button class="linklike" data-open="${escapeHtml(value)}">${escapeHtml(shorten(value, 64))}</button>`;
  }
  return escapeHtml(shorten(value, 140));
}

export function unique(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

export function shorten(value: string, limit: number) {
  return value.length > limit ? `${value.slice(0, limit - 3)}...` : value;
}

export function escapeHtml(value = "") {
  return value.replace(/[&<>"']/g, (char) => {
    const map: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
    return map[char] ?? char;
  });
}
