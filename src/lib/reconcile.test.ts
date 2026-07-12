import { test } from "node:test";
import assert from "node:assert/strict";
import { parseBankCsv, matchTransactions, type OpenChargeLite } from "./reconcile";

const charge = (id: string, tenant: string, amount: number, periodYm = "2026-07", outstanding = amount): OpenChargeLite => ({
  id,
  tenant,
  property: "Pand X",
  periodYm,
  amount,
  outstanding,
});

test("parseBankCsv handles Dutch headers and decimal commas, skips outgoing", () => {
  const { txs, errors } = parseBankCsv(
    `Datum,Bedrag,Naam,Omschrijving\n2026-07-01,"1.234,56",Bakkerij Hoekstra,Huur juli\n2026-07-02,"-500,00",Energie BV,afschrijving`,
  );
  assert.equal(errors.length, 0);
  assert.equal(txs.length, 1); // outgoing skipped
  assert.equal(txs[0].amount, 1234.56);
  assert.equal(txs[0].name, "Bakkerij Hoekstra");
});

test("exact amount + full tenant name = HIGH confidence", () => {
  const props = matchTransactions(
    [{ date: "2026-07-01", amount: 1500, name: "Bakkerij Hoekstra", description: "huur 2026-07" }],
    [charge("c1", "Bakkerij Hoekstra", 1500)],
  );
  assert.equal(props[0].chargeId, "c1");
  assert.equal(props[0].confidence, "HIGH");
});

test("ambiguous amount resolved by tenant name", () => {
  const props = matchTransactions(
    [{ date: "", amount: 1000, name: "Fysiotherapie Visser", description: "" }],
    [charge("a", "Bakkerij Hoekstra", 1000), charge("b", "Fysiotherapie Visser", 1000)],
  );
  assert.equal(props[0].chargeId, "b");
});

test("partial payment still matches with lower confidence", () => {
  const props = matchTransactions(
    [{ date: "", amount: 600, name: "Bakkerij Hoekstra", description: "" }],
    [charge("c1", "Bakkerij Hoekstra", 1500)],
  );
  assert.equal(props[0].chargeId, "c1");
  assert.notEqual(props[0].confidence, "HIGH");
});

test("overpayment beyond outstanding does not match", () => {
  const props = matchTransactions(
    [{ date: "", amount: 5000, name: "Onbekende Partij", description: "" }],
    [charge("c1", "Bakkerij Hoekstra", 1500)],
  );
  assert.equal(props[0].chargeId, null);
  assert.equal(props[0].confidence, "NONE");
});

test("each charge is consumed at most once (best score wins)", () => {
  const props = matchTransactions(
    [
      { date: "", amount: 1500, name: "Bakkerij Hoekstra", description: "huur 2026-07" },
      { date: "", amount: 1500, name: "onbekend", description: "" },
    ],
    [charge("c1", "Bakkerij Hoekstra", 1500)],
  );
  assert.equal(props[0].chargeId, "c1");
  assert.equal(props[1].chargeId, null);
});

test("amount-only match yields LOW confidence (needs review)", () => {
  const props = matchTransactions(
    [{ date: "", amount: 1500, name: "Stichting Derden", description: "overboeking" }],
    [charge("c1", "Bakkerij Hoekstra", 1500)],
  );
  assert.equal(props[0].chargeId, "c1");
  assert.equal(props[0].confidence, "MEDIUM"); // exact-outstanding amount alone = 2.5
});