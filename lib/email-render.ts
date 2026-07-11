import { FEEDS } from "./feeds";
import type { Digest } from "./gemini";
import { timeAgo } from "./time";

/** Construit le HTML de l'email à partir du digest structuré (les clients mail
 * n'exécutent pas de composants React, donc on génère une chaîne HTML simple). */
export function renderDigestEmailHtml(digest: Digest): string {
  if (digest.sections.length === 0) {
    return "<p>Rien de notable ces dernières 24 heures.</p>";
  }

  const parts: string[] = [];
  for (const section of digest.sections) {
    const category = FEEDS[section.category];
    parts.push(
      `<h3>${category.emoji} ${category.label}</h3><ul style="padding-left:20px;">`
    );
    for (const item of section.items) {
      parts.push(
        `<li style="margin-bottom:10px;">` +
          `<a href="${item.link}"><strong>${item.title}</strong></a><br/>` +
          `<span>${item.blurb}</span><br/>` +
          `<small style="color:#666;">${item.source} · ${timeAgo(item.publishedAt)}</small>` +
          `</li>`
      );
    }
    parts.push("</ul>");
  }
  return parts.join("");
}
