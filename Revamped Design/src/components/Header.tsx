import { Home, BarChart3, TrendingUp, Menu, X } from 'lucide-react';
import { useState } from 'react';

interface HeaderProps {
  onLoginClick: () => void;
  onDashboardClick: () => void;
}

export function Header({ onLoginClick, onDashboardClick }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="pt-4 px-4">
      <div className="container mx-auto">
        <div className="bg-slate-950/60 backdrop-blur-xl border border-white/10 rounded-full px-4 md:px-6 py-3 shadow-lg shadow-purple-500/10">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-2 md:gap-3">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-500/50">
                <span className="text-white text-xs md:text-sm font-bold">OS</span>
              </div>
              <span className="bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent text-sm md:text-base font-bold">
                OddSightSeer
              </span>
            </div>

            {/* Desktop Navigation - Center */}
            <nav className="hidden lg:flex items-center gap-1">
              <button onClick={onDashboardClick} className="px-4 py-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-all text-sm font-bold">
                Home
              </button>
              <a href="#picks" className="px-4 py-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-all text-sm font-bold">
                Picks
              </a>
              <a href="#odds" className="px-4 py-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-all text-sm font-bold">
                Odds
              </a>
              <a href="#features" className="px-4 py-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-all text-sm font-bold">
                Features
              </a>
              <a href="#pricing" className="px-4 py-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-all text-sm font-bold">
                Pricing
              </a>
              <a href="#faq" className="px-4 py-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-all text-sm font-bold">
                FAQ
              </a>
            </nav>

            {/* Desktop Buttons - Right */}
            <div className="hidden lg:flex items-center gap-3">
              <button className="px-5 py-2.5 bg-white text-slate-900 rounded-full hover:bg-white/90 transition-all text-sm font-semibold" onClick={onLoginClick}>
                Sign In
              </button>
              <button className="px-5 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-full hover:from-purple-400 hover:to-indigo-400 transition-all shadow-lg shadow-purple-500/30 backdrop-blur-sm border border-purple-400/20 text-sm font-semibold">
                Get Started →
              </button>
            </div>

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
              <button onClick={onDashboardClick} className="px-4 py-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-all font-bold text-left">
                Home
              </button>
              <a href="#picks" className="px-4 py-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-all font-bold">
                Picks
              </a>
              <a href="#odds" className="px-4 py-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-all font-bold">
                Odds
              </a>
              <a href="#features" className="px-4 py-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-all font-bold">
                Features
              </a>
              <a href="#pricing" className="px-4 py-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-all font-bold">
                Pricing
              </a>
              <a href="#faq" className="px-4 py-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-all font-bold">
                FAQ
              </a>
              <div className="border-t border-white/10 my-2"></div>
              <button className="px-4 py-2 bg-white text-slate-900 hover:bg-white/90 rounded-full transition-all font-bold text-left" onClick={onLoginClick}>
                Sign In
              </button>
              <button className="mt-2 px-5 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-full hover:from-purple-400 hover:to-indigo-400 transition-all shadow-lg shadow-purple-500/30 text-sm font-bold">
                Get Started →
              </button>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}