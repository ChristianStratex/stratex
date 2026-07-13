import { test } from "node:test";
import assert from "node:assert/strict";
import { parseAmount, parseCsvLine } from "./csv";

test("parseAmount handles Dutch decimal comma", () => {
  assert.equal(parseAmount("1.234,56"), 1234.56);
  assert.equal(parseAmount("1234,56"), 1234.56);
});

test("parseAmount handles Dutch thousands without cents", () => {
  assert.equal(parseAmount("1.200"), 1200);
  assert.equal(parseAmount("1.234.567"), 1234567);
});

test("parseAmount handles international format", () => {
  assert.equal(parseAmount("1,234.56"), 1234.56);
  assert.equal(parseAmount("1234.56"), 1234.56);
  assert.equal(parseAmount("950"), 950);
});

test("parseCsvLine handles quoted fields with escaped quotes", () => {
  assert.deepEqual(parseCsvLine('a,"b,c","d""e"'), ["a", "b,c", 'd"e']);
});
