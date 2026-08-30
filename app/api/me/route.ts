import { getChatGPTUser } from "../../chatgpt-auth";
import { getD1 } from "../../../db";

export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "Authentication required" }, { status: 401 });

  if (process.env.VERCEL) {
    return Response.json({ user: { id: user.userId, email: user.email, displayName: user.displayName }, persistence: "preview" });
  }

  const db = await getD1();
  await db.prepare(`
    INSERT INTO users (id, email, display_name, role)
    VALUES (?1, ?2, ?3, 'practitioner')
    ON CONFLICT(id) DO UPDATE SET
      email = excluded.email,
      display_name = excluded.display_name,
      updated_at = CURRENT_TIMESTAMP
  `).bind(user.userId, user.email, user.fullName ?? user.displayName).run();

  return Response.json({ user: { id: user.userId, email: user.email, displayName: user.displayName } });
}
