import { getChatGPTUser } from "../../chatgpt-auth";
import { getPostgres, hasPostgres } from "../../../db/postgres";

export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "Authentication required" }, { status: 401 });
  if (!hasPostgres()) return Response.json({ documents: [], persistence: "database_required" });

  const sql = getPostgres();
  const documents = await sql`
    SELECT d.id, d.filename, d.content_type AS "contentType", d.size_bytes AS "sizeBytes",
      d.status, d.matter_id AS "matterId", d.created_at AS "createdAt", m.title AS "matterTitle"
    FROM user_documents d
    LEFT JOIN matters m ON m.id = d.matter_id AND m.owner_id = d.owner_id
    WHERE d.owner_id = ${user.userId}
    ORDER BY d.created_at DESC
    LIMIT 100
  `;
  return Response.json({ documents, persistence: "postgres" });
}
