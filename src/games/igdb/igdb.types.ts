export interface IgdbGame {
  id: number;
  name: string;
  slug: string;
  summary?: string;
  cover?: { url?: string };
  genres?: { name: string }[];
  platforms?: { name: string }[];
  first_release_date?: number;
  total_rating?: number;
  hypes?: number;
  [key: string]: unknown;
}

export interface IgdbPopularityPrimitive {
  game_id: number;
  value: number;
  popularity_type?: number;
}

export interface IgdbMetadataItem {
  id: number;
  name: string;
  slug: string;
}

export interface IgdbCountResponse {
  count: number;
}

export interface IgdbGameTimeToBeat {
  game_id: number;
  hastily?: number;
  normally?: number;
  completely?: number;
}

export interface IgdbExpectedTimes {
  expectedTime?: number;
  expectedTimeForAllContent?: number;
}
