"""Agent de veille info : collecte des flux RSS, filtre/résume avec Gemini, envoie un email via Resend.

Conçu pour tourner toutes les heures (cron GitHub Actions en UTC) mais ne fait
réellement du travail (RSS + Gemini + Resend) qu'aux heures Paris souhaitées,
pour rester à coût zéro et gérer le changement d'heure automatiquement.
"""

import html
import json
import os
import re
import sys
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo

import feedparser
import requests
import yaml

PARIS_TZ = ZoneInfo("Europe/Paris")
ALLOWED_HOURS = {7, 9, 11, 13, 15, 17, 19, 21, 23}
LOOKBACK_HOURS = 2.5  # buffer au-delà de 2h pour ne rien rater entre deux runs
MAX_ITEMS_PER_TOPIC = 12  # cap par thème, pour qu'un thème prolifique (ex: football)
# n'écrase pas les thèmes plus rares (ex: catastrophes naturelles) dans le prompt Gemini

GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-2.0-flash")
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
RESEND_API_KEY = os.environ.get("RESEND_API_KEY")
DEST_EMAIL = os.environ.get("DEST_EMAIL")
RESEND_FROM = os.environ.get("RESEND_FROM", "onboarding@resend.dev")
FORCE_RUN = os.environ.get("FORCE_RUN") == "1"


def strip_html(text: str) -> str:
    text = re.sub(r"<[^>]+>", " ", text or "")
    text = html.unescape(text)
    return re.sub(r"\s+", " ", text).strip()


def entry_published(entry) -> datetime | None:
    for key in ("published_parsed", "updated_parsed"):
        value = getattr(entry, key, None)
        if value:
            return datetime(*value[:6], tzinfo=timezone.utc)
    return None


def load_feeds(path: str) -> dict:
    with open(path, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)


def collect_recent_items(feeds: dict, cutoff: datetime) -> list[dict]:
    items = []
    for topic, urls in feeds.items():
        topic_items = []
        for url in urls:
            try:
                parsed = feedparser.parse(url)
            except Exception as exc:  # flux cassé : on log et on continue
                print(f"[warn] échec parsing {url}: {exc}", file=sys.stderr)
                continue

            source = parsed.feed.get("title", url) if getattr(parsed, "feed", None) else url

            for entry in getattr(parsed, "entries", []):
                published = entry_published(entry)
                if published is None or published < cutoff:
                    continue
                topic_items.append(
                    {
                        "topic": topic,
                        "title": strip_html(entry.get("title", "")),
                        "link": entry.get("link", ""),
                        "summary": strip_html(entry.get("summary", ""))[:300],
                        "source": source,
                        "published": published.isoformat(),
                    }
                )
        topic_items.sort(key=lambda i: i["published"], reverse=True)
        items.extend(topic_items[:MAX_ITEMS_PER_TOPIC])
    return items


def build_prompt(items: list[dict]) -> str:
    lines = [
        "Tu es un assistant de veille qui prépare un email personnel pour un utilisateur "
        "intéressé par : basket, football, politique nationale et internationale, "
        "catastrophes naturelles, économie, tech.",
        "",
        "Voici les articles publiés dans les 2 dernières heures. Ignore le bruit, le "
        "clickbait et les doublons. Ne garde que ce qui est réellement notable.",
        "",
    ]
    for item in items:
        lines.append(
            f"- [{item['topic']}] {item['title']} ({item['source']}) — {item['summary']} — {item['link']}"
        )
    lines += [
        "",
        "Réponds UNIQUEMENT avec un JSON de la forme :",
        '{"status": "calme|normal|important", "subject": "...", "html_body": "..."}',
        "",
        "Règles :",
        "- status='calme' si rien de vraiment notable (subject et html_body très courts, 1-2 phrases).",
        "- status='normal' pour de l'actu intéressante mais pas urgente (résumé court par thème).",
        "- status='important' pour de l'actu majeure/urgente (résumé structuré par thème, plus complet, "
        "liens inclus dans le html_body).",
        "- html_body doit être du HTML simple et lisible dans un client mail (titres, listes).",
    ]
    return "\n".join(lines)


def call_gemini(prompt: str) -> dict:
    url = (
        f"https://generativelanguage.googleapis.com/v1beta/models/"
        f"{GEMINI_MODEL}:generateContent?key={GEMINI_API_KEY}"
    )
    body = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"responseMimeType": "application/json"},
    }
    resp = requests.post(url, json=body, timeout=60)
    resp.raise_for_status()
    data = resp.json()
    text = data["candidates"][0]["content"]["parts"][0]["text"]
    return json.loads(text)


def fallback_digest(items: list[dict]) -> dict:
    """Filet de sécurité si Gemini échoue ou renvoie un JSON invalide : on envoie
    quand même un digest basique plutôt que de ne rien envoyer."""
    by_topic: dict[str, list[dict]] = {}
    for item in items:
        by_topic.setdefault(item["topic"], []).append(item)

    parts = ["<p>(Résumé automatique brut — l'IA n'a pas pu générer le digest habituel.)</p>"]
    for topic, topic_items in by_topic.items():
        parts.append(f"<h3>{topic}</h3><ul>")
        for item in topic_items[:5]:
            parts.append(f"<li><a href='{item['link']}'>{item['title']}</a> ({item['source']})</li>")
        parts.append("</ul>")

    return {
        "status": "normal",
        "subject": f"Veille info : {len(items)} article(s)",
        "html_body": "".join(parts),
    }


STATUS_PREFIX = {"calme": "⚪", "normal": "🟡", "important": "🔴"}


def send_email(subject: str, html_body: str) -> None:
    resp = requests.post(
        "https://api.resend.com/emails",
        headers={"Authorization": f"Bearer {RESEND_API_KEY}"},
        json={"from": RESEND_FROM, "to": [DEST_EMAIL], "subject": subject, "html": html_body},
        timeout=30,
    )
    resp.raise_for_status()


def main() -> None:
    now_paris = datetime.now(PARIS_TZ)
    if not FORCE_RUN and now_paris.hour not in ALLOWED_HOURS:
        print(f"[info] hors créneau ({now_paris.hour}h Paris), on ne fait rien.")
        return

    for name in ("GEMINI_API_KEY", "RESEND_API_KEY", "DEST_EMAIL"):
        if not os.environ.get(name):
            print(f"[error] variable d'environnement manquante : {name}", file=sys.stderr)
            sys.exit(1)

    feeds = load_feeds(os.path.join(os.path.dirname(__file__), "feeds.yaml"))
    cutoff = datetime.now(timezone.utc) - timedelta(hours=LOOKBACK_HOURS)
    items = collect_recent_items(feeds, cutoff)

    if not items:
        send_email("⚪ Veille info : rien de notable", "<p>Rien de notable ces 2 dernières heures.</p>")
        print("[info] aucun article récent, email court envoyé.")
        return

    try:
        digest = call_gemini(build_prompt(items))
        assert {"status", "subject", "html_body"} <= digest.keys()
    except Exception as exc:
        print(f"[warn] échec Gemini ({exc}), utilisation du digest de secours.", file=sys.stderr)
        digest = fallback_digest(items)

    prefix = STATUS_PREFIX.get(digest.get("status"), "🟡")
    send_email(f"{prefix} {digest['subject']}", digest["html_body"])
    print(f"[info] email envoyé, status={digest.get('status')}, {len(items)} article(s).")


if __name__ == "__main__":
    main()
