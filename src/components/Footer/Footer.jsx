import React from "react";
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
                        <Link to='/home' activestyle="true">
                            <p>Home</p>
                        </Link>
                        <Link to='/about' activestyle="true">
                            <p>About</p>
                        </Link>
                        <Link to='/datalist' activestyle="true">
                            <p>DataList</p>
                        </Link>
                        <Link to='/atlas' activestyle="true">
                            <p>To the Map</p>
                        </Link>
                    </div>
                    <div className="sb__footer-links_div">
                        <h4>Resources</h4>
                        <a href="https://github.com/RinseWillet">
                            <p>Github</p>
                        </a>
                        <a href="https://archaeologydataservice.ac.uk/archives/view/icrates_lt_2018/">
                            <p>Inventory of Crafts and Trade in the Roman East (ICRATES)</p>
                        </a>
                        <a href="https://books.ub.uni-heidelberg.de/propylaeum/catalog/book/571">
                            <p>Asia Minor</p>
                        </a>
                    </div>
                    <div className="sb__footer-links_div">
                        <h4>IT Portfolio</h4>
                        <a href="https://rinse-react-redux-myflix-app.web.app/">
                            <p>React study (login Rinse pw cool)</p>
                        </a>
                        <a href="https://rinse-css-art-portfolio.web.app/">
                            <p>Study in CSS art</p>
                        </a>
                        <a>
                            <p>Games (under construction)</p>
                        </a>
                    </div>               
                    <div className="sb__footer-links_div">
                        <h4>Social Media</h4>
                        <div className="socialmedia">
                            <a href="https://www.youtube.com/@rinsewillet1934">
                                <p><img src={yt} alt="" /></p>
                            </a>                            
                            <a href="https://www.linkedin.com/in/rinse-willet-9b520693/">
                                <p><img src={linkedin} alt="" /></p>
                            </a>
                            <a href="">
                                <p><img src={insta} alt="https://www.instagram.com/rinsedoesarchaeology/" /></p>
                            </a>
                        </div>
                    </div>
                </div>
                <hr></hr>
                <div className="sb__footer-below">
                    <div className="sb__footer-copyright">
                        <p>
                            ©{new Date().getFullYear()} Rinse Willet. All rights reserved.
                        </p>
                    </div>
                    {/* <div className="sb__footer-below-links">
                        <a href="/terms"><div><p>Terms & Conditions</p></div></a>
                        <a href="/terms"><div><p>Privacy</p></div></a>
                        <a href="/terms"><div><p>Security</p></div></a>
                        <a href="/terms"><div><p>Cookie Declaration</p></div></a>
                    </div> */}
                </div>
            </div>
        </div>
    );
}

export default Footer;