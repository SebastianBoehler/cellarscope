<div align="center">

# CellarScope

Read-only ChatGPT Apps SDK explorer for EU Cellar RDF data.

[![CI](https://github.com/SebastianBoehler/cellarscope/actions/workflows/ci.yml/badge.svg)](https://github.com/SebastianBoehler/cellarscope/actions/workflows/ci.yml)
[![Live Cellar](https://github.com/SebastianBoehler/cellarscope/actions/workflows/live-cellar.yml/badge.svg)](https://github.com/SebastianBoehler/cellarscope/actions/workflows/live-cellar.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)

</div>

CellarScope exposes EU Cellar as a public, read-only MCP app. It lets ChatGPT compose bounded SPARQL queries against the live Publications Office RDF endpoint, then render results as tables, cards, timelines, or one-hop network maps.

The main product bet is simple: **do not migrate Cellar into Neo4j for v1**. Cellar is already an RDF knowledge graph with a SPARQL endpoint.

## Features

- ChatGPT Apps SDK / MCP server over streamable HTTP.
- Standard `search` and `fetch` tools for tool-ecosystem compatibility.
- Bounded `run_cellar_sparql` tool with read-only validation and row caps.
- Custom ChatGPT widget for tables, cards, timelines, and networks.
- Compact Cellar schema hints for CELEX, WEMI, EuroVoc, and legal relations.
- No auth, no writes, no local Cellar dump, no vector store, no graph database.

## Project Shape

- `src/index.ts` exposes `/mcp` and `/healthz`.
- `src/tools/` registers MCP/Apps SDK tools.
- `src/cellar/` contains SPARQL validation, client code, templates, and graph normalization.
- `web/src/` contains the vanilla TypeScript widget.
- `tests/` contains unit and live Cellar smoke tests.

## Tools

- `search`: find EU legal works by topic, title, or CELEX id.
- `fetch`: fetch metadata for a CELEX id or Cellar URI.
- `get_cellar_schema_hints`: return compact CDM/WEMI/SPARQL guidance.
- `run_cellar_sparql`: execute one bounded read-only `SELECT`.
- `render_cellar_explorer`: attach the interactive widget template.

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

If ChatGPT keeps using an older widget template URI, create a fresh dev app entry. During development, the connector refresh button may not update cached output-template metadata.

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
