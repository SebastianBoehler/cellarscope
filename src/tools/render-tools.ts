import { registerAppTool } from "@modelcontextprotocol/ext-apps/server";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

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
    "render_cellar_explorer",
    {
      title: "Render Cellar explorer",
      description:
        "Use this after search, fetch, or run_cellar_sparql when the user wants an interactive Cellar table, card list, timeline, or one-hop network map.",
      inputSchema: {
        view: z.enum(["table", "network", "timeline", "cards"]),
        purpose: z.string().optional(),
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
        const structuredContent = {
          view: args.view,
          purpose: args.purpose ?? "Explore Cellar results",
          query: args.query ?? "",
          rows: args.rows,
          variables: args.variables,
          rowCount: args.rows.length,
          nodes: args.nodes,
          edges: args.edges,
        };
        return {
          structuredContent,
          content: textJson({
            view: args.view,
            rowCount: args.rows.length,
            nodes: args.nodes.length,
            edges: args.edges.length,
          }),
          _meta: { explorer: structuredContent },
        };
      }),
  );
}
