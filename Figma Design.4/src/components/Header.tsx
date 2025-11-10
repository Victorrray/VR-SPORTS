import { Menu, X } from 'lucide-react';
import { useState } from 'react';

interface HeaderProps {
  onLoginClick: () => void;
  onDashboardClick: () => void;
  onSignUpClick?: () => void;
}

export function Header({ onLoginClick, onDashboardClick, onSignUpClick }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="pt-4 px-4">
      <div className="container mx-auto">
        <div className="relative bg-slate-950/80 backdrop-blur-2xl border border-white/10 rounded-2xl md:rounded-3xl px-4 md:px-8 py-4 shadow-2xl shadow-purple-500/10">
          {/* Gradient border glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-purple-500/10 rounded-2xl md:rounded-3xl blur-xl -z-10"></div>
          
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl blur-md opacity-50"></div>
                <div className="relative w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center shadow-lg">
                  <span className="text-white text-sm md:text-base font-bold">OS</span>
                </div>
              </div>
              <div className="flex flex-col">
                <span className="bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent text-base md:text-lg font-bold leading-tight">
                  OddSightSeer
                </span>
                <span className="text-white/40 text-[10px] md:text-xs font-bold uppercase tracking-wider hidden sm:block">
                  Betting Analytics
                </span>
              </div>
            </div>

            {/* Desktop Navigation - Center */}
            <nav className="hidden lg:flex items-center gap-2">
              <button 
                onClick={onDashboardClick} 
                className="px-4 py-2.5 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all font-bold"
              >
                Dashboard
              </button>
              <a 
                href="#features" 
                className="px-4 py-2.5 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all font-bold"
              >
                Features
              </a>
              <a 
                href="#pricing" 
                className="px-4 py-2.5 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all font-bold"
              >
                Pricing
              </a>
              <a 
                href="#faq" 
                className="px-4 py-2.5 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all font-bold"
              >
                FAQ
              </a>
            </nav>

            {/* Desktop Buttons - Right */}
            <div className="hidden lg:flex items-center gap-3">
              <button 
                className="px-6 py-2.5 bg-white/10 backdrop-blur-xl border border-white/20 text-white rounded-xl hover:bg-white/20 transition-all font-bold" 
                onClick={onLoginClick}
              >
                Sign In
              </button>
              <button 
                className="px-6 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl hover:from-purple-400 hover:to-indigo-400 transition-all shadow-lg shadow-purple-500/30 backdrop-blur-sm border border-purple-400/20 font-bold" 
                onClick={onSignUpClick}
              >
                Get Started
              </button>
            </div>

            {/* Mobile Menu Toggle */}
            <button 
              className="lg:hidden text-white p-2 hover:bg-white/10 rounded-xl transition-all"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="lg:hidden mt-2 bg-slate-950/80 backdrop-blur-2xl border border-white/10 rounded-2xl p-6 shadow-2xl shadow-purple-500/10 animate-in slide-in-from-top-5 duration-200">
            <nav className="flex flex-col gap-3">
              <button 
                onClick={() => {
                  onDashboardClick();
                  setIsMenuOpen(false);
                }} 
                className="px-4 py-3 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all font-bold text-left"
              >
                Dashboard
              </button>
              
              <a 
                href="#features" 
                className="px-4 py-3 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all font-bold text-left"
                onClick={() => setIsMenuOpen(false)}
              >
                Features
              </a>
              
              <a 
                href="#pricing" 
                className="px-4 py-3 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all font-bold text-left"
                onClick={() => setIsMenuOpen(false)}
              >
                Pricing
              </a>
              
              <a 
                href="#faq" 
                className="px-4 py-3 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all font-bold text-left"
                onClick={() => setIsMenuOpen(false)}
              >
                FAQ
              </a>

              <div className="border-t border-white/10 my-2"></div>
              
              <button 
                className="px-4 py-3 bg-white/10 backdrop-blur-xl border border-white/20 text-white hover:bg-white/20 rounded-xl transition-all font-bold text-center" 
                onClick={() => {
                  onLoginClick();
                  setIsMenuOpen(false);
                }}
              >
                Sign In
              </button>
              
              <button 
                className="px-4 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl hover:from-purple-400 hover:to-indigo-400 transition-all shadow-lg shadow-purple-500/30 font-bold text-center" 
                onClick={() => {
                  onSignUpClick?.();
                  setIsMenuOpen(false);
                }}
              >
                Get Started
              </button>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}