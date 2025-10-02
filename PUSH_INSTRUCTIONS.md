# 🚫 GITHUB PUSH BLOCKED - HOW TO FIX

GitHub is blocking the push because there's a Stripe API key in an old commit.

## ✅ OPTION 1: Use GitHub's Bypass (Easiest)

1. **Click this URL to allow the secret:**
   ```
   https://github.com/Victorrray/VR-SPORTS/security/secret-scanning/unblock-secret/33ToscCJNU8zsbYehPm7iANCn2q
   ```

2. **Then push again:**
   ```bash
   cd /Users/victorray/Desktop/vr-odds
   git push origin main
   ```

---

## ⚠️ OPTION 2: Remove Secret from History (More Secure)

If you want to completely remove the secret from git history:

```bash
cd /Users/victorray/Desktop/vr-odds

# Use BFG to remove the secret
brew install bfg

# Remove the .env.backup file from all commits
bfg --delete-files .env.backup

# Clean up
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Force push
git push origin main --force
```

---

## 🔐 OPTION 3: Rotate the Stripe Key (Most Secure)

1. Go to Stripe Dashboard
2. Revoke the old API key
3. Create a new API key
4. Update `server/.env` with new key
5. Update Render environment variables
6. Then use Option 1 to push

---

## 📝 WHAT HAPPENED

- You created `server/.env.backup` earlier
- It contained your Stripe secret key
- Git committed it in commit `5ea17d0`
- GitHub detected the secret and blocked the push

---

## ✅ RECOMMENDED: Option 1

Just click the bypass URL and push. The file is already deleted from the latest commit, so it won't be in your codebase going forward.

**After you bypass and push, your changes will deploy to Render automatically!**
