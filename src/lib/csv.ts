// Minimal RFC-4180-ish CSV parsing shared by import & reconciliation.

/** Parse one CSV line honoring quotes and escaped quotes. */
export function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQuotes) {
      if (c === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (c === '"') {
        inQuotes = false;
      } else {
        cur += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      out.push(cur);
      cur = "";
    } else {
      cur += c;
    }
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

/** Split CSV text into non-empty trimmed lines. */
export function csvLines(text: string): string[] {
  return text.split(/\r?\n/).filter((l) => l.trim().length > 0);
}

/** Parse a Dutch or international decimal ("1.234,56" / "1234.56" / "1.200") to a number. */
export function parseAmount(raw: string): number | null {
  if (!raw) return null;
  let s = raw.replace(/[€\s]/g, "");
  if (/,\d{1,2}$/.test(s)) {
    // Dutch: comma is the decimal separator, dots are thousands. "1.234,56" → "1234.56"
    s = s.replace(/\./g, "").replace(",", ".");
  } else if (/^\d{1,3}(\.\d{3})+$/.test(s)) {
    // Dutch thousands with no cents: "1.200" / "1.234.567" → strip the dots.
    s = s.replace(/\./g, "");
  } else {
    // International: comma is a thousands separator. "1,234.56" → "1234.56"
    s = s.replace(/,/g, "");
  }
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}
