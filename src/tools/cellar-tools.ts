import { registerAppTool } from "@modelcontextprotocol/ext-apps/server";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import { buildQueryResult } from "../cellar/normalize.js";
import { validateReadOnlySelect } from "../cellar/query-validation.js";
import { runSparql } from "../cellar/sparql-client.js";
import { getSchemaHints } from "../cellar/schema-hints.js";
import { readOnlyAnnotations, runTool, textJson } from "../tool-runtime.js";

const resultKindSchema = z.enum(["records", "network", "timeline"]);

export function registerCellarTools(server: McpServer) {
  registerAppTool(
    server,
    "get_cellar_schema_hints",
    {
      title: "Get Cellar schema hints",
      description:
        "Use this when the user wants to write or understand Cellar SPARQL. Returns compact CDM, WEMI, EuroVoc, and relation guidance.",
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
        "Use this when a templated search is not enough and the user needs a read-only SELECT query against EU Cellar metadata. Call get_cellar_schema_hints first for predicate guidance.",
      inputSchema: {
        query: z.string().min(1),
        purpose: z.string().min(1),
        maxRows: z.number().int().min(1).max(200).optional(),
        resultKind: resultKindSchema.optional(),
      },
      annotations: readOnlyAnnotations(),
      _meta: {
        "openai/toolInvocation/invoking": "Querying Cellar...",
        "openai/toolInvocation/invoked": "Cellar results ready",
      },
    },
    async ({ query, purpose, maxRows, resultKind = "records" }) =>
      runTool(async () => {
        const safeQuery = validateReadOnlySelect(query, maxRows);
        const { rows, variables } = await runSparql(safeQuery);
        const structuredContent = buildQueryResult({
          purpose,
          query: safeQuery,
          resultKind,
          rows,
          variables,
        });
        return {
          structuredContent,
          content: textJson({
            purpose,
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
