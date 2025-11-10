import { Menu, X, LogOut, User } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/SimpleAuth';

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { user, signOut } = useAuth() || {};

  const handleSignOut = async () => {
    if (signOut) {
      await signOut();
      navigate('/?signed_out=true');
    }
  };

  return (
    <header className="pt-4 px-4">
      <div className="container mx-auto">
        <div className="bg-slate-950/60 backdrop-blur-xl border border-white/10 rounded-full px-4 md:px-6 py-3 shadow-lg shadow-purple-500/10">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-2 md:gap-3 cursor-pointer" onClick={() => navigate('/')}>
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-500/50">
                <span className="text-white text-xs md:text-sm font-bold">OS</span>
              </div>
              <span className="bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent text-sm md:text-base font-bold">
                OddSightSeer
              </span>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-2">
              {!user ? (
                <>
                  <div className="flex items-center gap-1 bg-white/5 backdrop-blur-md border border-white/10 rounded-full p-1">
                    <a href="#features" className="px-4 py-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-all text-sm font-semibold">
                      Features
                    </a>
                    <a href="#pricing" className="px-4 py-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-all text-sm font-semibold">
                      Pricing
                    </a>
                    <a href="#faq" className="px-4 py-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-all text-sm font-semibold">
                      FAQ
                    </a>
                  </div>
                  <button onClick={() => navigate('/login')} className="ml-2 px-5 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-full hover:from-purple-400 hover:to-indigo-400 transition-all shadow-lg shadow-purple-500/30 backdrop-blur-sm border border-purple-400/20 text-sm font-semibold">
                    Get Started →
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-2 bg-white/5 backdrop-blur-md border border-white/10 rounded-full p-1">
                  <button onClick={() => navigate('/dashboard')} className="px-4 py-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-all text-sm font-semibold">
                    Dashboard
                  </button>
                  <button onClick={() => navigate('/account')} className="px-4 py-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-all text-sm font-semibold flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Account
                  </button>
                  <button onClick={handleSignOut} className="ml-2 px-5 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-full hover:from-red-400 hover:to-red-500 transition-all shadow-lg shadow-red-500/30 backdrop-blur-sm border border-red-400/20 text-sm font-semibold flex items-center gap-2">
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              )}
            </nav>

            {/* Mobile Menu Toggle */}
            <button 
              className="lg:hidden text-white p-1"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <nav className="lg:hidden mt-2 bg-slate-950/60 backdrop-blur-xl border border-white/10 rounded-3xl p-4 shadow-lg shadow-purple-500/10">
            <div className="flex flex-col gap-2">
              {!user ? (
                <>
                  <a href="#features" className="px-4 py-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-all font-semibold">
                    Features
                  </a>
                  <a href="#pricing" className="px-4 py-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-all font-semibold">
                    Pricing
                  </a>
                  <a href="#faq" className="px-4 py-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-all font-semibold">
                    FAQ
                  </a>
                  <button onClick={() => navigate('/login')} className="mt-2 px-5 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-full hover:from-purple-400 hover:to-indigo-400 transition-all shadow-lg shadow-purple-500/30 text-sm font-semibold">
                    Get Started →
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => { navigate('/dashboard'); setIsMenuOpen(false); }} className="px-4 py-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-all font-semibold">
                    Dashboard
                  </button>
                  <button onClick={() => { navigate('/account'); setIsMenuOpen(false); }} className="px-4 py-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-all font-semibold flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Account
                  </button>
                  <button onClick={handleSignOut} className="mt-2 px-5 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-full hover:from-red-400 hover:to-red-500 transition-all shadow-lg shadow-red-500/30 text-sm font-semibold flex items-center gap-2">
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </>
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
