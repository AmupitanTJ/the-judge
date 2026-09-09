import { getChatGPTUser } from "../../chatgpt-auth";
import { getD1 } from "../../../db";
import { getPostgres, hasPostgres } from "../../../db/postgres";

export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "Authentication required" }, { status: 401 });

  try {
  if (hasPostgres()) {
    const sql = getPostgres();
    const authorities = await sql`
      SELECT p.id, p.provision_label AS "provisionLabel", p.text_content AS "textContent",
        d.id AS "documentId", d.canonical_title AS "canonicalTitle", d.citation,
        d.source_url AS "sourceUrl", d.source_publisher AS "sourcePublisher",
        d.legal_status AS "legalStatus", d.jurisdiction, d.last_verified_at AS "lastVerifiedAt",
        COUNT(c.id)::integer AS "useCount"
      FROM research_citations c
      JOIN research_sessions r ON r.id = c.research_session_id
      JOIN legal_passages p ON p.id = c.passage_id
      JOIN legal_documents d ON d.id = p.document_id
      WHERE r.owner_id = ${user.userId}
      GROUP BY p.id, d.id
      ORDER BY MAX(r.created_at) DESC
      LIMIT 50
    `;
    return Response.json({ authorities, persistence: "postgres" });
  }

  if (process.env.VERCEL) return Response.json({ authorities: [], persistence: "preview" });

  const result = await (await getD1()).prepare(`
    SELECT p.id, p.provision_label AS provisionLabel, p.text_content AS textContent,
      d.id AS documentId, d.canonical_title AS canonicalTitle, d.citation,
      d.source_url AS sourceUrl, d.source_publisher AS sourcePublisher,
      d.legal_status AS legalStatus, d.jurisdiction, d.last_verified_at AS lastVerifiedAt,
      COUNT(c.id) AS useCount
    FROM research_citations c
    JOIN research_sessions r ON r.id = c.research_session_id
    JOIN legal_passages p ON p.id = c.passage_id
    JOIN legal_documents d ON d.id = p.document_id
    WHERE r.owner_id = ?1
    GROUP BY p.id
    ORDER BY MAX(r.created_at) DESC
    LIMIT 50
  `).bind(user.userId).all();

  return Response.json({ authorities: result.results, persistence: "d1" });
  } catch {
    return Response.json({ authorities: [], persistence: "preview" });
  }
}
