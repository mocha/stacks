// RPG-style rarity tiers for GitHub star counts
// Normal → Magic → Rare → Epic → Legendary

export type StarTier = "normal" | "magic" | "rare" | "epic" | "legendary";

export function getStarTier(stars: number): StarTier {
  if (stars >= 2_000_000) return "legendary";
  if (stars >= 500_000) return "epic";
  if (stars >= 100_000) return "rare";
  if (stars >= 10_000) return "magic";
  return "normal";
}

export function starColorClass(stars: number): string {
  const tier = getStarTier(stars);
  switch (tier) {
    case "legendary":
      return "text-orange-400 font-bold";
    case "epic":
      return "text-purple-400 font-bold";
    case "rare":
      return "text-yellow-400 font-semibold";
    case "magic":
      return "text-blue-400 font-medium";
    case "normal":
      return "text-zinc-400 dark:text-zinc-500";
  }
}

export function starTierLabel(stars: number): string | null {
  const tier = getStarTier(stars);
  switch (tier) {
    case "legendary": return "Legendary";
    case "epic": return "Epic";
    case "rare": return "Rare";
    case "magic": return "Magic";
    default: return null;
  }
}
