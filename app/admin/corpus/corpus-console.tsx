"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

type DocumentRecord = { id: string; canonicalTitle: string; citation: string | null; documentType: string; jurisdiction: string; issuingBody: string | null; sourcePublisher: string; sourceUrl: string; legalStatus: string; reviewStatus: string; lastVerifiedAt: string | null; verifiedPassageCount: number };
type Collection = { id: string; name: string; publisher: string; url: string; jurisdiction: string; status: string; coverage: string };
const INITIAL_FORM = { canonicalTitle: "", citation: "", documentType: "Act", jurisdiction: "Federal", issuingBody: "", sourcePublisher: "", sourceUrl: "" };
const INITIAL_PASSAGE = { documentId: "", provisionLabel: "", pageNumber: "", textContent: "", keywords: "", professionalSummary: "", plainSummary: "", confirmedAgainstSource: false };

export default function CorpusConsole() {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [form, setForm] = useState(INITIAL_FORM);
  const [passage, setPassage] = useState(INITIAL_PASSAGE);
  const [message, setMessage] = useState("Loading the corpus review queue…");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const response = await fetch("/api/admin/corpus", { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) { setMessage(data.error ?? "Unable to load the review queue."); return; }
    setDocuments(data.documents ?? []); setCollections(data.collections ?? []);
    setMessage(data.message ?? "Only passage-verified text can be cited by The Judge.");
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function addIntake(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setMessage("Saving intake record…");
    const response = await fetch("/api/admin/corpus", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(form) });
    const data = await response.json(); setSaving(false);
    if (!response.ok) { setMessage(data.error ?? "Unable to create intake record."); return; }
    setForm(INITIAL_FORM); setMessage(data.message); await load();
  }

  async function setMetadataVerified(id: string) {
    const response = await fetch("/api/admin/corpus", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ id, reviewStatus: "metadata_verified" }) });
    const data = await response.json(); setMessage(data.message ?? data.error ?? "Unable to update review status."); await load();
  }

  async function verifyPassage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setMessage("Recording verified passage…");
    const response = await fetch("/api/admin/corpus/passages", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(passage) });
    const data = await response.json(); setSaving(false);
    if (!response.ok) { setMessage(data.error ?? "Unable to verify this passage."); return; }
    setPassage(INITIAL_PASSAGE); setMessage(data.message); await load();
  }

  function selectCollection(collection: Collection) {
    setForm((current) => ({ ...current, jurisdiction: collection.jurisdiction, sourcePublisher: collection.publisher, sourceUrl: collection.url }));
    setMessage(`Using ${collection.name} as the original collection. Add the specific document details before saving.`);
  }

  return <>
    <section className="admin-hero"><p className="eyebrow">Restricted workspace</p><h1>Corpus review console</h1><p>Record a source, review its metadata, then verify exact passages. A collection link alone never makes material citable.</p></section>
    <p className="admin-notice" role="status">{message}</p>
    <section className="admin-grid">
      <form className="intake-form" onSubmit={addIntake}><div><p className="eyebrow">01 · Source intake</p><h2>Add a document for review</h2></div>
        <label>Canonical title<input required value={form.canonicalTitle} onChange={(event) => setForm({ ...form, canonicalTitle: event.target.value })} placeholder="e.g. Land Use Act" /></label>
        <div className="two-inputs"><label>Document type<input required value={form.documentType} onChange={(event) => setForm({ ...form, documentType: event.target.value })} /></label><label>Jurisdiction<input required value={form.jurisdiction} onChange={(event) => setForm({ ...form, jurisdiction: event.target.value })} /></label></div>
        <label>Citation (if available)<input value={form.citation} onChange={(event) => setForm({ ...form, citation: event.target.value })} /></label>
        <label>Issuing body<input value={form.issuingBody} onChange={(event) => setForm({ ...form, issuingBody: event.target.value })} placeholder="e.g. National Assembly of Nigeria" /></label>
        <label>Source publisher<input required value={form.sourcePublisher} onChange={(event) => setForm({ ...form, sourcePublisher: event.target.value })} /></label>
        <label>Original-source URL<input required type="url" value={form.sourceUrl} onChange={(event) => setForm({ ...form, sourceUrl: event.target.value })} /></label>
        <button disabled={saving}>{saving ? "Saving…" : "Create intake record"}</button>
      </form>
      <section className="collection-picker"><p className="eyebrow">Registered collections</p><h2>Choose an official starting point</h2><div>{collections.map((collection) => <article key={collection.id}><span>{collection.status}</span><h3>{collection.name}</h3><p>{collection.publisher} · {collection.jurisdiction}</p><button type="button" onClick={() => selectCollection(collection)}>Use collection</button></article>)}</div></section>
    </section>
    <section className="review-queue"><div><p className="eyebrow">02 · Metadata review</p><h2>Review queue</h2><p>“Metadata verified” confirms the record and original source, not the legal text. Passage review remains required.</p></div>
      {documents.length ? <div className="review-list">{documents.map((document) => <article key={document.id}><div><span className="review-status">{document.reviewStatus.replaceAll("_", " ")}</span><h3>{document.canonicalTitle}</h3><p>{document.documentType} · {document.jurisdiction} · {document.sourcePublisher} · {document.verifiedPassageCount} verified passages</p><a href={document.sourceUrl} target="_blank" rel="noreferrer">Open original source ↗</a></div><button type="button" disabled={document.reviewStatus !== "intake"} onClick={() => void setMetadataVerified(document.id)}>{document.reviewStatus === "intake" ? "Confirm metadata" : "Metadata confirmed"}</button></article>)}</div> : <div className="admin-empty"><strong>No stored review items yet.</strong><p>Create a document intake record once the production database is connected.</p></div>}
    </section>
    <section className="passage-verifier"><div><p className="eyebrow">03 · Passage verification</p><h2>Verify the exact legal text</h2><p>Use the official edition linked on the document. The exact passage and both summaries are stored with the verification record.</p></div><form className="passage-form" onSubmit={verifyPassage}>
      <label>Reviewed document<select required value={passage.documentId} onChange={(event) => setPassage({ ...passage, documentId: event.target.value })}><option value="">Select a metadata-verified document</option>{documents.filter((document) => ["metadata_verified", "passage_verified", "source_verified"].includes(document.reviewStatus)).map((document) => <option key={document.id} value={document.id}>{document.canonicalTitle}</option>)}</select></label>
      <div className="two-inputs"><label>Provision label<input required value={passage.provisionLabel} onChange={(event) => setPassage({ ...passage, provisionLabel: event.target.value })} placeholder="e.g. Section 1(1)" /></label><label>Page number<input inputMode="numeric" value={passage.pageNumber} onChange={(event) => setPassage({ ...passage, pageNumber: event.target.value })} /></label></div>
      <label>Exact source passage<textarea required rows={7} value={passage.textContent} onChange={(event) => setPassage({ ...passage, textContent: event.target.value })} placeholder="Paste only the exact text checked against the original source." /></label>
      <label>Keywords<input value={passage.keywords} onChange={(event) => setPassage({ ...passage, keywords: event.target.value })} placeholder="e.g. tenancy, notice, possession" /></label>
      <label>Professional summary<textarea required rows={3} value={passage.professionalSummary} onChange={(event) => setPassage({ ...passage, professionalSummary: event.target.value })} /></label>
      <label>Plain-language summary<textarea required rows={3} value={passage.plainSummary} onChange={(event) => setPassage({ ...passage, plainSummary: event.target.value })} /></label>
      <label className="confirmation"><input type="checkbox" checked={passage.confirmedAgainstSource} onChange={(event) => setPassage({ ...passage, confirmedAgainstSource: event.target.checked })} />I checked this exact text against the named original source.</label><button disabled={saving}>{saving ? "Verifying…" : "Verify passage for research"}</button>
    </form></section>
    <section className="admin-rule"><p className="eyebrow">Non-negotiable rule</p><h2>Verification is passage by passage.</h2><p>Confirming document metadata does not certify its text. A passage becomes eligible for research only when a reviewer has checked the exact words against the original edition. The Judge will retrieve only records marked source verified.</p></section>
  </>;
}
