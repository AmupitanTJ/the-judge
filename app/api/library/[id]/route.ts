import { getChatGPTUser } from "../../../chatgpt-auth";
import { getD1 } from "../../../../db";
import { verifiedDocuments, verifiedPassages } from "../../../../db/legal-corpus";
import { getPostgres, hasPostgres } from "../../../../db/postgres";

type LibraryDocumentRow = {
  id: string;
  canonicalTitle: string;
  citation: string | null;
  documentType: string;
  jurisdiction: string;
  issuingBody: string | null;
  sourceUrl: string;
  sourcePublisher: string;
  legalStatus: string;
  reviewStatus: string;
  lastVerifiedAt: string | null;
};

type LibraryPassageRow = {
  id: string;
  provisionLabel: string;
  pageNumber: string | null;
  paragraphNumber: string | null;
  textContent: string;
  professionalSummary: string | null;
  plainSummary: string | null;
  reviewStatus: string;
};

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "Authentication required" }, { status: 401 });

  const { id } = await context.params;
  const documentId = id.trim().slice(0, 80);
  if (!documentId) return Response.json({ error: "Authority not found." }, { status: 404 });

  const fallback = () => {
    const document = verifiedDocuments.find((entry) => entry.id === documentId);
    if (!document) return null;
    const passages = verifiedPassages.filter((passage) => passage.documentId === document.id || passage.id.startsWith("constitution-"));
    return { document, passages, persistence: "preview" as const };
  };

  try {
    if (hasPostgres()) {
      const sql = getPostgres();
      const documents = await sql`
        SELECT id, canonical_title AS "canonicalTitle", citation, document_type AS "documentType",
          jurisdiction, issuing_body AS "issuingBody", source_url AS "sourceUrl",
          source_publisher AS "sourcePublisher", legal_status AS "legalStatus",
          review_status AS "reviewStatus", last_verified_at AS "lastVerifiedAt"
        FROM legal_documents WHERE id = ${documentId} LIMIT 1
      ` as LibraryDocumentRow[];
      const document = documents[0];
      if (!document) return Response.json({ error: "Authority not found." }, { status: 404 });
      const passages = await sql`
        SELECT id, provision_label AS "provisionLabel", page_number AS "pageNumber",
          paragraph_number AS "paragraphNumber", text_content AS "textContent",
          professional_summary AS "professionalSummary", plain_summary AS "plainSummary",
          review_status AS "reviewStatus"
        FROM legal_passages
        WHERE document_id = ${documentId} AND review_status = 'source_verified'
        ORDER BY paragraph_number ASC, provision_label ASC
      ` as LibraryPassageRow[];
      return Response.json({ document, passages, persistence: "postgres" });
    }

    if (process.env.VERCEL) {
      const preview = fallback();
      if (!preview) return Response.json({ error: "Authority not found." }, { status: 404 });
      return Response.json(preview);
    }

    const database = await getD1();
    const document = await database.prepare(`
      SELECT id, canonical_title AS canonicalTitle, citation, document_type AS documentType,
        jurisdiction, issuing_body AS issuingBody, source_url AS sourceUrl,
        source_publisher AS sourcePublisher, legal_status AS legalStatus,
        review_status AS reviewStatus, last_verified_at AS lastVerifiedAt
      FROM legal_documents WHERE id = ?1 LIMIT 1
    `).bind(documentId).first();
    if (!document) return Response.json({ error: "Authority not found." }, { status: 404 });

    const passages = (await database.prepare(`
      SELECT id, provision_label AS provisionLabel, page_number AS pageNumber,
        paragraph_number AS paragraphNumber, text_content AS textContent,
        professional_summary AS professionalSummary, plain_summary AS plainSummary,
        review_status AS reviewStatus
      FROM legal_passages
      WHERE document_id = ?1 AND review_status = 'source_verified'
      ORDER BY paragraph_number ASC, provision_label ASC
    `).bind(documentId).all()).results;

    return Response.json({ document, passages, persistence: "d1" });
  } catch {
    const preview = fallback();
    if (!preview) return Response.json({ error: "Authority not found." }, { status: 404 });
    return Response.json(preview);
  }
}
