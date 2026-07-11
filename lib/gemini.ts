import type { CategoryKey } from "./feeds";
import type { NewsItem } from "./rss";
import { timeAgo } from "./time";

export type DigestStatus = "calme" | "normal" | "important";

export interface DigestItem extends NewsItem {
  blurb: string;
}

export interface DigestSection {
  category: CategoryKey;
  items: DigestItem[];
}

export interface Digest {
  status: DigestStatus;
  subject: string;
  sections: DigestSection[];
}

interface RawPick {
  index: number;
  blurb: string;
}

interface RawDigest {
  status: DigestStatus;
  subject: string;
  picks: RawPick[];
}

// gemini-flash-latest (gemini-3.5-flash) n'a que 20 requêtes gratuites/jour :
// épuisé en quelques tests. gemini-flash-lite-latest a un quota gratuit
// bien plus confortable et tient très bien la charge sur ce prompt.
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-flash-lite-latest";

export function buildPrompt(items: NewsItem[]): string {
  const lines = [
    "Tu es un rédacteur en chef qui prépare l'édition du jour pour un lecteur " +
      "intéressé par : basket, football, politique nationale et internationale, " +
      "catastrophes naturelles, économie, tech.",
    "",
    "Voici les articles récents disponibles, numérotés. Ignore le bruit, le clickbait " +
      "et les doublons.",
    "",
  ];
  items.forEach((item, index) => {
    const when = timeAgo(item.publishedAt) || "heure inconnue";
    lines.push(`${index}. [${item.category}] ${item.title} (${item.source}, ${when})`);
  });
  lines.push(
    "",
    "Choisis les infos qui méritent vraiment d'être retenues (pas de limite stricte, mais " +
      "reste sélectif) et rédige pour chacune un court commentaire éditorial (\"blurb\"), 1-2 " +
      "phrases, qui apporte du contexte ou explique pourquoi c'est notable — ne répète pas juste " +
      "le titre. Mentionne le timing de façon approximative si pertinent (ex: \"il y a 3h\").",
    "",
    "Réponds UNIQUEMENT avec un JSON de la forme :",
    '{"status": "calme|normal|important", "subject": "...", "picks": [{"index": 0, "blurb": "..."}]}',
    "",
    "Règles :",
    "- status='calme' si rien de vraiment notable (peu de picks, subject très factuel).",
    "- status='normal' pour de l'actu intéressante mais pas urgente.",
    "- status='important' pour de l'actu majeure/urgente.",
    "- \"index\" doit correspondre exactement au numéro de l'article dans la liste ci-dessus.",
    "- Si des articles proviennent d'une source dont le nom contient \"Provence\" (actu régionale " +
      "PACA/Aix-Marseille), inclus TOUJOURS au moins 2 de ces picks, même en status='calme', même " +
      "si l'actu globale du jour est plus importante — l'utilisateur veut suivre son actu locale " +
      "en plus du reste, ne les laisse jamais de côté."
  );
  return lines.join("\n");
}

/** Extrait et parse le premier objet JSON équilibré d'un texte, en ignorant
 * tout texte parasite qui pourrait traîner après (Gemini n'est pas toujours
 * strict malgré responseMimeType=application/json). */
function parseFirstJsonObject(text: string): unknown {
  const start = text.indexOf("{");
  if (start === -1) throw new Error("Aucun objet JSON trouvé dans la réponse");

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < text.length; i++) {
    const char = text[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === '"') inString = false;
      continue;
    }
    if (char === '"') inString = true;
    else if (char === "{") depth++;
    else if (char === "}") {
      depth--;
      if (depth === 0) return JSON.parse(text.slice(start, i + 1));
    }
  }
  throw new Error("Objet JSON incomplet dans la réponse");
}

async function callGeminiRaw(prompt: string): Promise<RawDigest> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY manquant");

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" },
    }),
  });

  if (!resp.ok) {
    throw new Error(`Gemini ${resp.status}: ${await resp.text()}`);
  }

  const data = await resp.json();
  const text: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Réponse Gemini vide ou inattendue");

  const parsed = parseFirstJsonObject(text) as Partial<RawDigest>;
  if (!parsed.status || !parsed.subject || !Array.isArray(parsed.picks)) {
    throw new Error("JSON Gemini incomplet");
  }
  return parsed as RawDigest;
}

/** Regroupe les picks résolus par catégorie, dans l'ordre de première apparition,
 * en s'appuyant sur nos NewsItem d'origine (source de vérité pour lien/image/date). */
function groupByCategory(picks: DigestItem[]): DigestSection[] {
  const order: CategoryKey[] = [];
  const byCategory = new Map<CategoryKey, DigestItem[]>();

  for (const pick of picks) {
    if (!byCategory.has(pick.category)) {
      byCategory.set(pick.category, []);
      order.push(pick.category);
    }
    byCategory.get(pick.category)!.push(pick);
  }

  return order.map((category) => ({ category, items: byCategory.get(category)! }));
}

export async function callGemini(prompt: string, items: NewsItem[]): Promise<Digest> {
  const raw = await callGeminiRaw(prompt);

  const picks: DigestItem[] = raw.picks
    .filter((pick) => items[pick.index])
    .map((pick) => ({ ...items[pick.index], blurb: pick.blurb }));

  if (picks.length === 0) throw new Error("Gemini n'a sélectionné aucun article valide");

  return { status: raw.status, subject: raw.subject, sections: groupByCategory(picks) };
}

/** Filet de sécurité si Gemini échoue ou renvoie un JSON invalide : on affiche
 * quand même un digest basique plutôt que rien du tout. */
export function fallbackDigest(items: NewsItem[]): Digest {
  const picks: DigestItem[] = items.slice(0, 20).map((item) => ({ ...item, blurb: item.excerpt }));

  return {
    status: "normal",
    subject: `Veille info : ${items.length} article(s)`,
    sections: groupByCategory(picks),
  };
}
