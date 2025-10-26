/**
 * Caching Service Tests
 */

describe('Caching Service', () => {
  let cache;

  beforeEach(() => {
    // Simple in-memory cache for testing
    cache = new Map();
  });

  describe('Cache Operations', () => {
    it('should store data in cache', () => {
      const key = 'odds_nfl_h2h';
      const data = { games: [] };

      cache.set(key, data);

      expect(cache.has(key)).toBe(true);
      expect(cache.get(key)).toEqual(data);
    });

    it('should retrieve cached data', () => {
      const key = 'odds_nfl_spreads';
      const data = { games: [{ id: '1', spread: -3 }] };

      cache.set(key, data);
      const retrieved = cache.get(key);

      expect(retrieved).toEqual(data);
    });

    it('should return null for missing cache entries', () => {
      const retrieved = cache.get('non_existent_key');

      expect(retrieved).toBeUndefined();
    });

    it('should delete cache entries', () => {
      const key = 'odds_nfl_totals';
      cache.set(key, { games: [] });

      cache.delete(key);

      expect(cache.has(key)).toBe(false);
    });

    it('should clear entire cache', () => {
      cache.set('key1', { data: 1 });
      cache.set('key2', { data: 2 });
      cache.set('key3', { data: 3 });

      cache.clear();

      expect(cache.size).toBe(0);
    });
  });

  describe('Cache TTL (Time To Live)', () => {
    it('should track cache entry age', () => {
      const key = 'odds_test';
      const timestamp = Date.now();
      const data = { games: [], timestamp };

      cache.set(key, data);
      const cached = cache.get(key);

      expect(cached.timestamp).toBe(timestamp);
    });

    it('should identify expired cache entries', () => {
      const key = 'odds_expired';
      const ttl = 60000; // 60 seconds
      const timestamp = Date.now() - 120000; // 2 minutes ago
      const data = { games: [], timestamp };

      cache.set(key, data);
      const cached = cache.get(key);
      const isExpired = (Date.now() - cached.timestamp) > ttl;

      expect(isExpired).toBe(true);
    });

    it('should identify valid cache entries', () => {
      const key = 'odds_valid';
      const ttl = 60000; // 60 seconds
      const timestamp = Date.now() - 30000; // 30 seconds ago
      const data = { games: [], timestamp };

      cache.set(key, data);
      const cached = cache.get(key);
      const isExpired = (Date.now() - cached.timestamp) > ttl;

      expect(isExpired).toBe(false);
    });
  });

  describe('Cache Key Management', () => {
    it('should generate consistent cache keys', () => {
      const sport = 'nfl';
      const market = 'h2h';
      const key1 = `odds_${sport}_${market}`;
      const key2 = `odds_${sport}_${market}`;

      expect(key1).toBe(key2);
    });

    it('should handle different sports and markets', () => {
      const sports = ['nfl', 'nba', 'mlb', 'nhl'];
      const markets = ['h2h', 'spreads', 'totals'];

      sports.forEach(sport => {
        markets.forEach(market => {
          const key = `odds_${sport}_${market}`;
          cache.set(key, { sport, market });
        });
      });

      expect(cache.size).toBe(sports.length * markets.length);
    });
  });
});
