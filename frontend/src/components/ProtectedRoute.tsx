import { useUser } from '../contexts/UserContext';
import { Navigate } from 'react-router-dom';
import { checkClearance, Roles, getHomeByRole } from '../lib/permissions';

interface ProtectedRouteProps {
  children: React.ReactNode;
  clearance: Roles;
}

const ProtectedRoute = (props: ProtectedRouteProps) => {
  const { children, clearance } = props;
  const { user } = useUser();
  if (!user || !user.role) {
    return <Navigate to="/login" />;
  }
  if (!checkClearance(user.role, clearance)) {
    return <Navigate to={getHomeByRole(user.role)} />;
  }
  return <>{children}</>;
};

export default ProtectedRoute;
