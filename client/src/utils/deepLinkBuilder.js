/**
 * Deep Link Builder Utility
 * Uses source IDs (SIDs) from The Odds API to construct custom deep links
 * for sportsbooks, including mobile app links and state-specific URLs
 */

/**
 * Build a custom deep link for a sportsbook using source IDs
 * @param {Object} params - Parameters for building the link
 * @param {string} params.bookmakerKey - The bookmaker key (e.g., 'draftkings', 'fanduel')
 * @param {string} params.eventSid - Event source ID from the API
 * @param {string} params.marketSid - Market source ID from the API
 * @param {string} params.outcomeSid - Outcome source ID from the API
 * @param {string} params.platform - Platform type: 'web', 'ios', 'android'
 * @param {string} params.state - US state code for state-specific links (e.g., 'NJ', 'PA')
 * @returns {string|null} - Custom deep link URL or null if not supported
 */
export function buildDeepLink({ 
  bookmakerKey, 
  eventSid, 
  marketSid, 
  outcomeSid,
  platform = 'web',
  state = null 
}) {
  if (!bookmakerKey || !eventSid) {
    return null;
  }

  const key = bookmakerKey.toLowerCase();

  // DraftKings deep links
  if (key === 'draftkings') {
    if (platform === 'ios') {
      return `draftkings://event/${eventSid}`;
    }
    if (platform === 'android') {
      return `draftkings://event/${eventSid}`;
    }
    // Web with state-specific subdomain
    const subdomain = state ? `sportsbook-${state.toLowerCase()}` : 'sportsbook';
    return `https://${subdomain}.draftkings.com/event/${eventSid}`;
  }

  // FanDuel deep links
  if (key === 'fanduel') {
    if (platform === 'ios') {
      return `fanduel://event/${eventSid}`;
    }
    if (platform === 'android') {
      return `fanduel://event/${eventSid}`;
    }
    // Web with state parameter
    const stateParam = state ? `?state=${state}` : '';
    return `https://sportsbook.fanduel.com/event/${eventSid}${stateParam}`;
  }

  // BetMGM deep links
  if (key === 'betmgm') {
    if (platform === 'ios' || platform === 'android') {
      return `betmgm://event/${eventSid}`;
    }
    // Web with state in path
    const statePath = state ? `/${state.toLowerCase()}` : '';
    return `https://sports.betmgm.com${statePath}/event/${eventSid}`;
  }

  // Caesars deep links
  if (key === 'caesars') {
    if (platform === 'ios' || platform === 'android') {
      return `caesars://event/${eventSid}`;
    }
    return `https://sportsbook.caesars.com/event/${eventSid}`;
  }

  // Generic fallback - use the event SID in a query parameter
  return null;
}

/**
 * Detect user's platform
 * @returns {string} - 'ios', 'android', or 'web'
 */
export function detectPlatform() {
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;
  
  if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
    return 'ios';
  }
  
  if (/android/i.test(userAgent)) {
    return 'android';
  }
  
  return 'web';
}

/**
 * Get user's state from various sources
 * Priority: localStorage > geolocation API > null
 * @returns {Promise<string|null>} - US state code or null
 */
export async function detectUserState() {
  // Check localStorage first
  const savedState = localStorage.getItem('userState');
  if (savedState) {
    return savedState;
  }

  // Could integrate with geolocation API here
  // For now, return null and let the app handle state selection
  return null;
}

/**
 * Build the best available link for a bet
 * Priority: Custom deep link > API-provided link > null
 * @param {Object} betData - Bet data from the API
 * @returns {Promise<string|null>} - Best available link
 */
export async function getBestLink(betData) {
  const {
    bookmaker_link,
    market_link,
    betslip_link,
    event_sid,
    market_sid,
    outcome_sid,
    bookmaker
  } = betData;

  // If we have source IDs, try to build a custom deep link
  if (event_sid && bookmaker?.key) {
    const platform = detectPlatform();
    const state = await detectUserState();
    
    const deepLink = buildDeepLink({
      bookmakerKey: bookmaker.key,
      eventSid: event_sid,
      marketSid: market_sid,
      outcomeSid: outcome_sid,
      platform,
      state
    });

    if (deepLink) {
      return deepLink;
    }
  }

  // Fall back to API-provided links
  return betslip_link || market_link || bookmaker_link || null;
}

/**
 * Save user's state preference
 * @param {string} state - US state code
 */
export function saveUserState(state) {
  if (state) {
    localStorage.setItem('userState', state.toUpperCase());
  }
}

/**
 * Check if a bookmaker supports deep linking
 * @param {string} bookmakerKey - The bookmaker key
 * @returns {boolean} - True if deep linking is supported
 */
export function supportsDeepLinking(bookmakerKey) {
  const supported = [
    'draftkings',
    'fanduel', 
    'betmgm',
    'caesars',
    'pointsbet',
    'betrivers'
  ];
  
  return supported.includes(bookmakerKey?.toLowerCase());
}
