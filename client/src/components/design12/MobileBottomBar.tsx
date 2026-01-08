import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, TrendingUp, BarChart3, Settings } from 'lucide-react';
import { useTheme, lightModeColors } from '../../contexts/ThemeContext';

interface Tab {
  key: string;
  label: string;
  icon: any;
  href: string;
}

export function MobileBottomBar() {
  const location = useLocation();
  const { colorMode } = useTheme();
  const isLight = colorMode === 'light';

  const tabs: Tab[] = [
    {
      key: 'home',
      label: 'Home',
      icon: Home,
      href: '/dashboard'
    },
    // Picks tab hidden for free version
    // {
    //   key: 'picks',
    //   label: 'Picks',
    //   icon: TrendingUp,
    //   href: '/picks'
    // },
    {
      key: 'account',
      label: 'Account',
      icon: Settings,
      href: '/account'
    }
  ];

  const isActive = (href: string) => {
    return location.pathname === href || location.pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile Bottom Navigation Bar - Only visible on mobile */}
      <div className={`md:hidden fixed bottom-0 left-0 right-0 z-40 ${
        isLight 
          ? 'bg-white border-t border-gray-200' 
          : 'bg-slate-900/95 border-t border-white/10'
      } backdrop-blur-xl`}>
        <nav className="flex items-center justify-around h-16 max-w-full">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = isActive(tab.href);

            return (
              <Link
                key={tab.key}
                to={tab.href}
                className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-all relative group ${
                  active
                    ? isLight
                      ? 'text-purple-600'
                      : 'text-purple-400'
                    : isLight
                    ? 'text-gray-600 hover:text-gray-900'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                {/* Icon */}
                <Icon size={24} className="transition-transform group-hover:scale-110" />

                {/* Label */}
                <span className="text-xs font-bold">{tab.label}</span>

                {/* Active Indicator */}
                {active && (
                  <div className={`absolute bottom-0 left-0 right-0 h-1 ${
                    isLight
                      ? 'bg-gradient-to-r from-purple-500 to-indigo-500'
                      : 'bg-gradient-to-r from-purple-400 to-indigo-400'
                  }`} />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Spacer to prevent content from being hidden behind the bar - Only on mobile */}
      <div className="md:hidden h-16" aria-hidden="true" />
    </>
  );
}

export default MobileBottomBar;
