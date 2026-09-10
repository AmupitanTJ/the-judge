"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { useClerk, useUser, UserButton } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { LEGAL_SOURCES } from "../db/legal-sources";
import { JURISDICTIONS, PRACTICE_AREAS } from "../lib/coverage";
import { remapAnswerMode, type AnswerMode } from "../lib/research-answer";
import { DocumentUpload } from "./components/document-upload";

type LegalDocument = {
  id: string;
  canonicalTitle: string;
  citation: string | null;
  documentType: string;
  jurisdiction: string;
  issuingBody?: string | null;
  sourceUrl: string;
  sourcePublisher: string;
  legalStatus: string;
  reviewStatus: string;
  lastVerifiedAt: string | null;
};
type Matter = { id: string; title: string; reference: string | null; jurisdiction: string; status: string; updatedAt?: string };
type ResearchPassage = {
  id: string;
  documentId?: string;
  provisionLabel: string;
  textContent: string;
  professionalSummary: string | null;
  plainSummary: string | null;
  canonicalTitle: string;
  citation: string | null;
  sourceUrl: string;
  sourcePublisher: string;
  legalStatus: string;
  lastVerifiedAt: string | null;
  treatment?: "binding";
  hierarchy?: string;
};
type ResearchResult = {
  sessionId: string;
  status: "grounded" | "insufficient_coverage" | "needs_clarification";
  question: string;
  answerMode: AnswerMode;
  shortAnswer: string | null;
  jurisdiction: string;
  requestedJurisdiction?: string;
  jurisdictionNotice?: string | null;
  assumptions: string[];
  governingLaw: string | null;
  analysis: { proposition: string; citationLabel: string; passageId: string; displayOrder: number }[];
  passages: ResearchPassage[];
  nextSteps: string[];
  limitations: string;
  verifiedAsOf: string;
  clarification: string | null;
  why: { method: string; coverage: string; assumptions: string[]; retrievedPassageIds: string[] };
};
type ResearchSession = { id: string; question: string; answerMode: AnswerMode; jurisdiction: string; createdAt: string; citationCount: number };
type UserDocument = {
  id: string;
  filename: string;
  contentType: string;
  sizeBytes: number;
  status: string;
  matterId: string | null;
  matterTitle: string | null;
  createdAt: string;
};
type SavedAuthority = {
  id: string;
  documentId: string;
  provisionLabel: string;
  textContent: string;
  canonicalTitle: string;
  citation: string | null;
  sourceUrl: string;
  legalStatus: string;
  jurisdiction: string;
  lastVerifiedAt: string | null;
  useCount: number;
};
type CoverageRow = {
  jurisdiction: string;
  documentType: string;
  scope: string;
  reviewStatus: string;
  legalStatus: string;
  lastVerifiedAt: string | null;
};
type SourcePassage = { id: string; provisionLabel: string; textContent: string; professionalSummary: string | null; plainSummary: string | null };

const navItems = [
  { key: "Ask The Judge", label: "New chat", glyph: "+" },
  { key: "Research", label: "Research projects", glyph: "R" },
  { key: "Matters", label: "Court cases", glyph: "C" },
  { key: "Library", label: "Library & sources", glyph: "L" },
  { key: "Documents", label: "Documents", glyph: "D" },
  { key: "Saved", label: "Saved authorities", glyph: "S" },
  { key: "Updates", label: "Law updates", glyph: "U" },
  { key: "Profile", label: "Profile", glyph: "P" },
] as const;

function SignOutIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M8 4H4v12h4M12 6l4 4-4 4M7 10h9" />
    </svg>
  );
}

function labelStatus(value: string) {
  return value.replaceAll("_", " ");
}

function formatDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
}

function answerPlainText(result: ResearchResult) {
  return [
    result.shortAnswer ? `SHORT ANSWER\n${result.shortAnswer}` : null,
    `JURISDICTION AND ASSUMPTIONS\n${result.jurisdiction}\n${result.assumptions.join("\n")}`,
    result.governingLaw ? `GOVERNING LAW\n${result.governingLaw}` : null,
    result.analysis.length ? `ANALYSIS\n${result.analysis.map((item) => `${item.displayOrder}. ${item.proposition} [${item.citationLabel}]`).join("\n")}` : null,
    result.passages.length ? `AUTHORITIES\n${result.passages.map((passage, index) => `[${index + 1}] ${passage.canonicalTitle}, ${passage.provisionLabel} — ${passage.treatment ?? "binding"}; ${labelStatus(passage.legalStatus)}`).join("\n")}` : null,
    result.nextSteps.length ? `NEXT STEPS\n${result.nextSteps.map((step) => `- ${step}`).join("\n")}` : null,
    `LIMITATIONS\n${result.limitations}\nVerified as of ${result.verifiedAsOf}`,
  ].filter(Boolean).join("\n\n");
}

