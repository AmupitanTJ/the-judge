"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

type DocumentRecord = { id: string; canonicalTitle: string; citation: string | null; documentType: string; jurisdiction: string; issuingBody: string | null; sourcePublisher: string; sourceUrl: string; legalStatus: string; reviewStatus: string; lastVerifiedAt: string | null };
type Collection = { id: string; name: string; publisher: string; url: string; jurisdiction: string; status: string; coverage: string };
const INITIAL_FORM = { canonicalTitle: "", citation: "", documentType: "Act", jurisdiction: "Federal", issuingBody: "", sourcePublisher: "", sourceUrl: "" };

export default function CorpusConsole() {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [form, setForm] = useState(INITIAL_FORM);
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
      {documents.length ? <div className="review-list">{documents.map((document) => <article key={document.id}><div><span className="review-status">{document.reviewStatus.replaceAll("_", " ")}</span><h3>{document.canonicalTitle}</h3><p>{document.documentType} · {document.jurisdiction} · {document.sourcePublisher}</p><a href={document.sourceUrl} target="_blank" rel="noreferrer">Open original source ↗</a></div><button type="button" disabled={document.reviewStatus !== "intake"} onClick={() => void setMetadataVerified(document.id)}>{document.reviewStatus === "intake" ? "Confirm metadata" : "Metadata confirmed"}</button></article>)}</div> : <div className="admin-empty"><strong>No stored review items yet.</strong><p>Create a document intake record once the production database is connected.</p></div>}
    </section>
    <section className="admin-rule"><p className="eyebrow">Non-negotiable rule</p><h2>Do not mark a document as source verified here.</h2><p>That status is reserved for a later passage-review step, where each quotation is checked against the named edition and its current legal status. This prevents The Judge from generating answers based on an unreviewed link.</p></section>
  </>;
}
