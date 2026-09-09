import { FOUNDATION_COVERAGE, FOUNDATION_JURISDICTION, FOUNDATION_VERIFIED_AS_OF } from "./coverage";

export type AnswerMode = "professional" | "plain";
export type AnswerStatus = "grounded" | "insufficient_coverage" | "needs_clarification";

export type PassageRow = {
  id: string;
  documentId?: string;
  provisionLabel: string;
  textContent: string;
  keywords?: string;
  professionalSummary: string | null;
  plainSummary: string | null;
  canonicalTitle: string;
  citation: string | null;
  sourceUrl: string;
  sourcePublisher: string;
  legalStatus: string;
  lastVerifiedAt: string | null;
};

export type RankedPassage = PassageRow & { score: number };

const STOP_WORDS = new Set([
  "a", "an", "and", "are", "as", "at", "be", "by", "can", "do", "does", "for", "from",
  "how", "i", "in", "is", "it", "law", "me", "of", "on", "or", "that", "the", "to", "what",
  "when", "which", "who", "why", "with",
]);

export function tokens(value: string) {
  return [...new Set(value.toLowerCase().replace(/[^a-z0-9]+/g, " ").split(/\s+/).filter((word) => word.length > 1 && !STOP_WORDS.has(word)))];
}

export function scorePassage(question: string, passage: PassageRow) {
  const queryTokens = tokens(question);
  const searchable = `${passage.keywords ?? ""} ${passage.provisionLabel} ${passage.textContent}`.toLowerCase();
  let score = queryTokens.reduce((total, word) => total + (searchable.includes(word) ? 2 : 0), 0);
  const normalized = question.toLowerCase();
  if (/suprem|highest law|conflict|inconsisten|invalid|void/.test(normalized) && passage.provisionLabel.startsWith("Section 1")) score += 12;
  if (/national assembly|make laws|lawmaking|legislative|exclusive list|senate|representatives/.test(normalized) && passage.provisionLabel.startsWith("Section 4")) score += 12;
  return score;
}

export function rankPassages(question: string, passages: PassageRow[]) {
  return passages
    .map((passage) => ({ ...passage, score: scorePassage(question, passage) }))
    .filter((passage) => passage.score >= 4)
    .sort((left, right) => right.score - left.score)
    .slice(0, 3);
}

export function jurisdictionNeedsClarification(jurisdiction: string) {
  return jurisdiction !== FOUNDATION_JURISDICTION;
}

function summaryFor(passage: PassageRow, mode: AnswerMode) {
  return (mode === "plain" ? passage.plainSummary : passage.professionalSummary)?.trim() || null;
}

function limitations(practiceArea?: string) {
  const practiceNote =
    practiceArea && practiceArea !== "All practice areas" && practiceArea !== "Constitutional"
      ? ` The selected practice area (${practiceArea}) is outside the foundation corpus except where the question is purely constitutional.`
      : "";
  return `This answer is limited to the verified constitutional passages displayed. Amendments, judicial interpretation, and the facts of a particular matter may change the analysis. The stored Constitution text is marked amendment_review_required.${practiceNote}`;
}

function assumptions(jurisdiction: string) {
  return [
    `The question is treated as a question of ${jurisdiction === FOUNDATION_JURISDICTION ? "federal Nigerian constitutional law" : `${jurisdiction} law`}.`,
    "No state statute, customary law, or Islamic personal law was searched.",
    "The facts of a particular dispute have not been found or applied.",
  ];
}

const NEXT_STEPS = [
  "Read the cited provisions in full, including surrounding subsections.",
  "Check whether a later constitutional alteration has affected the cited text. This copy is marked for amendment review.",
  "Confirm whether any state law, subsidiary legislation, or judgment is also relevant; those sources are not in the foundation corpus.",
  "Treat this as legal information, not representation or advice on a particular matter. No filing deadline has been calculated.",
];

