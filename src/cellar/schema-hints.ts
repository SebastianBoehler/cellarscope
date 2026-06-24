export function getSchemaHints() {
  return {
    summary:
      "Cellar metadata is RDF in the Publications Office CDM ontology. Query it with bounded SELECT SPARQL and prefer Work-level results unless the user asks for file downloads.",
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
    advice: [
      "Always include LIMIT.",
      "Use SELECT only.",
      "Return variables named source/target/relation for network rendering.",
      "Use English labels with FILTER(LANG(?label) = \"en\") where labels are literals.",
      "Resolve works from CELEX inside WHERE before traversing relations. Avoid direct Cellar URI subjects, VALUES, and BIND-heavy subject setup; the Cellar endpoint may reject those shapes with HTTP 400.",
      "Known-good citation shape: ?source cdm:resource_legal_id_celex ?celex . FILTER(STR(?celex) = \"32016R0679\") ?source cdm:work_cites_work ?target . BIND(\"work_cites_work\" AS ?relation)",
    ],
  };
}
