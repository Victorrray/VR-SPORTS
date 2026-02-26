import { ArrowLeft, Eye, EyeOff, Mail, Shield, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../hooks/SimpleAuth';
import { motion } from 'framer-motion';

interface SignUpPageProps {
  onBack: () => void;
  onLogin: () => void;
}

export function SignUpPage({ onBack, onLogin }: SignUpPageProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  
  const { signInWithGoogle, signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      await signUp(email, password);
      console.log('Sign up submitted:', { name, email });
      setSignupSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to sign up');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden">
      {/* Animated Background Orbs */}
      <div className="absolute inset-0">
        <motion.div 
          className="absolute top-20 -left-20 w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-3xl"
          animate={{ 
            scale: [1, 1.2, 1],
            x: [0, 30, 0],
            opacity: [0.2, 0.3, 0.2]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute bottom-20 -right-20 w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-3xl"
          animate={{ 
            scale: [1.2, 1, 1.2],
            x: [0, -30, 0],
            opacity: [0.2, 0.3, 0.2]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-violet-600/10 rounded-full blur-3xl"
          animate={{ 
            scale: [1, 1.3, 1],
            opacity: [0.1, 0.2, 0.1]
          }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
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

      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Side - Branding & Stats */}
          <motion.div 
            className="hidden lg:block space-y-10"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Back Button */}
            <motion.button 
              onClick={onBack}
              className="flex items-center gap-2 text-white/60 hover:text-white transition-colors group"
              whileHover={{ x: -5 }}
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-semibold">Back to home</span>
            </motion.button>

            {/* Logo */}
            <div className="flex items-center gap-4">
              <motion.div 
                className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-xl shadow-purple-500/30"
                whileHover={{ scale: 1.05, rotate: 5 }}
              >
                <span className="text-white font-bold text-2xl">OS</span>
              </motion.div>
              <div>
                <h1 className="text-white font-bold text-2xl">OddSightSeer</h1>
                <p className="text-white/50 font-medium">Sports Betting Analytics</p>
              </div>
            </div>

            {/* Headline */}
            <div className="space-y-6">
              <h2 className="text-white text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight">
                Start Winning{' '}
                <span className="bg-gradient-to-r from-purple-400 via-violet-400 to-indigo-400 bg-clip-text text-transparent">
                  Today
                </span>
              </h2>

              <p className="text-white/60 text-lg font-medium max-w-md">
                Join thousands of smart bettors using data-driven insights to find profitable opportunities across 45+ sportsbooks.
              </p>
            </div>

            {/* Trust Indicator */}
            <motion.div 
              className="flex items-center gap-3 text-white/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <Shield className="w-5 h-5 text-green-400" />
              <span className="text-sm font-medium">256-bit SSL encryption • SOC 2 compliant</span>
            </motion.div>
          </motion.div>

          {/* Right Side - Sign Up Form */}
          <motion.div 
            className="w-full max-w-md mx-auto lg:mx-0"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Mobile Back Button */}
            <button 
              onClick={onBack}
              className="lg:hidden flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-6"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-semibold">Back to home</span>
            </button>

            {/* Simple Form Card */}
            <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 md:p-8">
              <div className="space-y-6">
                  {/* Success State - Check Your Email */}
                  {signupSuccess ? (
                    <motion.div 
                      className="text-center py-8 space-y-6"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                    >
                      <motion.div 
                        className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-xl shadow-emerald-500/30"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 200, damping: 15 }}
                      >
                        <Mail className="w-10 h-10 text-white" />
                      </motion.div>
                      
                      <div className="space-y-3">
                        <h3 className="text-white text-2xl md:text-3xl font-extrabold">
                          Check Your Email
                        </h3>
                        <p className="text-white/60 font-medium text-lg">
                          We've sent a confirmation link to
                        </p>
                        <p className="text-purple-400 font-bold text-lg break-all">
                          {email}
                        </p>
                      </div>
                      
                      <div className="bg-slate-950/50 border border-white/10 rounded-2xl p-4 space-y-2">
                        <p className="text-white/60 text-sm font-medium">
                          Click the link in your email to activate your account.
                        </p>
                        <p className="text-white/40 text-xs">
                          Didn't receive it? Check your spam folder.
                        </p>
                      </div>
                      
                      <motion.button
                        type="button"
                        onClick={onLogin}
                        className="w-full bg-gradient-to-r from-purple-600 to-violet-600 text-white py-4 rounded-2xl font-bold shadow-xl shadow-purple-500/25 flex items-center justify-center gap-2 group"
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                      >
                        Go to Login
                        <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </motion.button>
                    </motion.div>
                  ) : (
                    <>
                      {/* Header */}
                      <div className="text-center mb-6">
                        <h3 className="text-white text-2xl font-bold mb-2">
                          Create your account
                        </h3>
                        <p className="text-white/50 text-sm">
                          Start finding +EV bets in minutes
                        </p>
                      </div>

                      {/* Error Message */}
                      {error && (
                        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center font-medium">
                          {error}
                        </div>
                      )}

                      {/* Tab Toggle */}
                      <div className="flex mb-6 p-1 bg-white/5 rounded-full border border-white/10">
                        <button
                          type="button"
                          onClick={onLogin}
                          className="flex-1 py-2.5 rounded-full font-semibold text-sm transition-all text-white/50 hover:text-white/70"
                        >
                          Sign In
                        </button>
                        <button
                          type="button"
                          className="flex-1 py-2.5 rounded-full font-semibold text-sm transition-all bg-purple-600 text-white"
                        >
                          Sign Up
                        </button>
                      </div>

                      {/* Form */}
                      <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Name */}
                        <div>
                          <label className="text-white/70 font-medium text-sm mb-1.5 block">First Name</label>
                          <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="John"
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500/50 transition-all"
                            required
                          />
                        </div>

                        {/* Email */}
                        <div>
                          <label className="text-white/70 font-medium text-sm mb-1.5 block">Email</label>
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="your@email.com"
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500/50 transition-all"
                            required
                          />
                        </div>

                        {/* Password */}
                        <div>
                          <label className="text-white/70 font-medium text-sm mb-1.5 block">Password</label>
                          <div className="relative">
                            <input
                              type={showPassword ? 'text' : 'password'}
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              placeholder="••••••••"
                              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500/50 transition-all pr-12"
                              required
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                            >
                              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                          </div>
                          <p className="text-white/40 text-xs mt-1.5">Must be at least 8 characters</p>
                        </div>

                        {/* Terms Checkbox */}
                        <label className="flex items-start gap-3 cursor-pointer">
                          <div className="relative mt-0.5">
                            <input
                              type="checkbox"
                              checked={agreedToTerms}
                              onChange={(e) => setAgreedToTerms(e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-4 h-4 rounded border border-white/20 bg-white/5 peer-checked:bg-purple-600 peer-checked:border-transparent transition-all flex items-center justify-center">
                              {agreedToTerms && (
                                <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                          </div>
                          <span className="text-white/50 text-xs leading-relaxed">
                            I agree to the{' '}
                            <a href="/terms" className="text-purple-400 hover:text-purple-300">Terms</a>
                            {' & '}
                            <a href="/privacy" className="text-purple-400 hover:text-purple-300">Privacy Policy</a>
                          </span>
                        </label>

                        {/* Submit Button */}
                        <button
                          type="submit"
                          disabled={isLoading || !agreedToTerms}
                          className="w-full bg-purple-600 hover:bg-purple-500 text-white py-3.5 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-colors"
                        >
                          {isLoading ? 'Creating account...' : 'Create Account'}
                        </button>

                        {/* Divider */}
                        <div className="flex items-center gap-3 py-2">
                          <div className="flex-1 h-px bg-white/10"></div>
                          <span className="text-white/40 text-xs">or</span>
                          <div className="flex-1 h-px bg-white/10"></div>
                        </div>

                        {/* Google Sign Up */}
                        <button
                          type="button"
                          onClick={handleGoogleSignIn}
                          disabled={isLoading}
                          className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white hover:bg-white/10 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                          </svg>
                          {isLoading ? 'Signing up...' : 'Continue with Google'}
                        </button>

                        {/* Login Link */}
                        <p className="text-center text-white/40 text-xs pt-2">
                          Already have an account?{' '}
                          <button
                            type="button"
                            onClick={onLogin}
                            className="text-purple-400 hover:text-purple-300 font-medium"
                          >
                            Sign in
                          </button>
                        </p>
                      </form>
                    </>
                  )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}