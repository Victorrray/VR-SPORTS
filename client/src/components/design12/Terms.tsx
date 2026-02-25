import { FileText, ArrowLeft, Scale, UserCog, CreditCard, Ban, AlertTriangle, RefreshCw, Mail } from 'lucide-react';
import { Header } from './Header';
import { Footer } from './Footer';
import { motion } from 'framer-motion';

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
  const sections = [
    {
      icon: Scale,
      title: 'Agreement to Terms',
      content: 'By accessing or using OddSightSeer, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this platform.',
      gradient: 'from-purple-500 to-violet-600'
    },
    {
      icon: FileText,
      title: 'Use License',
      gradient: 'from-blue-500 to-cyan-600',
      intro: 'Permission is granted to temporarily access and use OddSightSeer for personal, non-commercial purposes. This license does not include the right to:',
      list: [
        'Modify or copy the materials',
        'Use the materials for commercial purposes or public display',
        'Attempt to reverse engineer any software contained on OddSightSeer',
        'Remove any copyright or proprietary notations from the materials',
        'Transfer the materials to another person or mirror on any other server'
      ]
    },
    {
      icon: UserCog,
      title: 'User Accounts',
      gradient: 'from-green-500 to-emerald-600',
      intro: 'When you create an account with us, you must provide accurate, complete, and current information. You are responsible for:',
      list: [
        'Maintaining the confidentiality of your account credentials',
        'All activities that occur under your account',
        'Notifying us immediately of any unauthorized use'
      ]
    },
    {
      icon: CreditCard,
      title: 'Subscription and Payment',
      gradient: 'from-amber-500 to-orange-600',
      intro: 'Some parts of the service are billed on a subscription basis. You will be billed in advance on a recurring and periodic basis.',
      list: [
        'Subscriptions automatically renew unless cancelled',
        'You can cancel your subscription at any time through your account settings',
        'Refunds are handled on a case-by-case basis'
      ]
    },
    {
      icon: Ban,
      title: 'Prohibited Uses',
      gradient: 'from-red-500 to-rose-600',
      intro: 'You may not use OddSightSeer:',
      list: [
        'For any unlawful purpose or to solicit others to perform unlawful acts',
        'To violate any international, federal, provincial or state regulations',
        'To transmit any malicious code or attempt to compromise system security',
        'To interfere with or circumvent the security features of the service'
      ]
    },
    {
      icon: AlertTriangle,
      title: 'Limitation of Liability',
      content: 'OddSightSeer shall not be liable for any indirect, incidental, special, consequential or punitive damages resulting from your use or inability to use the service.',
      gradient: 'from-yellow-500 to-amber-600'
    },
    {
      icon: RefreshCw,
      title: 'Changes to Terms',
      content: 'We reserve the right to modify these terms at any time. We will notify users of any material changes via email or through the service.',
      gradient: 'from-pink-500 to-rose-600'
    },
    {
      icon: Mail,
      title: 'Contact Us',
      content: 'If you have any questions about these Terms of Service, please contact us at legal@oddsightseer.com',
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
              <FileText className="w-4 h-4 text-purple-400" />
              <span className="text-purple-300 text-sm font-semibold">Terms of Service</span>
            </motion.div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-6 tracking-tight">
              Terms of{' '}
              <span className="bg-gradient-to-r from-purple-400 via-violet-400 to-indigo-400 bg-clip-text text-transparent">
                Service
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