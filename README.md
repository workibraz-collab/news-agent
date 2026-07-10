# News Digest

Agent gratuit qui surveille des flux RSS (basket, football, politique nationale/internationale,
catastrophes naturelles, économie, tech) toutes les 2h entre 7h et 23h (heure de Paris),
résume avec Gemini, et envoie un email court ou détaillé selon l'importance.

## Setup (une seule fois)

1. **Clé Gemini (gratuite)** : créer une clé sur [Google AI Studio](https://aistudio.google.com/apikey).
2. **Clé Resend (gratuite)** : créer un compte sur [resend.com](https://resend.com), récupérer une clé API
   dans les paramètres. Par défaut le script envoie depuis `onboarding@resend.dev` (domaine de test Resend,
   fonctionne sans configuration DNS). Si Resend refuse pour ton compte, remplace via la variable
   `RESEND_FROM` par un email d'un domaine que tu as vérifié dans Resend.
3. Dans le repo GitHub → **Settings → Secrets and variables → Actions**, ajouter :
   - `GEMINI_API_KEY`
   - `RESEND_API_KEY`
   - `DEST_EMAIL` (l'adresse qui doit recevoir les digests)

## Tester en local avant de compter sur le cron

```bash
pip install -r requirements.txt
export GEMINI_API_KEY=...
export RESEND_API_KEY=...
export DEST_EMAIL=toi@example.com
export FORCE_RUN=1   # ignore le créneau horaire pour tester à n'importe quelle heure
python main.py
```

## Tester le workflow GitHub Actions

Une fois les secrets ajoutés et le code poussé :

```bash
gh workflow run digest.yml -f force_run=true
```

Puis vérifier les logs (`gh run watch`) et la réception de l'email.

## Ajuster les sources

Tout se configure dans [`feeds.yaml`](feeds.yaml) : ajoute/retire des flux RSS par thème.
Un flux cassé est ignoré (loggé) sans faire planter le run.

## Notes

- Le workflow tourne toutes les heures en UTC, mais `main.py` ne fait du travail (RSS + Gemini + email)
  qu'aux heures Paris souhaitées (7h, 9h, ... 23h) — ça gère le changement d'heure automatiquement et
  garde le coût à zéro le reste du temps.
- Si aucun article récent n'est trouvé, un email très court est envoyé sans appeler Gemini (économie de quota).
- Si l'appel Gemini échoue ou renvoie un JSON invalide, un digest de secours basique est envoyé plutôt
  que rien du tout.
- Le nom du modèle Gemini est configurable via `GEMINI_MODEL` (défaut `gemini-2.0-flash`) si Google
  change les noms de modèles disponibles.
