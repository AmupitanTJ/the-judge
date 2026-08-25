# The Judge — Product and Delivery Plan

**Product:** AI-assisted Nigerian legal research and explanation platform  
**Primary users:** Nigerian legal practitioners  
**Secondary users:** Individuals and organisations seeking plain-language legal information  
**Status:** Greenfield planning baseline  
**Planning assumption:** A focused web MVP launches first; mobile apps and complete state/local coverage follow after evidence of product-market fit.

## 1. Product vision

The Judge helps users find, understand, compare, and apply Nigerian legal authorities. It combines a verified legal library with retrieval-grounded AI. Every substantive legal proposition must be traceable to a source; the system must distinguish legal information from advice and make uncertainty visible.

The product promise is **broad, traceable, continuously updated coverage**, not infallible or literally complete knowledge.

### Core principles

1. **Authority before eloquence:** no unsupported legal answer.
2. **Provenance by default:** show source, court, date, jurisdiction, provision, version, and document status.
3. **Lawyer remains responsible:** the product assists professional judgment and does not replace it.
4. **Plain language without distortion:** simplify wording while preserving qualifications and exceptions.
5. **Privacy by design:** confidential materials are isolated, encrypted, access-controlled, and governed by retention settings.
6. **Nigeria-specific reasoning:** account for federalism, court hierarchy, state variation, customary law, and Islamic personal law.

## 2. Target users and jobs

### Legal professionals

- Find relevant statutes, regulations, judgments, gazettes, court rules, and practice directions.
- Determine whether an authority is current, binding, persuasive, distinguished, or potentially affected by later law.
- Produce a cited research memo.
- Summarise a judgment, record the ratio and material obiter, and identify authorities considered.
- Review contracts, pleadings, affidavits, briefs, and correspondence against an instruction.
- Translate technical legal analysis into a client-ready explanation.

### Public users

- Understand general legal rights and processes in everyday language.
- Find the relevant agency, court, form, or next procedural step.
- Recognise when the facts require a lawyer or urgent intervention.

Public mode must not generate personalised representation, guarantee outcomes, or conceal uncertainty behind confident language.

## 3. Product scope

### MVP scope

- Account creation, authentication, and role selection.
- Professional and Plain Language answer modes.
- Search and chat over a curated federal corpus.
- Constitution, selected current federal Acts, subsidiary legislation, and selected appellate judgments.
- Initial practice areas: constitutional, land/property, marriage/family, employment, company/commercial, and criminal law.
- Jurisdiction, court, date, and practice-area filters.
- Answer-level citations linked to source passages.
- Source viewer with highlighted paragraphs and document metadata.
- Judgment summary: facts, issues, holding, ratio, orders, authorities cited, and separate opinions.
- PDF/DOCX upload for private question answering and summarisation.
- Matter workspaces, saved research, notes, and export to DOCX/PDF.
- Citation validation, answer feedback, and “report an authority problem.”
- Administrative ingestion and legal-review console.

### Post-MVP scope

- Coverage of all states and the FCT, released jurisdiction by jurisdiction.
- Local-government by-laws where authoritative copies and reuse rights are available.
- Court rules, practice directions, official forms, and procedural deadline tools.
- Customary-law and Islamic-personal-law collections with jurisdiction and community context.
- Drafting workbench with firm-approved templates.
- Citator treatment analysis and authority history.
- Team workspaces, annotations, permissions, and knowledge collections.
- API and integrations with document-management and practice-management systems.
- Android/iOS applications after the responsive web product is validated.

### Explicitly out of scope for the first release

- Autonomous legal representation or filing.
- Guaranteed outcome prediction.
- Unreviewed generation of final court processes.
- A claim that every Nigerian law or judgment is included.
- Training foundation models from scratch.

## 4. Legal corpus strategy

### Source hierarchy

Prefer sources in this order:

