import Parser from "rss-parser";
import { CATEGORY_KEYS, FEEDS, type CategoryKey } from "./feeds";
import { resolveMissingImages } from "./og-image";

type CustomItem = { "media:content"?: { $?: { url?: string } } };

const parser: Parser<object, CustomItem> = new Parser({
  timeout: 15000,
  customFields: { item: ["media:content"] },
});

export interface NewsItem {
  category: CategoryKey;
  title: string;
  link: string;
  source: string;
  publishedAt: string | null;
  image: string | null;
  excerpt: string;
}

function stripHtml(text: string | undefined): string {
  if (!text) return "";
  return text
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchFeed(url: string, category: CategoryKey): Promise<NewsItem[]> {
  try {
    const feed = await parser.parseURL(url);
    const source = feed.title || url;
    return (feed.items || []).map((item) => ({
      category,
      title: stripHtml(item.title),
      link: item.link || "",
      source,
      publishedAt: item.isoDate || item.pubDate || null,
      image: item.enclosure?.url || item["media:content"]?.$?.url || null,
      excerpt: stripHtml(item.contentSnippet || item.content || "").slice(0, 160),
    }));
  } catch (err) {
    console.warn(`[rss] échec parsing ${url}:`, err);
    return [];
  }
}

function dedupeAndSort(items: NewsItem[]): NewsItem[] {
  const seen = new Set<string>();
  const unique = items.filter((item) => {
    if (!item.link || seen.has(item.link)) return false;
    seen.add(item.link);
    return true;
  });
  unique.sort((a, b) => {
    const dateA = a.publishedAt ? Date.parse(a.publishedAt) : 0;
    const dateB = b.publishedAt ? Date.parse(b.publishedAt) : 0;
    return dateB - dateA;
  });
  return unique;
}

/**
 * Récupère les items de plusieurs flux d'une même rubrique en équilibrant
 * par flux (pas juste globalement) : sinon un flux très prolifique (ex:
 * Google News) noie les sources moins fréquentes mais tout aussi pertinentes
 * (ex: La Provence pour l'actu régionale, ou France Info pour ses vraies
 * photos), qui finissaient par disparaître complètement.
 */
async function fetchUrlsBalanced(
  urls: string[],
  category: CategoryKey,
  totalLimit: number,
  filter?: (item: NewsItem) => boolean
): Promise<NewsItem[]> {
  const perUrlLimit = Math.max(4, Math.ceil(totalLimit / urls.length));
  const perUrl = await Promise.all(
    urls.map(async (url) => {
      const items = await fetchFeed(url, category);
      const filtered = filter ? items.filter(filter) : items;
      return dedupeAndSort(filtered).slice(0, perUrlLimit);
    })
  );
  return dedupeAndSort(perUrl.flat()).slice(0, totalLimit);
}

/**
 * Derniers articles d'une rubrique, pour l'affichage direct (pas de fenêtre temporelle).
 * Complète l'image des articles qui n'en ont pas via og:image quand c'est
 * possible (voir lib/og-image.ts), pour varier les visuels de la rubrique.
 */
export async function fetchCategoryItems(
  category: CategoryKey,
  limit = 20
): Promise<NewsItem[]> {
  const items = await fetchUrlsBalanced(FEEDS[category].urls, category, limit);
  await resolveMissingImages(items);
  return items;
}

/**
 * Items de toutes les rubriques pour le résumé Gemini : cap par thème pour
 * qu'un thème prolifique (ex: football) n'écrase pas les thèmes plus rares
 * (ex: catastrophes naturelles), fenêtré sur les dernières 24h pour rester pertinent.
 */
export async function fetchItemsForSummary(
  perCategoryLimit = 12,
  lookbackHours = 24
): Promise<NewsItem[]> {
  const cutoff = Date.now() - lookbackHours * 60 * 60 * 1000;
  const perCategory = await Promise.all(
    CATEGORY_KEYS.map((category) =>
      fetchUrlsBalanced(FEEDS[category].urls, category, perCategoryLimit, (item) =>
        Boolean(item.publishedAt && Date.parse(item.publishedAt) >= cutoff)
      )
    )
  );
  return perCategory.flat();
}
