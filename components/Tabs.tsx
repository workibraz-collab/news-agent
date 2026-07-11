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
    <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
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
                : "bg-white text-gray-600 ring-1 ring-gray-200 hover:ring-gray-300 dark:bg-neutral-900 dark:text-gray-400 dark:ring-gray-800"
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
