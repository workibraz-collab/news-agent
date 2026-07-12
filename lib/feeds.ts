export type CategoryKey =
  | "basket"
  | "football"
  | "politique_nationale"
  | "politique_internationale"
  | "catastrophes_naturelles"
  | "economie"
  | "marche_boursier"
  | "tech"
  | "actu_generale_tf1";

export interface CategoryConfig {
  label: string;
  urls: string[];
  emoji: string;
  /** Couleur d'accent Tailwind (ex: "orange"), utilisée pour badges/bordures. */
  accent: string;
}

// Port de feeds.yaml. Ajoute/retire des URLs librement : un flux cassé est
// ignoré (loggé) sans faire planter l'appel.
export const FEEDS: Record<CategoryKey, CategoryConfig> = {
  basket: {
    label: "Basket",
    emoji: "🏀",
    accent: "orange",
    urls: [
      "https://news.google.com/rss/search?q=NBA+OR+basketball&hl=fr&gl=FR&ceid=FR:fr",
    ],
  },
  football: {
    label: "Football",
    emoji: "⚽",
    accent: "emerald",
    urls: [
      "https://news.google.com/rss/search?q=football+OR+%22Ligue+1%22+OR+%22Champions+League%22&hl=fr&gl=FR&ceid=FR:fr",
      "https://www.franceinfo.fr/sports/foot.rss",
    ],
  },
  politique_nationale: {
    label: "Politique (France)",
    emoji: "🏛️",
    accent: "blue",
    urls: [
      "https://www.franceinfo.fr/politique.rss",
      "https://news.google.com/rss/search?q=politique+France&hl=fr&gl=FR&ceid=FR:fr",
    ],
  },
  politique_internationale: {
    label: "Politique internationale",
    emoji: "🌍",
    accent: "indigo",
    urls: [
      "https://news.google.com/rss/search?q=g%C3%A9opolitique+OR+%22politique+internationale%22&hl=fr&gl=FR&ceid=FR:fr",
      "https://www.franceinfo.fr/monde.rss",
    ],
  },
  catastrophes_naturelles: {
    label: "Catastrophes naturelles",
    emoji: "🌪️",
    accent: "red",
    urls: [
      "https://news.google.com/rss/search?q=catastrophe+naturelle+OR+s%C3%A9isme+OR+ouragan+OR+inondation&hl=fr&gl=FR&ceid=FR:fr",
      "https://www.laprovence.com/rss/faits-divers.xml",
    ],
  },
  economie: {
    label: "Économie",
    emoji: "📈",
    accent: "teal",
    urls: [
      "https://news.google.com/rss/search?q=%C3%A9conomie+France+OR+%C3%A9conomie+mondiale&hl=fr&gl=FR&ceid=FR:fr",
    ],
  },
  marche_boursier: {
    label: "Marché boursier",
    emoji: "💹",
    accent: "amber",
    urls: [
      "https://news.google.com/rss/search?q=bourse+OR+%22CAC+40%22+OR+%22Wall+Street%22+OR+march%C3%A9s+financiers&hl=fr&gl=FR&ceid=FR:fr",
    ],
  },
  tech: {
    label: "Tech",
    emoji: "💡",
    accent: "purple",
    urls: [
      "https://news.google.com/rss/search?q=intelligence+artificielle+OR+technologie&hl=fr&gl=FR&ceid=FR:fr",
    ],
  },
  actu_generale_tf1: {
    label: "Actu générale",
    emoji: "📰",
    accent: "gray",
    urls: [
      // TF1 Info n'a pas de flux RSS d'articles officiel actif -> Google News filtré sur leur site.
      "https://news.google.com/rss/search?q=site:tf1info.fr&hl=fr&gl=FR&ceid=FR:fr",
    ],
  },
};

export const CATEGORY_KEYS = Object.keys(FEEDS) as CategoryKey[];
