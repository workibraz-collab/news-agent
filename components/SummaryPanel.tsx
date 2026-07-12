"use client";

import { useState } from "react";
import type { Digest, DigestItem, DigestStatus } from "@/lib/gemini";
import { FEEDS } from "@/lib/feeds";
import { ACCENT_CLASSES } from "@/lib/accent";
import { timeAgo } from "@/lib/time";

const STATUS_LABEL: Record<DigestStatus, string> = {
  calme: "Calme",
  normal: "À suivre",
  important: "Édition spéciale",
};

const STATUS_STAMP: Record<DigestStatus, string> = {
  calme: "border-gray-400 text-gray-500 dark:border-gray-600 dark:text-gray-400",
  normal: "border-amber-500 text-amber-600 dark:border-amber-500 dark:text-amber-400",
  important: "border-red-600 text-red-600 dark:border-red-500 dark:text-red-400",
};

const REMEMBERED_EMAILS = ["workibraz@gmail.com", "massiesaie@gmail.com"];

function EmptyState({ loading, onGenerate }: { loading: boolean; onGenerate: () => void }) {
  return (
    <div className="animate-fade-in-up relative overflow-hidden rounded-3xl border border-gray-200 bg-gradient-to-br from-white via-amber-50/40 to-rose-50/40 p-12 text-center shadow-sm dark:border-gray-800 dark:from-neutral-900 dark:via-neutral-900 dark:to-neutral-900">
      <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gradient-to-br from-orange-300/30 to-rose-300/30 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-gradient-to-br from-blue-300/30 to-purple-300/30 blur-2xl" />
      <p className="mb-4 text-5xl">✨</p>
      <h2 className="font-serif text-2xl font-medium text-gray-900 dark:text-gray-50">
        Ton édition du jour t&apos;attend
      </h2>
      <p className="mx-auto mt-2 mb-6 max-w-sm text-gray-600 dark:text-gray-400">
        Basket, foot, politique, économie, marché boursier, catastrophes naturelles, tech —
        l&apos;essentiel des dernières 24h, trié et expliqué.
      </p>
      <button
        onClick={onGenerate}
        disabled={loading}
        className="rounded-full bg-gray-900 px-6 py-3 font-medium text-white shadow-md transition-transform hover:scale-[1.03] disabled:opacity-50 dark:bg-white dark:text-black"
      >
        {loading ? "Génération en cours…" : "Générer le résumé"}
      </button>
    </div>
  );
}

function Kicker({ item }: { item: DigestItem }) {
  const category = FEEDS[item.category];
  const accent = ACCENT_CLASSES[category.accent];
  return (
    <p className={`mb-1.5 text-[11px] font-semibold uppercase tracking-widest ${accent.text}`}>
      {category.emoji} {category.label}
    </p>
  );
}

function LeadStory({ item }: { item: DigestItem }) {
  return (
    <div className="animate-fade-in-up border-b-2 border-gray-900 pb-6 dark:border-gray-100">
      <Kicker item={item} />
      <a href={item.link} target="_blank" rel="noopener noreferrer" className="group">
        <h2 className="font-serif text-4xl font-semibold leading-[1.05] text-gray-900 group-hover:underline dark:text-gray-50 sm:text-5xl">
          {item.title}
        </h2>
      </a>
      <p className="drop-cap mt-3 max-w-3xl text-[15px] leading-relaxed text-gray-800 dark:text-gray-300">
        {item.blurb}
      </p>
      <p className="mt-2 text-xs uppercase tracking-wide text-gray-500 dark:text-gray-500">
        {item.source} · {timeAgo(item.publishedAt)}
      </p>
    </div>
  );
}

function Brief({ item, delayMs }: { item: DigestItem; delayMs: number }) {
  return (
    <div className="animate-fade-in-up" style={{ animationDelay: `${delayMs}ms` }}>
      <Kicker item={item} />
      <a href={item.link} target="_blank" rel="noopener noreferrer">
        <h3 className="font-serif text-lg font-semibold leading-snug text-gray-900 hover:underline dark:text-gray-50">
          {item.title}
        </h3>
      </a>
      <p className="mt-1.5 text-sm leading-relaxed text-gray-700 dark:text-gray-300">{item.blurb}</p>
      <p className="mt-1.5 text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-500">
        {item.source} · {timeAgo(item.publishedAt)}
      </p>
    </div>
  );
}

