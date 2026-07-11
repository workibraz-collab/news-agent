"use client";

import { useState } from "react";
import type { Digest, DigestStatus } from "@/lib/gemini";
import { FEEDS } from "@/lib/feeds";
import { ACCENT_CLASSES } from "@/lib/accent";
import { timeAgo } from "@/lib/time";

const STATUS_STYLE: Record<DigestStatus, string> = {
  calme: "bg-gray-50 border-gray-200 text-gray-700 dark:bg-gray-900 dark:border-gray-800 dark:text-gray-300",
  normal:
    "bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-950/40 dark:border-amber-900 dark:text-amber-300",
  important:
    "bg-red-50 border-red-200 text-red-900 dark:bg-red-950/40 dark:border-red-900 dark:text-red-300",
};

const STATUS_LABEL: Record<DigestStatus, string> = {
  calme: "Calme",
  normal: "À suivre",
  important: "Important",
};

const STATUS_ICON: Record<DigestStatus, string> = {
  calme: "🌤️",
  normal: "📌",
  important: "🚨",
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
        Basket, foot, politique, économie, catastrophes naturelles, tech — l&apos;essentiel des
        dernières 24h, trié et expliqué.
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

  return (
    <div className="animate-fade-in-up mx-auto max-w-2xl">
      <div className={`flex items-center gap-3 rounded-2xl border p-4 ${STATUS_STYLE[digest.status]}`}>
        <span className="text-2xl">{STATUS_ICON[digest.status]}</span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide opacity-80">
            {STATUS_LABEL[digest.status]}
          </p>
          <h2 className="font-serif text-lg font-medium leading-snug">{digest.subject}</h2>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-8">
        {digest.sections.map((section) => {
          const category = FEEDS[section.category];
          const accent = ACCENT_CLASSES[category.accent];
          return (
            <div key={section.category}>
              <h3 className="mb-3 flex items-center gap-2 font-serif text-xl font-medium text-gray-900 dark:text-gray-50">
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-base ${accent.badge}`}
                >
                  {category.emoji}
                </span>
                {category.label}
              </h3>
              <div className="grid gap-3">
                {section.items.map((item) => (
                  <a
                    key={item.link}
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`group flex gap-4 rounded-xl border bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:bg-neutral-900 ${accent.border}`}
                  >
                    {item.image && (
                      <div className="hidden h-16 w-16 shrink-0 overflow-hidden rounded-lg sm:block">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.image}
                          alt=""
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.05]"
                        />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-medium leading-snug text-gray-900 dark:text-gray-50">
                        {item.title}
                      </p>
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{item.blurb}</p>
                      <p className="mt-2 text-xs text-gray-500 dark:text-gray-500">
                        {item.source} · {timeAgo(item.publishedAt)}
                      </p>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-3">
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
