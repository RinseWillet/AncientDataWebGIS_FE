/**
 * News as Markdown files (like the book chapters): src/content/news/*.md
 * with a small front-matter block (date, title, tag, lead?, image?, draft?).
 * Adding a news item = adding a file. The same list can feed Home (newest 3) and an RSS feed.
 */
export type NewsTag = 'map-data' | 'research' | 'interface' | 'under-the-hood' | 'project';

export interface NewsItem {
  slug: string;
  date: string;
  title: string;
  tag: NewsTag;
  lead: boolean;
  image?: string;
  draft: boolean;
  body: string; // markdown, render with react-markdown (already a dependency)
}

const files = import.meta.glob('../content/news/*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

const parse = (path: string, raw: string): NewsItem => {
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  const meta: Record<string, string> = {};
  (m?.[1] ?? '').split('\n').forEach((line) => {
    const i = line.indexOf(':');
    if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^'(.*)'$/, '$1');
  });
  return {
    slug: path.split('/').pop()!.replace(/\.md$/, ''),
    date: meta.date,
    title: meta.title,
    tag: (meta.tag as NewsTag) ?? 'project',
    lead: meta.lead === 'true',
    image: meta.image,
    draft: meta.draft === 'true',
    body: (m?.[2] ?? raw).trim(),
  };
};

export const news: NewsItem[] = Object.entries(files)
  .map(([p, raw]) => parse(p, raw))
  .filter((n) => import.meta.env.DEV || !n.draft)
  .sort((a, b) => b.date.localeCompare(a.date));

export const latestNews = (n = 3) => news.slice(0, n);
