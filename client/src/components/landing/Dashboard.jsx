import { BarChart2, TrendingUp, Crown, LogOut, User, Home, Filter, Search, ChevronDown, Calendar, DollarSign, Target, Sparkles, ArrowUpRight, ArrowDownRight, Clock, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';



export function Dashboard({ onSignOut }) {
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedSport, setSelectedSport] = useState('all');

  const stats = [
    { 
      label: 'Win Rate', 
      value: '67.3%', 
      change: '+5.2%',
      positive,
      icon: Target
    },
    { 
      label: 'Average Edge', 
      value: '4.8%', 
      change: '+0.3%',
      positive,
      icon: TrendingUp
    },
    { 
      label: 'Total Profit', 
      value: '$3,247', 
      change: '+$892',
      positive,
      icon: DollarSign
    },
    { 
      label: 'Active Bets', 
      value: '12', 
      change: '3 today',
      positive,
      icon: Sparkles
    },
  ];

  const bets = [
    {
      id,
      teams: 'Detroit Pistons @ Philadelphia 76ers',
      time: 'Sun, Nov 10 4:41 PM PST',
      pick: 'Detroit Pistons -3.5',
      odds: '-118',
      sportsbook: 'DraftKings',
      ev: '+8.2%',
      sport: 'NBA',
      status: 'active',
      confidence: 'High'
    },
    {
      id,
      teams: 'Lakers @ Warriors',
      time: 'Sun, Nov 10 7:00 PM PST',
      pick: 'Over 228.5',
      odds: '-110',
      sportsbook: 'FanDuel',
      ev: '+6.5%',
      sport: 'NBA',
      status: 'active',
      confidence: 'Medium'
    },
    {
      id,
      teams: 'Cowboys @ Giants',
      time: 'Sun, Nov 10 1:00 PM EST',
      pick: 'Cowboys -7.5',
      odds: '-115',
      sportsbook: 'BetMGM',
      ev: '+5.8%',
      sport: 'NFL',
      status: 'active',
      confidence: 'High'
    },
    {
      id,
      teams: 'Celtics @ Heat',
      time: 'Mon, Nov 11 7:30 PM EST',
      pick: 'Celtics ML',
      odds: '-125',
      sportsbook: 'Caesars',
      ev: '+4.3%',
      sport: 'NBA',
      status: 'upcoming',
      confidence: 'Medium'
    }
  ];

  return (
    
      {/* Background Pattern */}
      

      
        {/* Sidebar */}
        
          
            {/* Logo */}
            
              
                
                  OS
                
                OddSightSeer
              
            

            {/* User Profile */}
            
              
                
                  
                
                
                  NotVic
                  
                    
                    Platinum
                  
                
              
            

            {/* Navigation */}
            
              
                
                Dashboard
              
              
                
                Analytics
              
              
                
                Bet History
              
              
                
                Account
              
            

            {/* Sign Out */}
            
              
                
                Sign Out
              
            
          
        

        {/* Main Content */}
        
          {/* Mobile Header */}
          
            
              
                
                  OS
                
                OddSightSeer
              
              
                
              
            
          

          
            {/* Header Section */}
            
              
                
                  Welcome back, NotVic!
                  Here are your recommended picks for today
                
                
                  
                    
                    Today
                    
                  
                
              

              {/* Stats Grid */}
              
                {stats.map((stat, idx) => (
                  
                    
                      
                        
                      
                      
                        {stat.positive ?  : }
                        {stat.change}
                      
                    
                    
                      {stat.value}
                      {stat.label}
                    
                  
                ))}
              
            

            {/* Filters & Search */}
            
              
                
                
              
              
                
                  
                  Sport
                  
                
                
                  EV Range
                  
                
              
            

            {/* Bets Section */}
            
              
                
                  
                  Top Picks
                  
                    {bets.length} Available
                  
                
                
                  
                    All
                  
                  
                    NBA
                  
                  
                    NFL
                  
                
              

              {/* Bet Cards Grid */}
              
                {bets.map((bet) => (
                  
                    {/* Card Header */}
                    
                      
                        
                          
                            {bet.teams}
                          
                          
                            
                            {bet.time}
                          
                        
                        
                          {bet.ev}
                        
                      
                      
                        
                          {bet.sport}
                        
                        
                          {bet.confidence} Confidence
                        
                      
                    

                    {/* Card Content */}
                    
                      {/* Pick Display */}
                      
                        
                          Recommended Pick
                        
                        
                          {bet.pick}
                        
                      

                      {/* Odds & Sportsbook */}
                      
                        
                          
                            Sportsbook
                          
                          {bet.sportsbook}
                        
                        
                          
                            Odds
                          
                          {bet.odds}
                        
                      

                      {/* Action Buttons */}
                      
                        
                          Compare Odds
                        
                        
                          Place Bet
                        
                      
                    
                  
                ))}
              
            
          
        
      
    
  );
}
