"use client";

import { useState } from "react";
import { sanitizeHtml } from "@/lib/sanitize";
import type { Digest } from "@/lib/gemini";

const STATUS_STYLE: Record<Digest["status"], string> = {
  calme: "bg-gray-50 border-gray-200 text-gray-700 dark:bg-gray-900 dark:border-gray-800 dark:text-gray-300",
  normal:
    "bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-950/40 dark:border-amber-900 dark:text-amber-300",
  important:
    "bg-red-50 border-red-200 text-red-900 dark:bg-red-950/40 dark:border-red-900 dark:text-red-300",
};

const STATUS_LABEL: Record<Digest["status"], string> = {
  calme: "Calme",
  normal: "À suivre",
  important: "Important",
};

const STATUS_ICON: Record<Digest["status"], string> = {
  calme: "🌤️",
  normal: "📌",
  important: "🚨",
};

export default function SummaryPanel() {
  const [digest, setDigest] = useState<Digest | null>(null);
  const [loading, setLoading] = useState(false);
  const [emailState, setEmailState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

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
    try {
      const res = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(digest),
      });
      if (!res.ok) throw new Error();
      setEmailState("sent");
    } catch {
      setEmailState("error");
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      {!digest && (
        <div className="animate-fade-in-up rounded-2xl border border-dashed border-gray-300 p-10 text-center dark:border-gray-700">
          <p className="mb-4 text-4xl">✨</p>
          <p className="mb-5 text-gray-600 dark:text-gray-400">
            Génère un résumé de toute l&apos;actualité récente, toutes rubriques confondues.
          </p>
          <button
            onClick={generateSummary}
            disabled={loading}
            className="rounded-full bg-gray-900 px-5 py-2.5 font-medium text-white shadow-sm transition-transform hover:scale-[1.02] disabled:opacity-50 dark:bg-white dark:text-black"
          >
            {loading ? "Génération en cours…" : "Générer le résumé"}
          </button>
        </div>
      )}

      {error && <p className="mt-4 text-red-600 dark:text-red-400">{error}</p>}

      {digest && (
        <div className="animate-fade-in-up">
          <div className={`flex items-center gap-3 rounded-xl border p-4 ${STATUS_STYLE[digest.status]}`}>
            <span className="text-2xl">{STATUS_ICON[digest.status]}</span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide opacity-80">
                {STATUS_LABEL[digest.status]}
              </p>
              <h2 className="font-serif text-lg font-medium leading-snug">{digest.subject}</h2>
            </div>
          </div>

          <div
            className="prose prose-sm dark:prose-invert mt-6 max-w-none prose-headings:font-serif prose-a:text-blue-600 dark:prose-a:text-blue-400"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(digest.html_body) }}
          />

          <div className="mt-6 flex items-center gap-3">
            <button
              onClick={generateSummary}
              disabled={loading}
              className="rounded-full border border-gray-300 px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:hover:bg-gray-900"
            >
              {loading ? "Génération…" : "Régénérer"}
            </button>
            <button
              onClick={sendEmail}
              disabled={emailState === "sending"}
              className="rounded-full bg-gray-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition-transform hover:scale-[1.02] disabled:opacity-50 dark:bg-white dark:text-black"
            >
              {emailState === "sending" ? "Envoi…" : "Envoyer par email"}
            </button>
            {emailState === "sent" && (
              <span className="text-sm text-green-600 dark:text-green-400">✓ Envoyé</span>
            )}
            {emailState === "error" && (
              <span className="text-sm text-red-600 dark:text-red-400">Échec de l&apos;envoi</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
