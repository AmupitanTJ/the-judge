export const FOUNDATION_JURISDICTION = "Federal";
export const FOUNDATION_VERIFIED_AS_OF = "2026-08-26";

export const JURISDICTIONS = ["Federal", "Lagos", "FCT", "Other state"] as const;

export const PRACTICE_AREAS = [
  "All practice areas",
  "Constitutional",
  "Land / property",
  "Marriage / family",
  "Employment",
  "Company / commercial",
  "Criminal",
] as const;

export const COVERAGE_MATRIX = [
  {
    jurisdiction: "Federal",
    documentType: "Constitution",
    scope: "ss. 1(1)–(3) and 4(1)–(3)",
    reviewStatus: "source_verified",
    legalStatus: "amendment_review_required",
    lastVerifiedAt: FOUNDATION_VERIFIED_AS_OF,
  },
  {
    jurisdiction: "Federal",
    documentType: "Acts, regulations, gazettes",
    scope: "Not ingested",
    reviewStatus: "not_started",
    legalStatus: "unknown",
    lastVerifiedAt: null,
  },
  {
    jurisdiction: "Federal",
    documentType: "Appellate judgments",
    scope: "Not ingested",
    reviewStatus: "not_started",
    legalStatus: "unknown",
    lastVerifiedAt: null,
  },
  {
    jurisdiction: "Lagos, FCT, and other states",
    documentType: "State law and local instruments",
    scope: "Not in foundation corpus",
    reviewStatus: "not_started",
    legalStatus: "unknown",
    lastVerifiedAt: null,
  },
  {
    jurisdiction: "Customary / Islamic personal law",
    documentType: "Community and personal-law collections",
    scope: "Not in foundation corpus",
    reviewStatus: "not_started",
    legalStatus: "unknown",
    lastVerifiedAt: null,
  },
] as const;

export const FOUNDATION_COVERAGE =
  "Foundation corpus: Constitution of the Federal Republic of Nigeria 1999, sections 1(1)–(3) and 4(1)–(3) only.";
