import { FileText } from 'lucide-react';
import { Header } from './Header';
import { Footer } from './Footer';

interface TermsProps {
  onBack: () => void;
  onLoginClick: () => void;
  onDashboardClick: () => void;
  onSignUpClick: () => void;
  onRoadmapClick: () => void;
  onPrivacyClick: () => void;
  onTermsClick: () => void;
  onDisclaimerClick: () => void;
}

export function Terms({ onBack, onLoginClick, onDashboardClick, onSignUpClick, onRoadmapClick, onPrivacyClick, onTermsClick, onDisclaimerClick }: TermsProps) {
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
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border border-purple-500/20 rounded-full mb-6">
              <FileText className="w-4 h-4 text-purple-400" />
              <span className="text-purple-400 text-sm font-medium">Terms of Service</span>
            </div>
            <h1 className="bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent mb-4">
              Terms of Service
            </h1>
            <p className="text-white/60 leading-relaxed">
              Last updated: November 11, 2025
            </p>
          </div>

          {/* Content */}
          <div className="space-y-8">
            <section className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-2xl p-6 md:p-8">
              <h2 className="text-white mb-4">Agreement to Terms</h2>
              <p className="text-white/70 leading-relaxed">
                By accessing or using OddSightSeer, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this platform.
              </p>
            </section>

            <section className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-2xl p-6 md:p-8">
              <h2 className="text-white mb-4">Use License</h2>
              <div className="space-y-4 text-white/70 leading-relaxed">
                <p>
                  Permission is granted to temporarily access and use OddSightSeer for personal, non-commercial purposes. This license does not include the right to:
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-2 flex-shrink-0" />
                    <span>Modify or copy the materials</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-2 flex-shrink-0" />
                    <span>Use the materials for commercial purposes or public display</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-2 flex-shrink-0" />
                    <span>Attempt to reverse engineer any software contained on OddSightSeer</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-2 flex-shrink-0" />
                    <span>Remove any copyright or proprietary notations from the materials</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-2 flex-shrink-0" />
                    <span>Transfer the materials to another person or mirror on any other server</span>
                  </li>
                </ul>
              </div>
            </section>

            <section className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-2xl p-6 md:p-8">
              <h2 className="text-white mb-4">User Accounts</h2>
              <div className="space-y-4 text-white/70 leading-relaxed">
                <p>
                  When you create an account with us, you must provide accurate, complete, and current information. You are responsible for:
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-2 flex-shrink-0" />
                    <span>Maintaining the confidentiality of your account credentials</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-2 flex-shrink-0" />
                    <span>All activities that occur under your account</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-2 flex-shrink-0" />
                    <span>Notifying us immediately of any unauthorized use</span>
                  </li>
                </ul>
              </div>
            </section>

            <section className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-2xl p-6 md:p-8">
              <h2 className="text-white mb-4">Subscription and Payment</h2>
              <div className="space-y-4 text-white/70 leading-relaxed">
                <p>
                  Some parts of the service are billed on a subscription basis. You will be billed in advance on a recurring and periodic basis.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-2 flex-shrink-0" />
                    <span>Subscriptions automatically renew unless cancelled</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-2 flex-shrink-0" />
                    <span>You can cancel your subscription at any time through your account settings</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-2 flex-shrink-0" />
                    <span>Refunds are handled on a case-by-case basis</span>
                  </li>
                </ul>
              </div>
            </section>

            <section className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-2xl p-6 md:p-8">
              <h2 className="text-white mb-4">Prohibited Uses</h2>
              <div className="space-y-4 text-white/70 leading-relaxed">
                <p>You may not use OddSightSeer:</p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-2 flex-shrink-0" />
                    <span>For any unlawful purpose or to solicit others to perform unlawful acts</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-2 flex-shrink-0" />
                    <span>To violate any international, federal, provincial or state regulations</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-2 flex-shrink-0" />
                    <span>To transmit any malicious code or attempt to compromise system security</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-2 flex-shrink-0" />
                    <span>To interfere with or circumvent the security features of the service</span>
                  </li>
                </ul>
              </div>
            </section>

            <section className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-2xl p-6 md:p-8">
              <h2 className="text-white mb-4">Limitation of Liability</h2>
              <p className="text-white/70 leading-relaxed">
                OddSightSeer shall not be liable for any indirect, incidental, special, consequential or punitive damages resulting from your use or inability to use the service.
              </p>
            </section>

            <section className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-2xl p-6 md:p-8">
              <h2 className="text-white mb-4">Changes to Terms</h2>
              <p className="text-white/70 leading-relaxed">
                We reserve the right to modify these terms at any time. We will notify users of any material changes via email or through the service.
              </p>
            </section>

            <section className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-2xl p-6 md:p-8">
              <h2 className="text-white mb-4">Contact Us</h2>
              <p className="text-white/70 leading-relaxed">
                If you have any questions about these Terms of Service, please contact us at legal@oddsightseer.com
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