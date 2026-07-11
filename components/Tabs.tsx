"use client";

import { ACCENT_CLASSES } from "@/lib/accent";

export interface TabDef {
  key: string;
  label: string;
  emoji: string;
  accent: string;
}

export default function Tabs({
  tabs,
  active,
  onChange,
}: {
  tabs: TabDef[];
  active: string;
  onChange: (key: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((tab) => {
        const isActive = active === tab.key;
        const accent = ACCENT_CLASSES[tab.accent];
        return (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
              isActive
                ? `${accent.badge} ring-1 ${accent.ring} shadow-sm`
                : "bg-white text-gray-600 ring-1 ring-gray-200 hover:ring-gray-300 hover:-translate-y-0.5 dark:bg-neutral-900 dark:text-gray-400 dark:ring-gray-800"
            }`}
          >
            <span className="mr-1.5">{tab.emoji}</span>
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