1. Official gazettes, legislatures, courts, ministries, regulators, and government repositories.
2. Authorised or contractually licensed legal publishers.
3. Reputable open legal repositories, subject to licence and completeness checks.
4. Scanned physical copies verified by a qualified reviewer and used only where lawful.

Potential discovery sources include the National Assembly, federal and state gazettes, court websites, NigeriaLII, PLAC's Laws of Nigeria collection, regulators, and authorised commercial partners. Availability on a website does not automatically grant bulk-ingestion or commercial reuse rights; counsel must approve each source and licence.

### Coverage layers

| Release | Coverage target | Gate for release |
|---|---|---|
| Foundation | Constitution, amendments, selected federal Acts and appellate cases | Identity, currency, and rights verified |
| Federal expansion | Wider federal legislation, regulations, court rules, gazettes | Amendment links and review sampling pass |
| Priority jurisdictions | Lagos, FCT, then high-demand states | State counsel confirms source map |
| National expansion | Remaining states | Each jurisdiction meets minimum completeness score |
| Local/special systems | By-laws, customary law, Islamic personal law | Scope and applicability are labelled precisely |

### Document metadata

Every document must store:

- Canonical title, citation, document type, issuing body, and jurisdiction.
- Enactment, assent, publication, commencement, decision, and effective dates where applicable.
- Court, panel, suit/appeal number, parties, and judicial hierarchy for cases.
- Source URL or physical provenance, acquisition date, licence, checksum, and reviewer.
- Versions, amendments, repeals, substitutions, savings, commencement status, and related instruments.
- OCR confidence and page/paragraph coordinates.
- Review state: unverified, machine-checked, legally reviewed, superseded, or withdrawn.

### Ingestion and update pipeline

1. Acquire and checksum the original document.
2. Preserve an immutable source copy.
3. Extract text and structure; OCR scanned pages.
4. Detect headings, sections, schedules, footnotes, paragraphs, citations, and tables.
5. Normalize metadata and legal citations.
6. Link amendments, enabling provisions, cases, and cited authorities.
7. Run duplicate, missing-page, OCR-quality, and internal-reference checks.
8. Submit higher-risk or low-confidence records for legal review.
9. Publish searchable chunks while retaining page-level provenance.
10. Monitor sources and run scheduled change detection.

The corpus dashboard should publish an honest coverage matrix by jurisdiction, court, document type, date range, and verification status.

## 5. AI and search architecture

Use retrieval-augmented generation rather than model memory as the legal authority.

### Answer pipeline

1. Classify the question and detect jurisdiction, date, practice area, user mode, and missing facts.
2. Ask a focused clarification when jurisdiction or legal regime materially changes the answer.
3. Run hybrid retrieval: keyword/legal-citation search plus semantic vector search.
4. Rerank by relevance, authority hierarchy, jurisdiction, date, and document status.
5. Assemble source passages with strict token and provenance controls.
6. Generate a structured answer that cites each material proposition.
7. Run a second-pass citation entailment and quotation check.
8. Refuse, qualify, or present competing interpretations when evidence is inadequate.
9. Log the answer version, retrieval set, model, prompt policy, and validation outcome.

### Required answer structure

- Short answer.
- Applicable jurisdiction and assumptions.
- Governing law.
- Analysis.
- Relevant authorities with treatment and hierarchy.
- Plain-language explanation when selected.
- Practical next steps and important deadlines, clearly qualified.
- Limitations and “verified as of” date.

### Recommended technical baseline

- **Frontend:** Next.js/React with TypeScript and a responsive design system.
- **Backend:** TypeScript service layer; Python workers for OCR, parsing, and corpus processing where helpful.
- **Primary database:** PostgreSQL.
- **Search:** OpenSearch/Elasticsearch for lexical search and citation-aware filtering.
- **Vectors:** pgvector initially; move to a dedicated vector service only if scale requires it.
- **Object storage:** encrypted, versioned storage for originals, uploads, and exports.
- **Queue/workflows:** durable background processing for ingestion, OCR, validation, and exports.
- **AI gateway:** provider abstraction, model routing, audit metadata, evaluation hooks, and cost limits.
- **Observability:** structured logs, traces, latency/cost dashboards, and security alerts without leaking document content.

