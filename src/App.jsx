//styling
import './App.css'
import 'leaflet/dist/leaflet.css';

//React
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import NavBar from './components/NavBar';

//pages
import About from './pages/About';
import Atlas from './pages/Atlas';
import Home from './pages/Home';
import DataList from './pages/DataList';


const App = () => {
  return (
    <>
      <div className = 'App'>
        <NavBar />
        <Routes>
          <Route exact path='/' element={<Home />} />
          <Route exact path='/home' element={<Home />} />
          <Route exact path='/about' element={<About />} />
          <Route exact path='/atlas' element={<Atlas />} />
          <Route exact path='/datalist' element={<DataList />} />
        </Routes>
      </div>      
    </>
  )
}

export default App
