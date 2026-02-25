import { ArrowLeft, Mail, CheckCircle2, ChevronRight, KeyRound } from 'lucide-react';
import { useState } from 'react';
import { motion } from 'framer-motion';

interface ForgotPasswordPageProps {
  onBack: () => void;
}

export function ForgotPasswordPage({ onBack }: ForgotPasswordPageProps) {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('Password reset requested for:', email);
    setIsLoading(false);
    setIsSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden">
      {/* Animated Background Orbs */}
      <div className="absolute inset-0 pointer-events-none">
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
        <motion.div 
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Back Button */}
          <motion.button 
            onClick={onBack}
            className="flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-8 group"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            whileHover={{ x: -5 }}
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-semibold">Back to login</span>
          </motion.button>

          {/* Form Card */}
          <div className="relative">
            {/* Glow Effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/20 to-violet-500/20 rounded-[2rem] blur-xl" />
            
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 p-8 md:p-10 shadow-2xl">
              {/* Gradient overlay */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-violet-500 to-indigo-500" />
              
              <div className="relative space-y-6">
                {!isSubmitted ? (
                  <>
                    {/* Header */}
                    <div className="text-center">
                      <motion.div 
                        className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-purple-500/30"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring", stiffness: 200 }}
                      >
                        <KeyRound className="w-10 h-10 text-white" />
                      </motion.div>
                      <motion.h3 
                        className="text-white text-2xl md:text-3xl font-extrabold mb-2"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                      >
                        Forgot password?
                      </motion.h3>
                      <p className="text-white/50 font-medium">
                        No worries, we'll send you reset instructions
                      </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                      {/* Email */}
                      <div className="space-y-2">
                        <label className="text-white/70 font-semibold text-xs uppercase tracking-wider">Email address</label>
                        <div className="relative group">
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="your@email.com"
                            className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500/50 focus:bg-white/10 transition-all font-medium group-hover:border-white/20"
                            required
                          />
                          <div className="absolute right-4 top-1/2 -translate-y-1/2">
                            <Mail className="w-5 h-5 text-white/30" />
                          </div>
                        </div>
                      </div>

                      {/* Submit Button */}
                      <motion.button
                        type="submit"
                        disabled={isLoading}
                        className="w-full relative overflow-hidden bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 text-white py-4 rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed font-bold text-center shadow-xl shadow-purple-500/25 flex items-center justify-center gap-2 group"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <span className="relative z-10 flex items-center gap-2">
                          {isLoading ? 'Sending...' : 'Reset password'}
                          <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </span>
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-purple-500 via-violet-500 to-indigo-500"
                          initial={{ x: '-100%' }}
                          whileHover={{ x: 0 }}
                          transition={{ duration: 0.3 }}
                        />
                      </motion.button>
                    </form>
                  </>
                ) : (
                  <>
                    {/* Success State */}
                    <motion.div 
                      className="text-center space-y-6"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                    >
                      <motion.div 
                        className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/30"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 200, damping: 15 }}
                      >
                        <CheckCircle2 className="w-10 h-10 text-white" />
                      </motion.div>
                      
                      <div className="space-y-2">
                        <h3 className="text-white text-2xl md:text-3xl font-extrabold">
                          Check your email
                        </h3>
                        <p className="text-white/50 font-medium">
                          We've sent password reset instructions to
                        </p>
                        <p className="text-purple-400 font-bold break-all">
                          {email}
                        </p>
                      </div>

                      <div className="bg-slate-950/50 border border-white/10 rounded-2xl p-4 space-y-2">
                        <p className="text-white/60 text-sm font-medium">
                          Click the link in your email to reset your password.
                        </p>
                        <p className="text-white/40 text-xs">
                          Check your spam folder if you don't see it.
                        </p>
                      </div>

                      <div className="pt-2 space-y-4">
                        <motion.button
                          onClick={onBack}
                          className="w-full bg-gradient-to-r from-purple-600 to-violet-600 text-white py-4 rounded-2xl font-bold shadow-xl shadow-purple-500/25 flex items-center justify-center gap-2 group"
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                        >
                          Back to login
                          <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </motion.button>

                        <p className="text-white/40 text-sm font-medium">
                          Didn't receive the email?{' '}
                          <button
                            onClick={() => setIsSubmitted(false)}
                            className="text-purple-400 hover:text-purple-300 font-bold transition-colors"
                          >
                            Click to resend
                          </button>
                        </p>
                      </div>
                    </motion.div>
                  </>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}