The final provider and hosting decision should follow a data-protection impact assessment, pricing test, Nigerian latency test, contractual review, and confirmation of model-provider data-retention terms.

## 6. Black-and-white judicial interface

### Visual direction

The interface takes inspiration from judges' and advocates' black-and-white court attire: restrained, authoritative, legible, and calm. It must feel contemporary rather than theatrical.

### Design tokens

- Ink: `#0A0A0A`
- Robe: `#171717`
- Charcoal: `#2B2B2B`
- Parchment white: `#FAFAF7`
- Pure white: `#FFFFFF`
- Rule grey: `#D8D8D3`
- Muted text: `#686868`
- Focus and links: underlined black in light mode; underlined white in dark mode.
- Error/status colours may be used sparingly for accessibility; do not encode meaning by colour alone.

Use a dignified serif for titles and authorities, paired with a highly readable sans-serif for controls and long explanations. Body text must meet WCAG AA contrast, support keyboard navigation, visible focus, text enlargement, and screen readers.

### Main navigation

- Ask The Judge
- Research
- Library
- Documents
- Matters
- Saved
- Updates
- Admin (authorised roles only)

### Primary answer screen

- Left: matter history and filters.
- Centre: question, answer, professional/plain-language toggle, inline citations, copy/export controls.
- Right: authority panel showing quoted passage, hierarchy, status, and source metadata.
- Persistent banner: jurisdiction, coverage level, and verification date.
- “Why this answer?” control reveals retrieved sources and assumptions.

Avoid gavels, scales, faux parchment textures, gold ornamentation, and excessive all-caps. Authority should come from typography, spacing, evidence, and precision.

## 7. Trust, safety, privacy, and governance

### Legal-answer controls

- Cite every material legal proposition.
- Never invent a case, quotation, statutory section, judge, or procedural deadline.
- Separate quotations from paraphrases.
- Label binding, persuasive, overruled, repealed, amended, uncommenced, and uncertain authorities.
- Preserve conflicting authorities and minority opinions.
- Require professional review before high-impact generated documents are treated as final.
- Escalate urgent criminal, domestic-violence, child-safety, detention, limitation, or filing-deadline situations with a clear seek-help notice.

### Privacy and security

- Complete a Nigeria Data Protection Act compliance assessment and DPIA before production.
- Encrypt in transit and at rest; use tenant isolation and least-privilege access.
- Offer MFA, session controls, device history, and role-based permissions.
- Do not train models on client uploads by default.
- Provide configurable retention, deletion, legal hold, and export controls.
- Redact secrets and personal data from operational logs.
- Maintain immutable security and research audit trails.
- Conduct dependency scanning, penetration testing, backup restoration tests, and incident-response exercises.
- Review professional privilege, confidentiality, cross-border processing, processor contracts, and breach obligations with Nigerian counsel.

### Governance roles

- Editorial/legal board approves inclusion policy and high-risk content rules.
- Corpus team owns acquisition, metadata, currency, and corrections.
- Product/legal safety team owns answer policy and escalation language.
- Security/privacy lead owns controls, incident response, and vendor assurance.
- Named release approver signs off each jurisdictional coverage expansion.

## 8. Delivery roadmap

Timing assumes a focused team of 7–10 people. It should be adjusted after discovery and source-licensing results.

### Phase 0 — Formation and discovery (Weeks 1–3)

- Incorporate/confirm product ownership and engage Nigerian product counsel.
- Interview 15–25 practitioners across firm sizes and practice areas.
- Observe real research tasks and collect anonymised evaluation questions.
- Choose one professional beachhead and define MVP success metrics.
- Map authoritative sources, access methods, licences, and coverage gaps.
- Draft product requirements, threat model, DPIA outline, and corpus policy.

