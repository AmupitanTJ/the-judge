"use client";

import { useState } from "react";

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

  function ask(event: React.FormEvent) {
    event.preventDefault();
    if (query.trim()) setSubmitted(true);
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div>
          <a className="brand" href="#" aria-label="The Judge home">
            <span className="brand-mark">TJ</span>
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
          <span className="avatar">AO</span>
          <span><strong>Ada Okafor</strong><small>Legal practitioner</small></span>
          <button aria-label="Account menu">•••</button>
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

        {!submitted ? (
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
