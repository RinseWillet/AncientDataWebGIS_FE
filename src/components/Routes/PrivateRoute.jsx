import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { selectAuthUser } from '../../features/authentication/authSelectors';

const PrivateRoute = ({ children }) => {
  const user = useSelector(selectAuthUser);
  return user ? children : <Navigate to="/login" />;
};

PrivateRoute.propTypes = {
  children: PropTypes.node.isRequired,
};

export default PrivateRoute;
