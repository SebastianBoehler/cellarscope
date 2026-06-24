import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { registerCellarTools } from "./tools/cellar-tools.js";
import { registerRenderTools } from "./tools/render-tools.js";
import { registerWidgetResources } from "./widget-resources.js";

export const serverName = "cellarscope";

export function createAppServer() {
  const server = new McpServer(
    { name: serverName, version: "0.1.0" },
    {
      instructions:
        "CellarScope is a read-only demo that shows ChatGPT can write working SPARQL for EU Cellar. First call get_cellar_sparql_guide, then write a bounded SELECT and pass it to run_cellar_sparql. Render useful results with render_cellar_result, especially network results using source, target, and relation variables.",
    },
  );

  registerWidgetResources(server);
  registerCellarTools(server);
  registerRenderTools(server);

  return server;
}
