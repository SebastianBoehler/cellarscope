<div align="center">

# CellarScope

Demo ChatGPT app for writing SPARQL against EU Cellar and rendering graphs.

[![CI](https://github.com/SebastianBoehler/cellarscope/actions/workflows/ci.yml/badge.svg)](https://github.com/SebastianBoehler/cellarscope/actions/workflows/ci.yml)
[![Live Cellar](https://github.com/SebastianBoehler/cellarscope/actions/workflows/live-cellar.yml/badge.svg)](https://github.com/SebastianBoehler/cellarscope/actions/workflows/live-cellar.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)

</div>

CellarScope is a small public, read-only MCP app that demonstrates one idea: ChatGPT can learn enough about EU Cellar to write bounded SPARQL queries itself, execute them against the live Publications Office RDF endpoint, and render the result as a table or graph.

The main product bet is simple: **do not migrate Cellar into Neo4j for v1**. Cellar is already an RDF knowledge graph with a SPARQL endpoint.

## Features

- ChatGPT Apps SDK / MCP server over streamable HTTP.
- Compact `get_cellar_sparql_guide` tool for CDM/WEMI predicates and query examples.
- Bounded `run_cellar_sparql` tool with read-only validation and row caps.
- Custom ChatGPT widget for tables and one-hop relation networks.
- No auth, no writes, no local Cellar dump, no vector store, no graph database.

## Project Shape

- `src/index.ts` exposes `/mcp` and `/healthz`.
- `src/tools/` registers MCP/Apps SDK tools.
- `src/cellar/` contains SPARQL guidance, validation, client code, and graph normalization.
- `web/src/` contains the vanilla TypeScript widget.
- `tests/` contains unit and live Cellar smoke tests.

## Tools

- `get_cellar_sparql_guide`: return compact CDM/WEMI/SPARQL guidance and examples.
- `run_cellar_sparql`: execute one bounded read-only `SELECT`.
- `render_cellar_result`: attach the interactive table/graph widget.

Suggested demo prompt:

```text
Use CellarScope. First read the Cellar SPARQL guide. Then write and run a SPARQL query for the AI Act by CELEX 32024R1689 and render a one-hop citation network.
```

## Local Development

```bash
npm install
npm run check
npm run build
npm test
npm run dev
```

The MCP endpoint is:

```text
http://localhost:8787/mcp
```

Health check:

```bash
curl http://localhost:8787/healthz
```

## ChatGPT Developer Mode

Expose the local server with HTTPS:

```bash
ngrok http 8787
```

In ChatGPT, open Settings -> Apps/Connectors -> Developer Mode, create a new app, use the `https://.../mcp` URL, and choose no authentication.

If ChatGPT keeps using an older widget template URI, create a fresh dev app entry. During development, the connector refresh button may not update cached output-template metadata. The current widget URI is `ui://cellarscope/demo-v10.html`.

## SPARQL Guardrails

`run_cellar_sparql` accepts only one `SELECT` query. It blocks SPARQL Update keywords, remote `SERVICE`, multiple query forms, and enforces a hard result cap of 200 rows.

For network rendering, prefer normalized short IDs:

```sparql
BIND(STRAFTER(STR(?targetWork), "cellar/") AS ?target)
```

Raw Cellar URLs work as data, but can be brittle when passed through ChatGPT tool-to-widget handoff.

## CI

- `ci.yml` runs install, typecheck, build, and unit tests.
- `live-cellar.yml` runs live endpoint tests manually and on schedule.

## License

MIT
