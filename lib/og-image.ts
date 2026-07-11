const OG_IMAGE_REGEX = /<meta[^>]+(?:property|name)=["']og:image["'][^>]+content=["']([^"']+)["']/i;
const OG_IMAGE_REGEX_ALT = /<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']og:image["']/i;

/** Récupère l'image og:image d'une page article, en ne lisant que le début du
 * HTML (la balise est presque toujours dans le <head>) pour rester rapide. */
export async function fetchOgImage(url: string, timeoutMs = 2500, maxBytes = 60_000): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok || !res.body) return null;

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let html = "";
    let bytes = 0;

    while (bytes < maxBytes) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.length;
      html += decoder.decode(value, { stream: true });

      const match = html.match(OG_IMAGE_REGEX) || html.match(OG_IMAGE_REGEX_ALT);
      if (match) {
        reader.cancel().catch(() => {});
        return match[1];
      }
      if (/<\/head>/i.test(html)) break;
    }
    reader.cancel().catch(() => {});
    return null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Tente de compléter l'image des items qui n'en ont pas, en parallèle et
 * borné dans le temps — un échec par item reste silencieux (on garde null). */
export async function resolveMissingImages<T extends { link: string; image: string | null }>(
  items: T[],
  concurrency = 10
): Promise<void> {
  // Les liens Google News sont des pages interstitielles internes (pas de
  // redirection HTTP directe vers l'article) : og:image y est inatteignable,
  // inutile de perdre du temps à essayer.
  const targets = items.filter(
    (item) => !item.image && item.link && !item.link.includes("news.google.com")
  );
  let cursor = 0;

  async function worker() {
    while (cursor < targets.length) {
      const item = targets[cursor++];
      item.image = await fetchOgImage(item.link);
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, targets.length) }, worker));
}
