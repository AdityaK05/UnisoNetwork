import React from 'react';
import { useAuth } from '../hooks/AuthContext';
import { useLocation } from 'wouter';
import { useEffect } from 'react';

// Higher Order Component for route protection
function withAuth<P extends object>(WrappedComponent: React.ComponentType<P>) {
  const AuthenticatedComponent: React.FC<P> = (props) => {
    const { user, loading } = useAuth();
    const [, setLocation] = useLocation();

    useEffect(() => {
      // If not loading and user is null, redirect to login
      if (!loading && !user) {
        setLocation('/login');
      }
    }, [user, loading, setLocation]);

    // Show loading spinner while checking authentication
    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-400 to-blue-500">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white"></div>
        </div>
      );
    }

    // If user is not authenticated, don't render the component (redirect will happen)
    if (!user) {
      return null;
    }

    // If user is authenticated, render the protected component
    return <WrappedComponent {...props} />;
  };

  // Set display name for better debugging
  AuthenticatedComponent.displayName = `withAuth(${WrappedComponent.displayName || WrappedComponent.name})`;

  return AuthenticatedComponent;
}

export default withAuth;
