import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("answer builder refuses invention and requires federal jurisdiction", async () => {
  const source = await readFile(new URL("../lib/research-answer.ts", import.meta.url), "utf8");
  assert.match(source, /will not invent an answer without matching authority/);
  assert.match(source, /jurisdictionNeedsClarification/);
  assert.match(source, /needs_clarification/);
  assert.match(source, /governingLaw/);
  assert.match(source, /amendment_review_required/);
  assert.match(source, /No model memory is treated as legal authority/);
});
