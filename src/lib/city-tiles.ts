// City tile image mapping: maps city names to custom tile PNGs
// To add a new city: drop a PNG in /public/tiless/ and add it here
export const CITY_TILES: Record<string, string> = {
  "Tulsa": "/tiless/Tulsa-Tile.png",
  "Dallas": "/tiless/Dallas-Tile.png",
  "Miami": "/tiless/Miami-Tile.png",
  "Nashville": "/tiless/Nashville-Tile.png",
  "Phoenix": "/tiless/Phoenix-Tile.png",
  "Scottsdale": "/tiless/Scottsdale-Tile.png",
  "Palm Beach": "/tiless/PalmBeach-Tile.png",
  "Orlando": "/tiless/Orlando-Tile.png",
  "Kansas City": "/tiless/KC-Tile.png",
  "Chicago": "/tiless/Chicago-Tile.png",
  "New York": "/tiless/NY-Tile.png",
  "Denver": "/tiless/Denver-Tile.png",
};

/**
 * Get the tile image path for a city. Returns null if no custom tile exists.
 */
export function getCityTile(cityName: string): string | null {
  return CITY_TILES[cityName] || null;
}
