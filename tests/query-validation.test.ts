import assert from "node:assert/strict";
import test from "node:test";

import { validateReadOnlySelect } from "../src/cellar/query-validation.js";

test("accepts SELECT and injects LIMIT", () => {
  const query = validateReadOnlySelect("SELECT ?s WHERE { ?s ?p ?o }", 25);
  assert.match(query, /LIMIT 25$/);
});

test("caps an excessive LIMIT", () => {
  const query = validateReadOnlySelect("SELECT ?s WHERE { ?s ?p ?o } LIMIT 9999", 50);
  assert.match(query, /LIMIT 50$/);
});

test("injects known prefixes when needed", () => {
  const query = validateReadOnlySelect("SELECT ?work WHERE { ?work cdm:work_date_document ?date }", 5);
  assert.match(query, /PREFIX cdm:/);
});

test("keeps hash characters inside explicit prefix IRIs", () => {
  const query = validateReadOnlySelect(`
    PREFIX cdm: <http://publications.europa.eu/ontology/cdm#>
    SELECT ?work WHERE { ?work cdm:resource_legal_id_celex ?celex }
    LIMIT 10
  `, 10);
  assert.match(query, /PREFIX cdm: <http:\/\/publications\.europa\.eu\/ontology\/cdm#>/);
});

test("rejects update keywords", () => {
  assert.throws(
    () => validateReadOnlySelect("INSERT DATA { <a> <b> <c> }"),
    /Only one SELECT query|INSERT/,
  );
  assert.throws(
    () => validateReadOnlySelect("SELECT ?s WHERE { SERVICE <https://x.test> { ?s ?p ?o } }"),
    /SERVICE/,
  );
});

test("rejects multiple query forms", () => {
  assert.throws(
    () => validateReadOnlySelect("SELECT ?s WHERE { ?s ?p ?o } LIMIT 1 SELECT ?x WHERE { ?x ?y ?z }"),
    /Only one SELECT query/,
  );
});
