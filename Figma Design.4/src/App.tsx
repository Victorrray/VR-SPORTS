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
import { useState } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';

export default function App() {
  const [currentPage, setCurrentPage] = useState<'landing' | 'login' | 'signup' | 'forgot-password' | 'dashboard'>('landing');

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
        <Dashboard onSignOut={() => setCurrentPage('landing')} />
      </ThemeProvider>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900" id="top">
      <div className="relative">
        <Header 
          onLoginClick={() => setCurrentPage('login')} 
          onDashboardClick={() => setCurrentPage('dashboard')}
          onSignUpClick={() => setCurrentPage('signup')}
        />
        <Hero />
        <Stats />
        <Bookmakers />
        <Features />
        <HowItWorks />
        <Pricing onLoginClick={() => setCurrentPage('login')} />
        <FAQ />
        <Footer />
      </div>
    </div>
  );
}