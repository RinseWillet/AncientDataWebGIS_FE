import React from 'react';
import {
  Nav,
  NavLink,
  Bars,
  NavMenu,
  NavBtn,
  NavBtnLink
} from './NavBarElements';

const NavBar = () => {
  return (
    <>
      <Nav>
        <NavLink to='/'>
          <img src={('../../images/logo.svg')} alt='logo' />
        </NavLink>
        <Bars />
        <NavMenu>
          <NavLink to='/about' activestyle="true">
            About
          </NavLink>
          <NavLink to='/atlas' activestyle="true">
            Atlas
          </NavLink>
          <NavLink to='/home' activestyle="true">
            Home
          </NavLink>
        </NavMenu>
        <NavBtn>
          <NavBtnLink to='/signin'>Sign In</NavBtnLink>
        </NavBtn>
      </Nav>
    </>
  );
};

export default NavBar;