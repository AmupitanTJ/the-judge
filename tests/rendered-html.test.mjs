import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("contains The Judge research interface", async () => {
  const [page, upload, authStyles] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/components/document-upload.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/auth.css", import.meta.url), "utf8"),
  ]);
  assert.match(page, /THE JUDGE/);
  assert.match(page, /Nigerian legal intelligence/);
  assert.match(page, /source-backed answers/i);
  assert.match(page, /Is the Nigerian Constitution the highest law/);
  assert.match(page, /Documents/);
  assert.match(page, /Saved/);
  assert.match(page, /Updates/);
  assert.match(page, /Why this answer/);
  assert.match(page, /Upload a private case document/);
  assert.match(page, /DocumentUpload/);
  assert.match(page, /signOut/);
  assert.match(page, /Log out/);
  assert.match(upload, /UploadIcon/);
  assert.match(upload, /M10 14V3/);
  assert.match(authStyles, /width:108px/);
  assert.doesNotMatch(page, /Landlord’s right to recover premises|Your site is taking shape|Building your site/);
});

test("research route enforces grounded-source behavior", async () => {
  const [route, answer, migration, postgresMigration] = await Promise.all([
    readFile(new URL("../app/api/research/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/research-answer.ts", import.meta.url), "utf8"),
    readFile(new URL("../drizzle/0001_constitution_passages.sql", import.meta.url), "utf8"),
    readFile(new URL("../postgres/0000_foundation.sql", import.meta.url), "utf8"),
  ]);

  assert.match(route, /insufficient_coverage/);
  assert.match(route, /needs_clarification/);
  assert.match(route, /source_verified/);
  assert.match(route, /matterId/);
  assert.match(answer, /The Judge will not invent an answer/);
  assert.match(answer, /governingLaw/);
  assert.match(answer, /jurisdictionNeedsClarification/);
  assert.match(migration, /Section 1\(3\)/);
  assert.match(migration, /Section 4\(3\)/);
  assert.match(migration, /PLAC Laws of Nigeria|constitution-1999/);
  assert.match(postgresMigration, /CREATE TABLE IF NOT EXISTS research_sessions/);
  assert.match(postgresMigration, /CREATE TABLE IF NOT EXISTS matters/);
  assert.match(route, /persistence: "postgres"/);
  assert.doesNotMatch(route, /payload.jurisdiction === "Federal" \? "Federal" : "Federal"/);
});

test("source viewer and coverage surfaces exist", async () => {
  const [library, session, saved, coverage, coverageLib] = await Promise.all([
    readFile(new URL("../app/api/library/[id]/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/research/[id]/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/saved/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/coverage/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/coverage.ts", import.meta.url), "utf8"),
  ]);
  assert.match(library, /source_verified/);
  assert.match(session, /presentAnswer/);
  assert.match(saved, /research_citations/);
  assert.match(coverage, /COVERAGE_MATRIX/);
  assert.match(coverageLib, /amendment_review_required/);
  assert.match(coverageLib, /Not in foundation corpus/);
});
