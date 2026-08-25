CREATE TABLE `users` (
  `id` text PRIMARY KEY NOT NULL,
  `email` text NOT NULL,
  `display_name` text,
  `role` text DEFAULT 'practitioner' NOT NULL,
  `created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_users_email` ON `users` (`email`);
--> statement-breakpoint
CREATE TABLE `matters` (
  `id` text PRIMARY KEY NOT NULL,
  `owner_id` text NOT NULL,
  `title` text NOT NULL,
  `reference` text,
  `jurisdiction` text DEFAULT 'Federal' NOT NULL,
  `status` text DEFAULT 'active' NOT NULL,
  `created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_matters_owner_updated` ON `matters` (`owner_id`,`updated_at`);
--> statement-breakpoint
CREATE TABLE `legal_documents` (
  `id` text PRIMARY KEY NOT NULL,
  `canonical_title` text NOT NULL,
  `citation` text,
  `document_type` text NOT NULL,
  `jurisdiction` text NOT NULL,
  `issuing_body` text,
  `enacted_date` text,
  `effective_date` text,
  `source_url` text NOT NULL,
  `source_publisher` text NOT NULL,
  `legal_status` text DEFAULT 'in_force' NOT NULL,
  `review_status` text DEFAULT 'metadata_verified' NOT NULL,
  `last_verified_at` text,
  `created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_legal_documents_title` ON `legal_documents` (`canonical_title`);
--> statement-breakpoint
CREATE INDEX `idx_legal_documents_jurisdiction_type` ON `legal_documents` (`jurisdiction`,`document_type`);
--> statement-breakpoint
CREATE TABLE `legal_passages` (
  `id` text PRIMARY KEY NOT NULL,
  `document_id` text NOT NULL,
  `provision_label` text,
  `page_number` integer,
  `paragraph_number` text,
  `text_content` text NOT NULL,
  `checksum` text NOT NULL,
  `review_status` text DEFAULT 'unverified' NOT NULL,
  `created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (`document_id`) REFERENCES `legal_documents`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_legal_passages_document` ON `legal_passages` (`document_id`);
--> statement-breakpoint
CREATE TABLE `research_sessions` (
  `id` text PRIMARY KEY NOT NULL,
  `owner_id` text NOT NULL,
  `matter_id` text,
  `question` text NOT NULL,
  `answer_mode` text DEFAULT 'professional' NOT NULL,
  `jurisdiction` text DEFAULT 'Federal' NOT NULL,
  `created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
  FOREIGN KEY (`matter_id`) REFERENCES `matters`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `idx_research_owner_created` ON `research_sessions` (`owner_id`,`created_at`);
--> statement-breakpoint
CREATE TABLE `research_citations` (
  `id` text PRIMARY KEY NOT NULL,
  `research_session_id` text NOT NULL,
  `passage_id` text NOT NULL,
  `proposition` text NOT NULL,
  `display_order` integer NOT NULL,
  FOREIGN KEY (`research_session_id`) REFERENCES `research_sessions`(`id`) ON UPDATE no action ON DELETE cascade,
  FOREIGN KEY (`passage_id`) REFERENCES `legal_passages`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_research_citation_order` ON `research_citations` (`research_session_id`,`display_order`);
--> statement-breakpoint
INSERT INTO `legal_documents` (`id`,`canonical_title`,`citation`,`document_type`,`jurisdiction`,`issuing_body`,`source_url`,`source_publisher`,`legal_status`,`review_status`,`last_verified_at`) VALUES
('constitution-1999','Constitution of the Federal Republic of Nigeria 1999','Cap C23, LFN 2004','Constitution','Federal','Federal Republic of Nigeria','https://lawsofnigeria.placng.org/laws/C23.pdf','PLAC Laws of Nigeria','amendment_review_required','metadata_verified','2026-08-24'),
('marriage-act','Marriage Act','Cap M6, LFN 2004','Act','Federal','Federal Republic of Nigeria','https://lawsofnigeria.placng.org/','PLAC Laws of Nigeria','status_review_pending','metadata_review_pending',NULL),
('land-use-act','Land Use Act','Cap L5, LFN 2004','Act','Federal','Federal Republic of Nigeria','https://lawsofnigeria.placng.org/','PLAC Laws of Nigeria','status_review_pending','metadata_review_pending',NULL),
('evidence-act','Evidence Act 2011',NULL,'Act','Federal','Federal Republic of Nigeria','https://nigerialii.org/legislation/','NigeriaLII','status_review_pending','metadata_review_pending',NULL),
('cama-2020','Companies and Allied Matters Act 2020',NULL,'Act','Federal','Federal Republic of Nigeria','https://nigerialii.org/legislation/','NigeriaLII','status_review_pending','metadata_review_pending',NULL),
('labour-act','Labour Act','Cap L1, LFN 2004','Act','Federal','Federal Republic of Nigeria','https://lawsofnigeria.placng.org/','PLAC Laws of Nigeria','status_review_pending','metadata_review_pending',NULL);
--> statement-breakpoint
PRAGMA optimize;
