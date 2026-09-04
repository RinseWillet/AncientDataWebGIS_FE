import type { ReactNode } from 'react';
import './News.css';

interface NewsItem {
  date: string;
  title: string;
  body: ReactNode;
}

const newsItems: NewsItem[] = [
  {
    date: '2026-09-04',
    title: 'Work-in-progress manuscript added to the Research page',
    body: 'A work-in-progress manuscript on Roman roads in the Nijmegen-Xanten area has been added under "Research", covering the geography of the research area, historical river reconstructions, vegetation, pre-Roman land use, and the current state of research on prehistoric roads, with a full bibliography. This is an evolving text and more chapters will be added as the manuscript is expanded.',
  },
  {
    date: '2026-08-31',
    title: 'Aerial photographs for the Ruhr and NRW added',
    body: 'Aerial photographs covering the Ruhr area and the wider Nordrhein-Westfalen region have been added as a new imagery layer.',
  },
  {
    date: '2026-08-31',
    title: 'Basemap switched to open-source vector tiles',
    body: 'The topographical basemap now runs on OpenFreeMap’s open-source "Positron" vector tiles instead of CARTO’s raster tiles, removing a dependency on a paid API key and giving smoother, sharper rendering at all zoom levels.',
  },
  {
    date: '2026-08-20',
    title: 'Historical maps added: De Man (1818) and the Reichswald atlas (1740)',
    body: 'Two historical map sets are now browsable on the map: the 1818 De Man map of the Nijmegen area, and an atlas of the area south of Kleve (Reichswald) from 1740.',
  },
  {
    date: '2026-08-18',
    title: 'Digital elevation models with hillshade now available',
    body: 'Digital elevation models (DEMs) with hillshade rendering have been added for eastern Gelderland / western Nordrhein-Westfalen, the Swalmen area, the Venlo-Geldern area, and the area around Mönchengladbach.',
  },
  {
    date: '2026-08-11',
    title: 'GeoServer added for raster data layers',
    body: 'A GeoServer container has been added to the deployment and configured to serve raster data layers, laying the groundwork for elevation models and historical map imagery on the map.',
  },
  {
    date: '2026-08-10',
    title: 'Map Clarity & Layer Control redesign',
    body: 'The layer selector has been redesigned into a grouped, collapsible LayerPanel, and a new map legend was added to explain what each symbol and colour on the map means.',
  },
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
    date: '2026-08-06',
    title: 'Mobile map details now open as a bottom sheet',
    body: 'On mobile, tapping a site or road now opens its details as a draggable bottom sheet instead of a desktop-style side panel, with larger, easier-to-tap buttons and controls throughout.',
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
