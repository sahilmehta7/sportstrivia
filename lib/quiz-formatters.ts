export function formatQuizDuration(seconds?: number | null): string {
  if (!seconds || seconds <= 0) {
    return "Flexible";
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const parts: string[] = [];
  if (hours) parts.push(`${hours}h`);
  if (minutes) parts.push(`${minutes}m`);

  if (!hours && !minutes) {
    parts.push(`${secs}s`);
  } else if (hours && !minutes && secs) {
    parts.push(`${secs}s`);
  } else if (minutes && secs) {
    parts.push(`${secs}s`);
  }

  return parts.join(" ");
}

export function formatPlayerCount(count?: number | null): string {
  if (!count) {
    return "0";
  }

  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`;
  }

  return count.toString();
}

export function getSportIcon(sport?: string | null): string {
  if (!sport) return "🎯";
  const normalized = sport.toLowerCase();
  switch (normalized) {
    case "football":
    case "soccer":
      return "⚽️";
    case "basketball":
      return "🏀";
    case "baseball":
      return "⚾️";
    case "tennis":
      return "🎾";
    case "cricket":
      return "🏏";
    case "golf":
      return "⛳️";
    case "hockey":
      return "🏒";
    default:
      return "🎮";
  }
}

const gradientMap: Record<string, string> = {
  football: "from-amber-400 via-amber-500 to-amber-600",
  soccer: "from-emerald-400 via-teal-500 to-cyan-500",
  basketball: "from-orange-400 via-orange-500 to-amber-500",
  baseball: "from-red-400 via-rose-500 to-pink-500",
  tennis: "from-lime-300 via-lime-400 to-emerald-500",
  cricket: "from-green-400 via-emerald-500 to-teal-500",
  golf: "from-amber-300 via-lime-400 to-emerald-500",
  hockey: "from-slate-400 via-blue-500 to-indigo-500",
};

const fallbackGradients = [
  "from-purple-400 via-indigo-500 to-blue-500",
  "from-pink-400 via-fuchsia-500 to-purple-500",
  "from-teal-400 via-cyan-500 to-blue-500",
  "from-amber-400 via-orange-500 to-red-500",
];

export function getSportGradient(sport?: string | null, index = 0): string {
  if (!sport) {
    return fallbackGradients[index % fallbackGradients.length];
  }
  const normalized = sport.toLowerCase();
  return gradientMap[normalized] ?? fallbackGradients[index % fallbackGradients.length];
}
