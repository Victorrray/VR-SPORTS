// User experience optimizations for VR-Odds platform
import { optimizedStorage } from './storageOptimizer.js';
import { smartCache } from './enhancedCache.js';

class UserExperienceOptimizer {
  constructor() {
    this.userBehavior = this.loadUserBehavior();
    this.prefetchStrategies = new Map();
    this.setupBehaviorTracking();
  }

  // Load user behavior patterns
  loadUserBehavior() {
    return optimizedStorage.get('user-behavior-patterns', {
      visitedPages: {},
      commonFilters: {},
      timeSpentOnPages: {},
      preferredSports: [],
      preferredBooks: [],
      lastVisit: null,
      sessionCount: 0
    });
  }

  // Save user behavior patterns
  saveUserBehavior() {
    optimizedStorage.set('user-behavior-patterns', this.userBehavior, {
      priority: 'high',
      ttl: 30 * 24 * 60 * 60 * 1000 // 30 days
    });
  }

  // Track user behavior for optimization
  setupBehaviorTracking() {
    // Track page visits
    this.trackPageVisit();
    
    // Track filter usage
    this.trackFilterUsage();
    
    // Track time spent
    this.trackTimeSpent();
    
    // Track user preferences
    this.trackPreferences();
  }

  // Track page visits for prefetch optimization
  trackPageVisit() {
    const currentPage = window.location.pathname;
    const now = Date.now();
    
    if (!this.userBehavior.visitedPages[currentPage]) {
      this.userBehavior.visitedPages[currentPage] = {
        count: 0,
        firstVisit: now,
        lastVisit: now,
        averageTimeSpent: 0
      };
    }
    
    this.userBehavior.visitedPages[currentPage].count++;
    this.userBehavior.visitedPages[currentPage].lastVisit = now;
    this.userBehavior.sessionCount++;
    
    // Predict next page and prefetch
    this.predictAndPrefetch(currentPage);
    
    this.saveUserBehavior();
  }

  // Track filter usage patterns
  trackFilterUsage() {
    // Monitor localStorage changes for filter preferences
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = (key, value) => {
      if (key.startsWith('vr-odds-')) {
        this.recordFilterUsage(key, value);
      }
      return originalSetItem.call(localStorage, key, value);
    };
  }

  // Record filter usage for optimization
  recordFilterUsage(filterKey, value) {
    if (!this.userBehavior.commonFilters[filterKey]) {
      this.userBehavior.commonFilters[filterKey] = {};
    }
    
    if (!this.userBehavior.commonFilters[filterKey][value]) {
      this.userBehavior.commonFilters[filterKey][value] = 0;
    }
    
    this.userBehavior.commonFilters[filterKey][value]++;
    
    // Update preferred lists
    if (filterKey === 'vr-odds-sports') {
      try {
        const sports = JSON.parse(value);
        this.userBehavior.preferredSports = this.mergePreferences(
          this.userBehavior.preferredSports, 
          sports
        );
      } catch (error) {
        console.warn('Failed to parse sports preference:', error);
      }
    }
    
    if (filterKey === 'vr-odds-books') {
      try {
        const books = JSON.parse(value);
        this.userBehavior.preferredBooks = this.mergePreferences(
          this.userBehavior.preferredBooks, 
          books
        );
      } catch (error) {
        console.warn('Failed to parse books preference:', error);
      }
    }
  }

