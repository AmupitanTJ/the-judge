CREATE TABLE IF NOT EXISTS users (
  id text PRIMARY KEY,
  email text NOT NULL UNIQUE,
  display_name text,
  role text NOT NULL DEFAULT 'practitioner',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS matters (
  id text PRIMARY KEY,
  owner_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL,
  reference text,
  jurisdiction text NOT NULL DEFAULT 'Federal',
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_matters_owner_updated ON matters(owner_id, updated_at DESC);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS legal_documents (
  id text PRIMARY KEY,
  canonical_title text NOT NULL,
  citation text,
  document_type text NOT NULL,
  jurisdiction text NOT NULL,
  issuing_body text,
  enacted_date text,
  effective_date text,
  source_url text NOT NULL,
  source_publisher text NOT NULL,
  legal_status text NOT NULL DEFAULT 'in_force',
  review_status text NOT NULL DEFAULT 'metadata_verified',
  last_verified_at date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_legal_documents_title ON legal_documents(canonical_title);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS legal_passages (
  id text PRIMARY KEY,
  document_id text NOT NULL REFERENCES legal_documents(id) ON DELETE CASCADE,
  provision_label text,
  page_number integer,
  paragraph_number text,
  text_content text NOT NULL,
  keywords text NOT NULL DEFAULT '',
  professional_summary text,
  plain_summary text,
  checksum text NOT NULL,
  review_status text NOT NULL DEFAULT 'unverified',
  created_at timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_legal_passages_document ON legal_passages(document_id);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS research_sessions (
  id text PRIMARY KEY,
  owner_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  matter_id text REFERENCES matters(id) ON DELETE SET NULL,
  question text NOT NULL,
  answer_mode text NOT NULL DEFAULT 'professional',
  jurisdiction text NOT NULL DEFAULT 'Federal',
  created_at timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_research_owner_created ON research_sessions(owner_id, created_at DESC);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS research_citations (
  id text PRIMARY KEY,
  research_session_id text NOT NULL REFERENCES research_sessions(id) ON DELETE CASCADE,
  passage_id text NOT NULL REFERENCES legal_passages(id) ON DELETE RESTRICT,
  proposition text NOT NULL,
  display_order integer NOT NULL,
  UNIQUE(research_session_id, display_order)
);
--> statement-breakpoint
INSERT INTO legal_documents (id, canonical_title, citation, document_type, jurisdiction, issuing_body, source_url, source_publisher, legal_status, review_status, last_verified_at)
VALUES ('constitution-1999','Constitution of the Federal Republic of Nigeria 1999','Cap C23, LFN 2004','Constitution','Federal','Federal Republic of Nigeria','https://lawsofnigeria.placng.org/laws/C23.pdf','PLAC Laws of Nigeria','amendment_review_required','source_verified','2026-08-26')
ON CONFLICT (id) DO UPDATE SET review_status = EXCLUDED.review_status, last_verified_at = EXCLUDED.last_verified_at, updated_at = now();
--> statement-breakpoint
INSERT INTO legal_passages (id, document_id, provision_label, paragraph_number, text_content, keywords, professional_summary, plain_summary, checksum, review_status) VALUES
('constitution-s1-1','constitution-1999','Section 1(1)','1','This Constitution is supreme and its provisions shall have binding force on all authorities and persons throughout the Federal Republic of Nigeria.','constitution supreme supremacy highest law binding force authorities persons','The Constitution is supreme and binds every authority and person throughout Nigeria.','The Constitution is Nigeria''s highest law, and everyone—including government authorities—must obey it.','constitution-s1-1-v1','source_verified'),
('constitution-s1-2','constitution-1999','Section 1(2)','2','The Federal Republic of Nigeria shall not be governed, nor shall any person or group of persons take control of the Government of Nigeria or any part thereof, except in accordance with the provisions of this Constitution.','government control govern constitution lawful takeover constitutional order','Nigeria may be governed, and governmental control may be assumed, only in accordance with the Constitution.','Nobody may govern Nigeria or take control of its government except in the way the Constitution permits.','constitution-s1-2-v1','source_verified'),
('constitution-s1-3','constitution-1999','Section 1(3)','3','If any other law is inconsistent with the provisions of this Constitution, this Constitution shall prevail, and that other law shall, to the extent of the inconsistency, be void.','constitution supreme supremacy conflict inconsistent law prevail void invalid','A law inconsistent with the Constitution is void to the extent of that inconsistency.','If another law conflicts with the Constitution, the Constitution wins and the conflicting part of that law has no legal effect.','constitution-s1-3-v1','source_verified'),
('constitution-s4-1','constitution-1999','Section 4(1)','1','The legislative powers of the Federal Republic of Nigeria shall be vested in a National Assembly for the Federation, which shall consist of a Senate and a House of Representatives.','legislative power make laws lawmaking national assembly senate house representatives federal','Federal legislative power is vested in the National Assembly, comprising the Senate and House of Representatives.','The National Assembly makes federal laws. It has two chambers: the Senate and the House of Representatives.','constitution-s4-1-v1','source_verified'),
('constitution-s4-2','constitution-1999','Section 4(2)','2','The National Assembly shall have power to make laws for the peace, order and good government of the Federation or any part thereof with respect to any matter included in the Exclusive Legislative List set out in Part I of the Second Schedule to this Constitution.','national assembly make laws peace order good government federation exclusive legislative list second schedule','The National Assembly may legislate for the Federation on matters in the Exclusive Legislative List.','The National Assembly can make laws on the federal subjects listed in the Constitution''s Exclusive Legislative List.','constitution-s4-2-v1','source_verified'),
('constitution-s4-3','constitution-1999','Section 4(3)','3','The power of the National Assembly to make laws for the peace, order and good government of the Federation with respect to any matter included in the Exclusive Legislative List shall, save as otherwise provided in this Constitution, be to the exclusion of the Houses of Assembly of States.','exclusive legislative list national assembly state house assembly exclusion powers federal laws','Except where the Constitution otherwise provides, legislative competence over Exclusive List matters belongs to the National Assembly and excludes State Houses of Assembly.','Generally, only the National Assembly may make laws about subjects on the Exclusive Legislative List; State Houses of Assembly cannot do so unless the Constitution allows it.','constitution-s4-3-v1','source_verified')
ON CONFLICT (id) DO UPDATE SET text_content = EXCLUDED.text_content, keywords = EXCLUDED.keywords, professional_summary = EXCLUDED.professional_summary, plain_summary = EXCLUDED.plain_summary, checksum = EXCLUDED.checksum, review_status = EXCLUDED.review_status;
