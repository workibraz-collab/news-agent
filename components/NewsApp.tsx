"use client";

import { useState } from "react";
import { CATEGORY_KEYS, FEEDS, type CategoryKey } from "@/lib/feeds";
import Tabs, { type TabDef } from "./Tabs";
import CategoryPane from "./CategoryPane";
import SummaryPanel from "./SummaryPanel";

type TabKey = CategoryKey | "summary";

const TABS: TabDef[] = [
  { key: "summary", label: "Résumé", emoji: "✨", accent: "gray" },
  ...CATEGORY_KEYS.map((key) => ({
    key,
    label: FEEDS[key].label,
    emoji: FEEDS[key].emoji,
    accent: FEEDS[key].accent,
  })),
];

export default function NewsApp() {
  const [active, setActive] = useState<TabKey>("summary");
  const [visited, setVisited] = useState<Set<TabKey>>(new Set(["summary"]));

  function handleChange(key: string) {
    const tabKey = key as TabKey;
    setActive(tabKey);
    setVisited((prev) => new Set(prev).add(tabKey));
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <header className="mb-6">
        <h1 className="font-serif text-3xl font-semibold italic tracking-tight text-gray-900 dark:text-gray-50">
          Veille info
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Ton édition du jour, à la demande.
        </p>
      </header>

      <Tabs tabs={TABS} active={active} onChange={handleChange} />

      <div className="mt-6">
        {visited.has("summary") && (
          <div className={active === "summary" ? "" : "hidden"}>
            <SummaryPanel />
          </div>
        )}
        {CATEGORY_KEYS.filter((key) => visited.has(key)).map((key) => (
          <div key={key} className={active === key ? "" : "hidden"}>
            <CategoryPane category={key} />
          </div>
        ))}
      </div>
    </div>
  );
}
