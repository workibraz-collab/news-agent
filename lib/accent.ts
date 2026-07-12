// Tailwind doit voir des classes littérales pour les générer : on ne peut pas
// interpoler `bg-${accent}-100` dynamiquement, d'où cette table explicite.
export const ACCENT_CLASSES: Record<
  string,
  {
    badge: string;
    border: string;
    gradient: string;
    ring: string;
    dot: string;
    tint: string;
    hoverBorder: string;
    text: string;
  }
> = {
  orange: {
    badge: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300",
    border: "border-orange-200 dark:border-orange-900",
    gradient: "from-orange-400 to-amber-600",
    ring: "ring-orange-400",
    dot: "bg-orange-500",
    tint: "bg-orange-50/70 dark:bg-orange-950/20",
    hoverBorder: "hover:border-orange-400 dark:hover:border-orange-600",
    text: "text-orange-600 dark:text-orange-400",
  },
  emerald: {
    badge: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
    border: "border-emerald-200 dark:border-emerald-900",
    gradient: "from-emerald-400 to-green-600",
    ring: "ring-emerald-400",
    dot: "bg-emerald-500",
    tint: "bg-emerald-50/70 dark:bg-emerald-950/20",
    hoverBorder: "hover:border-emerald-400 dark:hover:border-emerald-600",
    text: "text-emerald-600 dark:text-emerald-400",
  },
  blue: {
    badge: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
    border: "border-blue-200 dark:border-blue-900",
    gradient: "from-blue-400 to-sky-600",
    ring: "ring-blue-400",
    dot: "bg-blue-500",
    tint: "bg-blue-50/70 dark:bg-blue-950/20",
    hoverBorder: "hover:border-blue-400 dark:hover:border-blue-600",
    text: "text-blue-600 dark:text-blue-400",
  },
  indigo: {
    badge: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300",
    border: "border-indigo-200 dark:border-indigo-900",
    gradient: "from-indigo-400 to-violet-600",
    ring: "ring-indigo-400",
    dot: "bg-indigo-500",
    tint: "bg-indigo-50/70 dark:bg-indigo-950/20",
    hoverBorder: "hover:border-indigo-400 dark:hover:border-indigo-600",
    text: "text-indigo-600 dark:text-indigo-400",
  },
  red: {
    badge: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
    border: "border-red-200 dark:border-red-900",
    gradient: "from-red-400 to-rose-600",
    ring: "ring-red-400",
    dot: "bg-red-500",
    tint: "bg-red-50/70 dark:bg-red-950/20",
    hoverBorder: "hover:border-red-400 dark:hover:border-red-600",
    text: "text-red-600 dark:text-red-400",
  },
  teal: {
    badge: "bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300",
    border: "border-teal-200 dark:border-teal-900",
    gradient: "from-teal-400 to-cyan-600",
    ring: "ring-teal-400",
    dot: "bg-teal-500",
    tint: "bg-teal-50/70 dark:bg-teal-950/20",
    hoverBorder: "hover:border-teal-400 dark:hover:border-teal-600",
    text: "text-teal-600 dark:text-teal-400",
  },
  purple: {
    badge: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300",
    border: "border-purple-200 dark:border-purple-900",
    gradient: "from-purple-400 to-fuchsia-600",
    ring: "ring-purple-400",
    dot: "bg-purple-500",
    tint: "bg-purple-50/70 dark:bg-purple-950/20",
    hoverBorder: "hover:border-purple-400 dark:hover:border-purple-600",
    text: "text-purple-600 dark:text-purple-400",
  },
  amber: {
    badge: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
    border: "border-amber-200 dark:border-amber-900",
    gradient: "from-amber-400 to-yellow-600",
    ring: "ring-amber-400",
    dot: "bg-amber-500",
    tint: "bg-amber-50/70 dark:bg-amber-950/20",
    hoverBorder: "hover:border-amber-400 dark:hover:border-amber-600",
    text: "text-amber-600 dark:text-amber-400",
  },
  gray: {
    badge: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
    border: "border-gray-200 dark:border-gray-800",
    gradient: "from-gray-400 to-slate-600",
    ring: "ring-gray-400",
    dot: "bg-gray-500",
    tint: "bg-gray-50/70 dark:bg-gray-900/40",
    hoverBorder: "hover:border-gray-400 dark:hover:border-gray-600",
    text: "text-gray-600 dark:text-gray-400",
  },
};
