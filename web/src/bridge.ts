import type { ExplorerState, ToolResult } from "./types";

type PendingRequest = {
  resolve: (value: ToolResult) => void;
  reject: (reason: unknown) => void;
};

let rpcId = 0;
const pending = new Map<number, PendingRequest>();

export type BridgeSource = "tool-result" | "globals";

export function initBridge(onToolResult: (result: ToolResult, source: BridgeSource) => void) {
  window.addEventListener(
    "message",
    (event) => {
      if (event.source !== window.parent) return;
      const message = event.data;
      if (!message || message.jsonrpc !== "2.0") return;

      if (typeof message.id === "number") {
        const request = pending.get(message.id);
        if (!request) return;
        pending.delete(message.id);
        message.error ? request.reject(message.error) : request.resolve(message.result);
        return;
      }

      if (message.method === "ui/notifications/tool-result") {
        onToolResult(message.params as ToolResult, "tool-result");
      }
    },
    { passive: true },
  );

  window.addEventListener(
    "openai:set_globals",
    (event) => {
      const detail = (event as CustomEvent<{ globals?: Window["openai"] }>).detail;
      const globals = detail?.globals ?? window.openai;
      onToolResult(
        {
          structuredContent: initialExplorerState(globals),
          _meta: globals?.toolResponseMetadata,
        },
        "globals",
      );
    },
    { passive: true },
  );
}

export async function callTool(name: string, args: Record<string, unknown>): Promise<ToolResult> {
  if (window.openai?.callTool) return window.openai.callTool(name, args);
  return rpcRequest("tools/call", { name, arguments: args });
}

function rpcRequest(method: string, params: Record<string, unknown>): Promise<ToolResult> {
  return new Promise((resolve, reject) => {
    const id = ++rpcId;
    pending.set(id, { resolve, reject });
    window.parent.postMessage({ jsonrpc: "2.0", id, method, params }, "*");
  });
}

export function initialExplorerState(globals = window.openai): Partial<ExplorerState> | undefined {
  return asExplorer(globals?.toolOutput) ?? asExplorer(globals?.toolResponseMetadata?.explorer);
}

function asExplorer(value: unknown): Partial<ExplorerState> | undefined {
  if (!value || typeof value !== "object") return undefined;
  const candidate = value as Partial<ExplorerState>;
  if (typeof candidate.view === "string" || Array.isArray(candidate.nodes) || Array.isArray(candidate.rows)) {
    return candidate;
  }
  return undefined;
}
