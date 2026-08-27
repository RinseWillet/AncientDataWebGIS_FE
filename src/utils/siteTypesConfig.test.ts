import { describe, it, expect } from 'vitest';
import { Icon } from 'leaflet';
import { getSiteIcon } from './siteTypesConfig';

describe('getSiteIcon', () => {
  it('resolves ptum (possible barrow) to a different icon than tum (confirmed barrow)', () => {
    const ptumIcon = getSiteIcon('ptum') as Icon;
    const tumIcon = getSiteIcon('tum') as Icon;

    expect(ptumIcon.options.iconUrl).not.toBe(tumIcon.options.iconUrl);
  });
});
