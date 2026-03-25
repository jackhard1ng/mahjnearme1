/**
 * Curated list of cities to display in the homepage marquee.
 * Jack can add/remove entries here to control which cities appear.
 *
 * - `city`: City name (must match the game data exactly)
 * - `state`: Two-letter state abbreviation
 * - `searchQuery`: What gets dropped into the search bar when tapped (city, state for proximity search)
 * - `tile`: Optional custom tile image path (from /public/tiless/). If null, uses a dot marker.
 */
export interface FeaturedTile {
  city: string;
  state: string;
  searchQuery: string;
  tile: string | null;
}

export const FEATURED_TILES: FeaturedTile[] = [
  { city: "Tulsa", state: "OK", searchQuery: "Tulsa, OK", tile: "/tiless/Tulsa-Tile.png" },
  { city: "Chicago", state: "IL", searchQuery: "Chicago, IL", tile: "/tiless/Chicago-Tile.png" },
  { city: "Dallas", state: "TX", searchQuery: "Dallas, TX", tile: "/tiless/Dallas-Tile.png" },
  { city: "Denver", state: "CO", searchQuery: "Denver, CO", tile: "/tiless/Denver-Tile.png" },
  { city: "Miami", state: "FL", searchQuery: "Miami, FL", tile: "/tiless/Miami-Tile.png" },
  { city: "Nashville", state: "TN", searchQuery: "Nashville, TN", tile: "/tiless/Nashville-Tile.png" },
  { city: "New York", state: "NY", searchQuery: "New York, NY", tile: "/tiless/NY-Tile.png" },
  { city: "Orlando", state: "FL", searchQuery: "Orlando, FL", tile: "/tiless/Orlando-Tile.png" },
  { city: "West Palm Beach", state: "FL", searchQuery: "West Palm Beach, FL", tile: "/tiless/PalmBeach-Tile.png" },
  { city: "Phoenix", state: "AZ", searchQuery: "Phoenix, AZ", tile: "/tiless/Phoenix-Tile.png" },
  { city: "Scottsdale", state: "AZ", searchQuery: "Scottsdale, AZ", tile: "/tiless/Scottsdale-Tile.png" },
  { city: "Kansas City", state: "MO", searchQuery: "Kansas City, MO", tile: "/tiless/KC-Tile.png" },
  { city: "Oklahoma City", state: "OK", searchQuery: "Oklahoma City, OK", tile: null },
  { city: "Fort Worth", state: "TX", searchQuery: "Fort Worth, TX", tile: null },
  { city: "Houston", state: "TX", searchQuery: "Houston, TX", tile: null },
  { city: "San Antonio", state: "TX", searchQuery: "San Antonio, TX", tile: null },
  { city: "Austin", state: "TX", searchQuery: "Austin, TX", tile: null },
  { city: "Atlanta", state: "GA", searchQuery: "Atlanta, GA", tile: null },
  { city: "Tampa", state: "FL", searchQuery: "Tampa, FL", tile: null },
  { city: "Las Vegas", state: "NV", searchQuery: "Las Vegas, NV", tile: null },
  { city: "San Diego", state: "CA", searchQuery: "San Diego, CA", tile: null },
  { city: "Los Angeles", state: "CA", searchQuery: "Los Angeles, CA", tile: null },
  { city: "San Francisco", state: "CA", searchQuery: "San Francisco, CA", tile: null },
  { city: "Seattle", state: "WA", searchQuery: "Seattle, WA", tile: null },
  { city: "Portland", state: "OR", searchQuery: "Portland, OR", tile: null },
  { city: "Minneapolis", state: "MN", searchQuery: "Minneapolis, MN", tile: null },
  { city: "St. Louis", state: "MO", searchQuery: "St. Louis, MO", tile: null },
  { city: "Charlotte", state: "NC", searchQuery: "Charlotte, NC", tile: null },
  { city: "Philadelphia", state: "PA", searchQuery: "Philadelphia, PA", tile: null },
  { city: "Boston", state: "MA", searchQuery: "Boston, MA", tile: null },
];
