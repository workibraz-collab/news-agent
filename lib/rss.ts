import Parser from "rss-parser";
import { CATEGORY_KEYS, FEEDS, type CategoryKey } from "./feeds";

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

/** Derniers articles d'une rubrique, pour l'affichage direct (pas de fenêtre temporelle). */
export async function fetchCategoryItems(
  category: CategoryKey,
  limit = 20
): Promise<NewsItem[]> {
  const urls = FEEDS[category].urls;
  const results = await Promise.all(urls.map((url) => fetchFeed(url, category)));
  return dedupeAndSort(results.flat()).slice(0, limit);
}

/**
 * Items de toutes les rubriques pour le résumé Gemini : cap par thème pour
 * qu'un thème prolifique (ex: football) n'écrase pas les thèmes plus rares
 * (ex: catastrophes naturelles), fenêtré sur les dernières 24h pour rester pertinent.
 *
 * À l'intérieur d'un même thème, le cap est aussi appliqué par flux (pas juste
 * globalement) : sinon un flux très prolifique (ex: Google News) noie les
 * sources moins fréquentes mais tout aussi pertinentes (ex: La Provence pour
 * l'actu régionale PACA), qui finissaient par disparaître du résumé.
 */
export async function fetchItemsForSummary(
  perCategoryLimit = 12,
  lookbackHours = 24
): Promise<NewsItem[]> {
  const cutoff = Date.now() - lookbackHours * 60 * 60 * 1000;
  const perCategory = await Promise.all(
    CATEGORY_KEYS.map(async (category) => {
      const urls = FEEDS[category].urls;
      const perUrlLimit = Math.max(4, Math.ceil(perCategoryLimit / urls.length));

      const perUrl = await Promise.all(
        urls.map(async (url) => {
          const items = await fetchFeed(url, category);
          const recent = items.filter(
            (item) => item.publishedAt && Date.parse(item.publishedAt) >= cutoff
          );
          return dedupeAndSort(recent).slice(0, perUrlLimit);
        })
      );

      return dedupeAndSort(perUrl.flat()).slice(0, perCategoryLimit);
    })
  );
  return perCategory.flat();
}
