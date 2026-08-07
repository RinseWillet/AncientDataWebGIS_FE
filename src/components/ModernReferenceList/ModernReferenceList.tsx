import type { ReactNode } from 'react';
import type { ModernReference } from '../../types/geoJson';

interface ModernReferenceListProps {
  /** Resolved modern references to render as a list. */
  references: ModernReference[];
  /** Fallback text shown when no structured references are available. */
  fallback?: string;
}

/**
 * Renders a list of modern bibliographic references, linking each one when a
 * URL is present. Shared by the SiteInfo and RoadInfo detail pages.
 */
const ModernReferenceList = ({ references, fallback }: ModernReferenceListProps): ReactNode => {
  if (references.length === 0) {
    return <span>{fallback}</span>;
  }
  return references.map((ref) =>
    ref.url ? (
      <li key={ref.id}>
        <a className="reference-listitem__link" href={ref.url}>
          {ref.fullRef}
        </a>
      </li>
    ) : (
      <li key={ref.id} className="reference-listitem__nolink">
        {ref.fullRef}
      </li>
    )
  );
};

export default ModernReferenceList;
