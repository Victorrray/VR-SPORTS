import { Lock, AlertCircle } from 'lucide-react';
import { useState } from 'react';

export function MaintenanceGate({ children }) {
  const [isUnlocked, setIsUnlocked] = useState(() => {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem('maintenance_unlocked') === 'true';
  });
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password === '1234') {
      sessionStorage.setItem('maintenance_unlocked', 'true');
      setIsUnlocked(true);
      setError('');
      setPassword('');
    } else {
      setError('Incorrect password');
      setPassword('');
    }
  };

  // ✅ Allow login page to bypass maintenance
  if (typeof window !== 'undefined' && window.location.pathname === '/login') {
    return children;
  }

  if (isUnlocked) {
    return children;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNiIgc3Ryb2tlPSJyZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMDMpIi8+PC9nPjwvc3ZnPg==')] opacity-40"></div>

      {/* Floating Orbs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-md">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900/80 to-purple-900/30 backdrop-blur-xl border border-white/10 p-8 md:p-10 shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-indigo-500/10"></div>
          
          <div className="relative space-y-8">
            {/* Icon */}
            <div className="flex justify-center">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30">
                <AlertCircle className="w-8 h-8 text-amber-400" />
              </div>
            </div>

            {/* Header */}
            <div className="text-center space-y-3">
              <h1 className="text-white text-4xl font-bold">
                Under Maintenance
              </h1>
              <p className="text-white/60 font-semibold">
                We're making improvements to OddSightSeer. Site will go live Friday the 14th!
              </p>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-950/50 border border-white/5">
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></div>
                <span className="text-white/70 font-semibold text-sm">Scheduled Maintenance in Progress</span>
              </div>
            </div>

            {/* Password Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-white/70 font-semibold mb-2 text-sm">
                  Access Code
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter access code"
                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-950/50 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-purple-500/50 transition-colors"
                    autoFocus
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
                  <p className="text-red-400 font-semibold text-sm">{error}</p>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-bold hover:from-purple-400 hover:to-indigo-400 transition-all shadow-lg shadow-purple-500/30"
              >
                Unlock
              </button>
            </form>

            {/* Footer */}
            <div className="text-center">
              <p className="text-white/40 text-xs font-semibold">
                Expected completion: Soon
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
