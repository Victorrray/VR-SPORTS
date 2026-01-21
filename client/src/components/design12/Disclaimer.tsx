import { AlertTriangle } from 'lucide-react';
import { Header } from './Header';
import { Footer } from './Footer';

interface DisclaimerProps {
  onBack: () => void;
  onLoginClick: () => void;
  onDashboardClick: () => void;
  onSignUpClick: () => void;
  onRoadmapClick: () => void;
  onPrivacyClick: () => void;
  onTermsClick: () => void;
  onDisclaimerClick: () => void;
}

export function Disclaimer({ onBack, onLoginClick, onDashboardClick, onSignUpClick, onRoadmapClick, onPrivacyClick, onTermsClick, onDisclaimerClick }: DisclaimerProps) {
  return (
    <div className="relative">
      <Header 
        onLoginClick={onLoginClick}
        onDashboardClick={onDashboardClick}
        onSignUpClick={onSignUpClick}
        onRoadmapClick={onRoadmapClick}
      />
      <div className="min-h-screen bg-gray-900 py-16 md:py-24">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Header */}
          <div className="text-center mb-12 md:mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full mb-6">
              <AlertTriangle className="w-4 h-4 text-purple-400" />
              <span className="text-purple-400 text-sm font-medium">Important Disclaimer</span>
            </div>
            <h1 className="bg-purple-400 bg-clip-text text-transparent mb-4">
              Betting Disclaimer
            </h1>
            <p className="text-white/60 leading-relaxed">
              Last updated: November 11, 2025
            </p>
          </div>

          {/* Content */}
          <div className="space-y-8">
            <section className="bg-purple-500/10 border border-purple-500/30 rounded-2xl p-6 md:p-8">
              <div className="flex items-start gap-4">
                <AlertTriangle className="w-6 h-6 text-purple-400 flex-shrink-0 mt-1" />
                <div>
                  <h2 className="text-white mb-3">Important Notice</h2>
                  <p className="text-white/80 leading-relaxed">
                    OddSightSeer is an analytics and information platform. We do not operate as a sportsbook or facilitate gambling transactions. All betting should be done responsibly and legally through licensed operators in your jurisdiction.
                  </p>
                </div>
              </div>
            </section>

            <section className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-2xl p-6 md:p-8">
              <h2 className="text-white mb-4">No Guarantee of Results</h2>
              <p className="text-white/70 leading-relaxed">
                The information, analytics, and recommendations provided by OddSightSeer are for informational purposes only. Past performance is not indicative of future results. Sports betting involves risk, and you should never wager more than you can afford to lose.
              </p>
            </section>

            <section className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-2xl p-6 md:p-8">
              <h2 className="text-white mb-4">Not Financial or Professional Advice</h2>
              <p className="text-white/70 leading-relaxed mb-4">
                OddSightSeer does not provide financial, legal, or professional gambling advice. Our platform provides:
              </p>
              <ul className="space-y-3 text-white/70 leading-relaxed">
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-2 flex-shrink-0" />
                  <span>Statistical analysis and data visualization</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-2 flex-shrink-0" />
                  <span>Odds comparison across multiple sportsbooks</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-2 flex-shrink-0" />
                  <span>Historical performance tracking</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-2 flex-shrink-0" />
                  <span>Educational content about sports betting analytics</span>
                </li>
              </ul>
              <p className="text-white/70 leading-relaxed mt-4">
                Users are solely responsible for their betting decisions and should conduct their own research and due diligence.
              </p>
            </section>

            <section className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-2xl p-6 md:p-8">
              <h2 className="text-white mb-4">Age and Legal Restrictions</h2>
              <div className="space-y-4 text-white/70 leading-relaxed">
                <p>
                  You must be of legal gambling age in your jurisdiction to use OddSightSeer. Sports betting laws vary by location, and it is your responsibility to:
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-2 flex-shrink-0" />
                    <span>Verify that sports betting is legal in your jurisdiction</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-2 flex-shrink-0" />
                    <span>Ensure you meet the minimum age requirements</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-2 flex-shrink-0" />
                    <span>Comply with all applicable local, state, and federal laws</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-2 flex-shrink-0" />
                    <span>Only use licensed and regulated sportsbooks</span>
                  </li>
                </ul>
              </div>
            </section>

            <section className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-2xl p-6 md:p-8">
              <h2 className="text-white mb-4">Responsible Gambling</h2>
              <div className="space-y-4 text-white/70 leading-relaxed">
                <p>
                  We encourage responsible gambling practices. If you or someone you know has a gambling problem, please seek help:
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-2 flex-shrink-0" />
                    <span>National Council on Problem Gambling: 1-800-522-4700</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-2 flex-shrink-0" />
                    <span>Gamblers Anonymous: www.gamblersanonymous.org</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-2 flex-shrink-0" />
                    <span>National Problem Gambling Helpline: 1-800-522-4700</span>
                  </li>
                </ul>
              </div>
            </section>

            <section className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-2xl p-6 md:p-8">
              <h2 className="text-white mb-4">Data Accuracy</h2>
              <p className="text-white/70 leading-relaxed">
                While we strive to provide accurate and up-to-date information, OddSightSeer does not guarantee the accuracy, completeness, or timeliness of any data, odds, or statistics displayed on the platform. Users should verify all information before making betting decisions.
              </p>
            </section>

            <section className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-2xl p-6 md:p-8">
              <h2 className="text-white mb-4">Third-Party Services</h2>
              <p className="text-white/70 leading-relaxed">
                OddSightSeer may display odds and information from third-party sportsbooks. We are not responsible for the terms, conditions, or operations of these third-party services. Any transactions or relationships with third-party sportsbooks are solely between you and that third party.
              </p>
            </section>

            <section className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-2xl p-6 md:p-8">
              <h2 className="text-white mb-4">Limitation of Liability</h2>
              <p className="text-white/70 leading-relaxed">
                OddSightSeer and its operators, employees, and affiliates are not liable for any losses, damages, or harm resulting from your use of the platform or any betting activities. Use of OddSightSeer is at your own risk.
              </p>
            </section>

            <section className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-2xl p-6 md:p-8">
              <h2 className="text-white mb-4">Contact Us</h2>
              <p className="text-white/70 leading-relaxed">
                If you have any questions about this disclaimer, please contact us at support@oddsightseer.com
              </p>
            </section>
          </div>
        </div>
      </div>
      <Footer 
        onRoadmapClick={onRoadmapClick}
        onPrivacyClick={onPrivacyClick}
        onTermsClick={onTermsClick}
        onDisclaimerClick={onDisclaimerClick}
      />
    </div>
  );
}