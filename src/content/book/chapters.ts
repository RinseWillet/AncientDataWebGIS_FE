export interface BookChapterMeta {
  slug: string;
  title: string;
  part?: string;
}

/**
 * Ordered manifest of book chapters.
 *
 * Add a new entry here (and drop the matching `.md` file + any images into
 * `src/content/book/` / `src/assets/book/`) to publish a new chapter -
 * no route wiring required, see `pages/BookChapter.tsx`.
 */
export const chapters: BookChapterMeta[] = [
  { slug: '01-introduction', title: 'Introduction', part: 'Prologue' },
  {
    slug: '02-roman-roads-in-the-nijmegen-xanten-area',
    title: 'Roman Roads in the Nijmegen-Xanten Area',
    part: 'Prologue',
  },
  {
    slug: '03-geography-of-the-research-area',
    title: 'The Geography of the Research Area',
    part: 'Part I - Before Rome',
  },
  {
    slug: '04-rivers-and-problematic-reconstructions',
    title: 'Rivers and Problematic Reconstructions',
    part: 'Part I - Before Rome',
  },
  {
    slug: '05-vegetation-in-the-landscape',
    title: 'Vegetation in the Landscape',
    part: 'Part I - Before Rome',
  },
  {
    slug: '06-landuse-before-the-romans-raatakkers',
    title: 'Land Use Before the Romans: Raatakkers',
    part: 'Part I - Before Rome',
  },
  { slug: '07-prehistoric-roads', title: 'Prehistoric Roads, Routes, and Methodologies', part: 'Part I - Before Rome' },
  { slug: '08-references', title: 'References' },
  { slug: '09-license', title: 'License' },
];

export const getChapterIndex = (slug: string | undefined): number =>
  chapters.findIndex((chapter) => chapter.slug === slug);

export const getAdjacentChapters = (
  slug: string | undefined
): { previous?: BookChapterMeta; next?: BookChapterMeta } => {
  const index = getChapterIndex(slug);
  if (index === -1) return {};
  return {
    previous: index > 0 ? chapters[index - 1] : undefined,
    next: index < chapters.length - 1 ? chapters[index + 1] : undefined,
  };
};

