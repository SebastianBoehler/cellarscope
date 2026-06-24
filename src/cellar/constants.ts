export const CELLAR_SPARQL_ENDPOINT =
  process.env.CELLAR_SPARQL_ENDPOINT ?? "https://publications.europa.eu/webapi/rdf/sparql";

export const CELLAR_ORIGIN = "https://publications.europa.eu";

export const ENGLISH_LANGUAGE_URI =
  "http://publications.europa.eu/resource/authority/language/ENG";

export const DEFAULT_ROW_LIMIT = 50;
export const HARD_ROW_LIMIT = 200;
export const SPARQL_TIMEOUT_MS = 20_000;
export const MAX_RESPONSE_BYTES = 2_000_000;

export const DEFAULT_PREFIXES = `PREFIX cdm: <http://publications.europa.eu/ontology/cdm#>
PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
PREFIX dc: <http://purl.org/dc/elements/1.1/>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
PREFIX owl: <http://www.w3.org/2002/07/owl#>
`;
