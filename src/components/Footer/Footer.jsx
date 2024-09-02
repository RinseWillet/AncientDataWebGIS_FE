import React from "react";
import './Footer.css';
import yt from '../../assets/images/youtube.png';
import linkedin from '../../assets/images/linkedin.png';
import insta from '../../assets/images/instagram.png';

const Footer = () => {

    return (
        <div className="footer">
            <div className="sb__footer section__padding">
                <div className="sb__footer-links">
                    <div className="sb__footer-links_div">
                        <h4>Navigation</h4>
                        <a href="/home">
                            <p>Home</p>
                        </a>
                        <a href="/about">
                            <p>About</p>
                        </a>
                        <a href="/datalist">
                            <>DataList</>
                        </a>
                        <a href="/atlas">
                            <p>Atlas</p>
                        </a>
                    </div>
                    <div className="sb__footer-links_div">
                        <h4>Resources</h4>
                        <a href="https://github.com/RinseWillet">
                            <p>Github</p>
                        </a>
                        <a href="https://archaeologydataservice.ac.uk/archives/view/icrates_lt_2018/">
                            <>ICRATES</>
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
                        <h4>Other Links</h4>
                        <a>
                            <p>under construction</p>
                        </a>
                        <a>
                            <p>under construction</p>
                        </a>
                        <a>
                            <p>under construction</p>
                        </a>
                    </div>
                    <div className="sb__footer-links_div">
                        <h4>Social Media</h4>
                        <div className="socialmedia">
                            <p><img src={yt} alt=""/></p>
                            <p><img src={linkedin} alt=""/></p>
                            <p><img src={insta} alt=""/></p>                       
                        </div>                       
                    </div>
                </div>
            <hr></hr>
            <div className="sb__footer-below">
                <div className="sb__footer-copyright">
                    <p>
                        @{new Date().getFullYear()} Rinse Willet. All rights reserved.
                    </p>
                </div>
                <div className="sb__footer-below-links">
                    <a href="/terms"><div><p>Terms & Conditions</p></div></a>
                    <a href="/terms"><div><p>Privacy</p></div></a>
                    <a href="/terms"><div><p>Security</p></div></a>
                    <a href="/terms"><div><p>Cookie Declaration</p></div></a>
                </div>
            </div>
            </div>
        </div>
    );
}

export default Footer;