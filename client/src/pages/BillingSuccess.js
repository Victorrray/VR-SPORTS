import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Check, ArrowRight } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const BillingSuccess = () => {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    // Simple timeout to show success state
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">Processing your upgrade...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-center border border-white/20">
        <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <Check size={32} className="text-white" />
        </div>
        
        <h1 className="text-2xl font-bold text-white mb-4">
          Welcome to Platinum!
        </h1>
        
        <p className="text-gray-300 mb-6">
          Your subscription has been activated successfully. You now have access to all premium features.
        </p>
        
        <div className="space-y-3 mb-8">
          <div className="flex items-center text-sm text-gray-300">
            <Check size={16} className="text-green-400 mr-2" />
            Advanced +EV alerts
          </div>
          <div className="flex items-center text-sm text-gray-300">
            <Check size={16} className="text-green-400 mr-2" />
            Player props analysis
          </div>
          <div className="flex items-center text-sm text-gray-300">
            <Check size={16} className="text-green-400 mr-2" />
            Custom bankroll tracking
          </div>
          <div className="flex items-center text-sm text-gray-300">
            <Check size={16} className="text-green-400 mr-2" />
            Priority support
          </div>
        </div>
        
        <Link
          to="/sportsbooks"
          className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-200"
        >
          Start Using Premium Features
          <ArrowRight size={16} className="ml-2" />
        </Link>
        
        {sessionId && (
          <p className="text-xs text-gray-400 mt-4">
            Session ID: {sessionId}
          </p>
        )}
      </div>
    </div>
  );
};

export default BillingSuccess;