export default function SummaryPanel() {
  const [digest, setDigest] = useState<Digest | null>(null);
  const [loading, setLoading] = useState(false);
  const [emailState, setEmailState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [to, setTo] = useState(REMEMBERED_EMAILS[0]);

  async function generateSummary() {
    setLoading(true);
    setError(null);
    setEmailState("idle");
    try {
      const res = await fetch("/api/summary");
      if (!res.ok) throw new Error("Échec de génération du résumé");
      const data: Digest = await res.json();
      setDigest(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }

  async function sendEmail() {
    if (!digest) return;
    setEmailState("sending");
    setEmailError(null);
    try {
      const res = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...digest, to }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Échec de l'envoi");
      setEmailState("sent");
    } catch (err) {
      setEmailError(err instanceof Error ? err.message : "Échec de l'envoi");
      setEmailState("error");
    }
  }

  if (!digest) {
    return (
      <div className="mx-auto max-w-2xl">
        <EmptyState loading={loading} onGenerate={generateSummary} />
        {error && <p className="mt-4 text-center text-red-600 dark:text-red-400">{error}</p>}
      </div>
    );
  }

  const allItems = digest.sections.flatMap((s) => s.items);
  const [lead, ...rest] = allItems;
  const today = new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="animate-fade-in-up mx-auto max-w-5xl">
      {/* Manchette */}
      <div className="mb-4 flex items-end justify-between border-b-4 border-double border-gray-900 pb-2 dark:border-gray-100">
        <div>
          <p className="text-[11px] uppercase tracking-widest text-gray-500 dark:text-gray-500">
            Édition du {today}
          </p>
          <h1 className="font-serif text-2xl font-semibold italic text-gray-900 dark:text-gray-50">
            {digest.subject}
          </h1>
        </div>
        <span
          className={`shrink-0 -rotate-3 rounded border-2 px-2 py-1 text-[10px] font-bold uppercase tracking-widest ${STATUS_STAMP[digest.status]}`}
        >
          {STATUS_LABEL[digest.status]}
        </span>
      </div>

      {lead && <LeadStory item={lead} />}

      <div
        className="newspaper-columns mt-6"
        style={{ columnWidth: "260px", columnGap: "2.5rem" }}
      >
        {rest.map((item, i) => (
          <Brief key={item.link} item={item} delayMs={Math.min(i * 40, 400)} />
        ))}
      </div>

      <div className="mt-10 flex flex-wrap items-center gap-3 border-t border-gray-200 pt-6 dark:border-gray-800">
        <button
          onClick={generateSummary}
          disabled={loading}
          className="rounded-full border border-gray-300 px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:hover:bg-gray-900"
        >
          {loading ? "Génération…" : "Régénérer"}
        </button>

        <select
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="rounded-full border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-neutral-900"
        >
          {REMEMBERED_EMAILS.map((email) => (
            <option key={email} value={email}>
              {email}
            </option>
          ))}
        </select>

        <button
          onClick={sendEmail}
          disabled={emailState === "sending"}
          className="rounded-full bg-gray-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition-transform hover:scale-[1.02] disabled:opacity-50 dark:bg-white dark:text-black"
        >
          {emailState === "sending" ? "Envoi…" : "Envoyer par email"}
        </button>
        {emailState === "sent" && (
          <span className="text-sm text-green-600 dark:text-green-400">✓ Envoyé à {to}</span>
        )}
      </div>
      {to !== "workibraz@gmail.com" && (
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-500">
          Resend (compte gratuit) n&apos;autorise l&apos;envoi qu&apos;à workibraz@gmail.com tant
          qu&apos;aucun domaine n&apos;est vérifié — l&apos;envoi vers cette adresse échouera probablement.
        </p>
      )}
      {emailState === "error" && emailError && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">{emailError}</p>
      )}
    </div>
  );
}
