import { registerAppTool } from "@modelcontextprotocol/ext-apps/server";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import { buildQueryResult } from "../cellar/normalize.js";
import { validateReadOnlySelect } from "../cellar/query-validation.js";
import { runSparql } from "../cellar/sparql-client.js";
import { getSchemaHints } from "../cellar/schema-hints.js";
import { readOnlyAnnotations, runTool, textJson } from "../tool-runtime.js";

const resultKindSchema = z.enum(["records", "network"]);

export function registerCellarTools(server: McpServer) {
  registerAppTool(
    server,
    "get_cellar_sparql_guide",
    {
      title: "Get Cellar SPARQL guide",
      description:
        "Use this first for Cellar questions. It teaches the model the compact CDM/WEMI predicates and known-good SPARQL shapes it should use before writing a SELECT query.",
      inputSchema: {},
      annotations: readOnlyAnnotations(),
      _meta: {},
    },
    async () =>
      runTool(async () => {
        const structuredContent = getSchemaHints();
        return { structuredContent, content: textJson(structuredContent) };
      }),
  );

  registerAppTool(
    server,
    "run_cellar_sparql",
    {
      title: "Run bounded Cellar SPARQL",
      description:
        "Use this after get_cellar_sparql_guide. Write the SPARQL query yourself, pass it in query, and keep it read-only, bounded, and suitable for rendering as records or a source/target/relation network.",
      inputSchema: {
        query: z.string().min(1),
        maxRows: z.number().int().min(1).max(200).optional(),
        resultKind: resultKindSchema.optional(),
      },
      annotations: readOnlyAnnotations(),
      _meta: {
        "openai/toolInvocation/invoking": "Querying Cellar...",
        "openai/toolInvocation/invoked": "Cellar results ready",
      },
    },
    async ({ query, maxRows, resultKind = "records" }) =>
      runTool(async () => {
        const safeQuery = validateReadOnlySelect(query, maxRows);
        const { rows, variables } = await runSparql(safeQuery);
        const structuredContent = buildQueryResult({
          query: safeQuery,
          resultKind,
          rows,
          variables,
        });
        return {
          structuredContent,
          content: textJson({
            rowCount: structuredContent.rowCount,
            variables,
            nodes: structuredContent.nodes.length,
            edges: structuredContent.edges.length,
          }),
          _meta: { fullResult: structuredContent },
        };
      }),
  );
}
