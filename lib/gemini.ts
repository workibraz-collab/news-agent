import type { NewsItem } from "./rss";
import { timeAgo } from "./time";

export interface Digest {
  status: "calme" | "normal" | "important";
  subject: string;
  html_body: string;
}

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-flash-latest";

export function buildPrompt(items: NewsItem[]): string {
  const lines = [
    "Tu es un assistant de veille qui prépare un résumé pour un utilisateur " +
      "intéressé par : basket, football, politique nationale et internationale, " +
      "catastrophes naturelles, économie, tech.",
    "",
    "Voici des articles récents. Ignore le bruit, le clickbait et les doublons. " +
      "Ne garde que ce qui est réellement notable.",
    "",
  ];
  for (const item of items) {
    const when = timeAgo(item.publishedAt);
    lines.push(
      `- [${item.category}] ${item.title} (${item.source}, ${when || "heure inconnue"}) — ${item.link}`
    );
  }
  lines.push(
    "",
    "Réponds UNIQUEMENT avec un JSON de la forme :",
    '{"status": "calme|normal|important", "subject": "...", "html_body": "..."}',
    "",
    "Règles :",
    "- status='calme' si rien de vraiment notable (subject et html_body très courts, 1-2 phrases).",
    "- status='normal' pour de l'actu intéressante mais pas urgente (résumé court par thème).",
    "- status='important' pour de l'actu majeure/urgente (résumé structuré par thème, plus complet, " +
      "liens inclus dans le html_body).",
    "- html_body doit être du HTML simple et lisible (titres, listes).",
    "- Pour chaque info mentionnée, indique quand elle a eu lieu de façon approximative " +
      "(ex: \"il y a 3h\", \"ce matin\", \"hier\") en te basant sur l'heure donnée entre parenthèses " +
      "à côté de chaque article ci-dessus — même approximatif, c'est mieux que rien.",
    "- Si des articles proviennent d'une source dont le nom contient \"Provence\" (actu régionale " +
      "PACA/Aix-Marseille), inclus TOUJOURS une section \"Actu régionale\" dédiée avec 2-3 de ces " +
      "infos, même en status='calme', même si elles sont mineures comparées à l'actu nationale/" +
      "internationale — l'utilisateur veut suivre son actu locale en plus du reste, ne les laisse " +
      "jamais de côté juste parce qu'il y a une actu globale plus importante ce jour-là."
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

export async function callGemini(prompt: string): Promise<Digest> {
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

  const parsed = parseFirstJsonObject(text) as Partial<Digest>;
  if (!parsed.status || !parsed.subject || !parsed.html_body) {
    throw new Error("JSON Gemini incomplet");
  }
  return parsed as Digest;
}

/** Filet de sécurité si Gemini échoue ou renvoie un JSON invalide : on affiche
 * quand même un digest basique plutôt que rien du tout. */
export function fallbackDigest(items: NewsItem[]): Digest {
  const byCategory = new Map<string, NewsItem[]>();
  for (const item of items) {
    const list = byCategory.get(item.category) ?? [];
    list.push(item);
    byCategory.set(item.category, list);
  }

  const parts = [
    "<p>(Résumé automatique brut — l'IA n'a pas pu générer le digest habituel.)</p>",
  ];
  for (const [category, catItems] of byCategory) {
    parts.push(`<h3>${category}</h3><ul>`);
    for (const item of catItems.slice(0, 5)) {
      parts.push(`<li><a href="${item.link}">${item.title}</a> (${item.source})</li>`);
    }
    parts.push("</ul>");
  }

  return {
    status: "normal",
    subject: `Veille info : ${items.length} article(s)`,
    html_body: parts.join(""),
  };
}
