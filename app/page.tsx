"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

type LegalDocument = { id:string; canonicalTitle:string; citation:string|null; documentType:string; jurisdiction:string; sourceUrl:string; sourcePublisher:string; legalStatus:string; reviewStatus:string; lastVerifiedAt:string|null };
type Matter = { id:string; title:string; reference:string|null; jurisdiction:string; status:string; updatedAt?:string };
type Viewer = { displayName:string; email:string };
type ResearchPassage = { id:string; provisionLabel:string; textContent:string; canonicalTitle:string; citation:string|null; sourceUrl:string; sourcePublisher:string; legalStatus:string; lastVerifiedAt:string|null };
type ResearchResult = { sessionId:string; status:"grounded"|"insufficient_coverage"; shortAnswer:string|null; passages:ResearchPassage[]; limitations:string; verifiedAsOf:string };
type ResearchSession = { id:string; question:string; answerMode:"professional"|"plain"; jurisdiction:string; createdAt:string; citationCount:number };

const navItems = ["Ask The Judge", "Research", "Library", "Documents", "Matters"];

const recent = [
  ["Landlord’s right to recover premises", "Lagos · 12 min ago"],
  ["Validity of customary marriage", "Federal · Yesterday"],
  ["Company director’s fiduciary duty", "Federal · 22 Aug"],
];

