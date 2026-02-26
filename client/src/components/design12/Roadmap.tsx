import { Check, Clock, Lightbulb, Rocket, Zap, ArrowLeft, ChevronRight, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/SimpleAuth';
import { Header } from './Header';
import { motion } from 'framer-motion';

interface RoadmapItem {
  title: string;
  description: string;
  status: 'completed' | 'in-progress' | 'planned';
  quarter: string;
  features: string[];
}

const roadmapData: RoadmapItem[] = [
  {
    title: 'Platform Launch',
    description: 'Core betting analytics platform with essential features',
    status: 'completed',
    quarter: 'Q4 2024',
    features: [
      'Mobile-responsive design',
      'Version 1.2',
      'Complete Redesign of UI'
    ]
  },
  {
    title: 'Version 1.3',
    description: 'Stability improvements and bug fixes',
    status: 'in-progress',
    quarter: 'Q1 2025',
    features: [
      'Bug Fixes'
    ]
  }
];

export function Roadmap() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleLoginClick = () => navigate('/login');
  const handleDashboardClick = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };
  const handleRoadmapClick = () => navigate('/roadmap');
  const handleSignUpClick = () => navigate('/signup');

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden">
      {/* Animated Background Orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div 
          className="absolute top-20 -left-20 w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-3xl"
          animate={{ 
            scale: [1, 1.2, 1],
            x: [0, 30, 0],
            opacity: [0.15, 0.25, 0.15]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute bottom-20 -right-20 w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-3xl"
          animate={{ 
            scale: [1.2, 1, 1.2],
            x: [0, -30, 0],
            opacity: [0.15, 0.25, 0.15]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-violet-600/10 rounded-full blur-3xl"
          animate={{ 
            scale: [1, 1.3, 1],
            opacity: [0.1, 0.2, 0.1]
          }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* Grid Pattern */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(139, 92, 246, 0.03) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(139, 92, 246, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      <Header 
        onLoginClick={handleLoginClick}
        onDashboardClick={handleDashboardClick}
        onRoadmapClick={handleRoadmapClick}
        onSignupClick={handleSignUpClick}
      />

      <div className="relative z-10 pt-24 md:pt-32 pb-20 md:pb-28">
        <div className="container mx-auto px-4 md:px-6">
          {/* Back Button */}
          <motion.button 
            onClick={() => navigate('/')}
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
            className="text-center mb-16 md:mb-20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div 
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-500/20 to-violet-500/20 border border-purple-500/30 rounded-full mb-6"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
            >
              <Rocket className="w-4 h-4 text-purple-400" />
              <span className="text-purple-300 text-sm font-semibold">Product Roadmap</span>
            </motion.div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-6 tracking-tight">
              Building the Future of{' '}
              <span className="bg-gradient-to-r from-purple-400 via-violet-400 to-indigo-400 bg-clip-text text-transparent">
                Sports Betting
              </span>
            </h1>
            
            <p className="text-white/60 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed font-medium">
              Track our progress as we build the ultimate data-driven sports betting platform.
            </p>
          </motion.div>

          {/* Timeline */}
          <div className="max-w-4xl mx-auto">
            {/* Completed Section */}
            <motion.div 
              className="mb-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl text-white font-bold shadow-xl shadow-green-500/25">
                  <Check className="w-5 h-5" />
                  <span>Completed</span>
                </div>
                <div className="flex-1 h-px bg-gradient-to-r from-green-500/50 to-transparent" />
              </div>
              
              <motion.div 
                className="relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 hover:border-green-500/30 transition-all"
                whileHover={{ y: -2 }}
              >
                                <ul className="space-y-4 pl-4">
                  {roadmapData
                    .filter(item => item.status === 'completed')
                    .flatMap(item => item.features)
                    .map((feature, index) => (
                      <motion.li 
                        key={index} 
                        className="flex items-center gap-4"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + index * 0.1 }}
                      >
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-500/30">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-white/60 line-through font-medium">{feature}</span>
                      </motion.li>
                    ))}
                </ul>
              </motion.div>
            </motion.div>

            {/* In Progress Section */}
            <motion.div 
              className="mb-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-500 to-violet-600 rounded-2xl text-white font-bold shadow-xl shadow-purple-500/25">
                  <Zap className="w-5 h-5" />
                  <span>In Progress</span>
                </div>
                <div className="flex-1 h-px bg-gradient-to-r from-purple-500/50 to-transparent" />
              </div>
              
              <motion.div 
                className="relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 hover:border-purple-500/30 transition-all"
                whileHover={{ y: -2 }}
              >
                                
                {/* Animated pulse indicator */}
                <div className="absolute top-6 right-6">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-500"></span>
                  </span>
                </div>
                
                <ul className="space-y-4 pl-4">
                  {roadmapData
                    .filter(item => item.status === 'in-progress')
                    .flatMap(item => item.features)
                    .map((feature, index) => (
                      <motion.li 
                        key={index} 
                        className="flex items-center gap-4"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 + index * 0.1 }}
                      >
                        <div className="w-6 h-6 rounded-full border-2 border-purple-500/50 flex items-center justify-center">
                        </div>
                        <span className="text-white font-medium">{feature}</span>
                      </motion.li>
                    ))}
                </ul>
              </motion.div>
            </motion.div>

            {/* Planned Section (placeholder for future) */}
            <motion.div 
              className="mb-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-slate-600 to-slate-700 rounded-2xl text-white font-bold shadow-xl">
                  <Clock className="w-5 h-5" />
                  <span>Coming Soon</span>
                </div>
                <div className="flex-1 h-px bg-gradient-to-r from-slate-500/50 to-transparent" />
              </div>
              
              <motion.div 
                className="relative bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 border-dashed rounded-3xl p-6 md:p-8"
              >
                                <div className="text-center py-4">
                  <Lightbulb className="w-10 h-10 text-white/30 mx-auto mb-3" />
                  <p className="text-white/40 font-medium">More exciting features coming soon...</p>
                </div>
              </motion.div>
            </motion.div>
          </div>

          {/* CTA Section */}
          <motion.div 
            className="max-w-3xl mx-auto text-center mt-16 md:mt-20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <div className="relative">
              {/* Glow Effect */}
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/20 to-violet-500/20 rounded-[2rem] blur-xl" />
              
              <div className="relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 rounded-3xl p-8 md:p-12">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-purple-500/30">
                  <Mail className="w-8 h-8 text-white" />
                </div>
                
                <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-4">
                  Have a Feature Request?
                </h2>
                <p className="text-white/60 mb-8 leading-relaxed font-medium max-w-lg mx-auto">
                  We're always listening to our community. Share your ideas and help shape the future of OddSightSeer.
                </p>
                
                <motion.button 
                  onClick={() => window.location.href = 'mailto:support@oddsightseer.com?subject=Feature%20Feedback'}
                  className="group relative px-8 py-4 bg-gradient-to-r from-purple-600 to-violet-600 text-white rounded-2xl font-bold shadow-xl shadow-purple-500/25 hover:shadow-purple-500/40 transition-all overflow-hidden"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="relative z-10 flex items-center gap-2 justify-center">
                    Submit Feedback
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}