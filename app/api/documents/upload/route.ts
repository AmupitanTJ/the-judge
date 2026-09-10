import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { head } from "@vercel/blob";
import { getChatGPTUser } from "../../../chatgpt-auth";
import { getPostgres, hasPostgres } from "../../../../db/postgres";

const MAXIMUM_SIZE = 25 * 1024 * 1024;
const ALLOWED_CONTENT_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
];
const UUID = /^[0-9a-f-]{36}$/i;

type UploadContext = {
  userId: string;
  filename: string;
  matterId: string | null;
};

function safeFilename(pathname: string) {
  const name = pathname.split("/").at(-1)?.trim() ?? "document";
  return name.replace(/[\r\n\\]/g, "-").slice(0, 180);
}

export async function POST(request: Request) {
  if (!process.env.BLOB_READ_WRITE_TOKEN && !process.env.BLOB_STORE_ID) {
    return Response.json({ error: "Private document storage is not connected yet." }, { status: 503 });
  }
  if (!hasPostgres()) {
    return Response.json({ error: "Private document metadata storage is not connected yet." }, { status: 503 });
  }

  let body: HandleUploadBody;
  try {
    body = await request.json() as HandleUploadBody;
  } catch {
    return Response.json({ error: "Invalid upload request." }, { status: 400 });
  }

  try {
    const response = await handleUpload({
      request,
      body,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const user = await getChatGPTUser();
        if (!user) throw new Error("Authentication required.");
        if (pathname.includes("..") || pathname.includes("\\") || pathname.startsWith("/")) {
          throw new Error("Invalid document path.");
        }

        let matterId: string | null = null;
        if (clientPayload) {
          const parsed = JSON.parse(clientPayload) as { matterId?: string | null };
          matterId = parsed.matterId && UUID.test(parsed.matterId) ? parsed.matterId : null;
        }

        const sql = getPostgres();
        await sql`
          INSERT INTO users (id, email, display_name, role)
          VALUES (${user.userId}, ${user.email}, ${user.fullName ?? user.displayName}, 'practitioner')
          ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, display_name = EXCLUDED.display_name, updated_at = now()
        `;
        if (matterId) {
          const owned = await sql`SELECT id FROM matters WHERE id = ${matterId} AND owner_id = ${user.userId} LIMIT 1` as { id: string }[];
          if (!owned.length) throw new Error("Matter not found.");
        }

        return {
          allowedContentTypes: ALLOWED_CONTENT_TYPES,
          maximumSizeInBytes: MAXIMUM_SIZE,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({ userId: user.userId, filename: safeFilename(pathname), matterId } satisfies UploadContext),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        if (!tokenPayload) throw new Error("Missing upload ownership data.");
        const context = JSON.parse(tokenPayload) as UploadContext;
        const metadata = await head(blob.pathname);
        const sql = getPostgres();
        await sql`
          INSERT INTO user_documents (id, owner_id, matter_id, filename, pathname, blob_url, content_type, size_bytes)
          VALUES (${crypto.randomUUID()}, ${context.userId}, ${context.matterId}, ${context.filename}, ${blob.pathname}, ${blob.url}, ${blob.contentType}, ${metadata.size})
          ON CONFLICT (pathname) DO NOTHING
        `;
      },
    });
    return Response.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Document upload failed.";
    return Response.json({ error: message }, { status: message === "Authentication required." ? 401 : 400 });
  }
}
