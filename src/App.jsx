import { useState } from 'react'
import './App.css'
import MapComponent from './components/MapComponent/MapComponent';


function App() {
  const [count, setCount] = useState(0)

  return (
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
}

export default App
