import { CATEGORY_KEYS, FEEDS, type CategoryKey } from "./feeds";
import type { NewsItem } from "./rss";
import { timeAgo } from "./time";

export type DigestStatus = "calme" | "normal" | "important";

export interface DigestSection {
  category: CategoryKey;
  /** Titre éditorial court et percutant résumant la rubrique (pas juste le nom de la rubrique). */
  headline: string;
  /** Paragraphe de synthèse de l'essentiel de la rubrique (plusieurs articles combinés). */
  summary: string;
  /** Article le plus représentatif de la rubrique, pour le lien "lire l'article". */
  highlight: NewsItem | null;
}

export interface Digest {
  status: DigestStatus;
  subject: string;
  /** Ordonnées par importance décroissante : sections[0] = article vedette de l'édition. */
  sections: DigestSection[];
}

interface RawSection {
  category: string;
  headline: string;
  summary: string;
  highlight_index: number;
}

interface RawDigest {
  status: DigestStatus;
  subject: string;
  sections: RawSection[];
}

// gemini-flash-latest (gemini-3.5-flash) n'a que 20 requêtes gratuites/jour :
// épuisé en quelques tests. gemini-flash-lite-latest a un quota gratuit
// bien plus confortable et tient très bien la charge sur ce prompt.
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-flash-lite-latest";

export function buildPrompt(items: NewsItem[]): string {
  const lines = [
    "Tu es un rédacteur en chef qui prépare l'édition du jour pour un lecteur " +
      "intéressé par : basket, football, politique nationale et internationale, " +
      "catastrophes naturelles, économie, marché boursier, tech.",
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
    "Pour chaque rubrique où il y a de l'actu notable, rédige :",
    "  1. un titre éditorial court et percutant (\"headline\", façon une de journal — pas juste le " +
      "nom de la rubrique répété, un vrai titre qui donne envie de lire),",
    "  2. UN SEUL paragraphe de synthèse (\"summary\", 3 à 5 phrases) qui résume l'essentiel à " +
      "retenir de TOUTE l'actu récente de cette rubrique — combine plusieurs articles si besoin. " +
      "Ne te contente jamais de reformuler un seul article : c'est un résumé de rubrique, pas la " +
      "sélection d'un seul sujet. Le paragraphe doit donner envie d'aller consulter la rubrique " +
      "complète pour en savoir plus, pas tout raconter en détail.",
    "Indique aussi l'article le plus représentatif de la rubrique (highlight_index), pour le lien " +
      "\"lire l'article\".",
    "",
    "Réponds UNIQUEMENT avec un JSON de la forme :",
    '{"status": "calme|normal|important", "subject": "...", "sections": [{"category": "basket", "headline": "...", "summary": "...", "highlight_index": 0}]}',
    "",
    "Règles :",
    "- Ordonne \"sections\" par importance décroissante (la rubrique la plus notable du jour en premier).",
    "- status='calme' si rien de vraiment notable dans l'ensemble (peu de sections, ton factuel).",
    "- status='normal' pour de l'actu intéressante mais pas urgente.",
    "- status='important' pour de l'actu majeure/urgente.",
    "- \"category\" doit être exactement l'une des étiquettes entre crochets ci-dessus.",
    "- \"highlight_index\" doit correspondre exactement au numéro d'un article de cette rubrique " +
      "dans la liste ci-dessus.",
    "- N'inclus pas de rubrique sans actu notable ce cycle-ci.",
    "- Si des articles proviennent d'une source dont le nom contient \"Provence\" (actu régionale " +
      "PACA/Aix-Marseille), inclus TOUJOURS une section pour cette actu régionale, même en " +
      "status='calme', même si l'actu globale du jour est plus importante — l'utilisateur veut " +
      "suivre son actu locale en plus du reste, ne la laisse jamais de côté."
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
  if (!parsed.status || !parsed.subject || !Array.isArray(parsed.sections)) {
    throw new Error("JSON Gemini incomplet");
  }
  return parsed as RawDigest;
}

export async function callGemini(prompt: string, items: NewsItem[]): Promise<Digest> {
  const raw = await callGeminiRaw(prompt);
  const validCategories = new Set<string>(CATEGORY_KEYS);

  const sections: DigestSection[] = raw.sections
    .filter((s) => s.summary && s.headline && validCategories.has(s.category))
    .map((s) => ({
      category: s.category as CategoryKey,
      headline: s.headline,
      summary: s.summary,
      highlight: items[s.highlight_index] ?? null,
    }));

  if (sections.length === 0) throw new Error("Gemini n'a produit aucune section valide");

  return { status: raw.status, subject: raw.subject, sections };
}

/** Filet de sécurité si Gemini échoue ou renvoie un JSON invalide : on affiche
 * quand même un digest basique plutôt que rien du tout. */
export function fallbackDigest(items: NewsItem[]): Digest {
  const byCategory = new Map<CategoryKey, NewsItem[]>();
  for (const item of items) {
    const list = byCategory.get(item.category) ?? [];
    list.push(item);
    byCategory.set(item.category, list);
  }

  const sections: DigestSection[] = Array.from(byCategory.entries()).map(([category, catItems]) => ({
    category,
    headline: FEEDS[category].label,
    summary: catItems
      .slice(0, 3)
      .map((i) => i.title)
      .join(" — "),
    highlight: catItems[0] ?? null,
  }));

  return {
    status: "normal",
    subject: `Veille info : ${items.length} article(s)`,
    sections,
  };
}
