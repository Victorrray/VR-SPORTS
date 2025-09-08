// Intent persistence system for pricing flow
const PRICING_INTENT_KEY = 'pricingIntent';
const INTENT_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes

export function savePricingIntent(intent, returnTo = '/app') {
  const data = {
    intent,
    returnTo,
    timestamp: Date.now()
  };
  
  try {
    localStorage.setItem(PRICING_INTENT_KEY, JSON.stringify(data));
    console.log('💾 Saved pricing intent:', data);
  } catch (error) {
    console.error('Failed to save pricing intent:', error);
  }
}

export function getPricingIntent() {
  try {
    const stored = localStorage.getItem(PRICING_INTENT_KEY);
    if (!stored) return null;
    
    const data = JSON.parse(stored);
    
    // Check if expired
    if (Date.now() - data.timestamp > INTENT_EXPIRY_MS) {
      clearPricingIntent();
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Failed to get pricing intent:', error);
    clearPricingIntent();
    return null;
  }
}

export function clearPricingIntent() {
  try {
    localStorage.removeItem(PRICING_INTENT_KEY);
    console.log('🗑️ Cleared pricing intent');
  } catch (error) {
    console.error('Failed to clear pricing intent:', error);
  }
}

export function debugPricingIntent() {
  const intent = getPricingIntent();
  console.log('🔍 Current pricing intent:', intent);
  return intent;
}
