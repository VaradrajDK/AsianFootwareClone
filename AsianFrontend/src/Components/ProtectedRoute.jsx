// Components/ProtectedRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const user = useSelector((state) => state.user.userInfo);

  console.log("ProtectedRoute - User:", user);
  console.log("ProtectedRoute - Allowed roles:", allowedRoles);

  // If no user, redirect to login
  if (!user) {
    console.log("No user, redirecting to login");
    return <Navigate to="/login" replace />;
  }

  // If user role is not in allowed roles, redirect to home
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    console.log("User role not allowed, redirecting to home");
    return <Navigate to="/" replace />;
  }

  // User is authenticated and authorized
  console.log("User authorized, rendering children");
  return children;
};

export default ProtectedRoute;
