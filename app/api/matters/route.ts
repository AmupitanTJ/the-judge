import { getChatGPTUser } from "../../chatgpt-auth";
import { getD1 } from "../../../db";
import { getPostgres, hasPostgres } from "../../../db/postgres";

async function authenticatedUser() {
  const user = await getChatGPTUser();
  if (!user) return null;
  if (hasPostgres()) {
    const sql = getPostgres();
    await sql`
      INSERT INTO users (id, email, display_name, role)
      VALUES (${user.userId}, ${user.email}, ${user.fullName ?? user.displayName}, 'practitioner')
      ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, display_name = EXCLUDED.display_name, updated_at = now()
    `;
    return user;
  }
  if (process.env.VERCEL) return user;
  await (await getD1()).prepare(`
    INSERT INTO users (id, email, display_name, role)
    VALUES (?1, ?2, ?3, 'practitioner')
    ON CONFLICT(id) DO UPDATE SET email = excluded.email, display_name = excluded.display_name, updated_at = CURRENT_TIMESTAMP
  `).bind(user.userId, user.email, user.fullName ?? user.displayName).run();
  return user;
}

export async function GET() {
  const user = await authenticatedUser();
  if (!user) return Response.json({ error: "Authentication required" }, { status: 401 });
  if (hasPostgres()) {
    const sql = getPostgres();
    const matters = await sql`
      SELECT id, title, reference, jurisdiction, status, created_at AS "createdAt", updated_at AS "updatedAt"
      FROM matters WHERE owner_id = ${user.userId} AND status = 'active'
      ORDER BY updated_at DESC LIMIT 50
    `;
    return Response.json({ matters, persistence: "postgres" });
  }
  if (process.env.VERCEL) return Response.json({ matters: [], persistence: "database_required" });
  const result = await (await getD1()).prepare(`
    SELECT id, title, reference, jurisdiction, status, created_at AS createdAt, updated_at AS updatedAt
    FROM matters WHERE owner_id = ?1 AND status = 'active'
    ORDER BY updated_at DESC LIMIT 50
  `).bind(user.userId).all();
  return Response.json({ matters: result.results });
}

export async function POST(request: Request) {
  const user = await authenticatedUser();
  if (!user) return Response.json({ error: "Authentication required" }, { status: 401 });
  const payload = await request.json() as { title?: string; reference?: string; jurisdiction?: string };
  const title = payload.title?.trim().slice(0, 160) ?? "";
  if (!title) return Response.json({ error: "Matter title is required" }, { status: 400 });
  const id = crypto.randomUUID();
  const reference = payload.reference?.trim().slice(0, 80) ?? null;
  const jurisdiction = payload.jurisdiction?.trim().slice(0, 80) || "Federal";
  if (hasPostgres()) {
    const sql = getPostgres();
    await sql`
      INSERT INTO matters (id, owner_id, title, reference, jurisdiction)
      VALUES (${id}, ${user.userId}, ${title}, ${reference}, ${jurisdiction})
    `;
    return Response.json({ matter: { id, title, reference, jurisdiction, status: "active" }, persistence: "postgres" }, { status: 201 });
  }
  if (process.env.VERCEL) return Response.json({ error: "Connect a Vercel database to enable persistent matters." }, { status: 503 });
  await (await getD1()).prepare(`
    INSERT INTO matters (id, owner_id, title, reference, jurisdiction)
    VALUES (?1, ?2, ?3, ?4, ?5)
  `).bind(id, user.userId, title, reference, jurisdiction).run();
  return Response.json({ matter: { id, title, reference, jurisdiction, status: "active" } }, { status: 201 });
}
