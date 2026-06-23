/** IGDB platform IDs ordered by mainstream popularity (consoles & PC first). */
export const POPULAR_PLATFORM_IDS: number[] = [
  6, // PC (Microsoft Windows)
  167, // PlayStation 5
  130, // Nintendo Switch
  169, // Xbox Series X|S
  48, // PlayStation 4
  49, // Xbox One
  39, // iOS
  34, // Android
  14, // Mac
  3, // Linux
  9, // PlayStation 3
  12, // Xbox 360
  8, // PlayStation 2
  11, // Xbox
  7, // PlayStation
  5, // Wii
  41, // Wii U
  37, // Nintendo 3DS
  20, // Nintendo DS
  21, // Nintendo GameCube
  4, // Nintendo 64
  19, // Super Nintendo
  29, // Sega Mega Drive/Genesis
  52, // Arcade
];

export function sortPlatformsByPopularity<T extends { id: number; name: string }>(
  items: T[],
): T[] {
  const rank = new Map(POPULAR_PLATFORM_IDS.map((id, index) => [id, index]));

  return [...items].sort((a, b) => {
    const rankA = rank.get(a.id) ?? Number.MAX_SAFE_INTEGER;
    const rankB = rank.get(b.id) ?? Number.MAX_SAFE_INTEGER;
    if (rankA !== rankB) return rankA - rankB;
    return a.name.localeCompare(b.name);
  });
}
