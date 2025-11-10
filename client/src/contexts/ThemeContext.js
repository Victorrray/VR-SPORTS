import { createContext, useContext, useState } from 'react';

const ThemeContext = createContext(undefined);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('solid-gradient');
  const [colorMode, setColorMode] = useState('dark');

  return (
    <ThemeContext.Provider value={{ theme, setTheme, colorMode, setColorMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// Theme configuration
export const themeConfig = {
  'liquid-glass': {
    name: 'Liquid Glass',
    background: 'bg-gradient-to-br from-purple-900 via-indigo-900 to-purple-900',
    card: 'bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-2xl border border-white/20 shadow-2xl',
    cardHover: 'hover:bg-white/15 hover:border-white/30',
    badge: 'bg-gradient-to-r from-purple-500/20 to-indigo-500/20 backdrop-blur-xl border border-purple-400/30 text-purple-300 shadow-lg shadow-purple-500/10',
    evBadge: 'bg-gradient-to-r from-emerald-500/90 to-green-500/90 backdrop-blur-xl border border-emerald-400/30 shadow-lg shadow-emerald-500/30',
    button: 'bg-gradient-to-r from-purple-500/30 via-indigo-500/30 to-purple-500/30 backdrop-blur-xl border border-purple-400/40 hover:from-purple-500/40 hover:via-indigo-500/40 hover:to-purple-500/40',
    text: 'text-white',
    textMuted: 'text-white/60',
    input: 'bg-white/5 backdrop-blur-2xl border border-white/10 focus:border-purple-400/40 focus:bg-white/10',
  },
  'neon-cyberpunk': {
    name: 'Neon Cyberpunk',
    background: 'bg-black',
    card: 'bg-gray-950 border-2 border-cyan-500/50 shadow-2xl shadow-cyan-500/20',
    cardHover: 'hover:border-cyan-400 hover:shadow-cyan-400/40',
    badge: 'bg-purple-600 border-2 border-pink-500 text-pink-200 shadow-lg shadow-pink-500/50',
    evBadge: 'bg-emerald-500 border-2 border-cyan-400 text-black shadow-lg shadow-cyan-500/50',
    button: 'bg-purple-600 border-2 border-pink-500 hover:bg-purple-500 hover:border-pink-400 shadow-lg shadow-pink-500/50',
    text: 'text-cyan-100',
    textMuted: 'text-cyan-400/60',
    input: 'bg-gray-950 border-2 border-cyan-500/30 focus:border-cyan-400 text-cyan-100',
  },
  'solid-gradient': {
    name: 'Solid Gradient',
    background: 'bg-gray-900',
    card: 'bg-gradient-to-br from-purple-600 to-indigo-700 shadow-2xl',
    cardHover: 'hover:from-purple-500 hover:to-indigo-600',
    badge: 'bg-white/20 border border-white/30 text-white shadow-lg',
    evBadge: 'bg-emerald-500 text-white shadow-lg',
    button: 'bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 shadow-lg',
    text: 'text-white',
    textMuted: 'text-white/80',
    input: 'bg-gray-800 border border-gray-700 focus:border-purple-400 text-white',
  },
  'clean-minimal': {
    name: 'Clean Minimal',
    background: 'bg-gray-50',
    card: 'bg-white border border-gray-200 shadow-lg',
    cardHover: 'hover:shadow-xl hover:border-gray-300',
    badge: 'bg-purple-100 border border-purple-200 text-purple-700',
    evBadge: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
    button: 'bg-purple-600 hover:bg-purple-700 text-white shadow-md',
    text: 'text-gray-900',
    textMuted: 'text-gray-500',
    input: 'bg-white border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 text-gray-900',
  },
  'neumorphism': {
    name: 'Neumorphism',
    background: 'bg-gradient-to-br from-purple-200 via-indigo-200 to-purple-200',
    card: 'bg-gradient-to-br from-purple-200 to-indigo-200 shadow-[8px_8px_16px_#9333ea40,-8px_-8px_16px_#ffffff40]',
    cardHover: 'hover:shadow-[12px_12px_24px_#9333ea40,-12px_-12px_24px_#ffffff40]',
    badge: 'bg-purple-300 shadow-[inset_2px_2px_4px_#9333ea40,inset_-2px_-2px_4px_#ffffff40] text-purple-800',
    evBadge: 'bg-emerald-300 shadow-[inset_2px_2px_4px_#10b98140,inset_-2px_-2px_4px_#ffffff40] text-emerald-800',
    button: 'bg-gradient-to-br from-purple-300 to-indigo-300 shadow-[4px_4px_8px_#9333ea40,-4px_-4px_8px_#ffffff40] hover:shadow-[inset_2px_2px_4px_#9333ea40,inset_-2px_-2px_4px_#ffffff40]',
    text: 'text-purple-900',
    textMuted: 'text-purple-600',
    input: 'bg-purple-200 shadow-[inset_2px_2px_4px_#9333ea40,inset_-2px_-2px_4px_#ffffff40] text-purple-900',
  },
  'dark-brutalism': {
    name: 'Dark Brutalism',
    background: 'bg-black',
    card: 'bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(147,51,234,1)]',
    cardHover: 'hover:shadow-[12px_12px_0px_0px_rgba(147,51,234,1)] hover:translate-x-[-4px] hover:translate-y-[-4px]',
    badge: 'bg-purple-600 border-2 border-black text-white',
    evBadge: 'bg-emerald-500 border-2 border-black text-black',
    button: 'bg-purple-600 border-4 border-black hover:bg-purple-700 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]',
    text: 'text-black',
    textMuted: 'text-gray-600',
    input: 'bg-white border-4 border-black focus:outline-none focus:ring-4 focus:ring-purple-600 text-black',
  },
};

// Light mode color overrides
export const lightModeColors = {
  background: 'bg-gradient-to-br from-gray-50 via-purple-50/30 to-indigo-50/30',
  sidebarBg: 'bg-white/80 backdrop-blur-2xl border-gray-200',
  headerBg: 'bg-white/80 backdrop-blur-2xl border-gray-200',
  card: 'bg-white border border-gray-200 shadow-lg',
  cardHover: 'hover:shadow-xl hover:border-purple-300',
  cardDark: 'bg-gradient-to-br from-gray-50 to-white border border-gray-200 shadow-md',
  text: 'text-gray-900',
  textMuted: 'text-gray-600',
  textLight: 'text-gray-500',
  border: 'border-gray-200',
  borderHover: 'hover:border-gray-300',
  badge: 'bg-purple-100 border border-purple-200 text-purple-700',
  badgeIcon: 'text-purple-600',
  evBadge: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
  button: 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-md',
  buttonSecondary: 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300',
  input: 'bg-white border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 text-gray-900',
  statsCard: 'bg-white border border-gray-200 shadow-md',
  statsIcon: 'bg-purple-100 border border-purple-200',
  statsIconColor: 'text-purple-600',
  statsBadge: 'bg-purple-100 text-purple-700',
  logoGradient: 'from-purple-600 to-indigo-600',
  navActive: 'bg-gradient-to-r from-purple-100 to-indigo-100 border border-purple-300 text-purple-900 shadow-md',
  navInactive: 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-transparent hover:border-gray-200',
  signOutButton: 'bg-red-50 border border-red-300 text-red-600 hover:bg-red-100',
};
