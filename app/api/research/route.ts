import { getChatGPTUser } from "../../chatgpt-auth";
import { getD1 } from "../../../db";
import { verifiedPassages } from "../../../db/legal-corpus";
import { getPostgres, hasPostgres } from "../../../db/postgres";
import { FOUNDATION_JURISDICTION } from "../../../lib/coverage";
import {
  jurisdictionNeedsClarification,
  presentAnswer,
  rankPassages,
  resolveResearchJurisdiction,
  type AnswerMode,
  type PassageRow,
} from "../../../lib/research-answer";

const UUID = /^[0-9a-f-]{36}$/i;

function persistence() {
  if (hasPostgres()) return "postgres" as const;
  if (process.env.VERCEL) return "preview" as const;
  return "d1" as const;
}

export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "Authentication required" }, { status: 401 });

  try {
    if (hasPostgres()) {
      const sql = getPostgres();
      const sessions = await sql`
        SELECT r.id, r.question, r.answer_mode AS "answerMode", r.jurisdiction, r.matter_id AS "matterId",
          r.created_at AS "createdAt", COUNT(c.id)::integer AS "citationCount"
        FROM research_sessions r
        LEFT JOIN research_citations c ON c.research_session_id = r.id
        WHERE r.owner_id = ${user.userId}
        GROUP BY r.id
        ORDER BY r.created_at DESC
        LIMIT 50
      `;
      return Response.json({ sessions, persistence: "postgres" });
    }

    if (process.env.VERCEL) return Response.json({ sessions: [], persistence: "preview" });
    const result = await (await getD1()).prepare(`
      SELECT r.id, r.question, r.answer_mode AS answerMode, r.jurisdiction, r.matter_id AS matterId,
        r.created_at AS createdAt, COUNT(c.id) AS citationCount
      FROM research_sessions r
      LEFT JOIN research_citations c ON c.research_session_id = r.id
      WHERE r.owner_id = ?1
      GROUP BY r.id
      ORDER BY r.created_at DESC
      LIMIT 50
    `).bind(user.userId).all();
    return Response.json({ sessions: result.results, persistence: "d1" });
  } catch {
    return Response.json({ sessions: [], persistence: "preview" });
  }
}

