"use client";

import { useEffect, useState } from "react";
import type { CategoryKey } from "@/lib/feeds";
import type { NewsItem } from "@/lib/rss";
import NewsList from "./NewsList";
import MarketTicker from "./MarketTicker";

function Skeleton() {
  return (
    <div className="grid gap-4">
      <div className="grid animate-pulse gap-0 overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-neutral-900 sm:grid-cols-2">
        <div className="aspect-[16/9] bg-gray-200 dark:bg-gray-800 sm:aspect-auto" />
        <div className="flex flex-col justify-center gap-3 p-6">
          <div className="h-5 w-24 rounded-full bg-gray-200 dark:bg-gray-800" />
          <div className="h-6 w-full rounded bg-gray-200 dark:bg-gray-800" />
          <div className="h-6 w-2/3 rounded bg-gray-200 dark:bg-gray-800" />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex animate-pulse gap-4 rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-neutral-900"
          >
            <div className="h-20 w-20 shrink-0 rounded-lg bg-gray-200 dark:bg-gray-800" />
            <div className="flex flex-1 flex-col justify-center gap-2">
              <div className="h-4 w-full rounded bg-gray-200 dark:bg-gray-800" />
              <div className="h-4 w-3/4 rounded bg-gray-200 dark:bg-gray-800" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CategoryPane({ category }: { category: CategoryKey }) {
  const [items, setItems] = useState<NewsItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setItems(null);
    setError(null);

    fetch(`/api/news/${category}`)
      .then((res) => {
        if (!res.ok) throw new Error("Échec de chargement");
        return res.json();
      })
      .then((data) => {
        if (!cancelled) setItems(data.items);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Erreur inconnue");
      });

    return () => {
      cancelled = true;
    };
  }, [category]);

  const ticker = category === "marche_boursier" ? <MarketTicker /> : null;

  if (error)
    return (
      <>
        {ticker}
        <p className="py-16 text-center text-red-600 dark:text-red-400">{error}</p>
      </>
    );
  if (!items)
    return (
      <>
        {ticker}
        <Skeleton />
      </>
    );

  return (
    <>
      {ticker}
      <NewsList items={items} />
    </>
  );
}
