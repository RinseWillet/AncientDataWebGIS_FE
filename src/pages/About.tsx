import { Link } from 'react-router';
import ancientRoad from '../assets/ancient road.png';
import './About.css';

const About = () => {
  return (
    <div className="pagebox">
      <main className="about-page">
        <h1>About this project</h1>

        <figure className="about-photo">
          <img src={ancientRoad} alt="Illustration of an ancient Roman road" />
          <figcaption>An ancient road — the subject at the heart of this project.</figcaption>
        </figure>

        <p>
          Curious about the research itself — the reconstruction of roads and settlements, the
          methodology, and what the data show? Head over to{' '}
          <Link to="/book/01-introduction">the Research section</Link> for the full written
          narrative.
        </p>

        <section>
          <h2>How this project came about</h2>
          <p>
            This project grew out of a post doctoral research project on the continuity and change
            of settlement and road networks from the Iron Age into the Roman period. What began as a
            collection of ancient sources and archaeological observations turned into the idea for
            an openly browsable, mapped dataset — so that the underlying evidence, not just the
            conclusions, could be explored directly.
          </p>
        </section>

        <section>
          <h2>Technology</h2>
          <p>This application is built as two independent, open-source projects:</p>
          <ul>
            <li>
              <strong>Frontend:</strong> React, TypeScript, and Vite, with Redux Toolkit for state
              management, Leaflet/React-Leaflet for the interactive map, and Recharts for the
              dashboard.
            </li>
            <li>
              <strong>Backend:</strong> Spring Boot (Java) with a PostgreSQL/PostGIS database for
              spatial data, JWT-based authentication, and Flyway-managed migrations.
            </li>
          </ul>
        </section>

        <section>
          <h2>Open Source</h2>
          <p>Both parts of this project are open source and developed in the open:</p>
          <ul>
            <li>
              <a
                href="https://github.com/RinseWillet/AncientDataWebGIS_FE"
                target="_blank"
                rel="noreferrer"
              >
                AncientDataWebGIS_FE
              </a>{' '}
              — the frontend (this website)
            </li>
            <li>
              <a
                href="https://github.com/RinseWillet/AncientDataWebGIS"
                target="_blank"
                rel="noreferrer"
              >
                AncientDataWebGIS
              </a>{' '}
              — the backend API
            </li>
          </ul>
        </section>

        <nav>
          <Link to="/">Home</Link>
        </nav>
      </main>
    </div>
  );
};

export default About;
