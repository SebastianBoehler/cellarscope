import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  RESOURCE_MIME_TYPE,
  registerAppResource,
} from "@modelcontextprotocol/ext-apps/server";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { CELLAR_ORIGIN } from "./cellar/constants.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "../..");
const widgetJs = readFileSync(join(projectRoot, "web/dist/widget.js"), "utf8");
const widgetCss = readFileSync(join(projectRoot, "web/dist/widget.css"), "utf8");

export const widgetUri = "ui://cellarscope/demo-v10.html";

export function registerWidgetResources(server: McpServer) {
  registerAppResource(server, "cellarscope-explorer", widgetUri, {}, async () => ({
    contents: [
      {
        uri: widgetUri,
        mimeType: RESOURCE_MIME_TYPE,
        text: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>${widgetCss}</style>
  </head>
  <body>
    <main id="root" class="shell"></main>
    <script type="module">${widgetJs}</script>
  </body>
</html>`,
        _meta: {
          ui: {
            prefersBorder: true,
            csp: {
              connectDomains: [CELLAR_ORIGIN],
              resourceDomains: [CELLAR_ORIGIN],
            },
          },
          "openai/widgetDescription":
            "Shows Cellar SPARQL results as a compact table or relation graph.",
        },
      },
    ],
  }));
}
