"use client";

import { useEffect, useState } from "react";

type LegalDocument = { id:string; canonicalTitle:string; citation:string|null; documentType:string; jurisdiction:string; sourceUrl:string; sourcePublisher:string; legalStatus:string; reviewStatus:string; lastVerifiedAt:string|null };
type Matter = { id:string; title:string; reference:string|null; jurisdiction:string; status:string; updatedAt?:string };
type Viewer = { displayName:string; email:string };

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
  const [viewer, setViewer] = useState<Viewer | null>(null);
  const [documents, setDocuments] = useState<LegalDocument[]>([]);
  const [libraryQuery, setLibraryQuery] = useState("");
  const [matters, setMatters] = useState<Matter[]>([]);
  const [matterTitle, setMatterTitle] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/me").then((response) => response.ok ? response.json() : null).then((data) => data?.user && setViewer(data.user)).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (active === "Library") loadLibrary();
    if (active === "Matters") loadMatters();
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

  async function createMatter(event: React.FormEvent) {
    event.preventDefault();
    if (!matterTitle.trim()) return;
    const response = await fetch("/api/matters", { method:"POST", headers:{ "content-type":"application/json" }, body:JSON.stringify({ title:matterTitle, jurisdiction:"Federal" }) });
    if (response.ok) { setMatterTitle(""); await loadMatters(); }
  }

  function ask(event: React.FormEvent) {
    event.preventDefault();
    if (query.trim()) setSubmitted(true);
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div>
          <a className="brand" href="#" aria-label="The Judge home">
            <span className="brand-mark"><img src="/brand/the-judge-app-icon.png" alt="" /></span>
            <span>THE JUDGE</span>
          </a>

          <button className="new-research" onClick={() => { setQuery(""); setSubmitted(false); }}>
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

        {active === "Library" ? (
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
                  ["01", "Explain the requirements for a valid statutory marriage in Nigeria"],
                  ["02", "What remedies are available for breach of a tenancy agreement in Lagos?"],
                  ["03", "Summarise the legal duties of company directors under CAMA"],
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
                <button className={mode === "professional" ? "selected" : ""} onClick={() => setMode("professional")}>Professional</button>
                <button className={mode === "plain" ? "selected" : ""} onClick={() => setMode("plain")}>Plain language</button>
              </div>
              <article className="answer">
                <div className="answer-heading"><span className="seal">J</span><p><strong>The Judge</strong><small>Federal law · Verified 24 Aug 2026</small></p></div>
                {mode === "professional" ? (
                  <>
                    <h3>Short answer</h3>
                    <p>A statutory marriage in Nigeria must comply with the formal requirements prescribed by the Marriage Act. The parties must possess legal capacity, freely consent, and complete the required notice and solemnisation procedure before an authorised person.</p>
                    <h3>Governing principles</h3>
                    <p>The marriage must be celebrated in a licensed place or marriage registry, in the presence of witnesses, following the issue of the appropriate certificate. A prohibited degree of consanguinity, an existing statutory marriage, or absence of real consent may affect validity.</p>
                  </>
                ) : (
                  <>
                    <h3>In everyday language</h3>
                    <p>For this kind of marriage to be legally recognised, both people must be free to marry, must genuinely agree to it, and must follow the official registration and ceremony steps.</p>
                    <p>Usually, this means giving notice at a marriage registry, waiting for approval, and having the ceremony conducted by an authorised registrar or minister with witnesses present.</p>
                  </>
                )}
                <div className="citation-line"><button>[1] Marriage Act, Cap M6 LFN 2004, ss. 7–13</button><button>[2] Section 33</button></div>
                <div className="answer-note"><strong>Important</strong><p>The applicable analysis may differ for customary or Islamic marriages. The parties’ location and facts should be confirmed.</p></div>
              </article>
            </div>
            <aside className="authority-panel">
              <p className="eyebrow">Authorities</p>
              <div className="authority-card active-source"><span>PRIMARY LEGISLATION</span><h3>Marriage Act</h3><p>Cap M6, Laws of the Federation of Nigeria 2004</p><small>Sections 7–13, 33</small></div>
              <div className="source-excerpt"><p className="eyebrow">Relevant passage</p><blockquote>“Whenever any person desires to marry, one of the parties to the intended marriage shall sign and give to the registrar…”</blockquote><a href="https://lawsofnigeria.placng.org/" target="_blank" rel="noreferrer">View source ↗</a></div>
              <div className="source-status"><span>● In force</span><span>Federal</span><span>Last checked 24 Aug 2026</span></div>
            </aside>
          </section>
        )}
      </section>
    </main>
  );
}
