import { Shield, ArrowLeft, Lock, Eye, Database, UserCheck, Mail } from 'lucide-react';
import { Header } from './Header';
import { Footer } from './Footer';
import { motion } from 'framer-motion';

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
  const sections = [
    {
      icon: Eye,
      title: 'Introduction',
      content: 'OddSightSeer ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our sports betting analytics platform.',
      gradient: 'from-purple-500 to-violet-600'
    },
    {
      icon: Database,
      title: 'Information We Collect',
      gradient: 'from-blue-500 to-cyan-600',
      subsections: [
        { title: 'Personal Information', content: 'We may collect personal information that you provide to us, including but not limited to your name, email address, and payment information when you create an account or subscribe to our services.' },
        { title: 'Usage Data', content: 'We automatically collect certain information about your device and how you interact with our platform, including IP address, browser type, pages visited, and time spent on pages.' },
        { title: 'Betting Analytics Data', content: 'Information about your betting preferences, picks, and analytics usage to provide personalized recommendations and improve our services.' }
      ]
    },
    {
      icon: Lock,
      title: 'How We Use Your Information',
      gradient: 'from-green-500 to-emerald-600',
      list: [
        'To provide, maintain, and improve our services',
        'To process your transactions and manage your subscription',
        'To send you technical notices, updates, and support messages',
        'To personalize your experience and provide tailored analytics',
        'To protect against fraud and unauthorized access'
      ]
    },
    {
      icon: Shield,
      title: 'Data Security',
      content: 'We implement appropriate technical and organizational security measures to protect your personal information. However, no method of transmission over the Internet or electronic storage is 100% secure, and we cannot guarantee absolute security.',
      gradient: 'from-amber-500 to-orange-600'
    },
    {
      icon: UserCheck,
      title: 'Your Rights',
      gradient: 'from-pink-500 to-rose-600',
      intro: 'You have the right to:',
      list: [
        'Access, update, or delete your personal information',
        'Opt-out of marketing communications',
        'Request a copy of your data',
        'Close your account at any time'
      ]
    },
    {
      icon: Mail,
      title: 'Contact Us',
      content: 'If you have any questions about this Privacy Policy, please contact us at privacy@oddsightseer.com',
      gradient: 'from-indigo-500 to-purple-600'
    }
  ];

  return (
    <div className="relative min-h-screen bg-slate-950">
      {/* Animated Background Orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div 
          className="absolute top-20 -left-20 w-[500px] h-[500px] bg-purple-600/15 rounded-full blur-3xl"
          animate={{ 
            scale: [1, 1.2, 1],
            x: [0, 30, 0],
            opacity: [0.1, 0.2, 0.1]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute bottom-20 -right-20 w-[600px] h-[600px] bg-indigo-600/15 rounded-full blur-3xl"
          animate={{ 
            scale: [1.2, 1, 1.2],
            x: [0, -30, 0],
            opacity: [0.1, 0.2, 0.1]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* Grid Pattern */}
      <div 
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(139, 92, 246, 0.03) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(139, 92, 246, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      <Header 
        onLoginClick={onLoginClick}
        onDashboardClick={onDashboardClick}
        onSignupClick={onSignUpClick}
        onRoadmapClick={onRoadmapClick}
      />

      <div className="relative z-10 pt-24 md:pt-32 pb-20 md:pb-28">
        <div className="container mx-auto px-4 md:px-6 max-w-4xl">
          {/* Back Button */}
          <motion.button 
            onClick={onBack}
            className="flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-8 group"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            whileHover={{ x: -5 }}
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-semibold">Back to home</span>
          </motion.button>

          {/* Header */}
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div 
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-500/20 to-violet-500/20 border border-purple-500/30 rounded-full mb-6"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Shield className="w-4 h-4 text-purple-400" />
              <span className="text-purple-300 text-sm font-semibold">Privacy Policy</span>
            </motion.div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-6 tracking-tight">
              Your Privacy{' '}
              <span className="bg-gradient-to-r from-purple-400 via-violet-400 to-indigo-400 bg-clip-text text-transparent">
                Matters
              </span>
            </h1>
            
            <p className="text-white/50 text-lg font-medium">
              Last updated: November 11, 2025
            </p>
          </motion.div>

          {/* Content Sections */}
          <div className="space-y-6">
            {sections.map((section, index) => {
              const Icon = section.icon;
              return (
                <motion.section 
                  key={index}
                  className="relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 hover:border-purple-500/30 transition-all"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                  whileHover={{ y: -2 }}
                >
                  {/* Left accent bar */}
                  <div className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b ${section.gradient} rounded-l-3xl`} />
                  
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${section.gradient} flex items-center justify-center shadow-lg flex-shrink-0`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-white text-xl md:text-2xl font-bold mb-4">{section.title}</h2>
                      
                      {section.content && (
                        <p className="text-white/60 leading-relaxed font-medium">{section.content}</p>
                      )}
                      
                      {section.subsections && (
                        <div className="space-y-4">
                          {section.subsections.map((sub, subIndex) => (
                            <div key={subIndex} className="bg-white/5 rounded-2xl p-4 border border-white/5">
                              <h3 className="text-white font-semibold mb-2">{sub.title}</h3>
                              <p className="text-white/60 text-sm leading-relaxed">{sub.content}</p>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {section.intro && (
                        <p className="text-white/60 leading-relaxed font-medium mb-4">{section.intro}</p>
                      )}
                      
                      {section.list && (
                        <ul className="space-y-3">
                          {section.list.map((item, itemIndex) => (
                            <li key={itemIndex} className="flex items-start gap-3">
                              <div className={`w-6 h-6 rounded-lg bg-gradient-to-br ${section.gradient} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                              <span className="text-white/60 font-medium">{item}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </motion.section>
              );
            })}
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