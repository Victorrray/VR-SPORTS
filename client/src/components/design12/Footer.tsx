import { Twitter, Mail } from 'lucide-react';

interface FooterProps {
  onRoadmapClick?: () => void;
  onPrivacyClick?: () => void;
  onTermsClick?: () => void;
  onDisclaimerClick?: () => void;
}

export function Footer({ onRoadmapClick, onPrivacyClick, onTermsClick, onDisclaimerClick }: FooterProps = {}) {
  return (
    <footer className="relative bg-slate-950 border-t border-white/10 overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-purple-600/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 md:px-6 relative z-10 py-10 md:py-12">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8 mb-8">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">OS</span>
            </div>
            <span className="text-white font-bold text-lg">OddSightSeer</span>
          </div>

          {/* Links */}
          <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
            <a href="#how-it-works" className="text-white/50 hover:text-white transition-colors">How It Works</a>
            <a href="/pricing" className="text-white/50 hover:text-white transition-colors">Pricing</a>
            <button onClick={onRoadmapClick} className="text-white/50 hover:text-white transition-colors">Roadmap</button>
            <button onClick={onPrivacyClick} className="text-white/50 hover:text-white transition-colors">Privacy</button>
            <button onClick={onTermsClick} className="text-white/50 hover:text-white transition-colors">Terms</button>
            <button onClick={onDisclaimerClick} className="text-white/50 hover:text-white transition-colors">Disclaimer</button>
          </div>

          {/* Social */}
          <div className="flex gap-2">
            <a 
              href="https://twitter.com/oddsightseer" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="w-9 h-9 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg flex items-center justify-center transition-all"
            >
              <Twitter className="w-4 h-4 text-white/50" />
            </a>
            <a 
              href="mailto:support@oddsightseer.com" 
              className="w-9 h-9 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg flex items-center justify-center transition-all"
            >
              <Mail className="w-4 h-4 text-white/50" />
            </a>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-2 text-xs text-white/30">
          <p>© 2026 OddSightSeer. All rights reserved.</p>
          <p>Professional sports betting analytics</p>
        </div>
      </div>
    </footer>
  );
}