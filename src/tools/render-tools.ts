import { registerAppTool } from "@modelcontextprotocol/ext-apps/server";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import { normalizeGraph } from "../cellar/normalize.js";
import { readOnlyAnnotations, runTool, textJson } from "../tool-runtime.js";
import { widgetUri } from "../widget-resources.js";

const rowSchema = z.record(z.string(), z.string());
const nodeSchema = z.object({
  id: z.string(),
  label: z.string(),
  kind: z.string(),
  url: z.string().optional(),
});
const edgeSchema = z.object({
  source: z.string(),
  target: z.string(),
  label: z.string(),
});

export function registerRenderTools(server: McpServer) {
  registerAppTool(
    server,
    "render_cellar_result",
    {
      title: "Render Cellar result",
      description:
        "Use this after run_cellar_sparql to show the result as an interactive table or graph. Prefer network when rows or normalized nodes include source, target, and relation.",
      inputSchema: {
        view: z.enum(["table", "network"]),
        query: z.string().optional(),
        rows: z.array(rowSchema).default([]),
        variables: z.array(z.string()).default([]),
        nodes: z.array(nodeSchema).default([]),
        edges: z.array(edgeSchema).default([]),
      },
      annotations: readOnlyAnnotations(),
      _meta: {
        ui: { resourceUri: widgetUri },
        "openai/outputTemplate": widgetUri,
        "openai/toolInvocation/invoking": "Rendering CellarScope...",
        "openai/toolInvocation/invoked": "CellarScope ready",
      },
    },
    async (args) =>
      runTool(async () => {
        const inferred = args.view === "network" && !args.nodes.length && !args.edges.length
          ? normalizeGraph(args.rows)
          : { nodes: args.nodes, edges: args.edges };
        const structuredContent = {
          view: args.view,
          title: args.view === "network" ? "Cellar relation network" : "Cellar query result",
          query: args.query ?? "",
          rows: args.rows,
          variables: args.variables,
          rowCount: args.rows.length,
          nodes: inferred.nodes,
          edges: inferred.edges,
        };
        return {
          structuredContent,
          content: textJson({
            view: args.view,
            rowCount: args.rows.length,
            nodes: inferred.nodes.length,
            edges: inferred.edges.length,
          }),
          _meta: { explorer: structuredContent },
        };
      }),
  );
}
