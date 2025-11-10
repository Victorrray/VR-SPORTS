import { ArrowRight, CheckCircle2 } from 'lucide-react';

export function CTA() {
  return (
    <section className="container mx-auto px-4 py-20">
      <div className="max-w-5xl mx-auto">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/30 to-indigo-500/30 blur-3xl"></div>
          <div className="relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 rounded-3xl p-12 md:p-16">
            <div className="text-center max-w-3xl mx-auto">
              <h2 className="text-white mb-6">
                Ready to Start Winning More Bets?
              </h2>
              <p className="text-white/70 text-lg mb-8">
                Join thousands of successful sports bettors using OddSightSeer to find value and maximize profits.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                <button className="group px-8 py-4 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl hover:shadow-2xl hover:shadow-purple-500/50 transition-all flex items-center justify-center gap-2">
                  Start Your Free 14-Day Trial
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>

              <div className="flex flex-wrap gap-6 justify-center text-white/80 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span>Cancel anytime</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span>Full access to all features</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}