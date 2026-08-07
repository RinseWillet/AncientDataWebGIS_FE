/**
 * Shared item selection types used across the Map components.
 *
 * - `SearchItem` represents the currently selected map feature (via a click or
 *   an external search).
 * - `QueryItem` represents a feature the map should highlight/zoom to because
 *   the user arrived from a SiteInfo/RoadInfo page.
 */
export interface SearchItem {
  type: string;
  id: string | number;
}

export interface QueryItem {
  type: string;
  id: string | number;
}

