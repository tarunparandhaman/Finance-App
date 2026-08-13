export type ImportField = "symbol" | "quantity" | "price" | "date";

/** Header aliases seen across Zerodha Console, Groww, and generic exports. */
const ALIASES: Record<ImportField, string[]> = {
  symbol: ["symbol", "instrument", "tradingsymbol", "scheme name", "scheme", "stock name", "name", "stock"],
  quantity: ["qty.", "qty", "quantity", "units", "shares", "net qty"],
  price: [
    "avg. cost",
    "avg cost",
    "average cost",
    "average price",
    "avg price",
    "avg. price",
    "buy price",
    "buy avg",
    "price",
    "nav",
    "cost price",
  ],
  date: ["date", "trade date", "purchase date", "buy date", "order date"],
};

/** Best-guess column index for a field, by exact then partial header match. */
export function guessColumn(headers: string[], field: ImportField): number {
  const lower = headers.map((h) => h.toLowerCase().trim());
  const aliases = ALIASES[field];

  for (const alias of aliases) {
    const idx = lower.indexOf(alias);
    if (idx !== -1) return idx;
  }
  for (let i = 0; i < lower.length; i++) {
    if (aliases.some((a) => lower[i].includes(a))) return i;
  }
  return -1;
}

export interface ColumnMapping {
  symbol: number;
  quantity: number;
  price: number;
  date: number; // -1 means "not mapped, use today"
}

export function guessMapping(headers: string[]): ColumnMapping {
  return {
    symbol: guessColumn(headers, "symbol"),
    quantity: guessColumn(headers, "quantity"),
    price: guessColumn(headers, "price"),
    date: guessColumn(headers, "date"),
  };
}
