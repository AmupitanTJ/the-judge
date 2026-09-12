import { LEGAL_SOURCES } from "../../../../db/legal-sources";
import { getPostgres, hasPostgres } from "../../../../db/postgres";
import { corpusAdminConfigured, requireCorpusAdmin } from "../../../corpus-admin";

type IntakePayload = {
  canonicalTitle?: string;
  citation?: string;
  documentType?: string;
  jurisdiction?: string;
  issuingBody?: string;
  sourcePublisher?: string;
  sourceUrl?: string;
};

function clean(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

export async function GET() {
  const user = await requireCorpusAdmin();
  if (!user) return Response.json({ error: "Corpus administrator access is required." }, { status: 403 });

  if (!hasPostgres()) {
    return Response.json({
      documents: [],
      collections: LEGAL_SOURCES,
      persistence: "preview",
      message: "Connect the production database to save a review queue.",
    });
  }

  const sql = getPostgres();
  const documents = await sql`
    SELECT id, canonical_title AS "canonicalTitle", citation, document_type AS "documentType",
      jurisdiction, issuing_body AS "issuingBody", source_publisher AS "sourcePublisher",
      source_url AS "sourceUrl", legal_status AS "legalStatus", review_status AS "reviewStatus",
      last_verified_at AS "lastVerifiedAt", created_at AS "createdAt"
    FROM legal_documents
    ORDER BY CASE review_status WHEN 'source_verified' THEN 2 ELSE 1 END, created_at DESC
    LIMIT 100
  `;
  return Response.json({ documents, collections: LEGAL_SOURCES, persistence: "postgres" });
}

export async function POST(request: Request) {
  const user = await requireCorpusAdmin();
  if (!user) return Response.json({ error: "Corpus administrator access is required." }, { status: 403 });
  if (!hasPostgres()) return Response.json({ error: "A production database is required to save review items." }, { status: 503 });

  let payload: IntakePayload;
  try { payload = await request.json(); } catch { return Response.json({ error: "Invalid request body." }, { status: 400 }); }

  const canonicalTitle = clean(payload.canonicalTitle, 280);
  const documentType = clean(payload.documentType, 80);
  const jurisdiction = clean(payload.jurisdiction, 100);
  const sourcePublisher = clean(payload.sourcePublisher, 180);
  const sourceUrl = clean(payload.sourceUrl, 1000);
  if (!canonicalTitle || !documentType || !jurisdiction || !sourcePublisher || !sourceUrl) {
    return Response.json({ error: "Title, type, jurisdiction, publisher and original URL are required." }, { status: 400 });
  }
  try { new URL(sourceUrl); } catch { return Response.json({ error: "Enter a valid original-source URL." }, { status: 400 }); }

  const id = crypto.randomUUID();
  const sql = getPostgres();
  await sql`
    INSERT INTO legal_documents (id, canonical_title, citation, document_type, jurisdiction, issuing_body, source_url, source_publisher, legal_status, review_status)
    VALUES (${id}, ${canonicalTitle}, ${clean(payload.citation, 180) || null}, ${documentType}, ${jurisdiction}, ${clean(payload.issuingBody, 180) || null}, ${sourceUrl}, ${sourcePublisher}, 'review_pending', 'intake')
  `;
  return Response.json({ id, message: "Intake record created. It cannot be cited until passage verification is complete." }, { status: 201 });
}

export async function PATCH(request: Request) {
  const user = await requireCorpusAdmin();
  if (!user) return Response.json({ error: "Corpus administrator access is required." }, { status: 403 });
  if (!hasPostgres()) return Response.json({ error: "A production database is required to update review items." }, { status: 503 });
  let payload: { id?: string; reviewStatus?: string; legalStatus?: string };
  try { payload = await request.json(); } catch { return Response.json({ error: "Invalid request body." }, { status: 400 }); }
  if (!payload.id || !["intake", "metadata_verified", "source_verified", "needs_review"].includes(payload.reviewStatus ?? "")) {
    return Response.json({ error: "Choose a valid document and review status." }, { status: 400 });
  }
  if (payload.reviewStatus === "source_verified") {
    return Response.json({ error: "Passage verification is required before a document can be marked source verified." }, { status: 409 });
  }
  const sql = getPostgres();
  await sql`
    UPDATE legal_documents
    SET review_status = ${payload.reviewStatus}, legal_status = ${clean(payload.legalStatus, 80) || 'review_pending'}, updated_at = now()
    WHERE id = ${payload.id}
  `;
  return Response.json({ message: "Review status updated." });
}

export async function OPTIONS() {
  return Response.json({ configured: corpusAdminConfigured() });
}
