// Indices en direct via l'API "chart" non-officielle de Yahoo Finance :
// gratuite, sans clé ni compte (contrairement à Twelve Data, qui réserve les
// indices à son offre payante). Non documentée officiellement mais très
// largement utilisée et stable, dans le même esprit que Google News RSS
// ailleurs dans ce projet.
const INDICES = [
  { symbol: "%5EFCHI", label: "CAC 40" },
  { symbol: "%5EDJI", label: "Dow Jones" },
  { symbol: "%5EIXIC", label: "Nasdaq" },
  { symbol: "%5EGSPC", label: "S&P 500" },
];

export interface IndexQuote {
  label: string;
  price: number;
  change: number;
  changePercent: number;
  currency: string;
}

async function fetchOne(symbol: string, label: string): Promise<IndexQuote | null> {
  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`,
      { headers: { "User-Agent": "Mozilla/5.0" }, signal: AbortSignal.timeout(4000) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const meta = data?.chart?.result?.[0]?.meta;
    if (!meta?.regularMarketPrice || !meta?.chartPreviousClose) return null;

    const price = meta.regularMarketPrice;
    const previousClose = meta.chartPreviousClose;
    const change = price - previousClose;

    return {
      label,
      price,
      change,
      changePercent: (change / previousClose) * 100,
      currency: meta.currency || "",
    };
  } catch {
    return null;
  }
}

export async function fetchIndexQuotes(): Promise<IndexQuote[]> {
  const results = await Promise.all(INDICES.map((i) => fetchOne(i.symbol, i.label)));
  return results.filter((q): q is IndexQuote => q !== null);
}
