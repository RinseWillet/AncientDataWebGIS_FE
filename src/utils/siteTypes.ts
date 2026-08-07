/**
 * Canonical mapping from a site's `siteType` code to its human-readable label.
 * Shared by the atlas info card and the SiteInfo detail page so the two never
 * drift apart.
 */
export const siteTypeLabels: Record<string, string> = {
  castellum: 'castellum',
  pos_castellum: 'possible castellum',
  legfort: 'legionary fortress / castra',
  watchtower: 'watchtower',
  city: 'autonomous city',
  cem: '(Roman) cemetery',
  ptum: 'possible barrow',
  tum: '(Prehistoric?) barrow',
  villa: 'villa',
  pvilla: 'possible villa',
  sett: 'settlement',
  settS: 'settlement with stone buildings',
  sanctuary: 'sanctuary',
  ship: 'shipwreck',
  pship: 'possible shipwreck',
  site: 'generic site',
};

/** Resolve a `siteType` code to its label, defaulting to 'unknown'. */
export const siteTypeConverter = (siteType?: string): string =>
  (siteType ? siteTypeLabels[siteType] : undefined) ?? 'unknown';

