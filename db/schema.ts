import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull(),
  displayName: text("display_name"),
  role: text("role", { enum: ["practitioner", "public", "admin"] }).notNull().default("practitioner"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [uniqueIndex("idx_users_email").on(table.email)]);

export const matters = sqliteTable("matters", {
  id: text("id").primaryKey(),
  ownerId: text("owner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  reference: text("reference"),
  jurisdiction: text("jurisdiction").notNull().default("Federal"),
  status: text("status", { enum: ["active", "archived"] }).notNull().default("active"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [index("idx_matters_owner_updated").on(table.ownerId, table.updatedAt)]);

export const legalDocuments = sqliteTable("legal_documents", {
  id: text("id").primaryKey(),
  canonicalTitle: text("canonical_title").notNull(),
  citation: text("citation"),
  documentType: text("document_type").notNull(),
  jurisdiction: text("jurisdiction").notNull(),
  issuingBody: text("issuing_body"),
  enactedDate: text("enacted_date"),
  effectiveDate: text("effective_date"),
  sourceUrl: text("source_url").notNull(),
  sourcePublisher: text("source_publisher").notNull(),
  legalStatus: text("legal_status").notNull().default("in_force"),
  reviewStatus: text("review_status").notNull().default("metadata_verified"),
  lastVerifiedAt: text("last_verified_at"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("idx_legal_documents_title").on(table.canonicalTitle),
  index("idx_legal_documents_jurisdiction_type").on(table.jurisdiction, table.documentType),
]);

export const legalPassages = sqliteTable("legal_passages", {
  id: text("id").primaryKey(),
  documentId: text("document_id").notNull().references(() => legalDocuments.id, { onDelete: "cascade" }),
  provisionLabel: text("provision_label"),
  pageNumber: integer("page_number"),
  paragraphNumber: text("paragraph_number"),
  textContent: text("text_content").notNull(),
  checksum: text("checksum").notNull(),
  reviewStatus: text("review_status").notNull().default("unverified"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [index("idx_legal_passages_document").on(table.documentId)]);

export const researchSessions = sqliteTable("research_sessions", {
  id: text("id").primaryKey(),
  ownerId: text("owner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  matterId: text("matter_id").references(() => matters.id, { onDelete: "set null" }),
  question: text("question").notNull(),
  answerMode: text("answer_mode", { enum: ["professional", "plain"] }).notNull().default("professional"),
  jurisdiction: text("jurisdiction").notNull().default("Federal"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [index("idx_research_owner_created").on(table.ownerId, table.createdAt)]);

export const researchCitations = sqliteTable("research_citations", {
  id: text("id").primaryKey(),
  researchSessionId: text("research_session_id").notNull().references(() => researchSessions.id, { onDelete: "cascade" }),
  passageId: text("passage_id").notNull().references(() => legalPassages.id, { onDelete: "restrict" }),
  proposition: text("proposition").notNull(),
  displayOrder: integer("display_order").notNull(),
}, (table) => [
  uniqueIndex("idx_research_citation_order").on(table.researchSessionId, table.displayOrder),
]);
