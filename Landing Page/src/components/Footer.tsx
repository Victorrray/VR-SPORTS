import { Twitter, Instagram, Mail } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-white/10 mt-20">
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 mb-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-500/50">
                <span className="text-white text-xs md:text-sm font-bold">OS</span>
              </div>
              <span className="bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent text-sm md:text-base font-bold">
                OddSightSeer
              </span>
            </div>
            <p className="text-white/50 text-xs md:text-sm max-w-xs font-medium">
              AI-powered sports betting analytics for smarter bets and bigger wins.
            </p>
          </div>

          {/* Product */}
          <div>
            <h3 className="text-white mb-3 md:mb-4 text-xs md:text-sm font-bold">Product</h3>
            <ul className="space-y-2 md:space-y-3 text-white/50 text-xs md:text-sm">
              <li><a href="#" className="hover:text-white transition-colors font-medium">Features</a></li>
              <li><a href="#" className="hover:text-white transition-colors font-medium">Pricing</a></li>
              <li><a href="#" className="hover:text-white transition-colors font-medium">FAQ</a></li>
              <li><a href="#" className="hover:text-white transition-colors font-medium">Roadmap</a></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-white mb-3 md:mb-4 text-xs md:text-sm font-bold">Company</h3>
            <ul className="space-y-2 md:space-y-3 text-white/50 text-xs md:text-sm">
              <li><a href="#" className="hover:text-white transition-colors font-medium">About</a></li>
              <li><a href="#" className="hover:text-white transition-colors font-medium">Blog</a></li>
              <li><a href="#" className="hover:text-white transition-colors font-medium">Careers</a></li>
              <li><a href="#" className="hover:text-white transition-colors font-medium">Contact</a></li>
            </ul>
          </div>

          {/* Legal */}
          <div className="col-span-2 md:col-span-1">
            <h3 className="text-white mb-3 md:mb-4 text-xs md:text-sm font-bold">Legal</h3>
            <ul className="space-y-2 md:space-y-3 text-white/50 text-xs md:text-sm">
              <li><a href="#" className="hover:text-white transition-colors font-medium">Privacy</a></li>
              <li><a href="#" className="hover:text-white transition-colors font-medium">Terms</a></li>
              <li><a href="#" className="hover:text-white transition-colors font-medium">Responsible Gaming</a></li>
              <li><a href="#" className="hover:text-white transition-colors font-medium">Disclaimer</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 md:pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-white/40 text-xs md:text-sm text-center md:text-left font-medium">
            © 2025 OddSightSeer. All rights reserved.
          </p>
          <div className="flex items-center gap-3 md:gap-4">
            <a href="#" className="w-8 h-8 md:w-9 md:h-9 bg-white/5 hover:bg-white/10 rounded-lg flex items-center justify-center text-white/50 hover:text-white transition-all">
              <Twitter className="w-3.5 h-3.5 md:w-4 md:h-4" />
            </a>
            <a href="#" className="w-8 h-8 md:w-9 md:h-9 bg-white/5 hover:bg-white/10 rounded-lg flex items-center justify-center text-white/50 hover:text-white transition-all">
              <Instagram className="w-3.5 h-3.5 md:w-4 md:h-4" />
            </a>
            <a href="#" className="w-8 h-8 md:w-9 md:h-9 bg-white/5 hover:bg-white/10 rounded-lg flex items-center justify-center text-white/50 hover:text-white transition-all">
              <Mail className="w-3.5 h-3.5 md:w-4 md:h-4" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}