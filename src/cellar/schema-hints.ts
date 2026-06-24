export function getSchemaHints() {
  return {
    summary:
      "Cellar metadata is RDF in the Publications Office CDM ontology. For this demo, write bounded SELECT SPARQL yourself, execute it, then render table or source/target/relation graph results.",
    prefixes: {
      cdm: "http://publications.europa.eu/ontology/cdm#",
      skos: "http://www.w3.org/2004/02/skos/core#",
      dc: "http://purl.org/dc/elements/1.1/",
      owl: "http://www.w3.org/2002/07/owl#",
      xsd: "http://www.w3.org/2001/XMLSchema#",
    },
    wemi: [
      "Work: abstract legal/publication entity and main graph node.",
      "Expression: language-specific metadata such as English title and abstract.",
      "Manifestation: format-specific representation such as PDF or HTML.",
      "Item: downloadable file URL.",
    ],
    commonPredicates: {
      celex: "cdm:resource_legal_id_celex",
      title: "cdm:expression_title",
      date: "cdm:work_date_document",
      englishExpression: "cdm:expression_uses_language <http://publications.europa.eu/resource/authority/language/ENG>",
      eurovocConcept: "cdm:work_is_about_concept_eurovoc",
      agent: "cdm:work_created_by_agent",
      cites: "cdm:work_cites_work",
      amends: "cdm:work_amends_work",
      repeals: "cdm:work_repeals_work",
      corrects: "cdm:work_corrects_work",
      legalBasis: "cdm:work_has_legal_basis_work",
      consolidatedVersion: "cdm:work_has_consolidated_version_work",
    },
    demoFlow: [
      "Use this guide before run_cellar_sparql.",
      "Write a small SELECT query with LIMIT 5-50.",
      "For graphs, return source, target, and relation variables.",
      "After run_cellar_sparql, call render_cellar_result with view=network or view=table.",
    ],
    advice: [
      "Always include LIMIT.",
      "Use SELECT only.",
      "Return variables named source/target/relation for network rendering.",
      "For readable graphs, also return source_title/source_celex and target_title/target_celex when possible. Do not render raw Cellar URLs as node labels.",
      "Use English labels with FILTER(LANG(?label) = \"en\") where labels are literals.",
      "Resolve works from CELEX inside WHERE before traversing relations. Avoid direct Cellar URI subjects, VALUES, and BIND-heavy subject setup; the Cellar endpoint may reject those shapes with HTTP 400.",
      "Known-good citation shape: ?source cdm:resource_legal_id_celex ?celex . FILTER(STR(?celex) = \"32016R0679\") ?source cdm:work_cites_work ?target . BIND(\"work_cites_work\" AS ?relation)",
    ],
    examples: {
      celexTitle: `SELECT DISTINCT ?work ?celex ?title ?date
WHERE {
  ?work cdm:resource_legal_id_celex ?celex .
  FILTER(STR(?celex) = "32024R1689")
  ?expr cdm:expression_belongs_to_work ?work ;
        cdm:expression_uses_language <http://publications.europa.eu/resource/authority/language/ENG> ;
        cdm:expression_title ?title .
  OPTIONAL { ?work cdm:work_date_document ?date . }
}
LIMIT 10`,
      citationNetwork: `SELECT DISTINCT ?source ?source_title ?source_celex ?target ?target_title ?target_celex ?relation
WHERE {
  ?source cdm:resource_legal_id_celex ?celex .
  FILTER(STR(?celex) = "32024R1689")
  BIND(STR(?celex) AS ?source_celex)
  ?source cdm:work_cites_work ?target .
  BIND("CITES" AS ?relation)
  OPTIONAL {
    ?source_expr cdm:expression_belongs_to_work ?source ;
                 cdm:expression_uses_language <http://publications.europa.eu/resource/authority/language/ENG> ;
                 cdm:expression_title ?source_title .
  }
  OPTIONAL { ?target cdm:resource_legal_id_celex ?target_celex . }
  OPTIONAL {
    ?target_expr cdm:expression_belongs_to_work ?target ;
                 cdm:expression_uses_language <http://publications.europa.eu/resource/authority/language/ENG> ;
                 cdm:expression_title ?target_title .
  }
}
LIMIT 25`,
    },
  };
}
