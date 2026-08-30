import { getChatGPTUser } from "../../chatgpt-auth";
import { getD1 } from "../../../db";
import { verifiedDocuments } from "../../../db/legal-corpus";

export async function GET(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "Authentication required" }, { status: 401 });

  const query = new URL(request.url).searchParams.get("q")?.trim().slice(0, 120) ?? "";
  if (process.env.VERCEL) {
    const normalized = query.toLowerCase();
    const documents = verifiedDocuments.filter((document) =>
      !normalized || `${document.canonicalTitle} ${document.citation} ${document.documentType}`.toLowerCase().includes(normalized)
    );
    return Response.json({ documents, query, persistence: "preview" });
  }
  const pattern = `%${query.replaceAll("%", "\\%").replaceAll("_", "\\_")}%`;
  const result = await (await getD1()).prepare(`
    SELECT id, canonical_title AS canonicalTitle, citation, document_type AS documentType,
      jurisdiction, issuing_body AS issuingBody, source_url AS sourceUrl,
      source_publisher AS sourcePublisher, legal_status AS legalStatus,
      review_status AS reviewStatus, last_verified_at AS lastVerifiedAt
    FROM legal_documents
    WHERE canonical_title LIKE ?1 ESCAPE '\\'
      OR COALESCE(citation, '') LIKE ?1 ESCAPE '\\'
      OR document_type LIKE ?1 ESCAPE '\\'
    ORDER BY canonical_title ASC
    LIMIT 50
  `).bind(pattern).all();

  return Response.json({ documents: result.results, query });
}
