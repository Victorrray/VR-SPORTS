import { ArrowLeft, Eye, EyeOff, Sparkles, TrendingUp, Zap } from 'lucide-react';
import { useState } from 'react';



export function LoginPage({ onBack }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', { email, password });
  };

  const stats = [
    { icon, value: '4.2%', label: 'Avg Edge' },
    { icon, value: '39+', label: 'Sportsbooks' },
    { icon, value: '24/7', label: 'Live Updates' },
  ];

  return (
    
      {/* Background Pattern */}
      

      {/* Floating Orbs */}
      
      

      
        
          {/* Left Side - Branding & Stats */}
          
            {/* Logo & Tagline */}
            
              
                
                Back to home
              

              
                
                  OS
                
                
                  OddSightSeer
                  Sports Betting Analytics
                
              

              
                Find Your{' '}
                
                  Winning Edge
                
              

              
                Join thousands of bettors using data-driven insights to identify profitable opportunities across 39+ sportsbooks.
              
            

            {/* Stats */}
            
              {stats.map((stat, idx) => (
                
                  
                  
                    
                    {stat.value}
                    {stat.label}
                  
                
              ))}
            

            {/* Testimonial */}
            
              
              
                
                  
                  
                    Mike Chen
                    Professional Bettor
                  
                
                
                  "OddSightSeer helped me increase my ROI by 300%. The positive EV finder is a game-changer."
                
              
            
          

          {/* Right Side - Login Form */}
          
            {/* Mobile Back Button */}
            
              
              Back to home
            

            
              
              
              
                {/* Mobile Logo */}
                
                  
                    OS
                  
                  OddSightSeer
                

                {/* Header */}
                
                  
                    {isLogin ? 'Welcome back' : 'Create account'}
                  
                  
                    {isLogin ? 'Enter your credentials to continue' : 'Start finding profitable bets today'}
                  
                

                {/* Tab Toggle */}
                
                   setIsLogin(true)}
                    className={`flex-1 py-3 rounded-xl font-bold transition-all text-center ${
                      isLogin
                        ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-lg shadow-purple-500/30'
                        : 'text-white/50 hover:text-white/80'
                    }`}
                  >
                    Login
                  
                   setIsLogin(false)}
                    className={`flex-1 py-3 rounded-xl font-bold transition-all text-center ${
                      !isLogin
                        ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-lg shadow-purple-500/30'
                        : 'text-white/50 hover:text-white/80'
                    }`}
                  >
                    Sign up
                  
                

                {/* Form */}
                
                  {/* Email */}
                  
                    Email address
                     setEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="w-full px-4 py-3.5 bg-slate-950/50 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all font-semibold"
                      required
                    />
                  

                  {/* Password */}
                  
                    Password
                    
                       setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-4 py-3.5 bg-slate-950/50 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all font-semibold pr-12"
                        required
                      />
                       setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                      >
                        {showPassword ?  : }
                      
                    
                  

                  {/* Remember & Forgot */}
                  {isLogin && (
                    
                      
                        
                        
                          Remember me
                        
                      
                      
                        Forgot password?
                      
                    
                  )}

                  {/* Submit Button */}
                  
                    {isLogin ? 'Login to your account' : 'Create your account'}
                  

                  {/* Divider */}
                  
                    
                      
                    
                    
                      OR CONTINUE WITH
                    
                  

                  {/* Social Login */}
                  
                    
                      
                      
                      
                      
                    
                    Google
                  

                  {/* Terms */}
                  
                    By continuing, you agree to our{' '}
                    Terms of Service
                    {' '}and{' '}
                    Privacy Policy
                  
                
              
            
          
        
      
    
  );
}