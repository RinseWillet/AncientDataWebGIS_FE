import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAppSelector } from '../../app/hooks';
import { selectIsAdmin } from '../../features/authentication/authSelectors';

interface AdminRouteProps {
  children: ReactNode;
}

const AdminRoute = ({ children }: AdminRouteProps) => {
  const isAdmin = useAppSelector(selectIsAdmin);

  return isAdmin ? <>{children}</> : <Navigate to="/login" />;
};

export default AdminRoute;

