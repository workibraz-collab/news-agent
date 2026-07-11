"use client";

import { useState } from "react";
import { sanitizeHtml } from "@/lib/sanitize";
import type { Digest } from "@/lib/gemini";

const STATUS_STYLE: Record<Digest["status"], string> = {
  calme: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  normal: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  important: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
};

const STATUS_LABEL: Record<Digest["status"], string> = {
  calme: "Calme",
  normal: "Normal",
  important: "Important",
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
    <div className="max-w-2xl mx-auto">
      <button
        onClick={generateSummary}
        disabled={loading}
        className="rounded-md bg-black text-white dark:bg-white dark:text-black px-4 py-2 font-medium disabled:opacity-50"
      >
        {loading ? "Génération en cours…" : digest ? "Régénérer le résumé" : "Générer le résumé"}
      </button>

      {error && <p className="mt-4 text-red-600 dark:text-red-400">{error}</p>}

      {digest && (
        <div className="mt-6">
          <div className="flex items-center gap-3 mb-3">
            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${STATUS_STYLE[digest.status]}`}>
              {STATUS_LABEL[digest.status]}
            </span>
            <h2 className="font-semibold">{digest.subject}</h2>
          </div>

          <div
            className="prose prose-sm dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(digest.html_body) }}
          />

          <button
            onClick={sendEmail}
            disabled={emailState === "sending"}
            className="mt-6 rounded-md border border-gray-300 dark:border-gray-700 px-4 py-2 font-medium disabled:opacity-50"
          >
            {emailState === "sending" ? "Envoi…" : "Envoyer par email"}
          </button>
          {emailState === "sent" && (
            <p className="mt-2 text-green-600 dark:text-green-400">Email envoyé.</p>
          )}
          {emailState === "error" && (
            <p className="mt-2 text-red-600 dark:text-red-400">Échec de l&apos;envoi.</p>
          )}
        </div>
      )}
    </div>
  );
}
