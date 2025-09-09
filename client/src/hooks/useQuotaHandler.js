import { useState, useCallback } from 'react';

export const useQuotaHandler = () => {
  const [quotaExceeded, setQuotaExceeded] = useState(false);
  const [quotaError, setQuotaError] = useState(null);

  const handleApiResponse = useCallback(async (response) => {
    if (response.status === 402) {
      try {
        const errorData = await response.json();
        if (errorData.code === 'QUOTA_EXCEEDED') {
          setQuotaExceeded(true);
          setQuotaError(errorData);
          // Trigger global plangate modal
          window.dispatchEvent(new CustomEvent("plangate", { detail: errorData }));
          return { quotaExceeded: true, error: errorData };
        }
      } catch (e) {
        // If we can't parse the error, still treat 402 as quota exceeded
        const fallbackError = {
          error: 'QUOTA_EXCEEDED',
          code: 'QUOTA_EXCEEDED',
          message: 'You\'ve reached the free 1,000 request limit. Upgrade to continue.',
          used: 1000,
          quota: 1000
        };
        setQuotaExceeded(true);
        setQuotaError(fallbackError);
        window.dispatchEvent(new CustomEvent("plangate", { detail: fallbackError }));
        return { quotaExceeded: true, error: fallbackError };
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
