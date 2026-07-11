"use client";

import type { NewsItem } from "@/lib/rss";

function timeAgo(iso: string | null): string {
  if (!iso) return "";
  const diffMs = Date.now() - Date.parse(iso);
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.round(hours / 24);
  return `il y a ${days} j`;
}

export default function NewsList({ items }: { items: NewsItem[] }) {
  if (items.length === 0) {
    return <p className="text-gray-500 dark:text-gray-400 py-8 text-center">Rien à afficher pour l&apos;instant.</p>;
  }

  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {items.map((item) => (
        <li
          key={item.link}
          className="rounded-lg border border-gray-200 dark:border-gray-800 p-4 hover:border-gray-400 dark:hover:border-gray-600 transition-colors"
        >
          <a href={item.link} target="_blank" rel="noopener noreferrer" className="block">
            <p className="font-medium leading-snug">{item.title}</p>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {item.source}
              {item.publishedAt ? ` · ${timeAgo(item.publishedAt)}` : ""}
            </p>
          </a>
        </li>
      ))}
    </ul>
  );
}
