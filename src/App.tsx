import { Suspense, lazy } from 'react';
import './App.css';
import 'leaflet/dist/leaflet.css';
import { Route, Routes } from 'react-router-dom';
import NavbarHook from './components/NavBarHook/NavbarHook';
import Footer from './components/Footer/Footer';
import AdminRoute from './components/Routes/AdminRoute';

const About = lazy(() => import('./pages/About'));
const Atlas = lazy(() => import('./pages/Atlas'));
const Home = lazy(() => import('./pages/Home'));
const News = lazy(() => import('./pages/News'));
const RoadInfo = lazy(() => import('./pages/RoadInfo'));
const SiteInfo = lazy(() => import('./pages/SiteInfo'));
const DataList = lazy(() => import('./pages/DataList'));
const NoPage = lazy(() => import('./pages/NoPage'));
const LoginRegister = lazy(() => import('./pages/LoginRegister'));
const AdminPanel = lazy(() => import('./pages/AdminPanel'));

const App = () => {
  return (
    <div className="App">
      <NavbarHook />

      <Suspense fallback={<div className="pagebox">Loading...</div>}>
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
      </Suspense>

      <Footer />
    </div>
  );
};

export default App;

