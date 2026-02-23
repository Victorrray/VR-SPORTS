import { Twitter, MessageCircle } from 'lucide-react';

interface FooterProps {
  onRoadmapClick?: () => void;
  onPrivacyClick?: () => void;
  onTermsClick?: () => void;
  onDisclaimerClick?: () => void;
}

export function Footer({ onRoadmapClick, onPrivacyClick, onTermsClick, onDisclaimerClick }: FooterProps = {}) {
  return (
    <footer className="bg-gradient-to-b from-slate-950 to-black border-t border-white/10 py-12 md:py-16">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-8 md:gap-12 mb-8 md:mb-12">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-purple-500 flex items-center justify-center">
                <span className="text-white font-bold">OS</span>
              </div>
              <span className="bg-purple-400 bg-clip-text text-transparent font-bold">
                OddSightSeer
              </span>
            </div>
            <p className="text-white/40 text-sm mb-4 leading-relaxed font-medium">
              Professional sports betting analytics for serious bettors.
            </p>
            <div className="flex gap-3">
              <a href="https://twitter.com/oddsightseer" target="_blank" rel="noopener noreferrer" className="w-9 h-9 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg flex items-center justify-center transition-all">
                <Twitter className="w-4 h-4 text-white/60" />
              </a>
              <a href="mailto:support@oddsightseer.com" className="w-9 h-9 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg flex items-center justify-center transition-all">
                <MessageCircle className="w-4 h-4 text-white/60" />
              </a>
            </div>
          </div>

          {/* Product */}
          <div>
            <h3 className="text-white font-bold mb-4">Product</h3>
            <ul className="space-y-2">
              <li><a href="#features" className="text-white/60 hover:text-white transition-colors text-sm font-medium">Features</a></li>
              <li><a href="#pricing" className="text-white/60 hover:text-white transition-colors text-sm font-medium">Pricing</a></li>
              
              <li>
                <button 
                  onClick={onRoadmapClick} 
                  className="text-white/60 hover:text-white transition-colors text-sm font-medium"
                >
                  Roadmap
                </button>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-white font-bold mb-4">Legal</h3>
            <ul className="space-y-2">
              <li>
                <button 
                  onClick={onPrivacyClick} 
                  className="text-white/60 hover:text-white transition-colors text-sm font-medium"
                >
                  Privacy
                </button>
              </li>
              <li>
                <button 
                  onClick={onTermsClick} 
                  className="text-white/60 hover:text-white transition-colors text-sm font-medium"
                >
                  Terms
                </button>
              </li>
              <li>
                <button 
                  onClick={onDisclaimerClick} 
                  className="text-white/60 hover:text-white transition-colors text-sm font-medium"
                >
                  Disclaimer
                </button>
              </li>
              
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-white/10 text-center md:text-left">
          <p className="text-white/40 text-sm font-medium">
            © 2025 OddSightSeer. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}