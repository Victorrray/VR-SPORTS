// server/services/oddsCache.js
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

class OddsCacheService {
  constructor() {
    this.supabase = null;
    this.apiKey = process.env.ODDS_API_KEY;
    this.apiBase = 'https://api.the-odds-api.com/v4';
    this.isRunning = false;
    this.updateInterval = null;
    
    // NFL-specific configuration
    this.nflConfig = {
      sport: 'americanfootball_nfl',
      mainLineMarkets: ['h2h', 'spreads', 'totals'],
      playerPropMarkets: [
        'player_pass_tds', 'player_pass_yds', 'player_pass_completions',
        'player_pass_attempts', 'player_pass_interceptions', 'player_pass_longest_completion',
        'player_rush_yds', 'player_rush_attempts', 'player_rush_longest',
        'player_receptions', 'player_reception_yds', 'player_reception_longest',
        'player_anytime_td', 'player_first_td', 'player_last_td'
      ],
      bookmakers: [
        'draftkings', 'fanduel', 'betmgm', 'caesars',
        'prizepicks', 'underdog', 'draftkings_pick6'
      ],
      mainLinesTTL: 120, // 2 minutes
      playerPropsTTL: 90, // 90 seconds
      updateInterval: 60000 // 1 minute
    };
  }

  initialize(supabaseUrl, supabaseKey) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✅ OddsCacheService initialized');
  }

  async startNFLUpdates() {
    if (this.isRunning) {
      console.log('⚠️  NFL updates already running');
      return;
    }

    console.log('🏈 Starting NFL odds caching service...');
    this.isRunning = true;

    // Run initial update
    await this.updateNFLOdds();

    // Set up recurring updates
    this.updateInterval = setInterval(async () => {
      await this.updateNFLOdds();
    }, this.nflConfig.updateInterval);

    console.log(`✅ NFL updates scheduled every ${this.nflConfig.updateInterval / 1000}s`);
  }

  async stopNFLUpdates() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    this.isRunning = false;
    console.log('🛑 NFL updates stopped');
  }

  async updateNFLOdds() {
    const logId = await this.createUpdateLog('americanfootball_nfl', 'full_refresh');
    let eventsUpdated = 0;
    let oddsUpdated = 0;
    let apiCallsMade = 0;

    try {
      console.log('🔄 Fetching NFL events...');
      
      // Step 1: Get all NFL events
      const eventsResponse = await axios.get(`${this.apiBase}/sports/americanfootball_nfl/events`, {
        params: { apiKey: this.apiKey }
      });
      apiCallsMade++;

      const events = eventsResponse.data;
      console.log(`📊 Found ${events.length} NFL events`);

      // Step 2: Update main lines for all events
      console.log('📈 Updating main lines (h2h, spreads, totals)...');
      const mainLinesResult = await this.updateMainLines(events);
      oddsUpdated += mainLinesResult.oddsUpdated;
      apiCallsMade += mainLinesResult.apiCalls;

      // Step 3: Update player props for all events
      console.log('🎯 Updating player props...');
      const playerPropsResult = await this.updatePlayerProps(events);
      oddsUpdated += playerPropsResult.oddsUpdated;
      apiCallsMade += playerPropsResult.apiCalls;

      eventsUpdated = events.length;

      // Step 4: Clean up expired odds
      const { data: cleanupResult } = await this.supabase.rpc('cleanup_expired_odds');
      console.log(`🧹 Cleaned up ${cleanupResult || 0} expired odds entries`);

      // Complete the log
      await this.completeUpdateLog(logId, eventsUpdated, oddsUpdated, apiCallsMade);

      console.log(`✅ NFL update complete: ${eventsUpdated} events, ${oddsUpdated} odds updated, ${apiCallsMade} API calls`);
      
      return { eventsUpdated, oddsUpdated, apiCallsMade };

    } catch (error) {
      console.error('❌ Error updating NFL odds:', error.message);
      await this.failUpdateLog(logId, error.message);
      throw error;
    }
  }

  async updateMainLines(events) {
    let oddsUpdated = 0;
    let apiCalls = 0;

    try {
      // Fetch main lines for all events in one call
      const response = await axios.get(`${this.apiBase}/sports/americanfootball_nfl/odds`, {
        params: {
          apiKey: this.apiKey,
          regions: 'us,us_dfs',
          markets: this.nflConfig.mainLineMarkets.join(','),
          bookmakers: this.nflConfig.bookmakers.join(','),
          oddsFormat: 'american'
        }
      });
      apiCalls++;

      const oddsData = response.data;

      // Process each event
      for (const event of oddsData) {
        const expiresAt = new Date(Date.now() + this.nflConfig.mainLinesTTL * 1000);

        // Cache event metadata
        await this.cacheEvent(event, expiresAt);

        // Cache odds for each bookmaker
        for (const bookmaker of event.bookmakers || []) {
          for (const market of bookmaker.markets || []) {
            await this.cacheOdds({
              sportKey: 'americanfootball_nfl',
              eventId: event.id,
              eventName: `${event.away_team} @ ${event.home_team}`,
              commenceTime: event.commence_time,
              bookmakerKey: bookmaker.key,
              marketKey: market.key,
              outcomes: market.outcomes,
              expiresAt,
              metadata: {
                lastUpdate: market.last_update,
                type: 'main_line'
              }
            });
            oddsUpdated++;
          }
        }
      }

      console.log(`  ✓ Main lines: ${oddsUpdated} odds cached from ${apiCalls} API call(s)`);
      return { oddsUpdated, apiCalls };

    } catch (error) {
      console.error('  ✗ Error updating main lines:', error.message);
      throw error;
    }
  }

  async updatePlayerProps(events) {
    let oddsUpdated = 0;
    let apiCalls = 0;

    try {
      // Process player props for each event individually (API requirement)
      for (const event of events) {
        try {
          const response = await axios.get(
            `${this.apiBase}/sports/americanfootball_nfl/events/${event.id}/odds`,
            {
              params: {
                apiKey: this.apiKey,
                regions: 'us,us_dfs',
                markets: this.nflConfig.playerPropMarkets.join(','),
                bookmakers: this.nflConfig.bookmakers.join(','),
                oddsFormat: 'american'
              }
            }
          );
          apiCalls++;

          const eventOdds = response.data;
          const expiresAt = new Date(Date.now() + this.nflConfig.playerPropsTTL * 1000);

          // Cache player props for each bookmaker
          for (const bookmaker of eventOdds.bookmakers || []) {
            for (const market of bookmaker.markets || []) {
              await this.cacheOdds({
                sportKey: 'americanfootball_nfl',
                eventId: event.id,
                eventName: `${event.away_team} @ ${event.home_team}`,
                commenceTime: event.commence_time,
                bookmakerKey: bookmaker.key,
                marketKey: market.key,
                outcomes: market.outcomes,
                expiresAt,
                metadata: {
                  lastUpdate: market.last_update,
                  type: 'player_prop'
                }
              });
              oddsUpdated++;
            }
          }

          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));

        } catch (error) {
          console.error(`  ✗ Error fetching props for event ${event.id}:`, error.message);
          // Continue with next event
        }
      }

      console.log(`  ✓ Player props: ${oddsUpdated} odds cached from ${apiCalls} API call(s)`);
      return { oddsUpdated, apiCalls };

    } catch (error) {
      console.error('  ✗ Error updating player props:', error.message);
      throw error;
    }
  }

  async cacheEvent(event, expiresAt) {
    try {
      const { error } = await this.supabase
        .from('cached_events')
        .upsert({
          sport_key: 'americanfootball_nfl',
          event_id: event.id,
          event_name: `${event.away_team} @ ${event.home_team}`,
          home_team: event.home_team,
          away_team: event.away_team,
          commence_time: event.commence_time,
          expires_at: expiresAt.toISOString(),
          metadata: {
            sport_title: event.sport_title
          }
        }, {
          onConflict: 'event_id'
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error caching event:', error.message);
    }
  }

  async cacheOdds(oddsData) {
    try {
      const { error } = await this.supabase
        .from('cached_odds')
        .upsert({
          sport_key: oddsData.sportKey,
          event_id: oddsData.eventId,
          event_name: oddsData.eventName,
          commence_time: oddsData.commenceTime,
          bookmaker_key: oddsData.bookmakerKey,
          market_key: oddsData.marketKey,
          outcomes: oddsData.outcomes,
          expires_at: oddsData.expiresAt.toISOString(),
          metadata: oddsData.metadata || {}
        }, {
          onConflict: 'sport_key,event_id,bookmaker_key,market_key'
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error caching odds:', error.message);
    }
  }

  async createUpdateLog(sportKey, updateType) {
    try {
      const { data, error } = await this.supabase
        .from('odds_update_log')
        .insert({
          sport_key: sportKey,
          update_type: updateType,
          status: 'running'
        })
        .select()
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      console.error('Error creating update log:', error.message);
      return null;
    }
  }

  async completeUpdateLog(logId, eventsUpdated, oddsUpdated, apiCallsMade) {
    if (!logId) return;

    try {
      const { error } = await this.supabase
        .from('odds_update_log')
        .update({
          events_updated: eventsUpdated,
          odds_updated: oddsUpdated,
          api_calls_made: apiCallsMade,
          completed_at: new Date().toISOString(),
          status: 'completed'
        })
        .eq('id', logId);

      if (error) throw error;
    } catch (error) {
      console.error('Error completing update log:', error.message);
    }
  }

  async failUpdateLog(logId, errorMessage) {
    if (!logId) return;

    try {
      const { error } = await this.supabase
        .from('odds_update_log')
        .update({
          completed_at: new Date().toISOString(),
          status: 'failed',
          error_message: errorMessage
        })
        .eq('id', logId);

      if (error) throw error;
    } catch (error) {
      console.error('Error failing update log:', error.message);
    }
  }

  // Get cached odds from Supabase
  async getCachedOdds(sportKey, options = {}) {
    try {
      const now = new Date().toISOString();
      let query = this.supabase
        .from('cached_odds')
        .select('*')
        .eq('sport_key', sportKey)
        .gt('expires_at', now)
        .gt('commence_time', now) // Only get future games
        .order('commence_time', { ascending: true });

      if (options.markets && options.markets.length > 0) {
        query = query.in('market_key', options.markets);
      }

      if (options.bookmakers && options.bookmakers.length > 0) {
        query = query.in('bookmaker_key', options.bookmakers);
      }

      if (options.eventId) {
        query = query.eq('event_id', options.eventId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting cached odds:', error.message);
      return [];
    }
  }

  // Get update statistics
  async getUpdateStats(sportKey, limit = 10) {
    try {
      const { data, error } = await this.supabase
        .from('odds_update_log')
        .select('*')
        .eq('sport_key', sportKey)
        .order('started_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting update stats:', error.message);
      return [];
    }
  }
}

module.exports = new OddsCacheService();
