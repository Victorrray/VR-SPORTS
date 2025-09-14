#!/usr/bin/env node

// Debug script to check why a user can't see any bets
const fs = require('fs');
const path = require('path');

function debugUserBets() {
  console.log('🔍 Debugging user betting visibility issues...\n');
  
  // Check localStorage simulation for sportsbook selection
  console.log('📋 Default Sportsbook Selection:');
  const defaultBooks = ["draftkings", "fanduel", "betmgm", "caesars", "betrivers", "pointsbet", "unibet", "bovada"];
  console.log('Default selected books:', defaultBooks);
  
  console.log('\n🎯 Potential Issues to Check:');
  console.log('1. User has no sportsbooks selected in Profile');
  console.log('2. API is not returning games for today');
  console.log('3. Games exist but no bookmakers match user selection');
  console.log('4. Live games are being filtered out incorrectly');
  console.log('5. Date filtering is too restrictive');
  
  console.log('\n🛠️  Debugging Steps:');
  console.log('1. Check browser localStorage for "userSelectedSportsbooks"');
  console.log('2. Verify API is returning games data');
  console.log('3. Check console logs for filtering debug info');
  console.log('4. Ensure user is on correct date (Today vs Live)');
  
  console.log('\n💡 Quick Fixes:');
  console.log('- Clear localStorage and refresh page');
  console.log('- Go to Profile and re-select sportsbooks');
  console.log('- Try switching between "Today" and "Live Games" filters');
  console.log('- Check if games show up without any date filter');
}

debugUserBets();
