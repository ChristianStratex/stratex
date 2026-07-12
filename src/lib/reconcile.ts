// Bank-transaction ↔ rent-charge matching engine.
// Pure logic (no DB) so it is unit-testable and reusable for the future
// PSD2 bank feed — the feed will deliver the same BankTx shape.

import { parseCsvLine, csvLines, parseAmount } from "./csv";

export interface BankTx {
  date: string; // as given in the export (display only)
  amount: number; // positive = incoming
  name: string; // counterparty name
  description: string; // reference / omschrijving
}

export interface OpenChargeLite {
  id: string;
  tenant: string;
  property: string;
  periodYm: string;
  amount: number;
  outstanding: number;
}

export type MatchConfidence = "HIGH" | "MEDIUM" | "LOW" | "NONE";

export interface MatchProposal {
  tx: BankTx;
  chargeId: string | null;
  charge?: OpenChargeLite;
  confidence: MatchConfidence;
  score: number;
  reasons: string[];
}

/**
 * Parse a pasted bank export. Accepts flexible headers (EN/NL):
 * Date/Datum, Amount/Bedrag, Name/Naam/Tegenpartij, Description/Omschrijving/Mededelingen.
 * Rows with unparseable or non-positive amounts are skipped (only incoming payments matter).
 */
export function parseBankCsv(text: string): { txs: BankTx[]; errors: string[] } {
  const errors: string[] = [];
  const lines = csvLines(text);
  if (lines.length < 2) return { txs: [], errors: ["CSV needs a header row and at least one data row."] };

  const header = parseCsvLine(lines[0]).map((h) => h.toLowerCase());
  const find = (...names: string[]) => header.findIndex((h) => names.some((n) => h.includes(n)));
  const col = {
    date: find("date", "datum"),
    amount: find("amount", "bedrag"),
    name: find("name", "naam", "tegenpartij", "counterparty"),
    desc: find("description", "omschrijving", "mededeling", "reference", "kenmerk"),
  };
  if (col.amount < 0) return { txs: [], errors: ["No Amount/Bedrag column found."] };

  const txs: BankTx[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = parseCsvLine(lines[i]);
    const amount = parseAmount(cells[col.amount] ?? "");
    if (amount == null) {
      errors.push(`Row ${i + 1}: unparseable amount`);
      continue;
    }
    if (amount <= 0) continue; // outgoing payment — not rent income
    txs.push({
      date: col.date >= 0 ? (cells[col.date] ?? "") : "",
      amount,
      name: col.name >= 0 ? (cells[col.name] ?? "") : "",
      description: col.desc >= 0 ? (cells[col.desc] ?? "") : "",
    });
  }
  return { txs, errors };
}

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

const STOPWORDS = new Set(["bv", "b", "v", "cv", "de", "het", "van", "der", "en", "vof", "nv"]);

function tokens(s: string): string[] {
  return normalize(s)
    .split(" ")
    .filter((t) => t.length >= 3 && !STOPWORDS.has(t));
}

/** Score a single tx against a single charge; returns score + reasons. */
function scorePair(tx: BankTx, charge: OpenChargeLite): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  let score = 0;

  // Amount — the strongest signal.
  if (Math.abs(tx.amount - charge.outstanding) < 0.01) {
    score += 2.5;
    reasons.push("amount = outstanding");
  } else if (Math.abs(tx.amount - charge.amount) < 0.01) {
    score += 2;
    reasons.push("amount = charge");
  } else if (tx.amount < charge.outstanding) {
    score += 0.5;
    reasons.push("partial amount");
  } else {
    // Paying more than outstanding on this charge — very unlikely match.
    return { score: 0, reasons: [] };
  }

  // Tenant name in counterparty/description.
  const hay = normalize(`${tx.name} ${tx.description}`);
  const tks = tokens(charge.tenant);
  const hits = tks.filter((tk) => hay.includes(tk));
  if (tks.length > 0 && hits.length === tks.length) {
    score += 2;
    reasons.push("tenant name full match");
  } else if (hits.length > 0) {
    score += 1;
    reasons.push(`tenant name partial (${hits.length}/${tks.length})`);
  }

  // Period reference (e.g. "2026-07" or "07-2026") in the description.
  const [y, m] = charge.periodYm.split("-");
  const d = normalize(tx.description);
  if (d.includes(`${y} ${m}`) || d.includes(`${m} ${y}`) || normalize(tx.description).includes(normalize(charge.periodYm))) {
    score += 1;
    reasons.push("period in reference");
  }

  return { score, reasons };
}

function confidenceOf(score: number): MatchConfidence {
  if (score >= 4) return "HIGH";
  if (score >= 2.5) return "MEDIUM";
  if (score >= 1.5) return "LOW";
  return "NONE";
}

/**
 * Match transactions to open charges greedily by best score.
 * Each charge is consumed at most once.
 */
export function matchTransactions(txs: BankTx[], charges: OpenChargeLite[]): MatchProposal[] {
  // Compute all candidate pairs.
  const pairs: { ti: number; charge: OpenChargeLite; score: number; reasons: string[] }[] = [];
  txs.forEach((tx, ti) => {
    for (const charge of charges) {
      const { score, reasons } = scorePair(tx, charge);
      if (score >= 1.5) pairs.push({ ti, charge, score, reasons });
    }
  });
  pairs.sort((a, b) => b.score - a.score);

  const usedTx = new Set<number>();
  const usedCharge = new Set<string>();
  const byTx = new Map<number, { charge: OpenChargeLite; score: number; reasons: string[] }>();
  for (const p of pairs) {
    if (usedTx.has(p.ti) || usedCharge.has(p.charge.id)) continue;
    usedTx.add(p.ti);
    usedCharge.add(p.charge.id);
    byTx.set(p.ti, p);
  }

  return txs.map((tx, ti) => {
    const m = byTx.get(ti);
    if (!m) return { tx, chargeId: null, confidence: "NONE" as const, score: 0, reasons: [] };
    return {
      tx,
      chargeId: m.charge.id,
      charge: m.charge,
      confidence: confidenceOf(m.score),
      score: m.score,
      reasons: m.reasons,
    };
  });
}
