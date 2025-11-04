# What Gets Cleared vs What's Preserved

## ✅ User Preferences - PRESERVED (NOT Cleared)

### Bankroll
- **Storage**: `localStorage.userBankroll`
- **Manager**: `bankrollManager.js`
- **Status**: ✅ **PRESERVED** - Never cleared
- **Why**: User's bankroll is a critical preference that should persist across sessions

### Selected Sportsbooks
- **Storage**: `localStorage.userSelectedSportsbooks`
- **Storage**: `optimizedStorage.userSelectedSportsbooks`
- **Storage**: `optimizedStorage.userSelectedSportsbooks_props`
- **Status**: ✅ **PRESERVED** - Never cleared
- **Why**: User's sportsbook preferences should persist across sessions

### Other User Preferences
- `vr-odds-sports` - Selected sports
- `vr-odds-date` - Selected date
- `vr-odds-books` - Selected books
- `vr-odds-markets` - Selected markets
- **Status**: ✅ **PRESERVED** - Never cleared

---

## ❌ Plan Cache - CLEARED

### What Gets Cleared
- `userPlan` - Cached plan object
- `me` - Cached user data
- `plan` - Cached plan string
- `planData` - Cached plan data

### When It Gets Cleared
1. ✅ On sign up
2. ✅ On sign in
3. ✅ On payment success
4. ✅ On app load
5. ✅ When returning to tab
6. ✅ On manual refresh

### Why It Gets Cleared
- Plan data changes when user upgrades
- Need fresh data from API after payment
- Ensures user sees correct plan status

---

## Storage Breakdown

### localStorage Keys

| Key | Type | Cleared? | Reason |
|-----|------|----------|--------|
| `userBankroll` | User Preference | ❌ NO | Persists across sessions |
| `userSelectedSportsbooks` | User Preference | ❌ NO | User's book selection |
| `userPlan` | Plan Cache | ✅ YES | Changes on upgrade |
| `me` | Plan Cache | ✅ YES | Changes on upgrade |
| `plan` | Plan Cache | ✅ YES | Changes on upgrade |
| `vr-odds-sports` | User Preference | ❌ NO | Selected sports |
| `vr-odds-date` | User Preference | ❌ NO | Selected date |
| `vr-odds-books` | User Preference | ❌ NO | Selected books |
| `vr-odds-markets` | User Preference | ❌ NO | Selected markets |
| `pricingIntent` | Temp | ✅ YES | Temporary redirect data |

---

## User Journey: Bankroll & Books Preserved

### Scenario: User with $1000 Bankroll and Selected Books

**Before Upgrade**
```
localStorage.userBankroll = 1000
localStorage.userSelectedSportsbooks = ["draftkings", "fanduel", "betmgm"]
```

**User Upgrades to Platinum**
```
1. Clicks "Upgrade to Platinum"
2. Completes Stripe payment
3. BillingSuccess page loads
4. Cache cleared:
   - ✅ userPlan removed
   - ✅ me removed
   - ✅ plan removed
   - ❌ userBankroll PRESERVED
   - ❌ userSelectedSportsbooks PRESERVED
5. Plan refreshed from API
6. User sees platinum badge
```

**After Upgrade**
```
localStorage.userBankroll = 1000 ✅ STILL THERE
localStorage.userSelectedSportsbooks = ["draftkings", "fanduel", "betmgm"] ✅ STILL THERE
localStorage.userPlan = [cleared]
localStorage.me = [cleared]
localStorage.plan = [cleared]
```

---

## Code Examples

### What Gets Cleared
```javascript
// These are removed
localStorage.removeItem('userPlan');
localStorage.removeItem('me');
localStorage.removeItem('plan');
```

### What's Preserved
```javascript
// These are NOT removed
// localStorage.removeItem('userBankroll');  // ❌ NOT CLEARED
// localStorage.removeItem('userSelectedSportsbooks');  // ❌ NOT CLEARED
// localStorage.removeItem('vr-odds-sports');  // ❌ NOT CLEARED
// localStorage.removeItem('vr-odds-date');  // ❌ NOT CLEARED
// localStorage.removeItem('vr-odds-books');  // ❌ NOT CLEARED
// localStorage.removeItem('vr-odds-markets');  // ❌ NOT CLEARED
```

---

## Console Logs Show What's Preserved

When cache is cleared, you'll see:
```
✅ Cleared plan cache before sign in (preserved bankroll & sportsbooks)
✅ Plan cache cleared after successful payment (preserved bankroll & sportsbooks)
🧹 Clearing plan cache (preserving bankroll & sportsbooks)...
```

---

## Supabase Storage

### Bankroll & Sportsbooks Storage Options

**Option 1: localStorage** (Current)
- Fast, no server calls
- Persists across sessions
- Lost if user clears all data

**Option 2: Supabase** (Future Enhancement)
- Synced across devices
- Never lost
- Requires server calls
- Better for multi-device users

### Current Implementation
- Bankroll: `localStorage.userBankroll` + `optimizedStorage`
- Sportsbooks: `localStorage.userSelectedSportsbooks` + `optimizedStorage`
- Both stored locally for speed

### Future Enhancement
Could move to Supabase for:
- Cross-device sync
- Backup/recovery
- Better reliability

---

## Testing

### Test: Verify Bankroll is Preserved

```javascript
// Before upgrade
console.log(localStorage.getItem('userBankroll'));  // 1000

// User upgrades to platinum
// Cache cleared...

// After upgrade
console.log(localStorage.getItem('userBankroll'));  // 1000 ✅ STILL THERE
```

### Test: Verify Sportsbooks are Preserved

```javascript
// Before upgrade
console.log(localStorage.getItem('userSelectedSportsbooks'));
// ["draftkings", "fanduel", "betmgm"]

// User upgrades to platinum
// Cache cleared...

// After upgrade
console.log(localStorage.getItem('userSelectedSportsbooks'));
// ["draftkings", "fanduel", "betmgm"] ✅ STILL THERE
```

---

## Summary

| Data | Storage | Cleared? | Reason |
|------|---------|----------|--------|
| **Bankroll** | localStorage | ❌ NO | User preference |
| **Sportsbooks** | localStorage | ❌ NO | User preference |
| **Sports/Date/Books/Markets** | localStorage | ❌ NO | User preferences |
| **Plan Cache** | localStorage | ✅ YES | Changes on upgrade |
| **User Data Cache** | localStorage | ✅ YES | Changes on upgrade |

**Result**: User's bankroll and sportsbook selections are always preserved. Only plan-related cache is cleared to ensure fresh data after upgrades.
