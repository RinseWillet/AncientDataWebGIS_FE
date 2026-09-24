import { describe, it, expect } from 'vitest';
import { DivIcon } from 'leaflet';
import { getSiteIcon } from './siteTypesConfig';

describe('getSiteIcon', () => {
  it('resolves ptum (possible barrow) to a different icon than tum (confirmed barrow)', () => {
    // (E16) Site-type icons are inline-SVG DivIcons, not image-based Icons -
    // the distinguishing content is the SVG markup (`options.html`), not an
    // `iconUrl` (DivIcon has none).
    const ptumIcon = getSiteIcon('ptum') as DivIcon;
    const tumIcon = getSiteIcon('tum') as DivIcon;

    expect(ptumIcon.options.html).not.toBe(tumIcon.options.html);
  });
});
