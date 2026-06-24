export type JsonRecord = Record<string, unknown>;

export type CellarBinding = {
  type: string;
  value: string;
  datatype?: string;
  "xml:lang"?: string;
};

export type SparqlJson = {
  head: { vars: string[] };
  results: { bindings: Record<string, CellarBinding>[] };
};

export type FlatRow = Record<string, string>;

export type GraphNode = {
  id: string;
  label: string;
  kind: string;
  url?: string;
};

export type GraphEdge = {
  source: string;
  target: string;
  label: string;
};

export type QueryView = "table" | "network" | "timeline" | "cards";

export type QueryResultKind = "records" | "network" | "timeline";

export type CellarQueryResult = {
  purpose: string;
  query: string;
  resultKind: QueryResultKind;
  rows: FlatRow[];
  variables: string[];
  rowCount: number;
  nodes: GraphNode[];
  edges: GraphEdge[];
};

export type FetchDocument = {
  id: string;
  title: string;
  text: string;
  url: string;
  metadata?: Record<string, string>;
};

export type SearchResult = {
  id: string;
  title: string;
  url: string;
};
