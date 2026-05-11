import { Link } from 'react-router-dom';
import './Footer.css';
import yt from '../../assets/youtube.png';
import linkedin from '../../assets/linkedin.png';
import insta from '../../assets/instagram.png';

const Footer = () => {
  return (
    <div className="footer">
      <div className="sb__footer section__padding">
        <div className="sb__footer-links">
          <div className="sb__footer-links_div">
            <h4>Navigation</h4>
            <Link to="/home">
              <p>Home</p>
            </Link>
            <Link to="/about">
              <p>About</p>
            </Link>
            <Link to="/datalist">
              <p>DataList</p>
            </Link>
            <Link to="/atlas">
              <p>To the Map</p>
            </Link>
          </div>
          <div className="sb__footer-links_div">
            <h4>Resources</h4>
            <a href="https://github.com/RinseWillet" target="_blank" rel="noreferrer">
              <p>Github</p>
            </a>
            <a
              href="https://archaeologydataservice.ac.uk/archives/view/icrates_lt_2018/"
              target="_blank"
              rel="noreferrer"
            >
              <p>Inventory of Crafts and Trade in the Roman East (ICRATES)</p>
            </a>
            <a href="https://books.ub.uni-heidelberg.de/propylaeum/catalog/book/571" target="_blank" rel="noreferrer">
              <p>Asia Minor</p>
            </a>
          </div>
          <div className="sb__footer-links_div">
            <h4>IT Portfolio</h4>
            <a href="https://rinse-react-redux-myflix-app.web.app/" target="_blank" rel="noreferrer">
              <p>React study (login Rinse pw cool)</p>
            </a>
            <a href="https://rinse-css-art-portfolio.web.app/" target="_blank" rel="noreferrer">
              <p>Study in CSS art</p>
            </a>
            <p>Games (under construction)</p>
          </div>
          <div className="sb__footer-links_div">
            <h4>Social Media</h4>
            <div className="socialmedia">
              <a href="https://www.youtube.com/@rinsewillet1934" target="_blank" rel="noreferrer">
                <p>
                  <img src={yt} alt="YouTube" />
                </p>
              </a>
              <a href="https://www.linkedin.com/in/rinse-willet-9b520693/" target="_blank" rel="noreferrer">
                <p>
                  <img src={linkedin} alt="LinkedIn" />
                </p>
              </a>
              <a href="https://www.instagram.com/rinsedoesarchaeology/" target="_blank" rel="noreferrer">
                <p>
                  <img src={insta} alt="Instagram" />
                </p>
              </a>
            </div>
          </div>
        </div>
        <hr />
        <div className="sb__footer-below">
          <div className="sb__footer-copyright">
            <p>{`©${new Date().getFullYear()} Rinse Willet. All rights reserved.`}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Footer;

