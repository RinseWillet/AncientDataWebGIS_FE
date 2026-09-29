import { Fragment, useMemo, useState, type ReactNode } from 'react';
import type { ModernReference } from '../types/geoJson';
import './sidenotes.css';

/**
 * Renders a long Location/Description text (a plain string from PostGIS) as
 * paragraphs, and turns every mention of one of the record's linked references
 * (matched on ModernReference.shortRef, e.g. "Byvanck 1931") into a citation:
 * - desktop (reading page): the full reference sits in the right margin, beside the line
 * - phone: tapping the name opens it as a small pop-up
 * No database change: texts stay as they are. A shortRef that does not appear
 * verbatim in the text simply stays plain text (it is still listed under Sources).
 */
const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

interface Props {
  text: string;
  references: ModernReference[];
}

export const CitedText = ({ text, references }: Props) => {
  const { pattern, byShort } = useMemo(() => {
    const usable = references.filter((r) => r.shortRef?.trim());
    // longest first, so "van Es 1981a" wins over "van Es 1981"
    const sorted = [...usable].sort((a, b) => b.shortRef.length - a.shortRef.length);
    return {
      pattern: sorted.length ? new RegExp(`(${sorted.map((r) => escapeRegExp(r.shortRef)).join('|')})`, 'g') : null,
      byShort: new Map(usable.map((r) => [r.shortRef, r])),
    };
  }, [references]);

  const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim());

  return (
    <div className="cited-text read">
      {paragraphs.map((p, i) => (
        <p key={i}>
          {pattern
            ? p.split(pattern).map((part, j) =>
                j % 2 === 1 && byShort.has(part) ? (
                  <Cite key={j} reference={byShort.get(part)!} />
                ) : (
                  <Fragment key={j}>{part}</Fragment>
                )
              )
            : p}
        </p>
      ))}
    </div>
  );
};

const Cite = ({ reference }: { reference: ModernReference }): ReactNode => {
  const [open, setOpen] = useState(false);
  const id = `ref-${reference.id}`;
  return (
    <>
      <button
        type="button"
        className="cite"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((o) => !o)}
      >
        {reference.shortRef}
      </button>
      {/* <span> not <aside>: must stay valid inside <p>. CSS floats it into the margin. */}
      <span id={id} className={`sidenote${open ? ' sidenote--open' : ''}`} role="note">
        <span className="sidenote__short">{reference.shortRef}</span>
        {reference.url ? (
          <a href={reference.url} target="_blank" rel="noreferrer">
            {reference.fullRef}
          </a>
        ) : (
          reference.fullRef
        )}
      </span>
    </>
  );
};

/* Tip: the same component can render your book chapters' "(Kalis et al. 2008, pp. 39-40)"
   citations too, once the chapter bibliography is available as ModernReference[]. */