export default function Home() {
  const [mode, setMode] = useState<"professional" | "plain">("professional");
  const [active, setActive] = useState("Ask The Judge");
  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [researchResult, setResearchResult] = useState<ResearchResult | null>(null);
  const [researchLoading, setResearchLoading] = useState(false);
  const [researchError, setResearchError] = useState("");
  const [viewer, setViewer] = useState<Viewer | null>(null);
  const [documents, setDocuments] = useState<LegalDocument[]>([]);
  const [libraryQuery, setLibraryQuery] = useState("");
  const [matters, setMatters] = useState<Matter[]>([]);
  const [researchSessions, setResearchSessions] = useState<ResearchSession[]>([]);
  const [matterTitle, setMatterTitle] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/me").then((response) => response.ok ? response.json() : null).then((data) => data?.user && setViewer(data.user)).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (active === "Library") loadLibrary();
    if (active === "Matters") loadMatters();
    if (active === "Research") loadResearchHistory();
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
    setLoading(true);
    try {
      const response = await fetch("/api/research");
      const data = response.ok ? await response.json() : { sessions: [] };
      setResearchSessions(data.sessions ?? []);
    } finally { setLoading(false); }
  }

  async function createMatter(event: React.FormEvent) {
    event.preventDefault();
    if (!matterTitle.trim()) return;
    const response = await fetch("/api/matters", { method:"POST", headers:{ "content-type":"application/json" }, body:JSON.stringify({ title:matterTitle, jurisdiction:"Federal" }) });
    if (response.ok) { setMatterTitle(""); await loadMatters(); }
  }

  async function ask(event: React.FormEvent) {
    event.preventDefault();
    if (!query.trim()) return;
    setSubmitted(true);
    await runResearch(mode);
  }

  async function runResearch(answerMode: "professional" | "plain") {
    setMode(answerMode);
    setResearchLoading(true);
    setResearchError("");
    setResearchResult(null);
    try {
      const response = await fetch("/api/research", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question: query, mode: answerMode, jurisdiction: "Federal" }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Research could not be completed.");
      setResearchResult(data);
    } catch (error) {
      setResearchError(error instanceof Error ? error.message : "Research could not be completed.");
    } finally {
      setResearchLoading(false);
    }
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div>
          <Link className="brand" href="/" aria-label="The Judge home">
            <span className="brand-mark"><Image src="/brand/the-judge-app-icon.png" alt="" width={35} height={35} priority /></span>
            <span>THE JUDGE</span>
          </Link>

          <button className="new-research" onClick={() => { setQuery(""); setSubmitted(false); setResearchResult(null); setResearchError(""); }}>
            <span aria-hidden="true">＋</span> New research
          </button>

          <nav aria-label="Main navigation">
            {navItems.map((item) => (
              <button
                key={item}
                className={active === item ? "nav-item active" : "nav-item"}
                onClick={() => setActive(item)}
              >
                <span className="nav-glyph" aria-hidden="true">{item.slice(0, 1)}</span>
                {item}
              </button>
            ))}
          </nav>

          <div className="recent-block">
            <p className="eyebrow">Recent research</p>
            {recent.map(([title, meta]) => (
              <button className="recent-item" key={title}>
                <span>{title}</span>
                <small>{meta}</small>
              </button>
            ))}
          </div>
        </div>

        <div className="profile">
          <span className="avatar">{viewer?.displayName?.split(/\s+/).map((word) => word[0]).join("").slice(0,2).toUpperCase() || "TJ"}</span>
          <span><strong>{viewer?.displayName || "Signed-in user"}</strong><small>{viewer?.email || "Private workspace"}</small></span>
          <a href="/signout-with-chatgpt?return_to=/" aria-label="Sign out">↗</a>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div className="coverage"><span /> Federal coverage <strong>Beta</strong></div>
          <div className="top-actions">
            <button className="icon-button" aria-label="Notifications">○</button>
            <button className="invite">Invite your team</button>
          </div>
        </header>

        {active === "Research" ? (
          <section className="collection-view">
            <div className="collection-head"><div><p className="eyebrow">Saved evidence trail</p><h1>Research history</h1><p>Your questions are stored with the authorities used for each answer.</p></div><span className="count-badge">{researchSessions.length} sessions</span></div>
            <div className="research-history">
              {loading ? <p className="empty-state">Loading your research history…</p> : researchSessions.length ? researchSessions.map((session) => (
                <article className="research-history-card" key={session.id}>
                  <div><span className="eyebrow">{session.jurisdiction} · {session.answerMode}</span><h3>{session.question}</h3></div>
                  <footer><span>{session.citationCount} {session.citationCount === 1 ? "authority" : "authorities"} · {new Date(session.createdAt).toLocaleDateString("en-NG", { day:"numeric", month:"short", year:"numeric" })}</span><button onClick={() => { setQuery(session.question); setSubmitted(false); setActive("Ask The Judge"); }}>Research again →</button></footer>
                </article>
              )) : <div className="empty-panel"><span>R</span><h3>No saved research yet</h3><p>Ask a supported legal question and its evidence trail will appear here.</p></div>}
            </div>
          </section>
        ) : active === "Library" ? (
          <section className="collection-view">
            <div className="collection-head"><div><p className="eyebrow">Foundation legal corpus</p><h1>Legal library</h1><p>Search authority metadata by title, citation, or document type.</p></div><span className="count-badge">{documents.length} authorities</span></div>
            <form className="library-search" onSubmit={(event) => { event.preventDefault(); loadLibrary(libraryQuery); }}>
              <label htmlFor="library-query" className="sr-only">Search legal library</label><input id="library-query" value={libraryQuery} onChange={(event) => setLibraryQuery(event.target.value)} placeholder="Search the Constitution, Acts, judgments…"/><button>Search</button>
            </form>
            <div className="library-table" role="table" aria-label="Legal authorities">
              <div className="library-row library-labels" role="row"><span>Authority</span><span>Jurisdiction</span><span>Review</span><span>Source</span></div>
              {loading ? <p className="empty-state">Loading the legal library…</p> : documents.length ? documents.map((document) => (
                <div className="library-row" role="row" key={document.id}>
                  <span><strong>{document.canonicalTitle}</strong><small>{document.citation || document.documentType}</small></span><span>{document.jurisdiction}</span><span className="review-pill">{document.reviewStatus.replaceAll("_", " ")}</span><a href={document.sourceUrl} target="_blank" rel="noreferrer">{document.sourcePublisher} ↗</a>
                </div>
              )) : <p className="empty-state">No matching authorities. The foundation corpus is being prepared for legal review.</p>}
            </div>
          </section>
        ) : active === "Matters" ? (
          <section className="collection-view">
            <div className="collection-head"><div><p className="eyebrow">Private practitioner workspace</p><h1>Your matters</h1><p>Research and documents added here remain tied to your account.</p></div><span className="count-badge">{matters.length} active</span></div>
            <form className="matter-form" onSubmit={createMatter}><label htmlFor="matter-title" className="sr-only">Matter title</label><input id="matter-title" value={matterTitle} onChange={(event) => setMatterTitle(event.target.value)} placeholder="e.g. Okafor v. Bello — tenancy dispute"/><button>Create matter</button></form>
            <div className="matter-grid">
              {loading ? <p className="empty-state">Loading your matters…</p> : matters.length ? matters.map((matter) => <article className="matter-card" key={matter.id}><span className="eyebrow">{matter.jurisdiction}</span><h3>{matter.title}</h3><p>{matter.reference || "No client reference"}</p><footer><span>Active</span><button onClick={() => { setActive("Ask The Judge"); setQuery(`Research this matter: ${matter.title}`); }}>Open research →</button></footer></article>) : <div className="empty-panel"><span>M</span><h3>No matters yet</h3><p>Create a private matter to organise research, authorities, and documents.</p></div>}
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
                  <button type="button">Nigeria <span>⌄</span></button>
                  <button type="button">All practice areas <span>⌄</span></button>
                  <button type="button" aria-label="Attach a document">⌕</button>
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
              <p className="eyebrow">Research question</p>
              <h2>{query}</h2>
              <div className="mode-switch" role="group" aria-label="Answer mode">
                <button disabled={researchLoading} className={mode === "professional" ? "selected" : ""} onClick={() => runResearch("professional")}>Professional</button>
                <button disabled={researchLoading} className={mode === "plain" ? "selected" : ""} onClick={() => runResearch("plain")}>Plain language</button>
              </div>
              <article className="answer">
                <div className="answer-heading"><span className="seal">J</span><p><strong>The Judge</strong><small>Federal law · Evidence-first research</small></p></div>
                {researchLoading ? <div className="research-state"><span className="loading-mark" /><p>Searching verified authorities&hellip;</p></div> : researchError ? <div className="coverage-warning"><strong>Research unavailable</strong><p>{researchError}</p></div> : researchResult?.status === "insufficient_coverage" ? <div className="coverage-warning"><strong>Not enough verified authority</strong><h3>No answer generated</h3><p>{researchResult.limitations}</p></div> : researchResult ? <>
                  <h3>{mode === "plain" ? "In everyday language" : "Short answer"}</h3>
                  <p>{researchResult.shortAnswer}</p>
                  <div className="citation-line">{researchResult.passages.map((passage, index) => <a key={passage.id} href={passage.sourceUrl} target="_blank" rel="noreferrer">[{index + 1}] {passage.provisionLabel}</a>)}</div>
                  <div className="answer-note"><strong>Coverage limit</strong><p>{researchResult.limitations}</p></div>
                </> : null}
              </article>
            </div>
            <aside className="authority-panel">
              <p className="eyebrow">Authorities</p>
              {researchLoading ? <p className="empty-state">Checking the corpus&hellip;</p> : researchResult?.passages.length ? researchResult.passages.map((passage, index) => <div className="authority-result" key={passage.id}>
                <div className="authority-card active-source"><span>PRIMARY AUTHORITY · [{index + 1}]</span><h3>{passage.canonicalTitle}</h3><p>{passage.citation || "Federal Constitution"}</p><small>{passage.provisionLabel}</small></div>
                <div className="source-excerpt"><p className="eyebrow">Exact source passage</p><blockquote>&ldquo;{passage.textContent}&rdquo;</blockquote><a href={passage.sourceUrl} target="_blank" rel="noreferrer">View {passage.sourcePublisher} source ↗</a></div>
              </div>) : <div className="empty-authority"><span>0</span><h3>No authority cited</h3><p>The Judge only displays passages that match the question and have passed source verification.</p></div>}
              {researchResult?.passages.length ? <div className="source-status"><span>● Source verified</span><span>Federal</span><span>Last checked {researchResult.verifiedAsOf}</span></div> : null}
            </aside>
          </section>
        )}
      </section>
    </main>
  );
}
