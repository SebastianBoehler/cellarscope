import type { CellarQueryResult, FlatRow, GraphEdge, GraphNode, QueryResultKind } from "../types.js";

const SOURCE_KEYS = ["source", "work", "from", "uri", "subject"];
const TARGET_KEYS = ["target", "cited_work", "related", "to", "object"];
const LABEL_KEYS = ["relation", "predicate", "edge", "type"];
const SOURCE_LABEL_KEYS = ["source_title", "source_label", "source_celex", "title", "celex"];
const TARGET_LABEL_KEYS = ["target_title", "cited_title", "target_label", "target_celex", "cited_celex"];

export function buildQueryResult(args: {
  query: string;
  resultKind: QueryResultKind;
  rows: FlatRow[];
  variables: string[];
}): CellarQueryResult {
  const { nodes, edges } = normalizeGraph(args.rows);
  return {
    ...args,
    title: args.resultKind === "network" ? "Cellar relation network" : "Cellar query result",
    rowCount: args.rows.length,
    nodes,
    edges,
  };
}

export function normalizeGraph(rows: FlatRow[]): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const nodeMap = new Map<string, GraphNode>();
  const edgeMap = new Map<string, GraphEdge>();

  for (const row of rows) {
    const source = first(row, SOURCE_KEYS);
    const target = first(row, TARGET_KEYS);
    const label = first(row, LABEL_KEYS) ?? "RELATED";

    if (source) addNode(nodeMap, source, labelFor(row, source, SOURCE_LABEL_KEYS));
    if (target) addNode(nodeMap, target, labelFor(row, target, TARGET_LABEL_KEYS));
    if (source && target) {
      const key = `${source}|${target}|${label}`;
      edgeMap.set(key, { source, target, label: shortLabel(label) });
    }
  }

  return {
    nodes: [...nodeMap.values()].slice(0, 120),
    edges: [...edgeMap.values()].slice(0, 180),
  };
}

function addNode(map: Map<string, GraphNode>, id: string, label: string): void {
  if (map.has(id)) return;
  map.set(id, {
    id,
    label: shorten(label),
    kind: kindFor(id),
    url: id.startsWith("http") ? id : undefined,
  });
}

function first(row: FlatRow, keys: string[]): string | undefined {
  for (const key of keys) {
    if (row[key]) return row[key];
  }
  return undefined;
}

function labelFor(row: FlatRow, id: string, keys: string[]): string {
  return first(row, keys) ?? resourceLabel(id);
}

function resourceLabel(value: string): string {
  const celex = value.match(/\/celex\/([^/?#]+)/i)?.[1];
  if (celex) return celex;

  if (/^[0-9][0-9A-Z()]+$/.test(value)) return value;

  const cellar = value.match(/\/cellar\/([^/?#]+)/i)?.[1];
  if (cellar) return `Cellar ${cellar.slice(0, 8)}`;

  return value.replace(/^.*[#/]/, "") || value;
}

function kindFor(id: string): string {
  if (/celex/i.test(id) || /^[0-9][0-9A-Z()]+$/.test(id)) return "celex";
  if (/concept/i.test(id)) return "concept";
  if (/agent|authority/i.test(id)) return "agent";
  return "work";
}

function shortLabel(value: string): string {
  return value.replace(/^.*[#/]/, "").replace(/^work_/, "").replace(/_work$/, "").toUpperCase();
}

function shorten(value: string): string {
  return value.length > 90 ? `${value.slice(0, 87)}...` : value;
}
