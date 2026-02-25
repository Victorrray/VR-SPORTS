import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/SimpleAuth';

const PrivateRoute = ({ children }) => {
  const { user, authLoading } = useAuth();
  const location = useLocation();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center relative overflow-hidden">
        {/* Animated Background Orbs */}
        <div className="absolute inset-0 pointer-events-none">
          <div 
            className="absolute top-20 -left-20 w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-3xl"
            style={{
              animation: 'pulse 4s ease-in-out infinite',
            }}
          />
          <div 
            className="absolute bottom-20 -right-20 w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-3xl"
            style={{
              animation: 'pulse 5s ease-in-out infinite',
              animationDelay: '1s',
            }}
          />
          <div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-violet-600/10 rounded-full blur-3xl"
            style={{
              animation: 'pulse 3s ease-in-out infinite',
              animationDelay: '0.5s',
            }}
          />
        </div>

        {/* Grid Pattern */}
        <div 
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(139, 92, 246, 0.03) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(139, 92, 246, 0.03) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
          }}
        />

        {/* Loading Content */}
        <div className="relative z-10 flex flex-col items-center gap-8">
          {/* Logo */}
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-2xl shadow-purple-500/40 animate-pulse">
            <span className="text-white font-bold text-3xl">OS</span>
          </div>

          {/* Spinner */}
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-4 border-white/10 border-t-purple-500 animate-spin" />
            <div className="absolute inset-0 w-12 h-12 rounded-full border-4 border-transparent border-b-violet-400 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
          </div>

          {/* Text */}
          <div className="text-center space-y-2">
            <p className="text-white font-semibold text-lg">Authenticating</p>
            <p className="text-white/50 text-sm">Please wait...</p>
          </div>

          {/* Loading dots */}
          <div className="flex gap-1.5">
            <div className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 rounded-full bg-violet-500 animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>

        {/* CSS for pulse animation */}
        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 0.2; transform: scale(1); }
            50% { opacity: 0.3; transform: scale(1.1); }
          }
        `}</style>
      </div>
    );
  }

  if (!user) {
    // Redirect unauthenticated users to the landing page (never force-login)
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  return children;
};

export default PrivateRoute;
