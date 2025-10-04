import { useState, useEffect } from 'react';
import { secureFetch } from '../utils/security';

/**
 * Hook to fetch and cache participants (teams/players) for a sport
 * This data is FREE from The Odds API - doesn't count against quota
 * 
 * @param {string} sport - Sport key (e.g., 'americanfootball_nfl')
 * @returns {Object} - { participants, loading, error }
 */
export function useParticipants(sport) {
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!sport) {
      setParticipants([]);
      return;
    }

    let isMounted = true;

    const fetchParticipants = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await secureFetch(`/api/participants/${sport}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch participants: ${response.statusText}`);
        }

        const data = await response.json();
        
        if (isMounted) {
          setParticipants(data);
          console.log(`✅ Loaded ${data.length} participants for ${sport}`);
        }
      } catch (err) {
        console.error('Error fetching participants:', err);
        if (isMounted) {
          setError(err.message);
          setParticipants([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchParticipants();

    return () => {
      isMounted = false;
    };
  }, [sport]);

  return { participants, loading, error };
}

/**
 * Get participant by name (fuzzy match)
 * @param {Array} participants - List of participants
 * @param {string} name - Name to search for
 * @returns {Object|null} - Matching participant or null
 */
export function findParticipant(participants, name) {
  if (!participants || !name) return null;

  const searchName = name.toLowerCase().trim();

  // Exact match
  const exactMatch = participants.find(
    p => p.full_name.toLowerCase() === searchName
  );
  if (exactMatch) return exactMatch;

  // Partial match
  const partialMatch = participants.find(
    p => p.full_name.toLowerCase().includes(searchName)
  );
  if (partialMatch) return partialMatch;

  return null;
}

/**
 * Validate if a team/player name exists
 * @param {Array} participants - List of participants
 * @param {string} name - Name to validate
 * @returns {boolean} - True if valid
 */
export function isValidParticipant(participants, name) {
  return findParticipant(participants, name) !== null;
}

/**
 * Get standardized name for a participant
 * @param {Array} participants - List of participants
 * @param {string} name - Name to standardize
 * @returns {string} - Standardized name or original if not found
 */
export function getStandardizedName(participants, name) {
  const participant = findParticipant(participants, name);
  return participant ? participant.full_name : name;
}

/**
 * Filter participants by search query
 * @param {Array} participants - List of participants
 * @param {string} query - Search query
 * @returns {Array} - Filtered participants
 */
export function searchParticipants(participants, query) {
  if (!query || !participants) return participants;

  const searchQuery = query.toLowerCase().trim();

  return participants.filter(p =>
    p.full_name.toLowerCase().includes(searchQuery)
  );
}
