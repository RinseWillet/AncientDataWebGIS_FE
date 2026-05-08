import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAppSelector } from '../../app/hooks';
import { selectAuthUser } from '../../features/authentication/authSelectors';

interface PrivateRouteProps {
  children: ReactNode;
}

const PrivateRoute = ({ children }: PrivateRouteProps) => {
  const user = useAppSelector(selectAuthUser);

  return user ? <>{children}</> : <Navigate to="/login" />;
};

export default PrivateRoute;

