import React, { useState } from 'react';
import { ChevronRight, Zap, TrendingUp, Shield, Smartphone, Gauge } from 'lucide-react';
import '../styles/theme-demo.css';

const themes = [
  // Dark Themes
  {
    name: 'Purple (Current)',
    id: 'purple',
    primary: '#8b5cf6',
    secondary: '#7c3aed',
    accent: '#a78bfa',
    background: '#0f0b1a',
    surface: '#1a1025',
    text: '#ffffff',
    textSecondary: 'rgba(255, 255, 255, 0.7)',
    mode: 'dark',
  },
  {
    name: 'Blue Electric',
    id: 'blue-electric',
    primary: '#0ea5e9',
    secondary: '#0284c7',
    accent: '#06b6d4',
    background: '#0c1117',
    surface: '#161b22',
    text: '#ffffff',
    textSecondary: 'rgba(255, 255, 255, 0.7)',
    mode: 'dark',
  },
  {
    name: 'Neon Green',
    id: 'neon-green',
    primary: '#10b981',
    secondary: '#059669',
    accent: '#34d399',
    background: '#0a1f12',
    surface: '#143d2e',
    text: '#ffffff',
    textSecondary: 'rgba(255, 255, 255, 0.7)',
    mode: 'dark',
  },
  {
    name: 'Crimson Red',
    id: 'crimson-red',
    primary: '#ef4444',
    secondary: '#dc2626',
    accent: '#f87171',
    background: '#1a0a0a',
    surface: '#2a1010',
    text: '#ffffff',
    textSecondary: 'rgba(255, 255, 255, 0.7)',
    mode: 'dark',
  },
  {
    name: 'Gold Premium',
    id: 'gold-premium',
    primary: '#f59e0b',
    secondary: '#d97706',
    accent: '#fbbf24',
    background: '#1a1410',
    surface: '#2a1f0f',
    text: '#ffffff',
    textSecondary: 'rgba(255, 255, 255, 0.7)',
    mode: 'dark',
  },
  {
    name: 'Teal Aqua',
    id: 'teal-aqua',
    primary: '#14b8a6',
    secondary: '#0d9488',
    accent: '#2dd4bf',
    background: '#0a1f1b',
    surface: '#143d38',
    text: '#ffffff',
    textSecondary: 'rgba(255, 255, 255, 0.7)',
    mode: 'dark',
  },
  {
    name: 'Indigo Deep',
    id: 'indigo-deep',
    primary: '#6366f1',
    secondary: '#4f46e5',
    accent: '#818cf8',
    background: '#0f0d1f',
    surface: '#1a1840',
    text: '#ffffff',
    textSecondary: 'rgba(255, 255, 255, 0.7)',
    mode: 'dark',
  },
  {
    name: 'Pink Magenta',
    id: 'pink-magenta',
    primary: '#ec4899',
    secondary: '#db2777',
    accent: '#f472b6',
    background: '#1a0a15',
    surface: '#2a1025',
    text: '#ffffff',
    textSecondary: 'rgba(255, 255, 255, 0.7)',
    mode: 'dark',
  },
  // Light Themes
  {
    name: 'Purple Light',
    id: 'purple-light',
    primary: '#8b5cf6',
    secondary: '#7c3aed',
    accent: '#a78bfa',
    background: '#ffffff',
    surface: '#f5f3ff',
    text: '#1f2937',
    textSecondary: 'rgba(31, 41, 55, 0.7)',
    mode: 'light',
  },
  {
    name: 'Blue Light',
    id: 'blue-light',
    primary: '#0ea5e9',
    secondary: '#0284c7',
    accent: '#06b6d4',
    background: '#ffffff',
    surface: '#f0f9ff',
    text: '#1f2937',
    textSecondary: 'rgba(31, 41, 55, 0.7)',
    mode: 'light',
  },
  {
    name: 'Green Light',
    id: 'green-light',
    primary: '#10b981',
    secondary: '#059669',
    accent: '#34d399',
    background: '#ffffff',
    surface: '#f0fdf4',
    text: '#1f2937',
    textSecondary: 'rgba(31, 41, 55, 0.7)',
    mode: 'light',
  },
  {
    name: 'Red Light',
    id: 'red-light',
    primary: '#ef4444',
    secondary: '#dc2626',
    accent: '#f87171',
    background: '#ffffff',
    surface: '#fef2f2',
    text: '#1f2937',
    textSecondary: 'rgba(31, 41, 55, 0.7)',
    mode: 'light',
  },
  {
    name: 'Amber Light',
    id: 'amber-light',
    primary: '#f59e0b',
    secondary: '#d97706',
    accent: '#fbbf24',
    background: '#ffffff',
    surface: '#fffbeb',
    text: '#1f2937',
    textSecondary: 'rgba(31, 41, 55, 0.7)',
    mode: 'light',
  },
  {
    name: 'Teal Light',
    id: 'teal-light',
    primary: '#14b8a6',
    secondary: '#0d9488',
    accent: '#2dd4bf',
    background: '#ffffff',
    surface: '#f0fdfa',
    text: '#1f2937',
    textSecondary: 'rgba(31, 41, 55, 0.7)',
    mode: 'light',
  },
  {
    name: 'Indigo Light',
    id: 'indigo-light',
    primary: '#6366f1',
    secondary: '#4f46e5',
    accent: '#818cf8',
    background: '#ffffff',
    surface: '#f5f3ff',
    text: '#1f2937',
    textSecondary: 'rgba(31, 41, 55, 0.7)',
    mode: 'light',
  },
  {
    name: 'Rose Light',
    id: 'rose-light',
    primary: '#ec4899',
    secondary: '#db2777',
    accent: '#f472b6',
    background: '#ffffff',
    surface: '#fff5f7',
    text: '#1f2937',
    textSecondary: 'rgba(31, 41, 55, 0.7)',
    mode: 'light',
  },
];

