# Veille info

Site Next.js consultable à la demande (basket, football, politique nationale/internationale,
catastrophes naturelles, économie, tech), avec un onglet Résumé qui agrège toutes les rubriques
via Gemini, et un bouton optionnel pour envoyer ce résumé par email via Resend. Hébergé
gratuitement sur Vercel.

## Setup local

```bash
npm install
```

Créer un fichier `.env.local` (jamais commité) avec :

```
GEMINI_API_KEY=...
RESEND_API_KEY=...
DEST_EMAIL=...
PEXELS_API_KEY=...
```

- **Gemini** : clé gratuite sur [Google AI Studio](https://aistudio.google.com/apikey).
- **Resend** : clé gratuite sur [resend.com](https://resend.com). En mode gratuit (sans domaine
  vérifié), Resend n'autorise l'envoi qu'à l'adresse email associée au compte Resend —
  `DEST_EMAIL` doit donc être cette adresse-là, sauf si un domaine est vérifié dans Resend
  (auquel cas on peut aussi changer `RESEND_FROM`).
- **Pexels** : clé gratuite sur [pexels.com/api](https://www.pexels.com/api/) — utilisée pour
  illustrer les articles qui n'ont aucune image récupérable (notamment les liens Google News).
  Optionnelle : sans elle, ces articles affichent juste un pictogramme coloré à la place.

```bash
npm run dev
```

Ouvrir http://localhost:3000.

## Déploiement (Vercel, gratuit)

1. Se connecter sur [vercel.com](https://vercel.com) via "Continue with GitHub" avec le compte
   propriétaire de ce repo.
2. "Import Project" → sélectionner ce repo. Vercel détecte Next.js automatiquement, aucune
   config de build à changer.
3. Dans les réglages du projet Vercel → **Environment Variables**, ajouter `GEMINI_API_KEY`,
   `RESEND_API_KEY`, `DEST_EMAIL`, `PEXELS_API_KEY` (mêmes valeurs que `.env.local`).
4. Déployer. Chaque push sur la branche par défaut redéploie automatiquement.

Sur mobile, ouvrir l'URL `*.vercel.app` puis "Ajouter à l'écran d'accueil" pour une icône
type application (manifest PWA déjà configuré).

## Structure

- `lib/feeds.ts` — flux RSS par rubrique (éditable librement, un flux cassé est ignoré sans
  faire planter l'appel)
- `lib/rss.ts` — récupération/dédoublonnage/équilibrage des articles par flux
- `lib/og-image.ts` — récupération de l'image réelle d'un article (og:image) quand le flux n'en fournit pas
- `lib/pexels.ts` — photo d'illustration thématique par rubrique en dernier recours (ex: liens Google News)
- `lib/stocks.ts` — indices boursiers en direct (CAC 40, Dow Jones, Nasdaq, S&P 500) via l'API
  "chart" non-officielle de Yahoo Finance, gratuite et sans clé (Twelve Data réserve les indices
  à son offre payante, testé et écarté pour cette raison)
- `lib/gemini.ts` — prompt, appel Gemini, parsing JSON robuste, digest de secours si échec
- `lib/resend.ts` — envoi d'email
- `app/api/news/[category]` — derniers articles d'une rubrique (pas de clé API, rapide)
- `app/api/stocks` — indices boursiers en direct (affichés sur la rubrique Marché boursier)
- `app/api/summary` — résumé global via Gemini, déclenché à la demande (pas automatique)
- `app/api/send-email` — envoie le résumé actuellement affiché
- `components/` — UI (onglets, liste d'articles, panneau résumé)

## Notes

- Le nom du modèle Gemini est configurable via `GEMINI_MODEL` (défaut `gemini-flash-latest`).
- Rien n'est automatique/planifié : les appels Gemini et Resend ne se déclenchent que sur
  action de l'utilisateur (bouton), ce qui garde l'usage largement dans les tiers gratuits.
