import apiClient from "./client";

export interface AssetSearchResult {
  symbol: string;
  name: string;
  category: string;
}

export interface Quote {
  price: number;
  change_24h_pct: number;
  currency: string;
  name: string;
}

export interface PricePoint {
  date: string;
  close: number;
}

export async function searchAssets(
  q: string,
  category?: string,
): Promise<AssetSearchResult[]> {
  const { data } = await apiClient.get<{ results: AssetSearchResult[] } | AssetSearchResult[]>("/market/search", {
    params: { q, ...(category ? { category } : {}) },
  });
  return Array.isArray(data) ? data : data.results;
}

export async function getQuote(
  ticker: string,
  category: string,
): Promise<Quote> {
  const { data } = await apiClient.get<Quote>(`/market/quote/${encodeURIComponent(ticker)}`, {
    params: { category },
  });
  return data;
}

export async function getPriceHistory(
  ticker: string,
  category: string,
  period?: string,
): Promise<PricePoint[]> {
  const { data } = await apiClient.get<{ data: PricePoint[] } | PricePoint[]>(
    `/market/history/${encodeURIComponent(ticker)}`,
    { params: { category, ...(period ? { period } : {}) } },
  );
  return Array.isArray(data) ? data : data.data;
}

// ---------------------------------------------------------------------------
// Browse & Detail
// ---------------------------------------------------------------------------

export interface BrowseAsset {
  symbol: string;
  name: string;
  price: number;
  change_24h_pct: number;
  category: string;
}

export interface AssetDetail {
  symbol: string;
  name: string;
  category: string;
  price: number;
  change_24h_pct: number;
  market_cap: number;
  volume: number;
  high_52w: number;
  low_52w: number;
  description: string;
}

export async function browseMarket(category: string): Promise<BrowseAsset[]> {
  const { data } = await apiClient.get<BrowseAsset[] | { assets: BrowseAsset[] } | { results: BrowseAsset[] }>(
    `/market/browse/${encodeURIComponent(category)}`,
  );
  if (Array.isArray(data)) return data;
  if ("assets" in data) return data.assets;
  if ("results" in data) return data.results;
  return [];
}

export async function getAssetDetail(
  ticker: string,
  category: string,
): Promise<AssetDetail> {
  const { data } = await apiClient.get<AssetDetail>(
    `/market/detail/${encodeURIComponent(ticker)}`,
    { params: { category } },
  );
  return data;
}
