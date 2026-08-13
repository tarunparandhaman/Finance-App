export interface ParsedCsv {
  headers: string[];
  rows: string[][];
}

/**
 * Minimal RFC 4180-ish CSV parser: handles quoted fields, escaped quotes
 * (""), commas inside quotes, and both \n and \r\n line endings. Good enough
 * for broker exports without pulling in a dependency.
 */
export function parseCsv(text: string): ParsedCsv {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  const pushField = () => {
    row.push(field);
    field = "";
  };
  const pushRow = () => {
    pushField();
    rows.push(row);
    row = [];
  };

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
      continue;
    }

    if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      pushField();
    } else if (c === "\n") {
      pushRow();
    } else if (c === "\r") {
      // swallow — \r\n handled by the following \n
    } else {
      field += c;
    }
  }
  // Final field/row if the file doesn't end with a newline.
  if (field.length > 0 || row.length > 0) pushRow();

  const nonEmpty = rows.filter((r) => r.some((cell) => cell.trim() !== ""));
  const [headers, ...dataRows] = nonEmpty;
  return { headers: headers ?? [], rows: dataRows };
}

/** Strips currency symbols, thousands separators, and stray whitespace. */
export function parseCsvNumber(raw: string): number {
  const cleaned = raw.replace(/[₹$,\s]/g, "");
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : NaN;
}

/** Accepts YYYY-MM-DD, DD-MM-YYYY, DD/MM/YYYY, or MM/DD/YYYY; falls back to today. */
export function parseCsvDate(raw: string): string {
  const trimmed = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) return trimmed.slice(0, 10);

  const dmy = trimmed.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (dmy) {
    const [, d, m, y] = dmy;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  const parsed = new Date(trimmed);
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);

  return new Date().toISOString().slice(0, 10);
}
