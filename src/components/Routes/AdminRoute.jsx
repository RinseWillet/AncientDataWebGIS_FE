import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';

const AdminRoute = ({ children }) => {
  const { user } = useSelector((state) => state.auth);
  const isAdmin = user?.roles?.includes("ROLE_ADMIN");

  return isAdmin ? children : <Navigate to="/login" />;
};

export default AdminRoute;