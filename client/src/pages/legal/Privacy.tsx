import { Shield } from 'lucide-react';
import { Helmet } from '@dr.pogodin/react-helmet';
import { Header } from '../../components/landing/Header';
import { Footer } from '../../components/landing/Footer';
import { PAGE_TITLES, PAGE_DESCRIPTIONS, SITE_CONFIG } from '../../utils/seo';

interface PrivacyProps {
  onBack: () => void;
  onLoginClick: () => void;
  onDashboardClick: () => void;
  onSignUpClick: () => void;
  onRoadmapClick: () => void;
  onPrivacyClick: () => void;
  onTermsClick: () => void;
  onDisclaimerClick: () => void;
}

export function Privacy({ onBack, onLoginClick, onDashboardClick, onSignUpClick, onRoadmapClick, onPrivacyClick, onTermsClick, onDisclaimerClick }: PrivacyProps) {
  return (
    <div className="relative">
      <Helmet>
        <title>{PAGE_TITLES.privacy}</title>
        <meta name="description" content={PAGE_DESCRIPTIONS.privacy} />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={`${SITE_CONFIG.domain}/privacy`} />
        <meta property="og:title" content={PAGE_TITLES.privacy} />
        <meta property="og:description" content={PAGE_DESCRIPTIONS.privacy} />
        <meta property="og:url" content={`${SITE_CONFIG.domain}/privacy`} />
      </Helmet>
      <Header 
        onLoginClick={onLoginClick}
        onDashboardClick={onDashboardClick}
        onRoadmapClick={onRoadmapClick}
      />
      <div className="min-h-screen bg-gray-900 py-16 md:py-24">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Header */}
          <div className="text-center mb-12 md:mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full mb-6">
              <Shield className="w-4 h-4 text-purple-400" />
              <span className="text-purple-400 text-sm font-medium">Privacy Policy</span>
            </div>
            <h1 className="bg-purple-400 bg-clip-text text-transparent mb-4">
              Your Privacy Matters
            </h1>
            <p className="text-white/60 leading-relaxed">
              Last updated: November 11, 2025
            </p>
          </div>

          {/* Content */}
          <div className="space-y-8">
            <section className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-2xl p-6 md:p-8">
              <h2 className="text-white mb-4">Introduction</h2>
              <p className="text-white/70 leading-relaxed">
                OddSightSeer ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our sports betting analytics platform.
              </p>
            </section>

            <section className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-2xl p-6 md:p-8">
              <h2 className="text-white mb-4">Information We Collect</h2>
              <div className="space-y-4 text-white/70 leading-relaxed">
                <div>
                  <h3 className="text-white mb-2">Personal Information</h3>
                  <p>We may collect personal information that you provide to us, including but not limited to your name, email address, and payment information when you create an account or subscribe to our services.</p>
                </div>
                <div>
                  <h3 className="text-white mb-2">Usage Data</h3>
                  <p>We automatically collect certain information about your device and how you interact with our platform, including IP address, browser type, pages visited, and time spent on pages.</p>
                </div>
                <div>
                  <h3 className="text-white mb-2">Betting Analytics Data</h3>
                  <p>Information about your betting preferences, picks, and analytics usage to provide personalized recommendations and improve our services.</p>
                </div>
              </div>
            </section>

            <section className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-2xl p-6 md:p-8">
              <h2 className="text-white mb-4">How We Use Your Information</h2>
              <ul className="space-y-3 text-white/70 leading-relaxed">
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-2 flex-shrink-0" />
                  <span>To provide, maintain, and improve our services</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-2 flex-shrink-0" />
                  <span>To process your transactions and manage your subscription</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-2 flex-shrink-0" />
                  <span>To send you technical notices, updates, and support messages</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-2 flex-shrink-0" />
                  <span>To personalize your experience and provide tailored analytics</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-2 flex-shrink-0" />
                  <span>To protect against fraud and unauthorized access</span>
                </li>
              </ul>
            </section>

            <section className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-2xl p-6 md:p-8">
              <h2 className="text-white mb-4">Data Security</h2>
              <p className="text-white/70 leading-relaxed">
                We implement appropriate technical and organizational security measures to protect your personal information. However, no method of transmission over the Internet or electronic storage is 100% secure, and we cannot guarantee absolute security.
              </p>
            </section>

            <section className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-2xl p-6 md:p-8">
              <h2 className="text-white mb-4">Your Rights</h2>
              <p className="text-white/70 leading-relaxed mb-4">
                You have the right to:
              </p>
              <ul className="space-y-3 text-white/70 leading-relaxed">
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-2 flex-shrink-0" />
                  <span>Access, update, or delete your personal information</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-2 flex-shrink-0" />
                  <span>Opt-out of marketing communications</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-2 flex-shrink-0" />
                  <span>Request a copy of your data</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-2 flex-shrink-0" />
                  <span>Close your account at any time</span>
                </li>
              </ul>
            </section>

            <section className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-2xl p-6 md:p-8">
              <h2 className="text-white mb-4">Contact Us</h2>
              <p className="text-white/70 leading-relaxed">
                If you have any questions about this Privacy Policy, please contact us at privacy@oddsightseer.com
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