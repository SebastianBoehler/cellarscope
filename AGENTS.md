# Agent Notes

## Scope

CellarScope is a read-only ChatGPT Apps SDK/MCP demo for showing that agents can write working SPARQL against EU Cellar and visualize the result as a table or graph. Keep v1 focused: no Neo4j migration, no local dump ingestion, no vector index, no write actions, no auth, and no broad product features unless explicitly requested.

## Setup

Use Node 22+.

```bash
npm install
npm run check
npm test
npm run dev
```

The local MCP endpoint is `http://localhost:8787/mcp`; health is `http://localhost:8787/healthz`.

For ChatGPT Developer Mode, expose the local server with HTTPS:

```bash
ngrok http 8787
```

Then add the HTTPS MCP URL in ChatGPT settings under Apps/Connectors developer mode. Use `Keine Authentifizierung`; this app is public/read-only.

## ChatGPT App Testing

Use any freshly created dev app whose tool metadata advertises:

```text
ui://cellarscope/demo-v10.html
```

If ChatGPT keeps showing an older `ui://cellarscope/...` URI, the dev connector metadata is stale. Disconnect it and create a fresh dev app entry; the refresh button may not update the output template.

Minimum checks:

```bash
curl -s http://localhost:8787/healthz
npm run check
npm test
```

In ChatGPT, attach the app and test:

1. `get_cellar_sparql_guide`.
2. `run_cellar_sparql` with a model-written bounded `SELECT`.
3. `render_cellar_result` with `view=network`.

Known-good live network query:

```sparql
PREFIX cdm: <http://publications.europa.eu/ontology/cdm#>

SELECT DISTINCT ?source ?target ?relation WHERE {
  ?work cdm:resource_legal_id_celex ?celex .
  FILTER(STR(?celex) = "32016R0679")
  ?work cdm:work_cites_work ?targetWork .
  BIND("gdpr" AS ?source)
  BIND(STRAFTER(STR(?targetWork), "cellar/") AS ?target)
  BIND("work_cites_work" AS ?relation)
}
LIMIT 10
```

## Cellar/SPARQL Caveats

The Cellar endpoint accepts standard-looking queries inconsistently. Prefer resolving works by CELEX inside `WHERE` and keep queries small.

Important pitfalls:

- Preserve `#` inside explicit prefix IRIs such as `<http://publications.europa.eu/ontology/cdm#>`; do not strip it as a comment.
- Avoid `SERVICE`; the server validator blocks it.
- Avoid unbounded queries.
- Raw Cellar URI node IDs can cause ChatGPT tool-to-render handoff to be blocked. For network UI, return short IDs from SPARQL with `STRAFTER(STR(?work), "cellar/")` or another normalized identifier.
- Use variables named `source`, `target`, and `relation` for graph rendering.

## Useful Commands

```bash
npm run test:unit
npm run test:live
npx @modelcontextprotocol/inspector@latest --server-url http://localhost:8787/mcp --transport http
```

Keep files modular and under roughly 300 LOC.
