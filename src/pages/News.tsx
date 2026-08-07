import type { ReactNode } from 'react';
import './News.css';

interface NewsItem {
  date: string;
  title: string;
  body: ReactNode;
}

const newsItems: NewsItem[] = [
  {
    date: '2026-08-07',
    title: 'The site is live at rinsewillet.net',
    body: (
      <>
        This application is now deployed and publicly reachable at{' '}
        <a href="https://rinsewillet.net" target="_blank" rel="noreferrer">
          rinsewillet.net
        </a>
        {
          '. Feel free to explore the interactive map, browse the dataset, and check out the growing collection of research chapters under "Research".'
        }
      </>
    ),
  },
  {
    date: '2026-05-01',
    title: 'App under active development',
    body: 'This app is in a state of development and occasional technical and informational updates will be provided here.',
  },
];

const News = () => {
  return (
    <div className="pagebox">
      <main className="news-page">
        <h1>News</h1>
        <ul className="news-list">
          {newsItems.map((item) => (
            <li key={item.date + item.title} className="news-item">
              <time className="news-item__date" dateTime={item.date}>
                {new Date(item.date).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </time>
              <h2 className="news-item__title">{item.title}</h2>
              <p className="news-item__body">{item.body}</p>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
};

export default News;
