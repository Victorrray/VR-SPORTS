import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

export type ThemeType = "solid-gradient";

export type ColorMode = "dark" | "light";

export type OddsFormat = "american" | "decimal" | "fractional";

interface ThemeContextType {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
  colorMode: ColorMode;
  setColorMode: (mode: ColorMode) => void;
  oddsFormat: OddsFormat;
  setOddsFormat: (format: OddsFormat) => void;
}

const ThemeContext = createContext<
  ThemeContextType | undefined
>(undefined);

const ODDS_FORMAT_KEY = 'vr_odds_format';

export function ThemeProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [theme, setTheme] =
    useState<ThemeType>("solid-gradient");
  // Force dark mode - light mode disabled for now
  const [colorMode] = useState<ColorMode>("dark");
  // No-op setter to prevent light mode
  const setColorMode = (_mode: ColorMode) => {
    // Light mode disabled - always use dark
    console.log('Light mode is currently disabled');
  };

  // Odds format with localStorage persistence
  const [oddsFormat, setOddsFormatState] = useState<OddsFormat>(() => {
    const saved = localStorage.getItem(ODDS_FORMAT_KEY);
    return (saved as OddsFormat) || 'american';
  });

  const setOddsFormat = (format: OddsFormat) => {
    setOddsFormatState(format);
    localStorage.setItem(ODDS_FORMAT_KEY, format);
  };

  return (
    <ThemeContext.Provider
      value={{ theme, setTheme, colorMode, setColorMode, oddsFormat, setOddsFormat }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error(
      "useTheme must be used within a ThemeProvider",
    );
  }
  return context;
}

// Theme configuration
export const themeConfig = {
  "solid-gradient": {
    name: "Solid Gradient",
    background: "bg-gray-900",
    card: "bg-gradient-to-br from-purple-600 to-indigo-700 shadow-2xl",
    cardHover: "hover:from-purple-500 hover:to-indigo-600",
    badge:
      "bg-white/20 border border-white/30 text-white shadow-lg",
    evBadge: "bg-emerald-500 text-white shadow-lg",
    button:
      "bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 shadow-lg",
    text: "text-white",
    textMuted: "text-white/80",
    input:
      "bg-gray-800 border border-gray-700 focus:border-purple-400 text-white",
  },
};

// Light mode color overrides
export const lightModeColors = {
  background:
    "bg-gradient-to-br from-gray-50 via-purple-50/30 to-indigo-50/30",
  sidebarBg: "bg-white/80 backdrop-blur-2xl border-gray-200",
  headerBg: "bg-white/80 backdrop-blur-2xl border-gray-200",
  card: "bg-white border border-gray-200 shadow-lg",
  cardHover: "hover:shadow-xl hover:border-purple-300",
  cardDark:
    "bg-gradient-to-br from-gray-50 to-white border border-gray-200 shadow-md",
  text: "text-gray-900",
  textMuted: "text-gray-600",
  textLight: "text-gray-500",
  border: "border-gray-200",
  borderHover: "hover:border-gray-300",
  badge:
    "bg-purple-100 border border-purple-200 text-purple-700",
  badgeIcon: "text-purple-600",
  evBadge:
    "bg-emerald-100 text-emerald-700 border border-emerald-200",
  button:
    "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-md",
  buttonSecondary:
    "bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300",
  input:
    "bg-white border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 text-gray-900",
  statsCard: "bg-white border border-gray-200 shadow-md",
  statsIcon: "bg-purple-100 border border-purple-200",
  statsIconColor: "text-purple-600",
  statsBadge: "bg-purple-100 text-purple-700",
  logoGradient: "from-purple-600 to-indigo-600",
  navActive:
    "bg-gradient-to-r from-purple-100 to-indigo-100 border border-purple-300 text-purple-900 shadow-md",
  navInactive:
    "text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-transparent hover:border-gray-200",
  signOutButton:
    "bg-red-50 border border-red-300 text-red-600 hover:bg-red-100",
};