**Exit:** approved PRD, target segment, source shortlist, risk register, and budget.

### Phase 1 — Prototype and evidence test (Weeks 4–7)

- Build clickable black-and-white prototype.
- Test professional/plain-language outputs with lawyers and non-lawyers.
- Build a small representative corpus and retrieval proof of concept.
- Create 200–300 gold-standard research questions with cited answers.
- Test citation precision, retrieval recall, comprehensibility, and refusal behaviour.

**Exit:** users complete core tasks; retrieval quality is viable; no unresolved fatal licensing issue.

### Phase 2 — Data and platform foundation (Weeks 8–13)

- Implement authentication, organisations, roles, matters, and audit events.
- Build ingestion, OCR, parsing, metadata, versioning, and review workflows.
- Implement hybrid search, filters, source viewer, and corpus dashboard.
- Establish CI/CD, separate environments, secrets management, backups, and monitoring.
- Ingest and verify the foundation corpus.

**Exit:** repeatable ingestion and searchable verified corpus in staging.

### Phase 3 — MVP application (Weeks 14–21)

- Build research chat, answer modes, citations, authority panel, saved research, and exports.
- Add private document upload, malware scanning, isolation, extraction, and deletion controls.
- Add citation validator, confidence/coverage notices, feedback, and admin review queues.
- Implement cost controls, rate limits, support tooling, and analytics.
- Conduct accessibility, security, performance, and cross-browser testing.

**Exit:** feature-complete staging release with critical controls passing.

### Phase 4 — Legal evaluation and private beta (Weeks 22–27)

- Recruit 20–40 practitioners under beta terms.
- Run blinded evaluations against human research baselines.
- Red-team fake citations, outdated law, ambiguous jurisdictions, prompt injection, poisoned documents, and privacy leakage.
- Fix critical defects and document known coverage limitations.
- Complete penetration test, DPIA, vendor review, incident plan, and customer terms.

**Exit:** launch thresholds met and legal/editorial board approval recorded.

### Phase 5 — Public professional launch (Weeks 28–30)

- Release the professional web product with controlled onboarding.
- Publish coverage, methodology, privacy, security, correction, and AI-limitation pages.
- Operate daily corpus monitoring and rapid correction workflow.
- Measure activation, successful research tasks, retention, answer quality, latency, and cost.

### Phase 6 — Expansion (Months 8–18)

- Add priority states, courts, practice areas, team collaboration, and citator features.
- Introduce public plain-language access with stricter guardrails.
- Establish publisher, regulator, bar, university, and court partnerships.
- Add mobile apps only after recurring web usage and workflows are understood.

## 9. Quality gates and metrics

### Pre-launch gates

- Citation existence: target 100% on evaluated cited authorities.
- Citation entailment: at least 97% of citations support the attached proposition on the gold set.
- Quotation accuracy: 100% exact match after normalised whitespace.
- Retrieval recall: at least 90% for required primary authorities in scoped evaluation questions.
- Currency: all in-scope statutes have a recorded source and last-checked date.
- No unresolved critical/high security findings.
- Accessibility: WCAG 2.2 AA checks pass for core flows.
- Plain-language comprehension: target users accurately restate the answer and key limitation in usability testing.

These are starting thresholds, not guarantees; evaluation sets must be versioned, independently reviewed, and resistant to memorisation.

### Business metrics

- Time to useful cited answer.
- Percentage of research sessions saved/exported.
- Weekly active practitioners and 4/12-week retention.
- Successful-answer and correction rates.
- Coverage-gap frequency.
- Cost per completed research task.
- Paid conversion, seat expansion, and churn.

## 10. Team

Minimum focused team:

- Product lead/founder.
- Nigerian legal research/editorial lead.
- Two legal researchers initially.
- Product designer with accessibility experience.
- Two full-stack engineers.
- Search/data engineer.
- AI/evaluation engineer.
- Part-time security/privacy and infrastructure support.

