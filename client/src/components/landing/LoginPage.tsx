import { ArrowLeft, Eye, EyeOff, Sparkles, TrendingUp, Zap } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../hooks/SimpleAuth';
import { useNavigate } from 'react-router-dom';

interface LoginPageProps {
  onBack: () => void;
  onSignUp: () => void;
  onForgotPassword: () => void;
}

export function LoginPage({ onBack, onSignUp, onForgotPassword }: LoginPageProps) {
  const navigate = useNavigate();
  const auth = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        // Login flow
        await auth?.signIn(email, password);
        console.log('✅ Login successful');
        navigate('/dashboard');
      } else {
        // Sign up flow
        await auth?.signUp(email, password);
        console.log('✅ Sign up successful');
        navigate('/dashboard');
      }
    } catch (err: any) {
      console.error('❌ Auth error:', err);
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    { icon: TrendingUp, value: '4.2%', label: 'Avg Edge' },
    { icon: Sparkles, value: '40+', label: 'Sportsbooks' },
    { icon: Zap, value: '24/7', label: 'Live Updates' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden">
      {/* Grid Background - Full Width */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(168, 85, 247, 0.07) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(168, 85, 247, 0.07) 1px, transparent 1px)
          `,
          backgroundSize: '24px 24px',
        }}
      />

      {/* Floating Orbs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>

      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
          {/* Left Side - Branding & Stats */}
          <div className="hidden lg:block space-y-8">
            {/* Logo & Tagline */}
            <div className="space-y-6">
              <button 
                onClick={onBack}
                className="flex items-center gap-2 text-white/60 hover:text-white transition-colors group"
              >
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                <span className="font-semibold">Back to home</span>
              </button>

              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center">
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
                Join thousands of bettors using data-driven insights to identify profitable opportunities across 40+ sportsbooks.
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              {stats.map((stat, idx) => (
                <div 
                  key={idx}
                  className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900/60 to-purple-900/20 backdrop-blur-sm border border-white/10 p-6"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-indigo-500/5"></div>
                  <div className="relative">
                    <stat.icon className="w-6 h-6 text-purple-400 mb-3" />
                    <div className="text-white text-2xl font-bold mb-1">{stat.value}</div>
                    <div className="text-white/60 text-sm font-semibold">{stat.label}</div>
                  </div>
                </div>
              ))}
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
              onClick={onBack}
              className="lg:hidden flex items-center gap-2 text-white/60 hover:text-white transition-colors group mb-6"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              <span className="font-semibold">Back to home</span>
            </button>

            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900/80 to-purple-900/30 backdrop-blur-xl border border-white/10 p-8 md:p-10">
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
                    onClick={() => setIsLogin(true)}
                    className={`flex-1 py-3 rounded-xl font-bold transition-all text-center ${
                      isLogin
                        ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-lg shadow-purple-500/30'
                        : 'text-white/50 hover:text-white/80'
                    }`}
                  >
                    Login
                  </button>
                  <button
                    onClick={onSignUp}
                    className={`flex-1 py-3 rounded-xl font-bold transition-all text-center ${
                      !isLogin
                        ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-lg shadow-purple-500/30'
                        : 'text-white/50 hover:text-white/80'
                    }`}
                  >
                    Sign up
                  </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Email */}
                  <div className="space-y-2">
                    <label className="text-white/90 font-bold text-sm">Email address</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="w-full px-4 py-3.5 bg-slate-950/50 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all font-semibold"
                      required
                    />
                  </div>

                  {/* Password */}
                  <div className="space-y-2">
                    <label className="text-white/90 font-bold text-sm">Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-4 py-3.5 bg-slate-950/50 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all font-semibold pr-12"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {/* Remember & Forgot */}
                  {isLogin && (
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <input
                          type="checkbox"
                          className="w-4 h-4 rounded bg-slate-950/50 border-white/20 text-purple-500 focus:ring-2 focus:ring-purple-500/50"
                        />
                        <span className="text-white/70 group-hover:text-white/90 font-semibold text-sm">
                          Remember me
                        </span>
                      </label>
                      <button
                        type="button"
                        onClick={onForgotPassword}
                        className="text-purple-400 hover:text-purple-300 font-semibold text-sm"
                      >
                        Forgot password?
                      </button>
                    </div>
                  )}

                  {/* Error Message */}
                  {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
                      <p className="text-red-400 font-semibold text-sm">{error}</p>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white py-4 rounded-xl hover:from-purple-400 hover:to-indigo-400 transition-all font-bold text-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Loading...' : (isLogin ? 'Login to your account' : 'Create your account')}
                  </button>

                  {/* Divider */}
                  <div className="relative flex items-center justify-center">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-white/10"></div>
                    </div>
                    <div className="relative px-4 text-white/40 font-semibold text-sm">
                      OR CONTINUE WITH
                    </div>
                  </div>

                  {/* Social Login */}
                  <button
                    type="button"
                    className="w-full flex items-center justify-center gap-3 px-4 py-3.5 bg-slate-950/50 border border-white/10 rounded-xl text-white/90 hover:bg-slate-900/70 hover:border-white/20 transition-all font-bold"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Google
                  </button>

                  {/* Terms */}
                  <p className="text-center text-white/40 text-xs font-semibold">
                    By continuing, you agree to our{' '}
                    <a href="#" className="text-purple-400 hover:text-purple-300">Terms of Service</a>
                    {' '}and{' '}
                    <a href="#" className="text-purple-400 hover:text-purple-300">Privacy Policy</a>
                  </p>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}