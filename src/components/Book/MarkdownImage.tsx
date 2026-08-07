import type { Components } from 'react-markdown';

// Eagerly resolve every image bundled under src/assets/book at build time,
// keyed by filename so chapter Markdown can reference images by plain filename
// (e.g. ![alt](my-map.png "caption")) without a manual import per image.
const bookImages = import.meta.glob('../../assets/book/*.{png,jpg,jpeg,svg}', {
  eager: true,
  import: 'default',
}) as Record<string, string>;

const resolveImageSrc = (src?: string): string => {
  if (!src) return '';
  // src may already be an absolute/relative URL (e.g. external image); only
  // rewrite plain filenames that match a bundled asset.
  const match = Object.entries(bookImages).find(([path]) => path.endsWith(`/${src}`));
  return match ? match[1] : src;
};

interface MarkdownImageProps {
  src?: string;
  alt?: string;
  title?: string;
}

/**
 * Custom `img` renderer for react-markdown: wraps images in a <figure>,
 * resolves bundled QGIS/illustration assets by filename, and renders the
 * Markdown "title" attribute (`![alt](src "title")`) as a <figcaption>.
 */
const MarkdownImageComponent = ({ src, alt, title }: MarkdownImageProps) => (
  <figure className="book-figure">
    <img src={resolveImageSrc(src)} alt={alt ?? ''} loading="lazy" />
    {title && <figcaption>{title}</figcaption>}
  </figure>
);

export const MarkdownImage = MarkdownImageComponent as Components['img'];

export default MarkdownImage;


