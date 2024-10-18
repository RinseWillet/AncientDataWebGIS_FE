//styling
import './App.css'
import 'leaflet/dist/leaflet.css';

//React
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import NavBar from './components/NavBar/NavBar';
import NavbarHook from "./components/NavBarHook/NavbarHook";
import Footer from './components/Footer/Footer';

//pages
import About from './pages/About';
import Atlas from './pages/Atlas';
import Home from './pages/Home';
import News from './pages/News';
import RoadInfo from './pages/RoadInfo';
import SiteInfo from './pages/SiteInfo';
import DataList from './pages/DataList';
import NoPage from './pages/NoPage';


const App = () => {
  return (
    <>
      <div className='App'>
        {/* <Navbar /> */}
        <NavbarHook />
        <Routes>
          <Route exact path='/' element={<Home />} />
          <Route exact path='/home' element={<Home />} />
          <Route exact path='/news' element={<News />} />
          <Route exact path='/about' element={<About />} />
          <Route exact path='/atlas' element={<Atlas />} />
          <Route exact path='/atlas/:id?' element={<Atlas />} />
          <Route exact path='/datalist' element={<DataList />} />
          <Route exact path='/datalist/roadinfo/:id?' element={<RoadInfo />} />
          <Route exact path='/datalist/siteinfo/:id?' element={<SiteInfo />} />
          <Route exact path='/nopage' element={<NoPage />} />
        </Routes>
        <Footer />
      </div>
    </>
  )
}

export default App
