import { getChatGPTUser } from "../../chatgpt-auth";
import { getD1 } from "../../../db";
import { verifiedPassages } from "../../../db/legal-corpus";

type PassageRow = {
  id: string;
  provisionLabel: string;
  textContent: string;
  keywords: string;
  professionalSummary: string | null;
  plainSummary: string | null;
  canonicalTitle: string;
  citation: string | null;
  sourceUrl: string;
  sourcePublisher: string;
  legalStatus: string;
  lastVerifiedAt: string | null;
};

const STOP_WORDS = new Set([
  "a", "an", "and", "are", "as", "at", "be", "by", "can", "do", "does", "for", "from",
  "how", "i", "in", "is", "it", "law", "me", "of", "on", "or", "that", "the", "to", "what",
  "when", "which", "who", "why", "with",
]);

function tokens(value: string) {
  return [...new Set(value.toLowerCase().replace(/[^a-z0-9]+/g, " ").split(/\s+/).filter((word) => word.length > 1 && !STOP_WORDS.has(word)))];
}

function scorePassage(question: string, passage: PassageRow) {
  const queryTokens = tokens(question);
  const searchable = `${passage.keywords} ${passage.provisionLabel} ${passage.textContent}`.toLowerCase();
  let score = queryTokens.reduce((total, word) => total + (searchable.includes(word) ? 2 : 0), 0);
  const normalized = question.toLowerCase();
  if (/suprem|highest law|conflict|inconsisten|invalid|void/.test(normalized) && passage.provisionLabel.startsWith("Section 1")) score += 12;
  if (/national assembly|make laws|lawmaking|legislative|exclusive list|senate|representatives/.test(normalized) && passage.provisionLabel.startsWith("Section 4")) score += 12;
  return score;
}

export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "Authentication required" }, { status: 401 });

  let payload: { question?: string; mode?: string; jurisdiction?: string };
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const question = payload.question?.trim().slice(0, 1200) ?? "";
  const mode = payload.mode === "plain" ? "plain" : "professional";
  const jurisdiction = payload.jurisdiction === "Federal" ? "Federal" : "Federal";
  if (question.length < 8) return Response.json({ error: "Please enter a fuller legal question." }, { status: 400 });

  const database = process.env.VERCEL ? null : await getD1();
  const passages = database
    ? (await database.prepare(`
        SELECT p.id, p.provision_label AS provisionLabel, p.text_content AS textContent,
          p.keywords, p.professional_summary AS professionalSummary, p.plain_summary AS plainSummary,
          d.canonical_title AS canonicalTitle, d.citation, d.source_url AS sourceUrl,
          d.source_publisher AS sourcePublisher, d.legal_status AS legalStatus,
          d.last_verified_at AS lastVerifiedAt
        FROM legal_passages p
        JOIN legal_documents d ON d.id = p.document_id
        WHERE p.review_status = 'source_verified' AND d.jurisdiction = ?1
      `).bind(jurisdiction).all<PassageRow>()).results
    : verifiedPassages as PassageRow[];
  const ranked = passages
    .map((passage) => ({ ...passage, score: scorePassage(question, passage) }))
    .filter((passage) => passage.score >= 4)
    .sort((left, right) => right.score - left.score)
    .slice(0, 3);

  const sessionId = crypto.randomUUID();
  if (database) {
    await database.prepare(`
      INSERT INTO users (id, email, display_name, role)
      VALUES (?1, ?2, ?3, 'practitioner')
      ON CONFLICT(id) DO UPDATE SET email = excluded.email, display_name = excluded.display_name, updated_at = CURRENT_TIMESTAMP
    `).bind(user.userId, user.email, user.fullName ?? user.displayName).run();
    await database.prepare(`
      INSERT INTO research_sessions (id, owner_id, question, answer_mode, jurisdiction)
      VALUES (?1, ?2, ?3, ?4, ?5)
    `).bind(sessionId, user.userId, question, mode, jurisdiction).run();
  }

  if (!ranked.length) {
    return Response.json({
      sessionId,
      status: "insufficient_coverage",
      shortAnswer: null,
      passages: [],
      limitations: "The verified corpus currently covers only constitutional supremacy and selected federal legislative powers. The Judge will not invent an answer without matching authority.",
      verifiedAsOf: "2026-08-26",
    });
  }

  if (database) {
    await database.batch(ranked.map((passage, index) => database.prepare(`
      INSERT INTO research_citations (id, research_session_id, passage_id, proposition, display_order)
      VALUES (?1, ?2, ?3, ?4, ?5)
    `).bind(crypto.randomUUID(), sessionId, passage.id, mode === "plain" ? passage.plainSummary : passage.professionalSummary, index + 1)));
  }

  const summaries = ranked.map((passage) => mode === "plain" ? passage.plainSummary : passage.professionalSummary).filter(Boolean);
  return Response.json({
    sessionId,
    status: "grounded",
    shortAnswer: summaries.join(" "),
    passages: ranked.map((passage) => ({
      id: passage.id,
      provisionLabel: passage.provisionLabel,
      textContent: passage.textContent,
      keywords: passage.keywords,
      professionalSummary: passage.professionalSummary,
      plainSummary: passage.plainSummary,
      canonicalTitle: passage.canonicalTitle,
      citation: passage.citation,
      sourceUrl: passage.sourceUrl,
      sourcePublisher: passage.sourcePublisher,
      legalStatus: passage.legalStatus,
      lastVerifiedAt: passage.lastVerifiedAt,
    })),
    limitations: "This answer is limited to the verified constitutional passages displayed. Amendments, judicial interpretation, and the facts of a particular matter may change the analysis.",
    verifiedAsOf: ranked[0].lastVerifiedAt ?? "2026-08-26",
  });
}
