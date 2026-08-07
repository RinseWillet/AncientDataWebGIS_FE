import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { MarkdownImage } from '../components/Book/MarkdownImage';
import TableOfContents from '../components/Book/TableOfContents';
import ChapterNav from '../components/Book/ChapterNav';
import { chapters } from '../content/book/chapters';
import '../components/Book/Book.css';

// Eagerly load every chapter's raw Markdown source at build time, keyed by
// file path, so the :slug route param can be resolved to content without
// per-chapter imports/route wiring.
const chapterSources = import.meta.glob('../content/book/*.md', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>;

const findChapterSource = (slug: string | undefined): string | undefined => {
  if (!slug) return undefined;
  const entry = Object.entries(chapterSources).find(([path]) => path.endsWith(`/${slug}.md`));
  return entry?.[1];
};

const BookChapter = () => {
  const { slug } = useParams<{ slug: string }>();
  const source = findChapterSource(slug);
  const meta = chapters.find((chapter) => chapter.slug === slug);

  return (
    <div className="pagebox">
      <main className="book-layout">
        <TableOfContents />
        <article className="book-chapter">
          {source ? (
            <>
              <ReactMarkdown components={{ img: MarkdownImage }}>{source}</ReactMarkdown>
              {slug && <ChapterNav slug={slug} />}
            </>
          ) : (
            <p>
              Chapter{meta ? ` "${meta.title}"` : ''} not found.{' '}
              <Link to="/book/01-introduction">Start from the introduction</Link>.
            </p>
          )}
        </article>
      </main>
    </div>
  );
};

export default BookChapter;

