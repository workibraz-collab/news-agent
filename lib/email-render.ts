import { FEEDS } from "./feeds";
import type { Digest, DigestItem } from "./gemini";
import { timeAgo } from "./time";

// Les clients mail ne supportent ni les classes Tailwind ni les polices
// Google Fonts custom : couleurs en hexadécimal et Georgia comme substitut
// serif proche de la police éditoriale utilisée sur le site.
const ACCENT_HEX: Record<string, string> = {
  orange: "#ea580c",
  emerald: "#059669",
  blue: "#2563eb",
  indigo: "#4f46e5",
  red: "#dc2626",
  teal: "#0d9488",
  purple: "#9333ea",
  amber: "#d97706",
  gray: "#4b5563",
};

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function kickerHtml(item: DigestItem): string {
  const category = FEEDS[item.category];
  const color = ACCENT_HEX[category.accent] || "#4b5563";
  return `<p style="margin:0 0 4px 0;font-family:Arial,sans-serif;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:${color};">${category.emoji} ${escapeHtml(category.label)}</p>`;
}

function briefHtml(item: DigestItem): string {
  return `<div style="margin-bottom:22px;">
    ${kickerHtml(item)}
    <a href="${item.link}" style="text-decoration:none;color:#111111;">
      <h3 style="margin:0 0 6px 0;font-family:Georgia,'Times New Roman',serif;font-size:17px;font-weight:600;line-height:1.3;">${escapeHtml(item.title)}</h3>
    </a>
    <p style="margin:0 0 6px 0;font-family:Arial,sans-serif;font-size:13px;line-height:1.5;color:#333333;">${escapeHtml(item.blurb)}</p>
    <p style="margin:0;font-family:Arial,sans-serif;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:#888888;">${escapeHtml(item.source)} · ${timeAgo(item.publishedAt)}</p>
  </div>`;
}

/** Construit le HTML de l'email à partir du digest structuré, dans le même
 * esprit "une de journal" que le site (manchette, article vedette, colonnes)
 * mais avec des techniques compatibles email (styles inline, mise en page en
 * table plutôt que CSS columns, police web-safe). */
export function renderDigestEmailHtml(digest: Digest): string {
  if (digest.sections.length === 0) {
    return `<p style="font-family:Arial,sans-serif;">Rien de notable ces dernières 24 heures.</p>`;
  }

  const allItems = digest.sections.flatMap((s) => s.items);
  const [lead, ...rest] = allItems;
  const today = new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const leadHtml = lead
    ? `<div style="border-bottom:3px double #111111;padding-bottom:18px;margin-bottom:20px;">
        ${kickerHtml(lead)}
        <a href="${lead.link}" style="text-decoration:none;color:#111111;">
          <h1 style="margin:0 0 10px 0;font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:700;line-height:1.15;">${escapeHtml(lead.title)}</h1>
        </a>
        <p style="margin:0 0 8px 0;font-family:Arial,sans-serif;font-size:14px;line-height:1.6;color:#333333;">${escapeHtml(lead.blurb)}</p>
        <p style="margin:0;font-family:Arial,sans-serif;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:#888888;">${escapeHtml(lead.source)} · ${timeAgo(lead.publishedAt)}</p>
      </div>`
    : "";

  // Table 2 colonnes pour approcher la mise en page en colonnes du site :
  // les CSS columns ne sont pas fiables dans les clients mail, les tables si.
  const rows: string[] = [];
  for (let i = 0; i < rest.length; i += 2) {
    const left = briefHtml(rest[i]);
    const right = rest[i + 1] ? briefHtml(rest[i + 1]) : "";
    rows.push(`<tr>
      <td style="width:50%;vertical-align:top;padding-right:20px;">${left}</td>
      <td style="width:50%;vertical-align:top;padding-left:20px;border-left:1px solid #dddddd;">${right}</td>
    </tr>`);
  }

  return `<div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;">
    <p style="margin:0 0 4px 0;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#888888;">Édition du ${today}</p>
    <h2 style="margin:0 0 16px 0;font-family:Georgia,'Times New Roman',serif;font-style:italic;font-size:20px;font-weight:600;color:#111111;">${escapeHtml(digest.subject)}</h2>
    ${leadHtml}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
      ${rows.join("")}
    </table>
  </div>`;
}
