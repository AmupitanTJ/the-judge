import { getPostgres, hasPostgres } from "../../../../../db/postgres";
import { requireCorpusAdmin } from "../../../../corpus-admin";

type PassagePayload = { documentId?: string; provisionLabel?: string; pageNumber?: string; textContent?: string; keywords?: string; professionalSummary?: string; plainSummary?: string; confirmedAgainstSource?: boolean };

function clean(value: unknown, maxLength: number) { return typeof value === "string" ? value.trim().slice(0, maxLength) : ""; }

export async function POST(request: Request) {
  const user = await requireCorpusAdmin();
  if (!user) return Response.json({ error: "Corpus administrator access is required." }, { status: 403 });
  if (!hasPostgres()) return Response.json({ error: "A production database is required to verify passages." }, { status: 503 });
  let payload: PassagePayload;
  try { payload = await request.json(); } catch { return Response.json({ error: "Invalid request body." }, { status: 400 }); }
  const documentId = clean(payload.documentId, 80);
  const provisionLabel = clean(payload.provisionLabel, 160);
  const textContent = clean(payload.textContent, 12000);
  const professionalSummary = clean(payload.professionalSummary, 1600);
  const plainSummary = clean(payload.plainSummary, 1600);
  if (!documentId || !provisionLabel || !textContent || !professionalSummary || !plainSummary) return Response.json({ error: "Document, provision label, exact text, professional summary and plain-language summary are required." }, { status: 400 });
  if (textContent.length < 24) return Response.json({ error: "The exact passage is too short to verify." }, { status: 400 });
  if (!payload.confirmedAgainstSource) return Response.json({ error: "Confirm that the text was checked against the named original source." }, { status: 400 });
  const sql = getPostgres();
  const documents = await sql`SELECT id, review_status AS "reviewStatus" FROM legal_documents WHERE id = ${documentId} LIMIT 1` as { id: string; reviewStatus: string }[];
  if (!documents.length) return Response.json({ error: "Document not found." }, { status: 404 });
  if (!['metadata_verified', 'passage_verified', 'source_verified'].includes(documents[0].reviewStatus)) return Response.json({ error: "Confirm document metadata before verifying a passage." }, { status: 409 });
  const id = crypto.randomUUID();
  const pageNumber = Number.parseInt(clean(payload.pageNumber, 8), 10);
  await sql`INSERT INTO legal_passages (id, document_id, provision_label, page_number, text_content, keywords, professional_summary, plain_summary, checksum, review_status) VALUES (${id}, ${documentId}, ${provisionLabel}, ${Number.isSafeInteger(pageNumber) && pageNumber > 0 ? pageNumber : null}, ${textContent}, ${clean(payload.keywords, 1000)}, ${professionalSummary}, ${plainSummary}, ${`${id}:${textContent.length}`}, 'source_verified')`;
  await sql`UPDATE legal_documents SET review_status = 'passage_verified', last_verified_at = CURRENT_DATE, updated_at = now() WHERE id = ${documentId}`;
  return Response.json({ id, message: "Passage verified. It is now eligible for source-backed research." }, { status: 201 });
}
