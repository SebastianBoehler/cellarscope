import { registerAppTool } from "@modelcontextprotocol/ext-apps/server";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import { fetchWork, searchWorks } from "../cellar/query-templates.js";
import { readOnlyAnnotations, runTool, textJson } from "../tool-runtime.js";

const searchOutputSchema = {
  results: z.array(z.object({ id: z.string(), title: z.string(), url: z.string().url() })),
};

const fetchOutputSchema = {
  id: z.string(),
  title: z.string(),
  text: z.string(),
  url: z.string().url(),
  metadata: z.record(z.string(), z.string().optional()).optional(),
};

export function registerSearchTools(server: McpServer) {
  registerAppTool(
    server,
    "search",
    {
      title: "Search EU Cellar",
      description:
        "Use this when the user wants to find EU legal works or publications in Cellar by topic, title, or CELEX identifier.",
      inputSchema: { query: z.string().min(1) },
      outputSchema: searchOutputSchema,
      annotations: readOnlyAnnotations(),
      _meta: {},
    },
    async ({ query }) =>
      runTool(async () => {
        const structuredContent = { results: await searchWorks(query) };
        return {
          structuredContent,
          content: textJson(structuredContent),
        };
      }),
  );

  registerAppTool(
    server,
    "fetch",
    {
      title: "Fetch EU Cellar work",
      description:
        "Use this when the user already has a CELEX id or Cellar work URI and wants full metadata, summary text, and source links.",
      inputSchema: { id: z.string().min(1) },
      outputSchema: fetchOutputSchema,
      annotations: readOnlyAnnotations(),
      _meta: {},
    },
    async ({ id }) =>
      runTool(async () => {
        const structuredContent = await fetchWork(id);
        return {
          structuredContent,
          content: textJson(structuredContent),
          _meta: { document: structuredContent },
        };
      }),
  );
}
