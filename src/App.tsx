import './App.css';
import 'leaflet/dist/leaflet.css';
import { Route, Routes } from 'react-router-dom';
import NavbarHook from './components/NavBarHook/NavbarHook';
import Footer from './components/Footer/Footer';
import AdminRoute from './components/Routes/AdminRoute';
import About from './pages/About';
import Atlas from './pages/Atlas';
import Home from './pages/Home';
import News from './pages/News';
import RoadInfo from './pages/RoadInfo';
import SiteInfo from './pages/SiteInfo';
import DataList from './pages/DataList';
import NoPage from './pages/NoPage';
import LoginRegister from './pages/LoginRegister';
import AdminPanel from './pages/AdminPanel';

const App = () => {
  return (
    <div className="App">
      <NavbarHook />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Home />} />
        <Route path="/news" element={<News />} />
        <Route path="/about" element={<About />} />
        <Route path="/login" element={<LoginRegister />} />
        <Route path="/atlas" element={<Atlas />} />
        <Route path="/atlas/:id?" element={<Atlas />} />
        <Route path="/datalist" element={<DataList />} />
        <Route path="/datalist/roadinfo/:id?" element={<RoadInfo />} />
        <Route path="/datalist/siteinfo/:id?" element={<SiteInfo />} />

        <Route
          path="/admin-panel"
          element={
            <AdminRoute>
              <AdminPanel />
            </AdminRoute>
          }
        />

        <Route path="*" element={<NoPage />} />
      </Routes>

      <Footer />
    </div>
  );
};

export default App;

