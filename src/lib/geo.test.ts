import { test } from "node:test";
import assert from "node:assert/strict";
import { cityCoords } from "./geo";

test("known city returns coordinates near its center", () => {
  const c = cityCoords("Leeuwarden", "Teststraat 1");
  assert.ok(c);
  assert.ok(Math.abs(c!.lat - 53.2012) < 0.02);
  assert.ok(Math.abs(c!.lng - 5.7999) < 0.03);
});

test("lookup is case/whitespace insensitive", () => {
  assert.ok(cityCoords(" DOKKUM "));
  assert.ok(cityCoords("den haag"));
});

test("unknown city returns null", () => {
  assert.equal(cityCoords("Atlantis"), null);
});

test("jitter is deterministic per seed and differs across seeds", () => {
  const a1 = cityCoords("Sneek", "Marktstraat 1")!;
  const a2 = cityCoords("Sneek", "Marktstraat 1")!;
  const b = cityCoords("Sneek", "Havenkade 9")!;
  assert.deepEqual(a1, a2);
  assert.notDeepEqual(a1, b);
});
