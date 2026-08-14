import { Link } from 'react-router';
import { getAdjacentChapters } from '../../content/book/chapters';
import './Book.css';

interface ChapterNavProps {
  slug: string;
}

const ChapterNav = ({ slug }: ChapterNavProps) => {
  const { previous, next } = getAdjacentChapters(slug);

  if (!previous && !next) return null;

  return (
    <nav className="book-chapter-nav" aria-label="Chapter navigation">
      <div className="book-chapter-nav__previous">
        {previous && (
          <Link to={`/book/${previous.slug}`}>
            &laquo; {previous.title}
          </Link>
        )}
      </div>
      <div className="book-chapter-nav__next">
        {next && (
          <Link to={`/book/${next.slug}`}>
            {next.title} &raquo;
          </Link>
        )}
      </div>
    </nav>
  );
};

export default ChapterNav;

