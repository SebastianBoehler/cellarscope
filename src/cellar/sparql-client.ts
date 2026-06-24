import {
  CELLAR_SPARQL_ENDPOINT,
  MAX_RESPONSE_BYTES,
  SPARQL_TIMEOUT_MS,
} from "./constants.js";
import type { FlatRow, SparqlJson } from "../types.js";

const HEADERS = { Accept: "application/sparql-results+json" };

export class CellarClientError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CellarClientError";
  }
}

export async function runSparql(query: string): Promise<{ rows: FlatRow[]; variables: string[] }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SPARQL_TIMEOUT_MS);

  try {
    const response = await fetch(CELLAR_SPARQL_ENDPOINT, {
      method: "POST",
      headers: HEADERS,
      body: new URLSearchParams({
        query,
        format: "application/sparql-results+json",
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new CellarClientError(`Cellar SPARQL returned HTTP ${response.status}.`);
    }

    const size = Number(response.headers.get("content-length") ?? 0);
    if (size > MAX_RESPONSE_BYTES) {
      throw new CellarClientError("Cellar SPARQL response exceeded the byte cap.");
    }

    const json = (await response.json()) as SparqlJson;
    return {
      rows: flattenRows(json),
      variables: json.head.vars,
    };
  } catch (error) {
    if (error instanceof CellarClientError) throw error;
    if (error instanceof Error && error.name === "AbortError") {
      throw new CellarClientError("Cellar SPARQL request timed out.");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchText(url: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SPARQL_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      headers: { Accept: "text/html,application/xhtml+xml,text/plain", "Accept-Language": "en" },
      redirect: "follow",
      signal: controller.signal,
    });
    if (!response.ok) return "";
    const text = await response.text();
    return cleanText(text).slice(0, 12_000);
  } finally {
    clearTimeout(timeout);
  }
}

function flattenRows(json: SparqlJson): FlatRow[] {
  return json.results.bindings.map((row) =>
    Object.fromEntries(Object.entries(row).map(([key, value]) => [key, value.value])),
  );
}

function cleanText(text: string): string {
  return text
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