export function presentAnswer(input: {
  sessionId: string;
  question: string;
  mode: AnswerMode;
  jurisdiction: string;
  practiceArea?: string;
  passages: PassageRow[];
  status?: AnswerStatus;
}) {
  const { sessionId, question, mode, jurisdiction, practiceArea, passages } = input;
  if (input.status === "needs_clarification" || jurisdictionNeedsClarification(jurisdiction)) {
    return {
      sessionId,
      status: "needs_clarification" as const,
      question,
      answerMode: mode,
      shortAnswer: null,
      jurisdiction,
      assumptions: assumptions(jurisdiction),
      governingLaw: null,
      analysis: [],
      passages: [],
      nextSteps: [
        "Set jurisdiction to Federal if the question is one of Nigerian constitutional law.",
        "Do not treat a federal constitutional excerpt as an answer to a state, customary, or local question.",
      ],
      limitations: `${FOUNDATION_COVERAGE} State and FCT coverage is not yet verified. The Judge will not search the federal corpus silently when another jurisdiction is selected.`,
      verifiedAsOf: FOUNDATION_VERIFIED_AS_OF,
      clarification: `${jurisdiction} law is not in the foundation corpus. The Judge can only answer from verified federal constitutional passages. Re-ask with jurisdiction set to Federal if the question is constitutional.`,
      why: {
        method: "No retrieval was run. Searching a federal corpus for a state or local question would hide jurisdictional variation.",
        coverage: FOUNDATION_COVERAGE,
        assumptions: assumptions(jurisdiction),
        retrievedPassageIds: [] as string[],
      },
    };
  }

  if (!passages.length || input.status === "insufficient_coverage") {
    return {
      sessionId,
      status: "insufficient_coverage" as const,
      question,
      answerMode: mode,
      shortAnswer: null,
      jurisdiction,
      assumptions: assumptions(jurisdiction),
      governingLaw: null,
      analysis: [],
      passages: [],
      nextSteps: NEXT_STEPS,
      limitations: "The verified corpus currently covers only constitutional supremacy and selected federal legislative powers. The Judge will not invent an answer without matching authority.",
      verifiedAsOf: FOUNDATION_VERIFIED_AS_OF,
      clarification: null,
      why: {
        method: "Keyword and provision matching against source-verified passages. No model memory is treated as legal authority.",
        coverage: FOUNDATION_COVERAGE,
        assumptions: assumptions(jurisdiction),
        retrievedPassageIds: [] as string[],
      },
    };
  }

  const analysis = passages.flatMap((passage, index) => {
    const proposition = summaryFor(passage, mode);
    if (!proposition) return [];
    return [{ proposition, citationLabel: passage.provisionLabel, passageId: passage.id, displayOrder: index + 1 }];
  });
  const titles = [...new Set(passages.map((passage) => `${passage.canonicalTitle}${passage.citation ? `, ${passage.citation}` : ""}`))];
  const provisions = passages.map((passage) => passage.provisionLabel).join("; ");

  return {
    sessionId,
    status: "grounded" as const,
    question,
    answerMode: mode,
    shortAnswer: analysis[0] ? `${analysis[0].proposition} [${analysis[0].displayOrder}]` : null,
    jurisdiction,
    assumptions: assumptions(jurisdiction),
    governingLaw: `${titles.join("; ")} — ${provisions}.`,
    analysis,
    passages: passages.map((passage) => ({
      ...passage,
      treatment: "binding" as const,
      hierarchy: "Constitution of the Federation — supreme law",
    })),
    nextSteps: NEXT_STEPS,
    limitations: limitations(practiceArea),
    verifiedAsOf: passages[0].lastVerifiedAt ?? FOUNDATION_VERIFIED_AS_OF,
    clarification: null,
    why: {
      method: "Keyword and provision matching against source-verified passages. No model memory is treated as legal authority.",
      coverage: FOUNDATION_COVERAGE,
      assumptions: assumptions(jurisdiction),
      retrievedPassageIds: passages.map((passage) => passage.id),
    },
  };
}

export function remapAnswerMode<T extends { passages: PassageRow[]; shortAnswer: string | null; analysis: { proposition: string; citationLabel: string; passageId: string; displayOrder: number }[] }>(
  result: T,
  mode: AnswerMode,
): T {
  const analysis = result.passages.flatMap((passage, index) => {
    const proposition = summaryFor(passage, mode);
    if (!proposition) return [];
    return [{ proposition, citationLabel: passage.provisionLabel, passageId: passage.id, displayOrder: index + 1 }];
  });
  return {
    ...result,
    shortAnswer: analysis[0] ? `${analysis[0].proposition} [${analysis[0].displayOrder}]` : result.shortAnswer,
    analysis,
  };
}
