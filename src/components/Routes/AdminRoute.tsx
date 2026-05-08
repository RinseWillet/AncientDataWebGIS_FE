import type { ReactNode } from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { selectIsAdmin } from '../../features/authentication/authSelectors';

interface AdminRouteProps {
  children: ReactNode;
}

const AdminRoute = ({ children }: AdminRouteProps) => {
  const isAdmin = useSelector(selectIsAdmin);

  return isAdmin ? <>{children}</> : <Navigate to="/login" />;
};

export default AdminRoute;

