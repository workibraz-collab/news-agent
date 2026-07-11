"use client";

import type { NewsItem } from "@/lib/rss";
import { ACCENT_CLASSES } from "@/lib/accent";
import { FEEDS } from "@/lib/feeds";
import { timeAgo } from "@/lib/time";

function Placeholder({ emoji, gradient }: { emoji: string; gradient: string }) {
  return (
    <div
      className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${gradient} text-5xl`}
    >
      {emoji}
    </div>
  );
}

function HeroCard({ item }: { item: NewsItem }) {
  const category = FEEDS[item.category];
  const accent = ACCENT_CLASSES[category.accent];

  return (
    <a
      href={item.link}
      target="_blank"
      rel="noopener noreferrer"
      className="animate-fade-in-up group grid overflow-hidden rounded-2xl border bg-white shadow-sm transition-shadow hover:shadow-md dark:bg-neutral-900 sm:grid-cols-2 border-gray-200 dark:border-gray-800"
    >
      <div className="aspect-[16/9] sm:aspect-auto sm:h-full">
        {item.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.image}
            alt=""
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <Placeholder emoji={category.emoji} gradient={accent.gradient} />
        )}
      </div>
      <div className="flex flex-col justify-center gap-3 p-6">
        <span className={`w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${accent.badge}`}>
          {category.emoji} {category.label}
        </span>
        <h2 className="font-serif text-2xl font-medium leading-tight text-gray-900 dark:text-gray-50">
          {item.title}
        </h2>
        {item.excerpt && (
          <p className="line-clamp-2 text-sm text-gray-600 dark:text-gray-400">{item.excerpt}</p>
        )}
        <p className="text-xs text-gray-500 dark:text-gray-500">
          {item.source}
          {item.publishedAt ? ` · ${timeAgo(item.publishedAt)}` : ""}
        </p>
      </div>
    </a>
  );
}

function Card({ item, delayMs }: { item: NewsItem; delayMs: number }) {
  const category = FEEDS[item.category];
  const accent = ACCENT_CLASSES[category.accent];

  return (
    <a
      href={item.link}
      target="_blank"
      rel="noopener noreferrer"
      style={{ animationDelay: `${delayMs}ms` }}
      className={`animate-fade-in-up group flex gap-4 rounded-xl border bg-white p-3 shadow-sm transition-shadow hover:shadow-md dark:bg-neutral-900 ${accent.border}`}
    >
      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg">
        {item.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.image}
            alt=""
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.05]"
          />
        ) : (
          <Placeholder emoji={category.emoji} gradient={accent.gradient} />
        )}
      </div>
      <div className="flex min-w-0 flex-col justify-center gap-1">
        <p className="line-clamp-2 font-serif text-base font-medium leading-snug text-gray-900 dark:text-gray-50">
          {item.title}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-500">
          {item.source}
          {item.publishedAt ? ` · ${timeAgo(item.publishedAt)}` : ""}
        </p>
      </div>
    </a>
  );
}

export default function NewsList({ items }: { items: NewsItem[] }) {
  if (items.length === 0) {
    return (
      <p className="py-16 text-center text-gray-500 dark:text-gray-400">
        Rien à afficher pour l&apos;instant.
      </p>
    );
  }

  const [hero, ...rest] = items;

  return (
    <div className="grid gap-4">
      <HeroCard item={hero} />
      <div className="grid gap-3 sm:grid-cols-2">
        {rest.map((item, i) => (
          <Card key={item.link} item={item} delayMs={Math.min(i * 40, 400)} />
        ))}
      </div>
    </div>
  );
}
