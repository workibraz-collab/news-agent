"use client";

import { useEffect, useState } from "react";
import type { CategoryKey } from "@/lib/feeds";
import type { NewsItem } from "@/lib/rss";
import NewsList from "./NewsList";

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

  if (error) return <p className="text-red-600 dark:text-red-400 py-8 text-center">{error}</p>;
  if (!items) return <p className="text-gray-500 dark:text-gray-400 py-8 text-center">Chargement…</p>;

  return <NewsList items={items} />;
}
