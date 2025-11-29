import { Hero } from './components/Hero';
import { Stats } from './components/Stats';
import { Features } from './components/Features';
import { Header } from './components/Header';
import { Bookmakers } from './components/Bookmakers';
import { HowItWorks } from './components/HowItWorks';
import { Pricing } from './components/Pricing';
import { FAQ } from './components/FAQ';
import { Footer } from './components/Footer';
import { LoginPage } from './components/LoginPage';
import { SignUpPage } from './components/SignUpPage';
import { ForgotPasswordPage } from './components/ForgotPasswordPage';
import { Dashboard } from './components/Dashboard';
import { Roadmap } from './components/Roadmap';
import { Privacy } from './components/Privacy';
import { Terms } from './components/Terms';
import { Disclaimer } from './components/Disclaimer';
import { FreeBetSection } from './components/FreeBetSection';
import { useState } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import { BankrollProvider } from './contexts/BankrollContext';

export default function App() {
  const [currentPage, setCurrentPage] = useState<'landing' | 'login' | 'signup' | 'forgot-password' | 'dashboard' | 'roadmap' | 'privacy' | 'terms' | 'disclaimer'>('landing');

  if (currentPage === 'login') {
    return (
      <LoginPage 
        onBack={() => setCurrentPage('landing')} 
        onSignUp={() => setCurrentPage('signup')}
        onForgotPassword={() => setCurrentPage('forgot-password')}
      />
    );
  }

  if (currentPage === 'signup') {
    return (
      <SignUpPage 
        onBack={() => setCurrentPage('landing')}
        onLogin={() => setCurrentPage('login')}
      />
    );
  }

  if (currentPage === 'forgot-password') {
    return (
      <ForgotPasswordPage 
        onBack={() => setCurrentPage('login')}
      />
    );
  }

  if (currentPage === 'dashboard') {
    return (
      <ThemeProvider>
        <BankrollProvider>
          <Dashboard onSignOut={() => setCurrentPage('landing')} />
        </BankrollProvider>
      </ThemeProvider>
    );
  }

  if (currentPage === 'roadmap') {
    return (
      <ThemeProvider>
        <div className="relative">
          <Header 
            onLoginClick={() => setCurrentPage('login')} 
            onDashboardClick={() => setCurrentPage('dashboard')}
            onSignUpClick={() => setCurrentPage('signup')}
            onRoadmapClick={() => setCurrentPage('roadmap')}
          />
          <Roadmap />
          <Footer 
            onRoadmapClick={() => setCurrentPage('roadmap')}
            onPrivacyClick={() => setCurrentPage('privacy')}
            onTermsClick={() => setCurrentPage('terms')}
            onDisclaimerClick={() => setCurrentPage('disclaimer')}
          />
        </div>
      </ThemeProvider>
    );
  }

  if (currentPage === 'privacy') {
    return (
      <Privacy 
        onBack={() => setCurrentPage('landing')}
        onLoginClick={() => setCurrentPage('login')}
        onDashboardClick={() => setCurrentPage('dashboard')}
        onSignUpClick={() => setCurrentPage('signup')}
        onRoadmapClick={() => setCurrentPage('roadmap')}
        onPrivacyClick={() => setCurrentPage('privacy')}
        onTermsClick={() => setCurrentPage('terms')}
        onDisclaimerClick={() => setCurrentPage('disclaimer')}
      />
    );
  }

  if (currentPage === 'terms') {
    return (
      <Terms 
        onBack={() => setCurrentPage('landing')}
        onLoginClick={() => setCurrentPage('login')}
        onDashboardClick={() => setCurrentPage('dashboard')}
        onSignUpClick={() => setCurrentPage('signup')}
        onRoadmapClick={() => setCurrentPage('roadmap')}
        onPrivacyClick={() => setCurrentPage('privacy')}
        onTermsClick={() => setCurrentPage('terms')}
        onDisclaimerClick={() => setCurrentPage('disclaimer')}
      />
    );
  }

  if (currentPage === 'disclaimer') {
    return (
      <Disclaimer 
        onBack={() => setCurrentPage('landing')}
        onLoginClick={() => setCurrentPage('login')}
        onDashboardClick={() => setCurrentPage('dashboard')}
        onSignUpClick={() => setCurrentPage('signup')}
        onRoadmapClick={() => setCurrentPage('roadmap')}
        onPrivacyClick={() => setCurrentPage('privacy')}
        onTermsClick={() => setCurrentPage('terms')}
        onDisclaimerClick={() => setCurrentPage('disclaimer')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-900" id="top">
      <div className="relative">
        <Header 
          onLoginClick={() => setCurrentPage('login')} 
          onDashboardClick={() => setCurrentPage('dashboard')}
          onSignUpClick={() => setCurrentPage('signup')}
          onRoadmapClick={() => setCurrentPage('roadmap')}
        />
        <Hero />
        <FreeBetSection />
        <Stats />
        <Bookmakers />
        <Features />
        <HowItWorks />
        <Pricing onLoginClick={() => setCurrentPage('login')} />
        <FAQ />
        <Footer 
          onRoadmapClick={() => setCurrentPage('roadmap')}
          onPrivacyClick={() => setCurrentPage('privacy')}
          onTermsClick={() => setCurrentPage('terms')}
          onDisclaimerClick={() => setCurrentPage('disclaimer')}
        />
      </div>
    </div>
  );
}