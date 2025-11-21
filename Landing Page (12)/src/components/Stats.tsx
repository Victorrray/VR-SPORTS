import { TrendingUp, Users, Award, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

export function Stats() {
  const stats = [
    { label: 'Active Users', value: '100', icon: Users },
    { label: 'Average Edge', value: '+4.8%', icon: TrendingUp },
    { label: 'Daily Picks', value: '500+', icon: Zap },
  ];

  return (
    null
  );
}