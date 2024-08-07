import './App.css'

const App = () => {
  return (
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
}

export default App
