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
  { slug: '02-prehistoric-roads', title: 'Prehistoric Roads', part: 'Part I - Before Rome' },
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

