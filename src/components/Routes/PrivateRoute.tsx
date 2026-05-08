import type { ReactNode } from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { selectAuthUser } from '../../features/authentication/authSelectors';

interface PrivateRouteProps {
  children: ReactNode;
}

const PrivateRoute = ({ children }: PrivateRouteProps) => {
  const user = useSelector(selectAuthUser);

  return user ? <>{children}</> : <Navigate to="/login" />;
};

export default PrivateRoute;

