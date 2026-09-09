import { getChatGPTUser } from "../../../chatgpt-auth";
import { getD1 } from "../../../../db";
import { getPostgres, hasPostgres } from "../../../../db/postgres";
import { presentAnswer, type AnswerMode, type PassageRow } from "../../../../lib/research-answer";

type SessionRow = {
  id: string;
  question: string;
  answerMode: AnswerMode;
  jurisdiction: string;
  matterId: string | null;
  createdAt: string;
};

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "Authentication required" }, { status: 401 });

  const { id } = await context.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return Response.json({ error: "Research session not found." }, { status: 404 });

  try {
  if (hasPostgres()) {
    const sql = getPostgres();
    const sessions = await sql`
      SELECT id, question, answer_mode AS "answerMode", jurisdiction, matter_id AS "matterId", created_at AS "createdAt"
      FROM research_sessions WHERE id = ${id} AND owner_id = ${user.userId} LIMIT 1
    ` as SessionRow[];
    const session = sessions[0];
    if (!session) return Response.json({ error: "Research session not found." }, { status: 404 });
    const passages = await sql`
      SELECT p.id, p.document_id AS "documentId", p.provision_label AS "provisionLabel", p.text_content AS "textContent",
        p.keywords, p.professional_summary AS "professionalSummary", p.plain_summary AS "plainSummary",
        d.canonical_title AS "canonicalTitle", d.citation, d.source_url AS "sourceUrl",
        d.source_publisher AS "sourcePublisher", d.legal_status AS "legalStatus",
        d.last_verified_at AS "lastVerifiedAt"
      FROM research_citations c
      JOIN legal_passages p ON p.id = c.passage_id
      JOIN legal_documents d ON d.id = p.document_id
      WHERE c.research_session_id = ${id}
      ORDER BY c.display_order ASC
    ` as PassageRow[];
    return Response.json({
      ...presentAnswer({
        sessionId: session.id,
        question: session.question,
        mode: session.answerMode,
        jurisdiction: session.jurisdiction,
        passages,
      }),
      matterId: session.matterId,
      createdAt: session.createdAt,
      persistence: "postgres",
    });
  }

  if (process.env.VERCEL) return Response.json({ error: "Research session not found." }, { status: 404 });

  const database = await getD1();
  const session = await database.prepare(`
    SELECT id, question, answer_mode AS answerMode, jurisdiction, matter_id AS matterId, created_at AS createdAt
    FROM research_sessions WHERE id = ?1 AND owner_id = ?2 LIMIT 1
  `).bind(id, user.userId).first<SessionRow>();
  if (!session) return Response.json({ error: "Research session not found." }, { status: 404 });

  const passages = (await database.prepare(`
    SELECT p.id, p.document_id AS documentId, p.provision_label AS provisionLabel, p.text_content AS textContent,
      p.keywords, p.professional_summary AS professionalSummary, p.plain_summary AS plainSummary,
      d.canonical_title AS canonicalTitle, d.citation, d.source_url AS sourceUrl,
      d.source_publisher AS sourcePublisher, d.legal_status AS legalStatus,
      d.last_verified_at AS lastVerifiedAt
    FROM research_citations c
    JOIN legal_passages p ON p.id = c.passage_id
    JOIN legal_documents d ON d.id = p.document_id
    WHERE c.research_session_id = ?1
    ORDER BY c.display_order ASC
  `).bind(id).all<PassageRow>()).results;

  return Response.json({
    ...presentAnswer({
      sessionId: session.id,
      question: session.question,
      mode: session.answerMode,
      jurisdiction: session.jurisdiction,
      passages,
    }),
    matterId: session.matterId,
    createdAt: session.createdAt,
    persistence: "d1",
  });
  } catch {
    return Response.json({ error: "Research session not found." }, { status: 404 });
  }
}
