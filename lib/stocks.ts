/** Strips the exchange suffix so NSE (.NS) and BSE (.BO) listings of the same
 * Indian company compare equal — most people don't distinguish between them. */
export function baseSymbol(symbol: string): string {
  return symbol.replace(/\.(NS|BO)$/, "");
}

/** Prefers the NSE listing when both exist for the same underlying stock. */
export function preferredSymbol(a: string, b: string): string {
  if (a.endsWith(".NS")) return a;
  if (b.endsWith(".NS")) return b;
  return a;
}
