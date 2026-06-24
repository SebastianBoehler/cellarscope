export type FlatRow = Record<string, string>;
export type ViewMode = "table" | "cards" | "timeline" | "network";

export type GraphNode = { id: string; label: string; kind: string; url?: string };
export type GraphEdge = { source: string; target: string; label: string };

export type ExplorerState = {
  view: ViewMode;
  purpose: string;
  query: string;
  rows: FlatRow[];
  variables: string[];
  rowCount: number;
  nodes: GraphNode[];
  edges: GraphEdge[];
  error?: string;
};

export type ToolResult = {
  structuredContent?: Partial<ExplorerState> & { results?: unknown[] };
  _meta?: Record<string, unknown>;
};

declare global {
  interface Window {
    openai?: {
      toolOutput?: Partial<ExplorerState>;
      toolResponseMetadata?: Record<string, unknown>;
      widgetState?: Partial<ExplorerState>;
      callTool?: (name: string, args: Record<string, unknown>) => Promise<ToolResult>;
      openExternal?: (args: { href: string }) => Promise<void>;
      requestDisplayMode?: (args: { mode: "inline" | "fullscreen" | "pip" }) => Promise<void>;
      setWidgetState?: (state: Partial<ExplorerState>) => void;
      notifyIntrinsicHeight?: (height?: number) => void;
    };
  }
}