export default function Home() {
  const { user } = useUser();
  const { openUserProfile, signOut } = useClerk();
  const [mode, setMode] = useState<AnswerMode>("professional");
  const [active, setActive] = useState("Ask The Judge");
  const [query, setQuery] = useState("");
  const [jurisdiction, setJurisdiction] = useState<(typeof JURISDICTIONS)[number]>("Federal");
  const [practiceArea, setPracticeArea] = useState<(typeof PRACTICE_AREAS)[number]>("All practice areas");
  const [submitted, setSubmitted] = useState(false);
  const [researchResult, setResearchResult] = useState<ResearchResult | null>(null);
  const [researchLoading, setResearchLoading] = useState(false);
  const [researchError, setResearchError] = useState("");
  const [copied, setCopied] = useState(false);
  const [whyOpen, setWhyOpen] = useState(false);
  const [selectedPassageId, setSelectedPassageId] = useState<string | null>(null);
  const [selectedMatterId, setSelectedMatterId] = useState<string | null>(null);
  const [sidebarWidth, setSidebarWidth] = useState(264);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [resizingSidebar, setResizingSidebar] = useState(false);
  const [documents, setDocuments] = useState<LegalDocument[]>([]);
  const [privateDocuments, setPrivateDocuments] = useState<UserDocument[]>([]);
  const [libraryQuery, setLibraryQuery] = useState("");
  const [matters, setMatters] = useState<Matter[]>([]);
  const [researchSessions, setResearchSessions] = useState<ResearchSession[]>([]);
  const [savedAuthorities, setSavedAuthorities] = useState<SavedAuthority[]>([]);
  const [coverageRows, setCoverageRows] = useState<CoverageRow[]>([]);
  const [coverageSummary, setCoverageSummary] = useState("");
  const [matterTitle, setMatterTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [sourceDocument, setSourceDocument] = useState<LegalDocument | null>(null);
  const [sourcePassages, setSourcePassages] = useState<SourcePassage[]>([]);
  const [sourceHighlight, setSourceHighlight] = useState<string | null>(null);
  const [sourceLoading, setSourceLoading] = useState(false);
  const [returnToAnswer, setReturnToAnswer] = useState(false);

  useEffect(() => {
    if (user?.id) fetch("/api/me").catch(() => undefined);
    loadResearchHistory();
  }, [user?.id]);

  useEffect(() => {
    if (!resizingSidebar) return;
    function resize(event: PointerEvent) {
      setSidebarWidth(Math.min(390, Math.max(220, event.clientX)));
    }
    function stopResizing() { setResizingSidebar(false); }
    window.addEventListener("pointermove", resize);
    window.addEventListener("pointerup", stopResizing, { once: true });
    return () => {
      window.removeEventListener("pointermove", resize);
      window.removeEventListener("pointerup", stopResizing);
    };
  }, [resizingSidebar]);

  useEffect(() => {
    if (active === "Library") loadLibrary();
    if (active === "Matters") loadMatters();
    if (active === "Research") loadResearchHistory();
    if (active === "Saved") loadSaved();
    if (active === "Updates") loadCoverage();
    if (active === "Documents") loadPrivateDocuments();
  }, [active]);

  async function loadLibrary(search = "") {
    setLoading(true);
    try {
      const response = await fetch(`/api/library?q=${encodeURIComponent(search)}`);
      const data = response.ok ? await response.json() : { documents: [] };
      setDocuments(data.documents ?? []);
    } finally { setLoading(false); }
  }

  async function loadMatters() {
    setLoading(true);
    try {
      const response = await fetch("/api/matters");
      const data = response.ok ? await response.json() : { matters: [] };
      setMatters(data.matters ?? []);
    } finally { setLoading(false); }
  }

  async function loadResearchHistory() {
    try {
      const response = await fetch("/api/research");
      const data = response.ok ? await response.json() : { sessions: [] };
      setResearchSessions(data.sessions ?? []);
    } catch {
      setResearchSessions([]);
    }
  }

  async function loadSaved() {
    setLoading(true);
    try {
      const response = await fetch("/api/saved");
      const data = response.ok ? await response.json() : { authorities: [] };
      setSavedAuthorities(data.authorities ?? []);
    } finally { setLoading(false); }
  }

  async function loadCoverage() {
    setLoading(true);
    try {
      const response = await fetch("/api/coverage");
      const data = response.ok ? await response.json() : { matrix: [], summary: "" };
      setCoverageRows(data.matrix ?? []);
      setCoverageSummary(data.summary ?? "");
    } finally { setLoading(false); }
  }

  async function loadPrivateDocuments() {
    setLoading(true);
    try {
      const response = await fetch("/api/documents");
      const data = response.ok ? await response.json() : { documents: [] };
      setPrivateDocuments(data.documents ?? []);
    } finally { setLoading(false); }
  }

  function formatBytes(value: number) {
    if (value < 1024) return `${value} B`;
    if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
    return `${(value / (1024 * 1024)).toFixed(1)} MB`;
  }

  async function openSource(documentId: string, highlightPassageId?: string, fromAnswer = false) {
    setSourceLoading(true);
    setSourceHighlight(highlightPassageId ?? null);
    setReturnToAnswer(fromAnswer);
    setActive("Library");
    try {
      const response = await fetch(`/api/library/${encodeURIComponent(documentId)}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Authority could not be opened.");
      setSourceDocument(data.document);
      setSourcePassages(data.passages ?? []);
    } catch {
      setSourceDocument(null);
      setSourcePassages([]);
    } finally {
      setSourceLoading(false);
    }
  }

  async function openSession(sessionId: string) {
    setActive("Ask The Judge");
    setSubmitted(true);
    setResearchLoading(true);
    setResearchError("");
    setWhyOpen(false);
    try {
      const response = await fetch(`/api/research/${sessionId}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Saved research could not be opened.");
      setQuery(data.question);
      setMode(data.answerMode);
      setJurisdiction((JURISDICTIONS as readonly string[]).includes(data.jurisdiction) ? data.jurisdiction as (typeof JURISDICTIONS)[number] : "Federal");
      setResearchResult(data);
      setSelectedPassageId(data.passages?.[0]?.id ?? null);
    } catch (error) {
      setResearchError(error instanceof Error ? error.message : "Saved research could not be opened.");
    } finally {
      setResearchLoading(false);
    }
  }

  async function createMatter(event: React.FormEvent) {
    event.preventDefault();
    if (!matterTitle.trim()) return;
    const response = await fetch("/api/matters", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ title: matterTitle, jurisdiction }) });
    if (response.ok) { setMatterTitle(""); await loadMatters(); }
  }

  async function ask(event: React.FormEvent) {
    event.preventDefault();
    if (!query.trim()) return;
    setSubmitted(true);
    await runResearch(mode);
  }

  async function runResearch(answerMode: AnswerMode, nextJurisdiction = jurisdiction) {
    setMode(answerMode);
    setJurisdiction(nextJurisdiction);
    setResearchLoading(true);
    setResearchError("");
    setResearchResult(null);
    setCopied(false);
    setWhyOpen(false);
    try {
      const response = await fetch("/api/research", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          question: query,
          mode: answerMode,
          jurisdiction: nextJurisdiction,
          practiceArea,
          matterId: selectedMatterId,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Research could not be completed.");
      setResearchResult(data);
      setSelectedPassageId(data.passages?.[0]?.id ?? null);
      await loadResearchHistory();
    } catch (error) {
      setResearchError(error instanceof Error ? error.message : "Research could not be completed.");
    } finally {
      setResearchLoading(false);
    }
  }

  function switchMode(nextMode: AnswerMode) {
    if (researchResult?.status === "grounded") {
      setMode(nextMode);
      setResearchResult({ ...remapAnswerMode(researchResult, nextMode), answerMode: nextMode });
      return;
    }
    if (submitted && query.trim()) void runResearch(nextMode);
    else setMode(nextMode);
  }

  async function copyAnswer() {
    if (!researchResult) return;
    await navigator.clipboard.writeText(answerPlainText(researchResult));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  function startNewResearch() {
    setActive("Ask The Judge");
    setQuery("");
    setSubmitted(false);
    setResearchResult(null);
    setResearchError("");
    setSelectedMatterId(null);
    setSelectedPassageId(null);
    setSourceDocument(null);
    setCopied(false);
    setWhyOpen(false);
  }

  const selectedMatter = matters.find((matter) => matter.id === selectedMatterId);

  return (
    <main
      className={sidebarCollapsed ? "app-shell sidebar-is-collapsed" : "app-shell"}
      style={{ "--sidebar-width": `${sidebarCollapsed ? 76 : sidebarWidth}px` } as CSSProperties}
    >
      <aside className={sidebarCollapsed ? "sidebar collapsed" : "sidebar"}>
        <div>
          <div className="sidebar-head">
            <Link className="brand" href="/" aria-label="The Judge home">
              <span className="brand-mark"><Image src="/brand/the-judge-app-icon.png" alt="" width={48} height={48} priority /></span>
              <span>THE JUDGE</span>
            </Link>
            <button className="collapse-sidebar" type="button" onClick={() => setSidebarCollapsed((value) => !value)} aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}>{sidebarCollapsed ? "›" : "‹"}</button>
          </div>

          <nav aria-label="Main navigation">
            {navItems.map((item) => (
              <button
                key={item.key}
                className={active === item.key ? "nav-item active" : "nav-item"}
                onClick={() => {
                  if (item.key === "Ask The Judge") startNewResearch();
                  else setActive(item.key);
                  setSourceDocument(null);
                  setReturnToAnswer(false);
                }}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <span className="nav-glyph" aria-hidden="true">{item.glyph}</span>
                <span className="nav-label">{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="recent-block">
            <p className="eyebrow">Recent research</p>
            {researchSessions.slice(0, 5).length ? researchSessions.slice(0, 5).map((session) => (
              <button className="recent-item" key={session.id} onClick={() => openSession(session.id)}>
                <span>{session.question}</span>
                <small>{session.jurisdiction} · {formatDate(session.createdAt)}</small>
              </button>
            )) : <p className="recent-empty">No saved research yet</p>}
          </div>
        </div>

        <div className="profile" title={sidebarCollapsed ? "Account menu" : undefined}>
          <UserButton appearance={{ elements: { userButtonTrigger: "clerk-user-trigger", avatarBox: "clerk-avatar" } }} />
          <button className="profile-copy" type="button" onClick={() => setActive("Profile")}>
            <strong>{user?.fullName || user?.username || "Your profile"}</strong>
            <small>{user?.primaryEmailAddress?.emailAddress || "Account settings"}</small>
          </button>
          <button className="profile-more" type="button" onClick={() => openUserProfile()} aria-label="Manage account">•••</button>
        </div>
        <div className="sidebar-resizer" role="separator" aria-orientation="vertical" aria-label="Resize sidebar" onPointerDown={() => { setSidebarCollapsed(false); setResizingSidebar(true); }} />
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div className="coverage"><span /> {jurisdiction} coverage <strong>Foundation</strong></div>
          <div className="top-actions">
            {selectedMatter ? <span className="matter-chip">Matter · {selectedMatter.title}</span> : null}
            <button className="invite" type="button" disabled title="Team workspaces are post-MVP">Invite your team</button>
            <button className="sign-out-button" type="button" onClick={() => void signOut({ redirectUrl: "/sign-in" })} aria-label="Log out" title="Log out"><SignOutIcon /></button>
          </div>
        </header>

        {active === "Profile" ? (
          <section className="collection-view profile-view">
            <div className="collection-head"><div><p className="eyebrow">Account workspace</p><h1>Your profile</h1><p>Manage the identity connected to your private cases, research projects and saved authorities.</p></div></div>
            <div className="profile-overview">
              <UserButton appearance={{ elements: { avatarBox: "profile-large-avatar" } }} />
              <div><p className="eyebrow">Signed in as</p><h2>{user?.fullName || user?.username || "The Judge user"}</h2><p>{user?.primaryEmailAddress?.emailAddress}</p></div>
              <button type="button" onClick={() => openUserProfile()}>Manage account</button>
            </div>
            <div className="account-grid">
              <button type="button" onClick={() => setActive("Matters")}><strong>{matters.length}</strong><span>Court cases</span><small>View private matter workspaces →</small></button>
              <button type="button" onClick={() => setActive("Research")}><strong>{researchSessions.length}</strong><span>Research projects</span><small>Return to saved evidence trails →</small></button>
              <button type="button" onClick={() => setActive("Saved")}><strong>{savedAuthorities.length}</strong><span>Saved authorities</span><small>Review sources used in answers →</small></button>
            </div>
          </section>
        ) : active === "Research" ? (
          <section className="collection-view">
            <div className="collection-head"><div><p className="eyebrow">Saved evidence trail</p><h1>Research history</h1><p>Your questions are stored with the authorities used for each answer.</p></div><span className="count-badge">{researchSessions.length} sessions</span></div>
            <div className="research-history">
              {researchSessions.length ? researchSessions.map((session) => (
                <article className="research-history-card" key={session.id}>
                  <div><span className="eyebrow">{session.jurisdiction} · {session.answerMode}</span><h3>{session.question}</h3></div>
                  <footer>
                    <span>{session.citationCount} {Number(session.citationCount) === 1 ? "authority" : "authorities"} · {formatDate(session.createdAt)}</span>
                    <button onClick={() => openSession(session.id)}>Open research →</button>
                  </footer>
                </article>
              )) : <div className="empty-panel"><span>R</span><h3>No saved research yet</h3><p>Ask a supported legal question and its evidence trail will appear here.</p></div>}
            </div>
          </section>
        ) : active === "Library" && sourceDocument ? (
          <section className="collection-view source-viewer">
            <button className="back" onClick={() => {
              setSourceDocument(null);
              setSourceHighlight(null);
              if (returnToAnswer) { setActive("Ask The Judge"); setSubmitted(true); setReturnToAnswer(false); }
            }}>{returnToAnswer ? "← Answer" : "← Library"}</button>
            <div className="collection-head">
              <div>
                <p className="eyebrow">{sourceDocument.documentType} · {sourceDocument.jurisdiction}</p>
                <h1>{sourceDocument.canonicalTitle}</h1>
                <p>{sourceDocument.citation || sourceDocument.documentType}{sourceDocument.issuingBody ? ` · ${sourceDocument.issuingBody}` : ""}</p>
              </div>
              <span className="review-pill">{labelStatus(sourceDocument.reviewStatus)}</span>
            </div>
            <dl className="source-meta">
              <div><dt>Legal status</dt><dd>{labelStatus(sourceDocument.legalStatus)}</dd></div>
              <div><dt>Source</dt><dd><a href={sourceDocument.sourceUrl} target="_blank" rel="noreferrer">{sourceDocument.sourcePublisher} ↗</a></dd></div>
              <div><dt>Last verified</dt><dd>{sourceDocument.lastVerifiedAt ? formatDate(sourceDocument.lastVerifiedAt) : "Not recorded"}</dd></div>
            </dl>
            {sourceLoading ? <p className="empty-state">Loading verified passages…</p> : sourcePassages.map((passage) => (
              <article key={passage.id} className={sourceHighlight === passage.id ? "passage-block highlighted" : "passage-block"} id={passage.id}>
                <p className="eyebrow">{passage.provisionLabel}</p>
                <blockquote>{passage.textContent}</blockquote>
              </article>
            ))}
          </section>
        ) : active === "Library" ? (
          <section className="collection-view">
            <div className="collection-head"><div><p className="eyebrow">Foundation legal corpus</p><h1>Legal library</h1><p>Search authority metadata by title, citation, or document type. Open a record to read verified passages.</p></div><span className="count-badge">{documents.length} authorities</span></div>
            <form className="library-search" onSubmit={(event) => { event.preventDefault(); loadLibrary(libraryQuery); }}>
              <label htmlFor="library-query" className="sr-only">Search legal library</label><input id="library-query" value={libraryQuery} onChange={(event) => setLibraryQuery(event.target.value)} placeholder="Search the Constitution, Acts, judgments…"/><button>Search</button>
            </form>
            <div className="library-table" role="table" aria-label="Legal authorities">
              <div className="library-row library-labels" role="row"><span>Authority</span><span>Jurisdiction</span><span>Review</span><span>Source</span></div>
              {loading ? <p className="empty-state">Loading the legal library…</p> : documents.length ? documents.map((document) => (
                <div className="library-row" role="row" key={document.id}>
                  <span>
                    <button className="linkish" onClick={() => openSource(document.id)}>
                      <strong>{document.canonicalTitle}</strong>
                    </button>
                    <small>{document.citation || document.documentType}</small>
                  </span>
                  <span>{document.jurisdiction}</span>
                  <span className="review-pill">{labelStatus(document.reviewStatus)}</span>
                  <a href={document.sourceUrl} target="_blank" rel="noreferrer">{document.sourcePublisher} ↗</a>
                </div>
              )) : <p className="empty-state">No matching authorities. The foundation corpus is being prepared for legal review.</p>}
            </div>
            <section className="library-sources" aria-labelledby="library-sources-title">
              <div className="library-sources-head">
                <div><p className="eyebrow">Evidence transparency</p><h2 id="library-sources-title">Source register</h2><p>These are the official and reputable collections approved or catalogued for The Judge.</p></div>
                <Link href="/sources">View full methodology →</Link>
              </div>
              <div className="source-directory-grid">
                {LEGAL_SOURCES.map((source) => (
                  <article key={source.id}>
                    <div><span>{source.authority}</span><em>{source.status}</em></div>
                    <h3>{source.name}</h3>
                    <p>{source.publisher} · {source.jurisdiction}</p>
                    <a href={source.url} target="_blank" rel="noreferrer">Open original source ↗</a>
                  </article>
                ))}
              </div>
            </section>
          </section>
        ) : active === "Documents" ? (
          <section className="collection-view">
            <div className="collection-head"><div><p className="eyebrow">Private materials</p><h1>Documents</h1><p>Confidential uploads stay isolated from the verified legal corpus.</p></div><span className="count-badge">{privateDocuments.length} files</span></div>
            <div className="docs-privacy upload-ready">
              <span>D</span>
              <h3>Upload a private case document</h3>
              <p>Files are stored in private object storage and can only be opened through your signed-in account. Uploading does not add a file to The Judge’s verified law library.</p>
              {selectedMatter ? <p className="upload-matter">Adding to: <strong>{selectedMatter.title}</strong></p> : null}
              <DocumentUpload matterId={selectedMatterId} onUploaded={loadPrivateDocuments} />
            </div>
            <div className="private-document-list" aria-live="polite">
              {loading ? <p className="empty-state">Loading your documents…</p> : privateDocuments.length ? privateDocuments.map((document) => (
                <article key={document.id} className="private-document-row">
                  <span className="document-glyph" aria-hidden="true">D</span>
                  <div><strong>{document.filename}</strong><small>{document.matterTitle || "General workspace"} · {formatBytes(Number(document.sizeBytes))} · {formatDate(document.createdAt)}</small></div>
                  <a href={`/api/documents/${document.id}`}>Download</a>
                </article>
              )) : <p className="empty-state">No private documents uploaded yet.</p>}
            </div>
          </section>
        ) : active === "Matters" ? (
          <section className="collection-view">
            <div className="collection-head"><div><p className="eyebrow">Private practitioner workspace</p><h1>Your matters</h1><p>Research and documents added here remain tied to your account.</p></div><span className="count-badge">{matters.length} active</span></div>
            <form className="matter-form" onSubmit={createMatter}><label htmlFor="matter-title" className="sr-only">Matter title</label><input id="matter-title" value={matterTitle} onChange={(event) => setMatterTitle(event.target.value)} placeholder="e.g. Okafor v. Bello — tenancy dispute"/><button>Create matter</button></form>
            <div className="matter-grid">
              {loading ? <p className="empty-state">Loading your matters…</p> : matters.length ? matters.map((matter) => (
                <article className="matter-card" key={matter.id}>
                  <span className="eyebrow">{matter.jurisdiction}</span>
                  <h3>{matter.title}</h3>
                  <p>{matter.reference || "No client reference"}</p>
                  <footer>
                    <span>Active</span>
                    <span className="matter-actions">
                      <button onClick={() => { setSelectedMatterId(matter.id); setActive("Documents"); }}>Add document</button>
                      <button onClick={() => { setSelectedMatterId(matter.id); setJurisdiction((JURISDICTIONS as readonly string[]).includes(matter.jurisdiction) ? matter.jurisdiction as (typeof JURISDICTIONS)[number] : "Federal"); setActive("Ask The Judge"); setQuery(""); setSubmitted(false); }}>Open research →</button>
                    </span>
                  </footer>
                </article>
              )) : <div className="empty-panel"><span>M</span><h3>No matters yet</h3><p>Create a private matter to organise research, authorities, and documents.</p></div>}
            </div>
          </section>
        ) : active === "Saved" ? (
          <section className="collection-view">
            <div className="collection-head"><div><p className="eyebrow">Authorities you have used</p><h1>Saved</h1><p>Passages cited in your research, with source status preserved.</p></div><span className="count-badge">{savedAuthorities.length} authorities</span></div>
            <div className="research-history">
              {loading ? <p className="empty-state">Loading saved authorities…</p> : savedAuthorities.length ? savedAuthorities.map((authority) => (
                <article className="research-history-card" key={authority.id}>
                  <div>
                    <span className="eyebrow">{authority.jurisdiction} · {authority.provisionLabel} · used {authority.useCount}×</span>
                    <h3>{authority.canonicalTitle}</h3>
                    <p className="saved-excerpt">“{authority.textContent}”</p>
                  </div>
                  <footer>
                    <span>{labelStatus(authority.legalStatus)} · {authority.lastVerifiedAt ? formatDate(authority.lastVerifiedAt) : "Unverified date"}</span>
                    <button onClick={() => openSource(authority.documentId, authority.id)}>Open source →</button>
                  </footer>
                </article>
              )) : <div className="empty-panel"><span>S</span><h3>No saved authorities yet</h3><p>Cited passages from grounded answers will appear here.</p></div>}
            </div>
          </section>
        ) : active === "Updates" ? (
          <section className="collection-view">
            <div className="collection-head"><div><p className="eyebrow">Corpus currency</p><h1>Updates</h1><p>{coverageSummary || "An honest coverage matrix for the foundation corpus."}</p></div></div>
            <div className="verification-guide">
              <article><strong>Source verified</strong><p>The exact passage was checked against the named source and may be used in answers.</p></article>
              <article><strong>Catalogue only</strong><p>An official or reputable collection has been identified, but its documents are not yet passage-verified.</p></article>
              <article><strong>Not started</strong><p>No passage-level legal review has been completed, so The Judge will not cite it as authority.</p></article>
            </div>
            <p className="verification-note">At present, only the displayed provisions of sections 1 and 4 of the 1999 Constitution are source-verified. The Constitution record still requires amendment review. <Link href="/sources">See the source register and methodology →</Link></p>
            <div className="coverage-table" role="table" aria-label="Coverage matrix">
              <div className="coverage-row coverage-labels" role="row"><span>Jurisdiction</span><span>Document type</span><span>Scope</span><span>Review</span><span>Last verified</span></div>
              {loading ? <p className="empty-state">Loading coverage…</p> : coverageRows.map((row) => (
                <div className="coverage-row" role="row" key={`${row.jurisdiction}-${row.documentType}`}>
                  <span>{row.jurisdiction}</span>
                  <span>{row.documentType}</span>
                  <span>{row.scope}</span>
                  <span className="review-pill">{labelStatus(row.reviewStatus)}</span>
                  <span>{row.lastVerifiedAt ? formatDate(row.lastVerifiedAt) : "—"}</span>
                </div>
              ))}
            </div>
          </section>
        ) : !submitted ? (
          <section className="ask-view">
            <div className="hero-copy">
              <p className="eyebrow">Nigerian legal intelligence</p>
              <h1>What would you like<br />to understand?</h1>
              <p>Research Nigerian law with source-backed answers.<br />Every material conclusion is linked to its authority.</p>
            </div>

            <form className="ask-box" onSubmit={ask}>
              <label htmlFor="legal-question" className="sr-only">Ask a legal question</label>
              <textarea
                id="legal-question"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask a legal question…"
                rows={3}
              />
              <div className="ask-controls">
                <div className="filters">
                  <label className="sr-only" htmlFor="jurisdiction">Jurisdiction</label>
                  <select id="jurisdiction" value={jurisdiction} onChange={(event) => setJurisdiction(event.target.value as (typeof JURISDICTIONS)[number])}>
                    {JURISDICTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                  <label className="sr-only" htmlFor="practice-area">Practice area</label>
                  <select id="practice-area" value={practiceArea} onChange={(event) => setPracticeArea(event.target.value as (typeof PRACTICE_AREAS)[number])}>
                    {PRACTICE_AREAS.map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                  <DocumentUpload compact matterId={selectedMatterId} onUploaded={loadPrivateDocuments} />
                </div>
                <button className="submit" aria-label="Submit question">↑</button>
              </div>
            </form>

            <div className="suggestions">
              <p className="eyebrow">Try asking</p>
              <div className="suggestion-grid">
                {[
                  ["01", "Is the Nigerian Constitution the highest law in Nigeria?"],
                  ["02", "What happens when another law conflicts with the Constitution?"],
                  ["03", "Who can make laws on the Exclusive Legislative List?"],
                ].map(([number, text]) => (
                  <button key={number} onClick={() => setQuery(text)}>
                    <span>{number}</span><p>{text}</p><b>↗</b>
                  </button>
                ))}
              </div>
            </div>

            <p className="disclaimer">The Judge provides legal information, not legal advice. Verify authorities before relying on any answer.</p>
          </section>
        ) : (
          <section className="result-view">
            <div className="result-main">
              <button className="back" onClick={() => setSubmitted(false)}>← New question</button>
              <p className="workspace-banner">Jurisdiction: {researchResult?.jurisdiction || jurisdiction} · Coverage: Foundation · Verified as of {researchResult?.verifiedAsOf || "—"}</p>
              {researchResult?.jurisdictionNotice ? <div className="jurisdiction-notice"><strong>Jurisdiction inferred</strong><span>{researchResult.jurisdictionNotice}</span></div> : null}
              <p className="eyebrow">Research question</p>
              <h2>{query}</h2>
              <div className="mode-switch" role="group" aria-label="Answer mode">
                <button disabled={researchLoading} className={mode === "professional" ? "selected" : ""} onClick={() => switchMode("professional")}>Professional</button>
                <button disabled={researchLoading} className={mode === "plain" ? "selected" : ""} onClick={() => switchMode("plain")}>Plain language</button>
              </div>
              <article className="answer">
                <div className="answer-heading">
                  <span className="seal">J</span>
                  <p><strong>The Judge</strong><small>Federal law · Evidence-first research</small></p>
                  {researchResult?.status === "grounded" ? <button className="copy-button" type="button" onClick={copyAnswer}>{copied ? "Copied" : "Copy"}</button> : null}
                </div>
                {researchLoading ? <div className="research-state"><span className="loading-mark" /><p>Searching verified authorities&hellip;</p></div> : researchError ? <div className="coverage-warning"><strong>Research unavailable</strong><p>{researchError}</p></div> : researchResult?.status === "needs_clarification" ? <div className="coverage-warning">
                  <strong>Jurisdiction required</strong>
                  <h3>State coverage is not in the foundation corpus</h3>
                  <p>{researchResult.clarification}</p>
                  <button className="clarify-action" type="button" onClick={() => runResearch(mode, "Federal")}>Search federal constitutional law instead</button>
                </div> : researchResult?.status === "insufficient_coverage" ? <div className="coverage-warning"><strong>Not enough verified authority</strong><h3>No answer generated</h3><p>{researchResult.limitations}</p></div> : researchResult ? <>
                  <section className="answer-section">
                    <h3>{mode === "plain" ? "In everyday language" : "Short answer"}</h3>
                    <p>{researchResult.shortAnswer}</p>
                  </section>
                  <section className="answer-section">
                    <h3>Applicable jurisdiction and assumptions</h3>
                    <p>{researchResult.jurisdiction}.</p>
                    <ul className="assumption-list">{researchResult.assumptions.map((item) => <li key={item}>{item}</li>)}</ul>
                  </section>
                  {researchResult.governingLaw ? <section className="answer-section"><h3>Governing law</h3><p>{researchResult.governingLaw}</p></section> : null}
                  <section className="answer-section">
                    <h3>Analysis</h3>
                    <ol className="analysis-list">
                      {researchResult.analysis.map((item) => (
                        <li key={item.passageId}>
                          <p>{item.proposition} <button type="button" className="cite-chip" onClick={() => setSelectedPassageId(item.passageId)}>[{item.displayOrder}] {item.citationLabel}</button></p>
                        </li>
                      ))}
                    </ol>
                  </section>
                  {mode === "plain" ? null : researchResult.passages.some((passage) => passage.plainSummary) ? (
                    <section className="answer-section">
                      <h3>Plain-language explanation</h3>
                      <p>{researchResult.passages[0].plainSummary}</p>
                    </section>
                  ) : null}
                  <section className="answer-section">
                    <h3>Practical next steps</h3>
                    <ul className="assumption-list">{researchResult.nextSteps.map((step) => <li key={step}>{step}</li>)}</ul>
                  </section>
                  <div className="citation-line">{researchResult.passages.map((passage, index) => (
                    <button key={passage.id} type="button" onClick={() => setSelectedPassageId(passage.id)}>[{index + 1}] {passage.provisionLabel}</button>
                  ))}</div>
                  <div className="answer-note"><strong>Limitations · verified as of {formatDate(researchResult.verifiedAsOf)}</strong><p>{researchResult.limitations}</p></div>
                  <div className="why-answer">
                    <button type="button" aria-expanded={whyOpen} onClick={() => setWhyOpen((open) => !open)}>Why this answer?</button>
                    {whyOpen ? (
                      <div>
                        <p>{researchResult.why.method}</p>
                        <p>{researchResult.why.coverage}</p>
                        <ul className="assumption-list">{researchResult.why.assumptions.map((item) => <li key={item}>{item}</li>)}</ul>
                      </div>
                    ) : null}
                  </div>
                </> : null}
              </article>
            </div>
            <aside className="authority-panel">
              <p className="eyebrow">Authorities</p>
              {researchLoading ? <p className="empty-state">Checking the corpus&hellip;</p> : researchResult?.passages.length ? researchResult.passages.map((passage, index) => (
                <div className="authority-result" key={passage.id}>
                  <div className={selectedPassageId === passage.id ? "authority-card active-source" : "authority-card"}>
                    <span>{(passage.treatment ?? "binding").toUpperCase()} · [{index + 1}]</span>
                    <h3>{passage.canonicalTitle}</h3>
                    <p>{passage.citation || "Federal Constitution"}</p>
                    <small>{passage.provisionLabel} · {passage.hierarchy ?? "Constitution of the Federation"}</small>
                    <em className="status-flag">{labelStatus(passage.legalStatus)}</em>
                  </div>
                  <div className="source-excerpt">
                    <p className="eyebrow">Exact source passage</p>
                    <blockquote>&ldquo;{passage.textContent}&rdquo;</blockquote>
                    <button type="button" className="linkish" onClick={() => passage.documentId && openSource(passage.documentId, passage.id, true)}>Open source viewer</button>
                    {" "}
                    <a href={passage.sourceUrl} target="_blank" rel="noreferrer">View {passage.sourcePublisher} source ↗</a>
                  </div>
                </div>
              )) : <div className="empty-authority"><span>0</span><h3>No authority cited</h3><p>The Judge only displays passages that match the question and have passed source verification.</p></div>}
              {researchResult?.passages.length ? <div className="source-status"><span>● Source verified</span><span>{researchResult.jurisdiction}</span><span>Last checked {formatDate(researchResult.verifiedAsOf)}</span></div> : null}
            </aside>
          </section>
        )}
      </section>
    </main>
  );
}
