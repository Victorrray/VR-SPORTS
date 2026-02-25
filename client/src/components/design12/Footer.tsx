import { Twitter, MessageCircle, Mail, ArrowUpRight } from 'lucide-react';
import { motion } from 'framer-motion';

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

      <div className="container mx-auto px-4 md:px-6 relative z-10 py-16 md:py-20">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2">
            <motion.div 
              className="flex items-center gap-3 mb-5"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
                <span className="text-white font-bold text-lg">OS</span>
              </div>
              <span className="text-white font-bold text-xl">
                OddSightSeer
              </span>
            </motion.div>
            <p className="text-white/50 text-base mb-6 leading-relaxed font-medium max-w-sm">
              Professional sports betting analytics for serious bettors. Compare odds across 45+ sportsbooks instantly.
            </p>
            <div className="flex gap-3">
              <motion.a 
                href="https://twitter.com/oddsightseer" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="w-11 h-11 bg-white/5 hover:bg-purple-500/20 border border-white/10 hover:border-purple-400/50 rounded-xl flex items-center justify-center transition-all group"
                whileHover={{ scale: 1.05, y: -2 }}
              >
                <Twitter className="w-5 h-5 text-white/60 group-hover:text-purple-400 transition-colors" />
              </motion.a>
              <motion.a 
                href="mailto:support@oddsightseer.com" 
                className="w-11 h-11 bg-white/5 hover:bg-purple-500/20 border border-white/10 hover:border-purple-400/50 rounded-xl flex items-center justify-center transition-all group"
                whileHover={{ scale: 1.05, y: -2 }}
              >
                <Mail className="w-5 h-5 text-white/60 group-hover:text-purple-400 transition-colors" />
              </motion.a>
            </div>
          </div>

          {/* Product */}
          <div>
            <h3 className="text-white font-bold mb-5 text-sm uppercase tracking-wider">Product</h3>
            <ul className="space-y-3">
              <li>
                <a href="#how-it-works" className="text-white/60 hover:text-white transition-colors text-sm font-medium inline-flex items-center gap-1 group">
                  How It Works
                  <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              </li>
              <li>
                <a href="#pricing" className="text-white/60 hover:text-white transition-colors text-sm font-medium inline-flex items-center gap-1 group">
                  Pricing
                  <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              </li>
              <li>
                <button 
                  onClick={onRoadmapClick} 
                  className="text-white/60 hover:text-white transition-colors text-sm font-medium inline-flex items-center gap-1 group"
                >
                  Roadmap
                  <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-white font-bold mb-5 text-sm uppercase tracking-wider">Legal</h3>
            <ul className="space-y-3">
              <li>
                <button 
                  onClick={onPrivacyClick} 
                  className="text-white/60 hover:text-white transition-colors text-sm font-medium inline-flex items-center gap-1 group"
                >
                  Privacy Policy
                  <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              </li>
              <li>
                <button 
                  onClick={onTermsClick} 
                  className="text-white/60 hover:text-white transition-colors text-sm font-medium inline-flex items-center gap-1 group"
                >
                  Terms of Service
                  <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              </li>
              <li>
                <button 
                  onClick={onDisclaimerClick} 
                  className="text-white/60 hover:text-white transition-colors text-sm font-medium inline-flex items-center gap-1 group"
                >
                  Disclaimer
                  <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-white/40 text-sm font-medium">
            © 2026 OddSightSeer. All rights reserved.
          </p>
          <p className="text-white/30 text-xs font-medium">
            Built for bettors who want an edge
          </p>
        </div>
      </div>
    </footer>
  );
}