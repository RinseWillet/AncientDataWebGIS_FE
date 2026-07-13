import { useParams, useNavigate, useLocation } from 'react-router-dom';
import MapComponent from '../components/MapComponent/MapComponent';
import './Atlas.css';

const Atlas = () => {
  // the Atlas page can be called with or without params. The params
  // denote a specific query for a road or site from the RoadInfo or SiteInfo pages
  const { id } = useParams();

  //hook for navigation to go back to DataList or go to Atlas page
  const navigate = useNavigate();

  //location.state carries the last queried site/road so the plain atlas
  //view can stay zoomed to it after closing (without re-selecting/
  //highlighting it — the user is free to pan away immediately)
  const location = useLocation();
  const lastQuery = location.state?.lastQuery;

  //back button when map is queried from DataList and SiteInfo/RoadInfo pages
  const backButtonHandler = () => {
    if (id.includes('road')) {
      navigate('/datalist/roadinfo/' + id.split('_').pop());
    } else if (id.includes('site')) {
      navigate('/datalist/siteinfo/' + id.split('_').pop());
    }
  };

  if (typeof id == 'undefined') {
    return (
      <div className="pagebox">
        <MapComponent focusItem={lastQuery} adjustMapHeight={false} />
      </div>
    );
  } else {
    let queryData = id;

    //this catches incompatible params
    if (!(queryData.includes('road_') || queryData.includes('site_'))) {
      return (
        <div className="pagebox">
          <MapComponent queryItem="" adjustMapHeight={false} />
        </div>
      );
    }

    let query = {
      type: '',
      id: '',
    };

    let queryId = queryData.split('_').pop();

    if (queryData.includes('road_')) {
      query = {
        type: 'road',
        id: queryId,
      };
    } else if (queryData.includes('site_')) {
      query = {
        type: 'site',
        id: queryId,
      };
    }

    //close button: drop back to the plain atlas route, but keep the map
    //zoomed to the item that was just closed (no highlight, free to pan)
    const closeButtonHandler = () => {
      navigate('/atlas', { state: { lastQuery: query } });
    };

    return (
      <div className="pagebox">
        <MapComponent queryItem={query} adjustMapHeight={false} />
        <div className="atlas-actions">
          <button className="back-btn" onClick={backButtonHandler}>
            BACK
          </button>
          <button className="map-btn atlas-close-btn" onClick={closeButtonHandler}>
            CLOSE
          </button>
        </div>
      </div>
    );
  }
};

export default Atlas;
