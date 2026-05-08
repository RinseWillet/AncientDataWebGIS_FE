import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { selectIsAdmin } from '../../features/authentication/authSelectors';

const AdminRoute = ({ children }) => {
  const isAdmin = useSelector(selectIsAdmin);

  return isAdmin ? children : <Navigate to="/login" />;
};

AdminRoute.propTypes = {
  children: PropTypes.node.isRequired,
};

export default AdminRoute;
