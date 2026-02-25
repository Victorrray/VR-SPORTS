import { AlertTriangle, ArrowLeft, Info, Scale, ShieldAlert, Users, Database, Link, AlertOctagon, Mail, Phone } from 'lucide-react';
import { Header } from './Header';
import { Footer } from './Footer';
import { motion } from 'framer-motion';

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
  const sections = [
    {
      icon: Info,
      title: 'No Guarantee of Results',
      content: 'The information, analytics, and recommendations provided by OddSightSeer are for informational purposes only. Past performance is not indicative of future results. Sports betting involves risk, and you should never wager more than you can afford to lose.',
      gradient: 'from-blue-500 to-cyan-600'
    },
    {
      icon: Scale,
      title: 'Not Financial or Professional Advice',
      gradient: 'from-purple-500 to-violet-600',
      intro: 'OddSightSeer does not provide financial, legal, or professional gambling advice. Our platform provides:',
      list: [
        'Statistical analysis and data visualization',
        'Odds comparison across multiple sportsbooks',
        'Historical performance tracking',
        'Educational content about sports betting analytics'
      ],
      outro: 'Users are solely responsible for their betting decisions and should conduct their own research and due diligence.'
    },
    {
      icon: Users,
      title: 'Age and Legal Restrictions',
      gradient: 'from-green-500 to-emerald-600',
      intro: 'You must be of legal gambling age in your jurisdiction to use OddSightSeer. Sports betting laws vary by location, and it is your responsibility to:',
      list: [
        'Verify that sports betting is legal in your jurisdiction',
        'Ensure you meet the minimum age requirements',
        'Comply with all applicable local, state, and federal laws',
        'Only use licensed and regulated sportsbooks'
      ]
    },
    {
      icon: Phone,
      title: 'Responsible Gambling',
      gradient: 'from-pink-500 to-rose-600',
      intro: 'We encourage responsible gambling practices. If you or someone you know has a gambling problem, please seek help:',
      list: [
        'National Council on Problem Gambling: 1-800-522-4700',
        'Gamblers Anonymous: www.gamblersanonymous.org',
        'National Problem Gambling Helpline: 1-800-522-4700'
      ]
    },
    {
      icon: Database,
      title: 'Data Accuracy',
      content: 'While we strive to provide accurate and up-to-date information, OddSightSeer does not guarantee the accuracy, completeness, or timeliness of any data, odds, or statistics displayed on the platform. Users should verify all information before making betting decisions.',
      gradient: 'from-amber-500 to-orange-600'
    },
    {
      icon: Link,
      title: 'Third-Party Services',
      content: 'OddSightSeer may display odds and information from third-party sportsbooks. We are not responsible for the terms, conditions, or operations of these third-party services. Any transactions or relationships with third-party sportsbooks are solely between you and that third party.',
      gradient: 'from-cyan-500 to-blue-600'
    },
    {
      icon: AlertOctagon,
      title: 'Limitation of Liability',
      content: 'OddSightSeer and its operators, employees, and affiliates are not liable for any losses, damages, or harm resulting from your use of the platform or any betting activities. Use of OddSightSeer is at your own risk.',
      gradient: 'from-red-500 to-rose-600'
    },
    {
      icon: Mail,
      title: 'Contact Us',
      content: 'If you have any questions about this disclaimer, please contact us at support@oddsightseer.com',
      gradient: 'from-indigo-500 to-purple-600'
    }
  ];

  return (
    <div className="relative min-h-screen bg-slate-950">
      {/* Animated Background Orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div 
          className="absolute top-20 -left-20 w-[500px] h-[500px] bg-amber-600/15 rounded-full blur-3xl"
          animate={{ 
            scale: [1, 1.2, 1],
            x: [0, 30, 0],
            opacity: [0.1, 0.2, 0.1]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute bottom-20 -right-20 w-[600px] h-[600px] bg-red-600/15 rounded-full blur-3xl"
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
            linear-gradient(to right, rgba(251, 191, 36, 0.03) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(251, 191, 36, 0.03) 1px, transparent 1px)
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
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div 
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-full mb-6"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span className="text-amber-300 text-sm font-semibold">Important Disclaimer</span>
            </motion.div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-6 tracking-tight">
              Betting{' '}
              <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-red-400 bg-clip-text text-transparent">
                Disclaimer
              </span>
            </h1>
            
            <p className="text-white/50 text-lg font-medium">
              Last updated: November 11, 2025
            </p>
          </motion.div>

          {/* Important Notice Banner */}
          <motion.div 
            className="mb-8 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-2xl p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg flex-shrink-0">
                <ShieldAlert className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-white text-xl font-bold mb-2">Important Notice</h2>
                <p className="text-white/70 leading-relaxed font-medium">
                  OddSightSeer is an analytics and information platform. We do not operate as a sportsbook or facilitate gambling transactions. All betting should be done responsibly and legally through licensed operators in your jurisdiction.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Content Sections */}
          <div className="space-y-6">
            {sections.map((section, index) => {
              const Icon = section.icon;
              return (
                <motion.section 
                  key={index}
                  className="relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 hover:border-amber-500/30 transition-all"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + index * 0.05 }}
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
                      
                      {section.outro && (
                        <p className="text-white/60 leading-relaxed font-medium mt-4">{section.outro}</p>
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