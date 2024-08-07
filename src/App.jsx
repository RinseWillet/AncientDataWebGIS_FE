<<<<<<< HEAD
import { useState } from 'react'
=======
>>>>>>> 6fdfae28366b650eda40c739864defb9e24c5fe7
import './App.css'
import MapComponent from './components/MapComponent/MapComponent';


const App = () => {
  return (
<<<<<<< HEAD
    <>
      <div>
        <p>hoi</p>        
      </div>
      <MapComponent />
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
=======
    <div className='App'>     
        <Navbar />
        <Routes>
          <Route exact path='/' element={<Home />} />
          <Route exact path='/home' element={<Home />} />
          <Route exact path='/about' element={<About />} />
          <Route exact path='/atlas' element={<Atlas />} />
        </Routes>    

    </div>
  );
>>>>>>> 6fdfae28366b650eda40c739864defb9e24c5fe7
}

export default App
