#!/usr/bin/env node

// Comprehensive Site Audit Script for VR-Odds Platform
const axios = require('axios');
const fs = require('fs');

const BASE_URL = 'http://localhost:10000';
const CLIENT_URL = 'http://localhost:3000';
const USER_ID = 'demo-user';

class SiteAuditor {
  constructor() {
    this.results = {
      backend: {},
      frontend: {},
      userFlows: {},
      issues: [],
      recommendations: []
    };
  }

  async auditBackendEndpoints() {
    console.log('🔍 Testing Backend API Endpoints...\n');
    
    const endpoints = [
      { name: 'Health Check', url: '/api/health', method: 'GET' },
      { name: 'User Usage', url: '/api/me/usage', method: 'GET', headers: { 'x-user-id': USER_ID } },
      { name: 'NFL Odds', url: '/api/odds?sports=americanfootball_nfl&regions=us&markets=h2h,spreads,totals', method: 'GET', headers: { 'x-user-id': USER_ID } },
      { name: 'NFL Scores', url: '/api/scores?sport=americanfootball_nfl', method: 'GET', headers: { 'x-user-id': USER_ID } },
      { name: 'Sports List', url: '/api/sports', method: 'GET', headers: { 'x-user-id': USER_ID } },
      { name: 'NBA Odds', url: '/api/odds?sports=basketball_nba&regions=us&markets=h2h,spreads,totals', method: 'GET', headers: { 'x-user-id': USER_ID } },
      { name: 'Player Props', url: '/api/odds?sports=americanfootball_nfl&regions=us&markets=player_pass_tds,player_rush_yds', method: 'GET', headers: { 'x-user-id': USER_ID } }
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await axios({
          method: endpoint.method,
          url: `${BASE_URL}${endpoint.url}`,
          headers: endpoint.headers || {},
          timeout: 10000
        });
        
        this.results.backend[endpoint.name] = {
          status: 'WORKING ✅',
          statusCode: response.status,
          dataLength: Array.isArray(response.data) ? response.data.length : Object.keys(response.data || {}).length,
          sampleData: JSON.stringify(response.data).substring(0, 200) + '...'
        };
        
        console.log(`✅ ${endpoint.name}: ${response.status} (${this.results.backend[endpoint.name].dataLength} items)`);
      } catch (error) {
        this.results.backend[endpoint.name] = {
          status: 'ERROR ❌',
          error: error.response?.status || error.code,
          message: error.response?.data?.error || error.message
        };
        
        console.log(`❌ ${endpoint.name}: ${error.response?.status || error.code} - ${error.response?.data?.error || error.message}`);
        this.results.issues.push(`Backend: ${endpoint.name} failing - ${error.response?.data?.error || error.message}`);
      }
    }
  }

  async auditAdminEndpoints() {
    console.log('\n🔐 Testing Admin Endpoints...\n');
    
    const adminEndpoints = [
      {
        name: 'Grant Platinum',
        url: '/api/admin/set-plan',
        method: 'POST',
        headers: { 'Authorization': 'Bearer admin-dev-key-2024', 'Content-Type': 'application/json' },
        data: { userId: 'test-user', plan: 'platinum' }
      }
    ];

    for (const endpoint of adminEndpoints) {
      try {
        const response = await axios({
          method: endpoint.method,
          url: `${BASE_URL}${endpoint.url}`,
          headers: endpoint.headers,
          data: endpoint.data,
          timeout: 5000
        });
        
        this.results.backend[endpoint.name] = {
          status: 'WORKING ✅',
          statusCode: response.status,
          response: response.data
        };
        
        console.log(`✅ ${endpoint.name}: ${response.status}`);
      } catch (error) {
        this.results.backend[endpoint.name] = {
          status: 'ERROR ❌',
          error: error.response?.status || error.code,
          message: error.response?.data?.error || error.message
        };
        
        console.log(`❌ ${endpoint.name}: ${error.response?.status || error.code}`);
      }
    }
  }

  async auditQuotaSystem() {
    console.log('\n📊 Testing Quota System...\n');
    
    try {
      // Test current usage
      const usageResponse = await axios.get(`${BASE_URL}/api/me/usage`, {
        headers: { 'x-user-id': USER_ID }
      });
      
      const usage = usageResponse.data;
      console.log(`✅ User Plan: ${usage.plan}`);
      console.log(`✅ Usage: ${usage.used}${usage.quota ? `/${usage.quota}` : ' (unlimited)'}`);
      
      this.results.backend['Quota System'] = {
        status: 'WORKING ✅',
        plan: usage.plan,
        used: usage.used,
        quota: usage.quota,
        unlimited: usage.quota === null
      };
      
      if (usage.plan !== 'platinum') {
        this.results.issues.push('User does not have platinum access - may hit quota limits');
      }
      
    } catch (error) {
      console.log(`❌ Quota System: ${error.message}`);
      this.results.issues.push(`Quota system error: ${error.message}`);
    }
  }

  analyzeDataQuality() {
    console.log('\n📈 Analyzing Data Quality...\n');
    
    const oddsData = this.results.backend['NFL Odds'];
    const scoresData = this.results.backend['NFL Scores'];
    
    if (oddsData?.status === 'WORKING ✅') {
      if (oddsData.dataLength === 0) {
        console.log('⚠️  NFL Odds returning empty array - may need real API key');
        this.results.issues.push('Odds API returning no data - check API key configuration');
      } else {
        console.log(`✅ NFL Odds: ${oddsData.dataLength} games available`);
      }
    }
    
    if (scoresData?.status === 'WORKING ✅') {
      console.log(`✅ NFL Scores: ${scoresData.dataLength} games available`);
    }
    
    const sportsData = this.results.backend['Sports List'];
    if (sportsData?.status === 'ERROR ❌') {
      console.log('⚠️  Sports List API failing - may affect sport selection');
      this.results.recommendations.push('Fix sports list API or implement fallback sport list');
    }
  }

  generateFrontendChecklist() {
    console.log('\n🖥️  Frontend Pages to Test Manually...\n');
    
    const pages = [
      { name: 'Home Page', url: '/', features: ['Hero section', 'Value propositions', 'CTA buttons', 'Preview table'] },
      { name: 'Sportsbooks', url: '/sportsbooks', features: ['Odds table', 'Sport filters', 'Date filters', 'Search', 'Bet slip'] },
      { name: 'Scores', url: '/scores', features: ['Live scores', 'Game details', 'Team logos', 'Records'] },
      { name: 'Account', url: '/account', features: ['Usage stats', 'Plan info', 'Upgrade button', 'Profile settings'] },
      { name: 'Login', url: '/login', features: ['Authentication', 'Social login', 'Redirect after login'] }
    ];
    
    this.results.frontend.pagesToTest = pages;
    
    pages.forEach(page => {
      console.log(`📄 ${page.name} (${CLIENT_URL}${page.url}):`);
      page.features.forEach(feature => {
        console.log(`   • ${feature}`);
      });
      console.log('');
    });
  }

  generateUserFlowTests() {
    console.log('\n👤 User Flows to Test...\n');
    
    const flows = [
      {
        name: 'New User Journey',
        steps: [
          'Visit home page',
          'Click "Get Started" or "View Odds"',
          'Navigate to sportsbooks page',
          'See odds data loading',
          'Try to place a bet (should work with demo-user)',
          'Check usage tracking'
        ]
      },
      {
        name: 'Quota System',
        steps: [
          'Check current usage via /api/me/usage',
          'Make multiple API calls',
          'Verify usage increments (if not platinum)',
          'Test quota exceeded modal (if applicable)'
        ]
      },
      {
        name: 'Upgrade Flow',
        steps: [
          'Go to account page',
          'Click upgrade button',
          'Verify Stripe checkout (if configured)',
          'Test plan upgrade functionality'
        ]
      }
    ];
    
    this.results.userFlows = flows;
    
    flows.forEach(flow => {
      console.log(`🔄 ${flow.name}:`);
      flow.steps.forEach((step, index) => {
        console.log(`   ${index + 1}. ${step}`);
      });
      console.log('');
    });
  }

  generateReport() {
    console.log('\n📋 AUDIT SUMMARY\n');
    console.log('='.repeat(50));
    
    // Backend Status
    console.log('\n🔧 BACKEND STATUS:');
    Object.entries(this.results.backend).forEach(([name, result]) => {
      console.log(`   ${result.status} ${name}`);
      if (result.error) {
        console.log(`      Error: ${result.message}`);
      }
    });
    
    // Issues Found
    if (this.results.issues.length > 0) {
      console.log('\n⚠️  ISSUES FOUND:');
      this.results.issues.forEach((issue, index) => {
        console.log(`   ${index + 1}. ${issue}`);
      });
    }
    
    // Recommendations
    if (this.results.recommendations.length > 0) {
      console.log('\n💡 RECOMMENDATIONS:');
      this.results.recommendations.forEach((rec, index) => {
        console.log(`   ${index + 1}. ${rec}`);
      });
    }
    
    // Next Steps
    console.log('\n🎯 NEXT STEPS:');
    console.log('   1. Test frontend pages manually in browser');
    console.log('   2. Verify user authentication flows');
    console.log('   3. Test mobile responsiveness');
    console.log('   4. Check browser console for JavaScript errors');
    console.log('   5. Test with real API keys for production data');
    
    // Save detailed report
    fs.writeFileSync('audit-results.json', JSON.stringify(this.results, null, 2));
    console.log('\n📄 Detailed results saved to: audit-results.json');
  }

  async run() {
    console.log('🚀 Starting Comprehensive Site Audit...\n');
    console.log('='.repeat(50));
    
    await this.auditBackendEndpoints();
    await this.auditAdminEndpoints();
    await this.auditQuotaSystem();
    this.analyzeDataQuality();
    this.generateFrontendChecklist();
    this.generateUserFlowTests();
    this.generateReport();
    
    console.log('\n✅ Audit Complete!');
  }
}

// Run the audit
if (require.main === module) {
  const auditor = new SiteAuditor();
  auditor.run().catch(console.error);
}

module.exports = SiteAuditor;