function ThemeCard({ theme }) {
  return (
    <div className="theme-card">
      <div className="theme-preview" style={{ background: theme.background }}>
        <div className="preview-content">
          <div className="preview-header">
            <div className="logo" style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})` }}>VR</div>
            <span style={{ color: theme.text, fontWeight: 700 }}>VR-Odds</span>
          </div>
          
          <div className="preview-hero">
            <h2 style={{ color: theme.text }}>
              Win More
              <br />
              <span style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Bets
              </span>
            </h2>
            <p style={{ color: theme.textSecondary }}>Smart odds comparison</p>
          </div>

          <div className="preview-features">
            {[1, 2, 3].map((i) => (
              <div key={i} className="feature-item" style={{ borderColor: `${theme.primary}40` }}>
                <div className="feature-dot" style={{ background: theme.primary }}></div>
                <span style={{ color: theme.textSecondary, fontSize: '0.75em' }}>Feature {i}</span>
              </div>
            ))}
          </div>

          <button style={{ 
            background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
            color: '#fff',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '6px',
            fontSize: '0.85em',
            fontWeight: 600,
            cursor: 'pointer'
          }}>
            Get Started
          </button>
        </div>
      </div>

      <div className="theme-info">
        <h3 style={{ color: theme.text }}>{theme.name}</h3>
        <div className="color-swatches">
          <div className="swatch" style={{ background: theme.primary }} title="Primary"></div>
          <div className="swatch" style={{ background: theme.secondary }} title="Secondary"></div>
          <div className="swatch" style={{ background: theme.accent }} title="Accent"></div>
          <div className="swatch" style={{ background: theme.surface }} title="Surface"></div>
        </div>
        <code style={{ color: theme.textSecondary, fontSize: '0.7em' }}>
          {theme.primary}
        </code>
      </div>
    </div>
  );
}

function FullPagePreview({ theme }) {
  return (
    <div style={{ background: theme.background, color: theme.text, minHeight: '100vh', padding: '40px 20px' }}>
      {/* Navbar */}
      <nav style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '60px',
        paddingBottom: '20px',
        borderBottom: `1px solid ${theme.primary}40`
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ 
            width: '32px', 
            height: '32px', 
            background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '0.9em'
          }}>VR</div>
          <span style={{ fontWeight: 700, fontSize: '1.1em' }}>VR-Odds</span>
        </div>
        <div style={{ display: 'flex', gap: '20px' }}>
          <a href="#" style={{ color: theme.textSecondary, textDecoration: 'none' }}>Features</a>
          <a href="#" style={{ color: theme.textSecondary, textDecoration: 'none' }}>Pricing</a>
          <a href="#" style={{ color: theme.textSecondary, textDecoration: 'none' }}>Docs</a>
        </div>
      </nav>

      {/* Hero Section */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', marginBottom: '100px' }}>
        <h1 style={{ fontSize: '3.5em', fontWeight: 800, marginBottom: '20px', lineHeight: 1.2 }}>
          Win More
          <br />
          <span style={{ 
            background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            Smart Bets
          </span>
        </h1>
        <p style={{ fontSize: '1.2em', color: theme.textSecondary, marginBottom: '30px', maxWidth: '500px' }}>
          Compare odds across 39+ sportsbooks instantly. Get the best lines and maximize your edge.
        </p>
        <button style={{
          background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
          color: '#fff',
          border: 'none',
          padding: '14px 32px',
          borderRadius: '8px',
          fontSize: '1em',
          fontWeight: 600,
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          Start Free Trial <ChevronRight size={20} />
        </button>
      </div>

      {/* Features Grid */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', marginBottom: '100px' }}>
        <h2 style={{ fontSize: '2em', fontWeight: 700, marginBottom: '40px' }}>Features</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
          {[
            { icon: Zap, title: 'Real-Time Odds', desc: 'Live odds updates across all books' },
            { icon: TrendingUp, title: 'Line Shopping', desc: 'Find the best lines instantly' },
            { icon: Shield, title: 'Secure', desc: 'Enterprise-grade security' },
            { icon: Gauge, title: 'EV Tracking', desc: 'Calculate expected value' },
          ].map((feature, i) => {
            const Icon = feature.icon;
            return (
              <div key={i} style={{
                background: theme.surface,
                border: `1px solid ${theme.primary}40`,
                borderRadius: '12px',
                padding: '24px',
                transition: 'all 0.3s ease'
              }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  background: `${theme.primary}20`,
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '16px'
                }}>
                  <Icon size={24} color={theme.primary} />
                </div>
                <h3 style={{ fontSize: '1.1em', fontWeight: 600, marginBottom: '8px' }}>{feature.title}</h3>
                <p style={{ color: theme.textSecondary, fontSize: '0.95em' }}>{feature.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Stats Section */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', marginBottom: '100px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
          {[
            { label: '39+', value: 'Sportsbooks' },
            { label: '1000+', value: 'Markets' },
            { label: '50ms', value: 'Update Speed' },
            { label: '99.9%', value: 'Uptime' },
          ].map((stat, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: '2.5em',
                fontWeight: 800,
                background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                marginBottom: '8px'
              }}>
                {stat.label}
              </div>
              <div style={{ color: theme.textSecondary }}>{stat.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{
        borderTop: `1px solid ${theme.primary}40`,
        paddingTop: '40px',
        textAlign: 'center',
        color: theme.textSecondary
      }}>
        <p>&copy; 2025 VR-Odds. All rights reserved.</p>
      </div>
    </div>
  );
}

export default function ThemeDemo() {
  const [selectedTheme, setSelectedTheme] = useState(null);
  const [modeFilter, setModeFilter] = useState('all'); // 'all', 'dark', 'light'

  const filteredThemes = modeFilter === 'all' 
    ? themes 
    : themes.filter(t => t.mode === modeFilter);

  if (selectedTheme) {
    return (
      <div>
        <button
          onClick={() => setSelectedTheme(null)}
          style={{
            position: 'fixed',
            top: '20px',
            left: '20px',
            zIndex: 1000,
            background: '#8b5cf6',
            color: '#fff',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 600
          }}
        >
          ← Back to Gallery
        </button>
        <FullPagePreview theme={selectedTheme} />
      </div>
    );
  }

  return (
    <div style={{ background: '#0f0b1a', color: '#fff', minHeight: '100vh', padding: '40px 20px' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ marginBottom: '60px' }}>
          <h1 style={{ fontSize: '2.5em', fontWeight: 800, marginBottom: '12px' }}>Theme Gallery</h1>
          <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '1.1em', marginBottom: '24px' }}>
            Explore different color palettes and themes for VR-Odds landing page
          </p>
          
          {/* Mode Filter Tabs */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '40px' }}>
            {['all', 'dark', 'light'].map((mode) => (
              <button
                key={mode}
                onClick={() => setModeFilter(mode)}
                style={{
                  padding: '10px 20px',
                  borderRadius: '6px',
                  border: 'none',
                  background: modeFilter === mode ? '#8b5cf6' : 'rgba(139, 92, 246, 0.2)',
                  color: '#fff',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  textTransform: 'capitalize'
                }}
              >
                {mode === 'all' ? 'All Themes' : `${mode.charAt(0).toUpperCase() + mode.slice(1)} Mode`}
              </button>
            ))}
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '24px'
        }}>
          {filteredThemes.map((theme) => (
            <div
              key={theme.id}
              onClick={() => setSelectedTheme(theme)}
              style={{ cursor: 'pointer', transition: 'transform 0.2s ease' }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <ThemeCard theme={theme} />
            </div>
          ))}
        </div>

        <div style={{ marginTop: '60px', padding: '24px', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '12px', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
          <h3 style={{ marginBottom: '12px' }}>How to Use</h3>
          <ul style={{ color: 'rgba(255, 255, 255, 0.8)', lineHeight: 1.8 }}>
            <li>Click any theme card to see a full-page preview</li>
            <li>Use the color values to update your CSS variables</li>
            <li>Each theme includes primary, secondary, accent, and surface colors</li>
            <li>All themes are optimized for dark mode with high contrast</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