Add jurisdictional reviewers, customer success, partnerships, and corpus operations as coverage grows. Lawyers must own legal evaluation; engineers must not silently decide questions of authority or legal currency.

## 11. Commercial approach

Validate pricing during discovery. A reasonable packaging hypothesis is:

- Individual professional subscription.
- Firm plan with shared matters, administration, and audit features.
- Enterprise/private deployment for larger firms and institutions.
- Restricted free public plain-language tier.
- Academic or access-to-justice partnerships.

Do not price the public product around fear or imply that payment guarantees a legal outcome.

### Budget framework

Prepare three budgets after discovery:

- **Lean validation:** prototype, small licensed/open corpus, and private tests.
- **Production MVP:** full team, security work, reliable infrastructure, and curated federal corpus.
- **National expansion:** licensing, scanning/OCR, jurisdictional reviewers, partnerships, and 24/7 operations.

The largest uncertain cost is likely corpus acquisition, verification, and ongoing editorial maintenance—not model inference. Do not publish a fixed build estimate until source rights and team rates are known.

## 12. Major risks and mitigations

| Risk | Mitigation |
|---|---|
| Invented or misapplied authority | Retrieval grounding, entailment checks, strict answer format, human evaluation |
| Outdated or incomplete law | Version graph, official-source monitoring, visible last-verified date, coverage matrix |
| State/local variation hidden | Mandatory jurisdiction detection and clarification |
| Copyright/database-right dispute | Source register, written licences, legal review, takedown workflow |
| Confidential-data exposure | Isolation, encryption, no-training default, retention controls, redacted logs |
| Users treat information as representation | Mode-specific language, scope limits, professional-review prompts |
| Poor OCR changes legal meaning | Confidence thresholds, page images, checksums, human review |
| Overly broad first release | Federal beachhead, gated jurisdiction expansion |
| Model/provider dependency | Provider abstraction, portable corpus, evaluation suite, contract controls |

## 13. Initial backlog

### Product and design

- Finalise personas, workflows, information architecture, and design tokens.
- Prototype Ask, Search, Source Viewer, Judgment Summary, Matter, Upload, and Admin flows.
- Usability-test both answer modes.

### Corpus

- Create source/licence register and coverage matrix.
- Define metadata schema, citation grammar, review handbook, and correction SLA.
- Select the foundation corpus and produce gold-standard questions.

### Engineering

- Establish monorepo, environments, CI/CD, database, storage, and observability.
- Implement identity, tenancy, audit schema, ingestion, search, and answer orchestration.
- Add security scanning, automated tests, evaluation harness, and cost dashboards.

### Legal and operations

- Draft terms, privacy notice, acceptable-use policy, publisher/source agreements, and beta agreement.
- Complete DPIA, threat model, incident plan, retention schedule, and reviewer conflicts policy.
- Define correction, appeal, takedown, and emergency escalation processes.

## 14. First decisions required

Before implementation, the founder should approve:

1. Primary launch customer: solo/small firms, litigation teams, in-house counsel, or public users.
2. Initial corpus boundaries and first two practice areas.
3. Whether source licences can be funded before beta.
4. Hosting/data-residency requirements.
5. Subscription versus institution-first commercial strategy.
6. The lawyer/editorial lead responsible for legal release approval.

## 15. Definition of launch-ready

The Judge is ready for controlled public launch only when:

- The stated corpus is legally acquired, indexed, versioned, and visibly described.
- The answer and citation quality gates pass on an independently reviewed evaluation set.
- Users can inspect the exact authority behind every material conclusion.
- Confidential uploads have tested isolation, retention, deletion, and audit controls.
- Security, privacy, incident-response, and correction processes are operational.
- Known limitations are prominent and comprehensible.
- A named Nigerian lawyer or editorial panel owns legal-content governance.

