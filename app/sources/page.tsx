import Image from "next/image";
import Link from "next/link";
import { LEGAL_SOURCES, SOURCE_REGISTER_VERIFIED_AT } from "../../db/legal-sources";
import styles from "./sources.module.css";

export const metadata = {
  title: "Legal Sources — The Judge",
  description: "The public source register for The Judge's Nigerian legal research corpus.",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-NG", { day: "numeric", month: "long", year: "numeric" }).format(new Date(`${value}T00:00:00Z`));
}

export default function SourcesPage() {
  const officialCount = LEGAL_SOURCES.filter((source) => source.authority !== "Open-access repository").length;
  const approvedCount = LEGAL_SOURCES.filter((source) => source.status === "Approved").length;

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link className={styles.brand} href="/">
          <Image src="/brand/the-judge-page-logo.png" width={76} height={76} alt="The Judge" priority />
          <span>THE JUDGE</span>
        </Link>
        <Link className={styles.back} href="/">← Return to research</Link>
      </header>

      <section className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>Public evidence register</p>
          <h1>Legal sources</h1>
          <p className={styles.lede}>Every grounded answer should lead back to a named authority, the exact passage used, and the source from which it was obtained.</p>
        </div>
        <dl className={styles.stats}>
          <div><dt>{LEGAL_SOURCES.length}</dt><dd>source collections</dd></div>
          <div><dt>{officialCount}</dt><dd>official publishers</dd></div>
          <div><dt>{approvedCount}</dt><dd>approved for ingestion</dd></div>
        </dl>
      </section>

      <section className={styles.method} aria-labelledby="source-standard">
        <div>
          <p className={styles.eyebrow}>The Judge source standard</p>
          <h2 id="source-standard">Listed does not mean ingested</h2>
        </div>
        <p>A source marked <strong>Approved</strong> may enter the ingestion pipeline after document-level checks. <strong>Catalogued</strong> means it has been identified but its documents are not yet relied upon automatically. <strong>Licence required</strong> material is never copied until the rightsholder permits it.</p>
      </section>

      <section className={styles.register} aria-labelledby="register-title">
        <div className={styles.sectionHeading}>
          <div><p className={styles.eyebrow}>Primary source directory</p><h2 id="register-title">Current register</h2></div>
          <p>Links checked {formatDate(SOURCE_REGISTER_VERIFIED_AT)}</p>
        </div>

        <div className={styles.table} role="table" aria-label="Nigerian legal source register">
          <div className={`${styles.row} ${styles.labels}`} role="row">
            <span>Publisher and collection</span><span>Coverage</span><span>Status</span>
          </div>
          {[...LEGAL_SOURCES].sort((a, b) => a.priority - b.priority).map((source) => (
            <article className={styles.row} role="row" key={source.id}>
              <div>
                <span className={styles.kind}>{source.authority} · {source.jurisdiction}</span>
                <h3>{source.name}</h3>
                <p>{source.publisher}</p>
                <a href={source.url} target="_blank" rel="noreferrer">Open original source ↗</a>
              </div>
              <div>
                <p>{source.coverage}</p>
                <small>{source.usePolicy}</small>
              </div>
              <span className={`${styles.status} ${styles[source.status.replaceAll(" ", "").toLowerCase()]}`}>{source.status}</span>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.policy}>
        <div><p className={styles.eyebrow}>Corpus policy</p><h2>What will be stored</h2></div>
        <ol>
          <li><strong>Official text first.</strong><span>Constitutions, Acts, regulations, gazettes, court rules and judgments are collected from their issuing bodies where available.</span></li>
          <li><strong>Version every authority.</strong><span>Each record keeps its source URL, publication date, jurisdiction, amendment status, checksum and last verification date.</span></li>
          <li><strong>Respect publishing rights.</strong><span>Textbooks, annotated statutes and commercial law reports are indexed only with permission or a suitable licence.</span></li>
          <li><strong>Show the evidence.</strong><span>Answers distinguish binding authority, persuasive material and commentary, and expose the quoted passage used.</span></li>
        </ol>
      </section>

      <footer className={styles.footer}>
        <p>This register is a transparency record, not a representation that every Nigerian law has already been digitised or checked for currentness.</p>
        <Link href="/">Ask The Judge</Link>
      </footer>
    </main>
  );
}
