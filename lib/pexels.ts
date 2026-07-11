import type { CategoryKey } from "./feeds";

/** Requête de recherche Pexels par rubrique, pour illustrer les articles dont
 * on n'a aucune image réelle (typiquement les liens Google News). */
const CATEGORY_QUERIES: Record<CategoryKey, string> = {
  basket: "basketball",
  football: "soccer football stadium",
  politique_nationale: "french government politics",
  politique_internationale: "world politics geopolitics",
  catastrophes_naturelles: "natural disaster storm",
  economie: "global economy finance",
  tech: "technology artificial intelligence",
  actu_generale_tf1: "breaking news newspaper",
};

interface PexelsPhoto {
  src: { large: string };
}

// Cache mémoire process : utile si plusieurs requêtes arrivent sur la même
// instance serverless "chaude", sans complexité d'infra supplémentaire.
const cache = new Map<CategoryKey, string[]>();

export async function fetchCategoryStockPhotos(category: CategoryKey, count = 10): Promise<string[]> {
  const cached = cache.get(category);
  if (cached) return cached;

  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) return [];

  try {
    const query = encodeURIComponent(CATEGORY_QUERIES[category]);
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${query}&per_page=${count}&orientation=landscape`,
      { headers: { Authorization: apiKey }, signal: AbortSignal.timeout(4000) }
    );
    if (!res.ok) return [];
    const data = await res.json();
    const urls = ((data.photos as PexelsPhoto[]) || []).map((p) => p.src.large);
    cache.set(category, urls);
    return urls;
  } catch {
    return [];
  }
}
