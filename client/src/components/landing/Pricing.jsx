import { Check, HelpCircle, Star, Crown } from 'lucide-react';



export function Pricing({ onLoginClick }) {
  const goldFeatures = [
    { text: '39+ sportsbooks tracked', tooltip: 'Real-time odds from all major operators' },
    { text: 'Positive EV bet finder', tooltip: 'Algorithm identifies profitable opportunities' },
    { text: 'Player props analytics', tooltip: 'Deep stats on player performance' },
    { text: 'Game lines & spreads', tooltip: 'All major betting markets covered' },
    { text: 'Real-time odds updates', tooltip: 'Updates every second' },
  ];

  const platinumFeatures = [
    { text: 'Everything in Gold, plus:', tooltip: 'All Gold features included' },
    { text: 'Arbitrage opportunities', tooltip: 'Risk-free betting profits' },
    { text: 'Live betting markets', tooltip: 'In-game betting odds' },
    { text: 'Advanced analytics dashboard', tooltip: 'Comprehensive performance tracking' },
    { text: 'Priority support', tooltip: '24/7 dedicated support' },
  ];

  return (
    
      
        {/* Header */}
        
          
            
            Simple Pricing
          
          
          
            Choose Your{' '}
            
              Winning Plan
            
          
          
          
            Both plans include access to 39+ sportsbooks
          
        

        {/* Pricing Cards */}
        
          {/* Gold Plan */}
          
            {/* Subtle overlay gradient */}
            
            
            
              {/* Badge */}
              
                
                Best Value
              

              {/* Plan Name */}
              Gold

              {/* Price */}
              
                $10
                /month
              
              billed monthly

              {/* Features */}
              
                {goldFeatures.map((feature, idx) => (
                  
                    
                      
                        
                      
                      
                        {feature.text}
                      
                    
                    
                  
                ))}
              

              {/* CTA Button */}
              
                Upgrade Plan
              
            
          

          {/* Platinum Plan */}
          
            {/* Subtle overlay gradient */}
            
            
            
              {/* Badge */}
              
                
                Most Popular
              

              {/* Plan Name */}
              Platinum

              {/* Price */}
              
                $25
                /month
              
              billed monthly

              {/* Features */}
              
                {platinumFeatures.map((feature, idx) => (
                  
                    
                      
                        
                      
                      
                        {feature.text}
                      
                    
                    
                  
                ))}
              

              {/* CTA Button */}
              
                Upgrade Plan
              
            
          
        
      
    
  );
}