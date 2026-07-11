// Tailwind doit voir des classes littérales pour les générer : on ne peut pas
// interpoler `bg-${accent}-100` dynamiquement, d'où cette table explicite.
export const ACCENT_CLASSES: Record<
  string,
  { badge: string; border: string; gradient: string; ring: string; dot: string }
> = {
  orange: {
    badge: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300",
    border: "border-orange-200 dark:border-orange-900",
    gradient: "from-orange-400 to-amber-600",
    ring: "ring-orange-400",
    dot: "bg-orange-500",
  },
  emerald: {
    badge: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
    border: "border-emerald-200 dark:border-emerald-900",
    gradient: "from-emerald-400 to-green-600",
    ring: "ring-emerald-400",
    dot: "bg-emerald-500",
  },
  blue: {
    badge: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
    border: "border-blue-200 dark:border-blue-900",
    gradient: "from-blue-400 to-sky-600",
    ring: "ring-blue-400",
    dot: "bg-blue-500",
  },
  indigo: {
    badge: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300",
    border: "border-indigo-200 dark:border-indigo-900",
    gradient: "from-indigo-400 to-violet-600",
    ring: "ring-indigo-400",
    dot: "bg-indigo-500",
  },
  red: {
    badge: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
    border: "border-red-200 dark:border-red-900",
    gradient: "from-red-400 to-rose-600",
    ring: "ring-red-400",
    dot: "bg-red-500",
  },
  teal: {
    badge: "bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300",
    border: "border-teal-200 dark:border-teal-900",
    gradient: "from-teal-400 to-cyan-600",
    ring: "ring-teal-400",
    dot: "bg-teal-500",
  },
  purple: {
    badge: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300",
    border: "border-purple-200 dark:border-purple-900",
    gradient: "from-purple-400 to-fuchsia-600",
    ring: "ring-purple-400",
    dot: "bg-purple-500",
  },
  gray: {
    badge: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
    border: "border-gray-200 dark:border-gray-800",
    gradient: "from-gray-400 to-slate-600",
    ring: "ring-gray-400",
    dot: "bg-gray-500",
  },
};
