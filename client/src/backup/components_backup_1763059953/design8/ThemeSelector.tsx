import { Palette } from 'lucide-react';
import { useTheme, themeConfig, ThemeType } from '../../contexts/ThemeContext';

export function ThemeSelector() {
  const { theme, setTheme } = useTheme();

  const themes: ThemeType[] = [
    'liquid-glass',
    'neon-cyberpunk',
    'solid-gradient',
    'clean-minimal',
    'neumorphism',
    'dark-brutalism'
  ];

  return (
    <div className="relative group">
      <button className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${themeConfig[theme].button} ${themeConfig[theme].text}`}>
        <Palette className="w-4 h-4" />
        <span className="font-bold text-sm hidden lg:inline">Theme</span>
      </button>

      {/* Dropdown */}
      <div className="absolute right-0 top-full mt-2 w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
        <div className={`rounded-xl overflow-hidden shadow-2xl ${themeConfig[theme].card}`}>
          {themes.map((t) => (
            <button
              key={t}
              onClick={() => setTheme(t)}
              className={`w-full text-left px-4 py-3 font-bold text-sm transition-all ${
                theme === t
                  ? `${themeConfig[theme].badge}`
                  : `${themeConfig[theme].text} hover:bg-white/10`
              }`}
            >
              {themeConfig[t].name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
