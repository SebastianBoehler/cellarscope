import assert from "node:assert/strict";
import test from "node:test";

import { buildQueryResult } from "../src/cellar/normalize.js";
import { fetchWork, searchWorks } from "../src/cellar/query-templates.js";
import { validateReadOnlySelect } from "../src/cellar/query-validation.js";
import { runSparql } from "../src/cellar/sparql-client.js";

test("searches Cellar by title topic", async () => {
  const results = await searchWorks("artificial intelligence");
  assert.ok(results.length > 0);
  assert.ok(results[0].id);
  assert.ok(results[0].url.startsWith("https://"));
});

test("fetches CELEX metadata", async () => {
  const document = await fetchWork("32016R0679");
  assert.equal(document.id, "32016R0679");
  assert.match(document.title.toLowerCase(), /data|protection|regulation/);
});

test("looks up English WEMI item URLs", async () => {
  const query = validateReadOnlySelect(`
    SELECT DISTINCT ?work ?expr ?manif ?item
    WHERE {
      ?work cdm:resource_legal_id_celex ?celex .
      FILTER(STR(?celex) = "32016R0679")
      ?expr cdm:expression_belongs_to_work ?work ;
            cdm:expression_uses_language <http://publications.europa.eu/resource/authority/language/ENG> .
      ?manif cdm:manifestation_manifests_expression ?expr .
      ?item cdm:item_belongs_to_manifestation ?manif .
    }
    LIMIT 5
  `, 5);
  const { rows } = await runSparql(query);
  assert.ok(rows.length > 0);
  assert.ok(rows.some((row) => row.item?.startsWith("http")));
});

test("normalizes one-hop citation network bindings", async () => {
  const query = validateReadOnlySelect(`
    SELECT DISTINCT ?source ?target ?relation ?title ?target_title
    WHERE {
      ?source cdm:resource_legal_id_celex ?celex .
      FILTER(STR(?celex) = "32016R0679")
      ?source cdm:work_cites_work ?target .
      BIND("cites" AS ?relation)
      OPTIONAL {
        ?expr cdm:expression_belongs_to_work ?source ;
              cdm:expression_uses_language <http://publications.europa.eu/resource/authority/language/ENG> ;
              cdm:expression_title ?title .
      }
      OPTIONAL {
        ?target_expr cdm:expression_belongs_to_work ?target ;
                     cdm:expression_uses_language <http://publications.europa.eu/resource/authority/language/ENG> ;
                     cdm:expression_title ?target_title .
      }
    }
    LIMIT 10
  `, 10);
  const { rows, variables } = await runSparql(query);
  const result = buildQueryResult({
    query,
    resultKind: "network",
    rows,
    variables,
  });
  assert.ok(result.nodes.length > 0);
  assert.ok(result.edges.length > 0);
});
