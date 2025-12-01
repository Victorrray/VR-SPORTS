import { useState } from 'react';
import { Menu, X } from 'lucide-react';

interface HeaderProps {
  onLoginClick: () => void;
  onDashboardClick: () => void;
  onRoadmapClick: () => void;
  onSignupClick: () => void;
}

export function Header({ onLoginClick, onDashboardClick, onRoadmapClick, onSignupClick }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="absolute top-0 left-0 right-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20 md:h-24">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="relative group">
              {/* Glow effect */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-500 blur-xl opacity-40 group-hover:opacity-60 transition-opacity" />
              
              {/* Logo container */}
              <div className="relative w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-gradient-to-br from-purple-500 via-purple-600 to-indigo-600 flex items-center justify-center transform transition-transform group-hover:scale-105">
                <span className="text-white font-bold text-lg md:text-xl">OS</span>
                {/* Shine effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-2xl" />
              </div>
            </div>
            
            <div className="flex flex-col">
              <span className="bg-gradient-to-r from-purple-400 via-purple-300 to-indigo-400 bg-clip-text text-transparent font-bold text-lg md:text-xl tracking-tight">
                OddSightSeer
              </span>
              <span className="text-xs text-white/40 font-bold tracking-wide">
                PREMIUM ANALYTICS
              </span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-white/70 hover:text-white transition-colors font-medium">
              Features
            </a>
            <button 
              onClick={onDashboardClick}
              className="text-white/70 hover:text-white transition-colors font-medium"
            >
              Dashboard
            </button>
            <a href="#pricing" className="text-white/70 hover:text-white transition-colors font-medium">
              Pricing
            </a>
            <a href="#faq" className="text-white/70 hover:text-white transition-colors font-medium">
              FAQ
            </a>
            <button 
              onClick={onRoadmapClick}
              className="text-white/70 hover:text-white transition-colors font-medium"
            >
              Roadmap
            </button>
          </nav>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-4">
            <button 
              onClick={onLoginClick}
              className="text-white/70 hover:text-white transition-colors font-medium"
            >
              Login
            </button>
            <button 
              onClick={onSignupClick}
              className="px-6 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-lg hover:from-purple-600 hover:to-indigo-600 transition-all font-semibold"
            >
              Sign up
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-white p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden">
            <nav className="flex flex-col gap-3 px-6 py-6 bg-gradient-to-br from-slate-900/95 via-slate-900/98 to-slate-950/95 backdrop-blur-2xl border-t border-white/10 rounded-b-2xl">
              <a href="#features" className="px-4 py-2.5 text-white/70 hover:text-white hover:bg-white/5 rounded-xl transition-all font-bold">
                Features
              </a>
              <button 
                onClick={onDashboardClick}
                className="w-full px-4 py-2.5 text-white/70 hover:text-white hover:bg-white/5 rounded-xl transition-all font-bold text-left"
              >
                Dashboard
              </button>
              <a href="#pricing" className="px-4 py-2.5 text-white/70 hover:text-white hover:bg-white/5 rounded-xl transition-all font-bold">
                Pricing
              </a>
              <a href="#faq" className="px-4 py-2.5 text-white/70 hover:text-white hover:bg-white/5 rounded-xl transition-all font-bold">
                FAQ
              </a>
              <button 
                onClick={onRoadmapClick}
                className="w-full px-4 py-2.5 text-white/70 hover:text-white hover:bg-white/5 rounded-xl transition-all font-bold text-left"
              >
                Roadmap
              </button>
              <div className="flex flex-col gap-3 mt-4 pt-4 border-t border-white/10">
                <button 
                  onClick={onLoginClick}
                  className="w-full px-6 py-2.5 bg-white/5 border border-white/10 text-white hover:bg-white/10 rounded-xl transition-all font-bold backdrop-blur-xl"
                >
                  Login
                </button>
                <button 
                  onClick={onSignupClick}
                  className="w-full px-6 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl hover:from-purple-400 hover:to-indigo-400 transition-all font-bold border border-purple-400/30"
                >
                  Sign up
                </button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}