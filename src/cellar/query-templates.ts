import { ENGLISH_LANGUAGE_URI } from "./constants.js";
import { runSparql } from "./sparql-client.js";
import { validateReadOnlySelect } from "./query-validation.js";
import type { FetchDocument, SearchResult } from "../types.js";

export async function searchWorks(query: string): Promise<SearchResult[]> {
  const fullText = toBifContains(query);
  const sparql = validateReadOnlySelect(looksLikeCelex(query) ? celexSearch(query) : titleSearch(fullText), 10);

  const { rows } = await runSparql(sparql);
  return rows.map((row) => ({
    id: row.celex ?? row.work,
    title: row.title ?? row.celex ?? row.work,
    url: canonicalUrl(row.celex ?? row.work),
  }));
}

function titleSearch(fullText: string): string {
  return `
    SELECT DISTINCT ?work ?celex ?title ?date
    WHERE {
      ?work cdm:resource_legal_id_celex ?celex .
      ?expr cdm:expression_belongs_to_work ?work ;
            cdm:expression_uses_language <${ENGLISH_LANGUAGE_URI}> ;
            cdm:expression_title ?title .
      OPTIONAL { ?work cdm:work_date_document ?date . }
      ?title bif:contains '${escapeBifLiteral(fullText)}' .
    }
    ORDER BY DESC(?date)
    LIMIT 10
  `;
}

function celexSearch(query: string): string {
  return `
    SELECT DISTINCT ?work ?celex ?title ?date
    WHERE {
      ?work cdm:resource_legal_id_celex ?celex .
      FILTER(CONTAINS(LCASE(STR(?celex)), LCASE("${escapeLiteral(query)}")))
      ?expr cdm:expression_belongs_to_work ?work ;
            cdm:expression_uses_language <${ENGLISH_LANGUAGE_URI}> ;
            cdm:expression_title ?title .
      OPTIONAL { ?work cdm:work_date_document ?date . }
    }
    ORDER BY DESC(?date)
    LIMIT 10
  `;
}

export async function fetchWork(id: string): Promise<FetchDocument> {
  const sparql = validateReadOnlySelect(`
    SELECT DISTINCT ?work ?celex ?title ?date ?abstract ?agent ?agent_label ?concept ?concept_label ?item
    WHERE {
      {
        ?work cdm:resource_legal_id_celex ?celex .
        FILTER(STR(?celex) = "${escapeLiteral(id)}")
      }
      UNION {
        BIND(<${escapeIri(id)}> AS ?work)
        OPTIONAL { ?work cdm:resource_legal_id_celex ?celex . }
      }
      ?expr cdm:expression_belongs_to_work ?work ;
            cdm:expression_uses_language <${ENGLISH_LANGUAGE_URI}> ;
            cdm:expression_title ?title .
      OPTIONAL { ?expr cdm:expression_abstract ?abstract . }
      OPTIONAL { ?work cdm:work_date_document ?date . }
      OPTIONAL {
        ?work cdm:work_created_by_agent ?agent .
        OPTIONAL { ?agent skos:prefLabel ?agent_label . FILTER(LANG(?agent_label) = "en") }
      }
      OPTIONAL {
        ?work cdm:work_is_about_concept_eurovoc ?concept .
        OPTIONAL { ?concept skos:prefLabel ?concept_label . FILTER(LANG(?concept_label) = "en") }
      }
      OPTIONAL {
        ?manif cdm:manifestation_manifests_expression ?expr .
        ?item cdm:item_belongs_to_manifestation ?manif .
      }
    }
    LIMIT 25
  `, 25);

  const { rows } = await runSparql(sparql);
  const first = rows[0];
  if (!first) {
    throw new Error(`No Cellar work found for ${id}.`);
  }

  return {
    id: first.celex ?? id,
    title: first.title ?? id,
    text: first.abstract ?? "",
    url: canonicalUrl(first.celex ?? first.work ?? id),
    metadata: {
      work: first.work,
      celex: first.celex,
      date: first.date,
      agents: unique(rows.map((row) => row.agent_label ?? row.agent)).join("; "),
      concepts: unique(rows.map((row) => row.concept_label ?? row.concept)).join("; "),
      itemUrls: unique(rows.map((row) => row.item)).join("; "),
    },
  };
}

export function canonicalUrl(id: string): string {
  if (id.startsWith("http")) return id.replace(/^http:/, "https:");
  return `https://publications.europa.eu/resource/celex/${encodeURIComponent(id)}`;
}

function unique(values: Array<string | undefined>): string[] {
  return [...new Set(values.filter(Boolean) as string[])].slice(0, 20);
}

function escapeLiteral(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function escapeBifLiteral(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

function escapeIri(value: string): string {
  if (!/^https?:\/\//.test(value)) return "urn:invalid";
  return value.replace(/[<>"{}|^`\\]/g, "");
}

function toBifContains(value: string): string {
  const terms = value.match(/[\p{L}\p{N}-]+/gu) ?? [];
  return terms.length ? terms.slice(0, 6).join(" AND ") : value;
}

function looksLikeCelex(value: string): boolean {
  return /^[0-9][0-9A-Z()/-]{4,}$/i.test(value.trim());
}
