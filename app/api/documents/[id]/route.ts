import { get } from "@vercel/blob";
import { getChatGPTUser } from "../../../chatgpt-auth";
import { getPostgres, hasPostgres } from "../../../../db/postgres";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "Authentication required" }, { status: 401 });
  if (!hasPostgres()) return Response.json({ error: "Document storage is unavailable." }, { status: 503 });

  const { id } = await context.params;
  const sql = getPostgres();
  const rows = await sql`
    SELECT filename, pathname FROM user_documents
    WHERE id = ${id} AND owner_id = ${user.userId}
    LIMIT 1
  ` as { filename: string; pathname: string }[];
  const document = rows[0];
  if (!document) return Response.json({ error: "Document not found." }, { status: 404 });

  const result = await get(document.pathname, { access: "private" });
  if (!result || result.statusCode !== 200) return Response.json({ error: "Document file not found." }, { status: 404 });

  const safeName = document.filename.replace(/[\r\n"]/g, "-");
  return new Response(result.stream, {
    headers: {
      "content-type": result.blob.contentType || "application/octet-stream",
      "content-length": String(result.blob.size),
      "content-disposition": `attachment; filename="${safeName}"; filename*=UTF-8''${encodeURIComponent(safeName)}`,
      "cache-control": "private, no-store",
    },
  });
}
