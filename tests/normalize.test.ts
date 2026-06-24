import assert from "node:assert/strict";
import test from "node:test";

import { normalizeGraph } from "../src/cellar/normalize.js";

test("uses human labels instead of raw graph URLs", () => {
  const { nodes } = normalizeGraph([
    {
      source: "http://publications.europa.eu/resource/celex/32024R1689",
      source_title: "Artificial Intelligence Act",
      target: "http://publications.europa.eu/resource/cellar/dc8116a1-3fe6-11ef-865a-01aa75ed71a1",
      relation: "CITES",
    },
  ]);

  assert.equal(nodes[0]?.label, "Artificial Intelligence Act");
  assert.equal(nodes[1]?.label, "Cellar dc8116a1");
});
