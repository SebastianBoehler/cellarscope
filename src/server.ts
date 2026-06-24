import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { registerCellarTools } from "./tools/cellar-tools.js";
import { registerRenderTools } from "./tools/render-tools.js";
import { registerSearchTools } from "./tools/search-tools.js";
import { registerWidgetResources } from "./widget-resources.js";

export const serverName = "cellarscope";

export function createAppServer() {
  const server = new McpServer(
    { name: serverName, version: "0.1.0" },
    {
      instructions:
        "CellarScope is read-only. Use search/fetch for simple discovery. For advanced EU Cellar metadata questions, call get_cellar_schema_hints before run_cellar_sparql. Use SELECT only and render results with render_cellar_explorer when a visual table, card list, timeline, or network would help.",
    },
  );

  registerWidgetResources(server);
  registerSearchTools(server);
  registerCellarTools(server);
  registerRenderTools(server);

  return server;
}
