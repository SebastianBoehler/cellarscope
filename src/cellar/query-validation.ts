import { DEFAULT_PREFIXES, DEFAULT_ROW_LIMIT, HARD_ROW_LIMIT } from "./constants.js";

const FORBIDDEN = [
  "INSERT",
  "DELETE",
  "LOAD",
  "CLEAR",
  "CREATE",
  "DROP",
  "COPY",
  "MOVE",
  "ADD",
  "SERVICE",
  "WITH",
  "USING",
];

const QUERY_FORMS = /\b(SELECT|CONSTRUCT|ASK|DESCRIBE)\b/gi;
const LIMIT_RE = /\bLIMIT\s+(\d+)\b/i;

export class SparqlValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SparqlValidationError";
  }
}

export function validateReadOnlySelect(query: string, maxRows = DEFAULT_ROW_LIMIT): string {
  const cappedRows = clampLimit(maxRows);
  const trimmed = query.trim();

  if (!trimmed) {
    throw new SparqlValidationError("SPARQL query is empty.");
  }

  const body = stripComments(trimmed);
  const forms = [...body.matchAll(QUERY_FORMS)].map((match) => match[1].toUpperCase());
  if (forms.length !== 1 || forms[0] !== "SELECT") {
    throw new SparqlValidationError("Only one SELECT query is allowed.");
  }

  const upper = body.toUpperCase();
  for (const keyword of FORBIDDEN) {
    if (new RegExp(`\\b${keyword}\\b`, "i").test(upper)) {
      throw new SparqlValidationError(`SPARQL keyword ${keyword} is not allowed.`);
    }
  }

  if (/;\s*(SELECT|CONSTRUCT|ASK|DESCRIBE|INSERT|DELETE|LOAD|CLEAR|CREATE|DROP)\b/i.test(body)) {
    throw new SparqlValidationError("Multiple SPARQL statements are not allowed.");
  }

  const withPrefixes = ensureDefaultPrefixes(body);
  const currentLimit = withPrefixes.match(LIMIT_RE);
  if (!currentLimit) {
    return `${withPrefixes.trim()}\nLIMIT ${cappedRows}`;
  }

  const requested = Number.parseInt(currentLimit[1], 10);
  const limit = Math.min(requested, cappedRows, HARD_ROW_LIMIT);
  return withPrefixes.replace(LIMIT_RE, `LIMIT ${limit}`);
}

export function clampLimit(value: number | undefined): number {
  if (!Number.isFinite(value)) return DEFAULT_ROW_LIMIT;
  return Math.max(1, Math.min(Math.trunc(value ?? DEFAULT_ROW_LIMIT), HARD_ROW_LIMIT));
}

function stripComments(query: string): string {
  return query
    .split("\n")
    .map((line) => stripLineComment(line))
    .join("\n");
}

function stripLineComment(line: string): string {
  let inIri = false;
  let quote: '"' | "'" | null = null;
  let escaped = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (quote && char === "\\") {
      escaped = true;
      continue;
    }

    if (!quote) {
      if (char === "<") inIri = true;
      if (char === ">") inIri = false;
      if (!inIri && (char === '"' || char === "'")) quote = char;
      if (!inIri && char === "#") return line.slice(0, index);
      continue;
    }

    if (char === quote) quote = null;
  }

  return line;
}

function ensureDefaultPrefixes(query: string): string {
  const needed = [];
  if (!/\bPREFIX\s+cdm:/i.test(query) && /\bcdm:/i.test(query)) needed.push("cdm");
  if (!/\bPREFIX\s+skos:/i.test(query) && /\bskos:/i.test(query)) needed.push("skos");
  if (!/\bPREFIX\s+dc:/i.test(query) && /\bdc:/i.test(query)) needed.push("dc");
  if (!/\bPREFIX\s+rdf:/i.test(query) && /\brdf:/i.test(query)) needed.push("rdf");
  if (!/\bPREFIX\s+xsd:/i.test(query) && /\bxsd:/i.test(query)) needed.push("xsd");
  if (!/\bPREFIX\s+owl:/i.test(query) && /\bowl:/i.test(query)) needed.push("owl");
  return needed.length ? `${DEFAULT_PREFIXES}\n${query}` : query;
}
