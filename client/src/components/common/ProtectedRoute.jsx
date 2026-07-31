import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

/**
 * Higher Order Component to protect routes.
 * 
 * @param {boolean} adminOnly - If true, requires the user to have the 'admin' role.
 * @param {string} redirectPath - Where to redirect if unauthorized (default '/login').
 */
const ProtectedRoute = ({ adminOnly = false, redirectPath = '/login' }) => {
  const { isAuthenticated, user, isLoading } = useSelector((state) => state.auth);
  const location = useLocation();

  if (isLoading) {
    // Show a loading spinner or skeleton here if needed
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-dark-deep">
        <svg className="animate-spin h-10 w-10 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect them to the /login page, but save the current location they were
    // trying to go to when they were redirected. This allows us to send them
    // along to that page after they login, which is a nicer user experience
    // than dropping them off on the home page.
    return <Navigate to={redirectPath} state={{ from: location }} replace />;
  }

  if (adminOnly && user?.role !== 'admin') {
    // If admin is required but user is not admin, redirect to home
    return <Navigate to="/" replace />;
  }

  // If authorized, render the child routes (Outlet)
  return <Outlet />;
};

export default ProtectedRoute;
