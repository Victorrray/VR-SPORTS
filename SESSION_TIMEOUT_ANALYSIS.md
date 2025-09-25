# Session Timeout Analysis

## Current Session Timeout Configuration

After analyzing the codebase, I've confirmed that the user session timeout is indeed set to 35 minutes. This is defined in the `/Users/victorray/Desktop/vr-odds/client/src/hooks/useAuth.js` file:

```javascript
// Validate session every 35 minutes for optimal UX with minimal server load
const SESSION_VALIDATION_INTERVAL = 35 * 60 * 1000; // 35 minutes
const SESSION_GRACE_PERIOD = 5 * 60 * 1000; // 5 minute grace period for network issues
```

## How the Session Timeout Works

The session timeout mechanism works as follows:

1. **Session Validation Interval**: The system validates the user's session every 35 minutes.
   ```javascript
   validationIntervalRef.current = setInterval(() => {
     validateSession();
   }, SESSION_VALIDATION_INTERVAL);
   ```

2. **Grace Period**: There's an additional 5-minute grace period for network issues.
   ```javascript
   const SESSION_GRACE_PERIOD = 5 * 60 * 1000; // 5 minute grace period for network issues
   ```

3. **Validation Process**: When validation occurs, the system checks with the backend (Supabase) to ensure the session is still valid.

4. **Failure Handling**: If validation fails, the system has mechanisms to handle different types of failures:
   ```javascript
   // Handle different types of errors differently
   const isNetworkError = error.message?.includes('network') || error.message?.includes('fetch');
   const isAuthError = error.message?.includes('invalid') || error.message?.includes('expired');
   
   // Immediate sign out for auth-related errors (invalid/expired tokens)
   if (isAuthError) {
     clearSessionState();
     throw error;
   }
   
   // More lenient handling for network errors
   if (isNetworkError && validationFailuresRef.current < 5) {
     if (sessionRef.current) {
       lastValidationRef.current = now;
       return sessionRef.current;
     }
   }
   ```

5. **User Activity Reset**: The system also resets validation failures when user activity is detected:
   ```javascript
   // Reset validation failures when user actively uses the app
   const resetValidationFailures = useCallback(() => {
     validationFailuresRef.current = 0;
   }, []);
   ```

## Confirmation

The session timeout is definitely set to 35 minutes, with an additional 5-minute grace period for network issues. This means:

- The system will check if the session is still valid every 35 minutes
- If there are network issues, it will extend the session for up to 5 more minutes
- Active user interaction with the app will reset validation failure counters
- After 3 consecutive validation failures, the user will be signed out

This configuration provides a good balance between security (regular validation) and user experience (not signing users out unnecessarily due to temporary network issues).
