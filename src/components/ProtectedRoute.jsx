import { useSelector } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';
import { selectIsAuthed, selectRole } from '../features/auth/authSlice.js';

// Requires authentication; redirects to /login preserving the target.
export const ProtectedRoute = ({ children }) => {
  const isAuthed = useSelector(selectIsAuthed);
  const location = useLocation();
  if (!isAuthed) return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
};

// Requires one of the given roles; otherwise bounces to the dashboard.
export const RoleRoute = ({ roles, children }) => {
  const role = useSelector(selectRole);
  if (!roles.includes(role)) return <Navigate to="/dashboard" replace />;
  return children;
};
