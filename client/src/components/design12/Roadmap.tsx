import { Check, Clock, Lightbulb, Rocket, Target, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/SimpleAuth';
import { Header } from './Header';

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
      'Historical performance tracking',
      'Mobile-responsive design',
      'Dark/Light mode support'
    ]
  },
  {
    title: 'Advanced Analytics',
    description: 'Enhanced data visualization and predictive modeling',
    status: 'in-progress',
    quarter: 'Q1 2025',
    features: [
      'Verison 1.02.0',
      'Complete Redesign of UI'
    ]
  },
  {
    title: 'Social Features',
    description: 'Community engagement and collaborative betting',
    status: 'planned',
    quarter: 'Q2 2025',
    features: [
      'Leaderboards and competitions',
      'Share picks with friends',
      'Live chat during games'
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <Check className="w-5 h-5" />;
      case 'in-progress':
        return <Zap className="w-5 h-5" />;
      case 'planned':
        return <Clock className="w-5 h-5" />;
      default:
        return <Lightbulb className="w-5 h-5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'from-green-500 to-emerald-500';
      case 'in-progress':
        return 'from-purple-500 to-indigo-500';
      case 'planned':
        return 'from-slate-500 to-slate-600';
      default:
        return 'from-purple-500 to-indigo-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'in-progress':
        return 'In Progress';
      case 'planned':
        return 'Planned';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <Header 
        onLoginClick={handleLoginClick}
        onDashboardClick={handleDashboardClick}
        onRoadmapClick={handleRoadmapClick}
        onSignupClick={handleSignUpClick}
      />
      <div className="pt-20 md:pt-24 pb-16 md:pb-24">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-12 md:mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border border-purple-500/20 rounded-full mb-6">
            <Rocket className="w-4 h-4 text-purple-400" />
            <span className="text-purple-400 text-sm font-medium">Product Roadmap</span>
          </div>
          <h1 className="bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent mb-4">
            Building the Future of Sports Betting
          </h1>
          <p className="text-white/60 max-w-2xl mx-auto leading-relaxed">
            Track our progress as we build the ultimate data driven sports betting platform.
          </p>
        </div>

        {/* Roadmap Sections */}
        <div className="max-w-4xl mx-auto space-y-12">
          {/* Completed */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl text-white font-medium shadow-lg">
                <Check className="w-5 h-5" />
                <span>Completed</span>
              </div>
            </div>
            <div className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-2xl p-6 md:p-8">
              <ul className="space-y-3">
                {roadmapData
                  .filter(item => item.status === 'completed')
                  .flatMap(item => item.features)
                  .map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                      <span className="text-white/80 line-through">{feature}</span>
                    </li>
                  ))}
              </ul>
            </div>
          </div>

          {/* In Progress */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl text-white font-medium shadow-lg">
                <Zap className="w-5 h-5" />
                <span>In Progress</span>
              </div>
            </div>
            <div className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-2xl p-6 md:p-8">
              <ul className="space-y-3">
                {roadmapData
                  .filter(item => item.status === 'in-progress')
                  .flatMap(item => item.features)
                  .map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <div className="w-2 h-2 rounded-full bg-white" />
                      </div>
                      <span className="text-white/80">{feature}</span>
                    </li>
                  ))}
              </ul>
            </div>
          </div>

          {/* Coming Soon */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-slate-500 to-slate-600 rounded-xl text-white font-medium shadow-lg">
                <Clock className="w-5 h-5" />
                <span>Coming Soon</span>
              </div>
            </div>
            <div className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-2xl p-6 md:p-8">
              <ul className="space-y-3">
                {roadmapData
                  .filter(item => item.status === 'planned')
                  .flatMap(item => item.features)
                  .map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <Clock className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
                      <span className="text-white/80">{feature}</span>
                    </li>
                  ))}
              </ul>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="max-w-3xl mx-auto text-center mt-16 md:mt-20">
          <div className="bg-gradient-to-br from-purple-500/10 to-indigo-500/10 border border-purple-500/20 rounded-2xl p-8 md:p-12">
            <h2 className="text-white mb-4">Have a Feature Request?</h2>
            <p className="text-white/60 mb-6 leading-relaxed">
              We're always listening to our community. Share your ideas and help shape the future of OddSightSeer.
            </p>
            <button className="px-8 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl hover:from-purple-600 hover:to-indigo-600 transition-all font-semibold shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 text-center">
              Submit Feedback
            </button>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}