  // Merge preferences with frequency weighting
  mergePreferences(existing, newItems) {
    const merged = [...existing];
    
    newItems.forEach(item => {
      const index = merged.findIndex(m => m.value === item);
      if (index >= 0) {
        merged[index].frequency++;
      } else {
        merged.push({ value: item, frequency: 1 });
      }
    });
    
    // Sort by frequency and keep top 10
    return merged
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10);
  }

  // Track time spent on pages
  trackTimeSpent() {
    let startTime = Date.now();
    let currentPage = window.location.pathname;
    
    const updateTimeSpent = () => {
      const timeSpent = Date.now() - startTime;
      const pageData = this.userBehavior.visitedPages[currentPage];
      
      if (pageData) {
        const totalTime = (pageData.averageTimeSpent * (pageData.count - 1)) + timeSpent;
        pageData.averageTimeSpent = totalTime / pageData.count;
      }
      
      this.saveUserBehavior();
    };
    
    // Update on page unload
    window.addEventListener('beforeunload', updateTimeSpent);
    
    // Update on page visibility change
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        updateTimeSpent();
      } else {
        startTime = Date.now();
      }
    });
    
    // Update on route change
    let lastUrl = location.href;
    new MutationObserver(() => {
      const url = location.href;
      if (url !== lastUrl) {
        updateTimeSpent();
        currentPage = window.location.pathname;
        startTime = Date.now();
        lastUrl = url;
        this.trackPageVisit();
      }
    }).observe(document, { subtree: true, childList: true });
  }

  // Track user preferences for personalization
  trackPreferences() {
    // Monitor odds format changes
    const oddsFormatObserver = new MutationObserver(() => {
      const oddsFormat = this.detectOddsFormat();
      if (oddsFormat) {
        this.userBehavior.preferredOddsFormat = oddsFormat;
        this.saveUserBehavior();
      }
    });
    
    // Start observing
    if (document.body) {
      oddsFormatObserver.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true
      });
    }
  }

  // Detect current odds format preference
  detectOddsFormat() {
    // Look for odds format indicators in the DOM
    const oddsElements = document.querySelectorAll('[data-odds-format], .odds-american, .odds-decimal, .odds-fractional');
    
    for (const element of oddsElements) {
      const format = element.dataset.oddsFormat || 
                    (element.classList.contains('odds-american') ? 'american' : 
                     element.classList.contains('odds-decimal') ? 'decimal' : 
                     element.classList.contains('odds-fractional') ? 'fractional' : null);
      
      if (format) return format;
    }
    
    return null;
  }

  // Predict next page and prefetch data
  predictAndPrefetch(currentPage) {
    const predictions = this.predictNextPages(currentPage);
    
    predictions.forEach(prediction => {
      if (prediction.confidence > 0.3) { // 30% confidence threshold
        this.prefetchPageData(prediction.page);
      }
    });
  }

  // Predict next pages based on user behavior
  predictNextPages(currentPage) {
    const pageTransitions = this.calculatePageTransitions();
    const currentPageData = pageTransitions[currentPage] || {};
    
    return Object.entries(currentPageData)
      .map(([nextPage, count]) => ({
        page: nextPage,
        confidence: count / (this.userBehavior.visitedPages[currentPage]?.count || 1)
      }))
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 3); // Top 3 predictions
  }

  // Calculate page transition patterns
  calculatePageTransitions() {
    // This would be enhanced with actual navigation tracking
    // For now, use common patterns
    return {
      '/': [
        { page: '/sportsbooks', confidence: 0.6 },
        { page: '/scores', confidence: 0.3 }
      ],
      '/sportsbooks': [
        { page: '/scores', confidence: 0.4 },
        { page: '/account', confidence: 0.2 }
      ],
      '/scores': [
        { page: '/sportsbooks', confidence: 0.5 }
      ]
    };
  }

  // Prefetch data for predicted pages
  async prefetchPageData(page) {
    if (this.prefetchStrategies.has(page)) return;
    
    this.prefetchStrategies.set(page, true);
    
    try {
      switch (page) {
        case '/sportsbooks':
          await this.prefetchSportsbooksData();
          break;
        case '/scores':
          await this.prefetchScoresData();
          break;
        default:
          console.log('No prefetch strategy for page:', page);
      }
    } catch (error) {
      console.warn('Prefetch failed for page:', page, error);
    } finally {
      // Clear strategy after 5 minutes
      setTimeout(() => {
        this.prefetchStrategies.delete(page);
      }, 300000);
    }
  }

  // Prefetch sportsbooks data
  async prefetchSportsbooksData() {
    const preferredSports = this.userBehavior.preferredSports
      .slice(0, 3)
      .map(s => s.value);
    
    if (preferredSports.length > 0) {
      const cacheKey = `prefetch:odds:${preferredSports.join(',')}`;
      
      await smartCache.prefetch(cacheKey, async () => {
        // This would call the actual API
        console.log('Prefetching odds for sports:', preferredSports);
        return { prefetched: true, sports: preferredSports };
      }, {
        type: 'LIVE',
        priority: 'low'
      });
    }
  }

  // Prefetch scores data
  async prefetchScoresData() {
    const preferredSports = this.userBehavior.preferredSports
      .slice(0, 2)
      .map(s => s.value);
    
    if (preferredSports.length > 0) {
      const cacheKey = `prefetch:scores:${preferredSports.join(',')}`;
      
      await smartCache.prefetch(cacheKey, async () => {
        console.log('Prefetching scores for sports:', preferredSports);
        return { prefetched: true, sports: preferredSports };
      }, {
        type: 'LIVE',
        priority: 'low'
      });
    }
  }

  // Get personalized recommendations
  getPersonalizedRecommendations() {
    return {
      recommendedSports: this.userBehavior.preferredSports.slice(0, 5),
      recommendedBooks: this.userBehavior.preferredBooks.slice(0, 5),
      suggestedFilters: this.getSuggestedFilters(),
      quickActions: this.getQuickActions()
    };
  }

  // Get suggested filters based on usage patterns
  getSuggestedFilters() {
    const suggestions = [];
    
    // Most used sports
    const topSports = this.userBehavior.preferredSports.slice(0, 3);
    if (topSports.length > 0) {
      suggestions.push({
        type: 'sports',
        label: 'Your favorite sports',
        values: topSports.map(s => s.value)
      });
    }
    
    // Most used books
    const topBooks = this.userBehavior.preferredBooks.slice(0, 3);
    if (topBooks.length > 0) {
      suggestions.push({
        type: 'books',
        label: 'Your preferred sportsbooks',
        values: topBooks.map(b => b.value)
      });
    }
    
    return suggestions;
  }

  // Get quick actions based on user behavior
  getQuickActions() {
    const actions = [];
    
    // Most visited page
    const mostVisitedPage = Object.entries(this.userBehavior.visitedPages)
      .sort(([,a], [,b]) => b.count - a.count)[0];
    
    if (mostVisitedPage && mostVisitedPage[0] !== window.location.pathname) {
      actions.push({
        type: 'navigate',
        label: `Go to ${mostVisitedPage[0]}`,
        action: () => window.location.href = mostVisitedPage[0]
      });
    }
    
    // Quick filter application
    const commonFilters = Object.entries(this.userBehavior.commonFilters)
      .flatMap(([key, values]) => 
        Object.entries(values).map(([value, count]) => ({ key, value, count }))
      )
      .sort((a, b) => b.count - a.count)
      .slice(0, 2);
    
    commonFilters.forEach(filter => {
      actions.push({
        type: 'filter',
        label: `Apply ${filter.key.replace('vr-odds-', '')} filter`,
        action: () => {
          localStorage.setItem(filter.key, filter.value);
          window.location.reload();
        }
      });
    });
    
    return actions;
  }

  // Get optimization statistics
  getOptimizationStats() {
    return {
      userBehavior: {
        totalSessions: this.userBehavior.sessionCount,
        pagesVisited: Object.keys(this.userBehavior.visitedPages).length,
        averageTimePerPage: Object.values(this.userBehavior.visitedPages)
          .reduce((sum, page) => sum + page.averageTimeSpent, 0) / 
          Object.keys(this.userBehavior.visitedPages).length,
        preferredSports: this.userBehavior.preferredSports.length,
        preferredBooks: this.userBehavior.preferredBooks.length
      },
      prefetch: {
        strategiesActive: this.prefetchStrategies.size,
        cacheHitRate: this.calculateCacheHitRate()
      },
      recommendations: this.getPersonalizedRecommendations()
    };
  }

  // Calculate cache hit rate
  calculateCacheHitRate() {
    const cacheStats = smartCache.stats();
    return cacheStats.hitRate || 0;
  }

  // Clear user behavior data (privacy)
  clearUserData() {
    this.userBehavior = {
      visitedPages: {},
      commonFilters: {},
      timeSpentOnPages: {},
      preferredSports: [],
      preferredBooks: [],
      lastVisit: null,
      sessionCount: 0
    };
    
    optimizedStorage.remove('user-behavior-patterns');
    this.prefetchStrategies.clear();
  }
}

// Create singleton instance
export const uxOptimizer = new UserExperienceOptimizer();

// Export convenience functions
export const userExperience = {
  // Get personalized recommendations
  getRecommendations: () => uxOptimizer.getPersonalizedRecommendations(),
  
  // Get optimization stats
  getStats: () => uxOptimizer.getOptimizationStats(),
  
  // Clear user data
  clearData: () => uxOptimizer.clearUserData(),
  
  // Manual prefetch trigger
  prefetch: (page) => uxOptimizer.prefetchPageData(page)
};

export default uxOptimizer;
