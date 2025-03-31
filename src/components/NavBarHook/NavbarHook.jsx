import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { IoClose, IoMenu } from "react-icons/io5";
import { useMediaQuery } from "react-responsive";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../../features/authSlice";
import "./NavbarHook.css";

const NavbarHook = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isMobile = useMediaQuery({ maxWidth: "1150px" });

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMobileMenu = () => isMobile && setIsMenuOpen(false);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const renderNavLinks = () => {
    const listClassName = isMobile ? "nav__list" : "nav__list__web";
    const linkClassName = "nav__link";
    const buttonClassName = "nav__cta";

    return (
      <ul className={listClassName}>
        <li>
          <NavLink to="/" className={linkClassName} onClick={closeMobileMenu}>
            Home
          </NavLink>
        </li>
        <li>
          <NavLink to="/news" className={linkClassName} onClick={closeMobileMenu}>
            News
          </NavLink>
        </li>
        <li>
          <NavLink to="/about" className={linkClassName} onClick={closeMobileMenu}>
            About
          </NavLink>
        </li>
        <li>
          <NavLink to="/datalist" className={linkClassName} onClick={closeMobileMenu}>
            DataList
          </NavLink>
        </li>
        <li>
          <NavLink to="/atlas" className={`${linkClassName} ${buttonClassName}`} onClick={closeMobileMenu}>
            To the Map
          </NavLink>
        </li>

        {user ? (
          <>
            <li>
              <span className="nav__link welcome-message">
                Welcome, {user.username}
              </span>
            </li>

            {user.roles?.includes("ROLE_ADMIN") && (
              <li>
                <NavLink
                  to="/admin-panel"
                  className={linkClassName}
                  onClick={closeMobileMenu}
                >
                  Admin Panel
                </NavLink>
              </li>
            )}

            <li>
              <button className="nav__link logout-button" onClick={handleLogout}>
                Logout
              </button>
            </li>
          </>
        ) : (
          <li>
            <NavLink to="/login" className={linkClassName} onClick={closeMobileMenu}>
              Login
            </NavLink>
          </li>
        )}
      </ul>
    );
  };

  return (
    <header className="header">
      <nav className="nav container">
        <NavLink to="/" className="nav__logo">
          Navigation Bar
        </NavLink>

        {isMobile && (
          <div className="nav__toggle" id="nav-toggle" onClick={toggleMenu}>
            <IoMenu />
          </div>
        )}

        {isMobile ? (
          <div className={`nav__menu ${isMenuOpen ? "show-menu" : ""}`} id="nav-menu">
            {renderNavLinks()}
            <div className="nav__close" id="nav-close" onClick={toggleMenu}>
              <IoClose />
            </div>
          </div>
        ) : (
          renderNavLinks()
        )}
      </nav>
    </header>
  );
};

export default NavbarHook;