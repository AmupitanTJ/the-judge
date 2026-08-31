import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("contains The Judge research interface", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.match(page, /THE JUDGE/);
  assert.match(page, /Nigerian legal intelligence/);
  assert.match(page, /source-backed answers/i);
  assert.match(page, /Is the Nigerian Constitution the highest law/);
  assert.doesNotMatch(page, /Your site is taking shape|Building your site/);
});

test("research route enforces grounded-source behavior", async () => {
  const [route, migration, postgresMigration] = await Promise.all([
    readFile(new URL("../app/api/research/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../drizzle/0001_constitution_passages.sql", import.meta.url), "utf8"),
    readFile(new URL("../postgres/0000_foundation.sql", import.meta.url), "utf8"),
  ]);

  assert.match(route, /insufficient_coverage/);
  assert.match(route, /source_verified/);
  assert.match(route, /The Judge will not invent an answer/);
  assert.match(route, /research_citations/);
  assert.match(migration, /Section 1\(3\)/);
  assert.match(migration, /Section 4\(3\)/);
  assert.match(migration, /PLAC Laws of Nigeria|constitution-1999/);
  assert.match(postgresMigration, /CREATE TABLE IF NOT EXISTS research_sessions/);
  assert.match(postgresMigration, /CREATE TABLE IF NOT EXISTS matters/);
  assert.match(route, /persistence: "postgres"/);
});
