import { ArrowRight } from 'lucide-react';

export function CTA() {
  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-slate-950 to-black">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-white mb-4 md:mb-6 font-bold" style={{fontSize: 'clamp(2rem, 6vw, 3.5rem)'}}>
            Ready to start{' '}
            <span className="bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
              winning?
            </span>
          </h2>
          <p className="text-white/60 text-base md:text-lg mb-8 md:mb-10 max-w-2xl mx-auto font-medium leading-relaxed">
            Join thousands of sharp bettors using OddSightSeer to find +EV opportunities every day.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button className="w-full sm:w-auto px-8 py-3 md:py-4 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl hover:from-purple-600 hover:to-indigo-600 transition-all text-center font-semibold">
              Get started free
            </button>
            <button className="w-full sm:w-auto px-8 py-3 md:py-4 bg-white/5 border border-white/20 text-white rounded-xl hover:bg-white/10 transition-all text-center font-semibold flex items-center justify-center gap-2">
              Schedule demo
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}