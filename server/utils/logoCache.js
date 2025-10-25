/**
 * Team Logo Cache Utility
 * Manages caching and retrieval of team logos from ESPN API
 * Ensures we always have logos available and tracks missing ones
 */

const supabase = require('../config/supabase');

class LogoCache {
  /**
   * Store or update a team logo in the cache
   */
  static async upsertLogo(teamData) {
    const {
      teamId,
      teamName,
      teamDisplayName,
      sportKey,
      logoUrl,
      logoUrlAlt = null,
      logoFormat = 'png'
    } = teamData;

    try {
      const { data, error } = await supabase.rpc('upsert_team_logo', {
        p_team_id: teamId,
        p_team_name: teamName,
        p_team_display_name: teamDisplayName,
        p_sport_key: sportKey,
        p_logo_url: logoUrl,
        p_logo_url_alt: logoUrlAlt,
        p_logo_format: logoFormat
      });

      if (error) {
        console.error('❌ Error upserting logo:', error);
        return null;
      }

      console.log(`✅ Logo cached for ${teamName} (${sportKey})`);
      return data;
    } catch (err) {
      console.error('❌ Exception upserting logo:', err);
      return null;
    }
  }

  /**
   * Retrieve a team logo from cache
   */
  static async getLogo(teamId, sportKey) {
    try {
      const { data, error } = await supabase.rpc('get_team_logo', {
        p_team_id: teamId,
        p_sport_key: sportKey
      });

      if (error) {
        console.error('❌ Error retrieving logo:', error);
        return null;
      }

      return data && data.length > 0 ? data[0] : null;
    } catch (err) {
      console.error('❌ Exception retrieving logo:', err);
      return null;
    }
  }

  /**
   * Get all missing logos for a sport (for monitoring/debugging)
   */
  static async getMissingLogos(sportKey = null, limit = 100) {
    try {
      const { data, error } = await supabase.rpc('get_missing_team_logos', {
        p_sport_key: sportKey,
        p_limit: limit
      });

      if (error) {
        console.error('❌ Error retrieving missing logos:', error);
        return [];
      }

      return data || [];
    } catch (err) {
      console.error('❌ Exception retrieving missing logos:', err);
      return [];
    }
  }

  /**
   * Mark a logo as verified or unavailable
   */
  static async markLogoVerified(teamId, sportKey, isAvailable) {
    try {
      const { error } = await supabase.rpc('mark_logo_verified', {
        p_team_id: teamId,
        p_sport_key: sportKey,
        p_is_available: isAvailable
      });

      if (error) {
        console.error('❌ Error marking logo verified:', error);
        return false;
      }

      console.log(`✅ Logo verified for team ${teamId} (${sportKey}): ${isAvailable}`);
      return true;
    } catch (err) {
      console.error('❌ Exception marking logo verified:', err);
      return false;
    }
  }

  /**
   * Get logo coverage statistics by sport
   */
  static async getLogoStatistics(sportKey = null) {
    try {
      const { data, error } = await supabase.rpc('get_logo_statistics', {
        p_sport_key: sportKey
      });

      if (error) {
        console.error('❌ Error retrieving logo statistics:', error);
        return [];
      }

      return data || [];
    } catch (err) {
      console.error('❌ Exception retrieving logo statistics:', err);
      return [];
    }
  }

  /**
   * Batch store logos from ESPN API response
   * Processes all teams from a games response and caches their logos
   */
  static async batchStoreLogo(games, sportKey) {
    if (!Array.isArray(games) || games.length === 0) {
      console.log('⚠️  No games to process for logo caching');
      return { stored: 0, skipped: 0, errors: 0 };
    }

    let stored = 0;
    let skipped = 0;
    let errors = 0;

    for (const game of games) {
      try {
        // Process home team
        if (game.home_team && game.home_logo) {
          const homeResult = await this.upsertLogo({
            teamId: game.home_team,
            teamName: game.home_team,
            teamDisplayName: game.home_name || game.home_team,
            sportKey,
            logoUrl: game.home_logo
          });
          homeResult ? stored++ : errors++;
        } else {
          skipped++;
        }

        // Process away team
        if (game.away_team && game.away_logo) {
          const awayResult = await this.upsertLogo({
            teamId: game.away_team,
            teamName: game.away_team,
            teamDisplayName: game.away_name || game.away_team,
            sportKey,
            logoUrl: game.away_logo
          });
          awayResult ? stored++ : errors++;
        } else {
          skipped++;
        }
      } catch (err) {
        console.error(`❌ Error processing game ${game.id}:`, err);
        errors++;
      }
    }

    console.log(`📊 Logo batch store complete: ${stored} stored, ${skipped} skipped, ${errors} errors`);
    return { stored, skipped, errors };
  }

  /**
   * Get logo with fallback to cache if primary fails
   * Useful for ensuring we always have a logo available
   */
  static async getLogoWithFallback(teamId, sportKey) {
    try {
      const cached = await this.getLogo(teamId, sportKey);

      if (cached) {
        // Prefer primary logo, fallback to alt
        const logoUrl = cached.logo_url || cached.logo_url_alt;
        if (logoUrl) {
          return {
            url: logoUrl,
            source: 'cache',
            verified: cached.has_been_verified
          };
        }
      }

      // No cached logo found
      return {
        url: null,
        source: 'none',
        verified: false
      };
    } catch (err) {
      console.error('❌ Exception getting logo with fallback:', err);
      return {
        url: null,
        source: 'error',
        verified: false
      };
    }
  }

  /**
   * Generate logo URL with ESPN CDN parameters
   * Ensures consistent sizing and format
   */
  static generateLogoUrl(rawLogoUrl, size = 'medium') {
    if (!rawLogoUrl) return null;

    try {
      const url = new URL(rawLogoUrl);

      // ESPN CDN parameters
      const sizes = {
        small: { h: '80', w: '80' },
        medium: { h: '200', w: '200' },
        large: { h: '500', w: '500' }
      };

      const sizeParams = sizes[size] || sizes.medium;

      url.searchParams.set('h', sizeParams.h);
      url.searchParams.set('w', sizeParams.w);
      url.searchParams.set('format', 'png');
      url.searchParams.set('bgc', 'transparent');

      return url.toString();
    } catch (err) {
      console.error('❌ Error generating logo URL:', err);
      return rawLogoUrl; // Return original if parsing fails
    }
  }

  /**
   * Log logo coverage report for debugging
   */
  static async logCoverageReport(sportKey = null) {
    try {
      const stats = await this.getLogoStatistics(sportKey);

      if (!stats || stats.length === 0) {
        console.log('⚠️  No logo statistics available');
        return;
      }

      console.log('\n📊 TEAM LOGO COVERAGE REPORT');
      console.log('═'.repeat(60));

      for (const stat of stats) {
        const coverage = stat.coverage_percentage || 0;
        const barLength = Math.round(coverage / 5);
        const bar = '█'.repeat(barLength) + '░'.repeat(20 - barLength);

        console.log(`\n${stat.sport_key}`);
        console.log(`  Total Teams: ${stat.total_teams}`);
        console.log(`  With Logos: ${stat.teams_with_logos}/${stat.total_teams}`);
        console.log(`  Missing: ${stat.teams_missing_logos}`);
        console.log(`  Verified: ${stat.verified_logos}`);
        console.log(`  Coverage: ${coverage}% [${bar}]`);
      }

      console.log('\n' + '═'.repeat(60));
    } catch (err) {
      console.error('❌ Error logging coverage report:', err);
    }
  }
}

module.exports = LogoCache;
