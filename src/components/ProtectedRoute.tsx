import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { User } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRole: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRole }) => {
  const location = useLocation();
  const savedUser = localStorage.getItem('currentUser');

  if (!savedUser) {
    return <Navigate to={`/${allowedRole}/login`} state={{ from: location }} replace />;
  }

  const user: User = JSON.parse(savedUser);

  if (user.role !== allowedRole) {
    return <Navigate to={`/${user.role}/dashboard`} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
