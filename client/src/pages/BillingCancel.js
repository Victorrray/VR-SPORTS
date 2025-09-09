import React from 'react';
import { Link } from 'react-router-dom';
import { X, ArrowLeft } from 'lucide-react';

const BillingCancel = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-center border border-white/20">
        <div className="w-16 h-16 bg-gray-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <X size={32} className="text-white" />
        </div>
        
        <h1 className="text-2xl font-bold text-white mb-4">
          Upgrade Cancelled
        </h1>
        
        <p className="text-gray-300 mb-8">
          No worries! You can upgrade to Platinum anytime to unlock premium features and advanced analytics.
        </p>
        
        <div className="space-y-3 mb-8">
          <Link
            to="/sportsbooks"
            className="block w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-200"
          >
            Continue with Free Access
          </Link>
          
          <Link
            to="/pricing"
            className="block w-full px-6 py-3 bg-white/10 text-white font-semibold rounded-lg hover:bg-white/20 transition-all duration-200 border border-white/20"
          >
            View Pricing Again
          </Link>
        </div>
        
        <Link
          to="/"
          className="inline-flex items-center text-sm text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={16} className="mr-1" />
          Back to Home
        </Link>
      </div>
    </div>
  );
};

export default BillingCancel;
