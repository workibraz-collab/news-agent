"use client";

import { useState } from "react";
import { CATEGORY_KEYS, FEEDS, type CategoryKey } from "@/lib/feeds";
import Tabs, { type TabDef } from "./Tabs";
import CategoryPane from "./CategoryPane";
import SummaryPanel from "./SummaryPanel";

type TabKey = CategoryKey | "summary";

const TABS: TabDef[] = [
  { key: "summary", label: "Résumé" },
  ...CATEGORY_KEYS.map((key) => ({ key, label: FEEDS[key].label })),
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
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-4">Veille info</h1>
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
