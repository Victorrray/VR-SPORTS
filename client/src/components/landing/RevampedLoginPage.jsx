import { ArrowLeft, Eye, EyeOff, Sparkles, TrendingUp, Zap } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/SimpleAuth';

export function RevampedLoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const auth = useAuth();
  const { signIn, signUp } = auth || {};

  const stats = [
    { icon: TrendingUp, value: '4.2%', label: 'Avg Edge' },
    { icon: Sparkles, value: '39+', label: 'Sportsbooks' },
    { icon: Zap, value: '24/7', label: 'Live Updates' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const fn = isLogin ? signIn : signUp;
      const { data, error: authError } = await fn(email, password);
      
      if (authError) {
        setError(authError.message || 'Authentication failed');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNiIgc3Ryb2tlPSJyZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMDMpIi8+PC9nPjwvc3ZnPg==')] opacity-40"></div>

      {/* Floating Orbs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>

      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
          {/* Left Side - Branding & Stats */}
          <div className="hidden lg:block space-y-8">
            {/* Logo & Tagline */}
            <div className="space-y-6">
              <button 
                onClick={() => navigate('/')}
                className="flex items-center gap-2 text-white/60 hover:text-white transition-colors group"
              >
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                <span className="font-semibold">Back to home</span>
              </button>

              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-500/50">
                  <span className="text-white font-bold text-xl">OS</span>
                </div>
                <div>
                  <h1 className="text-white font-bold text-2xl">OddSightSeer</h1>
                  <p className="text-white/60 font-semibold">Sports Betting Analytics</p>
                </div>
              </div>

              <h2 className="text-white text-4xl md:text-5xl font-bold leading-tight">
                Find Your{' '}
                <span className="bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
                  Winning Edge
                </span>
              </h2>

              <p className="text-white/70 text-lg font-semibold">
                Join thousands of bettors using data-driven insights to identify profitable opportunities across 39+ sportsbooks.
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              {stats.map((stat, idx) => {
                const Icon = stat.icon;
                return (
                  <div 
                    key={idx}
                    className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900/60 to-purple-900/20 backdrop-blur-sm border border-white/10 p-6"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-indigo-500/5"></div>
                    <div className="relative">
                      <Icon className="w-6 h-6 text-purple-400 mb-3" />
                      <div className="text-white text-2xl font-bold mb-1">{stat.value}</div>
                      <div className="text-white/60 text-sm font-semibold">{stat.label}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Testimonial */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900/60 to-purple-900/20 backdrop-blur-sm border border-white/10 p-6">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-indigo-500/5"></div>
              <div className="relative">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500"></div>
                  <div>
                    <div className="text-white font-bold">Mike Chen</div>
                    <div className="text-white/60 text-sm font-semibold">Professional Bettor</div>
                  </div>
                </div>
                <p className="text-white/80 font-semibold italic">
                  "OddSightSeer helped me increase my ROI by 300%. The positive EV finder is a game-changer."
                </p>
              </div>
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className="w-full max-w-md mx-auto lg:mx-0">
            {/* Mobile Back Button */}
            <button 
              onClick={() => navigate('/')}
              className="lg:hidden flex items-center gap-2 text-white/60 hover:text-white transition-colors group mb-6"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              <span className="font-semibold">Back to home</span>
            </button>

            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900/80 to-purple-900/30 backdrop-blur-xl border border-white/10 p-8 md:p-10 shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-indigo-500/10"></div>
              
              <div className="relative space-y-6">
                {/* Mobile Logo */}
                <div className="lg:hidden flex items-center justify-center gap-2 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center">
                    <span className="text-white font-bold">OS</span>
                  </div>
                  <span className="text-white font-bold text-xl">OddSightSeer</span>
                </div>

                {/* Header */}
                <div className="text-center lg:text-left">
                  <h3 className="text-white text-3xl md:text-4xl font-bold mb-2">
                    {isLogin ? 'Welcome back' : 'Create account'}
                  </h3>
                  <p className="text-white/60 font-semibold">
                    {isLogin ? 'Enter your credentials to continue' : 'Start finding profitable bets today'}
                  </p>
                </div>

                {/* Tab Toggle */}
                <div className="flex gap-2 p-1 bg-slate-950/50 rounded-2xl border border-white/5">
                  <button
                    onClick={() => { setIsLogin(true); setError(''); }}
                    className={`flex-1 py-3 rounded-xl font-bold transition-all text-center ${
                      isLogin
                        ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-lg shadow-purple-500/30'
                        : 'text-white/50 hover:text-white/80'
                    }`}
                  >
                    Login
                  </button>
                  <button
                    onClick={() => { setIsLogin(false); setError(''); }}
                    className={`flex-1 py-3 rounded-xl font-bold transition-all text-center ${
                      !isLogin
                        ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-lg shadow-purple-500/30'
                        : 'text-white/50 hover:text-white/80'
                    }`}
                  >
                    Sign up
                  </button>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                    <p className="text-red-400 font-semibold text-sm">{error}</p>
                  </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Email */}
                  <div>
                    <label className="block text-white font-semibold mb-2">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full px-4 py-3 rounded-xl bg-slate-950/50 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-purple-500/50 transition-colors"
                      required
                    />
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-white font-semibold mb-2">Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-4 py-3 rounded-xl bg-slate-950/50 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-purple-500/50 transition-colors"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-bold hover:from-purple-400 hover:to-indigo-400 transition-all shadow-lg shadow-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Loading...' : (isLogin ? 'Sign in' : 'Create account')}
                  </button>
                </form>

                {/* Divider */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-white/10"></div>
                  <span className="text-white/60 text-sm font-semibold">or</span>
                  <div className="flex-1 h-px bg-white/10"></div>
                </div>

                {/* Social Buttons */}
                <button className="w-full py-3 rounded-xl bg-slate-950/50 border border-white/10 text-white font-semibold hover:border-white/20 transition-colors">
                  Continue with Google
                </button>

                {/* Terms */}
                <p className="text-center text-white/60 text-xs font-semibold">
                  By continuing, you agree to our{' '}
                  <a href="/terms" className="text-purple-400 hover:text-purple-300">Terms</a>
                  {' '}and{' '}
                  <a href="/privacy" className="text-purple-400 hover:text-purple-300">Privacy Policy</a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
