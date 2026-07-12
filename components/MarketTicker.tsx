"use client";

import { useEffect, useState } from "react";
import type { IndexQuote } from "@/lib/stocks";

function formatPrice(price: number, currency: string): string {
  const formatted = price.toLocaleString("fr-FR", { maximumFractionDigits: 2 });
  return currency === "USD" ? `$${formatted}` : `${formatted} ${currency}`;
}

export default function MarketTicker() {
  const [quotes, setQuotes] = useState<IndexQuote[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/stocks")
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setQuotes(data.quotes || []);
      })
      .catch(() => {
        if (!cancelled) setQuotes([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (quotes === null) {
    return (
      <div className="mb-4 flex gap-3 overflow-x-auto">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-16 w-36 shrink-0 animate-pulse rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-neutral-900"
          />
        ))}
      </div>
    );
  }

  if (quotes.length === 0) return null;

  return (
    <div className="mb-4 flex gap-3 overflow-x-auto pb-1">
      {quotes.map((q) => {
        const up = q.change >= 0;
        return (
          <div
            key={q.label}
            className="flex shrink-0 flex-col rounded-xl border border-gray-200 bg-white px-4 py-2 dark:border-gray-800 dark:bg-neutral-900"
          >
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              {q.label}
            </span>
            <span className="font-serif text-lg font-medium text-gray-900 dark:text-gray-50">
              {formatPrice(q.price, q.currency)}
            </span>
            <span
              className={`text-xs font-medium ${up ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}
            >
              {up ? "▲" : "▼"} {Math.abs(q.changePercent).toFixed(2)}%
            </span>
          </div>
        );
      })}
    </div>
  );
}
