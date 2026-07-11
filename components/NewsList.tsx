"use client";

import type { NewsItem } from "@/lib/rss";
import { ACCENT_CLASSES } from "@/lib/accent";
import { FEEDS } from "@/lib/feeds";
import { timeAgo } from "@/lib/time";

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

// Directions littérales pour que Tailwind les détecte (pas d'interpolation possible).
const GRADIENT_DIRECTIONS = [
  "bg-gradient-to-br",
  "bg-gradient-to-tr",
  "bg-gradient-to-bl",
  "bg-gradient-to-tl",
  "bg-gradient-to-r",
  "bg-gradient-to-b",
];

/** Placeholder utilisé quand aucune image (ni du flux, ni og:image) n'a été
 * trouvée. Varié de façon déterministe (à partir du lien) pour éviter que
 * toute une rubrique affiche exactement le même visuel. */
function Placeholder({ seed, emoji, gradient }: { seed: string; emoji: string; gradient: string }) {
  const h = hashString(seed);
  const direction = GRADIENT_DIRECTIONS[h % GRADIENT_DIRECTIONS.length];
  const rotation = (h % 41) - 20;
  const scale = 0.85 + ((h >> 4) % 30) / 100;
  const stripeAngle = ((h >> 8) % 4) * 45;

  return (
    <div
      className={`relative flex h-full w-full items-center justify-center overflow-hidden ${direction} ${gradient}`}
    >
      <div
        className="absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage: `repeating-linear-gradient(${stripeAngle}deg, #fff 0 2px, transparent 2px 16px)`,
        }}
      />
      <span
        className="relative text-5xl drop-shadow-md"
        style={{ transform: `rotate(${rotation}deg) scale(${scale})` }}
      >
        {emoji}
      </span>
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
      className={`animate-fade-in-up group grid overflow-hidden rounded-2xl border-2 shadow-sm transition-all hover:shadow-lg hover:-translate-y-0.5 sm:grid-cols-2 ${accent.border} ${accent.tint} ${accent.hoverBorder}`}
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
          <Placeholder seed={item.link} emoji={category.emoji} gradient={accent.gradient} />
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
      className={`animate-fade-in-up group flex gap-4 rounded-xl border-2 p-3 shadow-sm transition-all hover:shadow-lg hover:-translate-y-0.5 ${accent.border} ${accent.tint} ${accent.hoverBorder}`}
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
          <Placeholder seed={item.link} emoji={category.emoji} gradient={accent.gradient} />
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
