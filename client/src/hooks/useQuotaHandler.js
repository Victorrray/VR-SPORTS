import { useState, useCallback } from 'react';

export const useQuotaHandler = () => {
  const [quotaExceeded, setQuotaExceeded] = useState(false);
  const [quotaError, setQuotaError] = useState(null);

  const handleApiResponse = useCallback(async (response) => {
    if (response.status === 403) {
      try {
        const errorData = await response.json();
        if (errorData.error === 'quota_exceeded') {
          setQuotaExceeded(true);
          setQuotaError(errorData);
          return { quotaExceeded: true, error: errorData };
        }
      } catch (e) {
        // If we can't parse the error, still treat 403 as quota exceeded
        setQuotaExceeded(true);
        setQuotaError({
          error: 'quota_exceeded',
          message: 'Monthly API limit exceeded. Upgrade to Platinum for unlimited access.',
          calls_made: null,
          limit: 1000
        });
        return { quotaExceeded: true, error: null };
      }
    }
    
    // Reset quota state on successful requests
    if (response.ok) {
      setQuotaExceeded(false);
      setQuotaError(null);
    }
    
    return { quotaExceeded: false, error: null };
  }, []);

  const resetQuotaState = useCallback(() => {
    setQuotaExceeded(false);
    setQuotaError(null);
  }, []);

  return {
    quotaExceeded,
    quotaError,
    handleApiResponse,
    resetQuotaState
  };
};
