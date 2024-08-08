//styling
import './App.css'

//React
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import NavBar from './components/NavBar';

//pages
import About from './pages/About';
import Atlas from './pages/Atlas';
import Home from './pages/Home';


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
        </Routes>
      </div>      
    </>
  )
}

export default App
