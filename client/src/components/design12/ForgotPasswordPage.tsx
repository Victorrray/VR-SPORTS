import { ArrowLeft, Mail, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';

interface ForgotPasswordPageProps {
  onBack: () => void;
}

export function ForgotPasswordPage({ onBack }: ForgotPasswordPageProps) {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Password reset requested for:', email);
    setIsSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNiIgc3Ryb2tlPSJyZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMDMpIi8+PC9nPjwvc3ZnPg==')] opacity-40"></div>

      {/* Floating Orbs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>

      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Back Button */}
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-white/60 hover:text-white transition-colors group mb-6"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-semibold">Back to login</span>
          </button>

          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900/80 to-purple-900/30 backdrop-blur-xl border border-white/10 p-8 md:p-10">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-indigo-500/10"></div>
            
            <div className="relative space-y-6">
              {/* Logo */}
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center">
                  <span className="text-white font-bold text-lg">OS</span>
                </div>
                <span className="text-white font-bold text-xl">OddSightSeer</span>
              </div>

              {!isSubmitted ? (
                <>
                  {/* Header */}
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-purple-400/30 flex items-center justify-center mx-auto mb-4">
                      <Mail className="w-8 h-8 text-purple-400" />
                    </div>
                    <h3 className="text-white text-3xl font-bold mb-2">
                      Forgot password?
                    </h3>
                    <p className="text-white/60 font-semibold">
                      No worries, we'll send you reset instructions
                    </p>
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

                    {/* Submit Button */}
                    <button
                      type="submit"
                      className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white py-4 rounded-xl hover:from-purple-400 hover:to-indigo-400 transition-all font-bold text-center"
                    >
                      Reset password
                    </button>
                  </form>
                </>
              ) : (
                <>
                  {/* Success State */}
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-green-500/20 border border-emerald-400/30 flex items-center justify-center mx-auto">
                      <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                    </div>
                    <h3 className="text-white text-3xl font-bold">
                      Check your email
                    </h3>
                    <p className="text-white/60 font-semibold">
                      We've sent password reset instructions to <span className="text-white font-bold">{email}</span>
                    </p>

                    <div className="pt-4 space-y-3">
                      <button
                        onClick={onBack}
                        className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white py-4 rounded-xl hover:from-purple-400 hover:to-indigo-400 transition-all font-bold text-center"
                      >
                        Back to login
                      </button>

                      <p className="text-white/40 text-sm font-semibold">
                        Didn't receive the email?{' '}
                        <button
                          onClick={() => setIsSubmitted(false)}
                          className="text-purple-400 hover:text-purple-300 font-bold"
                        >
                          Click to resend
                        </button>
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}