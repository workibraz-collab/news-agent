export type CategoryKey =
  | "basket"
  | "football"
  | "politique_nationale"
  | "politique_internationale"
  | "catastrophes_naturelles"
  | "economie"
  | "tech"
  | "actu_generale_tf1";

export interface CategoryConfig {
  label: string;
  urls: string[];
}

// Port de feeds.yaml. Ajoute/retire des URLs librement : un flux cassé est
// ignoré (loggé) sans faire planter l'appel.
export const FEEDS: Record<CategoryKey, CategoryConfig> = {
  basket: {
    label: "Basket",
    urls: [
      "https://news.google.com/rss/search?q=NBA+OR+basketball&hl=fr&gl=FR&ceid=FR:fr",
    ],
  },
  football: {
    label: "Football",
    urls: [
      "https://news.google.com/rss/search?q=football+OR+%22Ligue+1%22+OR+%22Champions+League%22&hl=fr&gl=FR&ceid=FR:fr",
      "https://www.franceinfo.fr/sports/foot.rss",
    ],
  },
  politique_nationale: {
    label: "Politique (France)",
    urls: [
      "https://www.franceinfo.fr/politique.rss",
      "https://news.google.com/rss/search?q=politique+France&hl=fr&gl=FR&ceid=FR:fr",
    ],
  },
  politique_internationale: {
    label: "Politique internationale",
    urls: [
      "https://news.google.com/rss/search?q=g%C3%A9opolitique+OR+%22politique+internationale%22&hl=fr&gl=FR&ceid=FR:fr",
      "https://www.franceinfo.fr/monde.rss",
    ],
  },
  catastrophes_naturelles: {
    label: "Catastrophes naturelles",
    urls: [
      "https://news.google.com/rss/search?q=catastrophe+naturelle+OR+s%C3%A9isme+OR+ouragan+OR+inondation&hl=fr&gl=FR&ceid=FR:fr",
      "https://www.laprovence.com/rss/faits-divers.xml",
    ],
  },
  economie: {
    label: "Économie",
    urls: [
      "https://news.google.com/rss/search?q=%C3%A9conomie+France+OR+%C3%A9conomie+mondiale&hl=fr&gl=FR&ceid=FR:fr",
    ],
  },
  tech: {
    label: "Tech",
    urls: [
      "https://news.google.com/rss/search?q=intelligence+artificielle+OR+technologie&hl=fr&gl=FR&ceid=FR:fr",
    ],
  },
  actu_generale_tf1: {
    label: "Actu générale",
    urls: [
      // TF1 Info n'a pas de flux RSS d'articles officiel actif -> Google News filtré sur leur site.
      "https://news.google.com/rss/search?q=site:tf1info.fr&hl=fr&gl=FR&ceid=FR:fr",
    ],
  },
};

export const CATEGORY_KEYS = Object.keys(FEEDS) as CategoryKey[];
