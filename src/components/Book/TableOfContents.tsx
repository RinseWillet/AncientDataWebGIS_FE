import { Link, useParams } from 'react-router-dom';
import { chapters } from '../../content/book/chapters';
import './Book.css';

const TableOfContents = () => {
  const { slug: activeSlug } = useParams<{ slug: string }>();

  const groupedByPart = chapters.reduce<Record<string, typeof chapters>>((acc, chapter) => {
    const part = chapter.part ?? '';
    if (!acc[part]) acc[part] = [];
    acc[part].push(chapter);
    return acc;
  }, {});

  return (
    <nav className="book-toc" aria-label="Table of contents">
      <h2 className="book-toc__title">Contents</h2>
      {Object.entries(groupedByPart).map(([part, partChapters]) => (
        <div key={part || 'default'} className="book-toc__group">
          {part && <h3 className="book-toc__part">{part}</h3>}
          <ul>
            {partChapters.map((chapter) => (
              <li key={chapter.slug}>
                <Link
                  to={`/book/${chapter.slug}`}
                  className={chapter.slug === activeSlug ? 'book-toc__link book-toc__link--active' : 'book-toc__link'}
                >
                  {chapter.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
};

export default TableOfContents;