export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "Authentication required" }, { status: 401 });

  let payload: { question?: string; mode?: string; jurisdiction?: string; practiceArea?: string; matterId?: string };
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const question = payload.question?.trim().slice(0, 1200) ?? "";
  const mode: AnswerMode = payload.mode === "plain" ? "plain" : "professional";
  const requestedJurisdiction = payload.jurisdiction?.trim().slice(0, 80) || FOUNDATION_JURISDICTION;
  const jurisdictionResolution = resolveResearchJurisdiction(question, requestedJurisdiction);
  const jurisdiction = jurisdictionResolution.jurisdiction;
  const practiceArea = payload.practiceArea?.trim().slice(0, 80) || "All practice areas";
  const matterId = payload.matterId && UUID.test(payload.matterId) ? payload.matterId : null;
  if (question.length < 8) return Response.json({ error: "Please enter a fuller legal question." }, { status: 400 });

  const sessionId = crypto.randomUUID();
  let persist = persistence();
  let passages: PassageRow[] = verifiedPassages as PassageRow[];

  try {
    const postgres = hasPostgres() ? getPostgres() : null;
    const database = !postgres && !process.env.VERCEL ? await getD1() : null;

    if (matterId && postgres) {
      const owned = await postgres`SELECT id FROM matters WHERE id = ${matterId} AND owner_id = ${user.userId} LIMIT 1` as { id: string }[];
      if (!owned.length) return Response.json({ error: "Matter not found." }, { status: 404 });
    } else if (matterId && database) {
      const owned = await database.prepare("SELECT id FROM matters WHERE id = ?1 AND owner_id = ?2 LIMIT 1").bind(matterId, user.userId).first();
      if (!owned) return Response.json({ error: "Matter not found." }, { status: 404 });
    }

    if (postgres) {
      await postgres`
        INSERT INTO users (id, email, display_name, role)
        VALUES (${user.userId}, ${user.email}, ${user.fullName ?? user.displayName}, 'practitioner')
        ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, display_name = EXCLUDED.display_name, updated_at = now()
      `;
      await postgres`
        INSERT INTO research_sessions (id, owner_id, matter_id, question, answer_mode, jurisdiction)
        VALUES (${sessionId}, ${user.userId}, ${matterId}, ${question}, ${mode}, ${jurisdiction})
      `;
    } else if (database) {
      await database.prepare(`
        INSERT INTO users (id, email, display_name, role)
        VALUES (?1, ?2, ?3, 'practitioner')
        ON CONFLICT(id) DO UPDATE SET email = excluded.email, display_name = excluded.display_name, updated_at = CURRENT_TIMESTAMP
      `).bind(user.userId, user.email, user.fullName ?? user.displayName).run();
      await database.prepare(`
        INSERT INTO research_sessions (id, owner_id, matter_id, question, answer_mode, jurisdiction)
        VALUES (?1, ?2, ?3, ?4, ?5, ?6)
      `).bind(sessionId, user.userId, matterId, question, mode, jurisdiction).run();
    }

    if (!jurisdictionNeedsClarification(jurisdiction)) {
      if (postgres) {
        const rows = await postgres`
          SELECT p.id, p.document_id AS "documentId", p.provision_label AS "provisionLabel", p.text_content AS "textContent",
            p.keywords, p.professional_summary AS "professionalSummary", p.plain_summary AS "plainSummary",
            d.canonical_title AS "canonicalTitle", d.citation, d.source_url AS "sourceUrl",
            d.source_publisher AS "sourcePublisher", d.legal_status AS "legalStatus",
            d.last_verified_at AS "lastVerifiedAt"
          FROM legal_passages p
          JOIN legal_documents d ON d.id = p.document_id
          WHERE p.review_status = 'source_verified' AND d.jurisdiction = ${jurisdiction}
        `;
        passages = rows as unknown as PassageRow[];
      } else if (database) {
        passages = (await database.prepare(`
            SELECT p.id, p.document_id AS documentId, p.provision_label AS provisionLabel, p.text_content AS textContent,
              p.keywords, p.professional_summary AS professionalSummary, p.plain_summary AS plainSummary,
              d.canonical_title AS canonicalTitle, d.citation, d.source_url AS sourceUrl,
              d.source_publisher AS sourcePublisher, d.legal_status AS legalStatus,
              d.last_verified_at AS lastVerifiedAt
            FROM legal_passages p
            JOIN legal_documents d ON d.id = p.document_id
            WHERE p.review_status = 'source_verified' AND d.jurisdiction = ?1
          `).bind(jurisdiction).all<PassageRow>()).results;
      }
    }

    const rankedEarly = jurisdictionNeedsClarification(jurisdiction) ? [] : rankPassages(question, passages);
    if (rankedEarly.length && postgres) {
      for (const [index, passage] of rankedEarly.entries()) {
        const proposition = mode === "plain" ? passage.plainSummary : passage.professionalSummary;
        await postgres`
          INSERT INTO research_citations (id, research_session_id, passage_id, proposition, display_order)
          VALUES (${crypto.randomUUID()}, ${sessionId}, ${passage.id}, ${proposition ?? "Source passage"}, ${index + 1})
        `;
      }
      passages = rankedEarly;
    } else if (rankedEarly.length && database) {
      await database.batch(rankedEarly.map((passage, index) => database.prepare(`
        INSERT INTO research_citations (id, research_session_id, passage_id, proposition, display_order)
        VALUES (?1, ?2, ?3, ?4, ?5)
      `).bind(crypto.randomUUID(), sessionId, passage.id, mode === "plain" ? passage.plainSummary : passage.professionalSummary, index + 1)));
      passages = rankedEarly;
    } else if (!jurisdictionNeedsClarification(jurisdiction)) {
      passages = rankedEarly;
    }
  } catch {
    persist = "preview";
    passages = jurisdictionNeedsClarification(jurisdiction) ? [] : rankPassages(question, verifiedPassages as PassageRow[]);
  }

  if (jurisdictionNeedsClarification(jurisdiction)) {
    return Response.json({
      ...presentAnswer({
        sessionId,
        question,
        mode,
        jurisdiction,
        requestedJurisdiction,
        jurisdictionNotice: jurisdictionResolution.jurisdictionNotice,
        practiceArea,
        passages: [],
        status: "needs_clarification",
      }),
      persistence: persist,
    });
  }

  const ranked = rankPassages(question, passages);

  return Response.json({
    ...presentAnswer({
      sessionId,
      question,
      mode,
      jurisdiction,
      requestedJurisdiction,
      jurisdictionNotice: jurisdictionResolution.jurisdictionNotice,
      practiceArea,
      passages: ranked,
      status: ranked.length ? "grounded" : "insufficient_coverage",
    }),
    persistence: persist,
  });
}
